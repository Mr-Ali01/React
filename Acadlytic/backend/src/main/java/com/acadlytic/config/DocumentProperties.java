package com.acadlytic.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuration properties for document management and physical storage (ADR-11, ADR-16).
 */
@Configuration
@ConfigurationProperties(prefix = "acadlytic.documents")
public class DocumentProperties {

    private static final Logger log = LoggerFactory.getLogger(DocumentProperties.class);

    private String storageDir = "./storage/documents";
    private long maxFileSizeBytes = 10L * 1024 * 1024; // 10 MB
    private int maxActiveDocsPerRevision = 5;

    private Path normalizedStoragePath;

    @PostConstruct
    public void validateStoragePath() throws IOException {
        Path path = Paths.get(storageDir).toAbsolutePath().normalize();
        String pathStr = path.toString().replace('\\', '/').toLowerCase();

        // Enforce storage outside webroot and classpath source/classes
        if (pathStr.contains("/src/main/resources")
                || pathStr.contains("/src/main/webapp")
                || pathStr.contains("/target/classes")
                || pathStr.contains("/frontend/dist")
                || pathStr.contains("/frontend/public")) {
            throw new IllegalStateException(
                    "CRITICAL SECURITY HAZARD: Document storage directory must be outside webroot and source trees: " + path);
        }

        if (!Files.exists(path)) {
            Files.createDirectories(path);
            log.info("Created document storage directory: {}", path);
        }

        try {
            Path probe = Files.createTempFile(path, ".probe", ".tmp");
            Files.deleteIfExists(probe);
        } catch (Exception e) {
            throw new IllegalStateException("Document storage directory is not writable: " + path, e);
        }

        this.normalizedStoragePath = path;
        log.info("Initialized secure document storage path: {}", this.normalizedStoragePath);
    }

    public String getStorageDir() {
        return storageDir;
    }

    public void setStorageDir(String storageDir) {
        this.storageDir = storageDir;
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public void setMaxFileSizeBytes(long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public int getMaxActiveDocsPerRevision() {
        return maxActiveDocsPerRevision;
    }

    public void setMaxActiveDocsPerRevision(int maxActiveDocsPerRevision) {
        this.maxActiveDocsPerRevision = maxActiveDocsPerRevision;
    }

    public Path getNormalizedStoragePath() {
        return normalizedStoragePath != null ? normalizedStoragePath : Paths.get(storageDir).toAbsolutePath().normalize();
    }
}
