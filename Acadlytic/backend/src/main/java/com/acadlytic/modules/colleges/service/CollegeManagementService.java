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
import com.acadlytic.modules.colleges.dto.ActiveAdminSummary;
import com.acadlytic.modules.colleges.dto.SuperAdminCollegeDetailResponse;
import com.acadlytic.modules.colleges.dto.SuperAdminCollegeSummaryResponse;
import com.acadlytic.modules.colleges.dto.UpdateCollegeProfileRequest;
import com.acadlytic.modules.colleges.dto.UpdateCollegeStatusRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.repository.CollegeSpecifications;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.security.ClientIpResolver;
import com.acadlytic.security.CollegeAccessGuard;
import com.acadlytic.security.SecurityContextService;
import com.acadlytic.security.SessionRevocationService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service managing platform-level Super Admin college operations (Phase 04, Module 4.2).
 * Handles directory listing, profile details, status state transitions, and full profile updates.
 */
@Service
public class CollegeManagementService {

    private static final Logger log = LoggerFactory.getLogger(CollegeManagementService.class);

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "name", "code", "status", "approvalStatus", "city", "state",
            "affiliatedUniversityName", "createdAt", "updatedAt"
    );

    private final CollegeRepository collegeRepository;
    private final CollegeRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final AuditEventService auditEventService;
    private final OutboxEmailService outboxEmailService;
    private final SessionRevocationService sessionRevocationService;
    private final SecurityContextService securityContextService;
    private final CollegeAccessGuard collegeAccessGuard;
    private final ClientIpResolver clientIpResolver;

    public CollegeManagementService(
            CollegeRepository collegeRepository,
            CollegeRegistrationRepository registrationRepository,
            UserRepository userRepository,
            AuditEventService auditEventService,
            OutboxEmailService outboxEmailService,
            SessionRevocationService sessionRevocationService,
            SecurityContextService securityContextService,
            CollegeAccessGuard collegeAccessGuard,
            ClientIpResolver clientIpResolver) {
        this.collegeRepository = collegeRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.auditEventService = auditEventService;
        this.outboxEmailService = outboxEmailService;
        this.sessionRevocationService = sessionRevocationService;
        this.securityContextService = securityContextService;
        this.collegeAccessGuard = collegeAccessGuard;
        this.clientIpResolver = clientIpResolver;
    }

    @Transactional(readOnly = true)
    public PageResponse<SuperAdminCollegeSummaryResponse> getColleges(
            String search,
            CollegeStatus status,
            CollegeApprovalStatus approvalStatus,
            String affiliatedUniversity,
            String city,
            String state,
            int page,
            int size,
            String sortBy,
            String sortDirection) {
        collegeAccessGuard.requireSuperAdmin();

        if (page < 0) {
            throw new AppException(
                    "VALIDATION_ERROR",
                    "Page index must be greater than or equal to 0",
                    HttpStatus.BAD_REQUEST);
        }
        if (size < 1 || size > 100) {
            throw new AppException(
                    "VALIDATION_ERROR",
                    "Page size must be between 1 and 100",
                    HttpStatus.BAD_REQUEST);
        }

        String effectiveSortBy = (sortBy == null || sortBy.isBlank()) ? "createdAt" : sortBy.trim();
        if (!ALLOWED_SORT_FIELDS.contains(effectiveSortBy)) {
            throw new AppException(
                    "INVALID_SORT_PROPERTY",
                    "Sort property '" + effectiveSortBy + "' is not supported. Allowed fields: " + ALLOWED_SORT_FIELDS,
                    HttpStatus.BAD_REQUEST);
        }

        Sort.Direction direction = (sortDirection != null && sortDirection.equalsIgnoreCase("DESC"))
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Sort.Order primaryOrder = new Sort.Order(direction, effectiveSortBy);
        Sort sort = Sort.by(primaryOrder, Sort.Order.asc("id"));

        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<College> spec = CollegeSpecifications.withFilters(
                search, status, approvalStatus, affiliatedUniversity, city, state);

        Page<College> collegePage = collegeRepository.findAll(spec, pageable);
        List<College> content = collegePage.getContent();

        List<Long> collegeIds = content.stream().map(College::getId).toList();
        Map<Long, User> adminMap = Collections.emptyMap();
        if (!collegeIds.isEmpty()) {
            List<User> activeAdmins = userRepository.findByCollegeIdInAndRoleAndStatus(
                    collegeIds, Role.COLLEGE_ADMIN, UserStatus.ACTIVE);
            adminMap = activeAdmins.stream()
                    .collect(Collectors.toMap(User::getCollegeId, u -> u, (u1, u2) -> u1));
        }

        Map<Long, User> finalAdminMap = adminMap;
        List<SuperAdminCollegeSummaryResponse> dtoList = content.stream()
                .map(college -> {
                    User admin = finalAdminMap.get(college.getId());
                    Long adminUserId = admin != null ? admin.getId() : null;
                    String adminName = admin != null
                            ? (admin.getFirstName() + (admin.getLastName() != null && !admin.getLastName().isBlank() ? " " + admin.getLastName() : ""))
                            : null;
                    String adminEmail = admin != null ? admin.getEmail() : null;

                    return new SuperAdminCollegeSummaryResponse(
                            college.getId(),
                            college.getName(),
                            college.getCode(),
                            college.getApprovalStatus(),
                            college.getStatus(),
                            college.getCity(),
                            college.getState(),
                            college.getAffiliatedUniversityName(),
                            adminUserId,
                            adminName,
                            adminEmail,
                            college.getCreatedAt(),
                            college.getUpdatedAt()
                    );
                })
                .toList();

        return PageResponse.of(dtoList, collegePage);
    }

    @Transactional(readOnly = true)
    public SuperAdminCollegeDetailResponse getCollegeById(Long id) {
        collegeAccessGuard.requireSuperAdmin();

        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new AppException(
                        "COLLEGE_NOT_FOUND",
                        "College tenant not found",
                        HttpStatus.NOT_FOUND));

        return buildDetailResponse(college);
    }

    @Transactional
    public SuperAdminCollegeDetailResponse updateCollegeStatus(
            Long id,
            UpdateCollegeStatusRequest request,
            HttpServletRequest httpRequest) {
        collegeAccessGuard.requireSuperAdmin();

        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new AppException(
                        "COLLEGE_NOT_FOUND",
                        "College tenant not found",
                        HttpStatus.NOT_FOUND));

        if (college.isPermanentlyRejected()) {
            throw new AppException(
                    "REGISTRATION_PERMANENTLY_REJECTED",
                    "Cannot modify status of a permanently rejected college.",
                    HttpStatus.CONFLICT);
        }

        if (college.getArchivedAt() != null) {
            throw new AppException(
                    "COLLEGE_ARCHIVED",
                    "Cannot modify status of an archived college.",
                    HttpStatus.CONFLICT);
        }

        if (college.getApprovalStatus() != CollegeApprovalStatus.APPROVED) {
            throw new AppException(
                    "COLLEGE_NOT_APPROVED",
                    "College operational status can only be managed for approved colleges.",
                    HttpStatus.CONFLICT);
        }

        if (college.getStatus() == CollegeStatus.PENDING_VERIFICATION) {
            throw new AppException(
                    "INVALID_STATUS_TRANSITION",
                    "Colleges in PENDING_VERIFICATION cannot be modified via status management. They must be processed through the onboarding approval workflow.",
                    HttpStatus.BAD_REQUEST);
        }

        if (request.targetStatus() == CollegeStatus.PENDING_VERIFICATION) {
            throw new AppException(
                    "INVALID_STATUS_TRANSITION",
                    "Cannot transition college back to PENDING_VERIFICATION.",
                    HttpStatus.BAD_REQUEST);
        }

        if (request.targetStatus() == college.getStatus()) {
            throw new AppException(
                    "SAME_STATUS_NOOP",
                    "College is already in status " + request.targetStatus(),
                    HttpStatus.BAD_REQUEST);
        }

        if (request.expectedVersion() == null || !request.expectedVersion().equals(college.getVersion())) {
            throw new AppException(
                    "STALE_COLLEGE_VERSION",
                    "The college record has been modified by another administrator (version mismatch). Please reload and retry.",
                    HttpStatus.CONFLICT);
        }

        if (request.reason() == null || request.reason().trim().isEmpty()) {
            throw new AppException(
                    "VALIDATION_ERROR",
                    "Reason is required for status transition.",
                    HttpStatus.BAD_REQUEST);
        }

        CollegeStatus previousStatus = college.getStatus();
        CollegeStatus targetStatus = request.targetStatus();

        boolean allowedTransition = switch (previousStatus) {
            case ACTIVE -> targetStatus == CollegeStatus.SUSPENDED || targetStatus == CollegeStatus.INACTIVE;
            case SUSPENDED -> targetStatus == CollegeStatus.ACTIVE || targetStatus == CollegeStatus.INACTIVE;
            case INACTIVE -> targetStatus == CollegeStatus.ACTIVE;
            case PENDING_VERIFICATION -> false;
        };

        if (!allowedTransition) {
            throw new AppException(
                    "INVALID_STATUS_TRANSITION",
                    "Status transition from " + previousStatus + " to " + targetStatus + " is not permitted.",
                    HttpStatus.BAD_REQUEST);
        }

        college.setStatus(targetStatus);
        College saved = collegeRepository.saveAndFlush(college);

        AuditEventType auditType;
        if (targetStatus == CollegeStatus.ACTIVE) {
            auditType = AuditEventType.COLLEGE_REACTIVATED;
        } else if (targetStatus == CollegeStatus.SUSPENDED) {
            auditType = AuditEventType.COLLEGE_SUSPENDED;
        } else if (targetStatus == CollegeStatus.INACTIVE) {
            auditType = AuditEventType.COLLEGE_DEACTIVATED;
        } else {
            auditType = AuditEventType.COLLEGE_REACTIVATED;
        }

        String clientIp = clientIpResolver.resolve(httpRequest);
        Long actorId = securityContextService.requireCurrentUserId();

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("collegeId", college.getId());
        metadata.put("collegeCode", college.getCode());
        metadata.put("previousStatus", previousStatus.name());
        metadata.put("newStatus", targetStatus.name());
        metadata.put("reason", request.reason().trim());

        auditEventService.record(
                auditType,
                actorId,
                Role.SUPER_ADMIN,
                null,
                college.getId(),
                AuditOutcome.SUCCESS,
                clientIp,
                metadata);

        if (targetStatus == CollegeStatus.SUSPENDED || targetStatus == CollegeStatus.INACTIVE) {
            int revokedSessions = sessionRevocationService.revokeAllSessionsForCollege(college.getId());
            log.info("Revoked {} sessions for college id={} upon transition to {}",
                    revokedSessions, college.getId(), targetStatus);
        }

        Optional<User> activeAdminOpt = userRepository.findByCollegeIdAndRoleAndStatus(
                college.getId(), Role.COLLEGE_ADMIN, UserStatus.ACTIVE);

        if (activeAdminOpt.isPresent()) {
            User admin = activeAdminOpt.get();
            String adminEmail = admin.getEmail();
            if (adminEmail != null && !adminEmail.isBlank()) {
                String templateKey = switch (targetStatus) {
                    case SUSPENDED -> "COLLEGE_SUSPENDED";
                    case INACTIVE -> "COLLEGE_DEACTIVATED";
                    case ACTIVE -> "COLLEGE_ACTIVATED";
                    default -> throw new IllegalStateException("Unexpected target status: " + targetStatus);
                };
                String subject = switch (targetStatus) {
                    case SUSPENDED -> "Notice: College Operational Status Suspended";
                    case INACTIVE -> "Notice: College Account Deactivated";
                    case ACTIVE -> "Notice: College Account Reactivated";
                    default -> "Notice: College Status Updated";
                };
                Map<String, Object> payload = Map.of(
                        "firstName", admin.getFirstName() != null ? admin.getFirstName() : "Administrator",
                        "legalName", college.getName(),
                        "collegeCode", college.getCode(),
                        "reason", request.reason().trim()
                );
                outboxEmailService.enqueue(
                        "COLLEGE_STATUS_CHANGED",
                        adminEmail.trim(),
                        subject,
                        templateKey,
                        payload);
            } else {
                log.warn("Skipping status notification for college id={} because active admin email is blank", college.getId());
            }
        } else {
            log.warn("Skipping status notification for college id={} because no active COLLEGE_ADMIN user exists", college.getId());
        }

        return buildDetailResponse(saved);
    }

    @Transactional
    public SuperAdminCollegeDetailResponse updateCollegeProfile(
            Long id,
            UpdateCollegeProfileRequest request,
            HttpServletRequest httpRequest) {
        collegeAccessGuard.requireSuperAdmin();

        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new AppException(
                        "COLLEGE_NOT_FOUND",
                        "College tenant not found",
                        HttpStatus.NOT_FOUND));

        if (college.isPermanentlyRejected()) {
            throw new AppException(
                    "COLLEGE_PERMANENTLY_REJECTED",
                    "Cannot modify profile of a permanently rejected college.",
                    HttpStatus.BAD_REQUEST);
        }

        if (college.getArchivedAt() != null) {
            throw new AppException(
                    "COLLEGE_ARCHIVED",
                    "Cannot modify profile of an archived college.",
                    HttpStatus.BAD_REQUEST);
        }

        if (request.code() != null && !request.code().trim().isEmpty()
                && !request.code().trim().equalsIgnoreCase(college.getCode().trim())) {
            throw new AppException(
                    "FIELD_IMMUTABLE",
                    "College code is a permanent institutional identifier and cannot be modified.",
                    HttpStatus.BAD_REQUEST);
        }

        if (request.version() == null || !request.version().equals(college.getVersion())) {
            throw new AppException(
                    "STALE_COLLEGE_VERSION",
                    "The college record has been modified by another administrator (version mismatch). Please reload and retry.",
                    HttpStatus.CONFLICT);
        }

        Map<String, Map<String, Object>> diff = new LinkedHashMap<>();

        checkAndRecordDiff(diff, "name", college.getName(), request.name());
        checkAndRecordDiff(diff, "addressLine1", college.getAddressLine1(), request.addressLine1());
        checkAndRecordDiff(diff, "addressLine2", college.getAddressLine2(), request.addressLine2());
        checkAndRecordDiff(diff, "city", college.getCity(), request.city());
        checkAndRecordDiff(diff, "state", college.getState(), request.state());
        checkAndRecordDiff(diff, "country", college.getCountry(), request.country());
        checkAndRecordDiff(diff, "postalCode", college.getPostalCode(), request.postalCode());
        checkAndRecordDiff(diff, "contactPhone", college.getContactPhone(), request.contactPhone());
        checkAndRecordDiff(diff, "contactEmail", college.getContactEmail(), request.contactEmail());
        checkAndRecordDiff(diff, "websiteUrl", college.getWebsiteUrl(), request.websiteUrl());
        checkAndRecordDiff(diff, "affiliatedUniversityName", college.getAffiliatedUniversityName(), request.affiliatedUniversityName());
        checkAndRecordDiff(diff, "establishedYear", college.getEstablishedYear(), request.establishedYear());
        checkAndRecordDiff(diff, "accreditationDetails", college.getAccreditationDetails(), request.accreditationDetails());

        if (diff.isEmpty()) {
            log.info("Profile update for college id={} resulted in no changes; skipping database mutation and audit event.", college.getId());
            return buildDetailResponse(college);
        }

        String prevName = college.getName();
        String newName = request.name();

        college.setName(request.name());
        college.setAddressLine1(request.addressLine1());
        college.setAddressLine2(request.addressLine2());
        college.setCity(request.city());
        college.setState(request.state());
        college.setCountry(request.country());
        college.setPostalCode(request.postalCode());
        college.setContactPhone(request.contactPhone());
        college.setContactEmail(request.contactEmail());
        college.setWebsiteUrl(request.websiteUrl());
        college.setAffiliatedUniversityName(request.affiliatedUniversityName());
        college.setEstablishedYear(request.establishedYear());
        college.setAccreditationDetails(request.accreditationDetails());

        College saved = collegeRepository.saveAndFlush(college);

        String clientIp = clientIpResolver.resolve(httpRequest);
        Long actorId = securityContextService.requireCurrentUserId();

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("collegeId", college.getId());
        metadata.put("collegeCode", college.getCode());
        metadata.put("changedFields", new ArrayList<>(diff.keySet()));
        metadata.put("diff", diff);
        if (!Objects.equals(prevName, newName)) {
            metadata.put("previousName", prevName);
            metadata.put("newName", newName);
        }

        auditEventService.record(
                AuditEventType.COLLEGE_PROFILE_UPDATED,
                actorId,
                Role.SUPER_ADMIN,
                null,
                college.getId(),
                AuditOutcome.SUCCESS,
                clientIp,
                metadata);

        return buildDetailResponse(saved);
    }

    private void checkAndRecordDiff(
            Map<String, Map<String, Object>> diff,
            String fieldName,
            Object previousValue,
            Object newValue) {
        if (!Objects.equals(previousValue, newValue)) {
            Map<String, Object> fieldDiff = new HashMap<>();
            fieldDiff.put("previous", previousValue);
            fieldDiff.put("new", newValue);
            diff.put(fieldName, fieldDiff);
        }
    }

    private SuperAdminCollegeDetailResponse buildDetailResponse(College college) {
        Long regId = college.getCurrentRegistrationId();
        Integer regVersion = null;
        CollegeApprovalStatus regStatus = null;
        Instant regSubmittedAt = null;

        if (regId != null) {
            Optional<CollegeRegistration> regOpt = registrationRepository.findById(regId);
            if (regOpt.isPresent()) {
                CollegeRegistration reg = regOpt.get();
                if (reg.getCollegeId().equals(college.getId())) {
                    regVersion = reg.getVersionNumber();
                    regStatus = reg.getStatus();
                    regSubmittedAt = reg.getSubmittedForReviewAt();
                } else {
                    log.warn("Registration ownership mismatch for college id={}: currentRegistrationId={} belongs to collegeId={}",
                            college.getId(), regId, reg.getCollegeId());
                }
            } else {
                log.warn("Registration record not found for college id={}: currentRegistrationId={}",
                        college.getId(), regId);
            }
        }

        Optional<User> adminOpt = userRepository.findByCollegeIdAndRoleAndStatus(
                college.getId(), Role.COLLEGE_ADMIN, UserStatus.ACTIVE);

        ActiveAdminSummary adminSummary = adminOpt.map(u -> new ActiveAdminSummary(
                u.getId(),
                u.getId(),
                u.getFirstName(),
                u.getLastName(),
                u.getFullName(),
                u.getEmail(),
                u.getStatus(),
                u.getEmailVerifiedAt() != null
        )).orElse(null);

        boolean hasLogo = college.getLogoStorageKey() != null && !college.getLogoStorageKey().isBlank();

        return new SuperAdminCollegeDetailResponse(
                college.getId(),
                college.getName(),
                college.getCode(),
                college.getApprovalStatus(),
                college.getStatus(),
                college.isPermanentlyRejected(),
                college.getArchivedAt(),
                college.getVersion(),
                college.getCreatedAt(),
                college.getUpdatedAt(),
                college.getAddressLine1(),
                college.getAddressLine2(),
                college.getCity(),
                college.getState(),
                college.getCountry(),
                college.getPostalCode(),
                college.getContactPhone(),
                college.getContactEmail(),
                college.getWebsiteUrl(),
                college.getAffiliatedUniversityName(),
                college.getEstablishedYear(),
                college.getAccreditationDetails(),
                hasLogo,
                regId,
                regVersion,
                regStatus,
                regSubmittedAt,
                adminSummary
        );
    }
}
