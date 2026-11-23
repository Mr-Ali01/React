package com.acadlytic.modules.colleges;

import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.dto.RegisterCollegeRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CollegeRegistrationIntegrationTest extends AbstractMySqlIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private CollegeRepository collegeRepository;
    @Autowired
    private CollegeRegistrationRepository registrationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthTokenRepository authTokenRepository;
    @Autowired
    private OutboxEmailRepository outboxEmailRepository;
    @Autowired
    private AuditEventRepository auditEventRepository;
    @Autowired
    private IpRateLimiter ipRateLimiter;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanState() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
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
        cleanState();
    }

    private RegisterCollegeRequest createValidRequest(String code, String email) {
        return new RegisterCollegeRequest(
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
                "StrongP@ssword2026!"
        );
    }

    private Cookie fetchCsrfCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isNoContent())
                .andReturn();
        return result.getResponse().getCookie("XSRF-TOKEN");
    }

    @Test
    @DisplayName("Public registration succeeds end-to-end with CSRF protection: 201 Created and persisted entities")
    void successfulPublicRegistrationEndToEnd() throws Exception {
        Cookie xsrf = fetchCsrfCookie();
        assertThat(xsrf).isNotNull();

        RegisterCollegeRequest req = createValidRequest("HORIZON-TECH", "admin@horizon.edu");

        mockMvc.perform(post("/api/v1/college-registrations")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.collegeCode").value("HORIZON-TECH"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.versionNumber").value(1))
                .andExpect(jsonPath("$.data.submittedForReview").value(false))
                .andExpect(jsonPath("$.data.adminEmail").value("admin@horizon.edu"));

        // Verify College in DB
        College college = collegeRepository.findByCode("HORIZON-TECH").orElse(null);
        assertThat(college).isNotNull();
        assertThat(college.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(college.getStatus()).isEqualTo(CollegeStatus.PENDING_VERIFICATION);
        assertThat(college.getCurrentRegistrationId()).isNotNull();

        // Verify CollegeRegistration Revision 1
        CollegeRegistration reg = registrationRepository.findById(college.getCurrentRegistrationId()).orElse(null);
        assertThat(reg).isNotNull();
        assertThat(reg.getVersionNumber()).isEqualTo(1);
        assertThat(reg.getStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(reg.getLegalName()).isEqualTo("Horizon Institute of Science");
        assertThat(reg.getSubmittedForReviewAt()).isNull();

        // Verify College Admin User
        User adminUser = userRepository.findByEmailAndEmailReleasedFalse("admin@horizon.edu").orElse(null);
        assertThat(adminUser).isNotNull();
        assertThat(adminUser.getRole()).isEqualTo(Role.COLLEGE_ADMIN);
        assertThat(adminUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(adminUser.getEmailVerifiedAt()).isNull();

        // Verify 48h Email Verification Token
        long tokenCount = authTokenRepository.count();
        assertThat(tokenCount).isEqualTo(1);

        // Verify Outbox Email
        List<OutboxEmail> outboxEmails = outboxEmailRepository.findAll();
        assertThat(outboxEmails).hasSize(1);
        assertThat(outboxEmails.get(0).getTemplateKey()).isEqualTo("EMAIL_VERIFICATION");
        assertThat(outboxEmails.get(0).getRecipientEmail()).isEqualTo("admin@horizon.edu");

        // Verify Immutable Audit Event
        List<AuditEvent> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        assertThat(auditEvents.get(0).getEventType()).isEqualTo(AuditEventType.COLLEGE_REGISTRATION_CREATED);
        assertThat(auditEvents.get(0).getCollegeId()).isEqualTo(college.getId());
    }

    @Test
    @DisplayName("Rejects registration when CSRF token is missing with 403 CSRF_TOKEN_INVALID")
    void rejectsMissingCsrfToken() throws Exception {
        RegisterCollegeRequest req = createValidRequest("CSRF-TEST", "admin@csrf.edu");

        mockMvc.perform(post("/api/v1/college-registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_TOKEN_INVALID"));
    }

    @Test
    @DisplayName("Rejects duplicate college code with 409 Conflict COLLEGE_CODE_ALREADY_EXISTS")
    void rejectsDuplicateCollegeCode() throws Exception {
        Cookie xsrf = fetchCsrfCookie();

        // First registration
        RegisterCollegeRequest req1 = createValidRequest("DUP-CODE", "admin1@dup.edu");
        mockMvc.perform(post("/api/v1/college-registrations")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Second registration with same code
        RegisterCollegeRequest req2 = createValidRequest("DUP-CODE", "admin2@dup.edu");
        mockMvc.perform(post("/api/v1/college-registrations")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("COLLEGE_CODE_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Rejects duplicate admin email with 409 Conflict EMAIL_ALREADY_EXISTS")
    void rejectsDuplicateAdminEmail() throws Exception {
        Cookie xsrf = fetchCsrfCookie();

        // First registration
        RegisterCollegeRequest req1 = createValidRequest("CODE-ONE", "duplicate@shared.edu");
        mockMvc.perform(post("/api/v1/college-registrations")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Second registration with different code but same email
        RegisterCollegeRequest req2 = createValidRequest("CODE-TWO", "duplicate@shared.edu");
        mockMvc.perform(post("/api/v1/college-registrations")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Enforces IP rate limit on 6th request with 429 and Retry-After header")
    void enforcesIpRateLimiting() throws Exception {
        Cookie xsrf = fetchCsrfCookie();

        for (int i = 1; i <= 5; i++) {
            RegisterCollegeRequest req = createValidRequest("RATE-" + i, "admin" + i + "@rate.edu");
            mockMvc.perform(post("/api/v1/college-registrations")
                            .with(request -> {
                                request.setRemoteAddr("198.51.100.77");
                                return request;
                            })
                            .cookie(xsrf)
                            .header("X-XSRF-TOKEN", xsrf.getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated());
        }

        // 6th attempt from the same IP must be rejected with 429
        RegisterCollegeRequest req6 = createValidRequest("RATE-6", "admin6@rate.edu");
        mockMvc.perform(post("/api/v1/college-registrations")
                        .with(request -> {
                            request.setRemoteAddr("198.51.100.77");
                            return request;
                        })
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req6)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.errorCode").value("RATE_LIMIT_EXCEEDED"));
    }
}
