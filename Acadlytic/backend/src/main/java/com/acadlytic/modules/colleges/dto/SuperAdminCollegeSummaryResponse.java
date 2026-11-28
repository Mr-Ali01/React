package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;

import java.time.Instant;

public record SuperAdminCollegeSummaryResponse(
        Long id,
        String name,
        String code,
        CollegeApprovalStatus approvalStatus,
        CollegeStatus status,
        String city,
        String state,
        String affiliatedUniversityName,
        Long activeAdminUserId,
        String activeAdminName,
        String activeAdminEmail,
        Instant createdAt,
        Instant updatedAt
) {}
