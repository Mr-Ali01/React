package com.acadlytic.modules.auth.service;

import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/**
 * Default Phase 02 implementation prior to Phase 03 college_registrations table creation.
 * Returns false while PENDING (pre-submission) and true once reviewed/approved/actioned.
 */
@Component
@ConditionalOnMissingBean(CollegeRegistrationStatusProvider.class)
public class DefaultCollegeRegistrationStatusProvider implements CollegeRegistrationStatusProvider {

    @Override
    public boolean isSubmittedForReview(College college) {
        if (college == null) {
            return false;
        }
        return college.getApprovalStatus() != CollegeApprovalStatus.PENDING;
    }
}
