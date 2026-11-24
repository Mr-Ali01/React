package com.acadlytic.modules.colleges.dto;

import java.util.List;

/**
 * Top-level response for GET /api/v1/college-registrations/my-application.
 * Combines college details, active editable revision, authoritative feedback from submitted revision,
 * resubmission caps, checklist, active documents, and revision history.
 */
public record MyApplicationResponse(
        CollegeSummaryResponse college,
        CurrentRevisionResponse currentRevision,
        ReviewFeedbackResponse reviewFeedback,
        ResubmissionAllowanceResponse resubmission,
        OnboardingChecklistResponse checklist,
        List<DocumentResponse> activeDocuments,
        List<RevisionSummaryResponse> revisionHistory
) {}
