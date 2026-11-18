package com.acadlytic.modules.auth.mapper;

import com.acadlytic.modules.auth.dto.CurrentUserResponse;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.service.CollegeRegistrationStatusProvider;
import com.acadlytic.modules.colleges.entity.College;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserMapper {

    private final CollegeRegistrationStatusProvider registrationStatusProvider;

    public CurrentUserMapper(CollegeRegistrationStatusProvider registrationStatusProvider) {
        this.registrationStatusProvider = registrationStatusProvider;
    }

    public CurrentUserResponse toResponse(User user, College college) {
        boolean isSuperAdmin = user.getRole() == Role.SUPER_ADMIN;
        Boolean submittedForReview = isSuperAdmin ? null : registrationStatusProvider.isSubmittedForReview(college);
        boolean managementUnlocked = isSuperAdmin || (college != null && college.isManagementUnlocked());

        return new CurrentUserResponse(
                user.getId(),
                user.getEmail(),
                user.getPendingEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                user.getRole(),
                user.getCollegeId(),
                user.getStatus(),
                user.getEmailVerifiedAt() != null,
                submittedForReview,
                college != null ? college.getApprovalStatus() : null,
                college != null ? college.getStatus() : null,
                managementUnlocked
        );
    }
}
