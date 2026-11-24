package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;

import java.time.Instant;

/**
 * Summary of a historical registration revision.
 */
public record RevisionSummaryResponse(
        Long id,
        Integer versionNumber,
        CollegeApprovalStatus status,
        Instant submittedForReviewAt,
        Instant reviewedAt,
        boolean isPermanentRejection
) {}
