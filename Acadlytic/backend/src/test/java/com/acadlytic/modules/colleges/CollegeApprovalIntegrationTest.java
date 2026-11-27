package com.acadlytic.modules.colleges;

import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.dto.DocumentReviewAction;
import com.acadlytic.modules.colleges.dto.DocumentReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewDecisionAction;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.entity.DocumentVerificationProvenance;
import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;
import com.acadlytic.modules.colleges.repository.CollegeDocumentReviewRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.service.CollegeOnboardingService;
import com.acadlytic.modules.colleges.service.CollegeReviewService;
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End MySQL Integration Tests for Phase 03, Module 3.6C:
 * Backend College Approval Integration & Lifecycle.
 *
 * Verifies document verification gates during college approval, hierarchical locking,
 * lifecycle transitions, revision isolation, and operational session revocation.
 */
class CollegeApprovalIntegrationTest extends AbstractMySqlIntegrationTest {

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
    private CollegeDocumentReviewRepository documentReviewRepository;
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
    private CollegeOnboardingService collegeOnboardingService;
    @Autowired
    private SessionRevocationService sessionRevocationService;

    private static final String SUPER_ADMIN_EMAIL = "superadmin@acadlytic.com";
    private static final String SUPER_ADMIN_PASS = "SuperAdminSecretPass!2026";
    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4 sample verification document".getBytes(StandardCharsets.US_ASCII);

    private User superAdminUser;

    @BeforeEach
    void cleanState() {
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
        this.superAdminUser = userRepository.saveAndFlush(superAdmin);
        return login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASS);
    }

    private record CollegeContext(College college, CollegeRegistration registration, User adminUser) {}

    private CollegeContext seedPendingCollege(String code, String name, String email) {
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

        return new CollegeContext(college, reg, admin);
    }

    private CollegeRegistrationDocument addDocument(
            College college,
            CollegeRegistration reg,
            DocumentCategory category,
            String filename,
            DocumentVerificationStatus status,
            Long replacesDocId) {
        var stored = documentStorageService.store(VALID_PDF_BYTES, filename, "application/pdf", "checksum_" + filename);
        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setCollegeId(college.getId());
        doc.setRegistrationId(reg.getId());
        doc.setDocumentCategory(category);
        doc.setOriginalFilename(filename);
        doc.setMimeType("application/pdf");
        doc.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc.setSha256Checksum("checksum_" + filename);
        doc.setStorageKey(stored.storageKey());
        doc.setReplacesDocumentId(replacesDocId);
        doc.setVerificationStatus(status);
        doc.setVerificationProvenance(status == DocumentVerificationStatus.ACCEPTED || status == DocumentVerificationStatus.REJECTED
                ? DocumentVerificationProvenance.DIRECT_REVIEW
                : DocumentVerificationProvenance.NOT_REVIEWED);
        doc.setVersion(0L);
        return documentRepository.saveAndFlush(doc);
    }

    @Test
    @DisplayName("Scenario 1: Approval succeeds when all mandatory + optional documents are ACCEPTED")
    void approvalSucceeds_whenAllMandatoryAndOptionalDocumentsAccepted() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S1", "Scenario 1 College", "admin@s1.edu");

        // Add mandatory documents: both ACCEPTED
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);
        // Add optional document: ACCEPTED
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.INSTITUTION_REGISTRATION_PROOF, "proof.pdf", DocumentVerificationStatus.ACCEPTED, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "All documents verified.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(refreshed.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
    }

    @Test
    @DisplayName("Scenario 2: Approval blocked when mandatory document is missing (400 REQUIRED_DOCUMENTS_MISSING)")
    void approvalBlocked_whenMandatoryDocumentMissing() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S2", "Scenario 2 College", "admin@s2.edu");

        // Only affiliation certificate is uploaded; AUTHORIZED_SIGNATORY_ID is missing
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approving without signatory ID.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("REQUIRED_DOCUMENTS_MISSING"))
                .andExpect(jsonPath("$.message").value("Required verification documents missing: University Affiliation Certificate and Authorized Signatory ID are mandatory."));

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
    }

    @Test
    @DisplayName("Scenario 3: Approval blocked when mandatory document is PENDING (409 DOCUMENTS_NOT_VERIFIED)")
    void approvalBlocked_whenMandatoryDocumentPending() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S3", "Scenario 3 College", "admin@s3.edu");

        // Mandatory affiliation cert is ACCEPTED; mandatory signatory ID is PENDING
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.PENDING, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approving with pending signatory ID.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENTS_NOT_VERIFIED"))
                .andExpect(jsonPath("$.message").value("Cannot approve application: Document 'signatory.pdf' (AUTHORIZED_SIGNATORY_ID) is pending verification."));

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
    }

    @Test
    @DisplayName("Scenario 4: Approval blocked when mandatory document is REJECTED (409 DOCUMENTS_REJECTED)")
    void approvalBlocked_whenMandatoryDocumentRejected() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S4", "Scenario 4 College", "admin@s4.edu");

        // Mandatory affiliation cert is REJECTED; signatory ID is ACCEPTED
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.REJECTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approving with rejected cert.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENTS_REJECTED"))
                .andExpect(jsonPath("$.message").value("Cannot approve application: Document 'affiliation.pdf' (UNIVERSITY_AFFILIATION_CERTIFICATE) was rejected. Action must be requested to allow document replacement."));

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
    }

    @Test
    @DisplayName("Scenario 5: Approval blocked when uploaded optional document is PENDING (409 DOCUMENTS_NOT_VERIFIED)")
    void approvalBlocked_whenUploadedOptionalDocumentPending() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S5", "Scenario 5 College", "admin@s5.edu");

        // Mandatory docs are ACCEPTED; optional doc is PENDING
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.ADDITIONAL_SUPPORTING_DOCUMENT, "supporting.pdf", DocumentVerificationStatus.PENDING, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approving with pending optional doc.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENTS_NOT_VERIFIED"))
                .andExpect(jsonPath("$.message").value("Cannot approve application: Document 'supporting.pdf' (ADDITIONAL_SUPPORTING_DOCUMENT) is pending verification."));

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
    }

    @Test
    @DisplayName("Scenario 6: Approval blocked when uploaded optional document is REJECTED (409 DOCUMENTS_REJECTED)")
    void approvalBlocked_whenUploadedOptionalDocumentRejected() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S6", "Scenario 6 College", "admin@s6.edu");

        // Mandatory docs are ACCEPTED; optional doc is REJECTED
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.INSTITUTION_REGISTRATION_PROOF, "proof.pdf", DocumentVerificationStatus.REJECTED, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approving with rejected optional doc.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENTS_REJECTED"))
                .andExpect(jsonPath("$.message").value("Cannot approve application: Document 'proof.pdf' (INSTITUTION_REGISTRATION_PROOF) was rejected. Action must be requested to allow document replacement."));

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
    }

    @Test
    @DisplayName("Scenario 7: Successful approval produces expected college and registration lifecycle transitions")
    void successfulApproval_producesExpectedCollegeAndRegistrationLifecycleTransitions() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S7", "Scenario 7 College", "admin@s7.edu");

        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Complete and verified.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        College refreshedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistration refreshedReg = registrationRepository.findById(ctx.registration().getId()).orElseThrow();

        assertThat(refreshedCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(refreshedCollege.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
        assertThat(refreshedReg.getStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(refreshedReg.getReviewNotes()).isEqualTo("Complete and verified.");
        assertThat(refreshedReg.getReviewedAt()).isNotNull();
        assertThat(refreshedReg.getReviewerUserId()).isEqualTo(superAdminUser.getId());

        assertThat(auditEventRepository.findByCollegeId(ctx.college().getId()))
                .anyMatch(e -> e.getEventType() == AuditEventType.COLLEGE_REGISTRATION_APPROVED);
        assertThat(outboxEmailRepository.findAll())
                .anyMatch(email -> email.getRecipientEmail().equals(ctx.adminUser().getEmail()));
    }

    @Test
    @DisplayName("Scenario 8: Failed approval produces zero partial mutations and zero audit events")
    void failedApproval_producesZeroPartialMutationsAndZeroAuditEvents() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S8", "Scenario 8 College", "admin@s8.edu");

        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.PENDING, null);

        Long initialCollegeVersion = ctx.college().getVersion();
        int initialAuditCount = auditEventRepository.findByCollegeId(ctx.college().getId()).size();
        long initialOutboxCount = outboxEmailRepository.count();

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, initialCollegeVersion, "Attempting approval.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENTS_NOT_VERIFIED"));

        // Verify via raw JDBC that zero mutation occurred
        String dbApprovalStatus = jdbcTemplate.queryForObject(
                "SELECT approval_status FROM colleges WHERE id = ?", String.class, ctx.college().getId());
        Long dbCollegeVersion = jdbcTemplate.queryForObject(
                "SELECT version FROM colleges WHERE id = ?", Long.class, ctx.college().getId());
        String dbRegStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM college_registrations WHERE id = ?", String.class, ctx.registration().getId());

        assertThat(dbApprovalStatus).isEqualTo("PENDING");
        assertThat(dbCollegeVersion).isEqualTo(initialCollegeVersion);
        assertThat(dbRegStatus).isEqualTo("PENDING");

        int finalAuditCount = auditEventRepository.findByCollegeId(ctx.college().getId()).size();
        assertThat(finalAuditCount).isEqualTo(initialAuditCount);
        assertThat(outboxEmailRepository.count()).isEqualTo(initialOutboxCount);
    }

    @Test
    @DisplayName("Scenario 9: Concurrency test - simultaneous document review and college approval serialized via parent lock")
    void concurrency_simultaneousDocumentReviewAndCollegeApproval_serializedViaParentLock() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S9", "Scenario 9 College", "admin@s9.edu");

        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        CollegeRegistrationDocument doc2 = addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.PENDING, null);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(2);

        AtomicInteger docReviewStatus = new AtomicInteger(0);
        AtomicInteger collegeApprovalStatus = new AtomicInteger(0);

        // Task 1: Accept doc2
        executor.submit(() -> {
            try {
                startLatch.await();
                DocumentReviewDecisionRequest docRequest = new DocumentReviewDecisionRequest(
                        DocumentReviewAction.ACCEPT, null, null, 0L);
                MvcResult res = mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/documents/" + doc2.getId() + "/decision")
                                .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                                .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(docRequest)))
                        .andReturn();
                docReviewStatus.set(res.getResponse().getStatus());
            } catch (Exception e) {
                docReviewStatus.set(500);
            } finally {
                finishLatch.countDown();
            }
        });

        // Task 2: Attempt to approve college
        executor.submit(() -> {
            try {
                startLatch.await();
                ReviewDecisionRequest collegeRequest = new ReviewDecisionRequest(
                        ReviewDecisionAction.APPROVE, 0L, "Concurrent approval attempt.", null);
                MvcResult res = mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                                .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                                .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(collegeRequest)))
                        .andReturn();
                collegeApprovalStatus.set(res.getResponse().getStatus());
            } catch (Exception e) {
                collegeApprovalStatus.set(500);
            } finally {
                finishLatch.countDown();
            }
        });

        startLatch.countDown();
        boolean completedInTime = finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completedInTime).isTrue();

        // Either:
        // Outcome A: Document review executed first (200 OK), then college approval saw all accepted and succeeded (200 OK).
        // Outcome B: College approval executed first, saw pending document and was rejected (409 Conflict), then document review succeeded (200 OK).
        assertThat(docReviewStatus.get()).isEqualTo(200);
        assertThat(collegeApprovalStatus.get()).isIn(200, 409);

        // Verification: Zero unhandled 500 exceptions, DB is completely consistent
        College finalCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistrationDocument finalDoc = documentRepository.findById(doc2.getId()).orElseThrow();

        assertThat(finalDoc.getVerificationStatus()).isEqualTo(DocumentVerificationStatus.ACCEPTED);
        assertThat(finalCollege.getApprovalStatus()).isIn(CollegeApprovalStatus.PENDING, CollegeApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("Scenario 10: Document reviews rejected after college approval or action request commits (409 APPLICATION_NOT_AWAITING_REVIEW)")
    void documentReviews_rejectedAfterCollegeApprovalOrActionRequestCommits() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S10", "Scenario 10 College", "admin@s10.edu");

        CollegeRegistrationDocument doc1 = addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        CollegeRegistrationDocument doc2 = addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);

        // Approve the college
        ReviewDecisionRequest approveReq = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approved.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk());

        // Subsequent document review attempt must be frozen with 409 APPLICATION_NOT_AWAITING_REVIEW
        DocumentReviewDecisionRequest docReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, doc1.getVersion());

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/documents/" + doc1.getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"))
                .andExpect(jsonPath("$.message").value("Application is not currently pending review."));
    }

    @Test
    @DisplayName("Scenario 11: Correction draft and resubmission allow review of new revision's documents")
    void correctionDraftAndResubmission_allowsReviewOfNewRevisionDocuments() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S11", "Scenario 11 College", "admin@s11.edu");

        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        CollegeRegistrationDocument rejectedDoc = addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.REJECTED, null);

        // Super Admin requests action
        ReviewDecisionRequest actionReq = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, ctx.college().getVersion(), "Signatory ID is invalid. Please replace.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(actionReq)))
                .andExpect(status().isOk());

        // College Admin logs in and creates correction draft v2
        SessionCookies adminSession = login(ctx.adminUser().getEmail(), "AdminPass!2026");

        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                        .cookie(adminSession.sessionCookie(), adminSession.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminSession.xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.versionNumber").value(2));

        // College Admin uploads replacement document for signatory ID
        MockMultipartFile replacementFile = new MockMultipartFile(
                "file", "new_signatory.pdf", "application/pdf", VALID_PDF_BYTES);

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(replacementFile)
                        .param("documentCategory", DocumentCategory.AUTHORIZED_SIGNATORY_ID.name())
                        .param("replacesDocumentId", String.valueOf(rejectedDoc.getId()))
                        .cookie(adminSession.sessionCookie(), adminSession.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminSession.xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andReturn();

        Long replacementDocId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // College Admin submits revision v2 for review
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                        .cookie(adminSession.sessionCookie(), adminSession.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminSession.xsrfCookie().getValue()))
                .andExpect(status().isOk());

        // Super Admin reviews and accepts the new replacement document
        DocumentReviewDecisionRequest acceptDocReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/documents/" + replacementDocId + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptDocReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("ACCEPTED"));

        // Super Admin can now approve the college!
        College refreshedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        ReviewDecisionRequest approveReq = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, refreshedCollege.getVersion(), "V2 verified successfully.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        College approved = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(approved.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
    }

    @Test
    @DisplayName("Scenario 12: Historical documents from earlier revisions cannot satisfy new revision's approval gate")
    void historicalDocumentsFromEarlierRevisions_cannotSatisfyNewRevisionApprovalGate() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S12", "Scenario 12 College", "admin@s12.edu");

        // Revision v1 has both documents accepted
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation_v1.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory_v1.pdf", DocumentVerificationStatus.ACCEPTED, null);

        // Action requested
        ReviewDecisionRequest actionReq = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, ctx.college().getVersion(), "Profile address update required.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(actionReq)))
                .andExpect(status().isOk());

        // Create revision v2 directly simulating a state where only affiliation is present for v2
        CollegeRegistration regV2 = new CollegeRegistration();
        regV2.setCollegeId(ctx.college().getId());
        regV2.setVersionNumber(2);
        regV2.setStatus(CollegeApprovalStatus.PENDING);
        regV2.setLegalName(ctx.college().getName());
        regV2.setAddressLine1("New Address");
        regV2.setCity("Metropolis");
        regV2.setState("State");
        regV2.setCountry("India");
        regV2.setPostalCode("123456");
        regV2.setContactPhone("+919876543210");
        regV2.setAffiliatedUniversityName("Central University");
        regV2.setSubmittedForReviewAt(Instant.now());
        regV2 = registrationRepository.saveAndFlush(regV2);

        // College points to v2
        College college = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        college.setCurrentRegistrationId(regV2.getId());
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college = collegeRepository.saveAndFlush(college);

        // Only affiliation document is added for v2; signatory document is missing in v2
        addDocument(college, regV2, DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation_v2.pdf", DocumentVerificationStatus.ACCEPTED, null);

        // Super Admin attempts to approve v2
        ReviewDecisionRequest approveReq = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, college.getVersion(), "Trying to approve v2.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + college.getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("REQUIRED_DOCUMENTS_MISSING"))
                .andExpect(jsonPath("$.message").value("Required verification documents missing: University Affiliation Certificate and Authorized Signatory ID are mandatory."));
    }

    @Test
    @DisplayName("Scenario 13: Stale college expectedVersion requests return 409 conflict")
    void staleCollegeExpectedVersion_returns409Conflict() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S13", "Scenario 13 College", "admin@s13.edu");

        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 999L, "Stale expected version.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("STALE_APPLICATION_VERSION"))
                .andExpect(jsonPath("$.message").value("College application was updated by another transaction. Please reload and try again."));

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
    }

    @Test
    @DisplayName("Scenario 14: Existing Module 3.5 lifecycle and session revocation behavior remains intact")
    void existingModule35LifecycleAndSessionRevocation_remainsIntact() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-S14", "Scenario 14 College", "admin@s14.edu");

        addDocument(ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, "affiliation.pdf", DocumentVerificationStatus.ACCEPTED, null);
        addDocument(ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID, "signatory.pdf", DocumentVerificationStatus.ACCEPTED, null);

        // Login as college admin to create an active session
        SessionCookies adminSession = login(ctx.adminUser().getEmail(), "AdminPass!2026");

        // Super Admin approves the college
        ReviewDecisionRequest approveReq = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approved with active session.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk());

        College approvedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(approvedCollege.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
        assertThat(approvedCollege.isManagementUnlocked()).isTrue();

        // But admin can log in freshly to access approved college administration
        SessionCookies freshAdminSession = login(ctx.adminUser().getEmail(), "AdminPass!2026");
        assertThat(freshAdminSession.sessionCookie()).isNotNull();

        // Also verify permanent rejection revokes active sessions (Module 3.5 intact)
        CollegeContext ctxRej = seedPendingCollege("COLL-S14-REJ", "Scenario 14 Rejection College", "admin@s14-rej.edu");
        SessionCookies rejAdminSession = login(ctxRej.adminUser().getEmail(), "AdminPass!2026");
        assertThat(sessionRevocationService.countActiveSessionsForUser(ctxRej.adminUser().getId())).isGreaterThan(0);

        College colToReject = collegeRepository.findById(ctxRej.college().getId()).orElseThrow();
        colToReject.setResubmissionCount(3);
        colToReject = collegeRepository.saveAndFlush(colToReject);

        ReviewDecisionRequest rejReq = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, colToReject.getVersion(), null, "Permanent rejection of application.");
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + colToReject.getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejReq)))
                .andExpect(status().isOk());

        assertThat(sessionRevocationService.countActiveSessionsForUser(ctxRej.adminUser().getId())).isEqualTo(0);
    }

    @Test
    @DisplayName("Scenario 15: Replacement document active-set verification - replacement inclusion, status gating, and historical document isolation")
    void replacementDocument_activeSetVerification_exactLifecycle() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-REP", "Replacement Coll", "admin@rep.edu");

        // 1. Revision v1: original affiliation (ACCEPTED) and original signatory (REJECTED)
        CollegeRegistrationDocument v1Affiliation = addDocument(
                ctx.college(), ctx.registration(), DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE,
                "affiliation_v1.pdf", DocumentVerificationStatus.ACCEPTED, null);
        CollegeRegistrationDocument v1Signatory = addDocument(
                ctx.college(), ctx.registration(), DocumentCategory.AUTHORIZED_SIGNATORY_ID,
                "signatory_v1.pdf", DocumentVerificationStatus.REJECTED, null);

        // Super Admin requests action due to rejected signatory ID
        ReviewDecisionRequest actionReq = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, ctx.college().getVersion(), "Signatory ID unreadable. Please replace.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(actionReq)))
                .andExpect(status().isOk());

        // 2. College Admin logs in and creates correction draft revision v2
        SessionCookies adminSession = login(ctx.adminUser().getEmail(), "AdminPass!2026");

        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                        .cookie(adminSession.sessionCookie(), adminSession.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminSession.xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.versionNumber").value(2));

        // Verify v1 rejected signatory is NOT carried forward, but accepted affiliation IS carried forward
        CollegeRegistration v2Registration = registrationRepository
                .findFirstByCollegeIdOrderByVersionNumberDesc(ctx.college().getId()).orElseThrow();
        List<CollegeRegistrationDocument> v2DocsInitial = documentRepository.findByRegistrationId(v2Registration.getId());
        assertThat(v2DocsInitial).hasSize(1);
        assertThat(v2DocsInitial.getFirst().getDocumentCategory()).isEqualTo(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        assertThat(v2DocsInitial.getFirst().getSourceDocumentId()).isEqualTo(v1Affiliation.getId());

        // 3. College Admin uploads replacement document referencing v1Signatory.getId()
        MockMultipartFile replacementFile = new MockMultipartFile(
                "file", "signatory_v2_replacement.pdf", "application/pdf", VALID_PDF_BYTES);

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(replacementFile)
                        .param("documentCategory", DocumentCategory.AUTHORIZED_SIGNATORY_ID.name())
                        .param("replacesDocumentId", String.valueOf(v1Signatory.getId()))
                        .cookie(adminSession.sessionCookie(), adminSession.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminSession.xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andReturn();

        Long replacementDocId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        CollegeRegistrationDocument replacementDocInDb = documentRepository.findById(replacementDocId).orElseThrow();
        assertThat(replacementDocInDb.getReplacesDocumentId()).isEqualTo(v1Signatory.getId());
        assertThat(replacementDocInDb.getVerificationStatus()).isEqualTo(DocumentVerificationStatus.PENDING);

        // 4. College Admin submits revision v2 for review
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                        .cookie(adminSession.sessionCookie(), adminSession.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminSession.xsrfCookie().getValue()))
                .andExpect(status().isOk());

        // 5. Verification Gate Evaluation while replacement document is PENDING:
        // Must fail with DOCUMENTS_NOT_VERIFIED (NOT REQUIRED_DOCUMENTS_MISSING), proving that
        // the replacement document IS in the active set and its PENDING status gates approval.
        College v2College = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        ReviewDecisionRequest approveAttempt1 = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, v2College.getVersion(), "Attempting approval while replacement is pending.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveAttempt1)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENTS_NOT_VERIFIED"))
                .andExpect(jsonPath("$.message").value("Cannot approve application: Document 'signatory_v2_replacement.pdf' (AUTHORIZED_SIGNATORY_ID) is pending verification."));

        // 6. Verification Gate Evaluation while replacement document is REJECTED:
        // Super Admin reviews replacement document and rejects it
        DocumentReviewDecisionRequest rejectDocReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, null, "Still blurry and unreadable.", replacementDocInDb.getVersion());

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/documents/" + replacementDocId + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectDocReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"));

        // Approval attempt must now fail with DOCUMENTS_REJECTED
        ReviewDecisionRequest approveAttempt2 = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, v2College.getVersion(), "Attempting approval while replacement is rejected.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveAttempt2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENTS_REJECTED"))
                .andExpect(jsonPath("$.message").value("Cannot approve application: Document 'signatory_v2_replacement.pdf' (AUTHORIZED_SIGNATORY_ID) was rejected. Action must be requested to allow document replacement."));

        // 7. Verification Gate Evaluation when replacement document is ACCEPTED:
        // Super Admin reviews replacement document and accepts it
        CollegeRegistrationDocument currentDocInDb = documentRepository.findById(replacementDocId).orElseThrow();
        DocumentReviewDecisionRequest acceptDocReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, currentDocInDb.getVersion());

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/documents/" + replacementDocId + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptDocReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("ACCEPTED"));

        // Approval attempt now succeeds completely!
        ReviewDecisionRequest approveSuccess = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, v2College.getVersion(), "Replacement verified and accepted.", null);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/" + ctx.college().getId() + "/decision")
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveSuccess)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        College approvedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(approvedCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(approvedCollege.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
    }
}
