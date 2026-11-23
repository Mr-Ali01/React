package com.acadlytic.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * Response payload confirming successful email address verification.
 */
@Schema(description = "Response confirming successful email address verification")
public record VerifyEmailResponse(
        @Schema(description = "Verified email address", example = "admin@horizon.edu")
        String email,
        @Schema(description = "Whether the email is verified", example = "true")
        boolean emailVerified,
        @Schema(description = "Timestamp when the email was verified", example = "2026-11-23T19:00:00Z")
        Instant verifiedAt
) {
}
