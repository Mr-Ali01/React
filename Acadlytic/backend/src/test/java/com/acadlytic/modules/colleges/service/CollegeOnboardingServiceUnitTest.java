package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.DocumentProperties;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.dto.CurrentRevisionResponse;
import com.acadlytic.modules.colleges.dto.DocumentResponse;
import com.acadlytic.modules.colleges.dto.MyApplicationResponse;
import com.acadlytic.modules.colleges.dto.SubmitApplicationResponse;
import com.acadlytic.modules.colleges.dto.UpdateApplicationRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.storage.DocumentStorageCompensationHandler;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.modules.colleges.storage.DocumentValidator;
import com.acadlytic.modules.colleges.storage.StoredFileMetadata;
import com.acadlytic.security.AcadlyticUserPrincipal;
import com.acadlytic.security.CollegeAccessGuard;
import com.acadlytic.security.SecurityContextService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeOnboardingServiceUnitTest {

    @Mock
    private CollegeRepository collegeRepository;
    @Mock
    private CollegeRegistrationRepository collegeRegistrationRepository;
    @Mock
    private CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DocumentStorageService documentStorageService;
    @Mock
    private DocumentValidator documentValidator;
    @Mock
    private DocumentStorageCompensationHandler compensationHandler;
    @Mock
    private AuditEventService auditEventService;
    @Mock
    private CollegeAccessGuard collegeAccessGuard;
    @Mock
    private SecurityContextService securityContextService;

    private DocumentProperties documentProperties;
    private CollegeOnboardingService onboardingService;

    private College testCollege;
    private User testUser;
    private AcadlyticUserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        documentProperties = new DocumentProperties();
        documentProperties.setMaxActiveDocsPerRevision(5);

        onboardingService = new CollegeOnboardingService(
                collegeRepository,
                collegeRegistrationRepository,
                collegeRegistrationDocumentRepository,
                userRepository,
                documentStorageService,
                documentValidator,
                compensationHandler,
                auditEventService,
                collegeAccessGuard,
                securityContextService,
                documentProperties);

        testCollege = new College();
        testCollege.setId(10L);
        testCollege.setName("Test Engineering College");
        testCollege.setCode("TEC001");
        testCollege.setApprovalStatus(CollegeApprovalStatus.PENDING);
        testCollege.setStatus(CollegeStatus.PENDING_VERIFICATION);
        testCollege.setPermanentlyRejected(false);
        testCollege.setResubmissionCount(0);
        testCollege.setActionRequiredCount(0);

        testUser = new User();
        testUser.setId(100L);
        testUser.setEmail("admin@tec.edu");
        testUser.setCollegeId(10L);
        testUser.setRole(Role.COLLEGE_ADMIN);

        testPrincipal = new AcadlyticUserPrincipal(100L, "admin@tec.edu", Role.COLLEGE_ADMIN, 10L);
    }

    @Test
    @DisplayName("getMyApplication returns initial draft state with unverified email checklist")
    void getMyApplicationInitialDraft() {
        when(collegeAccessGuard.requireRestrictedOnboardingAccess()).thenReturn(testCollege);
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);

        CollegeRegistration rev1 = createRevision(1, null, CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findByCollegeIdOrderByVersionNumberAsc(10L))
                .thenReturn(List.of(rev1));
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(collegeRegistrationDocumentRepository.findByRegistrationId(rev1.getId()))
                .thenReturn(List.of());

        MyApplicationResponse response = onboardingService.getMyApplication();

        assertThat(response).isNotNull();
        assertThat(response.currentRevision().isDraft()).isTrue();
        assertThat(response.checklist().emailVerified()).isFalse();
        assertThat(response.checklist().canSubmitForReview()).isFalse();
        assertThat(response.reviewFeedback()).isNull();
        assertThat(response.activeDocuments()).isEmpty();
    }

    @Test
    @DisplayName("getMyApplication decouples review feedback from submitted revision during correction draft")
    void getMyApplicationDecoupledFeedback() {
        testCollege.setCurrentRegistrationId(1L);
        when(collegeAccessGuard.requireRestrictedOnboardingAccess()).thenReturn(testCollege);
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);

        CollegeRegistration rev1 = createRevision(1, Instant.now().minusSeconds(3600), CollegeApprovalStatus.ACTION_REQUIRED);
        rev1.setReviewNotes("Please attach certified signatory ID.");
        rev1.setReviewedAt(Instant.now().minusSeconds(1800));

        CollegeRegistration rev2Draft = createRevision(2, null, CollegeApprovalStatus.PENDING);

        when(collegeRegistrationRepository.findByCollegeIdOrderByVersionNumberAsc(10L))
                .thenReturn(List.of(rev1, rev2Draft));
        when(collegeRegistrationRepository.findById(1L)).thenReturn(Optional.of(rev1));

        testUser.setEmailVerifiedAt(Instant.now().minusSeconds(7200));
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(collegeRegistrationDocumentRepository.findByRegistrationId(rev2Draft.getId()))
                .thenReturn(List.of());

        MyApplicationResponse response = onboardingService.getMyApplication();

        assertThat(response.currentRevision().versionNumber()).isEqualTo(2);
        assertThat(response.currentRevision().isDraft()).isTrue();
        assertThat(response.reviewFeedback()).isNotNull();
        assertThat(response.reviewFeedback().reviewNotes()).isEqualTo("Please attach certified signatory ID.");
    }

    @Test
    @DisplayName("createCorrectionDraft throws INITIAL_REGISTRATION_NOT_SUBMITTED when pointer is null")
    void createCorrectionDraftNullPointerThrows() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        assertThatThrownBy(() -> onboardingService.createCorrectionDraft())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Initial registration has not been submitted");
    }

    @Test
    @DisplayName("createCorrectionDraft throws APPLICATION_FROZEN_IN_REVIEW when submitted revision is PENDING")
    void createCorrectionDraftPendingThrows() {
        testCollege.setCurrentRegistrationId(1L);
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev1 = createRevision(1, Instant.now(), CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findById(1L)).thenReturn(Optional.of(rev1));

        assertThatThrownBy(() -> onboardingService.createCorrectionDraft())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Application is currently frozen under review");
    }

    @Test
    @DisplayName("createCorrectionDraft throws MAX_ACTION_REQUIRED_LIMIT_EXCEEDED when count is 10")
    void createCorrectionDraftMaxActionRequired() {
        testCollege.setCurrentRegistrationId(1L);
        testCollege.setActionRequiredCount(10);
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev1 = createRevision(1, Instant.now(), CollegeApprovalStatus.ACTION_REQUIRED);
        when(collegeRegistrationRepository.findById(1L)).thenReturn(Optional.of(rev1));

        assertThatThrownBy(() -> onboardingService.createCorrectionDraft())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Maximum action required corrections limit (10) exceeded");
    }

    @Test
    @DisplayName("createCorrectionDraft throws MAX_RESUBMISSION_LIMIT_EXCEEDED when count is 3")
    void createCorrectionDraftMaxResubmissions() {
        testCollege.setCurrentRegistrationId(1L);
        testCollege.setResubmissionCount(3);
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev1 = createRevision(1, Instant.now(), CollegeApprovalStatus.REJECTED);
        when(collegeRegistrationRepository.findById(1L)).thenReturn(Optional.of(rev1));

        assertThatThrownBy(() -> onboardingService.createCorrectionDraft())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Maximum resubmission limit (3) exceeded");
    }

    @Test
    @DisplayName("createCorrectionDraft idempotently returns existing unsubmitted draft without creating new revision")
    void createCorrectionDraftIdempotentReturn() {
        testCollege.setCurrentRegistrationId(1L);
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev1 = createRevision(1, Instant.now(), CollegeApprovalStatus.ACTION_REQUIRED);
        CollegeRegistration rev2Draft = createRevision(2, null, CollegeApprovalStatus.PENDING);

        when(collegeRegistrationRepository.findById(1L)).thenReturn(Optional.of(rev1));
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(rev2Draft));

        CurrentRevisionResponse response = onboardingService.createCorrectionDraft();

        assertThat(response.versionNumber()).isEqualTo(2);
        assertThat(response.isDraft()).isTrue();
        verify(collegeRegistrationRepository, never()).save(any());
    }

    @Test
    @DisplayName("createCorrectionDraft creates revision v+1 and clones active documents sharing storage keys")
    void createCorrectionDraftCreatesNewRevision() {
        testCollege.setCurrentRegistrationId(1L);
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev1 = createRevision(1, Instant.now(), CollegeApprovalStatus.ACTION_REQUIRED);
        when(collegeRegistrationRepository.findById(1L)).thenReturn(Optional.of(rev1));
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(rev1));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(50L);
        doc1.setCollegeId(10L);
        doc1.setRegistrationId(1L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setStorageKey("shared-key-123.pdf");
        doc1.setOriginalFilename("affiliation.pdf");
        doc1.setMimeType("application/pdf");
        doc1.setFileSizeBytes(1024);
        doc1.setSha256Checksum("sha256-abc");

        when(collegeRegistrationDocumentRepository.findByRegistrationId(1L)).thenReturn(List.of(doc1));
        when(documentStorageService.duplicate(any(), any(), any(), anyLong(), any()))
                .thenReturn(new StoredFileMetadata("new-key-456.pdf", "affiliation.pdf", "application/pdf", 1024, "sha256-abc"));
        when(collegeRegistrationRepository.save(any(CollegeRegistration.class))).thenAnswer(i -> {
            CollegeRegistration r = i.getArgument(0);
            r.setId(2L);
            return r;
        });

        CurrentRevisionResponse response = onboardingService.createCorrectionDraft();

        assertThat(response.versionNumber()).isEqualTo(2);
        assertThat(response.isDraft()).isTrue();
        verify(collegeRegistrationDocumentRepository).save(any(CollegeRegistrationDocument.class));
    }

    @Test
    @DisplayName("updateDraftProfile updates profile fields and synchronizes college tenant name")
    void updateDraftProfileSyncsCollegeName() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev1 = createRevision(1, null, CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(rev1));
        when(collegeRegistrationRepository.save(any())).thenReturn(rev1);

        UpdateApplicationRequest request = new UpdateApplicationRequest(
                "Updated College Name",
                "New Address 1",
                "Suite 200",
                "City",
                "State",
                "Country",
                "12345",
                "https://new.edu",
                "+1234567890",
                "New State University"
        );

        CurrentRevisionResponse response = onboardingService.updateDraftProfile(request);

        assertThat(response).isNotNull();
        assertThat(testCollege.getName()).isEqualTo("Updated College Name");
        verify(collegeRepository).save(testCollege);
    }

    @Test
    @DisplayName("updateDraftProfile rejects updates when application is frozen in review")
    void updateDraftProfileFrozenThrows() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev1 = createRevision(1, Instant.now(), CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(rev1));

        UpdateApplicationRequest request = new UpdateApplicationRequest(
                "Updated Name", "Addr", null, "City", "State", "Country", "12345", null, "+1", "Univ");

        assertThatThrownBy(() -> onboardingService.updateDraftProfile(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Application is currently frozen under review");
    }

    @Test
    @DisplayName("uploadDocument rejects cross-revision replacement IDs with 400 CROSS_REVISION_REPLACEMENT_NOT_ALLOWED")
    void uploadDocumentRejectsCrossRevisionReplacement() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration rev2Draft = createRevision(2, null, CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(rev2Draft));

        // Doc from Revision 1
        CollegeRegistrationDocument docFromRev1 = new CollegeRegistrationDocument();
        docFromRev1.setId(50L);
        docFromRev1.setCollegeId(10L);
        docFromRev1.setRegistrationId(1L);

        when(collegeRegistrationDocumentRepository.findByRegistrationId(rev2Draft.getId()))
                .thenReturn(List.of()); // Draft has no docs
        when(collegeRegistrationDocumentRepository.findByIdAndCollegeId(50L, 10L))
                .thenReturn(Optional.of(docFromRev1));

        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "%PDF-sample".getBytes());
        when(documentValidator.validate(any(), any(), any()))
                .thenReturn(new DocumentValidator.ValidatedDocument("%PDF-sample".getBytes(), "test.pdf", "application/pdf", 11, "sha-123"));

        assertThatThrownBy(() -> onboardingService.uploadDocument(file, DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE, 50L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("replacesDocumentId must belong to the active draft revision");
    }

    @Test
    @DisplayName("deleteDocument removes document from draft and restores predecessor to active set")
    void deleteDocumentRestoresPredecessor() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration draft = createRevision(1, null, CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(draft));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(101L);
        doc1.setCollegeId(10L);
        doc1.setRegistrationId(draft.getId());
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);

        CollegeRegistrationDocument doc2Replacement = new CollegeRegistrationDocument();
        doc2Replacement.setId(102L);
        doc2Replacement.setCollegeId(10L);
        doc2Replacement.setRegistrationId(draft.getId());
        doc2Replacement.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc2Replacement.setReplacesDocumentId(101L);

        when(collegeRegistrationDocumentRepository.findById(102L)).thenReturn(Optional.of(doc2Replacement));
        when(collegeRegistrationDocumentRepository.findByRegistrationId(draft.getId()))
                .thenReturn(List.of(doc1, doc2Replacement));

        onboardingService.deleteDocument(102L);

        verify(collegeRegistrationDocumentRepository).delete(doc2Replacement);
        verify(documentStorageService, never()).delete(any()); // Retained on disk!
    }

    @Test
    @DisplayName("submitApplicationForReview rejects submission if email is not verified")
    void submitRejectsUnverifiedEmail() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration draft = createRevision(1, null, CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(draft));
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser)); // emailVerifiedAt is null

        assertThatThrownBy(() -> onboardingService.submitApplicationForReview())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Email must be verified before submitting");
    }

    @Test
    @DisplayName("submitApplicationForReview rejects submission if required documents missing")
    void submitRejectsMissingRequiredDocuments() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration draft = createRevision(1, null, CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(draft));

        testUser.setEmailVerifiedAt(Instant.now());
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(collegeRegistrationDocumentRepository.findByRegistrationId(draft.getId()))
                .thenReturn(List.of()); // No documents

        assertThatThrownBy(() -> onboardingService.submitApplicationForReview())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Required verification documents missing");
    }

    @Test
    @DisplayName("submitApplicationForReview successfully freezes initial revision and updates current_registration_id")
    void submitInitialRegistrationSuccess() {
        when(securityContextService.requireCurrentPrincipal()).thenReturn(testPrincipal);
        when(collegeRepository.findByIdWithLock(10L)).thenReturn(Optional.of(testCollege));

        CollegeRegistration draft = createRevision(1, null, CollegeApprovalStatus.PENDING);
        when(collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(draft));

        testUser.setEmailVerifiedAt(Instant.now());
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(draft.getId());
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(2L);
        doc2.setRegistrationId(draft.getId());
        doc2.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);

        when(collegeRegistrationDocumentRepository.findByRegistrationId(draft.getId()))
                .thenReturn(List.of(doc1, doc2));
        when(collegeRegistrationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SubmitApplicationResponse response = onboardingService.submitApplicationForReview();

        assertThat(response).isNotNull();
        assertThat(draft.getSubmittedForReviewAt()).isNotNull();
        assertThat(testCollege.getCurrentRegistrationId()).isEqualTo(draft.getId());
        verify(collegeRepository).save(testCollege);
    }

    private CollegeRegistration createRevision(int versionNumber, Instant submittedAt, CollegeApprovalStatus status) {
        CollegeRegistration r = new CollegeRegistration();
        r.setId((long) versionNumber);
        r.setCollegeId(10L);
        r.setVersionNumber(versionNumber);
        r.setStatus(status);
        r.setLegalName("Test College");
        r.setAddressLine1("Line 1");
        r.setCity("City");
        r.setState("State");
        r.setCountry("Country");
        r.setPostalCode("12345");
        r.setContactPhone("+123");
        r.setAffiliatedUniversityName("University");
        r.setSubmittedForReviewAt(submittedAt);
        return r;
    }
}
