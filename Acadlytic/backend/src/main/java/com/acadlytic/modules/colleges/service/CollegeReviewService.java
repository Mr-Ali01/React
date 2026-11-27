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
import com.acadlytic.modules.colleges.dto.CollegeReviewSummaryResponse;
import com.acadlytic.modules.colleges.dto.DocumentDownload;
import com.acadlytic.modules.colleges.dto.DocumentResponse;
import com.acadlytic.modules.colleges.dto.DocumentReviewAction;
import com.acadlytic.modules.colleges.dto.DocumentReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.DocumentReviewDecisionResponse;
import com.acadlytic.modules.colleges.dto.DocumentReviewHistoryItemResponse;
import com.acadlytic.modules.colleges.dto.ReviewAdminUserResponse;
import com.acadlytic.modules.colleges.dto.ReviewDecisionAction;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewDecisionResponse;
import com.acadlytic.modules.colleges.dto.ReviewHistoryItemResponse;
import com.acadlytic.modules.colleges.dto.ReviewQueueItemResponse;
import com.acadlytic.modules.colleges.dto.SubmittedRevisionResponse;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeDocumentReview;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.entity.DocumentVerificationProvenance;
import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;
import com.acadlytic.modules.colleges.repository.CollegeDocumentReviewRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.security.SecurityContextService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DeadlockLoserDataAccessException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service orchestrating Super Admin approval queue, review detail inspection,
 * secure document downloads, and review decisions (Phase 03, Module 3.4).
 */
@Service
public class CollegeReviewService {

        private static final Logger log = LoggerFactory.getLogger(CollegeReviewService.class);

        private static final Set<String> WHITELISTED_SORT_PROPERTIES = Set.of(
                        "submittedForReviewAt", "legalName", "createdAt");

        private final CollegeRepository collegeRepository;
        private final CollegeRegistrationRepository collegeRegistrationRepository;
        private final CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository;
        private final CollegeDocumentReviewRepository collegeDocumentReviewRepository;
        private final UserRepository userRepository;
        private final DocumentStorageService documentStorageService;
        private final AuditEventService auditEventService;
        private final SecurityContextService securityContextService;
        private final CollegeLifecycleService collegeLifecycleService;
        private final PlatformTransactionManager transactionManager;

        @Autowired
        public CollegeReviewService(
                        CollegeRepository collegeRepository,
                        CollegeRegistrationRepository collegeRegistrationRepository,
                        CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository,
                        CollegeDocumentReviewRepository collegeDocumentReviewRepository,
                        UserRepository userRepository,
                        DocumentStorageService documentStorageService,
                        AuditEventService auditEventService,
                        SecurityContextService securityContextService,
                        CollegeLifecycleService collegeLifecycleService,
                        @Autowired(required = false) PlatformTransactionManager transactionManager) {
                this.collegeRepository = collegeRepository;
                this.collegeRegistrationRepository = collegeRegistrationRepository;
                this.collegeRegistrationDocumentRepository = collegeRegistrationDocumentRepository;
                this.collegeDocumentReviewRepository = collegeDocumentReviewRepository;
                this.userRepository = userRepository;
                this.documentStorageService = documentStorageService;
                this.auditEventService = auditEventService;
                this.securityContextService = securityContextService;
                this.collegeLifecycleService = collegeLifecycleService;
                this.transactionManager = transactionManager;
        }

        public CollegeReviewService(
                        CollegeRepository collegeRepository,
                        CollegeRegistrationRepository collegeRegistrationRepository,
                        CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository,
                        UserRepository userRepository,
                        DocumentStorageService documentStorageService,
                        AuditEventService auditEventService,
                        SecurityContextService securityContextService,
                        CollegeLifecycleService collegeLifecycleService) {
                this(
                                collegeRepository,
                                collegeRegistrationRepository,
                                collegeRegistrationDocumentRepository,
                                null,
                                userRepository,
                                documentStorageService,
                                auditEventService,
                                securityContextService,
                                collegeLifecycleService,
                                null);
        }

        /**
         * Retrieves paginated pending review queue with deterministic 5-operation
         * retrieval
         * guaranteeing O(1) query count independent of page size (Zero N+1 queries).
         */
        @Transactional(readOnly = true)
        public PageResponse<ReviewQueueItemResponse> getPendingReviewQueue(
                        String search,
                        Instant from,
                        Instant to,
                        int page,
                        int size,
                        String sortParam) {

                // Validate search parameter
                String normalizedSearch = null;
                if (search != null) {
                        String trimmed = search.trim();
                        if (!trimmed.isEmpty()) {
                                if (trimmed.length() > 100) {
                                        throw new AppException(
                                                        "VALIDATION_ERROR",
                                                        "Search query exceeds maximum length of 100 characters.",
                                                        HttpStatus.BAD_REQUEST);
                                }
                                normalizedSearch = trimmed;
                        }
                }

                // Validate date range
                if (from != null && to != null && from.isAfter(to)) {
                        throw new AppException(
                                        "INVALID_DATE_RANGE",
                                        "'from' date cannot be after 'to' date.",
                                        HttpStatus.BAD_REQUEST);
                }

                // Validate pagination parameters
                if (page < 0 || size < 1 || size > 100) {
                        throw new AppException(
                                        "VALIDATION_ERROR",
                                        "Page must be >= 0 and size between 1 and 100.",
                                        HttpStatus.BAD_REQUEST);
                }

                // Parse and validate sort parameter
                Sort sort = parseAndValidateSort(sortParam);
                Pageable pageable = PageRequest.of(page, size, sort);

                // Execute primary queue query
                Page<CollegeRegistration> regPage = collegeRegistrationRepository.findPendingReviewQueue(
                                normalizedSearch, from, to, pageable);

                if (regPage.isEmpty()) {
                        return new PageResponse<>(
                                        Collections.emptyList(),
                                        regPage.getNumber(),
                                        regPage.getSize(),
                                        regPage.getTotalElements(),
                                        regPage.getTotalPages(),
                                        regPage.isLast());
                }

                List<CollegeRegistration> registrations = regPage.getContent();
                List<Long> collegeIds = registrations.stream()
                                .map(CollegeRegistration::getCollegeId)
                                .distinct()
                                .toList();
                List<Long> registrationIds = registrations.stream()
                                .map(CollegeRegistration::getId)
                                .toList();

                // Batch fetch colleges
                Map<Long, College> collegeMap = collegeRepository.findAllById(collegeIds).stream()
                                .collect(Collectors.toMap(College::getId, c -> c));

                // Batch fetch active College Admins
                Map<Long, User> adminMap = userRepository.findByCollegeIdInAndRoleAndStatus(
                                collegeIds, Role.COLLEGE_ADMIN, UserStatus.ACTIVE).stream()
                                .collect(Collectors.toMap(User::getCollegeId, u -> u,
                                                (existing, replacement) -> existing));

                // Batch fetch documents for all page registrations
                List<CollegeRegistrationDocument> allDocs = collegeRegistrationDocumentRepository
                                .findByRegistrationIdIn(registrationIds);
                Map<Long, List<CollegeRegistrationDocument>> docsByRegId = allDocs.stream()
                                .collect(Collectors.groupingBy(CollegeRegistrationDocument::getRegistrationId));

                // Assemble ReviewQueueItemResponse items with in-memory active document count
                List<ReviewQueueItemResponse> items = registrations.stream().map(cr -> {
                        College college = collegeMap.get(cr.getCollegeId());
                        User admin = adminMap.get(cr.getCollegeId());
                        List<CollegeRegistrationDocument> docs = docsByRegId.getOrDefault(cr.getId(),
                                        Collections.emptyList());

                        Set<Long> supersededIds = docs.stream()
                                        .map(CollegeRegistrationDocument::getReplacesDocumentId)
                                        .filter(Objects::nonNull)
                                        .collect(Collectors.toSet());

                        long activeDocCount = docs.stream()
                                        .filter(d -> !supersededIds.contains(d.getId()))
                                        .count();

                        String adminName = admin != null
                                        ? (admin.getFirstName() + " " + admin.getLastName()).trim()
                                        : null;
                        String adminEmail = admin != null ? admin.getEmail() : null;
                        String collegeCode = college != null ? college.getCode() : null;
                        int resubmissionCount = college != null ? college.getResubmissionCount() : 0;
                        int actionRequiredCount = college != null ? college.getActionRequiredCount() : 0;

                        return new ReviewQueueItemResponse(
                                        cr.getCollegeId(),
                                        collegeCode,
                                        cr.getLegalName(),
                                        cr.getId(),
                                        cr.getVersionNumber(),
                                        cr.getStatus(),
                                        cr.getSubmittedForReviewAt(),
                                        adminName,
                                        adminEmail,
                                        resubmissionCount,
                                        actionRequiredCount,
                                        activeDocCount);
                }).toList();

                return new PageResponse<>(
                                items,
                                regPage.getNumber(),
                                regPage.getSize(),
                                regPage.getTotalElements(),
                                regPage.getTotalPages(),
                                regPage.isLast());
        }

        /**
         * Retrieves full application review detail, submitted revision, active
         * documents,
         * and historical revisions for a pending application.
         */
        @Transactional(readOnly = true)
        public CollegeReviewDetailResponse getReviewDetail(Long collegeId) {
                College college = collegeRepository.findById(collegeId)
                                .orElseThrow(() -> new AppException(
                                                "COLLEGE_NOT_FOUND",
                                                "Target college not found.",
                                                HttpStatus.NOT_FOUND));

                validatePendingReviewEligibility(college);

                CollegeRegistration submittedRevision = collegeRegistrationRepository
                                .findById(college.getCurrentRegistrationId())
                                .orElseThrow(() -> new AppException(
                                                "INCONSISTENT_REGISTRATION_STATE",
                                                "Current registration revision not found.",
                                                HttpStatus.INTERNAL_SERVER_ERROR));

                if (submittedRevision.getStatus() != CollegeApprovalStatus.PENDING
                                || submittedRevision.getSubmittedForReviewAt() == null) {
                        throw new AppException(
                                        "APPLICATION_NOT_AWAITING_REVIEW",
                                        "Application is not currently pending review.",
                                        HttpStatus.CONFLICT);
                }

                User adminUser = userRepository.findByCollegeIdInAndRoleAndStatus(
                                List.of(collegeId), Role.COLLEGE_ADMIN, UserStatus.ACTIVE).stream().findFirst()
                                .orElse(null);

                // Fetch and compute active documents for submitted revision
                List<CollegeRegistrationDocument> docs = collegeRegistrationDocumentRepository
                                .findByRegistrationId(submittedRevision.getId());
                Set<Long> supersededIds = docs.stream()
                                .map(CollegeRegistrationDocument::getReplacesDocumentId)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet());
                List<DocumentResponse> activeDocuments = docs.stream()
                                .filter(d -> !supersededIds.contains(d.getId()))
                                .map(this::toDocumentResponse)
                                .toList();

                // Fetch revision history
                List<CollegeRegistration> allRevisions = collegeRegistrationRepository
                                .findByCollegeIdOrderByVersionNumberAsc(collegeId);
                List<ReviewHistoryItemResponse> revisionHistory = allRevisions.stream()
                                .map(this::toReviewHistoryItem)
                                .toList();

                return new CollegeReviewDetailResponse(
                                new CollegeReviewSummaryResponse(
                                                college.getId(),
                                                college.getName(),
                                                college.getCode(),
                                                college.getApprovalStatus(),
                                                college.getStatus(),
                                                college.isPermanentlyRejected(),
                                                college.getResubmissionCount(),
                                                college.getActionRequiredCount(),
                                                college.getCreatedAt()),
                                adminUser != null ? new ReviewAdminUserResponse(
                                                adminUser.getId(),
                                                adminUser.getEmail(),
                                                adminUser.getFirstName(),
                                                adminUser.getLastName(),
                                                adminUser.getEmailVerifiedAt(),
                                                adminUser.getCreatedAt()) : null,
                                new SubmittedRevisionResponse(
                                                submittedRevision.getId(),
                                                submittedRevision.getVersionNumber(),
                                                submittedRevision.getStatus(),
                                                submittedRevision.getLegalName(),
                                                submittedRevision.getAddressLine1(),
                                                submittedRevision.getAddressLine2(),
                                                submittedRevision.getCity(),
                                                submittedRevision.getState(),
                                                submittedRevision.getCountry(),
                                                submittedRevision.getPostalCode(),
                                                submittedRevision.getWebsiteUrl(),
                                                submittedRevision.getContactPhone(),
                                                submittedRevision.getAffiliatedUniversityName(),
                                                submittedRevision.getSubmittedForReviewAt()),
                                activeDocuments,
                                revisionHistory,
                                college.getVersion());
        }

        /**
         * Streams document binary with 4-step ownership validation ensuring zero
         * cross-tenant disclosure.
         */
        @Transactional(readOnly = true)
        public DocumentDownload downloadDocument(Long collegeId, Long documentId) {
                // Step 1: Target college existence
                College college = collegeRepository.findById(collegeId)
                                .orElseThrow(() -> new AppException(
                                                "COLLEGE_NOT_FOUND",
                                                "Target college not found.",
                                                HttpStatus.NOT_FOUND));

                // Step 2: Document existence and direct college ownership
                CollegeRegistrationDocument doc = collegeRegistrationDocumentRepository
                                .findByIdAndCollegeId(documentId, collegeId)
                                .orElseThrow(() -> new AppException(
                                                "DOCUMENT_NOT_FOUND",
                                                "Verification document not found.",
                                                HttpStatus.NOT_FOUND));

                // Step 3: Document's registration association validation
                CollegeRegistration registration = collegeRegistrationRepository
                                .findById(doc.getRegistrationId())
                                .orElseThrow(() -> new AppException(
                                                "INCONSISTENT_REGISTRATION_STATE",
                                                "Document registration association is invalid.",
                                                HttpStatus.INTERNAL_SERVER_ERROR));

                // Step 4: Registration history membership validation
                if (!registration.getCollegeId().equals(college.getId())) {
                        throw new AppException(
                                        "DOCUMENT_NOT_FOUND",
                                        "Verification document not found.",
                                        HttpStatus.NOT_FOUND);
                }

                Resource resource = documentStorageService.loadAsResource(doc.getStorageKey());
                return new DocumentDownload(
                                resource,
                                doc.getOriginalFilename(),
                                doc.getMimeType(),
                                doc.getFileSizeBytes());
        }

        /**
         * Records Super Admin review decision (APPROVE, REQUEST_ACTION, REJECT) under
         * pessimistic lock
         * with optimistic version check, state transition validation, and audit trail
         * emission.
         */
        @Transactional
        public ReviewDecisionResponse recordDecision(Long collegeId, ReviewDecisionRequest request) {
                // Acquire pessimistic row lock
                College college = collegeRepository.findByIdWithLock(collegeId)
                                .orElseThrow(() -> new AppException(
                                                "COLLEGE_NOT_FOUND",
                                                "Target college not found.",
                                                HttpStatus.NOT_FOUND));

                // Optimistic concurrency check
                if (!Objects.equals(college.getVersion(), request.expectedVersion())) {
                        throw new AppException(
                                        "STALE_APPLICATION_VERSION",
                                        "College application was updated by another transaction. Please reload and try again.",
                                        HttpStatus.CONFLICT);
                }

                // Validate pending review eligibility
                validatePendingReviewEligibility(college);

                CollegeRegistration submittedRevision = collegeRegistrationRepository
                                .findById(college.getCurrentRegistrationId())
                                .orElseThrow(() -> new AppException(
                                                "INCONSISTENT_REGISTRATION_STATE",
                                                "Current registration revision not found.",
                                                HttpStatus.INTERNAL_SERVER_ERROR));

                if (submittedRevision.getStatus() != CollegeApprovalStatus.PENDING
                                || submittedRevision.getSubmittedForReviewAt() == null) {
                        throw new AppException(
                                        "APPLICATION_NOT_AWAITING_REVIEW",
                                        "Application is not currently pending review.",
                                        HttpStatus.CONFLICT);
                }

                ReviewDecisionAction action = request.action();
                if (action == null) {
                        throw new AppException(
                                        "VALIDATION_ERROR",
                                        "Review action is required.",
                                        HttpStatus.BAD_REQUEST);
                }

                Long reviewerUserId = securityContextService.requireCurrentUserId();
                Role reviewerRole = securityContextService.requireCurrentRole();
                Instant now = Instant.now();

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("registrationId", submittedRevision.getId());
                metadata.put("versionNumber", submittedRevision.getVersionNumber());
                metadata.put("action", action.name());

                AuditEventType auditEventType = switch (action) {
                        case REQUEST_ACTION -> {
                                if (request.reviewNotes() == null
                                                || request.reviewNotes().trim().length() < 10
                                                || request.reviewNotes().trim().length() > 2000) {
                                        throw new AppException(
                                                        "VALIDATION_ERROR",
                                                        "Review notes are required for action request (between 10 and 2000 characters).",
                                                        HttpStatus.BAD_REQUEST);
                                }
                                if (college.getActionRequiredCount() >= 10) {
                                        throw new AppException(
                                                        "MAX_ACTION_REQUIRED_LIMIT_EXCEEDED",
                                                        "Maximum correction limit (10 rounds) exceeded. Application must be approved or rejected.",
                                                        HttpStatus.BAD_REQUEST);
                                }

                                // Update submitted revision
                                submittedRevision.setStatus(CollegeApprovalStatus.ACTION_REQUIRED);
                                submittedRevision.setReviewerUserId(reviewerUserId);
                                submittedRevision.setReviewNotes(request.reviewNotes().trim());
                                submittedRevision.setReviewedAt(now);
                                collegeRegistrationRepository.save(submittedRevision);

                                // Update college approval status (action_required_count is NOT incremented
                                // here; Module 3.3 owns increment on resubmission)
                                college.setApprovalStatus(CollegeApprovalStatus.ACTION_REQUIRED);
                                collegeRepository.save(college);

                                metadata.put("reviewNotes", request.reviewNotes().trim());
                                yield AuditEventType.COLLEGE_REGISTRATION_ACTION_REQUIRED;
                        }
                        case REJECT -> {
                                if (request.rejectionReason() == null
                                                || request.rejectionReason().trim().length() < 10
                                                || request.rejectionReason().trim().length() > 2000) {
                                        throw new AppException(
                                                        "VALIDATION_ERROR",
                                                        "Rejection reason is required (between 10 and 2000 characters).",
                                                        HttpStatus.BAD_REQUEST);
                                }

                                boolean isPermanent = college.getResubmissionCount() >= 3;

                                // Update submitted revision
                                submittedRevision.setStatus(CollegeApprovalStatus.REJECTED);
                                submittedRevision.setReviewerUserId(reviewerUserId);
                                submittedRevision.setRejectionReason(request.rejectionReason().trim());
                                submittedRevision.setReviewedAt(now);
                                collegeRegistrationRepository.save(submittedRevision);

                                // Update college approval status
                                college.setApprovalStatus(CollegeApprovalStatus.REJECTED);
                                collegeRepository.save(college);

                                metadata.put("rejectionReason", request.rejectionReason().trim());
                                if (isPermanent) {
                                        metadata.put("isPermanentRejection", true);
                                }
                                yield AuditEventType.COLLEGE_REGISTRATION_REJECTED;
                        }
                        case APPROVE -> {
                                if (request.reviewNotes() != null && request.reviewNotes().trim().length() > 2000) {
                                        throw new AppException(
                                                        "VALIDATION_ERROR",
                                                        "Review notes must not exceed 2000 characters.",
                                                        HttpStatus.BAD_REQUEST);
                                }

                                // Phase 03, Module 3.6C: Document verification gate
                                // Hierarchical lock: target document rows locked second (parent college already
                                // locked with pessimistic write lock)
                                List<CollegeRegistrationDocument> docs = collegeRegistrationDocumentRepository
                                                .findByRegistrationIdWithLock(submittedRevision.getId());

                                // Filter to active documents (excluding superseded documents)
                                Set<Long> supersededIds = docs.stream()
                                                .map(CollegeRegistrationDocument::getReplacesDocumentId)
                                                .filter(Objects::nonNull)
                                                .collect(Collectors.toSet());

                                List<CollegeRegistrationDocument> activeDocs = docs.stream()
                                                .filter(d -> !supersededIds.contains(d.getId()))
                                                .toList();

                                // 1. Mandatory categories check: UNIVERSITY_AFFILIATION_CERTIFICATE and
                                // AUTHORIZED_SIGNATORY_ID must both be present
                                Set<DocumentCategory> activeCategories = activeDocs.stream()
                                                .map(CollegeRegistrationDocument::getDocumentCategory)
                                                .collect(Collectors.toSet());

                                if (!activeCategories.contains(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE)
                                                || !activeCategories
                                                                .contains(DocumentCategory.AUTHORIZED_SIGNATORY_ID)) {
                                        throw new AppException(
                                                        "REQUIRED_DOCUMENTS_MISSING",
                                                        "Required verification documents missing: University Affiliation Certificate and Authorized Signatory ID are mandatory.",
                                                        HttpStatus.BAD_REQUEST);
                                }

                                // 2. Document Status check:
                                // If any active document has status REJECTED -> DOCUMENTS_REJECTED
                                CollegeRegistrationDocument rejectedDoc = activeDocs.stream()
                                                .filter(d -> d.getVerificationStatus() == DocumentVerificationStatus.REJECTED)
                                                .findFirst()
                                                .orElse(null);

                                if (rejectedDoc != null) {
                                        throw new AppException(
                                                        "DOCUMENTS_REJECTED",
                                                        "Cannot approve application: Document '"
                                                                        + rejectedDoc.getOriginalFilename() + "' ("
                                                                        + rejectedDoc.getDocumentCategory()
                                                                        + ") was rejected. Action must be requested to allow document replacement.",
                                                        HttpStatus.CONFLICT);
                                }

                                // If any active document is not ACCEPTED (e.g. PENDING or null) ->
                                // DOCUMENTS_NOT_VERIFIED
                                CollegeRegistrationDocument unverifiedDoc = activeDocs.stream()
                                                .filter(d -> d.getVerificationStatus() != DocumentVerificationStatus.ACCEPTED)
                                                .findFirst()
                                                .orElse(null);

                                if (unverifiedDoc != null) {
                                        throw new AppException(
                                                        "DOCUMENTS_NOT_VERIFIED",
                                                        "Cannot approve application: Document '"
                                                                        + unverifiedDoc.getOriginalFilename() + "' ("
                                                                        + unverifiedDoc.getDocumentCategory()
                                                                        + ") is pending verification.",
                                                        HttpStatus.CONFLICT);
                                }

                                String trimmedNotes = (request.reviewNotes() != null
                                                && !request.reviewNotes().trim().isEmpty())
                                                                ? request.reviewNotes().trim()
                                                                : null;

                                // Update submitted revision
                                submittedRevision.setStatus(CollegeApprovalStatus.APPROVED);
                                submittedRevision.setReviewerUserId(reviewerUserId);
                                submittedRevision.setReviewNotes(trimmedNotes);
                                submittedRevision.setReviewedAt(now);
                                collegeRegistrationRepository.save(submittedRevision);

                                // Update college approval status
                                college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
                                collegeRepository.save(college);

                                if (trimmedNotes != null) {
                                        metadata.put("reviewNotes", trimmedNotes);
                                }
                                yield AuditEventType.COLLEGE_REGISTRATION_APPROVED;
                        }
                };

                // Record decision audit event
                User proposedAdmin = userRepository.findByCollegeIdInAndRoleAndStatus(
                                List.of(collegeId), Role.COLLEGE_ADMIN, UserStatus.ACTIVE).stream().findFirst()
                                .orElse(null);
                Long targetUserId = proposedAdmin != null ? proposedAdmin.getId() : null;

                auditEventService.record(
                                auditEventType,
                                reviewerUserId,
                                reviewerRole,
                                targetUserId,
                                college.getId(),
                                AuditOutcome.SUCCESS,
                                null,
                                metadata);

                // Execute lifecycle transitions and outbox notifications in the same
                // transaction (Module 3.5)
                switch (action) {
                        case APPROVE -> collegeLifecycleService.onCollegeApproved(
                                        college, submittedRevision, proposedAdmin, reviewerUserId, reviewerRole);
                        case REQUEST_ACTION -> collegeLifecycleService.onActionRequired(
                                        college, submittedRevision, proposedAdmin);
                        case REJECT -> {
                                if (college.getResubmissionCount() >= 3) {
                                        collegeLifecycleService.onPermanentRejection(
                                                        college, submittedRevision, proposedAdmin, reviewerUserId,
                                                        reviewerRole);
                                } else {
                                        collegeLifecycleService.onNonPermanentRejection(
                                                        college, submittedRevision, proposedAdmin);
                                }
                        }
                }

                log.info("Super Admin [{}] recorded review decision [{}] for college [{}] revision [{}]",
                                reviewerUserId, action, college.getId(), submittedRevision.getVersionNumber());

                return new ReviewDecisionResponse(
                                college.getId(),
                                submittedRevision.getId(),
                                submittedRevision.getVersionNumber(),
                                college.getApprovalStatus(),
                                submittedRevision.getReviewedAt(),
                                reviewerUserId);
        }

        private void validatePendingReviewEligibility(College college) {
                if (college.isPermanentlyRejected()
                                || college.getArchivedAt() != null
                                || college.getApprovalStatus() != CollegeApprovalStatus.PENDING
                                || college.getCurrentRegistrationId() == null) {
                        throw new AppException(
                                        "APPLICATION_NOT_AWAITING_REVIEW",
                                        "Application is not currently pending review.",
                                        HttpStatus.CONFLICT);
                }
        }

        private Sort parseAndValidateSort(String sortParam) {
                if (sortParam == null || sortParam.trim().isEmpty()) {
                        return Sort.by(Sort.Direction.ASC, "submittedForReviewAt")
                                        .and(Sort.by(Sort.Direction.ASC, "id"));
                }

                String[] parts = sortParam.split(",");
                String property = parts[0].trim();
                Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc"))
                                ? Sort.Direction.DESC
                                : Sort.Direction.ASC;

                if (!WHITELISTED_SORT_PROPERTIES.contains(property)) {
                        throw new AppException(
                                        "INVALID_SORT_PROPERTY",
                                        "Invalid sort property: " + property
                                                        + ". Whitelisted properties: submittedForReviewAt, legalName, createdAt",
                                        HttpStatus.BAD_REQUEST);
                }

                return Sort.by(direction, property).and(Sort.by(Sort.Direction.ASC, "id"));
        }

        private DocumentResponse toDocumentResponse(CollegeRegistrationDocument doc) {
                return new DocumentResponse(
                                doc.getId(),
                                doc.getRegistrationId(),
                                doc.getDocumentCategory(),
                                doc.getOriginalFilename(),
                                doc.getMimeType(),
                                doc.getFileSizeBytes(),
                                doc.getSha256Checksum(),
                                doc.getReplacesDocumentId(),
                                doc.getCreatedAt(),
                                doc.getVerificationStatus() != null ? doc.getVerificationStatus()
                                                : DocumentVerificationStatus.PENDING,
                                doc.getVerificationProvenance() != null ? doc.getVerificationProvenance()
                                                : DocumentVerificationProvenance.NOT_REVIEWED,
                                doc.getRejectionReason(),
                                doc.getLastReviewedAt(),
                                doc.getLastReviewedByUserId(),
                                doc.getVersion() != null ? doc.getVersion() : 0L);
        }

        /**
         * Records Super Admin review decision (ACCEPT or REJECT) on an individual
         * verification document (Module 3.6B).
         * Enforces hierarchical locking: parent College row locked first, Document row
         * locked second.
         * Bounded retry with fresh transactions handles transient lock wait timeouts or
         * deadlocks.
         */
        public DocumentReviewDecisionResponse recordDocumentDecision(
                        Long collegeId,
                        Long documentId,
                        DocumentReviewDecisionRequest request) {

                if (transactionManager == null) {
                        return executeRecordDocumentDecision(collegeId, documentId, request);
                }

                int maxAttempts = 3;
                long delayMs = 100;
                for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                        try {
                                TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
                                txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                                return txTemplate.execute(status -> executeRecordDocumentDecision(collegeId, documentId,
                                                request));
                        } catch (PessimisticLockingFailureException ex) {
                                if (attempt == maxAttempts) {
                                        log.error("Exhausted lock acquisition retries ({} attempts) for college {} document {}",
                                                        maxAttempts, collegeId, documentId, ex);
                                        throw ex;
                                }
                                log.warn("Lock acquisition failure or deadlock during document review (attempt {}/{}). Retrying in {}ms...",
                                                attempt, maxAttempts, delayMs);
                                try {
                                        Thread.sleep(delayMs);
                                } catch (InterruptedException ie) {
                                        Thread.currentThread().interrupt();
                                        throw ex;
                                }
                                delayMs *= 2;
                        }
                }
                throw new AppException("LOCK_ACQUISITION_TIMEOUT", "Failed to acquire lock after retries.",
                                HttpStatus.CONFLICT);
        }

        /**
         * Executes document review decision inside an isolated transaction.
         */
        @Transactional
        public DocumentReviewDecisionResponse executeRecordDocumentDecision(
                        Long collegeId,
                        Long documentId,
                        DocumentReviewDecisionRequest request) {

                // Step 1: Hierarchical lock - acquire parent College row lock first
                College college = collegeRepository.findByIdWithLock(collegeId)
                                .orElseThrow(() -> new AppException(
                                                "COLLEGE_NOT_FOUND",
                                                "Target college not found.",
                                                HttpStatus.NOT_FOUND));

                // Step 2: Validate pending review eligibility on college
                validatePendingReviewEligibility(college);

                if (college.getCurrentRegistrationId() == null) {
                        throw new AppException(
                                        "INCONSISTENT_REGISTRATION_STATE",
                                        "No current registration revision found.",
                                        HttpStatus.INTERNAL_SERVER_ERROR);
                }

                CollegeRegistration submittedRevision = collegeRegistrationRepository
                                .findById(college.getCurrentRegistrationId())
                                .orElseThrow(() -> new AppException(
                                                "INCONSISTENT_REGISTRATION_STATE",
                                                "Current registration revision not found.",
                                                HttpStatus.INTERNAL_SERVER_ERROR));

                if (submittedRevision.getStatus() != CollegeApprovalStatus.PENDING
                                || submittedRevision.getSubmittedForReviewAt() == null) {
                        throw new AppException(
                                        "APPLICATION_NOT_AWAITING_REVIEW",
                                        "Application is not currently pending review.",
                                        HttpStatus.CONFLICT);
                }

                // Step 3: Hierarchical lock - acquire target Document row lock second
                CollegeRegistrationDocument doc = collegeRegistrationDocumentRepository
                                .findByIdAndCollegeIdWithLock(documentId, collegeId)
                                .orElseThrow(() -> new AppException(
                                                "DOCUMENT_NOT_FOUND",
                                                "Verification document not found.",
                                                HttpStatus.NOT_FOUND));

                // Cross-revision check: document must belong to the active submitted
                // registration revision
                if (!doc.getRegistrationId().equals(submittedRevision.getId())) {
                        throw new AppException(
                                        "APPLICATION_NOT_AWAITING_REVIEW",
                                        "Document does not belong to the submitted registration revision awaiting review.",
                                        HttpStatus.CONFLICT);
                }

                // Step 4: Validate request action and rejection reason
                DocumentReviewAction action = request.action();
                if (action == null) {
                        throw new AppException(
                                        "VALIDATION_ERROR",
                                        "Review action is required.",
                                        HttpStatus.BAD_REQUEST);
                }

                DocumentVerificationStatus targetStatus = action.toVerificationStatus();
                String normalizedRejectionReason = null;

                if (action == DocumentReviewAction.REJECT) {
                        if (request.rejectionReason() == null
                                        || request.rejectionReason().trim().length() < 10
                                        || request.rejectionReason().trim().length() > 1000) {
                                throw new AppException(
                                                "VALIDATION_ERROR",
                                                "Rejection reason is required (between 10 and 1000 characters).",
                                                HttpStatus.BAD_REQUEST);
                        }
                        normalizedRejectionReason = request.rejectionReason().trim();
                } else {
                        if (request.rejectionReason() != null && !request.rejectionReason().trim().isEmpty()) {
                                throw new AppException(
                                                "VALIDATION_ERROR",
                                                "Rejection reason must be null for ACCEPT action.",
                                                HttpStatus.BAD_REQUEST);
                        }
                }

                if (request.expectedDocumentVersion() == null || request.expectedDocumentVersion() < 0) {
                        throw new AppException(
                                        "VALIDATION_ERROR",
                                        "Expected document version must be greater than or equal to 0.",
                                        HttpStatus.BAD_REQUEST);
                }

                // Step 5: Idempotency & Concurrency Version Check
                boolean isAlreadyInTargetState = doc.getVerificationStatus() == targetStatus
                                && (targetStatus != DocumentVerificationStatus.REJECTED
                                                || Objects.equals(doc.getRejectionReason(), normalizedRejectionReason));

                if (isAlreadyInTargetState) {
                        if (Objects.equals(request.expectedDocumentVersion(), doc.getVersion())
                                        || (doc.getVersion() > 0 && Objects.equals(request.expectedDocumentVersion(),
                                                        doc.getVersion() - 1))) {
                                log.info("Idempotent document review decision received for docId={}, collegeId={}",
                                                documentId, collegeId);
                                User reviewerUser = doc.getLastReviewedByUserId() != null
                                                ? userRepository.findById(doc.getLastReviewedByUserId()).orElse(null)
                                                : null;
                                return toDocumentReviewDecisionResponse(doc,
                                                reviewerUser != null ? reviewerUser.getEmail() : null);
                        }
                }

                if (!Objects.equals(doc.getVersion(), request.expectedDocumentVersion())) {
                        throw new AppException(
                                        "STALE_DOCUMENT_VERSION",
                                        "Document was updated or reviewed by another transaction. Please reload and try again.",
                                        HttpStatus.CONFLICT);
                }

                // Step 6: Mutate document state & append audit record
                Long reviewerUserId = securityContextService.requireCurrentUserId();
                Role reviewerRole = securityContextService.requireCurrentRole();
                User reviewerUser = userRepository.findById(reviewerUserId).orElse(null);
                Instant now = Instant.now();

                // Append-only review history table insertion
                CollegeDocumentReview auditRecord = new CollegeDocumentReview();
                auditRecord.setCollegeId(college.getId());
                auditRecord.setRegistrationId(doc.getRegistrationId());
                auditRecord.setDocumentId(doc.getId());
                auditRecord.setAction(action.toHistoryAction());
                auditRecord.setRejectionReason(normalizedRejectionReason);
                auditRecord.setReviewerUserId(reviewerUserId);
                auditRecord.setReviewedAt(now);
                auditRecord.setCreatedAt(now);
                if (collegeDocumentReviewRepository != null) {
                        collegeDocumentReviewRepository.save(auditRecord);
                }

                // Update document entity (College entity version remains untouched!)
                doc.setVerificationStatus(targetStatus);
                doc.setVerificationProvenance(DocumentVerificationProvenance.DIRECT_REVIEW);
                doc.setRejectionReason(normalizedRejectionReason);
                doc.setLastReviewedByUserId(reviewerUserId);
                doc.setLastReviewedAt(now);
                CollegeRegistrationDocument savedDoc = collegeRegistrationDocumentRepository.saveAndFlush(doc);

                // Record audit event
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("collegeId", college.getId());
                metadata.put("registrationId", doc.getRegistrationId());
                metadata.put("documentId", doc.getId());
                metadata.put("documentCategory", doc.getDocumentCategory().name());
                metadata.put("action", action.name());
                metadata.put("expectedDocumentVersion", request.expectedDocumentVersion());
                metadata.put("newDocumentVersion", savedDoc.getVersion());
                if (normalizedRejectionReason != null) {
                        metadata.put("rejectionReason", normalizedRejectionReason);
                }

                AuditEventType auditEventType = (targetStatus == DocumentVerificationStatus.ACCEPTED)
                                ? AuditEventType.COLLEGE_REGISTRATION_DOC_ACCEPTED
                                : AuditEventType.COLLEGE_REGISTRATION_DOC_REJECTED;

                auditEventService.record(
                                auditEventType,
                                reviewerUserId,
                                reviewerRole,
                                null,
                                college.getId(),
                                AuditOutcome.SUCCESS,
                                null,
                                metadata);

                log.info("Super Admin [{}] recorded document review decision [{}] on document [{}] college [{}]",
                                reviewerUserId, action, documentId, collegeId);

                return toDocumentReviewDecisionResponse(savedDoc,
                                reviewerUser != null ? reviewerUser.getEmail() : null);
        }

        /**
         * Retrieves chronological review history records for an individual document.
         */
        @Transactional(readOnly = true)
        public List<DocumentReviewHistoryItemResponse> getDocumentReviewHistory(Long collegeId, Long documentId) {
                College college = collegeRepository.findById(collegeId)
                                .orElseThrow(() -> new AppException(
                                                "COLLEGE_NOT_FOUND",
                                                "Target college not found.",
                                                HttpStatus.NOT_FOUND));

                CollegeRegistrationDocument doc = collegeRegistrationDocumentRepository
                                .findByIdAndCollegeId(documentId, collegeId)
                                .orElseThrow(() -> new AppException(
                                                "DOCUMENT_NOT_FOUND",
                                                "Verification document not found.",
                                                HttpStatus.NOT_FOUND));

                if (collegeDocumentReviewRepository == null) {
                        return List.of();
                }

                List<CollegeDocumentReview> reviews = collegeDocumentReviewRepository
                                .findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(collegeId, documentId);

                if (reviews.isEmpty()) {
                        return List.of();
                }

                Set<Long> reviewerUserIds = reviews.stream()
                                .map(CollegeDocumentReview::getReviewerUserId)
                                .collect(Collectors.toSet());
                Map<Long, String> reviewerEmails = userRepository.findAllById(reviewerUserIds).stream()
                                .collect(Collectors.toMap(User::getId, User::getEmail));

                return reviews.stream()
                                .map(r -> new DocumentReviewHistoryItemResponse(
                                                r.getId(),
                                                r.getId(),
                                                r.getDocumentId(),
                                                r.getRegistrationId(),
                                                r.getCollegeId(),
                                                r.getAction(),
                                                r.getRejectionReason(),
                                                r.getReviewerUserId(),
                                                reviewerEmails.get(r.getReviewerUserId()),
                                                r.getReviewedAt(),
                                                r.getCreatedAt()))
                                .toList();
        }

        private DocumentReviewDecisionResponse toDocumentReviewDecisionResponse(
                        CollegeRegistrationDocument doc,
                        String reviewerEmail) {
                return new DocumentReviewDecisionResponse(
                                doc.getId(),
                                doc.getRegistrationId(),
                                doc.getDocumentCategory(),
                                doc.getVerificationStatus(),
                                doc.getVerificationProvenance(),
                                doc.getRejectionReason(),
                                doc.getLastReviewedAt(),
                                doc.getLastReviewedByUserId(),
                                reviewerEmail,
                                doc.getVersion());
        }

        private ReviewHistoryItemResponse toReviewHistoryItem(CollegeRegistration rev) {
                return new ReviewHistoryItemResponse(
                                rev.getId(),
                                rev.getVersionNumber(),
                                rev.getStatus(),
                                rev.getLegalName(),
                                rev.getSubmittedForReviewAt(),
                                rev.getReviewerUserId(),
                                rev.getReviewNotes(),
                                rev.getRejectionReason(),
                                rev.isPermanentRejection(),
                                rev.getReviewedAt(),
                                rev.getCreatedAt());
        }
}
