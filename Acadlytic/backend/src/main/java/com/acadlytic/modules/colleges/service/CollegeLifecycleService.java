package com.acadlytic.modules.colleges.service;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Service governing prospective college lifecycle transitions, operational activation,
 * permanent rejection, transactional outbox notifications, and scheduled cleanups (Module 3.5).
 */
@Service
public class CollegeLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(CollegeLifecycleService.class);

    private final CollegeRepository collegeRepository;
    private final CollegeRegistrationRepository collegeRegistrationRepository;
    private final CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository;
    private final UserRepository userRepository;
    private final DocumentStorageService documentStorageService;
    private final OutboxEmailService outboxEmailService;
    private final AuditEventService auditEventService;
    private final SessionRevocationService sessionRevocationService;
    private final CleanupProperties cleanupProperties;
    private final DocumentPurgeMarkerService documentPurgeMarkerService;

    @Autowired
    @Lazy
    private CollegeLifecycleService self;

    public CollegeLifecycleService(
            CollegeRepository collegeRepository,
            CollegeRegistrationRepository collegeRegistrationRepository,
            CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository,
            UserRepository userRepository,
            DocumentStorageService documentStorageService,
            OutboxEmailService outboxEmailService,
            AuditEventService auditEventService,
            SessionRevocationService sessionRevocationService,
            CleanupProperties cleanupProperties,
            DocumentPurgeMarkerService documentPurgeMarkerService) {
        this.collegeRepository = collegeRepository;
        this.collegeRegistrationRepository = collegeRegistrationRepository;
        this.collegeRegistrationDocumentRepository = collegeRegistrationDocumentRepository;
        this.userRepository = userRepository;
        this.documentStorageService = documentStorageService;
        this.outboxEmailService = outboxEmailService;
        this.auditEventService = auditEventService;
        this.sessionRevocationService = sessionRevocationService;
        this.cleanupProperties = cleanupProperties;
        this.documentPurgeMarkerService = documentPurgeMarkerService;
    }

    public void setSelf(CollegeLifecycleService self) {
        this.self = self;
    }

    /**
     * Executes college operational activation inside caller transaction upon APPROVE decision.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void onCollegeApproved(
            College college,
            CollegeRegistration submittedRevision,
            User adminUser,
            Long reviewerUserId,
            Role reviewerRole) {

        college.setStatus(CollegeStatus.ACTIVE);
        collegeRepository.save(college);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("collegeCode", college.getCode());
        metadata.put("legalName", submittedRevision.getLegalName());
        metadata.put("versionNumber", submittedRevision.getVersionNumber());

        auditEventService.record(
                AuditEventType.COLLEGE_ACTIVATED,
                reviewerUserId,
                reviewerRole,
                adminUser != null ? adminUser.getId() : null,
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                metadata
        );

        if (adminUser != null && adminUser.getEmail() != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("firstName", adminUser.getFirstName() != null ? adminUser.getFirstName() : "Admin");
            payload.put("legalName", submittedRevision.getLegalName());
            payload.put("collegeCode", college.getCode());

            outboxEmailService.enqueue(
                    "COLLEGE_REGISTRATION_APPROVED",
                    adminUser.getEmail(),
                    "Your Acadlytic College Registration has been Approved",
                    "COLLEGE_REGISTRATION_APPROVED",
                    payload
            );
        }

        log.info("College [{}] activated successfully and outbox notification enqueued.", college.getId());
    }

    /**
     * Dispatches action required notification inside caller transaction.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void onActionRequired(
            College college,
            CollegeRegistration submittedRevision,
            User adminUser) {

        if (adminUser != null && adminUser.getEmail() != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("firstName", adminUser.getFirstName() != null ? adminUser.getFirstName() : "Admin");
            payload.put("legalName", submittedRevision.getLegalName());
            payload.put("reviewNotes", submittedRevision.getReviewNotes() != null ? submittedRevision.getReviewNotes() : "");
            payload.put("actionRequiredCount", college.getActionRequiredCount());

            outboxEmailService.enqueue(
                    "COLLEGE_REGISTRATION_ACTION_REQUIRED",
                    adminUser.getEmail(),
                    "Action Required: Acadlytic College Registration Revision Needed",
                    "COLLEGE_REGISTRATION_ACTION_REQUIRED",
                    payload
            );
        }

        log.info("Action required notification enqueued for college [{}].", college.getId());
    }

    /**
     * Dispatches non-permanent rejection notification inside caller transaction.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void onNonPermanentRejection(
            College college,
            CollegeRegistration submittedRevision,
            User adminUser) {

        if (adminUser != null && adminUser.getEmail() != null) {
            int remaining = Math.max(0, 3 - college.getResubmissionCount());
            Map<String, Object> payload = new HashMap<>();
            payload.put("firstName", adminUser.getFirstName() != null ? adminUser.getFirstName() : "Admin");
            payload.put("legalName", submittedRevision.getLegalName());
            payload.put("rejectionReason", submittedRevision.getRejectionReason() != null ? submittedRevision.getRejectionReason() : "");
            payload.put("remainingResubmissions", remaining);

            outboxEmailService.enqueue(
                    "COLLEGE_REGISTRATION_REJECTED",
                    adminUser.getEmail(),
                    "Acadlytic College Registration Update",
                    "COLLEGE_REGISTRATION_REJECTED",
                    payload
            );
        }

        log.info("Non-permanent rejection notification enqueued for college [{}].", college.getId());
    }

    /**
     * Executes permanent rejection lifecycle mutations inside caller transaction.
     * Enforces user deactivation, session revocation, reservation release, audit trail, and outbox enqueueing.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void onPermanentRejection(
            College college,
            CollegeRegistration submittedRevision,
            User adminUser,
            Long reviewerUserId,
            Role reviewerRole) {

        submittedRevision.setPermanentRejection(true);
        collegeRegistrationRepository.save(submittedRevision);

        college.setStatus(CollegeStatus.INACTIVE);
        college.setPermanentlyRejected(true);
        collegeRepository.save(college);

        List<User> users = userRepository.findByCollegeId(college.getId());
        for (User user : users) {
            user.setStatus(UserStatus.INACTIVE);
            user.setEmailReleased(true);
        }
        userRepository.saveAll(users);

        sessionRevocationService.revokeAllSessionsForCollege(college.getId());

        Map<String, Object> permMetadata = new HashMap<>();
        permMetadata.put("collegeCode", college.getCode());
        permMetadata.put("legalName", submittedRevision.getLegalName());
        permMetadata.put("rejectionReason", submittedRevision.getRejectionReason() != null ? submittedRevision.getRejectionReason() : "");
        permMetadata.put("resubmissionCount", college.getResubmissionCount());

        auditEventService.record(
                AuditEventType.COLLEGE_PERMANENTLY_REJECTED,
                reviewerUserId,
                reviewerRole,
                adminUser != null ? adminUser.getId() : null,
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                permMetadata
        );

        Map<String, Object> adminDeactMetadata = new HashMap<>();
        adminDeactMetadata.put("collegeCode", college.getCode());
        adminDeactMetadata.put("reason", "PERMANENT_REJECTION");

        auditEventService.record(
                AuditEventType.COLLEGE_ADMIN_DEACTIVATED,
                reviewerUserId,
                reviewerRole,
                adminUser != null ? adminUser.getId() : null,
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                adminDeactMetadata
        );

        if (adminUser != null && adminUser.getEmail() != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("firstName", adminUser.getFirstName() != null ? adminUser.getFirstName() : "Admin");
            payload.put("legalName", submittedRevision.getLegalName());
            payload.put("rejectionReason", submittedRevision.getRejectionReason() != null ? submittedRevision.getRejectionReason() : "");

            outboxEmailService.enqueue(
                    "COLLEGE_REGISTRATION_PERMANENTLY_REJECTED",
                    adminUser.getEmail(),
                    "Important Notice: Acadlytic College Registration Permanently Rejected",
                    "COLLEGE_REGISTRATION_PERMANENTLY_REJECTED",
                    payload
            );
        }

        log.info("Permanent rejection lifecycle executed for college [{}]. Unique code and email released.", college.getId());
    }

    /**
     * Executes database archival for an abandoned registration in an isolated transaction.
     * Returns list of draft document IDs for post-commit physical deletion and marker persistence.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<Long> archiveAbandonedRegistrationInTransaction(Long collegeId) {
        College college = collegeRepository.findByIdWithLock(collegeId).orElse(null);
        if (college == null) {
            return Collections.emptyList();
        }

        if (college.getArchivedAt() != null || college.isPermanentlyRejected()) {
            return Collections.emptyList();
        }

        if (college.getApprovalStatus() != CollegeApprovalStatus.PENDING
                || college.getStatus() != CollegeStatus.PENDING_VERIFICATION
                || college.getResubmissionCount() != 0) {
            return Collections.emptyList();
        }

        if (college.getCurrentRegistrationId() == null) {
            return Collections.emptyList();
        }

        CollegeRegistration reg = collegeRegistrationRepository.findById(college.getCurrentRegistrationId()).orElse(null);
        if (reg == null
                || reg.getVersionNumber() != 1
                || reg.getStatus() != CollegeApprovalStatus.PENDING
                || reg.getSubmittedForReviewAt() != null) {
            return Collections.emptyList();
        }

        User adminUser = userRepository.findByCollegeId(college.getId()).stream()
                .filter(u -> u.getRole() == Role.COLLEGE_ADMIN && u.getStatus() == UserStatus.ACTIVE)
                .findFirst()
                .orElse(null);

        if (adminUser == null || adminUser.getEmailVerifiedAt() != null) {
            log.info("College [{}] has verified email or inactive admin. Excluded from abandonment cleanup.", college.getId());
            return Collections.emptyList();
        }

        Instant now = Instant.now();
        college.setStatus(CollegeStatus.INACTIVE);
        college.setArchivedAt(now);
        collegeRepository.save(college);

        List<User> users = userRepository.findByCollegeId(college.getId());
        for (User u : users) {
            u.setStatus(UserStatus.INACTIVE);
            u.setEmailReleased(true);
        }
        userRepository.saveAll(users);

        sessionRevocationService.revokeAllSessionsForCollege(college.getId());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("collegeCode", college.getCode());
        metadata.put("initiatedBy", "SYSTEM");
        metadata.put("cutoffDays", cleanupProperties.getAbandonedRetentionDays());

        auditEventService.record(
                AuditEventType.ABANDONED_REGISTRATION_ARCHIVED,
                null,
                null,
                adminUser != null ? adminUser.getId() : null,
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                metadata
        );

        List<CollegeRegistrationDocument> docs = collegeRegistrationDocumentRepository.findByRegistrationId(reg.getId());
        return docs.stream()
                .filter(d -> d.getFilePurgedAt() == null)
                .map(CollegeRegistrationDocument::getId)
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * Executes commit-first, durable cleanup: commits database archival first, then deletes physical files
     * and records durable file_purged_at markers in separate short transactions.
     */
    public void archiveAbandonedRegistrationAndPurgeFiles(Long collegeId) {
        CollegeLifecycleService proxy = (self != null) ? self : this;
        List<Long> draftDocIds = proxy.archiveAbandonedRegistrationInTransaction(collegeId);
        for (Long docId : draftDocIds) {
            collegeRegistrationDocumentRepository.findById(docId).ifPresent(this::purgePhysicalFileAndPersistMarker);
        }
    }

    /**
     * Archives a permanently rejected college in an isolated transaction after retention expiry.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void archivePermanentlyRejectedCollegeInTransaction(Long collegeId) {
        College college = collegeRepository.findByIdWithLock(collegeId).orElse(null);
        if (college == null || college.getArchivedAt() != null || !college.isPermanentlyRejected()) {
            return;
        }

        Instant now = Instant.now();
        college.setArchivedAt(now);
        collegeRepository.save(college);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("collegeCode", college.getCode());
        metadata.put("initiatedBy", "SYSTEM");
        metadata.put("cutoffDays", cleanupProperties.getPermanentRejectionRetentionDays());

        auditEventService.record(
                AuditEventType.PERMANENTLY_REJECTED_COLLEGE_ARCHIVED,
                null,
                null,
                null,
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                metadata
        );

        log.info("Permanently rejected college [{}] archived successfully.", college.getId());
    }

    /**
     * Scheduled job entrypoint: cleans up abandoned registrations older than 7 days.
     */
    public int cleanupAbandonedRegistrations() {
        Instant cutoff = Instant.now().minus(cleanupProperties.getAbandonedRetentionDays(), ChronoUnit.DAYS);
        List<College> candidates = collegeRepository.findAbandonedRegistrations(
                cutoff,
                Role.COLLEGE_ADMIN,
                UserStatus.ACTIVE,
                CollegeApprovalStatus.PENDING,
                CollegeStatus.PENDING_VERIFICATION,
                CollegeApprovalStatus.PENDING,
                PageRequest.of(0, cleanupProperties.getBatchSize())
        );

        int processed = 0;
        for (College college : candidates) {
            try {
                archiveAbandonedRegistrationAndPurgeFiles(college.getId());
                processed++;
            } catch (Exception e) {
                log.error("Failed to archive abandoned college [{}]: {}", college.getId(), e.getMessage(), e);
            }
        }
        log.info("Abandoned registration cleanup completed. Processed [{}] colleges.", processed);
        return processed;
    }

    /**
     * Scheduled job entrypoint: archives permanently rejected colleges older than 7 days retention.
     */
    public int archivePermanentlyRejectedColleges() {
        Instant cutoff = Instant.now().minus(cleanupProperties.getPermanentRejectionRetentionDays(), ChronoUnit.DAYS);
        List<College> candidates = collegeRepository.findPermanentlyRejectedForArchival(
                cutoff,
                PageRequest.of(0, cleanupProperties.getBatchSize())
        );

        CollegeLifecycleService proxy = (self != null) ? self : this;
        int processed = 0;
        for (College college : candidates) {
            try {
                proxy.archivePermanentlyRejectedCollegeInTransaction(college.getId());
                processed++;
            } catch (Exception e) {
                log.error("Failed to archive permanently rejected college [{}]: {}", college.getId(), e.getMessage(), e);
            }
        }
        log.info("Permanent rejection archival completed. Processed [{}] colleges.", processed);
        return processed;
    }

    /**
     * Delegates to dedicated DocumentPurgeMarkerService to persist file_purged_at inside
     * an independent short transaction (REQUIRES_NEW) via Spring proxy.
     */
    public void markDocumentFilePurgedInTransaction(Long documentId, Instant purgedAt) {
        documentPurgeMarkerService.markDocumentFilePurged(documentId, purgedAt);
    }

    /**
     * Executes physical file deletion outside transactions, followed by short transaction marker persistence
     * via dedicated DocumentPurgeMarkerService. Safely handles missing files and leaves marker NULL on failure so
     * future sweeper runs retry.
     */
    public boolean purgePhysicalFileAndPersistMarker(CollegeRegistrationDocument doc) {
        if (doc == null || doc.getStorageKey() == null) {
            return false;
        }
        if (doc.getFilePurgedAt() != null) {
            return true;
        }

        String key = doc.getStorageKey();
        boolean fileRemovedOrMissing = false;

        try {
            if (documentStorageService.exists(key)) {
                documentStorageService.delete(key);
                if (!documentStorageService.exists(key)) {
                    fileRemovedOrMissing = true;
                    log.info("Successfully deleted abandoned physical document file: {}", key);
                } else {
                    log.warn("Physical file deletion failed to remove file [{}]. Will retry on next sweeper run.", key);
                }
            } else {
                fileRemovedOrMissing = true;
                log.debug("Document file [{}] already missing or deleted. Handled idempotently.", key);
            }
        } catch (Exception e) {
            log.warn("Exception during physical document deletion for key [{}]: {}. Will retry on next sweeper run.",
                    key, e.getMessage());
            return false;
        }

        if (fileRemovedOrMissing) {
            try {
                documentPurgeMarkerService.markDocumentFilePurged(doc.getId(), Instant.now());
                return true;
            } catch (Exception e) {
                log.error("Physical deletion succeeded for key [{}] but failed to persist file_purged_at on doc [{}]: {}. Next sweeper run will detect missing file and persist marker.",
                        key, doc.getId(), e.getMessage());
                return false;
            }
        }

        return false;
    }

    /**
     * Scheduled secondary sweeper: performs idempotent keyset traversal over unpurged draft documents
     * (where filePurgedAt IS NULL) across archived colleges without age cutoff.
     */
    public int sweepResidualAbandonedDraftDocuments() {
        long lastProcessedId = 0L;
        int batchSize = cleanupProperties.getSweeperBatchSize();
        int sweptCount = 0;

        while (true) {
            List<CollegeRegistrationDocument> docs = collegeRegistrationDocumentRepository
                    .findEligibleAbandonedDraftDocumentsKeyset(lastProcessedId, PageRequest.of(0, batchSize));

            if (docs.isEmpty()) {
                break;
            }

            for (CollegeRegistrationDocument doc : docs) {
                lastProcessedId = doc.getId();
                try {
                    boolean purged = purgePhysicalFileAndPersistMarker(doc);
                    if (purged) {
                        sweptCount++;
                    }
                } catch (Exception e) {
                    log.warn("Secondary sweeper encountered error on document [{}]: {}", doc.getId(), e.getMessage());
                }
            }

            if (docs.size() < batchSize) {
                break;
            }
        }

        log.info("Secondary sweeper completed. Successfully purged and marked [{}] documents.", sweptCount);
        return sweptCount;
    }

    /**
     * Attempts idempotent physical deletion of document file. Missing file is treated as successful cleanup.
     */
    public void tryDeletePhysicalFile(String storageKey) {
        if (storageKey == null || storageKey.trim().isEmpty()) {
            return;
        }
        try {
            if (documentStorageService.exists(storageKey)) {
                documentStorageService.delete(storageKey);
                if (documentStorageService.exists(storageKey)) {
                    log.warn("Physical file deletion did not delete file [{}]. Will be retried on next sweeper run.", storageKey);
                } else {
                    log.info("Successfully deleted abandoned physical document file: {}", storageKey);
                }
            } else {
                log.debug("Document file [{}] already deleted or missing. Handled idempotently.", storageKey);
            }
        } catch (Exception e) {
            log.warn("Exception during physical document deletion for key [{}]: {}. Will be retried on next sweeper run.",
                    storageKey, e.getMessage());
        }
    }
}
