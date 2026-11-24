package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;

import java.time.Instant;

/**
 * Response payload after successfully submitting an application or correction draft for review.
 */
public record SubmitApplicationResponse(
        Long registrationId,
        Integer versionNumber,
        CollegeApprovalStatus status,
        Instant submittedForReviewAt,
        String message
) {}
