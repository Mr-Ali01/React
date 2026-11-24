# Acadlytic — Phase 03, Module 3.5 Inspection and Planning Report
## Approval Lifecycle, College Activation & Revisions (Backend)

**Document Reference:** `docs/03-phase/phase-03-module-3.5-inspection-and-planning-report.md`  
**Target Module:** Phase 03, Module 3.5 — Approval Lifecycle, College Activation & Revisions (Backend)  
**Authoritative Context Reference:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`  
**Execution Mode:** Strict Read-Only Inspection & Planning  
**Planning Version:** v1.1 (Consolidated Reconciliation)  
**Timestamp:** 2026-11-24T16:55:00+05:30  
**Status:** `PENDING USER REVIEW & APPROVAL`

---

## 1. Executive Summary and Current Status

Phase 03 of the Acadlytic platform governs prospective college tenant intake, verification, restricted onboarding, document handling, and administrative review. 

The preceding backend modules of Phase 03 have achieved complete implementation, rigorous automated verification against Testcontainers MySQL 8.0.36, and formal user approval:
- **Module 3.1A (Backend Registration Foundation):** `APPROVED` (Public intake endpoint, $v_1$ revision creation, IP rate limiter, transactional outbox dispatch).
- **Module 3.2 (Email Verification & College Admin Lifecycle):** `APPROVED` (48-hour single-use token verification, pessimistic lock consumption, sliding-window user rate limiting).
- **Module 3.3 (Restricted Dashboard, Document Management & Submission):** `APPROVED` (Restricted onboarding dashboard, outside-webroot document management with magic-byte validation, multi-revision correction lineage $v_1 \to v_2 \to v_3$, freeze guarantee).
- **Module 3.4 (Super Admin Approval Queue & Review Workflow):** `APPROVED` (Pending review queue with 5-operation bounded query retrieval, review detail inspection, secure streaming download with 4-step multi-point ownership validation, dual-locked review decisions for `APPROVE`, `REQUEST_ACTION`, and non-permanent `REJECT`, with 196/196 passing regression tests).

### 1.1 Technical Reconciliations Finalized in v1.1
Following targeted architectural review, v1.1 reconciles four specific technical areas:
1. **Abandoned Registration Cleanup Eligibility (§10.1):** Grounded the candidate selection predicate strictly in `ADR-13`, `roadmap.md`, `mvp-scope.md`, and `authentication.md`. Corrected the query to require **both** `users.email_verified_at IS NULL` and `college_registrations.submitted_for_review_at IS NULL`, explicitly excluding verified-but-unsubmitted accounts from abandonment purging.
2. **Durable Physical Document Cleanup & Sweeper Strategy (§10.4):** Formulated a robust, two-tiered cleanup strategy addressing physical deletion failures after database commit. Demonstrates how existing database relationships (`c.archived_at IS NOT NULL` and `cr.submitted_for_review_at IS NULL`) support an idempotent, bounded retry sweeper without schema migrations, while evaluating the minimal alternative migration (`file_purged_at`).
3. **Outbox Idempotency and Delivery Semantics (§9.3):** Separately proved enqueue idempotency (guaranteed by Module 3.4's pessimistic row lock and optimistic `expectedVersion` check) and delivery semantics. Explicitly acknowledged that the asynchronous outbox worker delivers **at-least-once** semantics over SMTP, eliminating speculative exactly-once claims. Verified mutually exclusive branching for permanent rejection notifications.
4. **Audit Trail Consistency (§8.2):** Standardized the complete audit event sequence across review decisions, operational activation, permanent rejection, abandoned cleanup, and retention archival, cleanly delineating `SUPER_ADMIN` decision audits from `SYSTEM` scheduled events.

### 1.2 Objective of Module 3.5
Module 3.5 represents the **final backend module of Phase 03**. It owns the completion of the onboarding state machine, bridging the platform's administrative decisions with live operational activation and final termination:
1. **College Operational Activation:** Transitioning approved colleges from onboarding status (`PENDING_VERIFICATION`) to operational status (`ACTIVE`), seamlessly unlocking academic management APIs for the existing `COLLEGE_ADMIN` account and dashboard without separate account creation.
2. **Permanent Rejection Execution:** Enforcing the approved counter boundary (where the 3rd correction submission, $v_4$, is subsequently rejected), setting `colleges.permanently_rejected = TRUE`, deactivating the college and admin user, revoking all active sessions immediately, and releasing reserved unique college codes, email addresses, and admin slots via MySQL `VIRTUAL` generated column mechanics.
3. **Lifecycle Transactional Outbox Notifications:** Dispatching transactional email notifications for College Approval, Correction Action Required, Non-Permanent Rejection, and Permanent Rejection using the established transactional outbox pattern.
4. **Seven-Day Archival and Abandoned Registration Cleanup:** Running scheduled automated maintenance to soft-archive unverified and unsubmitted registrations abandoned for $\ge 7$ days (releasing reservations and purging draft document files) and soft-archiving permanently rejected records after a 7-day retention period, while strictly preserving submitted, approved, and historical audit records.

---

## 2. Exact Existing Implementation Inventory

A thorough read-only inspection of the backend codebase, entities, repositories, security services, outbox infrastructure, and database migrations was conducted. The relevant existing components are cataloged below:

### 2.1 Database Schema (Flyway V1–V4)
- **`colleges` Table (`V3__auth_core_schema.sql`, `V4__college_registration_schema.sql`):**
  - Columns: `id`, `name`, `code`, `approval_status`, `status`, `permanently_rejected`, `current_registration_id`, `resubmission_count`, `action_required_count`, `archived_at`, `version`, `created_at`, `updated_at`.
  - Virtual Generated Column:
    ```sql
    active_college_code VARCHAR(50) GENERATED ALWAYS AS (
        CASE
            WHEN permanently_rejected = FALSE AND archived_at IS NULL THEN code
            ELSE NULL
        END
    ) VIRTUAL,
    CONSTRAINT uq_colleges_active_college_code UNIQUE (active_college_code)
    ```
    *Inspection Finding:* When `permanently_rejected = TRUE` or `archived_at IS NOT NULL`, `active_college_code` automatically evaluates to `NULL`. Because MySQL allows multiple `NULL` values in a unique index, setting `permanently_rejected = TRUE` or `archived_at = NOW()` immediately releases the code reservation.
- **`users` Table (`V3__auth_core_schema.sql`):**
  - Columns: `id`, `college_id`, `email`, `pending_email`, `email_verified_at`, `email_released`, `password_hash`, `first_name`, `last_name`, `role`, `status`, `failed_login_attempts`, `locked_until`, `last_login_at`, `created_at`, `updated_at`.
  - Virtual Generated Columns:
    ```sql
    active_email VARCHAR(255) GENERATED ALWAYS AS (
        CASE
            WHEN email_released = FALSE THEN email
            ELSE NULL
        END
    ) VIRTUAL,
    CONSTRAINT uq_users_active_email UNIQUE (active_email)
    ```
    ```sql
    active_college_admin_college_id BIGINT GENERATED ALWAYS AS (
        CASE
            WHEN role = 'COLLEGE_ADMIN' AND status = 'ACTIVE' THEN college_id
            ELSE NULL
        END
    ) VIRTUAL,
    CONSTRAINT uk_users_single_active_college_admin UNIQUE (active_college_admin_college_id)
    ```
    *Inspection Finding:* Setting `email_released = TRUE` evaluates `active_email` to `NULL`, releasing the email reservation. Setting `status = 'INACTIVE'` or `'SUSPENDED'` evaluates `active_college_admin_college_id` to `NULL`, releasing the active single-admin slot.
- **`college_registrations` Table (`V4__college_registration_schema.sql`):**
  - Columns: `id`, `college_id`, `version_number`, `status`, `legal_name`, address fields, `submitted_for_review_at`, `reviewer_user_id`, `review_notes`, `rejection_reason`, `is_permanent_rejection`, `reviewed_at`, `created_at`, `updated_at`.
  - Unique Constraint: `uq_college_registrations_version (college_id, version_number)`.
- **`college_registration_documents` Table (`V4__college_registration_schema.sql`):**
  - Columns: `id`, `college_id`, `registration_id`, `document_category`, `original_filename`, `storage_key`, `mime_type`, `file_size_bytes`, `sha256_checksum`, `replaces_document_id`, `created_at`.
- **`outbox_emails` Table (`V3__auth_core_schema.sql`):**
  - Columns: `id`, `event_type`, `recipient_email`, `subject`, `template_key`, `payload_json`, `status` (`PENDING`, `PROCESSING`, `SENT`, `FAILED_PERMANENT`), `attempt_count`, `max_attempts`, `next_attempt_at`, `locked_at`, `last_error`, `created_at`, `updated_at`, `sent_at`.
- **`audit_events` Table (`V3__auth_core_schema.sql`):**
  - Columns: `id`, `event_type`, `actor_user_id`, `actor_role`, `target_user_id`, `college_id`, `outcome`, `ip_address`, `metadata_json`, `created_at`.

### 2.2 Security Infrastructure & Guards
- **`CollegeAccessGuard.java` (`com.acadlytic.security`):**
  - Line 65: `requireApprovedAndActiveCollege(Long targetCollegeId)` verifies that:
    - Target college exists.
    - `college.isPermanentlyRejected()` is `false` (otherwise throws `403 REGISTRATION_PERMANENTLY_REJECTED`).
    - `college.getStatus() != CollegeStatus.SUSPENDED` (otherwise throws `403 COLLEGE_SUSPENDED`).
    - `college.getStatus() != CollegeStatus.INACTIVE && college.getArchivedAt() == null` (otherwise throws `403 COLLEGE_INACTIVE`).
    - `college.getApprovalStatus() == CollegeApprovalStatus.APPROVED && college.getStatus() == CollegeStatus.ACTIVE` (otherwise throws `403 COLLEGE_NOT_APPROVED`).
- **`SessionValidationFilter.java` (`com.acadlytic.security`):**
  - Enforces live database checks on every authenticated HTTP request:
    - Verifies user exists and `user.getStatus() == UserStatus.ACTIVE` (suspended/inactive accounts receive `403` and have session cleared).
    - If `Role.COLLEGE_ADMIN`: verifies `college.isPermanentlyRejected() == false` (returns `403 REGISTRATION_PERMANENTLY_REJECTED`), `college.getStatus() != SUSPENDED` (`403 COLLEGE_SUSPENDED`), and `college.getStatus() != INACTIVE` (`403 COLLEGE_INACTIVE`).
- **`SessionRevocationService.java` (`com.acadlytic.security`):**
  - Line 75: `revokeAllSessionsForCollege(Long collegeId)` queries `userRepository.findByCollegeId(collegeId)` and deletes all active session entries from `SPRING_SESSION` via `sessionRepository.deleteById(sessionId)`.

### 2.3 Outbox Infrastructure
- **`OutboxEmailService.java` (`com.acadlytic.modules.outbox.service`):**
  - `enqueue(eventType, recipientEmail, subject, templateKey, payload)` persists new `OutboxEmail` entities inside the active database transaction (`Propagation.REQUIRED`).
- **`OutboxEmailWorker.java` (`com.acadlytic.modules.outbox.service`):**
  - Scheduled worker polling every 10 seconds, locking batches with `SELECT ... FOR UPDATE SKIP LOCKED`, rendering email templates, and delegating to `EmailSender` outside database transactions.
- **`EmailTemplateRenderer.java` (`com.acadlytic.modules.outbox.service`):**
  - Renders email bodies from `templateKey` and `payloadJson`. Currently supports `PASSWORD_RESET`, `EMAIL_CHANGE_VERIFICATION`, `EMAIL_CHANGE_ALERT`, `EMAIL_VERIFICATION`. Module 3.5 will add templates for the 4 registration review lifecycle notifications.

### 2.4 Document Storage & Compensation
- **`LocalFileSystemDocumentStorageService.java` (`com.acadlytic.modules.colleges.storage`):**
  - Line 89: `delete(String storageKey)` invokes `Files.deleteIfExists(filePath)`. It returns boolean `false` if the file does not exist without throwing `NoSuchFileException`, providing innate idempotency.
- **`DocumentStorageCompensationHandler.java` (`com.acadlytic.modules.colleges.storage`):**
  - Implements Spring's `TransactionSynchronization` to clean up newly written files if an active database transaction rolls back.

---

## 3. Current Lifecycle State-Transition Analysis

The full registration, submission, review, and termination lifecycle is mapped below:

```
                      [ Public Registration (v1) ]
                                   │
                                   ▼
          College: approval = PENDING, status = PENDING_VERIFICATION
          Rev 1: status = PENDING, submitted_for_review_at = NULL (Draft)
          Admin User: status = ACTIVE, email_verified_at = NULL
                                   │
                ┌──────────────────┴──────────────────┐
                │ (If abandoned >= 7d: unverified     │ (Verify email & upload docs)
                │  AND unsubmitted)                   ▼
                ▼                          [ Submit for Review (v1) ]
     [ Abandoned 7-Day Purge ]             - Rev 1: submitted_at != NULL
     - colleges.status = INACTIVE          - Revision & documents FROZEN
     - colleges.archived_at = NOW          - Enters Super Admin Review Queue
     - users.status = INACTIVE                        │
     - users.email_released = TRUE                    ▼
     - Draft physical files purged        ====================================
     - Code/email reservations released     SUPER ADMIN REVIEW QUEUE (Mod 3.4)
                                          ====================================
                                            │              │               │
                                            ▼              ▼               ▼
                                       [ APPROVE ]  [ REQ ACTION ]     [ REJECT ]
                                            │              │               │
                        ┌───────────────────┘              │               │
                        ▼                                  │               │
          [ College Operational Activation ]               │               │
          - Rev: status = APPROVED                         │               │
          - College: approval = APPROVED                   │               │
          - College: status = ACTIVE                       │               │
          - Outbox: COLLEGE_REGISTRATION_APPROVED          │               │
          - Audit: COLLEGE_ACTIVATED                       │               │
          - Unlocks Academic Management APIs               │               │
                                                           │               │
                        ┌──────────────────────────────────┘               │
                        │                                                  │
                        ▼                                                  ▼
          [ Action Required (Rounds < 10) ]              [ Non-Permanent Reject ]
          - Rev: status = ACTION_REQ                     - Rev: status = REJECTED
          - College: approval = ACTION_REQ               - College: approval = REJECTED
          - Outbox: ACTION_REQUIRED                      - Outbox: REJECTED
          - College Admin drafts v+1                     - College Admin drafts v+1
          - Resubmission increments action_count         - Resubmission increments resub_count
          - Max 10 rounds allowed                        - Max 3 resubmissions allowed
                                                                           │
                                          ┌────────────────────────────────┘
                                          │ (If resubmission_count == 3 AND rejected)
                                          ▼
                         [ Permanent Rejection Lifecycle ]
                         - Rev 4: is_permanent_rejection = TRUE
                         - College: permanently_rejected = TRUE
                         - College: status = INACTIVE
                         - Admin User: status = INACTIVE
                         - Admin User: email_released = TRUE
                         - Session: revokeAllSessionsForCollege()
                         - Virtual Columns release code, email, admin slot
                         - Outbox: PERMANENTLY_REJECTED
                         - Audit: COLLEGE_PERMANENTLY_REJECTED
                                          │
                                          ▼ (After 7 days retention)
                         [ 7-Day Permanent Rejection Archival ]
                         - colleges.archived_at = NOW
                         - Audit: PERMANENTLY_REJECTED_COLLEGE_ARCHIVED
```

---

## 4. College Approval and Operational Activation Plan

### 4.1 Transition Requirements
In Module 3.4, when Super Admin records an `APPROVE` decision:
- `submittedRevision.setStatus(CollegeApprovalStatus.APPROVED)`
- `college.setApprovalStatus(CollegeApprovalStatus.APPROVED)`
- `college.getStatus()` remains `CollegeStatus.PENDING_VERIFICATION` (Module 3.4 explicitly stopped here per its scope boundary).

In Module 3.5, the approval lifecycle is completed by atomically transitioning the college into an active tenant:
1. **Operational Status Transition:**
   - `college.setStatus(CollegeStatus.ACTIVE)`
   - Under this transition, `college.isManagementUnlocked()` evaluates to:
     ```java
     !permanentlyRejected && archivedAt == null 
         && approvalStatus == CollegeApprovalStatus.APPROVED 
         && status == CollegeStatus.ACTIVE
     ```
     This evaluates to `true`.
2. **Account Continuity (No Separate Account Creation):**
   - The proposed `COLLEGE_ADMIN` user created at registration (`users.status = ACTIVE`, credentials already set) remains `ACTIVE`.
   - In accordance with Master Context §5 (line 265): *"The same account and dashboard are unlocked after approval. Do not create a separate account activation workflow."*
   - Zero secondary account activation or re-registration is performed. The same `college_id` and `user_id` are preserved.
3. **API Access Unlocking:**
   - Server-side authorization via `CollegeAccessGuard.requireApprovedAndActiveCollege(collegeId)` checks live database state:
     - `approvalStatus == APPROVED` $\to$ PASS.
     - `status == ACTIVE` $\to$ PASS.
     - `permanentlyRejected == false` $\to$ PASS.
     - `archivedAt == null` $\to$ PASS.
   - All Phase 04+ management endpoints immediately become accessible.
4. **Session Observation:**
   - Existing active sessions of the `COLLEGE_ADMIN` observe `managementUnlocked: true` upon their next request to `GET /api/v1/auth/me`.
5. **Outbox Notification:**
   - Enqueues `COLLEGE_REGISTRATION_APPROVED` email notification to the administrator.
6. **Audit Event:**
   - Records `AuditEventType.COLLEGE_ACTIVATED` in `audit_events`.

---

## 5. Permanent Rejection Plan and Counter-Boundary Proof

### 5.1 Authoritative Resubmission Counter Mechanics
The resubmission counter boundary is governed by the following mathematical and architectural invariants:
- **Initial Application ($v_1$):** Created with `resubmission_count = 0`. Submitting $v_1$ does **not** increment `resubmission_count` (remains 0).
- **First Correction Submission ($v_2$):** When $v_1$ is rejected (non-permanent), `resubmission_count` is 0 ($0 < 3$). Admin can create draft $v_2$. Submitting $v_2$ increments `resubmission_count` from $0 \to 1$.
- **Second Correction Submission ($v_3$):** When $v_2$ is rejected, `resubmission_count` is 1 ($1 < 3$). Admin can create draft $v_3$. Submitting $v_3$ increments `resubmission_count` from $1 \to 2$.
- **Third Correction Submission ($v_4$):** When $v_3$ is rejected, `resubmission_count` is 2 ($2 < 3$). Admin can create draft $v_4$. Submitting $v_4$ increments `resubmission_count` from $2 \to 3$.
- **Submission Limit Reached:** At this stage, $v_4$ is submitted and under review in the queue. `resubmission_count == 3`.

### 5.2 The Permanent Rejection Trigger Condition
If Super Admin reviews $v_4$ and issues a `REJECT` decision:
- `college.getResubmissionCount() == 3`.
- The allowance of 3 correction submissions after initial submission has been fully exhausted.
- In Module 3.3, `createCorrectionDraft` enforces:
  ```java
  if (college.getResubmissionCount() >= 3) {
      throw new AppException("MAX_RESUBMISSION_LIMIT_EXCEEDED", ...);
  }
  ```
  A 4th correction draft ($v_5$) is unconditionally blocked.
- Therefore, when Super Admin rejects a revision where `colleges.resubmission_count == 3`:
  **Module 3.5 executes the Permanent Rejection Lifecycle.**

### 5.3 Permanent Rejection Execution Sequence
The permanent rejection operation executes inside a single database transaction under pessimistic lock:
1. **Revision Mutation:**
   - `submittedRevision.setStatus(CollegeApprovalStatus.REJECTED)`
   - `submittedRevision.setPermanentRejection(true)` (`is_permanent_rejection = TRUE`)
   - `submittedRevision.setRejectionReason(rejectionReason)`
   - `submittedRevision.setReviewedAt(now)`
   - `submittedRevision.setReviewerUserId(reviewerUserId)`
   - `collegeRegistrationRepository.save(submittedRevision)`
2. **College Mutation:**
   - `college.setApprovalStatus(CollegeApprovalStatus.REJECTED)`
   - `college.setStatus(CollegeStatus.INACTIVE)`
   - `college.setPermanentlyRejected(true)` (`permanently_rejected = TRUE`)
   - `college.setRejectionReason(rejectionReason)`
   - `collegeRepository.save(college)`
3. **User Deactivation & Email Release:**
   - Query all users associated with the college: `userRepository.findByCollegeId(college.getId())`.
   - For each user (specifically the `COLLEGE_ADMIN`):
     - `user.setStatus(UserStatus.INACTIVE)` (terminates active user privileges).
     - `user.setEmailReleased(true)` (`email_released = TRUE`).
     - `userRepository.save(user)`
4. **Immediate Session Revocation:**
   - `sessionRevocationService.revokeAllSessionsForCollege(college.getId())`:
     - Discovers and deletes all active HTTP session entries from `SPRING_SESSION` and `SPRING_SESSION_ATTRIBUTES`.
     - Ensures that any subsequent request from currently logged-in browsers fails immediately at `SessionValidationFilter` with `403 REGISTRATION_PERMANENTLY_REJECTED` or `403 AUTH_ACCOUNT_INACTIVE`.
5. **Outbox Notification:**
   - Enqueues `COLLEGE_REGISTRATION_PERMANENTLY_REJECTED` email to the administrator. (Non-permanent email is strictly bypassed).
6. **Audit Event Recording:**
   - Records `COLLEGE_PERMANENTLY_REJECTED` and `COLLEGE_ADMIN_DEACTIVATED` audit events with reviewer metadata and rejection reasons.
7. **Full Data Retention Guarantee:**
   - Zero rows are deleted from `colleges`, `college_registrations`, `college_registration_documents`, or `audit_events`. Complete historical auditability is preserved.

---

## 6. Reservation Release Strategy

A critical requirement of permanent rejection and 7-day abandoned registration cleanup is the release of reserved unique identifiers, allowing legitimate institutions or administrators to register again in the future.

### 6.1 Database Mechanics Analysis
The database schema (`V3__auth_core_schema.sql`) implements this via MySQL 8 `VIRTUAL` generated columns and partial uniqueness:

| Reserved Resource | Target Table & Column | Generated Virtual Column Definition | Unique Constraint | Release Trigger in Module 3.5 |
| :--- | :--- | :--- | :--- | :--- |
| **College Code** | `colleges.code` | `active_college_code = CASE WHEN permanently_rejected = FALSE AND archived_at IS NULL THEN code ELSE NULL END` | `uq_colleges_active_college_code UNIQUE (active_college_code)` | Setting `permanently_rejected = TRUE` OR `archived_at = NOW()` immediately forces `active_college_code` to `NULL`. |
| **Administrator Email** | `users.email` | `active_email = CASE WHEN email_released = FALSE THEN email ELSE NULL END` | `uq_users_active_email UNIQUE (active_email)` | Setting `email_released = TRUE` immediately forces `active_email` to `NULL`. |
| **Single Active Admin Slot** | `users.college_id` | `active_college_admin_college_id = CASE WHEN role = 'COLLEGE_ADMIN' AND status = 'ACTIVE' THEN college_id ELSE NULL END` | `uk_users_single_active_college_admin UNIQUE (active_college_admin_college_id)` | Setting `status = 'INACTIVE'` immediately forces `active_college_admin_college_id` to `NULL`. |

### 6.2 Why Changing Status Automatically Releases the Reservation
In ANSI SQL and MySQL InnoDB:
- A `UNIQUE` index enforces uniqueness only across non-NULL values.
- Multiple rows can simultaneously contain `NULL` in a unique column without violating the constraint.
- When Module 3.5 updates `colleges.permanently_rejected = TRUE` and `users.email_released = TRUE` and `users.status = 'INACTIVE'`, the virtual expressions evaluate to `NULL` upon row write.
- As an immediate consequence, a new prospective college can register with the exact same college code and administrator email address without encountering SQL Error 1062 (Duplicate entry).

---

## 7. Session Revocation and Security Plan

### 7.1 Immediate Invalidation via `SessionRevocationService`
When permanent rejection or 7-day abandoned cleanup occurs, all active HTTP sessions must be terminated immediately to prevent unauthorized access.
- Module 3.5 calls `sessionRevocationService.revokeAllSessionsForCollege(collegeId)`.
- The service retrieves all users for the college via `userRepository.findByCollegeId(collegeId)` and deletes every session mapped to `AcadlyticUserPrincipal.principalKey(userId)` in Spring Session JDBC.

### 7.2 Defense-in-Depth via `SessionValidationFilter`
Even if an active HTTP session cookie exists in a browser that was in flight during revocation:
1. `SessionValidationFilter` inspects the live database state on every incoming request:
   ```java
   User user = userRepository.findById(principal.getUserId()).get();
   if (user.getStatus() != UserStatus.ACTIVE) {
       invalidateAndClear(session);
       writeError(response, HttpStatus.FORBIDDEN, "AUTH_ACCOUNT_INACTIVE", ...);
       return;
   }
   College college = collegeRepository.findById(user.getCollegeId()).get();
   if (college.isPermanentlyRejected()) {
       invalidateAndClear(session);
       writeError(response, HttpStatus.FORBIDDEN, "REGISTRATION_PERMANENTLY_REJECTED", ...);
       return;
   }
   ```
2. The session is invalidated in-memory, the security context is cleared, and an immediate `403 Forbidden` JSON error envelope is returned.

---

## 8. Audit Event Plan

### 8.1 Required Audit Event Types
`com.acadlytic.modules.auth.entity.AuditEventType` is extended with:
1. `COLLEGE_ACTIVATED`: Emitted upon successful transition of an approved college to `status = ACTIVE`.
2. `COLLEGE_PERMANENTLY_REJECTED`: Emitted upon execution of permanent rejection when the 3rd correction submission is rejected.
3. `COLLEGE_ADMIN_DEACTIVATED`: Emitted when the college administrator account is deactivated and email reservation released during permanent rejection.
4. `ABANDONED_REGISTRATION_ARCHIVED`: Emitted by the 7-day scheduled cleanup worker when unverified and unsubmitted applications are soft-archived.
5. `PERMANENTLY_REJECTED_COLLEGE_ARCHIVED`: Emitted by the 7-day scheduled worker when permanently rejected records reach 7-day retention and `archived_at` is stamped.

### 8.2 Final Audit Event Sequence & Separation of Concerns

To guarantee zero duplicate, contradictory, or misleading audit trails:

1. **Approval & Operational Activation:**
   - **Step 1:** Module 3.4 records `COLLEGE_REGISTRATION_APPROVED` (actor: `SUPER_ADMIN`, outcome: `SUCCESS`, metadata: `{"registrationId": id, "action": "APPROVE"}`). This records the review decision.
   - **Step 2:** Module 3.5 records `COLLEGE_ACTIVATED` (actor: `SUPER_ADMIN`, outcome: `SUCCESS`, metadata: `{"action": "OPERATIONAL_ACTIVATION"}`). This records the operational unlocking of tenant management.
2. **Request Action:**
   - Module 3.4 records `COLLEGE_REGISTRATION_ACTION_REQUIRED` (actor: `SUPER_ADMIN`, outcome: `SUCCESS`, metadata: review notes). No additional audit event needed.
3. **Non-Permanent Rejection ($v_1, v_2, v_3$, `resubmissionCount < 3`):**
   - Module 3.4 records `COLLEGE_REGISTRATION_REJECTED` (actor: `SUPER_ADMIN`, outcome: `SUCCESS`, metadata: rejection reason). No additional audit event needed.
4. **Permanent Rejection ($v_4$, `resubmissionCount == 3`):**
   - **Step 1 (Review Decision):** Module 3.4 records `COLLEGE_REGISTRATION_REJECTED` (recording that the Super Admin rejected revision $v_4$).
   - **Step 2 (Tenant Lifecycle):** Module 3.5 records `COLLEGE_PERMANENTLY_REJECTED` (actor: `SUPER_ADMIN`, outcome: `SUCCESS`, metadata: `{"finalVersion": 4, "resubmissionCount": 3, "reason": rejectionReason}`).
   - **Step 3 (User Account Lifecycle):** Module 3.5 records `COLLEGE_ADMIN_DEACTIVATED` (actor: `SUPER_ADMIN`, target: `COLLEGE_ADMIN`, outcome: `SUCCESS`, metadata: `{"trigger": "PERMANENT_REJECTION", "emailReleased": true}`).
   - *Result:* Preserves clear distinction between the review decision itself, tenant closure, and user deactivation.
5. **Abandoned Registration Cleanup (Scheduled Worker):**
   - Emits **only** `ABANDONED_REGISTRATION_ARCHIVED` (actor: `null`, role: `"SYSTEM"`, target: `COLLEGE_ADMIN`, outcome: `SUCCESS`, metadata: `{"retentionDays": 7, "emailVerified": false, "submittedForReview": false, "filesPurged": count}`).
   - `COLLEGE_ADMIN_DEACTIVATED` is **not** emitted here; `ABANDONED_REGISTRATION_ARCHIVED` serves as the authoritative, self-contained record of automated system cleanup.
6. **Permanently Rejected College Archival (Scheduled Worker):**
   - Emits `PERMANENTLY_REJECTED_COLLEGE_ARCHIVED` (actor: `null`, role: `"SYSTEM"`, outcome: `SUCCESS`, metadata: `{"retentionDays": 7, "permanentlyRejectedAt": timestamp}`).

---

## 9. Outbox Notification Plan

### 9.1 Outbox Notification Specifications

| Event Type / Trigger | Recipient | Subject | Template Key | JSON Payload Fields |
| :--- | :--- | :--- | :--- | :--- |
| **College Approved & Activated** | `adminUser.email` | `Your Acadlytic College Registration has been Approved` | `COLLEGE_REGISTRATION_APPROVED` | `collegeId`, `collegeName`, `collegeCode`, `firstName`, `loginUrl` |
| **Correction Action Required** | `adminUser.email` | `Action Required: Acadlytic College Registration - Correction Needed` | `COLLEGE_REGISTRATION_ACTION_REQUIRED` | `collegeId`, `collegeName`, `versionNumber`, `reviewNotes`, `firstName`, `dashboardUrl` |
| **Non-Permanent Rejection** | `adminUser.email` | `Acadlytic College Registration Status Update - Rejected` | `COLLEGE_REGISTRATION_REJECTED` | `collegeId`, `collegeName`, `versionNumber`, `rejectionReason`, `resubmissionCount`, `remainingResubmissions`, `firstName`, `dashboardUrl` |
| **Permanent Rejection** | `adminUser.email` | `Acadlytic College Registration - Final Decision (Permanently Rejected)` | `COLLEGE_REGISTRATION_PERMANENTLY_REJECTED` | `collegeId`, `collegeName`, `versionNumber`, `rejectionReason`, `firstName`, `supportEmail` |

### 9.2 Enqueue Idempotency Guarantees
How is duplicate notification insertion prevented?
1. **Decision Concurrency Gate:** In `CollegeReviewService.recordDecision`:
   - Enforces pessimistic row lock (`findByIdWithLock(collegeId)`).
   - Validates `expectedVersion == college.getVersion()`.
   - Validates `submittedRevision.getStatus() == CollegeApprovalStatus.PENDING`.
2. **Post-Commit Immutability:** Once a review decision executes, the revision status becomes `APPROVED`, `ACTION_REQUIRED`, or `REJECTED`, and `college.getVersion()` increments.
3. **Replay Rejection:** Any duplicate or replayed HTTP request with the same `expectedVersion` or after commit immediately fails:
   - Fails status check $\to$ `409 Conflict (APPLICATION_NOT_AWAITING_REVIEW)`.
   - Or fails version check $\to$ `409 Conflict (STALE_APPLICATION_VERSION)`.
   Zero duplicate outbox rows can ever be enqueued.
4. **Mutually Exclusive Branching for Rejection:**
   ```java
   if (college.getResubmissionCount() >= 3) {
       // Dispatches ONLY COLLEGE_REGISTRATION_PERMANENTLY_REJECTED
       executePermanentRejection(college, submittedRevision, reason, reviewerId, reviewerRole);
   } else {
       // Dispatches ONLY COLLEGE_REGISTRATION_REJECTED
       enqueueNonPermanentRejection(college, submittedRevision, reason);
   }
   ```
   Under no circumstances can both rejection emails be created.

### 9.3 Outbox Delivery Semantics (At-Least-Once Delivery)
- **Execution Lifecycle:**
  `OutboxEmailWorker` polls pending outbox emails in batches using `SELECT ... FOR UPDATE SKIP LOCKED` outside the database transaction.
  1. Sets outbox status to `PROCESSING` with `locked_at = now`.
  2. Dispatches email via `emailSender.send(...)`.
  3. Upon success, calls `claimService.markSentAndScrub(email.getId(), now)`.
- **Failure Mode & At-Least-Once Proof:**
  If the SMTP server accepts the message, but the worker terminates, crashes, or loses database connectivity before `markSentAndScrub` commits:
  - The outbox record remains in `PROCESSING`.
  - After 5 minutes (`app.outbox.stale-processing-minutes: 5`), `claimService.recoverStaleProcessing(now)` detects the stale lock and resets status to `PENDING`.
  - The subsequent worker polling cycle claims the email and dispatches it again.
- **Empirical Semantic Guarantee:**
  The system provides **at-least-once delivery**. Plain SMTP does not support client idempotency headers. Exactly-once delivery cannot be guaranteed over raw SMTP. Commercial provider idempotency headers (`ADR-15b`) remain deferred to Phase 14.

---

## 10. Seven-Day Archival and Abandoned Cleanup Plan

### 10.1 Authoritative Abandoned Registration Cleanup Eligibility Predicate
Inspection of `docs/08-task-breakdown/roadmap.md` (line 48), `docs/03-prd/mvp-scope.md` (line 33), `docs/09-development/feature-specifications/authentication.md` (lines 260, 281), and `ADR-13` establishes the exact approved eligibility criteria:

> **Approved Abandonment Rule:** An application is eligible for 7-day automated abandonment cleanup if and only if **both** email is unverified (`users.email_verified_at IS NULL`) **and** the initial registration revision has never been submitted (`college_registrations.submitted_for_review_at IS NULL`).

#### Exact Candidate Selection Predicate (JPQL):
```sql
SELECT c FROM College c, CollegeRegistration cr, User u
WHERE c.currentRegistrationId = cr.id
  AND u.collegeId = c.id
  AND u.role = 'COLLEGE_ADMIN'
  AND u.emailVerifiedAt IS NULL
  AND cr.submittedForReviewAt IS NULL
  AND cr.versionNumber = 1
  AND c.approvalStatus = 'PENDING'
  AND c.status = 'PENDING_VERIFICATION'
  AND c.permanentlyRejected = FALSE
  AND c.archivedAt IS NULL
  AND c.createdAt <= :cutoff
```

#### Field-by-Field Guarantee:
1. `c.currentRegistrationId = cr.id` & `cr.versionNumber = 1`: Preserves current registration pointer and restricts scope to initial unsubmitted draft.
2. `u.emailVerifiedAt IS NULL`: Enforces unverified administrator email requirement.
3. `cr.submittedForReviewAt IS NULL`: Enforces that revision $v_1$ was never submitted.
4. `c.approvalStatus = 'PENDING'` & `c.status = 'PENDING_VERIFICATION'`: Restricts to pre-review state.
5. `c.permanentlyRejected = FALSE`: Excludes permanently rejected colleges (handled by separate archival process).
6. `c.archivedAt IS NULL`: Excludes already archived records.
7. `c.createdAt <= :cutoff`: Strict 7-day retention boundary (`Instant.now().minus(7, ChronoUnit.DAYS)`).

### 10.2 Exclusion Invariants (Must NEVER Be Selected)

| Application Lifecycle State | `email_verified_at` | `submitted_for_review_at` | `approval_status` | Cleanup Eligible? | Reason for Exclusion |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Unverified & Unsubmitted ($\ge 7$d)** | `NULL` | `NULL` | `PENDING` | **YES** | Meets all approved abandonment criteria. |
| **Verified but Unsubmitted ($\ge 7$d)** | `NOT NULL` | `NULL` | `PENDING` | **NO** | Affirmative email verification step taken; actively assembling application. |
| **Submitted Awaiting Review ($\ge 7$d)** | `NOT NULL` | `NOT NULL` | `PENDING` | **NO** | In Super Admin review queue; freeze guarantee protected. |
| **Action Required ($\ge 7$d)** | `NOT NULL` | `NOT NULL` | `ACTION_REQUIRED` | **NO** | Allowed correction period in progress. |
| **Non-Permanent Rejected ($\ge 7$d)** | `NOT NULL` | `NOT NULL` | `REJECTED` | **NO** | Resubmission allowance (up to 3) active. |
| **Approved / Active College** | `NOT NULL` | `NOT NULL` | `APPROVED` | **NO** | Operational tenant; management unlocked. |
| **Permanently Rejected College** | Any | Any | `REJECTED` | **NO** | Handled by Process 2 (7-day retention archival). |
| **Already Archived College** | Any | Any | Any | **NO** | `archived_at IS NOT NULL`. |

### 10.3 Process 2: Permanently Rejected College Archival Predicate
```sql
SELECT c FROM College c
WHERE c.permanentlyRejected = TRUE
  AND c.archivedAt IS NULL
  AND c.updatedAt <= :cutoff
```
- Targets colleges permanently rejected $\ge 7$ days ago.
- Stamping `archived_at = now` closes the retention window.
- Historical revision rows, metadata, and audit logs are permanently preserved.

### 10.4 Durable Physical Document Cleanup Strategy

#### The Failure Mode Addressed
If a cleanup job:
1. Commits `colleges.archived_at = now` and `colleges.status = INACTIVE`.
2. Attempts physical file deletion (`documentStorageService.delete`), which fails due to an I/O glitch, file lock, or JVM crash.
3. On the next scheduled run, the primary query excludes the college because `archived_at IS NOT NULL`.
4. The physical files on disk or S3 remain orphaned indefinitely.

#### Two-Tiered Durable Deletion & Retry Architecture

```
[ Scheduled Daily Cleanup Job ]
               │
               ├─────────────────────────────────────────────┐
               ▼                                             ▼
  [ Tier 1: Primary Archival & Deletion ]        [ Tier 2: Sweeper Retry Pass ]
  For each eligible candidate college:           Query: Draft docs of colleges
  1. Retrieve draft document storage_keys.              archived within last 30d
  2. For each key:                               For each document:
     - documentStorageService.delete(key)        - Check if file exists on storage
       (deleteIfExists is idempotent)            - If exists: retry delete(key)
  3. Inside DB Tx:                               - If missing: no-op (already purged)
     - Set colleges.archived_at = NOW
     - Set colleges.status = INACTIVE
     - Set users.status = INACTIVE
     - Set users.email_released = TRUE
     - Record ABANDONED_REGISTRATION_ARCHIVED
  4. Commit DB Tx.
```

#### Detailed Execution Specifications:
1. **Tier 1 (Execution Order & Transaction Boundary):**
   - Physical deletion is attempted **before** database archival commit for each candidate college.
   - If physical deletion throws an unhandled I/O exception, the college's database transaction is not committed; `archived_at` remains `NULL`.
   - On the next scheduled run, the candidate query re-selects the college and retries.
   - If physical deletion succeeds, the database transaction commits `archived_at = now`.
   - If physical deletion succeeds but the database commit fails (e.g. database timeout), the college remains unarchived. On the next run, `LocalFileSystemDocumentStorageService.delete` invokes `Files.deleteIfExists`, which returns `false` gracefully without throwing `NoSuchFileException`. The database transaction then commits cleanly.
2. **Tier 2 (Durable Sweeper Retry Pass — Zero Migration):**
   - To catch any edge cases (e.g. abrupt power failure between file deletion and database commit, or transient network timeouts), the scheduler runs a secondary sweeper:
     ```sql
     SELECT d FROM CollegeRegistrationDocument d, CollegeRegistration cr, College c
     WHERE d.registrationId = cr.id
       AND cr.collegeId = c.id
       AND cr.submittedForReviewAt IS NULL
       AND c.archivedAt IS NOT NULL
       AND c.archivedAt >= :retryWindowCutoff
     ```
   - `:retryWindowCutoff` is set to `Instant.now().minus(30, ChronoUnit.DAYS)`, keeping the query strictly bounded.
   - For each document, it checks storage: if the file still exists, it retries `documentStorageService.delete(d.getStorageKey())`.
   - If the file is already deleted, it is a microsecond no-op.
3. **Evaluation of Schema Migration Alternative:**
   - *Alternative Considered:* Adding `file_purged_at TIMESTAMP NULL` to `college_registration_documents`.
   - *Why Zero-Migration is Preferred:* The existing database relationships (`c.archived_at IS NOT NULL AND cr.submitted_for_review_at IS NULL`) fully support durable tracking. Because unsubmitted abandoned registrations per month are low in volume, a 30-day indexed timestamp query on `colleges.archived_at` executes in single-digit milliseconds without schema migration overhead.
   - *Minimum Required Migration (If User Desires Persistent Column):*
     `ALTER TABLE college_registration_documents ADD COLUMN file_purged_at TIMESTAMP NULL;`
     However, per the proven Tier 2 sweeper, **zero migration is completely sufficient and fully durable**.

---

## 11. API, Service, Repository & Scheduler Design

### 11.1 Component Responsibilities & Relationships

```
                                [ Super Admin HTTP Request ]
                                              │
                                              ▼
                             CollegeReviewController (Mod 3.4)
                                              │
                                              ▼
                              CollegeReviewService (Mod 3.4)
                                (Under pessimistic lock)
                                              │
                          ┌───────────────────┴───────────────────┐
                          ▼                                       ▼
                     [ APPROVE ]                             [ REJECT ]
                          │                                       │
                          ▼                                       ▼
              CollegeLifecycleService                 CollegeLifecycleService
               .activateCollege(...)                 .evaluateRejection(...)
                          │                                       │
              ┌───────────┴───────────┐               ┌───────────┴───────────┐
              ▼                       ▼               ▼                       ▼
      college.status=ACTIVE   Outbox: APPROVED   resub_count < 3      resub_count == 3
      Audit: ACTIVATED                           Outbox: REJECTED     .executePermanentRejection(...)
                                                                              │
                                                              ┌───────────────┴───────────────┐
                                                              ▼                               ▼
                                                      college.perm_reject=T          Session Revocation
                                                      user.email_released=T          Outbox: PERM_REJECT
                                                      user.status=INACTIVE           Audit: PERM_REJECT
```

### 11.2 Component Specifications

#### 1. `CollegeLifecycleService` (`com.acadlytic.modules.colleges.service`)
- `activateApprovedCollege(College college, CollegeRegistration registration, Long reviewerUserId, Role reviewerRole)`:
  - Validates `college.getApprovalStatus() == CollegeApprovalStatus.APPROVED`.
  - Sets `college.setStatus(CollegeStatus.ACTIVE)`.
  - Enqueues `COLLEGE_REGISTRATION_APPROVED` outbox email.
  - Records `COLLEGE_ACTIVATED` audit event.
- `handleReviewDecisionLifecycle(College college, CollegeRegistration registration, ReviewDecisionAction action, String notesOrReason, Long reviewerUserId, Role reviewerRole)`:
  - If `action == APPROVE`: calls `activateApprovedCollege(...)`.
  - If `action == REQUEST_ACTION`: enqueues `COLLEGE_REGISTRATION_ACTION_REQUIRED` outbox email.
  - If `action == REJECT`:
    - If `college.getResubmissionCount() >= 3`: calls `executePermanentRejection(...)`.
    - Else: enqueues `COLLEGE_REGISTRATION_REJECTED` outbox email with remaining resubmissions.
- `executePermanentRejection(College college, CollegeRegistration registration, String rejectionReason, Long reviewerUserId, Role reviewerRole)`:
  - Sets `registration.setPermanentRejection(true)`.
  - Sets `college.setPermanentlyRejected(true)`, `college.setStatus(CollegeStatus.INACTIVE)`, `college.setRejectionReason(rejectionReason)`.
  - Sets all college users to `status = INACTIVE` and `email_released = true`.
  - Calls `sessionRevocationService.revokeAllSessionsForCollege(college.getId())`.
  - Enqueues `COLLEGE_REGISTRATION_PERMANENTLY_REJECTED` outbox email.
  - Records `COLLEGE_PERMANENTLY_REJECTED` and `COLLEGE_ADMIN_DEACTIVATED` audit events.
- `cleanupAbandonedRegistrations(Instant cutoff, int batchSize)`:
  - Executes Tier 1 and Tier 2 durable cleanup and draft document file deletion for abandoned applications.
- `archivePermanentlyRejectedColleges(Instant cutoff, int batchSize)`:
  - Executes batch soft-archival for 7-day permanently rejected colleges.

#### 2. `CollegeCleanupScheduler` (`com.acadlytic.modules.colleges.scheduler`)
- `@Component` with `@Scheduled(cron = "${app.cleanup.cron:0 0 2 * * *}")` (2:00 AM daily UTC).
- Invokes `collegeLifecycleService.cleanupAbandonedRegistrations(...)` and `collegeLifecycleService.archivePermanentlyRejectedColleges(...)`.

#### 3. Repository Extensions (`CollegeRepository.java`)
```java
@Query("SELECT c FROM College c, CollegeRegistration cr, User u " +
       "WHERE c.currentRegistrationId = cr.id " +
       "AND u.collegeId = c.id " +
       "AND u.role = 'COLLEGE_ADMIN' " +
       "AND u.emailVerifiedAt IS NULL " +
       "AND cr.submittedForReviewAt IS NULL " +
       "AND cr.versionNumber = 1 " +
       "AND c.approvalStatus = 'PENDING' " +
       "AND c.status = 'PENDING_VERIFICATION' " +
       "AND c.permanentlyRejected = FALSE " +
       "AND c.archivedAt IS NULL " +
       "AND c.createdAt <= :cutoff")
List<College> findAbandonedRegistrations(@Param("cutoff") Instant cutoff, Pageable pageable);

@Query("SELECT c FROM College c " +
       "WHERE c.permanentlyRejected = TRUE " +
       "AND c.archivedAt IS NULL " +
       "AND c.updatedAt <= :cutoff")
List<College> findPermanentlyRejectedForArchival(@Param("cutoff") Instant cutoff, Pageable pageable);
```

#### 4. Document Repository Sweeper Extension (`CollegeRegistrationDocumentRepository.java`)
```java
@Query("SELECT d FROM CollegeRegistrationDocument d, CollegeRegistration cr, College c " +
       "WHERE d.registrationId = cr.id " +
       "AND cr.collegeId = c.id " +
       "AND cr.submittedForReviewAt IS NULL " +
       "AND c.archivedAt IS NOT NULL " +
       "AND c.archivedAt >= :retryCutoff")
List<CollegeRegistrationDocument> findUnsubmittedDraftDocumentsForArchivedColleges(@Param("retryCutoff") Instant retryCutoff, Pageable pageable);
```

---

## 12. Database Migration Assessment

### Migration Verdict: ZERO MIGRATIONS REQUIRED
An exhaustive check of the existing Flyway schema (`V1`, `V2`, `V3`, `V4`) confirms that:
1. `colleges.status`: Enum CHECK constraint `chk_colleges_status` already accepts `'PENDING_VERIFICATION'`, `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'`.
2. `colleges.permanently_rejected`: Boolean column exists.
3. `colleges.archived_at`: Timestamp column exists.
4. `colleges.active_college_code`: Virtual generated column exists with `UNIQUE` constraint.
5. `users.email_released`: Boolean column exists.
6. `users.active_email`: Virtual generated column exists with `UNIQUE` constraint.
7. `users.active_college_admin_college_id`: Virtual generated column exists with `UNIQUE` constraint.
8. `college_registrations.is_permanent_rejection`: Boolean column exists.
9. `audit_events.event_type`: Column is `VARCHAR(64)`, easily accommodating the 5 new enum values without DDL changes.
10. `outbox_emails`: Table exists with flexible `VARCHAR(64)` event and template types.

**Conclusion:** Flyway schema V4 is 100% complete and fully sufficient. No Flyway V5 migration is required.

---

## 13. Transaction Boundaries and Concurrency Strategy

1. **Atomic Decision & Lifecycle Execution:**
   - In `CollegeReviewService.recordDecision`, the entire workflow (pessimistic lock acquisition $\to$ revision mutation $\to$ college mutation $\to$ lifecycle activation or permanent rejection $\to$ user deactivation $\to$ session revocation $\to$ outbox enqueue $\to$ audit event recording) runs within the same `@Transactional(propagation = Propagation.REQUIRED)` boundary.
   - If any step throws an exception, the entire transaction rolls back via Spring Transaction Manager.
2. **Pessimistic Locking:**
   - Serialized via `collegeRepository.findByIdWithLock(collegeId)` with a 3000ms lock timeout. Prevents race conditions between concurrent reviews, submissions, and scheduled cleanup.
3. **Optimistic Locking:**
   - Validates `college.getVersion()` against `expectedVersion` before mutating state.
4. **Outbox Asynchrony:**
   - Outbox rows are inserted transactionally; physical email dispatch occurs asynchronously via `OutboxEmailWorker` with `FOR UPDATE SKIP LOCKED`, completely outside the business transaction.

---

## 14. Detailed Testcontainers Integration and Unit Test Plan

All tests will run against real MySQL 8.0.36 via Testcontainers in Docker Desktop.

### 14.1 Unit Test Suites
1. **`CollegeLifecycleServiceUnitTest` (16 Tests):**
   - `activateCollege_valid_setsStatusActiveAndEnqueuesOutbox`: Verifies college status becomes `ACTIVE`, approval email enqueued, and `COLLEGE_ACTIVATED` audit emitted.
   - `activateCollege_nonApprovedCollege_throwsException`: Verifies activating a non-approved college throws `IllegalStateException`.
   - `handleDecision_approve_triggersActivation`: Verifies delegation on `APPROVE`.
   - `handleDecision_requestAction_enqueuesActionRequiredOutbox`: Verifies outbox email created with review notes.
   - `handleDecision_rejectUnderThreeResubmissions_enqueuesNonPermanentOutbox`: Verifies non-permanent rejection notification with remaining resubmissions.
   - `handleDecision_rejectThirdResubmission_triggersPermanentRejection`: Verifies permanent rejection triggered when `resubmissionCount == 3`.
   - `executePermanentRejection_valid_mutatesEntitiesAndRevokesSessions`: Verifies `permanently_rejected = true`, `college.status = INACTIVE`, `user.status = INACTIVE`, `user.emailReleased = true`, `revokeAllSessionsForCollege` called.
   - `executePermanentRejection_enqueuesPermanentRejectionOutbox_andNotNonPermanent`: Verifies only permanent email is enqueued.
   - `cleanupAbandoned_cutoffCalculation_selectsOnlyEligibleRegistrations`: Verifies cutoff date arithmetic.
   - `cleanupAbandoned_purgesDraftPhysicalFiles`: Verifies `documentStorageService.delete` called for each draft file.
   - `cleanupAbandoned_missingFile_handlesGracefully`: Verifies no error when file is already missing.
   - `archiveRejected_setsArchivedAt`: Verifies stamping `archived_at` on eligible colleges.

2. **`CollegeCleanupSchedulerUnitTest` (4 Tests):**
   - `pollCleanup_invokesBothCleanupProcesses`: Verifies calls to abandoned cleanup and rejected archival.
   - `pollCleanup_handlesExceptionsGracefully`: Verifies scheduler log-and-continue behavior on unexpected failures.

### 14.2 Integration Test Suites
**`CollegeLifecycleIntegrationTest` (18 Tests on Testcontainers MySQL 8.0.36):**
1. `approval_operationalActivation_transitionsStatusToActive_andUnlocksAcademicAccess`: Seeds pending college, executes `APPROVE`, verifies `colleges.status = ACTIVE`, and asserts `collegeAccessGuard.requireApprovedAndActiveCollege` passes.
2. `academicAccess_beforeApproval_failsWithCollegeNotApproved`: Asserts `requireApprovedAndActiveCollege` throws 403 `COLLEGE_NOT_APPROVED` when `approval_status = PENDING`.
3. `rejection_firstAndSecondResubmission_remainsNonPermanent`: Verifies rejecting $v_1$ (`resubmissionCount = 0`) and $v_2$ (`resubmissionCount = 1`) preserves `permanently_rejected = false` and keeps user active.
4. `rejection_thirdResubmission_triggersPermanentRejection`: Seeds college with $v_4$ (`resubmissionCount = 3`), executes `REJECT`, verifies:
   - `college.permanently_rejected = true`
   - `college.status = INACTIVE`
   - `user.status = INACTIVE`
   - `user.email_released = true`
   - `cr.is_permanent_rejection = true`
5. `fourthCorrectionDraft_remainsBlockedAfterPermanentRejection`: Asserts `createCorrectionDraft()` throws 400 `MAX_RESUBMISSION_LIMIT_EXCEEDED` on permanently rejected college.
6. `reservationRelease_permanentRejection_allowsReRegistrationWithSameCodeAndEmail`:
   - Permanently rejects College A with code `"COL001"` and email `"admin@col001.edu"`.
   - Verifies raw MySQL virtual columns `active_college_code` and `active_email` are `NULL`.
   - Successfully executes `POST /api/v1/college-registrations` for College B using code `"COL001"` and email `"admin@col001.edu"`, proving unique reservation release.
7. `sessionRevocation_permanentRejection_invalidatesActiveSessions`:
   - Creates authenticated session for college admin.
   - Triggers permanent rejection.
   - Verifies Spring Session JDBC row deleted and subsequent HTTP request returns 403 `REGISTRATION_PERMANENTLY_REJECTED`.
8. `transactionRollback_outboxFailure_rollsBackActivationAndStateChanges`:
   - Injects failure during outbox enqueueing.
   - Verifies raw JDBC check confirms `colleges.status` remains `PENDING_VERIFICATION` and zero audit events persisted.
9. `outboxNotification_approve_enqueuesValidOutboxEmail`: Asserts `outbox_emails` table contains `COLLEGE_REGISTRATION_APPROVED` job with correct JSON payload.
10. `outboxNotification_permanentReject_enqueuesOnlyPermanentRejectionEmail`: Asserts exactly 1 outbox email created (`COLLEGE_REGISTRATION_PERMANENTLY_REJECTED`), ruling out duplicate non-permanent email.
11. `cleanup_abandonedRegistration_unverifiedAndUnsubmittedOlderThanSevenDays_softArchivesAndReleasesReservations`:
    - Seeds 8-day-old registration with `email_verified_at = null` and `submitted_for_review_at = null`.
    - Runs cleanup worker.
    - Verifies `archived_at` stamped, `users.email_released = true`, physical file deleted from storage.
12. `cleanup_verifiedButUnsubmitted_isNeverTouched`:
    - Seeds 8-day-old registration with `email_verified_at != null` and `submitted_for_review_at = null`.
    - Runs cleanup worker.
    - Verifies record remains untouched (`archived_at IS NULL`).
13. `cleanup_recentlyCreatedRegistration_youngerThanSevenDays_isNotTouched`:
    - Seeds 2-day-old unverified unsubmitted draft.
    - Runs cleanup worker.
    - Verifies record remains untouched (`archived_at IS NULL`).
14. `cleanup_submittedAndActionRequiredApplications_areNeverTouched`:
    - Seeds 10-day-old application in review queue (`submitted_for_review_at != null`) and 10-day-old `ACTION_REQUIRED` application.
    - Runs cleanup worker.
    - Verifies neither record is archived or modified.
15. `cleanup_permanentlyRejectedCollege_olderThanSevenDays_stampsArchivedAt`:
    - Seeds 8-day-old permanently rejected college.
    - Runs cleanup worker.
    - Verifies `archived_at` stamped.
16. `cleanup_durablePhysicalSweeper_retriesPreviouslyFailedDeletions`:
    - Seeds an archived college whose physical draft file still exists on disk.
    - Runs secondary sweeper pass.
    - Verifies file is detected and deleted, proving durable sweeper retry.
17. `concurrentReviewAndCleanup_serializedViaPessimisticLock`: Verifies concurrent operations on same college serialize cleanly without deadlocks.
18. `sessionValidationFilter_permanentlyRejectedCollege_returns403`: Verifies live filter blocks access.

---

## 15. Existing Test Baseline and Regression Strategy

- **Baseline Test Suite:** **196 / 196 tests currently passing** on Testcontainers MySQL 8.0.36 (Java 21 / Spring Boot 3.3.4 / Docker Desktop):
  - Phase 01 / Phase 02 Auth baseline: 49 tests.
  - Module 3.1A (Registration Foundation): 18 tests.
  - Module 3.2 (Email Verification Lifecycle): 30 tests.
  - Module 3.3 (Restricted Dashboard & Documents): 45 tests.
  - Module 3.4 (Super Admin Review Queue & Decisions): 54 tests.
- **Regression Guarantee:**
  - Running `mvn -f backend/pom.xml test` will maintain 100% pass rate across the 196 existing regression tests while validating the new Module 3.5 test suite.
  - Target total tests after Module 3.5: $\ge 234$ tests (196 baseline + ~38 new Module 3.5 tests).

---

## 16. Exact Files Expected to Be Created or Modified

### 16.1 Production Files to Create (3 Files)
1. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeLifecycleService.java`: Core lifecycle coordination (activation, rejection, outbox dispatch, cleanup).
2. `backend/src/main/java/com/acadlytic/modules/colleges/scheduler/CollegeCleanupScheduler.java`: Daily scheduled job for 7-day archival and abandoned cleanup.
3. `backend/src/main/java/com/acadlytic/config/CleanupProperties.java`: Configuration bean for cleanup retention periods and batch sizes (`app.cleanup.*`).

### 16.2 Production Files to Modify (6 Files)
1. `backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java`: Add 5 lifecycle audit event enums (`COLLEGE_ACTIVATED`, `COLLEGE_PERMANENTLY_REJECTED`, `COLLEGE_ADMIN_DEACTIVATED`, `ABANDONED_REGISTRATION_ARCHIVED`, `PERMANENTLY_REJECTED_COLLEGE_ARCHIVED`).
2. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java`: Integrate `CollegeLifecycleService` inside `recordDecision` to trigger activation upon `APPROVE`, rejection notifications, and permanent rejection when `resubmissionCount >= 3`.
3. `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRepository.java`: Add queries for abandoned registration retrieval and permanently rejected archival retrieval.
4. `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java`: Add query for draft documents of archived colleges (Tier 2 durable sweeper).
5. `backend/src/main/java/com/acadlytic/modules/outbox/service/EmailTemplateRenderer.java`: Add template bodies for the 4 registration review email notifications.
6. `backend/src/main/resources/application.yml`: Add `app.cleanup` configuration section.

### 16.3 Test Files to Create (3 Files)
1. `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeLifecycleServiceUnitTest.java`: Business logic unit tests.
2. `backend/src/test/java/com/acadlytic/modules/colleges/scheduler/CollegeCleanupSchedulerUnitTest.java`: Scheduler unit tests.
3. `backend/src/test/java/com/acadlytic/modules/colleges/CollegeLifecycleIntegrationTest.java`: Comprehensive MySQL Testcontainers integration tests.

### 16.4 Total File Accounting
- **Files Created:** 6 files (3 production, 3 test).
- **Files Modified:** 6 production files.
- **Total Files Affected:** 12 files.
- **Database Migrations:** 0.
- **Frontend Files:** 0 (deferred).

---

## 17. Module 3.5 Exclusions and Explicit Module 3.4 Boundary

To prevent scope creep and preserve established architectural boundaries:
- **Module 3.4 Scope Preserved:** Module 3.4's review queue, detail inspection, secure document streaming, and initial review decision recording endpoints remain 100% complete and approved. Module 3.5 integrates with `CollegeReviewService` as an internal lifecycle handler without altering Module 3.4's external API contracts or query guarantees.
- **No Early Permanent Rejection:** Reviewers cannot arbitrarily trigger permanent rejection on $v_1, v_2, v_3$. Permanent rejection is strictly governed by the approved 3-resubmission boundary ($v_4$ rejected).
- **No Manual Account Activation:** Approval automatically transitions `colleges.status = ACTIVE`. No separate Super Admin manual account activation endpoint is created.
- **Frontend Excluded:** All frontend implementation (Module 3.1B onward) remains deferred until all Phase 03 backend modules are complete.
- **Phase 04 Boundary Preserved:** Academic tenant management, departmental user provisioning, and full college profile editing belong to Phase 04.

---

## 18. Risks, Dependencies and Unresolved Decisions

### 18.1 Technical Risks & Mitigations
1. **Risk:** Physical file deletion during abandoned cleanup could leave orphaned files on storage if deletion fails after database commit.
   - *Mitigation:* Two-tiered durable cleanup architecture: Tier 1 executes deletion before database commit; Tier 2 runs a bounded secondary sweeper scanning archived drafts within a 30-day window, handling missing files gracefully via `Files.deleteIfExists`.
2. **Risk:** Email delivery could be attempted more than once during network disconnects.
   - *Mitigation:* Explicitly acknowledged at-least-once delivery semantics in technical documentation. Enqueue idempotency guarantees exactly one outbox row per decision.
3. **Risk:** Long-running cleanup queries could block concurrent registration submissions.
   - *Mitigation:* Query in small batches (e.g. 50 items) with indexed timestamp checks (`c.createdAt <= :cutoff`), processing each college in its own isolated transaction.

### 18.2 Resolved Technical Decisions
- **Decision:** Should operational activation be an internal lifecycle transition upon approval or a separate Super Admin endpoint?
  - *Resolution:* Internal lifecycle transition upon approval. Master Context §5 explicitly states: *"The same account and dashboard are unlocked after approval. Do not create a separate account activation workflow."*
- **Decision:** Does non-permanent rejection send an email?
  - *Resolution:* Yes. Enqueues `COLLEGE_REGISTRATION_REJECTED` detailing the remaining resubmission allowance.
- **Decision:** Does `REQUEST_ACTION` send an email?
  - *Resolution:* Yes. Enqueues `COLLEGE_REGISTRATION_ACTION_REQUIRED` detailing reviewer notes.
- **Decision:** What is the exact predicate for abandoned registration cleanup?
  - *Resolution:* Both email unverified (`u.emailVerifiedAt IS NULL`) AND initial registration unsubmitted (`cr.submittedForReviewAt IS NULL`) at age $\ge 7$ days. Verified-but-unsubmitted accounts are protected and excluded.

---

## 19. Recommended Implementation Sequence

Upon receiving explicit user approval for this planning report v1.1, implementation will proceed in the following ordered phases:

1. **Phase 1: Domain Entities & Enums (Readiness):**
   - Add new audit event types in `AuditEventType.java`.
   - Add `CleanupProperties.java` and `application.yml` cleanup settings.
2. **Phase 2: Email Template Rendering:**
   - Extend `EmailTemplateRenderer.java` with templates for approval, action required, rejection, and permanent rejection.
3. **Phase 3: Repository Queries:**
   - Add `findAbandonedRegistrations` and `findPermanentlyRejectedForArchival` to `CollegeRepository.java`.
   - Add `findUnsubmittedDraftDocumentsForArchivedColleges` to `CollegeRegistrationDocumentRepository.java`.
4. **Phase 4: Core Lifecycle Service:**
   - Implement `CollegeLifecycleService.java` orchestrating activation, permanent rejection, outbox enqueueing, session revocation, and two-tiered cleanup.
5. **Phase 5: Review Service Integration:**
   - Wire `CollegeLifecycleService` into `CollegeReviewService.recordDecision`.
6. **Phase 6: Cleanup Scheduler:**
   - Implement `CollegeCleanupScheduler.java`.
7. **Phase 7: Unit Testing:**
   - Implement `CollegeLifecycleServiceUnitTest.java` and `CollegeCleanupSchedulerUnitTest.java`.
8. **Phase 8: Testcontainers Integration Testing & Verification:**
   - Implement `CollegeLifecycleIntegrationTest.java` running against real MySQL 8.0.36.
   - Run full regression suite (`mvn test`) ensuring $\ge 234 / 234$ tests pass with 0 failures, 0 errors, 0 skipped.

---

## 20. Final Approval Checklist

Before requesting implementation authorization, verify:
- [x] Master Context is treated as authoritative.
- [x] Module 3.4 scope is preserved intact without regression.
- [x] College operational activation unlocks academic APIs via `CollegeStatus.ACTIVE` and `CollegeAccessGuard`.
- [x] 3-resubmission boundary is proved ($v_1 \to v_4$; $v_4$ rejection triggers permanent rejection).
- [x] 4th correction draft remains blocked by Module 3.3 rules.
- [x] Code, email, and admin-slot reservation release is proven via MySQL virtual columns.
- [x] Active sessions are revoked via `SessionRevocationService.revokeAllSessionsForCollege`.
- [x] Outbox notifications cover all 4 lifecycle transitions with at-least-once delivery semantics accurately acknowledged.
- [x] Enqueue idempotency is guaranteed under pessimistic and optimistic lock gates.
- [x] 7-day cleanup rules require both unverified email and unsubmitted initial application, protecting verified-but-unsubmitted accounts.
- [x] Durable physical document cleanup incorporates Tier 1 pre-commit deletion and Tier 2 bounded sweeper retry.
- [x] Audit event sequence cleanly separates reviewer decisions from tenant lifecycle and automated system cleanup.
- [x] Zero database migrations required.
- [x] Frontend remains deferred following backend-first strategy.
- [x] No source code, tests, migrations, frontend or Master Context files were changed during this planning reconciliation task.
