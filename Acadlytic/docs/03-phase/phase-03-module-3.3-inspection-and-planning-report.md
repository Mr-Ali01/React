# Acadlytic — Phase 03, Module 3.3 Backend Inspection & Planning Report (v2.2)
## Module 3.3: College Admin Restricted Dashboard, Document Management & Review Submission (Backend)

**Document:** `docs/03-phase/phase-03-module-3.3-inspection-and-planning-report.md`  
**Version:** 2.2 (Document Lineage Semantics, Intra-Draft Replacement, Review Feedback Decoupling & Mixed Rejection Counter Trace)  
**Creation Date:** 2026-11-23  
**Status:** DRAFT / PENDING USER APPROVAL  
**Current Phase:** Phase 03 — College Registration, Restricted Dashboard & Approval Workflow  
**Target Module:** Module 3.3 — Backend Implementation Only  
**Execution Mode:** Inspection & Planning ONLY (Implementation Strictly Prohibited in this turn)

---

## Architectural Revision History

| Version | Date | Key Architectural Changes & Corrections |
|---|---|---|
| **v1.0** | 2026-11-23 | Initial inspection and planning draft. Erroneously proposed editing `ACTION_REQUIRED` and `REJECTED` revisions in place. Lacked transactional filesystem compensation. |
| **v2.0** | 2026-11-23 | Introduced immutable correction drafts, active document set resolution, Spring transaction synchronization compensation, startup storage path safety checks, and resubmission counter semantics. |
| **v2.1** | 2026-11-23 | Introduced unified parent `College` row lock (`SELECT ... FOR UPDATE`), 3-revision concrete lineage walkthrough, simplest safe physical storage retention model, and counter reconciliation. |
| **v2.2** | 2026-11-23 | **Architectural Reconciliation & Finalization:**<br>1. **Intra-Draft Replacement Semantics:** Strictly defined `replaces_document_id` as operating **within the current editable draft**; cross-revision replacement IDs are rejected with `400 BAD_REQUEST`.<br>2. **Replacement Deletion Invariant:** Proved that deleting a replacement document automatically restores the previously superseded document to the active document set.<br>3. **Decoupled Review Feedback:** Defined `reviewFeedback` in `GET /my-application` as sourced strictly from the authoritative submitted revision (`current_registration_id`), separating previous reviewer notes from current draft profile/documents.<br>4. **Mixed Lifecycle Counter Trace:** Formulated an authoritative 14-step lifecycle table detailing alternating `ACTION_REQUIRED` and `REJECTED` decisions and boundary enforcement.<br>5. **Pointer Integrity & Eligibility:** Defined complete eligibility algorithm for `POST /correction-draft` under parent row lock.<br>6. **Tenant Name Sync:** Mandated transactional synchronization of `colleges.name` when `legalName` is updated in draft. |

---

## 1. Executive Summary & Corrected Module Scope

### 1.1 Objective
The objective of **Phase 03, Module 3.3** is to implement the backend domain services, secure storage infrastructure, and REST APIs enabling an authenticated `COLLEGE_ADMIN` of an unapproved college to operate within their **Restricted Dashboard**:
1. **Application & Checklist Inspection:** Inspect current application status, revision history, authoritative review feedback from the previous submitted revision, resubmission allowances, and live onboarding checklist status.
2. **Immutable Correction-Draft Lifecycle:** When an application is placed into `ACTION_REQUIRED` or non-permanent `REJECTED`, create an editable correction draft revision (`v+1`) under parent `College` pessimistic lock while preserving the prior revision and its documents completely immutable and untouched.
3. **Draft Profile Editing & Tenant Sync:** Edit institution profile details strictly while in an editable draft state (`submittedForReviewAt == null`), transactionally synchronizing `colleges.name` when `legalName` changes.
4. **Document Management & Lineage:** Upload, replace, list, remove from draft, and safely stream verification documents with strict MIME + magic-byte agreement, 10 MB per-file cap, and 5 active documents per revision limit, tracking revision lineage.
5. **Storage Reliability & Compensation:** Store files outside webroot with UUID keys, implementing Spring transaction synchronization compensation to clean up newly written physical files if database operations or commits roll back.
6. **Submit & Resubmit Gates:** Submit the initial application or revised correction draft into the frozen `PENDING` review queue once email is verified and required documents are attached, strictly enforcing counter caps (safety cap 10 for `ACTION_REQUIRED`; max 3 for `REJECTED`).

### 1.2 Development Strategy
- **Backend-First Development:** Complete all backend services, storage providers, validation utilities, security boundaries, and Testcontainers MySQL integration tests before any frontend UI work begins.
- **Strict Boundary Separation:** Module 3.3 is restricted to `COLLEGE_ADMIN` pre-submission, correction-drafting, and submission workflows. `SUPER_ADMIN` review queue listing, review inspection, decisions (`APPROVE`, `REQUEST_ACTION`, `REJECT`), and college tenant activation belong strictly to Modules 3.4 and 3.5.

---

## 2. Requirements-to-Code Mapping & Implementation Status

### 2.1 Component Mapping Matrix

| Capability / Requirement | Source Specification / ADR | Existing Codebase State | Status Classification |
|---|---|---|---|
| **Restricted College Context** | `ADR-08`, `03-prd/mvp-scope.md` | `College` entity (`approvalStatus = PENDING`, `status = PENDING_VERIFICATION`) created in Module 3.1A | **ALREADY IMPLEMENTED** |
| **College Admin Account** | `ADR-06`, `authentication.md` | `User` created with `users.status = ACTIVE`, `email_verified_at = NULL` in Module 3.1A | **ALREADY IMPLEMENTED** |
| **Email Verification Lifecycle** | `ADR-08`, Module 3.2 | `POST /api/v1/auth/verify-email` consumes 48h token with pessimistic write lock; sets `users.email_verified_at` | **ALREADY IMPLEMENTED & APPROVED** |
| **Database Schema V4** | `ADR-07`, `ADR-11`, Module 3.1A | `college_registrations`, `college_registration_documents`, `colleges` alterations active in Flyway | **ALREADY IMPLEMENTED** |
| **Restricted Access Guard** | `ADR-10`, `CollegeAccessGuard.java` | `requireRestrictedOnboardingAccess()` verifies tenant, active account, and blocks suspended/permanently rejected | **ALREADY IMPLEMENTED** |
| **Document Categories** | `ADR-11`, `DocumentCategory.java` | Enum defining `UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`, etc., with `isRequired()` | **ALREADY IMPLEMENTED** |
| **Application Inspection API** | `roadmap.md:205` | `GET /api/v1/college-registrations/my-application` | **NOT IMPLEMENTED** |
| **Correction Draft Creation API** | `ADR-07`, Correction Lifecycle | `POST /api/v1/college-registrations/my-application/correction-draft` | **NOT IMPLEMENTED** |
| **Draft Profile Update API** | `roadmap.md:206` | `PUT /api/v1/college-registrations/my-application` | **NOT IMPLEMENTED** |
| **Document Storage Service** | `ADR-16`, `ADR-11` | Port interface + local filesystem storage implementation outside webroot | **NOT IMPLEMENTED** |
| **Storage Compensation & Cleanup** | Reliability Rules | Transaction synchronization callback cleaning up newly written files on rollback | **NOT IMPLEMENTED** |
| **Document Magic-Byte Validation** | `ADR-11`, Security Rules | PDF, JPEG, PNG byte-signature checks, 10 MB limit, active 5 docs/revision cap | **NOT IMPLEMENTED** |
| **Document Management APIs** | `roadmap.md:206` | `POST .../documents`, `GET .../documents`, `GET .../documents/{docId}`, `DELETE .../documents/{docId}` | **NOT IMPLEMENTED** |
| **Submit for Review Gate API** | `roadmap.md:207` | `POST /api/v1/college-registrations/my-application/submit` (requires verified email + required docs) | **NOT IMPLEMENTED** |
| **Parent College Lock Query** | Concurrency Rules | `findByIdWithLock(Long id)` in `CollegeRepository` with `@Lock(LockModeType.PESSIMISTIC_WRITE)` | **NOT IMPLEMENTED** |
| **Audit Event Types** | Audit Logging Policy | `COLLEGE_REGISTRATION_DOC_UPLOADED`, `COLLEGE_REGISTRATION_DOC_REMOVED`, `COLLEGE_REGISTRATION_CORRECTION_DRAFT_CREATED`, `COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW`, `COLLEGE_REGISTRATION_RESUBMITTED` | **NOT IMPLEMENTED** |

---

## 3. Existing Implementation Inventory (Actual Repository Evidence)

### 3.1 Domain Entities & Repositories
1. **[CollegeRegistration.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistration.java):**
   - Versioned revision entity (`collegeId`, `versionNumber`, `status`, institution profile, `submittedForReviewAt`, `reviewerUserId`, `reviewNotes`, `rejectionReason`, `permanentRejection`, `reviewedAt`).
   - Unique constraint: `CONSTRAINT uq_college_registrations_version UNIQUE (college_id, version_number)`.
2. **[CollegeRegistrationDocument.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistrationDocument.java):**
   - Immutable document row (`collegeId`, `registrationId`, `documentCategory`, `originalFilename`, `storageKey`, `mimeType`, `fileSizeBytes`, `sha256Checksum`, `replacesDocumentId`).
   - Self-referencing FK: `CONSTRAINT fk_crd_replaces_document_id FOREIGN KEY (replaces_document_id) REFERENCES college_registration_documents (id)`.
3. **[College.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java):**
   - Tracks `currentRegistrationId`, `resubmissionCount`, `actionRequiredCount`, `permanentlyRejected`, `archivedAt`, and `@Version` for optimistic concurrency.
4. **[DocumentCategory.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentCategory.java):**
   - Enforces required categories: `UNIVERSITY_AFFILIATION_CERTIFICATE` (required), `AUTHORIZED_SIGNATORY_ID` (required), `INSTITUTION_REGISTRATION_PROOF` (optional), `ADDITIONAL_SUPPORTING_DOCUMENT` (optional).
5. **[CollegeRegistrationRepository.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationRepository.java):**
   - Verified methods: `findByCollegeIdOrderByVersionNumberAsc`, `findByCollegeIdAndVersionNumber`, `findFirstByCollegeIdOrderByVersionNumberDesc`.
6. **[CollegeRegistrationDocumentRepository.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java):**
   - Verified methods: `findByRegistrationId`, `findByCollegeId`, `countByRegistrationId`, `findByStorageKey`.

### 3.2 Security & Tenant Infrastructure
1. **[CollegeAccessGuard.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java#L108-L141):**
   - `requireRestrictedOnboardingAccess()` encapsulates:
     - Extraction of caller's authenticated `collegeId`.
     - Assertion of `COLLEGE_ADMIN` role.
     - Rejection of permanently rejected colleges (`403 REGISTRATION_PERMANENTLY_REJECTED`).
     - Rejection of suspended colleges (`403 COLLEGE_SUSPENDED`).
     - Rejection of inactive/archived colleges (`403 COLLEGE_INACTIVE`).
2. **[SecurityConfig.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/config/SecurityConfig.java):**
   - Session authentication, CSRF cookie repository and token validation, security headers (`nosniff`, `frame-options: DENY`).
3. **[AuditEventService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/AuditEventService.java):**
   - Transactional `record(...)` and independent `recordIndependently(...)` for immutable audit logging.

---

## 4. Correction Draft Retrieval and Current Registration Pointer Mechanics

### 4.1 The Retrieval Problem & Core Invariant
In Acadlytic's architecture:
- `colleges.current_registration_id` points to the **authoritative submitted application revision** currently in the review lifecycle or reviewed by `SUPER_ADMIN`.
- While a college admin is preparing corrections in a newly created draft revision (`v+1`), that draft is an unsubmitted, editable workspace.
- **Critical Architectural Invariant:** `colleges.current_registration_id` **MUST CONTINUE POINTING TO THE PREVIOUS SUBMITTED REVISION** until the correction draft is successfully submitted!

#### Why `current_registration_id` Must Not Point to an Unsubmitted Draft:
1. **Authoritative State Preservation:** If `current_registration_id` pointed to an unsubmitted draft, external queries (such as Super Admin inspection or compliance audits) would see an incomplete, unsubmitted draft instead of the official reviewed application (`ACTION_REQUIRED` / `REJECTED`).
2. **Safe Abandonment:** If the College Admin abandons the draft or deletes documents, the college tenant's authoritative application pointer remains completely intact, pointing to the last officially submitted revision.
3. **Atomic Handover:** When the College Admin submits the correction draft via `POST /my-application/submit`, `colleges.current_registration_id` is updated to point to `newRevision.id` within the exact same database transaction that freezes the revision.

### 4.2 Exact Retrieval Algorithm for `GET /api/v1/college-registrations/my-application`

```
                                  GET /my-application
                                           │
                                           ▼
                       Query latest revision by version desc:
             collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(collegeId)
                                           │
                                           ▼
                          Is submitted_for_review_at == NULL?
                                         /   \
                                       YES    NO
                                       /        \
                                      ▼          ▼
                       [Active Unsubmitted Draft]   [Official Submitted Revision]
                       - isDraft: true              - Pointed to by current_registration_id
                       - Status: PENDING            - Status: PENDING / ACTION_REQUIRED / REJECTED
                       - Editable workspace         - canStartCorrectionDraft: (status != PENDING)
                       - reviewFeedback: sourced    - reviewFeedback: sourced from this revision
                         from current_registration_id
```

1. **Step 1 — Identify the Latest Revision:**
   Query `collegeRegistrationRepository.findFirstByCollegeIdOrderByVersionNumberDesc(collegeId)`.
2. **Step 2 — Distinguish Draft vs. Submitted Application:**
   - **Case A: Latest revision has `submitted_for_review_at == null`:**
     - An unsubmitted draft is active (either Revision 1 initial pre-submission draft, or Revision `v+1` correction draft).
     - The service treats this revision as the active editable target (`isDraft = true`).
     - `canSubmitForReview` is evaluated based on `emailVerified` and active documents in this draft.
     - `canStartCorrectionDraft = false` (a draft is already open).
   - **Case B: Latest revision has `submitted_for_review_at != null`:**
     - The latest revision is an officially submitted revision (identical to `colleges.current_registration_id`).
     - `isDraft = false`.
     - If its status is `PENDING`, `isFrozenInReview = true` and `canStartCorrectionDraft = false`.
     - If its status is `ACTION_REQUIRED` or non-permanent `REJECTED`, `canStartCorrectionDraft = true` (subject to safety caps).
3. **Step 3 — Idempotency Guarantee:**
   - `GET /my-application` is a strictly read-only operation (`@Transactional(readOnly = true)`).
   - Repeated calls never create, mutate, or increment revisions or counters.

---

## 5. Review Feedback Decoupling & Source of Truth

### 5.1 Feedback Source Resolution
In `GET /api/v1/college-registrations/my-application`, `reviewFeedback` must always expose the authoritative feedback from the previous submitted revision:
1. **When an Unsubmitted Correction Draft Exists (`submitted_for_review_at == null`):**
   - The active draft itself has not been reviewed yet (`reviewNotes = null`, `rejectionReason = null`).
   - The service resolves the authoritative reviewed revision via `college.getCurrentRegistrationId()`:
     ```java
     CollegeRegistration submittedRevision = college.getCurrentRegistrationId() != null
             ? collegeRegistrationRepository.findById(college.getCurrentRegistrationId()).orElse(null)
             : null;
     ```
   - `reviewFeedback` is extracted strictly from `submittedRevision`:
     ```java
     ReviewFeedbackResponse feedback = (submittedRevision != null)
             ? new ReviewFeedbackResponse(
                     submittedRevision.getReviewNotes(),
                     submittedRevision.getRejectionReason(),
                     submittedRevision.isPermanentRejection(),
                     submittedRevision.getReviewedAt())
             : null;
     ```
   - This ensures the College Admin clearly sees the reviewer's instructions while actively editing profile fields or replacing documents in the correction draft.
2. **When No Unsubmitted Draft Exists (Submitted Application):**
   - The latest revision is the submitted revision (`id == college.getCurrentRegistrationId()`).
   - `reviewFeedback` is extracted directly from this revision.
3. **Initial Registration Draft (Revision 1 Pre-Submission):**
   - `college.getCurrentRegistrationId()` is `null`.
   - `reviewFeedback` is returned as `null`.

---

## 6. Correction-Draft Eligibility and Pointer Integrity Algorithm

### 6.1 Complete Eligibility Algorithm for `POST /my-application/correction-draft`
Executed strictly under the parent `College` pessimistic row lock (`SELECT ... FOR UPDATE`):

```
                       POST /correction-draft (Under Parent College Lock)
                                           │
                                           ▼
                             Validate College Operational State
                  (Active, Not Suspended, Not Approved, Not Permanently Rejected)
                                           │
                                           ▼
                         Verify Current Registration ID Pointer
                                           │
                        Is current_registration_id == NULL?
                                         /   \
                                       YES    NO
                                       /        \
                                      ▼          ▼
                        [Reject: Initial Draft]   Load Submitted Revision from current_registration_id
                        INITIAL_REGISTRATION_      Assert: submittedRevision.collegeId == college.id
                        NOT_SUBMITTED (400)        Assert: submittedRevision.submitted_for_review_at != NULL
                                                 (If null, throw 500 INCONSISTENT_REGISTRATION_STATE)
                                                         │
                                                         ▼
                                            Check Status & Safety Caps
                                 (Must be ACTION_REQUIRED [count < 10] or REJECTED [count < 3])
                                                         │
                                                         ▼
                                             Check Existing Open Draft
                           latestRevision = findFirstByCollegeIdOrderByVersionNumberDesc
                                                         │
                                    Is latestRevision.submitted_for_review_at == NULL?
                                                   /   \
                                                 YES    NO
                                                 /        \
                                                ▼          ▼
                                   [Idempotent Return]   [Create Exactly One Revision v+1]
                                   Return existing draft  newVersion = submittedRevision.version + 1
                                   Zero duplicate rows    Clone profile + clone active documents
                                                          Do NOT update current_registration_id yet!
```

### 6.2 Inconsistent Pointer State Rejection
- If `college.getCurrentRegistrationId()` points to a revision where `submitted_for_review_at == null`, or a revision belonging to another college, the service immediately throws `500 INTERNAL_SERVER_ERROR` with error code `INCONSISTENT_REGISTRATION_STATE`.
- If `latestRevision.getVersionNumber() > submittedRevision.getVersionNumber() + 1`, throws `500 INCONSISTENT_REGISTRATION_STATE`.

---

## 7. Unified Concurrency Strategy via Parent `College` Pessimistic Locking

### 7.1 The Check-Then-Act Race Vulnerability
In a multi-user environment, checking `submitted_for_review_at == null` at the start of a service method without coordinating database locks is vulnerable to classic time-of-check to time-of-use (TOCTOU) races:
- **Scenario:** Thread A (Upload Document) checks `registration.submittedForReviewAt == null` (returns true). Concurrently, Thread B (Submit for Review) checks the same condition, sets `submittedForReviewAt = now()`, and commits. Thread A resumes and writes a new document record into a revision that has already been submitted and frozen!
- **Result:** Data corruption. An immutable, frozen revision receives mutations after submission.

### 7.2 The Unified Locking Protocol
To guarantee total consistency across concurrent requests, **ALL 5 MUTATING OPERATIONS** coordinate through the exact same parent `College` row lock:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PARENT COLLEGE ROW PESSIMISTIC LOCK                   │
│          SELECT * FROM colleges WHERE id = :collegeId FOR UPDATE            │
│                     (Lock timeout: 3000 milliseconds)                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌──────────────────┬──────────────┼──────────────┬──────────────────┐
     ▼                  ▼              ▼              ▼                  ▼
[Draft Creation]  [Profile Update] [Doc Upload]  [Doc Deletion]    [Submit/Resubmit]
```

### 7.3 Operational Locking Implementation

#### Repository Method in `CollegeRepository`:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT c FROM College c WHERE c.id = :id")
@QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})
Optional<College> findByIdWithLock(@Param("id") Long id);
```

#### Mutating Operations Protocol:
1. **Correction Draft Creation (`POST /correction-draft`):** Acquires `College` lock `FOR UPDATE`. Prevents concurrent requests from spawning duplicate drafts.
2. **Profile Update (`PUT /my-application`):** Acquires `College` lock `FOR UPDATE`. If `legalName` changed, updates draft profile and synchronizes `colleges.name`.
3. **Document Upload (`POST /my-application/documents`):** Acquires `College` lock `FOR UPDATE`. Asserts $|\text{ActiveDocs}| < 5$. Prevents upload from committing into a frozen revision.
4. **Document Deletion (`DELETE /my-application/documents/{docId}`):** Acquires `College` lock `FOR UPDATE`. Deletes draft document row.
5. **Submit for Review (`POST /my-application/submit`):** Acquires `College` lock `FOR UPDATE`. Freezes revision (`submittedForReviewAt = now()`), increments counters, updates `current_registration_id`.

---

## 8. Document Lineage, Intra-Draft Replacement & Deletion Invariants

### 8.1 The 6 Immutable Document Rules
1. **Zero Mutation of Historical Records:** Previously submitted `college_registration_documents` rows are never modified or deleted.
2. **Revision-Scoped Records:** Every registration revision has its own distinct document records linked to `registration_id`.
3. **Shared Physical Storage:** Carried-forward documents create new database rows linked to the new revision ID while referencing the existing immutable `storage_key`.
4. **Intra-Draft Replacement Scope:** `replaces_document_id` operates **strictly within the current editable draft**. Cross-revision replacement IDs are rejected with `400 BAD_REQUEST`.
5. **Historical Integrity:** Historical revisions always retain their exact document list as submitted.
6. **Physical Object Immutability:** Stored physical files on disk are write-once, read-many. They are never overwritten in place.

### 8.2 Validation Rules for `replacesDocumentId` in `POST /my-application/documents`
When caller provides `replacesDocumentId`:
1. Document must exist and belong to the caller's college tenant (`403 ACCESS_DENIED` / `404 NOT_FOUND`).
2. **Strict Intra-Draft Scope:** Target document's `registration_id` **must equal the current editable draft's ID** (`targetDoc.registrationId == activeDraft.id`). Cross-revision replacement references are rejected with `400 BAD_REQUEST` / `CROSS_REVISION_REPLACEMENT_NOT_ALLOWED`.
3. Target document must be currently active in the draft (must not already be superseded by another document in the draft).
4. Target document must have the **exact same category** as the replacement file being uploaded (`400 CATEGORY_MISMATCH_ON_REPLACEMENT`).
5. **Auto-Replacement Fallback:** If caller does NOT provide `replacesDocumentId`, but an active document of that category already exists in the draft, the service automatically sets `replaces_document_id = existingActiveDoc.id`, strictly enforcing max 1 active document per category.

### 8.3 Replacement Deletion Invariant (Restoration Rule)
When a user calls `DELETE /api/v1/college-registrations/my-application/documents/{documentId}`:
1. Pre-condition: Active revision must be an unsubmitted draft (`submittedForReviewAt == null`).
2. Document must belong to the caller's college and active draft revision.
3. The database row is deleted from `college_registration_documents`.
4. **Restoration Invariant:**
   - Active document set formula:
     $$\text{SupersededIds} = \{ d.\text{replacesDocumentId} \mid d \in \text{Docs}(R) \text{ and } d.\text{replacesDocumentId} \neq \text{null} \}$$
     $$\text{ActiveDocs}(R) = \{ d \in \text{Docs}(R) \mid d.\text{id} \notin \text{SupersededIds} \}$$
   - When replacement document $d_{\text{replacement}}$ is deleted:
     - Its `replaces_document_id` reference ($d_{\text{original}}.\text{id}$) disappears from $\text{SupersededIds}$.
     - Therefore, **$d_{\text{original}}$ automatically and deterministically becomes active again** in $\text{ActiveDocs}(R)$!
   - This provides complete user-error tolerance: deleting an accidental replacement immediately restores the carried-forward valid document.

### 8.4 Concrete 3-Revision Walkthrough Example

| Revision | DB Document Row ID | Category | Storage Key | Replaces Doc ID | Active in this Revision? |
|---|---|---|---|---|---|
| **Rev 1** | Row 101 | Affiliation Cert | `key_affil_v1` | `null` | **YES** |
| **Rev 1** | Row 102 | Signatory ID | `key_auth_v1` | `null` | **YES** |
| **Rev 2** | Row 201 | Affiliation Cert | `key_affil_v1` | `null` | NO (Superseded by 203) |
| **Rev 2** | Row 202 | Signatory ID | `key_auth_v1` | `null` | **YES** |
| **Rev 2** | Row 203 | Affiliation Cert | `key_affil_v2` | **201** | **YES** |
| **Rev 3** | Row 301 | Affiliation Cert | `key_affil_v2` | `null` | **YES** |
| **Rev 3** | Row 302 | Signatory ID | `key_auth_v1` | `null` | NO (Superseded by 303) |
| **Rev 3** | Row 303 | Signatory ID | `key_auth_v2` | **302** | **YES** |

---

## 9. Physical Storage Retention & Transaction Compensation

### 9.1 Physical File Retention on Row Deletion (Safest MVP Strategy)
When a document row is deleted from an unsubmitted draft (`DELETE /documents/{id}`):
- The database row is removed from `college_registration_documents`.
- **The physical storage file on disk is retained as an immutable content-addressed object.**
- *Rationale:* Eliminates any risk of dangling pointers for shared storage keys, avoids complex reference-counting overhead, and ensures historical revisions sharing the file are completely safe.
- Audit event `COLLEGE_REGISTRATION_DOC_REMOVED` is emitted.

### 9.2 Transaction Compensation for Upload Rollbacks
When uploading a new file via `uploadDocument`:
- Physical file is written to disk with a random UUID key.
- A Spring `TransactionSynchronization` is registered.
- If the transaction rolls back (`status == STATUS_ROLLED_BACK`), the compensation callback deletes the newly created physical file.
- If the transaction commits (`status == STATUS_COMMITTED`), the file is preserved.
- **Shared Object Safety:** Compensation applies **strictly** to files physically created during the active upload. Carried-forward documents sharing existing storage keys are never eligible for compensation deletion.

---

## 10. Rejection and ACTION_REQUIRED Counter Reconciliation

### 10.1 Authoritative Counter Semantics Across Lifecycle Events
- `action_required_count`: Tracks revisions submitted after an `ACTION_REQUIRED` decision (safety cap **10**).
- `resubmission_count`: Tracks revisions submitted after a non-permanent `REJECTED` decision (limit **3**).
- Counters increment **strictly upon successful submission of the correction draft**, never upon draft creation or abandonment.

### 10.2 Comprehensive Mixed-Lifecycle Trace Table

| Step | Event Description | Action By | Revision Active | `action_required_count` | `resubmission_count` | Revision Status | Authoritative Pointer (`current_registration_id`) |
|---|---|---|---|---|---|---|---|
| **1** | Public Registration | Public | Rev 1 (Draft) | 0 | 0 | `PENDING` (unsubmitted) | `null` |
| **2** | Initial Submit | College Admin | Rev 1 (In Review) | **0** | **0** | `PENDING` (submitted) | Rev 1 |
| **3** | Review 1: Action Required | Super Admin | Rev 1 (Reviewed) | 0 | 0 | `ACTION_REQUIRED` | Rev 1 |
| **4** | Start Correction 1 | College Admin | Rev 2 (Draft) | 0 | 0 | `PENDING` (unsubmitted) | Rev 1 (Unchanged!) |
| **5** | Submit Correction 1 | College Admin | Rev 2 (In Review) | **1** | 0 | `PENDING` (submitted) | Rev 2 |
| **6** | Review 2: Non-Perm Reject | Super Admin | Rev 2 (Reviewed) | 1 | 0 | `REJECTED` | Rev 2 |
| **7** | Start Correction 2 | College Admin | Rev 3 (Draft) | 1 | 0 | `PENDING` (unsubmitted) | Rev 2 (Unchanged!) |
| **8** | Submit Correction 2 | College Admin | Rev 3 (In Review) | 1 | **1** | `PENDING` (submitted) | Rev 3 |
| **9** | Review 3: Action Required | Super Admin | Rev 3 (Reviewed) | 1 | 1 | `ACTION_REQUIRED` | Rev 3 |
| **10** | Start Correction 3 | College Admin | Rev 4 (Draft) | 1 | 1 | `PENDING` (unsubmitted) | Rev 3 (Unchanged!) |
| **11** | Submit Correction 3 | College Admin | Rev 4 (In Review) | **2** | 1 | `PENDING` (submitted) | Rev 4 |
| **12** | Review 4: Non-Perm Reject | Super Admin | Rev 4 (Reviewed) | 2 | 1 | `REJECTED` | Rev 4 |
| **13** | Submit Correction 4 | College Admin | Rev 5 (In Review) | 2 | **2** | `PENDING` (submitted) | Rev 5 |
| **14** | Review 5: Non-Perm Reject | Super Admin | Rev 5 (Reviewed) | 2 | 2 | `REJECTED` | Rev 5 |
| **15** | Submit Correction 5 | College Admin | Rev 6 (In Review) | 2 | **3** | `PENDING` (submitted) | Rev 6 (Final resubmission!) |
| **16** | Review 6: Rejection | Super Admin | Rev 6 (Reviewed) | 2 | 3 | `REJECTED` (**Permanent**) | Rev 6 (Threshold reached: permanently rejected!) |

---

## 11. Additional Consistency Checks & Architecture Invariants

1. **`colleges.name` Synchronization:**
   When `legalName` is updated via `PUT /my-application` in an editable draft, `college.setName(request.legalName())` is updated within the exact same database transaction, ensuring tenant identity consistency.
2. **Active Document Count Enforcement:**
   Enforced as $|\text{ActiveDocs}(R)| \le 5$. Superseded documents do not count toward this cap.
3. **Storage Path Validation Against Project Structure:**
   On startup, validates that `acadlytic.documents.storage-dir` resolves to a normalized absolute path outside the workspace/webroot (`C:\React\Acadlytic\backend\src\main\resources` or frontend build dirs).
4. **Download Authorization:**
   Enforces `doc.collegeId == principal.collegeId`. Historical documents belonging to caller's college remain downloadable.

---

## 12. Updated REST API Contracts

### 12.1 `GET /api/v1/college-registrations/my-application`
- **Role:** Authenticated `COLLEGE_ADMIN`.
- **Response (`MyApplicationResponse`):**
  - `college`: `{ id, name, code, approvalStatus, status }`
  - `currentRevision`: `{ id, versionNumber, status, submittedForReviewAt, isDraft, profile: { ... } }`
  - `reviewFeedback`: `{ reviewNotes, rejectionReason, isPermanentRejection, reviewedAt }` (from `current_registration_id`)
  - `resubmission`: `{ resubmissionCount, actionRequiredCount, maxRejections: 3, maxActionRequired: 10 }`
  - `checklist`:
    - `emailVerified`: `boolean`
    - `requiredDocumentsUploaded`: `boolean`
    - `canSubmitForReview`: `boolean`
    - `canStartCorrectionDraft`: `boolean`
    - `isFrozenInReview`: `boolean`
  - `activeDocuments`: `List<DocumentResponse>` (only active, non-superseded documents)
  - `revisionHistory`: `List<RevisionSummaryResponse>` (prior immutable versions)

### 12.2 `POST /api/v1/college-registrations/my-application/correction-draft`
- **Role:** Authenticated `COLLEGE_ADMIN`.
- **Pre-condition:** College is in `ACTION_REQUIRED` or non-permanent `REJECTED`.
- **Behavior:** Idempotently obtains or creates an editable correction draft revision `v+1` under parent `College` lock.

### 12.3 `PUT /api/v1/college-registrations/my-application`
- **Role:** Authenticated `COLLEGE_ADMIN`.
- **Request Body (`UpdateApplicationRequest`):** `legalName`, `addressLine1`, `addressLine2`, `city`, `state`, `country`, `postalCode`, `websiteUrl`, `contactPhone`, `affiliatedUniversityName`.
- **Pre-condition:** `currentRevision.submittedForReviewAt == null`. (Throws `409` if frozen).
- **Behavior:** Updates draft profile fields under parent `College` lock. Synchronizes `colleges.name`.

### 12.4 `POST /api/v1/college-registrations/my-application/documents`
- **Role:** Authenticated `COLLEGE_ADMIN`.
- **Form Data:** `file` (`MultipartFile`), `documentCategory` (`DocumentCategory`), `replacesDocumentId` (`Long`, optional).
- **Pre-condition:** `currentRevision.submittedForReviewAt == null`. Validates `replacesDocumentId` belongs to current draft.
- **Behavior:** Validates MIME + magic bytes, stores outside webroot, saves `CollegeRegistrationDocument`, records `COLLEGE_REGISTRATION_DOC_UPLOADED` audit event.

### 12.5 `DELETE /api/v1/college-registrations/my-application/documents/{documentId}`
- **Role:** Authenticated `COLLEGE_ADMIN`.
- **Pre-condition:** `currentRevision.submittedForReviewAt == null`.
- **Behavior:** Deletes document row from draft, restores superseded document to active set, retains physical storage file, records `COLLEGE_REGISTRATION_DOC_REMOVED` audit event.

### 12.6 `POST /api/v1/college-registrations/my-application/submit`
- **Role:** Authenticated `COLLEGE_ADMIN`.
- **Pre-condition:** `user.emailVerifiedAt != null` AND required document categories present AND `currentRevision.submittedForReviewAt == null`.
- **Behavior:** Under parent `College` lock, sets `submittedForReviewAt = now()`, increments resubmission counter if correction draft, updates `college.currentRegistrationId = revision.id`, freezes application mutations, and records `COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW` (or `COLLEGE_REGISTRATION_RESUBMITTED`).

---

## 13. Standard Error Codes & Exception Mapping

| Error Code | HTTP Status | Description |
|---|---|---|
| `EMAIL_NOT_VERIFIED` | `400 BAD_REQUEST` | Cannot submit for review while email is unverified |
| `REQUIRED_DOCUMENTS_MISSING` | `400 BAD_REQUEST` | Cannot submit for review without required document categories |
| `APPLICATION_FROZEN_IN_REVIEW` | `409 CONFLICT` | Attempted mutation while application is under review |
| `ALREADY_SUBMITTED_FOR_REVIEW` | `409 CONFLICT` | Attempted `/submit` on an already submitted revision |
| `INVALID_CORRECTION_STATE` | `400 BAD_REQUEST` | Attempted correction draft when not in `ACTION_REQUIRED` or `REJECTED` |
| `INITIAL_REGISTRATION_NOT_SUBMITTED` | `400 BAD_REQUEST` | Cannot start correction draft before initial submission |
| `INCONSISTENT_REGISTRATION_STATE` | `500 INTERNAL_SERVER_ERROR` | Registration pointer or version sequence corrupted |
| `CROSS_REVISION_REPLACEMENT_NOT_ALLOWED` | `400 BAD_REQUEST` | `replacesDocumentId` must belong to the active draft |
| `CATEGORY_MISMATCH_ON_REPLACEMENT` | `400 BAD_REQUEST` | Replacement document category does not match target document |
| `MAX_ACTION_REQUIRED_LIMIT_EXCEEDED` | `400 BAD_REQUEST` | Reached safety cap of 10 `ACTION_REQUIRED` revisions |
| `MAX_RESUBMISSION_LIMIT_EXCEEDED` | `400 BAD_REQUEST` | Reached maximum of 3 `REJECTED` resubmissions |
| `REGISTRATION_PERMANENTLY_REJECTED` | `403 FORBIDDEN` | College registration has been permanently rejected |
| `COLLEGE_ALREADY_APPROVED` | `403 FORBIDDEN` | College is approved; onboarding endpoints are closed |
| `DOCUMENT_SIZE_EXCEEDED` | `400 BAD_REQUEST` | File exceeds 10 MB limit |
| `INVALID_DOCUMENT_FORMAT` | `400 BAD_REQUEST` | Extension, MIME, or magic bytes are invalid/unsupported |
| `DOCUMENT_LIMIT_EXCEEDED` | `400 BAD_REQUEST` | Active documents exceed 5 per revision |
| `DOCUMENT_NOT_FOUND` | `404 NOT_FOUND` | Document not found or belongs to another tenant |

---

## 14. Audit Event Integrity

The following audit event types will be registered in `AuditEventType.java`:
1. `COLLEGE_REGISTRATION_DOC_UPLOADED`: Emitted when a document is uploaded and persisted.
2. `COLLEGE_REGISTRATION_DOC_REMOVED`: Emitted when a document is removed from an unsubmitted draft.
3. `COLLEGE_REGISTRATION_CORRECTION_DRAFT_CREATED`: Emitted when an immutable `v+1` correction draft is initialized.
4. `COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW`: Emitted when initial Revision 1 is submitted into review.
5. `COLLEGE_REGISTRATION_RESUBMITTED`: Emitted when Revision `v+1` correction draft is submitted into review.

---

## 15. Comprehensive Testing Strategy

### 15.1 Unit Test Coverage
1. **`DocumentValidatorUnitTest` (8 tests):**
   - Valid PDF magic bytes (`%PDF-`), valid JPEG (`FF D8 FF`), valid PNG (`89 50 4E 47...`).
   - Extension spoofing (e.g. bash script named `license.pdf`) rejected with `INVALID_DOCUMENT_FORMAT`.
   - MIME mismatch rejected with `INVALID_DOCUMENT_FORMAT`.
   - Size limit: 10 MB file accepted; 10 MB + 1 byte rejected with `DOCUMENT_SIZE_EXCEEDED`.
   - SHA-256 calculation matches standard test vector.
2. **`LocalFileSystemDocumentStorageServiceUnitTest` (6 tests):**
   - Stores file in configured storage directory outside webroot with UUID key.
   - Absolute path normalization blocks path traversal (`../../etc/passwd`).
   - Startup validation fails if configured directory is within webroot or unwritable.
   - Loads stored file as `Resource`. Deletes file upon request.
3. **`DocumentStorageCompensationUnitTest` (4 tests):**
   - Transaction rollback triggers deletion of newly stored physical file.
   - Transaction commit preserves physical file.
   - Deletion failure during compensation catches exception and logs error safely.
   - Carried-forward document shared storage key is NEVER deleted on rollback.
4. **`CollegeOnboardingServiceUnitTest` (18 tests):**
   - Checklist aggregation: `emailVerified`, `requiredDocumentsUploaded`, `canSubmitForReview`.
   - Review feedback decoupling: `reviewFeedback` comes from `current_registration_id` while editing draft.
   - Immutability: Editing `ACTION_REQUIRED` revision rejected; must use correction draft.
   - Cross-revision replacement rejection: Passing predecessor document ID as `replacesDocumentId` throws `400`.
   - Replacement deletion restoration: Deleting replacement restores superseded document to active set.
   - Duplicate draft prevention: repeated calls return existing draft without incrementing revision.
   - Submit gate: rejects unverified email; rejects missing required categories.
   - Mixed counter semantics: increments `action_required_count` from `ACTION_REQUIRED` and `resubmission_count` from `REJECTED`.

### 15.2 Integration Test Coverage (Testcontainers MySQL 8.0.36)
**File:** `CollegeOnboardingIntegrationTest.java` (in `com.acadlytic.modules.colleges`)
- **Test 1 (Happy Path Initial Onboarding & Freeze Guarantee):**
  - Register college & login as `COLLEGE_ADMIN`.
  - Check `GET /my-application`: `emailVerified: false`, `canSubmitForReview: false`.
  - Verify email &rarr; checklist updates `emailVerified: true`.
  - Upload `UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`.
  - Check `GET /my-application`: `canSubmitForReview: true`.
  - `POST /submit` &rarr; `submittedForReviewAt` set, `COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW` recorded.
  - Assert mutations frozen: subsequent upload or PUT returns `409 APPLICATION_FROZEN_IN_REVIEW`.
- **Test 2 (Pre-Submission Gates):**
  - Attempt `/submit` with unverified email &rarr; 400 `EMAIL_NOT_VERIFIED`.
  - Attempt `/submit` with verified email but missing required docs &rarr; 400 `REQUIRED_DOCUMENTS_MISSING`.
- **Test 3 (Multi-Revision Lineage Walkthrough Rev 1 &rarr; Rev 2 &rarr; Rev 3):**
  - Complete 3-revision walkthrough matching Section 8.4.
  - Verify historical revisions and documents remain unchanged.
  - Verify active document sets accurately exclude superseded documents.
- **Test 4 (Review Feedback Visible During Correction Draft):**
  - Application in `ACTION_REQUIRED` with review notes.
  - Call `POST /correction-draft`.
  - Call `GET /my-application`: assert `currentRevision.isDraft == true` and `reviewFeedback.reviewNotes` reflects previous revision's feedback.
- **Test 5 (Replacement Document Deletion Restores Predecessor):**
  - Upload replacement document &rarr; active set switches to replacement.
  - Delete replacement document &rarr; assert previous document returns to active set.
- **Test 6 (Invalid Cross-Revision Replacement ID):**
  - Pass document ID from Revision 1 as `replacesDocumentId` in Revision 2 draft &rarr; 400 `CROSS_REVISION_REPLACEMENT_NOT_ALLOWED`.
- **Test 7 (Concurrent Upload vs. Submit Protection):**
  - Thread 1 attempts upload while Thread 2 submits.
  - Parent `College` lock ensures upload either finishes before submit or fails with `409 APPLICATION_FROZEN_IN_REVIEW`.
- **Test 8 (Concurrent Profile Update vs. Submit Protection):**
  - Parent `College` lock prevents profile update racing into a frozen revision.
- **Test 9 (Concurrent Duplicate-Category Upload Protection):**
  - Parent `College` lock serializes uploads; duplicate category auto-replaces cleanly without exceeding 5-document limit.
- **Test 10 (Mixed Lifecycle Counter Boundary Enforcement):**
  - Trace mixed sequence: Initial (0,0) &rarr; Action Required (1,0) &rarr; Rejected (1,1) &rarr; Rejected (1,2) &rarr; Rejected (1,3).
  - 4th resubmission attempt blocked with `400 MAX_RESUBMISSION_LIMIT_EXCEEDED`.
- **Test 11 (Storage Compensation on DB Rollback):**
  - Mock DB failure after physical file write &rarr; physical file deleted by transaction synchronization callback; shared carried-forward keys preserved.
- **Test 12 (Tenant Isolation & Safe Download Headers):**
  - Cross-tenant document download returns `403 ACCESS_DENIED` or `404 NOT_FOUND`.
  - Safe download headers asserted.

---

## 16. Implementation Sequence for Module 3.3

1. **Phase 1: Storage & Validation Foundation**
   - Create `DocumentProperties` with startup path validation.
   - Implement `DocumentStorageService` and `LocalFileSystemDocumentStorageService`.
   - Implement `DocumentValidator` (MIME, magic bytes, SHA-256).
   - Implement `DocumentStorageCompensationHandler`.
2. **Phase 2: DTOs & Audit Events**
   - Add audit events to `AuditEventType.java`.
   - Implement DTOs: `MyApplicationResponse`, `UpdateApplicationRequest`, `DocumentResponse`, `SubmitApplicationResponse`, `ReviewFeedbackResponse`.
3. **Phase 3: Repository & Service Layer**
   - Add `findByIdWithLock(Long id)` to `CollegeRepository`.
   - Implement `CollegeOnboardingService` with parent `College` row locking:
     - Application inspection with decoupled review feedback.
     - Idempotent correction draft initialization.
     - Draft profile updating & college name synchronization.
     - Intra-draft document upload with compensation & lineage tracking.
     - Document deletion with predecessor restoration.
     - Document streaming with safe headers.
     - Review submission & resubmission with counter incrementation.
4. **Phase 4: Controller Layer**
   - Implement `CollegeOnboardingController` with OpenAPI documentation.
5. **Phase 5: Automated Testing & Verification**
   - Execute all unit tests and `CollegeOnboardingIntegrationTest` on Testcontainers MySQL 8.0.36.
   - Run full test suite (guaranteeing 97+ tests green).

---

## 17. Explicit Out-of-Scope Items

- **`SUPER_ADMIN` Review Queue Listing & Review:** Belongs to Module 3.4.
- **`SUPER_ADMIN` Approval, Rejection, and Permanent Rejection Decisions:** Belongs to Module 3.5.
- **College Activation & Feature Unlocking:** Belongs to Module 3.5.
- **7-Day Abandoned Registration Cleanup Worker:** Belongs to Module 3.5.
- **Frontend UI & Components:** Deferred until all Phase 03 backend modules are complete.
- **Cloud S3 Object Storage (`ADR-16b`):** Deferred to Phase 14.
- **Automated Antivirus Scanning (`ADR-11b`):** Deferred to Post-MVP (Phase 18.7).

---

## 18. Acceptance Criteria

1. Previously submitted registration revisions and documents remain permanently immutable.
2. `POST /my-application/correction-draft` idempotently creates/obtains an editable revision `v+1` carrying forward profile data and non-superseded documents under parent `College` row lock.
3. `replacesDocumentId` operates strictly within the active draft; cross-revision replacement IDs are rejected with `400 BAD_REQUEST`.
4. Deleting a replacement document restores the superseded document to the active document set.
5. `GET /my-application` cleanly decouples review feedback (from `current_registration_id`) from active draft workspace.
6. All mutating operations coordinate under parent `College` row lock (`FOR UPDATE`), eliminating upload/profile races with submission.
7. Physical files written during a rolled-back transaction are reliably cleaned up via transaction synchronization, while shared carried-forward files are protected.
8. Counter increments (`action_required_count`, `resubmission_count`) occur strictly upon successful correction submission, adhering to the 10 and 3 limits.
9. Storage directory is validated on startup to be outside webroot, failing fast if unsafe.
10. All unit tests and Testcontainers MySQL 8.0.36 integration tests pass with 0 failures.

---

## 19. Open Questions & Recommended Decisions

1. **Storage Directory Safety:** We propose `./storage/documents` in `application.yml`, verified on startup to resolve to an absolute normalized path outside the webroot, with `target/test-storage` used in automated tests.  
   *Recommendation: Approved.*
2. **Profile Syncing on Draft Update:** When a college admin updates institution details via `PUT /my-application` before review submission, if `legalName` is updated, should `colleges.name` also be synchronized automatically?  
   *Recommendation: Yes, to maintain consistency between tenant record and current application.*
3. **Draft Status Representation:** Approach 1 (Zero Migrations: `status = 'PENDING'` with `submitted_for_review_at IS NULL`) vs. Approach 2 (Flyway V5 migration adding `'DRAFT'`).  
   *Recommendation: Approach 1 (Zero Migrations), as it is 100% consistent with Module 3.1A draft intake and eliminates unnecessary schema migration overhead.*
4. **Physical Storage on Document Deletion:** In MVP, retain physical storage files on disk as immutable content-addressed objects when draft rows are deleted.  
   *Recommendation: Approved (safest MVP strategy).*

---
**End of Module 3.3 Backend Inspection & Planning Report (v2.2).**  
*Awaiting user review and authorization before proceeding with implementation.*
