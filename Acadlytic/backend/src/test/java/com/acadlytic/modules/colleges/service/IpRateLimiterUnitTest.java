package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IpRateLimiterUnitTest {

    private MutableClock clock;
    private IpRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-11-23T12:00:00Z"));
        // 5 max attempts, 3600 seconds window, trusted proxies: 127.0.0.1, ::1
        rateLimiter = new IpRateLimiter(5, 3600, List.of("127.0.0.1", "::1", "10.0.0.1"), clock);
    }

    @Test
    @DisplayName("Allows up to 5 registration attempts within 1 hour window")
    void allowsUpToMaxAttempts() {
        String clientIp = "192.168.1.100";

        for (int i = 1; i <= 5; i++) {
            rateLimiter.checkRateLimit(clientIp);
            assertThat(rateLimiter.getRecordedAttempts(clientIp)).isEqualTo(i);
        }
    }

    @Test
    @DisplayName("Rejects 6th attempt with HTTP 429 RateLimitExceededException and valid Retry-After")
    void rejectsSixthAttemptWithinWindow() {
        String clientIp = "192.168.1.101";

        for (int i = 1; i <= 5; i++) {
            rateLimiter.checkRateLimit(clientIp);
        }

        assertThatThrownBy(() -> rateLimiter.checkRateLimit(clientIp))
                .isInstanceOf(RateLimitExceededException.class)
                .satisfies(ex -> {
                    RateLimitExceededException rle = (RateLimitExceededException) ex;
                    assertThat(rle.getErrorCode()).isEqualTo("RATE_LIMIT_EXCEEDED");
                    assertThat(rle.getRetryAfterSeconds()).isGreaterThanOrEqualTo(1);
                    assertThat(rle.getRetryAfterSeconds()).isLessThanOrEqualTo(3600);
                });
    }

    @Test
    @DisplayName("Allows new attempts after sliding window expires")
    void allowsAttemptsAfterWindowExpiry() {
        String clientIp = "192.168.1.102";

        for (int i = 1; i <= 5; i++) {
            rateLimiter.checkRateLimit(clientIp);
        }

        // Advance clock past the 1-hour window (3601 seconds)
        clock.advance(Duration.ofSeconds(3601));

        // Should allow another attempt cleanly
        rateLimiter.checkRateLimit(clientIp);
        assertThat(rateLimiter.getRecordedAttempts(clientIp)).isEqualTo(1);
    }

    @Test
    @DisplayName("Maintains independent rate limit counters for distinct IP addresses")
    void maintainsIndependentCountersPerIp() {
        String ipA = "10.10.10.1";
        String ipB = "10.10.10.2";

        for (int i = 1; i <= 5; i++) {
            rateLimiter.checkRateLimit(ipA);
        }

        // ipA is exhausted
        assertThatThrownBy(() -> rateLimiter.checkRateLimit(ipA))
                .isInstanceOf(RateLimitExceededException.class);

        // ipB is independent and succeeds
        rateLimiter.checkRateLimit(ipB);
        assertThat(rateLimiter.getRecordedAttempts(ipB)).isEqualTo(1);
    }

    @Test
    @DisplayName("Safely handles concurrent attempts across threads without exceeding limit")
    void handlesConcurrentAttemptsSafely() throws InterruptedException {
        String clientIp = "192.168.1.200";
        int threadCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    rateLimiter.checkRateLimit(clientIp);
                    successCount.incrementAndGet();
                } catch (RateLimitExceededException ex) {
                    rejectedCount.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        finishLatch.await();
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(5);
        assertThat(rejectedCount.get()).isEqualTo(15);
    }

    @Test
    @DisplayName("Ignores X-Forwarded-For if remote address is not a trusted proxy")
    void ignoresForwardedHeadersFromUntrustedRemote() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.50"); // untrusted public IP
        request.addHeader("X-Forwarded-For", "198.51.100.1, 10.0.0.1");

        String resolvedIp = rateLimiter.resolveClientIp(request);
        assertThat(resolvedIp).isEqualTo("203.0.113.50");
    }

    @Test
    @DisplayName("Resolves genuine client IP from X-Forwarded-For when request comes through trusted proxy")
    void resolvesClientIpFromTrustedProxy() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1"); // trusted proxy
        request.addHeader("X-Forwarded-For", "203.0.113.19, 10.0.0.1"); // 10.0.0.1 is trusted proxy, 203.0.113.19 is client

        String resolvedIp = rateLimiter.resolveClientIp(request);
        assertThat(resolvedIp).isEqualTo("203.0.113.19");
    }

    @Test
    @DisplayName("Falls back to remote address if X-Forwarded-For contains only trusted proxies")
    void fallsBackIfAllProxiesTrusted() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "10.0.0.1, 127.0.0.1");

        String resolvedIp = rateLimiter.resolveClientIp(request);
        assertThat(resolvedIp).isEqualTo("10.0.0.1");
    }

    @Test
    @DisplayName("Periodic cleanup sweeps expired IPs")
    void cleanupRemovesExpiredEntries() {
        String clientIp = "192.168.1.55";
        rateLimiter.checkRateLimit(clientIp);
        assertThat(rateLimiter.getRecordedAttempts(clientIp)).isEqualTo(1);

        // Advance clock past rolling window
        clock.advance(Duration.ofSeconds(4000));

        rateLimiter.cleanup();
        assertThat(rateLimiter.getRecordedAttempts(clientIp)).isEqualTo(0);
    }

    private static class MutableClock extends Clock {
        private Instant currentInstant;
        private final ZoneId zone;

        MutableClock(Instant initialInstant) {
            this.currentInstant = initialInstant;
            this.zone = ZoneOffset.UTC;
        }

        public void advance(Duration duration) {
            this.currentInstant = this.currentInstant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(currentInstant);
        }

        @Override
        public Instant instant() {
            return currentInstant;
        }
    }
}
