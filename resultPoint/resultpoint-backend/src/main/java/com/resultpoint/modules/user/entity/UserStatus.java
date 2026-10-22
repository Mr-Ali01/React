package com.resultpoint.modules.user.entity;

/**
 * ResultPoint User Account Status.
 * Maps directly to MySQL ENUM('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') in users table.
 */
public enum UserStatus {
    ACTIVE,
    SUSPENDED,
    PENDING_VERIFICATION
}
