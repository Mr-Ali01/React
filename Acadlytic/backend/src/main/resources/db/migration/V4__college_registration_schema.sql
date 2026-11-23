-- ==============================================================================
-- Acadlytic Phase 03 College Registration & Approval Foundation Schema
-- Version: V4__college_registration_schema.sql
-- Description:
--   - college_registrations table for versioned application revisions
--   - college_registration_documents table for immutable uploaded verification documents
--   - colleges table alterations (current_registration_id, resubmission_count, action_required_count)
-- ==============================================================================

CREATE TABLE college_registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    legal_name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(30) NOT NULL,
    website_url VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NOT NULL,
    affiliated_university_name VARCHAR(255) NOT NULL,
    submitted_for_review_at TIMESTAMP NULL,
    reviewer_user_id BIGINT NULL,
    review_notes TEXT NULL,
    rejection_reason TEXT NULL,
    is_permanent_rejection BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_college_registrations_college_id FOREIGN KEY (college_id) REFERENCES colleges (id),
    CONSTRAINT fk_college_registrations_reviewer_user_id FOREIGN KEY (reviewer_user_id) REFERENCES users (id),
    CONSTRAINT uq_college_registrations_version UNIQUE (college_id, version_number),
    CONSTRAINT chk_college_registrations_status CHECK (
        status IN ('PENDING', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED')
    ),
    CONSTRAINT chk_college_registrations_version CHECK (version_number > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_college_registrations_status_submitted ON college_registrations (status, submitted_for_review_at);
CREATE INDEX idx_college_registrations_college_version ON college_registrations (college_id, version_number);

CREATE TABLE college_registration_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id BIGINT NOT NULL,
    registration_id BIGINT NOT NULL,
    document_category VARCHAR(60) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum CHAR(64) NOT NULL,
    replaces_document_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crd_college_id FOREIGN KEY (college_id) REFERENCES colleges (id),
    CONSTRAINT fk_crd_registration_id FOREIGN KEY (registration_id) REFERENCES college_registrations (id),
    CONSTRAINT fk_crd_replaces_document_id FOREIGN KEY (replaces_document_id) REFERENCES college_registration_documents (id),
    CONSTRAINT uq_crd_storage_key UNIQUE (storage_key),
    CONSTRAINT chk_crd_category CHECK (
        document_category IN (
            'UNIVERSITY_AFFILIATION_CERTIFICATE',
            'AUTHORIZED_SIGNATORY_ID',
            'INSTITUTION_REGISTRATION_PROOF',
            'ADDITIONAL_SUPPORTING_DOCUMENT'
        )
    ),
    CONSTRAINT chk_crd_file_size CHECK (file_size_bytes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_crd_college_registration ON college_registration_documents (college_id, registration_id);
CREATE INDEX idx_crd_registration_id ON college_registration_documents (registration_id);

ALTER TABLE colleges
    ADD COLUMN current_registration_id BIGINT NULL,
    ADD COLUMN resubmission_count INT NOT NULL DEFAULT 0,
    ADD COLUMN action_required_count INT NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_colleges_current_registration_id FOREIGN KEY (current_registration_id) REFERENCES college_registrations (id),
    ADD CONSTRAINT chk_colleges_resubmission_count CHECK (resubmission_count >= 0),
    ADD CONSTRAINT chk_colleges_action_required_count CHECK (action_required_count >= 0);
