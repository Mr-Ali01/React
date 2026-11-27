package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.entity.DocumentVerificationProvenance;
import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;

import java.time.Instant;

/**
 * Response payload returned after recording a document review decision (Module 3.6B).
 */
public record DocumentReviewDecisionResponse(
        Long documentId,
        Long registrationId,
        DocumentCategory documentCategory,
        DocumentVerificationStatus verificationStatus,
        DocumentVerificationProvenance verificationProvenance,
        String rejectionReason,
        Instant lastReviewedAt,
        Long lastReviewedByUserId,
        String reviewerEmail,
        Long version
) {}
