# Acadlytic — Phase 03 Final Backend Verification & Test Stabilization Report v1.0

**Date:** 2026-11-27  
**Branch:** `main`  
**Working Directory:** `c:\React\Acadlytic`  
**Execution Context:** Post-DEF-01 Targeted Remediation Stabilization & Verification  
**Final Verdict:** `VERIFIED`

---

## 1. Executive Summary & Verdict

### Final Verdict: `VERIFIED`

All 8 test failures reported in the untracked integration test suite `backend/src/test/java/com/acadlytic/modules/colleges/DocumentReviewIntegrationTest.java` have been investigated, isolated, and permanently resolved:
- **Group A (7 Version Failures):** Root-caused to deferred Hibernate `@Version` increments prior to transaction commit when calling `save(entity)` rather than `saveAndFlush(entity)` in `CollegeReviewService#executeRecordDocumentDecision`. Resolved in production code by invoking `saveAndFlush(doc)`, guaranteeing immediate persistence-context synchronization and accurate version reflection in both the HTTP response and audit trail.
- **Group B (1 Fixture Failure):** Root-caused to an obsolete test fixture in `documentReview_decisionFreeze_whenCollegeDecisionCommitted_returns409` that lacked the second mandatory document (`AUTHORIZED_SIGNATORY_ID`) and left the affiliation certificate in `PENDING` status. Under the newly enforced DEF-01 document verification gate, `APPROVE` rightly threw `400 Bad Request` (`REQUIRED_DOCUMENTS_MISSING`). Updating the test setup to satisfy mandatory document acceptance enabled legitimate college approval and allowed the subsequent decision freeze assertion to pass cleanly.

Following these evidence-supported corrections, full verification was conducted across all backend and frontend layers:
- **`DocumentReviewIntegrationTest`:** 19/19 tests passed (0 failures, 0 errors, 0 skipped).
- **`CollegeReviewServiceUnitTest`:** 25/25 tests passed (0 failures).
- **`CollegeReviewControllerUnitTest`:** 16/16 tests passed (0 failures).
- **`CollegeApprovalIntegrationTest`:** 15/15 tests passed (0 failures).
- **`CollegeReviewIntegrationTest`:** 21/21 tests passed (0 failures).
- **Full Backend Test Suite (`mvn test`):** 296/296 tests passed across all modules in 03:58 min.
- **Backend Clean Package (`mvn clean package -DskipTests`):** BUILD SUCCESS, producing `acadlytic-backend-0.0.1-SNAPSHOT.jar`.
- **Frontend Vitest Suite (`vitest run`):** 14/14 suites, 213/213 tests passed.
- **Frontend Typecheck (`tsc --noEmit`):** 0 errors.
- **Frontend Build (`tsc && vite build`):** Built in 6.72s with zero compile errors.

---

## 2. Git Working-Tree State

### 2.1 Branch & Tracking
- **Branch:** `main` (up to date with `origin/main`).
- **Safety Guarantee:** No existing untracked files were deleted, overwritten, or discarded. All untracked test fixtures, migrations, DTOs, and documentation files remain completely intact.

### 2.2 Files Modified During This Stabilization Step
1. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java` (Line 921: changed `save(doc)` to `saveAndFlush(doc)`).
2. `backend/src/test/java/com/acadlytic/modules/colleges/DocumentReviewIntegrationTest.java` (Lines 923–940: seeded accepted mandatory documents in `documentReview_decisionFreeze_whenCollegeDecisionCommitted_returns409`).

---

## 3. Root Cause Analysis

### 3.1 Group A: Seven Version Assertion Failures in `DocumentReviewIntegrationTest.java`
- **Failing Tests:**
  1. `documentReview_validAcceptDecision_updatesDocument_createsAudit_emitsEvent_preservesParentVersion` (line 363)
  2. `documentReview_validRejectDecision_updatesDocument_storesReason_createsAudit_emitsEvent` (line 421)
  3. `documentReview_concurrency_staleExpectedVersionReturns409` (line 517)
  4. `documentReview_idempotentRetry_identicalRequestDoesNotAdvanceVersionOrDuplicateAudit` (lines 553, 563, 574)
  5. `documentReview_idempotentRetry_rejectReasonMatchingAndMismatchRejection` (lines 605, 616)
  6. `documentReview_intentionalReversal_withCurrentVersion_succeedsAndAdvancesVersion` (lines 673, 687)
  7. `documentReview_lifecycleFreeze_requestActionAndRejectAndResubmissionCycle` (line 1069)
- **Symptom:**
  Tests asserted `jsonPath("$.data.version").value(1L)` (or `2L`), but received `0L` (or `1L`).
- **Mechanism:**
  In `CollegeReviewService#executeRecordDocumentDecision`:
  ```java
  CollegeRegistrationDocument savedDoc = collegeRegistrationDocumentRepository.save(doc);
  ...
  return toDocumentReviewDecisionResponse(savedDoc, reviewerUser != null ? reviewerUser.getEmail() : null);
  ```
  In Spring Data JPA / Hibernate, invoking `save(entity)` on a managed or modified entity within an active `@Transactional` boundary schedules the SQL `UPDATE` statement; Hibernate does not update the in-memory `@Version` field on the Java entity instance until the session is explicitly flushed (`flush()`) or the transaction commits. Because `save(doc)` was used without an immediate flush, `savedDoc.getVersion()` remained at its pre-mutation value (`0L`) when `toDocumentReviewDecisionResponse` constructed the response DTO.
- **Production Defect Confirmation:**
  This was a genuine production defect. Clients (including the React frontend and concurrent API callers) rely on the returned `version` field to submit subsequent decisions or optimistic locking requests with `expectedDocumentVersion`. Returning the stale pre-flush version broke API contracts and caused subsequent updates to conflict.
- **Correction:**
  Replaced `collegeRegistrationDocumentRepository.save(doc)` with `collegeRegistrationDocumentRepository.saveAndFlush(doc)`. This triggers an immediate session flush, executing the SQL update, incrementing Hibernate's in-memory `@Version` field to `1L`, and ensuring `toDocumentReviewDecisionResponse` returns the true post-mutation version.

### 3.2 Group B: One Approval Fixture Failure in `DocumentReviewIntegrationTest.java`
- **Failing Test:**
  `documentReview_decisionFreeze_whenCollegeDecisionCommitted_returns409` (line 933)
- **Symptom:**
  `mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/decision", ...))` with `action: APPROVE` expected HTTP `200 OK`, but received HTTP `400 Bad Request` with `errorCode: REQUIRED_DOCUMENTS_MISSING`.
- **Mechanism:**
  The test helper `seedPendingCollegeWithAdminAndDoc` only seeded a single document (`UNIVERSITY_AFFILIATION_CERTIFICATE`) with status `PENDING`, omitting the second mandatory document (`AUTHORIZED_SIGNATORY_ID`). Prior to the DEF-01 remediation, `case APPROVE ->` had erroneously bypassed the mandatory document verification gate, allowing unverified colleges with missing documents to be approved. Once DEF-01 correctly positioned `assertAllMandatoryDocumentsAccepted(college.getId(), reg.getId());` inside `case APPROVE ->`, the invalid fixture was appropriately rejected by the gate.
- **Test Defect Confirmation:**
  The purpose of this test was to verify that *after* a college decision commits, subsequent document reviews receive HTTP 409 `APPLICATION_NOT_AWAITING_REVIEW`. For the college decision to commit cleanly under production business rules, the college application must satisfy all mandatory document requirements.
- **Correction:**
  Updated the fixture in `documentReview_decisionFreeze_whenCollegeDecisionCommitted_returns409` to mark `ctx.document()` as `ACCEPTED` and seed the required `AUTHORIZED_SIGNATORY_ID` document as `ACCEPTED` before invoking `POST /decision` with `APPROVE`.

---

## 4. Code Modifications Made

### 4.1 Production Code (`CollegeReviewService.java`)
**File:** [CollegeReviewService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java#L915-L922)

```diff
@@ -918,4 +918,4 @@
                 doc.setRejectionReason(normalizedRejectionReason);
                 doc.setLastReviewedByUserId(reviewerUserId);
                 doc.setLastReviewedAt(now);
-                CollegeRegistrationDocument savedDoc = collegeRegistrationDocumentRepository.save(doc);
+                CollegeRegistrationDocument savedDoc = collegeRegistrationDocumentRepository.saveAndFlush(doc);
```

### 4.2 Test Fixture Code (`DocumentReviewIntegrationTest.java`)
**File:** [DocumentReviewIntegrationTest.java](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/DocumentReviewIntegrationTest.java#L920-L941)

```diff
@@ -921,4 +921,21 @@
         SessionCookies superAdmin = setupSuperAdmin();
         CollegeContext ctx = seedPendingCollegeWithAdminAndDoc("COL1", "College 1", "admin1@col.edu");

+        // Precondition for APPROVE: all mandatory documents must be ACCEPTED
+        ctx.document().setVerificationStatus(DocumentVerificationStatus.ACCEPTED);
+        ctx.document().setVerificationProvenance(DocumentVerificationProvenance.DIRECT_REVIEW);
+        documentRepository.saveAndFlush(ctx.document());
+
+        CollegeRegistrationDocument signatoryDoc = new CollegeRegistrationDocument();
+        signatoryDoc.setCollegeId(ctx.college().getId());
+        signatoryDoc.setRegistrationId(ctx.registration().getId());
+        signatoryDoc.setDocumentCategory(DocumentCategory.AUTHORIZED_SIGNATORY_ID);
+        signatoryDoc.setOriginalFilename("signatory.pdf");
+        signatoryDoc.setMimeType("application/pdf");
+        signatoryDoc.setFileSizeBytes(VALID_PDF_BYTES.length);
+        signatoryDoc.setSha256Checksum("checksum_sig_freeze");
+        signatoryDoc.setStorageKey("dummykey_sig_freeze");
+        signatoryDoc.setVerificationStatus(DocumentVerificationStatus.ACCEPTED);
+        signatoryDoc.setVerificationProvenance(DocumentVerificationProvenance.DIRECT_REVIEW);
+        documentRepository.saveAndFlush(signatoryDoc);
+
         // Super Admin approves the college application
         mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/{collegeId}/decision", ctx.college().getId())
```

---

## 5. Verification & Test Execution Results

### 5.1 Step 4.1: `DocumentReviewIntegrationTest`
- **Command:** `mvn -f backend/pom.xml test -Dtest=DocumentReviewIntegrationTest`
- **Image:** MySQL 8.0.36 Testcontainer (`testcontainers/ryuk:0.7.0`)
- **Outcome:** `BUILD SUCCESS` (01:26 min)
- **Test Summary:** `Tests run: 19, Failures: 0, Errors: 0, Skipped: 0`
- **Detail:** All 19 tests passed, including the 7 previously failing version tests and the 1 freeze fixture test.

### 5.2 Step 4.2 & 4.3: Review Service and Controller Unit Tests
- **Command:** `mvn -f backend/pom.xml test "-Dtest=CollegeReviewServiceUnitTest,CollegeReviewControllerUnitTest"`
- **Outcome:** `BUILD SUCCESS` (11.547 s)
- **Test Summary:**
  - `CollegeReviewControllerUnitTest`: `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0`
  - `CollegeReviewServiceUnitTest`: `Tests run: 25, Failures: 0, Errors: 0, Skipped: 0`
  - Total: `41 passed, 0 failed`

### 5.3 Step 4.4 & 4.5: Targeted Integration Tests
- **Command:** `mvn -f backend/pom.xml test "-Dtest=CollegeApprovalIntegrationTest,CollegeReviewIntegrationTest"`
- **Image:** MySQL 8.0.36 Testcontainer
- **Outcome:** `BUILD SUCCESS` (01:42 min)
- **Test Summary:**
  - `CollegeApprovalIntegrationTest`: `Tests run: 15, Failures: 0, Errors: 0, Skipped: 0`
  - `CollegeReviewIntegrationTest`: `Tests run: 21, Failures: 0, Errors: 0, Skipped: 0`
  - Total: `36 passed, 0 failed`

### 5.4 Step 4.6: Complete Backend Test Suite
- **Command:** `mvn -f backend/pom.xml test`
- **Duration:** `03:58 min`
- **Outcome:** `BUILD SUCCESS`
- **Test Summary:** `Tests run: 296, Failures: 0, Errors: 0, Skipped: 0`
- **Test Matrix Covered:**
  - `AcadlyticApplicationTests`: 1 test
  - `CollegeAccessGuardUnitTest`: 5 tests
  - `CollegeApprovalIntegrationTest`: 15 tests
  - `CollegeLifecycleIntegrationTest`: 10 tests
  - `CollegeOnboardingIntegrationTest`: 40 tests
  - `CollegeReviewControllerUnitTest`: 16 tests
  - `CollegeReviewIntegrationTest`: 21 tests
  - `CollegeReviewServiceUnitTest`: 25 tests
  - `DocumentReviewIntegrationTest`: 19 tests
  - `OutboxWorkerIntegrationTest`: 2 tests
  - `OutboxEmailWorkerUnitTest`: 3 tests
  - `SessionRevocationServiceUnitTest`: 2 tests
  - `TestDatabaseSafetyGuardTest`: 2 tests
  - `V6DocumentLevelReviewMigrationTest`: 17 tests
  - Plus all remaining auth, security, and registration module integration/unit suites.

### 5.5 Step 4.7: Backend Clean Package
- **Command:** `mvn -f backend/pom.xml clean package -DskipTests`
- **Duration:** `22.475 s`
- **Outcome:** `BUILD SUCCESS`
- **Artifact:** `C:\React\Acadlytic\backend\target\acadlytic-backend-0.0.1-SNAPSHOT.jar`

---

## 6. Frontend Regression Verification

### 6.1 Vitest Full Suite
- **Command:** `npx vitest run` (in `frontend/`)
- **Outcome:** `Test Files 14 passed (14)`, `Tests 213 passed (213)`
- **Duration:** `30.45s`
- **Key Suites Verified:**
  - `src/test/super-admin-review.test.tsx` (45 passed, including regression tests `21a` and `21b`)
  - `src/test/onboarding-dashboard.test.tsx` (24 passed)
  - `src/test/college-activation.test.tsx` (16 passed)
  - `src/test/auth-form-state-persistence.test.tsx` (8 passed)
  - All route guards, login, reset-password, and email-verification suites passed.

### 6.2 TypeScript Compilation Check
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Outcome:** Exit code 0, 0 type errors.

### 6.3 Production Build
- **Command:** `npm run build` (`tsc && vite build`)
- **Outcome:** Built successfully in 6.72s.
- **Output Artifacts:**
  - `dist/index.html` (0.55 kB)
  - `dist/assets/index-CR-Ce-KM.css` (39.53 kB)
  - `dist/assets/index-UBM9P9iq.js` (692.79 kB)

---

## 7. Testcontainers & Environment Findings

1. **Docker Engine Communication:**
   On Windows, Testcontainers connects to Docker Desktop via the local named pipe `npipe:////./pipe/docker_engine`. When commands run inside the restricted Windows process sandbox, named pipe access is restricted, producing:
   `DOCKER_HOST npipe:////./pipe/docker_engine is not listening`.
   Running Testcontainers commands with `BypassSandbox: true` allows direct named pipe communication.
2. **Ephemeral Database Isolation:**
   All 296 backend tests executed against disposable, dynamically spawned MySQL 8.0.36 Docker containers. Ryuk reaper (`testcontainers/ryuk:0.7.0`) reliably initiated and terminated each container. No mutations, side-effects, or temporary tables affected any host or developer database instances.

---

## 8. Safety & Policy Compliance Audit

| Requirement | Audit Result | Status |
|:---|:---|:---:|
| Untracked files preserved | Verified via `git status` — all untracked test fixtures, migrations, DTOs, entities, and markdown reports remain present and unaltered | **COMPLIANT** |
| Zero host database mutations | Ephemeral MySQL Testcontainers used exclusively for test execution | **COMPLIANT** |
| Migrations V1–V6 untouched | No changes made to any files under `src/main/resources/db/migration` | **COMPLIANT** |
| `ACADLYTIC_MASTER_CONTEXT.md` untouched | No modifications made to master context documentation in this task | **COMPLIANT** |
| College #2 approval preserved | No database scripts or mutations executed against development databases | **COMPLIANT** |
| Scope discipline | Strictly stabilized tests and fixed confirmed flush defect; no new feature modules initiated | **COMPLIANT** |

---

## 9. Conclusion & Next Steps

Phase 03 DEF-01 remediation and test stabilization is **100% complete**:
- The backend document verification gate functions strictly as designed: mandatory documents must be present and accepted for college approval.
- The document review endpoint reliably updates and returns the incremented document version via `saveAndFlush`.
- Both backend (296 tests) and frontend (213 tests) suites have achieved 100% pass rates.
- The system is clean, stable, and ready for Project Owner sign-off.
