# Acadlytic — Phase 03, Module 3.4 Backend Inspection & Planning Report
## Super Admin Approval Queue & Review Workflow

**Document Version:** v1.3  
**Status:** DRAFT / PENDING USER APPROVAL  
**Module Target:** Phase 03, Module 3.4 — Super Admin Approval Queue & Review Workflow (Backend)  
**Date:** 2026-11-24  
**Scope:** Backend Inspection, Architecture Analysis & Implementation Planning ONLY  
**Execution Boundary:** STRICTLY NON-EXECUTABLE — Zero production code, test code, database migrations, or Master Context updates have been made.

---

## 1. Reconciliation & Review Findings

This section documents the progressive architectural reconciliations across report versions: v1.0 $\to$ v1.1 $\to$ v1.2 $\to$ v1.3, following detailed inspection of the codebase, authoritative Master Context, and previous Module 3.3 verification evidence.

### 1.1 Issues Identified in v1.0 & Addressed in v1.1
1. **Queue Eligibility Invariant Violation:** v1.0 allowed status filtering (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`, `ALL`) on the pending review queue. This violated the core principle that the review queue is an operational inbox strictly for submissions awaiting review. Specifically, after `REQUEST_ACTION`, the previous submitted revision remains referenced by `colleges.current_registration_id` with a non-null `submitted_for_review_at` while the college admin edits a correction draft; exposing it in the review queue violated draft isolation.
2. **Ambiguous Module 3.4 vs. 3.5 Boundary:** v1.0 conflated review decision recording with downstream college operational activation (`colleges.status = ACTIVE`), session revocation, and permanent rejection deactivation.
3. **Flawed Test Strategy:** v1.0 incorrectly suggested executing the full Maven test suite from within a JUnit test method and claimed speculative future test pass counts.

### 1.2 Inconsistencies Corrected in v1.2
1. **Removal of Unapproved Early Permanent Rejection:** Completely removed the unapproved `isPermanent` flag from `ReviewDecisionRequest` and Module 3.4 API contracts. Module 3.4 records standard rejection decisions only. When a rejection applies to the third correction submission ($v_4$, where `resubmission_count = 3`), Module 3.5 executes the permanent rejection lifecycle.
2. **Action-Required Counter Ownership:** Confirmed from `CollegeOnboardingService.java` that `action_required_count` increments strictly upon successful correction submission (`POST /my-application/submit`). `REQUEST_ACTION` in Module 3.4 does not mutate the counter; it only verifies that `actionRequiredCount < 10`.
3. **Review Detail Gating:** Restricted `GET /reviews/{collegeId}` strictly to applications satisfying pending review eligibility predicates. Cross-status historical browsing belongs to Phase 04.

### 1.3 Technical Reconciliations Finalized in v1.3
1. **Accurate Query Counting & Complexity Guarantee (§5.3):** Corrected the arithmetic and terminology surrounding review queue retrieval. Accurately distinguished the pagination data query from the count query, fully detailing all five query operations. Replaced unconditional exact-count claims with the actual architectural guarantee: a bounded query count ($O(1)$ round-trips: at most 5 SQL queries per request) strictly independent of page size ($N$), completely eliminating N+1 query amplification.
2. **Standardized Admin Repository Method Signature (§5.3, §12, §13, §14):** Unified all references on the exact repository method: `findByCollegeIdInAndRoleAndStatus(Collection<Long> collegeIds, Role role, UserStatus status)`. Defined eligible administrators as holding `Role.COLLEGE_ADMIN` and `UserStatus.ACTIVE`, upholding the Single Active College Admin constraint (`active_college_admin_college_id`).
3. **Strengthened Document Download Ownership Validation (§8.2, §9.3):** Established a rigorous multi-point validation algorithm for `GET /reviews/{collegeId}/documents/{documentId}`: verifying document existence, college ownership, registration association existence, and registration history membership. Cross-tenant or mismatched requests fail fast with `404 NOT_FOUND` without exposing file contents or storage keys.
4. **Current vs. Historical Document Boundaries Clarified (§8.1):** Explicitly distinguished active, non-superseded documents returned for current pending revisions from historical revision metadata snapshots. Reaffirmed Module 3.4's read-only boundary for documents (zero upload, replacement, or deletion).

---

## 2. Executive Summary

This report establishes the finalized architectural design, entity interactions, concurrency controls, API contracts, security guarantees, and automated verification strategy for **Phase 03, Module 3.4: Super Admin Approval Queue & Review Workflow**.

Following the successful implementation, automated verification (142/142 tests passing on Testcontainers MySQL 8.0.36), and formal user approval of Module 3.1A, Module 3.2, and Module 3.3, Module 3.4 provides the central platform review authority for prospective college onboarding applications.

### Core Objectives of Module 3.4
1. **Operational Pending Review Queue:** Query all submitted college onboarding applications awaiting administrative review via a paginated, deterministically sorted, and searchable endpoint that strictly excludes unsubmitted drafts, action-required applications, approved colleges, and rejected colleges.
2. **Review Detail & Historical Lineage:** Inspect the authoritative submitted registration revision, proposed administrator credentials, active non-superseded verification documents, and full historical revision lineage (including prior review notes and rejection reasons) for a pending application.
3. **Secure Document Inspection:** Securely stream private verification documents outside webroot with strict college tenant validation, RFC 6266 `Content-Disposition: attachment` headers, and `X-Content-Type-Options: nosniff`.
4. **Execute Review Decisions:** Atomically record review decisions (`APPROVE`, `REQUEST_ACTION`, `REJECT`) under dual concurrency protection—combining client-side optimistic locking (`expectedVersion`) with database row-level pessimistic locking (`SELECT ... FOR UPDATE`), updating revision records, transitioning college approval states, and recording immutable security audit events.

### Architectural Invariants Preserved
- **Zero Schema Migrations:** Inspection confirms that the Flyway `V4__college_registration_schema.sql` baseline completely satisfies all Module 3.4 data storage, state transition, and audit requirements. No new tables, columns, or migration files are required.
- **Strict Revision Immutability:** Previously submitted revisions and their uploaded documents remain permanently immutable snapshots.
- **Draft Isolation:** In-progress correction drafts (`submitted_for_review_at IS NULL`) are never exposed in the review queue and cannot be evaluated by the review decision engine.
- **Role and Tenant Isolation:** Only authenticated `SUPER_ADMIN` users can access review endpoints. Ordinary `COLLEGE_ADMIN` users are strictly denied access with HTTP `403 Forbidden`.

---

## 3. Existing Implementation Inventory & Code Evidence

The Acadlytic backend foundation currently consists of 142 automated tests running against Testcontainers MySQL 8.0.36 in Docker Desktop. The actual code components supporting Module 3.4 were inspected and confirmed as follows:

### 3.1 Database Schema (Flyway V1–V4)
- **`colleges` Table (`V3__auth_core_schema.sql`, `V4__college_registration_schema.sql`):**
  - Tenant anchor containing `id`, `name`, `code`, `approval_status` (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`), `status` (`PENDING_VERIFICATION`, `ACTIVE`, `INACTIVE`, `SUSPENDED`), `permanently_rejected` (boolean), `current_registration_id` (FK to `college_registrations`), `resubmission_count` (int, default 0), `action_required_count` (int, default 0), `archived_at` (timestamp), and optimistic lock `@Version` column `version` (bigint, default 0).
  - VIRTUAL generated column `active_college_code` enforcing uniqueness only across non-permanently-rejected, non-archived tenants.
  - Existing indexes: `idx_colleges_approval_status`, `idx_colleges_status`, and foreign key index on `current_registration_id`.
- **`college_registrations` Table (`V4__college_registration_schema.sql`):**
  - Revision history table storing `id`, `college_id`, `version_number`, `status` (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`), profile fields (`legal_name`, address, phone, website, `affiliated_university_name`), `submitted_for_review_at` (timestamp, nullable), `reviewer_user_id` (FK to `users`), `review_notes` (TEXT), `rejection_reason` (TEXT), `is_permanent_rejection` (boolean), `reviewed_at` (timestamp), `created_at`, `updated_at`.
  - Unique constraint: `uq_college_registrations_version (college_id, version_number)`.
  - Existing indexes: `idx_college_registrations_status_submitted (status, submitted_for_review_at)`, `idx_college_registrations_college_version (college_id, version_number)`.
- **`college_registration_documents` Table (`V4__college_registration_schema.sql`):**
  - Verification document metadata table storing `id`, `college_id`, `registration_id` (FK), `document_category` (`UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`, `INSTITUTION_REGISTRATION_PROOF`, `ADDITIONAL_SUPPORTING_DOCUMENT`), `original_filename`, `storage_key` (unique), `mime_type`, `file_size_bytes`, `sha256_checksum`, `replaces_document_id` (self-referencing FK), `created_at`.
  - Existing indexes: `idx_crd_college_registration`, `idx_crd_registration_id`.
- **`users` Table (`V3__auth_core_schema.sql`):**
  - Proposed college admin and system user table with `id`, `college_id`, `email`, `email_verified_at`, `role` (`SUPER_ADMIN`, `COLLEGE_ADMIN`), `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- **`audit_events` Table (`V3__auth_core_schema.sql`):**
  - Immutable audit trail storing `id`, `event_type`, `actor_user_id`, `actor_role`, `target_user_id`, `college_id`, `outcome`, `ip_address`, `metadata_json`, `created_at`.

### 3.2 Domain Entities & Relationship Mappings
- **`College.java`:**
  - `id`, `name`, `code`, `approvalStatus` (`CollegeApprovalStatus`), `status` (`CollegeStatus`), `permanentlyRejected`, `currentRegistrationId`, `resubmissionCount`, `actionRequiredCount`, `archivedAt`, `version`.
  - **Entity Relationship Finding:** `College` maps `currentRegistrationId` as a raw `@Column(name = "current_registration_id") private Long currentRegistrationId;`. It does NOT declare a direct JPA `@OneToOne` or `@ManyToOne` entity reference to `CollegeRegistration`.
- **`CollegeRegistration.java`:**
  - `id`, `collegeId`, `versionNumber`, `status` (`CollegeApprovalStatus`), profile fields, `submittedForReviewAt`, `reviewerUserId`, `reviewNotes`, `rejectionReason`, `permanentRejection`, `reviewedAt`.
  - **Entity Relationship Finding:** `CollegeRegistration` maps `collegeId` as a raw `@Column(name = "college_id") private Long collegeId;`. It does NOT declare a direct JPA `@ManyToOne` entity reference to `College`.
- **`CollegeRegistrationDocument.java`:**
  - `id`, `collegeId`, `registrationId`, `documentCategory`, `originalFilename`, `storageKey`, `mimeType`, `fileSizeBytes`, `sha256Checksum`, `replacesDocumentId`, `createdAt`.
- **`User.java`:**
  - `id`, `collegeId`, `email`, `emailVerifiedAt`, `role` (`Role`), `status` (`UserStatus`), `firstName`, `lastName`.

### 3.3 Repositories & Existing Capabilities
- **`CollegeRepository` (`com.acadlytic.modules.colleges.repository`):**
  - `findByIdWithLock(Long id)`: Confirmed present. Uses `@Lock(LockModeType.PESSIMISTIC_WRITE)` and `@QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})`.
  - `findByCode(String code)`, `existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull(String code)`.
- **`CollegeRegistrationRepository` (`com.acadlytic.modules.colleges.repository`):**
  - `findByCollegeIdOrderByVersionNumberAsc(Long collegeId)`: Confirmed present.
  - `findByCollegeIdAndVersionNumber(Long collegeId, int versionNumber)`: Confirmed present.
  - `findFirstByCollegeIdOrderByVersionNumberDesc(Long collegeId)`: Confirmed present.
- **`CollegeRegistrationDocumentRepository` (`com.acadlytic.modules.colleges.repository`):**
  - `findByRegistrationId(Long registrationId)`: Confirmed present.
  - `findByIdAndCollegeId(Long id, Long collegeId)`: Confirmed present.
  - `findByStorageKey(String storageKey)`: Confirmed present.
- **`UserRepository` (`com.acadlytic.modules.auth.repository`):**
  - `findByCollegeId(Long collegeId)`: Confirmed present. Returns users associated with a college.
- **`AuditEventService` (`com.acadlytic.modules.auth.service`):**
  - `record(...)`: Confirmed present. Persists sanitized audit events in the current transaction.

---

## 4. Registration and Review Lifecycle Analysis

The complete college registration, submission, and review lifecycle across Phase 03 is traced below:

```
[ Public Registration Intake ] (Module 3.1A)
        │
        ▼
College: approval_status = PENDING, status = PENDING_VERIFICATION
Rev 1: status = PENDING, submitted_for_review_at = NULL (Draft)
colleges.current_registration_id = Rev 1.id
User: COLLEGE_ADMIN, status = ACTIVE, email_verified_at = NULL
        │
        ▼
[ Email Verification ] (Module 3.2)
User: email_verified_at = timestamp
        │
        ▼
[ Restricted Dashboard & Document Upload ] (Module 3.3)
Admin uploads mandatory documents into Rev 1 draft workspace
        │
        ▼
[ Submit for Review ] (Module 3.3)
Rev 1: submitted_for_review_at = timestamp, status = PENDING
colleges.current_registration_id = Rev 1.id
colleges.approval_status = PENDING
Application enters FROZEN state (College Admin mutations return 409)
        │
        ▼
========================================================================
                      MODULE 3.4: PENDING REVIEW QUEUE
========================================================================
   Only records matching the strict pending invariant are visible:
   - c.current_registration_id = cr.id
   - cr.submitted_for_review_at IS NOT NULL
   - cr.status = 'PENDING'
   - c.approval_status = 'PENDING'
   - c.permanently_rejected = FALSE
   - c.archived_at IS NULL
        │
        ├───────────────────────────────┬───────────────────────────────┐
        ▼                               ▼                               ▼
   [ APPROVE ]                 [ REQUEST_ACTION ]                  [ REJECT ]
Rev status -> APPROVED       Rev status -> ACTION_REQ        Rev status -> REJECTED
College approval -> APPROVED College approval -> ACTION_REQ  College approval -> REJECTED
(Activation in Mod 3.5)      (College Admin can draft v+1)   (If resubmissions < 3:
                                                                Admin can draft v+1;
                                                              If resubmissions == 3:
                                                                Module 3.5 permanent
                                                                rejection triggered)
```

### 4.1 Authoritative Submission Pointer & Draft Isolation
1. **Draft vs. Submitted Semantics:**
   - A revision is an **unsubmitted draft** if and only if `submitted_for_review_at IS NULL`.
   - A revision is **authoritatively submitted** if and only if `submitted_for_review_at IS NOT NULL`.
2. **Current Registration Pointer (`colleges.current_registration_id`):**
   - At initial intake (Module 3.1A), `current_registration_id` references Rev 1.
   - Upon initial submission (Module 3.3), `current_registration_id` continues pointing to Rev 1 (now with `submitted_for_review_at != null`).
   - If Super Admin requests corrections (`ACTION_REQUIRED`) and the College Admin creates a correction draft Rev 2 (`POST /my-application/correction-draft`), Rev 2 is created with `submitted_for_review_at = NULL`.
   - **Crucial Invariant:** While the College Admin edits Rev 2 draft, `colleges.current_registration_id` continues pointing to Rev 1 so historical review notes remain decoupled and accessible. Rev 1 has `submitted_for_review_at != null`, but its status is `ACTION_REQUIRED`. It must **NOT** appear in the review queue.
   - Only when Rev 2 is submitted (`POST /my-application/submit`) does `colleges.current_registration_id` update to Rev 2, transitioning `colleges.approval_status` to `PENDING` and `rev2.status` to `PENDING`. At that precise moment, the college re-enters the pending review queue.

---

## 5. Review Queue Eligibility & Complete Data Retrieval

### 5.1 Strict Eligibility Invariants
A college registration record appears in the Super Admin pending review queue if and only if all of the following conditions are simultaneously met:
1. `cr.id = c.current_registration_id`: The revision is the college's current authoritative registration.
2. `cr.submitted_for_review_at IS NOT NULL`: The revision has been formally submitted for review.
3. `cr.status = 'PENDING'`: The revision is actively awaiting review.
4. `c.approval_status = 'PENDING'`: The college tenant itself is pending review.
5. `c.permanently_rejected = FALSE`: The college has not been permanently rejected.
6. `c.archived_at IS NULL`: The college has not been archived.

### 5.2 Lifecycle State Exclusion Table

| Application Lifecycle State | `c.current_reg_id` Status | `cr.submitted_at` | `c.approval_status` | In Queue? | Reason for Exclusion |
| :--- | :--- | :--- | :--- | :---: | :--- |
| Initial Registration (Pre-Submit) | `PENDING` | `NULL` | `PENDING` | **NO** | `submitted_for_review_at` is NULL (Draft). |
| Initial Submission (v1) | `PENDING` | `NOT NULL` | `PENDING` | **YES** | Meets all pending review invariants. |
| Action Required (Pre-Draft) | `ACTION_REQUIRED` | `NOT NULL` | `ACTION_REQUIRED` | **NO** | Status is not `PENDING`. |
| Action Required (Draft v2 Open) | `ACTION_REQUIRED` (v1) | `NOT NULL` (v1) | `ACTION_REQUIRED` | **NO** | Pointer points to v1 (`ACTION_REQUIRED`). |
| Resubmission (v2 Submitted) | `PENDING` (v2) | `NOT NULL` (v2) | `PENDING` | **YES** | Meets all pending review invariants. |
| Non-Permanent Rejected (v1) | `REJECTED` | `NOT NULL` | `REJECTED` | **NO** | Status is not `PENDING`. |
| Approved College | `APPROVED` | `NOT NULL` | `APPROVED` | **NO** | Status is not `PENDING`. |
| Permanently Rejected College | `REJECTED` | `NOT NULL` | `REJECTED` | **NO** | `permanently_rejected = TRUE`. |
| Soft-Archived College | Any | Any | Any | **NO** | `archived_at IS NOT NULL`. |

### 5.3 Complete Queue Data Retrieval Strategy (Zero N+1 Queries)
To construct `ReviewQueueItemResponse`, the service must provide:
- Registration data: `registrationId`, `versionNumber`, `status`, `submittedForReviewAt`, `legalName`
- College data: `collegeId`, `collegeCode`, `resubmissionCount`, `actionRequiredCount`
- Proposed Admin data: `adminName`, `adminEmail`
- Document data: `documentCount` (count of active, non-superseded documents)

Because `College`, `CollegeRegistration`, and `User` are separate unassociated JPA entities, constructing this response via lazy loading would trigger multiple queries per row ($N+1$).
The service will execute a **deterministic 5-operation batched retrieval**:

```
Client Request (GET /reviews?page=0&size=20)
       │
       ▼
[ Query 1: Total Count Query ]
SELECT COUNT(cr) FROM CollegeRegistration cr, College c WHERE ...
(Executed conditionally by Spring Data JPA to compute totalElements and totalPages)
       │
       ▼
[ Query 2: Pagination Data Query ]
SELECT cr FROM CollegeRegistration cr, College c WHERE ...
ORDER BY cr.submittedForReviewAt ASC, cr.id ASC LIMIT ? OFFSET ?
(Yields Page<CollegeRegistration> containing up to 20 items)
       │
       ▼  (If page is empty, service immediately returns empty PageResponse)
[ Extract Keys in Memory ]
collegeIds = registrations.map(getCollegeId).toList()
registrationIds = registrations.map(getId).toList()
       │
       ▼
[ Query 3: Batch College Retrieval ]
collegeRepository.findAllById(collegeIds)
--> Map<Long, College> by collegeId
       │
       ▼
[ Query 4: Batch Eligible College Admin Retrieval ]
userRepository.findByCollegeIdInAndRoleAndStatus(collegeIds, Role.COLLEGE_ADMIN, UserStatus.ACTIVE)
--> Map<Long, User> by collegeId (Single Active Admin constraint guarantees 1 per college)
       │
       ▼
[ Query 5: Batch Document Retrieval ]
documentRepository.findByRegistrationIdIn(registrationIds)
--> Grouped by registrationId
       │
       ▼
[ In-Memory Active Document Calculation ]
For each registration:
  supersededIds = docs.map(replacesDocumentId).filter(nonNull).toSet()
  activeCount = docs.filter(id NOT IN supersededIds).count()
       │
       ▼
[ Assemble ReviewQueueItemResponse Page ]
Return ApiResponse<PageResponse<ReviewQueueItemResponse>>
```

**Architectural Query Guarantee:**
- **Bounded Constant Query Count:** A bounded, constant-time database query count ($O(1)$ database round-trips: at most 5 SQL queries per request), strictly independent of page size ($N$).
- If a page has 0 results, Spring Data JPA executes only the count query (1 query).
- If a page has results, exactly 5 queries execute across the 5 operations.
- **Zero N+1 Query Amplification:** Eliminates all row-by-row queries, whether the requested page size is 1, 20, or 100.

### 5.4 Validated JPQL Query
```java
@Query(value = "SELECT cr FROM CollegeRegistration cr, College c " +
       "WHERE cr.id = c.currentRegistrationId " +
       "AND c.permanentlyRejected = false " +
       "AND c.archivedAt IS NULL " +
       "AND c.approvalStatus = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
       "AND cr.status = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
       "AND cr.submittedForReviewAt IS NOT NULL " +
       "AND (:search IS NULL OR LOWER(cr.legalName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))) " +
       "AND (:fromInstant IS NULL OR cr.submittedForReviewAt >= :fromInstant) " +
       "AND (:toInstant IS NULL OR cr.submittedForReviewAt <= :toInstant)",
       countQuery = "SELECT COUNT(cr) FROM CollegeRegistration cr, College c " +
       "WHERE cr.id = c.currentRegistrationId " +
       "AND c.permanentlyRejected = false " +
       "AND c.archivedAt IS NULL " +
       "AND c.approvalStatus = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
       "AND cr.status = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
       "AND cr.submittedForReviewAt IS NOT NULL " +
       "AND (:search IS NULL OR LOWER(cr.legalName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))) " +
       "AND (:fromInstant IS NULL OR cr.submittedForReviewAt >= :fromInstant) " +
       "AND (:toInstant IS NULL OR cr.submittedForReviewAt <= :toInstant)")
Page<CollegeRegistration> findPendingReviewQueue(
        @Param("search") String search,
        @Param("fromInstant") Instant fromInstant,
        @Param("toInstant") Instant toInstant,
        Pageable pageable);
```

---

## 6. Module 3.4 versus Module 3.5 Scope Reconciliation

### 6.1 Authoritative Baseline in ACADLYTIC_MASTER_CONTEXT.md
The Master Context establishes the following module breakdown:
- **Section 13.5 (lines 1027–1029):**
  > **Phase 03, Module 3.4 — Super Admin Approval Queue & Review Workflow (Backend)**  
  > Scope: Super Admin review queue endpoint (`GET /api/v1/super-admin/colleges/reviews`), registration revision inspection endpoint, review decisions (`ACTION_REQUIRED`, `REJECTED`, `APPROVED`), review notes and rejection reasons, reviewer audit trail recording, and transition handling.
- **Section 13.5 (line 1015):**
  > Module 3.5 must implement permanent rejection when the third resubmission is rejected.
- **Section 13.5 (line 1019):**
  > Modules 3.4 and 3.5 (Backend): NOT_STARTED (Module 3.4: Super Admin Approval Queue & Review Workflow; Module 3.5: Approval Lifecycle, College Activation & Revisions).

### 6.2 Unambiguous Responsibility Matrix

| Feature / Responsibility | Module 3.4 | Module 3.5 | Authority & Architectural Boundary |
| :--- | :---: | :---: | :--- |
| **Pending review queue listing** | **YES** | NO | Master Context §13.5 (line 1029). Lists applications awaiting review. |
| **Application detail inspection** | **YES** | NO | Master Context §13.5 (line 1029: "registration revision inspection endpoint"). Inspects submitted profile and proposed admin. |
| **Historical revision & document inspection** | **YES** | NO | Master Context §13.5 (line 1029). Inspects all revisions and past review notes. |
| **Super Admin document download** | **YES** | NO | Master Context §8.9 & §13.5. Streams private files with safe download headers. |
| **APPROVE decision recording** | **YES** | NO | Master Context §13.5 (line 1029). Sets `cr.status = APPROVED`, `c.approval_status = APPROVED`, reviewer ID, timestamp, notes under lock. |
| **REQUEST_ACTION decision recording** | **YES** | NO | Master Context §13.5 (line 1029). Sets `cr.status = ACTION_REQUIRED`, `c.approval_status = ACTION_REQUIRED`, mandatory notes (10–2000 chars). |
| **REJECT decision recording (non-permanent)** | **YES** | NO | Master Context §13.5 (line 1029). Sets `cr.status = REJECTED`, `c.approval_status = REJECTED`, mandatory reason (10–2000 chars). |
| **Permanent rejection decision execution** | **NO** | **YES** | Master Context §13.5 (line 1015). Execution of permanent rejection state machine. |
| **User & college tenant deactivation** | **NO** | **YES** | Setting `colleges.status = INACTIVE` and `users.status = INACTIVE` upon permanent rejection belongs to Module 3.5. |
| **Session revocation** | **NO** | **YES** | Master Context §8.5 & §13.5. Immediate session invalidation via `SessionRevocationService` belongs to Module 3.5. |
| **Unique reservation release** | **NO** | **YES** | Releasing code, email, and admin slot via MySQL VIRTUAL generated column mechanics belongs to Module 3.5. |
| **Review decision audit events** | **YES** | **YES** | Module 3.4 records decision events; Module 3.5 records activation and deactivation events. |
| **Approval feature unlock & College Activation** | **NO** | **YES** | Master Context §13.5 (line 1019). Setting `colleges.status = ACTIVE` and unlocking management APIs belongs to Module 3.5. |
| **Outbox notification dispatch** | **NO** | **YES** | Master Context §8.8 & §13.5. Dispatching approval, action-required, and rejection emails belongs to Module 3.5. |
| **Seven-day permanent rejection archival** | **NO** | **YES** | Scheduled soft-archival (`archived_at`) after 7-day retention belongs to Module 3.5. |
| **Abandoned registration cleanup** | **NO** | **YES** | Scheduled 7-day purge worker for unverified + unsubmitted applications belongs to Module 3.5. |

---

## 7. Permanent Rejection & Action-Required Counter Semantics

### 7.1 Permanent Rejection Lifecycle & 3-Resubmission Rule
1. **Approved Resubmission Sequence:**
   - **Initial Submission ($v_1$):** `resubmission_count = 0`.
   - **Correction Submission 1 ($v_2$ submitted):** `resubmission_count` increments from 0 to 1.
   - **Correction Submission 2 ($v_3$ submitted):** `resubmission_count` increments from 1 to 2.
   - **Correction Submission 3 ($v_4$ submitted):** `resubmission_count` increments from 2 to 3. (This is the third and final allowed correction submission).
2. **Permanent Rejection Trigger Condition:**
   - When Super Admin reviews and issues a `REJECT` decision on an application where `colleges.resubmission_count == 3`:
     - Module 3.4 records the rejection on the revision (`cr.status = REJECTED`, `c.approval_status = REJECTED`, rejection reason, reviewer ID).
     - Because `colleges.resubmission_count == 3`, the resubmission allowance is exhausted. Opening a 4th correction draft is blocked by Module 3.3 (`400 BAD_REQUEST (MAX_RESUBMISSION_LIMIT_EXCEEDED)`).
     - As mandated by Master Context §13.5 (line 1015), **Module 3.5 identifies this condition and executes the permanent rejection lifecycle**:
       - `colleges.permanently_rejected = true`
       - `colleges.status = INACTIVE`
       - `users.status = INACTIVE` (proposed college admin)
       - `SessionRevocationService.revokeAllSessionsForUser(adminUserId)` (all active sessions revoked)
       - Unique reservation release: MySQL VIRTUAL generated column indexes on `active_college_code`, `active_email`, and `active_college_admin_college_id` evaluate to `NULL`, releasing the code and email for future registration.
       - Initiation of the 7-day soft-archival countdown.
3. **Removal of Unapproved `isPermanent` Flag:**
   - In strict compliance with approved ADRs and Master Context, reviewer-selected early permanent rejection is not exposed in Module 3.4. Module 3.4 accepts standard rejection decisions only.

### 7.2 Action-Required Counter Semantics
1. **Mutation Ownership Confirmed in Code:**
   - Inspection of `CollegeOnboardingService.java` (lines 748–756) reveals:
     `college.setActionRequiredCount(college.getActionRequiredCount() + 1);` executes strictly upon successful correction submission (`POST /my-application/submit`).
   - `REQUEST_ACTION` in Module 3.4 does **NOT** increment `action_required_count`. The counter remains unchanged during review decision execution.
2. **10-Round Correction Safety Cap:**
   - During `REQUEST_ACTION` decision execution, Module 3.4 checks:
     `if (college.getActionRequiredCount() >= 10) throw new AppException("MAX_ACTION_REQUIRED_LIMIT_EXCEEDED", ...);`
   - If a college has already reached 10 correction rounds, Super Admin cannot request further action; the reviewer must either approve or reject the application.
3. **Module Ownership Breakdown:**
   - **Module 3.3:** Owns incrementing `action_required_count` upon correction submission.
   - **Module 3.4:** Owns enforcing the 10-round ceiling during review decision execution.

---

## 8. Query, Pagination, Sorting & Document Ownership Validation

### 8.1 Active Document Calculation Rule & Document Boundaries
1. **Current Pending Revision Active Documents:**
   Reusing Module 3.3's verified active document rule:
   > A document row is active if and only if no other document row in that revision references its ID in `replaces_document_id`.

   ```java
   Set<Long> supersededIds = docs.stream()
           .map(CollegeRegistrationDocument::getReplacesDocumentId)
           .filter(Objects::nonNull)
           .collect(Collectors.toSet());

   List<CollegeRegistrationDocument> activeDocs = docs.stream()
           .filter(d -> !supersededIds.contains(d.getId()))
           .toList();
   ```
   - In the review queue, `documentCount` represents the count of active, non-superseded documents.
   - In `GET /reviews/{collegeId}`, `activeDocuments` returns active documents for the current submitted revision.
2. **Historical Revision Lineage:**
   - `revisionHistory` preserves historical revision metadata snapshots ($v_1, v_2, \dots$) including `versionNumber`, `status`, `legalName`, `submittedForReviewAt`, `reviewerUserId`, `reviewNotes`, `rejectionReason`, and `reviewedAt`.
3. **Module 3.4 Read-Only Document Boundary:**
   - Module 3.4 is strictly read-only for documents. Zero upload, replacement, or deletion endpoints exist in Module 3.4.

### 8.2 Strengthened Document Download Ownership Validation
For `GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}`, the download service enforces a strict 4-step multi-point validation algorithm:

```java
// 1. Target college validation
College college = collegeRepository.findById(collegeId)
        .orElseThrow(() -> new AppException("COLLEGE_NOT_FOUND", "Target college not found.", HttpStatus.NOT_FOUND));

// 2. Document existence and college ownership
CollegeRegistrationDocument document = collegeRegistrationDocumentRepository.findByIdAndCollegeId(documentId, collegeId)
        .orElseThrow(() -> new AppException("DOCUMENT_NOT_FOUND", "Verification document not found.", HttpStatus.NOT_FOUND));

// 3. Document's registration association validation
CollegeRegistration registration = collegeRegistrationRepository.findById(document.getRegistrationId())
        .orElseThrow(() -> new AppException("INCONSISTENT_REGISTRATION_STATE", "Document registration association is invalid.", HttpStatus.INTERNAL_SERVER_ERROR));

// 4. Registration history membership validation
if (!registration.getCollegeId().equals(college.getId())) {
    throw new AppException("DOCUMENT_NOT_FOUND", "Verification document not found.", HttpStatus.NOT_FOUND);
}
```

**Security Guarantees:**
- Verifies document existence, direct college ownership, registration association existence, and registration history membership.
- Prevents cross-tenant document inspection: Any mismatched college ID, forged document ID, or unassociated registration terminates immediately with `404 NOT_FOUND (DOCUMENT_NOT_FOUND)`.
- Physical file contents and storage keys are never accessed or disclosed on unauthorized requests.
- Permitted downloads are streamed outside webroot with safe headers: `Content-Disposition: attachment; filename="<sanitized>"`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-cache, no-store, must-revalidate`.

### 8.3 Review Detail Eligibility
- The review detail endpoint (`GET /api/v1/super-admin/colleges/reviews/{collegeId}`) enforces the exact same eligibility invariants as the pending review queue:
  - `college.approvalStatus == CollegeApprovalStatus.PENDING`
  - `submittedRevision.status == CollegeApprovalStatus.PENDING`
  - `submittedRevision.submittedForReviewAt != null`
  - `!college.permanentlyRejected`
  - `college.archivedAt == null`
- If an unsubmitted draft, approved, rejected, or action-required college ID is passed, the endpoint returns `409 CONFLICT (APPLICATION_NOT_AWAITING_REVIEW)`.
- Cross-status historical browsing belongs strictly to Phase 04 (`GET /api/v1/colleges/{id}`).

### 8.4 Query Validation Constraints
- **Search Parameter (`search`):** Max 100 characters. Null or blank is ignored. Case-insensitive substring match against `cr.legalName` or `c.code`.
- **Date Range Parameters (`from`, `to`):** ISO-8601 UTC timestamps. Validates `!from.isAfter(to)`. If invalid, returns `400 BAD_REQUEST (INVALID_DATE_RANGE)`.
- **Pagination (`page`, `size`):** `page >= 0`, `1 <= size <= 100` (default: 20).
- **Sorting (`sort`):** Whitelisted properties: `submittedForReviewAt` (default), `legalName`, `createdAt`. Any non-whitelisted property is rejected with `400 BAD_REQUEST (INVALID_SORT_PROPERTY)`.
- **Deterministic Tie-Breaking:** Spring Data sort appends `cr.id ASC` as secondary tie-breaker.

---

## 9. Proposed API Contracts

All endpoints are prefixed with `/api/v1/super-admin/colleges/reviews` and require an authenticated session holding the `SUPER_ADMIN` role.

### 9.1 Review Queue Listing
- **Endpoint:** `GET /api/v1/super-admin/colleges/reviews`
- **Authorization:** `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **Query Parameters:**
  | Parameter | Type | Required | Default | Validation / Constraints |
  | :--- | :--- | :--- | :--- | :--- |
  | `search` | `String` | No | `null` | Max 100 chars; case-insensitive substring match. |
  | `from` | `Instant` | No | `null` | ISO-8601 UTC timestamp. |
  | `to` | `Instant` | No | `null` | ISO-8601 UTC timestamp; must be &ge; `from`. |
  | `page` | `int` | No | `0` | Min 0. |
  | `size` | `int` | No | `20` | Min 1, max 100. |
  | `sort` | `String` | No | `submittedForReviewAt,asc` | Whitelisted: `submittedForReviewAt`, `legalName`, `createdAt`. |

- **Response Envelope:** `ApiResponse<PageResponse<ReviewQueueItemResponse>>` (HTTP 200 OK)
- **Response Schema (`ReviewQueueItemResponse`):**
  ```json
  {
    "success": true,
    "message": "Review queue retrieved successfully.",
    "data": {
      "content": [
        {
          "collegeId": 101,
          "collegeCode": "OU-TECH",
          "legalName": "Osmania University Technology Campus",
          "registrationId": 205,
          "versionNumber": 1,
          "status": "PENDING",
          "submittedForReviewAt": "2026-11-23T14:30:00Z",
          "adminName": "Sarah Jenkins",
          "adminEmail": "admin@outech.ac.in",
          "resubmissionCount": 0,
          "actionRequiredCount": 0,
          "documentCount": 2
        }
      ],
      "page": 0,
      "size": 20,
      "totalElements": 1,
      "totalPages": 1,
      "last": true
    },
    "timestamp": "2026-11-24T07:15:00Z"
  }
  ```

---

### 9.2 Application Review Detail Inspection
- **Endpoint:** `GET /api/v1/super-admin/colleges/reviews/{collegeId}`
- **Authorization:** `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **Path Parameter:** `collegeId` (`Long`, mandatory).
- **Response Envelope:** `ApiResponse<CollegeReviewDetailResponse>` (HTTP 200 OK)
- **Response Schema (`CollegeReviewDetailResponse`):**
  ```json
  {
    "success": true,
    "message": "Review detail retrieved successfully.",
    "data": {
      "college": {
        "id": 101,
        "name": "Osmania University Technology Campus",
        "code": "OU-TECH",
        "approvalStatus": "PENDING",
        "status": "PENDING_VERIFICATION",
        "permanentlyRejected": false,
        "resubmissionCount": 0,
        "actionRequiredCount": 0,
        "createdAt": "2026-11-23T12:00:00Z"
      },
      "adminUser": {
        "id": 55,
        "email": "admin@outech.ac.in",
        "firstName": "Sarah",
        "lastName": "Jenkins",
        "emailVerifiedAt": "2026-11-23T12:15:00Z",
        "createdAt": "2026-11-23T12:00:00Z"
      },
      "submittedRevision": {
        "id": 205,
        "versionNumber": 1,
        "status": "PENDING",
        "legalName": "Osmania University Technology Campus",
        "addressLine1": "Main Campus Road, Amberpet",
        "addressLine2": null,
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "postalCode": "500007",
        "websiteUrl": "https://outech.ac.in",
        "contactPhone": "+914027098243",
        "affiliatedUniversityName": "Osmania University",
        "submittedForReviewAt": "2026-11-23T14:30:00Z"
      },
      "activeDocuments": [
        {
          "id": 501,
          "registrationId": 205,
          "documentCategory": "UNIVERSITY_AFFILIATION_CERTIFICATE",
          "originalFilename": "affiliation_certificate_2026.pdf",
          "mimeType": "application/pdf",
          "fileSizeBytes": 2048576,
          "sha256Checksum": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
          "replacesDocumentId": null,
          "createdAt": "2026-11-23T13:00:00Z"
        }
      ],
      "revisionHistory": [
        {
          "id": 205,
          "versionNumber": 1,
          "status": "PENDING",
          "legalName": "Osmania University Technology Campus",
          "submittedForReviewAt": "2026-11-23T14:30:00Z",
          "reviewerUserId": null,
          "reviewNotes": null,
          "rejectionReason": null,
          "isPermanentRejection": false,
          "reviewedAt": null,
          "createdAt": "2026-11-23T12:00:00Z"
        }
      ],
      "concurrencyVersion": 0
    },
    "timestamp": "2026-11-24T07:15:00Z"
  }
  ```
- **Error Codes:**
  - `401 UNAUTHORIZED`: Unauthenticated session.
  - `403 ACCESS_DENIED`: Caller does not hold `SUPER_ADMIN` role.
  - `404 NOT_FOUND (COLLEGE_NOT_FOUND)`: Target college ID does not exist.
  - `409 CONFLICT (APPLICATION_NOT_AWAITING_REVIEW)`: Application is not currently pending review.

---

### 9.3 Secure Document Inspection / Streaming
- **Endpoint:** `GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}`
- **Authorization:** `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **Path Parameters:** `collegeId` (`Long`), `documentId` (`Long`).
- **Response Headers:**
  - `Content-Type`: Stored MIME type (`application/pdf`, `image/jpeg`, `image/png`).
  - `Content-Length`: File size in bytes.
  - `Content-Disposition`: `attachment; filename="<sanitized_filename>"`.
  - `X-Content-Type-Options`: `nosniff`.
  - `Cache-Control`: `private, no-cache, no-store, must-revalidate`.
- **Response Body:** Binary stream (`Resource`).
- **Error Codes:**
  - `401 UNAUTHORIZED`: Unauthenticated session.
  - `403 ACCESS_DENIED`: Caller does not hold `SUPER_ADMIN` role.
  - `404 NOT_FOUND (DOCUMENT_NOT_FOUND)`: Document does not exist or fails multi-point ownership validation.

---

### 9.4 Review Decision Execution
- **Endpoint:** `POST /api/v1/super-admin/colleges/reviews/{collegeId}/decision`
- **Authorization:** `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **Path Parameter:** `collegeId` (`Long`).
- **Request Body Schema (`ReviewDecisionRequest`):**
  ```json
  {
    "action": "APPROVE",
    "expectedVersion": 0,
    "reviewNotes": "All documents verified against university portal.",
    "rejectionReason": null
  }
  ```
- **Validation Rules:**
  - `action`: Mandatory. Must be one of `APPROVE`, `REQUEST_ACTION`, `REJECT`.
  - `expectedVersion`: Mandatory (`Long`, min 0). Must match `college.getVersion()`.
  - If `action == REQUEST_ACTION`: `reviewNotes` is mandatory (`@NotBlank`, min 10 chars, max 2000 chars).
  - If `action == REJECT`: `rejectionReason` is mandatory (`@NotBlank`, min 10 chars, max 2000 chars).
  - If `action == APPROVE`: `reviewNotes` is optional (max 2000 chars if provided).
- **Response Schema (`ReviewDecisionResponse`):** (HTTP 200 OK)
  ```json
  {
    "success": true,
    "message": "Application review decision recorded successfully.",
    "data": {
      "collegeId": 101,
      "registrationId": 205,
      "versionNumber": 1,
      "approvalStatus": "APPROVED",
      "reviewedAt": "2026-11-24T07:15:00Z",
      "reviewerUserId": 1
    },
    "timestamp": "2026-11-24T07:15:00Z"
  }
  ```
- **Error Codes:**
  - `400 BAD_REQUEST (VALIDATION_ERROR)`: Blank or missing mandatory notes/reasons, or invalid action.
  - `400 BAD_REQUEST (MAX_ACTION_REQUIRED_LIMIT_EXCEEDED)`: College has already reached the maximum 10 action rounds.
  - `401 UNAUTHORIZED`: Unauthenticated session.
  - `403 ACCESS_DENIED`: Caller does not hold `SUPER_ADMIN` role.
  - `404 NOT_FOUND (COLLEGE_NOT_FOUND)`: College ID not found.
  - `409 CONFLICT (STALE_APPLICATION_VERSION)`: `expectedVersion` does not match `college.version`.
  - `409 CONFLICT (APPLICATION_NOT_AWAITING_REVIEW)`: Current application is not in `PENDING` status or is not submitted.

---

## 10. Concurrency, Locking & Transaction Strategy

```
Super Admin Decision Request (POST /decision)
        │
        ▼
[ Acquire College Pessimistic Write Lock ]
collegeRepository.findByIdWithLock(collegeId)  -->  SELECT ... FOR UPDATE (3000ms timeout)
        │
        ▼
[ Optimistic Version Check ]
Assert college.getVersion().equals(request.expectedVersion())
        ├─ Mismatch ──► Rollback & Throw 409 STALE_APPLICATION_VERSION
        ▼
[ Operational & Review State Check ]
Assert college.getApprovalStatus() == PENDING
Assert submittedRevision.getStatus() == PENDING
Assert submittedRevision.getSubmittedForReviewAt() != null
        ├─ Mismatch ──► Rollback & Throw 409 APPLICATION_NOT_AWAITING_REVIEW
        ▼
[ Atomic Mutation Under Lock ]
Update CollegeRegistration (status, reviewer_user_id, review_notes/rejection_reason, reviewed_at)
Update College (approval_status)  --> bumps college.version
Record AuditEvent
Commit Transaction
```

1. **Dual Concurrency Mechanism:**
   - **Pessimistic Row Lock (`FOR UPDATE`):** Serializes concurrent transactions at the database row level, preventing race conditions between concurrent reviewers or between reviewer decisions and college admin submissions.
   - **Optimistic Version Lock (`expectedVersion`):** Prevents stale UI decisions. If Reviewer A views version 0, and Reviewer B updates it to version 1, Reviewer A's request with `expectedVersion = 0` fails fast with `409 Conflict`.
2. **Transactional Integrity:**
   - The entire decision execution executes inside a single Spring `@Transactional` boundary. Any failure rolls back all entity mutations and prevents orphan audit logs.

---

## 11. Audit Event Plan

Module 3.4 introduces three new audit event types in `AuditEventType.java`:
1. `COLLEGE_REGISTRATION_APPROVED`: Emitted upon successful `APPROVE` decision.
2. `COLLEGE_REGISTRATION_ACTION_REQUIRED`: Emitted upon successful `REQUEST_ACTION` decision.
3. `COLLEGE_REGISTRATION_REJECTED`: Emitted upon successful `REJECT` decision.

### Payload Structure:
- `actorUserId`: ID of authenticated `SUPER_ADMIN`.
- `actorRole`: `Role.SUPER_ADMIN`.
- `targetUserId`: ID of proposed `COLLEGE_ADMIN`.
- `collegeId`: ID of the college.
- `outcome`: `AuditOutcome.SUCCESS`.
- `metadataJson`:
  ```json
  {
    "registrationId": 205,
    "versionNumber": 1,
    "action": "REQUEST_ACTION",
    "reviewNotes": "University affiliation certificate seal is unreadable."
  }
  ```

---

## 12. Corrected Automated Test Strategy

The test plan utilizes targeted unit tests and targeted Testcontainers MySQL integration tests. Full regression testing is executed via the standard Maven test runner. Speculative future test counts and recursive Maven executions are strictly avoided.

### 12.1 MockMvc Unit Tests (`CollegeReviewControllerUnitTest` & `CollegeReviewServiceUnitTest`)
- **Queue Listing:**
  - 200 OK with default pagination and sorting.
  - 200 OK with custom search query and date range filter.
  - 400 Bad Request on invalid date range (`from > to`).
  - 400 Bad Request on unapproved sort property.
  - 403 Forbidden when invoked without `SUPER_ADMIN` privileges.
- **Application Detail:**
  - 200 OK returning full review payload for valid `collegeId`.
  - 404 NOT_FOUND for non-existent college.
  - 409 Conflict for non-pending application.
  - 403 Forbidden for non-SUPER_ADMIN.
- **Document Streaming & Ownership Validation:**
  - 200 OK streaming document resource with proper MIME type, file length, `nosniff`, and `attachment` headers.
  - 404 NOT_FOUND when document belongs to another college (cross-tenant attempt).
  - 404 NOT_FOUND when document registration association is invalid.
- **Review Decision:**
  - 200 OK on valid `APPROVE`.
  - 200 OK on valid `REQUEST_ACTION` with 10–2000 char notes.
  - 400 Bad Request on `REQUEST_ACTION` with blank or short notes (<10 chars).
  - 200 OK on valid `REJECT` with 10–2000 char reason.
  - 400 Bad Request on `REJECT` with blank or short reason (<10 chars).
  - 409 Conflict on stale `expectedVersion`.
  - 409 Conflict when application is not in `PENDING` state.
  - 400 Bad Request when 10 action rounds are already exhausted.

### 12.2 Testcontainers MySQL Integration Tests (`CollegeReviewIntegrationTest`)
- **Infrastructure:** `AbstractMySqlIntegrationTest` with Testcontainers MySQL 8.0.36 dynamic port.
- **Required Test Scenarios:**
  1. `pendingQueue_batchedRetrieval_executesWithBoundedQueryCount_eliminatingNPlusOne()`: Asserts that review queue retrieval executes a bounded number of SQL statements (at most 5 queries) regardless of the number of items on the page.
  2. `pendingQueue_documentCount_excludesSupersededDocuments()`: Asserts that `documentCount` in the queue response correctly reflects only active, non-superseded documents.
  3. `pendingQueue_eligibleAdminLookup_mapsOnlyActiveCollegeAdmin()`: Asserts that queue displays only active `COLLEGE_ADMIN` users, filtering out inactive or unrelated users.
  4. `pendingQueue_excludesUnsubmittedDrafts_andIncludesSubmittedPending()`: Asserts unsubmitted drafts are excluded while submitted revisions appear.
  5. `pendingQueue_excludesActionRequiredPredecessor_whileCorrectionDraftOpen()`: Seeds an `ACTION_REQUIRED` revision with an open correction draft; asserts it is strictly excluded from the pending queue.
  6. `pendingQueue_includesResubmittedRevision_afterCorrectionSubmit()`: Asserts college re-enters queue once correction draft $v_2$ is submitted.
  7. `pendingQueue_excludesApprovedAndRejectedApplications()`: Asserts approved and rejected colleges do not appear in the pending queue.
  8. `pendingQueue_excludesPermanentlyRejectedAndArchivedColleges()`: Asserts permanently rejected and archived records are strictly excluded.
  9. `pendingQueue_paginationAndDeterministicSorting_operatesCorrectlyOnMySQL()`: Verifies pagination, search filtering, and deterministic tie-breaking via `cr.id ASC`.
  10. `reviewDetail_rejectsNonPendingApplicationsWithConflict()`: Asserts that querying review detail for an approved or action-required college returns `409 Conflict`.
  11. `documentDownload_multiPointOwnershipValidation_blocksCrossTenantAccess()`: Asserts that attempting to download a document under a mismatched college ID returns `404 Not Found` without exposing file storage keys.
  12. `approveDecision_transitionsRevisionAndCollege_andRecordsAudit()`: Executes `APPROVE`, asserts revision `status = APPROVED`, `colleges.approval_status = APPROVED`, reviewer ID and timestamp recorded, and `COLLEGE_REGISTRATION_APPROVED` audit event committed.
  13. `requestActionDecision_doesNotIncrementActionRequiredCount_byItself()`: Executes `REQUEST_ACTION`, asserts `college.action_required_count` remains unchanged.
  14. `requestActionDecision_blockedWhenTenActionRoundsExceeded()`: Asserts that attempting `REQUEST_ACTION` on a college with `actionRequiredCount == 10` returns `400 Bad Request`.
  15. `rejectDecision_nonPermanent_preservesResubmissionAllowance()`: Executes non-permanent rejection, asserts revision and college `status = REJECTED`, and resubmission allowance is preserved.
  16. `concurrency_staleVersionRejectedWithConflict()`: Asserts that concurrent review attempts with stale `expectedVersion` return `409 Conflict`.
  17. `transactionRollback_onException_preservesOriginalState()`: Asserts that an unhandled failure during decision execution leaves database state completely unmodified.

### 12.3 Full Backend Regression Verification
- Executed separately via standard Maven command:
  `mvn -f backend/pom.xml test`
- Verifies that all 142 existing baseline tests (Auth, Outbox, Module 3.1A, Module 3.2, Module 3.3) continue to pass with zero regressions.

---

## 13. Implementation Sequence and Dependencies

1. **Phase 1: Domain & Security Setup**
   - Add audit event types (`COLLEGE_REGISTRATION_APPROVED`, `COLLEGE_REGISTRATION_ACTION_REQUIRED`, `COLLEGE_REGISTRATION_REJECTED`) to `AuditEventType.java`.
2. **Phase 2: DTO Layer**
   - Create request and response DTOs: `PageResponse`, `ReviewQueueItemResponse`, `CollegeReviewDetailResponse`, `ReviewDecisionRequest`, `ReviewDecisionResponse`, `ReviewDecisionAction`.
3. **Phase 3: Repository Extensions**
   - Add `findPendingReviewQueue(...)` JPQL query and count query to `CollegeRegistrationRepository`.
   - Add `findByCollegeIdInAndRoleAndStatus(Collection<Long> collegeIds, Role role, UserStatus status)` to `UserRepository`.
   - Add `findByRegistrationIdIn(Collection<Long> registrationIds)` to `CollegeRegistrationDocumentRepository`.
4. **Phase 4: Service Layer**
   - Implement `CollegeReviewService` orchestrating queue queries with 5-operation bounded batched retrieval, detail loading, document streaming with 4-step ownership validation, and decision execution with `findByIdWithLock` and `expectedVersion`.
5. **Phase 5: Controller Layer**
   - Implement `CollegeReviewController` exposing REST endpoints with Springdoc OpenAPI annotations and `@PreAuthorize("hasRole('SUPER_ADMIN')")`.
6. **Phase 6: Automated Verification**
   - Implement `CollegeReviewControllerUnitTest`, `CollegeReviewServiceUnitTest`, and `CollegeReviewIntegrationTest`.
   - Run full regression suite (`mvn -f backend/pom.xml test`).

---

## 14. Explicit List of Files Likely to be Created or Modified

### 14.1 Production Files to Create:
1. `backend/src/main/java/com/acadlytic/common/dto/PageResponse.java`
2. `backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeReviewController.java`
3. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java`
4. `backend/src/main/java/com/acadlytic/modules/colleges/dto/ReviewQueueItemResponse.java`
5. `backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeReviewDetailResponse.java`
6. `backend/src/main/java/com/acadlytic/modules/colleges/dto/ReviewDecisionRequest.java`
7. `backend/src/main/java/com/acadlytic/modules/colleges/dto/ReviewDecisionResponse.java`
8. `backend/src/main/java/com/acadlytic/modules/colleges/dto/ReviewDecisionAction.java`

### 14.2 Production Files to Modify:
1. `backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java` (Add 3 new review event types)
2. `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationRepository.java` (Add `findPendingReviewQueue`)
3. `backend/src/main/java/com/acadlytic/modules/auth/repository/UserRepository.java` (Add `findByCollegeIdInAndRoleAndStatus(Collection<Long> collegeIds, Role role, UserStatus status)`)
4. `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java` (Add `findByRegistrationIdIn(Collection<Long> registrationIds)`)

### 14.3 Test Files to Create:
1. `backend/src/test/java/com/acadlytic/modules/colleges/controller/CollegeReviewControllerUnitTest.java`
2. `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeReviewServiceUnitTest.java`
3. `backend/src/test/java/com/acadlytic/modules/colleges/CollegeReviewIntegrationTest.java`

---

## 15. Confirmation That No Implementation Changes Were Made

In strict compliance with instructions:
- **Zero production code changes were made.**
- **Zero test code changes were made.**
- **Zero database migrations were created or modified.**
- **Zero frontend changes were made.**
- **No changes were made to `ACADLYTIC_MASTER_CONTEXT.md`.**
- **No implementation has begun.**

---

**End of Module 3.4 Backend Inspection & Planning Report (v1.3).**  
*Awaiting user review and formal authorization before proceeding to implementation.*
