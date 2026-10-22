package com.resultpoint.modules.user.entity;

/**
 * ResultPoint User Roles.
 * Maps directly to MySQL ENUM('STUDENT', 'ADMIN') in users table.
 */
public enum UserRole {
    STUDENT,
    ADMIN
}
