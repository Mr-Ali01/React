package com.acadlytic.modules.auth.service;

import com.acadlytic.modules.colleges.entity.College;

/**
 * Phase 02 extension seam for resolving whether a college's active registration revision
 * has been submitted into the SUPER_ADMIN review queue (ADR-08).
 * Phase 03 overrides this with a bean backed by college_registrations.submitted_for_review_at.
 */
public interface CollegeRegistrationStatusProvider {

    boolean isSubmittedForReview(College college);
}
