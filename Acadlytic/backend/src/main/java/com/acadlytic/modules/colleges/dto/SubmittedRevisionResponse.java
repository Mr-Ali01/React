package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;

import java.time.Instant;

/**
 * Authoritative submitted revision details for Super Admin review detail.
 */
public record SubmittedRevisionResponse(
        Long id,
        int versionNumber,
        CollegeApprovalStatus status,
        String legalName,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String country,
        String postalCode,
        String websiteUrl,
        String contactPhone,
        String affiliatedUniversityName,
        Instant submittedForReviewAt
) {}
