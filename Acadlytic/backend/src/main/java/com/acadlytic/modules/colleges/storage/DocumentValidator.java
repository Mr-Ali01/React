package com.acadlytic.modules.colleges.storage;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.DocumentProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

/**
 * Validates document files: size limits, MIME type, extension, and magic-byte signatures (ADR-11).
 */
@Component
public class DocumentValidator {

    private static final byte[] PDF_MAGIC = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D}; // %PDF-
    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final DocumentProperties documentProperties;

    public DocumentValidator(DocumentProperties documentProperties) {
        this.documentProperties = documentProperties;
    }

    public ValidatedDocument validate(byte[] content, String originalFilename, String declaredMimeType) {
        if (content == null || content.length == 0) {
            throw new AppException("INVALID_DOCUMENT_FORMAT", "Document content cannot be empty.", HttpStatus.BAD_REQUEST);
        }

        if (content.length > documentProperties.getMaxFileSizeBytes()) {
            throw new AppException("DOCUMENT_SIZE_EXCEEDED", "File size exceeds maximum allowed limit of 10 MB.", HttpStatus.BAD_REQUEST);
        }

        if (originalFilename == null || originalFilename.isBlank() || originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new AppException("INVALID_DOCUMENT_FORMAT", "Invalid filename format.", HttpStatus.BAD_REQUEST);
        }

        String extension = extractExtension(originalFilename);
        String detectedMime = detectAndVerifyType(content, extension, declaredMimeType);
        String sha256 = calculateSha256(content);

        return new ValidatedDocument(content, originalFilename, detectedMime, content.length, sha256);
    }

    public String calculateSha256(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private String detectAndVerifyType(byte[] content, String extension, String declaredMimeType) {
        String cleanMime = declaredMimeType != null ? declaredMimeType.trim().toLowerCase(Locale.ROOT) : "";

        if ("pdf".equals(extension)) {
            if (!startsWith(content, PDF_MAGIC)) {
                throw new AppException("INVALID_DOCUMENT_FORMAT", "File content does not match PDF signature.", HttpStatus.BAD_REQUEST);
            }
            if (!cleanMime.isEmpty() && !cleanMime.equals("application/pdf") && !cleanMime.equals("application/octet-stream")) {
                throw new AppException("INVALID_DOCUMENT_FORMAT", "Declared MIME type does not match PDF content.", HttpStatus.BAD_REQUEST);
            }
            return "application/pdf";
        } else if ("jpg".equals(extension) || "jpeg".equals(extension)) {
            if (!startsWith(content, JPEG_MAGIC)) {
                throw new AppException("INVALID_DOCUMENT_FORMAT", "File content does not match JPEG signature.", HttpStatus.BAD_REQUEST);
            }
            if (!cleanMime.isEmpty() && !cleanMime.equals("image/jpeg") && !cleanMime.equals("image/jpg") && !cleanMime.equals("application/octet-stream")) {
                throw new AppException("INVALID_DOCUMENT_FORMAT", "Declared MIME type does not match JPEG content.", HttpStatus.BAD_REQUEST);
            }
            return "image/jpeg";
        } else if ("png".equals(extension)) {
            if (!startsWith(content, PNG_MAGIC)) {
                throw new AppException("INVALID_DOCUMENT_FORMAT", "File content does not match PNG signature.", HttpStatus.BAD_REQUEST);
            }
            if (!cleanMime.isEmpty() && !cleanMime.equals("image/png") && !cleanMime.equals("application/octet-stream")) {
                throw new AppException("INVALID_DOCUMENT_FORMAT", "Declared MIME type does not match PNG content.", HttpStatus.BAD_REQUEST);
            }
            return "image/png";
        } else {
            throw new AppException("INVALID_DOCUMENT_FORMAT", "Unsupported document format. Only PDF, JPEG, and PNG files are accepted.", HttpStatus.BAD_REQUEST);
        }
    }

    private boolean startsWith(byte[] content, byte[] prefix) {
        if (content.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (content[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    public record ValidatedDocument(
            byte[] content,
            String originalFilename,
            String mimeType,
            long fileSizeBytes,
            String sha256Checksum
    ) {}
}
