package com.acadlytic.modules.colleges;

import com.acadlytic.common.dto.PageResponse;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.dto.ReviewDecisionAction;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewQueueItemResponse;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.service.CollegeReviewService;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManagerFactory;
import jakarta.servlet.http.Cookie;
import org.hibernate.SessionFactory;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CollegeReviewIntegrationTest extends AbstractMySqlIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private CollegeRepository collegeRepository;
    @Autowired
    private CollegeRegistrationRepository registrationRepository;
    @Autowired
    private CollegeRegistrationDocumentRepository documentRepository;
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
    private DocumentStorageService documentStorageService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private CollegeReviewService collegeReviewService;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @SpyBean
    private AuditEventService auditEventService;

    private static final String SUPER_ADMIN_EMAIL = "superadmin@acadlytic.com";
    private static final String SUPER_ADMIN_PASS = "SuperAdminSecretPass!2026";
    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4 sample verification document".getBytes(StandardCharsets.US_ASCII);

    @BeforeEach
    void cleanState() {
        SecurityContextHolder.clearContext();
        ipRateLimiter.clear();
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION_ATTRIBUTES");
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION");
        jdbcTemplate.execute("UPDATE colleges SET current_registration_id = NULL");
        jdbcTemplate.execute("UPDATE college_registration_documents SET replaces_document_id = NULL");
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
        reset(auditEventService);
        cleanState();
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

    private SessionCookies setupSuperAdmin() throws Exception {
        User superAdmin = new User();
        superAdmin.setEmail(SUPER_ADMIN_EMAIL);
        superAdmin.setFirstName("Super");
        superAdmin.setLastName("Admin");
        superAdmin.setRole(Role.SUPER_ADMIN);
        superAdmin.setStatus(UserStatus.ACTIVE);
        superAdmin.setPasswordHash(passwordEncoder.encode(SUPER_ADMIN_PASS));
        superAdmin.setEmailVerifiedAt(Instant.now());
        userRepository.saveAndFlush(superAdmin);
        return login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASS);
    }

    private record CollegeContext(College college, CollegeRegistration registration, User adminUser) {}

    private CollegeContext seedPendingCollegeWithAdminAndDocs(String code, String name, String email) {
        College college = new College();
        college.setName(name);
        college.setCode(code);
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college = collegeRepository.saveAndFlush(college);

        CollegeRegistration reg = new CollegeRegistration();
        reg.setCollegeId(college.getId());
        reg.setVersionNumber(1);
        reg.setStatus(CollegeApprovalStatus.PENDING);
        reg.setLegalName(name);
        reg.setAddressLine1("Campus Road");
        reg.setCity("Metropolis");
        reg.setState("State");
        reg.setCountry("India");
        reg.setPostalCode("123456");
        reg.setContactPhone("+919876543210");
        reg.setAffiliatedUniversityName("Central University");
        reg.setSubmittedForReviewAt(Instant.now());
        reg = registrationRepository.saveAndFlush(reg);

        college.setCurrentRegistrationId(reg.getId());
        college = collegeRepository.saveAndFlush(college);

        User admin = new User();
        admin.setEmail(email);
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setRole(Role.COLLEGE_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setCollegeId(college.getId());
        admin.setPasswordHash(passwordEncoder.encode("AdminPass!2026"));
        admin.setEmailVerifiedAt(Instant.now());
        admin = userRepository.saveAndFlush(admin);

        var stored = documentStorageService.store(VALID_PDF_BYTES, "affiliation.pdf", "application/pdf", "checksum123");
        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setCollegeId(college.getId());
        doc.setRegistrationId(reg.getId());
        doc.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc.setOriginalFilename("affiliation.pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc.setSha256Checksum("checksum123");
        doc.setStorageKey(stored.storageKey());
        documentRepository.saveAndFlush(doc);

        return new CollegeContext(college, reg, admin);
    }

    @Test
    @DisplayName("Scenario 1: Bounded query count (eliminating N+1 queries)")
    void pendingQueue_batchedRetrieval_executesWithBoundedQueryCount_eliminatingNPlusOne() {
        for (int i = 1; i <= 5; i++) {
            seedPendingCollegeWithAdminAndDocs("COLL" + i, "College " + i, "admin" + i + "@coll.edu");
        }

        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        sessionFactory.getStatistics().setStatisticsEnabled(true);
        sessionFactory.getStatistics().clear();

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, "submittedForReviewAt,asc");

        long statementCount = sessionFactory.getStatistics().getPrepareStatementCount();

        assertThat(response.content()).hasSize(5);
        // Architectural guarantee: bounded O(1) queries (at most 5 SQL queries across the 5 operations)
        assertThat(statementCount).isLessThanOrEqualTo(5L);
    }

    @Test
    @DisplayName("Scenario 2: documentCount in queue reflects only active, non-superseded documents")
    void pendingQueue_documentCount_excludesSupersededDocuments() {
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-DOC", "College Docs", "admin@docs.edu");

        // Add a second document that supersedes the first document
        CollegeRegistrationDocument doc1 = documentRepository.findByRegistrationId(ctx.registration().getId()).getFirst();
        var stored2 = documentStorageService.store(VALID_PDF_BYTES, "affiliation_v2.pdf", "application/pdf", "checksum456");

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setCollegeId(ctx.college().getId());
        doc2.setRegistrationId(ctx.registration().getId());
        doc2.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc2.setOriginalFilename("affiliation_v2.pdf");
        doc2.setMimeType("application/pdf");
        doc2.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc2.setSha256Checksum("checksum456");
        doc2.setStorageKey(stored2.storageKey());
        doc2.setReplacesDocumentId(doc1.getId());
        documentRepository.saveAndFlush(doc2);

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                "COLL-DOC", null, null, 0, 20, null);

        assertThat(response.content()).hasSize(1);
        // doc1 is superseded by doc2, active count is 1
        assertThat(response.content().getFirst().documentCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Scenario 3: eligible Admin lookup maps only active College Admin")
    void pendingQueue_eligibleAdminLookup_mapsOnlyActiveCollegeAdmin() {
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-ADM", "College Adm", "admin@adm.edu");

        // Add an inactive user for the same college
        User inactiveUser = new User();
        inactiveUser.setEmail("inactive@adm.edu");
        inactiveUser.setFirstName("Inactive");
        inactiveUser.setLastName("User");
        inactiveUser.setRole(Role.COLLEGE_ADMIN);
        inactiveUser.setStatus(UserStatus.INACTIVE);
        inactiveUser.setCollegeId(ctx.college().getId());
        inactiveUser.setPasswordHash(passwordEncoder.encode("Pass!2026"));
        userRepository.saveAndFlush(inactiveUser);

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                "COLL-ADM", null, null, 0, 20, null);

        assertThat(response.content()).hasSize(1);
        ReviewQueueItemResponse item = response.content().getFirst();
        assertThat(item.adminEmail()).isEqualTo("admin@adm.edu");
        assertThat(item.adminName()).isEqualTo("Admin User");
    }

    @Test
    @DisplayName("Scenario 4: unsubmitted drafts excluded while submitted pending revisions included")
    void pendingQueue_excludesUnsubmittedDrafts_andIncludesSubmittedPending() {
        // Submitted pending college
        seedPendingCollegeWithAdminAndDocs("COLL-SUB", "Submitted Coll", "admin@sub.edu");

        // Unsubmitted draft college
        College draftCollege = new College();
        draftCollege.setName("Draft College");
        draftCollege.setCode("COLL-DRAFT");
        draftCollege.setApprovalStatus(CollegeApprovalStatus.PENDING);
        draftCollege.setStatus(CollegeStatus.PENDING_VERIFICATION);
        draftCollege = collegeRepository.saveAndFlush(draftCollege);

        CollegeRegistration draftReg = new CollegeRegistration();
        draftReg.setCollegeId(draftCollege.getId());
        draftReg.setVersionNumber(1);
        draftReg.setStatus(CollegeApprovalStatus.PENDING);
        draftReg.setLegalName("Draft College");
        draftReg.setAddressLine1("Campus Road");
        draftReg.setCity("City");
        draftReg.setState("State");
        draftReg.setCountry("India");
        draftReg.setPostalCode("123456");
        draftReg.setContactPhone("+919876543210");
        draftReg.setAffiliatedUniversityName("Univ");
        draftReg.setSubmittedForReviewAt(null); // Unsubmitted!
        draftReg = registrationRepository.saveAndFlush(draftReg);

        draftCollege.setCurrentRegistrationId(draftReg.getId());
        collegeRepository.saveAndFlush(draftCollege);

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, null);

        assertThat(response.content()).hasSize(1);
        assertThat(response.content().getFirst().collegeCode()).isEqualTo("COLL-SUB");
    }

    @Test
    @DisplayName("Scenario 5: excludes ACTION_REQUIRED predecessor while correction draft is open")
    void pendingQueue_excludesActionRequiredPredecessor_whileCorrectionDraftOpen() {
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-CORR", "College Corr", "admin@corr.edu");

        // Simulate Action Required on Rev 1
        ctx.registration().setStatus(CollegeApprovalStatus.ACTION_REQUIRED);
        ctx.registration().setReviewNotes("Fix certificates.");
        ctx.registration().setReviewedAt(Instant.now());
        registrationRepository.saveAndFlush(ctx.registration());

        ctx.college().setApprovalStatus(CollegeApprovalStatus.ACTION_REQUIRED);
        collegeRepository.saveAndFlush(ctx.college());

        // Open Draft Rev 2
        CollegeRegistration rev2 = new CollegeRegistration();
        rev2.setCollegeId(ctx.college().getId());
        rev2.setVersionNumber(2);
        rev2.setStatus(CollegeApprovalStatus.PENDING);
        rev2.setLegalName("College Corr v2");
        rev2.setAddressLine1("Campus Road");
        rev2.setCity("City");
        rev2.setState("State");
        rev2.setCountry("India");
        rev2.setPostalCode("123456");
        rev2.setContactPhone("+919876543210");
        rev2.setAffiliatedUniversityName("Univ");
        rev2.setSubmittedForReviewAt(null); // Draft open!
        registrationRepository.saveAndFlush(rev2);

        // Current pointer still points to Rev 1
        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                "COLL-CORR", null, null, 0, 20, null);

        assertThat(response.content()).isEmpty();
    }

    @Test
    @DisplayName("Scenario 6: includes resubmitted revision after correction submit")
    void pendingQueue_includesResubmittedRevision_afterCorrectionSubmit() {
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-RESUB", "College Resub", "admin@resub.edu");

        // Simulate resubmission Rev 2
        CollegeRegistration rev2 = new CollegeRegistration();
        rev2.setCollegeId(ctx.college().getId());
        rev2.setVersionNumber(2);
        rev2.setStatus(CollegeApprovalStatus.PENDING);
        rev2.setLegalName("College Resub v2");
        rev2.setAddressLine1("Campus Road");
        rev2.setCity("City");
        rev2.setState("State");
        rev2.setCountry("India");
        rev2.setPostalCode("123456");
        rev2.setContactPhone("+919876543210");
        rev2.setAffiliatedUniversityName("Univ");
        rev2.setSubmittedForReviewAt(Instant.now()); // Submitted!
        rev2 = registrationRepository.saveAndFlush(rev2);

        ctx.college().setCurrentRegistrationId(rev2.getId());
        ctx.college().setApprovalStatus(CollegeApprovalStatus.PENDING);
        ctx.college().setResubmissionCount(1);
        ctx.college().setActionRequiredCount(1);
        collegeRepository.saveAndFlush(ctx.college());

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                "COLL-RESUB", null, null, 0, 20, null);

        assertThat(response.content()).hasSize(1);
        ReviewQueueItemResponse item = response.content().getFirst();
        assertThat(item.versionNumber()).isEqualTo(2);
        assertThat(item.registrationId()).isEqualTo(rev2.getId());
        assertThat(item.resubmissionCount()).isEqualTo(1);
        assertThat(item.actionRequiredCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Scenario 7: excludes approved and rejected applications from pending queue")
    void pendingQueue_excludesApprovedAndRejectedApplications() {
        CollegeContext ctx1 = seedPendingCollegeWithAdminAndDocs("COLL-APP", "Approved Coll", "admin@app.edu");
        ctx1.college().setApprovalStatus(CollegeApprovalStatus.APPROVED);
        ctx1.registration().setStatus(CollegeApprovalStatus.APPROVED);
        collegeRepository.saveAndFlush(ctx1.college());
        registrationRepository.saveAndFlush(ctx1.registration());

        CollegeContext ctx2 = seedPendingCollegeWithAdminAndDocs("COLL-REJ", "Rejected Coll", "admin@rej.edu");
        ctx2.college().setApprovalStatus(CollegeApprovalStatus.REJECTED);
        ctx2.registration().setStatus(CollegeApprovalStatus.REJECTED);
        collegeRepository.saveAndFlush(ctx2.college());
        registrationRepository.saveAndFlush(ctx2.registration());

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, null);

        assertThat(response.content()).isEmpty();
    }

    @Test
    @DisplayName("Scenario 8: excludes permanently rejected and archived colleges")
    void pendingQueue_excludesPermanentlyRejectedAndArchivedColleges() {
        CollegeContext ctx1 = seedPendingCollegeWithAdminAndDocs("COLL-PERM", "Perm Rej", "admin@perm.edu");
        ctx1.college().setPermanentlyRejected(true);
        collegeRepository.saveAndFlush(ctx1.college());

        CollegeContext ctx2 = seedPendingCollegeWithAdminAndDocs("COLL-ARCH", "Archived", "admin@arch.edu");
        ctx2.college().setArchivedAt(Instant.now());
        collegeRepository.saveAndFlush(ctx2.college());

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, null);

        assertThat(response.content()).isEmpty();
    }

    @Test
    @DisplayName("Scenario 9: pagination and deterministic sorting operate correctly on MySQL")
    void pendingQueue_paginationAndDeterministicSorting_operatesCorrectlyOnMySQL() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();

        Instant t0 = Instant.now().minusSeconds(7200);
        Instant t1 = Instant.now().minusSeconds(3600);
        Instant t2 = Instant.now().minusSeconds(1800);

        CollegeContext c1 = seedPendingCollegeWithAdminAndDocs("SORT1", "Alpha Tech", "a@sort.edu");
        c1.registration().setSubmittedForReviewAt(t0);
        registrationRepository.saveAndFlush(c1.registration());

        CollegeContext c2 = seedPendingCollegeWithAdminAndDocs("SORT2", "Beta Tech", "b@sort.edu");
        c2.registration().setSubmittedForReviewAt(t1);
        registrationRepository.saveAndFlush(c2.registration());

        CollegeContext c3 = seedPendingCollegeWithAdminAndDocs("SORT3", "Gamma Tech", "c@sort.edu");
        c3.registration().setSubmittedForReviewAt(t2);
        registrationRepository.saveAndFlush(c3.registration());

        // Page 0, Size 2, submittedForReviewAt,asc
        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .param("page", "0")
                        .param("size", "2")
                        .param("sort", "submittedForReviewAt,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].collegeCode").value("SORT1"))
                .andExpect(jsonPath("$.data.content[1].collegeCode").value("SORT2"))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.last").value(false));

        // Search query filter
        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .param("search", "Gamma"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].collegeCode").value("SORT3"));
    }

    @Test
    @DisplayName("Scenario 10: reviewDetail rejects non-pending applications with 409 Conflict")
    void reviewDetail_rejectsNonPendingApplicationsWithConflict() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();

        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-NOTPEND", "Not Pending", "admin@notpend.edu");
        ctx.college().setApprovalStatus(CollegeApprovalStatus.ACTION_REQUIRED);
        collegeRepository.saveAndFlush(ctx.college());

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));
    }

    @Test
    @DisplayName("Scenario 11: documentDownload multi-point ownership validation blocks cross-tenant access with 404")
    void documentDownload_multiPointOwnershipValidation_blocksCrossTenantAccess() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();

        CollegeContext colA = seedPendingCollegeWithAdminAndDocs("COLL-A", "College A", "admin@colla.edu");
        CollegeContext colB = seedPendingCollegeWithAdminAndDocs("COLL-B", "College B", "admin@collb.edu");

        CollegeRegistrationDocument docA = documentRepository.findByRegistrationId(colA.registration().getId()).getFirst();

        // Attempting to download docA under colB's URL path
        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/" + colB.college().getId() + "/documents/" + docA.getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));

        // Valid download under colA succeeds with safe headers
        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/" + colA.college().getId() + "/documents/" + docA.getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/pdf"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-cache, no-store, must-revalidate"))
                .andExpect(content().bytes(VALID_PDF_BYTES));
    }

    @Test
    @DisplayName("Scenario 12: approveDecision transitions revision and college, and records audit event")
    void approveDecision_transitionsRevisionAndCollege_andRecordsAudit() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-APPV", "Approve Coll", "admin@appv.edu");

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "All documents verified.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        College refreshedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistration refreshedReg = registrationRepository.findById(ctx.registration().getId()).orElseThrow();

        assertThat(refreshedCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        // Operational status transitions to ACTIVE upon approval (Module 3.5)
        assertThat(refreshedCollege.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
        assertThat(refreshedReg.getStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(refreshedReg.getReviewNotes()).isEqualTo("All documents verified.");
        assertThat(refreshedReg.getReviewedAt()).isNotNull();

        assertThat(auditEventRepository.findByCollegeId(ctx.college().getId()))
                .anyMatch(event -> event.getEventType() == AuditEventType.COLLEGE_REGISTRATION_APPROVED)
                .anyMatch(event -> event.getEventType() == AuditEventType.COLLEGE_ACTIVATED);
    }

    @Test
    @DisplayName("Scenario 13: requestActionDecision does not increment actionRequiredCount by itself")
    void requestActionDecision_doesNotIncrementActionRequiredCount_byItself() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-REQACT", "Req Action Coll", "admin@reqact.edu");

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, ctx.college().getVersion(), "Affiliation certificate seal is unreadable.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("ACTION_REQUIRED"));

        College refreshedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistration refreshedReg = registrationRepository.findById(ctx.registration().getId()).orElseThrow();

        assertThat(refreshedCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);
        // Invariant: actionRequiredCount is NOT incremented during review decision (Module 3.3 increments upon submit)
        assertThat(refreshedCollege.getActionRequiredCount()).isEqualTo(0);
        assertThat(refreshedReg.getStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);
        assertThat(refreshedReg.getReviewNotes()).isEqualTo("Affiliation certificate seal is unreadable.");

        assertThat(auditEventRepository.findByCollegeId(ctx.college().getId()))
                .anyMatch(event -> event.getEventType() == AuditEventType.COLLEGE_REGISTRATION_ACTION_REQUIRED);
    }

    @Test
    @DisplayName("Scenario 14: requestActionDecision blocked when 10 action rounds exceeded")
    void requestActionDecision_blockedWhenTenActionRoundsExceeded() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-MAXACT", "Max Action Coll", "admin@maxact.edu");

        ctx.college().setActionRequiredCount(10);
        College savedCollege = collegeRepository.saveAndFlush(ctx.college());

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, savedCollege.getVersion(), "Round 11 correction requested.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MAX_ACTION_REQUIRED_LIMIT_EXCEEDED"));
    }

    @Test
    @DisplayName("Scenario 15: non-permanent rejectDecision preserves resubmission allowance")
    void rejectDecision_nonPermanent_preservesResubmissionAllowance() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-REJNP", "Reject Coll", "admin@rejnp.edu");

        ctx.college().setResubmissionCount(1);
        College savedCollege = collegeRepository.saveAndFlush(ctx.college());

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, savedCollege.getVersion(), null, "Application documents fail UGC standards.");

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        College refreshedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistration refreshedReg = registrationRepository.findById(ctx.registration().getId()).orElseThrow();

        assertThat(refreshedCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(refreshedCollege.isPermanentlyRejected()).isFalse();
        assertThat(refreshedReg.getStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(refreshedReg.getRejectionReason()).isEqualTo("Application documents fail UGC standards.");

        assertThat(auditEventRepository.findByCollegeId(ctx.college().getId()))
                .anyMatch(event -> event.getEventType() == AuditEventType.COLLEGE_REGISTRATION_REJECTED);
    }

    @Test
    @DisplayName("Scenario 16: stale expectedVersion rejected with 409 Conflict")
    void concurrency_staleVersionRejectedWithConflict() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-STALE", "Stale Coll", "admin@stale.edu");

        // expectedVersion passed is 99, but actual college version is 0
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 99L, "Approved.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("STALE_APPLICATION_VERSION"));
    }

    @Test
    @DisplayName("Scenario 17: transaction rollback on validation failure preserves original state")
    void transactionRollback_onException_preservesOriginalState() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-ROLLBK", "Rollback Coll", "admin@rollbk.edu");

        // Passing review notes shorter than 10 characters -> fails validation
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, ctx.college().getVersion(), "Short", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        College refreshedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistration refreshedReg = registrationRepository.findById(ctx.registration().getId()).orElseThrow();

        // State remains pristine PENDING
        assertThat(refreshedCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(refreshedReg.getStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(refreshedReg.getReviewNotes()).isNull();

        assertThat(auditEventRepository.findByCollegeId(ctx.college().getId())).isEmpty();
    }

    @Test
    @DisplayName("Access Control: unauthenticated request returns 401 Unauthorized")
    void accessControl_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Verification: Bounded query count across page sizes (1, 5, 20) and empty page, ruling out N+1")
    void pendingQueue_queryCountVerification_independentOfPageSize_rulingOutNPlusOne() {
        // Seed 25 eligible colleges awaiting review, each with submitted registration, active admin, and 2 documents
        for (int i = 1; i <= 25; i++) {
            seedPendingCollegeWithAdminAndDocs("COLL-Q" + String.format("%02d", i), "College Q" + i, "admin" + i + "@qcoll.edu");
        }

        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        sessionFactory.getStatistics().setStatisticsEnabled(true);

        // Case 1: Empty Page (filtered search yielding 0 results)
        sessionFactory.getStatistics().clear();
        PageResponse<ReviewQueueItemResponse> emptyResponse = collegeReviewService.getPendingReviewQueue(
                "NON_EXISTENT_COLLEGE_SEARCH", null, null, 0, 20, "submittedForReviewAt,asc");
        long emptyQueryCount = sessionFactory.getStatistics().getPrepareStatementCount();
        assertThat(emptyResponse.content()).isEmpty();
        // Count query executes (1 query); data and batch queries skipped
        assertThat(emptyQueryCount).isEqualTo(1L);

        // Case 2: Page Size 1 (1 item on page)
        sessionFactory.getStatistics().clear();
        PageResponse<ReviewQueueItemResponse> page1Response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 1, "submittedForReviewAt,asc");
        long page1QueryCount = sessionFactory.getStatistics().getPrepareStatementCount();
        assertThat(page1Response.content()).hasSize(1);
        assertThat(page1Response.totalElements()).isEqualTo(25L);
        assertThat(page1Response.totalPages()).isEqualTo(25);
        // Exactly 5 queries: count + data + batch colleges + batch admins + batch documents
        assertThat(page1QueryCount).isEqualTo(5L);

        // Case 3: Page Size 5 (5 items on page)
        sessionFactory.getStatistics().clear();
        PageResponse<ReviewQueueItemResponse> page5Response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 5, "submittedForReviewAt,asc");
        long page5QueryCount = sessionFactory.getStatistics().getPrepareStatementCount();
        assertThat(page5Response.content()).hasSize(5);
        assertThat(page5Response.totalElements()).isEqualTo(25L);
        assertThat(page5Response.totalPages()).isEqualTo(5);
        // Exactly 5 queries: query count unchanged despite 5x increase in page size
        assertThat(page5QueryCount).isEqualTo(5L);

        // Case 4: Page Size 20 (20 items on page)
        sessionFactory.getStatistics().clear();
        PageResponse<ReviewQueueItemResponse> page20Response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, "submittedForReviewAt,asc");
        long page20QueryCount = sessionFactory.getStatistics().getPrepareStatementCount();
        assertThat(page20Response.content()).hasSize(20);
        assertThat(page20Response.totalElements()).isEqualTo(25L);
        assertThat(page20Response.totalPages()).isEqualTo(2);
        // Exactly 5 queries: query count unchanged despite 20x increase in page size
        assertThat(page20QueryCount).isEqualTo(5L);

        // Definitive assertion: Query count is strictly bounded and constant (O(1)) independent of page size
        assertThat(page1QueryCount)
                .isEqualTo(page5QueryCount)
                .isEqualTo(page20QueryCount)
                .isEqualTo(5L);
    }

    @Test
    @DisplayName("Verification: Transaction rollback after mutation and audit persistence preserves original state")
    void transactionRollback_postMutationFailure_rollsBackReviewStatusAndAuditEvent() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-ATOMIC", "Atomic Coll", "admin@atomic.edu");

        Long collegeId = ctx.college().getId();
        Long registrationId = ctx.registration().getId();

        // Verify baseline state
        assertThat(ctx.college().getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(ctx.registration().getStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(auditEventRepository.findByCollegeId(collegeId)).isEmpty();

        // Spy on AuditEventService: allow real audit persistence inside the transaction,
        // then immediately throw an unhandled RuntimeException before transaction commit
        doAnswer(invocation -> {
            invocation.callRealMethod(); // Executes real audit persistence in DB within active transaction
            throw new RuntimeException("Simulated post-audit persistence commit failure");
        }).when(auditEventService).record(any(), any(), any(), any(), any(), any(), any(), any());

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Valid approval notes for atomic verification.", null);

        // Execute decision request via MockMvc; Expect HTTP 500 due to unhandled post-audit exception
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + collegeId + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());

        // Verify via raw JDBC that the transaction completely rolled back in MySQL
        String actualApprovalStatus = jdbcTemplate.queryForObject(
                "SELECT approval_status FROM colleges WHERE id = ?", String.class, collegeId);
        assertThat(actualApprovalStatus)
                .as("College approval_status must remain PENDING after rollback")
                .isEqualTo("PENDING");

        String actualRegStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM college_registrations WHERE id = ?", String.class, registrationId);
        assertThat(actualRegStatus)
                .as("Registration status must remain PENDING after rollback")
                .isEqualTo("PENDING");

        String actualReviewNotes = jdbcTemplate.queryForObject(
                "SELECT review_notes FROM college_registrations WHERE id = ?", String.class, registrationId);
        assertThat(actualReviewNotes)
                .as("Registration review_notes must remain NULL after rollback")
                .isNull();

        String actualReviewedAt = jdbcTemplate.queryForObject(
                "SELECT reviewed_at FROM college_registrations WHERE id = ?", String.class, registrationId);
        assertThat(actualReviewedAt)
                .as("Registration reviewed_at must remain NULL after rollback")
                .isNull();

        Integer actualAuditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM audit_events WHERE college_id = ?", Integer.class, collegeId);
        assertThat(actualAuditCount)
                .as("Audit event record must be completely rolled back (count = 0)")
                .isEqualTo(0);
    }

    @Test
    @DisplayName("Access Control: non-SUPER_ADMIN role returns 403 Forbidden")
    void accessControl_nonSuperAdmin_returns403() throws Exception {
        CollegeContext ctx = seedPendingCollegeWithAdminAndDocs("COLL-FORBID", "Forbid Coll", "admin@forbid.edu");
        SessionCookies collegeAdminSession = login("admin@forbid.edu", "AdminPass!2026");

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews")
                        .cookie(collegeAdminSession.sessionCookie(), collegeAdminSession.xsrfCookie()))
                .andExpect(status().isForbidden());
    }
}
