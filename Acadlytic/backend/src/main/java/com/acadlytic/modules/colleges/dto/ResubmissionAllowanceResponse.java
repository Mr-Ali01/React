package com.acadlytic.modules.colleges.dto;

/**
 * Resubmission counters and allowance caps (ADR-07).
 */
public record ResubmissionAllowanceResponse(
        int resubmissionCount,
        int actionRequiredCount,
        int maxRejections,
        int maxActionRequired
) {}
