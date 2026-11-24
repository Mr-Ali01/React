package com.acadlytic.modules.colleges.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Super Admin review decision request payload.
 */
public record ReviewDecisionRequest(
        @NotNull(message = "Review action is required.")
        ReviewDecisionAction action,

        @NotNull(message = "Expected version is required.")
        @Min(value = 0, message = "Expected version must be non-negative.")
        Long expectedVersion,

        @Size(max = 2000, message = "Review notes must not exceed 2000 characters.")
        String reviewNotes,

        @Size(max = 2000, message = "Rejection reason must not exceed 2000 characters.")
        String rejectionReason
) {}
