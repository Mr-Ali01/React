package com.acadlytic.modules.colleges;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.dto.ReviewDecisionAction;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewDecisionResponse;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.entity.DocumentVerificationProvenance;
import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.service.CollegeLifecycleService;
import com.acadlytic.modules.colleges.service.CollegeReviewService;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.security.AcadlyticUserPrincipal;
import com.acadlytic.security.CollegeAccessGuard;
import com.acadlytic.security.SessionRevocationService;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CollegeLifecycleIntegrationTest extends AbstractMySqlIntegrationTest {

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
    private OutboxEmailRepository outboxEmailRepository;
    @Autowired
    private AuditEventRepository auditEventRepository;
    @Autowired
    private CollegeReviewService collegeReviewService;
    @Autowired
    private CollegeLifecycleService collegeLifecycleService;
    @Autowired
    private CollegeAccessGuard collegeAccessGuard;
    @Autowired
    private SessionRevocationService sessionRevocationService;
    @Autowired
    private DocumentStorageService documentStorageService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @SpyBean
    private OutboxEmailService outboxEmailService;

    private static final String SUPER_ADMIN_EMAIL = "superadmin@acadlytic.com";
    private static final String SUPER_ADMIN_PASS = "SuperAdminSecretPass!2026";
    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4 sample verification document".getBytes(StandardCharsets.US_ASCII);

    private User superAdminUser;

    @BeforeEach
    void cleanState() {
        SecurityContextHolder.clearContext();
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION_ATTRIBUTES");
        jdbcTemplate.execute("DELETE FROM SPRING_SESSION");
        jdbcTemplate.execute("TRUNCATE TABLE college_document_reviews");
        jdbcTemplate.execute("UPDATE colleges SET current_registration_id = NULL");
        jdbcTemplate.execute("UPDATE college_registration_documents SET source_document_id = NULL, source_registration_id = NULL, replaces_document_id = NULL");
        jdbcTemplate.execute("DELETE FROM college_registration_documents");
        jdbcTemplate.execute("DELETE FROM college_registrations");
        jdbcTemplate.execute("DELETE FROM outbox_emails");
        jdbcTemplate.execute("DELETE FROM auth_tokens");
        jdbcTemplate.execute("DELETE FROM audit_events");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM colleges");

        // Seed Super Admin
        superAdminUser = new User();
        superAdminUser.setEmail(SUPER_ADMIN_EMAIL);
        superAdminUser.setFirstName("Super");
        superAdminUser.setLastName("Admin");
        superAdminUser.setRole(Role.SUPER_ADMIN);
        superAdminUser.setStatus(UserStatus.ACTIVE);
        superAdminUser.setPasswordHash(passwordEncoder.encode(SUPER_ADMIN_PASS));
        superAdminUser.setEmailVerifiedAt(Instant.now());
        superAdminUser = userRepository.saveAndFlush(superAdminUser);
    }

    @AfterEach
    void tearDown() {
        reset(outboxEmailService);
        cleanState();
    }

    private void authenticateAsSuperAdmin() {
        AcadlyticUserPrincipal principal = new AcadlyticUserPrincipal(
                superAdminUser.getId(),
                superAdminUser.getEmail(),
                superAdminUser.getRole(),
                null
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    private void authenticateAsCollegeAdmin(User adminUser) {
        AcadlyticUserPrincipal principal = new AcadlyticUserPrincipal(
                adminUser.getId(),
                adminUser.getEmail(),
                adminUser.getRole(),
                adminUser.getCollegeId()
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    private record CollegeContext(College college, CollegeRegistration registration, User admin) {}

    private CollegeContext seedPendingCollege(String code, String name, String email) {
        College college = new College();
        college.setName(name);
        college.setCode(code);
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college.setResubmissionCount(0);
        college.setActionRequiredCount(0);
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
        doc.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);
        doc.setVerificationProvenance(DocumentVerificationProvenance.DIRECT_REVIEW);
        documentRepository.saveAndFlush(doc);

        var storedSign = documentStorageService.store(VALID_PDF_BYTES, "signatory.pdf", "application/pdf", "checksumSign123");
        CollegeRegistrationDocument docSign = new CollegeRegistrationDocument();
        docSign.setCollegeId(college.getId());
        docSign.setRegistrationId(reg.getId());
        docSign.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        docSign.setOriginalFilename("signatory.pdf");
        docSign.setMimeType("application/pdf");
        docSign.setFileSizeBytes(VALID_PDF_BYTES.length);
        docSign.setSha256Checksum("checksumSign123");
        docSign.setStorageKey(storedSign.storageKey());
        docSign.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);
        docSign.setVerificationProvenance(DocumentVerificationProvenance.DIRECT_REVIEW);
        documentRepository.saveAndFlush(docSign);

        return new CollegeContext(college, reg, admin);
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
        Cookie newXsrf = result.getResponse().getCookie("XSRF-TOKEN");
        return new SessionCookies(sessionCookie, newXsrf != null ? newXsrf : xsrf);
    }

    @Test
    @DisplayName("Scenario 1: Approval transitions college status to ACTIVE and unlocks guarded access")
    void scenario1_approvalTransitionsCollegeStatusToActiveAndUnlocksGuardedAccess() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-ACT1", "Active College", "admin@act1.edu");

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "All documents verified.", null);

        ReviewDecisionResponse response = collegeReviewService.recordDecision(ctx.college().getId(), request);

        assertThat(response.approvalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);

        College updated = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(updated.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(updated.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
        assertThat(updated.isManagementUnlocked()).isTrue();

        // Guard check now succeeds for the active college
        authenticateAsCollegeAdmin(ctx.admin());
        College guarded = collegeAccessGuard.requireApprovedAndActiveCollege(ctx.college().getId());
        assertThat(guarded.getId()).isEqualTo(ctx.college().getId());
    }

    @Test
    @DisplayName("Scenario 2: Academic access remains blocked before approval")
    void scenario2_academicAccessRemainsBlockedBeforeApproval() {
        CollegeContext ctx = seedPendingCollege("COLL-BLOCKED", "Blocked College", "admin@blocked.edu");

        authenticateAsCollegeAdmin(ctx.admin());

        assertThatThrownBy(() -> collegeAccessGuard.requireApprovedAndActiveCollege(ctx.college().getId()))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("COLLEGE_NOT_APPROVED");
    }

    @Test
    @DisplayName("Scenario 3: First and second correction rejections remain non-permanent")
    void scenario3_firstAndSecondCorrectionRejections_remainNonPermanent() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-NONPERM", "Non Perm Coll", "admin@nonperm.edu");

        // Round 1 rejection (resubmissionCount = 0)
        ReviewDecisionRequest req1 = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, ctx.college().getVersion(), null, "First round rejection reason.");
        collegeReviewService.recordDecision(ctx.college().getId(), req1);

        College c1 = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(c1.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(c1.isPermanentlyRejected()).isFalse();

        CollegeRegistration v2 = new CollegeRegistration();
        v2.setCollegeId(c1.getId());
        v2.setVersionNumber(2);
        v2.setStatus(CollegeApprovalStatus.PENDING);
        v2.setLegalName("Non Perm Coll v2");
        v2.setAddressLine1("Campus Road");
        v2.setCity("Metropolis");
        v2.setState("State");
        v2.setCountry("India");
        v2.setPostalCode("123456");
        v2.setContactPhone("+919876543210");
        v2.setAffiliatedUniversityName("Central University");
        v2.setSubmittedForReviewAt(Instant.now());
        v2 = registrationRepository.saveAndFlush(v2);

        c1.setResubmissionCount(1);
        c1.setApprovalStatus(CollegeApprovalStatus.PENDING);
        c1.setCurrentRegistrationId(v2.getId());
        c1 = collegeRepository.saveAndFlush(c1);

        // Round 2 rejection (resubmissionCount = 1)
        ReviewDecisionRequest req2 = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, c1.getVersion(), null, "Second round rejection reason.");
        collegeReviewService.recordDecision(c1.getId(), req2);

        College c2 = collegeRepository.findById(c1.getId()).orElseThrow();
        assertThat(c2.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(c2.isPermanentlyRejected()).isFalse();

        // Verify outbox emails enqueued: only non-permanent rejection emails
        List<OutboxEmail> outboxList = outboxEmailRepository.findAll();
        assertThat(outboxList)
                .filteredOn(e -> e.getEventType().equals("COLLEGE_REGISTRATION_REJECTED"))
                .hasSize(2);
        assertThat(outboxList)
                .filteredOn(e -> e.getEventType().equals("COLLEGE_REGISTRATION_PERMANENTLY_REJECTED"))
                .isEmpty();
    }

    @Test
    @DisplayName("Scenario 4: Third correction rejection triggers permanent rejection")
    void scenario4_thirdCorrectionRejection_triggersPermanentRejection() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("COLL-PERMREJ", "Perm Rej Coll", "admin@permrej.edu");

        // Advance to 3rd correction round (resubmissionCount = 3, version 4)
        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();

        CollegeRegistration v4 = new CollegeRegistration();
        v4.setCollegeId(col.getId());
        v4.setVersionNumber(4);
        v4.setStatus(CollegeApprovalStatus.PENDING);
        v4.setLegalName("Perm Rej Coll v4");
        v4.setAddressLine1("Campus Road");
        v4.setCity("Metropolis");
        v4.setState("State");
        v4.setCountry("India");
        v4.setPostalCode("123456");
        v4.setContactPhone("+919876543210");
        v4.setAffiliatedUniversityName("Central University");
        v4.setSubmittedForReviewAt(Instant.now());
        v4 = registrationRepository.saveAndFlush(v4);

        col.setResubmissionCount(3);
        col.setApprovalStatus(CollegeApprovalStatus.PENDING);
        col.setCurrentRegistrationId(v4.getId());
        col = collegeRepository.saveAndFlush(col);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, col.getVersion(), null, "Third correction submission rejected permanently.");
        collegeReviewService.recordDecision(col.getId(), request);

        College refreshedCol = collegeRepository.findById(col.getId()).orElseThrow();
        CollegeRegistration refreshedV4 = registrationRepository.findById(v4.getId()).orElseThrow();
        User refreshedAdmin = userRepository.findById(ctx.admin().getId()).orElseThrow();

        assertThat(refreshedCol.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(refreshedCol.getStatus()).isEqualTo(CollegeStatus.INACTIVE);
        assertThat(refreshedCol.isPermanentlyRejected()).isTrue();
        assertThat(refreshedV4.isPermanentRejection()).isTrue();
        assertThat(refreshedAdmin.getStatus()).isEqualTo(UserStatus.INACTIVE);
        assertThat(refreshedAdmin.isEmailReleased()).isTrue();

        List<AuditEvent> audits = auditEventRepository.findByCollegeId(col.getId());
        assertThat(audits)
                .anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_REGISTRATION_REJECTED)
                .anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_PERMANENTLY_REJECTED)
                .anyMatch(a -> a.getEventType() == AuditEventType.COLLEGE_ADMIN_DEACTIVATED);
    }

    @Test
    @DisplayName("Scenario 5: Fourth correction draft remains blocked")
    void scenario5_fourthCorrectionDraftRemainsBlocked() {
        CollegeContext ctx = seedPendingCollege("COLL-BLKDRAFT", "Blocked Draft", "admin@blkdraft.edu");
        ctx.college().setPermanentlyRejected(true);
        ctx.college().setStatus(CollegeStatus.INACTIVE);
        collegeRepository.saveAndFlush(ctx.college());

        authenticateAsCollegeAdmin(ctx.admin());

        assertThatThrownBy(() -> collegeAccessGuard.requireApprovedAndActiveCollege(ctx.college().getId()))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("REGISTRATION_PERMANENTLY_REJECTED");
    }

    @Test
    @DisplayName("Scenario 6: College code and email reservations are released and reusable")
    void scenario6_collegeCodeAndEmailReservations_releasedAndReusable() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("REUSE-CODE", "Reused College", "reuse@admin.edu");

        // Permanently reject the college
        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        col.setResubmissionCount(3);
        col = collegeRepository.saveAndFlush(col);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, col.getVersion(), null, "Permanently rejected.");
        collegeReviewService.recordDecision(col.getId(), request);

        // Verify MySQL VIRTUAL columns released the unique code and email
        // Now create a new College and User with the EXACT SAME code and email
        College newCollege = new College();
        newCollege.setName("New Brand Reused College");
        newCollege.setCode("REUSE-CODE");
        newCollege.setApprovalStatus(CollegeApprovalStatus.PENDING);
        newCollege.setStatus(CollegeStatus.PENDING_VERIFICATION);
        College savedNewCollege = collegeRepository.saveAndFlush(newCollege);

        User newAdmin = new User();
        newAdmin.setEmail("reuse@admin.edu");
        newAdmin.setFirstName("New");
        newAdmin.setLastName("Admin");
        newAdmin.setRole(Role.COLLEGE_ADMIN);
        newAdmin.setStatus(UserStatus.ACTIVE);
        newAdmin.setCollegeId(savedNewCollege.getId());
        newAdmin.setPasswordHash(passwordEncoder.encode("NewAdminPass!2026"));
        newAdmin.setEmailVerifiedAt(Instant.now());
        User savedNewAdmin = userRepository.saveAndFlush(newAdmin);

        assertThat(savedNewCollege.getId()).isNotNull();
        assertThat(savedNewAdmin.getId()).isNotNull();
    }

    @Test
    @DisplayName("Scenario 7: Existing sessions are revoked")
    void scenario7_existingSessionsAreRevoked() throws Exception {
        CollegeContext ctx = seedPendingCollege("SESS-REV", "Session Revoke", "sess@admin.edu");

        // Admin logs in to establish an active Spring Session
        SessionCookies cookies = login("sess@admin.edu", "AdminPass!2026");
        assertThat(cookies.sessionCookie()).isNotNull();

        assertThat(sessionRevocationService.countActiveSessionsForUser(ctx.admin().getId())).isGreaterThan(0);

        // Permanently reject college
        authenticateAsSuperAdmin();
        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        col.setResubmissionCount(3);
        col = collegeRepository.saveAndFlush(col);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, col.getVersion(), null, "Permanent rejection.");
        collegeReviewService.recordDecision(col.getId(), request);

        // Active sessions for the user must be 0
        assertThat(sessionRevocationService.countActiveSessionsForUser(ctx.admin().getId())).isEqualTo(0);
    }

    @Test
    @DisplayName("Scenario 8: Failure during outbox insertion rolls back lifecycle changes and audit events")
    void scenario8_failureDuringOutboxInsertion_rollsBackLifecycleChangesAndAuditEvents() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("ROLL-BK", "Rollback College", "admin@rollbk.edu");

        doThrow(new RuntimeException("Simulated outbox enqueue failure"))
                .when(outboxEmailService).enqueue(anyString(), anyString(), anyString(), anyString(), anyMap());

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approval notes.", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(ctx.college().getId(), request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Simulated outbox enqueue failure");

        // Database must be rolled back completely
        College refreshedCol = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        CollegeRegistration refreshedReg = registrationRepository.findById(ctx.registration().getId()).orElseThrow();

        assertThat(refreshedCol.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(refreshedCol.getStatus()).isEqualTo(CollegeStatus.PENDING_VERIFICATION);
        assertThat(refreshedReg.getStatus()).isEqualTo(CollegeApprovalStatus.PENDING);

        List<AuditEvent> audits = auditEventRepository.findByCollegeId(ctx.college().getId());
        assertThat(audits)
                .noneMatch(a -> a.getEventType() == AuditEventType.COLLEGE_ACTIVATED)
                .noneMatch(a -> a.getEventType() == AuditEventType.COLLEGE_REGISTRATION_APPROVED);
    }

    @Test
    @DisplayName("Scenario 9: Approval notification payload and event type")
    void scenario9_approvalNotificationPayloadAndEventType() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("OUTBOX-APPV", "Outbox Approve", "admin@outboxappv.edu");

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "All verified.", null);
        collegeReviewService.recordDecision(ctx.college().getId(), request);

        List<OutboxEmail> outboxList = outboxEmailRepository.findAll();
        assertThat(outboxList)
                .filteredOn(e -> e.getEventType().equals("COLLEGE_REGISTRATION_APPROVED"))
                .hasSize(1);

        OutboxEmail email = outboxList.stream()
                .filter(e -> e.getEventType().equals("COLLEGE_REGISTRATION_APPROVED"))
                .findFirst()
                .orElseThrow();

        assertThat(email.getRecipientEmail()).isEqualTo("admin@outboxappv.edu");
        assertThat(email.getTemplateKey()).isEqualTo("COLLEGE_REGISTRATION_APPROVED");
        assertThat(email.getPayloadJson()).contains("Outbox Approve");
        assertThat(email.getPayloadJson()).contains("OUTBOX-APPV");
    }

    @Test
    @DisplayName("Scenario 10: Permanent rejection creates only the permanent rejection notification")
    void scenario10_permanentRejection_createsOnlyPermanentRejectionNotification() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("OUTBOX-PERM", "Outbox Perm", "admin@outboxperm.edu");

        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        col.setResubmissionCount(3);
        col = collegeRepository.saveAndFlush(col);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, col.getVersion(), null, "Permanently rejected UGC violation.");
        collegeReviewService.recordDecision(col.getId(), request);

        List<OutboxEmail> outboxList = outboxEmailRepository.findAll();
        assertThat(outboxList)
                .filteredOn(e -> e.getEventType().equals("COLLEGE_REGISTRATION_PERMANENTLY_REJECTED"))
                .hasSize(1);
        assertThat(outboxList)
                .filteredOn(e -> e.getEventType().equals("COLLEGE_REGISTRATION_REJECTED"))
                .isEmpty();
    }

    @Test
    @DisplayName("Scenario 11: Unverified + unsubmitted registration older than seven days is archived")
    void scenario11_unverifiedAndUnsubmittedRegistration_olderThanSevenDays_isArchived() {
        College college = new College();
        college.setName("Abandoned College");
        college.setCode("ABANDON-1");
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college = collegeRepository.saveAndFlush(college);

        CollegeRegistration reg = new CollegeRegistration();
        reg.setCollegeId(college.getId());
        reg.setVersionNumber(1);
        reg.setStatus(CollegeApprovalStatus.PENDING);
        reg.setLegalName("Abandoned College Legal");
        reg.setAddressLine1("Campus Road");
        reg.setCity("Metropolis");
        reg.setState("State");
        reg.setCountry("India");
        reg.setPostalCode("123456");
        reg.setContactPhone("+919876543210");
        reg.setAffiliatedUniversityName("Central University");
        reg.setSubmittedForReviewAt(null); // Unsubmitted!
        reg = registrationRepository.saveAndFlush(reg);

        college.setCurrentRegistrationId(reg.getId());
        college = collegeRepository.saveAndFlush(college);

        User admin = new User();
        admin.setEmail("abandoned@admin.edu");
        admin.setFirstName("Abandon");
        admin.setLastName("Admin");
        admin.setRole(Role.COLLEGE_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setCollegeId(college.getId());
        admin.setPasswordHash(passwordEncoder.encode("Pass!2026"));
        admin.setEmailVerifiedAt(null); // Unverified!
        userRepository.saveAndFlush(admin);

        // Set college createdAt to 8 days ago
        Instant eightDaysAgo = Instant.now().minus(8, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE colleges SET created_at = ? WHERE id = ?", eightDaysAgo, college.getId());

        int processed = collegeLifecycleService.cleanupAbandonedRegistrations();
        assertThat(processed).isEqualTo(1);

        College archivedCol = collegeRepository.findById(college.getId()).orElseThrow();
        User deactivatedAdmin = userRepository.findByCollegeId(college.getId()).getFirst();

        assertThat(archivedCol.getStatus()).isEqualTo(CollegeStatus.INACTIVE);
        assertThat(archivedCol.getArchivedAt()).isNotNull();
        assertThat(deactivatedAdmin.getStatus()).isEqualTo(UserStatus.INACTIVE);
        assertThat(deactivatedAdmin.isEmailReleased()).isTrue();

        List<AuditEvent> audits = auditEventRepository.findByCollegeId(college.getId());
        assertThat(audits)
                .anyMatch(a -> a.getEventType() == AuditEventType.ABANDONED_REGISTRATION_ARCHIVED
                        && a.getActorUserId() == null);
    }

    @Test
    @DisplayName("Scenario 12: Verified-but-unsubmitted registration is not archived")
    void scenario12_verifiedButUnsubmittedRegistration_isNotArchived() {
        College college = new College();
        college.setName("Verified Unsubmitted College");
        college.setCode("VERIF-UNSUB");
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college = collegeRepository.saveAndFlush(college);

        CollegeRegistration reg = new CollegeRegistration();
        reg.setCollegeId(college.getId());
        reg.setVersionNumber(1);
        reg.setStatus(CollegeApprovalStatus.PENDING);
        reg.setLegalName("Verified Unsubmitted");
        reg.setAddressLine1("Campus Road");
        reg.setCity("Metropolis");
        reg.setState("State");
        reg.setCountry("India");
        reg.setPostalCode("123456");
        reg.setContactPhone("+919876543210");
        reg.setAffiliatedUniversityName("Central University");
        reg.setSubmittedForReviewAt(null); // Unsubmitted
        reg = registrationRepository.saveAndFlush(reg);

        college.setCurrentRegistrationId(reg.getId());
        college = collegeRepository.saveAndFlush(college);

        User admin = new User();
        admin.setEmail("verified@unsub.edu");
        admin.setFirstName("Verified");
        admin.setLastName("Admin");
        admin.setRole(Role.COLLEGE_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setCollegeId(college.getId());
        admin.setPasswordHash(passwordEncoder.encode("Pass!2026"));
        admin.setEmailVerifiedAt(Instant.now().minus(8, ChronoUnit.DAYS)); // Verified 8 days ago!
        userRepository.saveAndFlush(admin);

        Instant eightDaysAgo = Instant.now().minus(8, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE colleges SET created_at = ? WHERE id = ?", eightDaysAgo, college.getId());

        int processed = collegeLifecycleService.cleanupAbandonedRegistrations();
        assertThat(processed).isEqualTo(0);

        College col = collegeRepository.findById(college.getId()).orElseThrow();
        assertThat(col.getArchivedAt()).isNull();
        assertThat(col.getStatus()).isEqualTo(CollegeStatus.PENDING_VERIFICATION);
    }

    @Test
    @DisplayName("Scenario 13: Registration younger than seven days is not archived")
    void scenario13_registrationYoungerThanSevenDays_isNotArchived() {
        College college = new College();
        college.setName("Young College");
        college.setCode("YOUNG-1");
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college = collegeRepository.saveAndFlush(college);

        CollegeRegistration reg = new CollegeRegistration();
        reg.setCollegeId(college.getId());
        reg.setVersionNumber(1);
        reg.setStatus(CollegeApprovalStatus.PENDING);
        reg.setLegalName("Young College Legal");
        reg.setAddressLine1("Campus Road");
        reg.setCity("Metropolis");
        reg.setState("State");
        reg.setCountry("India");
        reg.setPostalCode("123456");
        reg.setContactPhone("+919876543210");
        reg.setAffiliatedUniversityName("Central University");
        reg.setSubmittedForReviewAt(null);
        reg = registrationRepository.saveAndFlush(reg);

        college.setCurrentRegistrationId(reg.getId());
        college = collegeRepository.saveAndFlush(college);

        User admin = new User();
        admin.setEmail("young@admin.edu");
        admin.setFirstName("Young");
        admin.setLastName("Admin");
        admin.setRole(Role.COLLEGE_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setCollegeId(college.getId());
        admin.setPasswordHash(passwordEncoder.encode("Pass!2026"));
        admin.setEmailVerifiedAt(null);
        userRepository.saveAndFlush(admin);

        // Only 5 days old
        Instant fiveDaysAgo = Instant.now().minus(5, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE colleges SET created_at = ? WHERE id = ?", fiveDaysAgo, college.getId());

        int processed = collegeLifecycleService.cleanupAbandonedRegistrations();
        assertThat(processed).isEqualTo(0);

        College col = collegeRepository.findById(college.getId()).orElseThrow();
        assertThat(col.getArchivedAt()).isNull();
    }

    @Test
    @DisplayName("Scenario 14: Submitted and ACTION_REQUIRED applications are not archived")
    void scenario14_submittedAndActionRequiredApplications_areNotArchived() {
        CollegeContext submittedCtx = seedPendingCollege("SUBMITTED-COL", "Submitted Col", "admin@subcol.edu");
        CollegeContext actionReqCtx = seedPendingCollege("ACTREQ-COL", "ActReq Col", "admin@actreqcol.edu");

        actionReqCtx.college().setApprovalStatus(CollegeApprovalStatus.ACTION_REQUIRED);
        collegeRepository.saveAndFlush(actionReqCtx.college());

        Instant tenDaysAgo = Instant.now().minus(10, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE colleges SET created_at = ? WHERE id = ?", tenDaysAgo, submittedCtx.college().getId());
        jdbcTemplate.update("UPDATE colleges SET created_at = ? WHERE id = ?", tenDaysAgo, actionReqCtx.college().getId());

        int processed = collegeLifecycleService.cleanupAbandonedRegistrations();
        assertThat(processed).isEqualTo(0);

        College c1 = collegeRepository.findById(submittedCtx.college().getId()).orElseThrow();
        College c2 = collegeRepository.findById(actionReqCtx.college().getId()).orElseThrow();

        assertThat(c1.getArchivedAt()).isNull();
        assertThat(c2.getArchivedAt()).isNull();
    }

    @Test
    @DisplayName("Scenario 15: Permanent rejection archival uses the permanent revision reviewed_at")
    void scenario15_permanentRejectionArchival_usesPermanentRevisionReviewedAt() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("ARCH-REVAT", "Arch RevAt", "admin@revat.edu");

        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        col.setResubmissionCount(3);
        col = collegeRepository.saveAndFlush(col);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, col.getVersion(), null, "Permanent rejection.");
        collegeReviewService.recordDecision(col.getId(), request);

        // Set permanent rejection revision reviewedAt to 8 days ago
        Instant eightDaysAgo = Instant.now().minus(8, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE college_registrations SET reviewed_at = ? WHERE college_id = ? AND is_permanent_rejection = TRUE",
                eightDaysAgo, ctx.college().getId());

        // Update college updated_at to 1 hour ago to prove college.updated_at is NOT the retention clock
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        jdbcTemplate.update("UPDATE colleges SET updated_at = ? WHERE id = ?", oneHourAgo, ctx.college().getId());

        int archived = collegeLifecycleService.archivePermanentlyRejectedColleges();
        assertThat(archived).isEqualTo(1);

        College refreshed = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(refreshed.getArchivedAt()).isNotNull();

        List<AuditEvent> audits = auditEventRepository.findByCollegeId(ctx.college().getId());
        assertThat(audits)
                .anyMatch(a -> a.getEventType() == AuditEventType.PERMANENTLY_REJECTED_COLLEGE_ARCHIVED);
    }

    @Test
    @DisplayName("Scenario 16: Retention boundary behavior is verified")
    void scenario16_retentionBoundaryBehavior_verified() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("RET-BOUND", "Retention Bound", "admin@retbound.edu");

        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        col.setResubmissionCount(3);
        col = collegeRepository.saveAndFlush(col);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, col.getVersion(), null, "Permanent rejection.");
        collegeReviewService.recordDecision(col.getId(), request);

        // Set reviewedAt to 6 days and 23 hours ago (immediately before 7-day boundary)
        Instant boundaryMinusOneHour = Instant.now().minus(7, ChronoUnit.DAYS).plus(1, ChronoUnit.HOURS);
        jdbcTemplate.update("UPDATE college_registrations SET reviewed_at = ? WHERE college_id = ? AND is_permanent_rejection = TRUE",
                boundaryMinusOneHour, ctx.college().getId());

        int countBefore = collegeLifecycleService.archivePermanentlyRejectedColleges();
        assertThat(countBefore).isEqualTo(0);
        assertThat(collegeRepository.findById(ctx.college().getId()).orElseThrow().getArchivedAt()).isNull();

        // Advance reviewedAt to 7 days and 1 hour ago (past the 7-day boundary)
        Instant boundaryPlusOneHour = Instant.now().minus(7, ChronoUnit.DAYS).minus(1, ChronoUnit.HOURS);
        jdbcTemplate.update("UPDATE college_registrations SET reviewed_at = ? WHERE college_id = ? AND is_permanent_rejection = TRUE",
                boundaryPlusOneHour, ctx.college().getId());

        int countAfter = collegeLifecycleService.archivePermanentlyRejectedColleges();
        assertThat(countAfter).isEqualTo(1);
        assertThat(collegeRepository.findById(ctx.college().getId()).orElseThrow().getArchivedAt()).isNotNull();
    }

    @Test
    @DisplayName("Scenario 17: Sweeper retries previously failed physical deletions, including records older than 30 days")
    void scenario17_sweeperRetriesFailedDeletions_includingOlderThanThirtyDays() {
        College college = new College();
        college.setName("Sweeper Test College");
        college.setCode("SWEEP-30");
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.INACTIVE);
        college.setArchivedAt(Instant.now().minus(45, ChronoUnit.DAYS)); // Archived 45 days ago!
        college = collegeRepository.saveAndFlush(college);

        CollegeRegistration reg = new CollegeRegistration();
        reg.setCollegeId(college.getId());
        reg.setVersionNumber(1);
        reg.setStatus(CollegeApprovalStatus.PENDING);
        reg.setLegalName("Sweeper Test Legal");
        reg.setAddressLine1("Campus Road");
        reg.setCity("Metropolis");
        reg.setState("State");
        reg.setCountry("India");
        reg.setPostalCode("123456");
        reg.setContactPhone("+919876543210");
        reg.setAffiliatedUniversityName("Central University");
        reg.setSubmittedForReviewAt(null); // Draft unsubmitted
        reg = registrationRepository.saveAndFlush(reg);

        college.setCurrentRegistrationId(reg.getId());
        college = collegeRepository.saveAndFlush(college);

        // Store physical file
        var stored = documentStorageService.store(VALID_PDF_BYTES, "residual.pdf", "application/pdf", "checksumSweep");
        assertThat(documentStorageService.exists(stored.storageKey())).isTrue();

        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setCollegeId(college.getId());
        doc.setRegistrationId(reg.getId());
        doc.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc.setOriginalFilename("residual.pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc.setSha256Checksum("checksumSweep");
        doc.setStorageKey(stored.storageKey());
        documentRepository.saveAndFlush(doc);

        // Run sweeper: must pick up this 45-day-old record and purge physical file
        int swept = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();
        assertThat(swept).isGreaterThanOrEqualTo(1);

        // Physical file must now be deleted from storage
        assertThat(documentStorageService.exists(stored.storageKey())).isFalse();

        // Database document metadata row is preserved and stamped with filePurgedAt
        CollegeRegistrationDocument purgedDoc = documentRepository.findById(doc.getId()).orElseThrow();
        assertThat(purgedDoc.getFilePurgedAt()).isNotNull();
        assertThat(purgedDoc.getOriginalFilename()).isEqualTo("residual.pdf");
        assertThat(purgedDoc.getSha256Checksum()).isEqualTo("checksumSweep");

        // Subsequent sweeper run excludes already-purged documents
        int sweptAgain = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();
        assertThat(sweptAgain).isEqualTo(0);
    }

    @Test
    @DisplayName("Scenario 18: Concurrent review and cleanup operations preserve consistency")
    void scenario18_concurrentReviewAndCleanup_preserveConsistency() {
        authenticateAsSuperAdmin();
        CollegeContext ctx = seedPendingCollege("CONCURR-1", "Concurrent College", "admin@concurr.edu");

        // Execute review decision APPROVE
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, ctx.college().getVersion(), "Approval.", null);
        collegeReviewService.recordDecision(ctx.college().getId(), request);

        // Simultaneous cleanup attempt will exclude approved college
        int cleaned = collegeLifecycleService.cleanupAbandonedRegistrations();
        assertThat(cleaned).isEqualTo(0);

        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        assertThat(col.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
        assertThat(col.getArchivedAt()).isNull();
    }

    @Test
    @DisplayName("Scenario 19: Session validation rejects permanently rejected and inactive accounts")
    void scenario19_sessionValidationRejectsPermanentlyRejectedAndInactiveAccounts() throws Exception {
        CollegeContext ctx = seedPendingCollege("SESS-VAL", "Session Val", "sessval@admin.edu");

        // Login as College Admin
        SessionCookies cookies = login("sessval@admin.edu", "AdminPass!2026");
        assertThat(cookies.sessionCookie()).isNotNull();

        // Verify valid access before permanent rejection
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(cookies.sessionCookie(), cookies.xsrfCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("sessval@admin.edu"));

        // Permanently reject the college
        authenticateAsSuperAdmin();
        College col = collegeRepository.findById(ctx.college().getId()).orElseThrow();
        col.setResubmissionCount(3);
        col = collegeRepository.saveAndFlush(col);

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, col.getVersion(), null, "Permanent rejection.");
        collegeReviewService.recordDecision(col.getId(), request);

        // Request with previous session cookie must be rejected (session was revoked)
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(cookies.sessionCookie(), cookies.xsrfCookie()))
                .andExpect(status().isUnauthorized());
    }

    private CollegeContext seedAbandonedCandidate(String code, String name, String email) {
        College college = new College();
        college.setName(name);
        college.setCode(code);
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college.setResubmissionCount(0);
        college.setActionRequiredCount(0);
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
        reg.setSubmittedForReviewAt(null);
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
        admin.setPasswordHash(passwordEncoder.encode("Pass!2026"));
        admin.setEmailVerifiedAt(null);
        admin = userRepository.saveAndFlush(admin);

        Instant tenDaysAgo = Instant.now().minus(10, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE colleges SET created_at = ? WHERE id = ?", tenDaysAgo, college.getId());

        return new CollegeContext(college, reg, admin);
    }

    @Test
    @DisplayName("Scenario 20: Abandoned cleanup strictly excludes unexpected college states, non-initial revisions, and inactive users")
    void scenario20_abandonedCleanup_strictlyExcludesUnexpectedStatesAndRevisions() {
        // 1. Unexpected college operational status (ACTIVE instead of PENDING_VERIFICATION)
        CollegeContext activeColCtx = seedAbandonedCandidate("ACTIVE-COL", "Active Col", "admin@activecol.edu");
        activeColCtx.college().setStatus(CollegeStatus.ACTIVE);
        collegeRepository.saveAndFlush(activeColCtx.college());

        // 2. Unexpected approval status (APPROVED instead of PENDING)
        CollegeContext approvedColCtx = seedAbandonedCandidate("APPR-COL", "Approved Col", "admin@apprcol.edu");
        approvedColCtx.college().setApprovalStatus(CollegeApprovalStatus.APPROVED);
        collegeRepository.saveAndFlush(approvedColCtx.college());

        // 3. Resubmission count > 0 on college (correction round in progress)
        CollegeContext resubColCtx = seedAbandonedCandidate("RESUB-COL", "Resub Col", "admin@resubcol.edu");
        resubColCtx.college().setResubmissionCount(1);
        collegeRepository.saveAndFlush(resubColCtx.college());

        // 4. Non-initial registration revision (versionNumber = 2)
        CollegeContext v2ColCtx = seedAbandonedCandidate("V2-COL", "V2 Col", "admin@v2col.edu");
        CollegeRegistration v2Reg = new CollegeRegistration();
        v2Reg.setCollegeId(v2ColCtx.college().getId());
        v2Reg.setVersionNumber(2);
        v2Reg.setStatus(CollegeApprovalStatus.PENDING);
        v2Reg.setLegalName("V2 Legal Name");
        v2Reg.setAddressLine1("Street 2");
        v2Reg.setCity("City");
        v2Reg.setState("State");
        v2Reg.setCountry("Country");
        v2Reg.setPostalCode("12345");
        v2Reg.setContactPhone("1234567890");
        v2Reg.setAffiliatedUniversityName("University");
        v2Reg.setSubmittedForReviewAt(null);
        v2Reg = registrationRepository.saveAndFlush(v2Reg);
        v2ColCtx.college().setCurrentRegistrationId(v2Reg.getId());
        collegeRepository.saveAndFlush(v2ColCtx.college());

        // 5. Inactive admin user
        CollegeContext inactUserCtx = seedAbandonedCandidate("INACT-USER", "Inact User Col", "admin@inactuser.edu");
        inactUserCtx.admin().setStatus(UserStatus.INACTIVE);
        userRepository.saveAndFlush(inactUserCtx.admin());

        // Run abandoned cleanup
        int processed = collegeLifecycleService.cleanupAbandonedRegistrations();
        assertThat(processed).isEqualTo(0);

        // Assert all 5 colleges remain untouched (archived_at IS NULL)
        assertThat(collegeRepository.findById(activeColCtx.college().getId()).orElseThrow().getArchivedAt()).isNull();
        assertThat(collegeRepository.findById(approvedColCtx.college().getId()).orElseThrow().getArchivedAt()).isNull();
        assertThat(collegeRepository.findById(resubColCtx.college().getId()).orElseThrow().getArchivedAt()).isNull();
        assertThat(collegeRepository.findById(v2ColCtx.college().getId()).orElseThrow().getArchivedAt()).isNull();
        assertThat(collegeRepository.findById(inactUserCtx.college().getId()).orElseThrow().getArchivedAt()).isNull();
    }

    @Test
    @DisplayName("Scenario 21: Sweeper handles missing files idempotently, marks filePurgedAt, and preserves metadata")
    void scenario21_sweeper_handlesMissingFilesIdempotently_marksFilePurgedAt() {
        College college = new College();
        college.setName("Missing File College");
        college.setCode("MISS-FILE-1");
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.INACTIVE);
        college.setArchivedAt(Instant.now().minus(10, ChronoUnit.DAYS));
        college = collegeRepository.saveAndFlush(college);

        CollegeRegistration reg = new CollegeRegistration();
        reg.setCollegeId(college.getId());
        reg.setVersionNumber(1);
        reg.setStatus(CollegeApprovalStatus.PENDING);
        reg.setLegalName("Missing File Legal");
        reg.setAddressLine1("Campus Road");
        reg.setCity("Metropolis");
        reg.setState("State");
        reg.setCountry("India");
        reg.setPostalCode("123456");
        reg.setContactPhone("+919876543210");
        reg.setAffiliatedUniversityName("Central University");
        reg.setSubmittedForReviewAt(null);
        reg = registrationRepository.saveAndFlush(reg);

        college.setCurrentRegistrationId(reg.getId());
        college = collegeRepository.saveAndFlush(college);

        // Document with storage key that does NOT exist on disk
        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setCollegeId(college.getId());
        doc.setRegistrationId(reg.getId());
        doc.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc.setOriginalFilename("already-missing.pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSizeBytes(1024L);
        doc.setSha256Checksum("checksumMissing");
        doc.setStorageKey("non-existent-storage-key.pdf");
        doc = documentRepository.saveAndFlush(doc);

        assertThat(documentStorageService.exists("non-existent-storage-key.pdf")).isFalse();
        assertThat(doc.getFilePurgedAt()).isNull();

        // Run sweeper: must recognize missing file, stamp filePurgedAt, and preserve database row
        int swept = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();
        assertThat(swept).isGreaterThanOrEqualTo(1);

        CollegeRegistrationDocument updatedDoc = documentRepository.findById(doc.getId()).orElseThrow();
        assertThat(updatedDoc.getFilePurgedAt()).isNotNull();
        assertThat(updatedDoc.getOriginalFilename()).isEqualTo("already-missing.pdf");
        assertThat(updatedDoc.getSha256Checksum()).isEqualTo("checksumMissing");
    }

    @Test
    @DisplayName("Scenario 22: Documents belonging to submitted registrations or active colleges are never purged")
    void scenario22_documentsOfSubmittedOrActiveColleges_areNeverPurged() {
        // 1. Submitted registration on archived college
        College col1 = new College();
        col1.setName("Submitted Archived College");
        col1.setCode("SUB-ARCH-1");
        col1.setApprovalStatus(CollegeApprovalStatus.PENDING);
        col1.setStatus(CollegeStatus.INACTIVE);
        col1.setArchivedAt(Instant.now().minus(15, ChronoUnit.DAYS));
        col1 = collegeRepository.saveAndFlush(col1);

        CollegeRegistration reg1 = new CollegeRegistration();
        reg1.setCollegeId(col1.getId());
        reg1.setVersionNumber(1);
        reg1.setStatus(CollegeApprovalStatus.PENDING);
        reg1.setLegalName("Sub Arch Legal");
        reg1.setAddressLine1("Street 1");
        reg1.setCity("City");
        reg1.setState("State");
        reg1.setCountry("India");
        reg1.setPostalCode("123456");
        reg1.setContactPhone("+919876543210");
        reg1.setAffiliatedUniversityName("University");
        reg1.setSubmittedForReviewAt(Instant.now().minus(20, ChronoUnit.DAYS)); // Submitted!
        reg1 = registrationRepository.saveAndFlush(reg1);
        col1.setCurrentRegistrationId(reg1.getId());
        collegeRepository.saveAndFlush(col1);

        var stored1 = documentStorageService.store(VALID_PDF_BYTES, "submitted_doc.pdf", "application/pdf", "chkSub");
        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setCollegeId(col1.getId());
        doc1.setRegistrationId(reg1.getId());
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("submitted_doc.pdf");
        doc1.setMimeType("application/pdf");
        doc1.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc1.setSha256Checksum("chkSub");
        doc1.setStorageKey(stored1.storageKey());
        doc1 = documentRepository.saveAndFlush(doc1);

        // 2. Active college with draft document
        College col2 = new College();
        col2.setName("Active College");
        col2.setCode("ACTIVE-DOC-1");
        col2.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        col2.setStatus(CollegeStatus.ACTIVE);
        col2 = collegeRepository.saveAndFlush(col2);

        CollegeRegistration reg2 = new CollegeRegistration();
        reg2.setCollegeId(col2.getId());
        reg2.setVersionNumber(1);
        reg2.setStatus(CollegeApprovalStatus.APPROVED);
        reg2.setLegalName("Active Col Legal");
        reg2.setAddressLine1("Street 2");
        reg2.setCity("City");
        reg2.setState("State");
        reg2.setCountry("India");
        reg2.setPostalCode("123456");
        reg2.setContactPhone("+919876543210");
        reg2.setAffiliatedUniversityName("University");
        reg2.setSubmittedForReviewAt(null);
        reg2 = registrationRepository.saveAndFlush(reg2);
        col2.setCurrentRegistrationId(reg2.getId());
        collegeRepository.saveAndFlush(col2);

        var stored2 = documentStorageService.store(VALID_PDF_BYTES, "active_doc.pdf", "application/pdf", "chkActive");
        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setCollegeId(col2.getId());
        doc2.setRegistrationId(reg2.getId());
        doc2.setDocumentCategory(DocumentCategory.INSTITUTION_REGISTRATION_PROOF);
        doc2.setOriginalFilename("active_doc.pdf");
        doc2.setMimeType("application/pdf");
        doc2.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc2.setSha256Checksum("chkActive");
        doc2.setStorageKey(stored2.storageKey());
        doc2 = documentRepository.saveAndFlush(doc2);

        // Run sweeper: neither doc1 nor doc2 should be touched
        int swept = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();
        assertThat(swept).isEqualTo(0);

        // Files on disk must remain present
        assertThat(documentStorageService.exists(stored1.storageKey())).isTrue();
        assertThat(documentStorageService.exists(stored2.storageKey())).isTrue();

        // Database records must have filePurgedAt == NULL
        assertThat(documentRepository.findById(doc1.getId()).orElseThrow().getFilePurgedAt()).isNull();
        assertThat(documentRepository.findById(doc2.getId()).orElseThrow().getFilePurgedAt()).isNull();
    }

    @Test
    @DisplayName("Scenario 23: Failed document retry across scheduled runs - sweeper advances and retries older failed doc")
    void scenario23_failedDocumentRetryAcrossScheduledRuns_sweeperAdvancesAndRetriesOlderFailedDoc() throws Exception {
        // Seed unsubmitted abandoned draft registration on an archived college
        College college = new College();
        college.setName("Retry Sweeper College");
        college.setCode("RETRY-SWEEP-1");
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.INACTIVE);
        college.setArchivedAt(Instant.now().minus(12, ChronoUnit.DAYS));
        college = collegeRepository.saveAndFlush(college);

        CollegeRegistration reg = new CollegeRegistration();
        reg.setCollegeId(college.getId());
        reg.setVersionNumber(1);
        reg.setStatus(CollegeApprovalStatus.PENDING);
        reg.setLegalName("Retry Sweeper Legal");
        reg.setAddressLine1("Campus Road");
        reg.setCity("Metropolis");
        reg.setState("State");
        reg.setCountry("India");
        reg.setPostalCode("123456");
        reg.setContactPhone("+919876543210");
        reg.setAffiliatedUniversityName("Central University");
        reg.setSubmittedForReviewAt(null); // Unsubmitted draft!
        reg = registrationRepository.saveAndFlush(reg);

        college.setCurrentRegistrationId(reg.getId());
        college = collegeRepository.saveAndFlush(college);

        // Seed 2 documents on disk and in database
        var stored1 = documentStorageService.store(VALID_PDF_BYTES, "retry_doc1.pdf", "application/pdf", "chkRetry1");
        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setCollegeId(college.getId());
        doc1.setRegistrationId(reg.getId());
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("retry_doc1.pdf");
        doc1.setMimeType("application/pdf");
        doc1.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc1.setSha256Checksum("chkRetry1");
        doc1.setStorageKey(stored1.storageKey());
        doc1 = documentRepository.saveAndFlush(doc1);

        var stored2 = documentStorageService.store(VALID_PDF_BYTES, "retry_doc2.pdf", "application/pdf", "chkRetry2");
        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setCollegeId(college.getId());
        doc2.setRegistrationId(reg.getId());
        doc2.setDocumentCategory(DocumentCategory.INSTITUTION_REGISTRATION_PROOF);
        doc2.setOriginalFilename("retry_doc2.pdf");
        doc2.setMimeType("application/pdf");
        doc2.setFileSizeBytes(VALID_PDF_BYTES.length);
        doc2.setSha256Checksum("chkRetry2");
        doc2.setStorageKey(stored2.storageKey());
        doc2 = documentRepository.saveAndFlush(doc2);

        // Ensure doc1 has lower ID than doc2
        assertThat(doc1.getId()).isLessThan(doc2.getId());
        assertThat(documentStorageService.exists(doc1.getStorageKey())).isTrue();
        assertThat(documentStorageService.exists(doc2.getStorageKey())).isTrue();
        assertThat(doc1.getFilePurgedAt()).isNull();
        assertThat(doc2.getFilePurgedAt()).isNull();

        Path doc1FilePath = documentStorageService.getStoragePath().resolve(doc1.getStorageKey());

        // RUN 1: Hold file lock on doc1 to simulate OS-level deletion failure
        int run1Swept;
        try (FileOutputStream fos = new FileOutputStream(doc1FilePath.toFile())) {
            // Execute sweeper: doc1 deletion will fail due to file lock, but sweeper must advance and process doc2
            run1Swept = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();
        }

        // Run 1 assertions:
        // doc1 failed -> not counted in sweptCount, filePurgedAt remains NULL, file remains on disk
        // doc2 succeeded -> counted in sweptCount, filePurgedAt stamped, file deleted from disk
        assertThat(run1Swept).isEqualTo(1);

        CollegeRegistrationDocument doc1AfterRun1 = documentRepository.findById(doc1.getId()).orElseThrow();
        CollegeRegistrationDocument doc2AfterRun1 = documentRepository.findById(doc2.getId()).orElseThrow();

        assertThat(doc1AfterRun1.getFilePurgedAt()).isNull();
        assertThat(documentStorageService.exists(doc1.getStorageKey())).isTrue();

        assertThat(doc2AfterRun1.getFilePurgedAt()).isNotNull();
        assertThat(documentStorageService.exists(doc2.getStorageKey())).isFalse();

        // RUN 2: Lock released. Execute sweeper again in a separate run.
        // Sweeper keyset cursor resets to 0L. Keyset query re-selects doc1 (since filePurgedAt IS NULL)
        // and skips doc2 (since filePurgedAt IS NOT NULL).
        int run2Swept = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();

        // Run 2 assertions:
        // doc1 is retried and succeeds -> file deleted, filePurgedAt stamped
        // doc2 is ignored
        assertThat(run2Swept).isEqualTo(1);

        CollegeRegistrationDocument doc1AfterRun2 = documentRepository.findById(doc1.getId()).orElseThrow();
        CollegeRegistrationDocument doc2AfterRun2 = documentRepository.findById(doc2.getId()).orElseThrow();

        assertThat(doc1AfterRun2.getFilePurgedAt()).isNotNull();
        assertThat(documentStorageService.exists(doc1.getStorageKey())).isFalse();

        assertThat(doc2AfterRun2.getFilePurgedAt()).isNotNull();
        assertThat(documentStorageService.exists(doc2.getStorageKey())).isFalse();

        // Database metadata rows for both documents remain preserved
        assertThat(doc1AfterRun2.getOriginalFilename()).isEqualTo("retry_doc1.pdf");
        assertThat(doc1AfterRun2.getSha256Checksum()).isEqualTo("chkRetry1");
        assertThat(doc2AfterRun2.getOriginalFilename()).isEqualTo("retry_doc2.pdf");
        assertThat(doc2AfterRun2.getSha256Checksum()).isEqualTo("chkRetry2");

        // RUN 3: Subsequent sweeper run finds 0 eligible documents
        int run3Swept = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();
        assertThat(run3Swept).isEqualTo(0);
    }
}
