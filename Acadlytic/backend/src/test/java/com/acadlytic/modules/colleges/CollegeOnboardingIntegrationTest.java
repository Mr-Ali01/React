package com.acadlytic.modules.colleges;

import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.dto.RegisterCollegeRequest;
import com.acadlytic.modules.colleges.dto.UpdateApplicationRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CollegeOnboardingIntegrationTest extends AbstractMySqlIntegrationTest {

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
    private JdbcTemplate jdbcTemplate;

    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4 sample verification document".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] VALID_JPEG_BYTES = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46};

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
        cleanState();
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
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = result.getResponse().getCookie("ACADLYTIC_SID");
        Cookie updatedXsrf = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(sessionCookie).isNotNull();
        return new SessionCookies(sessionCookie, updatedXsrf != null ? updatedXsrf : xsrf);
    }

    private void simulateActionRequired(Long collegeId, String reviewNotes) {
        Long currentRegistrationId = jdbcTemplate.queryForObject(
                "SELECT current_registration_id FROM colleges WHERE id = ?", Long.class, collegeId);
        jdbcTemplate.update(
                "UPDATE college_registrations SET status = 'ACTION_REQUIRED', review_notes = ?, reviewed_at = NOW() WHERE id = ?",
                reviewNotes, currentRegistrationId);
        jdbcTemplate.update(
                "UPDATE colleges SET approval_status = 'ACTION_REQUIRED' WHERE id = ?",
                collegeId);
    }

    private void simulateRejected(Long collegeId, String rejectionReason, boolean permanent) {
        Long currentRegistrationId = jdbcTemplate.queryForObject(
                "SELECT current_registration_id FROM colleges WHERE id = ?", Long.class, collegeId);
        jdbcTemplate.update(
                "UPDATE college_registrations SET status = 'REJECTED', rejection_reason = ?, is_permanent_rejection = ?, reviewed_at = NOW() WHERE id = ?",
                rejectionReason, permanent, currentRegistrationId);
        jdbcTemplate.update(
                "UPDATE colleges SET approval_status = 'REJECTED', permanently_rejected = ? WHERE id = ?",
                permanent, collegeId);
    }

    private RegisteredContext setupRegisteredCollege(String code, String email) throws Exception {
        Cookie xsrf = fetchCsrfCookie();
        RegisterCollegeRequest req = new RegisterCollegeRequest(
                "Apex Institute of Technology",
                code,
                "State Tech University",
                "100 Tech Boulevard",
                null,
                "Denver",
                "Colorado",
                "United States",
                "80202",
                "https://apex.edu",
                "+1-303-555-0199",
                "Arthur",
                "Pendleton",
                email,
                "StrongP@ssword2026!"
        );

        mockMvc.perform(post("/api/v1/college-registrations")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        College college = collegeRepository.findByCode(code).orElseThrow();
        User user = userRepository.findByEmailAndEmailReleasedFalse(email).orElseThrow();
        CollegeRegistration rev1 = registrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(college.getId()).orElseThrow();
        SessionCookies session = login(email, "StrongP@ssword2026!");

        return new RegisteredContext(college, user, rev1, session);
    }

    @Test
    @DisplayName("Scenario 1: Happy Path Initial Onboarding, Document Upload, Submission & Freeze Guarantee")
    void testHappyPathInitialOnboardingAndFreeze() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX01", "admin@apex.edu");

        // 1. Check initial GET /my-application
        mockMvc.perform(get("/api/v1/college-registrations/my-application")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentRevision.isDraft").value(true))
                .andExpect(jsonPath("$.data.checklist.emailVerified").value(false))
                .andExpect(jsonPath("$.data.checklist.requiredDocumentsUploaded").value(false))
                .andExpect(jsonPath("$.data.checklist.canSubmitForReview").value(false));

        // 2. Verify email in DB
        ctx.user().setEmailVerifiedAt(Instant.now());
        userRepository.save(ctx.user());

        // 3. Upload UNIVERSITY_AFFILIATION_CERTIFICATE
        MockMultipartFile affiliationPdf = new MockMultipartFile(
                "file", "affiliation.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(affiliationPdf)
                        .param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.documentCategory").value("UNIVERSITY_AFFILIATION_CERTIFICATE"));

        // 4. Upload AUTHORIZED_SIGNATORY_ID
        MockMultipartFile signatoryJpg = new MockMultipartFile(
                "file", "signatory.jpg", "image/jpeg", VALID_JPEG_BYTES);

        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(signatoryJpg)
                        .param("documentCategory", "AUTHORIZED_SIGNATORY_ID")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.documentCategory").value("AUTHORIZED_SIGNATORY_ID"));

        // 5. Check checklist: canSubmitForReview should now be true
        mockMvc.perform(get("/api/v1/college-registrations/my-application")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checklist.emailVerified").value(true))
                .andExpect(jsonPath("$.data.checklist.requiredDocumentsUploaded").value(true))
                .andExpect(jsonPath("$.data.checklist.canSubmitForReview").value(true))
                .andExpect(jsonPath("$.data.activeDocuments.length()").value(2));

        // 6. Submit for review
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // 7. Verify DB state: revision frozen, college current_registration_id set
        College updatedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistration submittedRev = registrationRepository.findById(updatedCollege.getCurrentRegistrationId()).orElseThrow();
        assertThat(submittedRev.getSubmittedForReviewAt()).isNotNull();
        assertThat(submittedRev.getStatus()).isEqualTo(CollegeApprovalStatus.PENDING);

        // 8. Mutations now frozen: upload returns 409 APPLICATION_FROZEN_IN_REVIEW
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                        .file(affiliationPdf)
                        .param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_FROZEN_IN_REVIEW"));

        // 9. Profile update returns 409
        UpdateApplicationRequest updateReq = new UpdateApplicationRequest(
                "Apex New Name", "Address", null, "City", "State", "Country", "12345", null, "+123", "Univ");
        mockMvc.perform(put("/api/v1/college-registrations/my-application")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_FROZEN_IN_REVIEW"));
    }

    @Test
    @DisplayName("Scenario 2: Pre-Submission Gates Reject Unverified Email and Missing Documents")
    void testPreSubmissionGates() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX02", "admin02@apex.edu");

        // 1. Submit with unverified email -> 400 EMAIL_NOT_VERIFIED
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("EMAIL_NOT_VERIFIED"));

        // 2. Verify email
        ctx.user().setEmailVerifiedAt(Instant.now());
        userRepository.save(ctx.user());

        // 3. Submit with email verified but missing docs -> 400 REQUIRED_DOCUMENTS_MISSING
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("REQUIRED_DOCUMENTS_MISSING"));
    }

    @Test
    @DisplayName("Scenario 3: Multi-Revision Lineage Walkthrough Rev 1 -> Rev 2 -> Rev 3")
    void testMultiRevisionLineageWalkthrough() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX03", "admin03@apex.edu");
        ctx.user().setEmailVerifiedAt(Instant.now());
        userRepository.save(ctx.user());

        // Upload Rev 1 required docs
        MockMultipartFile affiliationPdf = new MockMultipartFile("file", "aff1.pdf", "application/pdf", VALID_PDF_BYTES);
        MockMultipartFile signatoryJpg = new MockMultipartFile("file", "sig1.jpg", "image/jpeg", VALID_JPEG_BYTES);

        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(affiliationPdf).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isCreated());

        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(signatoryJpg).param("documentCategory", "AUTHORIZED_SIGNATORY_ID")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isCreated());

        // Submit Rev 1
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        // Super Admin sets status = ACTION_REQUIRED
        simulateActionRequired(ctx.college().getId(), "Please upload a clearer signatory ID");

        // College Admin starts Correction Draft Rev 2
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.versionNumber").value(2))
                .andExpect(jsonPath("$.data.isDraft").value(true));

        // In Rev 2, replace signatory ID
        MockMultipartFile newSigJpg = new MockMultipartFile("file", "sig2_clear.jpg", "image/jpeg", VALID_JPEG_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(newSigJpg).param("documentCategory", "AUTHORIZED_SIGNATORY_ID")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated());

        // Submit Rev 2
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        Integer actionReqCount = jdbcTemplate.queryForObject(
                "SELECT action_required_count FROM colleges WHERE id = ?", Integer.class, ctx.college().getId());
        Integer resubCount = jdbcTemplate.queryForObject(
                "SELECT resubmission_count FROM colleges WHERE id = ?", Integer.class, ctx.college().getId());
        assertThat(actionReqCount).isEqualTo(1);
        assertThat(resubCount).isEqualTo(0);

        // Super Admin rejects Rev 2 (non-permanent)
        simulateRejected(ctx.college().getId(), "Affiliation certificate expired", false);

        // Start Correction Draft Rev 3
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.versionNumber").value(3));

        // Submit Rev 3
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        Integer actionReqCountAfterRev3 = jdbcTemplate.queryForObject(
                "SELECT action_required_count FROM colleges WHERE id = ?", Integer.class, ctx.college().getId());
        Integer resubCountAfterRev3 = jdbcTemplate.queryForObject(
                "SELECT resubmission_count FROM colleges WHERE id = ?", Integer.class, ctx.college().getId());
        assertThat(actionReqCountAfterRev3).isEqualTo(1);
        assertThat(resubCountAfterRev3).isEqualTo(1);

        // Verify history has 3 revisions
        List<CollegeRegistration> allRevs = registrationRepository.findByCollegeIdOrderByVersionNumberAsc(ctx.college().getId());
        assertThat(allRevs).hasSize(3);
    }

    @Test
    @DisplayName("Scenario 4: Review Feedback Decoupled During Correction Draft")
    void testReviewFeedbackDecoupledDuringCorrectionDraft() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX04", "admin04@apex.edu");
        ctx.user().setEmailVerifiedAt(Instant.now());
        userRepository.save(ctx.user());

        // Setup submitted rev 1
        MockMultipartFile aff = new MockMultipartFile("file", "aff.pdf", "application/pdf", VALID_PDF_BYTES);
        MockMultipartFile sig = new MockMultipartFile("file", "sig.jpg", "image/jpeg", VALID_JPEG_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents").file(aff).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents").file(sig).param("documentCategory", "AUTHORIZED_SIGNATORY_ID").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));

        // Mark ACTION_REQUIRED
        simulateActionRequired(ctx.college().getId(), "Mandatory update: Provide official 2026 affiliation certificate.");

        // Start correction draft
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));

        // Check GET /my-application: reviewFeedback is visible while editing draft
        mockMvc.perform(get("/api/v1/college-registrations/my-application")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentRevision.isDraft").value(true))
                .andExpect(jsonPath("$.data.currentRevision.versionNumber").value(2))
                .andExpect(jsonPath("$.data.reviewFeedback.reviewNotes").value("Mandatory update: Provide official 2026 affiliation certificate."));
    }

    @Test
    @DisplayName("Scenario 5: Replacement Document Deletion Restores Predecessor to Active Set")
    void testReplacementDeletionRestoresPredecessor() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX05", "admin05@apex.edu");

        MockMultipartFile aff1 = new MockMultipartFile("file", "aff1.pdf", "application/pdf", VALID_PDF_BYTES);
        MvcResult res1 = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(aff1).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andReturn();

        long doc1Id = objectMapper.readTree(res1.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Upload replacement
        MockMultipartFile aff2 = new MockMultipartFile("file", "aff2_replacement.pdf", "application/pdf", VALID_PDF_BYTES);
        MvcResult res2 = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(aff2).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                .param("replacesDocumentId", String.valueOf(doc1Id))
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andReturn();

        long doc2Id = objectMapper.readTree(res2.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Active docs should contain only doc2
        mockMvc.perform(get("/api/v1/college-registrations/my-application/documents").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(doc2Id));

        // Delete doc2 (replacement)
        mockMvc.perform(delete("/api/v1/college-registrations/my-application/documents/" + doc2Id)
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isOk());

        // Active docs should now contain doc1 restored!
        mockMvc.perform(get("/api/v1/college-registrations/my-application/documents").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(doc1Id));
    }

    @Test
    @DisplayName("Scenario 6: Cross-Revision Replacement ID is Rejected with 400")
    void testCrossRevisionReplacementIdRejected() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX06", "admin06@apex.edu");
        ctx.user().setEmailVerifiedAt(Instant.now());
        userRepository.save(ctx.user());

        MockMultipartFile aff = new MockMultipartFile("file", "aff.pdf", "application/pdf", VALID_PDF_BYTES);
        MockMultipartFile sig = new MockMultipartFile("file", "sig.jpg", "image/jpeg", VALID_JPEG_BYTES);
        MvcResult resAff = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents").file(aff).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andReturn();
        long rev1DocId = objectMapper.readTree(resAff.getResponse().getContentAsString()).path("data").path("id").asLong();

        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents").file(sig).param("documentCategory", "AUTHORIZED_SIGNATORY_ID").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));

        // Mark ACTION_REQUIRED & create Rev 2 draft
        simulateActionRequired(ctx.college().getId(), "Need re-upload");

        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));

        // Attempt replacement using doc from Rev 1
        MockMultipartFile aff2 = new MockMultipartFile("file", "aff2.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(aff2).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                .param("replacesDocumentId", String.valueOf(rev1DocId))
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("CROSS_REVISION_REPLACEMENT_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("Scenario 7: Replacement Category Mismatch is Rejected with 400")
    void testReplacementCategoryMismatchRejected() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX07", "admin07@apex.edu");

        MockMultipartFile aff = new MockMultipartFile("file", "aff.pdf", "application/pdf", VALID_PDF_BYTES);
        MvcResult resAff = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(aff).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andReturn();
        long affId = objectMapper.readTree(resAff.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Attempt replacement with mismatched category
        MockMultipartFile sig = new MockMultipartFile("file", "sig.jpg", "image/jpeg", VALID_JPEG_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(sig).param("documentCategory", "AUTHORIZED_SIGNATORY_ID")
                .param("replacesDocumentId", String.valueOf(affId))
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("CATEGORY_MISMATCH_ON_REPLACEMENT"));
    }

    @Test
    @DisplayName("Scenario 8: Draft Profile Update Synchronizes College Tenant Name")
    void testDraftProfileUpdateSyncsCollegeName() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX08", "admin08@apex.edu");

        UpdateApplicationRequest updateReq = new UpdateApplicationRequest(
                "Apex Renamed College of Engineering",
                "200 Innovation Way",
                "Floor 4",
                "Boulder",
                "Colorado",
                "United States",
                "80301",
                "https://apex-engineering.edu",
                "+1-303-555-0888",
                "University of Colorado"
        );

        mockMvc.perform(put("/api/v1/college-registrations/my-application")
                        .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie())
                        .header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.legalName").value("Apex Renamed College of Engineering"));

        College updatedCollege = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(updatedCollege.getName()).isEqualTo("Apex Renamed College of Engineering");
    }

    @Test
    @DisplayName("Scenario 9: Document Download Tenant Isolation and Safe Headers")
    void testDocumentDownloadTenantIsolationAndSafeHeaders() throws Exception {
        RegisteredContext ctx1 = setupRegisteredCollege("APEX09A", "admin09a@apex.edu");
        RegisteredContext ctx2 = setupRegisteredCollege("APEX09B", "admin09b@apex.edu");

        MockMultipartFile aff = new MockMultipartFile("file", "collegeA_doc.pdf", "application/pdf", VALID_PDF_BYTES);
        MvcResult res = mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents")
                .file(aff).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE")
                .cookie(ctx1.session().sessionCookie(), ctx1.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx1.session().xsrfCookie().getValue()))
                .andExpect(status().isCreated())
                .andReturn();

        long docId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("id").asLong();

        // 1. Owner downloads -> 200 OK with safe headers
        mockMvc.perform(get("/api/v1/college-registrations/my-application/documents/" + docId)
                        .cookie(ctx1.session().sessionCookie(), ctx1.session().xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"collegeA_doc.pdf\""))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/pdf"));

        // 2. Cross-tenant attempt -> 403 ACCESS_DENIED
        mockMvc.perform(get("/api/v1/college-registrations/my-application/documents/" + docId)
                        .cookie(ctx2.session().sessionCookie(), ctx2.session().xsrfCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Scenario 10: Mixed Lifecycle Counter Boundary Enforces 3 Max Rejection Resubmissions")
    void testMixedLifecycleCounterBoundary() throws Exception {
        RegisteredContext ctx = setupRegisteredCollege("APEX10", "admin10@apex.edu");
        ctx.user().setEmailVerifiedAt(Instant.now());
        userRepository.save(ctx.user());

        MockMultipartFile aff = new MockMultipartFile("file", "aff.pdf", "application/pdf", VALID_PDF_BYTES);
        MockMultipartFile sig = new MockMultipartFile("file", "sig.jpg", "image/jpeg", VALID_JPEG_BYTES);
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents").file(aff).param("documentCategory", "UNIVERSITY_AFFILIATION_CERTIFICATE").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));
        mockMvc.perform(multipart("/api/v1/college-registrations/my-application/documents").file(sig).param("documentCategory", "AUTHORIZED_SIGNATORY_ID").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()));

        // Step 1: Submit Rev 1 -> (0, 0)
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        // Step 2: ACTION_REQUIRED -> Rev 2 draft -> submit Rev 2 -> (1, 0)
        simulateActionRequired(ctx.college().getId(), "Action required notes");
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        // Step 3: REJECTED -> Rev 3 draft -> submit Rev 3 -> (1, 1) [1st rejected resubmission]
        simulateRejected(ctx.college().getId(), "Rejection 1", false);
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        // Step 4: REJECTED -> Rev 4 draft -> submit Rev 4 -> (1, 2) [2nd rejected resubmission]
        simulateRejected(ctx.college().getId(), "Rejection 2", false);
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        // Step 5: REJECTED -> Rev 5 draft -> submit Rev 5 -> (1, 3) [3rd rejected resubmission]
        simulateRejected(ctx.college().getId(), "Rejection 3", false);
        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/college-registrations/my-application/submit").cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue())).andExpect(status().isOk());

        Integer finalResubCount = jdbcTemplate.queryForObject(
                "SELECT resubmission_count FROM colleges WHERE id = ?", Integer.class, ctx.college().getId());
        assertThat(finalResubCount).isEqualTo(3);

        // Step 6: 4th rejection occurs -> attempt to start correction draft 6 -> 400 MAX_RESUBMISSION_LIMIT_EXCEEDED
        simulateRejected(ctx.college().getId(), "Rejection 4", false);

        mockMvc.perform(post("/api/v1/college-registrations/my-application/correction-draft")
                .cookie(ctx.session().sessionCookie(), ctx.session().xsrfCookie()).header("X-XSRF-TOKEN", ctx.session().xsrfCookie().getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MAX_RESUBMISSION_LIMIT_EXCEEDED"));
    }

    private record RegisteredContext(
            College college,
            User user,
            CollegeRegistration registration,
            SessionCookies session
    ) {}

    private record SessionCookies(Cookie sessionCookie, Cookie xsrfCookie) {}
}
