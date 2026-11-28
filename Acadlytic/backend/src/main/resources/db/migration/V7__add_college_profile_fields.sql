-- ==============================================================================
-- Acadlytic Phase 04 Module 4.1 Schema Migration & Authoritative Backfill
-- Version: V7__add_college_profile_fields.sql
-- Description:
--   Step 1: Add operational profile columns to colleges table (DDL)
--   Step 2: Authoritative single-revision data backfill from approved registrations (DML)
-- Note: Pre-migration validation is executed via
--       V7CollegeProfileMigrationPreflightCallback (Event.BEFORE_EACH_MIGRATE).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Step 1: Add 13 nullable operational profile columns to colleges table (DDL)
-- ------------------------------------------------------------------------------
ALTER TABLE colleges
    ADD COLUMN address_line1 VARCHAR(255) NULL,
    ADD COLUMN address_line2 VARCHAR(255) NULL,
    ADD COLUMN city VARCHAR(100) NULL,
    ADD COLUMN state VARCHAR(100) NULL,
    ADD COLUMN country VARCHAR(100) NULL,
    ADD COLUMN postal_code VARCHAR(30) NULL,
    ADD COLUMN contact_phone VARCHAR(50) NULL,
    ADD COLUMN contact_email VARCHAR(255) NULL,
    ADD COLUMN website_url VARCHAR(255) NULL,
    ADD COLUMN affiliated_university_name VARCHAR(255) NULL,
    ADD COLUMN established_year INT NULL,
    ADD COLUMN accreditation_details VARCHAR(255) NULL,
    ADD COLUMN logo_storage_key VARCHAR(255) NULL;

-- ------------------------------------------------------------------------------
-- Step 2: Authoritative Single-Revision Data Backfill (DML)
-- Strictly updates approved colleges from their verified authoritative approved revision
-- when and only when all 13 target profile columns are currently NULL
-- ------------------------------------------------------------------------------
UPDATE colleges c
JOIN college_registrations cr 
  ON c.current_registration_id = cr.id
SET 
    c.address_line1 = cr.address_line1,
    c.address_line2 = cr.address_line2,
    c.city = cr.city,
    c.state = cr.state,
    c.country = cr.country,
    c.postal_code = cr.postal_code,
    c.contact_phone = cr.contact_phone,
    c.website_url = cr.website_url,
    c.affiliated_university_name = cr.affiliated_university_name,
    c.contact_email = NULL,
    c.established_year = NULL,
    c.accreditation_details = NULL,
    c.logo_storage_key = NULL
WHERE c.approval_status = 'APPROVED'
  AND cr.college_id = c.id
  AND cr.status = 'APPROVED'
  -- Complete 13-Column All-Null Defensive Safeguard Predicate
  AND c.address_line1 IS NULL
  AND c.address_line2 IS NULL
  AND c.city IS NULL
  AND c.state IS NULL
  AND c.country IS NULL
  AND c.postal_code IS NULL
  AND c.contact_phone IS NULL
  AND c.contact_email IS NULL
  AND c.website_url IS NULL
  AND c.affiliated_university_name IS NULL
  AND c.established_year IS NULL
  AND c.accreditation_details IS NULL
  AND c.logo_storage_key IS NULL;
