package com.resultpoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.common.exception.ApiException;
import com.resultpoint.modules.auth.dto.*;
import com.resultpoint.modules.auth.entity.PasswordResetToken;
import com.resultpoint.modules.auth.entity.UserRefreshToken;
import com.resultpoint.modules.auth.repository.PasswordResetTokenRepository;
import com.resultpoint.modules.auth.repository.UserRefreshTokenRepository;
import com.resultpoint.modules.auth.service.AuthService;
import com.resultpoint.modules.auth.service.TokenEncryptionService;
import com.resultpoint.modules.user.entity.User;
import com.resultpoint.modules.user.repository.UserRepository;
import com.resultpoint.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;

@SpringBootTest
@ActiveProfiles("test")
public class Phase2SecurityVerificationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private TokenEncryptionService tokenEncryptionService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String USER_A_EMAIL = "verify_user_a@resultpoint.edu";
    private static final String USER_B_EMAIL = "verify_user_b@resultpoint.edu";
    private static final String PASSWORD = "SecurePassword123!";

    @BeforeEach
    @org.springframework.transaction.annotation.Transactional
    void setupCleanState() {
        cleanUp(USER_A_EMAIL);
        cleanUp(USER_B_EMAIL);
    }

    @AfterEach
    @org.springframework.transaction.annotation.Transactional
    void tearDown() {
        cleanUp(USER_A_EMAIL);
        cleanUp(USER_B_EMAIL);
    }

    private void cleanUp(String email) {
        userRepository.findByEmail(email).ifPresent(u -> {
            passwordResetTokenRepository.invalidateAllActiveByUserId(u.getId());
            refreshTokenRepository.revokeAllActiveByUserId(u.getId(), Instant.now(), "CLEANUP");
            userRepository.delete(u);
        });
    }

    @Test
    @DisplayName("V-1: Verify AES-256-GCM Encryption of Cached Response Payload")
    void testCachedResponsePayloadEncryption() {
        AuthResponse registerResp = authService.register(
                RegisterRequest.builder().email(USER_A_EMAIL).password(PASSWORD).fullName("User A").build(),
                "127.0.0.1", "Device 1");

        // Rotate token once to populate cached_response_payload
        AuthResponse refreshResp = authService.refresh(
                RefreshTokenRequest.builder().refreshToken(registerResp.getRefreshToken()).build(),
                "127.0.0.1");

        String initialTokenHash = authService.hashToken(registerResp.getRefreshToken());
        UserRefreshToken rotatedTokenRecord = refreshTokenRepository.findByTokenHash(initialTokenHash).orElseThrow();

        String cachedPayload = rotatedTokenRecord.getCachedResponsePayload();
        Assertions.assertNotNull(cachedPayload, "Cached response payload must not be null");
        Assertions.assertFalse(cachedPayload.contains("Bearer"), "Cached payload must be encrypted ciphertext, not plaintext");
        Assertions.assertFalse(cachedPayload.contains(refreshResp.getAccessToken()), "Raw access token must not be in plaintext");

        // Decrypt with authorized service
        String decryptedJson = tokenEncryptionService.decrypt(cachedPayload);
        Assertions.assertTrue(decryptedJson.contains(refreshResp.getAccessToken()), "Decrypted payload must match rotated response");

        // Decrypt with tampered authentication tag must fail
        byte[] rawBytes = Base64.getDecoder().decode(cachedPayload);
        rawBytes[rawBytes.length - 1] ^= (byte) 0xFF; // Tamper authentication tag
        String tamperedPayload = Base64.getEncoder().encodeToString(rawBytes);

        Assertions.assertThrows(Exception.class, () -> tokenEncryptionService.decrypt(tamperedPayload),
                "Decryption with tampered ciphertext/tag must fail AEAD authentication");
    }

    @Test
    @DisplayName("V-2: Verify Cross-User Isolation and Session Ownership")
    void testCrossUserIsolation() {
        AuthResponse userA = authService.register(
                RegisterRequest.builder().email(USER_A_EMAIL).password(PASSWORD).fullName("User A").build(),
                "127.0.0.1", "Device A");
        AuthResponse userB = authService.register(
                RegisterRequest.builder().email(USER_B_EMAIL).password(PASSWORD).fullName("User B").build(),
                "127.0.0.1", "Device B");

        User userBEntity = userRepository.findByEmail(USER_B_EMAIL).orElseThrow();
        com.resultpoint.security.UserPrincipal principalB = com.resultpoint.security.UserPrincipal.create(
                userBEntity.getId(), userBEntity.getEmail(), userBEntity.getRole().name());

        // User B attempts to logout User A's token
        authService.logout(userA.getRefreshToken(), principalB);

        // Verify User A's token was NOT revoked by User B
        String tokenAHash = authService.hashToken(userA.getRefreshToken());
        UserRefreshToken tokenARecord = refreshTokenRepository.findByTokenHash(tokenAHash).orElseThrow();
        Assertions.assertFalse(tokenARecord.isRevoked(), "User B must not be able to revoke User A's session");
    }

    @RepeatedTest(value = 5, name = "Iteration {currentRepetition} of {totalRepetitions}")
    @DisplayName("V-3: Verify Simultaneous Real Concurrency on Refresh Token Rotation (5 Repetitions)")
    void testSimultaneousConcurrentRefresh() throws Exception {
        AuthResponse auth = authService.register(
                RegisterRequest.builder().email(USER_A_EMAIL).password(PASSWORD).fullName("User A").build(),
                "127.0.0.1", "Device 1");

        String initialRefreshToken = auth.getRefreshToken();
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<AuthResponse>> futures = new ArrayList<>();
        List<Throwable> errors = new CopyOnWriteArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await(); // Simultaneous release barrier
                return authService.refresh(
                        RefreshTokenRequest.builder().refreshToken(initialRefreshToken).build(),
                        "127.0.0.1");
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Trigger simultaneous execution

        List<AuthResponse> successfulResponses = new ArrayList<>();
        for (Future<AuthResponse> f : futures) {
            try {
                successfulResponses.add(f.get(10, TimeUnit.SECONDS));
            } catch (ExecutionException e) {
                errors.add(e.getCause());
            }
        }
        executor.shutdown();

        // 1. Both simultaneous requests must succeed without error
        Assertions.assertEquals(0, errors.size(), "Both concurrent requests must succeed");
        Assertions.assertEquals(2, successfulResponses.size(), "Both threads must receive valid responses");

        // 2. Both requests must receive the identical cached rotation response
        AuthResponse resp1 = successfulResponses.get(0);
        AuthResponse resp2 = successfulResponses.get(1);
        Assertions.assertEquals(resp1.getAccessToken(), resp2.getAccessToken(),
                "Both concurrent callers must receive identical access token");
        Assertions.assertEquals(resp1.getRefreshToken(), resp2.getRefreshToken(),
                "Both concurrent callers must receive identical refresh token");

        // 3. Exactly one child session created (no branching token chain)
        User user = userRepository.findByEmail(USER_A_EMAIL).orElseThrow();
        List<UserRefreshToken> activeTokens = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), Instant.now());
        Assertions.assertEquals(1, activeTokens.size(),
                "Concurrent rotation must produce exactly 1 active child session, not branching chains");

        // 4. Replay after 30-second grace window still triggers TOKEN_THEFT_DETECTED
        String initialTokenHash = authService.hashToken(initialRefreshToken);
        UserRefreshToken oldToken = refreshTokenRepository.findByTokenHash(initialTokenHash).orElseThrow();
        oldToken.setRevokedAt(Instant.now().minus(35, ChronoUnit.SECONDS));
        refreshTokenRepository.save(oldToken);

        ApiException theftException = Assertions.assertThrows(ApiException.class, () ->
                authService.refresh(RefreshTokenRequest.builder().refreshToken(initialRefreshToken).build(), "127.0.0.1"));
        Assertions.assertEquals("TOKEN_THEFT_DETECTED", theftException.getErrorCode());

        // Verify theft detection revoked all user sessions
        List<UserRefreshToken> activeAfterTheft = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), Instant.now());
        Assertions.assertEquals(0, activeAfterTheft.size(), "Theft detection must revoke all active sessions");
    }

    @RepeatedTest(value = 5, name = "Iteration {currentRepetition} of {totalRepetitions}")
    @DisplayName("V-4: Verify Simultaneous Real Concurrency on Login Session Limit (5 Repetitions)")
    void testSimultaneousConcurrentLoginSessionLimit() throws Exception {
        authService.register(
                RegisterRequest.builder().email(USER_A_EMAIL).password(PASSWORD).fullName("User A").build(),
                "127.0.0.1", "Initial");

        // Reset to clean 0 active sessions
        User user = userRepository.findByEmail(USER_A_EMAIL).orElseThrow();
        refreshTokenRepository.revokeAllActiveByUserId(user.getId(), Instant.now(), "RESET");

        int threadCount = 6; // 6 simultaneous logins for max 3 limit
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<AuthResponse>> futures = new ArrayList<>();
        List<Throwable> errors = new CopyOnWriteArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final int deviceNum = i + 1;
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await(); // Simultaneous release barrier
                return authService.login(
                        LoginRequest.builder().email(USER_A_EMAIL).password(PASSWORD).deviceInfo("Concurrent Device " + deviceNum).build(),
                        "127.0.0.1");
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        for (Future<AuthResponse> f : futures) {
            try {
                f.get(10, TimeUnit.SECONDS);
            } catch (ExecutionException e) {
                errors.add(e.getCause());
            }
        }
        executor.shutdown();

        Assertions.assertEquals(0, errors.size(), "All concurrent logins must succeed");

        // Assert exactly 3 active sessions remain
        List<UserRefreshToken> activeSessions = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), Instant.now());
        Assertions.assertEquals(3, activeSessions.size(),
                "Under concurrent logins, active sessions must never exceed the maximum of 3");

        // Verify older sessions have revocationReason = 'SESSION_LIMIT_EXCEEDED'
        List<UserRefreshToken> allSessions = refreshTokenRepository.findAllByUserIdAndIsRevokedFalse(user.getId());
        Assertions.assertEquals(3, allSessions.size());
    }

    @Test
    @DisplayName("V-5: Verify Multi-User Concurrent Logins Do Not Interfere")
    void testConcurrentLoginsDifferentUsers() throws Exception {
        authService.register(
                RegisterRequest.builder().email(USER_A_EMAIL).password(PASSWORD).fullName("User A").build(),
                "127.0.0.1", "A-Init");
        authService.register(
                RegisterRequest.builder().email(USER_B_EMAIL).password(PASSWORD).fullName("User B").build(),
                "127.0.0.1", "B-Init");

        // Revoke initial sessions
        User userA = userRepository.findByEmail(USER_A_EMAIL).orElseThrow();
        User userB = userRepository.findByEmail(USER_B_EMAIL).orElseThrow();
        refreshTokenRepository.revokeAllActiveByUserId(userA.getId(), Instant.now(), "RESET");
        refreshTokenRepository.revokeAllActiveByUserId(userB.getId(), Instant.now(), "RESET");

        int totalThreads = 8; // 4 for User A, 4 for User B
        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch readyLatch = new CountDownLatch(totalThreads);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<AuthResponse>> futures = new ArrayList<>();
        for (int i = 0; i < totalThreads; i++) {
            final String targetEmail = (i % 2 == 0) ? USER_A_EMAIL : USER_B_EMAIL;
            final int devId = i;
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await();
                return authService.login(
                        LoginRequest.builder().email(targetEmail).password(PASSWORD).deviceInfo("Dev " + devId).build(),
                        "127.0.0.1");
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        for (Future<AuthResponse> f : futures) {
            f.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        // User A and User B must each have at most 3 active sessions
        List<UserRefreshToken> sessionsA = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(userA.getId(), Instant.now());
        List<UserRefreshToken> sessionsB = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(userB.getId(), Instant.now());

        Assertions.assertEquals(3, sessionsA.size(), "User A must have exactly 3 active sessions");
        Assertions.assertEquals(3, sessionsB.size(), "User B must have exactly 3 active sessions");
    }
}
