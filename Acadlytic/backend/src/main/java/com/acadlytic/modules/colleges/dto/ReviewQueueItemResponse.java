package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;

import java.time.Instant;

/**
 * Summary item for the Super Admin pending review queue.
 */
public record ReviewQueueItemResponse(
        Long collegeId,
        String collegeCode,
        String legalName,
        Long registrationId,
        int versionNumber,
        CollegeApprovalStatus status,
        Instant submittedForReviewAt,
        String adminName,
        String adminEmail,
        int resubmissionCount,
        int actionRequiredCount,
        long documentCount
) {}
