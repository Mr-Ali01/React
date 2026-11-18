package com.acadlytic.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangeEmailRequest(
        @NotBlank(message = "Current password is required")
        @Size(max = 128, message = "Current password must not exceed 128 characters")
        String currentPassword,

        @NotBlank(message = "New email is required")
        @Email(message = "New email must be valid")
        @Size(max = 255, message = "New email must not exceed 255 characters")
        String newEmail
) {
}
