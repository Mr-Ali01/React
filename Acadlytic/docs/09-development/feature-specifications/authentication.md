# Authentication & Authorization Feature Specification

**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Module:** Authentication & Authorization  
**Document:** Feature Specification  
**Version:** 2.0  
**Status:** Approved / Implementation Ready  
**Last Updated:** 2026-11-18 (Architecture Decision Closure — Stateful Sessions, CSRF, Pre-Queue Onboarding, Single-Admin `VIRTUAL` Index & Security Baseline Finalized)

---

# 1. Purpose

The Authentication & Authorization module provides secure identity verification, session management, and multi-tenant access control for Acadlytic.

Acadlytic is a multi-tenant Software-as-a-Service (SaaS) platform:
- **`SUPER_ADMIN`**: The owner and operator of the Acadlytic platform.
- **College**: A customer and tenant organization that subscribes to or registers for Acadlytic.
- **`COLLEGE_ADMIN`**: The primary administrative account belonging to an approved and activated college customer/tenant (MVP enforces exactly one active `COLLEGE_ADMIN` per college, while remaining extensible for multiple admins without redesign).
- **`ACADEMIC_STAFF`**: Future departmental role (Post-MVP).
- **`STUDENT`**: Future student self-service role (Post-MVP).
- **`BRANCH_ADMIN`**: Future branch/campus administration role (Post-MVP; no branch tables or branch functionality in MVP).

The module is responsible for:

- Processing public college registration applications (IP rate-limited `5/hour` + configurable prod CAPTCHA), establishing a restricted college tenant context (`approval_status = PENDING`, `status = PENDING_VERIFICATION`), application `v1` (`submitted_for_review_at = NULL`), and proposed `COLLEGE_ADMIN` credentials (`users.status = ACTIVE`, `email_verified_at = NULL`) without public multipart document upload.
- Allowing newly registered colleges to log in immediately to a **restricted College Dashboard** to verify email (`48-hour` single-use DB-hashed token) and upload required verification documents (PDF/JPEG/PNG, max `10 MB` each, max `5` docs/revision) before clicking **Submit for Review** into the frozen `PENDING` review queue.
- Enabling platform administrators (`SUPER_ADMIN` — provisioned via one-time env-driven startup bootstrap) to inspect verified applications and documents using `expectedVersion` (`409 Conflict` on stale version) and execute **Approve** (`APPROVED`), **Request Action** (`ACTION_REQUIRED`), **Reject** (`REJECTED`), or **Permanent Reject** decisions without manually creating `COLLEGE_ADMIN` credentials.
- Supporting document correction and bounded versioned resubmission (`ACTION_REQUIRED` up to safety cap `10`; `REJECTED` up to `3` revised applications after initial submission) while preserving all prior application versions, immutable documents, review decisions, and audit history.
- Unlocking full college management features on the existing `COLLEGE_ADMIN` account and dashboard upon approval (preserving exact `user_id` and `college_id`, with zero separate account or dashboard creation) and dispatching emails via the transactional outbox.
- Authenticating users via **stateful HTTP-only session cookies (Spring Session JDBC + MySQL, no JWT)** protected by Spring Security 6 SPA CSRF.
- Identifying the user's role, college tenant context (`college_id`), `emailVerified`, `submittedForReview`, and authoritative college approval/operational status on every request.
- Protecting college and student academic records across tenant boundaries, pre-approval states, and suspended college states.
- Managing password policy (BCrypt work factor `12`, `12–128` chars, common/compromised rejection), password change/reset, email change with re-verification, brute-force lockout (`5` failures &rarr; `15` min), and server-side session revocation.
- Recording immutable security audit events (strictly excluding passwords, session IDs, reset tokens, and verification tokens).
- Providing an extensible role foundation that initially activates two MVP roles while accommodating future role expansion.

Authentication is the foundational prerequisite for all protected Acadlytic operations.

---

# 2. Scope

## 2.1 MVP Scope (Two Active Roles & Stateful Restricted-Dashboard Onboarding)

The MVP authentication system supports **exactly two active user roles**:
1. `SUPER_ADMIN` (Platform Operator & Platform Owner)
2. `COLLEGE_ADMIN` (College Administrator bound to a College Tenant — restricted onboarding dashboard until `APPROVED`, full management dashboard once `APPROVED` & `ACTIVE`)

Key MVP capabilities:
- **Stateful HTTP-Only Session Authentication (No JWT):** Spring Session JDBC persisted in MySQL (`30-min` idle timeout, `12-hour` absolute lifetime, multi-device allowed, session ID rotation on login & privilege changes; `__Host-ACADLYTIC_SID` in prod with `HttpOnly`, `Secure=true`, `SameSite=Lax`, `Path=/`, no `Domain`).
- **SPA CSRF Protection:** `CookieCsrfTokenRepository.withHttpOnlyFalse()`, `SpaCsrfTokenRequestHandler`, `GET /api/v1/auth/csrf`, `CsrfCookieFilter`, enforced on login, logout, registration, and all state-changing calls (`403 CSRF_TOKEN_INVALID`); Vite dev proxy for same-origin Axios integration.
- **Public College Registration:** Rate-limited (`5/IP/hour` + configurable prod CAPTCHA) registration (`POST /api/v1/college-registrations`) creating restricted college context + `ACTIVE` proposed `COLLEGE_ADMIN` user (`email_verified_at = NULL`, `submitted_for_review_at = NULL`).
- **Email Verification & Authenticated Document Upload:** 48-hour DB-hashed verification token + authenticated document upload on the restricted dashboard (PDF/JPEG/PNG, max `10 MB`, max `5/revision`, MIME + magic-byte validation, random UUID keys outside webroot, tenant-scoped streaming with safe download headers) prior to clicking **Submit for Review** (`POST .../my-application/submit`), which enters the frozen `PENDING` review queue.
- **SUPER_ADMIN Verification & Bounded Resubmission:** `SUPER_ADMIN` inspects verified applications/documents and executes `approve`, `request-action` (`ACTION_REQUIRED`, safety cap 10), `reject` (`REJECTED`, up to 3 revised applications), or permanent rejection (deactivates college & user, revokes all sessions, releases code/email/slot reservations, retains history), all guarded by `expectedVersion` (`409 Conflict`).
- **Approval & Feature Unlocking:** Approval transitions `colleges` to `APPROVED` & `ACTIVE`, unlocking all academic management APIs on the existing `COLLEGE_ADMIN` account and dashboard; active sessions observe the transition via `GET /api/v1/auth/me` and live server-side authorization.
- **Password, Email Change & Lockout:** BCrypt work factor `12`, `12–128` chars + reject common/compromised passwords; password change (`POST /api/v1/auth/change-password`); 1-hour DB-hashed password reset (`forgot-password`/`reset-password`); password-confirmed email change (`change-email`/`verify-email-change`, 48h token via `pending_email`); `5` failed logins &rarr; `15-min` lockout.
- **Server-Side Session Revocation & Suspended College Blocking:** Granular single-session vs. all-session revocation via Spring Session JDBC; suspended/inactive colleges have all sessions revoked and login blocked (`403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE`).
- **One-Time `SUPER_ADMIN` Bootstrap & 7-Day Abandoned Cleanup:** Environment-driven startup runner (no public endpoint) and daily soft-archive cleanup of abandoned unverified/unsubmitted registrations after 7 days.
- **Transactional Outbox Email Dispatch:** `outbox_emails` table with `FOR UPDATE SKIP LOCKED` polling outside DB transactions; Mailpit in dev, env-configured SMTP/TLS in prod.
- **Protected Routes & Audit Logging:** Role + live approval-state route guards (`/admin/*`, `/college/*`) and immutable audit logs.

### Explicitly Excluded from MVP:
- **JWT-based authentication** (explicitly excluded; stateful HTTP-only sessions only).
- `SUPER_ADMIN` manual user creation via `POST /api/v1/users`.
- Public general-user self-registration (standalone users cannot sign up outside college registration).
- Public unauthenticated/multipart document uploads during registration.
- `ACADEMIC_STAFF` account login.
- `STUDENT` account login.
- `BRANCH_ADMIN` role and branch management (no branch tables or branch functionality in MVP).
- Multiple concurrent active `COLLEGE_ADMIN` accounts per college (MVP enforces one active `COLLEGE_ADMIN` per college via MySQL 8 `VIRTUAL` generated column + `UNIQUE` index, keeping `users.college_id` non-unique for Post-MVP multi-admin support).
- Automated AV/malware scanning on uploaded documents (`ADR-11b` — deferred to Post-MVP).
- Social authentication (Google, Microsoft) and University SSO / SAML / LDAP integration.

## 2.2 Post-MVP Scope (Future Extensibility)

The following capabilities are architecturally accommodated but deferred to post-MVP releases:
- **Subscription-Based Self-Service Onboarding (Option C):** Automated plan selection, payment gateway integration, and subscription-driven tenant onboarding. Option C can reuse the common onboarding and authentication foundations established in the MVP, while subscription management and billing integration will require additional implementation.
- `ACADEMIC_STAFF` user login and delegated departmental role authorization.
- `STUDENT` user authentication, personal credentials, and self-service access.
- `BRANCH_ADMIN` role and multi-branch / multi-campus management.
- Multiple active `COLLEGE_ADMIN` accounts per college tenant.
- Provisioning of staff accounts and student login accounts by `COLLEGE_ADMIN`.
- Enterprise Single Sign-On (Google Workspace, Microsoft Entra ID).
- University SAML/LDAP SSO integrations.
- Multi-factor authentication (MFA / TOTP).
- Passkeys / WebAuthn.

---

# 3. Actors

Acadlytic's authentication and onboarding system distinguishes between active MVP actors and future post-MVP actors:

| Actor | Lifecycle Phase | Authentication / Interaction Mechanism | Role Scope |
|---|---|---|---|
| **`SUPER_ADMIN`** | **MVP (Active)** | Email + Password | Platform Scope (Platform Owner & Operator) |
| **`COLLEGE_ADMIN`** | **MVP (Active)** | Email + Password (Credentials established during registration; 1 active per college in MVP) | College Tenant Scope (`college_id`): Restricted onboarding dashboard until `APPROVED`, full management dashboard once `APPROVED` & `ACTIVE` |
| **`ACADEMIC_STAFF`** | **POST-MVP** | Email + Password | College Tenant Scope (`college_id`) |
| **`STUDENT`** | **POST-MVP** | Email/Identifier + Password | Self-Service Scope (`/me`) |
| **`BRANCH_ADMIN`** | **POST-MVP** | Email + Password | Branch Scope (Deferred with branch management) |
| **Prospective College / Applicant** | **MVP & Post-MVP** | Public Registration Submission | Public Onboarding Scope (`/register-college`) |
| **Public Visitor** | MVP & Post-MVP | None | Public routes only (Login, Forgot Password) |

> [!IMPORTANT]
> **Student Records vs. Student User Accounts:**  
> In the MVP, student academic records exist in the database and are managed by `COLLEGE_ADMIN`. However, students do **not** have login credentials or user accounts in the `users` table during the MVP.

---

# 4. Core Concepts

## 4.1 User Entity

A user represents an authenticated identity within Acadlytic.

Core attributes:
- `id` (BIGINT, auto-increment primary key)
- `college_id` (BIGINT, nullable for `SUPER_ADMIN`, mandatory for `COLLEGE_ADMIN`, **non-unique FK** for Post-MVP multi-admin extensibility)
- `email` (VARCHAR, normalized lowercase/trimmed)
- `pending_email` (VARCHAR, nullable — used during verified email change)
- `email_verified_at` (TIMESTAMP UTC, nullable — required before entering `SUPER_ADMIN` review queue)
- `email_released` (BOOLEAN, default `FALSE` — set `TRUE` **only** upon permanent rejection or 7-day abandoned-unverified cleanup)
- `active_email` (`VIRTUAL` generated column: `CASE WHEN email_released = FALSE THEN email ELSE NULL END` + `UNIQUE` index)
- `active_college_admin_college_id` (`VIRTUAL` generated column: `CASE WHEN role = 'COLLEGE_ADMIN' AND status = 'ACTIVE' THEN college_id ELSE NULL END` + `UNIQUE` index)
- `password_hash` (VARCHAR, BCrypt work factor `12`)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role` (ENUM: `SUPER_ADMIN`, `COLLEGE_ADMIN`, `ACADEMIC_STAFF`, `STUDENT`)
- `status` (ENUM: `ACTIVE`, `INACTIVE`, `SUSPENDED`)
- `failed_login_attempts` (INT, default 0)
- `locked_until` (TIMESTAMP, nullable)
- `last_login_at` (TIMESTAMP, nullable)
- `created_at` / `updated_at` (TIMESTAMP, UTC)

## 4.2 Role Enumeration

The role system is defined to be future-proof:

```java
public enum Role {
    SUPER_ADMIN,     // Active in MVP
    COLLEGE_ADMIN,   // Active in MVP
    ACADEMIC_STAFF,  // Post-MVP
    STUDENT          // Post-MVP
}
```

In the MVP, only `SUPER_ADMIN` and `COLLEGE_ADMIN` accounts can be provisioned and authenticated. If an account with `ACADEMIC_STAFF` or `STUDENT` attempts to authenticate, the system rejects the request with a clear configuration message or treats it as unauthorized. `BRANCH_ADMIN` and branch management are strictly Post-MVP; no branch tables, branch roles, or branch functionality are created in the MVP.

## 4.3 Tenant Isolation Boundary

In Acadlytic, the **College** is the primary tenant boundary:

```text
Platform Scope
      │
SUPER_ADMIN (Platform Owner)
      │
      ├───────────────────────────────┐
      ↓                               ↓
College Tenant A (college_id: 1)     College Tenant B (college_id: 2)
      │                               │
COLLEGE_ADMIN A (1 active in MVP)    COLLEGE_ADMIN B (1 active in MVP)
```

- Every `COLLEGE_ADMIN` account is strictly bound to its assigned `college_id`.
- **MVP Single-Admin Rule (`ADR-06`):** MVP enforces **exactly one active `COLLEGE_ADMIN` per college tenant** atomically via a MySQL 8 `VIRTUAL` generated column (`active_college_admin_college_id`) + `UNIQUE` index on `users`. The underlying `users.college_id` foreign key remains **non-unique (1-to-many)** so future multiple-admin support requires only dropping that generated column/index with zero schema redesign.
- The backend resolves the authenticated user, tenant context (`college_id`), and authoritative college approval/operational status exclusively from trusted server-side state (Spring Session JDBC + live MySQL checks).
- Tenant isolation and approval-state gating must be enforced on every database query and service operation.

## 4.4 Account Lifecycle States (`users.status` vs. `colleges` Status)

- `users.status = ACTIVE`: The user account is active and permitted to authenticate. Newly registered `COLLEGE_ADMIN` users receive `users.status = ACTIVE` immediately so they can access the restricted dashboard. Academic management access is governed independently by `colleges.approval_status` (`APPROVED`) and `colleges.status` (`ACTIVE`).
- `users.status = INACTIVE`: Account deactivated (e.g., permanent rejection, abandoned-unverified cleanup, or admin replacement). Login is rejected, all sessions are revoked, and the `active_college_admin_college_id` unique slot is released automatically.
- `users.status = SUSPENDED`: Account locked by security/administrative action. Login is rejected and all active sessions are revoked. (`email_released` remains `FALSE` for `ACTIVE`, `SUSPENDED`, and approved-college `INACTIVE`/replaced accounts.)

## 4.5 Architectural Entities: College Context vs. Versioned Application vs. User Identity

To support immediate restricted dashboard access, verified review-queue gating, and full immutable audit history, the system separates:

1. **College Tenant Context (`colleges`):**
   - Created in a restricted onboarding state during public college registration and assigned a persistent `college_id` and unique `active_college_code` (`VIRTUAL` generated column released only when `permanently_rejected = TRUE` or `archived_at IS NOT NULL`).
   - Tracks `approval_status` (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`), operational tenant `status` (`PENDING_VERIFICATION`, `ACTIVE`, `INACTIVE`, `SUSPENDED`), `current_registration_id`, `resubmission_count` (cap `3` after `REJECTED`), `action_required_count` (safety cap `10`), `permanently_rejected`, and `archived_at`.
   - Only when `approval_status == APPROVED` and `status == ACTIVE` are academic management APIs unlocked. If an approved college is later `SUSPENDED` or `INACTIVE`, all sessions are revoked and login is blocked (`403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE`).
2. **Versioned Registration Applications & Immutable Documents (`college_registrations`, `college_registration_documents`):**
   - `college_registrations` stores each immutable application revision (`UNIQUE (college_id, version_number)`), institution snapshot, `submitted_for_review_at` (`NULL` until email verified & submitted), reviewer notes/rejection reason, `is_permanent_rejection`, reviewer ID, and timestamps.
   - `college_registration_documents` stores immutable verification documents linked to `college_id` + `registration_id` (replacements create new rows with optional `replaces_document_id`; prior versions' documents are never overwritten or deleted).
   - Resubmissions from `ACTION_REQUIRED` or non-permanent `REJECTED` create a new immutable revision (`version_number + 1`) while preserving all prior versions, documents, and decisions.
3. **College Administrator User (`users`):**
   - Created during public registration with `users.status = ACTIVE` and `email_verified_at = NULL`, using credentials chosen by the proposed administrator—never manually created by `SUPER_ADMIN`.
   - Possesses role `COLLEGE_ADMIN` and an immutable foreign-key link to the college's `college_id`.
   - Retains the **exact same user identity, session continuity, and `college_id`** from restricted onboarding through post-approval full management unlocking—no separate account or dashboard is created on approval.

---

# 5. College Onboarding & Account Provisioning Model

Acadlytic operates as a multi-tenant SaaS platform where colleges are customers. Controlled SaaS onboarding replaces manual user provisioning while giving newly registered colleges immediate restricted dashboard access.

### 5.1 Confirmed MVP Onboarding Flow

`College Registration → Restricted Dashboard (Email Verify + Document Upload + Submit) → Frozen PENDING Queue → SUPER_ADMIN Verification (expectedVersion) → Approval or Bounded Correction/Resubmission → Full Management Dashboard`

```text
Prospective College (Customer / Tenant)
     │
     ▼ 1. Public Registration (/register-college) — Rate Limited 5/IP/hr (+ Configurable Prod CAPTCHA)
POST /api/v1/college-registrations (Institution Profile + Proposed COLLEGE_ADMIN Credentials; No Multipart Docs)
     │
     ▼ 2. Atomic Registration Setup
- Creates colleges (approval_status = PENDING, status = PENDING_VERIFICATION)
- Creates college_registrations v1 (status = PENDING, submitted_for_review_at = NULL — NOT in SUPER_ADMIN queue yet)
- Creates users (role = COLLEGE_ADMIN, status = ACTIVE, email_verified_at = NULL, bound to college_id; BCrypt 12)
- Writes email verification job to outbox_emails (48h single-use DB-hashed token)
     │
     ▼ 3. Immediate Restricted Dashboard Access (Pre-Submission Onboarding)
COLLEGE_ADMIN logs in immediately (/auth/login, Stateful HTTP-Only Session Cookie + SPA CSRF)
- Verifies email via 48h token (POST /api/v1/auth/verify-email -> sets email_verified_at)
- Uploads required verification documents (POST .../my-application/documents; PDF/JPEG/PNG, <=10 MB, <=5 docs/rev)
- Clicks "Submit for Review" (POST .../my-application/submit -> requires verified email + required docs)
  -> Sets submitted_for_review_at = NOW(); enters SUPER_ADMIN PENDING queue; edits & uploads FROZEN
[All Academic Management APIs return 403 COLLEGE_NOT_APPROVED]
[Abandoned unverified + unsubmitted registrations auto-archived after 7 days]
     │
     ▼ 4. SUPER_ADMIN Verification (/admin/registrations — requires expectedVersion; 409 on stale)
SUPER_ADMIN inspects verified application revision & safely streamed verification documents
     │
     ├─────────────────────────┼─────────────────────────┼─────────────────────────┐
     ▼                         ▼                         ▼                         ▼
[REQUEST ACTION]          [REJECT (Non-Permanent)]  [PERMANENT REJECTION]     [APPROVE]
POST .../request-action   POST .../reject           POST .../reject           POST .../approve
(safety cap 10)           (up to 3 revisions)       (permanent=true OR rev 4)
     │                         │                         │                         │
     ▼                         ▼                         ▼                         ▼
Status = ACTION_REQUIRED  Status = REJECTED         permanently_rejected=true [DB Approval Tx]:
Mandatory notes saved     Mandatory reason saved    colleges.status=INACTIVE  1. Verify expectedVersion
Outbox email queued       Outbox email queued       users.status=INACTIVE     2. Application = APPROVED
     │                         │                    ALL sessions revoked      3. colleges = APPROVED/ACTIVE
     └────────────┬────────────┘                    code/email/slot released  4. Audit + outbox_emails
                  │                                 Full history retained     5. Commit DB tx
                  ▼                                                                │
College reviews feedback on Restricted Dashboard                                   ▼ (Outbox Poller)
Uploads new immutable docs & submits v+1                                      Approval email sent outside
(POST .../my-application/resubmit)                                            DB tx via SKIP LOCKED worker
Prior versions, docs & decisions preserved                                         │
v+1 enters frozen PENDING queue                                                    ▼
                                                                   Session observes managementUnlocked=true
                                                                   via GET /api/v1/auth/me -> Full Dashboard
                                                                   (Same account & dashboard; no re-activation)
```

#### Detailed Step Breakdown:
1. **Public College Registration:** Prospective college submits `/register-college` (`POST /api/v1/college-registrations`, IP rate-limited `5 attempts/IP/hour` with configurable production CAPTCHA) containing institution details and proposed `COLLEGE_ADMIN` credentials (password `12–128` chars, common/compromised passwords rejected, hashed with BCrypt work factor `12`). Verification documents are **not** accepted on public registration.
2. **Restricted Context Creation:** The backend validates `active_email` and `active_college_code` uniqueness, creates `colleges` (`approval_status = PENDING`, `status = PENDING_VERIFICATION`), creates `college_registrations` v1 (`status = PENDING`, `submitted_for_review_at = NULL`), creates `users` (`role = COLLEGE_ADMIN`, `status = ACTIVE`, `email_verified_at = NULL`, bound to `college_id`), and enqueues the 48-hour verification email in `outbox_emails`.
3. **Immediate Restricted Dashboard, Email Verification & Initial Submission (`ADR-08`):**
   - `COLLEGE_ADMIN` logs in immediately via `POST /api/v1/auth/login` (stateful HTTP-only session cookie + CSRF) and accesses the restricted dashboard.
   - Before submission (`submitted_for_review_at IS NULL`), the application is **not** in the `SUPER_ADMIN` review queue. The college verifies its email (`48-hour` single-use DB-hashed token) and uploads required verification documents (`UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`; optional `INSTITUTION_REGISTRATION_PROOF`, `ADDITIONAL_SUPPORTING_DOCUMENT`; max `5` docs/revision, PDF/JPEG/PNG up to `10 MB` each, MIME + magic-byte checked, stored outside webroot with random UUID keys).
   - Clicking **Submit for Review** (`POST /api/v1/college-registrations/my-application/submit`) requires `email_verified_at IS NOT NULL` and required documents present, sets `submitted_for_review_at = NOW()`, places the application into the `SUPER_ADMIN` `PENDING` queue, and **freezes all edits and document uploads**.
   - If left unverified and unsubmitted for **7 days**, a daily scheduled job soft-archives the abandoned registration (`ADR-13`), releasing `active_college_code`, `active_email`, and the admin slot without ever touching submitted/approved/historical records.
4. **SUPER_ADMIN Review (`expectedVersion` Required):** `SUPER_ADMIN` inspects verified applications and documents (`GET /api/v1/college-registrations/{id}`):
   - Every review mutation (`approve`, `request-action`, `reject`) requires `expectedVersion` in the request body; stale or non-latest revisions fail with **`409 Conflict` (`REGISTRATION_VERSION_CONFLICT`)**.
   - **Request Action (`POST .../{id}/request-action`):** Transitions `PENDING` &rarr; `ACTION_REQUIRED` with mandatory notes (subject to safety cap of `10` action-required revisions).
   - **Reject (`POST .../{id}/reject`):** Mandatory rejection reason. Non-permanent rejection allows up to **3 revised applications** after initial submission. Setting `"permanent": true` (or rejecting the 3rd revision) triggers **Permanent Rejection** (`ADR-09`): `colleges.permanently_rejected = true`, `colleges.status = INACTIVE`, `users.status = INACTIVE`, **all active sessions revoked immediately**, `active_college_code` / `active_email` (`email_released = true`) / single-admin slot released, and full history retained.
   - **Approve (`POST .../{id}/approve`):** Inside the atomic DB approval transaction, verifies `expectedVersion` and `status == PENDING`, transitions application to `APPROVED`, sets `colleges` to `approval_status = APPROVED` and `status = ACTIVE`, records `COLLEGE_REGISTRATION_APPROVED` audit event, and inserts the approval email job into `outbox_emails`.
   - **Transactional Outbox Dispatch (`ADR-18`):** All emails are dispatched **outside DB transactions** by a 10-second `@Scheduled` poller claiming rows via `SELECT ... FOR UPDATE SKIP LOCKED`, with 5-attempt exponential backoff to `FAILED_PERMANENT`, stale-`PROCESSING` recovery, and post-send token scrubbing (Mailpit in dev; env-configured SMTP/TLS in prod).
5. **Bounded Document Correction & Resubmission (`ACTION_REQUIRED` / Non-Permanent `REJECTED`):**
   - College reviews feedback on the restricted dashboard, uploads new immutable document rows (optional `replaces_document_id`), and calls `POST /api/v1/college-registrations/my-application/resubmit`, creating immutable `version_number + 1` in frozen `PENDING` (`submitted_for_review_at = NOW()`). All prior versions, documents, decisions, and audit logs remain permanently preserved.
6. **Feature Unlocking & Session Observation (Post-Approval):**
   - Because `users.status` is already `ACTIVE` with credentials set at registration, approval unlocks the **exact same `COLLEGE_ADMIN` account and dashboard** (`user_id` and `college_id` preserved; zero separate account or dashboard created).
   - Backend management endpoints check live `colleges.approval_status == APPROVED`, `colleges.status == ACTIVE`, and `users.status == ACTIVE` on every request. Existing browser sessions observe `managementUnlocked: true` via `GET /api/v1/auth/me` (refresh, "Refresh Status", window focus, or TanStack Query refetch).

---

### 5.1.1 Application Status Lifecycle & Valid Transitions

| Current State | Valid Next State(s) | Trigger / Actor | Historical Data Preservation | Dashboard & API Access |
|---|---|---|---|---|
| *(New)* | `PENDING` (Pre-Submission: `submitted_for_review_at = NULL`, `email_verified_at = NULL`) | Public registration (`POST /api/v1/college-registrations`, rate-limited 5/IP/hr) | Creates `colleges`, `users` (`ACTIVE`), `v1`, audit event & verification outbox email | Immediate login to Restricted Dashboard (verify email + upload required docs + Submit for Review); **not** yet in `SUPER_ADMIN` queue; management APIs return `403 COLLEGE_NOT_APPROVED` |
| `PENDING` (Pre-Submission) | `PENDING` (In Review Queue: `submitted_for_review_at != NULL`) | `COLLEGE_ADMIN` (`POST .../my-application/submit`; requires verified email + required docs) | Freezes `v1` and attached immutable documents | Restricted Dashboard becomes **read-only/frozen** (no edits or uploads); visible in `SUPER_ADMIN` queue; management APIs `403` |
| `PENDING` (Pre-Submission, unverified &ge; 7d) | Archived (`archived_at != NULL`, `colleges.status = INACTIVE`, `users.status = INACTIVE`) | Daily automated cleanup job (`ADR-13`) | Soft-archived with `ABANDONED_REGISTRATION_ARCHIVED` audit; unsubmitted draft files removed | Sessions revoked; `active_college_code`, `active_email` (`email_released = true`), and admin slot released |
| `PENDING` (In Review Queue) | `APPROVED` | `SUPER_ADMIN` (`POST .../{id}/approve` + `expectedVersion`) | Preserves all versions, documents & approval decision | `colleges` set `APPROVED` & `ACTIVE`; unlocks full Management Dashboard on same account; approval email via outbox |
| `PENDING` (In Review Queue) | `ACTION_REQUIRED` | `SUPER_ADMIN` (`POST .../{id}/request-action` + `expectedVersion` + mandatory notes; safety cap 10) | Preserves submitted version, documents & reviewer notes | Restricted Dashboard unlocks document upload/correction & resubmit; management APIs `403` |
| `PENDING` (In Review Queue) | `REJECTED` (Non-Permanent) | `SUPER_ADMIN` (`POST .../{id}/reject` + `expectedVersion` + mandatory reason; `resubmission_count < 3`) | Preserves submitted version, documents & rejection reason | Restricted Dashboard accessible (shows reason & remaining resubmissions out of 3); management APIs `403` |
| `PENDING` / `ACTION_REQUIRED` | `REJECTED` (Permanent) | `SUPER_ADMIN` (`permanent: true`) OR 3rd rejection revision rejected (`resubmission_count == 3`) | Full versions, documents, decisions & audit permanently retained | `colleges.status = INACTIVE`, `users.status = INACTIVE`, **all sessions revoked**, code/email/slot released |
| `ACTION_REQUIRED` | `PENDING` (In Review Queue) | `COLLEGE_ADMIN` (`POST .../my-application/resubmit`; cap 10) | Creates immutable `v+1`; preserves all prior versions, docs & feedback | Restricted Dashboard returns to frozen `PENDING` view; management APIs `403` |
| `REJECTED` (Non-Permanent) | `PENDING` (In Review Queue) | `COLLEGE_ADMIN` (`POST .../my-application/resubmit`; max 3 revisions) | Creates immutable `v+1`; increments `resubmission_count`; preserves prior rejected versions | Restricted Dashboard returns to frozen `PENDING` view; management APIs `403` |
| `APPROVED` | *(Onboarding terminal)* | Post-approval operational status via `colleges.status` (`ACTIVE`/`INACTIVE`/`SUSPENDED`) | Full onboarding history permanently retained | Full Management Dashboard while `ACTIVE`; if `SUSPENDED`/`INACTIVE`, **all sessions revoked and login blocked** (`403 COLLEGE_SUSPENDED`/`COLLEGE_INACTIVE`) |

---

### 5.1.2 Restricted vs. Full College Dashboard Permission Matrix

| Capability / Area | `PENDING` (Pre-Submission) | `PENDING` (In Review Queue — Frozen) | `ACTION_REQUIRED` | `REJECTED` (Non-Permanent, &le;3 rev) | `REJECTED` (Permanent) / `SUSPENDED` College | `APPROVED` (`ACTIVE`) | `SUPER_ADMIN` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Login / Logout / Change Password | **Allowed** | **Allowed** | **Allowed** | **Allowed** | **Blocked (`403`) + All Sessions Revoked** | **Allowed** | **Allowed** |
| `GET /api/v1/auth/me` | **Allowed** | **Allowed** | **Allowed** | **Allowed** | **No Session (`401`/`403`)** | **Allowed** | **Allowed** |
| Verify Email / Resend Verification / Fix Email Typo | **Allowed** | Verified (`N/A`) | Verified | Verified | **Denied** | Change Email (re-verify) | Platform Scope |
| View Application Status, History & Feedback | **Allowed** | **Allowed (Read-Only)** | **Allowed** | **Allowed** | **Denied** | Read-Only History | **Allowed** |
| View / Stream Own Verification Documents | **Allowed** | **Allowed (Read-Only)** | **Allowed** | **Allowed** | **Denied** | Read-Only | **Inspect Only** |
| Upload New Immutable Verification Documents | **Allowed** | **Frozen (`409`/`403`)** | **Allowed** | **Allowed** | **Denied** | **Denied** | **Denied** |
| Submit for Review / Resubmit Revision `v+1` | **Submit** (once verified + req docs) | **Frozen (`409`/`403`)** | **Resubmit** (cap 10) | **Resubmit** (max 3) | **Denied** | **Denied** | **Denied** |
| Academic Management APIs (Profile, Academic, Students, Imports, Processing, Backlogs, Passport, Analytics) | **Locked (`403`)** | **Locked (`403`)** | **Locked (`403`)** | **Locked (`403`)** | **Blocked (`403`)** | **Allowed** | Platform Scope (Where Permitted) |
| Review / Approve / Request Action / Reject Registrations | **Denied (`403`)** | **Denied (`403`)** | **Denied (`403`)** | **Denied (`403`)** | **Denied** | **Denied (`403`)** | **Allowed** (`expectedVersion`) |

---

### 5.2 Post-MVP Onboarding — Option C: Subscription-Based Self-Service

Option C is designed as a post-MVP commercial scaling extension:

```text
Prospective College
     │
     ▼ 1. Visits Public Pricing Page (/pricing)
Selects Subscription Plan (Starter / Growth / Enterprise)
     │
     ▼ 2. Payment Processing
Completes checkout via integrated Payment Gateway
Payment webhook confirms transaction
     │
     ▼ 3. Automated Tenant Activation & Subscription Provisioning
Platform creates/activates college record in colleges table & records subscription
College administrator credentials established via common onboarding/auth foundations
     │
     ▼ 4. College Access
COLLEGE_ADMIN accesses full management dashboard; subscription plan limits enforced
```

#### Architectural Relationship to MVP Onboarding:
- **Reused Core Foundations:** Option C can reuse the common authentication, tenant scoping (`college_id`), role model, and onboarding foundations established in the MVP.
- **Additional Implementation Required:** Commercial subscription plan management, payment gateway integration, webhook verification and idempotency, recurring billing/invoicing, plan upgrades/downgrades, and entitlement gating will require additional post-MVP implementation.

---

### 5.3 Provisioning Permissions Matrix

| Actor | MVP Capability | Post-MVP Capability |
|---|---|---|
| **Public Visitor / Prospective College** | Submit College Registration with proposed `COLLEGE_ADMIN` credentials | Submit Registration or Purchase Subscription (`Option C`) |
| **`SUPER_ADMIN`** | Review, Approve, Request Action (`ACTION_REQUIRED`), or Reject College Registration Applications; activate/suspend college tenants | Same + Subscription & Plan Management |
| **`COLLEGE_ADMIN`** | Establish credentials at registration; manage own onboarding documents/resubmissions until approved; manage student academic records once approved (1 active per college in MVP; no student user credentials) | Provision `ACADEMIC_STAFF` accounts; provision `STUDENT` user accounts; future multi-admin support |
| **`ACADEMIC_STAFF`** | *Role not active in MVP* | Provision `STUDENT` accounts where delegated |
| **`STUDENT`** | *Role not active in MVP* | None (Self-service only) |
| **`BRANCH_ADMIN`** | *Role not active in MVP (no branch tables/features)* | Delegated branch-level operations (Post-MVP branch management) |

---

### 5.4 Mandatory Onboarding & Provisioning Rules

1. **Public College Registration is Allowed (Rate-Limited):** Prospective institutions submit institution details and proposed `COLLEGE_ADMIN` credentials via `/register-college` (`5 attempts / IP / hour`, `429` + `Retry-After`, configurable production CAPTCHA). Verification documents are **never** uploaded on public registration.
2. **Public General-User Self-Registration is FORBIDDEN:** General visitors cannot register standalone user accounts outside college registration.
3. **Immediate Restricted Dashboard & Pre-Queue Gate (`ADR-08`):** Newly registered `COLLEGE_ADMIN` users receive `users.status = ACTIVE` immediately to log into the restricted dashboard, verify email (`48h` DB-hashed token), upload required documents (`UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`; PDF/JPEG/PNG, max `10 MB`, max `5/revision`), and click **Submit for Review** (`submitted_for_review_at`). Unverified/unsubmitted registrations do not enter the `SUPER_ADMIN` review queue and are soft-archived after 7 days (`ADR-13`).
4. **Frozen `PENDING` & Optimistic Review Concurrency (`ADR-07`):** Once submitted (`PENDING` in review queue), edits and document uploads are frozen. `SUPER_ADMIN` review actions require `expectedVersion` (`409 Conflict` on stale or superseded revisions).
5. **No Manual User Provisioning by Super Admin:** `SUPER_ADMIN` reviews, approves, requests action on, or rejects applications; `SUPER_ADMIN` never manually creates or sets passwords for individual `COLLEGE_ADMIN` accounts.
6. **Unlock Existing Account & Dashboard on Approval:** Approval sets `colleges` to `APPROVED` & `ACTIVE`, unlocking full management features on the existing `ACTIVE` `COLLEGE_ADMIN` account and dashboard (same `user_id` and `college_id`; zero separate account/dashboard creation).
7. **Bounded Resubmission & Permanent Rejection (`ADR-07`, `ADR-09`):** `ACTION_REQUIRED` allows up to a safety cap of `10` revisions; non-permanent `REJECTED` allows up to `3` revised applications after initial submission. Permanent rejection (`permanent: true` or 3rd revision rejected) sets `colleges.status = INACTIVE`, `users.status = INACTIVE`, revokes all sessions, releases `active_college_code`, `active_email` (`email_released = true`), and the single-admin slot, while permanently retaining all versions, immutable documents, decisions, and audit history.
8. **Single Active `COLLEGE_ADMIN` per College (`ADR-06`):** Enforced atomically by a MySQL 8 `VIRTUAL` generated column (`active_college_admin_college_id`) + `UNIQUE` index on `users`, keeping `users.college_id` non-unique for future multi-admin extensibility.
9. **No Branch Tables or `BRANCH_ADMIN` in MVP:** Branch management and `BRANCH_ADMIN` remain strictly Post-MVP; no branch tables or branch functionality are created in MVP.
10. **Transactional Outbox Email Dispatch (`ADR-18`):** Emails are written to `outbox_emails` inside the DB transaction and dispatched outside the DB transaction by a `FOR UPDATE SKIP LOCKED` poller (Mailpit in dev; env-configured SMTP/TLS in prod).
11. **Strict Tenant Association & No Client Overrides:** Every `COLLEGE_ADMIN` is bound exclusively to their server-derived `college_id`. Never trust client-supplied `role`, `college_id`, `approval_status`, or `status`.
12. **Student Records $\neq$ User Accounts:** Student records created in Student Management (`POST /api/v1/students`) do not generate user credentials or entries in `users`.

---

### 5.5 Finalized Single Active `COLLEGE_ADMIN` Enforcement (`ADR-06`)

MVP enforces **exactly one active `COLLEGE_ADMIN` per college** at the database layer via a MySQL 8 `VIRTUAL` generated column + `UNIQUE` index on `users`:

```sql
active_college_admin_college_id BIGINT GENERATED ALWAYS AS (
    CASE WHEN role = 'COLLEGE_ADMIN' AND status = 'ACTIVE' THEN college_id ELSE NULL END
) VIRTUAL,
CONSTRAINT uk_users_single_active_college_admin UNIQUE (active_college_admin_college_id)
```

- **Why Approved:** Atomic InnoDB B-tree uniqueness across all instances and code paths; multiple `NULL` rows permitted (allowing inactive/replaced admins and `SUPER_ADMIN` rows); zero clustered-row storage duplication; `users.college_id` stays non-unique (1-to-many) so Post-MVP multi-admin support requires only dropping this generated column/index.
- **Error Translation:** Duplicate-key violations map cleanly to HTTP `409 Conflict`.

---

# 6. Authentication, Session, Cookie, CSRF & Onboarding Flows

## 6.1 Stateful Session, Cookie & SPA CSRF Architecture (`ADR-01` – `ADR-05`)

Acadlytic uses **stateful HTTP-only session cookies persisted in MySQL via Spring Session JDBC (`SPRING_SESSION` / `SPRING_SESSION_ATTRIBUTES`)** — **JWT-based authentication is explicitly excluded**.

- **Session Lifecycle (`ADR-01`):** `30-minute` idle timeout, `12-hour` absolute session lifetime (enforced via server-side `createdAt` session attribute), session ID rotation on login and privilege changes, multiple concurrent devices allowed.
- **Cookie Configuration (`ADR-03`):**
  - **Local Dev (`dev`):** `ACADLYTIC_SID`, `HttpOnly=true`, `Secure=false`, `SameSite=Lax`, `Path=/`, no `Domain`, session cookie (no `Max-Age`). Vite dev proxy routes `/api` to `http://localhost:8080` for same-origin cookies/CSRF.
  - **Production (`prod`):** `__Host-ACADLYTIC_SID`, `HttpOnly=true`, `Secure=true`, `SameSite=Lax`, `Path=/`, **no `Domain` attribute** (strictly satisfies browser `__Host-` prefix rules behind same-origin reverse proxy), session cookie (no `Max-Age`).
- **SPA CSRF Contract (`ADR-04`):**
  - `CookieCsrfTokenRepository.withHttpOnlyFalse()` (`XSRF-TOKEN` cookie) + Spring Security 6 `SpaCsrfTokenRequestHandler` + `CsrfCookieFilter` + public `GET /api/v1/auth/csrf` bootstrap endpoint (`204 No Content`).
  - React/Axios uses `withCredentials: true`, `xsrfCookieName: 'XSRF-TOKEN'`, `xsrfHeaderName: 'X-XSRF-TOKEN'`.
  - CSRF enforced on `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `POST /api/v1/college-registrations`, and all state-changing APIs. Invalid/missing CSRF returns HTTP `403 Forbidden` with error code `CSRF_TOKEN_INVALID`.
- **Session Revocation Matrix (`ADR-05`):**
  - **Normal Logout:** Current session only.
  - **Password Change / Email Change:** All **other** sessions revoked + current session ID rotated.
  - **Password Reset, User Suspension/Deactivation, College Suspension/Deactivation, Permanent Rejection, College Admin Replacement, `SUPER_ADMIN` Suspension:** **ALL** active sessions of affected user(s) immediately purged server-side via `FindByIndexNameSessionRepository`.

## 6.2 College Registration, Verification & Feature Unlock Flow

```text
Prospective College / COLLEGE_ADMIN    SUPER_ADMIN (Platform Owner)       Server / Database
               │                                   │                            │
               │ 1. GET /api/v1/auth/csrf (XSRF-TOKEN cookie initialized)       │
               │ 2. POST /api/v1/college-registrations (Rate Limit 5/IP/hr)     │
               │    { institutionProfile, proposedAdminCredentials }            │
               │───────────────────────────────────────────────────────────────►│
               │                                   │                            │ 3. Validate policy (12–128, not common/breached)
               │                                   │                            │ 4. BCrypt(12) hash + Atomic DB tx:
               │                                   │                            │    - Create colleges (PENDING / PENDING_VERIFICATION)
               │                                   │                            │    - Create college_registrations v1 (submitted=NULL)
               │                                   │                            │    - Create users (COLLEGE_ADMIN, ACTIVE, email_verified=NULL)
               │                                   │                            │    - Insert 48h hashed token + outbox_emails + audit
               │ 201 Created { collegeId, submittedForReview: false }          │
               │◄───────────────────────────────────────────────────────────────│
               │                                   │                            │
               │ 5. POST /api/v1/auth/login -> Stateful Session Cookie Issued  │
               │ 6. POST /api/v1/auth/verify-email (48h token -> email_verified)│
               │ 7. POST .../my-application/documents (Required PDF/JPG/PNG)   │
               │ 8. POST .../my-application/submit -> Enters Frozen PENDING    │
               │───────────────────────────────────────────────────────────────►│
               │                                   │                            │
               │                                   │ 9. GET /api/v1/college-registrations (Verified Queue)
               │                                   │ 10. Inspect revisions & safely streamed docs
               │                                   │◄───────────────────────────│
               │                                   │                            │
               │                                   │ 11a. POST .../{id}/request-action OR /reject { expectedVersion }
               │                                   │───────────────────────────►│
               │                                   │                            │ 12a. Verify expectedVersion (409 on stale)
               │                                   │                            │      If permanent reject: INACTIVE + revoke ALL sessions
               │                                   │                            │      + release code/email/slot; retain full history
               │ 13a. Non-permanent: upload new immutable docs & resubmit v+1  │
               │───────────────────────────────────────────────────────────────►│
               │                                   │                            │
               │                                   │ 11b. POST .../{id}/approve { expectedVersion }
               │                                   │───────────────────────────►│
               │                                   │                            │ 12b. DB Approval Tx:
               │                                   │                            │      - Verify expectedVersion (409 on stale)
               │                                   │                            │      - Application = APPROVED
               │                                   │                            │      - colleges = APPROVED & ACTIVE
               │                                   │                            │      - Audit + outbox_emails committed
               │                                   │ 200 OK { collegeId, APPROVED }
               │                                   │◄───────────────────────────│
               │                                   │                            │ 13b. Outbox Worker (SKIP LOCKED, outside DB tx)
               │ 14b. Receives approval email & refreshes GET /api/v1/auth/me  │      sends approval email + scrubs tokens
               │◄───────────────────────────────────────────────────────────────│
               ▼                                   │                            │
Full College Management Dashboard Unlocked         │                            │
(Same ACTIVE user & dashboard; no re-activation)   │                            │
```

## 6.3 User Login Flow

```text
Client (Browser via Vite Proxy / Same-Origin)       Server (Spring Boot + Spring Session JDBC)
      │                                                      │
      │ 1. POST /api/v1/auth/login (+ X-XSRF-TOKEN)          │
      │─────────────────────────────────────────────────────►│
      │                                                      │ 2. Validate CSRF & input format; normalize email
      │                                                      │ 3. Check brute-force lockout (5 fails -> 15 min)
      │                                                      │ 4. Find active user by active_email
      │                                                      │ 5. Verify role (SUPER_ADMIN or COLLEGE_ADMIN)
      │                                                      │ 6. Verify users.status == ACTIVE
      │                                                      │ 7. Verify BCrypt(12) password hash
      │                                                      │ 8. If COLLEGE_ADMIN: check colleges.status:
      │                                                      │    - If SUSPENDED/INACTIVE -> 403 COLLEGE_SUSPENDED / INACTIVE
      │                                                      │    - If permanently_rejected -> 403 REGISTRATION_PERMANENTLY_REJECTED
      │                                                      │ 9. Reset failed_login_attempts; rotate session ID
      │                                                      │ 10. Persist Spring Session JDBC (30m idle / 12h max)
      │                                                      │ 11. Set HttpOnly Session Cookie + Record LOGIN_SUCCESS
      │                                                      │
      │ 200 OK { user: { id, role, collegeId, emailVerified, │
      │          submittedForReview, collegeApprovalStatus,  │
      │          collegeStatus, managementUnlocked } }       │
      │◄─────────────────────────────────────────────────────│
```

## 6.4 Authentication Failure Handling & Logout

- **Invalid Credentials:** Return `401 Unauthorized` (`AUTH_INVALID_CREDENTIALS`: *"Invalid email or password."*). Increment `failed_login_attempts`. On **5 consecutive failures**, set `locked_until = now() + 15 minutes`, record `ACCOUNT_LOCKED`, and return `429 Too Many Requests` (`AUTH_ACCOUNT_LOCKED`).
- **Suspended/Inactive College (`ADR-10`):** Return `403 Forbidden` with `COLLEGE_SUSPENDED` or `COLLEGE_INACTIVE` (distinct from `PENDING` registration).
- **Logout (`POST /api/v1/auth/logout`):** Enforces CSRF, invalidates the **current** Spring Session JDBC row only, expires the session cookie, clears frontend TanStack Query/Zustand auth state, and redirects to `/auth/login`.

## 6.5 Current User Inquiry (`/api/v1/auth/me`) & Live Approval Observation

- `GET /api/v1/auth/me` validates the server-side session (enforcing 30m idle and 12h absolute lifetime), queries authoritative `users` and `colleges` state from MySQL, and returns:
  ```json
  {
    "id": 101,
    "email": "admin@examplecollege.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "COLLEGE_ADMIN",
    "collegeId": 5,
    "userStatus": "ACTIVE",
    "emailVerified": true,
    "submittedForReview": true,
    "collegeApprovalStatus": "PENDING",
    "collegeStatus": "PENDING_VERIFICATION",
    "managementUnlocked": false
  }
  ```
- Upon `SUPER_ADMIN` approval, subsequent `GET /api/v1/auth/me` calls immediately return `"collegeApprovalStatus": "APPROVED"`, `"collegeStatus": "ACTIVE"`, and `"managementUnlocked": true`. Existing frontend sessions observe this on page refresh, "Refresh Status", window focus, or TanStack Query background polling.
- If the session is missing, expired, or revoked, return `401 Unauthorized`.

---

# 7. Role Permissions & Authorization Rules

## 7.1 SUPER_ADMIN Permissions (MVP)

- Review verified college registration applications, revision histories, and safely streamed verification documents (`GET /api/v1/college-registrations`, `GET /api/v1/college-registrations/{id}`, `GET /api/v1/college-registrations/{id}/documents/{docId}`).
- Execute `expectedVersion`-guarded verification decisions: `POST .../{id}/approve`, `POST .../{id}/request-action`, `POST .../{id}/reject` (including `permanent: true`).
- Manage college tenants (`/api/v1/colleges/**`): View list, view profile, update administrative metadata, activate/suspend (suspending immediately revokes all sessions of that college's users).
- Manage platform master data (Universities) and view platform health/audit logs.
- Never manually creates individual `COLLEGE_ADMIN` credentials; provisioned itself exclusively via one-time env-driven startup bootstrap (`ADR-17`).

## 7.2 COLLEGE_ADMIN Permissions (MVP)

### A. Permitted in Active Onboarding States (Pre-Submission `PENDING`, Frozen `PENDING`, `ACTION_REQUIRED`, Non-Permanent `REJECTED`, and Read-Only History in `APPROVED`):
- Authentication & account lifecycle: `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/change-password`, `POST /api/v1/auth/change-email`, `POST /api/v1/auth/verify-email-change`, `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/resend-verification`.
- Restricted onboarding endpoints:
  - `GET /api/v1/college-registrations/my-application` (status, version history, feedback, remaining resubmissions).
  - `GET /api/v1/college-registrations/my-application/documents` & `GET .../documents/{docId}` (tenant-scoped streaming with safe download headers).
  - `POST /api/v1/college-registrations/my-application/documents` (permitted **only** during pre-submission, `ACTION_REQUIRED`, or non-permanent `REJECTED` — rejected while frozen `PENDING`).
  - `POST /api/v1/college-registrations/my-application/submit` (pre-submission &rarr; frozen `PENDING` once email verified & required docs uploaded).
  - `POST /api/v1/college-registrations/my-application/resubmit` (`ACTION_REQUIRED` cap 10; `REJECTED` max 3 revised submissions &rarr; frozen `PENDING`).

### B. Unlocked Strictly When `college.approvalStatus == APPROVED` AND `college.status == ACTIVE` AND `user.status == ACTIVE`:
- Manage own college profile (`GET/PUT /api/v1/colleges/my-college`), academic structure (`/api/v1/academic/**`), student records (`/api/v1/students/**`), result imports/validation/processing (`/api/v1/result-imports/**`), backlogs (`/api/v1/backlogs/**`), Academic Passports (`/api/v1/students/{id}/passport`), and college analytics (`/api/v1/analytics/**`).
- Returns `403 COLLEGE_NOT_APPROVED` while unapproved, `403 COLLEGE_SUSPENDED`/`COLLEGE_INACTIVE` if suspended/inactive, and `403 Forbidden` on any cross-tenant attempt.

## 7.3 ACADEMIC_STAFF & 7.4 STUDENT Permissions (POST-MVP Extensions)
- Deferred to Post-MVP (Phases 15 and 16). `ACADEMIC_STAFF` will perform delegated college workflows; `STUDENT` will access self-service `/api/v1/me/**` read views only. `BRANCH_ADMIN` is deferred to Phase 18.6.

---

# 8. Password Management, Recovery & Email Change

## 8.1 Approved Password Policy & Hashing
- **Algorithm:** **BCrypt with work factor `12`**.
- **Length:** Minimum **12 characters**, maximum **128 characters**.
- **Strength Guard:** Reject common or compromised passwords (curated breached/common password list check).
- Plaintext passwords, session identifiers, reset tokens, and verification tokens must never be stored in plaintext, logged, or serialized in API responses.

## 8.2 Password Change
- Endpoint: `POST /api/v1/auth/change-password` (requires CSRF, `currentPassword`, and `newPassword`).
- Verifies `currentPassword`, validates policy, hashes with BCrypt(12), revokes **all other** active sessions of the user, rotates the current session ID, and records `PASSWORD_CHANGED`.

## 8.3 Forgot Password & Reset
1. `POST /api/v1/auth/forgot-password { "email": "user@example.com" }`
   - Always returns generic `200 OK` (no account enumeration).
   - Generates a cryptographically random, single-use, **DB-hashed token with `1-hour` expiry**, invalidating prior unused reset tokens, and queues dispatch via `outbox_emails`.
2. `POST /api/v1/auth/reset-password { "token": "...", "newPassword": "..." }`
   - Validates token hash, expiry, and single-use status, enforces password policy, updates BCrypt(12) hash, marks token used, revokes **ALL** active sessions of the user, and records `PASSWORD_RESET_COMPLETED`.

## 8.4 Email Change & Re-Verification (`ADR-14`)
1. `POST /api/v1/auth/change-email { "currentPassword": "...", "newEmail": "..." }`
   - Verifies current password, checks `active_email` uniqueness (`409 Conflict` if taken), stores normalized address in `users.pending_email` (old `users.email` stays valid for login until confirmed), invalidates prior unused email-change tokens, creates a single-use DB-hashed **`48-hour` token**, and queues verification to `newEmail` plus security alert to old `email` via `outbox_emails`.
2. `POST /api/v1/auth/verify-email-change { "token": "..." }`
   - Atomically validates token, re-checks `active_email` uniqueness, sets `users.email = pending_email`, clears `pending_email`, updates `email_verified_at`, marks token used, revokes **all other** sessions + rotates current session ID, and records `EMAIL_CHANGED`.
- Pre-verification typo correction (`email_verified_at IS NULL`) is supported with current password verification, invalidating previous verification tokens and dispatching a fresh 48-hour token.

---

# 9. Tenant Isolation & Approval-State Enforcement Architecture

Tenant isolation, college approval status, and operational tenant status are enforced strictly server-side on every management request:

```java
// Conceptual Spring Security Service Scoping for Academic Management Endpoints
public List<StudentResponse> getStudents(Long collegeId, Pageable pageable) {
    Long authCollegeId = SecurityUtils.getCurrentUserCollegeId();
    if (!authCollegeId.equals(collegeId)) {
        throw new AccessDeniedException("Cross-tenant access prohibited.");
    }
    collegeAccessGuard.requireApprovedAndActive(authCollegeId);
    // Throws 403 COLLEGE_NOT_APPROVED if PENDING / ACTION_REQUIRED / REJECTED
    // Throws 403 COLLEGE_SUSPENDED or COLLEGE_INACTIVE if operational status != ACTIVE
    return studentRepository.findAllByCollegeId(authCollegeId, pageable);
}
```

---

# 10. Security Audit Logging

| Event Type | Trigger | Captured Metadata |
|---|---|---|
| `SUPER_ADMIN_BOOTSTRAPPED`              | One-time startup bootstrap creates initial `SUPER_ADMIN` | User ID, Email, Timestamp |
| `COLLEGE_REGISTRATION_SUBMITTED`        | Public college registration created (`v1`) | Registration ID, Version (1), College ID, Code, Admin Email, IP, Timestamp |
| `EMAIL_VERIFIED`                        | 48h verification token redeemed | User ID, College ID, IP, Timestamp |
| `COLLEGE_REGISTRATION_DOC_UPLOADED`     | Immutable verification document uploaded | Registration ID, Version, Document ID, Category, College ID, User ID, Timestamp |
| `COLLEGE_REGISTRATION_QUEUED`           | College clicks Submit for Review (`submitted_for_review_at`) | Registration ID, Version, College ID, User ID, Timestamp |
| `COLLEGE_REGISTRATION_ACTION_REQUIRED`  | `SUPER_ADMIN` requests corrections/documents | Registration ID, Version, Reviewer ID, Mandatory Notes, Timestamp |
| `COLLEGE_REGISTRATION_RESUBMITTED`      | College submits revised version `v+1` | Registration ID, New Version, Previous Version, College ID, User ID, Timestamp |
| `COLLEGE_REGISTRATION_REJECTED`         | `SUPER_ADMIN` rejects application (non-permanent or permanent) | Registration ID, Version, Reviewer ID, Permanent Flag, Mandatory Reason, Timestamp |
| `COLLEGE_REGISTRATION_APPROVED`         | `SUPER_ADMIN` approves application | Registration ID, Version, Approver ID, College ID, Timestamp |
| `ABANDONED_REGISTRATION_ARCHIVED`       | 7-day cleanup soft-archives unverified/unsubmitted registration | College ID, User ID, Timestamp |
| `COLLEGE_STATUS_CHANGED`                | `SUPER_ADMIN` activates/suspends/deactivates college | College ID, Old Status, New Status, Actor ID, Sessions Revoked Count, Timestamp |
| `LOGIN_SUCCESS` / `LOGIN_FAILURE`       | Authentication attempt | User ID / Email, Role, College ID, Status, Reason, IP, Timestamp |
| `ACCOUNT_LOCKED`                        | 5 consecutive failed logins | User ID, Lockout Until (+15m), IP, Timestamp |
| `LOGOUT`                                | Session terminated | User ID, Timestamp |
| `PASSWORD_CHANGED` / `EMAIL_CHANGED`    | Password or verified email updated | User ID, Sessions Revoked Count, Timestamp |
| `PASSWORD_RESET_REQ` / `PASSWORD_RESET_DONE` | Reset token issued / redeemed | User ID, Timestamp |

Passwords, session IDs, reset tokens, and verification tokens are **strictly excluded** from all logs and audit tables.

---

# 11. Frontend Route Guard Architecture

```text
/register-college              -> Public (Institution profile + proposed COLLEGE_ADMIN credentials; optional prod CAPTCHA)
/verify-email                  -> Public / Authenticated (48h email verification confirmation)
/verify-email-change           -> Public / Authenticated (48h email change confirmation)
/auth/login                    -> Public (redirects to role/status dashboard if already authenticated)
/auth/forgot-password          -> Public
/auth/reset-password           -> Public

/admin/*                       -> Protected: requires SUPER_ADMIN
  ├── /admin/dashboard         -> Platform overview
  ├── /admin/registrations     -> Verified review queue (Filter: PENDING, ACTION_REQUIRED, APPROVED, REJECTED)
  ├── /admin/registrations/:id -> Application revisions, safely streamed docs, Approve / Request Action / Reject / Permanent Reject
  └── /admin/colleges          -> Active college tenant management (Activate / Suspend)

/college/*                     -> Protected: requires COLLEGE_ADMIN (bound to college_id)
  ├── /college/dashboard       -> Always accessible while college is not permanently rejected or suspended:
  │                               - Pre-submission: Email verification + Required doc upload + Submit for Review
  │                               - Frozen PENDING: Read-only status tracker
  │                               - ACTION_REQUIRED / Non-Permanent REJECTED: Feedback + Doc upload + Resubmit
  │                               - APPROVED & ACTIVE: Full College Executive Dashboard
  ├── /college/onboarding      -> Onboarding status, version history, documents & resubmission view
  ├── /college/profile         -> Locked until APPROVED & ACTIVE (backend enforces 403)
  ├── /college/academic        -> Locked until APPROVED & ACTIVE (backend enforces 403)
  ├── /college/students        -> Locked until APPROVED & ACTIVE (backend enforces 403)
  ├── /college/results/import  -> Locked until APPROVED & ACTIVE (backend enforces 403)
  ├── /college/backlogs        -> Locked until APPROVED & ACTIVE (backend enforces 403)
  ├── /college/passports       -> Locked until APPROVED & ACTIVE (backend enforces 403)
  └── /college/analytics       -> Locked until APPROVED & ACTIVE (backend enforces 403)

/student/*                     -> Deferred (POST-MVP)
```

---

# 12. Acceptance Criteria & Test Scenarios

### AC-01 — Stateful Session Login, Cookies & SPA CSRF
- `SUPER_ADMIN` and `COLLEGE_ADMIN` authenticate via `POST /api/v1/auth/login` with valid `X-XSRF-TOKEN` header; Spring Session JDBC persists the session (`30m` idle / `12h` max) and sets `ACADLYTIC_SID` (dev) / `__Host-ACADLYTIC_SID` (prod). No JWT is issued.
- Missing/invalid CSRF token returns `403 CSRF_TOKEN_INVALID`.

### AC-02 — Rejection of Deferred Roles & Suspended Colleges
- Any non-MVP role is rejected; suspended/inactive colleges cannot log in (`403 COLLEGE_SUSPENDED`/`COLLEGE_INACTIVE`) and have all active sessions immediately revoked.

### AC-03 — Cross-Tenant Access & Document IDOR Rejection
- `COLLEGE_ADMIN` for College A attempting to access College B academic data or onboarding documents receives `403 Forbidden`.

### AC-04 — Public Registration, Rate Limiting & Pre-Queue Gate
- `POST /api/v1/college-registrations` enforces IP rate limit (`5/IP/hr` &rarr; `429` + `Retry-After`), BCrypt(12), `12–128` char password (no common/breached passwords), creates `colleges` (`PENDING`/`PENDING_VERIFICATION`), `v1` (`submitted_for_review_at = NULL`), and `users` (`ACTIVE`, `email_verified_at = NULL`), and queues 48h verification email via `outbox_emails`.
- College logs in immediately, verifies email, uploads required documents (PDF/JPEG/PNG, &le;10 MB, &le;5/revision, MIME + magic-byte checked), and clicks Submit for Review to enter the frozen `PENDING` review queue.

### AC-05 — Frozen `PENDING` & Locked Academic Management
- While `PENDING` (submitted), edits and document uploads are rejected. While unapproved (`PENDING`, `ACTION_REQUIRED`, `REJECTED`), all academic management APIs return `403 COLLEGE_NOT_APPROVED`.

### AC-06 — `SUPER_ADMIN` Review (`expectedVersion`), Bounded Resubmission & Permanent Rejection
- Stale `expectedVersion` on `approve`/`request-action`/`reject` returns `409 Conflict`.
- `ACTION_REQUIRED` (safety cap 10) and non-permanent `REJECTED` (max 3 revisions) create immutable `v+1` revisions preserving all prior versions, documents, and decisions.
- Permanent rejection (`permanent: true` or 3rd revision rejected) sets `colleges.status = INACTIVE`, `users.status = INACTIVE`, revokes all sessions, releases `active_college_code`/`active_email`/admin slot, and retains full audit history.

### AC-07 — Approval Unlocking & Outbox Dispatch
- `POST .../approve` sets `colleges` to `APPROVED` & `ACTIVE`, queues email in `outbox_emails` (dispatched outside DB tx via `SKIP LOCKED`), and unlocks full management features on the existing `COLLEGE_ADMIN` account and dashboard (observed via `GET /api/v1/auth/me`).

### AC-08 — Brute-Force Lockout, Session Revocation & Single-Admin Constraint
- 5 consecutive failed logins trigger a 15-minute lockout; password change/email change revoke all other sessions; password reset revokes all sessions; concurrent creation of a second active `COLLEGE_ADMIN` for the same college fails at the MySQL 8 `VIRTUAL` unique index (`409 Conflict`).

### AC-09 — Student Records Distinction & 7-Day Cleanup
- Creating student academic records creates zero rows in `users`; abandoned unverified + unsubmitted registrations are safely soft-archived after 7 days without touching submitted/approved records.

---

# 13. Definition of Done for Authentication Specification

- [x] Only `SUPER_ADMIN` and `COLLEGE_ADMIN` are active in MVP; `ACADEMIC_STAFF`, `STUDENT` login, and `BRANCH_ADMIN` (no branch tables/features) remain Post-MVP.
- [x] Stateful HTTP-only session cookies (Spring Session JDBC + MySQL) and Spring Security 6 SPA CSRF are finalized (zero JWT).
- [x] Single active `COLLEGE_ADMIN` per college enforced via MySQL 8 `VIRTUAL` generated column + `UNIQUE` index while keeping `users.college_id` non-unique.
- [x] Full onboarding lifecycle (`Registration → Restricted Dashboard [Email Verify + Doc Upload + Submit] → Frozen PENDING → SUPER_ADMIN Review [expectedVersion] → Bounded Resubmission / Permanent Rejection / Approval Unlock`) is finalized.
- [x] All core architectural and security decisions (`ADR-01` – `ADR-19`) are formally approved and synchronized across all four authorized documents.

---

# 14. Deferred Decisions (Tracked — Non-Blocking for Phase 02–03)

All core authentication and onboarding decisions (`ADR-01` – `ADR-19`) are **APPROVED**. Only the following explicitly scoped items remain **`DEFERRED`**:

| ID | Deferred Item | Owner | Reason | Resolve Before |
|---|---|---|---|---|
| **ADR-11b** | Automated Document Malware Scanning (AV) | Security / Backend Lead | Avoid ClamAV container/ops overhead in MVP while enforcing magic-byte/MIME allow-list, 10 MB cap, UUID keys outside webroot, and safe download headers | Post-MVP Production Hardening (Phase 18.7) |
| **ADR-15b** | Specific Commercial Production SMTP Vendor | Platform / DevOps Lead | `EmailSender` port + env-configured SMTP/TLS + Mailpit (dev) fully decouple vendor choice from backend code | Phase 14 (MVP Release Gate & Pilot Deployment) |
| **ADR-16b** | Specific Production S3-Compatible Cloud Bucket Provider | Platform / DevOps Lead | `DocumentStorageService` port + local dev storage outside webroot fully decouple cloud bucket selection (backed-up local volume also viable for single-node pilot) | Phase 14 (MVP Release Gate & Pilot Deployment) |
