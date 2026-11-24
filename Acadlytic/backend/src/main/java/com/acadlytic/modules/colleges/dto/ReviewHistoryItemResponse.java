package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;

import java.time.Instant;

/**
 * Historical revision snapshot for Super Admin review detail.
 */
public record ReviewHistoryItemResponse(
        Long id,
        int versionNumber,
        CollegeApprovalStatus status,
        String legalName,
        Instant submittedForReviewAt,
        Long reviewerUserId,
        String reviewNotes,
        String rejectionReason,
        boolean isPermanentRejection,
        Instant reviewedAt,
        Instant createdAt
) {}
