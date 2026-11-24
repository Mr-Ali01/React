package com.acadlytic.modules.colleges.dto;

import com.acadlytic.modules.colleges.entity.DocumentCategory;

import java.time.Instant;

/**
 * Public document metadata representation.
 * Note: Never exposes internal physical storage keys or paths.
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
        Instant createdAt
) {}
