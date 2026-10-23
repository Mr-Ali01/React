package com.resultpoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.modules.auth.dto.*;
import com.resultpoint.modules.auth.entity.PasswordResetToken;
import com.resultpoint.modules.auth.entity.UserRefreshToken;
import com.resultpoint.modules.auth.repository.PasswordResetTokenRepository;
import com.resultpoint.modules.auth.repository.UserRefreshTokenRepository;
import com.resultpoint.modules.auth.service.AuthService;
import com.resultpoint.modules.user.entity.User;
import com.resultpoint.modules.user.entity.UserRole;
import com.resultpoint.modules.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private AuthService authService;

    private static final String TEST_EMAIL = "auth_test_student@resultpoint.edu";
    private static final String TEST_PASSWORD = "Password123!";

    @BeforeEach
    @org.springframework.transaction.annotation.Transactional
    void cleanUpUser() {
        userRepository.findByEmail(TEST_EMAIL).ifPresent(user -> {
            passwordResetTokenRepository.invalidateAllActiveByUserId(user.getId());
            refreshTokenRepository.revokeAllActiveByUserId(user.getId(), Instant.now(), "CLEANUP");
            userRepository.delete(user);
        });
    }

    @AfterEach
    @org.springframework.transaction.annotation.Transactional
    void tearDown() {
        userRepository.findByEmail(TEST_EMAIL).ifPresent(user -> {
            passwordResetTokenRepository.invalidateAllActiveByUserId(user.getId());
            refreshTokenRepository.revokeAllActiveByUserId(user.getId(), Instant.now(), "CLEANUP");
            userRepository.delete(user);
        });
    }

    // =========================================================================
    // 1. Registration Tests
    // =========================================================================

    @Test
    @Order(1)
    void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .phone("+919876543210")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andExpect(jsonPath("$.data.user.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.data.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.user.id").isString());

        User savedUser = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        Assertions.assertTrue(savedUser.getId().startsWith("usr_"), "User ID must be prefixed with 'usr_'");
        Assertions.assertEquals(UserRole.STUDENT, savedUser.getRole(), "Default role must be STUDENT");
        Assertions.assertNotEquals(TEST_PASSWORD, savedUser.getPasswordHash(), "Password must be hashed with BCrypt");
    }

    @Test
    @Order(2)
    void testDuplicateRegistrationRejected() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .build();

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_REGISTERED"));
    }

    @Test
    @Order(3)
    void testRegistrationValidationFailure() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("not-an-email")
                .password("short")
                .fullName("")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details").isArray());
    }

    // =========================================================================
    // 2. Login & Credential Verification Tests
    // =========================================================================

    @Test
    @Order(4)
    void testSuccessfulLogin() throws Exception {
        // Register first
        authService.register(RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .build(), "127.0.0.1", "TestDevice");

        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .deviceInfo("Browser Chrome 120")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andExpect(jsonPath("$.data.user.email").value(TEST_EMAIL));
    }

    @Test
    @Order(5)
    void testInvalidCredentialsReturn401() throws Exception {
        LoginRequest wrongPassword = LoginRequest.builder()
                .email("nonexistent@resultpoint.edu")
                .password("WrongPassword999!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPassword)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.error.message").value("Invalid email or password."));
    }

    // =========================================================================
    // 3. FIFO 3-Session Eviction Limit Tests
    // =========================================================================

    @Test
    @Order(6)
    void testFifoSessionLimitEvictionOnFourthLogin() throws Exception {
        authService.register(RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .build(), "127.0.0.1", "Device 1");

        // User currently has 1 active session from registration.
        // Perform 2 more logins -> reaches 3 active sessions
        authService.login(LoginRequest.builder().email(TEST_EMAIL).password(TEST_PASSWORD).deviceInfo("Device 2").build(), "127.0.0.1");
        authService.login(LoginRequest.builder().email(TEST_EMAIL).password(TEST_PASSWORD).deviceInfo("Device 3").build(), "127.0.0.1");

        User user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        List<UserRefreshToken> sessionsBefore = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), Instant.now());
        Assertions.assertEquals(3, sessionsBefore.size(), "User must have exactly 3 active sessions");
        Long oldestSessionId = sessionsBefore.get(0).getId();

        // 4th Login -> triggers FIFO eviction of the oldest active session
        authService.login(LoginRequest.builder().email(TEST_EMAIL).password(TEST_PASSWORD).deviceInfo("Device 4").build(), "127.0.0.1");

        List<UserRefreshToken> sessionsAfter = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), Instant.now());
        Assertions.assertEquals(3, sessionsAfter.size(), "User must strictly maintain at most 3 active sessions");

        UserRefreshToken evictedSession = refreshTokenRepository.findById(oldestSessionId).orElseThrow();
        Assertions.assertTrue(evictedSession.isRevoked(), "Oldest session must be revoked");
        Assertions.assertEquals("SESSION_LIMIT_EXCEEDED", evictedSession.getRevocationReason());
    }

    // =========================================================================
    // 4. Refresh Token Rotation, 30s Grace Period & Theft Detection Tests
    // =========================================================================

    @Test
    @Order(7)
    void testRefreshTokenRotationAnd30sGracePeriod() throws Exception {
        AuthResponse initialAuth = authService.register(RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .build(), "127.0.0.1", "Device Chrome");

        String initialRefreshToken = initialAuth.getRefreshToken();

        // 1. First refresh exchange -> succeeds and rotates
        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder()
                .refreshToken(initialRefreshToken)
                .build();

        MvcResult firstRefreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andReturn();

        AuthResponse rotatedResponse = objectMapper.readValue(
                objectMapper.readTree(firstRefreshResult.getResponse().getContentAsString()).get("data").toString(),
                AuthResponse.class
        );

        String newlyRotatedRefreshToken = rotatedResponse.getRefreshToken();
        Assertions.assertNotEquals(initialRefreshToken, newlyRotatedRefreshToken, "Rotated token must be different from initial token");

        // 2. Concurrent Replay within 30-Second Grace Window -> must return identical cached rotation response
        MvcResult concurrentReplayResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        AuthResponse replayedResponse = objectMapper.readValue(
                objectMapper.readTree(concurrentReplayResult.getResponse().getContentAsString()).get("data").toString(),
                AuthResponse.class
        );

        Assertions.assertEquals(rotatedResponse.getAccessToken(), replayedResponse.getAccessToken(),
                "Grace period replay must return the identical cached access token");
        Assertions.assertEquals(rotatedResponse.getRefreshToken(), replayedResponse.getRefreshToken(),
                "Grace period replay must return the identical cached refresh token");

        // 3. Replay after 30-Second Window -> TOKEN THEFT DETECTED -> Revokes all sessions
        // Artificially age the old token's revoked_at timestamp by 35 seconds
        String oldTokenHash = authService.hashToken(initialRefreshToken);
        UserRefreshToken oldToken = refreshTokenRepository.findByTokenHash(oldTokenHash).orElseThrow();
        oldToken.setRevokedAt(Instant.now().minus(35, ChronoUnit.SECONDS));
        refreshTokenRepository.save(oldToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("TOKEN_THEFT_DETECTED"));

        // Verify all active sessions were revoked
        User user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        List<UserRefreshToken> activeAfterTheft = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), Instant.now());
        Assertions.assertEquals(0, activeAfterTheft.size(), "Token theft must revoke all user sessions");
    }

    // =========================================================================
    // 5. Logout & Logout-All Tests
    // =========================================================================

    @Test
    @Order(8)
    void testLogoutAndLogoutAll() throws Exception {
        AuthResponse auth = authService.register(RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .build(), "127.0.0.1", "Device 1");

        // Logout specific session
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + auth.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(RefreshTokenRequest.builder().refreshToken(auth.getRefreshToken()).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        String tokenHash = authService.hashToken(auth.getRefreshToken());
        UserRefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash).orElseThrow();
        Assertions.assertTrue(token.isRevoked());
        Assertions.assertEquals("LOGOUT", token.getRevocationReason());

        // Login again and test logout-all
        AuthResponse secondAuth = authService.login(LoginRequest.builder().email(TEST_EMAIL).password(TEST_PASSWORD).build(), "127.0.0.1");

        mockMvc.perform(post("/api/v1/auth/logout-all")
                        .header("Authorization", "Bearer " + secondAuth.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        List<UserRefreshToken> activeSessions = refreshTokenRepository
                .findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), Instant.now());
        Assertions.assertEquals(0, activeSessions.size(), "Logout-all must revoke every session for user");
    }

    // =========================================================================
    // 6. Password Reset Lifecycle Tests
    // =========================================================================

    @Test
    @Order(9)
    void testPasswordResetFlow() throws Exception {
        authService.register(RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .build(), "127.0.0.1", "Device 1");

        // 1. Forgot password request (Enumeration safe)
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ForgotPasswordRequest.builder().email(TEST_EMAIL).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value("If an account with that email exists, password reset instructions have been sent."));

        // Forgot password for non-existent email returns identical message
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ForgotPasswordRequest.builder().email("nobody@resultpoint.edu").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value("If an account with that email exists, password reset instructions have been sent."));

        // 2. Query stored reset token directly from database
        User user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
        PasswordResetToken userResetToken = tokens.stream()
                .filter(t -> t.getUser().getId().equals(user.getId()) && !t.isUsed())
                .findFirst()
                .orElseThrow();
        assertNotNull(userResetToken);

        // 3. Reset password using invalid token -> returns 400
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .token("invalid-token")
                                .newPassword("NewPassword456!")
                                .build())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_RESET_TOKEN"));

        // 4. Simulate a valid reset token: create a known raw token, hash it and store
        String rawTestToken = "test_raw_reset_token_1234567890abcdef";
        String hashedRawToken = authService.hashToken(rawTestToken);
        PasswordResetToken testResetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hashedRawToken)
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .isUsed(false)
                .createdAt(Instant.now())
                .build();
        passwordResetTokenRepository.save(testResetToken);

        // 5. Reset password with valid token
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .token(rawTestToken)
                                .newPassword("NewPassword456!")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 6. Token reuse -> rejected
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .token(rawTestToken)
                                .newPassword("AnotherPassword789!")
                                .build())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_RESET_TOKEN"));

        // 7. Verify login works with new password and fails with old password
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequest.builder().email(TEST_EMAIL).password(TEST_PASSWORD).build())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequest.builder().email(TEST_EMAIL).password("NewPassword456!").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // 7. Current User Profile (/me) Tests
    // =========================================================================

    @Test
    @Order(10)
    void testCurrentUserEndpointRequiresAuthentication() throws Exception {
        // Without Bearer token -> 401
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));

        // With valid token -> 200
        AuthResponse auth = authService.register(RegisterRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .fullName("Test Student")
                .build(), "127.0.0.1", "Device 1");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + auth.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.data.role").value("STUDENT"));
    }
}
