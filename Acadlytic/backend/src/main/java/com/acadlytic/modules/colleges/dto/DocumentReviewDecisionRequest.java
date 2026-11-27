package com.acadlytic.modules.colleges.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for recording a Super Admin review decision on an individual document (Module 3.6B).
 */
public record DocumentReviewDecisionRequest(
        @NotNull(message = "Review action is required.")
        DocumentReviewAction action,

        @Size(max = 1000, message = "Review notes cannot exceed 1000 characters.")
        String notes,

        @Size(max = 1000, message = "Rejection reason cannot exceed 1000 characters.")
        String rejectionReason,

        @NotNull(message = "Expected document version is required.")
        @Min(value = 0, message = "Expected document version must be greater than or equal to 0.")
        Long expectedDocumentVersion
) {}
