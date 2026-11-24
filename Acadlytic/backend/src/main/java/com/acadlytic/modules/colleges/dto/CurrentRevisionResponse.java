package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;

import java.time.Instant;

/**
 * Details of the current active revision (unsubmitted draft or submitted revision).
 */
public record CurrentRevisionResponse(
        Long id,
        Integer versionNumber,
        CollegeApprovalStatus status,
        Instant submittedForReviewAt,
        boolean isDraft,
        CollegeProfileResponse profile
) {}
