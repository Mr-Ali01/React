package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;
import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Super Admin review action for an individual registration document (Module 3.6B).
 */
public enum DocumentReviewAction {
    ACCEPT,
    REJECT;

    @JsonCreator
    public static DocumentReviewAction fromString(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if ("ACCEPT".equals(normalized) || "ACCEPTED".equals(normalized)) {
            return ACCEPT;
        }
        if ("REJECT".equals(normalized) || "REJECTED".equals(normalized)) {
            return REJECT;
        }
        throw new IllegalArgumentException("Unknown document review action: " + value);
    }

    public DocumentVerificationStatus toVerificationStatus() {
        return this == ACCEPT ? DocumentVerificationStatus.ACCEPTED : DocumentVerificationStatus.REJECTED;
    }

    public String toHistoryAction() {
        return this == ACCEPT ? "ACCEPTED" : "REJECTED";
    }
}
