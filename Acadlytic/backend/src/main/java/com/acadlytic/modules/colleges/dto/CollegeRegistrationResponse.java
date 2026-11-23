package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CollegeRegistrationResponse(
        Long collegeId,
        Long registrationId,
        int versionNumber,
        String collegeName,
        String collegeCode,
        CollegeApprovalStatus status,
        String adminEmail,
        boolean submittedForReview,
        String message
) {
}
