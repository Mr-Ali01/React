# Acadlytic — Development Roadmap

**Document:** `08-task-breakdown/roadmap.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Type:** Implementation Roadmap Specification  
**Status:** Draft / Under Review  
**Version:** 1.0  
**Last Updated:** 2026-10-15 (Revised for SaaS Customer Onboarding & Registration Approval)

---

# 1. Purpose

This document defines the implementation roadmap for Acadlytic.

The roadmap translates the approved product scope, two-role MVP strategy, architecture, feature specifications, design guidelines, engineering rules, and security requirements into a structured, sequential delivery plan.

It establishes:

- The **module-by-module, backend-first** engineering strategy.
- The 14-stage sequence for delivering the Minimum Viable Product (MVP).
- The explicit separation between MVP deliverables and post-MVP enhancements.
- Quality gates, testing milestones, and release exit criteria for each phase.

---

# 2. Core Implementation Strategy: Backend-First, Module-by-Module

Acadlytic will **not** build the entire backend first followed by the entire frontend.

Instead, each functional domain is built and verified **module-by-module**. Within each module, implementation proceeds **backend-first** to guarantee that data integrity, business logic, authorization, and API contracts are fully validated before frontend integration begins.

### The 9-Step Module Implementation Cycle

For every module in the roadmap, the engineering team must follow this exact sequence:

```text
1. Review Feature Specification & Implementation Notes
       ↓
2. Implement Module Backend (Entities, Repositories, Domain Services, REST Controllers)
       ↓
3. Implement Backend Unit and Integration Tests (JUnit, Spring Boot Test)
       ↓
4. Verify APIs via Swagger/OpenAPI, Postman, or cURL (Contract Verification)
       ↓
5. Implement Corresponding Frontend Feature (Components, Pages, Hooks, Zod Schemas)
       ↓
6. Integrate Frontend with Backend APIs (TanStack Query, Axios Client)
       ↓
7. Test Complete Module Workflow (Interactive verification, error states, empty states)
       ↓
8. Fix Issues & Verify Acceptance Criteria (Cross-layer review)
       ↓
9. Mark Module Complete before starting the next module
```

### Strategic Advantage:
- Ensures a working, testable vertical slice at the end of every module.
- Prevents frontend developers from mocking data or inventing speculative API contracts.
- Eliminates late-stage integration surprises.
- Validates multi-tenant isolation and security constraints immediately at the module boundary.

---

# 3. Master Implementation Roadmap

The Acadlytic development lifecycle is organized into two distinct release boundaries:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MVP IMPLEMENTATION PHASES                       │
│                        (Two Active Roles: SUPER_ADMIN & COLLEGE_ADMIN) │
└────────────────────────────────────────────────────────────────────────┘
Phase 01: Project & Application Foundation
    ↓
Phase 02: Authentication & Authorization Foundation
    ↓
Phase 03: College Registration, Restricted Dashboard & Approval Workflow
    ↓
Phase 04: College Management (Tenant Management & Profile)
    ↓
Phase 05: Academic Structure (Programs, Semesters, Subjects, Credits)
    ↓
Phase 06: Student Records Management (Records & Enrollment)
    ↓
Phase 07: Result Import (Excel & CSV Parsing & Ingestion)
    ↓
Phase 08: Result Validation & Error Resolution
    ↓
Phase 09: Result Processing (Authoritative Mutation & Attempt Histories)
    ↓
Phase 10: Backlog Lifecycle Tracking (OPEN / RESOLVED States)
    ↓
Phase 11: Academic Passport (Administrative Read Model)
    ↓
Phase 12: College Academic Analytics (Institutional Dashboards)
    ↓
Phase 13: End-to-End Integration & Release Hardening
    ↓
Phase 14: MVP Release Gate & Pilot Deployment
    │
    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        POST-MVP IMPLEMENTATION PHASES                  │
│                        (Role Expansion & Advanced Capabilities)        │
└────────────────────────────────────────────────────────────────────────┘
Phase 15: Post-MVP ACADEMIC_STAFF Support & Delegated Portal
    ↓
Phase 16: Post-MVP STUDENT Authentication & Student Self-Service Portal
    ↓
Phase 17: Post-MVP Subscription-Based Self-Service Onboarding (Option C) & SaaS Billing
    ↓
Phase 18: Future Platform Capabilities
          ├── Phase 18.1: Authorized University API Connectors
          ├── Phase 18.2: Regulation & Credit Eligibility Engine
          ├── Phase 18.3: Academic What-If Simulator
          ├── Phase 18.4: Predictive Academic Risk Intelligence
          ├── Phase 18.5: Natural-Language AI Query
          └── Phase 18.6: Branch Management, BRANCH_ADMIN & Multi-Campus Enterprise Architecture
```

---

# 4. MVP Implementation Phases (Phases 01 – 14)

## Phase 01 — Project & Application Foundation

### Objective
Establish the repository, backend Spring Boot foundation, frontend React foundation, database migration pipeline, and containerized development environment.

### Activities & Deliverables
- Scaffold Git repository with root `backend/`, `frontend/`, `docker/` structures.
- Initialize Spring Boot 3 with Java 21, Maven, Spring Web, Spring Data JPA, Spring Security, Validation, and Springdoc OpenAPI.
- Configure local MySQL 8 with InnoDB engine, `utf8mb4`, and UTC timestamps via `docker-compose.yml`.
- Configure database migration framework (Flyway / Liquibase) and run initial verification migration.
- Scaffold React 18+ with TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, and Axios.
- Establish global backend exception handler (`@RestControllerAdvice`) and frontend error boundaries.

### Exit Criteria
- Frontend and backend applications start cleanly.
- Backend connects to MySQL and executes baseline migrations.
- Frontend Axios client communicates with backend health check endpoint.

---

## Phase 02 — Authentication & Authorization Foundation

### Objective
Implement stateful HTTP-only session authentication (Spring Session JDBC + MySQL, no JWT), Spring Security 6 SPA CSRF protection, multi-tenant context resolution, live approval-state-aware authorization, one-time `SUPER_ADMIN` bootstrap, and role-based access control for `SUPER_ADMIN` and `COLLEGE_ADMIN`.

### Module Scope
- **Backend Authentication & Session Persistence (`ADR-01` – `ADR-05`):**
  - `users` schema with MySQL 8 `VIRTUAL` generated columns (`active_college_admin_college_id` + `UNIQUE` index for 1 active `COLLEGE_ADMIN`/college; `active_email` + `UNIQUE` index with `email_released` flag; `users.college_id` non-unique for Post-MVP multi-admin extensibility).
  - Spring Session JDBC with MySQL (`SPRING_SESSION`, `SPRING_SESSION_ATTRIBUTES`), `30-min` idle timeout, `12-hour` absolute session lifetime, multi-device sessions allowed, session ID renewal on login & privilege changes.
  - Cookie settings: Dev `ACADLYTIC_SID` (`HttpOnly`, `Secure=false`, `SameSite=Lax`, `Path=/`, no `Domain`); Prod `__Host-ACADLYTIC_SID` (`HttpOnly`, `Secure=true`, `SameSite=Lax`, `Path=/`, no `Domain` — same-origin reverse proxy); session cookie (no `Max-Age`).
  - CSRF: Spring Security 6 SPA pattern (`CookieCsrfTokenRepository.withHttpOnlyFalse()`, `SpaCsrfTokenRequestHandler`, `GET /api/v1/auth/csrf`, `CsrfCookieFilter`; enforced on login, logout, registration & all state-changing APIs; `403 CSRF_TOKEN_INVALID` on failure).
  - Endpoints: `GET /api/v1/auth/csrf`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` (returning authoritative `role`, `collegeId`, `userStatus`, `emailVerified`, `submittedForReview`, `collegeApprovalStatus`, `collegeStatus`, `managementUnlocked`).
  - Server-side session revocation (`FindByIndexNameSessionRepository`): Logout = current session; Password Change & Email Change = all other sessions + rotate current; Password Reset, User Suspension, College Suspension, Permanent Rejection, Admin Replacement, `SUPER_ADMIN` Suspension = ALL sessions.
- **Password, Email Change & Lockout Security:**
  - BCrypt work factor `12`, password length `12–128` chars, reject common/compromised passwords.
  - `POST /api/v1/auth/change-password`, `POST /api/v1/auth/forgot-password` / `reset-password` (single-use DB-hashed token, `1-hour` expiry), `POST /api/v1/auth/change-email` / `verify-email-change` (current password + `48-hour` DB-hashed token via `pending_email`).
  - Account states (`ACTIVE`, `INACTIVE`, `SUSPENDED`) + brute-force protection (`5` consecutive failures &rarr; `15-minute` temporary lockout).
- **One-Time `SUPER_ADMIN` Bootstrap (`ADR-17`):** Environment-driven, idempotent `SuperAdminBootstrapRunner` (zero public endpoint; disabled post-setup).
- **Transactional Outbox & Email Abstraction (`ADR-15`, `ADR-18`):** `outbox_emails` table, 10s `@Scheduled` poller using `SELECT ... FOR UPDATE SKIP LOCKED`, 5-attempt exponential backoff to `FAILED_PERMANENT`, stale-`PROCESSING` recovery, post-send token scrubbing, `EmailSender` port wired to Mailpit (`dev`) and env-configured SMTP/TLS (`prod`).
- **Approval-State-Aware Authorization:**
  - Live server-side checks distinguishing restricted onboarding endpoints vs. protected academic management endpoints (`403 COLLEGE_NOT_APPROVED` while unapproved; `403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE` and login blocked if an approved college is suspended).
- **Testing (`ADR-19`):** Testcontainers MySQL `8.0.36` for Flyway migration, `VIRTUAL` generated-column unique-index, Spring Session JDBC, and security integration tests; JUnit 5 + Mockito for unit tests.
- **Frontend:** Vite dev proxy (`/api` &rarr; `http://localhost:8080`) for same-origin cookies/CSRF, Axios `withCredentials: true` + `XSRF-TOKEN`/`X-XSRF-TOKEN`, Login (`/auth/login`), Forgot/Reset Password, auth store (Zustand), TanStack Query `/auth/me`, and role + approval-state route guards (`/admin/*`, `/college/*`).

### Two-Role & Cardinality Rules:
- Only `SUPER_ADMIN` and `COLLEGE_ADMIN` possess active accounts in MVP.
- MVP enforces **exactly one active `COLLEGE_ADMIN` per college tenant** via MySQL 8 `VIRTUAL` generated column + `UNIQUE` index (`users.college_id` remains non-unique).
- `ACADEMIC_STAFF`, `STUDENT` login, and `BRANCH_ADMIN` are strictly Post-MVP and disabled in MVP.
- Direct public general-user self-registration is strictly forbidden.

### Exit Criteria
- `SUPER_ADMIN` bootstraps cleanly from environment variables and accesses `/admin/*` routes.
- Stateful HTTP-only session + SPA CSRF flow works end-to-end across Vite dev proxy and Spring Boot.
- `COLLEGE_ADMIN` logs in and receives authoritative `emailVerified`, `submittedForReview`, `collegeApprovalStatus`, `collegeStatus`, and `managementUnlocked` from `GET /api/v1/auth/me`.
- Backend authorization strictly blocks academic management endpoints (`403 COLLEGE_NOT_APPROVED`) for unapproved colleges and blocks login (`403 COLLEGE_SUSPENDED`) for suspended colleges.
- Testcontainers MySQL `8.0.36` integration tests verify generated-column constraints, session revocation, lockout, and outbox polling; Swagger endpoints verified.

---

## Phase 03 — College Registration, Email Verification, Restricted Dashboard & Approval Workflow

### Objective
Implement public college registration (rate-limited, no public multipart upload), immediate restricted dashboard access (`users.status = ACTIVE`), 48-hour email verification, authenticated verification document uploads outside webroot, submission into the frozen `PENDING` review queue, `SUPER_ADMIN` verification with `expectedVersion` (`APPROVED`, `ACTION_REQUIRED`, `REJECTED`, permanent rejection), bounded versioned resubmission preserving full history, automated 7-day abandoned-registration cleanup, and seamless management feature unlocking on approval.

### Module Scope
- **Backend Schema (`ADR-07`, `ADR-08`, `ADR-09`, `ADR-11`):**
  - `colleges`: `approval_status` (`PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`), `status` (`PENDING_VERIFICATION`, `ACTIVE`, `INACTIVE`, `SUSPENDED`), `current_registration_id`, `resubmission_count`, `action_required_count`, `permanently_rejected`, `archived_at`, `active_college_code` (`VIRTUAL` generated column + `UNIQUE` index), `version`.
  - `college_registrations`: `college_id`, `version_number` (`UNIQUE (college_id, version_number)`), `status`, institution snapshot, `submitted_for_review_at` (NULL until verified & submitted), `reviewer_user_id`, `review_notes`, `rejection_reason`, `is_permanent_rejection`, `reviewed_at`.
  - `college_registration_documents`: immutable rows linked to `college_id` + `registration_id` (`document_category` enum: required `UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`; optional `INSTITUTION_REGISTRATION_PROOF`, `ADDITIONAL_SUPPORTING_DOCUMENT`; `replaces_document_id`, random UUID `storage_key`, `mime_type`, `file_size_bytes`, `sha256_checksum`).
  - `verification_tokens` / `password_reset_tokens`: single-use DB-hashed tokens (48h email verification / email change; 1h password reset).
- **Document Storage & Validation (`ADR-11`, `ADR-16`):**
  - `DocumentStorageService` abstraction (`LocalFileSystemDocumentStorage` outside webroot in dev; private S3-compatible object storage in prod, streamed through backend-authorized endpoints only).
  - PDF/JPEG/PNG only, max `10 MB` per file, max `5` documents per revision, MIME + magic-byte signature validation, safe download headers (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`).
- **Rate Limiting & Cleanup (`ADR-12`, `ADR-13`):**
  - `RateLimiter` abstraction (`5 attempts / IP / hour` on `POST /api/v1/college-registrations`, `429` + `Retry-After`, trusted proxy IP resolution) + configurable production `CaptchaVerifier`.
  - Daily `@Scheduled` 7-day soft-archive cleanup for abandoned unverified + unsubmitted registrations (`email_verified_at IS NULL AND submitted_for_review_at IS NULL`), releasing `active_college_code`, `active_email`, and admin slot while never touching submitted/approved/historical records.
- **Public & Restricted College Onboarding APIs:**
  - `POST /api/v1/college-registrations` (Public, rate-limited: submits institution profile + proposed `COLLEGE_ADMIN` credentials -> creates restricted college context, `v1` application with `submitted_for_review_at = NULL`, `ACTIVE` user with `email_verified_at = NULL`, and outbox verification email).
  - `POST /api/v1/auth/verify-email` & `POST /api/v1/auth/resend-verification` (48h single-use DB-hashed token).
  - `GET /api/v1/college-registrations/my-application` (Authenticated `COLLEGE_ADMIN`: current status, version history, feedback, remaining resubmissions).
  - `GET /api/v1/college-registrations/my-application/documents`, `POST .../documents`, `GET .../documents/{docId}` (Authenticated `COLLEGE_ADMIN`: tenant-scoped document inspection; upload permitted ONLY during pre-submission, `ACTION_REQUIRED`, or non-permanent `REJECTED` — strictly blocked while `PENDING` under review).
  - `POST /api/v1/college-registrations/my-application/submit` (Pre-submission gate: requires `email_verified_at IS NOT NULL` + required document categories uploaded &rarr; sets `submitted_for_review_at = NOW()`, enters `SUPER_ADMIN` `PENDING` queue, and freezes mutations).
  - `POST /api/v1/college-registrations/my-application/resubmit` (Allowed in `ACTION_REQUIRED` up to safety cap 10, or non-permanent `REJECTED` up to **3 revised submissions** &rarr; creates immutable `v+1` in frozen `PENDING` with `submitted_for_review_at = NOW()`).
- **`SUPER_ADMIN` Verification APIs (Require `expectedVersion`; `409 Conflict` on stale):**
  - `GET /api/v1/college-registrations` (Paginated review queue showing verified, submitted applications; filter by `PENDING`, `ACTION_REQUIRED`, `APPROVED`, `REJECTED`).
  - `GET /api/v1/college-registrations/{id}` & `GET /api/v1/college-registrations/{id}/documents/{docId}` (Inspect revisions, history, and safely streamed documents).
  - `POST /api/v1/college-registrations/{id}/approve` (DB tx verifies `expectedVersion`, marks `APPROVED`, sets `colleges` to `APPROVED` & `ACTIVE`, writes audit + outbox email; unlocks existing `COLLEGE_ADMIN` dashboard with no separate account/dashboard creation).
  - `POST /api/v1/college-registrations/{id}/request-action` (`PENDING` &rarr; `ACTION_REQUIRED` with mandatory notes + outbox email).
  - `POST /api/v1/college-registrations/{id}/reject` (Mandatory reason + optional `permanent: true`; auto-permanent on 3rd revision rejection; permanent rejection deactivates college & user, revokes all sessions, releases code/email/slot, preserves full history).
- **Frontend:**
  - Public Registration (`/register-college` — profile + credentials, optional CAPTCHA widget in prod), Email Verification (`/verify-email`), Restricted College Dashboard (`/college/dashboard` / `/college/onboarding`: verification checklist, document upload manager, Submit for Review, frozen `PENDING` banner, `ACTION_REQUIRED`/`REJECTED` feedback & resubmission, locked management links, automatic unlock via `/auth/me`), and `SUPER_ADMIN` Review Hub (`/admin/registrations`).

### Exit Criteria
- Prospective college registers via `/register-college`, logs in immediately to Restricted Dashboard, verifies email (via Mailpit in dev), uploads required documents, and submits into frozen `PENDING` queue (all edits/uploads blocked while `PENDING`; academic management APIs return `403`).
- `SUPER_ADMIN` inspects verified applications/documents and executes `request-action`, `reject`, `permanent reject`, and `approve` with `expectedVersion` (`409` on stale version).
- `ACTION_REQUIRED` and `REJECTED` resubmissions create immutable `v+1` revisions preserving prior history, enforce the 3-rejection-revision limit, and handle permanent rejection with session revocation & reservation release.
- Approval unlocks the existing dashboard (observed via `/api/v1/auth/me`) and delivers notification via the transactional outbox.
- Automated 7-day abandoned-registration cleanup and IP rate limiting pass Testcontainers MySQL `8.0.36` integration tests.

---

## Phase 04 — College Management (Tenant Management & Profile)

### Objective
Establish active college tenant oversight by `SUPER_ADMIN` and full college profile maintenance by approved `COLLEGE_ADMIN` users.

### Module Scope
- Backend: `colleges` administrative management (unique `active_college_code`, university reference, approval status, operational status `ACTIVE`/`INACTIVE`/`SUSPENDED`, contact details).
- **Explicit MVP Scope Boundary:** `BRANCH_ADMIN` and branch management are strictly Post-MVP. Do **not** create branch tables or implement branch functionality in MVP.
- **Single Active Admin Rule:** Enforced via MySQL 8 `VIRTUAL` generated column + `UNIQUE` index (`ADR-06`); admin replacement deactivates outgoing admin, revokes all outgoing sessions (`ADR-05`), and preserves historical audit attribution.
- **Suspension Enforcement (`ADR-10`):** Suspending or deactivating an approved college immediately revokes all active sessions of that college's users and blocks subsequent login attempts with `403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE`.
- APIs:
  - `GET /api/v1/colleges` (SUPER_ADMIN: list all college tenants).
  - `GET /api/v1/colleges/{id}` (SUPER_ADMIN: view college tenant details).
  - `PUT /api/v1/colleges/{id}` (SUPER_ADMIN: update administrative metadata).
  - `PATCH /api/v1/colleges/{id}/status` (SUPER_ADMIN: activate/suspend college tenant with immediate session revocation on suspend/deactivate).
  - `GET /api/v1/colleges/my-college` (Approved & active `COLLEGE_ADMIN`: view own college profile).
  - `PUT /api/v1/colleges/my-college` (Approved & active `COLLEGE_ADMIN`: update permitted metadata).
- Frontend: SUPER_ADMIN College Tenant Hub (`/admin/colleges`) and approved COLLEGE_ADMIN College Profile editor (`/college/profile`).
- Tenant Isolation: Enforce `college_id` scoping and live `APPROVED` + `ACTIVE` gating across all subsequent academic management operations.

### Exit Criteria
- `SUPER_ADMIN` can view and manage active college tenants.
- `COLLEGE_ADMIN` can only view and update their own college profile.
- Cross-tenant requests return `403 Forbidden`.

---

## Phase 05 — Academic Structure

### Objective
Enable `COLLEGE_ADMIN` to configure programs, semesters, subjects, and credits required for result matching and processing.

### Module Scope
- Backend: Schema and CRUD APIs for `programs`, `semesters`, and `subjects` (with subject code, title, credits, type, passing minimum).
- Referential Integrity: Validate $\text{Program} \rightarrow \text{Semester} \rightarrow \text{Subject}$ relationships.
- Constraint: Unique subject codes within a program; indexed for fast matching.
- Frontend: Program Management, Semester Curriculum Manager, and Subject Configuration tables.

### Exit Criteria
- `COLLEGE_ADMIN` can define complete collegiate degree curriculum.
- Subject codes are queryable and ready for result file matching.

---

## Phase 06 — Student Records Management

### Objective
Enable `COLLEGE_ADMIN` to create, search, filter, and maintain student academic records and course enrollments.

### Module Scope
- Backend: `students` schema with official university student identifier (Register / Roll Number), demographic details, program enrollment, and academic status.
- APIs: `POST /api/v1/students`, `GET /api/v1/students` (paginated, search by register number/name, filter by program/semester), `GET /api/v1/students/{id}`, `PUT`.
- Frontend: Student Directory, Add/Edit Student modal, and Student Profile detail view.

### Crucial Invariant:
- `COLLEGE_ADMIN` manages student records without creating student login accounts.
- Student records serve as authoritative matching anchors for result processing.

### Exit Criteria
- Student records can be created, searched, and updated within the college tenant.
- Duplicate register numbers within a college are rejected.
- Tenant isolation verified: College A cannot view College B students.

---

## Phase 07 — University Result Import

### Objective
Enable `COLLEGE_ADMIN` to upload external university result files (Excel and CSV), parse records, map columns, and track import jobs.

### Module Scope
- Backend: Multipart upload endpoint `POST /api/v1/result-imports`, Apache POI (Excel `.xlsx`/`.xls`) parser, OpenCSV parser.
- Staging Schema: `result_import_jobs` and `staged_result_records`.
- Column Mapping: Standardizes raw headers to internal schema (Register Number, Subject Code, Marks, Grade, Status, Session).
- Normalization: Trims whitespace, standardizes casing, and preserves raw inputs for audit.
- Frontend: Result Import Hub with drag-and-drop file upload, progress tracking, and import job history.

### Exit Criteria
- Real-world Excel and CSV result sheets upload and parse cleanly into staged records.
- Corrupt or malformed files are rejected safely with clear diagnostic errors.
- Uploaded data remains staged; no direct writes to authoritative tables.

---

## Phase 08 — Result Validation & Error Resolution

### Objective
Execute automated validation checks on staged records, detect identity anomalies and duplicate results, and allow `COLLEGE_ADMIN` to resolve exceptions.

### Module Scope
- Backend Validation Engine:
  - Required fields check.
  - Student identity matching (matches register number against college student records).
  - Subject matching (matches subject code against configured curriculum).
  - Grade scale verification (checks grades against approved scale).
  - Duplicate detection (intra-file duplicates and repeat sitting checks).
- Validation States: `VALID`, `INVALID`, `WARNING`.
- APIs: `GET /api/v1/result-imports/{id}/records`, `POST /api/v1/result-imports/{id}/revalidate`.
- Frontend: Validation Summary Dashboard, Staged Records Table with badge status indicators, error resolution links, and Re-validate button.

### Exit Criteria
- Unmatched students and unrecognized subject codes are accurately flagged.
- `COLLEGE_ADMIN` can resolve mapping errors and successfully re-validate records.
- Records with errors are strictly prevented from advancing to processing.

---

## Phase 09 — Authoritative Result Processing & Attempts

### Objective
Convert validated result records into authoritative, permanent academic records and sitting attempt histories within managed database transactions.

### Module Scope
- Backend: `POST /api/v1/result-imports/{id}/process` (COLLEGE_ADMIN only).
- Database Schema: `academic_results` storing student ID, subject ID, semester, exam session, attempt number, grade, grade point, credits earned, and status.
- Transactional Atomicity: Spring `@Transactional` wrapper ensuring all-or-nothing execution; partial failures roll back completely.
- Attempt Preservation: Calculates sitting attempt numbers; never overwrites historical examination sittings.
- Idempotency: Unique constraint on `(student_id, subject_id, exam_session, attempt_number)` guarantees repeat runs do not duplicate data.
- Frontend: Processing confirmation dialog, real-time progress indicators, and completion summaries.

### Exit Criteria
- Validated records are atomically committed to authoritative academic tables.
- Multiple attempts for failed subjects are preserved chronologically.
- Audit records document processing execution.

---

## Phase 10 — Backlog Lifecycle Tracking

### Objective
Automatically initiate, track, and resolve student backlogs based on processed examination outcomes.

### Module Scope
- Backend Backlog Engine:
  - Failing grade on an academic requirement creates an `OPEN` backlog record in `backlogs` table.
  - Subsequent passing grade automatically transitions the backlog to `RESOLVED` and links the clearing result.
  - Increments and tracks attempt counts across examination sessions.
- APIs: `GET /api/v1/backlogs` (query by status, program, semester), `GET /api/v1/students/{id}/backlogs`.
- Frontend: College Backlog Tracking Dashboard with "Active Backlogs" and "Cleared History" views, filters, and attempt sitting timelines.

### Exit Criteria
- Backlogs transition automatically between `OPEN` and `RESOLVED` upon result processing.
- Attempt histories remain consistent with authoritative result records.
- `COLLEGE_ADMIN` can filter and export active backlog lists.

---

## Phase 11 — Academic Passport (Administrative Read Model)

### Objective
Provide `COLLEGE_ADMIN` with a consolidated longitudinal academic journey view for any enrolled student.

### Module Scope
- Backend Projection Service: Aggregates student enrollment, term-by-term subjects, verified grades, examination attempt histories, accumulated credits, calculated SGPA/CGPA, and backlog clearance history.
- API: `GET /api/v1/students/{id}/passport` (COLLEGE_ADMIN only).
- Read-Model Invariant: Passport is strictly a read projection derived from authoritative data; it cannot modify results.
- Frontend: Comprehensive Academic Passport viewer (`/college/students/{id}/passport`) with student summary card, semester accordion panels, verified grade tables, backlog status badges, and print/export layout.

### Exit Criteria
- `COLLEGE_ADMIN` can inspect the verified 4-year academic journey of any student.
- Projection values exactly match underlying result and backlog records.

---

## Phase 12 — College Academic Analytics

### Objective
Provide institutional academic performance dashboards and cohort analytics for `COLLEGE_ADMIN`.

### Module Scope
- Backend Aggregation Engine:
  - Overall college pass and failure percentages per exam session.
  - Semester progression and cohort retention metrics.
  - Subject-level failure hot-spots (highest backlog volume).
  - SGPA and CGPA distribution curves across cohorts.
- API: `GET /api/v1/analytics/college-overview`.
- Data Integrity Rule: Missing examination data is never coerced to zero or failure.
- Frontend: Analytics Dashboard (`/college/analytics`) featuring KPI summary cards, pass/fail trends, and cohort distribution charts using Recharts.

### Exit Criteria
- Institutional analytics display actionable performance metrics.
- All analytical aggregations are strictly filtered by authenticated `college_id`.

---

## Phase 13 — End-to-End Integration & Release Hardening

### Objective
Connect all MVP modules, execute end-to-end multi-tenant workflows, conduct security assessments, and perform performance testing.

### Activities & Deliverables
- Execute complete automated and manual test workflow from college registration and approval to analytics review.
- Multi-Tenant Security Audit: Verify IDOR prevention across all endpoints using multiple test tenants.
- Performance Verification: Ingest result files with 5,000+ records; verify parsing, validation, and processing times.
- Quality Audit: Check responsive layouts on all screens; ensure zero horizontal overflow.

### Exit Criteria
- End-to-end two-role workflow completes without manual intervention.
- Zero critical security, authorization, or tenant isolation defects.
- Database query plans verified; no N+1 query regressions.

---

## Phase 14 — MVP Release Gate & Pilot Deployment

### Objective
Deploy the validated MVP to production/staging and initiate pilot validation with partner colleges.

### Deliverables & Checklist
- Production Docker container build and environment variable validation.
- Resolve Phase 14 deployment selections: production SMTP email vendor (`ADR-15b`), production S3-compatible bucket provider (`ADR-16b`, or backed-up local persistent volume for single-node pilot), and production CAPTCHA provider if enabled (`ADR-12`).
- Database migrations executed and verified on production MySQL.
- HTTPS certificates configured; `__Host-ACADLYTIC_SID` (`Secure=true`, `Path=/`, no `Domain`) and same-origin reverse proxy verified; security headers enabled.
- One-time `SUPER_ADMIN` bootstrap executed and `app.bootstrap.super-admin.enabled=false` confirmed.
- Automated database backups verified.
- Pilot college registration submitted, email verified, documents uploaded, submitted for review, approved by `SUPER_ADMIN`, and full management dashboard unlocked for `COLLEGE_ADMIN`.
- First real university result file imported, validated, and processed by `COLLEGE_ADMIN`.

---

# 5. Post-MVP Implementation Phases (Phases 15 – 18)

> [!NOTE]
> The following phases represent post-MVP capabilities. They are scheduled after the core two-role collegiate workflow is stabilized and validated.

## Phase 15 — Post-MVP ACADEMIC_STAFF Support & Portal

### Objective
Introduce delegated operational roles within college tenants for departmental heads, faculty coordinators, and examination cell staff.

### Planned Deliverables
- Enable `ACADEMIC_STAFF` role in authentication and authorization rules.
- `COLLEGE_ADMIN` user management interface to provision staff accounts with departmental scopes.
- Departmental operational portal (`/staff/*`) for delegated student record maintenance and result verification.

---

## Phase 16 — Post-MVP STUDENT Authentication & Student Self-Service Portal

### Objective
Enable students to authenticate and access their personal academic information directly via the Student Portal.

### Planned Deliverables
- Enable `STUDENT` role in authentication engine.
- Provisioning mechanism linking existing student records to new user accounts in `users` table.
- Secure student login (`POST /api/v1/auth/login`).
- Student Self-Service API suite rooted at `/api/v1/me/**`:
  - `/api/v1/me/dashboard`
  - `/api/v1/me/results`
  - `/api/v1/me/backlogs`
  - `/api/v1/me/passport`
  - `/api/v1/me/analytics`
- Student Portal frontend (`/student/*`): Personal Dashboard, Academic Passport viewer, semester results history, backlog tracking, and personal analytics.
- Strict ownership invariant: Students can only view their own records (`/me`); direct student ID manipulation is rejected.

---

## Phase 17 — Post-MVP Subscription-Based Self-Service Onboarding (Option C) & SaaS Billing

### Objective
Provide automated, self-service customer onboarding through subscription plan selection and payment processing without requiring manual registration approval.

### Architectural Relationship to MVP Onboarding
Option C can reuse the common authentication, tenant scoping, and onboarding foundations built in Phases 02–03, while subscription plans, payment gateway integration, webhook verification, entitlement gating, and billing lifecycle management will require additional implementation.

### Planned Deliverables
- Subscription plan management (Tier configuration: Starter, Growth, Enterprise).
- Payment gateway integration (payment processing and signed webhook listeners).
- Subscription lifecycle management: billing renewals, plan upgrades, downgrades, and cancellations.
- Automated tenant onboarding: `colleges` tenant activation and immediate management feature unlocking triggered upon verified payment confirmation.
- Subscription-based access control and feature entitlement gating.

---

## Phase 18 — Future Platform Capabilities

### 18.1 Authorized University API Connectors
- Automated API connectors, webhooks, and secure synchronization feeds with university examination boards.

### 18.2 Regulation & Credit Eligibility Engine
- Configurable university regulation engine automating credit checks, promotion eligibility, and detention rules.

### 18.3 Academic What-If Simulator
- Student planning tool for forecasting grades needed on remaining subjects to reach target CGPA.

### 18.4 Predictive Academic Risk Intelligence
- Machine learning models identifying students at risk of course failure or backlog accumulation.

### 18.5 Natural-Language AI Query
- Natural-language interface allowing administrators to query academic records (e.g., *"Show students with backlogs in Math 3"*).

### 18.6 Branch Management, `BRANCH_ADMIN` & Multi-Campus Enterprise Architecture
- Branch tables, branch-level organizational hierarchies, `BRANCH_ADMIN` role authorization, group-level roll-up reporting, and consolidated enterprise analytics. (Explicitly deferred from MVP — no branch tables or branch functionality are created during MVP phases.)

### 18.7 Production Security Hardening — Automated Document Malware Scanning
- Automated AV/malware scanning pipeline (e.g., ClamAV or cloud scanner) for uploaded verification documents and result files (`ADR-11b`, deferred from MVP).

---

# 6. Strategic Scope Comparison Matrix

| Capability | In MVP (Phases 01 – 14) | Post-MVP (Phases 15 – 18) |
|---|---|---|
| **Authentication Mechanism** | Stateful HTTP-Only Session Cookies (Spring Session JDBC + MySQL) + SPA CSRF (**No JWT**) | Same (optional Redis session store scaling if needed) |
| **Active User Roles** | `SUPER_ADMIN`, `COLLEGE_ADMIN` | Adds `ACADEMIC_STAFF`, `STUDENT`, `BRANCH_ADMIN` |
| **College Admin Cardinality** | Exactly one active `COLLEGE_ADMIN` per college (MySQL 8 `VIRTUAL` generated column + `UNIQUE` index; `users.college_id` non-unique) | Multiple college administrators per tenant (drop generated column/index) |
| **Branch Management & `BRANCH_ADMIN`** | **No** (No branch tables or branch functionality in MVP) | **Yes** (Phase 18.6) |
| **Onboarding Model** | Public Registration → Restricted Dashboard (Email Verify + Doc Upload + Submit) → Frozen `PENDING` → `SUPER_ADMIN` Review (`APPROVED`/`ACTION_REQUIRED`/`REJECTED`/Permanent Reject) → Unlocked Dashboard | Adds Option C: Subscription & Payment Gateway (reuses common onboarding/auth foundations; requires additional billing implementation) |
| **Account Provisioning** | Proposed `COLLEGE_ADMIN` establishes credentials during registration (`users.status = ACTIVE`); dashboard unlocked on approval | College Admin creates Staff & Students |
| **Student Record Management** | **Yes (Full Admin CRUD)** | Yes (Full Admin + Staff CRUD) |
| **Student Login Accounts** | **No** | **Yes (Self-service credentials — Phase 16)** |
| **Student Portal** | **No** | **Yes (`/student/*` & `/me` — Phase 16)** |
| **Result File Ingestion** | Yes (Excel & CSV by Admin) | Yes (Admin + Delegated Staff) |
| **Validation & Processing** | Yes (Executed by Admin) | Yes (Executed by Admin/Staff) |
| **Backlog Tracking** | Yes (Automated Lifecycle) | Yes (Admin, Staff, Student Views) |
| **Academic Passport** | Yes (Admin Inspection View) | Yes (Admin, Staff, Student Self-Service) |
| **Academic Analytics** | Yes (College-Level Dashboards) | Yes (College, Department, Student Views) |
| **University Connectors** | Staged File Imports Only | Direct APIs, Feeds, Webhooks |
| **Predictive AI / What-If** | No | Yes (Risk models, simulators) |
| **Commercial Billing / Subscriptions** | **No** | **Yes (Phase 17 SaaS Billing & Option C)** |

---

# 7. Roadmap Governance & Verification Rules

1. **No Out-of-Sequence Development:** Modules must be implemented in the documented sequence (01 through 14).
2. **Backend-First Discipline:** Do not build frontend screens before backend domain logic, tests, and API contracts are verified.
3. **No Unapproved Scope or Role Expansion:** Do not implement JWT authentication, student login, staff login, branch tables / `BRANCH_ADMIN`, or subscription billing during MVP phases.
4. **Preserve Integrity:** Never compromise transactional boundaries, transactional-outbox email delivery outside DB transactions, `expectedVersion` optimistic checks, or tenant isolation to complete a phase faster.
5. **Respect Approved Architecture Decisions:** Phase 02–03 backend implementation follows the finalized Decision Register (`ADR-01` – `ADR-19`). Deployment vendor selections (`ADR-15b` SMTP vendor, `ADR-16b` S3 provider) must be resolved before Phase 14; automated malware scanning (`ADR-11b`) is deferred to Phase 18.7.
6. **Phase Sign-Off:** A phase is marked `COMPLETED` only after its exit criteria and Testcontainers MySQL `8.0.36` + frontend verification tests pass.
