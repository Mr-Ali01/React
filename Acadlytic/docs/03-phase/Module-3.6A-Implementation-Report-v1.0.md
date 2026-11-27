# Acadlytic — Module 3.6A Implementation Report
## Document-Level Review Database Schema & Flyway Migration (v1.0)

**Phase:** 03 — Super Admin Review Workflow  
**Module:** 3.6A — Document-Level Review Database Schema & Migration  
**Architecture Reference:** Approved Planning Report v1.1 + Targeted Clarification Addendum (Findings BF-07 through BF-12)  
**Status:** IMPLEMENTED & VERIFIED — PENDING PROJECT OWNER REVIEW  
**Execution Date:** 2026-11-26  

---

### 1. Executive Summary

Module 3.6A establishes the database foundation for independent document-level review decisions within Acadlytic's Super Admin College Registration Workflow. Prior to Module 3.6A, verification documents were tied strictly to registration revisions with no independent audit trail, verification status, or provenance attribution. 

This implementation delivers:
1. **Flyway Migration `V6__document_level_review.sql`:** Extends `college_registration_documents` with verification status, provenance, reviewer attribution, source tracking, and optimistic locking fields.
2. **Append-Only History Table `college_document_reviews`:** Backed by MySQL 8 `BEFORE UPDATE` and `BEFORE DELETE` triggers enforcing strictly append-only audit retention (SQLSTATE 45000).
3. **Composite Ownership Foreign Keys:** Physically impossible to associate review records or carried-forward documents across different college tenants or registration revisions.
4. **Replacement Uniqueness:** Unique constraint `(registration_id, replaces_document_id)` guaranteeing at most one active replacement document per target document within a revision.
5. **Historical Truth Backfill:** Preserves legacy data integrity by assigning `LEGACY_COLLEGE_APPROVAL` exclusively to historical approved college documents, keeping individual reviewer identities and timestamps strictly `NULL`.
6. **Zero Regressions:** 100% test pass rate across all 12 migration-level Testcontainers MySQL 8.0.36 integration tests and all existing registration, onboarding, and review test suites.

---

### 2. Files Created & Modified

#### 2.1 Created Files
- `backend/src/main/resources/db/migration/V6__document_level_review.sql`  
  *Sequential Flyway migration defining columns, backfill, composite foreign keys, unique constraints, check constraints, history table, and triggers.*
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationStatus.java`  
  *Enum defining document verification states: `PENDING`, `ACCEPTED`, `REJECTED`.*
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationProvenance.java`  
  *Enum defining provenance lifecycles: `NOT_REVIEWED`, `DIRECT_REVIEW`, `CARRIED_FORWARD`, `LEGACY_COLLEGE_APPROVAL`.*
- `backend/src/test/java/com/acadlytic/modules/colleges/V6DocumentLevelReviewMigrationTest.java`  
  *Comprehensive Testcontainers MySQL 8.0.36 test suite verifying all 13 migration-level behavioral requirements.*
- `docs/03-phase/Module-3.6A-Implementation-Report-v1.0.md`  
  *Authoritative module completion and verification documentation.*

#### 2.2 Modified Files
- `backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistrationDocument.java`  
  *Mapped new schema columns, `@Version version`, and provided safe defaults (`PENDING`, `NOT_REVIEWED`, `version = 0L`) in `@PrePersist onCreate` to guarantee backward compatibility with existing tests and services.*
- `backend/src/test/java/com/acadlytic/support/AbstractMySqlIntegrationTest.java`  
  *Appended `--log-bin-trust-function-creators=1` to the MySQLContainer command line to allow MySQL 8 trigger installation under binary logging.*

---

### 3. Migration Schema Details (`V6__document_level_review.sql`)

#### 3.1 New Columns on `college_registration_documents`

| Column Name | SQL Type | Nullable | Default | Constraints / References | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `verification_status` | `VARCHAR(30)` | No | `'PENDING'` | `chk_crd_verification_status` (`PENDING`, `ACCEPTED`, `REJECTED`) | Current document decision |
| `verification_provenance` | `VARCHAR(40)` | No | `'NOT_REVIEWED'` | `chk_crd_verification_provenance` | Review lifecycle origin |
| `rejection_reason` | `TEXT` | Yes | `NULL` | None | Stored when status is `REJECTED` |
| `last_reviewed_by_user_id` | `BIGINT` | Yes | `NULL` | `fk_crd_last_reviewed_by` -> `users(id)` | Reviewer user foreign key |
| `last_reviewed_at` | `TIMESTAMP` | Yes | `NULL` | None | Timestamp of direct decision |
| `source_document_id` | `BIGINT` | Yes | `NULL` | Composite FK `fk_crd_source_document_composite` | Source document if carried forward |
| `source_registration_id` | `BIGINT` | Yes | `NULL` | Composite FK `fk_crd_source_document_composite` | Source revision if carried forward |
| `version` | `BIGINT` | No | `0` | Optimistic lock `@Version` | Concurrency check counter |

#### 3.2 Constraints and Indexes Added to `college_registration_documents`

- **Composite Uniqueness:**  
  `CONSTRAINT uq_crd_college_reg_doc UNIQUE (college_id, registration_id, id);`  
  *Enables composite foreign key targets ensuring zero cross-tenant or cross-revision referencing.*
- **Source Document Composite Foreign Key:**  
  `CONSTRAINT fk_crd_source_document_composite FOREIGN KEY (college_id, source_registration_id, source_document_id) REFERENCES college_registration_documents (college_id, registration_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT;`  
  *Guarantees carried-forward documents reference a document belonging to the exact same college tenant.*
- **Source Pair Check Constraint:**  
  `CONSTRAINT chk_crd_source_pair CHECK ((source_document_id IS NULL AND source_registration_id IS NULL) OR (source_document_id IS NOT NULL AND source_registration_id IS NOT NULL));`  
  *Rejects partially-NULL source references at the database engine level.*
- **Replacement Uniqueness:**  
  `CONSTRAINT uq_crd_registration_replacement UNIQUE (registration_id, replaces_document_id);`  
  *Guarantees at most one replacement document per target document within any single registration revision (while allowing multiple `NULL` values).*
- **Performance Indexes:**  
  `idx_crd_verification_status` on `(verification_status)`  
  `idx_crd_source_doc` on `(source_document_id)`  
  `idx_crd_last_reviewed_by` on `(last_reviewed_by_user_id)`  

#### 3.3 New Table: `college_document_reviews`

```sql
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
```

#### 3.4 Append-Only Triggers

```sql
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
```

---

### 4. Legacy Data Backfill Evidence

#### 4.1 Backfill Strategy & Historical Truth Preservation

The backfill strictly abides by the rules set forth in Section 3 of the authorization:

1. **Approved Colleges & Approved Revisions:**
   ```sql
   UPDATE college_registration_documents crd
   JOIN college_registrations cr ON crd.registration_id = cr.id
   JOIN colleges c ON crd.college_id = c.id
   SET 
       crd.verification_status = 'ACCEPTED',
       crd.verification_provenance = 'LEGACY_COLLEGE_APPROVAL',
       crd.rejection_reason = NULL,
       crd.last_reviewed_by_user_id = NULL,
       crd.last_reviewed_at = NULL
   WHERE c.approval_status = 'APPROVED'
     AND cr.status = 'APPROVED';
   ```
   - Individual reviewer IDs and timestamps are preserved as `NULL`.
   - The institutional reviewer user ID and timestamp remain preserved in `college_registrations.reviewer_user_id` and `college_registrations.reviewed_at`.
2. **Pending, ACTION_REQUIRED, and REJECTED Applications:**
   - Automatically receive column defaults: `verification_status = 'PENDING'`, `verification_provenance = 'NOT_REVIEWED'`, `version = 0`.
   - Reviewer ID and timestamp remain `NULL`.
3. **No Synthetic History Rows:**
   - Zero rows are inserted into `college_document_reviews` during the migration.
   - Preserves audit integrity without inventing historical review events.

---

### 5. Runtime Database Privilege Separation (Operational Requirements)

To maintain defense-in-depth in production and staging environments:

1. **Migration User (`acadlytic_admin`):**
   - Possesses DDL and Trigger management privileges.
   - Runs Flyway migrations.
2. **Runtime Application User (`acadlytic_app`):**
   - Must NOT be granted schema-wide `ALL PRIVILEGES` or `UPDATE` on append-only audit tables.
   - Operational GRANT/REVOKE commands required for DBAs during deployment:
     ```sql
     -- Standard operational grants
     GRANT SELECT, INSERT, UPDATE ON acadlytic.* TO 'acadlytic_app'@'%';

     -- Revoke mutation privileges on append-only audit tables
     REVOKE UPDATE, DELETE ON acadlytic.college_document_reviews FROM 'acadlytic_app'@'%';
     REVOKE UPDATE, DELETE ON acadlytic.audit_events FROM 'acadlytic_app'@'%';
     FLUSH PRIVILEGES;
     ```
   - In the event an errant SQL update or ORM call bypasses application-level guards, MySQL returns `ER_TABLEACCESS_DENIED_ERROR`, and the triggers act as an immutable second barrier.

---

### 6. Testcontainers MySQL 8.0.36 Verification

All tests were executed against an actual Docker container running `mysql:8.0.36` (character set `utf8mb4`, collation `utf8mb4_unicode_ci`, timezone `UTC`).

#### 6.1 Migration Test Suite (`V6DocumentLevelReviewMigrationTest.java`)

| Test Method | Requirement Verified | Result | Time |
| :--- | :--- | :--- | :--- |
| `test1_v1ToV6MigrationsExecuteSuccessfully` | V1–V6 execute cleanly, tables/columns/triggers exist in `information_schema` | **PASS** | 0.05s |
| `test2_and_3_approvedCollegeDocumentsReceiveLegacyCollegeApproval...` | Legacy approved documents receive `LEGACY_COLLEGE_APPROVAL` with `NULL` reviewer & timestamp | **PASS** | 0.08s |
| `test4_pendingActionRequiredAndRejectedDocumentsReceiveNotReviewed` | Pending, action required, and rejected documents receive `NOT_REVIEWED` with `NULL` reviewer | **PASS** | 0.06s |
| `test5_noArtificialReviewHistoryRowsCreated` | Assert `college_document_reviews` row count is strictly 0 after backfill | **PASS** | 0.02s |
| `test6_compositeOwnershipFkRejectsCrossCollegeAndCrossRegistrationReferences` | Foreign key `fk_cdr_document_composite` rejects mismatched college, registration, or document | **PASS** | 0.09s |
| `test7_sourceDocumentAndRegistrationOwnershipEnforced` | Composite FK `fk_crd_source_document_composite` rejects cross-tenant source references | **PASS** | 0.08s |
| `test8_partiallyNullSourceReferencesRejected` | Check constraint `chk_crd_source_pair` enforces source document & revision atomicity | **PASS** | 0.06s |
| `test9_invalidVerificationStatusesAndProvenanceValuesRejected` | Check constraints reject illegal status, provenance, and review action values | **PASS** | 0.07s |
| `test10_replacementUniquenessPreventsDuplicateReplacementTargets` | Unique constraint `uq_crd_registration_replacement` rejects duplicate replacement targets in same revision | **PASS** | 0.09s |
| `test11_updateAgainstReviewHistoryFailsWithSqlState45000` | Trigger `trg_cdr_prevent_update` blocks UPDATE with SQLSTATE 45000 | **PASS** | 0.05s |
| `test12_deleteAgainstReviewHistoryFailsWithSqlState45000` | Trigger `trg_cdr_prevent_delete` blocks DELETE with SQLSTATE 45000 | **PASS** | 0.05s |
| `test13_failedReviewHistoryWritesDoNotLeavePartialDatabaseMutations` | Atomic rollback verified: failed history write reverts document verification status mutation | **PASS** | 0.06s |

**Summary: 12 tests run, 12 passed, 0 failures, 0 errors.**

#### 6.2 Regression Test Suite Execution

To guarantee zero adverse impact on existing capabilities, the full suite of integration tests was executed:

- `com.acadlytic.modules.auth.SchemaAndConstraintsIntegrationTest` (4 tests) — **PASS**
- `com.acadlytic.modules.colleges.CollegeRegistrationIntegrationTest` (4 tests) — **PASS**
- `com.acadlytic.modules.colleges.CollegeOnboardingIntegrationTest` (12 tests) — **PASS**
- `com.acadlytic.modules.colleges.CollegeReviewIntegrationTest` (21 tests) — **PASS**

**Backend Integration Regression: 41 tests run, 41 passed, 0 failures, 0 errors.**  
**Frontend Regression: 13 test files, 200 tests passed, 0 failures.**

---

### 7. Strict Scope-Boundary Confirmation

In accordance with Section 6 of the implementation authorization:

- **V6 Migration only:** `V6__document_level_review.sql` authored as sequential migration. V1 through V5 were untouched.
- **Entity mapping strictly necessary:** Updated only `CollegeRegistrationDocument.java` and added `DocumentVerificationStatus.java` / `DocumentVerificationProvenance.java` to support JPA entity validation (`ddl-auto: validate`).
- **No API / Controller changes:** No new document review endpoints or controllers were created.
- **No Service modifications:** `CollegeReviewService`, `CollegeOnboardingService`, and `CollegeLifecycleService` were NOT modified.
- **No Frontend changes:** Frontend codebase was NOT touched.
- **Aster Valley College Application:** Preserved in pristine state; zero state-mutating API calls executed.
- **Master Context and ADRs:** Untouched.
- **Module 3.6B / 3.6C:** NOT implemented.

---

### 8. Recommendation & Next Steps

Module 3.6A database schema and migration are complete, verified, and ready for Project Owner review. 

**Next Steps upon Project Owner Approval:**
1. Await authorization for **Module 3.6B: Backend Document Review Service & APIs** (implementing document-level review decisions, optimistic concurrency validation, and outbox notification batching).
