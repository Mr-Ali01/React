-- ==============================================================================
-- Acadlytic Phase 03 Module 3.6A Document-Level Review Migration
-- Version: V6__document_level_review.sql
-- Description:
--   - Step 1: Add verification, provenance, review, tracking, and concurrency columns
--   - Step 2: Backfill legacy document verification states for exactly 8 approved tuples
--   - Step 3: Add composite ownership, source document tracking, and replacement constraints
--   - Step 4: Create append-only college_document_reviews audit history table
--   - Step 5: Create MySQL 8 triggers enforcing strictly append-only behavior on reviews
-- Note: Pre-migration legacy data validation is executed prior to this script via
--       Flyway Callback V6DocumentReviewMigrationPreflightCallback (Event.BEFORE_EACH_MIGRATE),
--       guaranteeing zero schema mutations and zero persistent stored routines upon validation failure.
-- ==============================================================================

-- 1. Add verification, provenance, review, tracking, and optimistic concurrency columns
ALTER TABLE college_registration_documents
    ADD COLUMN verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN verification_provenance VARCHAR(40) NOT NULL DEFAULT 'NOT_REVIEWED',
    ADD COLUMN rejection_reason TEXT NULL,
    ADD COLUMN last_reviewed_by_user_id BIGINT NULL,
    ADD COLUMN last_reviewed_at TIMESTAMP NULL,
    ADD COLUMN source_document_id BIGINT NULL,
    ADD COLUMN source_registration_id BIGINT NULL,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- 2. Legacy Data Backfill (Preserves Historical Truth with Exact 8-Tuple Whitelist)
-- Exactly 8 supported tuples receive backfill attribution:
--   - (APPROVED, APPROVED) -> ACCEPTED + LEGACY_COLLEGE_APPROVAL
--   - 7 unreviewed tuples  -> PENDING + NOT_REVIEWED
-- Any unknown, orphaned, or corrupted state receives 'UNKNOWN_STATE_FAIL' sentinel values,
-- which immediately triggers failure on the subsequent chk_crd_verification_status constraint.
UPDATE college_registration_documents crd
LEFT JOIN college_registrations cr ON crd.registration_id = cr.id AND crd.college_id = cr.college_id
LEFT JOIN colleges c ON crd.college_id = c.id
SET 
    crd.verification_status = CASE 
        WHEN c.approval_status = 'APPROVED' AND cr.status = 'APPROVED' THEN 'ACCEPTED'
        WHEN (c.approval_status = 'APPROVED' AND cr.status = 'ACTION_REQUIRED')
          OR (c.approval_status = 'APPROVED' AND cr.status = 'REJECTED')
          OR (c.approval_status = 'PENDING' AND cr.status = 'PENDING')
          OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'ACTION_REQUIRED')
          OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'PENDING')
          OR (c.approval_status = 'REJECTED' AND cr.status = 'REJECTED')
          OR (c.approval_status = 'REJECTED' AND cr.status = 'PENDING') THEN 'PENDING'
        ELSE 'UNKNOWN_STATE_FAIL'
    END,
    crd.verification_provenance = CASE 
        WHEN c.approval_status = 'APPROVED' AND cr.status = 'APPROVED' THEN 'LEGACY_COLLEGE_APPROVAL'
        WHEN (c.approval_status = 'APPROVED' AND cr.status = 'ACTION_REQUIRED')
          OR (c.approval_status = 'APPROVED' AND cr.status = 'REJECTED')
          OR (c.approval_status = 'PENDING' AND cr.status = 'PENDING')
          OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'ACTION_REQUIRED')
          OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'PENDING')
          OR (c.approval_status = 'REJECTED' AND cr.status = 'REJECTED')
          OR (c.approval_status = 'REJECTED' AND cr.status = 'PENDING') THEN 'NOT_REVIEWED'
        ELSE 'UNKNOWN_STATE_FAIL'
    END,
    crd.rejection_reason = NULL,
    crd.last_reviewed_by_user_id = NULL,
    crd.last_reviewed_at = NULL;

-- 3. Composite uniqueness and foreign key constraints on college_registration_documents
-- A document must be uniquely identifiable by (college_id, registration_id, id) for composite FK references
ALTER TABLE college_registration_documents
    ADD CONSTRAINT uq_crd_college_reg_doc UNIQUE (college_id, registration_id, id);

-- Foreign key for reviewer user reference
ALTER TABLE college_registration_documents
    ADD CONSTRAINT fk_crd_last_reviewed_by FOREIGN KEY (last_reviewed_by_user_id) REFERENCES users (id);

-- Composite foreign key for carried-forward source document tracking
ALTER TABLE college_registration_documents
    ADD CONSTRAINT fk_crd_source_document_composite
        FOREIGN KEY (college_id, source_registration_id, source_document_id)
        REFERENCES college_registration_documents (college_id, registration_id, id)
        ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Enforce that replacement documents are unique per target document within a registration revision
ALTER TABLE college_registration_documents
    ADD CONSTRAINT uq_crd_registration_replacement UNIQUE (registration_id, replaces_document_id);

-- Check constraints for valid statuses, provenances, and source pair atomicity
ALTER TABLE college_registration_documents
    ADD CONSTRAINT chk_crd_verification_status CHECK (
        verification_status IN ('PENDING', 'ACCEPTED', 'REJECTED')
    ),
    ADD CONSTRAINT chk_crd_verification_provenance CHECK (
        verification_provenance IN ('NOT_REVIEWED', 'DIRECT_REVIEW', 'CARRIED_FORWARD', 'LEGACY_COLLEGE_APPROVAL')
    ),
    ADD CONSTRAINT chk_crd_source_pair CHECK (
        (source_document_id IS NULL AND source_registration_id IS NULL)
        OR (source_document_id IS NOT NULL AND source_registration_id IS NOT NULL)
    );

-- Indexes for performance
CREATE INDEX idx_crd_verification_status ON college_registration_documents (verification_status);
CREATE INDEX idx_crd_source_doc ON college_registration_documents (source_document_id);
CREATE INDEX idx_crd_last_reviewed_by ON college_registration_documents (last_reviewed_by_user_id);

-- 4. Document Review History Table (college_document_reviews)
CREATE TABLE college_document_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id BIGINT NOT NULL,
    registration_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    action VARCHAR(30) NOT NULL,
    rejection_reason TEXT NULL,
    reviewer_user_id BIGINT NOT NULL,
    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cdr_reviewer_user_id FOREIGN KEY (reviewer_user_id) REFERENCES users (id),
    CONSTRAINT fk_cdr_document_composite FOREIGN KEY (college_id, registration_id, document_id)
        REFERENCES college_registration_documents (college_id, registration_id, id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_cdr_action CHECK (action IN ('ACCEPTED', 'REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cdr_doc_reviewed ON college_document_reviews (document_id, reviewed_at DESC);
CREATE INDEX idx_cdr_college_reg ON college_document_reviews (college_id, registration_id);
CREATE INDEX idx_cdr_reviewer ON college_document_reviews (reviewer_user_id);

-- 5. Append-only triggers to reject UPDATE and DELETE operations
CREATE TRIGGER trg_cdr_prevent_update
BEFORE UPDATE ON college_document_reviews
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'college_document_reviews is append-only: UPDATE operations are strictly prohibited.';

CREATE TRIGGER trg_cdr_prevent_delete
BEFORE DELETE ON college_document_reviews
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'college_document_reviews is append-only: DELETE operations are strictly prohibited.';
