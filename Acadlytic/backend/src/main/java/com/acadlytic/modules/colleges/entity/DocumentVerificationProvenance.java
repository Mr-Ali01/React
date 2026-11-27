package com.acadlytic.modules.colleges.entity;

/**
 * Lifecycle and review provenance for a verification document (Module 3.6A, BF-07).
 */
public enum DocumentVerificationProvenance {
    /** Document has been uploaded but has never been reviewed by any reviewer. */
    NOT_REVIEWED,

    /** Document was explicitly reviewed and decided (ACCEPTED or REJECTED) by a Super Admin. */
    DIRECT_REVIEW,

    /** Document was accepted in a prior revision and automatically carried forward to this draft. */
    CARRIED_FORWARD,

    /** Document belonged to a college that was APPROVED prior to the introduction of Module 3.6. */
    LEGACY_COLLEGE_APPROVAL
}
