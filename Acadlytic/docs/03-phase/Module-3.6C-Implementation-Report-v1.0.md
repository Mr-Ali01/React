# Acadlytic — Phase 03, Module 3.6C: Backend College Approval Integration & Lifecycle
## Implementation Report v1.0

**Phase:** 03 — Super Admin Review Workflow  
**Module:** 3.6C — Backend College Approval Integration & Lifecycle  
**Status:** IMPLEMENTED & VERIFIED  
**Date:** 2026-11-26  
**Reference:** Approved Module 3.6 Planning Specification v1.1 + Targeted Clarification Addendum (BF-07 through BF-12)

---

## 1. Executive Summary

Phase 03, Module 3.6C integrates document verification gates into the Super Admin college approval workflow (`CollegeReviewService.recordDecision`), establishes hierarchical locking between parent `College` entities and child `CollegeRegistrationDocument` records, enforces revision isolation, guarantees review freezing upon college decision commit, and preserves the operational lifecycle transitions and session revocations established in Module 3.5.

All 14 mandatory verification scenarios were implemented and validated using real MySQL 8.0.36 Testcontainers integration tests in `CollegeApprovalIntegrationTest.java`. The complete backend test suite passed with **290/290 tests passing (zero failures, zero errors, zero skips)** and a clean Maven package build completed with **BUILD SUCCESS**.

---

## 2. Architecture & Design Enforcement

### 2.1 Document Verification Gates in `CollegeReviewService.recordDecision`
When a Super Admin issues an `APPROVE` review decision (`ReviewDecisionAction.APPROVE`):

1. **Active Documents Retrieval & Locking:**
   - Active documents belonging to the submitted registration revision (`submittedRevision.getId()`) are queried under pessimistic write lock using `collegeRegistrationDocumentRepository.findByRegistrationIdWithLock(submittedRevision.getId())`.
   - Superseded documents (`replacesDocumentId != null`) within the revision are excluded, computing the active verification set.

2. **Mandatory Category Completeness Gate:**
   - The active document set must contain both mandatory categories:
     - `DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE`
     - `DocumentCategory.AUTHORIZED_SIGNATORY_ID`
   - If either mandatory category is missing, the transaction immediately raises:
     ```
     AppException("REQUIRED_DOCUMENTS_MISSING",
         "Required verification documents missing: University Affiliation Certificate and Authorized Signatory ID are mandatory.",
         HttpStatus.BAD_REQUEST)
     ```

3. **Document Verification Status Gate:**
   - Every active document (both mandatory and optional) must possess `verificationStatus == DocumentVerificationStatus.ACCEPTED`.
   - If any active document has status `REJECTED`:
     ```
     AppException("DOCUMENTS_REJECTED",
         "Cannot approve application: Document '" + doc.getOriginalFilename() + "' (" + doc.getDocumentCategory() + ") was rejected. Action must be requested to allow document replacement.",
         HttpStatus.CONFLICT)
     ```
   - If any active document has status `PENDING` (or unverified):
     ```
     AppException("DOCUMENTS_NOT_VERIFIED",
         "Cannot approve application: Document '" + doc.getOriginalFilename() + "' (" + doc.getDocumentCategory() + ") is pending verification.",
         HttpStatus.CONFLICT)
     ```

4. **Action Request & Rejection Autonomy:**
   - The document verification gate applies **strictly** to `APPROVE` actions. Super Admins retain full authority to issue `REQUEST_ACTION` (e.g., instructing the applicant to replace rejected documents) or `REJECT` the application regardless of document verification statuses.

---

### 2.2 Hierarchical Locking & Concurrency Specification

To prevent deadlocks and eliminate race conditions between individual document review decisions (`recordDocumentDecision`) and whole-application review decisions (`recordDecision`), strict hierarchical locking is enforced:

1. **Root Lock First:**
   Both `recordDecision` and `recordDocumentDecision` acquire a pessimistic write lock on the parent `College` row first:
   ```java
   College college = collegeRepository.findByIdWithLock(collegeId)
           .orElseThrow(() -> new AppException("COLLEGE_NOT_FOUND", ...));
   ```
2. **Child Document Lock Second:**
   - In `recordDocumentDecision`: The target document row is locked second via `findByIdAndCollegeIdWithLock(documentId, collegeId)`.
   - In `recordDecision` (APPROVE): Active documents of the submitted revision are locked second via `findByRegistrationIdWithLock(submittedRevision.getId())` with deterministic `ORDER BY d.id ASC`.
3. **Deadlock Elimination:**
   Because both execution paths serialize on the parent `College` row lock before attempting any document-level locks, deadlocks between concurrent document reviews and college decisions are mathematically eliminated.
4. **Zero Parent Version Mutation from Document Decisions:**
   Document decisions (`recordDocumentDecision`) update and advance versions solely on `college_registration_documents` rows. The parent `College` entity version remains unmutated, preventing false optimistic lock failures when a Super Admin approves after reviewing documents.

---

### 2.3 Transaction Atomicity & Rollback Guarantees

If any verification gate fails during `recordDecision(APPROVE)`:
- The Spring transaction (`@Transactional`) rolls back completely.
- `college.approval_status` remains `PENDING`; `college.version` remains unincremented.
- `college_registrations.status` remains `PENDING`; `reviewed_at` remains `NULL`.
- Zero document rows are modified.
- Zero audit event rows are inserted into `audit_events`.
- Zero notification emails are written to `outbox_emails`.

---

### 2.4 Lifecycle Integration, Review Freeze & Revision Isolation

1. **Review Freeze Guarantee:**
   Once a review decision (`APPROVE`, `REQUEST_ACTION`, or `REJECT`) commits:
   - `college.approvalStatus` transitions to `APPROVED`, `ACTION_REQUIRED`, or `REJECTED`.
   - Subsequent calls to `recordDocumentDecision` or `executeRecordDocumentDecision` evaluate `validatePendingReviewEligibility(college)` and immediately reject with:
     ```
     409 Conflict: APPLICATION_NOT_AWAITING_REVIEW
     ```
2. **Revision Isolation:**
   - Active documents evaluated by the approval gate are strictly scoped to `submittedRevision.getId()`.
   - Historical documents belonging to earlier registration revisions (e.g., revision v1) cannot satisfy the approval gate of a subsequent revision (e.g., revision v2).
3. **Module 3.5 Lifecycle Continuity:**
   - Upon successful approval, `collegeLifecycleService.onCollegeApproved` transitions college status to `ACTIVE`, creates/updates operational college tenants, records audit trails, emits `COLLEGE_APPROVED` outbox notifications, and triggers `sessionRevocationService.revokeAllSessionsForUser` to revoke temporary onboarding sessions.

---

## 3. Code Modifications

### 3.1 Repository Enhancements
**File:** [CollegeRegistrationDocumentRepository.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java#L20-L25)
- Added pessimistic write lock query:
  ```java
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT d FROM CollegeRegistrationDocument d WHERE d.registrationId = :registrationId ORDER BY d.id ASC")
  @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})
  List<CollegeRegistrationDocument> findByRegistrationIdWithLock(@Param("registrationId") Long registrationId);
  ```

### 3.2 Service Gate Integration
**File:** [CollegeReviewService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java#L535-L585)
- Embedded document verification gate inside `recordDecision` case `APPROVE`:
  - Enforced hierarchical locking on submitted revision documents.
  - Computed active documents excluding superseded IDs.
  - Checked mandatory presence of `UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`.
  - Enforced `DOCUMENTS_REJECTED` check on rejected active documents.
  - Enforced `DOCUMENTS_NOT_VERIFIED` check on pending or unverified active documents.

### 3.3 Unit Test Suite
**File:** [CollegeReviewServiceUnitTest.java](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeReviewServiceUnitTest.java#L320-L460)
- Updated mock expectations in `recordDecision_approve_success` for `findByRegistrationIdWithLock`.
- Added unit tests:
  - `recordDecision_approve_missingMandatory_throwsRequiredDocumentsMissing`
  - `recordDecision_approve_pendingDoc_throwsDocumentsNotVerified`
  - `recordDecision_approve_rejectedDoc_throwsDocumentsRejected`

---

## 4. Verification & Test Evidence

### 4.1 Dedicated Integration Test Suite: `CollegeApprovalIntegrationTest`
**File:** [CollegeApprovalIntegrationTest.java](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeApprovalIntegrationTest.java)

The test suite implements all 14 required verification scenarios against MySQL 8.0.36 Testcontainers:

| Scenario | Test Method | Outcome |
| :--- | :--- | :--- |
| **1** | `approvalSucceeds_whenAllMandatoryAndOptionalDocumentsAccepted` | PASS (200 OK, transitions to ACTIVE/APPROVED) |
| **2** | `approvalBlocked_whenMandatoryDocumentMissing` | PASS (400 `REQUIRED_DOCUMENTS_MISSING`) |
| **3** | `approvalBlocked_whenMandatoryDocumentPending` | PASS (409 `DOCUMENTS_NOT_VERIFIED`) |
| **4** | `approvalBlocked_whenMandatoryDocumentRejected` | PASS (409 `DOCUMENTS_REJECTED`) |
| **5** | `approvalBlocked_whenUploadedOptionalDocumentPending` | PASS (409 `DOCUMENTS_NOT_VERIFIED`) |
| **6** | `approvalBlocked_whenUploadedOptionalDocumentRejected` | PASS (409 `DOCUMENTS_REJECTED`) |
| **7** | `successfulApproval_producesExpectedCollegeAndRegistrationLifecycleTransitions` | PASS (APPROVED, ACTIVE, outbox email, audit event) |
| **8** | `failedApproval_producesZeroPartialMutationsAndZeroAuditEvents` | PASS (Raw JDBC verifies zero version/status/audit mutation) |
| **9** | `concurrency_simultaneousDocumentReviewAndCollegeApproval_serializedViaParentLock` | PASS (Multithreaded latch verification, parent lock serialization) |
| **10** | `documentReviews_rejectedAfterCollegeApprovalOrActionRequestCommits` | PASS (409 `APPLICATION_NOT_AWAITING_REVIEW`) |
| **11** | `correctionDraftAndResubmission_allowsReviewOfNewRevisionDocuments` | PASS (End-to-end correction draft, replace, resubmit, approve) |
| **12** | `historicalDocumentsFromEarlierRevisions_cannotSatisfyNewRevisionApprovalGate` | PASS (400 `REQUIRED_DOCUMENTS_MISSING` on v2) |
| **13** | `staleCollegeExpectedVersion_returns409Conflict` | PASS (409 `STALE_APPLICATION_VERSION`) |
| **14** | `existingModule35LifecycleAndSessionRevocation_remainsIntact` | PASS (Session revoked, management unlocked, fresh login succeeds) |

**Result:** `14 passed, 0 failed, 0 errors` (48.01s).

---

### 4.2 Targeted Regression Suite Execution
Command:
```powershell
mvn -f backend/pom.xml test -Dtest=CollegeApprovalIntegrationTest,CollegeReviewIntegrationTest,DocumentReviewIntegrationTest,CollegeLifecycleIntegrationTest,CollegeOnboardingIntegrationTest,V6DocumentLevelReviewMigrationTest
```
Output:
```
[INFO] Running com.acadlytic.modules.colleges.CollegeApprovalIntegrationTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 48.07 s
[INFO] Running com.acadlytic.modules.colleges.CollegeLifecycleIntegrationTest
[INFO] Tests run: 23, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 18.06 s
[INFO] Running com.acadlytic.modules.colleges.CollegeOnboardingIntegrationTest
[INFO] Tests run: 40, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 39.81 s
[INFO] Running com.acadlytic.modules.colleges.CollegeReviewIntegrationTest
[INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 28.51 s
[INFO] Running com.acadlytic.modules.colleges.DocumentReviewIntegrationTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 24.38 s
[INFO] Running com.acadlytic.modules.colleges.V6DocumentLevelReviewMigrationTest
[INFO] Tests run: 27, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 36.16 s
[INFO] 
[INFO] Results:
[INFO] Tests run: 139, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS (03:32 min)
```

---

### 4.3 Full Backend Test Suite Execution
Command:
```powershell
mvn -f backend/pom.xml test
```
Output:
```
[INFO] Tests run: 290, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  05:07 min
[INFO] Finished at: 2026-11-26T20:43:00+05:30
```

---

### 4.4 Clean Package Build Verification
Command:
```powershell
mvn -f backend/pom.xml clean package -DskipTests
```
Output:
```
[INFO] Building jar: C:\React\Acadlytic\backend\target\acadlytic-backend-0.0.1-SNAPSHOT.jar
[INFO] Replacing main artifact with repackaged archive.
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  38.926 s
[INFO] Finished at: 2026-11-26T20:36:35+05:30
```

---

## 5. Scope Boundaries & Compliance Record

1. **Backend Implementation Only:** All changes are restricted to `backend/src/main` and `backend/src/test`. Zero frontend files were modified.
2. **Flyway Migrations Untouched:** Migrations V1 through V6 remain completely unmodified.
3. **ADRs & Historical Reports Untouched:** Zero ADRs, previous module reports, or specifications were altered.
4. **Master Context Preservation:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md` was **NOT** modified during this task. Awaiting explicit Project Owner review and instructions.
5. **No Follow-on Work Initiated:** Implementation stops immediately upon delivery of this report.

---

## 6. Deliverables Index

- **Service Implementation:** [CollegeReviewService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java)
- **Repository Implementation:** [CollegeRegistrationDocumentRepository.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java)
- **Dedicated Integration Test Suite:** [CollegeApprovalIntegrationTest.java](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeApprovalIntegrationTest.java)
- **Unit Test Suite:** [CollegeReviewServiceUnitTest.java](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeReviewServiceUnitTest.java)
- **Implementation Report:** [Module-3.6C-Implementation-Report-v1.0.md](file:///c:/React/Acadlytic/docs/03-phase/Module-3.6C-Implementation-Report-v1.0.md)
