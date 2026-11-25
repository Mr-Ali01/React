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

- **Current Development Phase:** Phase 03 — College Registration, Restricted Dashboard & Approval Workflow
- **Current Module / Status:** Phase 03 Backend Modules (3.1A, 3.2, 3.3, 3.4 & 3.5) and Frontend Modules (3.1B, 3.2, 3.3, 3.4 & 3.5) are **APPROVED**. Complete Phase 03 backend verified on Testcontainers MySQL 8.0.36 (237/237 tests passing, schema V5). Phase 03 Frontend Modules verified via automated tests (168/168 tests passing across 13 test files; Module 3.1B: 26/26; Module 3.2: 43/43; Module 3.3: 26/26; Module 3.4: 26/26; Module 3.5: 32/32; strict `tsc -b` passed, and production Vite build passed; Module 3.5 explicitly approved by project owner on 2026-11-25; reference report v1.2). Phase 03 remains `IN_PROGRESS` (interactive browser/API verification against Docker services remains pending).
- **Last Approved Module:** Phase 03, Module 3.5 — Approval Lifecycle, College Activation & Revisions (Frontend) (Explicitly APPROVED by project owner on 2026-11-25; reference report v1.2).
- **Next Planned Phase / Module:** Phase 03 Manual End-to-End Browser & Live API Verification (Docker environment).
- **Overall MVP Progress Status:** Phase 01/02 Implemented (Verification Pending); Phase 03 Backend Complete & APPROVED (Modules 3.1A, 3.2, 3.3, 3.4, and 3.5 Approved; 237/237 backend tests passing; schema V5 active); Phase 03 Frontend Complete & APPROVED (Modules 3.1B, 3.2, 3.3, 3.4, and 3.5 Approved; 168/168 full frontend tests passing across 13 test files; production build clean). Phase 03 overall remains `IN_PROGRESS` pending live manual browser/API verification against Docker services.

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
| **Phase 03** | College Registration, Restricted Dashboard & Approval Workflow | APPROVED (3.1A, 3.2, 3.3, 3.4 & 3.5 Approved) | APPROVED (3.1B, 3.2, 3.3, 3.4 & 3.5 Approved) | IMPLEMENTATION_COMPLETE (V5) | IMPLEMENTATION_COMPLETE (237 Backend Tests Passed, Testcontainers MySQL; 168 Frontend Tests Passed, Vitest) | NOT_VERIFIED | IN_PROGRESS (Backend Approved; Frontend Modules 3.1B, 3.2, 3.3, 3.4 & 3.5 Approved; Manual Verification Pending) |
| **Phase 04** | College Management (Tenant Management & Profile) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
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
> **All Phase 03 Backend Modules (3.1A, 3.2, 3.3, 3.4 & 3.5) and Frontend Modules (3.1B, 3.2, 3.3, 3.4 & 3.5) APPROVED; Live Manual Browser/API Verification PENDING.**  
> All five backend modules of Phase 03—Module 3.1A (Backend Registration Foundation), Module 3.2 (Email Verification & College Admin Verification Lifecycle), Module 3.3 (Restricted Dashboard, Document Management & Review Submission), Module 3.4 (Super Admin Approval Queue & Review Workflow), and Module 3.5 (Approval Lifecycle, College Activation & Revisions)—have been completed, verified on Testcontainers MySQL 8.0.36 (237/237 tests passing, Flyway schema V5), and explicitly approved by the user. All five frontend modules of Phase 03—Module 3.1B (Public College Registration Portal), Module 3.2 (Email Verification & Account Activation), Module 3.3 (College Admin Restricted Dashboard, Document Management & Review Submission), Module 3.4 (Super Admin Approval Queue & Review Workflow), and Module 3.5 (Approval Lifecycle, College Activation & Revisions)—have been implemented, verified via 168/168 automated tests across 13 test files, strict `tsc -b` compilation passed with 0 errors, and Vite production build passed, with Module 3.5 explicitly approved by the project owner on 2026-11-25 (reference report v1.2). Phase 03 overall remains `IN_PROGRESS` until live manual browser/API verification against Docker services is completed.

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

### Implemented Pages & UI Components (Phase 01, Phase 02, Phase 03 Module 3.1B, Module 3.2, Module 3.3 & Module 3.4)
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
  - `CollegeReviewDetailPage` (`src/pages/admin/CollegeReviewDetailPage.tsx`): Comprehensive institutional review dossier displaying administrative credentials, profile details, active verification documents with SHA-256 checksums, decision history audit trail, optimistic version concurrency conflict recovery (`409 STALE_APPLICATION_VERSION`), and decision modal workflows. *Phase 03 Module 3.4 APPROVED.*
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
- **Module 3.4 Super Admin Review Components (`src/components/review/`):**
  - `CollegeReviewHeader`: Header displaying college legal name, approval status badge, code, revision number, submission timestamp, concurrency version lock, and embedded `ResubmissionAllowanceBadge`.
  - `ReviewAdminUserCard`: Proposed administrator card displaying full name, verified email badge, contact phone, and registration timestamp.
  - `CollegeProfileReviewCard`: Institutional profile card detailing legal entity name, affiliation, registered campus address, phone, and sanitized external website link.
  - `ResubmissionAllowanceBadge`: Badge tracking submitted correction revisions ($v_1=0$ initial vs $v_2..v_4$ corrections), action cycles ($0..10$), and final revision / action ceiling warnings.
  - `ReviewDocumentListCard`: Table of active compliance documents with category badges, formatted file sizes, monospaced SHA-256 checksum snippets with full tooltip hashes, and streaming download trigger.
  - `SubmittedRevisionCard`: Presentational snapshot card for specific revision details.
  - `RevisionHistoryTimelineCard`: Audit timeline displaying chronological past review decisions, reviewer admin emails, timestamps, decision badges, and constructive notes / rejection reasons.
  - `ReviewDecisionPanel`: Prominent action toolbar with "Approve", "Request Action" (disabled if action count $\ge 10$), and "Reject" (annotated for final revisions) buttons. Disables all decisions if status is not `PENDING`.
  - `ReviewDecisionModal`: Accessible modal dialog for review decision confirmation and input with React Hook Form + Zod validation, `noValidate` flag, concurrency version locking, guidance callouts, double-submission prevention, and explicit 409 conflict handling.
  - `ReviewQueueFilterBar`: Accessible search and filter bar with search input, HTML5 date pickers (`htmlFor`/`id` paired), sorting dropdown, date range validation error banner, and clear filters reset button.
  - `ReviewQueueTable`: Responsive data table rendering pending applications, college code, revision badge, administrator contact, submission timestamp, document count badge, empty state, and review navigation button.
  - `index.ts`: Clean barrel export encapsulating all 11 domain review components and formatting helpers.
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
- **Server State (TanStack Query 5):** Centralized `queryKeys` factory (including `colleges.registration`, `auth.verifyEmail`, `auth.resendVerification`, `onboarding.myApplication`, `onboarding.activeDocuments`, `reviews.queueRoot`, `reviews.queue`, `reviews.detail`), `useCurrentUser` (syncs `GET /api/v1/auth/me`), `useLogin`, `useLogout`, `useHealth`, `useCollegeRegistration`, `useVerifyEmail`, `useResendVerification`, `useMyApplication`, `useCreateCorrectionDraft`, `useUpdateDraftProfile`, `useUploadDocument`, `useDeleteDocument`, `useSubmitApplication`, `useReviewQueue` (placeholderData: keepPreviousData), `useReviewDetail`, `useRecordDecision` (invalidates `queryKeys.reviews.queueRoot()` and `queryKeys.reviews.detail(collegeId)`), `useDownloadReviewDocument`.
- **HTTP Client (Axios) & Domain Services:** `src/services/api.ts` configured with `withCredentials: true`, automatic extraction of `XSRF-TOKEN` cookie into `X-XSRF-TOKEN` header, and transparent single-retry on `403 CSRF_TOKEN_INVALID`. Strictly no JWT or localStorage auth tokens. Enhanced with:
  - `ApiError`: Typed error carrying `errorCode`, `status`, field `errors`, `data`, and `retryAfter?: number`.
  - `parseRetryAfter`: Centralized, strict parser enforcing `/^\d+$/` regex matching, strictly rejecting non-integer prefixes (`"30abc"`), zeroes, negatives, and non-numeric values.
  - `isApiError`: Hardened type guard validating genuine `ApiError` instances and strict structural properties for cross-boundary objects, rejecting arbitrary objects containing only `errorCode`.
  - `onboardingService.ts`: Full API client for all 8 restricted onboarding endpoints, with multipart boundary handling (`{ headers: { 'Content-Type': undefined } }`) and safe delayed blob URL cleanup (`setTimeout(revokeObjectURL, 60000)`).
  - `reviewService.ts`: Full API client for all 4 Super Admin review endpoints (`GET /reviews`, `GET /reviews/{id}`, `GET /reviews/{id}/documents/{docId}`, `POST /reviews/{id}/decision`) with safe delayed blob URL cleanup (`setTimeout(revokeObjectURL, 60000)`).
- **Form Validation & Schemas:**
  - `registerCollegeSchema`: React Hook Form + Zod validation schemas enforcing pre-validation trimming, college code normalization to uppercase, admin email normalization to lowercase, optional field nullification, and backend-identical password policy.
  - `verificationSchema.ts` (`src/schemas/verificationSchema.ts`): Zod schema defining `verifyEmailSchema` to validate token presence, length (20–255 characters), trimming, and non-empty string constraints.
  - `onboardingSchema.ts` (`src/schemas/onboardingSchema.ts`): Zod schemas defining `updateApplicationSchema`, `documentUploadSchema`, and `probeFileMagicBytes`.
  - `reviewSchema.ts` (`src/schemas/reviewSchema.ts`): Zod schemas defining `reviewDecisionSchema` (enforcing action constraints, required review notes for `REQUEST_ACTION` $\ge 10$ chars, required rejection reason for `REJECT` $\ge 10$ chars, and `expectedVersion`) and `reviewQueueFilterSchema` (search $\le 100$ chars, date range `from <= to`).

### Automated Tests & Quality Checks
- **Vitest Unit & Component Tests: 136 Passed, 0 Failed across 12 test files.**
  - `src/test/super-admin-review.test.tsx` (26 tests): PASSED (covers review queue rendering with items, empty state, search query dispatch, date range validation and ISO-8601 instant serialization, sort order dispatch, filter reset, resubmission semantics v1 vs v4 final, full review detail dossier rendering, SHA-256 checksum monospaced snippet and tooltip, streaming document download trigger, review audit timeline, APPROVE guidance and version locking, APPROVE submission with `expectedVersion`, REQUEST_ACTION validation requiring notes $\ge 10$ chars, REQUEST_ACTION submission with notes and `expectedVersion`, REQUEST_ACTION disabled when `actionRequiredCount >= 10`, REJECT validation requiring rejectionReason $\ge 10$ chars, REJECT submission with reason and `expectedVersion`, permanent rejection warning on revision v4, 409 `STALE_APPLICATION_VERSION` recovery without silent retry, 409 `APPLICATION_NOT_AWAITING_REVIEW` feedback, cache invalidation of `queueRoot` and detail, disabled decision actions when college is already APPROVED, malformed `collegeId` handling, 404/500 fetch error handling, and queue-to-detail navigation).
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
  - Production build (`npm run build`): PASSED (`tsc && vite build`, 1,777 modules transformed in 9.92s, clean production bundle in `dist/`).

### Outstanding Frontend Work
- Perform manual interactive verification in browser against a live running backend.
- Validate cookie attribute handling (`HttpOnly`, `SameSite=Lax`) in actual browser DevTools.

---

## 13.5 Verification Tracker

| Verification Item | Scope / Target | Status | Actual Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **Backend Unit Tests** | `com.acadlytic` unit suite | **PASSED** | 122 unit tests passed cleanly across all modules (including 15 in `CollegeLifecycleServiceUnitTest`, 3 in `CollegeCleanupSchedulerUnitTest`, 16 in `CollegeReviewControllerUnitTest`, 17 in `CollegeReviewServiceUnitTest`, 15 in `CollegeOnboardingServiceUnitTest`, 9 in `DocumentValidatorUnitTest`, 7 in `LocalFileSystemDocumentStorageServiceUnitTest`, 4 in `DocumentStorageCompensationUnitTest`, and auth/outbox unit tests). |
| **Backend Integration Tests** | Testcontainers MySQL suite | **PASSED** | 115 integration tests passed across all modules on Testcontainers MySQL 8.0.36 (including 23 in `CollegeLifecycleIntegrationTest`, 21 in `CollegeReviewIntegrationTest`, 10 in `CollegeOnboardingIntegrationTest`, 11 in `EmailVerificationIntegrationTest`, 5 in `CollegeRegistrationIntegrationTest`, and baseline Phase 01/02 integration tests). **237/237 total backend tests passing, 0 failures, 0 errors, 0 skipped.** |
| **Frontend Tests** | Vitest component & hook suite | **PASSED** | 168 tests passed across 13 test files (including 32 in `college-activation.test.tsx`, 26 in `super-admin-review.test.tsx`, 26 in `onboarding-dashboard.test.tsx`, 43 in `email-verification.test.tsx`, 26 in `register-college.test.tsx`, and 15 in baseline Phase 01/02 suites). |
| **Backend Build** | `mvn compile` | **PASSED** | Compiles cleanly on Java 21 / Spring Boot 3.3.4. |
| **Frontend Build** | `npm run build` | **PASSED** | Vite transforms 1,783 modules cleanly with 0 type errors in 8.50s. |
| **Live API Verification** | `curl` / Postman auth flow | **PENDING** | Manual live login, session, and CSRF bootstrap check pending. |
| **Database Verification** | MySQL 8 schema & migrations | **PENDING** | Flyway V1, V2, V3, V4, and V5 applied cleanly in tests on Testcontainers MySQL 8.0.36; live host DB migration pending. |
| **Browser Verification** | Interactive UI & DevTools | **PENDING** | 10-step manual checklist in `docs/verification/phase-02-manual-checklist.md` awaiting execution. |
| **Security Verification** | CSRF, Cookies, Storage, RBAC | **PASSED (Automated)** / **PENDING (Live)** | CSRF interceptor, role guards, and store hygiene verified in tests; live cookie flags pending browser check. |
| **Email & Storage Verification** | Mailpit SMTP dispatch | **PENDING** | Outbox worker unit tests passed; live reset email receipt in Mailpit pending. |

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

The current development position is in **Phase 03 — College Registration, Restricted Dashboard & Approval Workflow** with all Phase 03 backend modules **APPROVED**: **Module 3.1A (APPROVED)**, **Module 3.2 (APPROVED)**, **Module 3.3 (APPROVED)**, **Module 3.4 (APPROVED)**, and **Module 3.5 (APPROVED)** (237/237 backend tests on Testcontainers MySQL 8.0.36), and all Phase 03 frontend modules **APPROVED**: **Module 3.1B (APPROVED)**, **Module 3.2 (APPROVED)**, **Module 3.3 (APPROVED)**, **Module 3.4 (APPROVED)**, and **Module 3.5 (APPROVED)** (168/168 full suite tests across 13 test files). Phase 03 overall remains `IN_PROGRESS` pending live manual browser/API verification against Docker services.

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

### Phase 03 Execution Strategy:
**All Phase 03 backend modules (3.1A, 3.2, 3.3, 3.4, and 3.5) and all Phase 03 frontend modules (3.1B, 3.2, 3.3, 3.4, and 3.5) are COMPLETE and APPROVED.**  
Phase 03 overall remains `IN_PROGRESS` until full end-to-end integration and live manual browser/API verification against Docker services are completed.

### Next Planned Activity:
**Phase 03 Manual End-to-End Browser & Live API Verification**
- **Status:** `PENDING`
- **Scope:**
  - Execute end-to-end verification checklist against live running backend, MySQL 8, and Mailpit containers.
  - Verify complete lifecycle: public registration, email verification, restricted dashboard editing, document upload/replacement, review submission, Super Admin queue inspection, review decision execution (approve/action/reject), and college activation transition.
  - Formal Phase 03 release closure sign-off prior to advancing to Phase 04 (College Management).

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