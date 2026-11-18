package com.acadlytic.security;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Reusable server-side role, tenant isolation, and live approval-state authorization guard.
 * Used across Phase 02+ services to prevent cross-tenant access and block management APIs
 * while a college is unapproved or suspended.
 */
@Component
public class CollegeAccessGuard {

    private final SecurityContextService securityContextService;
    private final CollegeRepository collegeRepository;

    public CollegeAccessGuard(
            SecurityContextService securityContextService,
            CollegeRepository collegeRepository) {
        this.securityContextService = securityContextService;
        this.collegeRepository = collegeRepository;
    }

    public void requireSuperAdmin() {
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();
        if (principal.getRole() != Role.SUPER_ADMIN) {
            throw new AppException(
                    "ACCESS_DENIED",
                    "Super Admin privileges are required for this operation.",
                    HttpStatus.FORBIDDEN);
        }
    }

    public void requireSameTenant(Long targetCollegeId) {
        if (targetCollegeId == null) {
            throw new AppException("ACCESS_DENIED", "Target college context is required.", HttpStatus.FORBIDDEN);
        }
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();
        if (principal.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (principal.getRole() != Role.COLLEGE_ADMIN || !targetCollegeId.equals(principal.getCollegeId())) {
            throw new AppException(
                    "ACCESS_DENIED",
                    "Cross-tenant access is prohibited.",
                    HttpStatus.FORBIDDEN);
        }
    }

    /**
     * Enforces tenant ownership AND live database verification that the college is APPROVED and ACTIVE.
     * Throws:
     * - 403 ACCESS_DENIED on cross-tenant attempt or wrong role
     * - 403 REGISTRATION_PERMANENTLY_REJECTED if permanently rejected
     * - 403 COLLEGE_SUSPENDED if suspended
     * - 403 COLLEGE_INACTIVE if inactive or archived
     * - 403 COLLEGE_NOT_APPROVED if still PENDING, ACTION_REQUIRED, or non-permanent REJECTED
     */
    public College requireApprovedAndActiveCollege(Long targetCollegeId) {
        requireSameTenant(targetCollegeId);

        College college = collegeRepository.findById(targetCollegeId)
                .orElseThrow(() -> new AppException(
                        "COLLEGE_INACTIVE",
                        "College tenant not found.",
                        HttpStatus.FORBIDDEN));

        if (college.isPermanentlyRejected()) {
            throw new AppException(
                    "REGISTRATION_PERMANENTLY_REJECTED",
                    "This college registration has been permanently rejected.",
                    HttpStatus.FORBIDDEN);
        }
        if (college.getStatus() == CollegeStatus.SUSPENDED) {
            throw new AppException(
                    "COLLEGE_SUSPENDED",
                    "This college account is currently suspended. Please contact Acadlytic support.",
                    HttpStatus.FORBIDDEN);
        }
        if (college.getStatus() == CollegeStatus.INACTIVE || college.getArchivedAt() != null) {
            throw new AppException(
                    "COLLEGE_INACTIVE",
                    "This college account is inactive.",
                    HttpStatus.FORBIDDEN);
        }
        if (college.getApprovalStatus() != CollegeApprovalStatus.APPROVED
                || college.getStatus() != CollegeStatus.ACTIVE) {
            throw new AppException(
                    "COLLEGE_NOT_APPROVED",
                    "College management features are locked until SUPER_ADMIN approves your registration.",
                    HttpStatus.FORBIDDEN);
        }

        return college;
    }

    public College requireApprovedAndActiveCurrentCollege() {
        Long collegeId = securityContextService.requireCurrentCollegeId();
        return requireApprovedAndActiveCollege(collegeId);
    }

    public College requireRestrictedOnboardingAccess() {
        AcadlyticUserPrincipal principal = securityContextService.requireCurrentPrincipal();
        if (principal.getRole() != Role.COLLEGE_ADMIN || principal.getCollegeId() == null) {
            throw new AppException(
                    "ACCESS_DENIED",
                    "College Admin context is required.",
                    HttpStatus.FORBIDDEN);
        }
        College college = collegeRepository.findById(principal.getCollegeId())
                .orElseThrow(() -> new AppException(
                        "COLLEGE_INACTIVE",
                        "College tenant not found.",
                        HttpStatus.FORBIDDEN));

        if (college.isPermanentlyRejected()) {
            throw new AppException(
                    "REGISTRATION_PERMANENTLY_REJECTED",
                    "This college registration has been permanently rejected.",
                    HttpStatus.FORBIDDEN);
        }
        if (college.getStatus() == CollegeStatus.SUSPENDED) {
            throw new AppException(
                    "COLLEGE_SUSPENDED",
                    "This college account is currently suspended.",
                    HttpStatus.FORBIDDEN);
        }
        if (college.getStatus() == CollegeStatus.INACTIVE || college.getArchivedAt() != null) {
            throw new AppException(
                    "COLLEGE_INACTIVE",
                    "This college account is inactive.",
                    HttpStatus.FORBIDDEN);
        }
        return college;
    }
}
