package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.RateLimitExceededException;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding-window rate limiter for email verification resend requests.
 *
 * Implements a dual-layer rate limiting strategy:
 * 1. User-level quota: Max 3 requests per authenticated user within a 15-minute rolling window.
 * 2. IP-level quota: Max 5 requests per IP address within a 60-minute rolling window,
 *    stored in an independent bucket so as not to consume or modify the college-registration quota.
 *
 * Identity is derived strictly from the authenticated session context.
 *
 * Note on Multi-Instance Deployments:
 * This in-memory implementation provides low-latency, zero-dependency protection on single nodes.
 * In a multi-node clustered deployment, rate limiting state is node-local; distributed enforcement
 * via Redis or a DB-backed rate-limit table is deferred per architecture decisions (ADR-19).
 */
@Component
public class UserRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(UserRateLimiter.class);

    private static final int DEFAULT_USER_MAX_ATTEMPTS = 3;
    private static final long DEFAULT_USER_WINDOW_SECONDS = 900; // 15 minutes

    private static final int DEFAULT_IP_MAX_ATTEMPTS = 5;
    private static final long DEFAULT_IP_WINDOW_SECONDS = 3600; // 60 minutes

    private final Clock clock;
    private final IpRateLimiter ipRateLimiter;
    private final int userMaxAttempts;
    private final long userWindowSeconds;
    private final int ipMaxAttempts;
    private final long ipWindowSeconds;

    private final ConcurrentHashMap<Long, Deque<Instant>> userAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Deque<Instant>> ipAttempts = new ConcurrentHashMap<>();

    @Autowired
    public UserRateLimiter(IpRateLimiter ipRateLimiter) {
        this(ipRateLimiter, Clock.systemUTC(),
                DEFAULT_USER_MAX_ATTEMPTS, DEFAULT_USER_WINDOW_SECONDS,
                DEFAULT_IP_MAX_ATTEMPTS, DEFAULT_IP_WINDOW_SECONDS);
    }

    public UserRateLimiter(IpRateLimiter ipRateLimiter, Clock clock) {
        this(ipRateLimiter, clock,
                DEFAULT_USER_MAX_ATTEMPTS, DEFAULT_USER_WINDOW_SECONDS,
                DEFAULT_IP_MAX_ATTEMPTS, DEFAULT_IP_WINDOW_SECONDS);
    }

    public UserRateLimiter(
            IpRateLimiter ipRateLimiter,
            Clock clock,
            int userMaxAttempts,
            long userWindowSeconds,
            int ipMaxAttempts,
            long ipWindowSeconds) {
        this.ipRateLimiter = ipRateLimiter;
        this.clock = clock;
        this.userMaxAttempts = userMaxAttempts;
        this.userWindowSeconds = userWindowSeconds;
        this.ipMaxAttempts = ipMaxAttempts;
        this.ipWindowSeconds = ipWindowSeconds;
    }

    /**
     * Enforces both user-level and independent IP-level rate limits for resend requests.
     *
     * @param userId the authenticated user ID
     * @param request the incoming HTTP servlet request
     * @throws RateLimitExceededException if either user or IP limit is exceeded
     */
    public void checkResendRateLimit(Long userId, HttpServletRequest request) {
        String clientIp = ipRateLimiter != null && request != null
                ? ipRateLimiter.resolveClientIp(request)
                : "unknown";
        checkResendRateLimit(userId, clientIp);
    }

    /**
     * Enforces user and IP rate limits for a given userId and resolved client IP.
     *
     * @param userId the authenticated user ID
     * @param clientIp the normalized client IP address
     * @throws RateLimitExceededException if either user or IP limit is exceeded
     */
    public void checkResendRateLimit(Long userId, String clientIp) {
        Instant now = clock.instant();

        // 1. Check user-level quota (max 3 / 15m)
        checkUserLimit(userId, now);

        // 2. Check independent IP-level quota (max 5 / 60m)
        checkIpLimit(clientIp, now);
    }

    private void checkUserLimit(Long userId, Instant now) {
        if (userId == null) {
            return;
        }

        Instant windowStart = now.minusSeconds(userWindowSeconds);

        userAttempts.compute(userId, (id, deque) -> {
            if (deque == null) {
                deque = new ArrayDeque<>();
            }

            // Prune expired attempts
            while (!deque.isEmpty() && deque.peekFirst().isBefore(windowStart)) {
                deque.pollFirst();
            }

            if (deque.size() >= userMaxAttempts) {
                Instant oldestAttempt = deque.peekFirst();
                long secondsUntilExpiry = Duration.between(windowStart, oldestAttempt).getSeconds();
                long retryAfter = Math.max(1, secondsUntilExpiry);

                log.warn("Resend rate limit exceeded for user id '{}'. Attempts in window: {}. Retry-After: {}s",
                        userId, deque.size(), retryAfter);

                throw new RateLimitExceededException(
                        "Too many verification resend requests for this user. Please wait before trying again.",
                        retryAfter);
            }

            deque.addLast(now);
            return deque;
        });
    }

    private void checkIpLimit(String clientIp, Instant now) {
        if (clientIp == null || clientIp.isBlank() || "unknown".equalsIgnoreCase(clientIp)) {
            return;
        }

        Instant windowStart = now.minusSeconds(ipWindowSeconds);

        ipAttempts.compute(clientIp, (ip, deque) -> {
            if (deque == null) {
                deque = new ArrayDeque<>();
            }

            // Prune expired attempts
            while (!deque.isEmpty() && deque.peekFirst().isBefore(windowStart)) {
                deque.pollFirst();
            }

            if (deque.size() >= ipMaxAttempts) {
                Instant oldestAttempt = deque.peekFirst();
                long secondsUntilExpiry = Duration.between(windowStart, oldestAttempt).getSeconds();
                long retryAfter = Math.max(1, secondsUntilExpiry);

                log.warn("Resend rate limit exceeded for IP '{}'. Attempts in window: {}. Retry-After: {}s",
                        clientIp, deque.size(), retryAfter);

                throw new RateLimitExceededException(
                        "Too many verification resend requests from this IP address. Please try again later.",
                        retryAfter);
            }

            deque.addLast(now);
            return deque;
        });
    }

    /**
     * Periodic cleanup to prevent unbounded memory growth by evicting stale empty entries.
     */
    @Scheduled(fixedDelay = 600000) // Every 10 minutes
    public void evictStaleEntries() {
        Instant now = clock.instant();
        Instant userWindowStart = now.minusSeconds(userWindowSeconds);
        Instant ipWindowStart = now.minusSeconds(ipWindowSeconds);

        userAttempts.forEach((id, deque) -> {
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst().isBefore(userWindowStart)) {
                    deque.pollFirst();
                }
            }
            if (deque.isEmpty()) {
                userAttempts.remove(id, deque);
            }
        });

        ipAttempts.forEach((ip, deque) -> {
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst().isBefore(ipWindowStart)) {
                    deque.pollFirst();
                }
            }
            if (deque.isEmpty()) {
                ipAttempts.remove(ip, deque);
            }
        });
    }

    /**
     * Clears all tracking state. Intended strictly for test teardown/isolation.
     */
    public void clear() {
        userAttempts.clear();
        ipAttempts.clear();
    }
}
