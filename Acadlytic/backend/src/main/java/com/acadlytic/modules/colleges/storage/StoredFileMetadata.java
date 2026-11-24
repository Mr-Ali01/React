package com.acadlytic.modules.colleges.storage;

/**
 * Metadata record for a securely stored physical document.
 */
public record StoredFileMetadata(
        String storageKey,
        String originalFilename,
        String mimeType,
        long fileSizeBytes,
        String sha256Checksum
) {}
