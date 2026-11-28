# Acadlytic — Module 4.1 Detailed Implementation Plan v1.0

**Module:** 4.1 — College Operational Profile & Schema Foundation  
**Phase:** 04 — College Management (Tenant Management & Profile)  
**Parent Epic:** Epic E2 — Tenant Management & Profile  
**Approved Phase Plan Reference:** `docs/04-phase/Acadlytic_Phase_04_Final_Module_Breakdown_and_Dependency_Plan_v1.2.md`  
**Master Context Reference:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`  
**Planning Status:** PROPOSED DETAILED PLAN (PENDING DEVELOPER APPROVAL)  
**Implementation Status:** NOT_STARTED  
**Author:** Antigravity AI Assistant  
**Date:** 2026-11-28  

---

## 1. Executive Summary

Module 4.1 establishes the foundational database schema, JPA entity model, historical data migration, and approval lifecycle synchronization for tenant management in **Phase 04 — College Management (Tenant Management & Profile)**.

### Core Deliverables of Module 4.1
1. **Flyway V7 Schema Migration (`V7__add_college_profile_fields.sql`):** Extends the `colleges` relational table with 13 nullable operational profile columns and integrity check constraints.
2. **Flyway Preflight Validation Callback (`V7CollegeProfileMigrationPreflightCallback.java`):** Inspects the database prior to migration execution to audit legacy approved colleges, validate authoritative registration references, and safely exclude ambiguous or partially populated records.
3. **JPA Entity Extension (`College.java`):** Maps the 13 new operational profile attributes into the `College` entity while maintaining optimistic locking (`@Version`) and tenant isolation semantics.
4. **Single Authoritative Revision Backfill:** Safely populates operational profile attributes for existing approved colleges strictly from a single verified, approved `college_registrations` row referenced by `colleges.current_registration_id`.
5. **Approval Lifecycle Profile Synchronization (`CollegeLifecycleService.java#onCollegeApproved`):** Updates the Phase 03 approval lifecycle hook to synchronously copy profile fields from the approved `CollegeRegistration` revision into `College` within the caller's database transaction.
6. **Comprehensive MySQL Testcontainers Test Suite:** Verifies schema migration, preflight callback handling, single-revision backfill, idempotent re-execution, partial-data protection, and approval lifecycle synchronization against real MySQL 8.0.36 Testcontainers.

### Strict Boundary Statement
Module 4.1 is strictly a **Database and Backend Entity Foundation** module. It does **not** expose user-facing REST controllers, author frontend pages or UI components, or implement Module 4.2 / 4.3 API endpoints.

---

## 2. Inspected Files and Verified Baseline

The technical details in this plan were established through direct inspection of the codebase:

### 2.1 Entity and Repository Baseline
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java`:
  - Contains core institutional fields: `id`, `name`, `code`, `approvalStatus` (`CollegeApprovalStatus`), `status` (`CollegeStatus`), `permanentlyRejected` (`boolean`), `currentRegistrationId` (`Long`), `resubmissionCount` (`int`), `actionRequiredCount` (`int`), `archivedAt` (`Instant`), `@Version Long version`, `createdAt`, `updatedAt`.
  - Currently lacks all operational profile attributes (address, contact channels, website, university, accreditation, established year, logo key).
- `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRepository.java`:
  - Contains `findByCode`, `existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull`, `findByIdWithLock` (pessimistic write lock with 3000ms timeout), and lifecycle cleanup queries.
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistration.java`:
  - Represents versioned onboarding applications. Holds source operational fields: `legalName` (NOT NULL), `addressLine1` (NOT NULL), `addressLine2` (NULL), `city` (NOT NULL), `state` (NOT NULL), `country` (NOT NULL), `postalCode` (NOT NULL), `contactPhone` (NOT NULL), `websiteUrl` (NULL), `affiliatedUniversityName` (NOT NULL), `status` (`CollegeApprovalStatus`), `versionNumber` (`int`).
  - Does **not** contain `contact_email`, `established_year`, `accreditation_details`, or `logo_storage_key`.
- `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationRepository.java`:
  - Standard JPA repository for versioned registrations with `findByCollegeId`, `findByCollegeIdAndVersionNumber`, and `findLatestByCollegeId`.

### 2.2 Lifecycle and Review Services
- `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeLifecycleService.java`:
  - Method `onCollegeApproved(College college, CollegeRegistration submittedRevision, User adminUser, Long reviewerUserId, Role reviewerRole)` is annotated with `@Transactional(propagation = Propagation.REQUIRED)`.
  - Currently sets `college.setStatus(CollegeStatus.ACTIVE)`, saves the college, logs `AuditEventType.COLLEGE_ACTIVATED`, and enqueues `COLLEGE_REGISTRATION_APPROVED` in `outbox_emails`.
- `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java`:
  - In `processDecision` (lines 640–658), executes under `@Transactional`.
  - `case APPROVE` updates `submittedRevision.setStatus(APPROVED)`, updates `college.setApprovalStatus(APPROVED)`, records an audit event, and calls `collegeLifecycleService.onCollegeApproved(college, submittedRevision, proposedAdmin, reviewerUserId, reviewerRole)`.
  - Transaction boundary: The caller transaction encompasses revision update, college approval, lifecycle activation, outbox email enqueueing, and audit logging.

### 2.3 Flyway Migrations and Callbacks
- Flyway migrations active: `V1__init_schema.sql` through `V6__document_level_review.sql`.
- Migration `V3__auth_core_schema.sql`: Created `colleges` with `name`, `code`, `approval_status`, `status`, `permanently_rejected`, `version`.
- Migration `V4__college_registration_schema.sql`: Created `college_registrations`, `college_registration_documents`, and added `current_registration_id`, `resubmission_count`, `action_required_count` to `colleges`.
- Migration `V6__document_level_review.sql` & `V6DocumentReviewMigrationPreflightCallback.java`: Established the precedent for pre-migration validation via Spring-managed Flyway `Callback` listening to `Event.BEFORE_EACH_MIGRATE`.

### 2.4 Existing Integration Tests
- `V6DocumentLevelReviewMigrationTest.java`: Demonstrates robust Testcontainers MySQL 8.0.36 migration testing using `JdbcTemplate` and Spring context.
- `CollegeApprovalIntegrationTest.java` & `CollegeLifecycleIntegrationTest.java`: Verify approval gates, locking, rollback behavior, and outbox invariants.

---

## 3. Proposed Database Schema (Flyway V7)

### 3.1 Migration File Metadata
- **File Name:** `V7__add_college_profile_fields.sql`
- **Location:** `backend/src/main/resources/db/migration/`
- **Target Table:** `colleges`

### 3.2 Exact Proposed Column Specifications

```sql
-- ==============================================================================
-- Acadlytic Phase 04 Module 4.1 Schema Migration
-- Version: V7__add_college_profile_fields.sql
-- Description:
--   1. Add operational profile columns and check constraints to colleges
--   2. Authoritative single-revision backfill from approved college_registrations
-- Note: Pre-migration legacy validation is executed via
--       V7CollegeProfileMigrationPreflightCallback (Event.BEFORE_EACH_MIGRATE).
-- ==============================================================================

-- 1. Add operational profile columns to colleges table
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
    ADD COLUMN logo_storage_key VARCHAR(100) NULL,
    ADD CONSTRAINT chk_colleges_established_year 
        CHECK (established_year IS NULL OR (established_year >= 1800 AND established_year <= 2100));

-- 2. Performance indexes for operational directory search (Module 4.2 preparatory)
CREATE INDEX idx_colleges_city ON colleges (city);
CREATE INDEX idx_colleges_state ON colleges (state);
```

### 3.3 Column Design & MySQL 8 Compatibility Notes
1. **Nullability:** Every new column is strictly `NULL`able.
   - *Reason:* Existing test and prospective colleges (`PENDING`, `ACTION_REQUIRED`, `REJECTED`) do not possess operational profiles. Enforcing `NOT NULL` at the database level would violate schema non-destructiveness and break onboarding. Application-level validation in Module 4.3 enforces mandatory fields during update workflows.
2. **Character Set and Collation:** Inherits table-level `utf8mb4 COLLATE utf8mb4_unicode_ci` from `V3__auth_core_schema.sql`.
3. **Data Types:** Match exact lengths from `college_registrations` (`address_line1` 255, `city` 100, `state` 100, `country` 100, `postal_code` 30, `contact_phone` 50, `website_url` 255, `affiliated_university_name` 255).
4. **Check Constraints:** `chk_colleges_established_year` bounds established years between 1800 and 2100 when non-null.

---

## 4. Authoritative Registration Revision Backfill

### 4.1 Backfill Principles and Invariants
1. **Single Authoritative Revision:** Each approved college is backfilled exclusively from **one** authoritative approved registration revision. Fields from different historical revisions must **never** be combined.
2. **Three-Point Integrity Condition:** A registration revision `cr` is considered authoritative for college `c` if and only if all three conditions are satisfied:
   $$\text{cr.id} = \text{c.current\_registration\_id} \quad \land \quad \text{cr.college\_id} = \text{c.id} \quad \land \quad \text{cr.status} = \text{'APPROVED'}$$
3. **No Guessing of Latest Revision:** If `c.current_registration_id` is missing or points to a non-approved/mismatched revision, the migration does **not** heuristically pick the revision with the highest `version_number`. The college is excluded from automatic backfill.
4. **Non-Destructive Execution:** The backfill query checks `c.address_line1 IS NULL AND c.city IS NULL AND c.contact_phone IS NULL`, ensuring valid existing profile data is never overwritten.
5. **Decoupled Institutional Contact Email:** `colleges.contact_email` is explicitly **set to NULL** (not copied from `users.email`).
6. **Unapproved Colleges Untouched:** Colleges with `approval_status != 'APPROVED'` remain with `NULL` operational profile fields.

### 4.2 Investigation and Resolution of Partial-Data Profiles
A critical question raised during Phase 04 planning:
> *If a profile is partially populated (e.g. `address_line1` is non-null, but `city` is null), checking only `c.address_line1 IS NULL` skips backfill, while using `COALESCE` risks merging fields across revisions.*

#### Recommended Strategy
1. **Detection in Preflight:** The preflight callback queries for any approved college where some core profile fields are non-null while others are null:
   $$\text{EXISTS } (c) \text{ WHERE } c.\text{approval\_status} = \text{'APPROVED'} \land (c.\text{address\_line1 IS NOT NULL}) \ne (c.\text{city IS NOT NULL})$$
2. **Exclusion from Automatic Backfill:** If an approved college has a partially populated profile, it is **excluded** from the automated SQL backfill.
3. **Safety Guarantee:** Backfill operates as an atomic, all-or-nothing transfer:
   - If the profile is completely unpopulated (`address_line1 IS NULL AND city IS NULL AND contact_phone IS NULL`), backfill populates all fields from the authoritative revision.
   - If the profile is already populated (or partially populated), automated backfill skips it, avoiding any overwrite or Frankenstein data combinations.
   - Diagnostic logging in the preflight callback alerts administrators to any partially populated colleges requiring manual reconciliation.

### 4.3 Backfill SQL Implementation

```sql
-- 3. Authoritative Single-Revision Data Backfill
-- Strictly updates approved colleges from their verified authoritative approved revision
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
  AND c.address_line1 IS NULL
  AND c.city IS NULL
  AND c.contact_phone IS NULL;
```

---

## 5. Preflight Validation and Post-Migration Reconciliation

### 5.1 Flyway Callback Architecture (`V7CollegeProfileMigrationPreflightCallback.java`)
- **Package:** `com.acadlytic.modules.colleges.migration`
- **Interface:** `org.flywaydb.core.api.callback.Callback`
- **Spring Integration:** Annotated with `@Component`. In Spring Boot 3.3.4, Spring automatically discovers all `Callback` beans and registers them with Flyway.
- **Events Handled:**
  - `Event.BEFORE_EACH_MIGRATE`: Executes preflight integrity checks specifically when `info.getVersion().getVersion().equals("7")`.
  - `Event.AFTER_EACH_MIGRATE`: Executes post-migration reconciliation and logs backfill metrics.

### 5.2 Preflight Validation Checks (`BEFORE_EACH_MIGRATE`)
The preflight callback executes three specific audits:

1. **Audit 1: Approved Colleges with Invalid or Mismatched Revision Pointers**
   ```sql
   SELECT c.id, c.code, c.current_registration_id, cr.college_id, cr.status
   FROM colleges c
   LEFT JOIN college_registrations cr ON c.current_registration_id = cr.id
   WHERE c.approval_status = 'APPROVED'
     AND (
         c.current_registration_id IS NULL
         OR cr.id IS NULL
         OR cr.college_id != c.id
         OR cr.status != 'APPROVED'
     );
   ```
   *Behavior:* Any matching row is logged as a warning (`WARN`) with exact diagnostic details. These records will be safely skipped by the backfill query. If strict validation mode is enabled (`acadlytic.migration.strict-preflight = true`), the callback throws `FlywayException` to halt deployment before any schema change.

2. **Audit 2: Partially Populated Operational Profiles**
   ```sql
   SELECT c.id, c.code
   FROM colleges c
   WHERE c.approval_status = 'APPROVED'
     AND (
         (c.address_line1 IS NOT NULL AND c.city IS NULL)
         OR (c.address_line1 IS NULL AND c.city IS NOT NULL)
     );
   ```
   *Behavior:* Logs diagnostics for any anomalies and ensures automated backfill will not corrupt existing partial data.

3. **Audit 3: Target Column Collision Check**
   Verifies via `information_schema.COLUMNS` whether any V7 columns already exist on `colleges` before attempting `ALTER TABLE`.

### 5.3 Post-Migration Reconciliation (`AFTER_EACH_MIGRATE`)
Upon successful execution of `V7__add_college_profile_fields.sql`:
1. Queries total approved colleges: `SELECT COUNT(*) FROM colleges WHERE approval_status = 'APPROVED'`.
2. Queries total backfilled colleges: `SELECT COUNT(*) FROM colleges WHERE approval_status = 'APPROVED' AND address_line1 IS NOT NULL`.
3. Asserts zero modifications to unapproved colleges:
   `SELECT COUNT(*) FROM colleges WHERE approval_status != 'APPROVED' AND address_line1 IS NOT NULL` must equal 0.
4. Emits structured log summarizing migration and backfill metrics:
   ```
   [INFO] V7 Migration Reconciliation Complete:
          Total Approved Colleges: 5
          Successfully Backfilled: 5
          Excluded / Ambiguous:    0
          Unapproved Mod Check:    0 (PASS)
   ```

---

## 6. Migration Recovery and Rollback Strategy

The recovery approach is strictly partitioned into three operational deployment scenarios:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MIGRATION RECOVERY STRATEGY                       │
├────────────────────────┬───────────────────────┬───────────────────────┤
│       SCENARIO 1       │      SCENARIO 2       │      SCENARIO 3       │
│   Deployment Failure   │ Pre-Operational Abort │ Post-Operational Edit │
├────────────────────────┼───────────────────────┼───────────────────────┤
│ Flyway halts execution │ V7 applied, but code  │ Users have entered    │
│ Zero partial schema    │ release is rolled back│ operational data      │
│ Action: flyway repair, │ Action: Leave columns │ Action: FORBID DROP!  │
│ fix script, re-deploy  │ or run clean down-DDL │ Forward-fix (V8) only │
└────────────────────────┴───────────────────────┴───────────────────────┘
```

### Scenario 1: Flyway Migration Fails During Deployment
- **Trigger:** Preflight callback validation failure, DDL syntax error, or lock acquisition timeout.
- **State:** MySQL DDL statement fails; Flyway records a failed entry in `flyway_schema_history`; Spring Boot startup halts.
- **Recovery Procedure:**
  1. Inspect startup logs for preflight validation warnings or SQL error codes.
  2. Resolve underlying data inconsistency or configuration issue.
  3. Execute `flyway.repair()` (or Maven `mvn flyway:repair`) to remove the failed migration record.
  4. Re-run application startup.

### Scenario 2: Migration Succeeds, Release Rolled Back BEFORE Operational Edits
- **Trigger:** Application rollback triggered by an unrelated issue (e.g., auth defect or frontend regression) before any operational profile edits have been submitted.
- **State:** V7 columns exist in `colleges`, backfilled with data from `college_registrations`.
- **Recovery Options:**
  - *Option A (Recommended — Non-Destructive):* Leave V7 columns in the database. Because all V7 columns are nullable and default to `NULL`, Phase 01–03 code ignores them completely. Prior releases run without errors against the V7 schema.
  - *Option B (Clean Schema Reset):* If strict V6 schema parity is required, execute a compensating down-migration script:
    ```sql
    ALTER TABLE colleges
        DROP COLUMN address_line1,
        DROP COLUMN address_line2,
        DROP COLUMN city,
        DROP COLUMN state,
        DROP COLUMN country,
        DROP COLUMN postal_code,
        DROP COLUMN contact_phone,
        DROP COLUMN contact_email,
        DROP COLUMN website_url,
        DROP COLUMN affiliated_university_name,
        DROP COLUMN established_year,
        DROP COLUMN accreditation_details,
        DROP COLUMN logo_storage_key,
        DROP INDEX idx_colleges_city,
        DROP INDEX idx_colleges_state,
        DROP CHECK chk_colleges_established_year;
    DELETE FROM flyway_schema_history WHERE version = '7';
    ```

### Scenario 3: Migration Succeeds, Application Runs, and Operational Data is Entered
- **Trigger:** Defect discovered after College Admins or Super Admins have updated profiles, added established years, or modified contact channels.
- **Rule:** **STRICTLY FORBID DROPPING COLUMNS.** Dropping columns in Scenario 3 causes irreversible destruction of production operational data.
- **Recovery Procedure:**
  1. Roll back backend application code to a compatible version that tolerates the V7 schema without writing to it.
  2. If a schema bug exists, author a **forward-fix Flyway migration (V8)** to alter or patch the schema non-destructively.
  3. If data restoration is required, execute targeted point-in-time table restoration with profile data preservation.

---

## 7. Entity and Repository Changes

### 7.1 Proposed Changes to `College.java`

Add 13 private fields, JPA annotations, and standard accessors:

```java
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

@Column(name = "logo_storage_key", length = 100)
private String logoStorageKey;
```

#### Getters and Setters
Provide standard getters and setters for all 13 attributes, preserving encapsulation.

#### Optimistic Locking
The existing `@Version private Long version = 0L;` on `College` automatically guards all 13 profile fields. Any update to operational profile attributes increments `version`, protecting against concurrent overwrite collisions under **ADR-07**.

### 7.2 Changes to `CollegeRepository.java`
No custom queries are required for Module 4.1 foundation. Existing methods (`findById`, `findByIdWithLock`, `save`) provide complete persistence capabilities. Module 4.2 will introduce `JpaSpecificationExecutor<College>` and search query methods.

---

## 8. Approval Lifecycle Integration Design

### 8.1 Integration Point in `CollegeLifecycleService.java`
The operational profile synchronization hook integrates into `CollegeLifecycleService#onCollegeApproved`:

```java
@Transactional(propagation = Propagation.REQUIRED)
public void onCollegeApproved(
        College college,
        CollegeRegistration submittedRevision,
        User adminUser,
        Long reviewerUserId,
        Role reviewerRole) {

    // 1. Invariant & Ownership Validation
    if (submittedRevision == null) {
        throw new AppException("INVALID_REVISION", "Approved registration revision cannot be null.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!Objects.equals(college.getId(), submittedRevision.getCollegeId())) {
        throw new AppException("CROSS_TENANT_REVISION_MISMATCH", 
            "Submitted revision college ID does not match target college.", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 2. Existing Phase 03 Status Update
    college.setStatus(CollegeStatus.ACTIVE);

    // 3. Phase 04 Module 4.1 Profile Synchronization
    college.setAddressLine1(submittedRevision.getAddressLine1());
    college.setAddressLine2(submittedRevision.getAddressLine2());
    college.setCity(submittedRevision.getCity());
    college.setState(submittedRevision.getState());
    college.setCountry(submittedRevision.getCountry());
    college.setPostalCode(submittedRevision.getPostalCode());
    college.setContactPhone(submittedRevision.getContactPhone());
    college.setWebsiteUrl(submittedRevision.getWebsiteUrl());
    college.setAffiliatedUniversityName(submittedRevision.getAffiliatedUniversityName());
    // Note: contactEmail remains NULL until set by tenant administrator
    // Note: establishedYear, accreditationDetails, and logoStorageKey remain untouched

    collegeRepository.save(college);

    // 4. Existing Phase 03 Audit & Outbox Dispatch
    Map<String, Object> metadata = new HashMap<>();
    metadata.put("collegeCode", college.getCode());
    metadata.put("legalName", submittedRevision.getLegalName());
    metadata.put("versionNumber", submittedRevision.getVersionNumber());

    auditEventService.record(
            AuditEventType.COLLEGE_ACTIVATED,
            reviewerUserId,
            reviewerRole,
            adminUser != null ? adminUser.getId() : null,
            college.getId(),
            AuditOutcome.SUCCESS,
            null,
            metadata
    );

    if (adminUser != null && adminUser.getEmail() != null) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("firstName", adminUser.getFirstName() != null ? adminUser.getFirstName() : "Admin");
        payload.put("legalName", submittedRevision.getLegalName());
        payload.put("collegeCode", college.getCode());

        outboxEmailService.enqueue(
                "COLLEGE_REGISTRATION_APPROVED",
                adminUser.getEmail(),
                "Your Acadlytic College Registration has been Approved",
                "COLLEGE_REGISTRATION_APPROVED",
                payload
        );
    }

    log.info("College [{}] activated and profile synchronized successfully.", college.getId());
}
```

### 8.2 Transactional Guarantees and Failure Behavior
1. **Propagation:** `@Transactional(propagation = Propagation.REQUIRED)` ensures `onCollegeApproved` executes inside the caller's transaction from `CollegeReviewService#processDecision`.
2. **Atomicity:** If profile synchronization fails (e.g. database constraint error or cross-tenant validation failure):
   - `college.approval_status` remains `PENDING` (rolled back).
   - `submittedRevision.status` remains `PENDING` (rolled back).
   - `college.status` remains `PENDING_VERIFICATION` (rolled back).
   - Zero outbox emails are committed to `outbox_emails`.
   - Zero audit records are committed to `audit_events`.
3. **Phase 03 Invariant Preservation:** Existing document verification gates (`APPROVE` blocked on rejected or pending mandatory documents under DEF-01) are evaluated prior to entering `onCollegeApproved`. Profile synchronization never executes unless all Phase 03 approval gates have passed.

---

## 9. Detailed Test Matrix

### 9.1 Migration Test Matrix (`V7CollegeProfileMigrationTest.java`)

| Test ID | Scenario Description | Test Input / Setup | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **MIG-01** | Fresh migration on empty database | Execute V1–V7 on clean Testcontainers schema | Migration succeeds; all 13 columns created; zero rows affected |
| **MIG-02** | Upgrade with valid approved college | College `approval_status = 'APPROVED'`, `current_registration_id` points to approved revision with address/phone/website | Backfill succeeds; all profile fields populated matching revision; `contact_email` is NULL |
| **MIG-03** | Approved college with NULL registration pointer | College `approval_status = 'APPROVED'`, `current_registration_id = NULL` | College excluded from backfill; profile fields remain NULL; preflight logs diagnostic warning |
| **MIG-04** | Pointer to revision of ANOTHER college | College A has `current_registration_id` pointing to revision belonging to College B | College excluded from backfill; profile remains NULL; cross-tenant protection verified |
| **MIG-05** | Pointer to NON-APPROVED revision | College `approval_status = 'APPROVED'`, but pointed revision has `status = 'PENDING'` or `'ACTION_REQUIRED'` | College excluded from backfill; profile remains NULL |
| **MIG-06** | Multiple historical revisions | College has v1 (APPROVED), v2 (ACTION_REQ), v3 (APPROVED); `current_registration_id = v3` | Exactly v3 data backfilled; fields from v1 are never merged |
| **MIG-07** | Existing complete operational profile | College has `address_line1 = 'Existing'`, `city = 'Existing'`, `contact_phone = '123'` | Backfill query skips row; existing values are untouched |
| **MIG-08** | Existing partially populated profile | College has `address_line1 = 'Existing'`, `city = NULL` | Preflight detects partial profile; backfill query skips row; no Frankenstein merging |
| **MIG-09** | NULL optional source fields | Revision has `address_line2 = NULL`, `website_url = NULL` | Backfill succeeds; nullable columns remain NULL; mandatory columns populated |
| **MIG-10** | Unapproved colleges untouched | Colleges with status `PENDING`, `ACTION_REQUIRED`, `REJECTED` | Zero profile fields backfilled; all remain NULL |
| **MIG-11** | Idempotency of backfill query | Execute backfill SQL twice in succession | Second execution updates 0 rows; data unchanged |
| **MIG-12** | Established year constraint | Insert college with `established_year = 1750` or `2150` | Database throws `DataIntegrityViolationException` (`chk_colleges_established_year`) |

### 9.2 Approval Lifecycle Test Matrix (`CollegeApprovalIntegrationTest.java` additions)

| Test ID | Scenario Description | Test Input / Setup | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **LC-01** | Profile synchronized on APPROVE | Super Admin approves pending college revision | College `status = ACTIVE`; operational fields match submitted revision; outbox enqueued |
| **LC-02** | Cross-tenant revision mismatch | Call `onCollegeApproved` with revision belonging to different college | Throws `AppException (CROSS_TENANT_REVISION_MISMATCH)`; transaction rolls back |
| **LC-03** | Rollback on profile failure | Force exception during `collegeRepository.save(college)` | Entire approval transaction rolls back; college approval status remains PENDING |
| **LC-04** | Document review gates preserved | Call approve on college with a REJECTED mandatory document | Blocked with HTTP 409 `DOCUMENTS_REJECTED` (DEF-01); lifecycle hook never invoked |
| **LC-05** | Audit & Outbox consistency | Super Admin approves valid application | `COLLEGE_ACTIVATED` audit event contains `versionNumber` and metadata; outbox email enqueued |

### 9.3 Regression Test Matrix

| Test Suite | Execution Target | Verification Target |
| :--- | :--- | :--- |
| **Phase 01–02 Baseline** | `mvn test -Dtest=AuthServiceTest,EmailVerificationIntegrationTest` | Session management and authentication unchanged |
| **Phase 03 Document Review** | `mvn test -Dtest=DocumentReviewIntegrationTest` | DEF-01 document verification gates and 8-tuple backfill intact |
| **Phase 03 Approval Lifecycle** | `mvn test -Dtest=CollegeApprovalIntegrationTest,CollegeLifecycleIntegrationTest` | 100% passing across college approval and lifecycle transitions |
| **Full Backend Suite** | `mvn clean test` | Zero failures, zero errors across all 296+ existing backend tests |

---

## 10. File-Level Implementation Scope

```
c:\React\Acadlytic\
├── backend/
│   ├── src/main/resources/db/migration/
│   │   └── V7__add_college_profile_fields.sql                     [CREATE]
│   ├── src/main/java/com/acadlytic/modules/colleges/
│   │   ├── migration/
│   │   │   └── V7CollegeProfileMigrationPreflightCallback.java     [CREATE]
│   │   ├── entity/
│   │   │   └── College.java                                       [MODIFY]
│   │   └── service/
│   │       └── CollegeLifecycleService.java                       [MODIFY]
│   └── src/test/java/com/acadlytic/modules/colleges/
│       ├── V7CollegeProfileMigrationTest.java                     [CREATE]
│       ├── CollegeApprovalIntegrationTest.java                    [MODIFY - Add LC tests]
│       └── service/
│           └── CollegeLifecycleServiceUnitTest.java               [MODIFY - Add profile test]
```

### 10.1 Files to Create
1. `backend/src/main/resources/db/migration/V7__add_college_profile_fields.sql`: Schema migration DDL, constraints, indexes, and single-revision backfill query.
2. `backend/src/main/java/com/acadlytic/modules/colleges/migration/V7CollegeProfileMigrationPreflightCallback.java`: Flyway preflight callback checking pointer integrity and partial profiles.
3. `backend/src/test/java/com/acadlytic/modules/colleges/V7CollegeProfileMigrationTest.java`: Dedicated Testcontainers migration test suite (MIG-01 through MIG-12).

### 10.2 Files to Modify
1. `backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java`: Add 13 operational profile fields, getters, setters.
2. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeLifecycleService.java`: Populate operational profile fields in `onCollegeApproved`.
3. `backend/src/test/java/com/acadlytic/modules/colleges/CollegeApprovalIntegrationTest.java`: Add verification that approved colleges have operational profiles populated.
4. `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeLifecycleServiceUnitTest.java`: Update unit test assertions for profile field copying.

### 10.3 Files That Must Remain Strictly Untouched
- `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java`: Calling contract unchanged.
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistration.java`: Entity is immutable historical revision.
- `backend/src/main/resources/db/migration/V1__*.sql` through `V6__*.sql`: Historical migrations are immutable.
- `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`: No documentation edits during module planning.
- All frontend source files in `frontend/`.

---

## 11. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Inconsistent historical revision pointer in live DB** | High | Low | `V7CollegeProfileMigrationPreflightCallback` audits all approved colleges prior to migration. Inconsistent records are excluded from backfill, leaving profile fields NULL for manual review rather than halting migration or guessing. |
| **Overwriting existing manual edits on re-migration** | Critical | Low | Backfill SQL includes `c.address_line1 IS NULL AND c.city IS NULL AND c.contact_phone IS NULL`, guaranteeing existing profile data is never overwritten. |
| **Accidental combination of disparate historical revisions** | High | Low | Strict 3-point join (`cr.id = c.current_registration_id AND cr.college_id = c.id AND cr.status = 'APPROVED'`) guarantees 100% of backfilled fields come from a single authoritative revision. |
| **Approval transaction failure leaves inconsistent status** | Critical | Low | `@Transactional(propagation = Propagation.REQUIRED)` ensures that any failure in profile synchronization rolls back the entire approval operation atomically. |
| **MySQL Lock Timeout during ALTER TABLE** | Medium | Low | `colleges` table is small; DDL executes rapidly. Preflight callback ensures database is healthy before schema mutation. |

---

## 12. Acceptance Criteria for Module 4.1

Module 4.1 will be considered complete and ready for verification when all of the following criteria are satisfied:

1. **AC-4.1.1 (Schema Evolution):** Flyway migration `V7__add_college_profile_fields.sql` executes cleanly on MySQL 8.0.36, adding all 13 operational profile columns with correct nullability, lengths, indexes, and constraints.
2. **AC-4.1.2 (Preflight Callback):** `V7CollegeProfileMigrationPreflightCallback` executes on `Event.BEFORE_EACH_MIGRATE`, auditing legacy data and emitting diagnostic logs for approved colleges.
3. **AC-4.1.3 (Single Authoritative Backfill):** Every approved college with a valid `current_registration_id` receives its operational profile exclusively from that single approved revision.
4. **AC-4.1.4 (Zero Revision Merging):** Fields from multiple revisions are never combined. Ambiguous or mismatched revision pointers are excluded from backfill.
5. **AC-4.1.5 (Email Decoupling):** `colleges.contact_email` is backfilled as `NULL`, never copied from `users.email`.
6. **AC-4.1.6 (Unapproved Isolation):** Zero unapproved colleges (`PENDING`, `ACTION_REQUIRED`, `REJECTED`) receive operational profile values during migration.
7. **AC-4.1.7 (Entity Mapping):** `College.java` maps all 13 attributes; optimistic locking (`@Version`) increments on profile mutation.
8. **AC-4.1.8 (Lifecycle Synchronization):** Approving an application via `CollegeReviewService` synchronously copies all operational fields from the approved revision to `College` inside the caller transaction.
9. **AC-4.1.9 (Atomic Rollback):** A failure during lifecycle profile synchronization rolls back the entire approval operation atomically.
10. **AC-4.1.10 (Full Test Pass):** 100% of migration tests (MIG-01 through MIG-12), lifecycle integration tests (LC-01 through LC-05), and existing Phase 01–03 regression tests pass on Testcontainers MySQL 8.0.36.

---

## 13. Implementation Sequence (When Authorized)

When the Project Owner explicitly authorizes implementation, work must proceed in the following strict order:

```
Step 1: Authorship of Flyway V7 Migration & Preflight Callback
   ├── Write V7__add_college_profile_fields.sql
   └── Write V7CollegeProfileMigrationPreflightCallback.java
Step 2: Migration Integration Verification
   ├── Author V7CollegeProfileMigrationTest.java
   └── Execute Testcontainers tests MIG-01 through MIG-12 against MySQL 8.0.36
Step 3: Entity Model Update
   └── Update College.java with 13 profile fields, accessors, and JPA annotations
Step 4: Lifecycle Synchronization Update
   └── Update CollegeLifecycleService.java#onCollegeApproved with profile copy logic
Step 5: Lifecycle & Approval Integration Testing
   ├── Update CollegeApprovalIntegrationTest.java with LC-01 through LC-05
   └── Update CollegeLifecycleServiceUnitTest.java
Step 6: Full Regression Verification
   ├── Run full backend regression suite (`mvn test`)
   └── Verify package build (`mvn clean package -DskipTests`)
Step 7: Implementation Report Delivery
   └── Produce Module 4.1 Implementation Report and wait for developer review
```

---

## 14. Unresolved Decisions

There are **zero unresolved architectural decisions** for Module 4.1. All technical boundaries, column specifications, backfill constraints, and lifecycle integration semantics have been reconciled and verified against the codebase.

*(Note: Module 4.4 administrator invitation token mechanics and Module 4.3 logo upload endpoints remain explicitly scoped to their respective modules as agreed in Phase 04 Plan v1.2).*

---

## 15. Explicit Confirmation of Planning Proposal Boundary

> [!IMPORTANT]
> **Planning Proposal Only — Zero Implementation Undertaken**
> 
> This document is strictly a detailed technical planning report.
> - **Zero production code files** were created or modified.
> - **Zero Flyway migration files** were created or executed.
> - **Zero test files** were created, modified, or executed.
> - **Zero database schema or data alterations** occurred.
> - **Zero ADRs, roadmaps, feature specifications, or Master Context entries** were modified.
> - **Phase 03 status** remains independently tracked as `IN_PROGRESS` (pending manual E2E verification).
> - **Phase 04 status** remains strictly `NOT_STARTED`.
> - **Module 4.1 status** remains strictly `NOT_STARTED`.
> - Implementation of Module 4.1 will not begin until this detailed technical plan receives explicit review and authorization from the project owner.

---

### End of Detailed Plan
*Artifact File Path:* `docs/04-phase/Acadlytic_Module_4.1_Detailed_Implementation_Plan_v1.0.md`
