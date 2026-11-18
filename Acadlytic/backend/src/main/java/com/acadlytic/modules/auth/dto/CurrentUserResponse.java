package com.acadlytic.modules.auth.dto;

import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CurrentUserResponse(
        Long id,
        String email,
        String pendingEmail,
        String firstName,
        String lastName,
        String name,
        Role role,
        Long collegeId,
        UserStatus userStatus,
        boolean emailVerified,
        Boolean submittedForReview,
        CollegeApprovalStatus collegeApprovalStatus,
        CollegeStatus collegeStatus,
        boolean managementUnlocked
) {
}
