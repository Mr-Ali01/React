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

    @Column(name = "current_registration_id")
    private Long currentRegistrationId;

    @Column(name = "resubmission_count", nullable = false)
    private int resubmissionCount = 0;

    @Column(name = "action_required_count", nullable = false)
    private int actionRequiredCount = 0;

    @Column(name = "archived_at")
    private Instant archivedAt;

    // --- Operational Profile Fields (Phase 04 Module 4.1) ---

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "postal_code", length = 30)
    private String postalCode;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "website_url", length = 255)
    private String websiteUrl;

    @Column(name = "affiliated_university_name", length = 255)
    private String affiliatedUniversityName;

    @Column(name = "established_year")
    private Integer establishedYear;

    @Column(name = "accreditation_details", length = 255)
    private String accreditationDetails;

    @Column(name = "logo_storage_key", length = 255)
    private String logoStorageKey;

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

    public Long getCurrentRegistrationId() {
        return currentRegistrationId;
    }

    public void setCurrentRegistrationId(Long currentRegistrationId) {
        this.currentRegistrationId = currentRegistrationId;
    }

    public int getResubmissionCount() {
        return resubmissionCount;
    }

    public void setResubmissionCount(int resubmissionCount) {
        this.resubmissionCount = resubmissionCount;
    }

    public int getActionRequiredCount() {
        return actionRequiredCount;
    }

    public void setActionRequiredCount(int actionRequiredCount) {
        this.actionRequiredCount = actionRequiredCount;
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

    public String getAddressLine1() {
        return addressLine1;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }

    public String getAffiliatedUniversityName() {
        return affiliatedUniversityName;
    }

    public void setAffiliatedUniversityName(String affiliatedUniversityName) {
        this.affiliatedUniversityName = affiliatedUniversityName;
    }

    public Integer getEstablishedYear() {
        return establishedYear;
    }

    public void setEstablishedYear(Integer establishedYear) {
        this.establishedYear = establishedYear;
    }

    public String getAccreditationDetails() {
        return accreditationDetails;
    }

    public void setAccreditationDetails(String accreditationDetails) {
        this.accreditationDetails = accreditationDetails;
    }

    public String getLogoStorageKey() {
        return logoStorageKey;
    }

    public void setLogoStorageKey(String logoStorageKey) {
        this.logoStorageKey = logoStorageKey;
    }
}
