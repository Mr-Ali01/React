package com.acadlytic.modules.colleges.dto;

/**
 * Live checklist status for College Admin restricted onboarding dashboard.
 */
public record OnboardingChecklistResponse(
        boolean emailVerified,
        boolean requiredDocumentsUploaded,
        boolean canSubmitForReview,
        boolean canStartCorrectionDraft,
        boolean isFrozenInReview
) {}
