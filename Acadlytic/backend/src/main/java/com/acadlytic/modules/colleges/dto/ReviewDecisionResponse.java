package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;

import java.time.Instant;

/**
 * Super Admin review decision response.
 */
public record ReviewDecisionResponse(
        Long collegeId,
        Long registrationId,
        int versionNumber,
        CollegeApprovalStatus approvalStatus,
        Instant reviewedAt,
        Long reviewerUserId
) {}
