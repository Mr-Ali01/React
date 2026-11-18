# Authentication Implementation

**Document:** `09-development/implementation-notes/authentication-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Authentication & User Provisioning  
**Status:** Approved / Implementation Ready (Architecture Decision Closure Complete)  
**Audience:** Backend Developers, Frontend Developers, Security Reviewers, QA Engineers, AI Coding Assistants

---

# 1. Purpose

This document defines the implementation foundation for authentication and account provisioning in Acadlytic.

It translates the existing authentication feature specification into concrete implementation guidance for:

- user accounts
- login
- logout
- current-user context
- account provisioning
- roles
- tenant association
- authorization foundation
- protected routes
- password management
- account status
- failed-login protection
- security events
- auditability
- frontend authentication state
- backend security configuration

This document covers the authentication foundation required before implementing most protected application features.

---

# 2. Authentication & Onboarding Scope

The MVP authentication and onboarding system must support:

- **stateful HTTP-only session cookies persisted in MySQL via Spring Session JDBC (no JWT)** (`30-min` idle timeout, `12-hour` absolute lifetime, session ID renewal on login & privilege changes, multi-device allowed)
- **Spring Security 6 SPA CSRF protection** (`CookieCsrfTokenRepository.withHttpOnlyFalse()`, `SpaCsrfTokenRequestHandler`, `GET /api/v1/auth/csrf`, `CsrfCookieFilter`, Vite dev proxy, `403 CSRF_TOKEN_INVALID`)
- public college registration intake (IP rate-limited `5/IP/hour` + configurable prod CAPTCHA; institution profile + proposed `COLLEGE_ADMIN` credentials; **no** public multipart document upload)
- immediate restricted College Dashboard access (`users.status = ACTIVE` immediately; `email_verified_at = NULL`, `submitted_for_review_at = NULL`)
- 48-hour single-use DB-hashed email verification + authenticated verification document uploads (PDF/JPEG/PNG, max `10 MB`, max `5/revision`, MIME + magic-byte validated, random UUID storage keys outside webroot) + explicit **Submit for Review** into the frozen `PENDING` review queue
- full application status lifecycle (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`) with `expectedVersion` optimistic concurrency (`409 Conflict`), bounded versioned resubmission (`ACTION_REQUIRED` safety cap `10`; `REJECTED` max `3` revised applications), and permanent rejection preserving all prior versions, immutable documents, decisions, and audit history
- automated 7-day soft-archive cleanup for abandoned unverified + unsubmitted registrations
- unlocking of full management features on the existing `COLLEGE_ADMIN` account and dashboard upon `SUPER_ADMIN` approval (zero separate account/dashboard creation)
- login, logout, and authoritative current-user + verification context (`GET /api/v1/auth/me`)
- role-based and live approval-state-aware authorization (`SUPER_ADMIN`, `COLLEGE_ADMIN`; suspended colleges blocked from login with `403 COLLEGE_SUSPENDED` + all sessions revoked)
- single active `COLLEGE_ADMIN` per college enforced via MySQL 8 `VIRTUAL` generated column + `UNIQUE` index (`users.college_id` non-unique for Post-MVP multi-admin extensibility)
- BCrypt work factor `12`, password policy (`12–128` chars, reject common/compromised passwords), password change, 1-hour DB-hashed password reset, password-confirmed email change (`48h` re-verification via `pending_email`)
- brute-force protection (`5` consecutive failures &rarr; `15-minute` temporary lockout)
- transactional outbox email delivery (`outbox_emails`, `FOR UPDATE SKIP LOCKED` poller, Mailpit in dev, env-configured SMTP/TLS in prod)
- one-time env-driven `SUPER_ADMIN` startup bootstrap (zero public endpoint)
- Testcontainers MySQL `8.0.36` integration testing for MySQL-specific constraints and migrations

### Key Scope Boundary:
- **Stateful Sessions Only (No JWT):** Authentication uses Spring Session JDBC + HTTP-only cookies + SPA CSRF; JWT is explicitly excluded.
- **Public College Registration is ENABLED (Rate-Limited):** Prospective colleges submit institution details + proposed `COLLEGE_ADMIN` credentials (`users.status = ACTIVE` immediately); verification documents are uploaded post-login on the restricted dashboard.
- **Public General-User Self-Registration is DISABLED:** Individual users cannot create standalone unattached accounts outside college registration.
- **Immediate Restricted Dashboard & Frozen `PENDING`:** Newly registered colleges verify email and upload required documents before submitting into the frozen `PENDING` review queue; backend authorization strictly blocks all academic management APIs (`403 COLLEGE_NOT_APPROVED`) until `APPROVED` & `ACTIVE`.
- **SUPER_ADMIN Manual User Provisioning is REMOVED:** `SUPER_ADMIN` reviews, approves, requests action on, or rejects college applications using `expectedVersion`; `SUPER_ADMIN` never manually creates administrator credentials.
- **Single Active `COLLEGE_ADMIN` per College (`ADR-06`):** Enforced via MySQL 8 `VIRTUAL` generated column `active_college_admin_college_id` + `UNIQUE` index on `users`, while keeping `users.college_id` non-unique for future multi-admin support without redesign.
- **No Branch Management in MVP:** `BRANCH_ADMIN` and branch management are strictly Post-MVP; do not create branch tables or implement branch functionality in MVP.
- **Transactional Outbox Email Dispatch (`ADR-18`):** Emails are queued in `outbox_emails` inside the DB transaction and dispatched outside DB transactions by a `SKIP LOCKED` poller.

---

# 3. Authentication Actors

Acadlytic supports the following actors across its lifecycle:

```text
SUPER_ADMIN                      (MVP Active: Platform Owner & Operator)
COLLEGE_ADMIN                    (MVP Active: College Administrator — 1 active per college in MVP; restricted dashboard until APPROVED, full dashboard once APPROVED & ACTIVE)
ACADEMIC_STAFF                   (Post-MVP: Delegated Departmental Staff)
STUDENT                          (Post-MVP: Authenticated Student Self-Service)
BRANCH_ADMIN                     (Post-MVP: Branch Administration — no branch tables/features in MVP)
Prospective College / Applicant  (MVP Active: Public Onboarding via /register-college)
```

Public visitors are not authenticated application users.

---

# 4. Authentication vs Authorization vs Onboarding

These concerns must remain separate architectural boundaries.

### Authentication

Answers:

> Who is this user?

Examples:

- login
- password verification
- session/token validation
- current-user retrieval

### Authorization

Answers:

> What is this authenticated user allowed to do?

Examples:

- role checks (`SUPER_ADMIN` vs. `COLLEGE_ADMIN`)
- college approval-state checks (restricted onboarding endpoints vs. `APPROVED` + `ACTIVE` management endpoints)
- permission checks
- tenant checks (`college_id`)
- resource ownership checks

### College Onboarding & Account Provisioning

Answers:

> How does a customer tenant and application identity enter the system?

Confirmed MVP Workflow:

- Prospective College submits public registration with verification documents and proposed `COLLEGE_ADMIN` credentials
- System establishes a restricted college context (`PENDING`), versioned application v1, and proposed `COLLEGE_ADMIN` user bound to `college_id`
- College logs in immediately to the Restricted College Dashboard (academic management APIs locked by backend)
- `SUPER_ADMIN` inspects the application and documents and executes `APPROVED`, `ACTION_REQUIRED`, or `REJECTED`
- On `ACTION_REQUIRED` or `REJECTED`, college reviews feedback on its restricted dashboard, uploads corrected documents, and resubmits a new `PENDING` version (preserving history)
- On `APPROVED`, system activates the college tenant and existing `COLLEGE_ADMIN` account (same user identity & `college_id`) and unlocks full management features without a second unrelated activation workflow

Post-MVP Extensions:

- Option C: Self-service subscription purchase and automated onboarding (can reuse the common onboarding and authentication foundations, while subscription plans, payment gateway integration, and billing will require additional implementation)
- College Admin provisions Academic Staff accounts
- College Admin provisions Student user accounts linked to academic records
- Branch management and `BRANCH_ADMIN` (deferred; no branch tables or branch functionality in MVP)

---

# 5. Account Creation & Onboarding Model

General public user self-registration is strictly disabled in the MVP.

Customer onboarding and account establishment follow the confirmed workflow:
**`College Registration → Restricted Dashboard → SUPER_ADMIN Verification → Approval or Correction/Resubmission → Full Management Dashboard`**

```text
Prospective College (Customer / Tenant)
       │
       ▼ Public Registration Form (/register-college)
Submits College Registration (POST /api/v1/college-registrations)
(Institution Profile + Verification Documents + Proposed COLLEGE_ADMIN Credentials)
       │
       ▼ Atomic Registration Setup
- Creates restricted college context (colleges: approval_status = PENDING, status = PENDING_VERIFICATION)
- Creates application v1 (college_registrations: status = PENDING) & stores verification documents
- Creates proposed COLLEGE_ADMIN user in users table (`status = ACTIVE`, `email_verified_at = NULL`, bound to `college_id`)
- Writes 48h verification email to `outbox_emails`
       │
       ▼ Immediate Restricted Dashboard Access (Pre-Submission Onboarding)
COLLEGE_ADMIN logs in (/auth/login, Stateful HTTP-Only Session Cookie + SPA CSRF)
- Verifies email (48h hashed token) & uploads required docs (PDF/JPEG/PNG, <=10 MB, <=5 docs/rev)
- Clicks "Submit for Review" -> sets `submitted_for_review_at` -> enters FROZEN `PENDING` queue
- Blocked (403 COLLEGE_NOT_APPROVED): All academic management APIs
- [Abandoned unverified + unsubmitted registrations soft-archived after 7 days]
       │
       ▼ Review by SUPER_ADMIN (/admin/registrations — requires `expectedVersion`; 409 on stale)
SUPER_ADMIN Inspects Verified Application Revisions & Safely Streamed Documents
       │
       ├──────────────────────────┼──────────────────────────┼──────────────────────────┐
       ▼                          ▼                          ▼                          ▼
[REQUEST ACTION]           [REJECT (Non-Permanent)]   [PERMANENT REJECTION]      [APPROVE]
POST .../request-action    POST .../reject            POST .../reject            POST .../approve
(safety cap 10)            (up to 3 revisions)        (permanent=true OR rev 4)
       │                          │                          │                          │
       ▼                          ▼                          ▼                          ▼
Status = ACTION_REQUIRED   Status = REJECTED          permanently_rejected=true  [DB Approval Tx]:
Mandatory notes saved      Mandatory reason saved     colleges.status=INACTIVE   1. Verify expectedVersion
Outbox email queued        Outbox email queued        users.status=INACTIVE      2. Application = APPROVED
       │                          │                   ALL sessions revoked       3. colleges = APPROVED/ACTIVE
       └─────────────┬────────────┘                   code/email/slot released   4. Audit + outbox_emails
                     │                                Full history retained      5. Commit DB tx
                     ▼                                                                  │
College reviews feedback on Restricted Dashboard                                        ▼ (Outbox Poller)
Uploads new immutable docs & submits v+1                                         Approval email dispatched
(POST /api/v1/college-registrations/my-application/resubmit)                     via SKIP LOCKED worker
Prior versions, docs & decisions preserved                                              │
v+1 enters frozen PENDING queue                                                         ▼
                                                                      Active Session Observes Approval
                                                                      via GET /api/v1/auth/me -> Unlocked
                                                                      (Same user & dashboard; no re-activation)
```

### Post-MVP Account Provisioning:
In Post-MVP phases:
1. **Option C Onboarding:** Colleges purchase subscription plans via a payment gateway, triggering automated tenant activation and immediate management feature unlocking. Option C can reuse the common onboarding and authentication foundations, while subscription plans, payment gateway integration, webhook handling, and billing lifecycle management will require additional implementation.
2. **Staff Provisioning:** `COLLEGE_ADMIN` creates `ACADEMIC_STAFF` accounts within their college.
3. **Student Account Provisioning:** `COLLEGE_ADMIN` or authorized staff provisions `STUDENT` login accounts linked to existing student records.
4. **Multiple College Admins & Branch Management:** Future support for multiple active `COLLEGE_ADMIN` accounts per college (drop `VIRTUAL` generated column/index with zero table redesign) and Post-MVP branch management / `BRANCH_ADMIN` (no branch tables or branch features in MVP).

The following users cannot create accounts:

```text
STUDENT
PUBLIC VISITOR (outside public college registration)
```

---

# 6. Account Provisioning Principle

Establishing or transitioning a college context or user account must validate:

- required institutional profile data (documents uploaded post-login on restricted dashboard)
- email normalization (lowercase, trimmed) and `active_email` uniqueness
- `active_college_code` uniqueness
- target role (strictly `COLLEGE_ADMIN` for registering college administrators in MVP; never client-supplied)
- tenant context binding (`college_id` assigned server-side)
- single active `COLLEGE_ADMIN` per college enforced by MySQL 8 `VIRTUAL` generated column + `UNIQUE` index (`users.college_id` non-unique)
- application status transition validity (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`), `email_verified_at` + `submitted_for_review_at` gate, and `expectedVersion` optimistic check
- bounded resubmission caps (`3` after `REJECTED`; safety cap `10` for `ACTION_REQUIRED`) and preservation of prior application versions, immutable documents, and decisions
- approved password policy (`12–128` chars, reject common/compromised passwords, BCrypt work factor `12`)
- audit requirements (registration, email verification, document uploads, queue submission, action requests, resubmissions, rejections, permanent rejections, approvals, cleanup)

The frontend must not be allowed to bypass these checks.

---

# 7. User and College Lifecycle

### College Application & Tenant Lifecycle:
```text
Registration Submitted (v1: PENDING, submitted_for_review_at = NULL, email_verified_at = NULL)
       │
       ├── Unverified & Unsubmitted >= 7 Days ──→ Soft-Archived (archived_at != NULL, INACTIVE, code/email/slot released)
       │
       └── Email Verified + Required Docs Uploaded + Submit for Review
                │
                ▼
         PENDING (Frozen in Review Queue) ◄──────────────────────────┐
                │                                                    │ (Resubmit v+1; prior
                ├── SUPER_ADMIN Request Action ──→ ACTION_REQUIRED ──┤  versions, docs &
                │       │                           (cap 10)         │  decisions preserved)
                │       ├── SUPER_ADMIN Reject ──→ REJECTED ─────────┘ (max 3 revisions)
                │       │                           │
                ├── SUPER_ADMIN Reject ─────────────┤
                │                                   └── permanent=true OR rev 4 ──→ Permanently Rejected
                │                                       (INACTIVE, ALL sessions revoked, code/email/slot released, history retained)
                │
                └── SUPER_ADMIN Approve ──→ APPROVED
                                                │
                                                ▼
                                    College Tenant Activated (ACTIVE)
                                    Existing ACTIVE COLLEGE_ADMIN Unlocked for Full Management
                                    (If later SUSPENDED/INACTIVE: ALL sessions revoked & login blocked 403)
```

### User Account Lifecycle (`COLLEGE_ADMIN`):
```text
Registration Submitted (Credentials Established by Applicant; BCrypt 12)
       │
       ▼
ACTIVE (Restricted Onboarding Dashboard while college is unapproved; email_verified_at set upon 48h token)
       │
       ├── SUPER_ADMIN Approves College ──→ ACTIVE (Same user_id & college_id; Full Management Dashboard Unlocked)
       │
       ├── Permanent Rejection / 7-Day Abandoned Cleanup ──→ INACTIVE (email_released = true; ALL sessions revoked; slot released)
       │
       ├── Administrative Deactivation / Replacement ──→ INACTIVE (email_released = false; ALL sessions revoked; slot released)
       │
       └── Security / Admin Suspension ──→ SUSPENDED (email_released = false; ALL sessions revoked)
```

The persisted status values must remain consistent with the database schema design.

---

# 8. User Identity & Finalized Schema Columns

A user has a stable database identifier with finalized MySQL 8 `VIRTUAL` generated columns for single-admin and releasable-email constraints:

```text
users
├── id
├── email                             (normalized lowercase, trimmed)
├── pending_email                     (nullable — used during verified email change)
├── email_verified_at                 (TIMESTAMP UTC, nullable)
├── email_released                    (BOOLEAN NOT NULL DEFAULT FALSE — TRUE only on permanent rejection / 7-day abandoned cleanup)
├── active_email                      (VIRTUAL generated: CASE WHEN email_released = FALSE THEN email ELSE NULL END + UNIQUE)
├── password_hash                     (BCrypt work factor 12)
├── first_name / last_name
├── role                              (SUPER_ADMIN | COLLEGE_ADMIN | ACADEMIC_STAFF | STUDENT)
├── college_id                        (BIGINT, nullable for SUPER_ADMIN, NON-UNIQUE FK to colleges.id)
├── active_college_admin_college_id   (VIRTUAL generated: CASE WHEN role='COLLEGE_ADMIN' AND status='ACTIVE' THEN college_id ELSE NULL END + UNIQUE)
├── status                            (ACTIVE | INACTIVE | SUSPENDED)
├── failed_login_attempts             (INT DEFAULT 0)
├── locked_until                      (TIMESTAMP UTC, nullable)
├── last_login_at                     (TIMESTAMP UTC, nullable)
├── created_at / updated_at           (TIMESTAMP UTC)
```

---

# 9. Email Identity

Email is normalized consistently (`trim().toLowerCase(Locale.ROOT)`) before validation, lookup, storage, and uniqueness checks.

- Uniqueness is enforced atomically at the database level via `UNIQUE (active_email)` on the `VIRTUAL` generated column `active_email`.
- `email_released` is set `TRUE` **only** upon permanent rejection (`ADR-09`) or 7-day abandoned-unverified cleanup (`ADR-13`). It is **never** set `TRUE` for `ACTIVE`, `SUSPENDED`, or replaced/inactive approved-college accounts, preventing account collision or impersonation of historical approved users.

---

# 10. Password Storage

Passwords must never be stored in plaintext.

The database stores only a BCrypt hash (`password_hash`). Password hashes must never be returned through an API or logged.

---

# 11. Password Hashing (Finalized)

- **Encoder:** Spring Security `BCryptPasswordEncoder(12)` (**work factor `12`**).
- Must never log plaintext passwords or hashes (disable `org.hibernate.type.descriptor.sql.BasicBinder: TRACE` in dev configuration before Phase 02 implementation).

---

# 12. Spring Security Foundation & Session Architecture (`ADR-01` – `ADR-05`)

Spring Security `6.3` (Spring Boot `3.3.4`) is the primary backend security framework.

The finalized authentication architecture uses **stateful HTTP-only session cookies persisted in MySQL via Spring Session JDBC (`spring-session-jdbc`)** — **JWT-based authentication is explicitly prohibited**.

---

# 13. Session Lifecycle, Persistence, Cookies & SPA CSRF Contract (Finalized)

### 13.1 Session Lifecycle (`ADR-01`)
- **Idle Timeout:** `30 minutes` (Spring Session `maxInactiveIntervalInSeconds = 1800`, configurable).
- **Absolute Session Lifetime:** `12 hours` (enforced via server-side `SESSION_CREATED_AT` attribute checked on every authenticated request; expired sessions are invalidated and return `401 Unauthorized`).
- **Session Fixation Protection:** Mandatory session ID renewal (`changeSessionId` / `migrateSession`) on **login** and upon any **privilege/security change** (password change, email change, future role elevation).
- **Multi-Device Concurrency:** Multiple concurrent device sessions per user are **allowed**; every session is tracked by `PRINCIPAL_NAME` in Spring Session JDBC for targeted or bulk server-side revocation.

### 13.2 Session Persistence (`ADR-02`)
- **Store:** **Spring Session JDBC with MySQL** (`SPRING_SESSION` and `SPRING_SESSION_ATTRIBUTES` managed via Flyway migration).
- Enables instant server-side revocation of one or all sessions for a principal via `FindByIndexNameSessionRepository`, survives restarts, and supports horizontal scaling without introducing Redis in MVP.

### 13.3 Cookie Configuration (`ADR-03`)

| Attribute | Development (`dev`) | Production (`prod`) |
|---|---|---|
| **Cookie Name** | `ACADLYTIC_SID` | `__Host-ACADLYTIC_SID` |
| **`HttpOnly`** | `true` | `true` |
| **`Secure`** | `false` (HTTP localhost) | `true` (HTTPS mandatory) |
| **`SameSite`** | `Lax` | `Lax` |
| **`Domain`** | Omitted (host-only) | **Omitted (host-only — required by `__Host-` browser spec)** |
| **`Path`** | `/` | `/` |
| **Expiration** | Session cookie (`Max-Age` omitted) | Session cookie (`Max-Age` omitted) |

Production serves the React SPA and `/api/v1/*` behind the same origin (reverse proxy) so `__Host-ACADLYTIC_SID` complies with every browser `__Host-` requirement (`Secure=true`, `Path=/`, no `Domain`).

### 13.4 SPA CSRF Implementation Contract (`ADR-04`)
- **Spring Security 6 Configuration:**
  - `CookieCsrfTokenRepository.withHttpOnlyFalse()` (sets `XSRF-TOKEN` cookie with `Path=/`, `SameSite=Lax`, `Secure=true` in prod, `HttpOnly=false`).
  - `SpaCsrfTokenRequestHandler` (combining `XorCsrfTokenRequestAttributeHandler` and plain cookie resolution per Spring Security 6 SPA guidance).
  - `CsrfCookieFilter` registered after `BasicAuthenticationFilter` to materialize deferred `CsrfToken` cookies cleanly after session creation/rotation.
  - Public bootstrap endpoint: `GET /api/v1/auth/csrf` returning `204 No Content` and guaranteeing `XSRF-TOKEN` cookie issuance before the first state-changing request.
- **React / Vite / Axios Integration:**
  - Local dev uses the **Vite development proxy** (`/api` &rarr; `http://localhost:8080`) for same-origin cookies and CSRF; `X-XSRF-TOKEN` is also added to backend CORS `allowed-headers`.
  - Axios is configured with `withCredentials: true`, `xsrfCookieName: 'XSRF-TOKEN'`, and `xsrfHeaderName: 'X-XSRF-TOKEN'`.
- **Enforcement Scope & Failure Response:**
  - Enforced on **`POST /api/v1/auth/login`**, **`POST /api/v1/auth/logout`**, **`POST /api/v1/college-registrations`**, and every state-changing (`POST`, `PUT`, `PATCH`, `DELETE`) endpoint.
  - CSRF failure returns HTTP **`403 Forbidden`** with JSON error code `CSRF_TOKEN_INVALID`.

### 13.5 Session Revocation Rules (`ADR-05`)
- **Normal Logout:** Revokes current session only.
- **Password Change & Email Change:** Revokes **all other** sessions of the user + rotates current session ID.
- **Password Reset, User Suspension/Deactivation, College Suspension/Deactivation, Permanent Rejection, College Admin Replacement, `SUPER_ADMIN` Suspension:** Immediately revokes **ALL** active sessions of affected user(s) via `FindByIndexNameSessionRepository`.

---

# 14. Authentication Security Guarantees

The finalized Spring Session JDBC + SPA CSRF implementation guarantees:

- server-side authoritative session state (zero JWT trust or client-side token storage)
- immediate server-side session revocation
- 30-minute idle and 12-hour absolute expiration enforcement
- protection against XSS token theft (`HttpOnly`), CSRF (`XSRF-TOKEN` / `X-XSRF-TOKEN`), and session fixation (ID rotation)
- live backend authorization and strict tenant isolation on every request

---

# 15. Login Flow

```text
User
 ↓
GET /api/v1/auth/csrf (ensures XSRF-TOKEN cookie)
 ↓
POST /api/v1/auth/login (+ X-XSRF-TOKEN header)
 ↓
Validate CSRF & Credentials (BCrypt work factor 12; 5 failures -> 15-min lockout)
 ↓
Verify User Status == ACTIVE & Role in (SUPER_ADMIN, COLLEGE_ADMIN)
 ↓
If COLLEGE_ADMIN: Verify College Not SUSPENDED / INACTIVE / Permanently Rejected
 ↓
Rotate Session ID & Persist Spring Session JDBC (30m idle / 12h max)
 ↓
Set HttpOnly Cookie (ACADLYTIC_SID / __Host-ACADLYTIC_SID)
 ↓
Frontend Loads GET /api/v1/auth/me
 ↓
Role + Approval-State Dashboard Routing
```

---

# 16. Login Request

The login request should contain only the information required for authentication.

Conceptually:

```text
POST /api/v1/auth/login
```

Request:

```text
{
  "email": "user@example.com",
  "password": "..."
}
```

The exact request DTO must be defined in the API implementation.

---

# 17. Login Response

The login response must never expose:

- password
- password hash
- internal security credentials
- unnecessary sensitive user data

The response should provide only what the frontend requires to establish the authenticated application state.

The exact response depends on the final authentication mechanism.

---

# 18. Current User (`/api/v1/auth/me`) & Live Approval Observation

The frontend should retrieve authoritative authenticated user and college verification context through:

```text
GET /api/v1/auth/me
```

The response should contain:

```text
id
name
email
role
collegeId
userStatus              (ACTIVE | INACTIVE | SUSPENDED)
emailVerified           (boolean: users.email_verified_at != null)
submittedForReview      (boolean: current registration submitted_for_review_at != null)
collegeApprovalStatus   (PENDING | ACTION_REQUIRED | APPROVED | REJECTED)
collegeStatus           (PENDING_VERIFICATION | ACTIVE | INACTIVE | SUSPENDED)
managementUnlocked      (boolean: true only when APPROVED and ACTIVE)
```

The exact DTO must be defined by the backend API contract.

---

# 19. Current User Purpose & Observing Approval Transitions

`/api/v1/auth/me` provides the frontend with the authoritative authenticated and onboarding-verification context directly from server state.

It should support:

- role-aware navigation
- tenant context (`collegeId`)
- pre-submission email verification & document upload checklist (`emailVerified`, `submittedForReview`)
- approval-state-aware dashboard rendering (Restricted Onboarding Dashboard vs. Full College Management Dashboard)
- live observation of `SUPER_ADMIN` approval transitions for already-authenticated sessions (via page refresh, "Refresh Status" button, window focus, or TanStack Query background refetch) without forcing re-registration or creating a separate account/dashboard
- profile display and protected route behavior

The frontend must never reconstruct the current user or approval status from arbitrary local values, and backend endpoints must independently verify live approval and operational status from MySQL on every protected request.

---

# 20. Logout

Logout invalidates the **current** Spring Session JDBC session only (preserving other logged-in devices per `ADR-05`) and requires a valid CSRF token (`X-XSRF-TOKEN`).

Endpoint:

```text
POST /api/v1/auth/logout
```

The operation must:

- validate CSRF (`403 CSRF_TOKEN_INVALID` on mismatch)
- invalidate the current Spring Session JDBC record in MySQL
- expire the HTTP-only session cookie (`ACADLYTIC_SID` / `__Host-ACADLYTIC_SID`)
- record `LOGOUT` audit event
- clear client TanStack Query / Zustand authentication state and redirect to `/auth/login`

---

# 21. Frontend Logout

The frontend should:

1. request logout
2. clear relevant client state
3. invalidate authenticated queries
4. clear user context
5. redirect to login/public route

The frontend must not assume that simply deleting a local value is sufficient to log out securely.

---

# 22. Authentication State

The frontend should distinguish:

```text
UNKNOWN
AUTHENTICATED
UNAUTHENTICATED
```

Conceptually:

```text
Application Start
      ↓
Check Authentication
      ↓
Loading
      ↓
Authenticated ──→ Application
      │
      └──────────→ Unauthenticated ──→ Login
```

Avoid flashing protected application content before authentication state is resolved.

---

# 23. Protected Routes

Protected routes should be implemented centrally.

Conceptually:

```text
/app/*
   ↓
Authenticated?
   ├── No → /login
   └── Yes
        ↓
      Role/Permission
        ├── Allowed → Page
        └── Denied → Unauthorized
```

Frontend route protection is a UX boundary.

Backend authorization remains authoritative.

---

# 24. Backend Authorization

Every protected backend endpoint must independently verify authorization.

Never rely on:

```text
hidden frontend button
```

or:

```text
frontend route protection
```

as the security mechanism.

---

# 25. Role Hierarchy

Roles across the platform lifecycle:

```text
SUPER_ADMIN      (Active in MVP)
COLLEGE_ADMIN    (Active in MVP — 1 active per college)
ACADEMIC_STAFF   (Post-MVP)
STUDENT          (Post-MVP — student academic records are in MVP; student login is Post-MVP)
BRANCH_ADMIN     (Post-MVP — deferred with branch management; no branch tables or branch functionality in MVP)
```

The implementation must not assume that role names alone define every permission.

Authorization should be based on explicit role/permission rules.

---

# 26. SUPER_ADMIN

`SUPER_ADMIN` operates at the platform level as owner and operator.

MVP capabilities include:

- review public college registration applications, revision histories, and verification documents
- approve (`APPROVED`), request corrections/documents (`ACTION_REQUIRED`), or reject (`REJECTED`) college registration applications
- manage college tenants (view, update metadata, activate, deactivate, suspend)
- view platform-level information and security/onboarding audit logs permitted by the application
- manage platform-level configuration where defined

`SUPER_ADMIN` does **not** manually create `COLLEGE_ADMIN` credentials or set passwords for individual colleges; credentials are established by the proposed college administrator during registration.

A Super Admin is not automatically allowed to perform every future feature.

Permissions must remain explicit.

---

# 27. COLLEGE_ADMIN

`COLLEGE_ADMIN` operates within their assigned college tenant (`college_id`).

MVP enforces **exactly one active `COLLEGE_ADMIN` per college tenant** via MySQL 8 `VIRTUAL` generated column `active_college_admin_college_id` + `UNIQUE` index (`ADR-06`), while keeping `users.college_id` non-unique for future multiple-admin support without redesign.

MVP capabilities by college verification state:

- **Pre-Submission Restricted Dashboard (`PENDING`, `submitted_for_review_at = NULL`):**
  - log in immediately after registration (`users.status = ACTIVE`)
  - verify email (`48h` single-use DB-hashed token) or fix email typo with password confirmation
  - upload required verification documents (PDF/JPEG/PNG, max `10 MB`, max `5/revision`) and click **Submit for Review** (`POST .../my-application/submit`)
- **Frozen `PENDING` Restricted Dashboard (`submitted_for_review_at != NULL`):**
  - view application status, submitted information, and documents strictly **read-only** (edits and document uploads frozen while under `SUPER_ADMIN` review)
- **`ACTION_REQUIRED` (cap 10) & Non-Permanent `REJECTED` (max 3 revisions) Restricted Dashboard:**
  - view reviewer notes / rejection reason and remaining resubmissions, upload new immutable documents, and submit revised application version `v+1` &rarr; frozen `PENDING`
- **Permanent Rejection or Suspended Approved College:**
  - **All sessions revoked immediately and login blocked** (`403 REGISTRATION_PERMANENTLY_REJECTED` / `COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE`)
- **Full Management Dashboard (Unlocked upon `APPROVED` & `ACTIVE` — preserving same user identity & `college_id`):**
  - manage permitted college profile information, academic structures, student academic records (no student login accounts), result imports/validation/processing, backlog tracking, Academic Passports, and college academic analytics

Post-MVP capabilities include:

- create and manage `ACADEMIC_STAFF` accounts
- create and manage `STUDENT` authentication accounts

A College Admin must not access another college's tenant data.

---

# 28. ACADEMIC_STAFF (Post-MVP)

`ACADEMIC_STAFF` is a **Post-MVP role** and is **not active in the MVP**.

When enabled in Post-MVP phases, `ACADEMIC_STAFF` will operate within the assigned college.

Capabilities will depend on the feature permission model.

Planned Post-MVP capabilities include:

- student management where permitted
- result import workflows
- validation workflows
- processing workflows
- backlog workflows
- academic analytics where permitted
- student account provisioning where explicitly allowed

The exact permission matrix must follow the authentication specification.

---

# 29. STUDENT (Post-MVP Authentication)

`STUDENT` authentication and self-service portal access are **Post-MVP** and are **not active in the MVP**. (Student academic records remain in MVP and are managed by `COLLEGE_ADMIN`.)

When enabled in Post-MVP phases, a student will be restricted to self-service access.

Examples:

```text
/me
/me/dashboard
/me/results
/me/backlogs
/me/academic-passport
/me/analytics
/me/profile
```

A student must not gain access to another student's records by changing an identifier.

---

# 30. Tenant Context

Every college-scoped authenticated request must operate within the user's authorized tenant context.

Conceptually:

```text
Authenticated User
      ↓
User Role
      ↓
Assigned College
      ↓
Tenant Context
      ↓
Authorized Operation
```

The tenant context must be established by trusted backend authentication information.

It must not be trusted from arbitrary request parameters.

---

# 31. Tenant Context Security

The backend must not allow a user to simply submit:

```text
collegeId = anotherCollege
```

and thereby change their tenant.

Tenant context should come from authenticated identity and authorized relationships.

---

# 32. Tenant-Aware Queries

Tenant-scoped repository queries should ensure the college boundary is respected.

Conceptually:

```text
findStudent(studentId, collegeId)
```

is safer than:

```text
findStudent(studentId)
```

when the operation is college-scoped.

The exact repository pattern should follow backend architecture.

---

# 33. IDOR Prevention

Insecure:

```text
GET /api/v1/students/100
```

with only:

```text
studentId = 100
```

being checked.

Secure conceptual flow:

```text
Authenticated User
 ↓
Role
 ↓
College Context
 ↓
Student 100 belongs to authorized college?
 ↓
Permission
 ↓
Allow / Deny
```

Every resource identifier must be evaluated in its authorization context.

---

# 34. College Registration Intake API & Rate Limiting (`ADR-12`)

Conceptual public onboarding endpoint:

```text
POST /api/v1/college-registrations
```

This endpoint is publicly accessible (requires CSRF `X-XSRF-TOKEN`) and accepts institution profile + proposed `COLLEGE_ADMIN` credentials. **Verification documents are NOT uploaded on this public endpoint** — documents are uploaded post-login through the authenticated restricted dashboard.

### Abuse Prevention (`ADR-12`):
- **IP Rate Limiting:** `5 registration attempts per IP per 1 hour` (configurable via properties), implemented behind a `RateLimiter` interface (in-memory token bucket in MVP; swappable to shared store on horizontal scaling). Resolve client IP strictly through Spring's trusted proxy strategy (`server.forward-headers-strategy`). Exceeding the limit returns HTTP **`429 Too Many Requests`** with `Retry-After` header and error code `RATE_LIMIT_EXCEEDED`.
- **Production CAPTCHA:** Configurable feature flag (`app.security.captcha.enabled=false` in dev, configurable in prod) behind a `CaptchaVerifier` abstraction.

Example conceptual request payload:

```json
{
  "collegeName": "St. Xavier Institute of Engineering",
  "collegeCode": "SXIE",
  "universityAffiliation": "University of Mumbai",
  "website": "https://www.sxie.edu.in",
  "address": {
    "street": "Mahim Causeway",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400016"
  },
  "proposedAdmin": {
    "firstName": "Dr. Rajesh",
    "lastName": "Sharma",
    "email": "principal@sxie.edu.in",
    "phone": "+919876543210",
    "designation": "Principal / Director",
    "password": "ApplicantChosenLongPassword!"
  },
  "captchaToken": "optional-when-enabled-in-prod"
}
```

The backend must atomically:
- enforce IP rate limit (`429`) and verify CAPTCHA when enabled
- validate required fields, email format, and approved password policy (`12–128` chars, reject common/compromised passwords)
- normalize the proposed administrator email (`trim().toLowerCase()`) and verify `active_email` uniqueness (`409 Conflict` on duplicate)
- normalize `collegeCode` and verify `active_college_code` uniqueness (`409 Conflict` on duplicate)
- ignore/reject any client-supplied `role`, `collegeId`, `approvalStatus`, or `status` fields
- hash password using `BCryptPasswordEncoder(12)`
- create restricted `colleges` context (`approval_status = PENDING`, `status = PENDING_VERIFICATION`, `resubmission_count = 0`, `action_required_count = 0`, `permanently_rejected = false`)
- create `college_registrations` v1 (`version_number = 1`, `status = PENDING`, `submitted_for_review_at = NULL` — not yet in `SUPER_ADMIN` review queue) and set `colleges.current_registration_id`
- create `users` (`role = COLLEGE_ADMIN`, `status = ACTIVE`, `email_verified_at = NULL`, `email_released = false`, bound strictly to `college_id`)
- create single-use DB-hashed email verification token (`48-hour` expiry) and enqueue verification email in `outbox_emails`
- record `COLLEGE_REGISTRATION_SUBMITTED` audit event and return `201 Created` directing the administrator to log in immediately to the restricted dashboard

---

# 35. Target Role Validation & One-Time `SUPER_ADMIN` Bootstrap (`ADR-17`)

In the MVP, active `COLLEGE_ADMIN` accounts enter the system **strictly through public college registration** (`users.status = ACTIVE` immediately; management unlocked upon `SUPER_ADMIN` approval). Direct administrative user creation via `POST /api/v1/users` is **not** used in the MVP.

### First-Time `SUPER_ADMIN` Bootstrap (`ADR-17`):
- Provisioned exclusively via an idempotent, guarded Spring `ApplicationRunner` (`SuperAdminBootstrapRunner`) that runs **only when** `app.bootstrap.super-admin.enabled=true` **AND** zero `SUPER_ADMIN` accounts exist in `users`.
- Reads `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_FIRST_NAME`, and `SUPER_ADMIN_LAST_NAME` from environment variables (fails startup fast if missing or violating the 12–128 char / common-password policy), hashes with BCrypt(12), creates `SUPER_ADMIN` (`college_id = NULL`, `status = ACTIVE`, `email_verified_at = NOW()`), and records `SUPER_ADMIN_BOOTSTRAPPED`.
- **Zero public `SUPER_ADMIN` registration endpoint exists.** In production, set `app.bootstrap.super-admin.enabled=false` and remove bootstrap secrets immediately after initial setup.

---

# 36. Tenant Assignment, Generated-Column Constraints & Versioned Schema (`ADR-06`, `ADR-07`, `ADR-09`)

### 36.1 Finalized Single Active `COLLEGE_ADMIN` Constraint (`ADR-06`)
MVP enforces **exactly one active `COLLEGE_ADMIN` per college** atomically at the MySQL 8.0.36 InnoDB layer while preserving a non-unique `users.college_id` FK (1-to-many) for Post-MVP multi-admin extensibility:

```sql
active_college_admin_college_id BIGINT GENERATED ALWAYS AS (
    CASE WHEN role = 'COLLEGE_ADMIN' AND status = 'ACTIVE' THEN college_id ELSE NULL END
) VIRTUAL,
CONSTRAINT uk_users_single_active_college_admin UNIQUE (active_college_admin_college_id)
```

- `VIRTUAL` avoids clustered-row storage duplication while InnoDB enforces atomic B-tree uniqueness across all instances (allowing multiple `NULL` rows for inactive/replaced admins and `SUPER_ADMIN`).
- Enabling Post-MVP multiple active `COLLEGE_ADMIN` accounts requires only dropping this index and generated column in a single Flyway migration.
- Duplicate-key violations map to HTTP `409 Conflict`.

### 36.2 Releasable Email & College Code Constraints (`ADR-09`, `ADR-13`)
- **`users.active_email` (`VIRTUAL` + `UNIQUE`):** `CASE WHEN email_released = FALSE THEN email ELSE NULL END`. `email_released` is set `TRUE` **only** upon permanent rejection (`ADR-09`) or 7-day abandoned-unverified cleanup (`ADR-13`) — **never** for `ACTIVE`, `SUSPENDED`, or replaced/inactive approved-college accounts.
- **`colleges.active_college_code` (`VIRTUAL` + `UNIQUE`):** `CASE WHEN permanently_rejected = FALSE AND archived_at IS NULL THEN code ELSE NULL END`. Releases squatted codes on permanent rejection or 7-day abandoned cleanup while keeping all historical rows intact.

### 36.3 Versioned Registration & Immutable Document Schema (`ADR-07`, `ADR-08`, `ADR-11`)
- **`colleges`:** `id`, `code`, `active_college_code` (`VIRTUAL` + `UNIQUE`), `approval_status`, `status`, `current_registration_id` (FK to active revision), `resubmission_count` (`INT DEFAULT 0`), `action_required_count` (`INT DEFAULT 0`), `permanently_rejected` (`BOOLEAN DEFAULT FALSE`), `archived_at` (`TIMESTAMP NULL`), `version` (`BIGINT` JPA `@Version`).
- **`college_registrations`:** `id`, `college_id` (`NOT NULL` FK), `version_number` (`INT NOT NULL`), `status` (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`), institution snapshot fields, `submitted_for_review_at` (`TIMESTAMP NULL` — pre-queue gate), `reviewer_user_id`, `review_notes`, `rejection_reason`, `is_permanent_rejection`, `reviewed_at`, `created_at`.
  - **Constraint:** `UNIQUE (college_id, version_number)` prevents duplicate revision numbers under concurrent resubmissions.
- **`college_registration_documents`:** `id`, `college_id` (FK for tenant-scoped queries), `registration_id` (FK to immutable revision), `document_category` (`UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`, `INSTITUTION_REGISTRATION_PROOF`, `ADDITIONAL_SUPPORTING_DOCUMENT`), `replaces_document_id` (nullable FK for lineage), `original_filename`, `storage_key` (random UUID), `mime_type`, `file_size_bytes`, `sha256_checksum`, `uploaded_by_user_id`, `uploaded_at`.

---

# 37. Super Admin Review (`expectedVersion`), Permanent Rejection & Transactional Outbox (`ADR-07`, `ADR-09`, `ADR-15`, `ADR-18`)

`SUPER_ADMIN` review endpoints (queue displays **only** verified, submitted applications where `submitted_for_review_at IS NOT NULL`):

```text
GET  /api/v1/college-registrations                       (Paginated verified queue; filter by status)
GET  /api/v1/college-registrations/{id}                  (Application revisions, history & document metadata)
GET  /api/v1/college-registrations/{id}/documents/{docId}(Safely streamed document: Content-Disposition: attachment, nosniff)
POST /api/v1/college-registrations/{id}/approve          (Body: { "expectedVersion": N })
POST /api/v1/college-registrations/{id}/request-action   (Body: { "expectedVersion": N, "notes": "..." })
POST /api/v1/college-registrations/{id}/reject           (Body: { "expectedVersion": N, "reason": "...", "permanent": false })
```

### Optimistic Review Concurrency (`expectedVersion`):
Inside every review transaction, backend locks the parent `colleges` row (`SELECT ... FOR UPDATE`), loads `current_registration_id`, and verifies `current.id == targetId`, `current.version_number == expectedVersion`, `current.submitted_for_review_at != NULL`, and `current.status == PENDING`. Any mismatch (superseded revision or concurrent decision) returns **`409 Conflict` (`REGISTRATION_VERSION_CONFLICT`)**.

### Approval Transaction & Transactional Outbox (`ADR-15`, `ADR-18`):
1. **Atomic DB Transaction:** Verify `expectedVersion` &rarr; transition application `PENDING → APPROVED` (reviewer + timestamp) &rarr; update `colleges` to `approval_status = APPROVED`, `status = ACTIVE` (preserving existing `ACTIVE` `COLLEGE_ADMIN` `user_id` & `college_id`; zero second account/dashboard created) &rarr; insert `COLLEGE_REGISTRATION_APPROVED` audit event &rarr; insert email job into `outbox_emails` &rarr; commit.
2. **Transactional Outbox Worker (Outside DB Transactions):**
   - Table `outbox_emails`: `id`, `event_type`, `recipient_email`, `subject`, `template_key`, `payload_json`, `status` (`PENDING`, `PROCESSING`, `SENT`, `FAILED_PERMANENT`), `attempt_count`, `max_attempts` (`5`), `next_attempt_at`, `last_error`, `created_at`, `sent_at`.
   - Spring `@Scheduled` poller every **10 seconds** claims batches via MySQL 8 **`SELECT ... FOR UPDATE SKIP LOCKED`**, commits `status = PROCESSING`, and invokes `EmailSender` **outside any DB transaction**.
   - Failures retry with exponential backoff (`1m → 5m → 15m → 60m → 180m`) up to **5 attempts** before `FAILED_PERMANENT` alert; stale `PROCESSING` rows (> 5 min) are automatically recovered.
   - Upon `SENT` (or `FAILED_PERMANENT`), raw token values inside `payload_json` are **scrubbed/redacted**.
   - **Email Provider Abstraction (`ADR-15`):** `EmailSender` port uses `JavaMailSender` with **Mailpit** (`localhost:1025`) in `dev` and environment-configured **SMTP/TLS** in `prod` (exact commercial vendor `DEFERRED` to Phase 14 — `ADR-15b`).

### Permanent Rejection (`ADR-09`):
Triggered when `SUPER_ADMIN` sends `"permanent": true` OR rejects revision #4 (`resubmission_count == 3`):
- Sets `colleges.approval_status = REJECTED`, `permanently_rejected = true`, `colleges.status = INACTIVE`.
- Sets `users.status = INACTIVE`, `users.email_released = true` (automatically releasing `active_college_code`, `active_email`, and `active_college_admin_college_id` via `VIRTUAL` generated columns).
- Immediately **revokes ALL active sessions** of that `COLLEGE_ADMIN` via Spring Session JDBC.
- **Permanently retains** all `colleges`, `college_registrations`, `college_registration_documents`, and audit rows.

---

# 38. Restricted Onboarding Dashboard, Document Storage, Cleanup & Feature Unlocking (`ADR-08`, `ADR-11`, `ADR-13`, `ADR-16`)

### Restricted Onboarding Endpoints:
```text
POST /api/v1/auth/verify-email                               (48h single-use DB-hashed token -> sets email_verified_at)
POST /api/v1/auth/resend-verification                        (Rate-limited resend of 48h verification token)
GET  /api/v1/college-registrations/my-application            (Status, version history, feedback, remaining resubmissions)
GET  /api/v1/college-registrations/my-application/documents  (List own documents across versions)
GET  /api/v1/college-registrations/my-application/documents/{docId} (Tenant-scoped stream with safe headers)
POST /api/v1/college-registrations/my-application/documents  (Upload immutable doc — ONLY during pre-submission, ACTION_REQUIRED, or non-permanent REJECTED; blocked while frozen PENDING)
POST /api/v1/college-registrations/my-application/submit     (Pre-submission -> frozen PENDING; requires email_verified_at + required doc categories)
POST /api/v1/college-registrations/my-application/resubmit   (ACTION_REQUIRED cap 10 or non-permanent REJECTED max 3 -> immutable v+1 in frozen PENDING)
```

### Document Validation & Storage Abstraction (`ADR-11`, `ADR-16`):
- **Limits & Categories:** Max **`10 MB`** per file, max **`5` documents per revision**, PDF/JPEG/PNG only (validated by both MIME type and binary magic-byte file signature). Required before submission: `UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`. Optional: `INSTITUTION_REGISTRATION_PROOF`, `ADDITIONAL_SUPPORTING_DOCUMENT`.
- **Immutability:** Every upload inserts a new immutable row (replacements link optional `replaces_document_id`); prior revisions' documents are never modified or deleted. Automated AV/malware scanning is `DEFERRED` to Post-MVP (`ADR-11b`).
- **Storage (`DocumentStorageService`):** Random UUID `storage_key`s (internal paths/bucket URLs never exposed). Dev uses `LocalFileSystemDocumentStorage` outside the webroot (`${APP_STORAGE_LOCAL_DIR}`); Prod uses **private S3-compatible object storage** (exact bucket provider `DEFERRED` to Phase 14 — `ADR-16b`; backed-up local persistent volume acceptable for single-node pilot). All downloads stream through tenant-authorized backend endpoints with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.

### Automated 7-Day Abandoned Registration Cleanup (`ADR-13`):
- Daily `@Scheduled` job soft-archives registrations where `approval_status = 'PENDING' AND status = 'PENDING_VERIFICATION' AND archived_at IS NULL AND submitted_for_review_at IS NULL AND users.email_verified_at IS NULL AND created_at < NOW() - INTERVAL 7 DAY`.
- Sets `colleges.archived_at = NOW()`, `colleges.status = INACTIVE`, `users.status = INACTIVE`, `users.email_released = true`, revokes active sessions, invalidates unused verification tokens, deletes unsubmitted draft files, and logs `ABANDONED_REGISTRATION_ARCHIVED`. Never touches verified, submitted, approved, or reviewed records.

### Feature Unlocking & Suspended College Blocking (`ADR-10`):
- Upon approval, live checks on every academic management endpoint immediately permit access (`managementUnlocked: true` via `GET /api/v1/auth/me`); no second account or dashboard is created.
- If an approved college is later `SUSPENDED` or `INACTIVE`, **all active sessions are revoked immediately** and login attempts return `403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE`.

---

# 39. Student Academic Records vs. User Authentication Accounts

In the MVP, student management exists strictly as an administrative academic capability:

```text
COLLEGE_ADMIN
      ↓
Manages Student Academic Records (POST /api/v1/students)
(Roll numbers, programs, admission years, student profiles)
      ↓
Stored in students table
[Zero entries created in users table]
```

In Post-MVP phases:
- Existing student records will be linked to authentication credentials via a dedicated student provisioning workflow.
- Authentication identity (`users`) and academic identity (`students`) will remain distinct, referenced via foreign keys.

This separation is important because authentication identity and academic identity are different concepts.

---

# 40. User vs Student

Do not assume:

```text
users = students
```

Instead:

```text
User
 ↓
Authentication Identity

Student
 ↓
Academic Identity
```

A student account may reference a student record.

The exact relationship must be defined in the Student Management implementation.

---

# 41. Email Verification & Future Admin Replacement Tokens

- **MVP Email Verification (`ADR-08`):** Newly registered `COLLEGE_ADMIN` accounts receive a single-use, **DB-hashed token with `48-hour` expiry** dispatched via `outbox_emails`. Verification (`POST /api/v1/auth/verify-email`) sets `users.email_verified_at` and is required before submitting the application into the `SUPER_ADMIN` review queue.
- **Post-Approval Activation Not Needed:** Because `COLLEGE_ADMIN` already sets credentials at registration (`users.status = ACTIVE`), approval does not issue a second account-activation token. Token-based password setup applies only to future admin replacement or Post-MVP staff/student provisioning.

---

# 42. Email Change & Re-Verification (`ADR-14`)

- `POST /api/v1/auth/change-email`: Requires current password verification + checks `active_email` uniqueness (`409 Conflict` if taken) + stores normalized address in `users.pending_email` (old `users.email` remains valid for login until confirmed) + invalidates prior unused email-change tokens + queues a single-use DB-hashed `48-hour` token to the new email and a security alert to the old email via `outbox_emails`.
- `POST /api/v1/auth/verify-email-change`: Atomically validates token, re-checks `active_email`, swaps `users.email = pending_email`, clears `pending_email`, sets `email_verified_at = NOW()`, marks token used, **revokes all other active sessions + rotates current session ID**, and records `EMAIL_CHANGED`.
- Unverified registrants (`email_verified_at IS NULL`) may correct a registration email typo (requiring current password), invalidating previous verification tokens and dispatching a fresh 48-hour token.

---

# 43. Password Change

Authenticated users change their password via:

```text
POST /api/v1/auth/change-password
```

Requires valid CSRF (`X-XSRF-TOKEN`), `currentPassword`, and `newPassword`. The backend must verify `currentPassword`, enforce the approved password policy (`12–128` chars, reject common/compromised passwords), hash with `BCrypt(12)`, **revoke all other active sessions + rotate current session ID** (`ADR-05`), and record `PASSWORD_CHANGED`.

---

# 44. Password Reset

Endpoints: `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` (CSRF enforced).

- Generates a cryptographically random, single-use, **DB-hashed token with `1-hour` expiry**, invalidates prior unused reset tokens, and dispatches via `outbox_emails`.
- On `reset-password`, validates token + password policy, hashes with `BCrypt(12)`, marks token used, **revokes ALL active sessions** of the user (`ADR-05`), and records `PASSWORD_RESET_COMPLETED`.
- Always returns a generic `200 OK` on `forgot-password` to prevent account enumeration.

---

# 45. Forgot Password Response

A secure forgot-password response avoids confirming account existence and returns a generic success message.

---

# 46. Password Policy (Finalized)

- **Minimum length:** `12` characters.
- **Maximum length:** `128` characters.
- **Common/Compromised Password Check:** Reject common and known-breached passwords (validated against a curated denylist).
- **Hashing:** `BCryptPasswordEncoder(12)` (**work factor `12`**).

---

# 47. Failed Login Protection (Finalized)

- **Lockout Policy:** **`5` consecutive failed login attempts** trigger a **`15-minute` temporary account lockout** (`locked_until = now() + 15m`), returning `429 Too Many Requests` (`AUTH_ACCOUNT_LOCKED`) and recording `ACCOUNT_LOCKED`.
- Successful login resets `failed_login_attempts = 0` and clears `locked_until`.

---

# 48. Failed Login Event

A failed login attempt generates a security event (`event_type`, `timestamp`, normalized email identifier, client IP via trusted proxy config, reason category). Never log passwords, hashes, session IDs, reset tokens, or verification tokens.

---

# 49. Account & College Status Checks at Login

Every login verifies:
1. User exists (`active_email`) and not locked out.
2. Role in (`SUPER_ADMIN`, `COLLEGE_ADMIN`).
3. `users.status == ACTIVE` and BCrypt(12) password matches.
4. For `COLLEGE_ADMIN`: if `colleges.permanently_rejected == true` &rarr; `403 REGISTRATION_PERMANENTLY_REJECTED`; if `colleges.status == SUSPENDED` or `INACTIVE` &rarr; `403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE` (`ADR-10`).

---

# 50. Suspended Accounts & Suspended Colleges (`ADR-10`)

- Suspending a user or suspending/deactivating an approved college immediately **revokes ALL active sessions** via Spring Session JDBC (`FindByIndexNameSessionRepository`).
- Suspended/inactive colleges cannot log in (`403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE` with safe support-contact message, clearly distinguished from `PENDING` registration).

---

# 51. Session Expiration (`ADR-01`)

Spring Session JDBC enforces **`30-minute` idle timeout** and **`12-hour` absolute lifetime**. Expired/revoked sessions return `401 Unauthorized`; the frontend clears auth state and redirects to `/auth/login`.

---

# 52. Concurrent Sessions (`ADR-01`, `ADR-05`)

Multiple concurrent device sessions per user are **allowed** and indexed by `PRINCIPAL_NAME` in Spring Session JDBC so individual or all sessions can be revoked instantaneously per `ADR-05`.

---

# 53. Security Headers

Backend configures standard HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` in prod, safe `Content-Disposition: attachment` on document downloads).

---

# 54. CORS & Vite Development Proxy (`ADR-04`)

- **Local Development:** Prefer the **Vite development proxy** (`/api` &rarr; `http://localhost:8080`) so frontend and backend share the same origin (`http://localhost:5173`) for seamless `ACADLYTIC_SID` and `XSRF-TOKEN` cookies. Backend CORS also permits `http://localhost:5173` with `allow-credentials: true` and `X-XSRF-TOKEN` included in `allowed-headers`.
- **Production:** Serve SPA and `/api/v1/*` behind the same origin (reverse proxy) to satisfy `__Host-ACADLYTIC_SID` requirements; restrict CORS strictly to trusted origins.

---

# 55. CSRF Protection (Finalized — `ADR-04`)

Because authentication uses stateful HTTP-only cookies, Spring Security 6 SPA CSRF protection is **mandatory** on `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `POST /api/v1/college-registrations`, and all state-changing requests (`CookieCsrfTokenRepository.withHttpOnlyFalse()`, `SpaCsrfTokenRequestHandler`, `GET /api/v1/auth/csrf`, `CsrfCookieFilter`, `403 CSRF_TOKEN_INVALID`).

---

# 56. Authentication & Onboarding API Structure (Separated by Access Level)

Finalized MVP API structure explicitly separated into four access tiers:

```text
# 1. Public Endpoints (Unauthenticated; CSRF enforced on all state-changing POST calls)
GET  /api/v1/auth/csrf                          (204 No Content; initializes XSRF-TOKEN cookie)
POST /api/v1/college-registrations              (IP rate-limited 5/hr + configurable prod CAPTCHA; no multipart docs)
POST /api/v1/auth/login                         (Stateful HTTP-only session cookie issued)
POST /api/v1/auth/forgot-password               (1h single-use DB-hashed token via outbox; generic 200)
POST /api/v1/auth/reset-password                (Revokes ALL sessions)
POST /api/v1/auth/verify-email                  (48h single-use DB-hashed token -> sets email_verified_at)
POST /api/v1/auth/verify-email-change           (48h single-use DB-hashed token -> swaps pending_email)

# 2. Restricted Onboarding Dashboard Endpoints (Authenticated COLLEGE_ADMIN while not permanently rejected/suspended)
POST /api/v1/auth/logout                        (Revokes current session only)
GET  /api/v1/auth/me                            (Returns authoritative user + emailVerified + submittedForReview + collegeApprovalStatus + collegeStatus + managementUnlocked)
POST /api/v1/auth/change-password               (Revokes all OTHER sessions + rotates current session ID)
POST /api/v1/auth/change-email                  (Current password + pending_email + 48h token via outbox)
POST /api/v1/auth/resend-verification           (Rate-limited resend of 48h verification token)
GET  /api/v1/college-registrations/my-application
GET  /api/v1/college-registrations/my-application/documents
GET  /api/v1/college-registrations/my-application/documents/{docId}  (Tenant-scoped stream + safe download headers)
POST /api/v1/college-registrations/my-application/documents          (Allowed ONLY during pre-submission, ACTION_REQUIRED, or non-permanent REJECTED; frozen while PENDING)
POST /api/v1/college-registrations/my-application/submit             (Pre-submission -> frozen PENDING; requires emailVerified + required docs)
POST /api/v1/college-registrations/my-application/resubmit           (ACTION_REQUIRED cap 10 or non-permanent REJECTED max 3 -> immutable v+1 in frozen PENDING)

# 3. Protected Academic Management Endpoints (STRICTLY requires COLLEGE_ADMIN + APPROVED + ACTIVE; 403 otherwise)
GET/PUT /api/v1/colleges/my-college
/api/v1/academic/**
/api/v1/students/**
/api/v1/result-imports/**
/api/v1/backlogs/**
/api/v1/students/{id}/passport
/api/v1/analytics/**

# 4. SUPER_ADMIN Platform Endpoints (STRICTLY requires SUPER_ADMIN; review mutations require expectedVersion)
GET  /api/v1/college-registrations                       (Verified queue: submitted_for_review_at IS NOT NULL)
GET  /api/v1/college-registrations/{id}
GET  /api/v1/college-registrations/{id}/documents/{docId}(Safely streamed document)
POST /api/v1/college-registrations/{id}/approve          (expectedVersion required; 409 on stale)
POST /api/v1/college-registrations/{id}/request-action   (expectedVersion + mandatory notes; safety cap 10)
POST /api/v1/college-registrations/{id}/reject           (expectedVersion + mandatory reason + optional permanent flag)
/api/v1/colleges/**
```

Direct user creation via `POST /api/v1/users` is **not** part of the MVP (deferred to Post-MVP delegated provisioning of `ACADEMIC_STAFF` and `STUDENT` accounts).

---

# 57. Authentication Controller

Controllers should remain thin.

Example conceptual responsibilities:

```text
AuthController
 ├── receive request
 ├── validate DTO
 ├── call authentication service
 └── return response
```

Controllers should not contain:

- password hashing logic
- tenant business logic
- database queries
- authorization workflows

---

# 58. Authentication Service

The authentication service should coordinate:

- credential validation (BCrypt work factor 12)
- brute-force lockout (`5` failures &rarr; `15` min)
- user & college status validation (blocking suspended/inactive/permanently rejected colleges with `403`)
- Spring Session JDBC establishment, session ID rotation, and single/bulk session revocation
- current-user and authoritative college approval context (`/api/v1/auth/me`)
- security and audit events

The exact service structure should follow the backend foundation.

---

# 59. Account Onboarding & Provisioning Service

Account establishment and verification lifecycle transitions should be implemented as dedicated application/domain operations.

MVP responsibilities include:

- public college registration intake (rate-limited `5/IP/hr` + configurable prod CAPTCHA): validate institution data, password policy (`12–128`, reject common/compromised), `active_email` & `active_college_code` uniqueness; atomically create restricted `colleges` context (`PENDING`/`PENDING_VERIFICATION`), `v1` application (`submitted_for_review_at = NULL`), `ACTIVE` `COLLEGE_ADMIN` user (`email_verified_at = NULL`, guarded by `VIRTUAL` unique index), 48h hashed token, and `outbox_emails` job
- restricted onboarding operations: email verification (`48h` token), authenticated immutable document uploads (`DocumentStorageService`, PDF/JPEG/PNG, &le;10 MB, &le;5/rev, MIME + magic-byte check), Submit for Review into frozen `PENDING`, and bounded versioned resubmission (`ACTION_REQUIRED` cap 10 / `REJECTED` max 3) preserving all prior versions, documents, and decisions
- `SUPER_ADMIN` approval: lock `colleges` row, verify `expectedVersion` (`409` on stale), mark `APPROVED`, transition `colleges` to `APPROVED` & `ACTIVE` (unlocking existing `ACTIVE` `COLLEGE_ADMIN` dashboard), record audit + `outbox_emails` (dispatched outside DB tx via `SKIP LOCKED` poller)
- `SUPER_ADMIN` action request, non-permanent rejection, and permanent rejection (deactivating college & user, revoking all sessions, releasing `active_college_code`/`active_email`/admin slot, retaining full audit history)
- 7-day automated soft-archive cleanup of abandoned unverified + unsubmitted registrations (`ADR-13`)

Post-MVP delegated provisioning (`ACADEMIC_STAFF`, `STUDENT`) will extend this service with creator authorization and student record linking.

---

# 60. Authorization Service

Authorization should provide reusable checks where appropriate.

MVP checks:

```text
canReviewCollegeRegistration()
canApproveCollegeRegistration()
canAccessRestrictedOnboardingDashboard()
requireApprovedAndActiveCollege()       // 403 COLLEGE_NOT_APPROVED if unapproved; 403 COLLEGE_SUSPENDED / INACTIVE if suspended/inactive
canManageCollege()
canViewStudent()
canProcessResults()
canAccessCollege()
```

Post-MVP checks (e.g., `canCreateUser()`, `canManageUser()`) will be added when `ACADEMIC_STAFF` and `STUDENT` account provisioning are introduced.

Avoid scattering role strings or approval-status checks throughout controllers.

---

# 61. Role Constants

Role names should be represented consistently.

Do not use arbitrary strings throughout the codebase:

```text
"admin"
"ADMIN"
"collegeAdmin"
"college_admin"
```

Use one authoritative representation.

---

# 62. Permission Model

The MVP may begin with role-based authorization.

Conceptually:

```text
Role
 ↓
Permissions
 ↓
Resource / Action
```

A more granular permission system may be introduced later if required.

Do not over-engineer permissions before actual requirements justify them.

---

# 63. Backend Request Context

Authenticated requests should expose trusted user context to the application layer.

Conceptually:

```text
HTTP Request
 ↓
Spring Security
 ↓
Authenticated Principal
 ↓
Application Security Context
 ↓
Tenant Context
 ↓
Service
```

Business services should not repeatedly parse raw authentication headers.

---

# 64. Security Context

The security context should provide enough information for:

- user identity
- role
- college/tenant
- authorization decisions

Sensitive authentication credentials should not be propagated unnecessarily through application layers.

---

# 65. Frontend Authentication Service

Frontend authentication API methods should be centralized.

Conceptual:

```text
authApi.login()
authApi.logout()
authApi.forgotPassword()
authApi.resetPassword()
authApi.getCurrentUser()
authApi.changePassword()
```

Components should not construct authentication requests manually.

---

# 66. Frontend Auth Hook

A centralized hook may expose:

```text
useAuth()
```

Possible responsibilities:

- current user
- authentication status
- login action
- logout action
- role information

It should not become a replacement for TanStack Query.

---

# 67. Current User Query

Current user information should be treated as server state.

Conceptually:

```text
useCurrentUser()
       ↓
GET /api/v1/auth/me
       ↓
TanStack Query
```

The application should use this state to determine authenticated UI and observe live approval-state transitions.

---

# 68. Authentication Loading Screen

During initial authentication resolution, the application should show a controlled loading state.

Avoid:

```text
Login Page
   ↓
Dashboard flashes
   ↓
Login Page again
```

Authentication initialization should be coordinated with routing.

---

# 69. Unauthorized Page

A dedicated unauthorized page should exist for authenticated users who lack permission.

Route concept:

```text
/app/unauthorized
```

or an equivalent application-level route.

It should explain that the current account does not have permission to access the requested resource.

---

# 70. Not Found vs Unauthorized

These states must remain distinct.

### 401

User is not authenticated.

Typical response:

```text
Login required
```

### 403

User is authenticated but not authorized.

Typical response:

```text
You do not have permission to access this page.
```

### 404

Requested resource/page does not exist or is intentionally not exposed.

---

# 71. Account Enumeration Protection

Authentication flows should avoid revealing unnecessary information such as:

```text
This email exists.
```

or:

```text
This email does not exist.
```

where doing so creates account enumeration risk.

This is especially important for password reset.

---

# 72. Audit Events

Important onboarding, authentication, and administrative events must be auditable.

Core audit events:

```text
COLLEGE_REGISTRATION_SUBMITTED       (Public registration + restricted context & proposed admin created)
COLLEGE_REGISTRATION_DOC_UPLOADED    (Verification document uploaded/updated on restricted dashboard)
COLLEGE_REGISTRATION_ACTION_REQUIRED (SUPER_ADMIN requests corrections/documents; mandatory notes)
COLLEGE_REGISTRATION_RESUBMITTED     (College submits revised application version v+1 -> PENDING)
COLLEGE_REGISTRATION_REJECTED        (SUPER_ADMIN rejection; mandatory reason logged)
COLLEGE_REGISTRATION_APPROVED        (SUPER_ADMIN approval; tenant & existing COLLEGE_ADMIN activated)
LOGIN_SUCCESS                        (Successful authentication)
LOGIN_FAILURE                        (Invalid credentials or blocked status)
ACCOUNT_LOCKED                       (Brute-force lockout triggered)
LOGOUT                               (Active session/token terminated)
PASSWORD_CHANGED                     (Authenticated password change)
PASSWORD_RESET_REQUESTED             (Password reset token issued)
PASSWORD_RESET_COMPLETED             (Password reset token redeemed)
ACCOUNT_SUSPENDED                    (Account locked by administrator)
ACCOUNT_REACTIVATED                  (Account restored by administrator)
```

The final event taxonomy must be standardized across backend modules.

---

# 73. Audit Actor

For administrative and onboarding operations, audit records must capture:

```text
Actor
Action
Target
Timestamp
Result
Metadata
```

Examples:

```text
SUPER_ADMIN
    ↓
Approved College Application (SXIE, v2)
    ↓
Activated college_id: 12 & existing COLLEGE_ADMIN user_id: 45
    ↓
Timestamp: 2026-10-15T10:30:00Z
    ↓
Result: SUCCESS
```

and:

```text
COLLEGE_ADMIN (user_id: 45, college_id: 12)
    ↓
Resubmitted Revised College Application (v1 ACTION_REQUIRED → v2 PENDING)
    ↓
Preserved prior version v1, documents & reviewer feedback
    ↓
Timestamp: 2026-10-15T09:45:00Z
    ↓
Result: SUCCESS
```

---

# 74. Security Event vs Audit Event

These concepts may overlap but should remain semantically clear.

### Security Event

Security-sensitive activity:

- failed login attempts
- brute-force lockout triggered
- password reset requested/completed
- blocked management API access attempt by unapproved college (`403 COLLEGE_NOT_APPROVED`)
- verification/reset token anomaly or replay attempt

### Audit Event

Administrative and onboarding lifecycle activity:

- college registration submitted (`v1`)
- verification document uploaded
- college registration marked `ACTION_REQUIRED` or `REJECTED` (with mandatory notes/reason)
- college application resubmitted (`v+1`)
- college registration approved (tenant & existing `COLLEGE_ADMIN` activated)
- college tenant status changed (activated/suspended)
- role changed (Post-MVP)

The implementation may store these together or separately depending on the final design.

---

# 75. Sensitive Logging Rules

Never log:

```text
password
password_hash
authentication token
activation token
reset token
session secret
```

Avoid logging unnecessary student academic information during authentication flows.

---

# 76. Onboarding & Account Validation Pipeline

### 1. Public College Registration Validation (Atomic DB Transaction):
```text
Enforce CSRF + IP Rate Limit (5/IP/hr) + Configurable Prod CAPTCHA
       ↓
Validate Institution & Proposed Admin Fields (No Public Multipart Docs)
       ↓
Validate Password Policy (12–128 chars; reject common/compromised passwords)
       ↓
Normalize Email & Code; Verify active_email & active_college_code Uniqueness
       ↓
Reject/Strip Untrusted role, college_id, approval_status Fields
       ↓
Hash Password (BCrypt work factor 12)
       ↓
Create Restricted College Context (colleges: PENDING / PENDING_VERIFICATION)
       ↓
Persist Application v1 (college_registrations: PENDING, submitted_for_review_at = NULL)
       ↓
Create Proposed COLLEGE_ADMIN User (ACTIVE, email_verified_at = NULL; guarded by VIRTUAL unique index)
       ↓
Create 48h DB-Hashed Email Verification Token + Insert outbox_emails + Audit Event
```

### 2. Pre-Submission Submit & Resubmission Validation:
```text
Authenticate COLLEGE_ADMIN (Spring Session JDBC) & Derive college_id Server-Side
       ↓
- Initial Submit: Verify email_verified_at != NULL + Required Docs Present -> Set submitted_for_review_at = NOW() (Frozen PENDING)
- Resubmit: Lock colleges row -> Verify status in (ACTION_REQUIRED [cap 10], Non-Permanent REJECTED [max 3])
            -> Insert Immutable v+1 (PENDING, submitted_for_review_at = NOW()) -> Update current_registration_id
            -> Audit Event (COLLEGE_REGISTRATION_QUEUED / COLLEGE_REGISTRATION_RESUBMITTED)
```

### 3. Approval Validation & Transactional Outbox Dispatch (`ADR-07`, `ADR-18`):
```text
[Database Approval Transaction]:
Authenticate SUPER_ADMIN + Lock colleges Row (SELECT ... FOR UPDATE)
       ↓
Verify current_registration_id == targetId AND version_number == expectedVersion (409 on stale)
       ↓
Verify submitted_for_review_at != NULL AND status == PENDING
       ↓
Update Registration status = APPROVED (reviewer + timestamp)
       ↓
Update colleges: approval_status = APPROVED, status = ACTIVE
(Existing ACTIVE COLLEGE_ADMIN preserves exact user_id & college_id; zero second account created)
       ↓
Insert Audit Event (COLLEGE_REGISTRATION_APPROVED) + Insert outbox_emails Row
       ↓
Commit Transaction
       │
       ▼ [Outbox Poller — Every 10s, Outside DB Transactions]:
Claim Batch via SELECT ... FOR UPDATE SKIP LOCKED -> Mark PROCESSING -> Commit
       ↓
Send Email via EmailSender (Mailpit Dev / Env SMTP+TLS Prod)
       ↓
Mark SENT & Scrub Raw Tokens (or Exponential Backoff up to 5 Attempts -> FAILED_PERMANENT)
```

---

# 77. Duplicate Email Handling

If an email already exists in `active_email`, registration or email change returns `409 Conflict`. Do not create duplicate active identities.

---

# 78. Registration, Resubmission & Approval Transactions

- **Registration DB Transaction:** Create `colleges` + `college_registrations` v1 (`submitted_for_review_at = NULL`) + `users` (`ACTIVE`, `email_verified_at = NULL`) + 48h hashed verification token + `outbox_emails` row + `COLLEGE_REGISTRATION_SUBMITTED` audit event atomically.
- **Resubmission DB Transaction:** Lock `colleges` row + verify bounded caps (`ACTION_REQUIRED` &le; 10; `REJECTED` &le; 3, not permanently rejected) + insert immutable `v+1` (`PENDING`, `submitted_for_review_at = NOW()`) + update `current_registration_id` & `colleges.approval_status = PENDING` + audit event without mutating prior versions, documents, or review decisions.
- **Approval DB Transaction:** Lock `colleges` row + verify `expectedVersion` (`409` on stale) + mark `APPROVED` + update `colleges` (`APPROVED`, `ACTIVE`) + audit event + `outbox_emails` row atomically.
- **Outbox Email Delivery (Outside DB Transactions):** Emails are never dispatched inside DB transactions; `outbox_emails` poller claims rows via `FOR UPDATE SKIP LOCKED` and invokes `EmailSender` outside DB transactions (`ADR-18`).

---

# 79. Student Account Linking (Post-MVP)

In Post-MVP phases, when `STUDENT` authentication is introduced, creating a student authentication account will link to the existing student academic record rather than creating a duplicate academic identity.

---

# 80. Role Change

Role changes are security-sensitive and (when introduced post-MVP) require explicit authorization, validation, session ID rotation/revocation, and audit logging.

---

# 81. College Admin Replacement

Because MVP enforces **exactly one active `COLLEGE_ADMIN` per college** via the MySQL 8 `VIRTUAL` generated column + `UNIQUE` index (`ADR-06`), replacing a College Admin requires deactivating the existing administrator (`users.status = INACTIVE`, `email_released = false`), immediately revoking **all** active sessions of the outgoing admin (`ADR-05`), and onboarding the replacement `COLLEGE_ADMIN`. Because `users.college_id` remains non-unique (1-to-many), Post-MVP multi-admin support requires only dropping the generated column/index with zero schema redesign.

---

# 82. Account Deactivation

Deactivation should normally preserve:

- account identity
- audit history
- related academic history

The account should become unable to authenticate.

---

# 83. Authentication & Onboarding Test Strategy (`ADR-19`)

- **Integration, Migration & Concurrency Tests:** Execute against **Testcontainers MySQL `8.0.36`** (matching `docker-compose.yml` identically) — do **not** rely on H2 for MySQL-specific `VIRTUAL` generated columns, unique indexes, `FOR UPDATE SKIP LOCKED`, Flyway migrations, or Spring Session JDBC tests.
- **Unit Tests:** Pure domain services, password policy checks, magic-byte file validators, and rate-limiter logic run with JUnit 5 + Mockito.

Tests must cover:
- **Stateful Sessions, Cookies & SPA CSRF:** `GET /api/v1/auth/csrf`, login/logout/registration CSRF enforcement (`403 CSRF_TOKEN_INVALID`), `30m` idle + `12h` absolute expiry, session ID rotation on login/password change/email change, Spring Session JDBC persistence & targeted vs. all-session revocation (`ADR-05`), `__Host-ACADLYTIC_SID` prod attributes (`Secure=true`, `Path=/`, no `Domain`).
- **Registration, Rate Limiting & Pre-Queue Onboarding:** IP rate limit (`5/IP/hr` &rarr; `429` + `Retry-After`), BCrypt(12) + `12–128` char/common-password rejection, immediate restricted login (`users.status = ACTIVE`, `emailVerified = false`, `submittedForReview = false`), 48h hashed email verification, immutable document uploads (PDF/JPEG/PNG, &le;10 MB, &le;5/rev, MIME + magic-byte validation, tenant-scoped streaming + safe download headers), Submit for Review into frozen `PENDING` (edits/uploads rejected while `PENDING`), and 7-day abandoned-registration soft-archive cleanup (`ADR-13`).
- **`SUPER_ADMIN` Review (`expectedVersion`), Bounded Resubmission & Permanent Rejection:** `409 Conflict` on stale `expectedVersion`, `ACTION_REQUIRED` (safety cap 10) & `REJECTED` (max 3 revisions) creating immutable `v+1` revisions preserving history, permanent rejection (`permanent: true` or 3rd revision rejected) setting `INACTIVE`, revoking all sessions, releasing `active_college_code`/`active_email`/admin slot while keeping history, and `approve` unlocking existing dashboard + queuing `outbox_emails` (`SKIP LOCKED` poller, 5-attempt backoff, token scrubbing).
- **Single-Admin Constraint & Email Change:** Concurrent second active `COLLEGE_ADMIN` rejected by MySQL 8 `VIRTUAL` unique index (`409 Conflict`); email change keeps old email valid via `pending_email` until 48h token confirmed and revokes other sessions.
- **Suspended Colleges & Lockout:** Suspended/inactive college login blocked (`403 COLLEGE_SUSPENDED`/`COLLEGE_INACTIVE`) + all sessions revoked; 5 failed logins &rarr; 15-minute lockout (`429`).

---

# 84. Tenant Isolation Tests

Tests must explicitly verify across multiple tenants (College A vs. College B):
- direct ID manipulation across college boundaries (both academic resources and onboarding documents/applications)
- query/path/POST payload cross-tenant tampering
- `PENDING`, `ACTION_REQUIRED`, and `REJECTED` colleges calling any academic management endpoint receive `403 COLLEGE_NOT_APPROVED`
- `SUSPENDED` / `INACTIVE` approved colleges receive `403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE` and have all sessions revoked

---

# 85. Authorization Test Matrix

| Operation | Super Admin | College Admin (Pre-Submission `PENDING`) | College Admin (Frozen `PENDING`) | College Admin (`ACTION_REQUIRED` / Non-Perm `REJECTED`) | College Admin (Perm `REJECTED` / `SUSPENDED`) | College Admin (`APPROVED` & `ACTIVE`) | Public Visitor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /api/v1/auth/csrf` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Submit College Registration (`5/IP/hr`) | No | No | No | No | No | No | **Yes** |
| Login (`/auth/login`) | **Yes** | **Yes** | **Yes** | **Yes** | **No (`403`)** | **Yes** | No |
| Current User (`/auth/me`) | **Yes** | **Yes** | **Yes** | **Yes** | **No** | **Yes** | No |
| Verify Email / Upload Docs / Submit | No | **Own College** | **Frozen (`409`/`403`)** | **Upload & Resubmit** | **No** | Read-Only History | Verify Token |
| Review / Approve / Request Action / Reject (`expectedVersion`) | **Yes** | No (`403`) | No (`403`) | No (`403`) | No | No (`403`) | No |
| Academic Management APIs | Platform Scope | **No (`403`)** | **No (`403`)** | **No (`403`)** | **No (`403`)** | **Own College** | No |
| Manage Other College Data | Platform Scope | **No (`403`)** | **No (`403`)** | **No (`403`)** | **No** | **No (`403`)** | No |

*(Note: `ACADEMIC_STAFF`, `STUDENT` login, and `BRANCH_ADMIN`/branch management are strictly Post-MVP; no branch tables or branch functionality exist in the MVP.)*

---

# 86. Frontend Authentication & Onboarding Tests

- Vite dev proxy same-origin cookie + Axios `XSRF-TOKEN` / `X-XSRF-TOKEN` integration (including CSRF retry/error handling on `403 CSRF_TOKEN_INVALID`)
- Public registration form (`/register-college` — institution profile + 12–128 char password; optional prod CAPTCHA; no multipart doc upload)
- Immediate login to Restricted Dashboard: email verification banner/resend, document upload (PDF/JPEG/PNG &le;10 MB, required categories), Submit for Review &rarr; frozen `PENDING` UI
- `ACTION_REQUIRED` & `REJECTED` feedback banners, remaining resubmission counter, new immutable document upload, and resubmission workflow
- Automatic transition to Full College Management Dashboard when `GET /api/v1/auth/me` returns `managementUnlocked: true`
- Suspended college login error display (`COLLEGE_SUSPENDED`), logout clearing state, session expiry redirect, and `/admin/*` + `/college/*` route guards

---

# 87. Security Test Cases

```text
□ No JWT issued or accepted anywhere; stateful HTTP-only Spring Session JDBC cookies only
□ Production __Host-ACADLYTIC_SID cookie sets Secure=true, Path=/, HttpOnly=true, SameSite=Lax, and NO Domain attribute
□ Missing/invalid X-XSRF-TOKEN on login, logout, registration, or any mutation returns 403 CSRF_TOKEN_INVALID
□ Public registration rate-limited at 5/IP/hr (429 + Retry-After); spoofed X-Forwarded-For ignored
□ Public registration cannot supply role, college_id, approval_status, or upload unauthenticated files
□ Unverified / unsubmitted registrations never appear in SUPER_ADMIN review queue and are soft-archived after 7 days
□ Edits and document uploads blocked while application is in frozen PENDING review queue
□ Stale expectedVersion on SUPER_ADMIN approve/request-action/reject returns 409 Conflict
□ Non-permanent REJECTED allows max 3 revised applications; permanent rejection revokes ALL sessions and releases code/email/slot while retaining history
□ Suspended college login blocked (403 COLLEGE_SUSPENDED) and ALL active sessions revoked immediately
□ Concurrent second active COLLEGE_ADMIN blocked by MySQL 8 VIRTUAL unique index (409 Conflict)
□ Document upload rejects non-PDF/JPEG/PNG magic bytes, files >10 MB, and >5 docs/revision; downloads enforce tenant check + Content-Disposition: attachment + nosniff
□ Outbox emails dispatched outside DB transactions via SKIP LOCKED and scrubbed of raw tokens post-send
□ Passwords (BCrypt 12, 12–128 chars, common/breached rejected), session IDs, reset tokens, and verification tokens never appear in API responses or logs
```

---

# 88. Authentication & Onboarding Implementation Sequence

```text
1. Add dependencies (`spring-session-jdbc`, `spring-boot-starter-mail`, Testcontainers MySQL 8) and configure Mailpit in dev docker-compose
2. Write Flyway migrations: Spring Session JDBC tables, `colleges` (with `active_college_code` VIRTUAL unique), `users` (with `active_college_admin_college_id` and `active_email` VIRTUAL uniques, `college_id` non-unique), `college_registrations` (`UNIQUE (college_id, version_number)`), `college_registration_documents`, token tables, `outbox_emails`, and `audit_events` (zero branch tables)
3. Configure Spring Security 6: stateful Spring Session JDBC (`30m` idle / `12h` absolute), `__Host-ACADLYTIC_SID`/`ACADLYTIC_SID` cookies, SPA CSRF (`CookieCsrfTokenRepository`, `SpaCsrfTokenRequestHandler`, `CsrfCookieFilter`, `GET /api/v1/auth/csrf`), `BCryptPasswordEncoder(12)`, and CORS (`X-XSRF-TOKEN` allowed)
4. Implement `SuperAdminBootstrapRunner` (one-time env-driven bootstrap; zero public endpoint)
5. Implement `RateLimiter` (5/IP/hr, `429` + `Retry-After`) + configurable `CaptchaVerifier`, password policy (12–128 + common/breached denylist), and `POST /api/v1/college-registrations`
6. Implement `POST /api/v1/auth/login` (5 fails -> 15m lockout; suspended college block), `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, session revocation service, password change/reset, email verification (48h), and email change (`pending_email` + 48h)
7. Implement `EmailSender` (Mailpit dev / env SMTP+TLS prod) and `outbox_emails` 10s `@Scheduled` poller (`FOR UPDATE SKIP LOCKED`, 5-attempt exponential backoff, stale recovery, post-send token scrubbing)
8. Implement `DocumentStorageService` (local outside webroot dev / private S3-compatible prod), magic-byte + MIME validator, and tenant-scoped restricted onboarding APIs (`/my-application/**`, `/documents`, `/submit`, `/resubmit`)
9. Implement `SUPER_ADMIN` verified review queue and `expectedVersion`-guarded `approve`, `request-action`, `reject`, and permanent rejection APIs
10. Implement live `requireApprovedAndActiveCollege()` guard (`403 COLLEGE_NOT_APPROVED` / `COLLEGE_SUSPENDED`) and daily 7-day abandoned-registration soft-archive job
11. Implement frontend Vite dev proxy, Axios CSRF wiring, `/register-college`, `/verify-email`, `/auth/login`, Restricted College Dashboard, `/admin/registrations`, and role + approval-state route guards
12. Execute JUnit 5/Mockito unit tests + Testcontainers MySQL 8.0.36 integration, migration, concurrency, outbox, and security/IDOR tests
```

---

# 89. Authentication & Onboarding Acceptance Criteria

- [ ] Stateful HTTP-only Spring Session JDBC sessions (`30m` idle / `12h` max, `__Host-ACADLYTIC_SID` in prod) + SPA CSRF work via Vite dev proxy with zero JWT.
- [ ] One-time env-driven `SUPER_ADMIN` bootstrap succeeds without any public endpoint.
- [ ] Public registration enforces `5/IP/hr` rate limiting, `12–128` char password policy + common/breached rejection, BCrypt(12), creates restricted college context + `ACTIVE` user (`email_verified_at = NULL`, `submitted_for_review_at = NULL`), and enqueues 48h verification email via `outbox_emails`.
- [ ] College logs in immediately, verifies email, uploads required immutable documents (PDF/JPEG/PNG, &le;10 MB, &le;5/rev, MIME + magic-byte validated, stored outside webroot), and clicks Submit for Review into frozen `PENDING`.
- [ ] Academic management APIs return `403 COLLEGE_NOT_APPROVED` while unapproved and `403 COLLEGE_SUSPENDED`/`COLLEGE_INACTIVE` (with login blocked + all sessions revoked) if suspended.
- [ ] `SUPER_ADMIN` review actions enforce `expectedVersion` (`409` on stale), support `ACTION_REQUIRED` (cap 10), `REJECTED` (max 3 revisions), permanent rejection (deactivation + session revocation + reservation release + history retained), and `APPROVED` (unlocks existing dashboard; outbox email sent via `SKIP LOCKED`).
- [ ] MySQL 8 `VIRTUAL` generated columns enforce 1 active `COLLEGE_ADMIN`/college, `active_email`, and `active_college_code` (verified on Testcontainers MySQL `8.0.36`).
- [ ] 7-day abandoned-registration cleanup, email change (`pending_email`), password change/reset, 5-failure lockout, and session revocation rules pass all tests with zero secret/token logging.

---

# 90. Definition of Done

`authentication-implementation.md` is considered implemented when all acceptance criteria in Section 89 pass against **Testcontainers MySQL `8.0.36`** and frontend integration tests, zero JWT code exists, no branch tables exist in MVP, and no passwords, session IDs, reset tokens, or verification tokens are logged or exposed.

---

# 91. Finalized & Deferred Architecture Decisions Register

### Finalized Decisions (`APPROVED` — Locked for Phase 02–03 Implementation)
- **Authentication & Sessions:** Stateful HTTP-only session cookies via **Spring Session JDBC with MySQL** (`ADR-02`, no JWT); `30-min` idle / `12-hour` absolute lifetime, multi-device allowed, session ID rotation on login & privilege changes (`ADR-01`); `ACADLYTIC_SID` (dev) / `__Host-ACADLYTIC_SID` (`Secure=true`, `Path=/`, no `Domain`) (prod) (`ADR-03`); Spring Security 6 SPA CSRF + Vite dev proxy (`ADR-04`); granular single vs. all-session revocation matrix (`ADR-05`).
- **Database Constraints & Onboarding Lifecycle:** MySQL 8 `VIRTUAL` generated column `active_college_admin_college_id` + `UNIQUE` index (`ADR-06`, `users.college_id` non-unique); `UNIQUE (college_id, version_number)` + `current_registration_id` + `expectedVersion` (`409` on stale) + max `3` `REJECTED` revisions + safety cap `10` `ACTION_REQUIRED` (`ADR-07`); 4 statuses with `email_verified_at` + `submitted_for_review_at` pre-queue gate (`ADR-08`); permanent rejection deactivating college/user, revoking all sessions, releasing `active_college_code`/`active_email` (`email_released = true` strictly on permanent rejection or abandoned cleanup)/admin slot while retaining history (`ADR-09`); suspended colleges blocked from login + all sessions revoked (`ADR-10`).
- **Security, Documents, Email & Testing:** BCrypt(12), `12–128` chars + reject common/compromised passwords, 1h reset token & 48h verification token (single-use DB-hashed), 5 failures &rarr; 15m lockout; max `5` docs/rev, `10 MB` each, PDF/JPEG/PNG, MIME + magic-byte check, required categories (`UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`), immutable rows (`ADR-11`); `5/IP/hr` registration rate limit (`429` + `Retry-After`) + configurable prod CAPTCHA (`ADR-12`); 7-day automated soft-archive cleanup (`ADR-13`); verified email change via `pending_email` (`ADR-14`); `EmailSender` port + Mailpit (dev) + env SMTP/TLS (prod) (`ADR-15`); `DocumentStorageService` + local outside webroot (dev) + private S3-compatible storage streamed through backend (prod) (`ADR-16`); one-time env-driven `SuperAdminBootstrapRunner` (`ADR-17`); `outbox_emails` 10s `@Scheduled` poller with `FOR UPDATE SKIP LOCKED`, 5-attempt backoff, stale recovery, post-send token scrubbing (`ADR-18`); Testcontainers MySQL `8.0.36` + JUnit 5/Mockito (`ADR-19`).

### Explicitly Deferred Decisions (`DEFERRED` — Non-Blocking for Phase 02–03)

| ID | Decision | Owner | Reason | Resolve Before |
|---|---|---|---|---|
| **ADR-11b** | Automated Document Malware Scanning (AV) | Security / Backend Lead | Avoid ClamAV container/ops overhead in MVP while enforcing MIME + magic-byte allow-list, 10 MB cap, random UUID keys outside webroot, and safe download headers | Post-MVP Production Hardening (Phase 18.7) |
| **ADR-15b** | Specific Commercial Production SMTP Vendor | Platform / DevOps Lead | `EmailSender` abstraction + env-configured SMTP/TLS + Mailpit (dev) completely decouple backend code from vendor selection | Phase 14 (MVP Release Gate & Pilot Deployment) |
| **ADR-16b** | Specific Production S3-Compatible Cloud Bucket Provider | Platform / DevOps Lead | `DocumentStorageService` abstraction + local dev storage decouple cloud provider selection (backed-up local volume also supported for single-node pilot) | Phase 14 (MVP Release Gate & Pilot Deployment) |

---

# 92. Relationship With Other Documents

This document depends on:

```text
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/frontend-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md

06-design/navigation.md
06-design/page-specifications.md

07-project-rules/coding-rules.md
07-project-rules/frontend-rules.md
07-project-rules/backend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/authentication.md

09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
09-development/implementation-notes/frontend-foundation.md
09-development/implementation-notes/database-setup.md
```

It supports the later implementation of:

```text
college-management-implementation.md
academic-structure-implementation.md
student-management-implementation.md
result-import-implementation.md
result-validation-implementation.md
result-processing-implementation.md
backlog-implementation.md
academic-passport-implementation.md
analytics-implementation.md
student-portal-implementation.md         (Post-MVP)
```

---

# 93. Status

**Approved / Implementation Ready**

All Phase 02–03 architectural and security decisions (`ADR-01` – `ADR-19`) have been formally reviewed and approved. Deployment-only vendor choices (`ADR-15b`, `ADR-16b`) and Post-MVP malware scanning (`ADR-11b`) are explicitly tracked as `DEFERRED` without blocking backend implementation.

---

# 94. Final Authentication Principle

Acadlytic authentication must follow this principle:

> **Authenticate the identity, authorize the action, derive the tenant from trusted context, preserve auditability, and never rely on the frontend as the security boundary.**

For Acadlytic specifically:

```text
Identity
   ↓
Authentication
   ↓
Role
   ↓
Tenant
   ↓
Authorization
   ↓
Resource Ownership
   ↓
Action
```

Every protected operation must pass through the appropriate parts of this chain.