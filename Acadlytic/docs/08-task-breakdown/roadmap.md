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
Phase 03: College Registration & Approval (Option A MVP Onboarding)
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
          └── Phase 18.6: Multi-Campus Enterprise Architecture
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
Implement secure authentication, session management, multi-tenant context resolution, account activation mechanism, and role-based access control for `SUPER_ADMIN` and `COLLEGE_ADMIN`.

### Module Scope
- Backend: `users` schema, BCrypt hashing, JWT/Session authentication filter, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- Account Activation: Token-based administrator account activation endpoint `POST /api/v1/auth/activate-account` used to establish credentials after college registration approval.
- Password Security: Password change (`POST /api/v1/auth/change-password`) and token-based password reset (`POST /api/v1/auth/forgot-password`, `reset-password`).
- Account States: `ACTIVE`, `INACTIVE`, `SUSPENDED` enforcement; brute-force lockout after 5 failed attempts.
- Frontend: Login page (`/auth/login`), Forgot Password (`/auth/forgot-password`), Reset Password (`/auth/reset-password`), Account Activation (`/activate-account`), auth state store (Zustand), and role-aware route guards (`/admin/*`, `/college/*`).

### Two-Role Rule:
- Only `SUPER_ADMIN` and `COLLEGE_ADMIN` possess active accounts in MVP.
- Staff and Student login attempts are disabled.
- Direct public user self-registration is strictly forbidden.

### Exit Criteria
- `SUPER_ADMIN` can log in and access `/admin/*` routes.
- `COLLEGE_ADMIN` can log in and access `/college/*` routes bound to their `college_id`.
- Account activation verifies token, sets initial password, and enables login.
- Tenant context is strictly resolved server-side from the authenticated user.
- Backend unit and integration tests pass; Swagger endpoints verified.

---

## Phase 03 — College Registration & Approval (Option A MVP Onboarding)

### Objective
Implement public college registration application intake, storage with `PENDING` status, `SUPER_ADMIN` review and approval/rejection lifecycle, approved tenant initialization, and secure administrator activation invitation.

### Module Scope
- Backend Schema: `college_registrations` table (institution name, proposed college code, university affiliation, address, administrator contact name/email/phone, status `PENDING`/`APPROVED`/`REJECTED`, rejection reason, review timestamps).
- APIs:
  - `POST /api/v1/college-registrations` (Public: prospective college application submission).
  - `GET /api/v1/college-registrations` (SUPER_ADMIN: paginated review queue, filter by status).
  - `GET /api/v1/college-registrations/{id}` (SUPER_ADMIN: inspect application details).
  - `POST /api/v1/college-registrations/{id}/approve` (SUPER_ADMIN: approve application, provision `colleges` tenant record, issue secure time-limited activation token to proposed administrator email).
  - `POST /api/v1/college-registrations/{id}/reject` (SUPER_ADMIN: reject application with mandatory reason; no tenant access granted).
  - `POST /api/v1/auth/activate-account` (Public with token: designated administrator sets password and activates user account bound strictly to the approved `college_id`).
- Frontend:
  - Public College Registration Form (`/register-college`) with institution and administrator contact fields.
  - Registration Success Confirmation Page (`/registration-success`).
  - SUPER_ADMIN Registration Review Hub (`/admin/registrations`) with pending queue, detail drawer, and Approve/Reject dialog.
  - Administrator Account Activation Page (`/activate-account`) with token validation and password creation.
- Tenant Isolation & Security Invariants:
  - Public college registration is allowed; public user self-registration is disabled.
  - College registration and user authentication are completely separate processes.
  - Pending or rejected college applications cannot access protected college operations.
  - A college cannot obtain an active `COLLEGE_ADMIN` account before approval.
  - `SUPER_ADMIN` approves or rejects applications; it does not manually create administrator accounts.
  - Designated administrator is bound strictly to the approved `college_id`.

### Exit Criteria
- Prospective college can submit a registration application through `/register-college`.
- Application appears with `PENDING` status in the `SUPER_ADMIN` review queue.
- Rejection marks application `REJECTED` and prevents tenant or credential creation.
- Approval provisions the `colleges` tenant and generates an activation invitation.
- Designated administrator activates account, establishes password, and logs in with `COLLEGE_ADMIN` role bound to the approved college.

---

## Phase 04 — College Management (Tenant Management & Profile)

### Objective
Establish the college tenant boundary, active tenant management by `SUPER_ADMIN`, and college profile maintenance by `COLLEGE_ADMIN`.

### Module Scope
- Backend: `colleges` schema with unique college code, university reference, status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), and contact details.
- APIs:
  - `GET /api/v1/colleges` (SUPER_ADMIN: list all college tenants).
  - `GET /api/v1/colleges/{id}` (SUPER_ADMIN: view college tenant details).
  - `PUT /api/v1/colleges/{id}` (SUPER_ADMIN: update administrative metadata).
  - `PATCH /api/v1/colleges/{id}/status` (SUPER_ADMIN: activate/suspend college tenant).
  - `GET /api/v1/colleges/my-college` (COLLEGE_ADMIN: view own college profile).
  - `PUT /api/v1/colleges/my-college` (COLLEGE_ADMIN: update permitted metadata).
- Frontend: SUPER_ADMIN College Tenant Hub (`/admin/colleges`) and COLLEGE_ADMIN College Profile editor (`/college/profile`).
- Tenant Isolation: Enforce `college_id` scoping across all subsequent operations.

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
- Database migrations executed and verified on production MySQL.
- HTTPS certificates configured; security headers enabled.
- Automated database backups verified.
- Pilot college registration submitted, approved by `SUPER_ADMIN`, and activated by `COLLEGE_ADMIN`.
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

### Planned Deliverables
- Subscription plan management (Tier configuration: Starter, Growth, Enterprise).
- Payment gateway integration (Stripe / Razorpay payment processing and webhook listeners).
- Subscription lifecycle management: billing renewals, plan upgrades, downgrades, and cancellations.
- Automated tenant onboarding: instant `colleges` tenant record creation and immediate administrator credential activation upon payment confirmation.
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

### 18.6 Multi-Campus Enterprise Architecture
- Multi-campus organizational hierarchies, group-level roll-up reporting, and consolidated enterprise analytics.

---

# 6. Strategic Scope Comparison Matrix

| Capability | In MVP (Phases 01 – 14) | Post-MVP (Phases 15 – 18) |
|---|---|---|
| **Active User Roles** | `SUPER_ADMIN`, `COLLEGE_ADMIN` | Adds `ACADEMIC_STAFF`, `STUDENT` |
| **Onboarding Model** | Option A: Public Registration & Approval | Adds Option C: Subscription & Payment Gateway |
| **Account Provisioning** | Admin activates account post-approval | College Admin creates Staff & Students |
| **Student Record Management** | **Yes (Full Admin CRUD)** | Yes (Full Admin + Staff CRUD) |
| **Student Login Accounts** | **No** | **Yes (Self-service credentials)** |
| **Student Portal** | **No** | **Yes (`/student/*` & `/me`)** |
| **Result File Ingestion** | Yes (Excel & CSV by Admin) | Yes (Admin + Delegated Staff) |
| **Validation & Processing** | Yes (Executed by Admin) | Yes (Executed by Admin/Staff) |
| **Backlog Tracking** | Yes (Automated Lifecycle) | Yes (Admin, Staff, Student Views) |
| **Academic Passport** | Yes (Admin Inspection View) | Yes (Admin, Staff, Student Self-Service) |
| **Academic Analytics** | Yes (College-Level Dashboards) | Yes (College, Department, Student Views) |
| **University Connectors** | Staged File Imports Only | Direct APIs, Feeds, Webhooks |
| **Predictive AI / What-If** | No | Yes (Risk models, simulators) |
| **Commercial Billing / Stripe** | No | Yes (Phase 17 SaaS Billing & Option C) |

---

# 7. Roadmap Governance & Verification Rules

1. **No Out-of-Sequence Development:** Modules must be implemented in the documented sequence (01 through 14).
2. **Backend-First Discipline:** Do not build frontend screens before backend domain logic, tests, and API contracts are verified.
3. **No Unapproved Role Expansion:** Do not implement student authentication or staff accounts during MVP phases.
4. **Preserve Integrity:** Never compromise transactional boundaries or tenant isolation to complete a phase faster.
5. **Phase Sign-Off:** A phase is marked `COMPLETED` only after its exit criteria and automated tests have been verified.
2. **Backend-First Discipline:** Do not build frontend screens before backend domain logic, tests, and API contracts are verified.
3. **No Unapproved Role Expansion:** Do not implement student authentication or staff accounts during MVP phases.
4. **Preserve Integrity:** Never compromise transactional boundaries or tenant isolation to complete a phase faster.
5. **Phase Sign-Off:** A phase is marked `COMPLETED` only after its exit criteria and automated tests have been verified.
