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
- **Current Module / Status:** Module 3.1A (APPROVED) & Module 3.2 (APPROVED). Backend registration foundation and email verification lifecycle complete and verified on Testcontainers MySQL 8.0.36 (97/97 tests passing). Module 3.3 (Backend) is the next inspection/planning target.
- **Last Approved Module:** Phase 03, Module 3.2 — Email Verification & College Admin Verification Lifecycle (Explicitly APPROVED by user).
- **Next Planned Phase / Module:** Phase 03, Module 3.3 — College Admin Restricted Dashboard & Profile Completion / Document Management (Backend). Frontend work (Module 3.1B onward) is deferred until all Phase 03 backend modules are complete.
- **Overall MVP Progress Status:** Phase 01/02 Implemented (Verification Pending); Phase 03 In Progress (Modules 3.1A and 3.2 APPROVED; 97/97 backend tests passing; schema V4 active).

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
| **Phase 03** | College Registration, Restricted Dashboard & Approval Workflow | IN_PROGRESS (3.1A & 3.2 Approved) | NOT_STARTED (Deferred to post-backend) | IMPLEMENTATION_COMPLETE (V4) | IMPLEMENTATION_COMPLETE (97 Tests Passed, Testcontainers MySQL) | NOT_VERIFIED | IN_PROGRESS |
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
> **Backend Modules 3.1A & 3.2 APPROVED; remaining Phase 03 modules IN_PROGRESS / NOT_STARTED.**  
> Modules 3.1A (Backend Registration Foundation) and 3.2 (Email Verification & College Admin Verification Lifecycle) have been completed, verified on Testcontainers MySQL 8.0.36 (97/97 tests), and explicitly approved by the user. Module 3.3 (Restricted Dashboard, Document Management & Review Submission - Backend) is the next target. In accordance with the approved strategy, all Phase 03 frontend work (Module 3.1B onward) is deferred until Phase 03 backend modules are complete. Phase 03 remains `IN_PROGRESS`.

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
  - *Phase 03 Module 3.1A Implementation:* Full versioned registration revision entity (`CollegeRegistration`), document entity (`CollegeRegistrationDocument`), category enum (`DocumentCategory`), repositories (`CollegeRegistrationRepository`, `CollegeRegistrationDocumentRepository`), DTOs (`RegisterCollegeRequest`, `CollegeRegistrationResponse`), thread-safe sliding window IP rate limiter (`IpRateLimiter`), registration intake service (`CollegeRegistrationService`), and public registration controller (`CollegeRegistrationController` at `POST /api/v1/college-registrations`). Modules 3.1B–3.5 remain pending.
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

### Implemented Pages & UI Components (Phase 01 & Phase 02)
- **Pages:**
  - `LoginPage` (`src/pages/auth/LoginPage.tsx`): Email/password credentials entry, failed attempt lockout display, CSRF bootstrap, redirect to dashboard or original target URL.
  - `ForgotPasswordPage` (`src/pages/auth/ForgotPasswordPage.tsx`): Password reset request with generic non-enumerating confirmation message.
  - `ResetPasswordPage` (`src/pages/auth/ResetPasswordPage.tsx`): Raw token consumption from URL query params, automatic URL token clearing, password validation schema, submission.
  - `ChangePasswordPage` (`src/pages/auth/ChangePasswordPage.tsx`): Authenticated user password update.
  - `HomePage`, `HealthCheckPage`, `NotFoundPage`, `UnauthorizedPage`.
  - `OnboardingStatusPage` (`src/pages/OnboardingStatusPage.tsx`): Static informational status view informing pending college admins of their review stage. *Existing foundational implementation; Phase 03 college registration and approval workflow remains NOT_STARTED.*
  - `RegisterCollegePage` (`src/pages/auth/RegisterCollegePage.tsx`): Static informational placeholder for college onboarding. *Existing foundational implementation; Phase 03 college registration and approval workflow remains NOT_STARTED.*
  - `CollegeAdminDashboardPage`, `SuperAdminDashboardPage` (Minimal landing shells pending respective phases).
- **Component Primitives (`src/components/ui/`):**
  - Accessible `Button`, `Card`, `Input`, `Select`, `Textarea`, `Modal`, `Alert`, `Table`, `LoadingSpinner`, `ErrorState`.
- **Layouts & Navigation (`src/layouts/`, `src/components/navigation/`):**
  - `RootLayout` (Global provider wrapper: QueryClientProvider, router outlet), `AuthLayout` (Centered auth card container), `AppLayout` (Authenticated shell with Header and Sidebar), `Header`, `Sidebar`, `PageContainer`.

### Routes & Protected Routing (`src/routes/`)
- `ProtectedRoute`: Checks `isAuthenticated` and `CurrentUser`; redirects unauthenticated requests to `/auth/login` preserving return URL in location state.
- `PublicOnlyRoute`: Prevents authenticated users from accessing login/forgot-password pages, redirecting to their respective role dashboard.
- `RoleGuard`: Enforces role-based permissions (`SUPER_ADMIN` vs `COLLEGE_ADMIN`), routing unauthorized users to `/unauthorized`.
- `CollegeApprovalGuard`: Architectural route guard routing unapproved college administrators to `/onboarding-status`. *Existing foundational implementation; Phase 03 college registration and approval workflow remains NOT_STARTED.*

### State Management & API Integration
- **Client State (Zustand 5):** `useAuthStore` (tracks `user`, `isAuthenticated`, `isLoading`), `useAppStore` (tracks layout sidebar state). Strictly no Redux Toolkit.
- **Server State (TanStack Query 5):** Centralized `queryKeys` factory, `useCurrentUser` (syncs `GET /api/v1/auth/me`), `useLogin`, `useLogout`, `useHealth`.
- **HTTP Client (Axios):** `src/services/api.ts` configured with `withCredentials: true`, automatic extraction of `XSRF-TOKEN` cookie into `X-XSRF-TOKEN` header, and transparent single-retry on `403 CSRF_TOKEN_INVALID`. Strictly no JWT or localStorage auth tokens.
- **Form Validation:** React Hook Form + Zod validation schemas enforcing identical password complexity rules as the backend.

### Automated Tests & Quality Checks
- **Vitest Unit & Component Tests: 15 Passed, 0 Failed.**
  - `auth-me-unauthenticated.test.tsx` (1 test): PASSED
  - `college-approval-guard.test.tsx` (2 tests): PASSED
  - `csrf-interceptor.test.tsx` (2 tests): PASSED
  - `login-errors.test.tsx` (3 tests): PASSED
  - `login-success.test.tsx` (2 tests): PASSED
  - `protected-route.test.tsx` (2 tests): PASSED
  - `reset-password-validation.test.tsx` (2 tests): PASSED
  - `role-guard.test.tsx` (1 test): PASSED
- **Static Analysis & Build:**
  - TypeScript compilation (`tsc --noEmit`): PASSED (0 errors).
  - ESLint (`npm run lint`): PASSED (0 errors, 0 warnings).
  - Prettier formatting (`npm run format:check`): PASSED.
  - Production build (`npm run build`): PASSED (1,717 modules transformed, optimized production bundle).

### Outstanding Frontend Work
- Perform manual interactive verification in browser against a live running backend.
- Validate cookie attribute handling (`HttpOnly`, `SameSite=Lax`) in actual browser DevTools.

---

## 13.5 Verification Tracker

| Verification Item | Scope / Target | Status | Actual Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **Backend Unit Tests** | `com.acadlytic` unit suite | **PASSED** | 39 unit tests passed cleanly across all modules (including `UserRateLimiterUnitTest`, `AuthServiceUnitTest`, and college registration unit tests). |
| **Backend Integration Tests** | Testcontainers MySQL suite | **PASSED** | 58 integration tests passed across all modules on Testcontainers MySQL 8.0.36 (including 11 in `EmailVerificationIntegrationTest` and 5 in `CollegeRegistrationIntegrationTest`). 97/97 total tests passing. |
| **Frontend Tests** | Vitest component & hook suite | **PASSED** | 15 tests passed across 8 test suites. |
| **Backend Build** | `mvn compile` | **PASSED** | Compiles cleanly on Java 21 / Spring Boot 3.3.4. |
| **Frontend Build** | `npm run build` | **PASSED** | Vite transforms 1,717 modules cleanly with 0 type errors. |
| **Live API Verification** | `curl` / Postman auth flow | **PENDING** | Manual live login, session, and CSRF bootstrap check pending. |
| **Database Verification** | MySQL 8 schema & migrations | **PENDING** | Flyway V1, V2, and V3 applied cleanly in tests; live host DB migration pending. |
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

The current development position is in **Phase 03 — College Registration, Restricted Dashboard & Approval Workflow** with **Module 3.1A (APPROVED)** and **Module 3.2 (APPROVED)**.

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
- **Modules 3.3 through 3.5 (Backend):** `NOT_STARTED` (Module 3.3: College Admin Restricted Dashboard & Profile Completion / Document Management & Review Submission; Module 3.4: Super Admin Approval Queue & Review Workflow; Module 3.5: Approval Lifecycle, College Activation & Revisions).
- **Module 3.1B onward (Frontend):** `NOT_STARTED` (Deferred until all Phase 03 backend modules are complete).

### Next Planned Module:
**Phase 03, Module 3.3 — College Admin Restricted Dashboard, Document Management & Review Submission (Backend)**
- **Status:** `INSPECTION_AND_PLANNING`
- **Scope:** Restricted dashboard data provider, registration revision profile completion/editing, document upload & attachment metadata handling, and transition to `SUBMITTED_FOR_REVIEW` (`COLLEGE_REGISTRATION_SUBMITTED_FOR_REVIEW` audit event).

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