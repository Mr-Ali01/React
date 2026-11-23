package com.acadlytic.modules.auth;

import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuthToken;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.UserRateLimiter;
import com.acadlytic.modules.colleges.dto.RegisterCollegeRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EmailVerificationIntegrationTest extends AbstractMySqlIntegrationTest {

    private static final String ADMIN_PASSWORD = "StrongPassword@2026!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CollegeRepository collegeRepository;
    @Autowired
    private AuthTokenRepository authTokenRepository;
    @Autowired
    private OutboxEmailRepository outboxEmailRepository;
    @Autowired
    private AuditEventRepository auditEventRepository;
    @Autowired
    private UserRateLimiter userRateLimiter;
    @Autowired
    private IpRateLimiter ipRateLimiter;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @SpyBean
    private OutboxEmailService outboxEmailService;

    @BeforeEach
    void cleanState() {
        SecurityContextHolder.clearContext();
        userRateLimiter.clear();
        ipRateLimiter.clear();
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION_ATTRIBUTES");
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION");
        jdbcTemplate.execute("UPDATE colleges SET current_registration_id = NULL");
        jdbcTemplate.execute("DELETE FROM college_registration_documents");
        jdbcTemplate.execute("DELETE FROM college_registrations");
        jdbcTemplate.execute("DELETE FROM outbox_emails");
        jdbcTemplate.execute("DELETE FROM auth_tokens");
        jdbcTemplate.execute("DELETE FROM audit_events");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM colleges");
    }

    @AfterEach
    void tearDown() {
        reset(outboxEmailService);
        cleanState();
    }

    private Cookie fetchCsrfCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isNoContent())
                .andReturn();
        return result.getResponse().getCookie("XSRF-TOKEN");
    }

    private String registerCollegeAndGetToken(String code, String email) throws Exception {
        Cookie xsrf = fetchCsrfCookie();
        RegisterCollegeRequest req = new RegisterCollegeRequest(
                "Horizon Institute of Science",
                code,
                "State Technological University",
                "450 University Avenue",
                "Suite 100",
                "Boston",
                "Massachusetts",
                "United States",
                "02115",
                "https://horizon.edu",
                "+1-617-555-0144",
                "Eleanor",
                "Vane",
                email,
                ADMIN_PASSWORD
        );

        mockMvc.perform(post("/api/v1/college-registrations")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        List<OutboxEmail> emails = outboxEmailRepository.findAll();
        assertThat(emails).isNotEmpty();
        OutboxEmail latestEmail = emails.get(emails.size() - 1);
        Map<String, Object> payload = objectMapper.readValue(latestEmail.getPayloadJson(), new TypeReference<>() {});
        return (String) payload.get("token");
    }

    private SessionCookies login(String email, String password) throws Exception {
        Cookie xsrf = fetchCsrfCookie();
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie("ACADLYTIC_SID");
        Cookie updatedXsrf = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(sessionCookie).isNotNull();
        return new SessionCookies(sessionCookie, updatedXsrf != null ? updatedXsrf : xsrf);
    }

    @Test
    @DisplayName("End-to-end: Registration -> Email verification -> users.email_verified_at set -> /auth/me reflects emailVerified: true")
    void registrationFollowedBySuccessfulEmailVerification() throws Exception {
        String rawToken = registerCollegeAndGetToken("VERIFY-1", "admin1@horizon.edu");
        assertThat(rawToken).isNotBlank();

        User userBefore = userRepository.findByEmailAndEmailReleasedFalse("admin1@horizon.edu").orElseThrow();
        assertThat(userBefore.getEmailVerifiedAt()).isNull();

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("admin1@horizon.edu"))
                .andExpect(jsonPath("$.data.emailVerified").value(true))
                .andExpect(jsonPath("$.data.verifiedAt").isNotEmpty());

        // Verify Database state
        User userAfter = userRepository.findByEmailAndEmailReleasedFalse("admin1@horizon.edu").orElseThrow();
        assertThat(userAfter.getEmailVerifiedAt()).isNotNull();

        List<AuthToken> tokens = authTokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getUsedAt()).isNotNull();

        // Verify Audit Event
        List<AuditEvent> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).anyMatch(e -> e.getEventType() == AuditEventType.EMAIL_VERIFIED);

        // Verify GET /api/v1/auth/me reflects emailVerified: true
        SessionCookies session = login("admin1@horizon.edu", ADMIN_PASSWORD);
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(session.sessionCookie())
                        .cookie(session.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailVerified").value(true));
    }

    @Test
    @DisplayName("Email verification does NOT approve college: college remains PENDING / PENDING_VERIFICATION and management APIs remain 403")
    void emailVerificationDoesNotApproveCollege() throws Exception {
        String rawToken = registerCollegeAndGetToken("VERIFY-2", "admin2@horizon.edu");

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isOk());

        College college = collegeRepository.findByCode("VERIFY-2").orElseThrow();
        assertThat(college.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(college.getStatus()).isEqualTo(CollegeStatus.PENDING_VERIFICATION);

        // Login as college admin and probe academic management endpoint
        SessionCookies session = login("admin2@horizon.edu", ADMIN_PASSWORD);
        mockMvc.perform(get("/api/v1/test-probe/colleges/" + college.getId() + "/management")
                        .cookie(session.sessionCookie())
                        .cookie(session.xsrfCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("COLLEGE_NOT_APPROVED"));
    }

    @Test
    @DisplayName("Single-use constraint: Reusing a consumed token fails with 400 INVALID_OR_EXPIRED_TOKEN")
    void reusingConsumedTokenFails() throws Exception {
        String rawToken = registerCollegeAndGetToken("VERIFY-3", "admin3@horizon.edu");
        Cookie xsrf = fetchCsrfCookie();

        // 1st consumption succeeds
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isOk());

        // 2nd consumption with same token fails
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_OR_EXPIRED_TOKEN"));
    }

    @Test
    @DisplayName("Expired token fails with 400 INVALID_OR_EXPIRED_TOKEN")
    void expiredTokenFails() throws Exception {
        String rawToken = registerCollegeAndGetToken("VERIFY-4", "admin4@horizon.edu");

        // Manually expire token in database
        jdbcTemplate.update("UPDATE auth_tokens SET expires_at = ? WHERE target_email = ?",
                Instant.now().minus(2, ChronoUnit.HOURS), "admin4@horizon.edu");

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_OR_EXPIRED_TOKEN"));

        // User remains unverified
        User user = userRepository.findByEmailAndEmailReleasedFalse("admin4@horizon.edu").orElseThrow();
        assertThat(user.getEmailVerifiedAt()).isNull();
    }

    @Test
    @DisplayName("Resend invalidates previous token: older token fails, new token succeeds")
    void resendRevokesPreviousToken() throws Exception {
        String oldToken = registerCollegeAndGetToken("VERIFY-5", "admin5@horizon.edu");

        // Login as college admin to request resend
        SessionCookies session = login("admin5@horizon.edu", ADMIN_PASSWORD);

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .cookie(session.sessionCookie())
                        .cookie(session.xsrfCookie())
                        .header("X-XSRF-TOKEN", session.xsrfCookie().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify outbox has 2 emails; extract newest token
        List<OutboxEmail> emails = outboxEmailRepository.findAll();
        assertThat(emails).hasSize(2);
        Map<String, Object> payload = objectMapper.readValue(emails.get(1).getPayloadJson(), new TypeReference<>() {});
        String newToken = (String) payload.get("token");

        Cookie xsrf = fetchCsrfCookie();

        // Older token is now revoked -> fails with 400
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", oldToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_OR_EXPIRED_TOKEN"));

        // New token succeeds -> 200 OK
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", newToken))))
                .andExpect(status().isOk());

        User user = userRepository.findByEmailAndEmailReleasedFalse("admin5@horizon.edu").orElseThrow();
        assertThat(user.getEmailVerifiedAt()).isNotNull();

        // Verify audit event EMAIL_VERIFICATION_RESENT exists
        List<AuditEvent> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).anyMatch(e -> e.getEventType() == AuditEventType.EMAIL_VERIFICATION_RESENT);
    }

    @Test
    @DisplayName("Concurrency: Simultaneous redemption of identical token yields exactly 1 success and 1 failure")
    void concurrentRedemptionProducesExactlyOneSuccess() throws Exception {
        String rawToken = registerCollegeAndGetToken("VERIFY-6", "admin6@horizon.edu");
        Cookie xsrf = fetchCsrfCookie();

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        List<Integer> statusCodes = Collections.synchronizedList(new ArrayList<>());

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            futures.add(CompletableFuture.runAsync(() -> {
                try {
                    MvcResult res = mockMvc.perform(post("/api/v1/auth/verify-email")
                                    .cookie(xsrf)
                                    .header("X-XSRF-TOKEN", xsrf.getValue())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                            .andReturn();
                    statusCodes.add(res.getResponse().getStatus());
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }, executor));
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();

        assertThat(statusCodes).containsExactlyInAnyOrder(200, 400);

        // Verify only 1 used token in database
        List<AuthToken> tokens = authTokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getUsedAt()).isNotNull();

        // Exactly 1 EMAIL_VERIFIED audit event
        List<AuditEvent> auditEvents = auditEventRepository.findAll();
        long verifyCount = auditEvents.stream().filter(e -> e.getEventType() == AuditEventType.EMAIL_VERIFIED).count();
        assertThat(verifyCount).isEqualTo(1);
    }

    @Test
    @DisplayName("Target email mismatch failure does NOT consume token and leaves used_at NULL")
    void targetEmailMismatchDoesNotConsumeToken() throws Exception {
        String rawToken = registerCollegeAndGetToken("VERIFY-7", "admin7@horizon.edu");

        // Tamper target_email in database
        jdbcTemplate.update("UPDATE auth_tokens SET target_email = 'mismatch@other.edu' WHERE target_email = 'admin7@horizon.edu'");

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_OR_EXPIRED_TOKEN"));

        // Token used_at remains NULL
        List<AuthToken> tokens = authTokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getUsedAt()).isNull();

        User user = userRepository.findByEmailAndEmailReleasedFalse("admin7@horizon.edu").orElseThrow();
        assertThat(user.getEmailVerifiedAt()).isNull();
    }

    @Test
    @DisplayName("Inactive user failure does NOT consume token and leaves used_at NULL")
    void inactiveUserDoesNotConsumeToken() throws Exception {
        String rawToken = registerCollegeAndGetToken("VERIFY-8", "admin8@horizon.edu");

        // Deactivate user in database
        jdbcTemplate.update("UPDATE users SET status = 'INACTIVE' WHERE email = 'admin8@horizon.edu'");

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("AUTH_ACCOUNT_INACTIVE"));

        // Token used_at remains NULL
        List<AuthToken> tokens = authTokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getUsedAt()).isNull();
    }

    @Test
    @DisplayName("Resend rate limiting: 3 requests succeed; 4th is blocked with 429 and Retry-After header")
    void resendRateLimitingEnforcesMaxThreeRequestsPerUser() throws Exception {
        registerCollegeAndGetToken("VERIFY-9", "admin9@horizon.edu");
        SessionCookies session = login("admin9@horizon.edu", ADMIN_PASSWORD);

        // Requests 1, 2, 3 succeed
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/resend-verification")
                            .cookie(session.sessionCookie())
                            .cookie(session.xsrfCookie())
                            .header("X-XSRF-TOKEN", session.xsrfCookie().getValue()))
                    .andExpect(status().isOk());
        }

        // Request 4 fails with 429 Too Many Requests
        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .cookie(session.sessionCookie())
                        .cookie(session.xsrfCookie())
                        .header("X-XSRF-TOKEN", session.xsrfCookie().getValue()))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.errorCode").value("RATE_LIMIT_EXCEEDED"));
    }

    @Test
    @DisplayName("CSRF protection: missing CSRF token returns 403 CSRF_TOKEN_INVALID on both endpoints")
    void csrfProtectionEnforcedOnBothEndpoints() throws Exception {
        registerCollegeAndGetToken("VERIFY-10", "admin10@horizon.edu");

        // 1. POST /api/v1/auth/verify-email without CSRF
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", "dummy-token-sample"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_TOKEN_INVALID"));

        // 2. POST /api/v1/auth/resend-verification without CSRF
        SessionCookies session = login("admin10@horizon.edu", ADMIN_PASSWORD);
        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .cookie(session.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_TOKEN_INVALID"));
    }

    @Test
    @DisplayName("Outbox failure rolls back resend transaction: prior token remains active, new token not persisted, no audit event committed")
    void outboxFailureRollsBackResendTransaction() throws Exception {
        // Step 1: Register college and acquire initial token
        String initialRawToken = registerCollegeAndGetToken("VERIFY-ROLLBACK", "admin-rollback@horizon.edu");

        // Condition 1: Prior token was active
        List<AuthToken> tokensBefore = authTokenRepository.findAll();
        assertThat(tokensBefore).hasSize(1);
        AuthToken priorToken = tokensBefore.get(0);
        assertThat(priorToken.getRevokedAt()).isNull();
        assertThat(priorToken.getUsedAt()).isNull();
        assertThat(priorToken.getExpiresAt()).isAfter(Instant.now());
        Long priorTokenId = priorToken.getId();

        // Record outbox email baseline before resend request
        List<OutboxEmail> outboxBefore = outboxEmailRepository.findAll();
        int outboxCountBefore = outboxBefore.size();
        assertThat(outboxCountBefore).isEqualTo(1);
        OutboxEmail initialEmail = outboxBefore.get(0);
        assertThat(initialEmail.getRecipientEmail()).isEqualTo("admin-rollback@horizon.edu");
        assertThat(initialEmail.getEventType()).isEqualTo("EMAIL_VERIFICATION");

        SessionCookies session = login("admin-rollback@horizon.edu", ADMIN_PASSWORD);

        // Condition 4: Outbox enqueue fails
        doThrow(new RuntimeException("Simulated Outbox Enqueue Failure"))
                .when(outboxEmailService)
                .enqueue(eq("EMAIL_VERIFICATION"), eq("admin-rollback@horizon.edu"), any(), eq("EMAIL_VERIFICATION"), anyMap());

        try {
            // Act: Attempt resend verification which fails at outbox enqueue
            mockMvc.perform(post("/api/v1/auth/resend-verification")
                            .cookie(session.sessionCookie())
                            .cookie(session.xsrfCookie())
                            .header("X-XSRF-TOKEN", session.xsrfCookie().getValue()))
                    .andExpect(status().isInternalServerError());

            // 1. The outbox email record count remains unchanged
            List<OutboxEmail> outboxAfter = outboxEmailRepository.findAll();
            assertThat(outboxAfter)
                    .as("1. Outbox email record count must remain unchanged after transaction rollback")
                    .hasSize(outboxCountBefore);

            // 2. No new EMAIL_VERIFICATION resend job was committed
            assertThat(outboxAfter)
                    .as("2. No new EMAIL_VERIFICATION resend job was committed")
                    .hasSize(1)
                    .allMatch(email -> email.getId().equals(initialEmail.getId()));

            // 3. The original verification token remains active
            AuthToken tokenAfterRollback = authTokenRepository.findById(priorTokenId).orElseThrow();
            assertThat(tokenAfterRollback.getRevokedAt())
                    .as("3. Original verification token revoked_at must remain NULL (active)")
                    .isNull();
            assertThat(tokenAfterRollback.getUsedAt())
                    .as("3. Original verification token used_at must remain NULL")
                    .isNull();
            assertThat(tokenAfterRollback.getExpiresAt())
                    .as("3. Original verification token must not be expired")
                    .isAfter(Instant.now());

            // 4. No replacement token remains persisted
            List<AuthToken> tokensAfter = authTokenRepository.findAll();
            assertThat(tokensAfter)
                    .as("4. No replacement token remains persisted; exactly 1 token exists in database")
                    .hasSize(1);
            assertThat(tokensAfter.get(0).getId())
                    .as("4. Persisted token must be the original verification token")
                    .isEqualTo(priorTokenId);

            // 5. No EMAIL_VERIFICATION_RESENT audit event was committed
            List<AuditEvent> auditEvents = auditEventRepository.findAll();
            assertThat(auditEvents)
                    .as("5. No EMAIL_VERIFICATION_RESENT audit event must be committed to database")
                    .noneMatch(e -> e.getEventType() == AuditEventType.EMAIL_VERIFICATION_RESENT);

            // Additional verification: Prior token remains fully operational and can still verify the user
            Cookie xsrf = fetchCsrfCookie();
            mockMvc.perform(post("/api/v1/auth/verify-email")
                            .cookie(xsrf)
                            .header("X-XSRF-TOKEN", xsrf.getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("token", initialRawToken))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.emailVerified").value(true));

            User verifiedUser = userRepository.findByEmailAndEmailReleasedFalse("admin-rollback@horizon.edu").orElseThrow();
            assertThat(verifiedUser.getEmailVerifiedAt()).isNotNull();
        } finally {
            reset(outboxEmailService);
        }
    }

    private record SessionCookies(Cookie sessionCookie, Cookie xsrfCookie) {
    }
}
