# Acadlytic — Module 4.1 Detailed Implementation Plan v1.2
## Consolidated Final Correction Edition

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

## Document Revision History & Consolidated Correction Log (v1.1 $\rightarrow$ v1.2)

| # | Review Finding Area | Inspected Source Reference | Technical Resolution in v1.2 |
| :--- | :--- | :--- | :--- |
| **1** | **Explicit Backfill in V7 Migration Execution** | `V7__add_college_profile_fields.sql`, Flyway migration model | **Clarified dual-step SQL execution in V7 script:** Explicitly specified that `V7__add_college_profile_fields.sql` contains *both* operations in strict sequential order: Step 1 (DDL: `ALTER TABLE colleges` adding all 13 nullable columns) followed immediately by Step 2 (DML: authoritative single-revision `UPDATE` statement). The backfill executes as ordinary Flyway migration SQL, **never** inside a callback. Implementation scope and sequence updated accordingly. |
| **2** | **Preserve Existing Flyway Callback Registration** | `V6DocumentLevelReviewMigrationTest.java` (lines 904–909), `V6DocumentReviewMigrationPreflightCallback.java` | **Preserved historical callback in programmatic test harnesses:** Inspected programmatic test configuration where Flyway is loaded via `Flyway.configure()`. Specified that test harnesses executing V1–V7 migrations (such as `V7CollegeProfileMigrationTest.java`) must register *both* callbacks via `.callbacks(new V6DocumentReviewMigrationPreflightCallback(), new V7CollegeProfileMigrationPreflightCallback())`. Historical V6 preflight validation for document review tuples is fully preserved and never bypassed. |
| **3** | **Clarification of Partial-Profile Protection Semantics** | Baseline V6 schema (`V6__document_level_review.sql`) | **Clarified fresh migration baseline vs. defensive safeguard:** Explained that in a standard V6-to-V7 upgrade on a production database, all 13 newly added columns are initially `NULL` upon DDL completion, making every valid approved college with an authoritative approved revision eligible for backfill. Clarified that the all-13-fields-null predicate and tests MIG-07 / MIG-08 serve as **defensive safeguards** against pre-existing partial schema states, repeated migrations, or dirty test fixtures, ensuring existing data is preserved and revisions are never merged. |

---

## 1. Executive Summary

Module 4.1 establishes the foundational database schema, JPA entity model, historical data migration, and approval lifecycle synchronization for tenant management in **Phase 04 — College Management (Tenant Management & Profile)**.

### Core Deliverables of Module 4.1
1. **Flyway V7 Schema Migration & Backfill Script (`V7__add_college_profile_fields.sql`):** Contains both the DDL extending `colleges` with 13 nullable operational profile columns and the ordinary SQL DML statement backfilling existing approved colleges from their single authoritative approved registration revision.
2. **Flyway Preflight Validation Callback (`V7CollegeProfileMigrationPreflightCallback.java`):** Audits legacy approved colleges prior to migration execution, validates authoritative registration pointers, identifies partial profiles, and emits structured diagnostics without mutating schema.
3. **JPA Entity Extension (`College.java`):** Maps the 13 new operational profile attributes into the `College` entity while maintaining optimistic locking (`@Version`) and tenant isolation semantics.
4. **Single Authoritative Revision Backfill:** Safely populates operational profile attributes for existing approved colleges strictly from a single verified, approved `college_registrations` row referenced by `colleges.current_registration_id`.
5. **Approval Lifecycle Profile Synchronization (`CollegeLifecycleService.java#onCollegeApproved`):** Updates the Phase 03 approval lifecycle hook to synchronously copy profile fields from the approved `CollegeRegistration` revision into `College` within the caller's database transaction.
6. **Comprehensive MySQL Testcontainers Test Suite:** Verifies schema migration, callback chaining, single-revision backfill, idempotent re-execution, partial-data protection, and approval lifecycle synchronization against real MySQL 8.0.36 Testcontainers.

### Strict Boundary Statement
Module 4.1 is strictly a **Database and Backend Entity Foundation** module. It does **not** expose user-facing REST controllers, author frontend pages or UI components, or implement Module 4.2 / 4.3 API endpoints.

---

## 2. Inspected Files and Verified Baseline

The technical specifications in this plan were established through direct inspection of the codebase:

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
  - In `processDecision` (lines 606–658), executes under `@Transactional`.
  - Prior to lifecycle invocation, `submittedRevision.setStatus(APPROVED)` and `college.setApprovalStatus(APPROVED)` are saved and an audit event is recorded.
  - `case APPROVE` invokes `collegeLifecycleService.onCollegeApproved(college, submittedRevision, proposedAdmin, reviewerUserId, reviewerRole)`.
  - Transaction boundary: The caller transaction joins revision update, college approval, lifecycle activation, outbox email enqueueing, and audit logging into a single atomic commit.

### 2.3 Flyway Migrations, Callbacks, and Programmatic Test Configuration
- Active migrations: `V1__init_schema.sql` through `V6__document_level_review.sql`.
- Migration `V3__auth_core_schema.sql`: Created `colleges` with `name`, `code`, `approval_status`, `status`, `permanently_rejected`, `version`.
- Migration `V4__college_registration_schema.sql`: Created `college_registrations`, `college_registration_documents`, and added `current_registration_id`, `resubmission_count`, `action_required_count` to `colleges`. `storage_key` is `VARCHAR(100) NOT NULL UNIQUE`.
- `V6DocumentReviewMigrationPreflightCallback.java`: Implements `Callback`, annotated with `@Component`.
- Callback registration semantics:
  * In standard Spring Boot runtime (`SpringApplication.run()`), Spring auto-configures Flyway and discovers all Spring beans implementing `Callback`.
  * In programmatic Testcontainers migration tests (e.g. `V6DocumentLevelReviewMigrationTest.java` lines 904–909), Flyway is configured explicitly via `Flyway.configure()`.
  * **Verified Requirement:** When migrating through V1–V7 in programmatic test harnesses, callbacks **must be registered explicitly** via:
    ```java
    Flyway.configure()
        .dataSource(testDbUrl, user, pass)
        .locations("classpath:db/migration")
        .callbacks(
            new V6DocumentReviewMigrationPreflightCallback(),
            new V7CollegeProfileMigrationPreflightCallback()
        )
        .target("7")
        .load();
    ```
    This ensures historical V6 document review preflight validation is fully executed and never bypassed.

### 2.4 Existing Document Verification Gate (DEF-01)
- `CollegeReviewService.java` lines 536–600:
  * Document verification gate executes strictly inside `case APPROVE ->`.
  * Fetches documents with pessimistic lock: `collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(submittedRevision.getId())`.
  * Filters out superseded documents: `supersededIds = docs.stream().map(getReplacesDocumentId).filter(nonNull)`. `activeDocs = docs.stream().filter(!supersededIds.contains(id))`.
  * Mandatory category check: `activeCategories` must contain both `UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`.
  * Status check across ALL active documents (mandatory AND optional):
    - If *any* active document has status `REJECTED` $\rightarrow$ throws HTTP 409 `DOCUMENTS_REJECTED`.
    - If *any* active document is not `ACCEPTED` (e.g. `PENDING` or null) $\rightarrow$ throws HTTP 409 `DOCUMENTS_NOT_VERIFIED`.

---

## 3. Proposed Database Schema and Dual-Step Migration Execution (Flyway V7)

### 3.1 Migration File Metadata
- **File Name:** `V7__add_college_profile_fields.sql`
- **Location:** `backend/src/main/resources/db/migration/`
- **Target Table:** `colleges`

### 3.2 Dual-Step Execution Order in Migration Script
`V7__add_college_profile_fields.sql` contains **both** the schema alteration and the data backfill as ordinary Flyway migration SQL. They execute in a strict two-step sequence:
1. **Step 1 (DDL):** `ALTER TABLE colleges` creates the 13 nullable operational profile columns.
2. **Step 2 (DML):** `UPDATE colleges c ...` executes the authoritative single-revision data backfill.

The backfill executes as ordinary SQL within Flyway's standard migration execution pipeline, **never inside a Java callback**.

### 3.3 Exact SQL Specification (`V7__add_college_profile_fields.sql`)

```sql
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
```

### 3.4 Column Design & Scope Justifications
1. **Nullability:** Every new column is strictly `NULL`able. Existing unapproved colleges (`PENDING`, `ACTION_REQUIRED`, `REJECTED`, `PENDING_VERIFICATION`) do not possess operational profiles. Enforcing `NOT NULL` at schema level would break onboarding and prevent migration. Application-level validation in Module 4.3 enforces required fields on profile submission.
2. **Character Set & Collation:** Inherits table-level `utf8mb4 COLLATE utf8mb4_unicode_ci`.
3. **Lengths:** Address, website, university match `college_registrations` lengths. `logo_storage_key VARCHAR(255) NULL` provides headroom for directory-partitioned storage keys.
4. **Deferred Rules:**
   - *No `chk_colleges_established_year`:* Range validation belongs in Module 4.3 DTO validation; no database CHECK constraint exists in approved specifications.
   - *No City/State Indexes:* Deferring `idx_colleges_city` and `idx_colleges_state` to Module 4.2 to match directory search query specifications.

---

## 4. Authoritative Registration Revision Backfill & Defensive Safeguard Semantics

### 4.1 Fresh Migration Baseline vs. Defensive Safeguard
It is critical to distinguish normal migration behavior from defensive safeguards:

1. **Normal Fresh V6-to-V7 Migration Baseline:**
   - In an ordinary production database upgrading from V6 to V7, none of the 13 columns exist before Step 1 executes.
   - When Step 1 (`ALTER TABLE`) executes, MySQL initializes all 13 columns to `NULL` for every existing row in `colleges`.
   - Therefore, in a clean V6-to-V7 upgrade, **every valid approved college with an authoritative approved revision has all 13 columns as NULL** and is fully eligible for the Step 2 backfill.
2. **Defensive Safeguard Role of the All-Null Predicate:**
   - The predicate checking that all 13 columns are `NULL` serves as a **defensive safeguard** against:
     * Repeated migration runs or re-entrant executions.
     * Interrupted migrations or dirty test database states where some profile data was pre-populated.
     * Manually updated rows in development or staging environments.
   - If *any* of the 13 columns contains non-null data, the row is excluded from automated backfill to preserve existing data and prevent merging disparate sources.

### 4.2 Backfill Invariants
1. **Single Authoritative Revision:** Each approved college is backfilled exclusively from **one** authoritative approved registration revision. Fields from different historical revisions must **never** be merged or combined.
2. **Three-Point Integrity Condition:** A registration revision `cr` is authoritative for college `c` if and only if:
   $$\text{cr.id} = \text{c.current\_registration\_id} \quad \land \quad \text{cr.college\_id} = \text{c.id} \quad \land \quad \text{cr.status} = \text{'APPROVED'}$$
3. **No Heuristic Guessing:** If `c.current_registration_id` is missing or inconsistent, the migration does **not** pick the revision with the highest `version_number`. The college is excluded from automatic backfill.
4. **Decoupled Institutional Contact Email:** `colleges.contact_email` is explicitly **set to NULL** (never copied from `users.email`).
5. **Unapproved Colleges Untouched:** Colleges with `approval_status != 'APPROVED'` remain with `NULL` operational profile fields.

---

## 5. Preflight Validation and Post-Migration Reconciliation Strategy

### 5.1 Preflight Callback Design (`V7CollegeProfileMigrationPreflightCallback.java`)
- **Package:** `com.acadlytic.modules.colleges.migration`
- **Interface:** `org.flywaydb.core.api.callback.Callback`
- **Spring Integration:** `@Component`. Discovered by Spring Boot Flyway auto-configuration.
- **Explicit Test Harness Requirement:** In programmatic Testcontainers tests (`Flyway.configure()`), the callback must be explicitly registered alongside `V6DocumentReviewMigrationPreflightCallback`.
- **Target Version:** Evaluates only when `info.getVersion().getVersion().equals("7")`.

### 5.2 Preflight Validation Audits (`Event.BEFORE_EACH_MIGRATE`)
The callback executes read-only validation queries against the connection:

1. **Audit 1: Missing or Inconsistent Revision Pointers**
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
   *Action:* Logs warning diagnostics for each matching college. These records will be safely skipped by the backfill SQL.

2. **Audit 2: Partially Populated Operational Profiles**
   Matches the exact negation of the 13-column all-null predicate:
   ```sql
   SELECT c.id, c.code
   FROM colleges c
   WHERE c.approval_status = 'APPROVED'
     AND (
         c.address_line1 IS NOT NULL
         OR c.address_line2 IS NOT NULL
         OR c.city IS NOT NULL
         OR c.state IS NOT NULL
         OR c.country IS NOT NULL
         OR c.postal_code IS NOT NULL
         OR c.contact_phone IS NOT NULL
         OR c.contact_email IS NOT NULL
         OR c.website_url IS NOT NULL
         OR c.affiliated_university_name IS NOT NULL
         OR c.established_year IS NOT NULL
         OR c.accreditation_details IS NOT NULL
         OR c.logo_storage_key IS NOT NULL
     );
   ```
   *Action:* Executed only if `address_line1` exists in `information_schema.COLUMNS` (re-migration scenario). Logs diagnostics that existing profile records will be excluded from registration backfill.

### 5.3 Safe Post-Migration Callback (`Event.AFTER_EACH_MIGRATE`)
- **Strict Rule:** **ZERO hard assertions, ZERO `FlywayException` throws, ZERO data mutations.**
- Throwing exceptions in `AFTER_EACH_MIGRATE` creates an unrecoverable failure state where DDL has already committed to MySQL, but Flyway marks the migration as failed.
- **Allowed Behavior in `AFTER_EACH_MIGRATE`:**
  - Queries backfill counts:
    `SELECT COUNT(*) FROM colleges WHERE approval_status = 'APPROVED' AND address_line1 IS NOT NULL`
  - Emits structured diagnostic metrics to the application log.
  - Hard assertions are strictly delegated to Testcontainers integration tests (`V7CollegeProfileMigrationTest.java`).

---

## 6. Migration Failure Modes and Three-Tier Recovery Strategy

### 6.1 MySQL 8.0.36 DDL Transaction Semantics
- In MySQL 8, DDL statements (`ALTER TABLE`) trigger an **implicit commit**.
- Individual statements commit independently. If Step 1 (`ALTER TABLE`) succeeds but Step 2 (`UPDATE`) fails, Step 1 **remains committed** in the MySQL data dictionary.
- `flyway repair` **does not undo DDL or DML changes**. It strictly deletes failed migration rows or re-aligns checksums in `flyway_schema_history`.

### 6.2 Three-Tier Recovery Procedures

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MIGRATION RECOVERY STRATEGY                       │
├────────────────────────┬───────────────────────┬───────────────────────┤
│       SCENARIO 1       │      SCENARIO 2       │      SCENARIO 3       │
│   Deployment Failure   │ Pre-Operational Abort │ Post-Operational Edit │
├────────────────────────┼───────────────────────┼───────────────────────┤
│ DDL committed, but     │ V7 applied, but code  │ Users have entered    │
│ migration failed       │ release is rolled back│ operational data      │
│ Action: Inspect cols,  │ Action: Retain V7     │ Action: FORBID DROP!  │
│ drop partial cols,     │ schema by default;    │ Forward-fix (V8) or   │
│ flyway repair, retry   │ old code runs fine    │ app-level hotfix only │
└────────────────────────┴───────────────────────┴───────────────────────┘
```

#### Scenario 1: Flyway Migration Fails During Deployment
- **State:** DDL statements may have committed; Flyway records `success = 0` in `flyway_schema_history`; application startup terminates.
- **Recovery Procedure:**
  1. Inspect startup logs to identify the exact failing SQL statement.
  2. Inspect `information_schema.COLUMNS` where `table_name = 'colleges'` to determine which V7 columns were committed.
  3. Inspect `flyway_schema_history` to verify failed version entry.
  4. If V7 columns exist, execute a compensating DDL drop script:
     ```sql
     ALTER TABLE colleges
         DROP COLUMN IF EXISTS address_line1,
         DROP COLUMN IF EXISTS address_line2,
         DROP COLUMN IF EXISTS city,
         DROP COLUMN IF EXISTS state,
         DROP COLUMN IF EXISTS country,
         DROP COLUMN IF EXISTS postal_code,
         DROP COLUMN IF EXISTS contact_phone,
         DROP COLUMN IF EXISTS contact_email,
         DROP COLUMN IF EXISTS website_url,
         DROP COLUMN IF EXISTS affiliated_university_name,
         DROP COLUMN IF EXISTS established_year,
         DROP COLUMN IF EXISTS accreditation_details,
         DROP COLUMN IF EXISTS logo_storage_key;
     ```
  5. Run `flyway repair` (via Maven or CLI) to clear the failed `version = 7` row from `flyway_schema_history`.
  6. Correct the root cause in `V7__add_college_profile_fields.sql` and re-deploy.

#### Scenario 2: Migration Succeeds, Release Rolled Back BEFORE Operational Edits
- **State:** V7 schema exists; colleges backfilled from registrations; no manual user profile edits have occurred.
- **Recovery Procedure:**
  - **Retain V7 Schema by Default (Recommended):** Because all 13 columns are nullable and default to `NULL`, previous backend releases (Phase 01–03) completely ignore these columns. Prior code runs cleanly against the V7 schema.
  - **Forbidden Action:** Do **not** execute manual `DELETE FROM flyway_schema_history WHERE version = '7'`. Manual deletion corrupts schema history tracking.

#### Scenario 3: Migration Succeeds, Application Runs, and Operational Data is Entered
- **State:** College Admins or Super Admins have modified or entered new profile data.
- **Rule:** **STRICTLY FORBID DROPPING COLUMNS.** Dropping columns in Scenario 3 causes irrecoverable destruction of tenant profile data.
- **Recovery Procedure:**
  - Deploy backend application hotfixes.
  - If schema adjustments are required, author a **forward-fix Flyway migration (V8)** to modify or patch schema non-destructively.
  - If database state must be restored, use point-in-time backup restore with table-level operational data preservation.

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

@Column(name = "logo_storage_key", length = 255)
private String logoStorageKey;
```

#### Optimistic Locking
The existing `@Version private Long version = 0L;` on `College` automatically guards all 13 profile fields. Any update to operational profile attributes increments `version`, protecting against concurrent overwrite collisions under **ADR-07**.

### 7.2 Changes to `CollegeRepository.java`
No custom queries are required for Module 4.1 foundation. Existing methods (`findById`, `findByIdWithLock`, `save`) provide complete persistence capabilities. Module 4.2 will introduce `JpaSpecificationExecutor<College>` and search query methods.

---

## 8. Approval Lifecycle Integration Design

### 8.1 Invariant Validation and Hook Implementation
In `CollegeLifecycleService#onCollegeApproved`:

```java
@Transactional(propagation = Propagation.REQUIRED)
public void onCollegeApproved(
        College college,
        CollegeRegistration submittedRevision,
        User adminUser,
        Long reviewerUserId,
        Role reviewerRole) {

    // 1. Invariant & Ownership Validation
    if (college == null) {
        throw new AppException("INVALID_COLLEGE", "Target college cannot be null.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (submittedRevision == null) {
        throw new AppException("INVALID_REVISION", "Approved registration revision cannot be null.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // Tenant matching invariant
    if (!Objects.equals(college.getId(), submittedRevision.getCollegeId())) {
        throw new AppException("CROSS_TENANT_REVISION_MISMATCH", 
            "Submitted revision college ID does not match target college.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // Authoritative pointer match invariant
    if (!Objects.equals(college.getCurrentRegistrationId(), submittedRevision.getId())) {
        throw new AppException("NON_AUTHORITATIVE_REVISION", 
            "Submitted revision is not the current active registration revision for this college.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // Status invariants at invocation point
    if (submittedRevision.getStatus() != CollegeApprovalStatus.APPROVED) {
        throw new AppException("INVALID_REVISION_STATUS", 
            "Cannot synchronize profile: submitted revision status is not APPROVED.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (college.getApprovalStatus() != CollegeApprovalStatus.APPROVED) {
        throw new AppException("INVALID_COLLEGE_STATUS", 
            "Cannot synchronize profile: college approval status is not APPROVED.", HttpStatus.INTERNAL_SERVER_ERROR);
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
2. **Atomicity:** If profile synchronization fails:
   - `college.approval_status` remains `PENDING` (rolled back).
   - `submittedRevision.status` remains `PENDING` (rolled back).
   - `college.status` remains `PENDING_VERIFICATION` (rolled back).
   - Zero outbox emails are committed to `outbox_emails`.
   - Zero audit records are committed to `audit_events`.
3. **Phase 03 Document Review Gates Preservation (DEF-01):**
   - Approval gates in `CollegeReviewService.java` evaluate *before* `onCollegeApproved` is called:
     * If *any* active document is `REJECTED` $\rightarrow$ throws `DOCUMENTS_REJECTED` (HTTP 409).
     * If *any* active document is `PENDING` $\rightarrow$ throws `DOCUMENTS_NOT_VERIFIED` (HTTP 409).
     * Missing mandatory categories $\rightarrow$ throws `REQUIRED_DOCUMENTS_MISSING` (HTTP 400).
   - Superseded documents are strictly excluded.
   - Profile synchronization is unreachable unless all document review gates pass cleanly.

---

## 9. Comprehensive Test Matrix

The test strategy distinguishes four test tiers:
- **Tier 1: Migration SQL Unit Tests** (verifies DDL and DML statements via `JdbcTemplate`)
- **Tier 2: Callback Execution Tests** (verifies preflight/post-migration callback logic)
- **Tier 3: Full Flyway Integration Tests** (executes `Flyway.migrate()` on real Testcontainers MySQL)
- **Tier 4: Lifecycle Transaction Integration Tests** (verifies `@Transactional` boundary and atomicity)

### 9.1 Migration & Callback Test Matrix (`V7CollegeProfileMigrationTest.java`)

> [!NOTE]
> **Programmatic Callback Registration:** In Tier 3 tests executing Flyway programmatically via `Flyway.configure()`, the harness registers **both** historical and new callbacks:  
> `.callbacks(new V6DocumentReviewMigrationPreflightCallback(), new V7CollegeProfileMigrationPreflightCallback())`.

| Test ID | Tier | Scenario Description | Setup & Inputs | Expected Invariant & Verification |
| :--- | :---: | :--- | :--- | :--- |
| **MIG-01** | Tier 3 | Fresh migration on empty database | Clean Testcontainers schema, execute V1–V7 with both callbacks | Migration succeeds; all 13 columns present in `information_schema.COLUMNS`; 0 rows |
| **MIG-02** | Tier 3 | Upgrade with valid approved college | College `approval_status = 'APPROVED'`, `current_registration_id` points to approved revision | All operational fields populated matching revision; `contact_email` is NULL |
| **MIG-03** | Tier 2/3 | Approved college with NULL pointer | `approval_status = 'APPROVED'`, `current_registration_id = NULL` | College excluded from backfill; profile fields remain NULL; preflight logs warning |
| **MIG-04** | Tier 2/3 | Pointer to revision of ANOTHER college | College A has `current_registration_id` pointing to College B's revision | College excluded from backfill; profile remains NULL; cross-tenant protection verified |
| **MIG-05** | Tier 2/3 | Pointer to NON-APPROVED revision | College `approval_status = 'APPROVED'`, pointed revision has `status = 'PENDING'` | College excluded from backfill; profile remains NULL |
| **MIG-06** | Tier 1/3 | Multiple historical revisions | College has v1 (APPROVED), v2 (ACTION_REQ), v3 (APPROVED); pointer is v3 | Exactly v3 data backfilled; fields from v1 are never merged |
| **MIG-07** | Tier 1/3 | Defensive Data-Preservation: Existing complete profile | College has all 13 profile fields already populated | Backfill query skips row; 100% of existing values are preserved |
| **MIG-08** | Tier 1/3 | Defensive Data-Preservation: Parameterized partial data | College has 1 of the 13 fields non-null (tested across `address_line1`, `city`, `contact_phone`, `contact_email`, `logo_storage_key`) | Row excluded from backfill; existing non-null field preserved; remaining fields remain NULL; no Frankenstein merge |
| **MIG-09** | Tier 1/3 | NULL optional source fields | Source revision has `address_line2 = NULL`, `website_url = NULL` | Backfill succeeds; mandatory columns populated; optional columns remain NULL |
| **MIG-10** | Tier 1/3 | Unapproved colleges untouched | Colleges with `PENDING`, `ACTION_REQUIRED`, `REJECTED` | Zero profile fields backfilled; all remain NULL |
| **MIG-11** | Tier 1/3 | Idempotency of backfill SQL | Execute backfill SQL twice in succession | Second run updates 0 rows; data completely unchanged |
| **MIG-12** | Tier 2 | Preflight Callback Execution | Register callback via `.callbacks()`, run against inconsistent data | Emits structured warnings; does NOT throw exceptions; migration completes |
| **MIG-13** | Tier 2 | Safe Post-Migration Callback | `AFTER_EACH_MIGRATE` runs on completed migration | Emits backfill metrics log; zero mutations; zero exceptions thrown |

### 9.2 Approval Lifecycle Integration Matrix (`CollegeApprovalIntegrationTest.java`)

| Test ID | Tier | Scenario Description | Setup & Inputs | Expected Invariant & Verification |
| :--- | :---: | :--- | :--- | :--- |
| **LC-01** | Tier 4 | Profile synchronized on APPROVE | Super Admin approves pending application with accepted documents | College `status = ACTIVE`; operational fields match submitted revision; outbox enqueued |
| **LC-02** | Tier 4 | Cross-tenant revision mismatch | Call `onCollegeApproved` with revision belonging to different college | Throws `AppException (CROSS_TENANT_REVISION_MISMATCH)`; transaction rolls back |
| **LC-03** | Tier 4 | Non-authoritative revision pointer | Call `onCollegeApproved` with revision whose ID != `college.getCurrentRegistrationId()` | Throws `AppException (NON_AUTHORITATIVE_REVISION)`; transaction rolls back |
| **LC-04** | Tier 4 | Non-approved status invariant | Call `onCollegeApproved` when revision status != `APPROVED` | Throws `AppException (INVALID_REVISION_STATUS)`; transaction rolls back |
| **LC-05** | Tier 4 | Rollback on profile failure | Force repository exception during `collegeRepository.save(college)` | Entire transaction rolls back; college approval status remains PENDING; zero outbox emails |
| **LC-06** | Tier 4 | DEF-01 Gate: Rejected mandatory document | Active `AUTHORIZED_SIGNATORY_ID` has status `REJECTED` | Blocked with HTTP 409 `DOCUMENTS_REJECTED`; `onCollegeApproved` never called |
| **LC-07** | Tier 4 | DEF-01 Gate: Rejected OPTIONAL document | Active `ADDITIONAL_SUPPORTING_DOCUMENT` has status `REJECTED` | Blocked with HTTP 409 `DOCUMENTS_REJECTED`; optional rejected docs also block approval |
| **LC-08** | Tier 4 | DEF-01 Gate: Pending OPTIONAL document | Active optional document has status `PENDING` | Blocked with HTTP 409 `DOCUMENTS_NOT_VERIFIED`; all active docs must be ACCEPTED |
| **LC-09** | Tier 4 | DEF-01 Gate: Superseded rejected document | Rejected document replaced by accepted replacement document | Approval succeeds; superseded rejected document ignored; profile synchronized |
| **LC-10** | Tier 4 | Audit & Outbox consistency | Successful approval | `COLLEGE_ACTIVATED` audit event recorded; outbox email enqueued with legalName and collegeCode |

### 9.3 Platform Regression Matrix

| Test Target | Command | Verification Scope |
| :--- | :--- | :--- |
| **Phase 01–02 Baseline** | `mvn test -Dtest=AuthServiceTest,EmailVerificationIntegrationTest` | Session management and authentication unchanged |
| **Phase 03 Document Review** | `mvn test -Dtest=DocumentReviewIntegrationTest` | Document-level review and legacy 8-tuple backfill intact |
| **Full Backend Suite** | `mvn clean test` | 100% passing across all 296+ existing backend tests on Testcontainers MySQL 8.0.36 |

---

## 10. File-Level Implementation Scope

```
c:\React\Acadlytic\
├── backend/
│   ├── src/main/resources/db/migration/
│   │   └── V7__add_college_profile_fields.sql                     [CREATE]
│   │       ├── Step 1: DDL (ALTER TABLE colleges ADD COLUMN...)
│   │       └── Step 2: DML (UPDATE colleges c JOIN cr... WHERE all 13 NULL)
│   ├── src/main/java/com/acadlytic/modules/colleges/
│   │   ├── migration/
│   │   │   └── V7CollegeProfileMigrationPreflightCallback.java     [CREATE]
│   │   ├── entity/
│   │   └── service/
│   │       └── CollegeLifecycleService.java                       [MODIFY]
│   └── src/test/java/com/acadlytic/modules/colleges/
│       ├── V7CollegeProfileMigrationTest.java                     [CREATE]
│       ├── CollegeApprovalIntegrationTest.java                    [MODIFY - Add LC tests]
│       └── service/
│           └── CollegeLifecycleServiceUnitTest.java               [MODIFY - Add profile test]
```

### 10.1 Files to Create
1. `backend/src/main/resources/db/migration/V7__add_college_profile_fields.sql`: Contains Step 1 (DDL adding 13 columns) and Step 2 (DML executing authoritative backfill as ordinary Flyway SQL).
2. `backend/src/main/java/com/acadlytic/modules/colleges/migration/V7CollegeProfileMigrationPreflightCallback.java`: Flyway preflight callback checking pointer integrity and partial profiles; non-throwing post-migration logging.
3. `backend/src/test/java/com/acadlytic/modules/colleges/V7CollegeProfileMigrationTest.java`: Dedicated Testcontainers migration test suite (MIG-01 through MIG-13), chaining both V6 and V7 callbacks.

### 10.2 Files to Modify
1. `backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java`: Add 13 operational profile fields, getters, setters.
2. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeLifecycleService.java`: Strengthen invariant checks and populate operational profile fields in `onCollegeApproved`.
3. `backend/src/test/java/com/acadlytic/modules/colleges/CollegeApprovalIntegrationTest.java`: Add tests LC-01 through LC-10.
4. `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeLifecycleServiceUnitTest.java`: Update unit assertions for profile field copying.

### 10.3 Files That Must Remain Strictly Untouched
- `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java`: Calling contract unchanged.
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistration.java`: Entity is immutable historical revision.
- `backend/src/main/resources/db/migration/V1__*.sql` through `V6__*.sql`: Historical migrations are immutable.
- `backend/src/main/java/com/acadlytic/modules/colleges/migration/V6DocumentReviewMigrationPreflightCallback.java`: Existing V6 callback remains untouched.
- `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`: No documentation edits during module planning.
- All frontend source files in `frontend/`.

---

## 11. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Inconsistent historical revision pointer in live DB** | High | Low | Preflight callback audits all approved colleges prior to migration. Inconsistent records are excluded from backfill, leaving profile fields NULL for manual review rather than halting migration or guessing. |
| **Overwriting existing manual edits on re-migration** | Critical | Low | Backfill SQL includes the full 13-column all-null predicate, guaranteeing that any college with existing data is never overwritten. |
| **Accidental combination of disparate historical revisions** | High | Low | Strict 3-point join (`cr.id = c.current_registration_id AND cr.college_id = c.id AND cr.status = 'APPROVED'`) guarantees 100% of backfilled fields come from a single authoritative revision. |
| **Approval transaction failure leaves inconsistent status** | Critical | Low | `@Transactional(propagation = Propagation.REQUIRED)` ensures that any failure in profile synchronization rolls back the entire approval operation atomically. |
| **DDL failure leaves partial schema** | Medium | Low | Scenario 1 recovery procedure defines inspecting `information_schema.COLUMNS` and executing compensating `DROP COLUMN` statements before running `flyway repair` and retrying. |

---

## 12. Acceptance Criteria for Module 4.1

Module 4.1 will be considered complete and ready for verification when all of the following criteria are satisfied:

1. **AC-4.1.1 (Dual-Step Schema Evolution):** Flyway migration `V7__add_college_profile_fields.sql` executes cleanly on MySQL 8.0.36, executing DDL first to add all 13 columns, followed by the single-revision backfill DML as ordinary SQL.
2. **AC-4.1.2 (Preflight Callback):** `V7CollegeProfileMigrationPreflightCallback` executes on `Event.BEFORE_EACH_MIGRATE`, auditing legacy data and emitting diagnostic logs for approved colleges.
3. **AC-4.1.3 (Single Authoritative Backfill):** Every approved college with a valid `current_registration_id` receives its operational profile exclusively from that single approved revision.
4. **AC-4.1.4 (Defensive Partial-Data Protection):** If an approved college has *any* non-null operational profile field, it is excluded from backfill; zero manual or partial data is overwritten.
5. **AC-4.1.5 (Email Decoupling):** `colleges.contact_email` is backfilled as `NULL`, never copied from `users.email`.
6. **AC-4.1.6 (Unapproved Isolation):** Zero unapproved colleges (`PENDING`, `ACTION_REQUIRED`, `REJECTED`) receive operational profile values during migration.
7. **AC-4.1.7 (Entity Mapping):** `College.java` maps all 13 attributes; optimistic locking (`@Version`) increments on profile mutation.
8. **AC-4.1.8 (Lifecycle Invariants):** Approving an application synchronously copies all operational fields from the approved revision to `College` inside the caller transaction after verifying revision ownership, pointer match, and approval statuses.
9. **AC-4.1.9 (DEF-01 Gate Preservation):** Approval remains strictly blocked if *any* active document (mandatory or optional) is `REJECTED` or `PENDING`.
10. **AC-4.1.10 (Full Test Pass & Callback Chaining):** 100% of migration tests (MIG-01 through MIG-13) chaining both V6 and V7 callbacks, lifecycle integration tests (LC-01 through LC-10), and existing Phase 01–03 regression tests pass on Testcontainers MySQL 8.0.36.

---

## 13. Implementation Sequence (When Authorized)

When the Project Owner explicitly authorizes implementation, work must proceed in the following strict order:

```
Step 1: Authorship of Flyway V7 Migration & Preflight Callback
   ├── Write V7__add_college_profile_fields.sql (Step 1 DDL + Step 2 DML Backfill)
   └── Write V7CollegeProfileMigrationPreflightCallback.java
Step 2: Migration Integration Verification
   ├── Author V7CollegeProfileMigrationTest.java (registering both V6 and V7 callbacks)
   └── Execute Testcontainers tests MIG-01 through MIG-13 against MySQL 8.0.36
Step 3: Entity Model Update
   └── Update College.java with 13 profile fields, accessors, and JPA annotations
Step 4: Lifecycle Synchronization Update
   └── Update CollegeLifecycleService.java#onCollegeApproved with invariants & copy logic
Step 5: Lifecycle & Approval Integration Testing
   ├── Update CollegeApprovalIntegrationTest.java with LC-01 through LC-10
   └── Update CollegeLifecycleServiceUnitTest.java
Step 6: Full Regression Verification
   ├── Run full backend regression suite (`mvn test`)
   └── Verify package build (`mvn clean package -DskipTests`)
Step 7: Implementation Report Delivery
   └── Produce Module 4.1 Implementation Report and wait for developer review
```

---

## 14. Unresolved Decisions & Architectural Flags

The following decisions are acknowledged as open and explicitly deferred to their respective downstream modules:

1. **Structured Multi-Accreditation Model (Module 4.3 / Phase 05):**
   - *Status:* Deferred.
   - *Detail:* In Module 4.1, `accreditation_details` is modeled as `VARCHAR(255) NULL`. Whether institutional accreditations (e.g. NAAC grade, validity period, NBA accreditations per branch) require a structured JSON column or dedicated relational table is deferred to Module 4.3 / Phase 05.
2. **Logo Binary Upload & Streaming Endpoints (Post-MVP):**
   - *Status:* Deferred to Post-MVP branding enhancement.
   - *Detail:* In Module 4.1, `logo_storage_key VARCHAR(255) NULL` is included strictly as metadata. Binary upload and retrieval endpoints are excluded from Phase 04 MVP.
3. **Institutional Contact Email Verification Flow (Module 4.3):**
   - *Status:* Deferred to Module 4.3.
   - *Detail:* In Module 4.1, `contact_email` is initialized as `NULL`. Whether tenant updates in Module 4.3 require an email verification challenge or are treated as administrative metadata updates will be decided in Module 4.3 planning.
4. **Directory Search Indexing Strategy (Module 4.2):**
   - *Status:* Deferred to Module 4.2.
   - *Detail:* Indexes on `city`, `state`, or `affiliated_university_name` are deferred to Module 4.2 so they can be co-designed with the actual search queries and JPA specifications.

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

### End of Detailed Plan (v1.2)
*Artifact File Path:* `docs/04-phase/Acadlytic_Module_4.1_Detailed_Implementation_Plan_v1.2.md`
