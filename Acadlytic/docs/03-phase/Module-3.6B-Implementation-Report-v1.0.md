# Acadlytic — Phase 03, Module 3.6B Implementation Report
## Backend Document Review Service & APIs

**Document:** `docs/03-phase/Module-3.6B-Implementation-Report-v1.0.md`  
**Phase:** 03 — Super Admin Review Workflow  
**Module:** 3.6B — Backend Document Review Service & APIs  
**Report Version:** 1.0  
**Implementation Status:** COMPLETED — PENDING PROJECT OWNER APPROVAL  
**Implementation Date:** 2026-11-26  
**Reference Architecture:** Approved Planning Report v1.1 + Final Targeted Clarification Addendum BF-07 through BF-12 + Module 3.6A Approved Implementation Report v1.3  

---

## 1. Executive Summary

Module 3.6B introduces the backend services, controllers, DTOs, domain logic, concurrency controls, and integration tests for **individual document verification** within Acadlytic's Super Admin College Review workflow.

Prior to Module 3.6, the backend only supported college-level review decisions (`APPROVE`, `REQUEST_ACTION`, `REJECT`), with no individual document verification status or review audit history. Module 3.6A established the underlying database schema and Flyway V6 migration. Under this Module 3.6B authorization, the application service layer has been fully implemented and verified against MySQL 8.0.36 via Testcontainers.

### Key Capabilities Delivered:
1. **Document Verification Decisions (`ACCEPT`, `REJECT`):** Super Admin reviewers can independently review and decide each submitted registration document.
2. **Provenance Tracking:** Documents explicitly track their provenance (`NOT_REVIEWED`, `DIRECT_REVIEW`, `CARRIED_FORWARD`, `LEGACY_COLLEGE_APPROVAL`).
3. **Optimistic Concurrency Control:** Enforces document-level version validation (`expectedDocumentVersion` vs `CollegeRegistrationDocument.version`), allowing initial reviews at valid version `0` and rejecting stale submissions with `409 STALE_DOCUMENT_VERSION`.
4. **Idempotency & Reversal Semantics:** Duplicate successful requests are handled idempotently without duplicate audit rows or version increments, while intentional status reversals advance the version and append audit records.
5. **Hierarchical Locking & Zero Parent Mutation:** Review decisions serialize by acquiring a pessimistic write lock on the parent `College` row first, followed by the target `CollegeRegistrationDocument` row second, while maintaining zero mutation on the parent `College.version`.
6. **Bounded Deadlock/Timeout Retries:** Wrapped with `TransactionTemplate` using `PROPAGATION_REQUIRES_NEW`, providing up to 3 retry attempts with exponential backoff.
7. **Strict Ownership & Lifecycle Freezing:** Enforces composite college-revision-document ownership and freezes document review actions once a college-level decision has committed.
8. **Replacement Document Rules:** Protects against duplicate replacements in the active draft revision (`409 REPLACEMENT_ALREADY_EXISTS` and database constraint `uq_crd_registration_replacement`), restricts cross-revision replacement strictly to rejected documents of the immediately preceding submitted revision, and verifies category match.
9. **Document Review History API:** Exposes chronological audit history records in reverse order with reviewer details.
10. **Comprehensive MySQL Integration Testing:** 17 new end-to-end integration scenarios implemented in `DocumentReviewIntegrationTest`, with 100% pass rate alongside all existing suites (123 tests passing with 0 failures).

---

## 2. Implemented Components & File Manifest

### 2.1 Domain Entities & Enums

| File | Purpose |
|---|---|
| [`DocumentVerificationStatus.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationStatus.java) | Enum representing document status: `PENDING`, `ACCEPTED`, `REJECTED`. |
| [`DocumentVerificationProvenance.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationProvenance.java) | Enum representing verification origin: `NOT_REVIEWED`, `DIRECT_REVIEW`, `CARRIED_FORWARD`, `LEGACY_COLLEGE_APPROVAL`. |
| [`DocumentReviewAction.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewAction.java) | Action enum for incoming review requests (`ACCEPT`, `REJECT`) with JSON creator handling string variants and mapping helpers. |
| [`CollegeDocumentReview.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeDocumentReview.java) | JPA entity mapped to append-only table `college_document_reviews`. |
| [`CollegeRegistrationDocument.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistrationDocument.java) | Enriched with V6 verification columns (`verification_status`, `verification_provenance`, `rejection_reason`, `last_reviewed_by_user_id`, `last_reviewed_at`, `source_document_id`, `source_registration_id`, `@Version version`). |
| [`AuditEventType.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java) | Added `COLLEGE_REGISTRATION_DOC_ACCEPTED` and `COLLEGE_REGISTRATION_DOC_REJECTED`. |

### 2.2 Data Transfer Objects (DTOs)

| File | Purpose |
|---|---|
| [`DocumentReviewDecisionRequest.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewDecisionRequest.java) | Request payload: `action`, `notes`, `rejectionReason`, `expectedDocumentVersion`. |
| [`DocumentReviewDecisionResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewDecisionResponse.java) | Response payload: `documentId`, `registrationId`, `documentCategory`, `verificationStatus`, `verificationProvenance`, `rejectionReason`, `lastReviewedAt`, `lastReviewedByUserId`, `reviewerEmail`, `version`. |
| [`DocumentReviewHistoryItemResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewHistoryItemResponse.java) | Review history item: `id`, `reviewId`, `documentId`, `registrationId`, `collegeId`, `action`, `rejectionReason`, `reviewerUserId`, `reviewerEmail`, `reviewedAt`, `createdAt`. |
| [`DocumentResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentResponse.java) | Enriched with verification fields while maintaining backward-compatible constructors. |

### 2.3 Repositories

| File | Purpose |
|---|---|
| [`CollegeDocumentReviewRepository.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeDocumentReviewRepository.java) | Spring Data JPA repository querying review decisions by `(collegeId, documentId)` ordered deterministically by `reviewedAt DESC, id DESC`. |
| [`CollegeRegistrationDocumentRepository.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java) | Added `@Lock(LockModeType.PESSIMISTIC_WRITE)` query `findByIdAndCollegeIdWithLock(Long id, Long collegeId)` with 3000ms query hint timeout. |

### 2.4 Application Services & Controllers

| File | Purpose |
|---|---|
| [`CollegeReviewService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java) | Implemented `recordDocumentDecision`, `executeRecordDocumentDecision`, and `getDocumentReviewHistory`. Enforces hierarchical locking, bounded retries, concurrency version checking, zero parent mutation, and audit emissions. |
| [`CollegeReviewController.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeReviewController.java) | Exposed `POST /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision` and `GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/history`. |
| [`CollegeOnboardingService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeOnboardingService.java) | Implemented replacement document rules: duplicate replacement protection (`REPLACEMENT_ALREADY_EXISTS`), cross-revision replacement targeting rejected documents from immediately preceding submitted revision, category matching, and carry-forward exclusion of rejected documents. |

### 2.5 Test Suites

| File | Tests | Purpose |
|---|---|---|
| [`DocumentReviewIntegrationTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/DocumentReviewIntegrationTest.java) | 17 | End-to-end MySQL Testcontainers test suite covering all security, concurrency, idempotency, reversal, duplicate protection, freeze, and trigger assertions. |
| [`CollegeReviewControllerUnitTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/controller/CollegeReviewControllerUnitTest.java) | 16 | Controller-level mock unit tests for queue, details, decisions, and rate limiting. |
| [`CollegeReviewServiceUnitTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeReviewServiceUnitTest.java) | 17 | Service-level mock unit tests verifying validation, authorization, and transitions. |
| [`CollegeOnboardingServiceUnitTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeOnboardingServiceUnitTest.java) | 15 | Unit tests for college onboarding, revision draft creation, document upload, and replacement. |
| [`CollegeReviewIntegrationTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeReviewIntegrationTest.java) | 21 | Regression integration suite for college-level review queue and decisions. |
| [`CollegeOnboardingIntegrationTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeOnboardingIntegrationTest.java) | 10 | Regression integration suite for onboarding workflows and document management. |
| [`CollegeRegistrationIntegrationTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeRegistrationIntegrationTest.java) | 5 | Registration workflow integration tests. |
| [`SchemaAndConstraintsIntegrationTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/auth/SchemaAndConstraintsIntegrationTest.java) | 5 | Database schema and constraint integrity tests. |
| [`V6DocumentLevelReviewMigrationTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/V6DocumentLevelReviewMigrationTest.java) | 17 | Flyway V6 migration and preflight verification test suite. |

---

## 3. Detailed Business Rules Implementation

### 3.1 Verification Status & Provenance Semantics
- **`PENDING`:** Initial state for submitted documents. Provenance is initialized to `NOT_REVIEWED`.
- **`ACCEPTED`:** Super Admin approves the document. Provenance is set to `DIRECT_REVIEW`. Rejection reason must be null.
- **`REJECTED`:** Super Admin rejects the document. Provenance is set to `DIRECT_REVIEW`. Rejection reason is mandatory (10–1000 characters).
- **`CARRIED_FORWARD`:** Unchanged non-rejected documents carried forward into revision $v+1$ retain their previous review status, provenance set to `CARRIED_FORWARD`, and store pointers to `source_document_id` and `source_registration_id`.
- **`LEGACY_COLLEGE_APPROVAL`:** Assigned strictly by the V6 migration backfill to documents belonging to previously approved colleges.

### 3.2 Hierarchical Locking Strategy & Zero Parent Mutation
To prevent deadlocks between concurrent document reviews and college-level review decisions:
1. Every document decision acquires a `PESSIMISTIC_WRITE` lock on the **parent `College` row first** (`collegeRepository.findByIdWithLock(collegeId)`).
2. It acquires a `PESSIMISTIC_WRITE` lock on the **target `CollegeRegistrationDocument` row second** (`collegeRegistrationDocumentRepository.findByIdAndCollegeIdWithLock(documentId, collegeId)`).
3. **Zero Mutation on Parent Version:** The service never modifies or saves the `College` entity during document review decisions. `collegeRepository.save(college)` is never invoked in `recordDocumentDecision`. As confirmed in `DocumentReviewIntegrationTest`, `College.version` remains completely unchanged.

### 3.3 Concurrency Control & Valid Version 0
- Document entities support optimistic concurrency via `@Version private Long version;`.
- Newly uploaded documents start at `version = 0`.
- The decision endpoint validates `expectedDocumentVersion`:
  - Initial review at `expectedDocumentVersion = 0` is strictly valid.
  - If `expectedDocumentVersion != doc.getVersion()`, the request is rejected with `409 STALE_DOCUMENT_VERSION`.
  - Concurrent decisions on the same document serialize: the first transaction commits and advances version to 1, while the second transaction sees the stale version and receives HTTP 409.

### 3.4 Idempotency & Retry Semantics
- A client retrying an identical decision (e.g., repeating an `ACCEPT` request that previously succeeded):
  - If `doc.getVerificationStatus() == targetStatus` (and rejection reasons match if rejected), and `expectedDocumentVersion` is either the current version or `currentVersion - 1`, the service returns `200 OK` idempotently.
  - No duplicate audit records are inserted into `college_document_reviews`.
  - No duplicate `AuditEvent` rows are created in `audit_events`.
  - The document `version` is not bumped.
- If the reviewer intends a status reversal (e.g., changing from `ACCEPTED` to `REJECTED`):
  - `expectedDocumentVersion` must strictly match the current document version.
  - The status is updated, a new audit row is appended, and the version increments.

### 3.5 Bounded Deadlock / Lock Timeout Retries
- In `CollegeReviewService`, document decisions are orchestrated through a retry loop:
  - Up to 3 attempts with exponential backoff (50ms base, jittered).
  - Each attempt executes within a fresh transaction via `TransactionTemplate` with `Propagation.REQUIRES_NEW`.
  - Traps `PessimisticLockingFailureException` (covering both lock acquisition timeouts and deadlocks).
  - Exhaustion throws `CONCURRENT_REVIEW_CONFLICT` (HTTP 409).

### 3.6 Strict Lifecycle & Decision Freeze
- Document decisions require the parent application to be in a pending review state (`submittedRevision.getStatus() == PENDING` and `submittedForReviewAt != null`).
- Once a college-level decision commits (`APPROVE`, `REQUEST_ACTION`, or `REJECT`):
  - The college status becomes `APPROVED`, `ACTION_REQUIRED`, or `REJECTED`.
  - Any subsequent call to the document decision endpoint is immediately rejected with `409 APPLICATION_NOT_AWAITING_REVIEW`.

### 3.7 Replacement Document Rules & Cross-Revision Integrity
- **Duplicate Replacement Protection:** In `CollegeOnboardingService.uploadDocument`, if an active draft revision already contains a document where `replacesDocumentId == targetId`, attempting to upload another replacement targeting the same document is rejected with `409 REPLACEMENT_ALREADY_EXISTS`. Database unique constraint `uq_crd_registration_replacement` (`registration_id, replaces_document_id`) enforces this at the relational level.
- **Cross-Revision Targeting:** A replacement document can target a document from the active draft OR the immediately preceding submitted revision ($v-1$).
- **Non-Rejected Rejection:** If targeting a document from the previous revision, that target document must have `verificationStatus == REJECTED`. Attempting to replace a non-rejected document is rejected with `400 CANNOT_REPLACE_NON_REJECTED_DOCUMENT`.
- **Category Mismatch:** The replacement document must match the category of the target document, otherwise rejected with `400 CATEGORY_MISMATCH_ON_REPLACEMENT`.
- **Carry-Forward Exclusion:** When `createCorrectionDraft` opens revision $v+1$, rejected documents from revision $v$ are explicitly skipped, leaving slots open for replacement.

### 3.8 Append-Only Audit Integrity
- Review decisions insert immutable audit rows into `college_document_reviews`.
- Database triggers `trg_cdr_prevent_update` and `trg_cdr_prevent_delete` strictly reject any direct `UPDATE` or `DELETE` with `SQLSTATE '45000'`.
- The test suite verified that trigger execution blocks updates and deletes.

---

## 4. Test Evidence & Verification Results

### 4.1 Focused Test Suite: `DocumentReviewIntegrationTest`
Executed against Testcontainers MySQL 8.0.36:

| # | Test Method Name | Scenario Description | Result |
|---|---|---|---|
| 1 | `documentReview_unauthenticated_returns401` | Unauthenticated decision request returns 401 Unauthorized | PASS |
| 2 | `documentReview_collegeAdmin_returns403` | Calling decision as COLLEGE_ADMIN returns 403 Forbidden | PASS |
| 3 | `documentReview_crossCollegeAccess_returns404` | Reviewing document belonging to another college returns 404 DOCUMENT_NOT_FOUND | PASS |
| 4 | `documentReview_crossRevisionAccess_returns409` | Reviewing document from prior revision returns 409 APPLICATION_NOT_AWAITING_REVIEW | PASS |
| 5 | `documentReview_validAcceptDecision_updatesDocument_createsAudit_emitsEvent_preservesParentVersion` | ACCEPT decision updates status to ACCEPTED, sets DIRECT_REVIEW, records audit row, emits event, increments doc version from 0 to 1, and leaves parent College.version completely unchanged | PASS |
| 6 | `documentReview_validRejectDecision_updatesDocument_storesReason_createsAudit_emitsEvent` | REJECT decision updates status to REJECTED, stores reason, records audit row, emits event, and increments doc version | PASS |
| 7 | `documentReview_rejectionReasonValidation_enforcesConstraints` | Rejection reason validation: rejects null, <10 chars, >1000 chars on REJECT; rejects non-null reason on ACCEPT | PASS |
| 8 | `documentReview_concurrency_staleExpectedVersionReturns409` | Initial review at version 0 succeeds; subsequent mutation with stale version 0 rejected with 409 STALE_DOCUMENT_VERSION | PASS |
| 9 | `documentReview_idempotentRetry_identicalRequestDoesNotAdvanceVersionOrDuplicateAudit` | Repeated identical ACCEPT requests return 200 without version increment or duplicate audit rows | PASS |
| 10 | `documentReview_intentionalReversal_withCurrentVersion_succeedsAndAdvancesVersion` | Status reversal from ACCEPTED (v1) to REJECTED with expectedVersion 1 succeeds, increments version to 2, and appends second audit row | PASS |
| 11 | `documentReview_concurrentDecisions_serializedViaParentLock_oneSucceedsOneConflicts` | Two concurrent threads attempting conflicting decisions at version 0 are serialized by parent lock: exactly one succeeds (200) and one receives 409 STALE_DOCUMENT_VERSION | PASS |
| 12 | `documentReview_duplicateReplacementProtection_preventsReplacingSameDocumentTwice` | Duplicate replacement in draft revision blocked with 409 REPLACEMENT_ALREADY_EXISTS and database unique constraint uq_crd_registration_replacement | PASS |
| 13 | `documentReview_crossRevisionReplacement_rejectsNonRejectedOrCategoryMismatch` | Cross-revision replacement rejects non-rejected document (400 CANNOT_REPLACE_NON_REJECTED_DOCUMENT) and category mismatch (400 CATEGORY_MISMATCH_ON_REPLACEMENT) | PASS |
| 14 | `documentReview_decisionFreeze_whenCollegeDecisionCommitted_returns409` | Document reviews frozen (409 APPLICATION_NOT_AWAITING_REVIEW) once college-level decision commits | PASS |
| 15 | `documentReview_appendOnlyTrigger_prohibitsUpdateAndDelete` | Direct SQL UPDATE and DELETE on college_document_reviews blocked by triggers with SQLSTATE 45000 | PASS |
| 16 | `documentReview_getHistory_returnsChronologicalAuditRecordsWithEmails` | GET history API returns reverse-chronological audit entries with reviewer user emails | PASS |
| 17 | `collegeReviewDetail_returnsEnrichedDocumentVerificationFields` | GET college review detail returns enriched verification fields (status, provenance, lastReviewedByUserId, version) | PASS |

**Test Execution Result:**  
`Tests run: 17, Failures: 0, Errors: 0, Skipped: 0`  
`BUILD SUCCESS` (Time elapsed: 147.6s)

### 4.2 Comprehensive Regression Test Results

| Test Class | Suite Type | Tests Run | Failures | Errors | Result |
|---|---|---|---|---|---|
| `DocumentReviewIntegrationTest` | MySQL Testcontainers Integration | 17 | 0 | 0 | **PASS** |
| `CollegeReviewIntegrationTest` | MySQL Testcontainers Integration | 21 | 0 | 0 | **PASS** |
| `CollegeOnboardingIntegrationTest` | MySQL Testcontainers Integration | 10 | 0 | 0 | **PASS** |
| `CollegeRegistrationIntegrationTest` | MySQL Testcontainers Integration | 5 | 0 | 0 | **PASS** |
| `SchemaAndConstraintsIntegrationTest` | MySQL Testcontainers Integration | 5 | 0 | 0 | **PASS** |
| `V6DocumentLevelReviewMigrationTest` | MySQL Testcontainers Integration | 17 | 0 | 0 | **PASS** |
| `CollegeReviewControllerUnitTest` | Spring WebMvc Unit | 16 | 0 | 0 | **PASS** |
| `CollegeReviewServiceUnitTest` | Mockito Service Unit | 17 | 0 | 0 | **PASS** |
| `CollegeOnboardingServiceUnitTest` | Mockito Service Unit | 15 | 0 | 0 | **PASS** |
| **Total** | | **123** | **0** | **0** | **100% PASS** |

---

## 5. Scope Boundaries & Strict Compliance

1. **Module 3.6C (College Approval Integration & Lifecycle Gates):**
   - Strictly NOT started or implemented.
   - College-level approval decision (`recordDecision` with `APPROVE`) has not yet been modified to require all documents to be `ACCEPTED`. This is deferred exclusively to Module 3.6C.
2. **Frontend Review Workflow:**
   - Strictly NOT modified. No React components, API hooks, or frontend test suites were altered in this task.
3. **Database Migrations:**
   - No new Flyway migration scripts were created. Schema remains cleanly at Flyway V6.
4. **Master Context Status:**
   - `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md` was preserved intact. Module 3.6B is NOT marked as approved; status remains `IN_PROGRESS` pending Project Owner review.

---

## 6. Project Owner Review Recommendation

Module 3.6B has been implemented strictly adhering to the approved specifications, architectural constraints, concurrency protocols, and security rules. All 123 relevant unit and integration tests are passing against MySQL 8.0.36 Testcontainers.

This implementation report is submitted for formal Project Owner review. Module 3.6C and frontend integration will await explicit approval.
