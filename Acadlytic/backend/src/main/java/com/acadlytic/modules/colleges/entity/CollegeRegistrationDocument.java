package com.acadlytic.modules.colleges.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;

/**
 * Immutable verification document entity (ADR-11).
 * Linked to a specific college and registration revision.
 * Files are stored outside webroot using random UUID storage keys.
 */
@Entity
@Table(name = "college_registration_documents")
public class CollegeRegistrationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "college_id", nullable = false)
    private Long collegeId;

    @Column(name = "registration_id", nullable = false)
    private Long registrationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_category", nullable = false, length = 60)
    private DocumentCategory documentCategory;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "storage_key", nullable = false, length = 100, unique = true)
    private String storageKey;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "sha256_checksum", nullable = false, length = 64, columnDefinition = "CHAR(64)")
    private String sha256Checksum;

    @Column(name = "replaces_document_id")
    private Long replacesDocumentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "file_purged_at")
    private Instant filePurgedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    private DocumentVerificationStatus verificationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_provenance", nullable = false, length = 40)
    private DocumentVerificationProvenance verificationProvenance;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "last_reviewed_by_user_id")
    private Long lastReviewedByUserId;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "source_document_id")
    private Long sourceDocumentId;

    @Column(name = "source_registration_id")
    private Long sourceRegistrationId;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.verificationStatus == null) {
            this.verificationStatus = DocumentVerificationStatus.PENDING;
        }
        if (this.verificationProvenance == null) {
            this.verificationProvenance = DocumentVerificationProvenance.NOT_REVIEWED;
        }
        if (this.version == null) {
            this.version = 0L;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCollegeId() {
        return collegeId;
    }

    public void setCollegeId(Long collegeId) {
        this.collegeId = collegeId;
    }

    public Long getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Long registrationId) {
        this.registrationId = registrationId;
    }

    public DocumentCategory getDocumentCategory() {
        return documentCategory;
    }

    public void setDocumentCategory(DocumentCategory documentCategory) {
        this.documentCategory = documentCategory;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getSha256Checksum() {
        return sha256Checksum;
    }

    public void setSha256Checksum(String sha256Checksum) {
        this.sha256Checksum = sha256Checksum;
    }

    public Long getReplacesDocumentId() {
        return replacesDocumentId;
    }

    public void setReplacesDocumentId(Long replacesDocumentId) {
        this.replacesDocumentId = replacesDocumentId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getFilePurgedAt() {
        return filePurgedAt;
    }

    public void setFilePurgedAt(Instant filePurgedAt) {
        this.filePurgedAt = filePurgedAt;
    }

    public DocumentVerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(DocumentVerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public DocumentVerificationProvenance getVerificationProvenance() {
        return verificationProvenance;
    }

    public void setVerificationProvenance(DocumentVerificationProvenance verificationProvenance) {
        this.verificationProvenance = verificationProvenance;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Long getLastReviewedByUserId() {
        return lastReviewedByUserId;
    }

    public void setLastReviewedByUserId(Long lastReviewedByUserId) {
        this.lastReviewedByUserId = lastReviewedByUserId;
    }

    public Instant getLastReviewedAt() {
        return lastReviewedAt;
    }

    public void setLastReviewedAt(Instant lastReviewedAt) {
        this.lastReviewedAt = lastReviewedAt;
    }

    public Long getSourceDocumentId() {
        return sourceDocumentId;
    }

    public void setSourceDocumentId(Long sourceDocumentId) {
        this.sourceDocumentId = sourceDocumentId;
    }

    public Long getSourceRegistrationId() {
        return sourceRegistrationId;
    }

    public void setSourceRegistrationId(Long sourceRegistrationId) {
        this.sourceRegistrationId = sourceRegistrationId;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
