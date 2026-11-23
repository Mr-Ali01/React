package com.acadlytic.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for verifying an email address using a single-use 48-hour token.
 */
@Schema(description = "Request payload to verify an email address using a single-use 48-hour token")
public record VerifyEmailRequest(
        @NotBlank(message = "Verification token is required")
        @Size(min = 20, max = 255, message = "Token length is invalid")
        @Schema(description = "Cryptographically random single-use verification token received via email", example = "43-character-base64url-token")
        String token
) {
}
