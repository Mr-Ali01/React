package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.RateLimitExceededException;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class UserRateLimiterUnitTest {

    @Mock
    private IpRateLimiter ipRateLimiter;

    private MutableClock clock;
    private UserRateLimiter userRateLimiter;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-11-23T10:00:00Z"));
        // 3 user attempts per 900s (15 min), 5 IP attempts per 3600s (60 min)
        userRateLimiter = new UserRateLimiter(ipRateLimiter, clock, 3, 900, 5, 3600);
    }

    @Test
    @DisplayName("Allows up to 3 requests per user within 15-minute window; 4th attempt is rate-limited")
    void userRateLimitingEnforcesMaxThreeAttempts() {
        Long userId = 101L;
        String clientIp = "192.168.1.50";

        // Attempts 1, 2, 3 succeed
        assertThatCode(() -> userRateLimiter.checkResendRateLimit(userId, clientIp)).doesNotThrowAnyException();
        clock.advance(Duration.ofMinutes(2));
        assertThatCode(() -> userRateLimiter.checkResendRateLimit(userId, clientIp)).doesNotThrowAnyException();
        clock.advance(Duration.ofMinutes(2));
        assertThatCode(() -> userRateLimiter.checkResendRateLimit(userId, clientIp)).doesNotThrowAnyException();

        // Attempt 4 fails with 429
        assertThatThrownBy(() -> userRateLimiter.checkResendRateLimit(userId, clientIp))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("Too many verification resend requests for this user")
                .satisfies(ex -> {
                    RateLimitExceededException rle = (RateLimitExceededException) ex;
                    assertThat(rle.getRetryAfterSeconds()).isGreaterThan(0);
                });
    }

    @Test
    @DisplayName("Different users have independent rate limit buckets")
    void differentUsersHaveIndependentQuotas() {
        Long userA = 101L;
        Long userB = 102L;
        String clientIp = "192.168.1.50";

        // Exhaust userA
        userRateLimiter.checkResendRateLimit(userA, clientIp);
        userRateLimiter.checkResendRateLimit(userA, clientIp);
        userRateLimiter.checkResendRateLimit(userA, clientIp);
        assertThatThrownBy(() -> userRateLimiter.checkResendRateLimit(userA, clientIp))
                .isInstanceOf(RateLimitExceededException.class);

        // userB can still make requests
        assertThatCode(() -> userRateLimiter.checkResendRateLimit(userB, clientIp)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Allows new requests once the rolling window has advanced past the oldest attempt")
    void windowAdvancementAllowsSubsequentAttempts() {
        Long userId = 101L;
        String clientIp = "192.168.1.50";

        userRateLimiter.checkResendRateLimit(userId, clientIp); // t = 0m
        clock.advance(Duration.ofMinutes(5));
        userRateLimiter.checkResendRateLimit(userId, clientIp); // t = 5m
        clock.advance(Duration.ofMinutes(5));
        userRateLimiter.checkResendRateLimit(userId, clientIp); // t = 10m

        // Blocked at t = 10m
        assertThatThrownBy(() -> userRateLimiter.checkResendRateLimit(userId, clientIp))
                .isInstanceOf(RateLimitExceededException.class);

        // Advance clock past 15 min from first attempt (t = 16m)
        clock.advance(Duration.ofMinutes(6)); // now t = 16m; attempt 1 at t=0 has expired
        assertThatCode(() -> userRateLimiter.checkResendRateLimit(userId, clientIp)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Enforces independent IP rate limit (max 5 per 60 min)")
    void ipRateLimitingEnforcesMaxFiveAttempts() {
        String clientIp = "10.0.0.1";

        // 5 requests with different users from same IP
        for (long id = 1; id <= 5; id++) {
            final long uid = id;
            assertThatCode(() -> userRateLimiter.checkResendRateLimit(uid, clientIp)).doesNotThrowAnyException();
            clock.advance(Duration.ofMinutes(1));
        }

        // 6th request from same IP is blocked regardless of user
        assertThatThrownBy(() -> userRateLimiter.checkResendRateLimit(999L, clientIp))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("Too many verification resend requests from this IP address");
    }

    @Test
    @DisplayName("evictStaleEntries cleans up expired user and IP tracking data")
    void evictStaleEntriesRemovesExpiredData() {
        userRateLimiter.checkResendRateLimit(100L, "192.168.1.1");
        clock.advance(Duration.ofHours(2));

        assertThatCode(() -> userRateLimiter.evictStaleEntries()).doesNotThrowAnyException();
        // Since entries are evicted, user can immediately make full quota
        assertThatCode(() -> userRateLimiter.checkResendRateLimit(100L, "192.168.1.1")).doesNotThrowAnyException();
    }

    private static class MutableClock extends Clock {
        private Instant currentInstant;

        MutableClock(Instant initial) {
            this.currentInstant = initial;
        }

        void advance(Duration duration) {
            this.currentInstant = this.currentInstant.plus(duration);
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return currentInstant;
        }
    }
}
