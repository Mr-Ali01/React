package com.acadlytic.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        @Size(max = 128, message = "Current password must not exceed 128 characters")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 12, max = 128, message = "Password must be between 12 and 128 characters")
        String newPassword
) {
}
