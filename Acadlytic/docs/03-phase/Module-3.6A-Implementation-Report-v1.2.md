# Acadlytic — Module 3.6A Implementation Report
## Document-Level Review Database Schema & Flyway Migration (v1.2)

**Phase:** 03 — Super Admin Review Workflow  
**Module:** 3.6A — Document-Level Review Database Schema & Migration  
**Architecture Reference:** Approved Planning Report v1.1 + Targeted Clarification Addendum (Findings BF-07 through BF-12)  
**Correction Pass:** Exact 8-Tuple State Whitelist (Finding 1) & MySQL Implicit Commit Preflight Failure Safety (Finding 2)  
**Status:** IMPLEMENTED & VERIFIED — PENDING PROJECT OWNER REVIEW  
**Execution Date:** 2026-11-26  

---

### 1. Executive Summary

Report v1.2 provides the definitive technical resolution to the two blocking findings identified during Project Owner review of v1.1:

1. **Finding 1 — Exact Legacy State Tuple Whitelist:**
   - Eliminated independent `IN` predicates that inadvertently accepted Cartesian products.
   - Replaced with an explicit 8-tuple whitelist matching exact pairs `(colleges.approval_status, college_registrations.status)`.
   - Tuple 1 `(APPROVED, APPROVED)` is backfilled to `ACCEPTED` with `LEGACY_COLLEGE_APPROVAL`.
   - The other 7 approved tuples are backfilled to `PENDING` with `NOT_REVIEWED`.
   - All other combinations (such as `APPROVED` + `PENDING`, `PENDING` + `ACTION_REQUIRED`, `PENDING` + `REJECTED`, `ACTION_REQUIRED` + `REJECTED`, `REJECTED` + `ACTION_REQUIRED`, etc.), NULL statuses, orphaned registration links, and cross-tenant ownership mismatches are strictly rejected.
   - Reviewer identity and timestamp remain strictly `NULL`, and zero synthetic review history rows are generated.

2. **Finding 2 — MySQL Implicit DDL Commit and Flyway Failure Safety:**
   - Recognized that MySQL InnoDB DDL statements (`ALTER TABLE`, `CREATE TABLE`, `CREATE TRIGGER`) execute an implicit commit before and after statement execution; MySQL cannot rollback preceding DDL statements.
   - Introduced a genuine, pre-DDL preflight validation step (`validate_v6_preconditions`) at the very beginning of `V6__document_level_review.sql`.
   - If any unsupported tuple, orphaned document, or tenant mismatch exists, the preflight procedure fires `SIGNAL SQLSTATE '45000'` with a deterministic diagnostic:
     `V6 Preflight Failed: Unsupported legacy tuple, orphaned doc, or tenant mismatch detected.`
   - The migration halts **before any `ALTER TABLE`, `CREATE TABLE`, or `UPDATE` is executed**, guaranteeing that the database remains 100% clean at the V5 baseline with zero partial schema mutations or data corruption.
   - Documented and tested the complete Flyway failure, repair (`flyway.repair()`), and recovery procedure.

3. **Additional Role and Privilege Verification:**
   - Proved via Testcontainers MySQL 8.0.36 that runtime user `acadlytic_app` possesses explicit table-level permissions with zero database-wide or global `UPDATE`/`DELETE` grants.
   - Verified MySQL 8 role assignment and active role behavior (`SET ROLE ALL`), confirming that no inherited or active role can restore `UPDATE` or `DELETE` on append-only audit tables.

4. **Verification Integrity:**
   - `V6DocumentLevelReviewMigrationTest`: 17 tests passed (0 failures, 0 errors).
   - Backend Integration Regression Suite: 41 tests passed (0 failures, 0 errors).
   - Frontend Vitest Suite: 200 tests passed (0 failures).

---

### 2. Exact Files Changed

#### 2.1 Database Migrations
- `backend/src/main/resources/db/migration/V6__document_level_review.sql`
  - Added Step 0: Stored procedure preflight check (`validate_v6_preconditions`) executing before any DDL or DML.
  - Updated Step 2: Exact 8-tuple whitelist for legacy backfill attribution.

#### 2.2 Test Suite
- `backend/src/test/java/com/acadlytic/modules/colleges/V6DocumentLevelReviewMigrationTest.java`
  - Updated `executeV6Backfill()` to mirror the exact 8-tuple SQL statement.
  - Updated `test14`: Exhaustive test of all 8 valid legacy tuples.
  - Updated `test15`: Exhaustive negative tests across unsupported tuples and cross-tenant mismatches.
  - Updated `test16`: Explicit table-level privileges, MySQL 8 role assignment, default roles, and effective privilege verification.
  - Added `test17`: Actual Flyway migration failure test against an invalid database (seeded at V5), inspecting database post-failure to prove zero schema or data mutation, and testing `flyway.repair()` and recovery.
  - Added `test18`: Actual Flyway migration test against a valid database (seeded at V5), verifying clean V6 migration and backfill.

#### 2.3 Documentation
- `docs/03-phase/Module-3.6A-Implementation-Report-v1.2.md`
  - Comprehensive v1.2 report detailing findings, preflight design, implicit commit analysis, post-failure inspection, recovery procedure, and test outcomes.

---

### 3. Exact 8-Tuple State Matrix & Rejected Combinations (Finding 1)

#### 3.1 Supported 8-Tuple Whitelist

The system explicitly supports and backfills exactly 8 legitimate historical workflow combinations established across V1–V5:

| # | `colleges.approval_status` | `college_registrations.status` | Operational Context | Backfilled `verification_status` | Backfilled `verification_provenance` | Reviewer ID & Timestamp | Synthetic History Rows |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `APPROVED` | `APPROVED` | Final approved revision of an approved college | `ACCEPTED` | `LEGACY_COLLEGE_APPROVAL` | Strictly `NULL` | None (0) |
| **2** | `APPROVED` | `ACTION_REQUIRED` | Historical revision prior to subsequent approval | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` | None (0) |
| **3** | `APPROVED` | `REJECTED` | Historical rejected revision prior to approval | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` | None (0) |
| **4** | `PENDING` | `PENDING` | Newly submitted application awaiting initial review | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` | None (0) |
| **5** | `ACTION_REQUIRED` | `ACTION_REQUIRED` | Application frozen under action-required status | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` | None (0) |
| **6** | `ACTION_REQUIRED` | `PENDING` | Draft revision v+1 currently being edited | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` | None (0) |
| **7** | `REJECTED` | `REJECTED` | Application rejected at college level | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` | None (0) |
| **8** | `REJECTED` | `PENDING` | Resubmission draft v+1 being edited | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` | None (0) |

#### 3.2 Rejected Combinations

All combinations outside the 8 supported tuples represent illegal, orphaned, or cross-tenant corrupted states. They are rejected by both the preflight check (Step 0) and the backfill query (Step 2):

| # | College Approval Status | Registration Status | Violation Reason |
| :- | :--- | :--- | :--- |
| **1** | `APPROVED` | `PENDING` | An approved college cannot possess an unreviewed pending revision. |
| **2** | `PENDING` | `ACTION_REQUIRED` | An unreviewed college cannot possess an action-required revision. |
| **3** | `PENDING` | `REJECTED` | An unreviewed college cannot possess a rejected revision. |
| **4** | `ACTION_REQUIRED` | `REJECTED` | An action-required college revision lifecycle cannot contain rejected state. |
| **5** | `REJECTED` | `ACTION_REQUIRED` | A rejected college application cannot contain an action-required revision. |
| **6** | `PENDING` | `APPROVED` | A pending college application cannot have an approved revision. |
| **7** | `ACTION_REQUIRED` | `APPROVED` | An action-required application cannot have an approved revision. |
| **8** | `REJECTED` | `APPROVED` | A rejected application cannot have an approved revision. |
| **9** | *Any* | `NULL` | Missing registration status. |
| **10** | `NULL` | *Any* | Missing college approval status. |
| **11** | Orphaned doc | Orphaned doc | Document references non-existent registration ID (`cr.id IS NULL`). |
| **12** | Mismatched tenant | Mismatched tenant | Document college ID does not match registration college ID (`crd.college_id != cr.college_id`). |

#### 3.3 Exact SQL Implementation in V6

```sql
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
```

---

### 4. MySQL Implicit DDL Commit Analysis & Preflight Failure Safety (Finding 2)

#### 4.1 The MySQL Implicit Commit Problem

In MySQL InnoDB:
- All DDL statements (`ALTER TABLE`, `CREATE TABLE`, `CREATE TRIGGER`, `CREATE INDEX`, `DROP ...`) execute an **implicit commit** before running and another implicit commit upon completion.
- MySQL does NOT support transactional DDL. Transactions cannot span DDL operations.
- If a migration executes:
  1. `ALTER TABLE college_registration_documents ADD COLUMN ...` (DDL $\rightarrow$ Implicit Commit #1)
  2. `UPDATE ...` (DML)
  3. `ALTER TABLE ... ADD CONSTRAINT ...` (DDL $\rightarrow$ Fails!)
- When Step 3 fails, Step 1 was ALREADY committed to the MySQL data dictionary.
- Flyway marks the migration as `FAILED` (`success = 0`) in `flyway_schema_history`.
- Flyway CANNOT rollback the preceding DDL because MySQL already committed it.
- The table is left in a dirty, partially-migrated state with the new columns present but constraints and audit tables absent. Any subsequent `flyway:migrate` fails.

#### 4.2 Genuine Pre-DDL Preflight Architecture

To guarantee zero schema mutations and zero data corruption on failure, the preflight check is placed at **Step 0 of `V6__document_level_review.sql`**, strictly BEFORE any `ALTER TABLE` or `CREATE TABLE`:

```sql
-- 0. Preflight Validation (Strict Precondition Enforcement)
-- Runs BEFORE any DDL (ALTER TABLE) or DML (UPDATE) to detect unsupported legacy tuples,
-- orphaned registration references, or cross-tenant ownership mismatches.
-- If any invalid state is detected, the stored procedure aborts execution with SQLSTATE '45000',
-- halting the Flyway migration BEFORE any schema mutation or data backfill occurs.
DROP PROCEDURE IF EXISTS validate_v6_preconditions;
DELIMITER //
CREATE PROCEDURE validate_v6_preconditions()
BEGIN
    DECLARE invalid_count INT DEFAULT 0;

    SELECT COUNT(*) INTO invalid_count
    FROM college_registration_documents crd
    LEFT JOIN college_registrations cr ON crd.registration_id = cr.id AND crd.college_id = cr.college_id
    LEFT JOIN colleges c ON crd.college_id = c.id
    WHERE c.id IS NULL
       OR cr.id IS NULL
       OR crd.college_id != cr.college_id
       OR c.approval_status IS NULL
       OR cr.status IS NULL
       OR (
           (c.approval_status, cr.status) NOT IN (
               ('APPROVED', 'APPROVED'),
               ('APPROVED', 'ACTION_REQUIRED'),
               ('APPROVED', 'REJECTED'),
               ('PENDING', 'PENDING'),
               ('ACTION_REQUIRED', 'ACTION_REQUIRED'),
               ('ACTION_REQUIRED', 'PENDING'),
               ('REJECTED', 'REJECTED'),
               ('REJECTED', 'PENDING')
           )
       );

    IF invalid_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'V6 Preflight Failed: Unsupported legacy tuple, orphaned doc, or tenant mismatch detected.';
    END IF;
END //
DELIMITER ;

CALL validate_v6_preconditions();
DROP PROCEDURE validate_v6_preconditions;
```

#### 4.3 Transactional Sequence and Failure Behavior

```
+-----------------------------------------------------------------------------------+
| V6 Execution Flow                                                                 |
+-----------------------------------------------------------------------------------+
  1. CREATE PROCEDURE validate_v6_preconditions
  2. CALL validate_v6_preconditions()
        |
        +---> [Invalid Data Detected?]
                 |
                 +--- YES ---> SIGNAL SQLSTATE '45000' (Error 1644)
                 |             Migration ABORTS immediately!
                 |             Zero ALTER TABLE statements executed.
                 |             Zero columns added to college_registration_documents.
                 |             Zero UPDATE statements executed.
                 |             Zero audit tables or triggers created.
                 |             Database remains 100% clean at V5 baseline!
                 |
                 +--- NO  ---> Procedure finishes cleanly.
  3. DROP PROCEDURE validate_v6_preconditions (Leaves zero temporary objects)
  4. ALTER TABLE college_registration_documents ADD COLUMN ... (Step 1)
  5. UPDATE college_registration_documents SET ...             (Step 2)
  6. ALTER TABLE ... ADD CONSTRAINT ...                        (Step 3)
  7. CREATE TABLE college_document_reviews ...                 (Step 4)
  8. CREATE TRIGGER trg_cdr_prevent_update / prevent_delete    (Step 5)
  9. Migration commits cleanly (success = 1)
```

#### 4.4 Post-Failure Database Inspection Evidence (from Test 17)

During `test17_actualFlywayMigrationExecution_invalidDatabase_preflightAbortsWithZeroSchemaOrDataMutations_andRepairRecovers()`:
1. Seeded database at V5 baseline with invalid tuple `(APPROVED, PENDING)`.
2. Executed `flyway.migrate()` targeting V6.
3. Flyway aborted with:
   `FlywaySqlScriptException: Migration V6__document_level_review.sql failed`  
   `SQL State: 45000 - Error Code: 1644`  
   `Message: V6 Preflight Failed: Unsupported legacy tuple, orphaned doc, or tenant mismatch detected.`
4. **Database state inspected immediately after failure:**
   - `information_schema.COLUMNS` for `college_registration_documents`:
     Verified that `verification_status`, `verification_provenance`, `rejection_reason`, `last_reviewed_by_user_id`, `last_reviewed_at`, `source_document_id`, `source_registration_id`, and `version` **DO NOT EXIST**.
   - `information_schema.TABLES`: `college_document_reviews` **DOES NOT EXIST** (count = 0).
   - `information_schema.TRIGGERS`: `trg_cdr_prevent_update` and `trg_cdr_prevent_delete` **DO NOT EXIST** (count = 0).
   - Seeded documents: Completely unmodified (storage key and checksum unchanged).
   - `flyway_schema_history`: Version 6 recorded with `success = 0`.

#### 4.5 Flyway Failure, Repair, and Retry Procedure

When preflight detects invalid legacy data, the recovery procedure is deterministic, safe, and automated:

```bash
# Step 1: Administrator inspects diagnostic and corrects corrupted legacy data in SQL
UPDATE college_registrations SET status = 'APPROVED' WHERE id = <corrupted_id>;

# Step 2: Remove the failed V6 entry from flyway_schema_history
./mvnw flyway:repair

# Step 3: Re-execute Flyway migration
./mvnw flyway:migrate
```

**Why this procedure is 100% safe in V6:**
Because the preflight halted before any `ALTER TABLE` executed, `college_registration_documents` was NEVER modified. Running `flyway:repair` cleanly removes the failed `flyway_schema_history` row, and re-running `flyway:migrate` applies V6 cleanly without encountering duplicate column or constraint errors. Verified in Test 17!

---

### 5. Runtime Role & Effective Privilege Verification

#### 5.1 Architecture

Operational privilege separation for `acadlytic_app`:
1. `acadlytic_app` possesses zero global privileges (`GRANT USAGE ON *.*`).
2. `acadlytic_app` possesses zero database-wide `UPDATE` or `DELETE` grants (`acadlytic.*`).
3. Mutable business entities (`colleges`, `users`, `college_registrations`, `college_registration_documents`) have explicit table-level `SELECT, INSERT, UPDATE`.
4. Append-only audit tables (`college_document_reviews`, `audit_events`) have strictly table-level `SELECT, INSERT` only.
5. Zero `UPDATE`, `DELETE`, `DROP`, `ALTER`, or `TRIGGER` privileges are granted to `acadlytic_app`.

#### 5.2 MySQL 8 Role Inheritance Verification (from Test 16)

During `test16_runtimeTestUserPrivilegeSeparation`:
1. Created test role `acadlytic_test_audit_role` with read-only grants (`GRANT SELECT ON acadlytic_test.system_metadata`).
2. Granted `acadlytic_test_audit_role` to `acadlytic_app_test`.
3. Set default role: `ALTER USER 'acadlytic_app_test'@'%' DEFAULT ROLE ALL`.
4. Connected as `acadlytic_app_test` and activated all roles: `SET ROLE ALL`.
5. Inspected `SHOW GRANTS FOR CURRENT_USER()`:
   - Zero global `UPDATE`/`DELETE`.
   - Zero database-wide `UPDATE`/`DELETE`.
   - Table `college_document_reviews`: strictly `GRANT SELECT, INSERT`.
6. Verified operational commands:
   - `SELECT`: **SUCCEEDS**
   - `INSERT`: **SUCCEEDS**
   - `UPDATE`: **DENIED** (MySQL Error `1142` - `ER_TABLEACCESS_DENIED_ERROR`)
   - `DELETE`: **DENIED** (MySQL Error `1142` - `ER_TABLEACCESS_DENIED_ERROR`)
   - `DROP TRIGGER`: **DENIED** (MySQL Error `1142` / `1227`)

**Conclusion:** Active roles cannot restore `UPDATE` or `DELETE` privileges unless explicitly granted. The operational rule is enforced: no role with `UPDATE` or `DELETE` on audit tables shall ever be created or granted.

---

### 6. Test Execution & Verification Evidence

#### 6.1 Testcontainers MySQL 8.0.36 Suite (`V6DocumentLevelReviewMigrationTest.java`)

```bash
cmd /c "cd backend && mvn test -Dtest=V6DocumentLevelReviewMigrationTest"
```

| # | Test Method | Focus Area | Result | Duration |
| :- | :--- | :--- | :--- | :--- |
| **1** | `test1_v1ToV6MigrationsExecuteSuccessfully` | Baseline V1–V6 Flyway clean execution with Step 0 preflight | **PASS** | 0.05s |
| **2** | `test2_and_3_approvedCollegeDocumentsReceiveLegacyCollegeApproval...` | Approved college & registration backfill | **PASS** | 0.08s |
| **4** | `test4_pendingActionRequiredAndRejectedDocumentsReceiveNotReviewed` | Unreviewed states receive `NOT_REVIEWED` | **PASS** | 0.07s |
| **5** | `test5_noArtificialReviewHistoryRowsCreated` | Zero synthetic review history rows created | **PASS** | 0.02s |
| **6** | `test6_compositeOwnershipFkRejectsCrossCollegeAndCrossRegistrationReferences` | Composite FK blocks cross-tenant review links | **PASS** | 0.08s |
| **7** | `test7_sourceDocumentAndRegistrationOwnershipEnforced` | Composite FK blocks cross-tenant source docs | **PASS** | 0.07s |
| **8** | `test8_partiallyNullSourceReferencesRejected` | Check constraint `chk_crd_source_pair` | **PASS** | 0.06s |
| **9** | `test9_invalidVerificationStatusesAndProvenanceValuesRejected` | Check constraints reject illegal enum values | **PASS** | 0.07s |
| **10** | `test10_replacementUniquenessPreventsDuplicateReplacementTargets` | Unique constraint `(registration_id, replaces_document_id)` | **PASS** | 0.09s |
| **11** | `test11_updateAgainstReviewHistoryFailsWithSqlState45000` | Trigger blocks UPDATE with SQLSTATE 45000 | **PASS** | 0.05s |
| **12** | `test12_deleteAgainstReviewHistoryFailsWithSqlState45000` | Trigger blocks DELETE with SQLSTATE 45000 | **PASS** | 0.05s |
| **13** | `test13_failedReviewHistoryWritesDoNotLeavePartialDatabaseMutations` | Transaction rollback atomicity (0% partial mutation) | **PASS** | 0.06s |
| **14** | `test14_exhaustiveLegacyStateMatrix_allValidCombinationsReceiveExpectedAttribution` | **Finding 1:** Validates exact 8 supported legacy tuples | **PASS** | 0.35s |
| **15** | `test15_unknownOrCorruptedState_failsMigrationPreconditionAndAbortsWithoutMisclassification` | **Finding 1:** Rejects all unsupported combinations & tenant mismatches | **PASS** | 0.38s |
| **16** | `test16_runtimeTestUserPrivilegeSeparation` | **Privilege & Role:** Explicit table-level grants, active roles, Error 1142 | **PASS** | 0.36s |
| **17** | `test17_actualFlywayMigrationExecution_invalidDatabase_preflightAbortsWithZeroSchemaOrDataMutations_andRepairRecovers` | **Finding 2:** Preflight aborts before DDL/DML, inspects DB (0 partial mutations), repair & retry recovery | **PASS** | 3.52s |
| **18** | `test18_actualFlywayMigrationExecution_validDatabase_succeedsWithSchemaAndBackfill` | **Finding 2:** Actual migration succeeds on valid V5 database and backfills 8 tuples | **PASS** | 2.85s |

**Summary: 17 tests run, 17 passed, 0 failures, 0 errors (BUILD SUCCESS).**

#### 6.2 Backend Integration Regression Suite

```bash
cmd /c "cd backend && mvn test -Dtest=CollegeRegistrationIntegrationTest,CollegeReviewIntegrationTest,CollegeOnboardingIntegrationTest,SchemaAndConstraintsIntegrationTest"
```

- `SchemaAndConstraintsIntegrationTest`: 4 passed
- `CollegeRegistrationIntegrationTest`: 4 passed
- `CollegeOnboardingIntegrationTest`: 12 passed
- `CollegeReviewIntegrationTest`: 21 passed
- **Total: 41 tests run, 41 passed, 0 failures, 0 errors (BUILD SUCCESS).**

#### 6.3 Frontend Vitest Suite

```bash
cmd /c "cd frontend && npm test -- --run"
```

- **13 test files, 200 tests passed, 0 failures.**

---

### 7. Strict Scope-Boundary Confirmation

- **V1–V5 untouched:** Baseline migrations preserved without modification.
- **No API / Controller changes:** No review endpoints or controllers created.
- **No Service modifications:** `CollegeReviewService`, `CollegeOnboardingService`, and `CollegeLifecycleService` were NOT modified.
- **No Frontend changes:** Frontend codebase remains untouched.
- **Aster Valley College:** Clean and untouched; zero state-mutating API calls executed.
- **Master Context & ADRs:** Untouched.
- **Module 3.6B / 3.6C:** NOT started.

---

### 8. Halting for Project Owner Review

Module 3.6A v1.2 corrections are implemented, thoroughly tested under Testcontainers MySQL 8.0.36, and verified.

In strict compliance with instructions:
- **Module 3.6A is NOT marked APPROVED.**
- **Module 3.6B has NOT been started.**
- **Awaiting Project Owner review and sign-off.**
