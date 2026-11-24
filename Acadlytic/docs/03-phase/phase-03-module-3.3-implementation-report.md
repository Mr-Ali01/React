# Acadlytic — Phase 03, Module 3.3 Backend Implementation Report

**Module:** Phase 03 — Module 3.3  
**Scope:** College Admin Restricted Dashboard, Document Management & Review Submission  
**Execution:** Backend only  
**Status:** COMPLETE / AWAITING USER APPROVAL  
**Planning Specification:** `docs/03-phase/phase-03-module-3.3-inspection-and-planning-report.md` (Version 2.2)  
**Verification Status:** Passed (142/142 tests passing; 35 new unit tests, 10 new Testcontainers integration tests, 97 baseline regression tests)  
**Date:** November 23, 2026  

---

## 1. Executive Summary

Phase 03, Module 3.3 (**College Admin Restricted Dashboard, Document Management & Review Submission**) has been fully implemented in strict adherence to approved planning report v2.2.

This module provides authenticated `COLLEGE_ADMIN` users with full self-service lifecycle capabilities for their restricted college registration application:
1. **Restricted Dashboard Retrieval (`GET /my-application`):** Real-time aggregation of active draft details, editable profile data, onboarding checklist status, authoritative decoupled review feedback from previously submitted revisions, active documents, and immutable revision history.
2. **Immutable Correction Draft Creation (`POST /correction-draft`):** Under parent `College` pessimistic lock (`SELECT ... FOR UPDATE`), creates an immutable revision $v+1$ from `ACTION_REQUIRED` or non-permanent `REJECTED` revisions, clones and duplicates active verification documents into distinct rows with unique storage keys, and returns idempotently if an unsubmitted draft already exists.
3. **Draft Profile Updates (`PUT /my-application`):** Allows modifying draft profile fields while frozen submissions are strictly rejected with `409 APPLICATION_FROZEN_IN_REVIEW`. Automatically and transactionally synchronizes `colleges.name` when `legalName` is updated.
4. **Physical Document Storage & Management (`/documents`):** Outside-webroot local file storage, startup directory writability probing, MIME + magic byte verification for PDF, JPEG, and PNG formats, 10 MB per-file limits, max 5 active documents per revision, safe download response headers (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`), and transactional rollback compensation (deleting newly created physical files from disk upon database rollback).
5. **Intra-Draft Document Replacement & Deletion:** Replacement operates strictly within the current draft. Deleting a replacement document restores its predecessor to the active set without mutating flags.
6. **Submission & Resubmission Review Gate (`POST /submit`):** Atomic submission gate enforcing email verification and mandatory document categories (`UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`). Freezes the revision, sets `colleges.current_registration_id`, increments safety counters (`action_required_count` max 10, `resubmission_count` max 3), and records structured audit events.

All 142 tests across the entire backend pass with 0 failures, 0 errors, and 0 skipped tests.

---

## 2. Exact File Inventory

### 2.1 Created Production Files (20 files)
1. [`DocumentProperties.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/config/DocumentProperties.java) — Externalized configuration properties (`acadlytic.documents.*`) with fail-fast startup writability and path safety validation.
2. [`CollegeOnboardingController.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeOnboardingController.java) — REST controller exposing the 6 onboarding endpoints with Swagger documentation.
3. [`CollegeOnboardingService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeOnboardingService.java) — Core domain service orchestrating application retrieval, correction draft lifecycle, document management, and review submission under pessimistic locking.
4. [`StoredFileMetadata.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/storage/StoredFileMetadata.java) — Immutable metadata record for stored physical files.
5. [`DocumentStorageService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/storage/DocumentStorageService.java) — Storage port interface (store, duplicate, load, delete, exists).
6. [`LocalFileSystemDocumentStorageService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/storage/LocalFileSystemDocumentStorageService.java) — Local filesystem storage adapter implementing path traversal protection and secure file operations outside webroot.
7. [`DocumentValidator.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/storage/DocumentValidator.java) — Validator enforcing MIME type, magic byte signatures, allowed extensions, and file size limits.
8. [`DocumentStorageCompensationHandler.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/storage/DocumentStorageCompensationHandler.java) — Spring `TransactionSynchronization` rollback compensation hook for physical file purge.
9. [`CollegeProfileResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeProfileResponse.java) — DTO for editable college profile fields.
10. [`CollegeSummaryResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeSummaryResponse.java) — DTO for top-level college status summary.
11. [`CurrentRevisionResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/CurrentRevisionResponse.java) — DTO for current revision status and profile payload.
12. [`DocumentDownload.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentDownload.java) — Internal DTO bundling Spring `Resource` with filename and MIME type for safe streaming.
13. [`DocumentResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentResponse.java) — DTO for document metadata representation.
14. [`MyApplicationResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/MyApplicationResponse.java) — Aggregated dashboard response DTO for `GET /my-application`.
15. [`OnboardingChecklistResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/OnboardingChecklistResponse.java) — DTO indicating submission gate readiness.
16. [`ResubmissionAllowanceResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/ResubmissionAllowanceResponse.java) — DTO exposing remaining resubmission allowances and counters.
17. [`ReviewFeedbackResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/ReviewFeedbackResponse.java) — DTO decoupling review feedback from submitted revision.
18. [`RevisionSummaryResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/RevisionSummaryResponse.java) — DTO for immutable revision history entries.
19. [`SubmitApplicationResponse.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/SubmitApplicationResponse.java) — DTO for successful submission response.
20. [`UpdateApplicationRequest.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/dto/UpdateApplicationRequest.java) — Validated request DTO for draft profile updates.

### 2.2 Created Test Files (5 files)
1. [`CollegeOnboardingIntegrationTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeOnboardingIntegrationTest.java) — 10 comprehensive Testcontainers MySQL 8.0 integration scenarios covering the full onboarding lifecycle, concurrency, document replacements, gates, and tenant boundaries.
2. [`CollegeOnboardingServiceUnitTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeOnboardingServiceUnitTest.java) — 15 unit tests verifying domain business rules, review decoupling, gate conditions, tenant checks, and counter enforcement.
3. [`DocumentStorageCompensationUnitTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/storage/DocumentStorageCompensationUnitTest.java) — 4 unit tests verifying physical file compensation execution on rollback and safe swallow of IO errors.
4. [`DocumentValidatorUnitTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/storage/DocumentValidatorUnitTest.java) — 9 unit tests verifying magic byte detection, invalid MIME rejection, file size limits, and sanitization.
5. [`LocalFileSystemDocumentStorageServiceUnitTest.java`](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/storage/LocalFileSystemDocumentStorageServiceUnitTest.java) — 7 unit tests verifying storage, duplication, loading, deletion, path traversal blocking, and startup validation.

### 2.3 Modified Files (6 files)
1. [`GlobalExceptionHandler.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/common/exception/GlobalExceptionHandler.java) — Added `MaxUploadSizeExceededException` handler mapping multipart overflow to `400 BAD_REQUEST` with `DOCUMENT_SIZE_EXCEEDED`.
2. [`AuditEventType.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java) — Added 5 audit event types (`COLLEGE_REGISTRATION_DOC_UPLOADED`, `COLLEGE_REGISTRATION_DOC_REMOVED`, `COLLEGE_REGISTRATION_CORRECTION_DRAFT_CREATED`, `COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW`, `COLLEGE_REGISTRATION_RESUBMITTED`).
3. [`CollegeRegistrationDocumentRepository.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java) — Added `findByIdAndCollegeId(Long id, Long collegeId)` for tenant-isolated document access.
4. [`CollegeRepository.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRepository.java) — Added `findByIdWithLock(@Param("id") Long id)` providing pessimistic write locking (`SELECT ... FOR UPDATE` with 3000ms timeout).
5. [`application.yml`](file:///c:/React/Acadlytic/backend/src/main/resources/application.yml) — Configured `spring.servlet.multipart` limits (10MB per file, 15MB per request) and `acadlytic.documents` configuration properties.
6. [`.gitignore`](file:///c:/React/Acadlytic/.gitignore) — Added `/backend/storage/` to exclude runtime document upload directories from version control without affecting source directories.

**Summary of File Changes:**
- Created production files: 20
- Created test files: 5
- Modified files: 6
- **Total files affected: 31**

---

## 3. Architecture & Data Integrity Verification

### 3.1 Immutable Revision Lifecycle ($v_1 \to v_2 \to v_3$)
- When an application is in `ACTION_REQUIRED` or non-permanent `REJECTED`, the previously submitted revision remains frozen and immutable.
- Calling `POST /api/v1/college-registrations/my-application/correction-draft`:
  1. Acquires a pessimistic lock on the parent `College` tenant record.
  2. Confirms that no unsubmitted draft already exists (if one does, it returns that draft idempotently without creating duplicate revisions).
  3. Clones the profile fields from the authoritative submitted revision ($v$) into a new revision record with `version_number = v + 1` and `submitted_for_review_at = null`.
  4. Queries all active documents from revision $v$, duplicates each physical file to a new unique UUID storage key via `DocumentStorageService.duplicate`, registers rollback compensation for each new file, and inserts new document rows for revision $v+1$. This strictly satisfies the MySQL unique constraint `uq_crd_storage_key` while preserving historical snapshots.

### 3.2 Authoritative Retrieval Resolution (`GET /my-application`)
- Locates the highest version revision for the college.
- If `submitted_for_review_at == null`, it is treated as an active editable draft (`isDraft = true`).
- Authoritative review feedback (`reviewNotes`, `rejectionReason`, `reviewedAt`) is resolved strictly from the submitted revision pointed to by `colleges.current_registration_id`. This decouples feedback presentation so an admin editing draft $v+1$ can still view the Super Admin's review notes from revision $v$.
- Active documents are resolved via leaf-node computation: `d.id NOT IN (replaces_document_id of any draft doc)`.

### 3.3 Tenant Isolation & Pessimistic Locking
- All mutating endpoints (`POST /correction-draft`, `PUT /my-application`, `POST /documents`, `DELETE /documents/{docId}`, `POST /submit`) acquire a pessimistic write lock (`findByIdWithLock(principal.getCollegeId())`) within their transaction boundary.
- Tenant isolation is strictly enforced: `CollegeAccessGuard.requireRestrictedOnboardingAccess()` validates that the caller holds `COLLEGE_ADMIN` role and belongs to an active, non-permanently-rejected college. Document download and deletion verify `doc.collegeId == principal.collegeId`, returning `403 ACCESS_DENIED` on cross-tenant access.

### 3.4 Intra-Draft Document Replacement Invariants
- `replacesDocumentId` operates strictly within the current draft revision. Cross-revision replacement IDs are rejected with `400 BAD_REQUEST (CROSS_REVISION_REPLACEMENT_NOT_ALLOWED)`.
- Replacement documents must match the target document's category; mismatches are rejected with `400 BAD_REQUEST (CATEGORY_MISMATCH_ON_REPLACEMENT)`.
- Active documents are always leaf nodes in the replacement tree.
- When an active replacement document is deleted via `DELETE /documents/{docId}`, it is removed from the database, and its predecessor automatically re-emerges in the active set without mutating any database flags.

### 3.5 Counter Boundaries & Safety Limits
- `action_required_count`: Capped at 10. Exceeding returns `400 BAD_REQUEST (MAX_ACTION_REQUIRED_LIMIT_EXCEEDED)`.
- `resubmission_count`: Capped at 3. Exceeding returns `400 BAD_REQUEST (MAX_RESUBMISSION_LIMIT_EXCEEDED)`.
- Counters are incremented atomically on `submitApplicationForReview()` based on the status of the predecessor submitted revision:
  - If predecessor had `ACTION_REQUIRED`, `action_required_count` increments by 1.
  - If predecessor had `REJECTED`, `resubmission_count` increments by 1.
  - Initial submission ($v_1$) sets `current_registration_id` without incrementing counters.

### 3.6 Tenant Name Synchronization
- When `PUT /my-application` modifies `legalName`, `colleges.name` is updated within the same transaction to ensure tenant name consistency across the platform.

---

## 4. Document Storage & Security Implementation

### 4.1 Outside-Webroot Storage & Startup Validation
- Physical files are stored at `acadlytic.documents.storage-dir` (default: `storage/documents`).
- Path validation verifies the configured directory is outside classpath and webroot resources.
- Fail-fast startup probe creates a temporary probe file (`Files.createTempFile`) and immediately deletes it to verify read/write permissions at application boot.

### 4.2 MIME & Magic Byte Verification
- `DocumentValidator` verifies file extensions, Spring multipart MIME types, and binary magic bytes:
  - **PDF:** `%PDF-` (`0x25, 0x50, 0x44, 0x46, 0x2D`)
  - **JPEG:** `0xFF, 0xD8, 0xFF`
  - **PNG:** `0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`
- Spoofed extensions or mismatched magic bytes are rejected with `400 BAD_REQUEST (INVALID_DOCUMENT_FORMAT)`.

### 4.3 Transaction Synchronization Rollback Compensation
- Newly stored physical files register an `afterCompletion` hook via Spring `TransactionSynchronizationManager`.
- If the database transaction commits (`STATUS_COMMITTED`), the physical file is retained.
- If the transaction rolls back (`STATUS_ROLLED_BACK`), `compensationHandler` deletes the physical file from disk to prevent storage leaks.

### 4.4 Safe Download Headers
- `GET /documents/{docId}` sets safe download HTTP response headers:
  - `Content-Disposition: attachment; filename="<sanitized_filename>"`
  - `X-Content-Type-Options: nosniff`
  - Strict `Content-Type` matching the verified MIME type.

---

## 5. Testing & Verification Evidence

### 5.1 Test Execution Summary
- **Backend Test Suite:** 142/142 tests passing.
- **Failures:** 0.
- **Errors:** 0.
- **Skipped:** 0.
- **Build Status:** `BUILD SUCCESS`.

```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 142, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  02:11 min
[INFO] Finished at: 2026-11-23T22:39:49+05:30
```

### 5.2 Unit Tests Inventory (35 tests)
1. **`DocumentValidatorUnitTest` (9 tests):**
   - Valid PDF upload succeeds.
   - Valid JPEG upload succeeds.
   - Valid PNG upload succeeds.
   - Mismatched magic byte detection (EXE disguised as PDF) rejected.
   - Corrupted/truncated file rejected.
   - Empty file rejected.
   - Disallowed extension rejected.
   - File size exceeding 10 MB rejected.
   - Filename sanitization strips path traversal characters.
2. **`LocalFileSystemDocumentStorageServiceUnitTest` (7 tests):**
   - Stores file in configured directory with random UUID key and extension.
   - Loads existing stored file as readable Spring Resource.
   - Throws `DOCUMENT_NOT_FOUND` when loading non-existent storage key.
   - Deletes stored file physically from disk.
   - Duplicates an existing stored file with a new UUID storage key.
   - Blocks path traversal attempt in storage key.
   - Startup validation fails when storage path is configured inside classpath resources.
3. **`DocumentStorageCompensationUnitTest` (4 tests):**
   - File deleted on transaction rollback.
   - File retained on transaction commit.
   - Compensation handler ignores unregistered transactions.
   - Deletion exception during rollback is caught and logged safely without rethrowing.
4. **`CollegeOnboardingServiceUnitTest` (15 tests):**
   - `getMyApplication` returns initial draft state with unverified email checklist.
   - `getMyApplication` decouples review feedback from submitted revision during correction draft.
   - `createCorrectionDraft` throws `INITIAL_REGISTRATION_NOT_SUBMITTED` when initial registration not submitted.
   - `createCorrectionDraft` throws `APPLICATION_FROZEN_IN_REVIEW` when revision is PENDING review.
   - `createCorrectionDraft` throws `MAX_ACTION_REQUIRED_LIMIT_EXCEEDED` when count is 10.
   - `createCorrectionDraft` throws `MAX_RESUBMISSION_LIMIT_EXCEEDED` when count is 3.
   - `createCorrectionDraft` idempotently returns existing unsubmitted draft without creating new revision.
   - `createCorrectionDraft` creates revision $v+1$ and clones active documents sharing storage keys.
   - `updateDraftProfile` updates profile fields and synchronizes college tenant name.
   - `updateDraftProfile` throws `APPLICATION_FROZEN_IN_REVIEW` when revision is submitted.
   - `uploadDocument` replaces existing active document of the same category automatically.
   - `uploadDocument` throws `CROSS_REVISION_REPLACEMENT_NOT_ALLOWED` for historical document.
   - `deleteDocument` throws `APPLICATION_FROZEN_IN_REVIEW` when revision is submitted.
   - `submitApplicationForReview` throws `EMAIL_NOT_VERIFIED` when admin email unverified.
   - `submitApplicationForReview` throws `REQUIRED_DOCUMENTS_MISSING` when required documents absent.

### 5.3 Integration Scenarios Inventory (10 scenarios)
Executed against real Testcontainers MySQL 8.0.36 instance:
1. **Scenario 1:** Happy path initial onboarding, document upload, submission & freeze guarantee (`POST /documents`, `POST /submit`, freeze prevents mutations).
2. **Scenario 2:** Pre-submission gates reject unverified email (`400 EMAIL_NOT_VERIFIED`) and missing documents (`400 REQUIRED_DOCUMENTS_MISSING`).
3. **Scenario 3:** Multi-revision lineage walkthrough ($v_1 \to v_2 \to v_3$ with `ACTION_REQUIRED` and non-permanent `REJECTED`).
4. **Scenario 4:** Review feedback decoupled during correction draft (Super Admin review notes visible while editing new draft).
5. **Scenario 5:** Replacement document deletion restores predecessor to active set.
6. **Scenario 6:** Cross-revision replacement ID is rejected with `400 BAD_REQUEST (CROSS_REVISION_REPLACEMENT_NOT_ALLOWED)`.
7. **Scenario 7:** Replacement category mismatch is rejected with `400 BAD_REQUEST (CATEGORY_MISMATCH_ON_REPLACEMENT)`.
8. **Scenario 8:** Draft profile update synchronizes college tenant name (`colleges.name` matches updated `legalName`).
9. **Scenario 9:** Document download tenant isolation and safe headers (`attachment; filename="..."`, `X-Content-Type-Options: nosniff`, cross-tenant blocked with `403 ACCESS_DENIED`).
10. **Scenario 10:** Mixed lifecycle counter boundary enforces 3 max rejection resubmissions (`action_required_count = 1`, `resubmission_count = 3`, 4th attempt rejected with `400 MAX_RESUBMISSION_LIMIT_EXCEEDED`).

---

## 6. Scope Boundary Affirmation

- **Backend ONLY:** Zero frontend changes made.
- **Zero Database Migrations:** Existing Flyway schema V4 was used as-is without any modifications.
- **No Scope Creep:** Super Admin review (Module 3.4) and College tenant activation/cleanup (Module 3.5) were not implemented.
- **Documentation Immutability:** `ACADLYTIC_MASTER_CONTEXT.md` has not been modified. It remains in its current state until explicit user signoff of this report.

---

## 7. Conclusion & Next Steps

Phase 03, Module 3.3 implementation is complete and verified with 142/142 passing tests.

Awaiting user review and authorization to proceed to:
1. Formal recording of Module 3.3 approval in `ACADLYTIC_MASTER_CONTEXT.md`.
2. Inspection and planning for Phase 03, Module 3.4 (Super Admin College Review Lifecycle).
