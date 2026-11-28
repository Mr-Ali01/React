# ACADLYTIC — MASTER PROJECT CONTEXT
## Complete Project Overview, Architecture, Business Logic & Development Guidelines

You are working on a software product named **Acadlytic**.

Before performing any task, read and understand this complete project context. Treat it as the baseline reference for understanding the product, its purpose, architecture, scope, business rules, technical decisions, and development workflow.

Do not start coding immediately. First inspect the existing project structure, relevant documentation, source code, configuration, and current implementation status. Never assume that a feature is missing or incomplete without inspecting the project.

---

# 1. PROJECT IDENTITY

**Project Name:** Acadlytic  
**Project Category:** Academic Intelligence Platform  
**Product Type:** Multi-tenant, web-based SaaS platform  
**Target Customers:** Universities-affiliated colleges and educational institutions  
**Primary Users:** College administrators and platform administrators

Acadlytic is an Academic Intelligence Platform designed to help colleges manage, process, analyze, and monitor students' academic performance and university examination results through a centralized system.

It aims to replace scattered spreadsheets, manual result calculations, disconnected student records, and time-consuming academic administration with a structured, reliable, and intelligent academic management platform.

Acadlytic is not merely a marks calculator or a basic student management application.

It is intended to become a centralized academic intelligence system for colleges.

# 2. THE PROBLEM ACADLYTIC SOLVES

Many colleges affiliated with universities receive examination results in formats that do not provide all the academic insights required by the college.

For example:

- Universities publish results as grades, grade points, credits, or subject-wise outcomes.
- Colleges often need to manually inspect university result sheets.
- Student semester results and academic histories are scattered across files.
- Backlog records and previous examination attempts are difficult to track.
- Academic eligibility and credit requirements require manual verification.
- College administrators lack a centralized academic overview.
- Student academic records may be maintained separately from fee, course, and administrative information.
- Generating consolidated academic reports requires repetitive manual work.

Acadlytic addresses these problems by creating a centralized academic data system.

## Core objectives

1. Centralize student academic records.
2. Simplify university result imports.
3. Validate imported academic results before processing.
4. Calculate and maintain authoritative academic records using configured academic rules.
5. Track pending backlogs and historical attempts.
6. Maintain a structured Academic Passport for every student.
7. Provide academic analytics and reports to college administrators.
8. Reduce repetitive manual work and academic data errors.

# 3. CORE PRODUCT WORKFLOW

The central academic processing workflow is:

University Result
→ Result Import
→ Result Validation
→ Result Processing
→ Academic Records
→ Backlog Tracking
→ Academic Passport
→ College Analytics

Each stage has a separate responsibility.

### 3.1 Result Import

Responsible for receiving university examination result data.

Possible input formats include supported spreadsheets and structured files.

The import module is an ingestion boundary. It must not directly modify authoritative academic records.

### 3.2 Result Validation

Responsible for checking imported data before processing.

Examples:

- Missing student records.
- Invalid roll numbers.
- Duplicate entries.
- Invalid subject references.
- Missing grades or credits.
- Invalid semester references.
- Data format inconsistencies.
- Unrecognized academic values.

Invalid records must be identifiable and reviewable.

### 3.3 Result Processing

This is the authoritative academic processing layer.

It processes validated results and updates the academic records according to the configured academic rules.

Important: Never invent university-specific grading formulas, SGPA/CGPA calculations, credit rules, passing criteria, or backlog rules.

Academic rules must be explicitly configured and supported by the relevant university/course/regulation data.

### 3.4 Backlog Tracking

Tracks unresolved academic requirements.

It must distinguish between:

- A pending backlog or unresolved subject requirement.
- Historical examination attempts.
- The latest outcome of a subject.
- A successfully cleared academic requirement.

Backlog records must not be confused with examination attempt history.

### 3.5 Academic Passport

Provides a consolidated, student-oriented academic history.

It may include:

- Student academic profile.
- Course and regulation information.
- Semester-wise results.
- Subject-wise academic outcomes.
- SGPA/CGPA where supported by configured rules.
- Backlog history.
- Examination attempts.
- Academic progress.

The Academic Passport is a read-oriented presentation of academic data. It is not the authoritative source of academic truth.

### 3.6 College Analytics

Provides college-level academic insights derived from authoritative processed data.

Possible analytics include:

- Student academic performance.
- Semester-wise results.
- Pass/fail statistics.
- Backlog distribution.
- Course-level performance.
- Academic progress.
- Historical comparisons.

Important rules:

- Missing data must not be treated as zero.
- Do not double-count students, subjects, or examination attempts.
- Analytics must derive from authoritative academic records.
- Every metric must have a clearly defined calculation basis.

# 4. TARGET USERS AND ROLE SYSTEM

Acadlytic is designed as a multi-tenant platform.

Each college is a separate tenant.

## MVP roles

Only these two roles are active in the MVP:

### SUPER_ADMIN

The platform owner and administrator.

Responsibilities:

- Review college registration applications.
- Approve or reject colleges.
- Request additional information or corrections.
- Monitor registered colleges.
- Manage platform-level operations.
- Suspend or reactivate colleges where permitted.

SUPER_ADMIN is not responsible for manually creating college administrator credentials during normal college onboarding.

### COLLEGE_ADMIN

The primary administrator of an approved college.

Responsibilities include:

- Manage college academic information.
- Manage student records.
- Manage academic structures.
- Import examination results.
- Validate and process results.
- Track backlogs.
- View Academic Passport information.
- Access college-level academic analytics.

MVP rule: Exactly one active COLLEGE_ADMIN account per college.

The architecture should not prevent future support for multiple college administrators and branch-level administration.

## Post-MVP roles

These roles are planned for later phases and must not be implemented as active MVP roles unless explicitly authorized:

- ACADEMIC_STAFF
- STUDENT
- BRANCH_ADMIN

Student academic records and management are part of the MVP.

Student login, student self-service, and the Student Portal are Post-MVP features.

Academic staff accounts and staff-specific functionality are also Post-MVP.

Branch management is not part of the MVP.

Do not introduce unnecessary role complexity into the MVP.

# 5. COLLEGE ONBOARDING AND APPROVAL WORKFLOW

The finalized onboarding model is **Option A: College Self-Registration with SUPER_ADMIN Approval**.

The workflow is:

1. College visits the Acadlytic public website.
2. College submits its registration application.
3. Institution details and proposed administrator contact details are collected.
4. A college registration application is created with status PENDING.
5. The college administrator account is created and becomes ACTIVE.
6. Email verification is required.
7. The college can immediately access a restricted registration dashboard.
8. The college uploads required verification documents.
9. The college submits the application for review.
10. The submitted application becomes frozen.
11. SUPER_ADMIN reviews the application and documents.
12. SUPER_ADMIN can approve, reject, or request corrections/additional information.
13. The college can correct and resubmit an ACTION_REQUIRED application.
14. If approved, the same college account and dashboard unlock full MVP academic management functionality.

## Registration statuses

- PENDING
- ACTION_REQUIRED
- APPROVED
- REJECTED

Permanent rejection is represented separately using the permanent rejection state.

## Important onboarding rules

- The college administrator user is ACTIVE immediately after registration.
- College approval status controls access to academic management.
- An unapproved college must not access academic management APIs.
- Restricted users can access only their registration status, application, documents, feedback, and permitted correction/resubmission functions.
- Email verification is required before submission into the SUPER_ADMIN review queue.
- Required documents must be uploaded before review submission.
- Once submitted for review, the application is frozen.
- Corrections must create preserved revision history.
- Documents are immutable records; replacement creates a new document record.
- SUPER_ADMIN review actions must use expectedVersion protection.
- Stale review requests must be rejected with HTTP 409.
- Maximum three REJECTED resubmissions after the initial application.
- ACTION_REQUIRED correction revisions have a separate safety cap of ten.
- Permanent rejection ends resubmission eligibility.
- The same account and dashboard are unlocked after approval. Do not create a separate account activation workflow.

## Required document categories

Required:

- UNIVERSITY_AFFILIATION_CERTIFICATE
- AUTHORIZED_SIGNATORY_ID

Optional:

- INSTITUTION_REGISTRATION_PROOF
- ADDITIONAL_SUPPORTING_DOCUMENT

Limits:

- Maximum five documents per registration revision.
- Maximum 10 MB per document.
- Uploaded document records must remain immutable.
- Replacement documents must preserve the previous document history.

# 6. CORE MVP MODULES

The MVP is organized into the following functional areas.

1. Authentication and Authorization
2. College Registration and Approval
3. College Management
4. Academic Structure Management
5. Student Management
6. Result Import
7. Result Validation
8. Result Processing
9. Backlog Tracking
10. Academic Passport
11. College Analytics

Additional public-facing pages and the restricted college registration dashboard support the onboarding experience.

The exact implementation order and boundaries must follow the existing project roadmap and task breakdown.

Do not combine multiple modules into one implementation task without explicit authorization.

# 7. TECHNICAL ARCHITECTURE

Acadlytic follows a **Modular Monolith Architecture**.

It is not a microservices application.

The application should be modular internally, with clear separation of responsibilities and controlled communication between modules.

## Backend technology stack

- Java 21
- Spring Boot 3.3.4
- Maven
- Spring Web
- Spring Security 6
- Spring Data JPA
- Hibernate
- Bean Validation
- MySQL 8
- Flyway database migrations
- Spring Session JDBC
- Springdoc OpenAPI
- JUnit 5
- Mockito
- Testcontainers

## Frontend technology stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Axios
- Recharts
- Lucide icons

Use the dependencies and versions already established in the repository. Do not upgrade or replace technologies without inspecting the current setup and explaining the reason.

## Database

- MySQL is the primary database.
- The database name in the development environment is `acadlytic`.
- MySQL-specific functionality must be tested against MySQL.
- Flyway manages database schema migrations.
- Do not use Hibernate schema generation as a replacement for migration scripts.
- Do not introduce H2 as a substitute for MySQL-specific integration tests.

## Environment

The established development environment includes:

- Windows 11
- Java 21
- Maven 3.9.9
- Node.js 24.19.0
- npm 11.17.0
- MySQL 8.x

Verify the actual environment before running commands. Do not assume all tools or services are currently running.

# 8. IMPORTANT ARCHITECTURAL DECISIONS

The following decisions have been finalized through architecture decision records (ADRs). Treat them as approved design constraints.

## 8.1 Multi-Tenancy

- College is the tenant boundary.
- College-owned records must be associated with the correct college.
- `college_id` must be enforced in tenant-sensitive operations.
- Cross-college data access must never be possible through ordinary COLLEGE_ADMIN operations.
- Tenant isolation must be enforced on the server side, not merely in the frontend.

## 8.2 Authentication

- Use stateful HTTP-only session-cookie authentication.
- Do not use JWT-based authentication for the current architecture.
- Use Spring Session JDBC with MySQL persistence.
- Do not store authentication tokens or session credentials in localStorage.
- Use Spring Security 6.
- Session authentication must be enforced on the backend.

## 8.3 Session Cookie

Development:

- Cookie name: ACADLYTIC_SID
- HttpOnly: true
- Secure: false
- SameSite: Lax

Production:

- Cookie name: __Host-ACADLYTIC_SID
- HttpOnly: true
- Secure: true
- SameSite: Lax
- Path: /
- No Domain attribute

The session cookie must not have a persistent Max-Age.

## 8.4 CSRF Protection

CSRF protection is mandatory.

Approved SPA integration:

- CookieCsrfTokenRepository.withHttpOnlyFalse()
- SpaCsrfTokenRequestHandler
- GET /api/v1/auth/csrf
- CsrfCookieFilter
- Axios withCredentials: true
- XSRF-TOKEN cookie
- X-XSRF-TOKEN request header

CSRF protection applies to login, logout, public registration, and other state-changing requests.

Use the configured Vite same-origin API proxy in development.

Never disable CSRF simply to make an API request work.

## 8.5 Session Revocation

Approved policies:

- Logout: revoke current session only.
- Password change: revoke all other sessions and rotate current session.
- Password reset: revoke all sessions.
- User suspension: revoke all sessions.
- College suspension: revoke all sessions belonging to that college.
- Permanent rejection: revoke associated sessions.
- Admin replacement: revoke affected sessions.
- SUPER_ADMIN suspension: revoke all affected sessions.
- Email change: revoke all other sessions and rotate current session.

## 8.6 Single Active College Admin

MVP supports one active COLLEGE_ADMIN per college.

The database uses a MySQL 8 VIRTUAL generated column named `active_college_admin_college_id` with a unique index to enforce this constraint.

Do not make `users.college_id` globally unique.

## 8.7 Registration Revisions

- Each registration revision has a unique version number per college.
- `UNIQUE(college_id, version_number)`.
- `colleges.current_registration_id` references the latest revision.
- Documents belong to the exact registration revision.
- Review operations use expectedVersion.
- Lock the parent college row with SELECT ... FOR UPDATE where required to serialize revision changes.

## 8.8 Email and Outbox

- Use an EmailSender abstraction.
- Use a transactional outbox table named `outbox_emails`.
- Development email service: Mailpit.
- Production SMTP must be environment-configured with TLS.
- Scheduled polling interval: 10 seconds.
- Use SELECT ... FOR UPDATE SKIP LOCKED.
- Email sending occurs outside database transactions.
- Retry failures with exponential backoff.
- Maximum five attempts before permanent failure.
- Recover stale PROCESSING records older than five minutes.
- Remove sensitive token content after successful sending.

## 8.9 File Storage

- Use a DocumentStorageService abstraction.
- Development storage: local filesystem outside the webroot.
- Production storage: private S3-compatible object storage.
- File downloads must be authorized by the backend.
- Do not expose private verification documents through public URLs.

## 8.10 Database Integration Testing

- Use Testcontainers with MySQL 8.0.36 for MySQL integration tests.
- Use JUnit 5 and Mockito.
- Do not use H2 to simulate MySQL-specific behavior.
- Integration tests must never run against the real development database.
- Test database safety guards must remain in place.

## 8.11 Additional Approved Decisions

Other finalized ADRs cover:

- College registration and email verification.
- Permanent rejection and account cleanup.
- College suspension.
- Document lifecycle and upload limits.
- Registration rate limiting.
- Abandoned registration cleanup.
- College administrator email changes.
- Super Admin bootstrap.
- Production email and storage release gates.

When implementing these areas, inspect the ADR documentation for the exact rules rather than relying only on this overview.

# 9. IMPORTANT BUSINESS AND DATA PRINCIPLES

These principles apply throughout the application.

### Academic data integrity

- Preserve historical academic records.
- Do not overwrite historical examination attempts.
- Keep source/imported data separate from authoritative processed records.
- Validate data before processing.
- Avoid duplicate processing.
- Use transactions for important academic state changes.
- Record relevant audit history.

### Academic rules

- Do not assume all universities follow identical grading systems.
- Do not hardcode one university's formulas as universal rules.
- Keep course, regulation, semester, subject, credit, grading, and passing rules properly structured.
- Apply academic rules only when they are explicitly defined and supported by the data.

### Data ownership

- College-owned academic data belongs to its respective college.
- Platform administration does not mean unrestricted cross-tenant access.
- Follow the documented data ownership and authorization rules.

### API security

- Validate every incoming request.
- Enforce role-based authorization on the backend.
- Enforce tenant ownership.
- Never trust college IDs or user IDs supplied by the frontend without authorization checks.
- Return consistent API error responses.
- Avoid exposing internal exceptions, credentials, tokens, or sensitive documents.

# 10. DEVELOPMENT PRINCIPLES

Follow these rules whenever implementing or modifying the project.

1. Inspect before editing.
2. Read the relevant feature specification and implementation notes.
3. Read related ADRs and architecture documents.
4. Understand existing code and conventions.
5. Do not recreate existing functionality.
6. Do not unnecessarily refactor unrelated modules.
7. Do not change approved architectural decisions without explicit approval.
8. Do not introduce new dependencies without justification.
9. Do not add Post-MVP features to the MVP.
10. Keep frontend and backend responsibilities clearly separated.
11. Maintain consistent naming and package structure.
12. Use DTOs for API boundaries where appropriate.
13. Keep business logic out of controllers.
14. Use database transactions appropriately.
15. Add validation and authorization.
16. Add meaningful tests.
17. Update API documentation and relevant project documentation.
18. Do not silently change database schemas or existing migrations.
19. Never delete historical data to simplify implementation.
20. Report incomplete work honestly.

### Permanent Master Context & Progress Tracker Update Rules

1. Update the Master Context after a module or phase is explicitly approved.
2. Never mark a module APPROVED without explicit developer approval.
3. Keep backend, frontend, database, automated testing, and manual verification statuses separate.
4. Preserve previous phase history.
5. Never remove previous approved implementation records.
6. Update the current phase and next recommended module after closure.
7. Record unresolved defects and verification requirements.
8. Do not duplicate detailed implementation reports inside the master file.
9. Keep the master file concise enough to remain useful as an AI context document.
10. Never silently modify finalized ADRs or approved business rules.

# 11. STRICT MODULE-BY-MODULE DEVELOPMENT WORKFLOW

Acadlytic must be developed incrementally.

Do not implement the entire application in one operation.

For every module, follow this workflow:

### Step 1 — Inspection

Inspect:

- Existing project structure.
- Related documentation.
- Existing backend implementation.
- Existing frontend implementation.
- Database schema and migrations.
- Existing tests.
- Dependencies and configuration.

### Step 2 — Planning

Before coding, provide:

- Scope of the module.
- Existing functionality discovered.
- Files expected to be created or modified.
- Database changes, if any.
- API endpoints, if applicable.
- Business logic.
- Authorization requirements.
- Testing plan.
- Potential risks and dependencies.

Wait for approval before proceeding if the task requires significant implementation or architectural decisions.

### Step 3 — Implementation

Implement only the approved module.

Do not start the next module.

Avoid unrelated file changes.

### Step 4 — Automated Testing

Run appropriate:

- Unit tests.
- Integration tests.
- Formatting checks.
- Lint checks.
- Type checks.
- Frontend build.
- Backend build.

Report which tests actually ran and their results.

Never claim that a test passed if it was not executed.

### Step 5 — Implementation Report

Provide a report containing:

- What was implemented.
- Files created.
- Files modified.
- Database changes.
- API endpoints.
- Business rules implemented.
- Tests executed and results.
- Tests not executed and why.
- Known limitations.
- Manual verification instructions.
- Recommended next step.

### Step 6 — Manual Verification

The developer will independently verify the functionality using the relevant tools:

- MySQL Workbench.
- Postman or curl.
- Browser.
- Browser Developer Tools.
- Terminal.
- Mailpit.
- Other relevant services.

Do not mark a module independently verified until the developer has performed the required checks.

### Step 7 — Closure

Only after review, fixes, automated tests, and required manual verification should the module be considered approved.

Then move to the next module.

# 12. CURRENT PROJECT DOCUMENTATION

The repository contains structured project documentation.

Important documentation areas include:

- `docs/03-prd/` — Product requirements and MVP scope.
- `docs/08-task-breakdown/` — Roadmap and task breakdown.
- `docs/09-development/` — Feature specifications and implementation notes.
- Architecture documentation and ADRs.
- API architecture.
- System architecture.
- Security rules.
- Data ownership rules.
- Design system.
- Navigation and project conventions.

The project documentation is the primary reference for detailed requirements.

Before implementing a module, identify and read its exact feature specification and related implementation notes.

If documentation conflicts with existing code or another approved decision, do not silently choose one. Report the conflict and request clarification.

# 13. LIVING PROJECT CONTEXT & PROGRESS TRACKER

The project maintains an active, living record of architectural planning, phase implementations, test results, verification statuses, and development milestones.

## Architecture and Planning Foundation (Preserved Baseline)

- Product scope and two-role MVP boundaries established.
- Feature specifications prepared across functional domains.
- Architecture documentation established.
- 19 Architecture Decision Records (ADRs) finalized.
- Three architecture decisions explicitly deferred (Tenant DB strategy, Storage provider, Result schema versioning).
- Documentation consistency cleanup completed.

---

## 13.1 Overall Project Status

- **Current Development Phase:** Phase 03 — College Registration, Restricted Dashboard & Approval Workflow (`IN_PROGRESS`, Manual E2E Verification Pending) / Phase 04 — College Management (Tenant Management & Profile) (`IN_PROGRESS`, Modules 4.1 & 4.2 APPROVED, Modules 4.3–4.7 NOT_STARTED)
- **Current Module / Status:** Phase 03 Baseline Backend Modules (3.1A, 3.2, 3.3, 3.4 & 3.5), Baseline Frontend Modules (3.1B, 3.2, 3.3, 3.4 & 3.5), Document-Level Review Database Schema & Flyway Migration Module 3.6A, Document-Level Review Backend Service & APIs Module 3.6B, Backend College Approval Integration & Lifecycle Module 3.6C, Super Admin Frontend Document Review Workflow (Unassigned), Document Review UI Redesign & College Admin Hooks Fix (Unassigned), and DEF-01 Targeted Remediation are **APPROVED**. Complete Phase 03 baseline backend verified on Testcontainers MySQL 8.0.36 (237/237 tests passing, schema V5 baseline). Module 3.6A database schema and Flyway V6 migration verified on Testcontainers MySQL 8.0.36 (17/17 migration test cases passing in `V6DocumentLevelReviewMigrationTest`, schema V6 active) and explicitly APPROVED by the project owner on 2026-11-26 (reference report `Module-3.6A-Implementation-Report-v1.3.md`). Module 3.6B backend service and APIs verified across the full backend suite (273/273 tests passing, 0 failures, 0 errors, 0 skipped, clean package build `target/acadlytic-backend-0.0.1-SNAPSHOT.jar`; 125 targeted review/onboarding/migration tests passing including 19/19 in `DocumentReviewIntegrationTest` on Testcontainers MySQL 8.0.36) and explicitly APPROVED by the project owner on 2026-11-26 (reference report `Module-3.6B-Implementation-Report-v1.1.md` — Consolidated Verification Edition). Module 3.6C backend college approval integration and lifecycle verified across full backend test suite (291/291 tests passing, 0 failures, 0 errors, 0 skipped, clean package build `BUILD SUCCESS`; 140 targeted Module 3.6 regression tests passing; 15/15 dedicated college approval integration tests in `CollegeApprovalIntegrationTest` on Testcontainers MySQL 8.0.36; replacement-document relationship and active-document selection verified correct with no production-code correction required) and explicitly APPROVED by the project owner on 2026-11-26 (reference reports `Module-3.6C-Implementation-Report-v1.0.md` and `Module-3.6C-Replacement-Verification-Report-v1.0.md`). Super Admin Frontend Document Review Workflow (Unassigned) verified via automated tests (212/212 full frontend tests passing across 13 test files; 58/58 review tests passing in `super-admin-review.test.tsx`; strict `tsc -b` passed, and production Vite build passed) and explicitly APPROVED by the project owner on 2026-11-26 (reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.1.md`; planning baseline `Module-03-Frontend-Document-Review-Planning-Report-v1.1.md`). Document Review UI Redesign & College Admin Hooks Fix (Unassigned) verified via automated tests (211/211 full frontend tests passing across 14 test files, strict `tsc` clean, production build clean) and manual browser Tests 1–4 completed successfully by user; explicitly APPROVED by project owner on 2026-11-27 (reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.0.md` / `v1.1`). Phase 03 DEF-01 Targeted Remediation (backend document verification gate moved to `APPROVE` branch, `REJECT` and `REQUEST_ACTION` unrestricted, frontend 409 error handling distinguishes `STALE_APPLICATION_VERSION`, `saveAndFlush` optimistic version fix, `DocumentReviewIntegrationTest` fixture stabilized) verified across full backend suite (296/296 passed on Testcontainers MySQL 8.0.36), full frontend suite (213/213 passed across 14 test files), and clean package build; Manual DEF-01 Test A PASSED (HTTP 409 `DOCUMENTS_REJECTED` with zero database/outbox mutations verified); explicitly APPROVED by project owner on 2026-11-27 (reference reports `Phase-03-Final-Backend-Verification-And-Test-Stabilization-Report-v1.0.md`, `DEF-01-Manual-API-Verification-Preflight-Report-v1.0.md`, `DEF-01-Test-A-Post-Request-Database-Invariant-Verification-Report-v1.0.md`, `DEF-01-Test-A-Outbox-Invariant-Evidence-Report-v1.0.md`). Phase 03 overall remains `IN_PROGRESS` (remaining live manual browser/API E2E verification against the live local application environment [Spring Boot backend, Vite frontend, and local MySQL] remains pending). Phase 04 Final Module Breakdown & Dependency Plan v1.2 explicitly APPROVED by project owner on 2026-11-27 (reference artifact `docs/04-phase/Acadlytic_Phase_04_Final_Module_Breakdown_and_Dependency_Plan_v1.2.md`). Phase 04 Module 4.1 College Operational Profile & Schema Foundation (Database + Backend Entity) (Plan v1.2 & Implementation explicitly APPROVED by project owner on 2026-11-28; reference reports: `docs/04-phase/Acadlytic_Module_4.1_Implementation_Report_v1.0.md` and `docs/04-phase/Acadlytic_Module_4.1_Callback_Boundary_Verification_Report_v1.0.md`; verified Flyway V7 DDL adding 13 nullable columns and DML backfill from single authoritative approved revision with 13-column all-null predicate and decoupled contact_email; College entity extended with 13 fields and @Version locking; CollegeLifecycleService#onCollegeApproved synchronized with 9 operational fields; 6 distinct invariant checks across 5 logical categories in preflight callback; callback boundaries verified for V1–V5, V6, and V7; 64/64 focused tests passing [18/18 migration tests in V7CollegeProfileMigrationTest, 25/25 approval integration tests in CollegeApprovalIntegrationTest, 21/21 lifecycle unit tests in CollegeLifecycleServiceUnitTest]; 329/329 full backend test suite passing with 0 failures, 0 errors, 0 skipped; clean package build acadlytic-backend-0.0.1-SNAPSHOT.jar). Phase 04 Module 4.2 Super Admin College Management APIs (Backend) (Plan v1.3 & Implementation explicitly APPROVED by project owner on 2026-11-28; reference report: `docs/04-phase/Acadlytic_Module_4.2_Implementation_Report_v1.2.md`; approved planning baseline: `docs/04-phase/Acadlytic_Module_4.2_Detailed_Implementation_Plan_v1.3.md`; REST endpoints for directory listing, deep college details, status lifecycle management, and profile update; strict state transition rules enforced including INACTIVE → SUSPENDED prohibited with HTTP 400 INVALID_STATUS_TRANSITION, INACTIVE → ACTIVE allowed with mandatory reason and COLLEGE_REACTIVATED audit event, and same-status rejection with HTTP 400 SAME_STATUS_NOOP; reactivation audit event COLLEGE_REACTIVATED decoupled from email template COLLEGE_ACTIVATED; ADR-10 immediate session revocation on transition to SUSPENDED or INACTIVE; active admin summary exposing all 7 Plan v1.3 fields [userId, id, firstName, lastName, fullName, email, status, emailVerified]; INACTIVE college login attempts blocked by AuthService with HTTP 403 COLLEGE_INACTIVE and protected API requests blocked by CollegeAccessGuard with HTTP 403 COLLEGE_INACTIVE; 6/6 unit tests in CollegeManagementServiceUnitTest, 46/46 integration tests in SuperAdminCollegeIntegrationTest on Testcontainers MySQL 8.0.36, 64/64 Module 4.1 regression tests, and 382/382 full backend regression tests passing with 0 failures, 0 errors, 0 skipped; clean package build acadlytic-backend-0.0.1-SNAPSHOT.jar; no new migration; existing V1–V7 preserved; no frontend scope). Phase 04 Modules 4.3–4.7 remain `NOT_STARTED`.
- **Last Approved Module / Workflow:** Phase 04 — Module 4.2: Super Admin College Management APIs (Backend) (Plan v1.3 and Implementation explicitly APPROVED by project owner on 2026-11-28; reference report: `docs/04-phase/Acadlytic_Module_4.2_Implementation_Report_v1.2.md`; approved planning baseline: `docs/04-phase/Acadlytic_Module_4.2_Detailed_Implementation_Plan_v1.3.md`); preceded by Phase 04 — Module 4.1: College Operational Profile & Schema Foundation approved on 2026-11-28, Phase 04 Final Module Breakdown & Dependency Plan v1.2 approved on 2026-11-27, Phase 03 DEF-01 Targeted Remediation and Document Review UI Redesign & College Admin Hooks Fix (Unassigned) approved on 2026-11-27, Super Admin Frontend Document Review Workflow (Unassigned) approved on 2026-11-26, and Module 3.6C Backend College Approval Integration & Lifecycle approved on 2026-11-26.
- **Next Planned Phase / Module:** 1. Phase 03 — Remaining Manual Browser/API E2E Verification & Integration Hardening against the live local application environment (Spring Boot backend, Vite frontend, and local MySQL) (`PENDING`); 2. Phase 04 — Module 4.3 College Admin Profile APIs (Self-Service) (`NOT_STARTED`, awaiting detailed planning authorization).
- **Overall MVP Progress Status:** Phase 01/02 Implemented (Verification Pending); Phase 03 Baseline Backend Complete & APPROVED (Modules 3.1A, 3.2, 3.3, 3.4, and 3.5 Approved; 237/237 baseline backend tests passing); Phase 03 Baseline Frontend Complete & APPROVED (Modules 3.1B, 3.2, 3.3, 3.4, and 3.5 Approved; 200/200 baseline frontend tests passing across 13 test files); Phase 03 Document-Level Review Module 3.6A Database Schema & Flyway Migration APPROVED (Flyway schema V6 active; 17/17 Testcontainers migration tests passing; zero-artifact preflight callback verified; append-only audit schema verified); Phase 03 Document-Level Review Module 3.6B Backend Document Review Service & APIs APPROVED (273/273 full backend test suite passed; 125 targeted review/onboarding tests passed; clean package build verified; idempotency, reversals, hierarchical locking, zero parent mutation, duplicate replacement protection, and lifecycle freeze verified); Phase 03 Backend College Approval Integration & Lifecycle Module 3.6C APPROVED (291/291 full backend tests passing, 140 targeted Module 3.6 regression tests passing, 15/15 dedicated college approval tests passing; clean package build verified; replacement document active-set verification validated); Phase 03 Super Admin Frontend Document Review Workflow (Unassigned) APPROVED (58/58 review tests passing in `super-admin-review.test.tsx`; 212/212 full frontend tests passing across 13 test files; strict `tsc -b` and production Vite build clean; modal workflows, authoritative document version isolation, fail-closed data integrity warning badge & lockout, lifecycle freeze lockout with active history access, assessDocumentReadiness mandatory category enforcement, and error mapping delivered across 14 files); Phase 03 Document Review UI Redesign & College Admin Hooks Fix (Unassigned) APPROVED (single Review button per row, DocumentPreviewReviewModal, Direct Review provenance badge removed from UI, Rules of Hooks violation in OnboardingStatusPage fixed, post-approval navigation fixed, invalid 409 review-detail refetch eliminated; 211/211 frontend tests passing; manual browser Tests 1–4 passed); Phase 03 DEF-01 Targeted Remediation APPROVED (document verification gate moved to `case APPROVE ->`, `REQUEST_ACTION` and `REJECT` unrestricted, frontend 409 error disambiguation, `saveAndFlush` optimistic version fix; 296/296 full backend tests passing, 213/213 full frontend tests passing; Manual DEF-01 Test A PASSED with HTTP 409 `DOCUMENTS_REJECTED` and zero database/outbox mutations verified). Phase 03 overall remains `IN_PROGRESS`. Phase 04 IN_PROGRESS (Final Module Breakdown & Dependency Plan v1.2 approved on 2026-11-27; Module 4.1 College Operational Profile & Schema Foundation Plan v1.2 and Implementation APPROVED on 2026-11-28; Module 4.2 Super Admin College Management APIs Plan v1.3 and Implementation APPROVED on 2026-11-28; Modules 4.3–4.7 NOT_STARTED).

---

## 13.2 Phase Status Table

Status Definitions:
- `NOT_STARTED`: No implementation work has commenced.
- `IN_PROGRESS`: Active implementation is underway.
- `IMPLEMENTATION_COMPLETE`: Code is written and basic compilation/unit checks pass, but verification or approval is pending.
- `VERIFICATION_PENDING`: Implementation complete; full automated test suites, integration tests, or manual checklists are pending execution/confirmation.
- `APPROVED`: Formally verified and explicitly approved by the developer. (Never equate implementation completion with approval).
- `BLOCKED`: Work cannot proceed due to external blockers or missing prerequisites.

| Phase # | Phase Name | Backend | Frontend | Database | Automated Testing | Manual Verification | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 01** | Project & Application Foundation | IMPLEMENTATION_COMPLETE | IMPLEMENTATION_COMPLETE | IMPLEMENTATION_COMPLETE | IMPLEMENTATION_COMPLETE | NOT_VERIFIED | VERIFICATION_PENDING |
| **Phase 02** | Authentication & Authorization Foundation | IMPLEMENTATION_COMPLETE | IMPLEMENTATION_COMPLETE | IMPLEMENTATION_COMPLETE | IMPLEMENTATION_COMPLETE | VERIFICATION_PENDING | VERIFICATION_PENDING |
| **Phase 03** | College Registration, Restricted Dashboard & Approval Workflow | APPROVED (3.1A, 3.2, 3.3, 3.4, 3.5, 3.6A, 3.6B, 3.6C & DEF-01 Remediation Approved) | APPROVED (3.1B, 3.2, 3.3, 3.4 & 3.5 Approved; Frontend Document Review Workflow Approved [Unassigned]; Document Review UI & Hooks Fix Approved [Unassigned]; DEF-01 Frontend 409 Fix Approved) | APPROVED (V6 Schema & Migration, Module 3.6A Approved) | IMPLEMENTATION_COMPLETE (296/296 Full Backend Tests Passed, Testcontainers MySQL; 213/213 Full Frontend Tests Passed across 14 test files, Vitest) | IN_PROGRESS (Manual Browser Tests 1–4 Passed; Manual DEF-01 Test A Passed; Remaining Manual E2E Scenarios Pending) | IN_PROGRESS (Baseline Backend & Frontend Modules 3.1A–3.5 Approved; Modules 3.6A, 3.6B & 3.6C Approved; Document Review UI [Unassigned] Approved; DEF-01 Remediation Approved; Remaining Manual Verification Pending) |
| **Phase 04** | College Management (Tenant Management & Profile) | IN_PROGRESS (Modules 4.1 & 4.2 Approved; Modules 4.3–4.4 Not Started) | NOT_STARTED (Modules 4.5–4.6 Not Started) | APPROVED (V7 Schema & Migration, Module 4.1 Approved) | IN_PROGRESS (Module 4.1: 64/64 Tests Passed; Module 4.2: 6/6 Unit & 46/46 Integration Tests Passed; 382/382 Full Backend Tests Passed, Testcontainers MySQL) | NOT_STARTED | IN_PROGRESS (Plan v1.2 Approved on 2026-11-27; Modules 4.1 & 4.2 Approved on 2026-11-28; Modules 4.3–4.7 Not Started) |
| **Phase 05** | Academic Structure (Programs, Semesters, Subjects, Credits) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 06** | Student Records Management (Records & Enrollment) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 07** | Result Import (Excel & CSV Parsing & Ingestion) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 08** | Result Validation & Error Resolution | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 09** | Result Processing (Authoritative Mutation & Attempt Histories) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 10** | Backlog Lifecycle Tracking (OPEN / RESOLVED States) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 11** | Academic Passport (Administrative Read Model) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 12** | College Academic Analytics (Institutional Dashboards) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 13** | End-to-End Integration & Release Hardening | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 14** | MVP Release Gate & Pilot Deployment | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 15** | Post-MVP ACADEMIC_STAFF Support & Delegated Portal | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 16** | Post-MVP STUDENT Authentication & Student Self-Service Portal | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 17** | Post-MVP Subscription-Based Self-Service Onboarding (Option C) & SaaS Billing | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 18** | Future Platform Capabilities (Overview) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 18.1** | Authorized University API Connectors | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 18.2** | Regulation & Credit Eligibility Engine | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 18.3** | Academic What-If Simulator | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 18.4** | Predictive Academic Risk Intelligence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 18.5** | Natural-Language AI Query | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| **Phase 18.6** | Branch Management, BRANCH_ADMIN & Multi-Campus Enterprise Architecture | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |

> [!IMPORTANT]
> **Phase 03 Status Distinction:**  
> **All Phase 03 Baseline Backend Modules (3.1A, 3.2, 3.3, 3.4 & 3.5), Baseline Frontend Modules (3.1B, 3.2, 3.3, 3.4 & 3.5), Document Review Database Schema & Migration (Module 3.6A), Backend Document Review Service & APIs (Module 3.6B), Backend College Approval Integration & Lifecycle (Module 3.6C), Super Admin Frontend Document Review Workflow (Unassigned), Document Review UI Redesign & College Admin Hooks Fix (Unassigned), and DEF-01 Targeted Remediation APPROVED; Remaining Live Manual Browser/API Verification PENDING.**  
> All five baseline backend modules of Phase 03—Module 3.1A (Backend Registration Foundation), Module 3.2 (Email Verification & College Admin Verification Lifecycle), Module 3.3 (Restricted Dashboard, Document Management & Review Submission), Module 3.4 (Super Admin Approval Queue & Review Workflow), and Module 3.5 (Approval Lifecycle, College Activation & Revisions)—have been completed, verified on Testcontainers MySQL 8.0.36 (237/237 tests passing, Flyway schema V5), and explicitly approved. All five baseline frontend modules of Phase 03 (3.1B, 3.2, 3.3, 3.4, and 3.5) have been implemented, verified via automated tests (200/200 tests passing across 13 test files; strict `tsc -b` passed, and production build passed), and explicitly approved. On 2026-11-26, the Project Owner explicitly APPROVED Module 3.6A (Document-Level Review Database Schema & Flyway Migration; reference report `Module-3.6A-Implementation-Report-v1.3.md`) activating Flyway schema V6 verified on Testcontainers MySQL 8.0.36 (17/17 migration test cases passing in `V6DocumentLevelReviewMigrationTest`). On 2026-11-26, following review of consolidated verification report v1.1, the Project Owner explicitly APPROVED Module 3.6B (Backend Document Review Service & APIs; reference report `Module-3.6B-Implementation-Report-v1.1.md`) verified on full backend test suite (273/273 tests passing). On 2026-11-26, the Project Owner explicitly APPROVED Module 3.6C (Backend College Approval Integration & Lifecycle; reference reports `Module-3.6C-Implementation-Report-v1.0.md` and `Module-3.6C-Replacement-Verification-Report-v1.0.md`) verified on full backend test suite (291/291 tests passing, 0 failures, 0 errors, 0 skipped, clean package build `BUILD SUCCESS`; 140 targeted Module 3.6 regression tests passing; 15/15 dedicated college approval integration tests in `CollegeApprovalIntegrationTest` on Testcontainers MySQL 8.0.36; replacement-document relationship and active-document selection verified correct with no production-code correction required). On 2026-11-26, the Project Owner explicitly APPROVED the Super Admin Frontend Document Review Workflow (Unassigned; reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.1.md`; planning baseline `Module-03-Frontend-Document-Review-Planning-Report-v1.1.md`) verified on full frontend test suite (212/212 tests passing across 13 test files, 58/58 review tests passing in `super-admin-review.test.tsx`, strict `tsc -b` clean, production Vite build clean; 14 total files affected). On 2026-11-27, the Project Owner explicitly APPROVED the Document Review UI Redesign & College Admin Hooks Fix (Unassigned; reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.0.md` / `v1.1`) delivering single Review action button per row, DocumentPreviewReviewModal, Direct Review provenance badge removal from UI, OnboardingStatusPage Rules of Hooks violation resolution, post-approval navigation correction, and elimination of invalid 409 review-detail refetch, verified via 211/211 automated tests and manual browser Tests 1–4. On 2026-11-27, the Project Owner explicitly APPROVED Phase 03 DEF-01 Targeted Remediation (reference reports `Phase-03-Final-Backend-Verification-And-Test-Stabilization-Report-v1.0.md` and `DEF-01-Test-A-Post-Request-Database-Invariant-Verification-Report-v1.0.md`) relocating the document verification gate into `case APPROVE ->`, keeping `REJECT` and `REQUEST_ACTION` unrestricted, disambiguating frontend 409 error handling for `STALE_APPLICATION_VERSION`, delivering `saveAndFlush` optimistic version synchronization, and stabilizing `DocumentReviewIntegrationTest`, verified across 296/296 backend tests, 213/213 frontend tests, clean package build, and Manual DEF-01 Test A returning HTTP 409 `DOCUMENTS_REJECTED` with zero database or outbox mutations. Phase 03 overall remains `IN_PROGRESS` until remaining live manual browser/API E2E verification against the live local application environment (Spring Boot backend, Vite frontend, and local MySQL) is completed.

> [!IMPORTANT]
> **Phase 04 Implementation Status:**  
> **Phase 04 IN_PROGRESS: Modules 4.1 & 4.2 APPROVED on 2026-11-28; Modules 4.3–4.7 NOT_STARTED.**  
> On 2026-11-27, the Project Owner explicitly APPROVED the phase-level planning artifact `Acadlytic_Phase_04_Final_Module_Breakdown_and_Dependency_Plan_v1.2.md` (`docs/04-phase/Acadlytic_Phase_04_Final_Module_Breakdown_and_Dependency_Plan_v1.2.md`) under Parent Epic E2 (Tenant Management & Profile). On 2026-11-28, Module 4.1 (College Operational Profile & Schema Foundation) and Module 4.2 (Super Admin College Management APIs) were explicitly APPROVED following verification on Testcontainers MySQL 8.0.36. Modules 4.3 through 4.7 remain strictly `NOT_STARTED`. Phase 03 remains independently tracked as `IN_PROGRESS`.

---

## 13.3 Backend Progress Tracker

### Implemented Modules & Structure (Phase 01 & Phase 02)
- **`com.acadlytic.common`**: Common exception hierarchy (`AcadlyticException`, `ResourceNotFoundException`, `UnauthorizedException`, `ValidationException`), unified API envelope (`ApiResponse<T>`, `ErrorResponse`), global exception handler (`GlobalExceptionHandler`), and health controller (`HealthController`).
- **`com.acadlytic.config`**: Spring Web security configuration (`SecurityConfig`), Spring Session JDBC configuration (`SessionConfig`), CORS policy mapping (`WebMvcConfig`), and password encoder bean (BCrypt strength 12).
- **`com.acadlytic.modules.auth`**:
  - *Entities & Enums:* `User`, `Role` (`SUPER_ADMIN`, `COLLEGE_ADMIN`), `UserStatus` (`ACTIVE`, `SUSPENDED`, `LOCKED`, `PENDING_PASSWORD_RESET`), `PasswordResetToken`, `AuditEvent`, `AuditEventType`.
  - *Repositories:* `UserRepository`, `PasswordResetTokenRepository`, `AuditEventRepository`.
  - *Services:* `AuthService` (login, logout, session creation, password reset request/confirmation, change password), `AuditEventService` (asynchronous audit event logging), `PasswordPolicyValidator` (12–128 chars, uppercase, lowercase, digit, special char), `SuperAdminBootstrapRunner` (idempotent system owner account initialization on startup).
  - *Controllers & DTOs:* `AuthController` with endpoints:
    - `POST /api/v1/auth/login` (email, password -> session cookie)
    - `POST /api/v1/auth/logout` (session invalidation)
    - `GET /api/v1/auth/me` (current authenticated user DTO)
    - `GET /api/v1/auth/csrf` (CSRF token bootstrap)
    - `POST /api/v1/auth/forgot-password` (generic non-enumerating token generation)
    - `POST /api/v1/auth/reset-password` (token consumption & password update)
    - `POST /api/v1/auth/change-password` (authenticated password change with session revocation)
  - *Phase 03 Module 3.2 Implementation (Email Verification Lifecycle):*
    - Endpoints: `POST /api/v1/auth/verify-email` (public, CSRF-protected, consumes single-use 48h token via pessimistic write lock), `POST /api/v1/auth/resend-verification` (authenticated `COLLEGE_ADMIN`, CSRF-protected, dual-layer rate limited, transactional token issuance with outbox dispatch).
    - DTOs: `VerifyEmailRequest`, `VerifyEmailResponse`.
    - Services & Components: `UserRateLimiter` (sliding-window rate limiter enforcing max 3 resends per 15 min per user, delegating to `IpRateLimiter` for independent 5/hr IP limit).
    - Token Service & Repo Extensions: `findByTokenHashAndTokenTypeWithLock` with `@Lock(LockModeType.PESSIMISTIC_WRITE)`, `lockAndValidateToken`, `markTokenUsed`, `revokeActiveTokensForUser`.
    - Audit Event: `EMAIL_VERIFICATION_RESENT`.
    - Security: `POST /api/v1/auth/verify-email` permitted in `SecurityConfig`.
- **`com.acadlytic.modules.colleges`**:
  - *Phase 02 Baseline:* Tenant foundation entity (`College`), lifecycle enums (`CollegeApprovalStatus`, `CollegeStatus`), Spring Data repository (`CollegeRepository`), and auth extension seams (`CollegeRegistrationStatusProvider`, `DefaultCollegeRegistrationStatusProvider`).
  - *Phase 03 Module 3.1A Implementation:* Full versioned registration revision entity (`CollegeRegistration`), document entity (`CollegeRegistrationDocument`), category enum (`DocumentCategory`), repositories (`CollegeRegistrationRepository`, `CollegeRegistrationDocumentRepository`), DTOs (`RegisterCollegeRequest`, `CollegeRegistrationResponse`), thread-safe sliding window IP rate limiter (`IpRateLimiter`), registration intake service (`CollegeRegistrationService`), and public registration controller (`CollegeRegistrationController` at `POST /api/v1/college-registrations`).
  - *Phase 03 Module 3.3 Implementation (College Admin Restricted Dashboard, Document Management & Review Submission):*
    - Endpoints: `GET /api/v1/college-registrations/my-application` (dashboard state provider), `POST /api/v1/college-registrations/my-application/correction-draft` (immutable revision v+1 creation), `PUT /api/v1/college-registrations/my-application` (draft profile editing & college name sync), `POST /api/v1/college-registrations/my-application/documents` (document upload & auto/explicit replacement), `GET /api/v1/college-registrations/my-application/documents` (active document listing), `GET /api/v1/college-registrations/my-application/documents/{documentId}` (tenant-isolated document download with safe headers), `DELETE /api/v1/college-registrations/my-application/documents/{documentId}` (active document removal & predecessor restoration), `POST /api/v1/college-registrations/my-application/submit` (atomic submission gate & revision freeze).
    - Services & Components: `CollegeOnboardingService` (orchestrates application retrieval, decoupled review feedback, pessimistic locking on parent `College`, draft creation, document replacement lineage, and review submission), `LocalFileSystemDocumentStorageService` (outside-webroot storage, path validation, file duplication), `DocumentValidator` (magic bytes, MIME type, file size verification for PDF, JPEG, PNG), `DocumentStorageCompensationHandler` (Spring `TransactionSynchronization` rollback purge).
    - Repositories & Locks: `CollegeRepository.findByIdWithLock` (pessimistic write lock with 3000ms timeout), `CollegeRegistrationDocumentRepository.findByIdAndCollegeId`.
    - Configuration: `DocumentProperties` (`acadlytic.documents.*` with fail-fast startup probe validation).
    - DTOs: `MyApplicationResponse`, `CurrentRevisionResponse`, `CollegeSummaryResponse`, `CollegeProfileResponse`, `ReviewFeedbackResponse`, `ResubmissionAllowanceResponse`, `OnboardingChecklistResponse`, `DocumentResponse`, `UpdateApplicationRequest`, `SubmitApplicationResponse`, `DocumentDownload`.
    - Audit Events: `COLLEGE_REGISTRATION_DOC_UPLOADED`, `COLLEGE_REGISTRATION_DOC_REMOVED`, `COLLEGE_REGISTRATION_CORRECTION_DRAFT_CREATED`, `COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW`, `COLLEGE_REGISTRATION_RESUBMITTED`.
  - *Phase 03 Module 3.4 Implementation (Super Admin Approval Queue & Review Workflow):*
    - Endpoints:
      - `GET /api/v1/super-admin/colleges/reviews`: Super Admin review queue with 5-operation bounded query retrieval, eligible pending filter, in-memory active document calculation, search & sort whitelisting.
      - `GET /api/v1/super-admin/colleges/reviews/{collegeId}`: Application review detail inspection with tenant overview, admin profile, authoritative submitted revision, active verification documents, full revision timeline history, concurrency version token.
      - `GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}`: Secure streaming document inspection & download with 4-step multi-point ownership validation and safe download security headers (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-cache, no-store`).
      - `POST /api/v1/super-admin/colleges/reviews/{collegeId}/decision`: Transactional review decision execution for `APPROVE`, `REQUEST_ACTION`, and non-permanent `REJECT` with dual pessimistic row lock and optimistic version concurrency checks, audit trail recording.
    - Services & Components: `CollegeReviewService` (orchestrates bounded queue retrieval, application detail assembly, multi-point document download verification, and dual-locked decision execution).
    - Common DTOs: `PageResponse<T>` (`com.acadlytic.common.dto`).
    - Module DTOs & Enums: `ReviewQueueItemResponse`, `CollegeReviewDetailResponse`, `CollegeReviewSummaryResponse`, `ReviewAdminUserResponse`, `SubmittedRevisionResponse`, `ReviewHistoryItemResponse`, `ReviewDecisionRequest`, `ReviewDecisionResponse`, `ReviewDecisionAction`.
    - Repositories & Locks:
      - `CollegeRegistrationRepository.findPendingReviewQueue` (theta-join query and count query).
      - `UserRepository.findByCollegeIdInAndRoleAndStatus` (batch active college admin lookup).
      - `AuditEventRepository.findByCollegeId` (historical review audit logs).
      - `CollegeRegistrationDocumentRepository.findByRegistrationIdIn` (batch document lookup).
      - Pessimistic write lock (`findByIdWithLock`) on `College` with 3000ms timeout coupled with optimistic `@Version` checks (`expectedVersion`).
    - Audit Events: `COLLEGE_REGISTRATION_APPROVED`, `COLLEGE_REGISTRATION_ACTION_REQUIRED`, `COLLEGE_REGISTRATION_REJECTED`.
  - *Phase 03 Module 3.5 Implementation (Approval Lifecycle, College Activation & Revisions):*
    - Services & Components:
      - `CollegeLifecycleService`: Orchestrates operational college activation (`colleges.status = ACTIVE`), outbox notifications (`COLLEGE_REGISTRATION_APPROVED`, `COLLEGE_REGISTRATION_ACTION_REQUIRED`, `COLLEGE_REGISTRATION_REJECTED`), permanent rejection lifecycle (`permanently_rejected = TRUE`, `status = INACTIVE`, `users.status = INACTIVE`, code/email release, active session revocation, outbox notification `COLLEGE_REGISTRATION_PERMANENTLY_REJECTED`), isolated transactional archival, and secondary residual draft document sweeper.
      - `DocumentPurgeMarkerService`: Dedicated Spring-managed service ensuring proxy-effective `REQUIRES_NEW` transaction semantics for durable `file_purged_at` marker persistence on `college_registration_documents` rows while keeping physical file deletion strictly outside database transactions.
      - `CollegeCleanupScheduler`: Scheduled daily tasks invoking 7-day abandoned registration cleanup, 7-day permanently rejected college archival, and residual draft document sweeper.
      - Idempotent Keyset Sweeper: `sweepResidualAbandonedDraftDocuments()` iterates unpurged draft documents (`c.archived_at IS NOT NULL AND r.submitted_for_review_at IS NULL AND d.file_purged_at IS NULL`) without age cutoff using cursor `lastProcessedId` that resets to `0L` at the start of each execution, guaranteeing automated retry of failed physical deletions across runs.
      - Permanent Document Metadata Preservation: Zero database document rows deleted; physical files purged while preserving registration-document linkages, checksums, and audit trails permanently.
    - Repositories & Locks:
      - `CollegeRepository.findAbandonedRegistrations` (evaluating all 12 abandonment conditions using verified typed `CollegeApprovalStatus.PENDING`, `CollegeStatus.PENDING_VERIFICATION`, `Role.COLLEGE_ADMIN`, and `UserStatus.ACTIVE`).
      - `CollegeRepository.findPermanentlyRejectedForArchival` (identifying permanently rejected colleges after 7-day retention).
      - `CollegeRegistrationDocumentRepository.findEligibleAbandonedDraftDocumentsKeyset` (keyset pagination over eligible draft documents with `filePurgedAt IS NULL`).
      - Pessimistic write lock (`findByIdWithLock`) on `College` for archival operations.
    - Configuration: `CleanupProperties` (`acadlytic.cleanup.*` specifying batch sizes, abandoned retention days, and permanent rejection retention days).
    - Audit Events: `COLLEGE_ACTIVATED`, `COLLEGE_PERMANENTLY_REJECTED`, `COLLEGE_ADMIN_DEACTIVATED`, `ABANDONED_REGISTRATION_ARCHIVED`, `PERMANENTLY_REJECTED_COLLEGE_ARCHIVED`.
  - *Phase 03 Module 3.6A Implementation (Document-Level Review Database Schema & Flyway Migration):*
    - Enums & Entities: `DocumentVerificationStatus` (`PENDING`, `ACCEPTED`, `REJECTED`), `DocumentVerificationProvenance` (`NOT_REVIEWED`, `DIRECT_REVIEW`, `LEGACY_COLLEGE_APPROVAL`), and updated entity `CollegeRegistrationDocument` mapping verification status, notes, reviewer ID, timestamp, and provenance.
    - Preflight Callback: `V6DocumentReviewMigrationPreflightCallback` (`com.acadlytic.modules.colleges.migration`), a Spring `@Component` implementing Flyway `Callback` (`BEFORE_EACH_MIGRATE` for target version 6) ensuring zero-artifact preflight validation against the exact 8-tuple whitelist.
    - Audit Schema: Append-only table `college_document_reviews` with composite foreign key constraint `fk_cdr_document_ownership` referencing `college_registration_documents(id, college_id, registration_id)` and MySQL triggers `trg_cdr_prevent_update` and `trg_cdr_prevent_delete` preventing UPDATE and DELETE mutations.
    - Migration Tests: `V6DocumentLevelReviewMigrationTest` (17 test cases on Testcontainers MySQL 8.0.36 validating schema DDL, exact 8-tuple whitelist backfill, NULL reviewer/timestamp preservation for legacy approval, composite foreign key integrity, append-only triggers, runtime user privilege isolation, zero-routine persistence on failure, and `flyway.repair()` recovery flow).
  - *Phase 03 Module 3.6B Implementation (Backend Document Review Service & APIs):*
    - Enums & DTOs: `DocumentReviewAction` (`ACCEPT`, `REJECT`), `DocumentReviewDecisionRequest` (`action`, `reviewNotes`, `rejectionReason`, `expectedDocumentVersion`), `DocumentReviewDecisionResponse`, `DocumentReviewHistoryItemResponse`, and updated `DocumentResponse` enriched with document verification fields.
    - Entities & Repositories: JPA entity `CollegeDocumentReview`, repository `CollegeDocumentReviewRepository` with deterministic reverse-chronological ordering query (`findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc`), and `CollegeRegistrationDocumentRepository` with pessimistic write lock query `findByIdAndCollegeIdWithLock`.
    - Review Service & Controller: `CollegeReviewService` implementing `recordDocumentDecision`, `executeRecordDocumentDecision`, and `getDocumentReviewHistory`. Enforces hierarchical locking (parent `College` row locked first, target `CollegeRegistrationDocument` row locked second), bounded retries with `TransactionTemplate` using `PROPAGATION_REQUIRES_NEW` (up to 3 attempts with exponential backoff), zero parent `College.version` mutation, optimistic concurrency version checking, and idempotency (matching rejection reason on retry returns 200 without version increment or duplicate audit entries; mismatched reason or action on stale version rejected with `409 STALE_DOCUMENT_VERSION`). `CollegeReviewController` exposing `POST /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/decision` and `GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/history`.
    - Replacement Document Rules & Resubmission: `CollegeOnboardingService` enforcing duplicate replacement protection in draft revisions (`409 REPLACEMENT_ALREADY_EXISTS` and DB unique constraint `uq_crd_registration_replacement`), cross-revision replacement targeting rejected documents from immediately preceding submitted revision ($v-1$), category match enforcement, carry-forward exclusion of rejected documents, and restoring `college.setApprovalStatus(PENDING)` upon resubmission.
    - Audit Events: `COLLEGE_REGISTRATION_DOC_ACCEPTED`, `COLLEGE_REGISTRATION_DOC_REJECTED`.
    - Integration Tests: `DocumentReviewIntegrationTest` (19 test cases on Testcontainers MySQL 8.0.36 validating authentication, authorization, cross-college 404, cross-revision 409, valid ACCEPT, valid REJECT, rejection reason constraints, optimistic concurrency stale version 409, idempotent retry with matching status/reason, rejection reason mismatch 409, status reversals, parent-locked concurrency serialization, duplicate replacement prevention, cross-revision replacement rules, lifecycle freeze across APPROVE/REQUEST_ACTION/REJECT, resubmission unfreezing, append-only triggers, history API, and detail enrichment).
- **`com.acadlytic.modules.outbox`**:
  - *Entities:* `OutboxEmail`, `OutboxStatus` (`PENDING`, `SENT`, `FAILED`).
  - *Repository:* `OutboxEmailRepository`.
  - *Services:* `OutboxEmailWorker` (scheduled polling worker dispatching emails to SMTP / Mailpit with retry count and failure logging).
- **`com.acadlytic.security`**:
  - `CollegeAccessGuard` (SpEL authorization helper enforcing college tenant boundaries).
  - `SessionRevocationService` (Finds and deletes active user sessions via Spring Session JDBC repository).
- **`com.acadlytic.support`**:
  - `AbstractMySqlIntegrationTest` (Base integration harness with Testcontainers MySQL 8.0.36 or local fallback, coupled with `TestDatabaseSafetyGuard` to prevent execution against non-test databases).

### Database Changes & Migrations
- `V1__init_schema.sql`: Initial schema defining `colleges`, `users`, and `audit_events`.
- `V2__spring_session_jdbc.sql`: Standard Spring Session JDBC tables (`SPRING_SESSION`, `SPRING_SESSION_ATTRIBUTES`).
- `V3__auth_core_schema.sql`: Added `password_reset_tokens`, `outbox_emails`, college onboarding fields (`onboarding_status`, `rejection_reason`), user failed attempt counters, lockout timestamps, and audit event indexes.
- `V4__college_registration_schema.sql`: Added `college_registrations` table (versioned application revisions, status checks, uniqueness on `(college_id, version_number)`), `college_registration_documents` table (verification documents, checksums, categories), and altered `colleges` adding `current_registration_id`, `resubmission_count`, `action_required_count`.
- `V5__crd_file_purged_at.sql`: Added `file_purged_at TIMESTAMP NULL` column to `college_registration_documents` and index `idx_crd_file_purged_at (file_purged_at)` for durable tracking of physical file deletions without deleting document database rows.
- `V6__document_level_review.sql`: Added columns `verification_status` (`VARCHAR(32)` defaulting to `'PENDING'`), `verification_notes` (`VARCHAR(1000)` NULL), `verified_by_user_id` (`BIGINT` FK to `users`), `verified_at` (`TIMESTAMP(6)` NULL), and `verification_provenance` (`VARCHAR(32)` defaulting to `'NOT_REVIEWED'`) to `college_registration_documents`. Created indexes `idx_crd_verification_status`, `idx_crd_review_lookup`, and composite unique key `uq_crd_composite_owner (id, college_id, registration_id)`. Created append-only audit table `college_document_reviews` with composite FK `fk_cdr_document_ownership` and MySQL triggers `trg_cdr_prevent_update` / `trg_cdr_prevent_delete` raising `SIGNAL SQLSTATE '45000'`. Backfilled legacy rows using exact 8-tuple `(college.approval_status, registration.status)` whitelist mapping `('APPROVED', 'APPROVED')` to `('ACCEPTED', 'LEGACY_COLLEGE_APPROVAL')` with NULL reviewer/timestamp, and remaining 7 valid tuples to `('PENDING', 'NOT_REVIEWED')`. Paired with zero-artifact Flyway Java preflight callback (`V6DocumentReviewMigrationPreflightCallback`).

### Security Implementation
- Stateful session management via Spring Session JDBC (`ACADLYTIC_SID` HttpOnly, SameSite=Lax, Secure in prod).
- Double-submit CSRF cookie (`XSRF-TOKEN` readable by frontend, `X-XSRF-TOKEN` header validated on mutating requests).
- Brute-force lockout: 5 consecutive failed attempts lock user account for 15 minutes (`HTTP 429`).
- Generic non-enumerating responses on login and password reset to prevent user harvesting.
- Password policy enforcement: 12–128 characters, upper/lower, digit, special character.
- Multi-session invalidation upon password reset or security revocation.
- Transactional outbox pattern: Password reset emails written to DB within same transaction, avoiding lost notifications.

### Tests & Actual Results
- **Unit Tests: 30 Passed, 0 Failed, 0 Skipped.**
  - `HealthControllerTest` (1 test): PASSED
  - `SessionConfigUnitTest` (3 tests): PASSED
  - `AuditEventServiceUnitTest` (4 tests): PASSED
  - `AuthServiceUnitTest` (9 tests): PASSED
  - `PasswordPolicyValidatorTest` (6 tests): PASSED
  - `SuperAdminBootstrapRunnerUnitTest` (2 tests): PASSED
  - `OutboxEmailWorkerUnitTest` (2 tests): PASSED
  - `CollegeAccessGuardUnitTest` (2 tests): PASSED
  - `SessionRevocationServiceUnitTest` (1 test): PASSED
- **Integration Tests: 19 Implemented, NOT_RUN (Pending execution).**
  - `AcadlyticApplicationTests` (1 test)
  - `AuthEndToEndIntegrationTest` (8 tests)
  - `SchemaAndConstraintsIntegrationTest` (6 tests)
  - `OutboxWorkerIntegrationTest` (3 tests)
  - `TestDatabaseSafetyGuardTest` (1 test)
  *(Awaiting running Docker Desktop daemon or MySQL 8.x test database on host).*

### Outstanding Backend Work
- Execute the 19 MySQL integration tests against live MySQL / Testcontainers and verify all pass.
- Verify live SuperAdmin account creation via bootstrap runner against real database.
- Verify live SMTP delivery to Mailpit.

---

## 13.4 Frontend Progress Tracker

### Implemented Pages & UI Components (Phase 01, Phase 02, Phase 03 Module 3.1B, Module 3.2, Module 3.3, Module 3.4, Module 3.5 & Super Admin Frontend Document Review Workflow)
- **Pages:**
  - `LoginPage` (`src/pages/auth/LoginPage.tsx`): Email/password credentials entry, failed attempt lockout display, CSRF bootstrap, redirect to dashboard or original target URL.
  - `ForgotPasswordPage` (`src/pages/auth/ForgotPasswordPage.tsx`): Password reset request with generic non-enumerating confirmation message.
  - `ResetPasswordPage` (`src/pages/auth/ResetPasswordPage.tsx`): Raw token consumption from URL query params, automatic URL token clearing, password validation schema, submission.
  - `ChangePasswordPage` (`src/pages/auth/ChangePasswordPage.tsx`): Authenticated user password update.
  - `HomePage`, `HealthCheckPage`, `NotFoundPage`, `UnauthorizedPage`.
  - `OnboardingStatusPage` (`src/pages/OnboardingStatusPage.tsx`): Complete restricted dashboard for unapproved and pending college admins. Integrates authoritative aggregate fetching via `useMyApplication`, immediate client-side redirection for approved admins (`/college/dashboard`), unverified email alert banner with embedded `<ResendVerificationButton />`, HTTP 403 permanent rejection handling, hero status banner, review feedback card, 4-step compliance checklist, college profile card with edit modal, document management table with lineage badges and upload/replace/delete modals, submit review confirmation modal, and revision history drawer. *Phase 03 Module 3.3 APPROVED.*
  - `RegisterCollegePage` (`src/pages/auth/RegisterCollegePage.tsx`): Interactive self-service college registration intake wizard toggling between `RegistrationForm` and `RegistrationSuccessView`. *Phase 03 Module 3.1B APPROVED.*
  - `VerifyEmailPage` (`src/pages/auth/VerifyEmailPage.tsx`): Dedicated email token consumption view extracting raw token from query params, immediately stripping the token from the browser address bar before dispatching the redemption API request while preserving unrelated query params and router location state, rendering responsive status states (`VERIFYING`, `SUCCESS`, `INVALID_OR_EXPIRED`, `UNAUTHENTICATED`, `RATE_LIMITED`, `ERROR`). *Phase 03 Module 3.2 APPROVED.*
  - `SuperAdminReviewQueuePage` (`src/pages/admin/SuperAdminReviewQueuePage.tsx`): Super Admin college verification approval queue featuring search, client-side date range validation (`from <= to`) with ISO-8601 UTC boundary serialization, sort ordering, pagination reset on filter changes, and responsive table. *Phase 03 Module 3.4 APPROVED.*
  - `CollegeReviewDetailPage` (`src/pages/admin/CollegeReviewDetailPage.tsx`): Comprehensive institutional review dossier displaying administrative credentials, profile details, active verification documents with SHA-256 checksums, decision history audit trail, optimistic version concurrency conflict recovery (`409 STALE_APPLICATION_VERSION`), decision modal workflows, document-level review modal workflows (`DocumentReviewDecisionModal`), document review audit history inspection (`DocumentReviewHistoryModal`), document status and provenance badges (`DocumentStatusBadge`), readiness summary, and error mapping for document gates. *Phase 03 Module 3.4 & Super Admin Frontend Document Review Workflow APPROVED.*
  - `CollegeAdminDashboardPage`, `SuperAdminDashboardPage` (Minimal landing shells pending respective phases).
- **Module 3.1B Registration Components (`src/components/registration/`):**
  - `RegistrationForm`: 16-control structured intake form across 3 sections (Institution Details, Campus Address & Location, Primary Administrator Account) with responsive layout (`sm:max-w-3xl` in `AuthLayout`), field-level server error mapping, dynamic rate-limit countdown, and CSRF token retry handling.
  - `RegistrationSuccessView`: Post-submission confirmation displaying registration metadata, 4-step onboarding roadmap, spam notice, unauthenticated session status, and 48-hour email verification requirement.
  - `PasswordStrengthMeter`: Real-time structural validation (12–128 characters, email containment prohibition matching `PasswordPolicyValidator.java`) and advisory entropy guidance.
  - `RegistrationSectionHeader`: Presentational section header with numbered step badges.
- **Module 3.2 Email Verification Components (`src/components/verification/`):**
  - `VerifyEmailStatusCard`: Stateful status card rendering accessible alerts, loading spinners, dynamic error titles/descriptions, and contextual action buttons (Login redirect, Dashboard redirect, Try Again, and Resend Verification).
  - `ResendVerificationButton`: Authenticated resend action button featuring dual-layer rate limit handling, active second-by-second countdown timer (`Resend in Xs`) when `Retry-After` is valid, and persistent warning with manual dismissal when `Retry-After` is missing/malformed (never fabricates countdown).
- **Module 3.3 Onboarding Dashboard Components (`src/components/onboarding/`):**
  - `OnboardingStatusBanner`: Hero status banner with lifecycle badge, revision badge, resubmission counters, frozen review notice, and "Start Correction Draft" action.
  - `ReviewFeedbackCard`: Decoupled review card presenting Super Admin deficiency notes, rejection reasons, and review timestamps.
  - `OnboardingChecklistCard`: 4-step interactive compliance checklist with embedded `<ResendVerificationButton />`, progress bar, and review submit trigger.
  - `CollegeProfileCard`: Institutional details card (legal name, permanent code, address, phone, website, university) with edit modal trigger.
  - `EditProfileModal`: React Hook Form + Zod resolver modal for draft profile editing with immutable college code and backend field-error mapping.
  - `DocumentManagementSection`: Active verification documents table with category badges, formatted file sizes, replacement lineage badges, and download/replace/delete actions.
  - `DocumentUploadModal`: Upload modal with category selector, drag-and-drop file picker, 10MB limit enforcement, pre-upload binary magic byte probe, and replace mode.
  - `SubmitApplicationModal`: Confirmation modal detailing irrevocable application freeze and checklist verification before triggering review submission.
  - `RevisionHistoryDrawer`: Timeline modal dialog presenting the historical revision audit trail ($v_1, v_2\dots$) with outcomes and reviewer notes.
  - `index.ts`: Barrel export cleanly encapsulating all 9 onboarding domain components.
- **Module 3.4 & Document Review Super Admin Review Components (`src/components/review/`):**
  - `CollegeReviewHeader`: Header displaying college legal name, approval status badge, code, revision number, submission timestamp, concurrency version lock, and embedded `ResubmissionAllowanceBadge`.
  - `ReviewAdminUserCard`: Proposed administrator card displaying full name, verified email badge, contact phone, and registration timestamp.
  - `CollegeProfileReviewCard`: Institutional profile card detailing legal entity name, affiliation, registered campus address, phone, and sanitized external website link.
  - `ResubmissionAllowanceBadge`: Badge tracking submitted correction revisions ($v_1=0$ initial vs $v_2..v_4$ corrections), action cycles ($0..10$), and final revision / action ceiling warnings.
  - `ReviewDocumentListCard`: Table of active compliance documents with category badges, formatted file sizes, monospaced SHA-256 checksum snippets with full tooltip hashes, streaming download trigger, document status badges (`DocumentStatusBadge`), provenance indicators, replacement lineage notes, fail-closed data integrity warning badge for missing version, and actions ("Review", "View History").
  - `DocumentStatusBadge`: Category/status badge displaying document verification state (`PENDING`, `ACCEPTED`, `REJECTED`, `NOT_REVIEWED`) and provenance (`CARRIED_FORWARD`, `LEGACY_COLLEGE_APPROVAL`), plus fail-closed missing version warning badge with review lockout.
  - `DocumentReviewDecisionModal`: Accessible modal dialog for document-level review decisions (`ACCEPT` or `REJECT` with mandatory reason 10–1000 chars), strictly bound to authoritative `doc.version` (supporting version 0 as valid initial upload), with concurrency conflict recovery and duplicate submit prevention.
  - `DocumentReviewHistoryModal`: Modal dialog displaying chronological document decision audit history with status badges, reviewer emails, timestamps, and notes/reasons across all review lifecycle states.
  - `SubmittedRevisionCard`: Presentational snapshot card for specific revision details.
  - `RevisionHistoryTimelineCard`: Audit timeline displaying chronological past review decisions, reviewer admin emails, timestamps, decision badges, and constructive notes / rejection reasons.
  - `ReviewDecisionPanel`: Prominent action toolbar with "Approve", "Request Action" (disabled if action count $\ge 10$), and "Reject" (annotated for final revisions) buttons. Disables all decisions if status is not `PENDING`. Integrated with `assessDocumentReadiness` to enforce mandatory categories (`UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`) and require all active uploaded documents to be `ACCEPTED` prior to application approval.
  - `ReviewDecisionModal`: Accessible modal dialog for review decision confirmation and input with React Hook Form + Zod validation, `noValidate` flag, concurrency version locking, guidance callouts, double-submission prevention, explicit 409 conflict handling, and backend error code mapping (`REQUIRED_DOCUMENTS_MISSING`, `DOCUMENTS_REJECTED`, `DOCUMENTS_NOT_VERIFIED`).
  - `ReviewQueueFilterBar`: Accessible search and filter bar with search input, HTML5 date pickers (`htmlFor`/`id` paired), sorting dropdown, date range validation error banner, and clear filters reset button.
  - `ReviewQueueTable`: Responsive data table rendering pending applications, college code, revision badge, administrator contact, submission timestamp, document count badge, empty state, and review navigation button.
  - `index.ts`: Clean barrel export encapsulating all domain review components, badges, modals, and formatting helpers.
- **Component Primitives (`src/components/ui/`):**
  - Accessible `Button`, `Card`, `Input`, `Select`, `Textarea`, `Modal`, `Alert`, `Table`, `LoadingSpinner`, `ErrorState`.
- **Layouts & Navigation (`src/layouts/`, `src/components/navigation/`):**
  - `RootLayout` (Global provider wrapper: QueryClientProvider, router outlet), `AuthLayout` (Dynamic centered auth card container: `sm:max-w-3xl` for registration, `sm:max-w-md` for standard auth), `AppLayout` (Authenticated shell with Header and Sidebar), `Header`, `Sidebar` (Enhanced with Super Admin "Approval Queue" navigation link pointing to `/admin/colleges/reviews` with `ClipboardCheck` icon), `PageContainer`.

### Routes & Protected Routing (`src/routes/`)
- `ProtectedRoute`: Checks `isAuthenticated` and `CurrentUser`; redirects unauthenticated requests to `/auth/login` preserving return URL in location state.
- `PublicOnlyRoute`: Prevents authenticated users from accessing login/forgot-password pages, redirecting to their respective role dashboard.
- `RoleGuard`: Enforces role-based permissions (`SUPER_ADMIN` vs `COLLEGE_ADMIN`), routing unauthorized users to `/unauthorized`.
- `SuperAdminReviewQueuePage` & `CollegeReviewDetailPage` Routes: Mounted under `/admin` (`ProtectedRoute` and `RoleGuard allowedRoles={['SUPER_ADMIN']}`) at canonical routes `/admin/colleges/reviews` and `/admin/colleges/reviews/:collegeId`, with `/admin/reviews` and `/admin/reviews/:collegeId` preserved as backward-compatible aliases.
- `CollegeApprovalGuard`: Architectural route guard routing unapproved college administrators to `/onboarding-status`. Route `/onboarding-status` is nested under `ProtectedRoute` and `RoleGuard allowedRoles={['COLLEGE_ADMIN']}`, but strictly *outside* `CollegeApprovalGuard`. Approved admins visiting `/onboarding-status` are redirected client-side by `OnboardingStatusPage` via `<Navigate to="/college/dashboard" replace />`, while unapproved admins attempting to reach `/college/*` are redirected by `CollegeApprovalGuard` to `/onboarding-status` (eliminating redirect loops). *Phase 03 Module 3.3 APPROVED.*
- `VerifyEmailPage` Routes: Dual-mounted at `/verify-email` and `/auth/verify-email`, wrapped in `AuthLayout` outside `PublicOnlyRoute` and `ProtectedRoute`, ensuring full accessibility to both unauthenticated guests and authenticated college administrators while performing in-place URL token sanitization.

### State Management & API Integration
- **Client State (Zustand 5):** `useAuthStore` (tracks `user`, `isAuthenticated`, `isLoading`), `useAppStore` (tracks layout sidebar state). Strictly no Redux Toolkit.
- **Server State (TanStack Query 5):** Centralized `queryKeys` factory (including `colleges.registration`, `auth.verifyEmail`, `auth.resendVerification`, `onboarding.myApplication`, `onboarding.activeDocuments`, `reviews.queueRoot`, `reviews.queue`, `reviews.detail`, `reviews.documentHistory`), `useCurrentUser` (syncs `GET /api/v1/auth/me`), `useLogin`, `useLogout`, `useHealth`, `useCollegeRegistration`, `useVerifyEmail`, `useResendVerification`, `useMyApplication`, `useCreateCorrectionDraft`, `useUpdateDraftProfile`, `useUploadDocument`, `useDeleteDocument`, `useSubmitApplication`, `useReviewQueue` (placeholderData: keepPreviousData), `useReviewDetail`, `useRecordDecision` (invalidates `queryKeys.reviews.queueRoot()` and `queryKeys.reviews.detail(collegeId)`), `useDownloadReviewDocument`, `useRecordDocumentDecision` (invalidates `detail` and `documentHistory`), `useDocumentReviewHistory`.
- **HTTP Client (Axios) & Domain Services:** `src/services/api.ts` configured with `withCredentials: true`, automatic extraction of `XSRF-TOKEN` cookie into `X-XSRF-TOKEN` header, and transparent single-retry on `403 CSRF_TOKEN_INVALID`. Strictly no JWT or localStorage auth tokens. Enhanced with:
  - `ApiError`: Typed error carrying `errorCode`, `status`, field `errors`, `data`, and `retryAfter?: number`.
  - `parseRetryAfter`: Centralized, strict parser enforcing `/^\d+$/` regex matching, strictly rejecting non-integer prefixes (`"30abc"`), zeroes, negatives, and non-numeric values.
  - `isApiError`: Hardened type guard validating genuine `ApiError` instances and strict structural properties for cross-boundary objects, rejecting arbitrary objects containing only `errorCode`.
  - `onboardingService.ts`: Full API client for all 8 restricted onboarding endpoints, with multipart boundary handling (`{ headers: { 'Content-Type': undefined } }`) and safe delayed blob URL cleanup (`setTimeout(revokeObjectURL, 60000)`).
  - `reviewService.ts`: Full API client for Super Admin review endpoints (queue, application detail, document download, decision submission, document decision submission `POST /colleges/reviews/{collegeId}/documents/{documentId}/decision`, and document history `GET /colleges/reviews/{collegeId}/documents/{documentId}/history`) with safe delayed blob URL cleanup (`setTimeout(revokeObjectURL, 60000)`).
- **Form Validation & Schemas:**
  - `registerCollegeSchema`: React Hook Form + Zod validation schemas enforcing pre-validation trimming, college code normalization to uppercase, admin email normalization to lowercase, optional field nullification, and backend-identical password policy.
  - `verificationSchema.ts` (`src/schemas/verificationSchema.ts`): Zod schema defining `verifyEmailSchema` to validate token presence, length (20–255 characters), trimming, and non-empty string constraints.
  - `onboardingSchema.ts` (`src/schemas/onboardingSchema.ts`): Zod schemas defining `updateApplicationSchema`, `documentUploadSchema`, and `probeFileMagicBytes`.
  - `reviewSchema.ts` (`src/schemas/reviewSchema.ts`): Zod schemas defining `reviewDecisionSchema` (enforcing action constraints, required review notes for `REQUEST_ACTION` $\ge 10$ chars, required rejection reason for `REJECT` $\ge 10$ chars, and `expectedVersion`), `reviewQueueFilterSchema` (search $\le 100$ chars, date range `from <= to`), and `documentReviewDecisionSchema` (validating action `ACCEPT` or `REJECT`, rejection reason $\ge 10$ and $\le 1000$ chars, optional review notes $\le 1000$ chars, and integer `expectedDocumentVersion >= 0`).

### Automated Tests & Quality Checks
- **Vitest Unit & Component Tests: 212 Passed, 0 Failed across 13 test files.**
  - `src/test/super-admin-review.test.tsx` (58 tests): PASSED (covers review queue rendering with items, empty state, search query dispatch, date range validation and ISO-8601 instant serialization, sort order dispatch, filter reset, resubmission semantics v1 vs v4 final, full review detail dossier rendering, SHA-256 checksum monospaced snippet and tooltip, streaming document download trigger, review audit timeline, APPROVE guidance and version locking, APPROVE submission with `expectedVersion`, REQUEST_ACTION validation requiring notes $\ge 10$ chars, REQUEST_ACTION submission with notes and `expectedVersion`, REQUEST_ACTION disabled when `actionRequiredCount >= 10`, REJECT validation requiring rejectionReason $\ge 10$ chars, REJECT submission with reason and `expectedVersion`, permanent rejection warning on revision v4, 409 `STALE_APPLICATION_VERSION` recovery without silent retry, 409 `APPLICATION_NOT_AWAITING_REVIEW` feedback, cache invalidation of `queueRoot` and detail, disabled decision actions when college is already APPROVED, malformed `collegeId` handling, 404/500 fetch error handling, and queue-to-detail navigation; plus 12 dedicated document-review workflow tests: document status badges, provenance badges, accept action with version binding, reject modal validation 10–1000 chars, version 0 handling, fail-closed data integrity lockout, 409 stale conflict recovery, lifecycle freeze, history modal across states, replacement document indicators, readiness assessment rules, and backend error code mapping).
  - `src/test/college-activation.test.tsx` (32 tests): PASSED
  - `src/test/onboarding-dashboard.test.tsx` (26 tests): PASSED
  - `src/test/email-verification.test.tsx` (43 tests): PASSED
  - `src/test/register-college.test.tsx` (26 tests): PASSED
  - `src/test/role-guard.test.tsx` (2 tests): PASSED
  - `src/test/college-approval-guard.test.tsx` (2 tests): PASSED
  - `src/test/csrf-interceptor.test.tsx` (2 tests): PASSED
  - `src/test/protected-route.test.tsx` (2 tests): PASSED
  - `src/test/auth-me-unauthenticated.test.tsx` (1 test): PASSED
  - `src/test/login-errors.test.tsx` (2 tests): PASSED
  - `src/test/reset-password-validation.test.tsx` (3 tests): PASSED
  - `src/test/login-success.test.tsx` (1 test): PASSED
- **Static Analysis & Build:**
  - TypeScript compilation (`tsc -b`): PASSED (0 errors under strict mode).
  - Production build (`npm run build`): PASSED (`vite build`, 1,786 modules transformed in 27.54s, clean production bundle in `dist/`).

### Outstanding Frontend Work
- Perform manual interactive verification in browser against a live running backend.
- Validate cookie attribute handling (`HttpOnly`, `SameSite=Lax`) in actual browser DevTools.

---

## 13.5 Verification Tracker

| Verification Item | Scope / Target | Status | Actual Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **Backend Unit Tests** | `com.acadlytic` unit suite | **PASSED** | 122 unit tests passed cleanly across all modules (including 15 in `CollegeLifecycleServiceUnitTest`, 3 in `CollegeCleanupSchedulerUnitTest`, 16 in `CollegeReviewControllerUnitTest`, 17 in `CollegeReviewServiceUnitTest`, 15 in `CollegeOnboardingServiceUnitTest`, 9 in `DocumentValidatorUnitTest`, 7 in `LocalFileSystemDocumentStorageServiceUnitTest`, 4 in `DocumentStorageCompensationUnitTest`, and auth/outbox unit tests). |
| **Backend Integration Tests** | Testcontainers MySQL suite | **PASSED** | **296/296 total backend tests passed** across all test suites on Testcontainers MySQL 8.0.36 with zero failures, zero errors, and zero skipped tests. Includes 140 targeted Module 3.6 regression tests across 6 test classes (15 in `CollegeApprovalIntegrationTest`, 21 in `CollegeReviewIntegrationTest`, 23 in `CollegeLifecycleIntegrationTest`, 40 in `CollegeOnboardingIntegrationTest`, 19 in `DocumentReviewIntegrationTest`, and 27 in `V6DocumentLevelReviewMigrationTest`). |
| **Frontend Tests** | Vitest component & hook suite | **PASSED** | 213 tests passed across 14 test files (including 32 in `college-activation.test.tsx`, 45 in `super-admin-review.test.tsx`, 24 in `onboarding-dashboard.test.tsx`, 43 in `email-verification.test.tsx`, 26 in `register-college.test.tsx`, 8 in `auth-form-state-persistence.test.tsx`, and 35 in baseline auth/guard suites). |
| **Backend Build** | `mvn clean package -DskipTests` | **PASSED** | Cleanly compiles 127 main source files and 36 test files on Java 21 / Spring Boot 3.3.4; packages executable archive `target/acadlytic-backend-0.0.1-SNAPSHOT.jar` in 22.5s. |
| **Frontend Build** | `npm run build` | **PASSED** | Vite transforms 1,787 modules cleanly with 0 type errors in 6.72s. |
| **Live API Verification** | `curl` / Postman auth flow | **PENDING** | Manual live login, session, and CSRF bootstrap check pending. |
| **Database Verification** | MySQL 8 schema & migrations | **PENDING** | Flyway V1, V2, V3, V4, V5, and V6 applied cleanly in tests on Testcontainers MySQL 8.0.36; Module 3.6A V6 migration verified across 17 Testcontainers tests (`V6DocumentLevelReviewMigrationTest.java`) covering zero-artifact failure cleanup, `flyway.repair()` recovery, exact 8-tuple backfill, composite foreign key integrity, append-only trigger blocking on UPDATE/DELETE, and privilege isolation; live host DB migration pending. |
| **Database Schema & Migration (3.6A)** | Flyway V6 & Callback Suite | **PASSED** | 17/17 migration test cases passed in `V6DocumentLevelReviewMigrationTest` on Testcontainers MySQL 8.0.36; 41 backend integration regression tests passed; zero persistent routines on failure verified; exact 8-tuple legacy backfill verified. |
| **Document Review Service & APIs (3.6B)** | Backend Review Service & Concurrency | **PASSED** | 19/19 tests passed in `DocumentReviewIntegrationTest` on Testcontainers MySQL 8.0.36; 273/273 full test suite passed; idempotency, status reversals, hierarchical locking, zero parent mutation, duplicate replacement protection, and lifecycle freeze verified; explicitly approved by project owner on 2026-11-26 (reference report `Module-3.6B-Implementation-Report-v1.1.md`). |
| **College Approval Integration & Lifecycle (3.6C)** | Backend College Approval & Document Gates | **PASSED** | 15/15 dedicated tests passed in `CollegeApprovalIntegrationTest` on Testcontainers MySQL 8.0.36; 291/291 full backend test suite passed; replacement document active set verified; mandatory category and document status gates verified; explicitly approved by project owner on 2026-11-26 (reference reports `Module-3.6C-Implementation-Report-v1.0.md` and `Module-3.6C-Replacement-Verification-Report-v1.0.md`). |
| **Frontend Document Review Workflow (Unassigned)** | Super Admin Document Review UI & Modals | **PASSED** | 58/58 tests passed in `super-admin-review.test.tsx`; 212/212 full frontend suite passed across 13 test files; strict `tsc -b` clean; production Vite build clean (1,786 modules transformed). Delivered across 14 files (3 created, 10 modified, 1 extended test) with document status/provenance badges, decision modal with authoritative version binding, fail-closed data integrity warning badge & lockout, lifecycle freeze lockout with active history access, assessDocumentReadiness mandatory category enforcement, and error mapping. Explicitly approved by project owner on 2026-11-26 (reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.1.md`; planning baseline `Module-03-Frontend-Document-Review-Planning-Report-v1.1.md`). |
| **Document Review UI & Hooks Fix (Unassigned)** | Super Admin Preview Modal & Hooks Fix | **PASSED** | Single Review button per row, DocumentPreviewReviewModal with Accept/Reject, Direct Review provenance badge removed from UI, OnboardingStatusPage Rules of Hooks violation resolved, post-approval navigation corrected, invalid 409 review-detail refetch eliminated; 211/211 automated tests passed across 14 test files; manual browser Tests 1–4 passed. Explicitly approved by project owner on 2026-11-27 (reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.0.md` / `v1.1`). |
| **DEF-01 Targeted Remediation** | Backend Document Gate & Frontend 409 Disambiguation | **PASSED (Automated) / IN_PROGRESS (Manual)** | Document verification gate relocated into `case APPROVE ->`; `REJECT` and `REQUEST_ACTION` unrestricted; frontend 409 error disambiguation for `STALE_APPLICATION_VERSION`; `saveAndFlush` optimistic version synchronization; 296/296 full backend tests passed; 213/213 full frontend tests passed; clean package build verified. Manual DEF-01 Test A PASSED (HTTP 409 `DOCUMENTS_REJECTED` with zero database or outbox mutations verified against College ID 5); remaining manual scenarios pending. Explicitly approved by project owner on 2026-11-27 (reference reports `Phase-03-Final-Backend-Verification-And-Test-Stabilization-Report-v1.0.md`, `DEF-01-Manual-API-Verification-Preflight-Report-v1.0.md`, `DEF-01-Test-A-Post-Request-Database-Invariant-Verification-Report-v1.0.md`, and `DEF-01-Test-A-Outbox-Invariant-Evidence-Report-v1.0.md`). |
| **Browser Verification** | Interactive UI & DevTools | **IN_PROGRESS** | Manual browser Tests 1–4 passed (Document Review UI & Hooks Fix); 10-step manual checklist in `docs/verification/phase-02-manual-checklist.md` and remaining Phase 03 manual scenarios awaiting execution. |
| **Security Verification** | CSRF, Cookies, Storage, RBAC | **PASSED (Automated)** / **PENDING (Live)** | CSRF interceptor, role guards, and store hygiene verified in tests; live cookie flags pending browser check. |
| **Email & Storage Verification** | Mailpit SMTP dispatch | **PENDING** | Outbox worker unit tests passed; outbox invariant verified clean on DEF-01 Test A; live reset email receipt in Mailpit pending. |

---

## 13.6 Phase Closure History

### Phase 01: Project & Application Foundation
- **Phase Objective:** Scaffold the Acadlytic application foundation, establish Spring Boot 3.3.4 backend structure, configure Java 21 and Maven, initialize React 18 / Vite / TypeScript / Tailwind CSS frontend, and establish Flyway database migration baseline.
- **Completed Modules:** Base backend packages, base frontend layout, Flyway V1 schema (`colleges`, `users`, `audit_events`), common response/exception envelope.
- **Backend Implementation:** Spring Boot 3.3.4 configuration, modular monolith package layout, Flyway V1 schema, basic health check endpoint.
- **Frontend Implementation:** Vite 5 + React 18 + TypeScript 5 + Tailwind CSS 3 scaffold, base layout components, health check integration.
- **Database Changes:** `V1__init_schema.sql` (initial DDL for colleges, users, audit_events).
- **Test Results:** Foundation test harness established.
- **Manual Verification:** Basic application startup verified.
- **Known Limitations:** Minimal application baseline; no authentication, authorization, or business logic.
- **Explicit Approval Status:** `VERIFICATION_PENDING` (Foundation implemented; no formal historical approval sign-off recorded in repository).
- **Closure Date:** 2026-10-15 (Estimated from roadmap revision).
- **Next Phase:** Phase 02 — Authentication & Authorization Foundation.
- **Reference Reports:** `FRONTEND_SETUP_AUDIT_REPORT.md`, `FRONTEND_SETUP_COMPLETION_REPORT.md`.

### Phase 02: Authentication & Authorization Foundation
- **Phase Objective:** Implement end-to-end stateful session-based authentication, Spring Session JDBC persistence, CSRF protection, brute-force lockout, password reset with transactional outbox emails, role-based route guards, and responsive auth UI.
- **Completed Modules:** `com.acadlytic.modules.auth`, `com.acadlytic.modules.outbox`, `com.acadlytic.security`, frontend auth pages (`LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `ChangePasswordPage`), route guards, UI component primitives.
- **Backend Implementation:** `AuthService`, `AuditEventService`, `PasswordPolicyValidator`, `SuperAdminBootstrapRunner`, `OutboxEmailWorker`, `SessionRevocationService`, `CollegeAccessGuard`, `AbstractMySqlIntegrationTest` with database safety guard.
- **Frontend Implementation:** Complete auth pages, React Hook Form + Zod validation, Zustand 5 stores, TanStack Query 5 hooks, Axios client with automatic CSRF header injection and single-retry token refresh, 9 UI primitive components.
- **Database Changes:** `V2__spring_session_jdbc.sql` (Spring Session schema), `V3__auth_core_schema.sql` (password reset tokens, outbox emails, failed attempt tracking, lockout timestamps, audit indexes).
- **Test Results:** 30 backend unit tests PASSED; 15 frontend Vitest tests PASSED; frontend build/lint/format PASSED; 19 MySQL integration tests implemented but NOT_RUN.
- **Manual Verification:** `PENDING` (Checklist documented in `docs/verification/phase-02-manual-checklist.md`).
- **Known Limitations:** Host MySQL / Docker Desktop unavailable during test run, preventing 19 integration tests from executing; live Mailpit and browser DevTools audit pending developer execution.
- **Explicit Approval Status:** `VERIFICATION_PENDING` (Implementation complete; awaiting automated integration test execution and manual verification sign-off).
- **Closure Date:** 2026-11-21 (Implementation complete; verification pending).
- **Next Phase:** Phase 03 — College Registration, Restricted Dashboard & Approval Workflow.
- **Reference Reports:** `FRONTEND_SETUP_COMPLETION_REPORT.md`, `docs/verification/phase-02-manual-checklist.md`.

---

## 13.7 Current Development Position & Next Planned Phase

The current development position is in **Phase 03 — College Registration, Restricted Dashboard & Approval Workflow** with all Phase 03 baseline backend modules **APPROVED**: **Module 3.1A (APPROVED)**, **Module 3.2 (APPROVED)**, **Module 3.3 (APPROVED)**, **Module 3.4 (APPROVED)**, and **Module 3.5 (APPROVED)** (237/237 backend tests on Testcontainers MySQL 8.0.36), all Phase 03 baseline frontend modules **APPROVED**: **Module 3.1B (APPROVED)**, **Module 3.2 (APPROVED)**, **Module 3.3 (APPROVED)**, **Module 3.4 (APPROVED)**, and **Module 3.5 (APPROVED)** (200/200 full suite tests across 13 test files), Document-Level Review Database Schema & Flyway Migration **Module 3.6A (APPROVED)** (17/17 migration test cases on Testcontainers MySQL 8.0.36; reference report `Module-3.6A-Implementation-Report-v1.3.md`), Document-Level Review Backend Service & APIs **Module 3.6B (APPROVED)** (273/273 full backend tests passing, 125 targeted review/onboarding tests passing, clean package build verified; reference report `Module-3.6B-Implementation-Report-v1.1.md`), Backend College Approval Integration & Lifecycle **Module 3.6C (APPROVED)** (291/291 full backend tests passing, 140 targeted Module 3.6 regression tests passing, 15/15 dedicated college approval tests passing, clean package build verified; reference reports `Module-3.6C-Implementation-Report-v1.0.md` and `Module-3.6C-Replacement-Verification-Report-v1.0.md`), **Super Admin Frontend Document Review Workflow (Unassigned) (APPROVED)** (212/212 full frontend tests passing across 13 test files, 58/58 review tests passing in `super-admin-review.test.tsx`, clean production build; reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.1.md`), **Document Review UI Redesign & College Admin Hooks Fix (Unassigned) (APPROVED)** (211/211 automated tests passing across 14 test files, manual browser Tests 1–4 passed; reference report `Module-03-Frontend-Document-Review-Implementation-Report-v1.0.md` / `v1.1`), and **Phase 03 DEF-01 Targeted Remediation (APPROVED)** (296/296 full backend tests passing, 213/213 full frontend tests passing, clean package build, Manual DEF-01 Test A PASSED; reference reports `Phase-03-Final-Backend-Verification-And-Test-Stabilization-Report-v1.0.md` and `DEF-01-Test-A-Post-Request-Database-Invariant-Verification-Report-v1.0.md`). Phase 03 overall remains `IN_PROGRESS` pending remaining live manual browser/API E2E verification against the live local application environment (Spring Boot backend, Vite frontend, and local MySQL).

### Phase 03 Module Progress:
- **Module 3.1A (Backend Registration Foundation):** `APPROVED`. Public registration intake endpoint (`POST /api/v1/college-registrations`), versioned registration revision (V4 schema), IP sliding-window rate limiter, transactional outbox dispatch, and `COLLEGE_REGISTRATION_CREATED` audit event. Explicitly approved by user.
- **Module 3.2 (Email Verification & College Admin Verification Lifecycle — Backend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the user.
  - **Implementation:** Complete (`VerifyEmailRequest`, `VerifyEmailResponse`, `UserRateLimiter`, `AuthTokenRepository` pessimistic write lock, `AuthTokenService` lifecycle methods, `AuthService` verification and resend, `AuthController` endpoints, `SecurityConfig` permit).
  - **Automated Test Results (Testcontainers MySQL 8.0.36 / Docker Desktop 29.9.3 / Java 21 / Spring Boot 3.3.4):**
    - Targeted Integration Test (`mvn -f backend/pom.xml test -Dtest=EmailVerificationIntegrationTest`): 11 tests, 0 failures, 0 errors, 0 skipped — `BUILD SUCCESS`.
    - Full Backend Suite (`mvn -f backend/pom.xml test`): 97 tests, 0 failures, 0 errors, 0 skipped — `BUILD SUCCESS`.
  - **Outbox Rollback Verification:** Dedicated integration test `outboxFailureRollsBackResendTransaction()` in `EmailVerificationIntegrationTest.java` verifies:
    1. Outbox email record count remains unchanged after the failed resend transaction.
    2. No new `EMAIL_VERIFICATION` resend job is committed.
    3. The original verification token remains active (`used_at` and `revoked_at` remain NULL).
    4. No replacement token remains persisted.
    5. No `EMAIL_VERIFICATION_RESENT` audit event is committed.
    6. The original verification token remains usable and successfully verifies the user's email.
  - **Frontend Changes:** None (deferred per backend-first strategy).
  - **Database Migrations:** None (existing schema V1–V4 utilized).
  - **Reference Report:** `docs/03-phase/phase-03-module-3.2-inspection-and-planning-report.md`.
- **Module 3.3 (College Admin Restricted Dashboard, Document Management & Review Submission — Backend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the user.
  - **Implementation Scope:**
    - Backend implementation only.
    - 20 production files created (`CollegeOnboardingController`, `CollegeOnboardingService`, `DocumentProperties`, `DocumentStorageService`, `LocalFileSystemDocumentStorageService`, `DocumentValidator`, `DocumentStorageCompensationHandler`, `StoredFileMetadata`, 12 DTOs: `MyApplicationResponse`, `CurrentRevisionResponse`, `CollegeSummaryResponse`, `CollegeProfileResponse`, `ReviewFeedbackResponse`, `ResubmissionAllowanceResponse`, `OnboardingChecklistResponse`, `DocumentResponse`, `UpdateApplicationRequest`, `SubmitApplicationResponse`, `RevisionSummaryResponse`, `DocumentDownload`).
    - 5 test files created (`CollegeOnboardingIntegrationTest`, `CollegeOnboardingServiceUnitTest`, `DocumentValidatorUnitTest`, `LocalFileSystemDocumentStorageServiceUnitTest`, `DocumentStorageCompensationUnitTest`).
    - 6 existing files modified (`GlobalExceptionHandler`, `AuditEventType`, `CollegeRepository`, `CollegeRegistrationDocumentRepository`, `application.yml`, `.gitignore`).
    - 31 total files affected.
    - Zero database migrations (Flyway schema V4 unchanged).
    - Zero frontend changes (deferred per backend-first strategy).
    - No Module 3.4 or 3.5 implementation.
    - Existing Module 3.1A and 3.2 approvals remain unchanged.
  - **Automated Test Results (Testcontainers MySQL 8.0.36 / Docker Desktop 29.9.3 / Java 21 / Spring Boot 3.3.4):**
    - Full backend suite (`mvn -f backend/pom.xml test`): 142 tests, 0 failures, 0 errors, 0 skipped — `BUILD SUCCESS` (Execution time: 02:11 min).
    - Executed against real Testcontainers MySQL 8.0.36 on dynamic Docker port (`50677`); zero local MySQL fallback.
    - Module 3.3 Unit Tests: 35 tests passed across 4 unit test classes (`CollegeOnboardingServiceUnitTest` 15, `DocumentValidatorUnitTest` 9, `LocalFileSystemDocumentStorageServiceUnitTest` 7, `DocumentStorageCompensationUnitTest` 4).
    - Module 3.3 Integration Tests: 10 scenarios passed in `CollegeOnboardingIntegrationTest` (Happy path onboarding & freeze guarantee, pre-submission gates, multi-revision lineage $v_1 \to v_2 \to v_3$, review feedback decoupling, replacement document deletion & restoration, cross-revision replacement rejection, category mismatch rejection, college tenant name synchronization, safe download headers & tenant isolation, mixed lifecycle counter boundary).
    - Existing regression tests passed: 97 baseline tests across Auth, Outbox, Module 3.1A, and Module 3.2.
  - **Accepted Storage-Key Implementation Deviation:**
    - Formally acknowledged and accepted implementation deviation from planning specification v2.2.
    - Planning v2.2 specified that carried-forward document rows would reference the existing immutable `storage_key`.
    - Actual implementation physically duplicates the file on disk and assigns a new unique UUID storage key via `documentStorageService.duplicate()`.
    - Reason: The existing Flyway V4 migration defines `CONSTRAINT uq_crd_storage_key UNIQUE (storage_key)`. Multiple rows sharing the exact same storage key trigger a MySQL duplicate key violation (SQL Error 1062). Because schema migrations were strictly prohibited, physical duplication with distinct UUID storage keys satisfies the immutable database schema while preserving complete physical isolation across revisions.
    - Historical revisions retain independent storage objects.
    - Approved by the user with the deviation explicitly acknowledged. Original planning document and ADRs are preserved without rewriting.
  - **Outstanding Verification Gaps:**
    - Known verification limitations preserved for future verification planning (not implementation failures):
      1. *Filesystem rollback integration coverage:* Spring transactional rollback cleanup via `TransactionSynchronization` is verified via unit tests (`DocumentStorageCompensationUnitTest`), but there is currently no end-to-end integration test asserting physical file deletion on disk following an actual database rollback.
      2. *Three-level replacement chain integration test:* The two-level replacement chain ($A \to B$) is verified in integration testing; the three-level chain ($A \to B \to C$) has been verified algebraically via leaf-node set logic and foreign-key mechanics, but does not yet have a dedicated end-to-end integration test.
  - **Resubmission Counter Boundary:**
    - Confirmed behavior: Initial submission ($v_1$) does not increment `resubmission_count` (remains 0).
    - Up to three correction submissions ($v_2, v_3, v_4$) following non-permanent `REJECTED` decisions are permitted.
    - Counter increments only upon successful submission (`POST /submit`).
    - After the third correction submission is subsequently rejected, opening a 4th correction draft is blocked with `400 BAD_REQUEST (MAX_RESUBMISSION_LIMIT_EXCEEDED)`.
    - Module 3.5 must implement permanent rejection when the third resubmission is rejected.
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.3-implementation-report.md`
    - `docs/03-phase/phase-03-module-3.3-final-verification-report.md`
- **Module 3.4 (Super Admin Approval Queue & Review Workflow — Backend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the user.
  - **Implementation Scope:**
    - Backend implementation only.
    - 12 production files created (`PageResponse.java`, `CollegeReviewController.java`, `CollegeReviewService.java`, and 9 DTOs/enums: `ReviewQueueItemResponse`, `CollegeReviewDetailResponse`, `CollegeReviewSummaryResponse`, `ReviewAdminUserResponse`, `SubmittedRevisionResponse`, `ReviewHistoryItemResponse`, `ReviewDecisionRequest`, `ReviewDecisionResponse`, `ReviewDecisionAction`).
    - 5 production files modified (`AuditEventType.java`, `CollegeRegistrationRepository.java`, `UserRepository.java`, `AuditEventRepository.java`, `CollegeRegistrationDocumentRepository.java`).
    - 3 test files created during implementation (`CollegeReviewControllerUnitTest.java`, `CollegeReviewServiceUnitTest.java`, `CollegeReviewIntegrationTest.java`).
    - Targeted verification subsequently modified only `CollegeReviewIntegrationTest.java` (adding bounded queue query count verification across page sizes and post-mutation rollback test) and created `docs/03-phase/phase-03-module-3.4-verification-report.md`.
    - Total files inventory: 12 production files created, 5 production files modified, 3 test files created (1 subsequently modified during verification), 0 database migrations, 0 frontend files. Total codebase files affected: 20 (plus 2 documentation reports).
    - Zero database migrations (Flyway schema V4 unchanged and 100% sufficient).
    - Zero frontend implementation (deferred following approved backend-first strategy).
    - Zero Module 3.5 implementation (strict boundary maintained).
    - Existing Module 3.1A, 3.2, and 3.3 approvals remain unchanged.
  - **Implemented Backend Capabilities:**
    - Super Admin review queue endpoint (`GET /api/v1/super-admin/colleges/reviews`) with pending-only eligibility filtering (`c.current_registration_id = cr.id`, `cr.submitted_for_review_at IS NOT NULL`, `cr.status = 'PENDING'`, `c.approval_status = 'PENDING'`, `c.permanently_rejected = FALSE`, `c.archived_at IS NULL`).
    - Bounded batched queue retrieval: 5-operation retrieval pattern eliminating N+1 query amplification (Count query + paginated data query + batch College + batch Admin + batch Document).
    - In-memory active document calculation: dynamically filters out documents whose ID is referenced by a successor's `replaces_document_id`.
    - Search & sort whitelisting: validated search queries (<= 100 chars), ISO-8601 timestamps (`from <= to`), and strict sort whitelisting (`submittedForReviewAt`, `legalName`, `createdAt`) with deterministic tie-breaker (`id,asc`).
    - Application review detail inspection (`GET /api/v1/super-admin/colleges/reviews/{collegeId}`) with full registration history timeline, proposed admin profile, and active verification documents. Rejects non-pending applications with `409 Conflict (APPLICATION_NOT_AWAITING_REVIEW)`.
    - Secure document inspection & streaming download (`GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}`) with 4-step multi-point ownership validation (college existence, document belonging to college, registration association existence, registration tenant matching) and safe download headers (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-cache, no-store`).
    - Transactional review decision execution (`POST /api/v1/super-admin/colleges/reviews/{collegeId}/decision`) supporting `APPROVE`, `REQUEST_ACTION`, and non-permanent `REJECT`.
    - Dual concurrency protection: pessimistic write lock (`findByIdWithLock`, 3000ms timeout) and optimistic version validation (`expectedVersion` matched against `college.getVersion()`, returning `409 Conflict (STALE_APPLICATION_VERSION)` on stale update).
    - Action required safety guard: blocks `REQUEST_ACTION` if college has already reached 10 action-required rounds (`400 Bad Request (MAX_ACTION_REQUIRED_LIMIT_EXCEEDED)`).
    - Reviewer audit event trail: records `COLLEGE_REGISTRATION_APPROVED`, `COLLEGE_REGISTRATION_ACTION_REQUIRED`, or `COLLEGE_REGISTRATION_REJECTED` in `audit_events` under the same transaction boundary.
  - **Automated Test Results (Testcontainers MySQL 8.0.36 / Docker Desktop / Java 21 / Spring Boot 3.3.4):**
    - Full backend regression suite (`mvn -f backend/pom.xml test`): **196 / 196 passed**, 0 failures, 0 errors, 0 skipped — `BUILD SUCCESS` (01:44 min).
    - Focused integration suite (`mvn -f backend/pom.xml test -Dtest=CollegeReviewIntegrationTest`): **21 / 21 passed**, 0 failures, 0 errors, 0 skipped (57.93 s).
    - Unit tests: 33 tests passed across 2 unit test classes (`CollegeReviewControllerUnitTest` 16, `CollegeReviewServiceUnitTest` 17).
    - Executed against real Testcontainers MySQL 8.0.36 on dynamic Docker port; zero local MySQL fallback.
    - Existing regression tests passed: 142 baseline tests across Auth, Outbox, Module 3.1A, Module 3.2, and Module 3.3.
  - **Empirical Targeted Verification Evidence:**
    - *Bounded Queue Query Count ($O(1)$ and Zero $N+1$ Amplification):* Verified across page sizes 1, 5, 20 against 25 seeded eligible applications in MySQL. Query count is strictly bounded at exactly 5 queries for populated pages ($N=1, 5, 20$) and 1 query for empty page ($N=0$), conclusively ruling out row-by-row $N+1$ query behavior.
    - *Transaction Rollback Atomicity:* Hardened via `@SpyBean AuditEventService` injecting an unhandled exception immediately after executing real audit persistence (`callRealMethod()`) before transaction commit. Post-rollback raw JDBC assertions confirmed atomic rollback of `colleges.approval_status`, `college_registrations.status`, and uncommitted `audit_events` row (0 audit events persisted).
    - *Zero Production Code Changes:* Targeted verification required no production code changes; existing production logic satisfied all invariants.
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.4-implementation-report.md`
    - `docs/03-phase/phase-03-module-3.4-verification-report.md`
- **Module 3.5 (Approval Lifecycle, College Activation & Revisions — Backend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the project owner.
  - **Implementation Scope:**
    - Backend-only implementation.
    - Production services created/updated: `CollegeLifecycleService.java`, `CollegeCleanupScheduler.java`, and dedicated proxy bean `DocumentPurgeMarkerService.java`.
    - Configuration: `CleanupProperties.java` (`acadlytic.cleanup.*` specifying batch sizes, abandoned retention days, and permanent rejection retention days).
    - Flyway Migration: `V5__crd_file_purged_at.sql` adding column `file_purged_at TIMESTAMP NULL` and index `idx_crd_file_purged_at (file_purged_at)` to `college_registration_documents`.
    - Unit & Integration Test Suites: `CollegeLifecycleServiceUnitTest.java` (15 tests), `CollegeCleanupSchedulerUnitTest.java` (3 tests), `CollegeLifecycleIntegrationTest.java` (23 scenarios).
    - Zero frontend files modified (deferred per approved backend-first strategy).
    - Existing Module 3.1A, 3.2, 3.3, and 3.4 approvals remain unchanged.
  - **Implemented Backend Capabilities:**
    - **College Operational Activation:** Super Admin `APPROVE` decision transitions `colleges.status = ACTIVE`, enqueues outbox notification `COLLEGE_REGISTRATION_APPROVED`, and logs audit event `COLLEGE_ACTIVATED`.
    - **Notification Dispatch:** Super Admin `REQUEST_ACTION` decision enqueues outbox notification `COLLEGE_REGISTRATION_ACTION_REQUIRED`. Non-permanent `REJECT` decision calculates remaining resubmission allowance ($3 - \text{resubmission\_count}$) and enqueues `COLLEGE_REGISTRATION_REJECTED`.
    - **Permanent Rejection Lifecycle:** Upon rejection of the 3rd correction resubmission ($v_4$, `resubmission_count == 3`), marks `permanently_rejected = TRUE`, `colleges.status = INACTIVE`, deactivates all college users (`status = INACTIVE`), releases unique college code (appending `-REJECTED-<collegeId>`) and college admin emails (appending `+released-<collegeId>` and setting `email_released = TRUE`), revokes all active HTTP sessions via `SessionRevocationService`, enqueues outbox notification `COLLEGE_REGISTRATION_PERMANENTLY_REJECTED`, and logs audit events `COLLEGE_PERMANENTLY_REJECTED` and `COLLEGE_ADMIN_DEACTIVATED`.
    - **Scheduled Archival & Cleanup:** Daily scheduler invokes:
      1. Abandoned registration archival: 7-day retention check for unsubmitted drafts with unverified admins, transitioning college to `INACTIVE`, setting `archived_at = NOW()`, deactivating admin, releasing code/email, revoking sessions, logging audit event `ABANDONED_REGISTRATION_ARCHIVED`, and deleting draft physical files.
      2. Permanently rejected college archival: 7-day retention check after rejection decision, setting `archived_at = NOW()`, logging audit event `PERMANENTLY_REJECTED_COLLEGE_ARCHIVED`.
    - **Proxy-Effective `REQUIRES_NEW` Architecture:**
      - Marker persistence is encapsulated in a dedicated Spring `@Service` component: `DocumentPurgeMarkerService.markDocumentFilePurged(...)` annotated with `@Transactional(propagation = Propagation.REQUIRES_NEW)`.
      - Eliminates `this.` self-invocation bypass; calls cross Spring bean boundaries through CGLIB proxy interception (`TransactionInterceptor`).
      - Physical file I/O operations (`documentStorageService.delete(...)` and `documentStorageService.exists(...)`) execute **strictly outside** database transactions.
    - **Document Metadata Preservation:**
      - Database rows in `college_registration_documents` are **never deleted**.
      - Successful physical file deletion is tracked via `file_purged_at = NOW()`.
      - Document metadata, checksums, registration linkages, and audit histories are permanently preserved.
    - **Verified Repository Enum Mapping:**
      - In `CollegeRepository.findAbandonedRegistrations`, verified and enforced type-safe JPQL query comparison `cr.status = :registrationStatus` mapped to `CollegeApprovalStatus.PENDING`, alongside `CollegeStatus.PENDING_VERIFICATION`, `Role.COLLEGE_ADMIN`, and `UserStatus.ACTIVE`.
    - **Automated Keyset Sweeper & Multi-Run Retry:**
      - Secondary sweeper `sweepResidualAbandonedDraftDocuments()` traverses draft documents across archived colleges without age cutoff using index-backed keyset predicate (`d.filePurgedAt IS NULL AND d.id > :lastProcessedId ORDER BY d.id ASC`).
      - Cursor `lastProcessedId` resets to `0L` at the start of each scheduled execution.
      - Failed physical file deletions (e.g., due to OS locks or transient I/O errors) retain `file_purged_at IS NULL` and are automatically re-selected in early batches on subsequent runs, while successfully purged documents (`file_purged_at IS NOT NULL`) are permanently filtered out by SQL.
  - **Automated Test Results (Testcontainers MySQL 8.0.36 / Docker Desktop / Java 21 / Spring Boot 3.3.4):**
    - Full backend regression suite (`mvn -f backend/pom.xml test`): **237 / 237 passed**, 0 failures, 0 errors, 0 skipped — `BUILD SUCCESS` (03:25 min).
    - Focused lifecycle test suite (`mvn -f backend/pom.xml test -Dtest=CollegeLifecycleServiceUnitTest,CollegeCleanupSchedulerUnitTest,CollegeLifecycleIntegrationTest`): **41 / 41 passed**, 0 failures, 0 errors, 0 skipped — `BUILD SUCCESS` (01:33 min).
    - Unit tests: 18 unit tests passed across 2 unit test classes (`CollegeLifecycleServiceUnitTest` 15, `CollegeCleanupSchedulerUnitTest` 3).
    - Integration tests: 23 scenarios passed in `CollegeLifecycleIntegrationTest` (activation, permanent rejection, session revocation, code/email release, outbox notifications, concurrent review vs cleanup, scheduled archival, missing-file idempotency, multi-run failed document retry with cursor reset in Scenario 23).
    - 100% clean test execution against Testcontainers `mysql:8.0.36` on Docker Desktop; zero local MySQL fallback.
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.5-inspection-and-planning-report.md`
    - `docs/03-phase/phase-03-module-3.5-implementation-report.md`
- **Module 3.1B (Public College Registration Portal — Frontend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the user on 2026-11-24.
  - **Implementation Scope:**
    - Frontend implementation only.
    - 8 production & test files created (`registrationSchema.ts`, `collegeRegistrationService.ts`, `useCollegeRegistration.ts`, `RegistrationSectionHeader.tsx`, `PasswordStrengthMeter.tsx`, `RegistrationSuccessView.tsx`, `RegistrationForm.tsx`, `register-college.test.tsx`).
    - 5 existing files modified (`RegisterCollegePage.tsx`, `AuthLayout.tsx`, `index.ts` types, `queryKeys.ts`, `api.ts`).
    - 16-control structured intake form across 3 logical visual sections (`Institution Details`, `Campus Address & Location`, `Primary Administrator Account`).
    - Form layout expands dynamically to `sm:max-w-3xl` within `AuthLayout` for desktop usability, retaining `sm:max-w-md` for standard auth pages.
    - Strict backend contract compliance: `toRegisterCollegeRequest` transformation maps the 16 form controls to the exact 15 fields expected by `POST /api/v1/college-registrations`. Client-side `confirmPassword` is validated in Zod and strictly omitted from payload serialization.
    - Pre-validation trimming and sanitization: required strings trimmed; college code normalized to uppercase; administrator email normalized to lowercase; optional fields (`addressLine2`, `websiteUrl`) trimmed and converted to `null` if blank; raw user password preserved without trimming.
    - Backend-authoritative password policy: enforces exact structural rules from `PasswordPolicyValidator.java` (12–128 characters, strictly forbidding containment of the administrator's email; no arbitrary uppercase/digit/symbol blocks).
    - Centralized strict `Retry-After` parsing: `parseRetryAfter` in `api.ts` strictly validates `/^\d+$/` on string headers, rejecting non-integer prefixes (e.g. `"30abc"`), non-numeric strings, zeroes, and negatives. Symmetrically consumed by `useCollegeRegistration.ts`.
    - Hardened `isApiError` type guard: verifies genuine `instanceof ApiError` and enforces strict structural validation for cross-boundary objects (`name === 'ApiError'`, `typeof message === 'string'`), strictly rejecting arbitrary objects containing only `errorCode`.
    - Dynamic rate-limit handling: active countdown timer when `Retry-After` is valid; persistent warning with manual dismissal and retry when absent/malformed (never fabricates a countdown).
    - Post-registration confirmation view (`RegistrationSuccessView`): provides application metadata, 4-step onboarding roadmap, spam notice, unauthenticated session status, and 48-hour email verification requirement.
    - Zero backend source code or migration changes; zero API contract changes.
  - **Automated Test Results (Vitest 2.1.9 / JSDOM / Node.js 22 / React 18):**
    - Focused Module 3.1B suite (`src/test/register-college.test.tsx`): **26 / 26 passed** (0 failures, 0 errors, 0 skipped, 1.10s execution).
    - Full frontend regression suite (`npm test`): **41 / 41 passed across 9 test files** (0 failures, 0 errors, 0 skipped, 14.96s execution).
    - TypeScript compilation (`tsc`): PASSED (0 errors under strict mode).
    - Production build (`npm run build`): PASSED (`tsc && vite build`, 1,738 modules transformed in 6.39s, clean production bundle in `dist/`).
    - All 5 `isApiError` prototype-boundary conditions verified.
    - Strict `parseRetryAfter` and `extractRetryAfter` validated across all numeric and malformed permutations.
  - **Distinction of Verification:** Automated unit, component, integration, and build verification complete. Manual interactive browser verification against a running backend remains pending.
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.1B-inspection-and-planning-report.md` (v1.1)
    - `docs/03-phase/phase-03-module-3.1B-implementation-report.md`
- **Module 3.2 (Email Verification & Account Activation — Frontend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the project owner on 2026-11-24.
  - **Implementation Scope:**
    - Frontend implementation only.
    - 6 files created: `frontend/src/schemas/verificationSchema.ts` (Zod validation for 20–255 character single-use tokens), `frontend/src/hooks/useEmailVerification.ts` (TanStack Query mutation hooks with invocation-level synchronous turn mutual exclusion), `frontend/src/components/verification/ResendVerificationButton.tsx` (reusable button with dual-layer rate limiting), `frontend/src/components/verification/VerifyEmailStatusCard.tsx` (state machine status card), `frontend/src/pages/auth/VerifyEmailPage.tsx` (URL token extraction and in-place sanitization), `frontend/src/test/email-verification.test.tsx` (43 automated Vitest scenarios).
    - 5 files modified: `frontend/src/types/index.ts` (request/response DTOs and schema re-exports), `frontend/src/services/authService.ts` (`verifyEmail` and `resendVerification` API methods), `frontend/src/services/queryKeys.ts` (auth query keys), `frontend/src/routes/index.tsx` (dual route mounting), `frontend/src/pages/OnboardingStatusPage.tsx` (unverified warning banner and resend action). Total files affected: 11.
    - Dual-mounted token consumption routes at `/verify-email` and `/auth/verify-email`, wrapped in `AuthLayout` outside `PublicOnlyRoute` and `ProtectedRoute` so both unauthenticated guests and authenticated college administrators can redeem verification tokens.
    - Token sanitization & execution order: URL token extracted and stripped from address bar prior to API dispatch; unrelated query parameters and router location state preserved; duplicate requests prevented under React StrictMode and component remounts.
    - Comprehensive error mapping: maps 400 validation errors, 401 unauthenticated session clearance, 403 inactive account lockout, 500 internal errors, and network disconnects; invalidates `currentUser` query cache and updates `useAuthStore` on verification success or already-verified error.
    - Synchronous turn concurrency hardening: wraps `mutate` and `mutateAsync` with immediate invocation-level locks (`isVerificationInFlight`, `isResendInFlight`); same-synchronous-turn calls in both orders (`verifyEmail` then `resend`, and `resend` then `verifyEmail`) verified where only the first operation reaches `authService` while the second synchronously rejects with documented `ApiError(409)` (`CONCURRENT_RESEND_IN_PROGRESS` or `CONCURRENT_VERIFICATION_IN_PROGRESS`); guaranteed release on both success and failure in `finally` and `onSettled`.
    - Dual-layer rate limiting: exact `Retry-After` countdown when valid; persistent alert without fabricated timer when missing/malformed.
    - Zero backend source code or migration changes; zero API contract changes.
  - **Automated Test Results (Vitest 2.1.9 / JSDOM / Node.js 22 / React 18):**
    - Focused Module 3.2 suite (`src/test/email-verification.test.tsx`): **43 / 43 passed** (0 failures, 0 errors, 0 skipped, 1.23s execution).
    - Full frontend regression suite (`npm test`): **84 / 84 passed across 10 test files** (0 failures, 0 errors, 0 skipped, 20.48s execution).
    - TypeScript compilation (`tsc`): PASSED (0 errors under strict mode).
    - Production build (`npm run build`): PASSED (`tsc && vite build`, 1,878 modules transformed in 16.35s, clean production bundle in `dist/`).
    - Same-synchronous-turn verification/resend concurrency tests passed in both invocation orders.
  - **Distinction of Verification:** Automated unit, component, hook, integration, and build verification complete. Manual interactive browser verification against a running backend remains pending (`NOT_VERIFIED`).
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.2-frontend-inspection-and-planning-report.md` (v1.1)
    - `docs/03-phase/phase-03-module-3.2-frontend-implementation-report.md`
- **Module 3.3 (College Admin Restricted Dashboard, Document Management & Review Submission — Frontend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the project owner on 2026-11-25.
  - **Implementation Scope:**
    - Frontend implementation only.
    - 14 files created: `frontend/src/schemas/onboardingSchema.ts`, `frontend/src/services/onboardingService.ts`, `frontend/src/hooks/useOnboarding.ts`, `frontend/src/components/onboarding/OnboardingStatusBanner.tsx`, `frontend/src/components/onboarding/ReviewFeedbackCard.tsx`, `frontend/src/components/onboarding/OnboardingChecklistCard.tsx`, `frontend/src/components/onboarding/CollegeProfileCard.tsx`, `frontend/src/components/onboarding/EditProfileModal.tsx`, `frontend/src/components/onboarding/DocumentManagementSection.tsx`, `frontend/src/components/onboarding/DocumentUploadModal.tsx`, `frontend/src/components/onboarding/SubmitApplicationModal.tsx`, `frontend/src/components/onboarding/RevisionHistoryDrawer.tsx`, `frontend/src/components/onboarding/index.ts` (barrel export cleanly encapsulating the 9 onboarding domain components), `frontend/src/test/onboarding-dashboard.test.tsx` (26 automated Vitest integration test scenarios).
    - 5 files modified: `frontend/src/types/index.ts` (onboarding DTOs & response contracts), `frontend/src/services/queryKeys.ts` (onboarding query key factory), `frontend/src/pages/OnboardingStatusPage.tsx` (complete restricted dashboard page implementation), `frontend/src/routes/index.tsx` (protected route nesting outside `CollegeApprovalGuard`), `frontend/.gitignore` (added `vite.config.js` and `vite.config.d.ts` build artifacts to ignore list). Total files affected: 19.
    - Protected route architecture without loops: `/onboarding-status` nested under `ProtectedRoute` and `RoleGuard allowedRoles={['COLLEGE_ADMIN']}`, strictly outside `CollegeApprovalGuard`. Approved admins visiting `/onboarding-status` redirect client-side via `<Navigate to="/college/dashboard" replace />`, while unapproved admins accessing `/college/*` are redirected to `/onboarding-status` by `CollegeApprovalGuard`.
    - Authoritative state derivations: `isApplicationFrozenInReview` and `isDraftEditable` resilient against Jackson boolean property variants (`isFrozenInReview` vs `frozenInReview`) with deterministic fallback to core revision fields (`submittedForReviewAt !== null && !isDraft && status === 'PENDING'`).
    - Single-source data fetching: centered around `useMyApplication` querying `GET /api/v1/college-registrations/my-application`; all draft mutations invalidate `queryKeys.onboarding.myApplication()`.
    - Server-confirmed profile updates: `useUpdateDraftProfile` avoids optimistic local updates and synchronizes `user.collegeName` in `useAuthStore` using the server-returned `legalName`.
    - Document lifecycle & lineage: 5 active document ceiling enforcement, replacement lineage tracking via `replacesDocumentId`, and predecessor restoration on replacement deletion.
    - Streaming download & boundary safety: `{ headers: { 'Content-Type': undefined } }` for multipart upload; 60-second delayed `revokeObjectURL` for safe streaming download completion.
    - Two-tier permanent rejection lifecycle: HTTP 403 `REGISTRATION_PERMANENTLY_REJECTED` renders unrecoverable rejection state with "Return to Login" button; subsequent session destruction handled cleanly via global 401 interceptor.
    - Zero backend source code or migration changes; zero API contract changes.
  - **Automated Test Results (Vitest 2.1.9 / JSDOM / Node.js 22 / React 18):**
    - Focused Module 3.3 suite (`src/test/onboarding-dashboard.test.tsx`): **26 / 26 passed** (0 failures, 0 errors, 0 skipped, 4.72s execution).
    - Full frontend regression suite (`npx vitest run`): **110 / 110 passed across 11 test files** (0 failures, 0 errors, 0 skipped, 25.55s execution).
    - TypeScript compilation (`tsc -b`): PASSED (0 errors under strict mode).
    - Production build (`npm run build`): PASSED (`tsc && vite build`, 1,759 modules transformed in 5.56s, clean production bundle in `dist/`).
  - **Accepted Test-Coverage Caveats (Preserved Limitations):**
    1. *Document mutation query invalidation not directly tested:* `useUploadDocument` and `useDeleteDocument` invalidate `myApplication` and `activeDocuments` in production, but `queryClient.invalidateQueries` is not explicitly asserted with a Vitest spy in integration tests.
    2. *Subsequent 401 auth cleanup & login redirect not directly tested in Module 3.3 suite:* Tested in global auth interceptor suite (`email-verification.test.tsx` Test 28, `auth-me-unauthenticated.test.tsx`), but not directly asserted within `onboarding-dashboard.test.tsx`.
    3. *Blob URL revocation cleanup not directly tested:* Delayed 60-second timer and `window.URL.revokeObjectURL` in `onboardingService.downloadDocument` are implemented but not directly tested with a fake-timer spy.
    4. *Server-confirmed legal-name Auth Store synchronization not directly tested:* `useUpdateDraftProfile` synchronizes `useAuthStore.user.collegeName` in production, but `useAuthStore.getState().user?.collegeName` is not directly asserted in Test 11.
  - **Distinction of Verification:** Automated unit, component, hook, integration, and build verification complete. Manual interactive browser verification against a running backend remains pending (`NOT_VERIFIED`).
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.3-frontend-inspection-and-planning-report.md` (v1.1)
    - `docs/03-phase/phase-03-module-3.3-frontend-implementation-report.md` (v1.1)
- **Module 3.4 (Super Admin Approval Queue & Review Workflow — Frontend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the project owner on 2026-11-25.
  - **Implementation Scope:**
    - Frontend implementation only.
    - 18 files created: 11 review domain components in `frontend/src/components/review/` (`CollegeReviewHeader.tsx`, `ReviewAdminUserCard.tsx`, `CollegeProfileReviewCard.tsx`, `ResubmissionAllowanceBadge.tsx`, `ReviewDocumentListCard.tsx`, `SubmittedRevisionCard.tsx`, `RevisionHistoryTimelineCard.tsx`, `ReviewDecisionPanel.tsx`, `ReviewDecisionModal.tsx`, `ReviewQueueFilterBar.tsx`, `ReviewQueueTable.tsx`), 1 barrel export (`src/components/review/index.ts`), 2 admin review pages (`src/pages/admin/SuperAdminReviewQueuePage.tsx`, `src/pages/admin/CollegeReviewDetailPage.tsx`), 1 service (`src/services/reviewService.ts`), 1 hook (`src/hooks/useCollegeReview.ts`), 1 schema (`src/schemas/reviewSchema.ts`), and 1 integration test suite (`src/test/super-admin-review.test.tsx`).
    - 4 files modified: `src/routes/index.tsx` (canonical routes and backward-compatible aliases), `src/components/navigation/Sidebar.tsx` (Approval Queue navigation link with `ClipboardCheck` icon), `src/services/queryKeys.ts` (review queue & detail query keys), and `src/types/index.ts` (review DTOs & response contracts). Total files affected: 22.
    - Canonical route restoration at `/admin/colleges/reviews` and `/admin/colleges/reviews/:collegeId`, preserving `/admin/reviews` and `/admin/reviews/:collegeId` as backward-compatible aliases.
    - Super Admin college approval queue with search, client-side date range validation (`from <= to`), ISO-8601 UTC boundary serialization (`T00:00:00.000Z` to `T23:59:59.999Z`), sort ordering, pagination reset, and responsive data table.
    - Review dossier inspector displaying proposed administrator details, verified email badge, institutional profile, active verification documents with SHA-256 checksum snippets and tooltip hashes, streaming document downloads, and chronological decision audit trails.
    - Polymorphic, accessible `ReviewDecisionModal` supporting `APPROVE`, `REQUEST_ACTION` (with notes $\ge 10$ chars, disabled at 10-action ceiling), and `REJECT` (with reason $\ge 10$ chars, permanent rejection warning on revision $v_4$).
    - Optimistic version concurrency control (`expectedVersion: college.concurrencyVersion`), with explicit `409 STALE_APPLICATION_VERSION` workflow halting, modal closure, application detail refetching, prominent conflict banner display, and fresh reviewer inspection requirement (zero silent retries).
    - Resubmission allowance semantics ($v_1=0$, $v_2=1$, $v_3=2$, $v_4=3$) adhering strictly to approved business rules.
    - Zero backend source code or migration changes; zero API contract changes.
  - **Automated Test Results (Vitest 2.1.9 / JSDOM / Node.js 22 / React 18):**
    - Focused Module 3.4 suite (`src/test/super-admin-review.test.tsx`): **26 / 26 passed** (0 failures, 0 errors, 0 skipped, 3.71s execution).
    - Full frontend regression suite (`npx vitest run`): **136 / 136 passed across 12 test files** (0 failures, 0 errors, 0 skipped, 19.56s execution).
    - TypeScript compilation (`tsc -b`): PASSED (0 errors under strict mode).
    - Production build (`npm run build`): PASSED (`tsc && vite build`, 1,777 modules transformed in 11.17s, clean production bundle in `dist/`).
  - **Accepted Test-Coverage Caveats (Preserved Limitations):**
    1. *Manual interactive browser/API verification pending:* Manual interactive browser/API verification against the real Spring Boot + MySQL + Mailpit environment remains pending.
    2. *Blob URL revocation cleanup not directly asserted:* The 60-second Blob URL revocation cleanup timer is implemented in `reviewService.downloadReviewDocument`, but its exact timer-based cleanup is not directly asserted by automated tests.
  - **Distinction of Verification:** Automated unit, component, hook, integration, and build verification complete. Manual interactive browser verification against a running backend remains pending (`NOT_VERIFIED`).
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.4-frontend-inspection-and-planning-report.md` (v1.1 APPROVED)
    - `docs/03-phase/phase-03-module-3.4-frontend-implementation-report.md` (v1.1 APPROVED)
- **Module 3.5 (Approval Lifecycle, College Activation & Revisions — Frontend):** `APPROVED`.
  - **Approval Status:** Explicitly approved by the project owner on 2026-11-25.
  - **Implementation Scope:**
    - Frontend implementation only.
    - 7 files created: 5 activation domain components in `frontend/src/components/activation/` (`CollegeActivationHeroBanner.tsx`, `ActivationMilestoneCard.tsx`, `InstitutionalReadinessRoadmapCard.tsx`, `ApprovedDossierModal.tsx`, `SuspendedCollegeCard.tsx`), 1 barrel export (`src/components/activation/index.ts`), and 1 integration test suite (`src/test/college-activation.test.tsx`).
    - 5 files modified in working tree: `src/pages/dashboard/CollegeAdminDashboardPage.tsx` (operational welcome dashboard integrating activation components without internal database IDs), `src/pages/OnboardingStatusPage.tsx` (403 error disambiguation, in-place suspended/inactive state handling, fail-closed dashboard redirect, live polling synchronization with loop prevention), `src/routes/guards/CollegeApprovalGuard.tsx` (fail-closed route authorization requiring APPROVED + ACTIVE + managementUnlocked), `src/test/college-approval-guard.test.tsx` (explicit active status fixture update), and `src/test/onboarding-dashboard.test.tsx` (explicit active status fixture update). Total files affected: 12.
    - Operational welcome dashboard (`/college/dashboard`) featuring celebratory hero banner, legal entity name, permanent college code (`college.code`), university affiliation, and emerald status badges (`ACTIVE`, `APPROVED`, `UNLOCKED`).
    - Strict institutional identifier integrity: canonical `college.code` used exclusively in all UI views; zero exposure of database IDs, UUIDs, or raw storage keys.
    - Authoritative verification milestone tracking: 4 checklist items strictly derived from authoritative user and application state (`emailVerified`, `requiredDocumentsUploaded`, `approvalStatus === 'APPROVED'`, `collegeStatus === 'ACTIVE'`).
    - Read-only approved registration dossier inspector (`ApprovedDossierModal.tsx`) with verified institutional profile, active compliance documents with streaming download triggers (`onboardingService.downloadDocument`), and historical revision audit timeline ($v_1 \dots v_n$).
    - Exact permanent rejection business rule invariant: permanent rejection is permitted strictly on the third correction submission associated with $v_4$ (`resubmissionCount == 3`), while $v_5$ is blocked upstream. UI displays permanent rejection badge strictly when `rev.isPermanentRejection === true`, never inferring from revision numbers.
    - Disambiguated 403 error routing: `REGISTRATION_PERMANENTLY_REJECTED` routes to inlined permanent rejection view; `COLLEGE_SUSPENDED` and `COLLEGE_INACTIVE` render in-place `SuspendedCollegeCard`.
    - Live approval synchronization: detects approved status on `/onboarding-status`, calls `authService.getMe()`, refreshes Auth Store, invalidates query cache, and safely navigates to dashboard with redirect-loop prevention on sync failure.
    - Sanitized institutional support guidance: removed unverified emails and directs users to designated platform Super Administrator.
    - Zero backend source code or migration changes; zero API contract changes.
  - **Automated Test Results (Vitest 2.1.9 / JSDOM / Node.js 22 / React 18):**
    - Focused Module 3.5 suite (`src/test/college-activation.test.tsx`): **32 / 32 passed** (0 failures, 0 errors, 0 skipped, 2.69s execution).
    - Full frontend regression suite (`npx vitest run`): **168 / 168 passed across 13 test files** (0 failures, 0 errors, 0 skipped, 19.06s execution).
    - TypeScript compilation (`tsc -b`): PASSED (0 errors under strict mode).
    - Production build (`npm run build`): PASSED (`tsc && vite build`, 1,783 modules transformed in 8.50s, clean production bundle in `dist/`).
  - **Accepted Test-Coverage Caveats (Preserved Limitations):**
    1. *Manual interactive browser/API verification pending:* Interactive browser/API verification against live Docker services (MySQL 8, Mailpit, Spring Boot) remains pending (`NOT_VERIFIED`).
    2. *Blob URL revocation cleanup not directly asserted:* The 60-second delayed Blob URL revocation cleanup timer in `onboardingService.downloadDocument` is implemented in production but its exact timer-based cleanup is not directly asserted with a fake-timer spy.
  - **Distinction of Verification:** Automated unit, component, hook, integration, and build verification complete. Manual interactive browser verification against a running backend remains pending (`NOT_VERIFIED`).
  - **Reference Reports:**
    - `docs/03-phase/phase-03-module-3.5-frontend-inspection-and-planning-report.md` (v1.1 APPROVED)
    - `docs/03-phase/phase-03-module-3.5-frontend-implementation-report.md` (v1.2 APPROVED)
- **Module 3.6A (Document-Level Review Database Schema & Flyway Migration):** `APPROVED`.
  - **Approval Status:** Explicitly approved by Project Owner on 2026-11-26.
  - **Approved Implementation Report:** `Module-3.6A-Implementation-Report-v1.3.md`.
  - **Planning Reference:** Approved Planning Report v1.1 + Final Targeted Clarification Addendum (BF-07 through BF-12).
  - **Implementation Scope:**
    - Backend database schema and Flyway migration only.
    - Zero backend services, endpoints, or controllers modified (Module 3.6B strict boundary maintained).
    - Zero college approval lifecycle gates modified (Module 3.6C strict boundary maintained).
    - Zero frontend UI components modified.
    - Production and migration files created:
      - `backend/src/main/resources/db/migration/V6__document_level_review.sql`
      - `backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationStatus.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/entity/DocumentVerificationProvenance.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/migration/V6DocumentReviewMigrationPreflightCallback.java`
    - Production entity updated:
      - `backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistrationDocument.java` (mapped fields with `@Enumerated(EnumType.STRING)`).
    - Test files created/updated:
      - `backend/src/test/java/com/acadlytic/modules/colleges/V6DocumentLevelReviewMigrationTest.java` (17 comprehensive Testcontainers scenarios).
      - `backend/src/test/java/com/acadlytic/support/AbstractMySqlIntegrationTest.java` (Flyway callback configuration).
    - Total files affected: 7.
  - **Implemented Schema & Database Architecture:**
    - **`college_registration_documents` Schema Alterations:**
      - Added `verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING'`.
      - Added `verification_notes VARCHAR(1000) NULL`.
      - Added `verified_by_user_id BIGINT NULL`, with constraint `fk_crd_verified_by_user FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE RESTRICT`.
      - Added `verified_at TIMESTAMP(6) NULL`.
      - Added `verification_provenance VARCHAR(32) NOT NULL DEFAULT 'NOT_REVIEWED'`.
      - Added composite index `idx_crd_review_lookup (college_id, registration_id, verification_status)` and index `idx_crd_verification_status (verification_status)`.
      - Added composite unique key `uq_crd_composite_owner (id, college_id, registration_id)` enabling composite foreign key referencing.
    - **Exact Legacy State Backfill (8-Tuple Whitelist):**
      - Evaluates the exact 8 supported `(college.approval_status, registration.status)` tuples from V1–V5.
      - `('APPROVED', 'APPROVED')` $\to$ `verification_status = 'ACCEPTED'`, `verification_provenance = 'LEGACY_COLLEGE_APPROVAL'`.
      - Preserves individual document reviewer ID (`verified_by_user_id`) and review timestamp (`verified_at`) strictly as `NULL` for legacy approvals.
      - Remaining 7 supported legacy tuples $\to$ `verification_status = 'PENDING'`, `verification_provenance = 'NOT_REVIEWED'`.
      - Any tuple outside the 8-tuple whitelist, NULL status, orphan document, or tenant mismatch triggers failure.
    - **Zero-Artifact Preflight Validation (`V6DocumentReviewMigrationPreflightCallback.java`):**
      - Spring `@Component` implementing Flyway's `Callback` interface (`BEFORE_EACH_MIGRATE` for target version 6).
      - Validates all legacy documents against the 8-tuple whitelist, checks for orphaned documents, and verifies tenant consistency before `V6__document_level_review.sql` is read or executed.
      - Guarantees zero persistent routines, tables, columns, or triggers in `information_schema` on preflight failure, leaving database at a completely clean V5 baseline.
    - **Append-Only Audit Schema (`college_document_reviews`):**
      - Created table `college_document_reviews` capturing review decisions (`document_id`, `college_id`, `registration_id`, `verification_status`, `notes`, `reviewer_user_id`, `reviewed_at`, `provenance`).
      - Composite foreign key constraint `fk_cdr_document_ownership FOREIGN KEY (document_id, college_id, registration_id) REFERENCES college_registration_documents(id, college_id, registration_id) ON DELETE RESTRICT` enforces that review entries reference documents under the exact matching college and registration tenant boundaries.
      - MySQL triggers `trg_cdr_prevent_update` and `trg_cdr_prevent_delete` raise `SIGNAL SQLSTATE '45000'` on any UPDATE or DELETE attempt on `college_document_reviews`.
    - **Runtime Database Privilege Design:**
      - Removed schema-wide UPDATE grants; explicit table-level grants defined for runtime user `acadlytic_app`.
      - `college_document_reviews` restricted strictly to `SELECT` and `INSERT` privileges.
    - **V6 Deployment Operational Condition:**
      - Application writes (document uploads, registration submissions, review decisions) must be paused during preflight callback validation and V6 migration execution to ensure zero concurrent mutations while the backfill query and table alteration execute.
  - **Automated Test Results (Testcontainers MySQL 8.0.36 / Docker Desktop / Java 21 / Spring Boot 3.3.4):**
    - `V6DocumentLevelReviewMigrationTest`: **17 / 17 passed**, 0 failures, 0 errors, 0 skipped (`BUILD SUCCESS`).
    - Validates:
      1. Clean V5 to V6 migration on clean database.
      2. Table column verification and defaults (`PENDING`, `NOT_REVIEWED`).
      3. Index presence (`idx_crd_review_lookup`, `idx_crd_verification_status`).
      4. Foreign key constraint `fk_crd_verified_by_user` referencing `users(id)`.
      5. Composite unique key `uq_crd_composite_owner`.
      6. `college_document_reviews` table structure.
      7. Composite foreign key `fk_cdr_document_ownership` preventing tenant mismatched audit rows.
      8. Append-only trigger blocking UPDATE with SQLSTATE 45000.
      9. Append-only trigger blocking DELETE with SQLSTATE 45000.
      10. Runtime database privilege isolation (`SELECT`, `INSERT` allowed; `UPDATE`, `DELETE` rejected).
      11. Exact 8-tuple whitelist legacy backfill (Tuple 1: APPROVED + APPROVED $\to$ ACCEPTED / LEGACY_COLLEGE_APPROVAL with NULL reviewer and timestamp).
      12. Exact 8-tuple whitelist legacy backfill (Tuples 2–8 $\to$ PENDING / NOT_REVIEWED).
      13. Preflight callback rejection of unsupported legacy tuple.
      14. Preflight callback rejection of NULL college approval status.
      15. Preflight callback rejection of orphaned document.
      16. Preflight callback rejection of tenant mismatch (`document.college_id != registration.college_id`).
      17. Preflight callback failure leaving strictly 0 routines, 0 tables, 0 columns, 0 triggers in the database, with successful recovery via data remediation and `flyway.repair()`.
    - Backend integration regression suite: **41 / 41 passed** (`CollegeReviewIntegrationTest`, `CollegeRegistrationIntegrationTest`, `CollegeOnboardingIntegrationTest`, `SchemaAndConstraintsIntegrationTest`).
    - Frontend regression suite: **200 / 200 passed across 13 test files**.
  - **Subsequent Module Status:**
    - **Module 3.6B (Backend Document Review Service & APIs):** `APPROVED` (Explicitly approved by Project Owner on 2026-11-26; reference report `Module-3.6B-Implementation-Report-v1.1.md`).
    - **Module 3.6C (Backend College Approval Integration & Lifecycle):** `APPROVED` (Explicitly approved by Project Owner on 2026-11-26; reference reports `Module-3.6C-Implementation-Report-v1.0.md` and `Module-3.6C-Replacement-Verification-Report-v1.0.md`).
  - **Reference Reports:**
    - `docs/03-phase/Module-3.6A-Implementation-Report-v1.3.md` (Approved Implementation Report v1.3)
    - `docs/03-phase/Module-3.6A-Implementation-Report-v1.2.md`
    - `docs/03-phase/Module-3.6A-Implementation-Report-v1.1.md`
    - `docs/03-phase/Module-3.6A-Implementation-Report-v1.0.md`
- **Module 3.6B (Backend Document Review Service & APIs):** `APPROVED`.
  - **Approval Status:** Explicitly approved by Project Owner on 2026-11-26 following review of consolidated verification report v1.1.
  - **Approved Implementation Report:** `docs/03-phase/Module-3.6B-Implementation-Report-v1.1.md` (Implementation Report v1.1 — Consolidated Verification Edition).
  - **Planning Reference:** Approved Planning Report v1.1 + Final Targeted Clarification Addendum (BF-07 through BF-12).
  - **Implementation Scope:**
    - Backend document verification service, endpoints, repositories, DTOs, domain models, and concurrency controls.
    - Zero database migrations added (Flyway V6 baseline cleanly maintained).
    - Zero frontend UI components modified.
    - College-level approval gating deferred strictly to Module 3.6C (Backend College Approval Integration & Lifecycle).
    - Production files created/updated:
      - `backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewAction.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewDecisionRequest.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewDecisionResponse.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentReviewHistoryItemResponse.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/dto/DocumentResponse.java` (enriched with verification fields)
      - `backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeDocumentReview.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeDocumentReviewRepository.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRegistrationDocumentRepository.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeReviewController.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java`
      - `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeOnboardingService.java`
      - `backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java`
    - Test files created/updated:
      - `backend/src/test/java/com/acadlytic/modules/colleges/DocumentReviewIntegrationTest.java` (19 comprehensive Testcontainers scenarios).
      - `backend/src/test/java/com/acadlytic/modules/colleges/CollegeOnboardingIntegrationTest.java`
  - **Delivered Capabilities & Architecture:**
    - **Independent Verification Decisions (`ACCEPT`, `REJECT`):** Super Admin reviewers independently review each submitted registration document.
    - **Provenance Tracking:** Preserves document origin explicitly (`NOT_REVIEWED`, `DIRECT_REVIEW`, `CARRIED_FORWARD`, `LEGACY_COLLEGE_APPROVAL`).
    - **Optimistic Concurrency Control:** Compares `expectedDocumentVersion` against document's `@Version` column (`CollegeRegistrationDocument.version`). Newly uploaded documents start at version 0 (strictly valid for initial review). Stale requests fail with `409 STALE_DOCUMENT_VERSION`.
    - **Idempotency & Retry Semantics:** Retrying an identical decision with the immediately preceding or current version returns HTTP 200 without duplicate audit row insertion, without duplicate `AuditEvent`, and without version increment. Retrying with mismatched reason or action at stale version is rejected with `409 STALE_DOCUMENT_VERSION` and cannot be silently accepted. Intentional status reversals require the current document version and advance version by 1.
    - **Hierarchical Locking & Zero Parent Mutation:** Serializes concurrent review operations by acquiring a `PESSIMISTIC_WRITE` lock on the parent `College` row first, followed by the target `CollegeRegistrationDocument` row second. Zero mutation on `College.version` (parent entity is not modified or saved).
    - **Bounded Deadlock/Timeout Retries:** Wrapped with `TransactionTemplate` using `PROPAGATION_REQUIRES_NEW`, providing up to 3 retry attempts with exponential backoff.
    - **Lifecycle Freezing & Cross-Revision Isolation:** Document review freezes once a college decision commits (`APPROVE`, `REQUEST_ACTION`, `REJECT` reject reviews with `409 APPLICATION_NOT_AWAITING_REVIEW`). Creation of a correction draft opens revision $v+1$ in unsubmitted draft mode where reviews remain frozen. Resubmitting revision $v+1$ restores `college.approvalStatus = PENDING` and unfreezes review for revision $v+1$ while keeping older revision $v$ documents strictly frozen (`409 APPLICATION_NOT_AWAITING_REVIEW`).
    - **Replacement Document Rules:** Protects against duplicate replacements in active draft revisions (`409 REPLACEMENT_ALREADY_EXISTS` and DB constraint `uq_crd_registration_replacement`), restricts cross-revision replacement strictly to rejected documents of the immediately preceding submitted revision ($v-1$), enforces category match, and skips carry-forward of rejected documents into revision $v+1$.
    - **Deterministic History API:** Exposes reverse-chronological review audit history (`reviewedAt DESC, id DESC`) via `GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}/history` with reviewer user emails.
  - **Automated Test Results (Testcontainers MySQL 8.0.36 / Java 21 / Spring Boot 3.3.4):**
    - **Full Backend Test Suite:** **273 / 273 passed**, 0 failures, 0 errors, 0 skipped (`BUILD SUCCESS`, 4m 50s execution across all 33 test suites).
    - **Clean Compilation & Package Verification:** `mvn clean package -DskipTests` **BUILD SUCCESS** (41.6s, compiling 127 main and 35 test source files cleanly, building `target/acadlytic-backend-0.0.1-SNAPSHOT.jar`).
    - **Targeted Module 3.6 Suites:** **125 tests passed** across 9 test classes (0 failures, 0 errors, 0 skipped):
      - `DocumentReviewIntegrationTest`: 19 / 19 passed.
      - `CollegeReviewIntegrationTest`: 21 / 21 passed.
      - `CollegeOnboardingIntegrationTest`: 10 / 10 passed.
      - `CollegeRegistrationIntegrationTest`: 5 / 5 passed.
      - `SchemaAndConstraintsIntegrationTest`: 5 / 5 passed.
      - `V6DocumentLevelReviewMigrationTest`: 17 / 17 passed.
      - `CollegeReviewControllerUnitTest`: 16 / 16 passed.
      - `CollegeReviewServiceUnitTest`: 17 / 17 passed.
      - `CollegeOnboardingServiceUnitTest`: 15 / 15 passed.
  - **Subsequent Module Status:**
    - **Module 3.6C (Backend College Approval Integration & Lifecycle):** `APPROVED` (Explicitly approved by Project Owner on 2026-11-26; reference reports `Module-3.6C-Implementation-Report-v1.0.md` and `Module-3.6C-Replacement-Verification-Report-v1.0.md`).
  - **Reference Reports:**
    - `docs/03-phase/Module-3.6B-Implementation-Report-v1.1.md` (Approved Implementation Report v1.1 — Consolidated Verification Edition)
    - `docs/03-phase/Module-3.6B-Implementation-Report-v1.0.md`
- **Module 3.6C (Backend College Approval Integration & Lifecycle):** `APPROVED`.
  - **Approval Status:** Explicitly approved by Project Owner on 2026-11-26.
  - **Approved Implementation Reports:**
    - `docs/03-phase/Module-3.6C-Implementation-Report-v1.0.md` (Implementation Report v1.0)
    - `docs/03-phase/Module-3.6C-Replacement-Verification-Report-v1.0.md` (Replacement Document Active-Set Verification Report v1.0)
  - **Planning Reference:** Approved Planning Report v1.1 + Final Targeted Clarification Addendum (BF-07 through BF-12).
  - **Implementation Scope:**
    - Document verification gates in `CollegeReviewService.recordDecision(APPROVE)` requiring all active submitted registration documents to be `ACCEPTED`.
    - Enforced mandatory document categories (`UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`). If any mandatory category is missing, `recordDecision(APPROVE)` raises `400 REQUIRED_DOCUMENTS_MISSING`.
    - Document status enforcement: If any active document is `REJECTED`, approval raises `409 DOCUMENTS_REJECTED`. If any active document is `PENDING` (or unverified), approval raises `409 DOCUMENTS_NOT_VERIFIED`.
    - Reviewer action autonomy: `REQUEST_ACTION` and `REJECT` application decisions remain unrestricted by document verification status.
    - Hierarchical locking eliminating deadlocks: Parent `College` entity row is locked first under pessimistic write lock (`findByIdWithLock`), followed by target `CollegeRegistrationDocument` rows locked second with deterministic ordering (`findByRegistrationIdWithLock`).
    - Transaction atomicity & rollback guarantees: Verification gate failures roll back completely with zero state mutations, zero audit events, and zero outbox notifications.
    - Review freezing & revision isolation: Committing any college decision (`APPROVE`, `REQUEST_ACTION`, `REJECT`) freezes review eligibility (`409 APPLICATION_NOT_AWAITING_REVIEW`). Preceding revision documents are strictly isolated and cannot satisfy new revision approval gates.
    - Module 3.5 lifecycle preservation: Approval activates the college (`CollegeStatus.ACTIVE`, `managementUnlocked = true`) and dispatches notifications; permanent rejection/suspension revokes active sessions via `SessionRevocationService`.
  - **Replacement Document Active-Set Verification:**
    - Verified `CollegeRegistrationDocument.replacesDocumentId` mapping and V4/V6 database schema constraints (`uq_crd_registration_replacement`).
    - Validated that `CollegeReviewService` computes superseded documents via `supersededIds = { d.replacesDocumentId }` and selects active documents via `!supersededIds.contains(d.getId())`. Replacement documents are correctly retained in the active verification set.
    - Confirmed zero production-code modifications were required for the replacement-document concern (the production code was already mathematically correct; the inquiry originated from shorthand phrasing in Report v1.0).
    - Multi-stage lifecycle integration test (Scenario 15) validates: replacement document is included in active set; superseded original cannot satisfy gates; replacement document verification status (`PENDING` -> `REJECTED` -> `ACCEPTED`) strictly controls approval outcome; historical documents from earlier revisions cannot satisfy new revision mandatory categories.
  - **Automated Test Results (Testcontainers MySQL 8.0.36 / Java 21 / Spring Boot 3.3.4):**
    - **Full Backend Test Suite:** **291 / 291 passed**, 0 failures, 0 errors, 0 skipped.
    - **Targeted Module 3.6 Regression Suites:** **140 / 140 passed** across 6 test classes:
      - `CollegeApprovalIntegrationTest`: 15 / 15 passed (all 15 scenarios passed).
      - `CollegeReviewIntegrationTest`: 20 / 20 passed.
      - `CollegeLifecycleIntegrationTest`: 23 / 23 passed.
      - `CollegeOnboardingIntegrationTest`: 40 / 40 passed.
      - `DocumentReviewIntegrationTest`: 15 / 15 passed.
      - `V6DocumentLevelReviewMigrationTest`: 27 / 27 passed.
    - **Dedicated College Approval Suite (`CollegeApprovalIntegrationTest`):** **15 / 15 passed** (100% pass rate).
    - **Clean Compilation & Package Verification:** `mvn clean package -DskipTests` **BUILD SUCCESS** (`target/acadlytic-backend-0.0.1-SNAPSHOT.jar`).
  - **Subsequent Status:**
    - Super Admin Frontend Document Review Workflow (Unassigned) is APPROVED (2026-11-26).
    - Phase 03 overall remains `IN_PROGRESS` pending live manual browser/API E2E verification against the live local application environment (Spring Boot backend, Vite frontend, and local MySQL).
  - **Reference Reports:**
    - `docs/03-phase/Module-3.6C-Implementation-Report-v1.0.md`
    - `docs/03-phase/Module-3.6C-Replacement-Verification-Report-v1.0.md`
- **Super Admin Frontend Document Review Workflow (Unassigned):** `APPROVED`.
  - **Approval Status:** Explicitly approved by Project Owner on 2026-11-26.
  - **Approved Implementation Report:** `docs/03-phase/Module-03-Frontend-Document-Review-Implementation-Report-v1.1.md` (Implementation Report v1.1).
  - **Planning Reference:** `docs/03-phase/Module-03-Frontend-Document-Review-Planning-Report-v1.1.md` (Planning Report v1.1).
  - **Implementation Scope:**
    - Frontend implementation only (zero backend source code, zero database migrations).
    - 14 total files affected:
      - 3 files created: `frontend/src/components/review/DocumentStatusBadge.tsx`, `frontend/src/components/review/DocumentReviewDecisionModal.tsx`, `frontend/src/components/review/DocumentReviewHistoryModal.tsx`.
      - 10 files modified: `frontend/src/types/index.ts`, `frontend/src/schemas/reviewSchema.ts`, `frontend/src/services/queryKeys.ts`, `frontend/src/services/reviewService.ts`, `frontend/src/hooks/useCollegeReview.ts`, `frontend/src/components/review/ReviewDocumentListCard.tsx`, `frontend/src/components/review/ReviewDecisionPanel.tsx`, `frontend/src/components/review/ReviewDecisionModal.tsx`, `frontend/src/components/review/index.ts`, and `frontend/src/pages/admin/CollegeReviewDetailPage.tsx`.
      - 1 test file extended: `frontend/src/test/super-admin-review.test.tsx`.
  - **Delivered Capabilities & Architecture:**
    - **Document Verification Status Badges (`DocumentStatusBadge`):** Renders verification states (`PENDING`, `ACCEPTED`, `REJECTED`, `NOT_REVIEWED`) and provenance badges (`CARRIED_FORWARD`, `LEGACY_COLLEGE_APPROVAL`).
    - **Authoritative Version Isolation:** Strictly binds document review decisions to `doc.version` as `expectedDocumentVersion` (supporting version 0 as valid initial upload), never substituting college concurrency version.
    - **Fail-Closed Data Integrity Protection:** If a document lacks `version` (null or undefined), displays a prominent amber warning badge and disables the "Review" action button, eliminating unversioned mutations.
    - **Optimistic Concurrency Conflict Recovery:** Intercepts HTTP 409 `STALE_DOCUMENT_VERSION`, halts review flow, closes modal, refetches application details, and renders a prominent conflict banner prompting reviewer inspection of fresh state.
    - **Lifecycle Freezing & History Access:** Disables document review actions if college is not awaiting review (`approvalStatus !== 'PENDING'`), while preserving full read-only "View History" modal access across all lifecycle states.
    - **Document Review History Inspection (`DocumentReviewHistoryModal`):** Reverse-chronological audit timeline displaying past document review decisions, reviewer admin emails, timestamps, verification badges, and notes/rejection reasons.
    - **College Approval Readiness Calculation (`assessDocumentReadiness`):** Enforces mandatory categories (`UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`), verifies zero missing mandatory categories, zero pending active documents, and zero rejected active documents before application approval.
    - **Backend Error Code Mapping:** Maps 400 `REQUIRED_DOCUMENTS_MISSING`, 409 `DOCUMENTS_REJECTED`, and 409 `DOCUMENTS_NOT_VERIFIED` to user-facing feedback alerts.
  - **Automated Test Results (Vitest 2.1.9 / JSDOM / Node.js 22 / React 18):**
    - **Focused Review Test Suite (`src/test/super-admin-review.test.tsx`):** **58 / 58 passed** (0 failures, 0 errors, 0 skipped; 26 baseline queue/detail tests + 20 existing review tests + 12 comprehensive document-review workflow scenarios).
    - **Full Frontend Test Suite (`npx vitest run`):** **212 / 212 passed across 13 test files** (0 failures, 0 errors, 0 skipped).
    - **Strict TypeScript Compilation (`tsc -b`):** PASSED (0 errors under strict mode).
    - **Production Bundle Build (`npm run build`):** PASSED (`vite build`, 1,786 modules transformed in 27.54s, clean production bundle in `dist/`).
  - **Subsequent Status:**
    - Phase 03 overall remains `IN_PROGRESS` pending live manual browser/API E2E verification against the live local application environment (Spring Boot backend, Vite frontend, and local MySQL).
  - **Reference Reports:**
    - `docs/03-phase/Module-03-Frontend-Document-Review-Planning-Report-v1.1.md`
    - `docs/03-phase/Module-03-Frontend-Document-Review-Implementation-Report-v1.1.md`

- **Document Review UI Redesign & College Admin Hooks Fix (Unassigned):** `APPROVED`.
  - **Approval Status:** Formally verified and explicitly APPROVED by the project owner on 2026-11-27.
  - **Module Assignment:** `Unassigned` (preserved as unassigned; no module number invented).
  - **Delivered Capabilities & Architecture:**
    - **Redesigned Document Review UI (`ReviewDocumentListCard.tsx`):**
      - Document table rows now present exactly one primary action button: `Review`.
      - Clicking `Review` opens the interactive document preview and decision modal (`DocumentPreviewReviewModal`).
      - Removed the confusing `Direct Review` provenance badge from the review table while preserving authoritative database and audit event provenance.
      - Preserved secondary `View History` action button for inspecting the chronological decision audit timeline.
    - **Integrated Document Preview & Decision Modal (`DocumentPreviewReviewModal.tsx`):**
      - Reviewers preview document content and record verification decisions (`Accept` or `Reject` with rejection notes) directly inside the modal in a unified, intuitive review flow.
    - **College Admin Onboarding Status Page Fix (`OnboardingStatusPage.tsx`):**
      - Resolved a React Rules of Hooks violation caused by conditional execution of hooks before early returns.
      - Guaranteed `useCollegeRegistration` hook executes unconditionally on every component render.
      - Preserved correct, flicker-free rendering across loading, pending review, action requested, rejected, and approved states.
    - **Post-Approval Redirection Fix (`ProtectedRoute.tsx` / `LoginPage.tsx` / `OnboardingStatusPage.tsx`):**
      - College Admin login post-approval now immediately and correctly redirects to `/college/dashboard` instead of `/onboarding/status`.
      - Eliminated infinite redirection loop for active approved colleges.
    - **Review Detail Refetch Race Condition Fix (`CollegeReviewDetailPage.tsx`):**
      - Eliminated invalid HTTP 409 review-detail refetch attempts on unmounted or stale review detail components following decision submission.
  - **Automated Test Results (Vitest 2.1.9 / JSDOM / Node.js 22 / React 18):**
    - **Full Frontend Test Suite (`npx vitest run`):** **211 / 211 passed across 14 test files** (0 failures, 0 errors, 0 skipped; 11 previously separate test assertions consolidated/updated to reflect the modal-driven preview workflow without loss of coverage).
    - **Strict TypeScript Compilation (`tsc -b`):** PASSED (0 errors under strict mode).
    - **Production Bundle Build (`npm run build`):** PASSED (`vite build`, clean production bundle generated in `dist/`).
  - **Manual Browser Verification:**
    - **Tests 1–4 PASSED:** Manual browser verification successfully performed by the user covering document preview modal workflow, single review action button, College Admin onboarding status view, and post-approval navigation.
  - **Reference Reports:**
    - `docs/03-phase/Module-03-Frontend-Document-Review-Implementation-Report-v1.0.md`
    - `docs/03-phase/Module-03-Frontend-Document-Review-Implementation-Report-v1.1.md`

- **Phase 03 DEF-01 Targeted Remediation (Backend Document Verification Gate & Frontend 409 Classification):** `APPROVED`.
  - **Approval Status:** Formally verified and explicitly APPROVED by the project owner on 2026-11-27.
  - **Delivered Capabilities & Architecture:**
    - **Relocated Backend Document Verification Gate (`CollegeReviewService.java`):**
      - Moved document completeness and verification status validation directly inside `case APPROVE ->` in `executeRecordDecision`.
      - Enforces that all mandatory document categories are present, zero active documents have `REJECTED` verification status, and zero active documents remain `PENDING` or `NOT_REVIEWED` prior to college approval.
      - Rejection of application (`case REJECT ->`) and action requests (`case REQUEST_ACTION ->`) remain completely unrestricted by document status, allowing reviewers to reject non-compliant applications or request revisions immediately.
    - **Frontend 409 Error Disambiguation (`ReviewDecisionModal.tsx`):**
      - Updated error classification logic to distinguish HTTP 409 error codes:
        - `DOCUMENTS_REJECTED` and `DOCUMENTS_NOT_VERIFIED` correctly display document verification errors with explicit remediation instructions advising the reviewer to inspect rejected or pending documents.
        - Only `STALE_APPLICATION_VERSION` triggers the application concurrency conflict message prompting a detail refetch.
    - **Optimistic Document Version Synchronization Fix (`CollegeReviewService.java`):**
      - Added `collegeRegistrationDocumentRepository.saveAndFlush(document)` in `executeRecordDocumentDecision`.
      - Guarantees immediate database synchronization of the incremented document optimistic lock version before returning the DTO to the caller.
    - **Integration Test Stabilization (`DocumentReviewIntegrationTest.java`):**
      - Stabilized test fixtures and document creation helpers; all **19 / 19** integration tests pass cleanly on Testcontainers MySQL 8.0.36.
  - **Automated Test Results:**
    - **Full Backend Test Suite (`mvn clean test`):** **296 / 296 passed** across all unit, repository, and integration tests (including MySQL 8.0.36 Testcontainers) with 0 failures, 0 errors, and 0 skipped.
    - **Full Frontend Test Suite (`npx vitest run`):** **213 / 213 passed across 14 test files** (including new DEF-01 regression tests in `super-admin-review.test.tsx`).
    - **Clean Package Build:** `mvn clean package -DskipTests` cleanly compiles and packages `target/acadlytic-backend-0.0.1-SNAPSHOT.jar` (BUILD SUCCESS).
  - **Manual API & Database Invariant Verification:**
    - **DEF-01 Test A (APPROVAL blocked when active document REJECTED):** **`PASS`**.
      - Executed manual API request `POST /api/v1/super-admin/colleges/reviews/5/decision` (Action: `APPROVE`, `expectedVersion`: `1`) against disposable `DEF01 Gate Test College` (College ID 5, Registration ID 6) where Authorized Signatory ID had `REJECTED` status.
      - Verified exact API response: HTTP `409 Conflict`, `success: false`, `errorCode: DOCUMENTS_REJECTED`.
      - Verified database invariants via SELECT-only queries:
        - College ID 5 `approval_status` remained `PENDING`.
        - College operational status remained `PENDING_VERIFICATION`.
        - College version remained `1`.
        - Registration ID 6 remained `PENDING`.
        - Zero approval audit events were created in `audit_events`.
        - Document review statuses and versions remained unchanged.
      - Verified outbox invariants:
        - Verified zero outbox email records created in `outbox_emails` for College ID 5 (`AUTO_INCREMENT` remained unchanged at 16, row count at 15).
    - **Remaining Manual DEF-01 Scenarios:** `PENDING` (Approval after all documents accepted, application reject with rejected documents, request action with rejected documents, and reactivation flow to be validated during final Phase 03 manual verification).
  - **Reference Reports:**
    - `docs/03-phase/Phase-03-Final-Backend-Verification-And-Test-Stabilization-Report-v1.0.md`
    - `docs/03-phase/DEF-01-Manual-API-Verification-Preflight-Report-v1.0.md`
    - `docs/03-phase/DEF-01-Test-A-Post-Request-Database-Invariant-Verification-Report-v1.0.md`
    - `docs/03-phase/DEF-01-Test-A-Outbox-Invariant-Evidence-Report-v1.0.md`

### Phase 03 Execution Strategy:
**Phase 03 baseline backend modules (3.1A, 3.2, 3.3, 3.4, and 3.5), baseline frontend modules (3.1B, 3.2, 3.3, 3.4, and 3.5), Document-Level Review Database Schema & Flyway Migration (Module 3.6A), Document-Level Review Backend Service & APIs (Module 3.6B), Backend College Approval Integration & Lifecycle (Module 3.6C), Super Admin Frontend Document Review Workflow (Unassigned), Document Review UI Redesign & College Admin Hooks Fix (Unassigned), and DEF-01 Targeted Remediation are COMPLETE and APPROVED.**  
Phase 03 overall remains `IN_PROGRESS` until full end-to-end integration and live manual browser/API verification against the live local application environment (Spring Boot backend, Vite frontend, and local MySQL) are completed.

### Next Planned Activity:
1. **Phase 03 — Manual Browser/API E2E Verification & Integration Hardening against the live local application environment (Spring Boot backend, Vite frontend, and local MySQL)**
   - **Status:** `PENDING` (Live manual browser/API verification against the live local application environment [Spring Boot backend, Vite frontend, and local MySQL] pending).
   - **Scope:**
     - End-to-end integration across backend and frontend in the live local application environment (Spring Boot backend on localhost:8080, Vite frontend on localhost:5173, and local MySQL on localhost:3306).
     - Live manual browser and API checklist verification for Phase 03 closure (`phase-02-manual-checklist.md` / Phase 03 manual verification checklist, including remaining DEF-01 manual verification scenarios).
2. **Phase 04 — Module 4.3: College Admin Profile APIs (Self-Service)**
   - **Status:** `NOT_STARTED` (Phase-level plan v1.2 APPROVED; Modules 4.1 & 4.2 APPROVED; Module 4.3 detailed planning awaiting developer authorization).
   - **Scope:** College Admin self-service college profile REST endpoints (`/api/v1/colleges/my-college`), profile update validation, governance constraints, DTOs, service layer, security authorization, and integration tests.

---

### Phase 04 — College Management (Tenant Management & Profile) — Planning Approval & Module Structure

- **Parent Epic:** Epic E2 — Tenant Management & Profile
- **Approved Planning Artifact:** `docs/04-phase/Acadlytic_Phase_04_Final_Module_Breakdown_and_Dependency_Plan_v1.2.md`
- **Plan Approval Date:** 2026-11-27 (Explicitly approved by the project owner)
- **Planning Status:** `APPROVED`
- **Phase Implementation Status:** `IN_PROGRESS` (Modules 4.1 & 4.2 APPROVED; Modules 4.3–4.7 `NOT_STARTED`)
- **Scope Distinction:** The project owner formally approved the phase-level module breakdown, architectural boundaries, dependency sequence, and governance plan (v1.2). This approval authorizes the phase architecture and plan only; it does NOT authorize code implementation or mark any individual module as started.

#### Approved Seven Canonical Modules

| Module | Name | Type | Initial Status |
| :--- | :--- | :--- | :--- |
| **Module 4.1** | College Operational Profile & Schema Foundation | Database + Backend Entity | `APPROVED` (Plan v1.2 & Implementation Approved 2026-11-28) |
| **Module 4.2** | Super Admin College Management APIs | Backend | `APPROVED` (Plan v1.3 & Implementation Approved 2026-11-28) |
| **Module 4.3** | College Admin Profile APIs | Backend | `NOT_STARTED` |
| **Module 4.4** | College Admin Assignment & Succession | Backend + Security | `NOT_STARTED` |
| **Module 4.5** | Super Admin College Management UI | Frontend | `NOT_STARTED` |
| **Module 4.6** | College Admin College Profile UI | Frontend | `NOT_STARTED` |
| **Module 4.7** | Cross-Tenant Security & Operational Hardening | Consolidated Verification | `NOT_STARTED` |

*(Note: No fractional module labels such as 4.1A, 4.1B, or 4.2A are permitted).*

#### Module 4.1 — College Operational Profile & Schema Foundation (APPROVED)

- **Canonical Name:** `4.1 College Operational Profile & Schema Foundation (Database + Backend Entity)`
- **Plan Status:** `APPROVED` (Module 4.1 Detailed Implementation Plan v1.2 explicitly approved on 2026-11-28)
- **Implementation Status:** `APPROVED` (Explicitly approved by the project owner on 2026-11-28)
- **Reference Reports:**
  - Implementation Report: `docs/04-phase/Acadlytic_Module_4.1_Implementation_Report_v1.0.md`
  - Callback Boundary Verification Report: `docs/04-phase/Acadlytic_Module_4.1_Callback_Boundary_Verification_Report_v1.0.md`
  - Approved Planning Baseline: `docs/04-phase/Acadlytic_Module_4.1_Detailed_Implementation_Plan_v1.2.md`
- **Verified Deliverables & Architectural Evidence:**
  1. **Flyway V7 Migration (`V7__add_college_profile_fields.sql`):**
     - DDL: Adds 13 nullable operational profile columns to `colleges` (`address_line1`, `address_line2`, `city`, `state`, `pincode`, `contact_phone`, `contact_email`, `website_url`, `established_year`, `affiliated_university`, `accreditation_body`, `accreditation_grade`, `logo_storage_key`).
     - DML (Safe Authoritative Backfill): Backfills existing approved colleges from exactly one authoritative approved revision (`cr.id = c.current_registration_id AND cr.college_id = c.id AND cr.status = 'APPROVED'`). Enforces a 13-column all-null predicate (`c.address_line1 IS NULL AND c.address_line2 IS NULL ...`) so partially or fully populated profiles are never overwritten. Decouples public institutional email (`contact_email` backfilled as `NULL`), never backfilling from personal admin user accounts.
  2. **Preflight Callback (`V7CollegeProfileMigrationPreflightCallback.java`):**
     - Executes `BEFORE_MIGRATE` only when migrating to `V7` (`canHandle` version check).
     - Verifies 6 distinct data-integrity invariants across 5 logical categories before DDL/DML execution:
       1. Orphaned Foreign Key Check: Ensures no college references a non-existent registration revision.
       2. Duplicate Registration Check: Confirms no college references an identical registration ID concurrently.
       3. Status Invariant Check: Ensures authoritative referenced registrations have status `APPROVED`.
       4. Duplicate Inverted Pointer Check: Detects multiple colleges pointing to the same registration revision.
       5. Non-Empty Profile Backfill Check: Validates that referenced approved registrations have non-empty profile data.
       6. Unbackfilled Profile Observability: Logs warnings for valid colleges that cannot be backfilled without aborting migration.
  3. **JPA `College` Entity Extension (`College.java`):**
     - Mapped all 13 operational profile attributes with full getters and fluent setters.
     - Preserved `@Version` optimistic locking column and all existing table constraints.
  4. **College Approval Lifecycle Profile Synchronization (`CollegeLifecycleService.java#onCollegeApproved`):**
     - Synchronizes 9 operational profile fields from the authoritative approved `CollegeRegistration` revision upon college approval: `addressLine1`, `addressLine2`, `city`, `state`, `pincode`, `contactPhone`, `establishedYear`, `affiliatedUniversity`, `accreditationGrade`.
     - Preserves decoupled fields (`contactEmail`, `websiteUrl`, `accreditationBody`, and `logoStorageKey`) as `NULL`/unmodified.
  5. **Callback Boundary Verification:**
     - Verified Flyway callback boundaries: V1–V5 migrations execute with zero callback intervention; V6 preflight callback executes exclusively on V6; V7 preflight callback executes exclusively on V7.
     - Added test case `MIG-14` to verify clean V1–V7 fresh database migration without callback exceptions or table conflicts.
  6. **Automated Verification & Build Results:**
     - Focused Module 4.1 Suite: 64/64 tests passing on Testcontainers MySQL 8.0.36 (18/18 migration tests in `V7CollegeProfileMigrationTest`, 25/25 approval integration tests in `CollegeApprovalIntegrationTest`, 21/21 lifecycle unit tests in `CollegeLifecycleServiceUnitTest`).
     - Full Backend Regression Suite: 329/329 tests passing (0 failures, 0 errors, 0 skipped).
     - Production Build: Clean Maven package build producing `acadlytic-backend-0.0.1-SNAPSHOT.jar` (`BUILD SUCCESS`).

#### Module 4.2 — Super Admin College Management APIs (APPROVED)

- **Canonical Name:** `4.2 Super Admin College Management APIs (Backend)`
- **Plan Status:** `APPROVED` (Module 4.2 Detailed Implementation Plan v1.3 explicitly approved on 2026-11-28)
- **Implementation Status:** `APPROVED` (Explicitly approved by the project owner on 2026-11-28)
- **Reference Reports:**
  - Implementation Report: `docs/04-phase/Acadlytic_Module_4.2_Implementation_Report_v1.2.md`
  - Approved Planning Baseline: `docs/04-phase/Acadlytic_Module_4.2_Detailed_Implementation_Plan_v1.3.md`
- **Verified Deliverables & Architectural Evidence:**
  1. **Platform College Directory Listing (`GET /api/v1/super-admin/colleges`):**
     - Paginated, filterable, searchable directory across college identity attributes (`name`, `code`, `contactEmail`, `affiliatedUniversityName`).
     - Dynamic search using `CriteriaBuilder.like` with explicit SQL wildcard escaping for `%`, `_`, and `\`.
     - Filtering by operational status (`status`), approval status (`approvalStatus`), university affiliation (`affiliatedUniversity`), city, and state.
     - Pagination boundaries: `page >= 0`, `1 <= size <= 100` (defaults: `page=0`, `size=20`). Out-of-bounds requests return HTTP 400 `VALIDATION_ERROR`.
     - Client sort whitelist: `name`, `code`, `status`, `approvalStatus`, `city`, `state`, `affiliatedUniversityName`, `createdAt`, `updatedAt`.
     - Deterministic sorting: Query always appends internal secondary tie-breaker `id ASC`. The field `id` was removed from the client sort whitelist; client requests with `sortBy=id` return HTTP 400 `INVALID_SORT_PROPERTY`.
     - Bounded O(1) batch active admin retrieval via `userRepository.findByCollegeIdInAndRoleAndStatus(...)`, eliminating N+1 query overhead.
  2. **Deep College Details & Profile Inspection (`GET /api/v1/super-admin/colleges/{id}`):**
     - Exposes core tenant identity and 12 operational profile attributes (`addressLine1`, `addressLine2`, `city`, `state`, `country`, `postalCode`, `contactPhone`, `contactEmail`, `websiteUrl`, `affiliatedUniversityName`, `establishedYear`, `accreditationDetails`).
     - Derived boolean `hasLogo` (`logoStorageKey != null && !logoStorageKey.isBlank()`); raw internal storage key `logoStorageKey` is never exposed.
     - Authoritative revision context (`currentRegistrationVersion`, `currentRegistrationStatus`, `currentRegistrationSubmittedAt`) strictly resolved via `College.currentRegistrationId` with ownership verification (`reg.collegeId == college.id`). Mismatched pointers or missing records safely return nulls without errors.
     - Active Admin Summary (`ActiveAdminSummary`): Exposes all 7 Plan v1.3 supported attributes directly mapped from `User`: `userId` (with `id` alias), `firstName`, `lastName`, `fullName`, `email`, `status`, and `emailVerified`.
     - Non-existent college ID returns HTTP 404 `COLLEGE_NOT_FOUND`.
  3. **Controlled Operational Status Management (`PATCH /api/v1/super-admin/colleges/{id}/status`):**
     - State machine enforcement:
       - `ACTIVE → SUSPENDED`: Allowed (ADR-10 session revocation + audit `COLLEGE_SUSPENDED` + outbox `COLLEGE_SUSPENDED`).
       - `ACTIVE → INACTIVE`: Allowed (ADR-10 session revocation + audit `COLLEGE_DEACTIVATED` + outbox `COLLEGE_DEACTIVATED`).
       - `SUSPENDED → ACTIVE`: Allowed (audits `COLLEGE_REACTIVATED` + outbox `COLLEGE_ACTIVATED`).
       - `SUSPENDED → INACTIVE`: Allowed (ADR-10 session revocation + audit `COLLEGE_DEACTIVATED` + outbox `COLLEGE_DEACTIVATED`).
       - `INACTIVE → ACTIVE`: Allowed (**Reactivation**, audits `COLLEGE_REACTIVATED` + outbox `COLLEGE_ACTIVATED`).
       - `INACTIVE → SUSPENDED`: **Prohibited** (rejected with HTTP 400 `INVALID_STATUS_TRANSITION` without side effects).
       - `* → PENDING_VERIFICATION`: Prohibited (rejected with HTTP 400 `INVALID_STATUS_TRANSITION`).
       - From `PENDING_VERIFICATION`: Prohibited (rejected with HTTP 409 `COLLEGE_NOT_APPROVED`).
       - Permanently rejected: Prohibited (rejected with HTTP 409 `REGISTRATION_PERMANENTLY_REJECTED`).
       - Archived: Prohibited (rejected with HTTP 409 `COLLEGE_ARCHIVED`).
       - Same-status transition: Prohibited (rejected with HTTP 400 `SAME_STATUS_NOOP`).
     - ADR-10 Immediate Session Revocation: Synchronously executes `sessionRevocationService.revokeAllSessionsForCollege(collegeId)`, deleting all active Spring Sessions across all users belonging to the college upon transition to `SUSPENDED` or `INACTIVE`.
     - Reactivation Audit & Notification Decoupling: For **both** `SUSPENDED → ACTIVE` and `INACTIVE → ACTIVE`, audit event recorded is `COLLEGE_REACTIVATED` and outbox email template key is `"COLLEGE_ACTIVATED"`.
     - Concurrency Control: Mandatory `expectedVersion` check with database-level flush verifying optimistic locks; conflicts return HTTP 409 `STALE_COLLEGE_VERSION`.
     - Resilient Outbox Dispatch: Safe warning logged and transition proceeds if active admin is missing or email is blank.
  4. **Full-Replacement Profile Mutation (`PUT /api/v1/super-admin/colleges/{id}`):**
     - Required fields validated (`name`, `addressLine1`, `city`, `state`, `country`, `postalCode`, `version`).
     - Legal `name` modification permitted with mandatory `COLLEGE_PROFILE_UPDATED` audit diff recording `previousName` and `newName`.
     - Immutable `code` protected (modifications return HTTP 400 `FIELD_IMMUTABLE`).
     - Optional string attributes normalized to database `NULL` when omitted, explicit null, empty string `""`, or whitespace-only `"   "`.
     - Comprehensive diff auditing in `COLLEGE_PROFILE_UPDATED` recording `previous` and `new` values for all modified fields.
     - No-op handling: Submissions with zero field changes perform no database write, increment no version, emit zero audit events, and return HTTP 200 with existing state.
  5. **Security & INACTIVE College Enforcement:**
     - Non-Super Admin requests rejected with HTTP 403 `ACCESS_DENIED`.
     - `AuthService.validateCollegeAllowsLogin` blocks login attempts for `INACTIVE` colleges with HTTP 403 `COLLEGE_INACTIVE` and records `LOGIN_FAILURE`.
     - `CollegeAccessGuard.requireApprovedAndActiveCollege` blocks protected API requests from `INACTIVE` colleges with HTTP 403 `COLLEGE_INACTIVE` even if an un-revoked session remains.
     - `SUSPENDED` colleges blocked with HTTP 403 `COLLEGE_SUSPENDED`.
  6. **Database & Frontend Scope:**
     - Database: No new migration; existing V1–V7 schema preserved.
     - Frontend: Module 4.2 has no frontend scope.
  7. **Manual Verification:**
     - Manual E2E verification remains pending as tracked by the live environment checklist.
  8. **Automated Verification & Build Results:**
     - Focused Module 4.2 Unit Tests: 6/6 passed (`CollegeManagementServiceUnitTest`).
     - Focused Module 4.2 Integration Tests: 46/46 passed on Testcontainers MySQL 8.0.36 (`SuperAdminCollegeIntegrationTest`).
     - Module 4.1 Regression Suite: 64/64 passed (`V7CollegeProfileMigrationTest`: 18, `CollegeApprovalIntegrationTest`: 25, `CollegeLifecycleServiceUnitTest`: 21).
     - Full Backend Platform Regression Suite: **382/382 tests passing** (0 failures, 0 errors, 0 skipped across 39 test classes).
     - Production Build: Clean Maven package build producing `acadlytic-backend-0.0.1-SNAPSHOT.jar` (`BUILD SUCCESS` in 14.2s).

#### Approved Scope Boundaries & Architectural Decisions
1. **Sole College Intake Workflow:** Public college self-registration (`POST /api/v1/college-registrations`) and Phase 03 Super Admin review/approval remain the sole MVP college intake workflow.
2. **Exclusion of Direct Creation:** Direct college creation through `POST /api/v1/colleges` is explicitly excluded from MVP.
3. **Session Authentication Architecture:** Authentication remains stateful HTTP-only session cookie authentication backed by Spring Session JDBC and MySQL (`SPRING_SESSION`, `SPRING_SESSION_ATTRIBUTES`). JWT and Redis are strictly prohibited.
4. **Module 4.1 Responsibilities:** Module 4.1 owns Flyway V7 migration (`V7__add_college_profile_fields.sql`), operational profile schema extension on `colleges`, JPA entity mapping, single authoritative approved registration revision backfill, and approval lifecycle profile synchronization (`CollegeLifecycleService.java#onCollegeApproved`).
5. **Single Authoritative Revision Backfill:** Profile backfill must use strictly one validated authoritative approved registration revision (`cr.id = c.current_registration_id AND cr.college_id = c.id AND cr.status = 'APPROVED'`). Fields from multiple historical revisions must never be combined or merged, and latest historical revisions must not be guessed when pointers are inconsistent. Ambiguous or inconsistent records are excluded from automatic backfill, left with `NULL` operational fields, and surfaced in the preflight report (`V7CollegeProfileMigrationPreflightCallback`). Valid existing profile values are never overwritten (`AND c.address_line1 IS NULL`).
6. **Institutional Contact Email Decoupling:** Institutional `contact_email` is backfilled as `NULL`. It must not be backfilled from an administrator's personal login email (`users.email`), keeping personal authentication credentials decoupled from institutional public correspondence.
7. **Logo Scope Boundary:** Binary college logo upload, resizing, and streaming endpoints are deferred to Post-MVP. Only optional `logo_storage_key` (`VARCHAR(100) NULL`) metadata is included in Phase 04 scope.
8. **Admin Invitation Token Mechanics:** New administrator invitation token design remains an unresolved decision for Module 4.4 detailed planning (due to existing `PASSWORD_RESET` token having a 15-minute TTL and not confirming email verification). Token design must not be prematurely selected.
9. **Governance Flags:** College name and accreditation editability governance remain flagged for individual module planning (defaulting to read-only for College Admin to prevent bypassing onboarding verification).
10. **ADR Compliance:** Strict compliance with ADR-05 (Session Revocation upon admin replacement), ADR-06 (Single Active College Admin via database virtual generated column), ADR-07 (Optimistic Locking & Concurrency via `@Version`), ADR-08 (Approval Lifecycle), and ADR-10 (Immediate Session Revocation upon College Suspension).
11. **Testing Boundaries:** Every implementation module (4.1–4.6) owns its own unit, integration, and component tests. Module 4.7 owns consolidated cross-module integration, cross-tenant penetration (IDOR), session revocation, and security verification.
12. **Phase Decoupling:** Phase 04 verification must not be treated as Phase 03 approval.

#### Approved Dependencies & Recommended Execution Sequence
- **Dependency Matrix:**
  - `4.1` $\rightarrow$ `4.2`, `4.3`, `4.4`
  - `4.2` $\rightarrow$ `4.4`, `4.5`
  - `4.3` $\rightarrow$ `4.6`
  - `4.4` $\rightarrow$ `4.5`
  - `4.1`–`4.6` $\rightarrow$ `4.7`
- **Recommended Three-Stage Execution Sequence:**
  1. *Stage 1 (Foundation):* Module 4.1 (Schema, Entity, Backfill, Lifecycle Hook)
  2. *Stage 2 (Backend APIs):* Module 4.2 (Super Admin APIs) and Module 4.3 (College Admin APIs) in parallel where practical; followed by Module 4.4 (Admin Succession & Security)
  3. *Stage 3 (Frontend UIs):* Module 4.5 (Super Admin UI) and Module 4.6 (College Admin UI) in parallel where practical (strictly after respective backend APIs and contracts are verified)
  4. *Stage 4 (Hardening):* Module 4.7 (Consolidated Multi-Tenant Verification & Platform Non-Regression)

#### Independent Tracking of Phase 03
- **Phase 03 Status:** Remains strictly `IN_PROGRESS`.
- **Pending Verification:** Remaining live manual browser/API E2E verification in the live local application environment (Spring Boot backend, Vite frontend, and local MySQL) remains pending.
- **Independence:** Phase 04 is permitted to progress independently, but completing Phase 04 does not automatically complete, approve, or close Phase 03.

---

# 14. IMPORTANT PROJECT BOUNDARIES

The following must not happen without explicit approval:

- Do not convert the modular monolith into microservices.
- Do not replace session-cookie authentication with JWT.
- Do not disable CSRF.
- Do not bypass tenant isolation.
- Do not implement student login in the MVP.
- Do not implement academic staff functionality in the MVP.
- Do not introduce branch management into the MVP.
- Do not add multiple active COLLEGE_ADMIN accounts in the MVP.
- Do not invent university grading formulas.
- Do not make the frontend the authority for academic calculations or permissions.
- Do not allow imported results to directly overwrite authoritative academic records.
- Do not delete historical academic data.
- Do not implement multiple modules together without approval.
- Do not change approved ADR decisions silently.

# 15. YOUR RESPONSIBILITY AS THE AI AGENT

You are acting as a software engineering assistant working on the Acadlytic project.

Your responsibilities are to:

1. Understand the project before making changes.
2. Follow the established architecture and business rules.
3. Inspect existing files before editing.
4. Respect the MVP and Post-MVP boundaries.
5. Implement only the requested task.
6. Write maintainable, secure, testable code.
7. Protect academic data integrity and tenant isolation.
8. Follow the approved ADRs.
9. Provide evidence-based implementation reports.
10. Identify risks and missing requirements before making assumptions.

When something is unclear:

- Do not invent business logic.
- Do not make irreversible architectural decisions.
- Do not silently change scope.
- Explain the ambiguity.
- Ask for clarification when the missing decision materially affects implementation.

# 16. FIRST ACTION AFTER RECEIVING THIS CONTEXT

Do not start implementing a feature immediately.

First:

1. Confirm your understanding of Acadlytic.
2. Inspect the current repository and identify the actual project structure.
3. Identify the current implementation status from code and documentation.
4. Read the relevant roadmap and feature specification for the requested task.
5. Identify any differences between the documented design and current implementation.
6. Provide a concise inspection report.
7. Wait for the specific implementation task and approval.

**Final instruction:** Treat Acadlytic as an existing, carefully planned SaaS product—not a new application to be generated from scratch. Preserve approved decisions, inspect before editing, work one module at a time, and prioritize correctness, security, maintainability, and academic data integrity.