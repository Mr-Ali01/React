package com.acadlytic.modules.colleges.dto;

import java.util.List;

/**
 * Complete review context and detail payload for Super Admin review.
 */
public record CollegeReviewDetailResponse(
        CollegeReviewSummaryResponse college,
        ReviewAdminUserResponse adminUser,
        SubmittedRevisionResponse submittedRevision,
        List<DocumentResponse> activeDocuments,
        List<ReviewHistoryItemResponse> revisionHistory,
        Long concurrencyVersion
) {}
