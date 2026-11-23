package com.acadlytic.modules.colleges.entity;

/**
 * Verification document categories for college onboarding (ADR-11).
 * UNIVERSITY_AFFILIATION_CERTIFICATE and AUTHORIZED_SIGNATORY_ID are required
 * before submitting for review.
 */
public enum DocumentCategory {
    UNIVERSITY_AFFILIATION_CERTIFICATE(true),
    AUTHORIZED_SIGNATORY_ID(true),
    INSTITUTION_REGISTRATION_PROOF(false),
    ADDITIONAL_SUPPORTING_DOCUMENT(false);

    private final boolean required;

    DocumentCategory(boolean required) {
        this.required = required;
    }

    public boolean isRequired() {
        return required;
    }
}
