package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.DocumentProperties;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.dto.CollegeProfileResponse;
import com.acadlytic.modules.colleges.dto.CollegeSummaryResponse;
import com.acadlytic.modules.colleges.dto.CurrentRevisionResponse;
import com.acadlytic.modules.colleges.dto.DocumentDownload;
import com.acadlytic.modules.colleges.dto.DocumentResponse;
import com.acadlytic.modules.colleges.dto.MyApplicationResponse;
import com.acadlytic.modules.colleges.dto.OnboardingChecklistResponse;
import com.acadlytic.modules.colleges.dto.ResubmissionAllowanceResponse;
import com.acadlytic.modules.colleges.dto.ReviewFeedbackResponse;
import com.acadlytic.modules.colleges.dto.RevisionSummaryResponse;
import com.acadlytic.modules.colleges.dto.SubmitApplicationResponse;
import com.acadlytic.modules.colleges.dto.UpdateApplicationRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.entity.DocumentVerificationProvenance;
import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service orchestrating College Admin restricted onboarding, document lifecycle,
 * correction drafts, and review submission (Phase 03, Module 3.3).
 */
@Service
public class CollegeOnboardingService {

    private static final Logger log = LoggerFactory.getLogger(CollegeOnboardingService.class);

    private final CollegeRepository collegeRepository;
    private final CollegeRegistrationRepository collegeRegistrationRepository;
    private final CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository;
    private final UserRepository userRepository;
    private final DocumentStorageService documentStorageService;
    private final DocumentValidator documentValidator;
    private final DocumentStorageCompensationHandler compensationHandler;
    private final AuditEventService auditEventService;
    private final CollegeAccessGuard collegeAccessGuard;
    private final SecurityContextService securityContextService;
    private final DocumentProperties documentProperties;

    public CollegeOnboardingService(
            CollegeRepository collegeRepository,
            CollegeRegistrationRepository collegeRegistrationRepository,
            CollegeRegistrationDocumentRepository collegeRegistrationDocumentRepository,
            UserRepository userRepository,
            DocumentStorageService documentStorageService,
            DocumentValidator documentValidator,
            DocumentStorageCompensationHandler compensationHandler,
            AuditEventService auditEventService,
            CollegeAccessGuard collegeAccessGuard,
            SecurityContextService securityContextService,
            DocumentProperties documentProperties) {
        this.collegeRepository = collegeRepository;
        this.collegeRegistrationRepository = collegeRegistrationRepository;
        this.collegeRegistrationDocumentRepository = collegeRegistrationDocumentRepository;
        this.userRepository = userRepository;
        this.documentStorageService = documentStorageService;
        this.documentValidator = documentValidator;
        this.compensationHandler = compensationHandler;
        this.auditEventService = auditEventService;
        this.collegeAccessGuard = collegeAccessGuard;
        this.securityContextService = securityContextService;
        this.documentProperties = documentProperties;
    }

    /**
     * Retrieves application details, active draft, decoupled review feedback, checklist, active documents,
     * and historical revisions for GET /api/v1/college-registrations/my-application.
     */
    @Transactional(readOnly = true)
    public MyApplicationResponse getMyApplication() {
        College college = collegeAccessGuard.requireRestrictedOnboardingAccess();
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();

        List<CollegeRegistration> allRevisions = collegeRegistrationRepository
                .findByCollegeIdOrderByVersionNumberAsc(college.getId());

        CollegeRegistration latestRevision = allRevisions.stream()
                .reduce((first, second) -> second)
                .orElseThrow(() -> new AppException(
                        "INCONSISTENT_REGISTRATION_STATE",
                        "No registration revisions found for college.",
                        HttpStatus.INTERNAL_SERVER_ERROR));

        boolean isDraft = latestRevision.getSubmittedForReviewAt() == null;

        // Resolve authoritative review feedback strictly from submitted revision
        ReviewFeedbackResponse reviewFeedback = resolveReviewFeedback(college);

        // Resolve active documents for current revision
        List<CollegeRegistrationDocument> allDraftDocs = collegeRegistrationDocumentRepository
                .findByRegistrationId(latestRevision.getId());
        List<DocumentResponse> activeDocuments = computeActiveDocuments(allDraftDocs);

        // Resolve checklist status
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new AppException("USER_NOT_FOUND", "Authenticated user not found.", HttpStatus.NOT_FOUND));
        boolean emailVerified = user.getEmailVerifiedAt() != null;

        Set<DocumentCategory> activeCategories = activeDocuments.stream()
                .map(DocumentResponse::documentCategory)
                .collect(Collectors.toSet());
        boolean requiredDocumentsUploaded = activeCategories.contains(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE)
                && activeCategories.contains(DocumentCategory.AUTHORIZED_SIGNATORY_ID);

        boolean isFrozenInReview = (latestRevision.getSubmittedForReviewAt() != null)
                && (latestRevision.getStatus() == CollegeApprovalStatus.PENDING);

        boolean canSubmitForReview = isDraft && emailVerified && requiredDocumentsUploaded;

        boolean canStartCorrectionDraft = false;
        if (!isDraft) {
            CollegeApprovalStatus status = latestRevision.getStatus();
            if (status == CollegeApprovalStatus.ACTION_REQUIRED && college.getActionRequiredCount() < 10) {
                canStartCorrectionDraft = true;
            } else if (status == CollegeApprovalStatus.REJECTED && !college.isPermanentlyRejected() && college.getResubmissionCount() < 3) {
                canStartCorrectionDraft = true;
            }
        }

        OnboardingChecklistResponse checklist = new OnboardingChecklistResponse(
                emailVerified,
                requiredDocumentsUploaded,
                canSubmitForReview,
                canStartCorrectionDraft,
                isFrozenInReview);

        ResubmissionAllowanceResponse resubmission = new ResubmissionAllowanceResponse(
                college.getResubmissionCount(),
                college.getActionRequiredCount(),
                3,
                10);

        CollegeSummaryResponse collegeSummary = new CollegeSummaryResponse(
                college.getId(),
                college.getName(),
                college.getCode(),
                college.getApprovalStatus(),
                college.getStatus());

        CurrentRevisionResponse currentRevision = toCurrentRevisionResponse(latestRevision, isDraft);

        List<RevisionSummaryResponse> revisionHistory = allRevisions.stream()
                .filter(r -> r.getSubmittedForReviewAt() != null)
                .map(r -> new RevisionSummaryResponse(
                        r.getId(),
                        r.getVersionNumber(),
                        r.getStatus(),
                        r.getSubmittedForReviewAt(),
                        r.getReviewedAt(),
                        r.isPermanentRejection()))
                .toList();

        return new MyApplicationResponse(
                collegeSummary,
                currentRevision,
                reviewFeedback,
                resubmission,
                checklist,
                activeDocuments,
                revisionHistory);
    }

    /**
     * Creates an immutable correction draft revision v+1 under parent College pessimistic lock.
     */
    @Transactional
    public CurrentRevisionResponse createCorrectionDraft() {
        collegeAccessGuard.requireRestrictedOnboardingAccess();
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();

        College college = collegeRepository.findByIdWithLock(principal.getCollegeId())
                .orElseThrow(() -> new AppException("COLLEGE_NOT_FOUND", "College tenant not found.", HttpStatus.NOT_FOUND));

        validateOperationalStateForCorrection(college);

        if (college.getCurrentRegistrationId() == null) {
            throw new AppException(
                    "INITIAL_REGISTRATION_NOT_SUBMITTED",
                    "Initial registration has not been submitted for review yet.",
                    HttpStatus.BAD_REQUEST);
        }

        CollegeRegistration submittedRevision = collegeRegistrationRepository.findById(college.getCurrentRegistrationId())
                .orElseThrow(() -> new AppException(
                        "INCONSISTENT_REGISTRATION_STATE",
                        "Current registration pointer is invalid.",
                        HttpStatus.INTERNAL_SERVER_ERROR));

        if (!submittedRevision.getCollegeId().equals(college.getId()) || submittedRevision.getSubmittedForReviewAt() == null) {
            throw new AppException(
                    "INCONSISTENT_REGISTRATION_STATE",
                    "Authoritative submitted revision state is inconsistent.",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Verify status and safety limits
        CollegeApprovalStatus status = submittedRevision.getStatus();
        if (status == CollegeApprovalStatus.ACTION_REQUIRED) {
            if (college.getActionRequiredCount() >= 10) {
                throw new AppException(
                        "MAX_ACTION_REQUIRED_LIMIT_EXCEEDED",
                        "Maximum action required corrections limit (10) exceeded.",
                        HttpStatus.BAD_REQUEST);
            }
        } else if (status == CollegeApprovalStatus.REJECTED) {
            if (college.getResubmissionCount() >= 3) {
                throw new AppException(
                        "MAX_RESUBMISSION_LIMIT_EXCEEDED",
                        "Maximum resubmission limit (3) exceeded.",
                        HttpStatus.BAD_REQUEST);
            }
        } else if (status == CollegeApprovalStatus.PENDING) {
            throw new AppException(
                    "APPLICATION_FROZEN_IN_REVIEW",
                    "Application is currently frozen under review. Cannot start correction draft.",
                    HttpStatus.CONFLICT);
        } else {
            throw new AppException(
                    "INVALID_CORRECTION_STATE",
                    "Cannot create correction draft for application with status: " + status,
                    HttpStatus.BAD_REQUEST);
        }

        CollegeRegistration latestRevision = collegeRegistrationRepository
                .findFirstByCollegeIdOrderByVersionNumberDesc(college.getId())
                .orElseThrow(() -> new AppException(
                        "INCONSISTENT_REGISTRATION_STATE",
                        "No registration records found for college.",
                        HttpStatus.INTERNAL_SERVER_ERROR));

        if (latestRevision.getVersionNumber() > submittedRevision.getVersionNumber() + 1) {
            throw new AppException(
                    "INCONSISTENT_REGISTRATION_STATE",
                    "Registration version sequence is corrupted.",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Idempotent: if an unsubmitted draft already exists, return it
        if (latestRevision.getSubmittedForReviewAt() == null) {
            log.info("Correction draft already open for college {}. Returning existing draft revision v{}",
                    college.getId(), latestRevision.getVersionNumber());
            return toCurrentRevisionResponse(latestRevision, true);
        }

        // Create new revision v+1
        int newVersionNumber = submittedRevision.getVersionNumber() + 1;
        CollegeRegistration newDraft = new CollegeRegistration();
        newDraft.setCollegeId(college.getId());
        newDraft.setVersionNumber(newVersionNumber);
        newDraft.setStatus(CollegeApprovalStatus.PENDING);
        newDraft.setLegalName(submittedRevision.getLegalName());
        newDraft.setAddressLine1(submittedRevision.getAddressLine1());
        newDraft.setAddressLine2(submittedRevision.getAddressLine2());
        newDraft.setCity(submittedRevision.getCity());
        newDraft.setState(submittedRevision.getState());
        newDraft.setCountry(submittedRevision.getCountry());
        newDraft.setPostalCode(submittedRevision.getPostalCode());
        newDraft.setWebsiteUrl(submittedRevision.getWebsiteUrl());
        newDraft.setContactPhone(submittedRevision.getContactPhone());
        newDraft.setAffiliatedUniversityName(submittedRevision.getAffiliatedUniversityName());
        newDraft.setSubmittedForReviewAt(null);
        newDraft = collegeRegistrationRepository.save(newDraft);

        // Carry forward active documents from previous submitted revision
        List<CollegeRegistrationDocument> prevDocs = collegeRegistrationDocumentRepository
                .findByRegistrationId(submittedRevision.getId());
        Set<Long> supersededIds = prevDocs.stream()
                .map(CollegeRegistrationDocument::getReplacesDocumentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<CollegeRegistrationDocument> activePrevDocs = prevDocs.stream()
                .filter(d -> !supersededIds.contains(d.getId()))
                .toList();

        for (CollegeRegistrationDocument prevDoc : activePrevDocs) {
            // Module 3.6B: Only non-rejected documents are carried forward into correction drafts
            if (prevDoc.getVerificationStatus() == DocumentVerificationStatus.REJECTED) {
                log.info("Skipping carry-forward for rejected document [{}] in revision v{}",
                        prevDoc.getId(), submittedRevision.getVersionNumber());
                continue;
            }

            StoredFileMetadata duplicated = documentStorageService.duplicate(
                    prevDoc.getStorageKey(),
                    prevDoc.getOriginalFilename(),
                    prevDoc.getMimeType(),
                    prevDoc.getFileSizeBytes(),
                    prevDoc.getSha256Checksum());

            compensationHandler.registerRollbackCleanup(duplicated.storageKey());

            CollegeRegistrationDocument carriedDoc = new CollegeRegistrationDocument();
            carriedDoc.setCollegeId(college.getId());
            carriedDoc.setRegistrationId(newDraft.getId());
            carriedDoc.setDocumentCategory(prevDoc.getDocumentCategory());
            carriedDoc.setOriginalFilename(prevDoc.getOriginalFilename());
            carriedDoc.setStorageKey(duplicated.storageKey());
            carriedDoc.setMimeType(prevDoc.getMimeType());
            carriedDoc.setFileSizeBytes(prevDoc.getFileSizeBytes());
            carriedDoc.setSha256Checksum(prevDoc.getSha256Checksum());
            carriedDoc.setReplacesDocumentId(null);
            carriedDoc.setVerificationStatus(prevDoc.getVerificationStatus() != null
                    ? prevDoc.getVerificationStatus()
                    : DocumentVerificationStatus.ACCEPTED);
            carriedDoc.setVerificationProvenance(DocumentVerificationProvenance.CARRIED_FORWARD);
            carriedDoc.setLastReviewedByUserId(prevDoc.getLastReviewedByUserId());
            carriedDoc.setLastReviewedAt(prevDoc.getLastReviewedAt());
            carriedDoc.setSourceDocumentId(prevDoc.getId());
            carriedDoc.setSourceRegistrationId(prevDoc.getRegistrationId());
            carriedDoc.setVersion(0L);
            collegeRegistrationDocumentRepository.save(carriedDoc);
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("collegeId", college.getId());
        metadata.put("previousRevisionId", submittedRevision.getId());
        metadata.put("newRevisionId", newDraft.getId());
        metadata.put("newVersionNumber", newVersionNumber);

        auditEventService.record(
                AuditEventType.COLLEGE_REGISTRATION_CORRECTION_DRAFT_CREATED,
                principal.getUserId(),
                Role.COLLEGE_ADMIN,
                principal.getUserId(),
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                metadata);

        log.info("Created correction draft revision v{} for college {}", newVersionNumber, college.getId());
        return toCurrentRevisionResponse(newDraft, true);
    }

    /**
     * Updates draft profile fields under parent College pessimistic lock and syncs college name.
     */
    @Transactional
    public CurrentRevisionResponse updateDraftProfile(UpdateApplicationRequest request) {
        collegeAccessGuard.requireRestrictedOnboardingAccess();
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();

        College college = collegeRepository.findByIdWithLock(principal.getCollegeId())
                .orElseThrow(() -> new AppException("COLLEGE_NOT_FOUND", "College tenant not found.", HttpStatus.NOT_FOUND));

        validateOperationalStateForCorrection(college);

        CollegeRegistration latestRevision = collegeRegistrationRepository
                .findFirstByCollegeIdOrderByVersionNumberDesc(college.getId())
                .orElseThrow(() -> new AppException("INCONSISTENT_REGISTRATION_STATE", "No registration record found.", HttpStatus.INTERNAL_SERVER_ERROR));

        if (latestRevision.getSubmittedForReviewAt() != null) {
            throw new AppException(
                    "APPLICATION_FROZEN_IN_REVIEW",
                    "Application is currently frozen under review. Mutations are prohibited.",
                    HttpStatus.CONFLICT);
        }

        latestRevision.setLegalName(request.legalName().trim());
        latestRevision.setAddressLine1(request.addressLine1().trim());
        latestRevision.setAddressLine2(request.addressLine2() != null ? request.addressLine2().trim() : null);
        latestRevision.setCity(request.city().trim());
        latestRevision.setState(request.state().trim());
        latestRevision.setCountry(request.country().trim());
        latestRevision.setPostalCode(request.postalCode().trim());
        latestRevision.setWebsiteUrl(request.websiteUrl() != null ? request.websiteUrl().trim() : null);
        latestRevision.setContactPhone(request.contactPhone().trim());
        latestRevision.setAffiliatedUniversityName(request.affiliatedUniversityName().trim());

        // Synchronize tenant name with legalName
        if (!college.getName().equals(request.legalName().trim())) {
            college.setName(request.legalName().trim());
            collegeRepository.save(college);
            log.info("Synchronized college tenant name for college {}: {}", college.getId(), college.getName());
        }

        latestRevision = collegeRegistrationRepository.save(latestRevision);
        return toCurrentRevisionResponse(latestRevision, true);
    }

    /**
     * Uploads verification document, validates magic bytes, persists outside webroot,
     * registers rollback compensation, and records audit event under parent College lock.
     */
    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, DocumentCategory documentCategory, Long replacesDocumentId) {
        collegeAccessGuard.requireRestrictedOnboardingAccess();
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();

        if (file == null || file.isEmpty()) {
            throw new AppException("INVALID_DOCUMENT_FORMAT", "Document file cannot be empty.", HttpStatus.BAD_REQUEST);
        }
        if (documentCategory == null) {
            throw new AppException("INVALID_DOCUMENT_FORMAT", "Document category is required.", HttpStatus.BAD_REQUEST);
        }

        College college = collegeRepository.findByIdWithLock(principal.getCollegeId())
                .orElseThrow(() -> new AppException("COLLEGE_NOT_FOUND", "College tenant not found.", HttpStatus.NOT_FOUND));

        validateOperationalStateForCorrection(college);

        CollegeRegistration latestRevision = collegeRegistrationRepository
                .findFirstByCollegeIdOrderByVersionNumberDesc(college.getId())
                .orElseThrow(() -> new AppException("INCONSISTENT_REGISTRATION_STATE", "No registration record found.", HttpStatus.INTERNAL_SERVER_ERROR));

        if (latestRevision.getSubmittedForReviewAt() != null) {
            throw new AppException(
                    "APPLICATION_FROZEN_IN_REVIEW",
                    "Application is currently frozen under review. Document uploads are prohibited.",
                    HttpStatus.CONFLICT);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            log.error("Failed to read uploaded file bytes", e);
            throw new AppException("INTERNAL_ERROR", "Failed to process uploaded file.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        DocumentValidator.ValidatedDocument validated = documentValidator.validate(
                bytes,
                file.getOriginalFilename(),
                file.getContentType());

        List<CollegeRegistrationDocument> draftDocs = collegeRegistrationDocumentRepository
                .findByRegistrationId(latestRevision.getId());

        Set<Long> supersededIds = draftDocs.stream()
                .map(CollegeRegistrationDocument::getReplacesDocumentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<CollegeRegistrationDocument> activeDraftDocs = draftDocs.stream()
                .filter(d -> !supersededIds.contains(d.getId()))
                .toList();

        Long targetReplacementId = null;

        if (replacesDocumentId != null) {
            CollegeRegistrationDocument targetDoc = draftDocs.stream()
                    .filter(d -> d.getId().equals(replacesDocumentId))
                    .findFirst()
                    .orElse(null);

            if (targetDoc == null) {
                // Check if document belongs to immediately preceding submitted revision
                CollegeRegistration prevSubmitted = college.getCurrentRegistrationId() != null
                        ? collegeRegistrationRepository.findById(college.getCurrentRegistrationId()).orElse(null)
                        : null;

                Optional<CollegeRegistrationDocument> existingAnywhere = collegeRegistrationDocumentRepository
                        .findByIdAndCollegeId(replacesDocumentId, college.getId());

                if (existingAnywhere.isPresent()) {
                    CollegeRegistrationDocument candidate = existingAnywhere.get();
                    if (prevSubmitted != null && candidate.getRegistrationId().equals(prevSubmitted.getId())) {
                        if (candidate.getVerificationStatus() != DocumentVerificationStatus.REJECTED) {
                            throw new AppException(
                                    "CANNOT_REPLACE_NON_REJECTED_DOCUMENT",
                                    "Only rejected documents from the previous submitted revision can be replaced.",
                                    HttpStatus.BAD_REQUEST);
                        }
                        targetDoc = candidate;
                    } else {
                        throw new AppException(
                                "CROSS_REVISION_REPLACEMENT_NOT_ALLOWED",
                                "replacesDocumentId must belong to the active draft revision or immediately preceding submitted revision.",
                                HttpStatus.BAD_REQUEST);
                    }
                } else {
                    throw new AppException("DOCUMENT_NOT_FOUND", "Target replacement document not found.", HttpStatus.NOT_FOUND);
                }
            }

            final Long resolvedTargetId = targetDoc.getId();
            // Enforce duplicate replacement protection within current draft
            boolean alreadyReplaced = draftDocs.stream()
                    .anyMatch(d -> Objects.equals(d.getReplacesDocumentId(), resolvedTargetId));
            if (alreadyReplaced) {
                throw new AppException(
                        "REPLACEMENT_ALREADY_EXISTS",
                        "A replacement for document ID " + resolvedTargetId + " already exists in this revision.",
                        HttpStatus.CONFLICT);
            }

            if (supersededIds.contains(targetDoc.getId())) {
                throw new AppException("INVALID_DOCUMENT_FORMAT", "Target document is already superseded.", HttpStatus.BAD_REQUEST);
            }

            if (targetDoc.getDocumentCategory() != documentCategory) {
                throw new AppException(
                        "CATEGORY_MISMATCH_ON_REPLACEMENT",
                        "Replacement document category does not match target document category.",
                        HttpStatus.BAD_REQUEST);
            }

            targetReplacementId = targetDoc.getId();
        } else {
            // Auto-replacement fallback for existing active document of the same category
            Optional<CollegeRegistrationDocument> existingActive = activeDraftDocs.stream()
                    .filter(d -> d.getDocumentCategory() == documentCategory)
                    .findFirst();

            if (existingActive.isPresent()) {
                targetReplacementId = existingActive.get().getId();
            } else {
                if (activeDraftDocs.size() >= documentProperties.getMaxActiveDocsPerRevision()) {
                    throw new AppException(
                            "DOCUMENT_LIMIT_EXCEEDED",
                            "Maximum active documents limit (5) reached for this revision.",
                            HttpStatus.BAD_REQUEST);
                }
            }
        }

        // Store physical file outside webroot
        StoredFileMetadata stored = documentStorageService.store(
                bytes,
                validated.originalFilename(),
                validated.mimeType(),
                validated.sha256Checksum());

        // Register Spring transaction synchronization compensation for rollback cleanup
        compensationHandler.registerRollbackCleanup(stored.storageKey());

        // Persist document metadata row
        CollegeRegistrationDocument doc = new CollegeRegistrationDocument();
        doc.setCollegeId(college.getId());
        doc.setRegistrationId(latestRevision.getId());
        doc.setDocumentCategory(documentCategory);
        doc.setOriginalFilename(stored.originalFilename());
        doc.setStorageKey(stored.storageKey());
        doc.setMimeType(stored.mimeType());
        doc.setFileSizeBytes(stored.fileSizeBytes());
        doc.setSha256Checksum(stored.sha256Checksum());
        doc.setReplacesDocumentId(targetReplacementId);
        doc.setVerificationStatus(DocumentVerificationStatus.PENDING);
        doc.setVerificationProvenance(DocumentVerificationProvenance.NOT_REVIEWED);
        doc.setVersion(0L);
        doc = collegeRegistrationDocumentRepository.save(doc);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("collegeId", college.getId());
        metadata.put("registrationId", latestRevision.getId());
        metadata.put("documentId", doc.getId());
        metadata.put("category", documentCategory.name());
        metadata.put("replacesDocumentId", targetReplacementId != null ? targetReplacementId : "none");

        auditEventService.record(
                AuditEventType.COLLEGE_REGISTRATION_DOC_UPLOADED,
                principal.getUserId(),
                Role.COLLEGE_ADMIN,
                principal.getUserId(),
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                metadata);

        log.info("Uploaded document {} for college {} revision v{}", doc.getId(), college.getId(), latestRevision.getVersionNumber());
        return toDocumentResponse(doc);
    }

    /**
     * Lists only the active (non-superseded) documents for the active revision.
     */
    @Transactional(readOnly = true)
    public List<DocumentResponse> getActiveDraftDocuments() {
        College college = collegeAccessGuard.requireRestrictedOnboardingAccess();

        CollegeRegistration latestRevision = collegeRegistrationRepository
                .findFirstByCollegeIdOrderByVersionNumberDesc(college.getId())
                .orElseThrow(() -> new AppException("INCONSISTENT_REGISTRATION_STATE", "No registration record found.", HttpStatus.INTERNAL_SERVER_ERROR));

        List<CollegeRegistrationDocument> docs = collegeRegistrationDocumentRepository
                .findByRegistrationId(latestRevision.getId());

        return computeActiveDocuments(docs);
    }

    /**
     * Safely streams a verification document ensuring strict tenant ownership.
     */
    @Transactional(readOnly = true)
    public DocumentDownload downloadDocument(Long documentId) {
        College college = collegeAccessGuard.requireRestrictedOnboardingAccess();

        CollegeRegistrationDocument doc = collegeRegistrationDocumentRepository.findById(documentId)
                .orElseThrow(() -> new AppException("DOCUMENT_NOT_FOUND", "Document not found.", HttpStatus.NOT_FOUND));

        if (!doc.getCollegeId().equals(college.getId())) {
            throw new AppException("ACCESS_DENIED", "Access denied to document belonging to another college.", HttpStatus.FORBIDDEN);
        }

        Resource resource = documentStorageService.loadAsResource(doc.getStorageKey());
        return new DocumentDownload(resource, doc.getOriginalFilename(), doc.getMimeType(), doc.getFileSizeBytes());
    }

    /**
     * Deletes a document row from the active draft under parent College lock,
     * deterministically restoring any superseded predecessor to the active set.
     */
    @Transactional
    public void deleteDocument(Long documentId) {
        collegeAccessGuard.requireRestrictedOnboardingAccess();
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();

        College college = collegeRepository.findByIdWithLock(principal.getCollegeId())
                .orElseThrow(() -> new AppException("COLLEGE_NOT_FOUND", "College tenant not found.", HttpStatus.NOT_FOUND));

        validateOperationalStateForCorrection(college);

        CollegeRegistration latestRevision = collegeRegistrationRepository
                .findFirstByCollegeIdOrderByVersionNumberDesc(college.getId())
                .orElseThrow(() -> new AppException("INCONSISTENT_REGISTRATION_STATE", "No registration record found.", HttpStatus.INTERNAL_SERVER_ERROR));

        if (latestRevision.getSubmittedForReviewAt() != null) {
            throw new AppException(
                    "APPLICATION_FROZEN_IN_REVIEW",
                    "Application is currently frozen under review. Document deletion is prohibited.",
                    HttpStatus.CONFLICT);
        }

        CollegeRegistrationDocument doc = collegeRegistrationDocumentRepository.findById(documentId)
                .orElseThrow(() -> new AppException("DOCUMENT_NOT_FOUND", "Document not found.", HttpStatus.NOT_FOUND));

        if (!doc.getCollegeId().equals(college.getId())) {
            throw new AppException("ACCESS_DENIED", "Access denied to document belonging to another college.", HttpStatus.FORBIDDEN);
        }

        if (!doc.getRegistrationId().equals(latestRevision.getId())) {
            throw new AppException("BAD_REQUEST", "Cannot delete documents from historical revisions.", HttpStatus.BAD_REQUEST);
        }

        // Verify document is currently active (not superseded by another document in this draft)
        List<CollegeRegistrationDocument> draftDocs = collegeRegistrationDocumentRepository
                .findByRegistrationId(latestRevision.getId());
        boolean isSuperseded = draftDocs.stream()
                .anyMatch(d -> doc.getId().equals(d.getReplacesDocumentId()));

        if (isSuperseded) {
            throw new AppException(
                    "BAD_REQUEST",
                    "Cannot delete a superseded document. You must delete the active replacement document first.",
                    HttpStatus.BAD_REQUEST);
        }

        // Delete database row. Physical storage file is retained as an immutable object.
        collegeRegistrationDocumentRepository.delete(doc);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("collegeId", college.getId());
        metadata.put("registrationId", latestRevision.getId());
        metadata.put("documentId", doc.getId());
        metadata.put("category", doc.getDocumentCategory().name());

        auditEventService.record(
                AuditEventType.COLLEGE_REGISTRATION_DOC_REMOVED,
                principal.getUserId(),
                Role.COLLEGE_ADMIN,
                principal.getUserId(),
                college.getId(),
                AuditOutcome.SUCCESS,
                null,
                metadata);

        log.info("Deleted document {} from draft revision v{} for college {}", doc.getId(), latestRevision.getVersionNumber(), college.getId());
    }

    /**
     * Submits or resubmits the application for Super Admin review under parent College lock.
     * Freezes revision, enforces counter limits, and updates colleges.current_registration_id atomically.
     */
    @Transactional
    public SubmitApplicationResponse submitApplicationForReview() {
        collegeAccessGuard.requireRestrictedOnboardingAccess();
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();

        College college = collegeRepository.findByIdWithLock(principal.getCollegeId())
                .orElseThrow(() -> new AppException("COLLEGE_NOT_FOUND", "College tenant not found.", HttpStatus.NOT_FOUND));

        validateOperationalStateForCorrection(college);

        CollegeRegistration draftRevision = collegeRegistrationRepository
                .findFirstByCollegeIdOrderByVersionNumberDesc(college.getId())
                .orElseThrow(() -> new AppException("INCONSISTENT_REGISTRATION_STATE", "No registration record found.", HttpStatus.INTERNAL_SERVER_ERROR));

        if (draftRevision.getSubmittedForReviewAt() != null) {
            throw new AppException(
                    "ALREADY_SUBMITTED_FOR_REVIEW",
                    "Application revision has already been submitted for review.",
                    HttpStatus.CONFLICT);
        }

        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new AppException("USER_NOT_FOUND", "Authenticated user not found.", HttpStatus.NOT_FOUND));

        if (user.getEmailVerifiedAt() == null) {
            throw new AppException(
                    "EMAIL_NOT_VERIFIED",
                    "Email must be verified before submitting registration application for review.",
                    HttpStatus.BAD_REQUEST);
        }

        List<CollegeRegistrationDocument> draftDocs = collegeRegistrationDocumentRepository
                .findByRegistrationId(draftRevision.getId());
        List<DocumentResponse> activeDocs = computeActiveDocuments(draftDocs);
        Set<DocumentCategory> activeCategories = activeDocs.stream()
                .map(DocumentResponse::documentCategory)
                .collect(Collectors.toSet());

        if (!activeCategories.contains(DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE)
                || !activeCategories.contains(DocumentCategory.AUTHORIZED_SIGNATORY_ID)) {
            throw new AppException(
                    "REQUIRED_DOCUMENTS_MISSING",
                    "Required verification documents missing: University Affiliation Certificate and Authorized Signatory ID are mandatory.",
                    HttpStatus.BAD_REQUEST);
        }

        Instant now = Instant.now();
        draftRevision.setSubmittedForReviewAt(now);
        draftRevision.setStatus(CollegeApprovalStatus.PENDING);
        draftRevision = collegeRegistrationRepository.save(draftRevision);

        boolean isInitialSubmission = college.getCurrentRegistrationId() == null;

        if (isInitialSubmission) {
            college.setCurrentRegistrationId(draftRevision.getId());
            college.setApprovalStatus(CollegeApprovalStatus.PENDING);
            collegeRepository.save(college);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("collegeId", college.getId());
            metadata.put("registrationId", draftRevision.getId());
            metadata.put("versionNumber", draftRevision.getVersionNumber());

            auditEventService.record(
                    AuditEventType.COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW,
                    principal.getUserId(),
                    Role.COLLEGE_ADMIN,
                    principal.getUserId(),
                    college.getId(),
                    AuditOutcome.SUCCESS,
                    null,
                    metadata);

            log.info("College {} successfully submitted initial registration revision v1 for review.", college.getId());
            return new SubmitApplicationResponse(
                    draftRevision.getId(),
                    draftRevision.getVersionNumber(),
                    draftRevision.getStatus(),
                    now,
                    "Application submitted for review successfully.");
        } else {
            CollegeRegistration prevSubmitted = collegeRegistrationRepository.findById(college.getCurrentRegistrationId())
                    .orElseThrow(() -> new AppException("INCONSISTENT_REGISTRATION_STATE", "Invalid current registration pointer.", HttpStatus.INTERNAL_SERVER_ERROR));

            if (prevSubmitted.getStatus() == CollegeApprovalStatus.ACTION_REQUIRED) {
                if (college.getActionRequiredCount() >= 10) {
                    throw new AppException(
                            "MAX_ACTION_REQUIRED_LIMIT_EXCEEDED",
                            "Maximum action required limit (10) exceeded.",
                            HttpStatus.BAD_REQUEST);
                }
                college.setActionRequiredCount(college.getActionRequiredCount() + 1);
            } else if (prevSubmitted.getStatus() == CollegeApprovalStatus.REJECTED) {
                if (college.getResubmissionCount() >= 3) {
                    throw new AppException(
                            "MAX_RESUBMISSION_LIMIT_EXCEEDED",
                            "Maximum resubmission limit (3) exceeded.",
                            HttpStatus.BAD_REQUEST);
                }
                college.setResubmissionCount(college.getResubmissionCount() + 1);
            }

            college.setCurrentRegistrationId(draftRevision.getId());
            college.setApprovalStatus(CollegeApprovalStatus.PENDING);
            collegeRepository.save(college);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("collegeId", college.getId());
            metadata.put("registrationId", draftRevision.getId());
            metadata.put("versionNumber", draftRevision.getVersionNumber());
            metadata.put("resubmissionCount", college.getResubmissionCount());
            metadata.put("actionRequiredCount", college.getActionRequiredCount());

            auditEventService.record(
                    AuditEventType.COLLEGE_REGISTRATION_RESUBMITTED,
                    principal.getUserId(),
                    Role.COLLEGE_ADMIN,
                    principal.getUserId(),
                    college.getId(),
                    AuditOutcome.SUCCESS,
                    null,
                    metadata);

            log.info("College {} successfully resubmitted correction draft revision v{} for review.",
                    college.getId(), draftRevision.getVersionNumber());
            return new SubmitApplicationResponse(
                    draftRevision.getId(),
                    draftRevision.getVersionNumber(),
                    draftRevision.getStatus(),
                    now,
                    "Application resubmitted for review successfully.");
        }
    }

    private void validateOperationalStateForCorrection(College college) {
        if (college.getApprovalStatus() == CollegeApprovalStatus.APPROVED) {
            throw new AppException(
                    "COLLEGE_ALREADY_APPROVED",
                    "This college is already approved. Onboarding modifications are closed.",
                    HttpStatus.FORBIDDEN);
        }
        if (college.isPermanentlyRejected()) {
            throw new AppException(
                    "REGISTRATION_PERMANENTLY_REJECTED",
                    "This college registration has been permanently rejected.",
                    HttpStatus.FORBIDDEN);
        }
    }

    private ReviewFeedbackResponse resolveReviewFeedback(College college) {
        if (college.getCurrentRegistrationId() == null) {
            return null;
        }

        return collegeRegistrationRepository.findById(college.getCurrentRegistrationId())
                .filter(r -> r.getReviewedAt() != null || r.getReviewNotes() != null || r.getRejectionReason() != null || r.getStatus() != CollegeApprovalStatus.PENDING)
                .map(r -> new ReviewFeedbackResponse(
                        r.getReviewNotes(),
                        r.getRejectionReason(),
                        r.isPermanentRejection(),
                        r.getReviewedAt()))
                .orElse(null);
    }

    private List<DocumentResponse> computeActiveDocuments(List<CollegeRegistrationDocument> docs) {
        Set<Long> supersededIds = docs.stream()
                .map(CollegeRegistrationDocument::getReplacesDocumentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return docs.stream()
                .filter(d -> !supersededIds.contains(d.getId()))
                .map(this::toDocumentResponse)
                .toList();
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
                doc.getVerificationStatus() != null ? doc.getVerificationStatus() : DocumentVerificationStatus.PENDING,
                doc.getVerificationProvenance() != null ? doc.getVerificationProvenance() : DocumentVerificationProvenance.NOT_REVIEWED,
                doc.getRejectionReason(),
                doc.getLastReviewedAt(),
                doc.getLastReviewedByUserId(),
                doc.getVersion() != null ? doc.getVersion() : 0L
        );
    }

    private CurrentRevisionResponse toCurrentRevisionResponse(CollegeRegistration revision, boolean isDraft) {
        CollegeProfileResponse profile = new CollegeProfileResponse(
                revision.getLegalName(),
                revision.getAddressLine1(),
                revision.getAddressLine2(),
                revision.getCity(),
                revision.getState(),
                revision.getCountry(),
                revision.getPostalCode(),
                revision.getWebsiteUrl(),
                revision.getContactPhone(),
                revision.getAffiliatedUniversityName());

        return new CurrentRevisionResponse(
                revision.getId(),
                revision.getVersionNumber(),
                revision.getStatus(),
                revision.getSubmittedForReviewAt(),
                isDraft,
                profile);
    }
}
