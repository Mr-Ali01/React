package com.acadlytic.modules.colleges.storage;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.DocumentProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Local filesystem implementation of DocumentStorageService (ADR-11, ADR-16).
 * Physical files are stored outside webroot using random UUID keys.
 */
@Service
public class LocalFileSystemDocumentStorageService implements DocumentStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileSystemDocumentStorageService.class);
    private static final Pattern SAFE_KEY_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+(\\.[a-zA-Z0-9]+)?$");

    private final DocumentProperties documentProperties;

    public LocalFileSystemDocumentStorageService(DocumentProperties documentProperties) {
        this.documentProperties = documentProperties;
    }

    @Override
    public StoredFileMetadata store(byte[] content, String originalFilename, String mimeType, String sha256Checksum) {
        if (content == null || content.length == 0) {
            throw new AppException("INVALID_DOCUMENT_FORMAT", "Document content cannot be empty.", HttpStatus.BAD_REQUEST);
        }

        String extension = getFileExtension(originalFilename);
        String storageKey = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);

        Path targetPath = resolveAndValidatePath(storageKey);

        try {
            Files.write(targetPath, content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            log.info("Stored document file successfully with key: {}", storageKey);
        } catch (IOException e) {
            log.error("Failed to store document file to disk: {}", targetPath, e);
            throw new AppException("INTERNAL_ERROR", "Failed to store document file.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new StoredFileMetadata(storageKey, originalFilename, mimeType, content.length, sha256Checksum);
    }

    @Override
    public StoredFileMetadata duplicate(String existingStorageKey, String originalFilename, String mimeType, long fileSizeBytes, String sha256Checksum) {
        Path sourcePath = resolveAndValidatePath(existingStorageKey);
        if (!Files.exists(sourcePath) || !Files.isReadable(sourcePath)) {
            throw new AppException("DOCUMENT_NOT_FOUND", "Source document file not found.", HttpStatus.NOT_FOUND);
        }

        String extension = getFileExtension(originalFilename);
        String newStorageKey = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);
        Path targetPath = resolveAndValidatePath(newStorageKey);

        try {
            Files.copy(sourcePath, targetPath);
            log.info("Duplicated document file from {} to {}", existingStorageKey, newStorageKey);
        } catch (IOException e) {
            log.error("Failed to duplicate document file {} to {}", existingStorageKey, newStorageKey, e);
            throw new AppException("INTERNAL_ERROR", "Failed to carry forward document file.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new StoredFileMetadata(newStorageKey, originalFilename, mimeType, fileSizeBytes, sha256Checksum);
    }

    @Override
    public Resource loadAsResource(String storageKey) {
        Path filePath = resolveAndValidatePath(storageKey);
        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            throw new AppException("DOCUMENT_NOT_FOUND", "Document file not found on storage.", HttpStatus.NOT_FOUND);
        }
        return new FileSystemResource(filePath);
    }

    @Override
    public void delete(String storageKey) {
        try {
            Path filePath = resolveAndValidatePath(storageKey);
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.info("Deleted physical document file: {}", storageKey);
            }
        } catch (Exception e) {
            log.warn("Failed to delete physical document file: {}", storageKey, e);
        }
    }

    @Override
    public boolean exists(String storageKey) {
        try {
            Path filePath = resolveAndValidatePath(storageKey);
            return Files.exists(filePath);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public Path getStoragePath() {
        return documentProperties.getNormalizedStoragePath();
    }

    private Path resolveAndValidatePath(String storageKey) {
        if (storageKey == null || storageKey.isBlank() || !SAFE_KEY_PATTERN.matcher(storageKey).matches()) {
            throw new AppException("INVALID_DOCUMENT_FORMAT", "Invalid storage key format.", HttpStatus.BAD_REQUEST);
        }

        Path basePath = documentProperties.getNormalizedStoragePath();
        Path resolvedPath = basePath.resolve(storageKey).normalize();

        if (!resolvedPath.startsWith(basePath)) {
            throw new AppException("ACCESS_DENIED", "Path traversal attempt detected.", HttpStatus.FORBIDDEN);
        }

        return resolvedPath;
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
