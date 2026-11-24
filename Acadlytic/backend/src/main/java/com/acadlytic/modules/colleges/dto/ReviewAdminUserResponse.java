package com.acadlytic.modules.colleges.dto;

import java.time.Instant;

/**
 * Proposed college administrator profile for Super Admin review detail.
 */
public record ReviewAdminUserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        Instant emailVerifiedAt,
        Instant createdAt
) {}
