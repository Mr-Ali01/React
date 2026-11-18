package com.acadlytic.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyEmailChangeRequest(
        @NotBlank(message = "Verification token is required")
        @Size(max = 256, message = "Verification token is invalid")
        String token
) {
}
