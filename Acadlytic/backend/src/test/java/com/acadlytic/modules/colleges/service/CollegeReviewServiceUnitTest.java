package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.dto.PageResponse;
import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.dto.CollegeReviewDetailResponse;
import com.acadlytic.modules.colleges.dto.DocumentDownload;
import com.acadlytic.modules.colleges.dto.ReviewDecisionAction;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewDecisionResponse;
import com.acadlytic.modules.colleges.dto.ReviewQueueItemResponse;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.security.SecurityContextService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeReviewServiceUnitTest {

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
    private AuditEventService auditEventService;
    @Mock
    private SecurityContextService securityContextService;
    @Mock
    private CollegeLifecycleService collegeLifecycleService;

    @InjectMocks
    private CollegeReviewService collegeReviewService;

    private College pendingCollege;
    private CollegeRegistration pendingRegistration;
    private User activeAdmin;
    private CollegeRegistrationDocument document1;
    private CollegeRegistrationDocument document2SupersedingDoc1;

    @BeforeEach
    void setUp() {
        pendingCollege = new College();
        pendingCollege.setId(101L);
        pendingCollege.setName("Osmania University");
        pendingCollege.setCode("OU-TECH");
        pendingCollege.setApprovalStatus(CollegeApprovalStatus.PENDING);
        pendingCollege.setStatus(CollegeStatus.PENDING_VERIFICATION);
        pendingCollege.setCurrentRegistrationId(205L);
        pendingCollege.setResubmissionCount(0);
        pendingCollege.setActionRequiredCount(0);

        pendingRegistration = new CollegeRegistration();
        pendingRegistration.setId(205L);
        pendingRegistration.setCollegeId(101L);
        pendingRegistration.setVersionNumber(1);
        pendingRegistration.setStatus(CollegeApprovalStatus.PENDING);
        pendingRegistration.setLegalName("Osmania University");
        pendingRegistration.setSubmittedForReviewAt(Instant.now());

        activeAdmin = new User();
        activeAdmin.setId(55L);
        activeAdmin.setCollegeId(101L);
        activeAdmin.setFirstName("Sarah");
        activeAdmin.setLastName("Jenkins");
        activeAdmin.setEmail("admin@outech.ac.in");
        activeAdmin.setRole(Role.COLLEGE_ADMIN);
        activeAdmin.setStatus(UserStatus.ACTIVE);

        document1 = new CollegeRegistrationDocument();
        document1.setId(501L);
        document1.setCollegeId(101L);
        document1.setRegistrationId(205L);
        document1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        document1.setOriginalFilename("aff_v1.pdf");
        document1.setMimeType("application/pdf");
        document1.setFileSizeBytes(1024L);
        document1.setStorageKey("key-501");

        document2SupersedingDoc1 = new CollegeRegistrationDocument();
        document2SupersedingDoc1.setId(502L);
        document2SupersedingDoc1.setCollegeId(101L);
        document2SupersedingDoc1.setRegistrationId(205L);
        document2SupersedingDoc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        document2SupersedingDoc1.setOriginalFilename("aff_v2.pdf");
        document2SupersedingDoc1.setMimeType("application/pdf");
        document2SupersedingDoc1.setFileSizeBytes(2048L);
        document2SupersedingDoc1.setReplacesDocumentId(501L);
        document2SupersedingDoc1.setStorageKey("key-502");
    }

    @Test
    @DisplayName("getPendingReviewQueue - returns PageResponse with correctly mapped active documents and admin")
    void getPendingReviewQueue_success() {
        when(collegeRegistrationRepository.findPendingReviewQueue(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(pendingRegistration)));
        when(collegeRepository.findAllById(List.of(101L))).thenReturn(List.of(pendingCollege));
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));
        when(collegeRegistrationDocumentRepository.findByRegistrationIdIn(List.of(205L)))
                .thenReturn(List.of(document1, document2SupersedingDoc1));

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, "submittedForReviewAt,asc");

        assertThat(response.content()).hasSize(1);
        ReviewQueueItemResponse item = response.content().getFirst();
        assertThat(item.collegeId()).isEqualTo(101L);
        assertThat(item.collegeCode()).isEqualTo("OU-TECH");
        assertThat(item.adminName()).isEqualTo("Sarah Jenkins");
        assertThat(item.adminEmail()).isEqualTo("admin@outech.ac.in");
        // Document 1 is superseded by document 2, so active count must be 1
        assertThat(item.documentCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getPendingReviewQueue - empty page skips batch queries")
    void getPendingReviewQueue_emptyPage_skipsBatchQueries() {
        when(collegeRegistrationRepository.findPendingReviewQueue(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, "submittedForReviewAt,asc");

        assertThat(response.content()).isEmpty();
        verify(collegeRepository, never()).findAllById(any());
        verify(userRepository, never()).findByCollegeIdInAndRoleAndStatus(any(), any(), any());
        verify(collegeRegistrationDocumentRepository, never()).findByRegistrationIdIn(any());
    }

    @Test
    @DisplayName("getPendingReviewQueue - search length > 100 throws VALIDATION_ERROR")
    void getPendingReviewQueue_searchTooLong_throwsValidationError() {
        String longSearch = "a".repeat(101);
        assertThatThrownBy(() -> collegeReviewService.getPendingReviewQueue(
                longSearch, null, null, 0, 20, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("exceeds maximum length")
                .extracting("errorCode")
                .isEqualTo("VALIDATION_ERROR");
    }

    @Test
    @DisplayName("getPendingReviewQueue - from > to throws INVALID_DATE_RANGE")
    void getPendingReviewQueue_fromAfterTo_throwsInvalidDateRange() {
        Instant from = Instant.now();
        Instant to = from.minusSeconds(3600);
        assertThatThrownBy(() -> collegeReviewService.getPendingReviewQueue(
                null, from, to, 0, 20, null))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("INVALID_DATE_RANGE");
    }

    @Test
    @DisplayName("getPendingReviewQueue - unapproved sort property throws INVALID_SORT_PROPERTY")
    void getPendingReviewQueue_unapprovedSort_throwsInvalidSortProperty() {
        assertThatThrownBy(() -> collegeReviewService.getPendingReviewQueue(
                null, null, null, 0, 20, "unapprovedProp,asc"))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("INVALID_SORT_PROPERTY");
    }

    @Test
    @DisplayName("getReviewDetail - returns full detail payload for pending application")
    void getReviewDetail_success() {
        when(collegeRepository.findById(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));
        when(collegeRegistrationDocumentRepository.findByRegistrationId(205L))
                .thenReturn(List.of(document1, document2SupersedingDoc1));
        when(collegeRegistrationRepository.findByCollegeIdOrderByVersionNumberAsc(101L))
                .thenReturn(List.of(pendingRegistration));

        CollegeReviewDetailResponse detail = collegeReviewService.getReviewDetail(101L);

        assertThat(detail.college().id()).isEqualTo(101L);
        assertThat(detail.college().code()).isEqualTo("OU-TECH");
        assertThat(detail.adminUser().email()).isEqualTo("admin@outech.ac.in");
        assertThat(detail.submittedRevision().id()).isEqualTo(205L);
        assertThat(detail.activeDocuments()).hasSize(1);
        assertThat(detail.activeDocuments().getFirst().id()).isEqualTo(502L);
        assertThat(detail.revisionHistory()).hasSize(1);
    }

    @Test
    @DisplayName("getReviewDetail - college not found throws 404")
    void getReviewDetail_collegeNotFound_throws404() {
        when(collegeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> collegeReviewService.getReviewDetail(999L))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("COLLEGE_NOT_FOUND");
    }

    @Test
    @DisplayName("getReviewDetail - non-pending college throws 409 APPLICATION_NOT_AWAITING_REVIEW")
    void getReviewDetail_nonPendingCollege_throws409() {
        pendingCollege.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        when(collegeRepository.findById(101L)).thenReturn(Optional.of(pendingCollege));

        assertThatThrownBy(() -> collegeReviewService.getReviewDetail(101L))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("APPLICATION_NOT_AWAITING_REVIEW");
    }

    @Test
    @DisplayName("getReviewDetail - unsubmitted revision throws 409 APPLICATION_NOT_AWAITING_REVIEW")
    void getReviewDetail_unsubmittedRevision_throws409() {
        pendingRegistration.setSubmittedForReviewAt(null);
        when(collegeRepository.findById(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));

        assertThatThrownBy(() -> collegeReviewService.getReviewDetail(101L))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("APPLICATION_NOT_AWAITING_REVIEW");
    }

    @Test
    @DisplayName("downloadDocument - valid college and document returns DocumentDownload")
    void downloadDocument_success() {
        byte[] content = "pdf-content".getBytes(StandardCharsets.UTF_8);
        Resource mockResource = new ByteArrayResource(content);

        when(collegeRepository.findById(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationDocumentRepository.findByIdAndCollegeId(501L, 101L))
                .thenReturn(Optional.of(document1));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(documentStorageService.loadAsResource("key-501")).thenReturn(mockResource);

        DocumentDownload download = collegeReviewService.downloadDocument(101L, 501L);

        assertThat(download.filename()).isEqualTo("aff_v1.pdf");
        assertThat(download.mimeType()).isEqualTo("application/pdf");
        assertThat(download.contentLength()).isEqualTo(1024L);
    }

    @Test
    @DisplayName("downloadDocument - cross-tenant access attempt throws 404 DOCUMENT_NOT_FOUND")
    void downloadDocument_crossTenant_throws404() {
        // Document belongs to college 101, but request passes college 202
        when(collegeRepository.findById(202L)).thenReturn(Optional.of(new College()));
        when(collegeRegistrationDocumentRepository.findByIdAndCollegeId(501L, 202L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> collegeReviewService.downloadDocument(202L, 501L))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("DOCUMENT_NOT_FOUND");
    }

    @Test
    @DisplayName("downloadDocument - registration college mismatch throws 404 DOCUMENT_NOT_FOUND")
    void downloadDocument_registrationMismatch_throws404() {
        CollegeRegistration mismatchedReg = new CollegeRegistration();
        mismatchedReg.setId(205L);
        mismatchedReg.setCollegeId(999L); // Different college!

        when(collegeRepository.findById(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationDocumentRepository.findByIdAndCollegeId(501L, 101L))
                .thenReturn(Optional.of(document1));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(mismatchedReg));

        assertThatThrownBy(() -> collegeReviewService.downloadDocument(101L, 501L))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("DOCUMENT_NOT_FOUND");
    }

    @Test
    @DisplayName("recordDecision - APPROVE successfully updates revision and college, and records audit")
    void recordDecision_approve_success() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(securityContextService.requireCurrentUserId()).thenReturn(1L);
        when(securityContextService.requireCurrentRole()).thenReturn(Role.SUPER_ADMIN);
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(205L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("affiliation.pdf");
        doc1.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(2L);
        doc2.setRegistrationId(205L);
        doc2.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        doc2.setOriginalFilename("signatory.pdf");
        doc2.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        when(collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(205L))
                .thenReturn(List.of(doc1, doc2));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "All documents valid.", null);

        ReviewDecisionResponse response = collegeReviewService.recordDecision(101L, request);

        assertThat(response.approvalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(pendingRegistration.getStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(pendingRegistration.getReviewNotes()).isEqualTo("All documents valid.");
        assertThat(pendingCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_REGISTRATION_APPROVED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(55L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
        verify(collegeLifecycleService).onCollegeApproved(
                eq(pendingCollege), eq(pendingRegistration), eq(activeAdmin), eq(1L), eq(Role.SUPER_ADMIN));
    }

    @Test
    @DisplayName("recordDecision - APPROVE with missing mandatory document throws REQUIRED_DOCUMENTS_MISSING")
    void recordDecision_approve_missingMandatory_throwsRequiredDocumentsMissing() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(205L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("affiliation.pdf");
        doc1.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        when(collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(205L))
                .thenReturn(List.of(doc1));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Approving", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(101L, request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("REQUIRED_DOCUMENTS_MISSING");
    }

    @Test
    @DisplayName("recordDecision - APPROVE with unverified/pending document throws DOCUMENTS_NOT_VERIFIED")
    void recordDecision_approve_pendingDoc_throwsDocumentsNotVerified() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(205L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("affiliation.pdf");
        doc1.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(2L);
        doc2.setRegistrationId(205L);
        doc2.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        doc2.setOriginalFilename("signatory.pdf");
        doc2.setVerificationStatus(DocumentVerificationStatus.PENDING);

        when(collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(205L))
                .thenReturn(List.of(doc1, doc2));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Approving", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(101L, request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("DOCUMENTS_NOT_VERIFIED");
    }

    @Test
    @DisplayName("recordDecision - APPROVE with rejected document throws DOCUMENTS_REJECTED")
    void recordDecision_approve_rejectedDoc_throwsDocumentsRejected() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(205L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("affiliation.pdf");
        doc1.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(2L);
        doc2.setRegistrationId(205L);
        doc2.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        doc2.setOriginalFilename("signatory.pdf");
        doc2.setVerificationStatus(DocumentVerificationStatus.REJECTED);

        when(collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(205L))
                .thenReturn(List.of(doc1, doc2));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Approving", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(101L, request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("DOCUMENTS_REJECTED");
    }

    @Test
    @DisplayName("recordDecision - REQUEST_ACTION successfully updates revision and does NOT increment actionRequiredCount")
    void recordDecision_requestAction_success() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(securityContextService.requireCurrentUserId()).thenReturn(1L);
        when(securityContextService.requireCurrentRole()).thenReturn(Role.SUPER_ADMIN);
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, 0L, "Affiliation certificate seal is unreadable.", null);

        ReviewDecisionResponse response = collegeReviewService.recordDecision(101L, request);

        assertThat(response.approvalStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);
        assertThat(pendingRegistration.getStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);
        assertThat(pendingRegistration.getReviewNotes()).isEqualTo("Affiliation certificate seal is unreadable.");
        assertThat(pendingCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);
        // Critical invariant: actionRequiredCount remains 0 during review decision (Module 3.3 increments on submit)
        assertThat(pendingCollege.getActionRequiredCount()).isEqualTo(0);

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_REGISTRATION_ACTION_REQUIRED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(55L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
        verify(collegeLifecycleService).onActionRequired(
                eq(pendingCollege), eq(pendingRegistration), eq(activeAdmin));
    }

    @Test
    @DisplayName("recordDecision - REQUEST_ACTION with actionRequiredCount >= 10 throws MAX_ACTION_REQUIRED_LIMIT_EXCEEDED")
    void recordDecision_requestAction_maxLimit_throwsBadRequest() {
        pendingCollege.setActionRequiredCount(10);
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, 0L, "Please upload another document.", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(101L, request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("MAX_ACTION_REQUIRED_LIMIT_EXCEEDED");
    }

    @Test
    @DisplayName("recordDecision - REJECT successfully updates status to REJECTED and records audit")
    void recordDecision_reject_success() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(securityContextService.requireCurrentUserId()).thenReturn(1L);
        when(securityContextService.requireCurrentRole()).thenReturn(Role.SUPER_ADMIN);
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, 0L, null, "Application rejected due to fraudulent documents.");

        ReviewDecisionResponse response = collegeReviewService.recordDecision(101L, request);

        assertThat(response.approvalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(pendingRegistration.getStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(pendingRegistration.getRejectionReason()).isEqualTo("Application rejected due to fraudulent documents.");
        assertThat(pendingCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_REGISTRATION_REJECTED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(55L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
        verify(collegeLifecycleService).onNonPermanentRejection(
                eq(pendingCollege), eq(pendingRegistration), eq(activeAdmin));
    }

    @Test
    @DisplayName("recordDecision - stale expectedVersion throws 409 STALE_APPLICATION_VERSION")
    void recordDecision_staleVersion_throwsConflict() {
        // College has version 1, request passes version 0
        College v1College = new College();
        v1College.setId(101L);
        // Note: College version is managed by JPA @Version, let's test expectedVersion mismatch
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 99L, "Approved", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(101L, request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("STALE_APPLICATION_VERSION");
    }

    @Test
    @DisplayName("recordDecision - APPROVE with pending active optional document throws DOCUMENTS_NOT_VERIFIED")
    void recordDecision_approve_pendingOptionalDoc_throwsDocumentsNotVerified() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(205L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("affiliation.pdf");
        doc1.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(2L);
        doc2.setRegistrationId(205L);
        doc2.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        doc2.setOriginalFilename("signatory.pdf");
        doc2.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        CollegeRegistrationDocument doc3Optional = new CollegeRegistrationDocument();
        doc3Optional.setId(3L);
        doc3Optional.setRegistrationId(205L);
        doc3Optional.setDocumentCategory(DocumentCategory.INSTITUTION_REGISTRATION_PROOF);
        doc3Optional.setOriginalFilename("proof.pdf");
        doc3Optional.setVerificationStatus(DocumentVerificationStatus.PENDING);

        when(collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(205L))
                .thenReturn(List.of(doc1, doc2, doc3Optional));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Approving", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(101L, request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("DOCUMENTS_NOT_VERIFIED");
    }

    @Test
    @DisplayName("recordDecision - REJECT with rejected and pending documents remains allowed")
    void recordDecision_reject_withRejectedAndPendingDocuments_remainsAllowed() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(securityContextService.requireCurrentUserId()).thenReturn(1L);
        when(securityContextService.requireCurrentRole()).thenReturn(Role.SUPER_ADMIN);
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, 0L, null, "Application rejected due to fraudulent documents.");

        ReviewDecisionResponse response = collegeReviewService.recordDecision(101L, request);

        assertThat(response.approvalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(pendingRegistration.getStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);
        assertThat(pendingCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.REJECTED);

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_REGISTRATION_REJECTED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(55L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
        // Documents repository must NOT be queried for locking/verification during rejection
        verify(collegeRegistrationDocumentRepository, never()).findByRegistrationIdWithLock(anyLong());
    }

    @Test
    @DisplayName("recordDecision - REQUEST_ACTION with rejected and pending documents remains allowed")
    void recordDecision_requestAction_withRejectedAndPendingDocuments_remainsAllowed() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(securityContextService.requireCurrentUserId()).thenReturn(1L);
        when(securityContextService.requireCurrentRole()).thenReturn(Role.SUPER_ADMIN);
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, 0L, "Please replace rejected affiliation certificate.", null);

        ReviewDecisionResponse response = collegeReviewService.recordDecision(101L, request);

        assertThat(response.approvalStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);
        assertThat(pendingRegistration.getStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);
        assertThat(pendingCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.ACTION_REQUIRED);

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_REGISTRATION_ACTION_REQUIRED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(55L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
        verify(collegeRegistrationDocumentRepository, never()).findByRegistrationIdWithLock(anyLong());
    }

    @Test
    @DisplayName("recordDecision - failed approval causes no partial mutation of college, registration, or audit")
    void recordDecision_failedApproval_noPartialMutation() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(205L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("affiliation.pdf");
        doc1.setVerificationStatus(DocumentVerificationStatus.REJECTED);

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(2L);
        doc2.setRegistrationId(205L);
        doc2.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        doc2.setOriginalFilename("signatory.pdf");
        doc2.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        when(collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(205L))
                .thenReturn(List.of(doc1, doc2));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Approving", null);

        assertThatThrownBy(() -> collegeReviewService.recordDecision(101L, request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("DOCUMENTS_REJECTED");

        // Verify college and registration statuses remain unchanged
        assertThat(pendingCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(pendingRegistration.getStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(pendingRegistration.getReviewedAt()).isNull();

        // Verify no audit events or lifecycle dispatches occurred
        verify(auditEventService, never()).record(any(), anyLong(), any(), any(), anyLong(), any(), any(), any());
        verifyNoInteractions(collegeLifecycleService);
    }

    @Test
    @DisplayName("recordDecision - APPROVE with superseded rejected document and accepted replacement succeeds")
    void recordDecision_approve_supersededRejectedDocWithAcceptedReplacement_success() {
        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingCollege));
        when(collegeRegistrationRepository.findById(205L)).thenReturn(Optional.of(pendingRegistration));
        when(securityContextService.requireCurrentUserId()).thenReturn(1L);
        when(securityContextService.requireCurrentRole()).thenReturn(Role.SUPER_ADMIN);
        when(userRepository.findByCollegeIdInAndRoleAndStatus(List.of(101L), Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(activeAdmin));

        // Doc 1 was rejected in previous round
        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(1L);
        doc1.setRegistrationId(205L);
        doc1.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc1.setOriginalFilename("affiliation_v1.pdf");
        doc1.setVerificationStatus(DocumentVerificationStatus.REJECTED);

        // Doc 2 replaces doc 1 and is accepted
        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(2L);
        doc2.setRegistrationId(205L);
        doc2.setReplacesDocumentId(1L);
        doc2.setDocumentCategory(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE);
        doc2.setOriginalFilename("affiliation_v2.pdf");
        doc2.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        // Doc 3 is accepted signatory
        CollegeRegistrationDocument doc3 = new CollegeRegistrationDocument();
        doc3.setId(3L);
        doc3.setRegistrationId(205L);
        doc3.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
        doc3.setOriginalFilename("signatory.pdf");
        doc3.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);

        when(collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(205L))
                .thenReturn(List.of(doc1, doc2, doc3));

        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "All active documents verified.", null);

        ReviewDecisionResponse response = collegeReviewService.recordDecision(101L, request);

        assertThat(response.approvalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(pendingCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
        assertThat(pendingRegistration.getStatus()).isEqualTo(CollegeApprovalStatus.APPROVED);
    }
}
