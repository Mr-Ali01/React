package com.acadlytic.modules.colleges.storage;

import org.springframework.core.io.Resource;

import java.nio.file.Path;

/**
 * Storage port interface for college registration verification documents (ADR-11, ADR-16).
 */
public interface DocumentStorageService {

    StoredFileMetadata store(byte[] content, String originalFilename, String mimeType, String sha256Checksum);

    StoredFileMetadata duplicate(String existingStorageKey, String originalFilename, String mimeType, long fileSizeBytes, String sha256Checksum);

    Resource loadAsResource(String storageKey);

    void delete(String storageKey);

    boolean exists(String storageKey);

    Path getStoragePath();
}
