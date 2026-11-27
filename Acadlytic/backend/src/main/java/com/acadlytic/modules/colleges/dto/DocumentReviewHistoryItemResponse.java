package com.acadlytic.modules.colleges.dto;

import java.time.Instant;

/**
 * DTO representing an individual review history record in college_document_reviews (Module 3.6B).
 */
public record DocumentReviewHistoryItemResponse(
        Long id,
        Long reviewId,
        Long documentId,
        Long registrationId,
        Long collegeId,
        String action,
        String rejectionReason,
        Long reviewerUserId,
        String reviewerEmail,
        Instant reviewedAt,
        Instant createdAt
) {
    public DocumentReviewHistoryItemResponse(
            Long id,
            Long documentId,
            Long registrationId,
            Long collegeId,
            String action,
            String rejectionReason,
            Long reviewerUserId,
            String reviewerEmail,
            Instant reviewedAt,
            Instant createdAt
    ) {
        this(id, id, documentId, registrationId, collegeId, action, rejectionReason, reviewerUserId, reviewerEmail, reviewedAt, createdAt);
    }
}
