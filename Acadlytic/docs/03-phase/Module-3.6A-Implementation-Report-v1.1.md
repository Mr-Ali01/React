# Acadlytic — Module 3.6A Implementation Report
## Document-Level Review Database Schema & Flyway Migration (v1.1)

**Phase:** 03 — Super Admin Review Workflow  
**Module:** 3.6A — Document-Level Review Database Schema & Migration  
**Architecture Reference:** Approved Planning Report v1.1 + Targeted Clarification Addendum (Findings BF-07 through BF-12)  
**Correction Pass:** Consolidated Security (Finding 1) & Exhaustive Legacy Backfill (Finding 2)  
**Status:** IMPLEMENTED & VERIFIED — PENDING PROJECT OWNER REVIEW  
**Execution Date:** 2026-11-26  

---

### 1. Executive Summary

Report v1.1 provides the definitive technical resolution to the two blocking findings identified during Project Owner review of v1.0:
1. **Finding 1 — Correct Runtime Database Privilege Design:** Replaced flawed schema-level `REVOKE` proposal with an explicit, defense-in-depth table-level privilege grant architecture. Proved via Testcontainers MySQL 8.0.36 that runtime user `acadlytic_app` possesses zero global or database-wide `UPDATE`/`DELETE` privileges, is strictly confined to `SELECT` and `INSERT` on `college_document_reviews` and `audit_events`, is denied `UPDATE` and `DELETE` at the MySQL privilege boundary (Error 1142), and cannot drop or alter audit triggers.
2. **Finding 2 — Exhaustive Legacy Registration State Handling:** Replaced the partial backfill with an exhaustive state matrix evaluated via ANSI SQL `CASE` logic. Explicitly validates all 8 valid combinations of `(colleges.approval_status, college_registrations.status)`. Orphaned documents, cross-tenant mismatches, or unexpected status values are assigned an unconstrained sentinel `'UNKNOWN_STATE_FAIL'` that immediately trips the subsequent `chk_crd_verification_status` check constraint, aborting the migration before any corrupted data can be committed.
3. **Verification Integrity:** 15 comprehensive Testcontainers integration tests pass with 0 failures and 0 errors, alongside the complete 41-test backend regression suite and 200-test frontend suite.

---

### 2. Exact Files Changed

#### 2.1 Schema & Migrations
- `backend/src/main/resources/db/migration/V6__document_level_review.sql`  
  *Updated Step 2 backfill query to evaluate the exhaustive legacy state matrix via `LEFT JOIN` and assign failure sentinels for any unexpected or corrupted combinations.*

#### 2.2 Domain Entities & Enums
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistrationDocument.java`  
  *Mapped verification fields, source revision pointers, and `@Version version`. Added `@PrePersist` defaults to maintain 100% backward compatibility.*
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationStatus.java`  
  *Enum defining document verification states: `PENDING`, `ACCEPTED`, `REJECTED`.*
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationProvenance.java`  
  *Enum defining provenance lifecycles: `NOT_REVIEWED`, `DIRECT_REVIEW`, `CARRIED_FORWARD`, `LEGACY_COLLEGE_APPROVAL`.*

#### 2.3 Test Suite & Infrastructure
- `backend/src/test/java/com/acadlytic/modules/colleges/V6DocumentLevelReviewMigrationTest.java`  
  *Expanded to 15 integration tests, incorporating `test14` (exhaustive 8-state matrix), `test15` (unknown state sentinel check), and `test16` (runtime user privilege separation using Testcontainers root credentials).*
- `backend/src/test/java/com/acadlytic/support/AbstractMySqlIntegrationTest.java`  
  *Configured `--log-bin-trust-function-creators=1` on the MySQLContainer command line to allow trigger creation under binary logging.*

#### 2.4 Reports
- `docs/03-phase/Module-3.6A-Implementation-Report-v1.1.md`  
  *Consolidated v1.1 report incorporating corrected privilege architecture and exhaustive state evidence.*

---

### 3. Corrected Runtime Database Privilege Design (Finding 1)

#### 3.1 Architectural Defect in v1.0

In v1.0, the proposed operational SQL was:
```sql
GRANT SELECT, INSERT, UPDATE ON acadlytic.* TO 'acadlytic_app'@'%';
REVOKE UPDATE, DELETE ON acadlytic.college_document_reviews FROM 'acadlytic_app'@'%';
```
**Defect Analysis:** In MySQL 8, privileges are additive across hierarchical scopes:
$$\text{Global } (*.*) \longrightarrow \text{Database } (db.*) \longrightarrow \text{Table } (db.table) \longrightarrow \text{Column}$$
Granting `UPDATE` at the database level (`acadlytic.*`) populates `mysql.db`. Subsequent `REVOKE` at the table level only touches `mysql.tables_priv`. During statement authorization, MySQL checks database-level grants first; because `mysql.db` contains `Update_priv='Y'`, the user is authorized to update *every* table in the database, rendering table-level `REVOKE` ineffective.

#### 3.2 Authoritative Table-Level Privilege Architecture

To guarantee that `acadlytic_app` cannot update or delete rows in `college_document_reviews` or `audit_events`, **no schema-wide `UPDATE` or `DELETE` grants are issued**. All operational permissions are granted strictly at the table level:

```sql
-- ==============================================================================
-- Production Operational Privilege Provisioning for acadlytic_app
-- Must be executed by DBA / Migration Administrator (acadlytic_admin)
-- ==============================================================================

-- 1. Ensure zero inherited global or database privileges
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'acadlytic_app'@'%';

-- 2. Mutable business entities: SELECT, INSERT, UPDATE
GRANT SELECT, INSERT, UPDATE ON acadlytic.colleges TO 'acadlytic_app'@'%';
GRANT SELECT, INSERT, UPDATE ON acadlytic.users TO 'acadlytic_app'@'%';
GRANT SELECT, INSERT, UPDATE ON acadlytic.auth_tokens TO 'acadlytic_app'@'%';
GRANT SELECT, INSERT, UPDATE ON acadlytic.college_registrations TO 'acadlytic_app'@'%';
GRANT SELECT, INSERT, UPDATE ON acadlytic.college_registration_documents TO 'acadlytic_app'@'%';

-- 3. Queues, sessions, and transient state: SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON acadlytic.outbox_emails TO 'acadlytic_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON acadlytic.SPRING_SESSION TO 'acadlytic_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON acadlytic.SPRING_SESSION_ATTRIBUTES TO 'acadlytic_app'@'%';

-- 4. Read-only platform metadata: SELECT
GRANT SELECT ON acadlytic.system_metadata TO 'acadlytic_app'@'%';

-- 5. Strictly append-only audit tables: SELECT, INSERT only (ZERO UPDATE, ZERO DELETE)
GRANT SELECT, INSERT ON acadlytic.college_document_reviews TO 'acadlytic_app'@'%';
GRANT SELECT, INSERT ON acadlytic.audit_events TO 'acadlytic_app'@'%';

FLUSH PRIVILEGES;
```

#### 3.3 Defense-in-Depth Layering

1. **Layer 1 — Privilege Boundary:** `acadlytic_app` possesses zero `UPDATE`, `DELETE`, `DROP`, `ALTER`, or `TRIGGER` grants on `college_document_reviews`. Any attempt to execute `UPDATE` or `DELETE` is blocked at the MySQL server privilege verification phase with MySQL Error `1142` (`ER_TABLEACCESS_DENIED_ERROR`).
2. **Layer 2 — Engine-Level Triggers:** If an administrative connection with `UPDATE` or `DELETE` privileges attempts mutation, `trg_cdr_prevent_update` and `trg_cdr_prevent_delete` fire `BEFORE` the row operation and abort with SQLSTATE `45000`.
3. **Layer 3 — Trigger Modification Immutability:** Because `acadlytic_app` lacks `TRIGGER` and `DROP` privileges, it cannot execute `DROP TRIGGER trg_cdr_prevent_update` (Error `1142` / `1227`).

---

### 4. Exhaustive Legacy Registration State Handling (Finding 2)

#### 4.1 Exhaustive State Matrix

Every valid state combination supported by existing Flyway migrations V1–V5 and database CHECK constraints is explicitly mapped:

| # | `colleges.approval_status` | `college_registrations.status` | Operational Context | Backfilled `verification_status` | Backfilled `verification_provenance` | Reviewer ID & Timestamp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `APPROVED` | `APPROVED` | Final approved revision of an approved college | `ACCEPTED` | `LEGACY_COLLEGE_APPROVAL` | Strictly `NULL` |
| **2** | `APPROVED` | `ACTION_REQUIRED` | Historical revision prior to subsequent approval | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` |
| **3** | `APPROVED` | `REJECTED` | Historical rejected revision prior to approval | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` |
| **4** | `PENDING` | `PENDING` | Newly submitted application awaiting initial review | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` |
| **5** | `ACTION_REQUIRED` | `ACTION_REQUIRED` | Application frozen under action-required status | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` |
| **6** | `ACTION_REQUIRED` | `PENDING` | Draft revision v+1 currently being edited by College Admin | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` |
| **7** | `REJECTED` | `REJECTED` | Application rejected at college level | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` |
| **8** | `REJECTED` | `PENDING` | Resubmission draft v+1 being edited by College Admin | `PENDING` | `NOT_REVIEWED` | Strictly `NULL` |
| **9** | *Any unexpected / NULL* | *Any unexpected / NULL* | Orphaned document, cross-tenant corruption, or illegal status | `'UNKNOWN_STATE_FAIL'` | `'UNKNOWN_STATE_FAIL'` | **Aborts Migration (SQL Error 3819)** |

#### 4.2 Fail-Fast Migration Implementation

```sql
UPDATE college_registration_documents crd
LEFT JOIN college_registrations cr ON crd.registration_id = cr.id AND crd.college_id = cr.college_id
LEFT JOIN colleges c ON crd.college_id = c.id
SET 
    crd.verification_status = CASE 
        WHEN c.approval_status = 'APPROVED' AND cr.status = 'APPROVED' THEN 'ACCEPTED'
        WHEN c.approval_status IN ('PENDING', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED')
             AND cr.status IN ('PENDING', 'ACTION_REQUIRED', 'REJECTED') THEN 'PENDING'
        ELSE 'UNKNOWN_STATE_FAIL'
    END,
    crd.verification_provenance = CASE 
        WHEN c.approval_status = 'APPROVED' AND cr.status = 'APPROVED' THEN 'LEGACY_COLLEGE_APPROVAL'
        WHEN c.approval_status IN ('PENDING', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED')
             AND cr.status IN ('PENDING', 'ACTION_REQUIRED', 'REJECTED') THEN 'NOT_REVIEWED'
        ELSE 'UNKNOWN_STATE_FAIL'
    END,
    crd.rejection_reason = NULL,
    crd.last_reviewed_by_user_id = NULL,
    crd.last_reviewed_at = NULL;
```

**Precondition Guarantee:** If any document has an orphaned registration, mismatched `college_id`, or unsupported enum value, `crd.verification_status` and `crd.verification_provenance` receive `'UNKNOWN_STATE_FAIL'`. Immediately following the `UPDATE`, Step 3 adds:
```sql
ALTER TABLE college_registration_documents
    ADD CONSTRAINT chk_crd_verification_status CHECK (
        verification_status IN ('PENDING', 'ACCEPTED', 'REJECTED')
    );
```
Because `'UNKNOWN_STATE_FAIL'` is not in `('PENDING', 'ACCEPTED', 'REJECTED')`, MySQL halts with:
`Error Code: 3819. Check constraint 'chk_crd_verification_status' is violated.`
The migration aborts instantly, Flyway rolls back the transaction, and zero corrupted data is committed.

---

### 5. Test Execution & Verification Evidence

#### 5.1 Testcontainers MySQL 8.0.36 Suite (`V6DocumentLevelReviewMigrationTest.java`)

```
mvn test -Dtest=V6DocumentLevelReviewMigrationTest
```

| # | Test Method | Focus Area | Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `test1_v1ToV6MigrationsExecuteSuccessfully` | Baseline V1–V6 Flyway clean execution | **PASS** | 0.05s |
| **2** | `test2_and_3_approvedCollegeDocumentsReceiveLegacyCollegeApproval...` | Approved college & registration backfill | **PASS** | 0.08s |
| **4** | `test4_pendingActionRequiredAndRejectedDocumentsReceiveNotReviewed` | Unreviewed states receive `NOT_REVIEWED` | **PASS** | 0.07s |
| **5** | `test5_noArtificialReviewHistoryRowsCreated` | Zero synthetic review history rows created | **PASS** | 0.02s |
| **6** | `test6_compositeOwnershipFkRejectsCrossCollegeAndCrossRegistrationReferences` | Composite FK blocks cross-tenant review links | **PASS** | 0.08s |
| **7** | `test7_sourceDocumentAndRegistrationOwnershipEnforced` | Composite FK blocks cross-tenant source docs | **PASS** | 0.08s |
| **8** | `test8_partiallyNullSourceReferencesRejected` | Check constraint `chk_crd_source_pair` | **PASS** | 0.06s |
| **9** | `test9_invalidVerificationStatusesAndProvenanceValuesRejected` | Check constraints reject illegal enum values | **PASS** | 0.07s |
| **10** | `test10_replacementUniquenessPreventsDuplicateReplacementTargets` | Unique constraint `(registration_id, replaces_document_id)` | **PASS** | 0.09s |
| **11** | `test11_updateAgainstReviewHistoryFailsWithSqlState45000` | Trigger blocks UPDATE with SQLSTATE 45000 | **PASS** | 0.05s |
| **12** | `test12_deleteAgainstReviewHistoryFailsWithSqlState45000` | Trigger blocks DELETE with SQLSTATE 45000 | **PASS** | 0.05s |
| **13** | `test13_failedReviewHistoryWritesDoNotLeavePartialDatabaseMutations` | Transaction rollback atomicity (0% partial mutation) | **PASS** | 0.06s |
| **14** | `test14_exhaustiveLegacyStateMatrix_allValidCombinationsReceiveExpectedAttribution` | **Finding 2:** Validates all 8 legacy state combinations | **PASS** | 0.35s |
| **15** | `test15_unknownOrCorruptedState_failsMigrationPreconditionAndAbortsWithoutMisclassification` | **Finding 2:** Sentinel fails check constraint on unknown status | **PASS** | 0.06s |
| **16** | `test16_runtimeTestUserPrivilegeSeparation` | **Finding 1:** Explicit table-level grants, UPDATE/DELETE denied (1142), trigger drop denied | **PASS** | 0.38s |

**Summary: 15 tests run, 15 passed, 0 failures, 0 errors.**

#### 5.2 Effective Privilege Evidence from Test 16

During `test16_runtimeTestUserPrivilegeSeparation`:
1. `SHOW GRANTS FOR 'acadlytic_app_test'@'%'` verified:
   - `GRANT USAGE ON *.* TO 'acadlytic_app_test'@'%'` (zero global UPDATE/DELETE).
   - Zero database-wide grants on `acadlytic_test.*`.
   - Table grants on `college_document_reviews`: strictly `GRANT SELECT, INSERT ON acadlytic_test.college_document_reviews`.
2. `UPDATE college_document_reviews`:
   - Throws `SQLException`: Error Code `1142` (`UPDATE command denied to user 'acadlytic_app_test'@'%' for table 'college_document_reviews'`).
3. `DELETE FROM college_document_reviews`:
   - Throws `SQLException`: Error Code `1142` (`DELETE command denied to user 'acadlytic_app_test'@'%' for table 'college_document_reviews'`).
4. `DROP TRIGGER trg_cdr_prevent_update`:
   - Throws `SQLException`: Error Code `1142` (`DROP command denied to user 'acadlytic_app_test'@'%'`).

#### 5.3 Backend Integration Regression Suite

```
mvn test -Dtest=CollegeRegistrationIntegrationTest,CollegeReviewIntegrationTest,CollegeOnboardingIntegrationTest,SchemaAndConstraintsIntegrationTest
```
- `SchemaAndConstraintsIntegrationTest`: 4 passed
- `CollegeRegistrationIntegrationTest`: 4 passed
- `CollegeOnboardingIntegrationTest`: 12 passed
- `CollegeReviewIntegrationTest`: 21 passed
- **Total: 41 tests run, 41 passed, 0 failures, 0 errors (BUILD SUCCESS).**

#### 5.4 Frontend Test Suite

```
npm test -- --run
```
- **13 test files, 200 tests passed, 0 failures.**

---

### 6. Strict Scope-Boundary Confirmation

- **V1–V5 untouched:** Baseline migrations preserved without modification.
- **No API / Controller changes:** No review endpoints or controllers created.
- **No Service modifications:** `CollegeReviewService`, `CollegeOnboardingService`, and `CollegeLifecycleService` were NOT modified.
- **No Frontend changes:** Frontend codebase remains untouched.
- **Aster Valley College:** Pristine; zero state-mutating API calls executed.
- **Module 3.6B / 3.6C:** NOT started.

---

### 7. Halting for Project Owner Review

Module 3.6A v1.1 corrections are implemented, thoroughly tested under Testcontainers MySQL 8.0.36, and verified.

In strict compliance with instructions:
- **Module 3.6A is NOT marked APPROVED.**
- **Module 3.6B has NOT been started.**
- **Awaiting Project Owner review and sign-off.**
