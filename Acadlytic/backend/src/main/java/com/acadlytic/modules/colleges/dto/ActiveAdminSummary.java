package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.auth.entity.UserStatus;

public record ActiveAdminSummary(
        Long id,
        Long userId,
        String firstName,
        String lastName,
        String fullName,
        String email,
        UserStatus status,
        boolean emailVerified
) {
    public ActiveAdminSummary(
            Long userId,
            String firstName,
            String lastName,
            String fullName,
            String email,
            UserStatus status,
            boolean emailVerified) {
        this(userId, userId, firstName, lastName, fullName, email, status, emailVerified);
    }
}
