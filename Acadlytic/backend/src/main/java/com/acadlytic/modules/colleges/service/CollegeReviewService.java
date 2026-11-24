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
import com.acadlytic.modules.colleges.dto.ReviewAdminUserResponse;
import com.acadlytic.modules.colleges.dto.ReviewDecisionAction;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewDecisionResponse;
import com.acadlytic.modules.colleges.dto.ReviewHistoryItemResponse;
import com.acadlytic.modules.colleges.dto.ReviewQueueItemResponse;
import com.acadlytic.modules.colleges.dto.SubmittedRevisionResponse;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.storage.DocumentStorageService;
import com.acadlytic.security.SecurityContextService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            "submittedForReviewAt", "legalName", "createdAt"
    );

    private final CollegeRepository collegeRepository;
    private final CollegeRegistrationRepository collegeRegistrationRepository;
    private final CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository;
    private final UserRepository userRepository;
    private final DocumentStorageService documentStorageService;
    private final AuditEventService auditEventService;
    private final SecurityContextService securityContextService;
    private final CollegeLifecycleService collegeLifecycleService;

    public CollegeReviewService(
            CollegeRepository collegeRepository,
            CollegeRegistrationRepository collegeRegistrationRepository,
            CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository,
            UserRepository userRepository,
            DocumentStorageService documentStorageService,
            AuditEventService auditEventService,
            SecurityContextService securityContextService,
            CollegeLifecycleService collegeLifecycleService) {
        this.collegeRepository = collegeRepository;
        this.collegeRegistrationRepository = collegeRegistrationRepository;
        this.collegeRegistrationDocumentRepository = collegeRegistrationDocumentRepository;
        this.userRepository = userRepository;
        this.documentStorageService = documentStorageService;
        this.auditEventService = auditEventService;
        this.securityContextService = securityContextService;
        this.collegeLifecycleService = collegeLifecycleService;
    }

    /**
     * Retrieves paginated pending review queue with deterministic 5-operation retrieval
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
                    regPage.isLast()
            );
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
                .collect(Collectors.toMap(User::getCollegeId, u -> u, (existing, replacement) -> existing));

        // Batch fetch documents for all page registrations
        List<CollegeRegistrationDocument> allDocs = collegeRegistrationDocumentRepository
                .findByRegistrationIdIn(registrationIds);
        Map<Long, List<CollegeRegistrationDocument>> docsByRegId = allDocs.stream()
                .collect(Collectors.groupingBy(CollegeRegistrationDocument::getRegistrationId));

        // Assemble ReviewQueueItemResponse items with in-memory active document count
        List<ReviewQueueItemResponse> items = registrations.stream().map(cr -> {
            College college = collegeMap.get(cr.getCollegeId());
            User admin = adminMap.get(cr.getCollegeId());
            List<CollegeRegistrationDocument> docs = docsByRegId.getOrDefault(cr.getId(), Collections.emptyList());

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
                    activeDocCount
            );
        }).toList();

        return new PageResponse<>(
                items,
                regPage.getNumber(),
                regPage.getSize(),
                regPage.getTotalElements(),
                regPage.getTotalPages(),
                regPage.isLast()
        );
    }

    /**
     * Retrieves full application review detail, submitted revision, active documents,
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
                List.of(collegeId), Role.COLLEGE_ADMIN, UserStatus.ACTIVE).stream().findFirst().orElse(null);

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
                        college.getCreatedAt()
                ),
                adminUser != null ? new ReviewAdminUserResponse(
                        adminUser.getId(),
                        adminUser.getEmail(),
                        adminUser.getFirstName(),
                        adminUser.getLastName(),
                        adminUser.getEmailVerifiedAt(),
                        adminUser.getCreatedAt()
                ) : null,
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
                        submittedRevision.getSubmittedForReviewAt()
                ),
                activeDocuments,
                revisionHistory,
                college.getVersion()
        );
    }

    /**
     * Streams document binary with 4-step ownership validation ensuring zero cross-tenant disclosure.
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
                doc.getFileSizeBytes()
        );
    }

    /**
     * Records Super Admin review decision (APPROVE, REQUEST_ACTION, REJECT) under pessimistic lock
     * with optimistic version check, state transition validation, and audit trail emission.
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

                // Update college approval status (action_required_count is NOT incremented here; Module 3.3 owns increment on resubmission)
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

                String trimmedNotes = (request.reviewNotes() != null && !request.reviewNotes().trim().isEmpty())
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
                List.of(collegeId), Role.COLLEGE_ADMIN, UserStatus.ACTIVE).stream().findFirst().orElse(null);
        Long targetUserId = proposedAdmin != null ? proposedAdmin.getId() : null;

        auditEventService.record(
                auditEventType,
                reviewerUserId,
                reviewerRole,
                targetUserId,
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                metadata
        );

        // Execute lifecycle transitions and outbox notifications in the same transaction (Module 3.5)
        switch (action) {
            case APPROVE -> collegeLifecycleService.onCollegeApproved(
                    college, submittedRevision, proposedAdmin, reviewerUserId, reviewerRole);
            case REQUEST_ACTION -> collegeLifecycleService.onActionRequired(
                    college, submittedRevision, proposedAdmin);
            case REJECT -> {
                if (college.getResubmissionCount() >= 3) {
                    collegeLifecycleService.onPermanentRejection(
                            college, submittedRevision, proposedAdmin, reviewerUserId, reviewerRole);
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
                reviewerUserId
        );
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
            return Sort.by(Sort.Direction.ASC, "submittedForReviewAt").and(Sort.by(Sort.Direction.ASC, "id"));
        }

        String[] parts = sortParam.split(",");
        String property = parts[0].trim();
        Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc"))
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        if (!WHITELISTED_SORT_PROPERTIES.contains(property)) {
            throw new AppException(
                    "INVALID_SORT_PROPERTY",
                    "Invalid sort property: " + property + ". Whitelisted properties: submittedForReviewAt, legalName, createdAt",
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
                doc.getCreatedAt()
        );
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
                rev.getCreatedAt()
        );
    }
}
