package com.acadlytic.modules.auth.entity;

/**
 * Platform role enumeration.
 * Active in MVP: SUPER_ADMIN, COLLEGE_ADMIN.
 * Post-MVP (disabled in MVP): ACADEMIC_STAFF (Phase 15), STUDENT (Phase 16).
 * BRANCH_ADMIN is strictly Post-MVP (Phase 18.6) and intentionally omitted from MVP schema.
 */
public enum Role {
    SUPER_ADMIN,
    COLLEGE_ADMIN,
    ACADEMIC_STAFF,
    STUDENT;

    public boolean isActiveInMvp() {
        return this == SUPER_ADMIN || this == COLLEGE_ADMIN;
    }

    public String asAuthority() {
        return "ROLE_" + this.name();
    }
}
