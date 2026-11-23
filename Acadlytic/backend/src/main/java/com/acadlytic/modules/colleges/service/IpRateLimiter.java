package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.RateLimitExceededException;
import com.acadlytic.config.RateLimitProperties;
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
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Thread-safe sliding-window IP rate limiter for public college registration.
 *
 * Security:
 * - Does not blindly trust X-Forwarded-For.
 * - Only evaluates forwarded headers if request.getRemoteAddr() matches configured trusted proxies.
 * - Inspects X-Forwarded-For right-to-left to safely extract the client IP.
 * - Enforces max attempts per rolling window (default 5 attempts / 3600s).
 * - Periodically evicts stale IP records to prevent unbounded memory growth.
 * - Supports an injectable java.time.Clock for deterministic unit testing.
 */
@Component
public class IpRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(IpRateLimiter.class);

    private final Clock clock;
    private final int maxAttempts;
    private final long windowSeconds;
    private final Set<String> trustedProxies;
    private final ConcurrentHashMap<String, Deque<Instant>> ipAttempts = new ConcurrentHashMap<>();

    @Autowired
    public IpRateLimiter(RateLimitProperties properties) {
        this(properties, Clock.systemUTC());
    }

    public IpRateLimiter(RateLimitProperties properties, Clock clock) {
        this.clock = clock;
        this.maxAttempts = properties.getMaxAttempts();
        this.windowSeconds = properties.getWindowSeconds();
        this.trustedProxies = properties.getTrustedProxies() != null
                ? properties.getTrustedProxies().stream()
                .map(this::normalizeIp)
                .collect(Collectors.toUnmodifiableSet())
                : Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "::1");
    }

    public IpRateLimiter(int maxAttempts, long windowSeconds, List<String> trustedProxies, Clock clock) {
        this.clock = clock;
        this.maxAttempts = maxAttempts;
        this.windowSeconds = windowSeconds;
        this.trustedProxies = trustedProxies != null
                ? trustedProxies.stream()
                .map(this::normalizeIp)
                .collect(Collectors.toUnmodifiableSet())
                : Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "::1");
    }

    /**
     * Checks whether the request violates the registration rate limit.
     * Records the current attempt if allowed, or throws RateLimitExceededException if exceeded.
     *
     * @param request the incoming HTTP request
     * @throws RateLimitExceededException if 6th or later attempt occurs within the rolling window
     */
    public void checkRateLimit(HttpServletRequest request) {
        String clientIp = resolveClientIp(request);
        checkRateLimit(clientIp);
    }

    /**
     * Checks and records an attempt for the given resolved IP address.
     *
     * @param clientIp the normalized client IP address
     * @throws RateLimitExceededException if rate limit is exceeded
     */
    public void checkRateLimit(String clientIp) {
        Instant now = clock.instant();
        Instant windowStart = now.minusSeconds(windowSeconds);

        ipAttempts.compute(clientIp, (ip, deque) -> {
            if (deque == null) {
                deque = new ArrayDeque<>();
            }

            // Remove expired attempts outside the rolling window
            while (!deque.isEmpty() && deque.peekFirst().isBefore(windowStart)) {
                deque.pollFirst();
            }

            if (deque.size() >= maxAttempts) {
                Instant oldestAttempt = deque.peekFirst();
                long secondsUntilExpiry = Duration.between(windowStart, oldestAttempt).getSeconds();
                long retryAfter = Math.max(1, secondsUntilExpiry);

                log.warn("Rate limit exceeded for IP '{}'. Attempts in window: {}. Retry-After: {}s",
                        clientIp, deque.size(), retryAfter);

                throw new RateLimitExceededException(
                        "Too many registration requests from this IP address. Please try again later.",
                        retryAfter);
            }

            deque.addLast(now);
            return deque;
        });
    }

    /**
     * Securely resolves the client IP address from the request.
     * If the remote address is not a configured trusted proxy, X-Forwarded-For is completely ignored.
     */
    public String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        String remoteAddr = normalizeIp(request.getRemoteAddr());
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return "unknown";
        }

        // If the immediate remote address is NOT trusted, do NOT trust X-Forwarded-For
        if (!isTrustedProxy(remoteAddr)) {
            return remoteAddr;
        }

        // Remote address is trusted, so inspect X-Forwarded-For header
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor == null || xForwardedFor.isBlank()) {
            return remoteAddr;
        }

        String[] parts = xForwardedFor.split(",");
        List<String> ipChain = new ArrayList<>();
        for (String part : parts) {
            String ip = normalizeIp(part);
            if (ip != null && !ip.isBlank()) {
                ipChain.add(ip);
            }
        }

        if (ipChain.isEmpty()) {
            return remoteAddr;
        }

        // Walk right-to-left: the first untrusted IP from the right is the genuine client IP
        for (int i = ipChain.size() - 1; i >= 0; i--) {
            String ip = ipChain.get(i);
            if (!isTrustedProxy(ip)) {
                return ip;
            }
        }

        // If all IPs in the header are trusted proxies, fall back to the first IP
        return ipChain.get(0);
    }

    public boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        return trustedProxies.contains(normalizeIp(ip));
    }

    private String normalizeIp(String ip) {
        if (ip == null) {
            return null;
        }
        String trimmed = ip.trim();
        // Remove enclosing brackets for IPv6 if present
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }

    /**
     * Cleans up expired entries periodically to prevent memory leaks.
     * Runs every 10 minutes when scheduling is enabled.
     */
    @Scheduled(fixedDelay = 600000)
    public void cleanup() {
        Instant windowStart = clock.instant().minusSeconds(windowSeconds);
        ipAttempts.entrySet().removeIf(entry -> {
            Deque<Instant> deque = entry.getValue();
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst().isBefore(windowStart)) {
                    deque.pollFirst();
                }
                return deque.isEmpty();
            }
        });
    }

    public int getRecordedAttempts(String clientIp) {
        Deque<Instant> deque = ipAttempts.get(clientIp);
        if (deque == null) {
            return 0;
        }
        Instant windowStart = clock.instant().minusSeconds(windowSeconds);
        synchronized (deque) {
            return (int) deque.stream().filter(ts -> !ts.isBefore(windowStart)).count();
        }
    }

    public void clear() {
        ipAttempts.clear();
    }
}
