package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;

/**
 * College tenant summary for restricted dashboard.
 */
public record CollegeSummaryResponse(
        Long id,
        String name,
        String code,
        CollegeApprovalStatus approvalStatus,
        CollegeStatus status
) {}
