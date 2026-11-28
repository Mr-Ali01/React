package com.acadlytic.modules.colleges;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End Testcontainers MySQL Integration Tests for Phase 04, Module 4.3:
 * College Admin Profile APIs (Self-Service).
 */
class CollegeProfileIntegrationTest extends AbstractMySqlIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private CollegeRepository collegeRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuditEventRepository auditEventRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private IpRateLimiter ipRateLimiter;
    @SpyBean
    private AuditEventService auditEventService;

    private final ObjectMapper explicitMapper = new ObjectMapper();

    private static final String ADMIN_A_EMAIL = "admin.a@apextech.edu.in";
    private static final String ADMIN_B_EMAIL = "admin.b@brilliant.edu.in";
    private static final String SUPER_ADMIN_EMAIL = "superadmin@acadlytic.com";
    private static final String DEFAULT_PASSWORD = "StrongSecurePassword!2026";

    private College collegeA;
    private College collegeB;
    private User adminAUser;
    private User adminBUser;
    private User superAdminUser;

    private SessionCookies adminACookies;
    private SessionCookies adminBCookies;
    private SessionCookies superAdminCookies;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        ipRateLimiter.clear();
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION_ATTRIBUTES");
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION");
        jdbcTemplate.execute("UPDATE colleges SET current_registration_id = NULL");
        jdbcTemplate.execute("UPDATE college_registration_documents SET source_document_id = NULL, source_registration_id = NULL, replaces_document_id = NULL");
        jdbcTemplate.execute("TRUNCATE TABLE college_document_reviews");
        jdbcTemplate.execute("DELETE FROM college_registration_documents");
        jdbcTemplate.execute("DELETE FROM college_registrations");
        jdbcTemplate.execute("DELETE FROM outbox_emails");
        jdbcTemplate.execute("DELETE FROM auth_tokens");
        jdbcTemplate.execute("DELETE FROM audit_events");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM colleges");

        // Create College A
        collegeA = new College();
        collegeA.setName("Apex Institute of Technology");
        collegeA.setCode("APEX-2026");
        collegeA.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        collegeA.setStatus(CollegeStatus.ACTIVE);
        collegeA.setAddressLine1("Plot 42, Knowledge Park III");
        collegeA.setAddressLine2("Institutional Area");
        collegeA.setCity("Greater Noida");
        collegeA.setState("Uttar Pradesh");
        collegeA.setCountry("India");
        collegeA.setPostalCode("201310");
        collegeA.setContactPhone("+91 98765 43210");
        collegeA.setContactEmail("info@apextech.edu.in");
        collegeA.setWebsiteUrl("https://apextech.edu.in");
        collegeA.setAffiliatedUniversityName("AKTU");
        collegeA.setEstablishedYear(2005);
        collegeA.setAccreditationDetails("NAAC A+");
        collegeA.setLogoStorageKey("logo-apex-uuid");
        collegeA = collegeRepository.saveAndFlush(collegeA);

        // Create College B
        collegeB = new College();
        collegeB.setName("Brilliant College of Engineering");
        collegeB.setCode("BRIL-2026");
        collegeB.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        collegeB.setStatus(CollegeStatus.ACTIVE);
        collegeB.setAddressLine1("Sector 15, Tech Zone");
        collegeB.setCity("Pune");
        collegeB.setState("Maharashtra");
        collegeB.setCountry("India");
        collegeB.setPostalCode("411001");
        collegeB = collegeRepository.saveAndFlush(collegeB);

        // Create Users
        adminAUser = createUser(ADMIN_A_EMAIL, Role.COLLEGE_ADMIN, collegeA.getId(), UserStatus.ACTIVE, DEFAULT_PASSWORD, true);
        adminBUser = createUser(ADMIN_B_EMAIL, Role.COLLEGE_ADMIN, collegeB.getId(), UserStatus.ACTIVE, DEFAULT_PASSWORD, true);
        superAdminUser = createUser(SUPER_ADMIN_EMAIL, Role.SUPER_ADMIN, null, UserStatus.ACTIVE, DEFAULT_PASSWORD, true);

        // Login to acquire stateful cookies
        adminACookies = login(ADMIN_A_EMAIL, DEFAULT_PASSWORD);
        adminBCookies = login(ADMIN_B_EMAIL, DEFAULT_PASSWORD);
        superAdminCookies = login(SUPER_ADMIN_EMAIL, DEFAULT_PASSWORD);
    }

    private record SessionCookies(Cookie sessionCookie, Cookie xsrfCookie) {}

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
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie("ACADLYTIC_SID");
        Cookie updatedXsrf = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(sessionCookie).isNotNull();
        return new SessionCookies(sessionCookie, updatedXsrf != null ? updatedXsrf : xsrf);
    }

    private User createUser(String email, Role role, Long collegeId, UserStatus status, String rawPassword, boolean verified) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("First");
        user.setLastName("Last");
        user.setRole(role);
        user.setCollegeId(collegeId);
        user.setStatus(status);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        if (verified) {
            user.setEmailVerifiedAt(Instant.now());
        }
        return userRepository.saveAndFlush(user);
    }

    private Map<String, Object> baseValidPayload(College college) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", college.getName());
        map.put("code", college.getCode());
        map.put("addressLine1", "Plot 42, Knowledge Park III");
        map.put("addressLine2", "Institutional Area");
        map.put("city", "Greater Noida");
        map.put("state", "Uttar Pradesh");
        map.put("country", "India");
        map.put("postalCode", "201310");
        map.put("contactPhone", "+91 98765 43210");
        map.put("contactEmail", "info@apextech.edu.in");
        map.put("websiteUrl", "https://apextech.edu.in");
        map.put("affiliatedUniversityName", college.getAffiliatedUniversityName());
        map.put("establishedYear", 2005);
        map.put("accreditationDetails", college.getAccreditationDetails());
        map.put("version", college.getVersion());
        return map;
    }

    // =========================================================================
    // Category 1: Profile Retrieval (01–06)
    // =========================================================================

    @Test
    @DisplayName("01: Active approved college admin successfully retrieves own profile (HTTP 200)")
    void testGetOwnProfile_Success() throws Exception {
        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(collegeA.getId().intValue())))
                .andExpect(jsonPath("$.data.name", is("Apex Institute of Technology")))
                .andExpect(jsonPath("$.data.code", is("APEX-2026")))
                .andExpect(jsonPath("$.data.approvalStatus", is("APPROVED")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("02: Returned data matches persisted operational fields in database")
    void testGetOwnProfile_MatchesDatabaseFields() throws Exception {
        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.addressLine1", is("Plot 42, Knowledge Park III")))
                .andExpect(jsonPath("$.data.addressLine2", is("Institutional Area")))
                .andExpect(jsonPath("$.data.city", is("Greater Noida")))
                .andExpect(jsonPath("$.data.state", is("Uttar Pradesh")))
                .andExpect(jsonPath("$.data.country", is("India")))
                .andExpect(jsonPath("$.data.postalCode", is("201310")))
                .andExpect(jsonPath("$.data.contactPhone", is("+91 98765 43210")))
                .andExpect(jsonPath("$.data.contactEmail", is("info@apextech.edu.in")))
                .andExpect(jsonPath("$.data.websiteUrl", is("https://apextech.edu.in")))
                .andExpect(jsonPath("$.data.affiliatedUniversityName", is("AKTU")))
                .andExpect(jsonPath("$.data.establishedYear", is(2005)))
                .andExpect(jsonPath("$.data.accreditationDetails", is("NAAC A+")));
    }

    @Test
    @DisplayName("03: Derived hasLogo is true when logoStorageKey exists; false when null; raw key never exposed")
    void testGetOwnProfile_LogoDerivationAndNoRawKeyExposed() throws Exception {
        // College A has logo
        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasLogo", is(true)))
                .andExpect(jsonPath("$.data.logoStorageKey").doesNotExist());

        // College B has no logo
        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminBCookies.sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasLogo", is(false)))
                .andExpect(jsonPath("$.data.logoStorageKey").doesNotExist());
    }

    @Test
    @DisplayName("04: Unauthenticated request rejected with HTTP 401 AUTH_UNAUTHENTICATED")
    void testGetOwnProfile_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/college/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode", is("AUTH_UNAUTHENTICATED")));
    }

    @Test
    @DisplayName("05: Super Admin calling GET /api/v1/college/profile rejected with HTTP 403 ACCESS_DENIED")
    void testGetOwnProfile_SuperAdminForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(superAdminCookies.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("ACCESS_DENIED")));
    }

    @Test
    @DisplayName("06: College Admin with missing college association rejected with HTTP 403 COLLEGE_INACTIVE")
    void testGetOwnProfile_OrphanAdminForbidden() throws Exception {
        User orphan = createUser("orphan@college.edu", Role.COLLEGE_ADMIN, null, UserStatus.ACTIVE, DEFAULT_PASSWORD, true);
        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", orphan.getEmail(), "password", DEFAULT_PASSWORD))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_INACTIVE")));
    }

    // =========================================================================
    // Category 2: Tenant Isolation & Lifecycle Restrictions on Retrieval (07–12)
    // =========================================================================

    @Test
    @DisplayName("07: Suspended college admin rejected with HTTP 403 COLLEGE_SUSPENDED (ADR-10)")
    void testGetOwnProfile_SuspendedCollege() throws Exception {
        collegeA.setStatus(CollegeStatus.SUSPENDED);
        collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_SUSPENDED")));
    }

    @Test
    @DisplayName("08: Inactive college admin rejected with HTTP 403 COLLEGE_INACTIVE")
    void testGetOwnProfile_InactiveCollege() throws Exception {
        collegeA.setStatus(CollegeStatus.INACTIVE);
        collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_INACTIVE")));
    }

    @Test
    @DisplayName("09: Archived college admin rejected with HTTP 403 COLLEGE_INACTIVE")
    void testGetOwnProfile_ArchivedCollege() throws Exception {
        collegeA.setArchivedAt(Instant.now());
        collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_INACTIVE")));
    }

    @Test
    @DisplayName("10: Unapproved college admin (PENDING) rejected with HTTP 403 COLLEGE_NOT_APPROVED")
    void testGetOwnProfile_PendingApproval() throws Exception {
        collegeA.setApprovalStatus(CollegeApprovalStatus.PENDING);
        collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_NOT_APPROVED")));
    }

    @Test
    @DisplayName("11: Action required college admin rejected with HTTP 403 COLLEGE_NOT_APPROVED")
    void testGetOwnProfile_ActionRequired() throws Exception {
        collegeA.setApprovalStatus(CollegeApprovalStatus.ACTION_REQUIRED);
        collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_NOT_APPROVED")));
    }

    @Test
    @DisplayName("12: Permanently rejected college admin rejected with HTTP 403 REGISTRATION_PERMANENTLY_REJECTED")
    void testGetOwnProfile_PermanentlyRejected() throws Exception {
        collegeA.setPermanentlyRejected(true);
        collegeRepository.saveAndFlush(collegeA);

        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("REGISTRATION_PERMANENTLY_REJECTED")));
    }

    // =========================================================================
    // Category 3: Permitted Profile Updates (13–22)
    // =========================================================================

    @Test
    @DisplayName("13: Full permitted update succeeds with HTTP 200")
    void testUpdateOwnProfile_Success() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("addressLine2", "Updated Block C");
        payload.put("contactPhone", "+91 99999 88888");
        payload.put("contactEmail", "admissions@apextech.edu.in");
        payload.put("websiteUrl", "https://admissions.apextech.edu.in");
        payload.put("establishedYear", 2008);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.addressLine2", is("Updated Block C")))
                .andExpect(jsonPath("$.data.contactPhone", is("+91 99999 88888")))
                .andExpect(jsonPath("$.data.contactEmail", is("admissions@apextech.edu.in")))
                .andExpect(jsonPath("$.data.websiteUrl", is("https://admissions.apextech.edu.in")))
                .andExpect(jsonPath("$.data.establishedYear", is(2008)));
    }

    @Test
    @DisplayName("14: Database entity reflects updated fields and incremented version")
    void testUpdateOwnProfile_DatabaseUpdatedAndVersionIncremented() throws Exception {
        Long initialVersion = collegeA.getVersion();

        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("city", "Noida Central");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        College refreshed = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshed.getCity()).isEqualTo("Noida Central");
        assertThat(refreshed.getVersion()).isEqualTo(initialVersion + 1L);
    }

    @Test
    @DisplayName("15: Response envelope reflects updated fields and new version")
    void testUpdateOwnProfile_ResponseEnvelopeReflectsVersion() throws Exception {
        Long initialVersion = collegeA.getVersion();

        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("postalCode", "201308");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.postalCode", is("201308")))
                .andExpect(jsonPath("$.data.version", is((int) (initialVersion + 1L))));
    }

    @Test
    @DisplayName("16: Audit event COLLEGE_PROFILE_UPDATED created with COLLEGE_ADMIN role and diff")
    void testUpdateOwnProfile_AuditEventCreated() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("contactPhone", "+91 88888 77777");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        List<AuditEvent> events = auditEventRepository.findByCollegeId(collegeA.getId());
        assertThat(events).isNotEmpty();
        AuditEvent event = events.stream()
                .filter(e -> e.getEventType() == AuditEventType.COLLEGE_PROFILE_UPDATED)
                .findFirst()
                .orElseThrow();
        assertThat(event.getEventType()).isEqualTo(AuditEventType.COLLEGE_PROFILE_UPDATED);
        assertThat(event.getActorRole()).isEqualTo(Role.COLLEGE_ADMIN);
        assertThat(event.getActorUserId()).isEqualTo(adminAUser.getId());
        assertThat(event.getCollegeId()).isEqualTo(collegeA.getId());
        assertThat(event.getOutcome()).isEqualTo(AuditOutcome.SUCCESS);
        assertThat(event.getMetadataJson()).contains("SELF_SERVICE");
        assertThat(event.getMetadataJson()).contains("contactPhone");
    }

    @Test
    @DisplayName("17: Updating contactEmail does NOT alter user.email or invalidate admin session")
    void testUpdateOwnProfile_ContactEmailDecoupledFromUserEmail() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("contactEmail", "new.institutional@apextech.edu.in");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        // Verify college contact_email is updated
        College refreshedCollege = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshedCollege.getContactEmail()).isEqualTo("new.institutional@apextech.edu.in");

        // Verify user login email is unchanged
        User refreshedUser = userRepository.findById(adminAUser.getId()).orElseThrow();
        assertThat(refreshedUser.getEmail()).isEqualTo(ADMIN_A_EMAIL);

        // Verify existing session remains valid
        mockMvc.perform(get("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("18: Clearing optional fields by sending explicit null sets database columns to NULL")
    void testUpdateOwnProfile_ClearOptionalFieldsExplicitNull() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("addressLine2", null);
        payload.put("contactPhone", null);
        payload.put("contactEmail", null);
        payload.put("websiteUrl", null);
        payload.put("establishedYear", null);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.addressLine2").doesNotExist())
                .andExpect(jsonPath("$.data.contactPhone").doesNotExist())
                .andExpect(jsonPath("$.data.contactEmail").doesNotExist())
                .andExpect(jsonPath("$.data.websiteUrl").doesNotExist())
                .andExpect(jsonPath("$.data.establishedYear").doesNotExist());

        College refreshed = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshed.getAddressLine2()).isNull();
        assertThat(refreshed.getContactPhone()).isNull();
        assertThat(refreshed.getContactEmail()).isNull();
        assertThat(refreshed.getWebsiteUrl()).isNull();
        assertThat(refreshed.getEstablishedYear()).isNull();
    }

    @Test
    @DisplayName("19: Clearing optional fields by sending blank strings or whitespace normalizes to NULL")
    void testUpdateOwnProfile_ClearOptionalFieldsBlankString() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("addressLine2", "   ");
        payload.put("contactPhone", "");
        payload.put("contactEmail", "   ");
        payload.put("websiteUrl", "   ");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.addressLine2").doesNotExist())
                .andExpect(jsonPath("$.data.contactPhone").doesNotExist())
                .andExpect(jsonPath("$.data.contactEmail").doesNotExist())
                .andExpect(jsonPath("$.data.websiteUrl").doesNotExist());
    }

    @Test
    @DisplayName("20: No-op update returns HTTP 200 without database write, without version increment, and without audit log")
    void testUpdateOwnProfile_NoOpUpdate() throws Exception {
        long auditCountBefore = auditEventRepository.count();
        Long versionBefore = collegeA.getVersion();

        Map<String, Object> payload = baseValidPayload(collegeA);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        College refreshed = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshed.getVersion()).isEqualTo(versionBefore);
        assertThat(auditEventRepository.count()).isEqualTo(auditCountBefore);
    }

    @Test
    @DisplayName("21: Established year boundary values (1800 and 2100) are accepted and persisted")
    void testUpdateOwnProfile_EstablishedYearBoundaries() throws Exception {
        // Test lower bound 1800
        Map<String, Object> payload1 = baseValidPayload(collegeA);
        payload1.put("establishedYear", 1800);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.establishedYear", is(1800)));

        College refreshed1 = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshed1.getEstablishedYear()).isEqualTo(1800);

        // Test upper bound 2100
        Map<String, Object> payload2 = baseValidPayload(refreshed1);
        payload2.put("establishedYear", 2100);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.establishedYear", is(2100)));

        College refreshed2 = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshed2.getEstablishedYear()).isEqualTo(2100);
    }

    @Test
    @DisplayName("22: Sequential updates increment version monotonically (0 -> 1 -> 2)")
    void testUpdateOwnProfile_SequentialVersionIncrements() throws Exception {
        College c = collegeA;

        for (int i = 1; i <= 2; i++) {
            Map<String, Object> payload = baseValidPayload(c);
            payload.put("city", "City Update " + i);

            mockMvc.perform(put("/api/v1/college/profile")
                            .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                            .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.version", is((int) (c.getVersion() + 1))));

            c = collegeRepository.findById(collegeA.getId()).orElseThrow();
        }
    }

    // =========================================================================
    // Category 4: Validation & Boundary Errors (23–31)
    // =========================================================================

    @Test
    @DisplayName("23: Missing required field addressLine1 returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MissingAddressLine1() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.remove("addressLine1");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("24: Missing required field city returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MissingCity() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("city", "   ");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("25: Missing required field state returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MissingState() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("state", null);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("26: Missing required field country returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MissingCountry() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("country", "");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("27: Missing required field postalCode returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MissingPostalCode() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.remove("postalCode");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("27b: Postal code with exactly 30 characters is valid and persisted")
    void testUpdateOwnProfile_PostalCodeMax30CharsValid() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        String postal30 = "123456789012345678901234567890";
        payload.put("postalCode", postal30);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.postalCode", is(postal30)));

        College refreshed = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshed.getPostalCode()).isEqualTo(postal30);
    }

    @Test
    @DisplayName("27c: Postal code with 31 characters exceeds max 30 and returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_PostalCodeExceeds30CharsInvalid() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("postalCode", "1234567890123456789012345678901");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("28: Invalid contactEmail syntax returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_InvalidEmail() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("contactEmail", "not-a-valid-email");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("29: establishedYear below 1800 returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_YearBelowMin() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("establishedYear", 1799);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("30: establishedYear above 2100 returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_YearAboveMax() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("establishedYear", 2101);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("31: Field length violation (city > 100 chars) returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_CityLengthViolation() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("city", "C".repeat(101));

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    // =========================================================================
    // Category 5: URL Validation & Guardrail B (32–37)
    // =========================================================================

    @Test
    @DisplayName("32: Valid website URLs (HTTPS, HTTP, ports, paths, query) accepted and persisted")
    void testUpdateOwnProfile_ValidUrls() throws Exception {
        String[] validUrls = {
                "https://apextech.edu.in",
                "http://localhost:8080",
                "https://www.college.ac.in/admissions?ref=web&year=2026#faq",
                "http://sub.domain.college.edu:8443/portal"
        };

        College current = collegeA;
        for (String url : validUrls) {
            Map<String, Object> payload = baseValidPayload(current);
            payload.put("websiteUrl", url);

            mockMvc.perform(put("/api/v1/college/profile")
                            .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                            .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.websiteUrl", is(url)));

            current = collegeRepository.findById(collegeA.getId()).orElseThrow();
        }
    }

    @Test
    @DisplayName("33: Malformed website URL (missing scheme, not a url) returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MalformedUrlMissingScheme() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("websiteUrl", "apextech.edu.in"); // missing http:// or https://

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("34: Unsupported URL scheme (ftp, javascript, data, file) returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_UnsupportedUrlSchemes() throws Exception {
        String[] invalidSchemes = {
                "ftp://apextech.edu.in",
                "javascript:alert(1)",
                "data:text/html,<html>",
                "file:///etc/passwd"
        };

        for (String url : invalidSchemes) {
            Map<String, Object> payload = baseValidPayload(collegeA);
            payload.put("websiteUrl", url);

            mockMvc.perform(put("/api/v1/college/profile")
                            .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                            .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
        }
    }

    @Test
    @DisplayName("35: Website URL with invalid/out-of-range port returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_InvalidPortUrl() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("websiteUrl", "http://example.com:99999"); // Port > 65535

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("36: Website URL with malformed host returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MalformedHostUrl() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("websiteUrl", "http://-invalid-host.com");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("37: Blank or whitespace website URL normalizes to NULL without validation failure")
    void testUpdateOwnProfile_BlankUrlNormalizesToNull() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("websiteUrl", "    ");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.websiteUrl").doesNotExist());
    }

    // =========================================================================
    // Category 6: Read-Only Property Presence Semantics — Guardrail A (38–43)
    // =========================================================================

    @Test
    @DisplayName("38: Omitted read-only fields in JSON are accepted and preserve persisted values")
    void testUpdateOwnProfile_OmittedReadOnlyFields() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.remove("name");
        payload.remove("code");
        payload.remove("affiliatedUniversityName");
        payload.remove("accreditationDetails");
        payload.put("city", "Noida Omitted Test");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is(collegeA.getName())))
                .andExpect(jsonPath("$.data.code", is(collegeA.getCode())))
                .andExpect(jsonPath("$.data.affiliatedUniversityName", is(collegeA.getAffiliatedUniversityName())))
                .andExpect(jsonPath("$.data.accreditationDetails", is(collegeA.getAccreditationDetails())));
    }

    @Test
    @DisplayName("39: Explicitly supplied read-only fields equal to persisted values are accepted")
    void testUpdateOwnProfile_UnchangedReadOnlyFields() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("name", collegeA.getName());
        payload.put("code", collegeA.getCode());
        payload.put("affiliatedUniversityName", collegeA.getAffiliatedUniversityName());
        payload.put("accreditationDetails", collegeA.getAccreditationDetails());
        payload.put("city", "Noida Match Test");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.city", is("Noida Match Test")));
    }

    @Test
    @DisplayName("40: Explicit null for name when persisted is non-null returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ExplicitNullName() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("name", null);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(explicitMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("41: Explicit null for code when persisted is non-null returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ExplicitNullCode() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("code", null);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(explicitMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("42: Explicit null for university when persisted is non-null returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ExplicitNullUniversity() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("affiliatedUniversityName", null);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(explicitMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("43: Explicit null for accreditation when persisted is non-null returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ExplicitNullAccreditation() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("accreditationDetails", null);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(explicitMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("43b: Whitespace-only submission for read-only name cannot bypass immutability and returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_WhitespaceReadOnlyNameRejected() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("name", "   ");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("43c: Attempt to modify read-only name returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ModifiedReadOnlyName() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("name", "Completely New College Name");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("43d: Attempt to modify read-only code returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ModifiedReadOnlyCode() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("code", "MODIFIED-CODE");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("43e: Attempt to modify read-only affiliated university returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ModifiedReadOnlyUniversity() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("affiliatedUniversityName", "Different University");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("43f: Attempt to modify read-only accreditation details returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnProfile_ModifiedReadOnlyAccreditation() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("accreditationDetails", "NAAC A++ (Tampered)");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    // =========================================================================
    // Category 7: Security, Tenant Isolation & Mass Assignment (44–49)
    // =========================================================================

    @Test
    @DisplayName("44a: Injected collegeId in JSON body is ignored; caller's college updated; other college untouched")
    void testUpdateOwnProfile_InjectedCollegeIdInBody_Ignored() throws Exception {
        Long initialVersionB = collegeB.getVersion();
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("collegeId", collegeB.getId());
        payload.put("city", "Noida Body CollegeId Injected");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(collegeA.getId().intValue())))
                .andExpect(jsonPath("$.data.city", is("Noida Body CollegeId Injected")));

        // Verify caller's college was updated
        College refreshedA = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshedA.getCity()).isEqualTo("Noida Body CollegeId Injected");

        // Verify other college B was completely untouched
        College refreshedB = collegeRepository.findById(collegeB.getId()).orElseThrow();
        assertThat(refreshedB.getCity()).isEqualTo("Pune");
        assertThat(refreshedB.getVersion()).isEqualTo(initialVersionB);
    }

    @Test
    @DisplayName("44b: Injected id in JSON body is ignored; caller's college updated; other college untouched")
    void testUpdateOwnProfile_InjectedIdInBody_Ignored() throws Exception {
        Long initialVersionB = collegeB.getVersion();
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("id", collegeB.getId());
        payload.put("city", "Noida Body Id Injected");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(collegeA.getId().intValue())))
                .andExpect(jsonPath("$.data.city", is("Noida Body Id Injected")));

        // Verify caller's college was updated
        College refreshedA = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshedA.getCity()).isEqualTo("Noida Body Id Injected");

        // Verify other college B was completely untouched
        College refreshedB = collegeRepository.findById(collegeB.getId()).orElseThrow();
        assertThat(refreshedB.getCity()).isEqualTo("Pune");
        assertThat(refreshedB.getVersion()).isEqualTo(initialVersionB);
    }

    @Test
    @DisplayName("45a: Injected collegeId in query parameter is ignored; caller's college updated; other college untouched")
    void testUpdateOwnProfile_InjectedCollegeIdInQuery_Ignored() throws Exception {
        Long initialVersionB = collegeB.getVersion();
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("city", "Noida Query CollegeId Injected");

        mockMvc.perform(put("/api/v1/college/profile?collegeId=" + collegeB.getId())
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(collegeA.getId().intValue())))
                .andExpect(jsonPath("$.data.city", is("Noida Query CollegeId Injected")));

        // Verify caller's college was updated
        College refreshedA = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshedA.getCity()).isEqualTo("Noida Query CollegeId Injected");

        // Verify other college B was completely untouched
        College refreshedB = collegeRepository.findById(collegeB.getId()).orElseThrow();
        assertThat(refreshedB.getCity()).isEqualTo("Pune");
        assertThat(refreshedB.getVersion()).isEqualTo(initialVersionB);
    }

    @Test
    @DisplayName("45b: Injected id in query parameter is ignored; caller's college updated; other college untouched")
    void testUpdateOwnProfile_InjectedIdInQuery_Ignored() throws Exception {
        Long initialVersionB = collegeB.getVersion();
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("city", "Noida Query Id Injected");

        mockMvc.perform(put("/api/v1/college/profile?id=" + collegeB.getId())
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(collegeA.getId().intValue())))
                .andExpect(jsonPath("$.data.city", is("Noida Query Id Injected")));

        // Verify caller's college was updated
        College refreshedA = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshedA.getCity()).isEqualTo("Noida Query Id Injected");

        // Verify other college B was completely untouched
        College refreshedB = collegeRepository.findById(collegeB.getId()).orElseThrow();
        assertThat(refreshedB.getCity()).isEqualTo("Pune");
        assertThat(refreshedB.getVersion()).isEqualTo(initialVersionB);
    }

    @Test
    @DisplayName("46: Injected system fields (status, approvalStatus, logoStorageKey) are ignored")
    void testUpdateOwnProfile_MassAssignmentIgnored() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("status", "SUSPENDED");
        payload.put("approvalStatus", "REJECTED");
        payload.put("permanentlyRejected", true);
        payload.put("logoStorageKey", "injected-storage-key");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        College refreshed = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(refreshed.isPermanentlyRejected()).isFalse();
        assertThat(refreshed.getLogoStorageKey()).isEqualTo("logo-apex-uuid");
    }

    @Test
    @DisplayName("47: Super Admin calling PUT /api/v1/college/profile returns HTTP 403 ACCESS_DENIED")
    void testUpdateOwnProfile_SuperAdminForbidden() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("ACCESS_DENIED")));
    }

    @Test
    @DisplayName("48: Unauthenticated request to PUT /api/v1/college/profile returns HTTP 401 AUTH_UNAUTHENTICATED")
    void testUpdateOwnProfile_Unauthenticated() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode", is("AUTH_UNAUTHENTICATED")));
    }

    @Test
    @DisplayName("49: Missing CSRF token on PUT returns HTTP 403 forbidden")
    void testUpdateOwnProfile_MissingCsrf() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie())
                        // Omit X-XSRF-TOKEN header
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("CSRF_TOKEN_INVALID")));
    }

    // =========================================================================
    // Category 8: Concurrency, Audit Allowlist & Rollback (50–54)
    // =========================================================================

    @Test
    @DisplayName("50: Missing version in PUT returns HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnProfile_MissingVersion() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.remove("version");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("51: Stale version (request.version != college.version) returns HTTP 409 STALE_COLLEGE_VERSION")
    void testUpdateOwnProfile_StaleVersion() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("version", collegeA.getVersion() + 5L);

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("STALE_COLLEGE_VERSION")));
    }

    @Test
    @DisplayName("52: Real concurrent update race: competing request receives HTTP 409 STALE_COLLEGE_VERSION")
    void testUpdateOwnProfile_RealConcurrentUpdateRace() throws Exception {
        Long initialVersion = collegeA.getVersion();

        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        // Prepare two competing requests starting with the exact same version
        Map<String, Object> payload1 = baseValidPayload(collegeA);
        payload1.put("city", "Race City 1");
        payload1.put("version", initialVersion);

        Map<String, Object> payload2 = baseValidPayload(collegeA);
        payload2.put("city", "Race City 2");
        payload2.put("version", initialVersion);

        CompletableFuture<Void> future1 = CompletableFuture.runAsync(() -> {
            try {
                startLatch.await();
                int status = mockMvc.perform(put("/api/v1/college/profile")
                                .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                                .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload1)))
                        .andReturn().getResponse().getStatus();
                if (status == 200) successCount.incrementAndGet();
                if (status == 409) conflictCount.incrementAndGet();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        CompletableFuture<Void> future2 = CompletableFuture.runAsync(() -> {
            try {
                startLatch.await();
                int status = mockMvc.perform(put("/api/v1/college/profile")
                                .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                                .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload2)))
                        .andReturn().getResponse().getStatus();
                if (status == 200) successCount.incrementAndGet();
                if (status == 409) conflictCount.incrementAndGet();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        // Release latch simultaneously
        startLatch.countDown();
        CompletableFuture.allOf(future1, future2).get();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(1);

        College finalCollege = collegeRepository.findById(collegeA.getId()).orElseThrow();
        assertThat(finalCollege.getVersion()).isEqualTo(initialVersion + 1L);
    }

    @Test
    @DisplayName("53: Audit diff allowlist: verified protected/internal fields never enter audit metadata")
    void testUpdateOwnProfile_AuditAllowlistEnforcement() throws Exception {
        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("city", "Audit City Allowlist Test");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        List<AuditEvent> events = auditEventRepository.findByCollegeId(collegeA.getId());
        assertThat(events).isNotEmpty();
        String metadataJson = events.get(0).getMetadataJson();

        // Disallowed fields must never appear in metadata
        assertThat(metadataJson).doesNotContain("password");
        assertThat(metadataJson).doesNotContain("token");
        assertThat(metadataJson).doesNotContain("logoStorageKey");
        assertThat(metadataJson).doesNotContain("currentRegistrationId");
        assertThat(metadataJson).doesNotContain("permanentlyRejected");
    }

    @Test
    @DisplayName("54: PUT on SUSPENDED college returns HTTP 403 COLLEGE_SUSPENDED (ADR-10)")
    void testUpdateOwnProfile_SuspendedCollege() throws Exception {
        collegeA.setStatus(CollegeStatus.SUSPENDED);
        collegeRepository.saveAndFlush(collegeA);

        Map<String, Object> payload = baseValidPayload(collegeA);
        payload.put("city", "Suspended Attempt");

        mockMvc.perform(put("/api/v1/college/profile")
                        .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_SUSPENDED")));
    }

    @Test
    @DisplayName("55: Transactional Rollback: Audit failure inside transaction rolls back database entity mutation and version")
    void testUpdateOwnProfile_TransactionalRollback_AuditFailureRollsBackAll() throws Exception {
        Long initialVersion = collegeA.getVersion();
        String initialCity = collegeA.getCity();
        int initialAuditCount = auditEventRepository.findByCollegeId(collegeA.getId()).size();

        // Force AuditEventService.record(...) to throw an exception
        doThrow(new RuntimeException("Simulated audit persistence failure"))
                .when(auditEventService)
                .record(eq(AuditEventType.COLLEGE_PROFILE_UPDATED), any(), any(), any(), eq(collegeA.getId()), any(), any(), any());

        try {
            Map<String, Object> payload = baseValidPayload(collegeA);
            payload.put("city", "City Mutation That Should Rollback");

            mockMvc.perform(put("/api/v1/college/profile")
                            .cookie(adminACookies.sessionCookie(), adminACookies.xsrfCookie())
                            .header("X-XSRF-TOKEN", adminACookies.xsrfCookie().getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload)))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.errorCode", is("INTERNAL_ERROR")));

            // Verify college entity was rolled back to original state
            College reloaded = collegeRepository.findById(collegeA.getId()).orElseThrow();
            assertThat(reloaded.getCity()).isEqualTo(initialCity);
            assertThat(reloaded.getVersion()).isEqualTo(initialVersion);

            // Verify zero audit records were committed
            int finalAuditCount = auditEventRepository.findByCollegeId(collegeA.getId()).size();
            assertThat(finalAuditCount).isEqualTo(initialAuditCount);
        } finally {
            Mockito.reset(auditEventService);
        }
    }
}
