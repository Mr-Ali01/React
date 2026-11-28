package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.dto.CollegeAdminProfileResponse;
import com.acadlytic.modules.colleges.dto.FieldPresence;
import com.acadlytic.modules.colleges.dto.UpdateOwnCollegeProfileRequest;
import com.acadlytic.modules.colleges.dto.WebsiteUrlValidator;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.security.ClientIpResolver;
import com.acadlytic.security.CollegeAccessGuard;
import com.acadlytic.security.SecurityContextService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class CollegeProfileService {

    private static final Logger log = LoggerFactory.getLogger(CollegeProfileService.class);

    private static final Set<String> ALLOWED_DIFF_FIELDS = Set.of(
            "addressLine1",
            "addressLine2",
            "city",
            "state",
            "country",
            "postalCode",
            "contactPhone",
            "contactEmail",
            "websiteUrl",
            "establishedYear"
    );

    private final CollegeRepository collegeRepository;
    private final CollegeAccessGuard collegeAccessGuard;
    private final SecurityContextService securityContextService;
    private final AuditEventService auditEventService;
    private final ClientIpResolver clientIpResolver;

    public CollegeProfileService(
            CollegeRepository collegeRepository,
            CollegeAccessGuard collegeAccessGuard,
            SecurityContextService securityContextService,
            AuditEventService auditEventService,
            ClientIpResolver clientIpResolver) {
        this.collegeRepository = collegeRepository;
        this.collegeAccessGuard = collegeAccessGuard;
        this.securityContextService = securityContextService;
        this.auditEventService = auditEventService;
        this.clientIpResolver = clientIpResolver;
    }

    @Transactional(readOnly = true)
    public CollegeAdminProfileResponse getOwnCollegeProfile() {
        College college = collegeAccessGuard.requireApprovedAndActiveCurrentCollege();
        return buildProfileResponse(college);
    }

    @Transactional(rollbackFor = Exception.class)
    public CollegeAdminProfileResponse updateOwnCollegeProfile(
            UpdateOwnCollegeProfileRequest request,
            HttpServletRequest httpRequest) {

        College college = collegeAccessGuard.requireApprovedAndActiveCurrentCollege();

        // 1. Validate read-only fields
        validateReadOnlyField(
                "name",
                college.getName(),
                request.name(),
                "College legal name cannot be modified self-service. Please contact Super Admin support."
        );
        validateReadOnlyField(
                "code",
                college.getCode(),
                request.code(),
                "College code is a permanent institutional identifier and cannot be modified."
        );
        validateReadOnlyField(
                "affiliatedUniversityName",
                college.getAffiliatedUniversityName(),
                request.affiliatedUniversityName(),
                "Affiliated university cannot be modified self-service. Please contact Super Admin support."
        );
        validateReadOnlyField(
                "accreditationDetails",
                college.getAccreditationDetails(),
                request.accreditationDetails(),
                "Accreditation details cannot be modified self-service. Official verification is required."
        );

        // 2. Defense-in-depth URL and established-year validation
        if (request.websiteUrl() != null && !WebsiteUrlValidator.isValid(request.websiteUrl())) {
            throw new AppException("VALIDATION_ERROR", "Website URL must be a valid HTTP or HTTPS URL", HttpStatus.BAD_REQUEST);
        }
        if (request.establishedYear() != null && (request.establishedYear() < 1800 || request.establishedYear() > 2100)) {
            throw new AppException("VALIDATION_ERROR", "Established year must be at least 1800 and at most 2100", HttpStatus.BAD_REQUEST);
        }

        // 3. Concurrency check (optimistic locking)
        if (request.version() == null || !request.version().equals(college.getVersion())) {
            throw new AppException(
                    "STALE_COLLEGE_VERSION",
                    "The college record has been modified by another administrator (version mismatch). Please reload and retry.",
                    HttpStatus.CONFLICT
            );
        }

        // 4. Calculate diff across strictly the 10 permitted editable fields
        Map<String, Map<String, Object>> diff = new LinkedHashMap<>();
        checkAndRecordDiff(diff, "addressLine1", college.getAddressLine1(), request.addressLine1());
        checkAndRecordDiff(diff, "addressLine2", college.getAddressLine2(), request.addressLine2());
        checkAndRecordDiff(diff, "city", college.getCity(), request.city());
        checkAndRecordDiff(diff, "state", college.getState(), request.state());
        checkAndRecordDiff(diff, "country", college.getCountry(), request.country());
        checkAndRecordDiff(diff, "postalCode", college.getPostalCode(), request.postalCode());
        checkAndRecordDiff(diff, "contactPhone", college.getContactPhone(), request.contactPhone());
        checkAndRecordDiff(diff, "contactEmail", college.getContactEmail(), request.contactEmail());
        checkAndRecordDiff(diff, "websiteUrl", college.getWebsiteUrl(), request.websiteUrl());
        checkAndRecordDiff(diff, "establishedYear", college.getEstablishedYear(), request.establishedYear());

        // 5. No-op update handling
        if (diff.isEmpty()) {
            log.info("Self-service profile update for college id={} resulted in no changes; skipping database mutation and audit event.", college.getId());
            return buildProfileResponse(college);
        }

        // 6. Apply full-replacement mutations to editable fields
        college.setAddressLine1(request.addressLine1());
        college.setAddressLine2(request.addressLine2());
        college.setCity(request.city());
        college.setState(request.state());
        college.setCountry(request.country());
        college.setPostalCode(request.postalCode());
        college.setContactPhone(request.contactPhone());
        college.setContactEmail(request.contactEmail());
        college.setWebsiteUrl(request.websiteUrl());
        college.setEstablishedYear(request.establishedYear());

        // 7. Flush to database to trigger JPA @Version increment and optimistic locking validation
        College saved = collegeRepository.saveAndFlush(college);

        // 8. Record audit event in same transaction
        Long actorId = securityContextService.requireCurrentUserId();
        String clientIp = clientIpResolver.resolve(httpRequest);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("collegeId", college.getId());
        metadata.put("collegeCode", college.getCode());
        metadata.put("source", "SELF_SERVICE");
        metadata.put("changedFields", new ArrayList<>(diff.keySet()));
        metadata.put("diff", diff);

        auditEventService.record(
                AuditEventType.COLLEGE_PROFILE_UPDATED,
                actorId,
                Role.COLLEGE_ADMIN,
                null,
                college.getId(),
                AuditOutcome.SUCCESS,
                clientIp,
                metadata
        );

        return buildProfileResponse(saved);
    }

    private void validateReadOnlyField(
            String fieldName,
            String persistedValue,
            FieldPresence<String> presence,
            String errorMessage) {
        if (presence == null || presence.isOmitted()) {
            return;
        }
        if (presence.isExplicitNull()) {
            if (persistedValue != null) {
                throw new AppException("FIELD_IMMUTABLE", errorMessage, HttpStatus.BAD_REQUEST);
            }
            return;
        }
        String submittedValue = presence.value();
        String normalizedPersisted = persistedValue != null ? persistedValue.trim() : null;
        String normalizedSubmitted = submittedValue != null ? submittedValue.trim() : null;
        if (!Objects.equals(normalizedPersisted, normalizedSubmitted)) {
            throw new AppException("FIELD_IMMUTABLE", errorMessage, HttpStatus.BAD_REQUEST);
        }
    }

    private void checkAndRecordDiff(
            Map<String, Map<String, Object>> diff,
            String fieldName,
            Object previousValue,
            Object newValue) {
        if (!ALLOWED_DIFF_FIELDS.contains(fieldName)) {
            return;
        }
        if (!Objects.equals(previousValue, newValue)) {
            Map<String, Object> fieldDiff = new HashMap<>();
            fieldDiff.put("previous", previousValue);
            fieldDiff.put("new", newValue);
            diff.put(fieldName, fieldDiff);
        }
    }

    private CollegeAdminProfileResponse buildProfileResponse(College college) {
        boolean hasLogo = college.getLogoStorageKey() != null && !college.getLogoStorageKey().isBlank();
        return new CollegeAdminProfileResponse(
                college.getId(),
                college.getName(),
                college.getCode(),
                college.getApprovalStatus(),
                college.getStatus(),
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
                college.getVersion(),
                college.getCreatedAt(),
                college.getUpdatedAt()
        );
    }
}
