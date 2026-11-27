package com.acadlytic.modules.colleges;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuditEvent;
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
import com.acadlytic.modules.colleges.entity.CollegeDocumentReview;
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
import com.acadlytic.modules.colleges.service.IpRateLimiter;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end MySQL integration tests for Module 3.6B:
 * Backend Document Review Service & APIs.
 *
 * Verifies document-level verification decisions (ACCEPT, REJECT),
 * audit immutability triggers, composite ownership integrity,
 * replacement document rules, and optimistic concurrency version checking.
 */
class DocumentReviewIntegrationTest extends AbstractMySqlIntegrationTest {

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

    @AfterEach
    void tearDown() {
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
        this.superAdminUser = userRepository.saveAndFlush(superAdmin);
        return login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASS);
    }

    private record CollegeContext(College college, CollegeRegistration registration, User adminUser, CollegeRegistrationDocument document) {}

    private CollegeContext seedPendingCollegeWithAdminAndDoc(String code, String name, String email) {
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
        doc.setVerificationStatus(DocumentVerificationStatus.PENDING);
        doc.setVerificationProvenance(DocumentVerificationProvenance.NOT_REVIEWED);
        doc = documentRepository.saveAndFlush(doc);

        return new CollegeContext(college, reg, admin, doc);
    }

    // =========================================================================
    // 1. Authorization: 401 Unauthenticated and 403 COLLEGE_ADMIN
    // =========================================================================

    @Test
    @DisplayName("Document review endpoint returns 401 when unauthenticated")
    void documentReview_unauthenticated_returns401() throws Exception {
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");
        DocumentReviewDecisionRequest request = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);

        Cookie xsrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Document review endpoint returns 403 when called by COLLEGE_ADMIN")
    void documentReview_collegeAdmin_returns403() throws Exception {
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");
        SessionCookies adminSession = login("admin1@col.edu", "AdminPass!2026");

        DocumentReviewDecisionRequest request = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(adminSession.sessionCookie(), adminSession.xsrfCookie())
                        .header("X-XSRF-TOKEN", adminSession.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 2. Ownership & Scope Validation: Cross-college (404) & Cross-revision (409)
    // =========================================================================

    @Test
    @DisplayName("Document review endpoint returns 404 when document belongs to a different college")
    void documentReview_crossCollegeAccess_returns404() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx1 = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");
        CollegeContext ctx2 = seedPendingCollegeWithAdminAndDoc("COL2", "College 2", "admin2@col.edu");

        // Attempting to review ctx2's document under ctx1's collegeId
        DocumentReviewDecisionRequest request = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx1.college().getId(), ctx2.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("Document review endpoint returns 409 when document belongs to a prior revision")
    void documentReview_crossRevisionAccess_returns409() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // Create revision 2 and make it the current registration
        CollegeRegistration rev2 = new CollegeRegistration();
        rev2.setCollegeId(ctx.college().getId());
        rev2.setVersionNumber(2);
        rev2.setStatus(CollegeApprovalStatus.PENDING);
        rev2.setLegalName("College 1 Updated");
        rev2.setAddressLine1("Campus Road 2");
        rev2.setCity("Metropolis");
        rev2.setState("State");
        rev2.setCountry("India");
        rev2.setPostalCode("123456");
        rev2.setContactPhone("+919876543210");
        rev2.setAffiliatedUniversityName("Central University");
        rev2.setSubmittedForReviewAt(Instant.now());
        rev2 = registrationRepository.saveAndFlush(rev2);

        ctx.college().setCurrentRegistrationId(rev2.getId());
        collegeRepository.saveAndFlush(ctx.college());

        // ctx.document() belongs to revision 1; current submitted revision is rev2
        DocumentReviewDecisionRequest request = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));
    }

    // =========================================================================
    // 3. Valid ACCEPT Decision: Status, Provenance, Version, Audit & Zero Parent Mutation
    // =========================================================================

    @Test
    @DisplayName("Valid ACCEPT decision updates document, creates audit row, emits event, advances doc version, leaves College version intact")
    void documentReview_validAcceptDecision_updatesDocument_createsAudit_emitsEvent_preservesParentVersion() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        Long initialCollegeVersion = ctx.college().getVersion();
        Long initialDocVersion = ctx.document().getVersion();
        assertThat(initialDocVersion).isEqualTo(0L);

        DocumentReviewDecisionRequest request = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, "Legible accreditation certificate verified", null, 0L);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.documentId").value(ctx.document().getId()))
                .andExpect(jsonPath("$.data.verificationStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.verificationProvenance").value("DIRECT_REVIEW"))
                .andExpect(jsonPath("$.data.lastReviewedByUserId").value(superAdminUser.getId()))
                .andExpect(jsonPath("$.data.reviewerEmail").value(SUPER_ADMIN_EMAIL))
                .andExpect(jsonPath("$.data.version").value(1L));

        // Verify Document state in DB
        CollegeRegistrationDocument updatedDoc = documentRepository.findById(ctx.document().getId()).orElseThrow();
        assertThat(updatedDoc.getVerificationStatus()).isEqualTo(DocumentVerificationStatus.ACCEPTED);
        assertThat(updatedDoc.getVerificationProvenance()).isEqualTo(DocumentVerificationProvenance.DIRECT_REVIEW);
        assertThat(updatedDoc.getLastReviewedByUserId()).isEqualTo(superAdminUser.getId());
        assertThat(updatedDoc.getLastReviewedAt()).isNotNull();
        assertThat(updatedDoc.getVersion()).isEqualTo(1L);

        // Verify parent College version is completely unchanged (0 mutation on parent version)
        College updatedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(updatedCollege.getVersion()).isEqualTo(initialCollegeVersion);

        // Verify audit record in college_document_reviews
        List<CollegeDocumentReview> reviews = documentReviewRepository
                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(ctx.college().getId(), ctx.document().getId());
        assertThat(reviews).hasSize(1);
        CollegeDocumentReview reviewRecord = reviews.getFirst();
        assertThat(reviewRecord.getAction()).isEqualTo(DocumentReviewAction.ACCEPT.toHistoryAction());
        assertThat(reviewRecord.getReviewerUserId()).isEqualTo(superAdminUser.getId());
        assertThat(reviewRecord.getRejectionReason()).isNull();

        // Verify AuditEvent logged
        List<AuditEvent> events = auditEventRepository.findByEventTypeOrderByCreatedAtDesc(AuditEventType.COLLEGE_REGISTRATION_DOC_ACCEPTED);
        assertThat(events).hasSize(1);
        assertThat(events.getFirst().getActorUserId()).isEqualTo(superAdminUser.getId());
        assertThat(events.getFirst().getMetadataJson()).contains("\"documentId\":" + ctx.document().getId());
        assertThat(events.getFirst().getMetadataJson()).contains("\"action\":\"ACCEPT\"");
    }

    // =========================================================================
    // 4. Valid REJECT Decision: Status, Reason, Provenance, Audit & Event
    // =========================================================================

    @Test
    @DisplayName("Valid REJECT decision updates document with reason, creates audit row, emits event, and advances doc version")
    void documentReview_validRejectDecision_updatesDocument_storesReason_createsAudit_emitsEvent() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        String rejectionReason = "Affiliation certificate seal is blurred and expired.";
        DocumentReviewDecisionRequest request = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, "Checking page 2 stamps", rejectionReason, 0L);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.documentId").value(ctx.document().getId()))
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.verificationProvenance").value("DIRECT_REVIEW"))
                .andExpect(jsonPath("$.data.rejectionReason").value(rejectionReason))
                .andExpect(jsonPath("$.data.lastReviewedByUserId").value(superAdminUser.getId()))
                .andExpect(jsonPath("$.data.version").value(1L));

        CollegeRegistrationDocument updatedDoc = documentRepository.findById(ctx.document().getId()).orElseThrow();
        assertThat(updatedDoc.getVerificationStatus()).isEqualTo(DocumentVerificationStatus.REJECTED);
        assertThat(updatedDoc.getRejectionReason()).isEqualTo(rejectionReason);

        List<CollegeDocumentReview> reviews = documentReviewRepository
                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(ctx.college().getId(), ctx.document().getId());
        assertThat(reviews).hasSize(1);
        assertThat(reviews.getFirst().getAction()).isEqualTo(DocumentReviewAction.REJECT.toHistoryAction());
        assertThat(reviews.getFirst().getRejectionReason()).isEqualTo(rejectionReason);

        List<AuditEvent> events = auditEventRepository.findByEventTypeOrderByCreatedAtDesc(AuditEventType.COLLEGE_REGISTRATION_DOC_REJECTED);
        assertThat(events).hasSize(1);
        assertThat(events.getFirst().getMetadataJson()).contains(rejectionReason);
    }

    // =========================================================================
    // 5. Rejection Reason Validation: 400 Bad Request
    // =========================================================================

    @Test
    @DisplayName("Rejection reason validation enforces mandatory non-empty reason for REJECT and null for ACCEPT")
    void documentReview_rejectionReasonValidation_enforcesConstraints() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // 1. REJECT with null rejectionReason
        DocumentReviewDecisionRequest nullReason = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, null, null, 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nullReason)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        // 2. REJECT with reason shorter than 10 chars
        DocumentReviewDecisionRequest shortReason = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, null, "Short", 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortReason)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        // 3. REJECT with reason longer than 1000 chars
        DocumentReviewDecisionRequest longReason = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, null, "A".repeat(1001), 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(longReason)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        // 4. ACCEPT with non-null rejectionReason
        DocumentReviewDecisionRequest acceptWithReason = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, "Should not be here", 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptWithReason)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    // =========================================================================
    // 6. Optimistic Concurrency & Stale Expected Document Version (409)
    // =========================================================================

    @Test
    @DisplayName("Document review rejects stale expected-document-version with 409 STALE_DOCUMENT_VERSION")
    void documentReview_concurrency_staleExpectedVersionReturns409() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // Initial review: expectedDocumentVersion = 0 succeeds and advances doc version to 1
        DocumentReviewDecisionRequest acceptReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version").value(1L));

        // Attempting a state reversal (to REJECT) with stale expectedDocumentVersion = 0
        DocumentReviewDecisionRequest staleReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, null, "Found defect after initial check", 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staleReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("STALE_DOCUMENT_VERSION"));
    }

    // =========================================================================
    // 7. Idempotent Retry Handling
    // =========================================================================

    @Test
    @DisplayName("Idempotent retry with current or immediately preceding version returns 200 without duplicate audit row or version bump")
    void documentReview_idempotentRetry_identicalRequestDoesNotAdvanceVersionOrDuplicateAudit() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        DocumentReviewDecisionRequest initialReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);

        // First execution -> advances version to 1
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version").value(1L));

        // Retry 1: Client retried the identical request with expectedDocumentVersion = 0
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version").value(1L));

        // Retry 2: Client retried with updated expectedDocumentVersion = 1
        DocumentReviewDecisionRequest retryWithV1 = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 1L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(retryWithV1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version").value(1L));

        // Verify exactly 1 audit record and 1 audit event exist
        List<CollegeDocumentReview> reviews = documentReviewRepository
                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(ctx.college().getId(), ctx.document().getId());
        assertThat(reviews).hasSize(1);

        List<AuditEvent> events = auditEventRepository.findByEventTypeOrderByCreatedAtDesc(AuditEventType.COLLEGE_REGISTRATION_DOC_ACCEPTED);
        assertThat(events).hasSize(1);
    }

    @Test
    @DisplayName("Idempotent retry for REJECT succeeds only when reason matches; rejects mismatched reason or action with 409")
    void documentReview_idempotentRetry_rejectReasonMatchingAndMismatchRejection() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        String reason1 = "Document certificate seal is missing or illegible.";
        DocumentReviewDecisionRequest initialReject = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, "First pass check", reason1, 0L);

        // 1. Initial execution: REJECT at v0 -> advances to v1
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialReject)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.version").value(1L));

        // 2. Idempotent retry with v0 and IDENTICAL rejection reason -> returns 200 without version bump or duplicate audit
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialReject)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.version").value(1L));

        // 3. Stale retry with v0 but DIFFERENT rejection reason -> rejected with 409 STALE_DOCUMENT_VERSION
        String reason2 = "Completely different reason: signatory name mismatch.";
        DocumentReviewDecisionRequest differentReasonReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, "Changed mind", reason2, 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(differentReasonReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("STALE_DOCUMENT_VERSION"));

        // 4. Stale retry with v0 and DIFFERENT action (ACCEPT) -> rejected with 409 STALE_DOCUMENT_VERSION
        DocumentReviewDecisionRequest differentActionReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(differentActionReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("STALE_DOCUMENT_VERSION"));

        // Verify exactly 1 audit row and 1 audit event exist for REJECT
        List<CollegeDocumentReview> reviews = documentReviewRepository
                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(ctx.college().getId(), ctx.document().getId());
        assertThat(reviews).hasSize(1);
        assertThat(reviews.getFirst().getRejectionReason()).isEqualTo(reason1);

        List<AuditEvent> events = auditEventRepository.findByEventTypeOrderByCreatedAtDesc(AuditEventType.COLLEGE_REGISTRATION_DOC_REJECTED);
        assertThat(events).hasSize(1);
    }

    // =========================================================================
    // 8. Intentional Decision Reversal
    // =========================================================================

    @Test
    @DisplayName("Intentional decision reversal with current version succeeds, updates status, and appends audit record")
    void documentReview_intentionalReversal_withCurrentVersion_succeedsAndAdvancesVersion() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // 1. Initial review: ACCEPT
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 0L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.version").value(1L));

        // 2. Intentional reversal: REJECT with expectedDocumentVersion = 1
        String reversalReason = "Second reviewer noticed signature does not match registrar.";
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.REJECT, "Reversing earlier acceptance", reversalReason, 1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value(reversalReason))
                .andExpect(jsonPath("$.data.version").value(2L));

        // Check DB state
        CollegeRegistrationDocument doc = documentRepository.findById(ctx.document().getId()).orElseThrow();
        assertThat(doc.getVerificationStatus()).isEqualTo(DocumentVerificationStatus.REJECTED);
        assertThat(doc.getVersion()).isEqualTo(2L);

        // Audit records in append-only table: exactly 2 rows
        List<CollegeDocumentReview> reviews = documentReviewRepository
                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(ctx.college().getId(), ctx.document().getId());
        assertThat(reviews).hasSize(2);
        assertThat(reviews.get(0).getAction()).isEqualTo(DocumentReviewAction.REJECT.toHistoryAction());
        assertThat(reviews.get(1).getAction()).isEqualTo(DocumentReviewAction.ACCEPT.toHistoryAction());
    }

    // =========================================================================
    // 9. Concurrency: Two Conflicting Requests Serialized via Parent Lock
    // =========================================================================

    @Test
    @DisplayName("Concurrent conflicting decisions are serialized by parent lock: exactly one succeeds and one receives 409")
    void documentReview_concurrentDecisions_serializedViaParentLock_oneSucceedsOneConflicts() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        List<Callable<Integer>> tasks = new ArrayList<>();

        DocumentReviewDecisionRequest acceptReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);
        DocumentReviewDecisionRequest rejectReq = new DocumentReviewDecisionRequest(
                DocumentReviewAction.REJECT, null, "Concurrent conflict test rejection reason", 0L);

        tasks.add(() -> {
            MvcResult res = mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                            ctx.college().getId(), ctx.document().getId())
                            .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                            .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(acceptReq)))
                    .andReturn();
            return res.getResponse().getStatus();
        });

        tasks.add(() -> {
            MvcResult res = mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                            ctx.college().getId(), ctx.document().getId())
                            .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                            .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(rejectReq)))
                    .andReturn();
            return res.getResponse().getStatus();
        });

        List<Future<Integer>> futures = executor.invokeAll(tasks);
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> f : futures) {
            statuses.add(f.get());
        }
        executor.shutdown();

        // One must succeed (200) and one must receive 409 Conflict (stale version)
        assertThat(statuses).containsExactlyInAnyOrder(200, 409);

        // Document version is 1 and exactly 1 audit row inserted
        CollegeRegistrationDocument doc = documentRepository.findById(ctx.document().getId()).orElseThrow();
        assertThat(doc.getVersion()).isEqualTo(1L);

        List<CollegeDocumentReview> reviews = documentReviewRepository
                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(ctx.college().getId(), ctx.document().getId());
        assertThat(reviews).hasSize(1);
    }

    // =========================================================================
    // 10. Replacement Document Rules & Duplicate Replacement Protection
    // =========================================================================

    @Test
    @DisplayName("Duplicate replacement in same draft revision is blocked with 409 REPLACEMENT_ALREADY_EXISTS and DB unique constraint")
    void documentReview_duplicateReplacementProtection_preventsReplacingSameDocumentTwice() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // 1. Super Admin rejects Document in Revision 1
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.REJECT, null, "Document illegible and needs re-upload.", 0L))))
                .andExpect(status().isOk());

        // 2. Super Admin moves application to REQUEST_ACTION
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/decision", ctx.college().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReviewDecisionRequest(
                                ReviewDecisionAction.REQUEST_ACTION,
                                collegeRepository.findById(ctx.college().getId()).orElseThrow().getVersion(),
                                "Please replace the illegible affiliation certificate.",
                                null))))
                .andExpect(status().isOk());

        // 3. College Admin creates correction draft (Revision 2)
        SessionCookies collegeAdmin = login("admin1@col.edu", "AdminPass!2026");
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isCreated());

        // 4. College Admin uploads replacement 1 targeting ctx.document().getId() -> 201 Created
        MockMultipartFile file1 = new MockMultipartFile("file", "replacement1.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(file1)
                        .param("documentCategory", DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE.name())
                        .param("replacesDocumentId", String.valueOf(ctx.document().getId()))
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.replacesDocumentId").value(ctx.document().getId()));

        // 5. College Admin attempts duplicate replacement 2 targeting the SAME document -> 409 Conflict
        MockMultipartFile file2 = new MockMultipartFile("file", "replacement2.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(file2)
                        .param("documentCategory", DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE.name())
                        .param("replacesDocumentId", String.valueOf(ctx.document().getId()))
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("REPLACEMENT_ALREADY_EXISTS"));

        // 6. Verify Database constraint uq_crd_registration_replacement directly
        CollegeRegistration rev2 = registrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(ctx.college().getId()).orElseThrow();
        CollegeRegistrationDocument directDuplicate = new CollegeRegistrationDocument();
        directDuplicate.setCollegeId(ctx.college().getId());
        directDuplicate.setRegistrationId(rev2.getId());
        directDuplicate.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        directDuplicate.setOriginalFilename("direct_dup.pdf");
        directDuplicate.setMimeType("application/pdf");
        directDuplicate.setFileSizeBytes(100);
        directDuplicate.setSha256Checksum("dummychecksumdirect");
        directDuplicate.setStorageKey("dummykey");
        directDuplicate.setReplacesDocumentId(ctx.document().getId());

        assertThatThrownBy(() -> documentRepository.saveAndFlush(directDuplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // =========================================================================
    // 11. Cross-Revision Replacement Validation (Non-Rejected & Category Mismatch)
    // =========================================================================

    @Test
    @DisplayName("Cross-revision replacement rejects non-rejected document and category mismatch")
    void documentReview_crossRevisionReplacement_rejectsNonRejectedOrCategoryMismatch() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // Document is ACCEPTED (not rejected!)
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 0L))))
                .andExpect(status().isOk());

        // Super Admin requests changes
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/decision", ctx.college().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReviewDecisionRequest(
                                ReviewDecisionAction.REQUEST_ACTION,
                                collegeRepository.findById(ctx.college().getId()).orElseThrow().getVersion(),
                                "Correction requested on profile details.",
                                null))))
                .andExpect(status().isOk());

        // College Admin creates draft v2
        SessionCookies collegeAdmin = login("admin1@col.edu", "AdminPass!2026");
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isCreated());

        // Attempt to replace non-rejected document from Revision 1 -> 400 CANNOT_REPLACE_NON_REJECTED_DOCUMENT
        MockMultipartFile file = new MockMultipartFile("file", "repl.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(file)
                        .param("documentCategory", DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE.name())
                        .param("replacesDocumentId", String.valueOf(ctx.document().getId()))
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("CANNOT_REPLACE_NON_REJECTED_DOCUMENT"));

        // Now test category mismatch: Mark document as REJECTED in Revision 1, then try replacement with different category
        // First re-open college review state artificially for doc rejection test
        jdbcTemplate.update("UPDATE college_registrations SET status = 'PENDING' WHERE id = ?", ctx.registration().getId());
        jdbcTemplate.update("UPDATE colleges SET approval_status = 'PENDING' WHERE id = ?", ctx.college().getId());
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.REJECT, null, "Now rejecting for test purposes.", 1L))))
                .andExpect(status().isOk());

        // Try replacing with category mismatch (target is UNIVERSITY_AFFILIATION_CERTIFICATE, uploading AUTHORIZED_SIGNATORY_ID)
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(file)
                        .param("documentCategory", DocumentCategory.AUTHORIZED_SIGNATORY_ID.name())
                        .param("replacesDocumentId", String.valueOf(ctx.document().getId()))
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("CATEGORY_MISMATCH_ON_REPLACEMENT"));
    }

    // =========================================================================
    // 12. Decision Freeze: Once College Decision Commits, Document Reviews are Frozen
    // =========================================================================

    @Test
    @DisplayName("Document review endpoint returns 409 when college decision has already committed")
    void documentReview_decisionFreeze_whenCollegeDecisionCommitted_returns409() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // Precondition for APPROVE: all mandatory documents must be ACCEPTED
        ctx.document().setVerificationStatus(DocumentVerificationStatus.ACCEPTED);
        ctx.document().setVerificationProvenance(DocumentVerificationProvenance.DIRECT_REVIEW);
        documentRepository.saveAndFlush(ctx.document());

        CollegeRegistrationDocument signatoryDoc = new CollegeRegistrationDocument();
        signatoryDoc.setCollegeId(ctx.college().getId());
        signatoryDoc.setRegistrationId(ctx.registration().getId());
        signatoryDoc.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        signatoryDoc.setOriginalFilename("signatory.pdf");
        signatoryDoc.setMimeType("application/pdf");
        signatoryDoc.setFileSizeBytes(VALID_PDF_BYTES.length);
        signatoryDoc.setSha256Checksum("checksum_sig_freeze");
        signatoryDoc.setStorageKey("dummykey_sig_freeze");
        signatoryDoc.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);
        signatoryDoc.setVerificationProvenance(DocumentVerificationProvenance.DIRECT_REVIEW);
        documentRepository.saveAndFlush(signatoryDoc);

        // Super Admin approves the college application
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/decision", ctx.college().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReviewDecisionRequest(
                                ReviewDecisionAction.APPROVE,
                                collegeRepository.findById(ctx.college().getId()).orElseThrow().getVersion(),
                                "Institutional approval granted.",
                                null))))
                .andExpect(status().isOk());

        // Subsequent attempt to record document decision returns 409 APPLICATION_NOT_AWAITING_REVIEW
        DocumentReviewDecisionRequest docDecision = new DocumentReviewDecisionRequest(
                DocumentReviewAction.ACCEPT, null, null, 0L);
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docDecision)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));
    }

    @Test
    @DisplayName("Lifecycle freeze blocks document review on REQUEST_ACTION and REJECT, but allows review on new revision after resubmission")
    void documentReview_lifecycleFreeze_requestActionAndRejectAndResubmissionCycle() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();

        // --- PART 1: College-level REJECT freezes document review ---
        CollegeContext rejectCtx = seedPendingCollegeWithAdminAndDoc("COL_REJ", "College Rej", "admin_rej@col.edu");
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/decision", rejectCtx.college().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReviewDecisionRequest(
                                ReviewDecisionAction.REJECT,
                                collegeRepository.findById(rejectCtx.college().getId()).orElseThrow().getVersion(),
                                "Institutional credentials cannot be verified at this time.",
                                "Institutional credentials cannot be verified at this time."))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        rejectCtx.college().getId(), rejectCtx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 0L))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));

        // --- PART 2: College-level REQUEST_ACTION freezes document review, then resubmission unfreezes revision 2 ---
        CollegeContext actCtx = seedPendingCollegeWithAdminAndDoc("COL_ACT", "College Act", "admin_act@col.edu");

        // Super Admin rejects document 1 first
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        actCtx.college().getId(), actCtx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.REJECT, null, "Illegible affiliation document.", 0L))))
                .andExpect(status().isOk());

        // Super Admin commits REQUEST_ACTION
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/decision", actCtx.college().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReviewDecisionRequest(
                                ReviewDecisionAction.REQUEST_ACTION,
                                collegeRepository.findById(actCtx.college().getId()).orElseThrow().getVersion(),
                                "Please replace the illegible document.",
                                null))))
                .andExpect(status().isOk());

        // Document reviews on actCtx.document() are now frozen (409)
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        actCtx.college().getId(), actCtx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 1L))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));

        // College Admin creates correction draft (Rev 2)
        SessionCookies collegeAdmin = login("admin_act@col.edu", "AdminPass!2026");
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isCreated());

        // College Admin uploads replacement document
        MockMultipartFile file = new MockMultipartFile("file", "clean_affiliation.pdf", "application/pdf", VALID_PDF_BYTES);
        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(file)
                        .param("documentCategory", DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE.name())
                        .param("replacesDocumentId", String.valueOf(actCtx.document().getId()))
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andReturn();

        Long rev2DocId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // Also upload the other mandatory document (AUTHORIZED_SIGNATORY_ID) to satisfy full submission requirements
        MockMultipartFile signatoryFile = new MockMultipartFile("file", "clean_signatory.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(signatoryFile)
                        .param("documentCategory", DocumentCategory.AUTHORIZED_SIGNATORY_ID.name())
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isCreated());

        // While in draft (unsubmitted), Super Admin cannot review rev2 document yet (409)
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        actCtx.college().getId(), rev2DocId)
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 0L))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));

        // College Admin submits application revision 2
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                        .cookie(collegeAdmin.sessionCookie(), collegeAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", collegeAdmin.xsrfCookie().getValue()))
                .andExpect(status().isOk());

        // Now Super Admin CAN review rev2 replacement document!
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        actCtx.college().getId(), rev2DocId)
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, "Verified clean replacement", null, 0L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.version").value(1L));

        // Attempting to review rev1 document STILL fails with 409 APPLICATION_NOT_AWAITING_REVIEW (not active revision)
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        actCtx.college().getId(), actCtx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 1L))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));
    }

    // =========================================================================
    // 13. Append-Only Triggers: Direct UPDATE / DELETE are Strictly Prohibited
    // =========================================================================

    @Test
    @DisplayName("Database triggers prevent UPDATE and DELETE on college_document_reviews with SQLSTATE 45000")
    void documentReview_appendOnlyTrigger_prohibitsUpdateAndDelete() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // Record a valid ACCEPT decision
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 0L))))
                .andExpect(status().isOk());

        List<CollegeDocumentReview> reviews = documentReviewRepository
                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(ctx.college().getId(), ctx.document().getId());
        assertThat(reviews).hasSize(1);
        Long reviewId = reviews.getFirst().getId();

        // 1. Direct UPDATE must fail with SQLSTATE 45000
        assertThatThrownBy(() -> jdbcTemplate.update(
                "UPDATE college_document_reviews SET action = 'REJECTED' WHERE id = ?", reviewId))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("UPDATE operations are strictly prohibited");

        // 2. Direct DELETE must fail with SQLSTATE 45000
        assertThatThrownBy(() -> jdbcTemplate.update(
                "DELETE FROM college_document_reviews WHERE id = ?", reviewId))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("DELETE operations are strictly prohibited");
    }

    // =========================================================================
    // 14. Document Review History API
    // =========================================================================

    @Test
    @DisplayName("GET document review history returns chronological audit entries in descending order with reviewer emails")
    void documentReview_getHistory_returnsChronologicalAuditRecordsWithEmails() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // Review 1: ACCEPT at v0
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 0L))))
                .andExpect(status().isOk());

        // Review 2: Reversal to REJECT at v1
        String rejectionReason = "Document blurry upon second review pass.";
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.REJECT, null, rejectionReason, 1L))))
                .andExpect(status().isOk());

        // Fetch history
        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/history",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].action").value("REJECTED"))
                .andExpect(jsonPath("$.data[0].rejectionReason").value(rejectionReason))
                .andExpect(jsonPath("$.data[0].reviewerUserId").value(superAdminUser.getId()))
                .andExpect(jsonPath("$.data[0].reviewerEmail").value(SUPER_ADMIN_EMAIL))
                .andExpect(jsonPath("$.data[1].action").value("ACCEPTED"))
                .andExpect(jsonPath("$.data[1].rejectionReason").doesNotExist());
    }

    // =========================================================================
    // 15. College Review Detail Enriched Document Verification Fields
    // =========================================================================

    @Test
    @DisplayName("GET college review detail returns enriched document verification status, provenance, and reviewer info")
    void collegeReviewDetail_returnsEnrichedDocumentVerificationFields() throws Exception {
        SessionCookies superAdmin = setupSuperAdmin();
        CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

        // Record ACCEPT decision
        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision",
                        ctx.college().getId(), ctx.document().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DocumentReviewDecisionRequest(
                                DocumentReviewAction.ACCEPT, null, null, 0L))))
                .andExpect(status().isOk());

        // Fetch college review detail
        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/{collegeId}", ctx.college().getId())
                        .cookie(superAdmin.sessionCookie(), superAdmin.xsrfCookie())
                        .header("X-XSRF-TOKEN", superAdmin.xsrfCookie().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.activeDocuments[0].id").value(ctx.document().getId()))
                .andExpect(jsonPath("$.data.activeDocuments[0].verificationStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.activeDocuments[0].verificationProvenance").value("DIRECT_REVIEW"))
                .andExpect(jsonPath("$.data.activeDocuments[0].lastReviewedByUserId").value(superAdminUser.getId()))
                .andExpect(jsonPath("$.data.activeDocuments[0].version").value(1L));
    }
}
