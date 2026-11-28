package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCollegeStatusRequest(
        @NotNull(message = "Target operational status is required")
        CollegeStatus targetStatus,

        @NotBlank(message = "Status change reason is required")
        @Size(max = 500, message = "Reason must not exceed 500 characters")
        String reason,

        @NotNull(message = "Expected version is required for optimistic locking")
        Long expectedVersion
) {
    public UpdateCollegeStatusRequest {
        reason = reason != null ? reason.trim() : null;
    }
}
