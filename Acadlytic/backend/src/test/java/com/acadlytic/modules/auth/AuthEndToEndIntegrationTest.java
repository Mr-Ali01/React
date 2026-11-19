package com.acadlytic.modules.auth;

import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.security.AcadlyticUserPrincipal;
import com.acadlytic.security.SessionConstants;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(OutputCaptureExtension.class)
class AuthEndToEndIntegrationTest extends AbstractMySqlIntegrationTest {

    private static final String SUPER_ADMIN_PASS = "SuperAdminSecretPass!2026";
    private static final String COLLEGE_ADMIN_PASS = "CollegeAdminSecretPass!2026";

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
    private AuditEventRepository auditEventRepository;
    @Autowired
    private OutboxEmailRepository outboxEmailRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private FindByIndexNameSessionRepository<? extends Session> sessionRepository;

    @BeforeEach
    void cleanState() {
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION_ATTRIBUTES");
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION");
        outboxEmailRepository.deleteAll();
        authTokenRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();
        collegeRepository.deleteAll();
    }

    @Test
    void csrfProtectionEnforcedOnLoginAndLogoutWith403CsrfTokenInvalid() throws Exception {
        createUser("owner@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);

        // Missing CSRF token on login -> 403 CSRF_TOKEN_INVALID
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "owner@acadlytic.com", "password", SUPER_ADMIN_PASS))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_TOKEN_INVALID"));

        // Bootstrap CSRF token via GET /api/v1/auth/csrf -> 204 + XSRF-TOKEN cookie
        Cookie xsrfCookie = fetchCsrfCookie();
        assertThat(xsrfCookie).isNotNull();
        assertThat(xsrfCookie.getValue()).isNotBlank();

        // Valid CSRF login succeeds
        SessionCookies loggedIn = login("owner@acadlytic.com", SUPER_ADMIN_PASS);

        // Logout without X-XSRF-TOKEN fails with 403 CSRF_TOKEN_INVALID
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(loggedIn.sessionCookie(), loggedIn.xsrfCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_TOKEN_INVALID"));
    }

    @Test
    void statefulSpringSessionPersistenceCookieAttributesAndMultiDeviceLogout(CapturedOutput output) throws Exception {
        User superAdmin = createUser("owner@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);

        // Login from two separate devices (multi-device allowed per ADR-01)
        SessionCookies deviceA = login("owner@acadlytic.com", SUPER_ADMIN_PASS);
        SessionCookies deviceB = login("owner@acadlytic.com", SUPER_ADMIN_PASS);

        assertThat(deviceA.sessionCookie().getName()).isEqualTo("ACADLYTIC_SID");
        assertThat(deviceA.sessionCookie().isHttpOnly()).isTrue();
        assertThat(deviceA.sessionCookie().getPath()).isEqualTo("/");
        assertThat(deviceA.sessionCookie().getMaxAge()).isEqualTo(-1);
        assertThat(deviceA.sessionCookie().getValue()).isNotEqualTo(deviceB.sessionCookie().getValue());

        // Verify Spring Session JDBC persisted both sessions under stable principal key
        Integer sessionCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM SPRING_SESSION WHERE PRINCIPAL_NAME = ?",
                Integer.class,
                AcadlyticUserPrincipal.principalKey(superAdmin.getId()));
        assertThat(sessionCount).isEqualTo(2);

        // GET /api/v1/auth/me works on device A
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(deviceA.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("owner@acadlytic.com"))
                .andExpect(jsonPath("$.data.role").value("SUPER_ADMIN"))
                .andExpect(jsonPath("$.data.managementUnlocked").value(true));

        // Logout device A revokes ONLY device A (ADR-05); device B remains valid
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(deviceA.sessionCookie(), deviceA.xsrfCookie())
                        .header("X-XSRF-TOKEN", deviceA.xsrfCookie().getValue()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/auth/me").cookie(deviceA.sessionCookie()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/auth/me").cookie(deviceB.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("owner@acadlytic.com"));

        // Verify sensitive secrets never appear in application logs
        assertThat(output.getAll()).doesNotContain(SUPER_ADMIN_PASS);
        assertThat(output.getAll()).doesNotContain(superAdmin.getPasswordHash());
        assertThat(output.getAll()).doesNotContain(deviceA.sessionCookie().getValue());
    }

    @Test
    void absolute12HourSessionLifetimeInvalidatesExpiredSession() throws Exception {
        User superAdmin = createUser("owner@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);
        SessionCookies cookies = login("owner@acadlytic.com", SUPER_ADMIN_PASS);

        // Backdate ACADLYTIC_SESSION_CREATED_AT to 13 hours ago in Spring Session JDBC
        String principalKey = AcadlyticUserPrincipal.principalKey(superAdmin.getId());
        Map<String, ? extends Session> sessions = sessionRepository.findByPrincipalName(principalKey);
        assertThat(sessions).hasSize(1);
        Session session = sessions.values().iterator().next();
        session.setAttribute(SessionConstants.SESSION_CREATED_AT, Instant.now().minus(Duration.ofHours(13)));
        @SuppressWarnings("unchecked")
        FindByIndexNameSessionRepository<Session> rawRepo = (FindByIndexNameSessionRepository<Session>) sessionRepository;
        rawRepo.save(session);

        mockMvc.perform(get("/api/v1/auth/me").cookie(cookies.sessionCookie()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("SESSION_EXPIRED"));
    }

    @Test
    void fiveFailedLoginsTrigger15MinuteLockoutAndAuditEvent() throws Exception {
        createUser("owner@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);
        Cookie xsrf = fetchCsrfCookie();

        for (int i = 1; i <= 4; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .cookie(xsrf)
                            .header("X-XSRF-TOKEN", xsrf.getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("email", "owner@acadlytic.com", "password", "WrongPassword123!"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.errorCode").value("AUTH_INVALID_CREDENTIALS"));
        }

        // 5th consecutive failure triggers 429 AUTH_ACCOUNT_LOCKED
        mockMvc.perform(post("/api/v1/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "owner@acadlytic.com", "password", "WrongPassword123!"))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.errorCode").value("AUTH_ACCOUNT_LOCKED"));

        // Even correct password is rejected while locked
        mockMvc.perform(post("/api/v1/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "owner@acadlytic.com", "password", SUPER_ADMIN_PASS))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.errorCode").value("AUTH_ACCOUNT_LOCKED"));

        List<AuditEvent> lockedEvents = auditEventRepository.findByEventTypeOrderByCreatedAtDesc(AuditEventType.ACCOUNT_LOCKED);
        assertThat(lockedEvents).hasSize(1);
    }

    @Test
    void changePasswordRevokesOtherSessionsAndRotatesCurrentSession() throws Exception {
        createUser("owner@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);
        SessionCookies sessionA = login("owner@acadlytic.com", SUPER_ADMIN_PASS);
        SessionCookies sessionB = login("owner@acadlytic.com", SUPER_ADMIN_PASS);

        String newPassword = "RotatedSuperAdminPass!2026";
        MvcResult changeResult = mockMvc.perform(post("/api/v1/auth/change-password")
                        .cookie(sessionA.sessionCookie(), sessionA.xsrfCookie())
                        .header("X-XSRF-TOKEN", sessionA.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "currentPassword", SUPER_ADMIN_PASS,
                                "newPassword", newPassword))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie rotatedSessionCookie = changeResult.getResponse().getCookie("ACADLYTIC_SID");
        assertThat(rotatedSessionCookie).isNotNull();
        assertThat(rotatedSessionCookie.getValue()).isNotEqualTo(sessionA.sessionCookie().getValue());

        // Rotated session A still works
        mockMvc.perform(get("/api/v1/auth/me").cookie(rotatedSessionCookie))
                .andExpect(status().isOk());

        // Session B was revoked server-side (ADR-05)
        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionB.sessionCookie()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotAndResetPasswordUsesSingleUseTokenRevokesAllSessionsAndDoesNotLeakSecrets(CapturedOutput output) throws Exception {
        createUser("owner@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);
        SessionCookies activeSession = login("owner@acadlytic.com", SUPER_ADMIN_PASS);
        Cookie xsrf = fetchCsrfCookie();

        // Non-existing email still returns generic 200 OK (no enumeration)
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "nobody@nowhere.edu"))))
                .andExpect(status().isOk());
        assertThat(outboxEmailRepository.findAll()).isEmpty();

        // Existing email returns same 200 OK and enqueues outbox email
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "owner@acadlytic.com"))))
                .andExpect(status().isOk());

        List<OutboxEmail> outbox = outboxEmailRepository.findByRecipientEmailOrderByIdDesc("owner@acadlytic.com");
        assertThat(outbox).hasSize(1);
        Map<String, Object> payload = objectMapper.readValue(outbox.get(0).getPayloadJson(), new TypeReference<>() {});
        String rawResetToken = String.valueOf(payload.get("token"));
        assertThat(rawResetToken).isNotBlank();

        // Raw token must NOT be stored plaintext in auth_tokens
        assertThat(authTokenRepository.findAll())
                .hasSize(1)
                .allSatisfy(t -> assertThat(t.getTokenHash()).isNotEqualTo(rawResetToken));

        String resetPassword = "ResetSuperAdminPass!2026";
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", rawResetToken, "newPassword", resetPassword))))
                .andExpect(status().isOk());

        // Active session must be revoked (ADR-05)
        mockMvc.perform(get("/api/v1/auth/me").cookie(activeSession.sessionCookie()))
                .andExpect(status().isUnauthorized());

        // Single-use token replay must be rejected
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", rawResetToken, "newPassword", "AnotherStrongPass!2026"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_OR_EXPIRED_TOKEN"));

        // New password works for fresh login
        SessionCookies fresh = login("owner@acadlytic.com", resetPassword);
        assertThat(fresh.sessionCookie()).isNotNull();

        // Neither raw token nor new password appears in logs
        assertThat(output.getAll()).doesNotContain(rawResetToken);
        assertThat(output.getAll()).doesNotContain(resetPassword);
    }

    @Test
    void emailChangeKeepsOldEmailValidUntilVerifiedThenSwapsAtomicallyAndRevokesOtherSessions() throws Exception {
        createUser("old@college.edu", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);
        SessionCookies sessionA = login("old@college.edu", SUPER_ADMIN_PASS);
        SessionCookies sessionB = login("old@college.edu", SUPER_ADMIN_PASS);

        mockMvc.perform(post("/api/v1/auth/change-email")
                        .cookie(sessionA.sessionCookie(), sessionA.xsrfCookie())
                        .header("X-XSRF-TOKEN", sessionA.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "currentPassword", SUPER_ADMIN_PASS,
                                "newEmail", "new@college.edu"))))
                .andExpect(status().isOk());

        // Two outbox emails queued: verification to new email + security alert to old email (ADR-14)
        List<OutboxEmail> newEmailOutbox = outboxEmailRepository.findByRecipientEmailOrderByIdDesc("new@college.edu");
        List<OutboxEmail> alertOutbox = outboxEmailRepository.findByRecipientEmailOrderByIdDesc("old@college.edu");
        assertThat(newEmailOutbox).hasSize(1);
        assertThat(alertOutbox).hasSize(1);

        // Old email still authenticates before confirmation
        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionA.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("old@college.edu"))
                .andExpect(jsonPath("$.data.pendingEmail").value("new@college.edu"));

        Map<String, Object> payload = objectMapper.readValue(newEmailOutbox.get(0).getPayloadJson(), new TypeReference<>() {});
        String rawChangeToken = String.valueOf(payload.get("token"));

        MvcResult verifyResult = mockMvc.perform(post("/api/v1/auth/verify-email-change")
                        .cookie(sessionA.sessionCookie(), sessionA.xsrfCookie())
                        .header("X-XSRF-TOKEN", sessionA.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", rawChangeToken))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie rotatedCookie = verifyResult.getResponse().getCookie("ACADLYTIC_SID");
        assertThat(rotatedCookie).isNotNull();

        // Current rotated session sees new email; session B revoked
        mockMvc.perform(get("/api/v1/auth/me").cookie(rotatedCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("new@college.edu"))
                .andExpect(jsonPath("$.data.pendingEmail").doesNotExist());

        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionB.sessionCookie()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void roleTenantIsolationApprovalStateObservationAndSuspendedCollegeBlocking() throws Exception {
        College collegeA = createCollege("College A", "COLA", CollegeApprovalStatus.PENDING, CollegeStatus.PENDING_VERIFICATION);
        College collegeB = createCollege("College B", "COLB", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        createUser("adminA@cola.edu", Role.COLLEGE_ADMIN, collegeA.getId(), UserStatus.ACTIVE, COLLEGE_ADMIN_PASS, true);
        createUser("owner@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);

        SessionCookies adminASession = login("adminA@cola.edu", COLLEGE_ADMIN_PASS);

        // 1. COLLEGE_ADMIN cannot access SUPER_ADMIN endpoint -> 403
        mockMvc.perform(get("/api/v1/test-probe/super-admin").cookie(adminASession.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));

        // 2. While PENDING, /auth/me reports managementUnlocked=false and management API returns 403 COLLEGE_NOT_APPROVED
        mockMvc.perform(get("/api/v1/auth/me").cookie(adminASession.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.collegeApprovalStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.managementUnlocked").value(false));

        mockMvc.perform(get("/api/v1/test-probe/colleges/" + collegeA.getId() + "/management")
                        .cookie(adminASession.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("COLLEGE_NOT_APPROVED"));

        // 3. Simulate SUPER_ADMIN approval -> existing session IMMEDIATELY observes managementUnlocked=true
        collegeA = collegeRepository.findById(collegeA.getId()).orElseThrow();
        collegeA.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        collegeA.setStatus(CollegeStatus.ACTIVE);
        collegeA = collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/auth/me").cookie(adminASession.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.collegeApprovalStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.collegeStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data.managementUnlocked").value(true));

        // Own approved college management endpoint now succeeds
        mockMvc.perform(get("/api/v1/test-probe/colleges/" + collegeA.getId() + "/management")
                        .cookie(adminASession.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value("COLA"));

        // 4. Cross-tenant access to College B is strictly denied (403 ACCESS_DENIED)
        mockMvc.perform(get("/api/v1/test-probe/colleges/" + collegeB.getId() + "/management")
                        .cookie(adminASession.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));

        // 5. Suspending College A immediately invalidates live session AND blocks fresh login (ADR-10)
        collegeA = collegeRepository.findById(collegeA.getId()).orElseThrow();
        collegeA.setStatus(CollegeStatus.SUSPENDED);
        collegeA = collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/auth/me").cookie(adminASession.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("COLLEGE_SUSPENDED"));

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "adminA@cola.edu", "password", COLLEGE_ADMIN_PASS))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("COLLEGE_SUSPENDED"));

        // 6. SUPER_ADMIN accesses platform endpoint cleanly
        SessionCookies superAdminSession = login("owner@acadlytic.com", SUPER_ADMIN_PASS);
        mockMvc.perform(get("/api/v1/test-probe/super-admin").cookie(superAdminSession.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scope").value("SUPER_ADMIN"));
    }

    private Cookie fetchCsrfCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isNoContent())
                .andReturn();
        return result.getResponse().getCookie("XSRF-TOKEN");
    }

    private SessionCookies login(String email, String password) throws Exception {
        Cookie xsrf = fetchCsrfCookie();
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie("ACADLYTIC_SID");
        Cookie updatedXsrf = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(sessionCookie).isNotNull();
        return new SessionCookies(sessionCookie, updatedXsrf != null ? updatedXsrf : xsrf);
    }

    private College createCollege(String name, String code, CollegeApprovalStatus approvalStatus, CollegeStatus status) {
        College college = new College();
        college.setName(name);
        college.setCode(code);
        college.setApprovalStatus(approvalStatus);
        college.setStatus(status);
        return collegeRepository.saveAndFlush(college);
    }

    private User createUser(
            String email,
            Role role,
            Long collegeId,
            UserStatus status,
            String rawPassword,
            boolean verified) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setCollegeId(collegeId);
        user.setStatus(status);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        if (verified) {
            user.setEmailVerifiedAt(Instant.now());
        }
        return userRepository.saveAndFlush(user);
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private record SessionCookies(Cookie sessionCookie, Cookie xsrfCookie) {
    }
}
