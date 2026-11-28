package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.CleanupProperties;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.security.SessionRevocationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeLifecycleServiceUnitTest {

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
    private OutboxEmailService outboxEmailService;
    @Mock
    private AuditEventService auditEventService;
    @Mock
    private SessionRevocationService sessionRevocationService;
    @Mock
    private CleanupProperties cleanupProperties;
    @Mock
    private DocumentPurgeMarkerService documentPurgeMarkerService;

    @InjectMocks
    private CollegeLifecycleService lifecycleService;

    private College college;
    private CollegeRegistration registration;
    private User adminUser;

    @BeforeEach
    void setUp() {
        lifecycleService.setSelf(lifecycleService);

        college = new College();
        college.setId(101L);
        college.setName("Osmania University");
        college.setCode("OU-TECH");
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college.setCurrentRegistrationId(201L);
        college.setResubmissionCount(0);
        college.setActionRequiredCount(0);

        registration = new CollegeRegistration();
        registration.setId(201L);
        registration.setCollegeId(101L);
        registration.setVersionNumber(1);
        registration.setStatus(CollegeApprovalStatus.PENDING);
        registration.setLegalName("Osmania University College of Technology");
        registration.setAddressLine1("Administrative Building, Main Road");
        registration.setAddressLine2("Near Library");
        registration.setCity("Hyderabad");
        registration.setState("Telangana");
        registration.setCountry("India");
        registration.setPostalCode("500007");
        registration.setContactPhone("+91-40-27098254");
        registration.setWebsiteUrl("https://www.uceou.edu");
        registration.setAffiliatedUniversityName("Osmania University");

        adminUser = new User();
        adminUser.setId(501L);
        adminUser.setCollegeId(101L);
        adminUser.setEmail("admin@osmania.ac.in");
        adminUser.setFirstName("Rajesh");
        adminUser.setLastName("Kumar");
        adminUser.setRole(Role.COLLEGE_ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("onCollegeApproved - transitions status to ACTIVE, synchronizes operational profile, records COLLEGE_ACTIVATED audit, and enqueues outbox")
    void onCollegeApproved_success() {
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        registration.setStatus(CollegeApprovalStatus.APPROVED);

        lifecycleService.onCollegeApproved(college, registration, adminUser, 1L, Role.SUPER_ADMIN);

        assertThat(college.getStatus()).isEqualTo(CollegeStatus.ACTIVE);
        assertThat(college.getAddressLine1()).isEqualTo("Administrative Building, Main Road");
        assertThat(college.getAddressLine2()).isEqualTo("Near Library");
        assertThat(college.getCity()).isEqualTo("Hyderabad");
        assertThat(college.getState()).isEqualTo("Telangana");
        assertThat(college.getCountry()).isEqualTo("India");
        assertThat(college.getPostalCode()).isEqualTo("500007");
        assertThat(college.getContactPhone()).isEqualTo("+91-40-27098254");
        assertThat(college.getWebsiteUrl()).isEqualTo("https://www.uceou.edu");
        assertThat(college.getAffiliatedUniversityName()).isEqualTo("Osmania University");
        assertThat(college.getContactEmail()).isNull();
        assertThat(college.getEstablishedYear()).isNull();
        assertThat(college.getAccreditationDetails()).isNull();
        assertThat(college.getLogoStorageKey()).isNull();

        verify(collegeRepository).save(college);

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_ACTIVATED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(501L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );

        verify(outboxEmailService).enqueue(
                eq("COLLEGE_REGISTRATION_APPROVED"),
                eq("admin@osmania.ac.in"),
                eq("Your Acadlytic College Registration has been Approved"),
                eq("COLLEGE_REGISTRATION_APPROVED"),
                any()
        );
    }

    @Test
    @DisplayName("onCollegeApproved - throws AppException when target college is null")
    void onCollegeApproved_nullCollege_throwsAppException() {
        registration.setStatus(CollegeApprovalStatus.APPROVED);

        assertThatThrownBy(() -> lifecycleService.onCollegeApproved(null, registration, adminUser, 1L, Role.SUPER_ADMIN))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("INVALID_COLLEGE");
                });
        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("onCollegeApproved - throws AppException when submitted revision is null")
    void onCollegeApproved_nullRevision_throwsAppException() {
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);

        assertThatThrownBy(() -> lifecycleService.onCollegeApproved(college, null, adminUser, 1L, Role.SUPER_ADMIN))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("INVALID_REVISION");
                });
        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("onCollegeApproved - throws AppException on cross-tenant revision mismatch")
    void onCollegeApproved_crossTenantMismatch_throwsAppException() {
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        registration.setStatus(CollegeApprovalStatus.APPROVED);
        registration.setCollegeId(999L); // Mismatched college ID

        assertThatThrownBy(() -> lifecycleService.onCollegeApproved(college, registration, adminUser, 1L, Role.SUPER_ADMIN))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("CROSS_TENANT_REVISION_MISMATCH");
                });
        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("onCollegeApproved - throws AppException on non-authoritative revision pointer mismatch")
    void onCollegeApproved_nonAuthoritativeRevision_throwsAppException() {
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        college.setCurrentRegistrationId(888L); // Mismatched pointer
        registration.setStatus(CollegeApprovalStatus.APPROVED);

        assertThatThrownBy(() -> lifecycleService.onCollegeApproved(college, registration, adminUser, 1L, Role.SUPER_ADMIN))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("NON_AUTHORITATIVE_REVISION");
                });
        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("onCollegeApproved - throws AppException when revision status is not APPROVED")
    void onCollegeApproved_invalidRevisionStatus_throwsAppException() {
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        registration.setStatus(CollegeApprovalStatus.PENDING); // Not APPROVED

        assertThatThrownBy(() -> lifecycleService.onCollegeApproved(college, registration, adminUser, 1L, Role.SUPER_ADMIN))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("INVALID_REVISION_STATUS");
                });
        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("onCollegeApproved - throws AppException when college approval status is not APPROVED")
    void onCollegeApproved_invalidCollegeStatus_throwsAppException() {
        college.setApprovalStatus(CollegeApprovalStatus.PENDING); // Not APPROVED
        registration.setStatus(CollegeApprovalStatus.APPROVED);

        assertThatThrownBy(() -> lifecycleService.onCollegeApproved(college, registration, adminUser, 1L, Role.SUPER_ADMIN))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("INVALID_COLLEGE_STATUS");
                });
        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("onActionRequired - enqueues COLLEGE_REGISTRATION_ACTION_REQUIRED outbox notification")
    void onActionRequired_success() {
        registration.setReviewNotes("Please re-upload affiliation document with legible seal.");
        college.setActionRequiredCount(1);

        lifecycleService.onActionRequired(college, registration, adminUser);

        verify(outboxEmailService).enqueue(
                eq("COLLEGE_REGISTRATION_ACTION_REQUIRED"),
                eq("admin@osmania.ac.in"),
                eq("Action Required: Acadlytic College Registration Revision Needed"),
                eq("COLLEGE_REGISTRATION_ACTION_REQUIRED"),
                any()
        );
    }

    @Test
    @DisplayName("onNonPermanentRejection - calculates remaining resubmission allowance and enqueues COLLEGE_REGISTRATION_REJECTED")
    void onNonPermanentRejection_success() {
        college.setResubmissionCount(1);
        registration.setRejectionReason("Curriculum document does not meet standard criteria.");

        lifecycleService.onNonPermanentRejection(college, registration, adminUser);

        verify(outboxEmailService).enqueue(
                eq("COLLEGE_REGISTRATION_REJECTED"),
                eq("admin@osmania.ac.in"),
                eq("Acadlytic College Registration Update"),
                eq("COLLEGE_REGISTRATION_REJECTED"),
                any()
        );

        verify(outboxEmailService, never()).enqueue(
                eq("COLLEGE_REGISTRATION_PERMANENTLY_REJECTED"),
                anyString(),
                anyString(),
                anyString(),
                any()
        );
    }

    @Test
    @DisplayName("onPermanentRejection - deactivates users, releases email, revokes sessions, and enqueues ONLY permanent rejection email")
    void onPermanentRejection_atCountThree_success() {
        college.setResubmissionCount(3);
        registration.setRejectionReason("Third correction submission still fails mandatory UGC compliance.");

        when(userRepository.findByCollegeId(101L)).thenReturn(List.of(adminUser));

        lifecycleService.onPermanentRejection(college, registration, adminUser, 1L, Role.SUPER_ADMIN);

        assertThat(registration.isPermanentRejection()).isTrue();
        assertThat(college.getStatus()).isEqualTo(CollegeStatus.INACTIVE);
        assertThat(college.isPermanentlyRejected()).isTrue();
        assertThat(adminUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
        assertThat(adminUser.isEmailReleased()).isTrue();

        verify(collegeRegistrationRepository).save(registration);
        verify(collegeRepository).save(college);
        verify(userRepository).saveAll(List.of(adminUser));
        verify(sessionRevocationService).revokeAllSessionsForCollege(101L);

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_PERMANENTLY_REJECTED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(501L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );

        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_ADMIN_DEACTIVATED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(501L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );

        // Mutually exclusive email dispatch: ONLY permanent rejection email enqueued
        verify(outboxEmailService).enqueue(
                eq("COLLEGE_REGISTRATION_PERMANENTLY_REJECTED"),
                eq("admin@osmania.ac.in"),
                eq("Important Notice: Acadlytic College Registration Permanently Rejected"),
                eq("COLLEGE_REGISTRATION_PERMANENTLY_REJECTED"),
                any()
        );

        verify(outboxEmailService, never()).enqueue(
                eq("COLLEGE_REGISTRATION_REJECTED"),
                anyString(),
                anyString(),
                anyString(),
                any()
        );
    }

    @Test
    @DisplayName("archiveAbandonedRegistrationInTransaction - unverified unsubmitted college older than 7 days is archived")
    void archiveAbandonedRegistrationInTransaction_eligible_success() {
        adminUser.setEmailVerifiedAt(null);
        registration.setSubmittedForReviewAt(null);

        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(10L);
        doc1.setRegistrationId(201L);
        doc1.setStorageKey("uuid-storage-key-1.pdf");

        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(college));
        when(collegeRegistrationRepository.findById(201L)).thenReturn(Optional.of(registration));
        when(userRepository.findByCollegeId(101L)).thenReturn(List.of(adminUser));
        when(collegeRegistrationDocumentRepository.findByRegistrationId(201L)).thenReturn(List.of(doc1));
        when(cleanupProperties.getAbandonedRetentionDays()).thenReturn(7);

        List<Long> docIds = lifecycleService.archiveAbandonedRegistrationInTransaction(101L);

        assertThat(docIds).containsExactly(10L);
        assertThat(college.getStatus()).isEqualTo(CollegeStatus.INACTIVE);
        assertThat(college.getArchivedAt()).isNotNull();
        assertThat(adminUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
        assertThat(adminUser.isEmailReleased()).isTrue();

        verify(collegeRepository).save(college);
        verify(userRepository).saveAll(List.of(adminUser));
        verify(sessionRevocationService).revokeAllSessionsForCollege(101L);

        verify(auditEventService).record(
                eq(AuditEventType.ABANDONED_REGISTRATION_ARCHIVED),
                eq(null),
                eq(null),
                eq(501L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("archiveAbandonedRegistrationInTransaction - verified email protects account from abandonment cleanup")
    void archiveAbandonedRegistrationInTransaction_verifiedEmail_protectsAccount() {
        adminUser.setEmailVerifiedAt(Instant.now().minusSeconds(86400 * 8)); // Verified 8 days ago
        registration.setSubmittedForReviewAt(null);

        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(college));
        when(collegeRegistrationRepository.findById(201L)).thenReturn(Optional.of(registration));
        when(userRepository.findByCollegeId(101L)).thenReturn(List.of(adminUser));

        List<Long> keys = lifecycleService.archiveAbandonedRegistrationInTransaction(101L);

        assertThat(keys).isEmpty();
        assertThat(college.getArchivedAt()).isNull();
        assertThat(college.getStatus()).isEqualTo(CollegeStatus.PENDING_VERIFICATION);
        assertThat(adminUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(adminUser.isEmailReleased()).isFalse();

        verify(collegeRepository, never()).save(any());
        verify(auditEventService, never()).record(eq(AuditEventType.ABANDONED_REGISTRATION_ARCHIVED), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("archiveAbandonedRegistrationInTransaction - submitted application excluded from abandonment cleanup")
    void archiveAbandonedRegistrationInTransaction_submittedApplication_excluded() {
        adminUser.setEmailVerifiedAt(null);
        registration.setSubmittedForReviewAt(Instant.now().minusSeconds(86400 * 8));

        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(college));
        when(collegeRegistrationRepository.findById(201L)).thenReturn(Optional.of(registration));

        List<Long> keys = lifecycleService.archiveAbandonedRegistrationInTransaction(101L);

        assertThat(keys).isEmpty();
        assertThat(college.getArchivedAt()).isNull();
        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("archivePermanentlyRejectedCollegeInTransaction - archives eligible permanently rejected college after 7 days")
    void archivePermanentlyRejectedCollegeInTransaction_success() {
        college.setPermanentlyRejected(true);
        college.setArchivedAt(null);

        when(collegeRepository.findByIdWithLock(101L)).thenReturn(Optional.of(college));
        when(cleanupProperties.getPermanentRejectionRetentionDays()).thenReturn(7);

        lifecycleService.archivePermanentlyRejectedCollegeInTransaction(101L);

        assertThat(college.getArchivedAt()).isNotNull();
        verify(collegeRepository).save(college);

        verify(auditEventService).record(
                eq(AuditEventType.PERMANENTLY_REJECTED_COLLEGE_ARCHIVED),
                eq(null),
                eq(null),
                eq(null),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("tryDeletePhysicalFile - deletes file when exists and logs success")
    void tryDeletePhysicalFile_success() {
        when(documentStorageService.exists("key-1.pdf")).thenReturn(true, false);

        lifecycleService.tryDeletePhysicalFile("key-1.pdf");

        verify(documentStorageService).delete("key-1.pdf");
    }

    @Test
    @DisplayName("tryDeletePhysicalFile - missing file is handled idempotently without throwing")
    void tryDeletePhysicalFile_missingFile_idempotent() {
        when(documentStorageService.exists("missing-key.pdf")).thenReturn(false);

        lifecycleService.tryDeletePhysicalFile("missing-key.pdf");

        verify(documentStorageService, never()).delete(anyString());
    }

    @Test
    @DisplayName("tryDeletePhysicalFile - exception during delete is caught and does not throw")
    void tryDeletePhysicalFile_exceptionCaughtGracefully() {
        when(documentStorageService.exists("key-err.pdf")).thenReturn(true);
        doThrow(new RuntimeException("Disk I/O error")).when(documentStorageService).delete("key-err.pdf");

        // Must not throw exception
        lifecycleService.tryDeletePhysicalFile("key-err.pdf");

        verify(documentStorageService).delete("key-err.pdf");
    }

    @Test
    @DisplayName("sweepResidualAbandonedDraftDocuments - iterates keyset batches until empty")
    void sweepResidualAbandonedDraftDocuments_keysetTraversal_success() {
        CollegeRegistrationDocument doc1 = new CollegeRegistrationDocument();
        doc1.setId(5L);
        doc1.setStorageKey("doc5.pdf");

        CollegeRegistrationDocument doc2 = new CollegeRegistrationDocument();
        doc2.setId(12L);
        doc2.setStorageKey("doc12.pdf");

        when(cleanupProperties.getSweeperBatchSize()).thenReturn(2);
        // Batch 1: returns 2 docs
        when(collegeRegistrationDocumentRepository.findEligibleAbandonedDraftDocumentsKeyset(eq(0L), any(Pageable.class)))
                .thenReturn(List.of(doc1, doc2));
        // Batch 2: returns empty
        when(collegeRegistrationDocumentRepository.findEligibleAbandonedDraftDocumentsKeyset(eq(12L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        when(documentStorageService.exists(anyString())).thenReturn(false); // files already missing

        int swept = lifecycleService.sweepResidualAbandonedDraftDocuments();

        assertThat(swept).isEqualTo(2);
        verify(documentPurgeMarkerService).markDocumentFilePurged(eq(5L), any(Instant.class));
        verify(documentPurgeMarkerService).markDocumentFilePurged(eq(12L), any(Instant.class));
    }

    @Test
    @DisplayName("purgePhysicalFileAndPersistMarker - successful deletion deletes file and delegates marker persistence")
    void purgePhysicalFileAndPersistMarker_success_setsMarker() {
        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setId(22L);
        doc.setStorageKey("test-key.pdf");

        when(documentStorageService.exists("test-key.pdf")).thenReturn(true, false);

        boolean result = lifecycleService.purgePhysicalFileAndPersistMarker(doc);

        assertThat(result).isTrue();
        verify(documentStorageService).delete("test-key.pdf");
        verify(documentPurgeMarkerService).markDocumentFilePurged(eq(22L), any(Instant.class));
    }

    @Test
    @DisplayName("purgePhysicalFileAndPersistMarker - missing file treats as purged and delegates marker persistence")
    void purgePhysicalFileAndPersistMarker_missingFile_persistsMarker() {
        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setId(33L);
        doc.setStorageKey("missing-file.pdf");

        when(documentStorageService.exists("missing-file.pdf")).thenReturn(false);

        boolean result = lifecycleService.purgePhysicalFileAndPersistMarker(doc);

        assertThat(result).isTrue();
        verify(documentStorageService, never()).delete("missing-file.pdf");
        verify(documentPurgeMarkerService).markDocumentFilePurged(eq(33L), any(Instant.class));
    }

    @Test
    @DisplayName("purgePhysicalFileAndPersistMarker - failed deletion leaves marker NULL for future retry")
    void purgePhysicalFileAndPersistMarker_failedDeletion_leavesMarkerNull() {
        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setId(44L);
        doc.setStorageKey("locked-file.pdf");

        when(documentStorageService.exists("locked-file.pdf")).thenReturn(true);
        doThrow(new RuntimeException("File locked by OS")).when(documentStorageService).delete("locked-file.pdf");

        boolean result = lifecycleService.purgePhysicalFileAndPersistMarker(doc);

        assertThat(result).isFalse();
        verify(documentPurgeMarkerService, never()).markDocumentFilePurged(anyLong(), any(Instant.class));
    }
}
