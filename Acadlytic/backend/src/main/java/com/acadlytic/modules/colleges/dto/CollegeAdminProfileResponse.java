package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;

import java.time.Instant;

/**
 * Self-service operational profile response for College Admin (Phase 04, Module 4.3).
 */
public record CollegeAdminProfileResponse(
        Long id,
        String name,
        String code,
        CollegeApprovalStatus approvalStatus,
        CollegeStatus status,
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
        Long version,
        Instant createdAt,
        Instant updatedAt
) {}
