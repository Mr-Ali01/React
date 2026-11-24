package com.acadlytic.modules.colleges.storage;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.DocumentProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocumentValidatorUnitTest {

    private DocumentProperties properties;
    private DocumentValidator validator;

    @BeforeEach
    void setUp() {
        properties = new DocumentProperties();
        properties.setMaxFileSizeBytes(10 * 1024 * 1024);
        validator = new DocumentValidator(properties);
    }

    @Test
    @DisplayName("Validates valid PDF file with correct magic bytes and MIME type")
    void validateValidPdf() {
        byte[] pdfContent = "%PDF-1.4 sample content".getBytes(StandardCharsets.US_ASCII);
        DocumentValidator.ValidatedDocument result = validator.validate(pdfContent, "affiliation.pdf", "application/pdf");

        assertThat(result).isNotNull();
        assertThat(result.mimeType()).isEqualTo("application/pdf");
        assertThat(result.originalFilename()).isEqualTo("affiliation.pdf");
        assertThat(result.fileSizeBytes()).isEqualTo(pdfContent.length);
        assertThat(result.sha256Checksum()).hasSize(64);
    }

    @Test
    @DisplayName("Validates valid JPEG file with correct magic bytes")
    void validateValidJpeg() {
        byte[] jpegContent = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46};
        DocumentValidator.ValidatedDocument result = validator.validate(jpegContent, "signatory.jpg", "image/jpeg");

        assertThat(result).isNotNull();
        assertThat(result.mimeType()).isEqualTo("image/jpeg");
    }

    @Test
    @DisplayName("Validates valid PNG file with correct 8-byte PNG signature")
    void validateValidPng() {
        byte[] pngContent = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00};
        DocumentValidator.ValidatedDocument result = validator.validate(pngContent, "proof.png", "image/png");

        assertThat(result).isNotNull();
        assertThat(result.mimeType()).isEqualTo("image/png");
    }

    @Test
    @DisplayName("Rejects spoofed extension when content does not match signature")
    void rejectSpoofedExtension() {
        byte[] fakePdf = "echo 'bash script'".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> validator.validate(fakePdf, "script.pdf", "application/pdf"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("does not match PDF signature");
    }

    @Test
    @DisplayName("Rejects declared MIME mismatch")
    void rejectMimeMismatch() {
        byte[] pdfContent = "%PDF-1.4 sample content".getBytes(StandardCharsets.US_ASCII);

        assertThatThrownBy(() -> validator.validate(pdfContent, "file.pdf", "image/png"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Declared MIME type does not match");
    }

    @Test
    @DisplayName("Rejects file exceeding 10MB limit")
    void rejectOversizedFile() {
        properties.setMaxFileSizeBytes(100);
        byte[] bigContent = new byte[101];
        System.arraycopy("%PDF-".getBytes(StandardCharsets.US_ASCII), 0, bigContent, 0, 5);

        assertThatThrownBy(() -> validator.validate(bigContent, "large.pdf", "application/pdf"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("File size exceeds maximum allowed limit");
    }

    @Test
    @DisplayName("Rejects empty or null content")
    void rejectEmptyContent() {
        assertThatThrownBy(() -> validator.validate(new byte[0], "empty.pdf", "application/pdf"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Document content cannot be empty");
    }

    @Test
    @DisplayName("Rejects malicious filename with path traversal")
    void rejectPathTraversalFilename() {
        byte[] pdfContent = "%PDF-1.4 sample content".getBytes(StandardCharsets.US_ASCII);

        assertThatThrownBy(() -> validator.validate(pdfContent, "../../../etc/passwd.pdf", "application/pdf"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid filename format");
    }

    @Test
    @DisplayName("Calculates accurate deterministic SHA-256 checksum")
    void calculateSha256Checksum() {
        byte[] content = "Hello Acadlytic Document Validation".getBytes(StandardCharsets.UTF_8);
        String checksum = validator.calculateSha256(content);

        assertThat(checksum).isNotNull().hasSize(64);
        // Deterministic check: recomputed matches original
        assertThat(validator.calculateSha256(content)).isEqualTo(checksum);
    }
}
