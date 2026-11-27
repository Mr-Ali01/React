package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.entity.DocumentVerificationProvenance;
import com.acadlytic.modules.colleges.entity.DocumentVerificationStatus;

import java.time.Instant;

/**
 * Public document metadata representation.
 * Note: Never exposes internal physical storage keys or paths.
 * Enriched in Module 3.6B with document verification status, provenance, reviewer, and version.
 */
public record DocumentResponse(
        Long id,
        Long registrationId,
        DocumentCategory documentCategory,
        String originalFilename,
        String mimeType,
        long fileSizeBytes,
        String sha256Checksum,
        Long replacesDocumentId,
        Instant createdAt,
        DocumentVerificationStatus verificationStatus,
        DocumentVerificationProvenance verificationProvenance,
        String rejectionReason,
        Instant lastReviewedAt,
        Long lastReviewedByUserId,
        Long version
) {
    /**
     * Backward-compatible 9-parameter constructor for pre-3.6 call sites.
     */
    public DocumentResponse(
            Long id,
            Long registrationId,
            DocumentCategory documentCategory,
            String originalFilename,
            String mimeType,
            long fileSizeBytes,
            String sha256Checksum,
            Long replacesDocumentId,
            Instant createdAt
    ) {
        this(
                id,
                registrationId,
                documentCategory,
                originalFilename,
                mimeType,
                fileSizeBytes,
                sha256Checksum,
                replacesDocumentId,
                createdAt,
                DocumentVerificationStatus.PENDING,
                DocumentVerificationProvenance.NOT_REVIEWED,
                null,
                null,
                null,
                0L
        );
    }
}
