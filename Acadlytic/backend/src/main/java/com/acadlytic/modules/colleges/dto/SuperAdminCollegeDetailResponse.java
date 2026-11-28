package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;

import java.time.Instant;

public record SuperAdminCollegeDetailResponse(
        Long id,
        String name,
        String code,
        CollegeApprovalStatus approvalStatus,
        CollegeStatus status,
        boolean permanentlyRejected,
        Instant archivedAt,
        Long version,
        Instant createdAt,
        Instant updatedAt,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String country,
        String postalCode,
        String contactPhone,
        String contactEmail,
        String websiteUrl,
        String affiliatedUniversityName,
        Integer establishedYear,
        String accreditationDetails,
        boolean hasLogo,
        Long currentRegistrationId,
        Integer currentRegistrationVersion,
        CollegeApprovalStatus currentRegistrationStatus,
        Instant currentRegistrationSubmittedAt,
        ActiveAdminSummary activeAdmin
) {}
