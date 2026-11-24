package com.acadlytic.modules.colleges.storage;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.DocumentProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalFileSystemDocumentStorageServiceUnitTest {

    @TempDir
    Path tempStorageDir;

    private DocumentProperties properties;
    private LocalFileSystemDocumentStorageService storageService;

    @BeforeEach
    void setUp() throws IOException {
        properties = new DocumentProperties();
        properties.setStorageDir(tempStorageDir.toString());
        properties.validateStoragePath();
        storageService = new LocalFileSystemDocumentStorageService(properties);
    }

    @Test
    @DisplayName("Stores file in configured directory with random UUID key and extension")
    void storeFileSuccessfully() throws IOException {
        byte[] content = "test file content".getBytes(StandardCharsets.UTF_8);
        StoredFileMetadata metadata = storageService.store(content, "sample.pdf", "application/pdf", "dummy-sha256");

        assertThat(metadata).isNotNull();
        assertThat(metadata.storageKey()).endsWith(".pdf");
        assertThat(storageService.exists(metadata.storageKey())).isTrue();

        Path physicalFile = tempStorageDir.resolve(metadata.storageKey());
        assertThat(Files.readAllBytes(physicalFile)).isEqualTo(content);
    }

    @Test
    @DisplayName("Loads existing stored file as readable Spring Resource")
    void loadStoredFileAsResource() {
        byte[] content = "sample test stream".getBytes(StandardCharsets.UTF_8);
        StoredFileMetadata metadata = storageService.store(content, "test.png", "image/png", "dummy-sha256");

        Resource resource = storageService.loadAsResource(metadata.storageKey());
        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
        assertThat(resource.getFilename()).isEqualTo(metadata.storageKey());
    }

    @Test
    @DisplayName("Throws DOCUMENT_NOT_FOUND when loading non-existent storage key")
    void loadNonExistentFileThrows() {
        assertThatThrownBy(() -> storageService.loadAsResource("00000000-0000-0000-0000-000000000000.pdf"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Document file not found on storage");
    }

    @Test
    @DisplayName("Deletes stored file physically from disk")
    void deleteStoredFilePhysically() {
        byte[] content = "to be deleted".getBytes(StandardCharsets.UTF_8);
        StoredFileMetadata metadata = storageService.store(content, "delete-me.jpg", "image/jpeg", "dummy-sha256");
        assertThat(storageService.exists(metadata.storageKey())).isTrue();

        storageService.delete(metadata.storageKey());
        assertThat(storageService.exists(metadata.storageKey())).isFalse();
    }

    @Test
    @DisplayName("Duplicates an existing stored file with a new UUID storage key")
    void duplicateStoredFileSuccessfully() throws IOException {
        byte[] content = "original content".getBytes(StandardCharsets.UTF_8);
        StoredFileMetadata original = storageService.store(content, "original.pdf", "application/pdf", "dummy-sha256");

        StoredFileMetadata duplicated = storageService.duplicate(
                original.storageKey(), "original.pdf", "application/pdf", content.length, "dummy-sha256");

        assertThat(duplicated.storageKey()).isNotEqualTo(original.storageKey());
        assertThat(duplicated.storageKey()).endsWith(".pdf");
        assertThat(storageService.exists(duplicated.storageKey())).isTrue();

        Path duplicatedFile = tempStorageDir.resolve(duplicated.storageKey());
        assertThat(Files.readAllBytes(duplicatedFile)).isEqualTo(content);
    }

    @Test
    @DisplayName("Blocks path traversal attempt in storage key")
    void blockPathTraversalStorageKey() {
        assertThatThrownBy(() -> storageService.loadAsResource("../../etc/passwd"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid storage key format");
    }

    @Test
    @DisplayName("Startup validation fails when storage path is configured inside classpath resources")
    void startupValidationFailsInsideClasspath() {
        DocumentProperties badProps = new DocumentProperties();
        badProps.setStorageDir("backend/src/main/resources/storage");

        assertThatThrownBy(badProps::validateStoragePath)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CRITICAL SECURITY HAZARD");
    }
}
