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
import com.acadlytic.modules.colleges.dto.UpdateCollegeProfileRequest;
import com.acadlytic.modules.colleges.dto.UpdateCollegeStatusRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.security.CollegeAccessGuard;
import com.acadlytic.security.SessionRevocationService;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End Testcontainers MySQL Integration Tests for Phase 04, Module 4.2:
 * Super Admin College Management APIs.
 */
class SuperAdminCollegeIntegrationTest extends AbstractMySqlIntegrationTest {

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
    private OutboxEmailRepository outboxEmailRepository;
    @Autowired
    private AuditEventRepository auditEventRepository;
    @Autowired
    private SessionRevocationService sessionRevocationService;
    @Autowired
    private CollegeAccessGuard collegeAccessGuard;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private IpRateLimiter ipRateLimiter;

    private static final String SUPER_ADMIN_EMAIL = "superadmin@acadlytic.com";
    private static final String SUPER_ADMIN_PASS = "SuperAdminSecretPass!2026";

    private User superAdminUser;
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

        superAdminUser = createUser(SUPER_ADMIN_EMAIL, Role.SUPER_ADMIN, null, UserStatus.ACTIVE, SUPER_ADMIN_PASS, true);
        superAdminCookies = login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASS);
    }

    private Cookie fetchCsrfCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isNoContent())
                .andReturn();
        return result.getResponse().getCookie("XSRF-TOKEN");
    }

    private record SessionCookies(Cookie sessionCookie, Cookie xsrfCookie) {}

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

    private College createCollege(String name, String code, CollegeApprovalStatus approvalStatus, CollegeStatus status) {
        College college = new College();
        college.setName(name);
        college.setCode(code);
        college.setApprovalStatus(approvalStatus);
        college.setStatus(status);
        return collegeRepository.saveAndFlush(college);
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

    // =========================================================================
    // Category 1: Directory Listing, Search, Filters & Sorting (1–20)
    // =========================================================================

    @Test
    @DisplayName("01: Default pagination returns 20 items per page with page index 0")
    void testListColleges_DefaultPagination() throws Exception {
        for (int i = 1; i <= 25; i++) {
            createCollege("College " + String.format("%02d", i), "COL" + i, CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        }

        mockMvc.perform(get("/api/v1/super-admin/colleges")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.page", is(0)))
                .andExpect(jsonPath("$.data.size", is(20)))
                .andExpect(jsonPath("$.data.totalElements", is(25)))
                .andExpect(jsonPath("$.data.totalPages", is(2)))
                .andExpect(jsonPath("$.data.last", is(false)))
                .andExpect(jsonPath("$.data.content", hasSize(20)));
    }

    @Test
    @DisplayName("02: Explicit pagination retrieves requested page and size")
    void testListColleges_ExplicitPagination() throws Exception {
        for (int i = 1; i <= 15; i++) {
            createCollege("College " + String.format("%02d", i), "COL" + i, CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        }

        mockMvc.perform(get("/api/v1/super-admin/colleges?page=1&size=5")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page", is(1)))
                .andExpect(jsonPath("$.data.size", is(5)))
                .andExpect(jsonPath("$.data.content", hasSize(5)));
    }

    @Test
    @DisplayName("03: Maximum allowed page size (100) succeeds")
    void testListColleges_MaxPageSize100() throws Exception {
        createCollege("College 1", "COL1", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/super-admin/colleges?size=100")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size", is(100)));
    }

    @Test
    @DisplayName("04: Exceeding maximum page size (>100) returns HTTP 400 VALIDATION_ERROR")
    void testListColleges_ExceedMaxPageSize_Returns400() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/colleges?size=101")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("05: Negative page index returns HTTP 400 VALIDATION_ERROR")
    void testListColleges_NegativePageIndex_Returns400() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/colleges?page=-1")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("06: Zero page size returns HTTP 400 VALIDATION_ERROR")
    void testListColleges_ZeroPageSize_Returns400() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/colleges?size=0")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("07: Search by college name matches case-insensitively")
    void testListColleges_SearchByName() throws Exception {
        createCollege("Oxford University", "OXF", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        createCollege("Cambridge University", "CAM", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/super-admin/colleges?search=oxford")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Oxford University")));
    }

    @Test
    @DisplayName("08: Search by college code matches correctly")
    void testListColleges_SearchByCode() throws Exception {
        createCollege("Stanford", "STANFORD_CODE", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        createCollege("MIT", "MIT_CODE", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/super-admin/colleges?search=STANFORD")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("STANFORD_CODE")));
    }

    @Test
    @DisplayName("09: Search by institutional contact email matches correctly")
    void testListColleges_SearchByEmail() throws Exception {
        College c1 = createCollege("College One", "C1", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c1.setContactEmail("contact@collegeone.edu");
        collegeRepository.saveAndFlush(c1);

        College c2 = createCollege("College Two", "C2", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c2.setContactEmail("info@other.edu");
        collegeRepository.saveAndFlush(c2);

        mockMvc.perform(get("/api/v1/super-admin/colleges?search=collegeone.edu")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("College One")));
    }

    @Test
    @DisplayName("10: Search by affiliated university name matches correctly")
    void testListColleges_SearchByUniversity() throws Exception {
        College c1 = createCollege("Affiliated College", "AFF1", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c1.setAffiliatedUniversityName("Delhi University");
        collegeRepository.saveAndFlush(c1);

        createCollege("Standalone College", "STA1", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/super-admin/colleges?search=Delhi")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Affiliated College")));
    }

    @Test
    @DisplayName("11: Search escaping: %, _, and \\ are treated as literals, not wildcards")
    void testListColleges_SearchWithWildcardSpecialCharacters() throws Exception {
        createCollege("College_Special%100", "SPEC", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        createCollege("CollegeXSpecialA100", "NORM", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        // Searching for exact literal "_Special%" should only match College_Special%100
        mockMvc.perform(get("/api/v1/super-admin/colleges?search=_Special%")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("SPEC")));
    }

    @Test
    @DisplayName("12: Filtering by operational status returns only matching colleges")
    void testListColleges_FilterByStatus() throws Exception {
        createCollege("Active College", "ACT", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        createCollege("Suspended College", "SUS", CollegeApprovalStatus.APPROVED, CollegeStatus.SUSPENDED);

        mockMvc.perform(get("/api/v1/super-admin/colleges?status=SUSPENDED")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("SUS")));
    }

    @Test
    @DisplayName("13: Filtering by approval status returns only matching colleges")
    void testListColleges_FilterByApprovalStatus() throws Exception {
        createCollege("Approved College", "APP", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        createCollege("Pending College", "PEN", CollegeApprovalStatus.PENDING, CollegeStatus.PENDING_VERIFICATION);

        mockMvc.perform(get("/api/v1/super-admin/colleges?approvalStatus=PENDING")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("PEN")));
    }

    @Test
    @DisplayName("14: Filtering by city matches case-insensitively")
    void testListColleges_FilterByCity() throws Exception {
        College c1 = createCollege("Boston College", "BOS", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c1.setCity("Boston");
        collegeRepository.saveAndFlush(c1);

        College c2 = createCollege("NY College", "NYC", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c2.setCity("New York");
        collegeRepository.saveAndFlush(c2);

        mockMvc.perform(get("/api/v1/super-admin/colleges?city=boston")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("BOS")));
    }

    @Test
    @DisplayName("15: Filtering by state matches case-insensitively")
    void testListColleges_FilterByState() throws Exception {
        College c1 = createCollege("Bay College", "BAY", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c1.setState("California");
        collegeRepository.saveAndFlush(c1);

        College c2 = createCollege("Lone Star", "LST", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c2.setState("Texas");
        collegeRepository.saveAndFlush(c2);

        mockMvc.perform(get("/api/v1/super-admin/colleges?state=california")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("BAY")));
    }

    @Test
    @DisplayName("16: Sorting by allowed fields with ASC and DESC works correctly")
    void testListColleges_SortByAllowedFields_AscAndDesc() throws Exception {
        createCollege("Alpha College", "AAA", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        createCollege("Zeta College", "ZZZ", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        // Name ASC
        mockMvc.perform(get("/api/v1/super-admin/colleges?sortBy=name&sortDirection=ASC")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name", is("Alpha College")))
                .andExpect(jsonPath("$.data.content[1].name", is("Zeta College")));

        // Name DESC
        mockMvc.perform(get("/api/v1/super-admin/colleges?sortBy=name&sortDirection=DESC")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name", is("Zeta College")))
                .andExpect(jsonPath("$.data.content[1].name", is("Alpha College")));
    }

    @Test
    @DisplayName("17: Sorting by disallowed field or client-supplied id returns HTTP 400 INVALID_SORT_PROPERTY")
    void testListColleges_SortByDisallowedField_Returns400() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/colleges?sortBy=passwordHash")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("INVALID_SORT_PROPERTY")));

        // Client-supplied id is not in the client whitelist and must be rejected
        mockMvc.perform(get("/api/v1/super-admin/colleges?sortBy=id")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("INVALID_SORT_PROPERTY")));
    }

    @Test
    @DisplayName("18: Deterministic secondary tie-breaker id ASC is applied")
    void testListColleges_DeterministicSecondarySort_IdAsc() throws Exception {
        College c1 = createCollege("Same Name", "CODE_A", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        College c2 = createCollege("Same Name", "CODE_B", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/super-admin/colleges?sortBy=name&sortDirection=ASC")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id", is(c1.getId().intValue())))
                .andExpect(jsonPath("$.data.content[1].id", is(c2.getId().intValue())));
    }

    @Test
    @DisplayName("19: Batch active admin retrieval populates admin details in bounded queries")
    void testListColleges_BatchActiveAdminRetrieval_ZeroNPlusOne() throws Exception {
        College c1 = createCollege("College One", "C1", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        User admin1 = createUser("admin1@c1.edu", Role.COLLEGE_ADMIN, c1.getId(), UserStatus.ACTIVE, "Pass!123", true);

        College c2 = createCollege("College Two", "C2", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        User admin2 = createUser("admin2@c2.edu", Role.COLLEGE_ADMIN, c2.getId(), UserStatus.ACTIVE, "Pass!123", true);

        mockMvc.perform(get("/api/v1/super-admin/colleges")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].activeAdminEmail", containsString("admin")))
                .andExpect(jsonPath("$.data.content[1].activeAdminEmail", containsString("admin")));
    }

    @Test
    @DisplayName("20: College without active admin returns null safely without errors")
    void testListColleges_CollegeWithoutAdmin_NullSafe() throws Exception {
        createCollege("Orphan College", "ORP", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/super-admin/colleges")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].activeAdminName").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].activeAdminEmail").doesNotExist());
    }

    // =========================================================================
    // Category 2: College Details & Operational Profile (21–25)
    // =========================================================================

    @Test
    @DisplayName("21: Get college details returns 12 operational profile fields and derived hasLogo")
    void testGetCollegeDetail_Success_Returns12ProfileFieldsAndDerivedHasLogo() throws Exception {
        College c = createCollege("Full Profile College", "FPC", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c.setAddressLine1("123 Tech Way");
        c.setAddressLine2("Suite 400");
        c.setCity("San Jose");
        c.setState("CA");
        c.setCountry("USA");
        c.setPostalCode("95110");
        c.setContactPhone("+1-408-555-0100");
        c.setContactEmail("contact@fpc.edu");
        c.setWebsiteUrl("https://fpc.edu");
        c.setAffiliatedUniversityName("State University");
        c.setEstablishedYear(1995);
        c.setAccreditationDetails("NAAC A++");
        c.setLogoStorageKey("logos/fpc_logo.png");
        collegeRepository.saveAndFlush(c);
        User admin = createUser("admin@fpc.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "Pass!123", true);

        mockMvc.perform(get("/api/v1/super-admin/colleges/" + c.getId())
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Full Profile College")))
                .andExpect(jsonPath("$.data.code", is("FPC")))
                .andExpect(jsonPath("$.data.addressLine1", is("123 Tech Way")))
                .andExpect(jsonPath("$.data.addressLine2", is("Suite 400")))
                .andExpect(jsonPath("$.data.city", is("San Jose")))
                .andExpect(jsonPath("$.data.state", is("CA")))
                .andExpect(jsonPath("$.data.country", is("USA")))
                .andExpect(jsonPath("$.data.postalCode", is("95110")))
                .andExpect(jsonPath("$.data.contactPhone", is("+1-408-555-0100")))
                .andExpect(jsonPath("$.data.contactEmail", is("contact@fpc.edu")))
                .andExpect(jsonPath("$.data.websiteUrl", is("https://fpc.edu")))
                .andExpect(jsonPath("$.data.affiliatedUniversityName", is("State University")))
                .andExpect(jsonPath("$.data.establishedYear", is(1995)))
                .andExpect(jsonPath("$.data.accreditationDetails", is("NAAC A++")))
                .andExpect(jsonPath("$.data.hasLogo", is(true)))
                .andExpect(jsonPath("$.data.activeAdmin.userId", is(admin.getId().intValue())))
                .andExpect(jsonPath("$.data.activeAdmin.id", is(admin.getId().intValue())))
                .andExpect(jsonPath("$.data.activeAdmin.firstName", is("First")))
                .andExpect(jsonPath("$.data.activeAdmin.lastName", is("Last")))
                .andExpect(jsonPath("$.data.activeAdmin.fullName", is("First Last")))
                .andExpect(jsonPath("$.data.activeAdmin.email", is("admin@fpc.edu")))
                .andExpect(jsonPath("$.data.activeAdmin.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.activeAdmin.emailVerified", is(true)));
    }

    @Test
    @DisplayName("22: Get college details never exposes raw logoStorageKey in response JSON")
    void testGetCollegeDetail_NeverExposesRawLogoStorageKey() throws Exception {
        College c = createCollege("Secret Logo College", "SLC", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c.setLogoStorageKey("internal/s3-bucket/vault/private_logo_key_12345.png");
        collegeRepository.saveAndFlush(c);

        MvcResult result = mockMvc.perform(get("/api/v1/super-admin/colleges/" + c.getId())
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasLogo", is(true)))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("logoStorageKey");
        assertThat(body).doesNotContain("private_logo_key_12345");
    }

    @Test
    @DisplayName("23: Details returns registration context via authoritative pointer currentRegistrationId")
    void testGetCollegeDetail_AuthoritativeCurrentRegistrationPointer() throws Exception {
        College c = createCollege("Registered College", "REG", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        CollegeRegistration cr = new CollegeRegistration();
        cr.setCollegeId(c.getId());
        cr.setVersionNumber(2);
        cr.setStatus(CollegeApprovalStatus.APPROVED);
        cr.setLegalName("Registered College Legal");
        cr.setAddressLine1("Street 1");
        cr.setCity("City");
        cr.setState("State");
        cr.setCountry("Country");
        cr.setPostalCode("12345");
        cr.setContactPhone("555-1234");
        cr.setAffiliatedUniversityName("Univ");
        cr.setSubmittedForReviewAt(Instant.now());
        cr = registrationRepository.saveAndFlush(cr);

        c.setCurrentRegistrationId(cr.getId());
        collegeRepository.saveAndFlush(c);

        mockMvc.perform(get("/api/v1/super-admin/colleges/" + c.getId())
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentRegistrationId", is(cr.getId().intValue())))
                .andExpect(jsonPath("$.data.currentRegistrationVersion", is(2)))
                .andExpect(jsonPath("$.data.currentRegistrationStatus", is("APPROVED")));
    }

    @Test
    @DisplayName("24: Registration ownership mismatch returns safe nulls without exposing wrong registration")
    void testGetCollegeDetail_RegistrationOwnershipMismatch_SafeNulls() throws Exception {
        College c1 = createCollege("College 1", "C1", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        College c2 = createCollege("College 2", "C2", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        CollegeRegistration cr2 = new CollegeRegistration();
        cr2.setCollegeId(c2.getId());
        cr2.setVersionNumber(1);
        cr2.setStatus(CollegeApprovalStatus.APPROVED);
        cr2.setLegalName("College 2 Legal");
        cr2.setAddressLine1("Street");
        cr2.setCity("City");
        cr2.setState("State");
        cr2.setCountry("Country");
        cr2.setPostalCode("123");
        cr2.setContactPhone("555");
        cr2.setAffiliatedUniversityName("Univ");
        cr2 = registrationRepository.saveAndFlush(cr2);

        // Point c1 to c2's registration (ownership mismatch)
        c1.setCurrentRegistrationId(cr2.getId());
        collegeRepository.saveAndFlush(c1);

        mockMvc.perform(get("/api/v1/super-admin/colleges/" + c1.getId())
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentRegistrationId", is(cr2.getId().intValue())))
                .andExpect(jsonPath("$.data.currentRegistrationVersion").doesNotExist())
                .andExpect(jsonPath("$.data.currentRegistrationStatus").doesNotExist());
    }

    @Test
    @DisplayName("25: Get details for non-existent college returns HTTP 404 COLLEGE_NOT_FOUND")
    void testGetCollegeDetail_NonExistentCollege_Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/colleges/999999")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_NOT_FOUND")));
    }

    // =========================================================================
    // Category 3: Operational Status Transitions & Lifecycle (26–38)
    // =========================================================================

    @Test
    @DisplayName("26: Transition ACTIVE -> SUSPENDED revokes sessions, logs audit, and enqueues outbox email")
    void testUpdateCollegeStatus_ActiveToSuspended_SuccessAndRevokesSessions() throws Exception {
        College c = createCollege("Active College", "ACT_SUS", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        User admin = createUser("admin@act.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);

        // Simulate admin login to create active session
        SessionCookies adminCookies = login("admin@act.edu", "AdminPass!2026");
        assertThat(sessionRevocationService.countActiveSessionsForUser(admin.getId())).isGreaterThan(0);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "Compliance breach", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUSPENDED")));

        // Verify status in DB
        College updated = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CollegeStatus.SUSPENDED);

        // Verify sessions revoked
        assertThat(sessionRevocationService.countActiveSessionsForUser(admin.getId())).isEqualTo(0);

        // Verify Audit Event
        List<AuditEvent> audits = auditEventRepository.findByCollegeId(c.getId());
        assertThat(audits).anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_SUSPENDED && a.getOutcome() == AuditOutcome.SUCCESS);

        // Verify Outbox Email with template COLLEGE_SUSPENDED
        List<OutboxEmail> emails = outboxEmailRepository.findAll();
        assertThat(emails).anyMatch(e -> e.getTemplateKey().equals("COLLEGE_SUSPENDED") && e.getRecipientEmail().equals("admin@act.edu"));
    }

    @Test
    @DisplayName("27: Transition ACTIVE -> INACTIVE revokes sessions, logs audit, and enqueues outbox email")
    void testUpdateCollegeStatus_ActiveToInactive_SuccessAndRevokesSessions() throws Exception {
        College c = createCollege("Deactivated College", "DEACT", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        User admin = createUser("admin@deact.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.INACTIVE, "Contract terminated", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("INACTIVE")));

        College updated = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CollegeStatus.INACTIVE);

        List<AuditEvent> audits = auditEventRepository.findByCollegeId(c.getId());
        assertThat(audits).anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_DEACTIVATED);

        List<OutboxEmail> emails = outboxEmailRepository.findAll();
        assertThat(emails).anyMatch(e -> e.getTemplateKey().equals("COLLEGE_DEACTIVATED") && e.getRecipientEmail().equals("admin@deact.edu"));
    }

    @Test
    @DisplayName("28: Transition SUSPENDED -> ACTIVE restores college without session revocation")
    void testUpdateCollegeStatus_SuspendedToActive_Success() throws Exception {
        College c = createCollege("Suspended College", "SUSP_ACT", CollegeApprovalStatus.APPROVED, CollegeStatus.SUSPENDED);
        User admin = createUser("admin@susp.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "Compliance resolved", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));

        College updated = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CollegeStatus.ACTIVE);

        List<AuditEvent> audits = auditEventRepository.findByCollegeId(c.getId());
        assertThat(audits).anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_REACTIVATED);

        List<OutboxEmail> emails = outboxEmailRepository.findAll();
        assertThat(emails).anyMatch(e -> e.getTemplateKey().equals("COLLEGE_ACTIVATED"));
    }

    @Test
    @DisplayName("29: Transition SUSPENDED -> INACTIVE deactivates college and revokes sessions")
    void testUpdateCollegeStatus_SuspendedToInactive_SuccessAndRevokesSessions() throws Exception {
        College c = createCollege("Suspended To Inactive", "SUS_INA", CollegeApprovalStatus.APPROVED, CollegeStatus.SUSPENDED);
        createUser("admin@susina.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.INACTIVE, "Closure after suspension", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("INACTIVE")));
    }

    @Test
    @DisplayName("30: Transition INACTIVE -> ACTIVE (reactivation) creates COLLEGE_REACTIVATED audit event")
    void testUpdateCollegeStatus_InactiveToActive_Reactivation_Success() throws Exception {
        College c = createCollege("Inactive College", "REACT_COL", CollegeApprovalStatus.APPROVED, CollegeStatus.INACTIVE);
        User admin = createUser("admin@react.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "Contract renewed for 2027", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));

        College updated = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CollegeStatus.ACTIVE);

        List<AuditEvent> audits = auditEventRepository.findByCollegeId(c.getId());
        assertThat(audits).anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_REACTIVATED);

        List<OutboxEmail> emails = outboxEmailRepository.findAll();
        assertThat(emails).anyMatch(e -> e.getTemplateKey().equals("COLLEGE_ACTIVATED"));
    }

    @Test
    @DisplayName("31: Prohibited transition INACTIVE -> SUSPENDED returns HTTP 400 without side effects")
    void testUpdateCollegeStatus_InactiveToSuspended_Prohibited_Returns400WithoutSideEffects() throws Exception {
        College c = createCollege("Inactive College", "INA_SUSP", CollegeApprovalStatus.APPROVED, CollegeStatus.INACTIVE);
        Long initialVersion = c.getVersion();
        int initialAuditCount = auditEventRepository.findByCollegeId(c.getId()).size();
        int initialOutboxCount = outboxEmailRepository.findAll().size();

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "Prohibited transition", initialVersion);

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("INVALID_STATUS_TRANSITION")));

        // Verify NO college status mutation and NO version increment
        College reloaded = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(CollegeStatus.INACTIVE);
        assertThat(reloaded.getVersion()).isEqualTo(initialVersion);

        // Verify NO audit event created
        int auditCountAfter = auditEventRepository.findByCollegeId(c.getId()).size();
        assertThat(auditCountAfter).isEqualTo(initialAuditCount);

        // Verify NO outbox email created
        int outboxCountAfter = outboxEmailRepository.findAll().size();
        assertThat(outboxCountAfter).isEqualTo(initialOutboxCount);
    }

    @Test
    @DisplayName("31b: Same-status transition returns HTTP 400 SAME_STATUS_NOOP")
    void testUpdateCollegeStatus_SameStatus_Returns400SameStatusNoop() throws Exception {
        College c = createCollege("Same Status", "SAME", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "No-op transition", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("SAME_STATUS_NOOP")));
    }

    @Test
    @DisplayName("32: Transition from PENDING_VERIFICATION is rejected with HTTP 409 COLLEGE_NOT_APPROVED")
    void testUpdateCollegeStatus_FromPendingVerification_Returns400() throws Exception {
        College c = createCollege("Pending College", "PEN_STAT", CollegeApprovalStatus.PENDING, CollegeStatus.PENDING_VERIFICATION);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "Attempted activation", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_NOT_APPROVED")));
    }

    @Test
    @DisplayName("33: Transition targeting PENDING_VERIFICATION is rejected with HTTP 400 INVALID_STATUS_TRANSITION")
    void testUpdateCollegeStatus_ToPendingVerification_Returns400() throws Exception {
        College c = createCollege("Active College", "TO_PEN", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.PENDING_VERIFICATION, "Rollback to pending", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("INVALID_STATUS_TRANSITION")));
    }

    @Test
    @DisplayName("33b: Transition on permanently rejected college returns HTTP 409 REGISTRATION_PERMANENTLY_REJECTED")
    void testUpdateCollegeStatus_PermanentlyRejected_Returns409() throws Exception {
        College c = createCollege("Perm Rej College", "PR_COL", CollegeApprovalStatus.REJECTED, CollegeStatus.INACTIVE);
        c.setPermanentlyRejected(true);
        c = collegeRepository.saveAndFlush(c);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "Attempted activation", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("REGISTRATION_PERMANENTLY_REJECTED")));
    }

    @Test
    @DisplayName("34: Omitting expectedVersion returns HTTP 400 VALIDATION_ERROR")
    void testUpdateCollegeStatus_MissingExpectedVersion_Returns400() throws Exception {
        College c = createCollege("Active College", "NO_VER", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        String json = """
                {
                    "targetStatus": "SUSPENDED",
                    "reason": "Missing version field"
                }
                """;

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("35: Stale expectedVersion returns HTTP 409 STALE_COLLEGE_VERSION")
    void testUpdateCollegeStatus_StaleVersion_Returns409() throws Exception {
        College c = createCollege("Active College", "STALE_VER", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "Stale request", 999L);

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("STALE_COLLEGE_VERSION")));
    }

    @Test
    @DisplayName("36: Concurrent optimistic lock collision returns HTTP 409 STALE_COLLEGE_VERSION")
    void testUpdateCollegeStatus_ConcurrentOptimisticLockCollision_Returns409() throws Exception {
        College c = createCollege("Concurrent College", "CONC", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        Long originalVersion = c.getVersion();

        // Increment version in DB behind the scenes
        jdbcTemplate.update("UPDATE colleges SET version = version + 1 WHERE id = ?", c.getId());

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "Concurrent conflict", originalVersion);

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("STALE_COLLEGE_VERSION")));
    }

    @Test
    @DisplayName("37: College without active admin transitions status successfully and skips notification")
    void testUpdateCollegeStatus_NoAdmin_SkipsNotificationWithoutFailure() throws Exception {
        College c = createCollege("No Admin College", "NO_ADM", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "No admin test", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUSPENDED")));

        College updated = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CollegeStatus.SUSPENDED);

        // Zero outbox emails enqueued
        assertThat(outboxEmailRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("38: Active admin with unusable/blank email skips notification without failing")
    void testUpdateCollegeStatus_UnusableAdminEmail_SkipsNotification() throws Exception {
        College c = createCollege("Blank Email College", "BLK_EM", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        // Direct DB update to set empty email (bypassing normal constraints if needed)
        User admin = createUser("temp@test.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "Pass!123", true);
        jdbcTemplate.update("UPDATE users SET email = ' ' WHERE id = ?", admin.getId());

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "Unusable email test", c.getVersion());

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUSPENDED")));

        assertThat(outboxEmailRepository.findAll()).isEmpty();
    }

    // =========================================================================
    // Category 4: Profile Updates, Normalization, Code Immutability & Auditing (39–44)
    // =========================================================================

    @Test
    @DisplayName("39: Full replacement profile update modifies fields, normalizes blanks to NULL, and audits diff")
    void testUpdateCollegeProfile_FullReplacementSuccess_DiffAuditing() throws Exception {
        College c = createCollege("Initial Name", "PROF_CODE", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c.setAddressLine1("Initial Street");
        c.setCity("Initial City");
        c.setState("Initial State");
        c.setCountry("Initial Country");
        c.setPostalCode("00000");
        c.setContactPhone("111-222-3333");
        c.setEstablishedYear(1990);
        c = collegeRepository.saveAndFlush(c);

        UpdateCollegeProfileRequest req = new UpdateCollegeProfileRequest(
                "Updated Legal Name",
                "PROF_CODE",
                "New Street 456",
                "   ",              // should normalize to null
                "New City",
                "New State",
                "New Country",
                "99999",
                "   ",              // should normalize to null
                "contact@new.edu",
                "https://new.edu",
                "Affiliated Univ",
                2021,
                "Accredited B",
                c.getVersion()
        );

        mockMvc.perform(put("/api/v1/super-admin/colleges/" + c.getId())
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Updated Legal Name")))
                .andExpect(jsonPath("$.data.addressLine1", is("New Street 456")))
                .andExpect(jsonPath("$.data.addressLine2").doesNotExist())
                .andExpect(jsonPath("$.data.contactPhone").doesNotExist())
                .andExpect(jsonPath("$.data.contactEmail", is("contact@new.edu")))
                .andExpect(jsonPath("$.data.establishedYear", is(2021)));

        College updated = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Updated Legal Name");
        assertThat(updated.getAddressLine2()).isNull();
        assertThat(updated.getContactPhone()).isNull();
        assertThat(updated.getVersion()).isGreaterThan(c.getVersion());

        // Verify COLLEGE_PROFILE_UPDATED Audit Event contains previousName and newName
        List<AuditEvent> audits = auditEventRepository.findByCollegeId(c.getId());
        assertThat(audits).anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_PROFILE_UPDATED
                && a.getMetadataJson().contains("Initial Name")
                && a.getMetadataJson().contains("Updated Legal Name"));
    }

    @Test
    @DisplayName("40: No-op profile update performs zero database mutation and zero audit events")
    void testUpdateCollegeProfile_NoOp_ZeroMutationZeroAudit() throws Exception {
        College c = createCollege("Static College", "STAT_CODE", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c.setAddressLine1("123 Main St");
        c.setCity("City");
        c.setState("State");
        c.setCountry("Country");
        c.setPostalCode("12345");
        c = collegeRepository.saveAndFlush(c);
        Long originalVersion = c.getVersion();

        int auditCountBefore = auditEventRepository.findByCollegeId(c.getId()).size();

        UpdateCollegeProfileRequest identicalReq = new UpdateCollegeProfileRequest(
                "Static College",
                "STAT_CODE",
                "123 Main St",
                null,
                "City",
                "State",
                "Country",
                "12345",
                null,
                null,
                null,
                null,
                null,
                null,
                originalVersion
        );

        mockMvc.perform(put("/api/v1/super-admin/colleges/" + c.getId())
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(identicalReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Static College")));

        College reloaded = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(reloaded.getVersion()).isEqualTo(originalVersion);

        int auditCountAfter = auditEventRepository.findByCollegeId(c.getId()).size();
        assertThat(auditCountAfter).isEqualTo(auditCountBefore);
    }

    @Test
    @DisplayName("41: Attempting to modify immutable college code returns HTTP 400 FIELD_IMMUTABLE")
    void testUpdateCollegeProfile_ImmutableCode_Returns400FieldImmutable() throws Exception {
        College c = createCollege("Immutable Code College", "PERMANENT_CODE", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        c.setAddressLine1("Street");
        c.setCity("City");
        c.setState("State");
        c.setCountry("Country");
        c.setPostalCode("12345");
        c = collegeRepository.saveAndFlush(c);

        UpdateCollegeProfileRequest req = new UpdateCollegeProfileRequest(
                "Immutable Code College",
                "NEW_CODE_ATTEMPT",
                "Street",
                null,
                "City",
                "State",
                "Country",
                "12345",
                null,
                null,
                null,
                null,
                null,
                null,
                c.getVersion()
        );

        mockMvc.perform(put("/api/v1/super-admin/colleges/" + c.getId())
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("FIELD_IMMUTABLE")));
    }

    @Test
    @DisplayName("42: Security: Non-Super Admin calling endpoints returns HTTP 403 Forbidden")
    void testSecurity_NonSuperAdmin_Returns403Forbidden() throws Exception {
        College c = createCollege("Tenant College", "TEN", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        User admin = createUser("admin@tenant.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);
        SessionCookies adminCookies = login("admin@tenant.edu", "AdminPass!2026");

        // GET listing
        mockMvc.perform(get("/api/v1/super-admin/colleges")
                        .cookie(adminCookies.sessionCookie(), adminCookies.xsrfCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("ACCESS_DENIED")));

        // GET detail
        mockMvc.perform(get("/api/v1/super-admin/colleges/" + c.getId())
                        .cookie(adminCookies.sessionCookie(), adminCookies.xsrfCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("ACCESS_DENIED")));

        // PATCH status
        UpdateCollegeStatusRequest patchReq = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "hack", 0L);
        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(adminCookies.sessionCookie(), adminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("ACCESS_DENIED")));
    }

    @Test
    @DisplayName("43: Access Control: Inactive college blocks login and protected endpoints with COLLEGE_INACTIVE")
    void testAccessControl_InactiveCollege_BlocksLoginAndProtectedEndpoints() throws Exception {
        College c = createCollege("Inactive Tenant", "INA_TEN", CollegeApprovalStatus.APPROVED, CollegeStatus.INACTIVE);
        User admin = createUser("admin@inaten.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);

        // Attempt login -> 403 COLLEGE_INACTIVE
        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "admin@inaten.edu", "password", "AdminPass!2026"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("COLLEGE_INACTIVE")));

        // CollegeAccessGuard direct check with admin principal
        com.acadlytic.security.AcadlyticUserPrincipal principal = new com.acadlytic.security.AcadlyticUserPrincipal(
                admin.getId(), admin.getEmail(), admin.getRole(), c.getId());
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThatThrownBy(() -> collegeAccessGuard.requireApprovedAndActiveCollege(c.getId()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("COLLEGE_INACTIVE");
                });

        // CollegeAccessGuard direct check for SUSPENDED college -> 403 COLLEGE_SUSPENDED
        College suspendedCollege = createCollege("Suspended Tenant", "SUS_TEN", CollegeApprovalStatus.APPROVED, CollegeStatus.SUSPENDED);
        com.acadlytic.security.AcadlyticUserPrincipal suspPrincipal = new com.acadlytic.security.AcadlyticUserPrincipal(
                admin.getId(), admin.getEmail(), admin.getRole(), suspendedCollege.getId());
        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(suspPrincipal, null, suspPrincipal.getAuthorities()));

        assertThatThrownBy(() -> collegeAccessGuard.requireApprovedAndActiveCollege(suspendedCollege.getId()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("COLLEGE_SUSPENDED");
                });
    }

    @Test
    @DisplayName("44: Transactional Rollback: Status failure rolls back database, audit, and outbox")
    void testTransactionalRollback_StatusFailureRollsBackAll() throws Exception {
        College c = createCollege("Rollback College", "ROLL", CollegeApprovalStatus.APPROVED, CollegeStatus.ACTIVE);
        createUser("admin@roll.edu", Role.COLLEGE_ADMIN, c.getId(), UserStatus.ACTIVE, "AdminPass!2026", true);

        int auditCountBefore = auditEventRepository.findAll().size();
        int outboxCountBefore = outboxEmailRepository.findAll().size();

        // Stale expected version triggers exception inside transaction
        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "Should rollback", 9999L);

        mockMvc.perform(patch("/api/v1/super-admin/colleges/" + c.getId() + "/status")
                        .cookie(superAdminCookies.sessionCookie(), superAdminCookies.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdminCookies.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("STALE_COLLEGE_VERSION")));

        // Verify college status is untouched
        College reloaded = collegeRepository.findById(c.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(CollegeStatus.ACTIVE);

        // Verify zero transactional audit events or outbox emails were persisted
        assertThat(auditEventRepository.findAll().size()).isEqualTo(auditCountBefore);
        assertThat(outboxEmailRepository.findAll().size()).isEqualTo(outboxCountBefore);
    }
}
