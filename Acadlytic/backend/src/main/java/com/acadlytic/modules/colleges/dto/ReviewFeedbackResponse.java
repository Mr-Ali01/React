package com.acadlytic.modules.colleges.dto;

import java.time.Instant;

/**
 * Review feedback sourced strictly from the authoritative submitted revision (ADR-07).
 */
public record ReviewFeedbackResponse(
        String reviewNotes,
        String rejectionReason,
        boolean isPermanentRejection,
        Instant reviewedAt
) {}
