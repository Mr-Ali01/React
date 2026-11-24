package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;

import java.time.Instant;

/**
 * College tenant summary for Super Admin review detail.
 */
public record CollegeReviewSummaryResponse(
        Long id,
        String name,
        String code,
        CollegeApprovalStatus approvalStatus,
        CollegeStatus status,
        boolean permanentlyRejected,
        int resubmissionCount,
        int actionRequiredCount,
        Instant createdAt
) {}
