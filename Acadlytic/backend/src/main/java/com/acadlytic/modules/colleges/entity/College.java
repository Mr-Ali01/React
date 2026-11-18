package com.acadlytic.modules.colleges.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;

/**
 * Minimal Phase 02 tenant foundation entity for colleges.
 * Extensible by Phase 03 (College Registration & Approval) and Phase 04 (College Management)
 * without requiring schema redesign.
 */
@Entity
@Table(name = "colleges")
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 30)
    private CollegeApprovalStatus approvalStatus = CollegeApprovalStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private CollegeStatus status = CollegeStatus.PENDING_VERIFICATION;

    @Column(name = "permanently_rejected", nullable = false)
    private boolean permanentlyRejected = false;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isManagementUnlocked() {
        return !permanentlyRejected
                && archivedAt == null
                && approvalStatus == CollegeApprovalStatus.APPROVED
                && status == CollegeStatus.ACTIVE;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public CollegeApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(CollegeApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public CollegeStatus getStatus() {
        return status;
    }

    public void setStatus(CollegeStatus status) {
        this.status = status;
    }

    public boolean isPermanentlyRejected() {
        return permanentlyRejected;
    }

    public void setPermanentlyRejected(boolean permanentlyRejected) {
        this.permanentlyRejected = permanentlyRejected;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
