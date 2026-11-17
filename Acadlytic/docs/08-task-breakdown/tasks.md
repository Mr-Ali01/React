# Acadlytic — Development Tasks

**Document:** `08-task-breakdown/tasks.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Type:** Implementation Task Breakdown  
**Status:** Draft / Under Review  
**Version:** 1.0  
**Last Updated:** 2026-10-05 (Revised for Two-Role MVP Scope & Module-by-Module Strategy)

---

# 1. Purpose

This document decomposes the Acadlytic development epics into actionable, testable implementation tasks and subtasks.

The breakdown translates the revised product scope into concrete engineering assignments following a **backend-first, module-by-module** delivery strategy.

The hierarchy is:

```text
Roadmap Phase
     ↓
   Epic
     ↓
  Feature Module
     ↓
   Task (MVP vs. POST-MVP)
     ↓
  Subtask
```

This document answers:
> **What concrete implementation work needs to be performed, in what exact sequence, and under what acceptance criteria?**

---

# 2. Engineering Strategy: Backend-First, Module-by-Module

Acadlytic will **not** build the entire backend first followed by the entire frontend.

Instead, development proceeds **module-by-module**, with each module completed and verified before proceeding to the next.

### Per-Module Implementation Cycle

For each individual module, engineering follows this strict 9-step sequence:

```text
1. Review Feature Specification & Implementation Notes
       ↓
2. Implement Module Backend (Entities, Repositories, Domain Services, REST Controllers)
       ↓
3. Implement Backend Unit and Integration Tests (JUnit, Spring MockMvc/TestEntityManager)
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

### Module Execution Order:
1. Foundation & Infrastructure
2. Authentication & Authorization (`SUPER_ADMIN` & `COLLEGE_ADMIN`)
3. College & Tenant Management
4. Academic Structure (Programs, Semesters, Subjects, Credits)
5. Student Management (Student Records & Enrollments)
6. Result Import (Excel & CSV Parsing & Ingestion)
7. Result Validation & Resolution
8. Result Processing (Authoritative Mutation & Attempt Histories)
9. Backlog Tracking (Lifecycle Tracking)
10. Academic Passport (Administrative Read Model)
11. College Academic Analytics
12. End-to-End Integration & Release Hardening

---

# 3. Task Classification & Priority Model

All tasks in this document are explicitly classified into two scopes:

| Classification | Meaning | Priority |
|---|---|---|
| **MVP** | **Required for Initial Production Release.** Mandatory for two-role workflow. | P0 |
| **POST-MVP** | **Deferred Scope.** Planned and architected, but executed in subsequent releases. | P1 / P2 |

---

# 4. EPIC-01 — Project Foundation (MVP)

## Objective
Establish the repository, engineering conventions, project structure, and documentation baseline.

---

## TASK-01.01 — Initialize Repository (MVP)
**Priority:** P0  
- [ ] Initialize root Git repository with standard branches (`main`, `develop`).
- [ ] Establish root directory structure (`backend/`, `frontend/`, `docker/`).
- [ ] Configure root and module-specific `.gitignore` files.
- [ ] Create root `README.md` referencing `acadlytic-docs/`.

---

## TASK-01.02 — Establish Documentation Baseline (MVP)
**Priority:** P0  
- [ ] Verify complete synchronization across `acadlytic-docs/` directories (00 through 16).
- [ ] Enforce source-of-truth rules: implementation details must conform to documentation.

---

## TASK-01.03 — Establish Development Environment Strategy (MVP)
**Priority:** P0  
- [ ] Define environment configuration files (`application-dev.yml`, `.env.development`).
- [ ] Ensure all secrets, credentials, and local connection strings are excluded from source control.

---

# 5. EPIC-02 — Application & Infrastructure Foundation (MVP)

## Objective
Establish the backend Spring Boot foundation, frontend React foundation, database migration mechanism, and Docker development container.

---

## TASK-02.01 — Initialize Backend Foundation (MVP)
**Priority:** P0  
- [ ] Scaffold Spring Boot 3 application with Java 21 and Maven.
- [ ] Configure Maven `pom.xml` with Spring Web, Spring Data JPA, Spring Security, Validation, and MySQL driver.
- [ ] Establish modular package structure (`com.acadlytic.modules.*`, `com.acadlytic.common.*`).
- [ ] Configure global exception handler (`@RestControllerAdvice`) and standardized API error response DTO.
- [ ] Configure Springdoc OpenAPI / Swagger documentation (`/swagger-ui.html`).

---

## TASK-02.02 — Initialize Database Foundation (MVP)
**Priority:** P0  
- [ ] Configure local MySQL 8 database service with InnoDB engine and `utf8mb4` character set.
- [ ] Create `docker-compose.yml` to spin up local MySQL with persistent volume.
- [ ] Configure database migration tool (Flyway / Liquibase).
- [ ] Verify test database strategy using Testcontainers or H2 in MySQL-compatibility mode.

---

## TASK-02.03 — Initialize Frontend Foundation (MVP)
**Priority:** P0  
- [ ] Scaffold React 18+ application with TypeScript and Vite.
- [ ] Configure Tailwind CSS with design tokens matching `06-design/design-system.md`.
- [ ] Configure React Router DOM with layout routing.
- [ ] Configure Axios API client with request/response interceptors for auth tokens.
- [ ] Configure TanStack Query (React Query) provider.
- [ ] Establish shared UI component foundation (Button, Input, Table, Modal, Card, Alert).

---

# 6. EPIC-03 — Authentication & Authorization (MVP)

## Objective
Implement identity, login, logout, password lifecycle, tenant context binding, and role-based access control for `SUPER_ADMIN` and `COLLEGE_ADMIN`.

---

## TASK-03.01 — Authentication Data Model & Migration (MVP)
**Priority:** P0  
- [ ] Create migration for `users` table: `id`, `college_id`, `email`, `password_hash`, `first_name`, `last_name`, `role`, `status`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`.
- [ ] Add unique index on `email`. Add foreign key `college_id` referencing `colleges(id)`.
- [ ] Define JPA `User` entity and extensible `Role` enum (`SUPER_ADMIN`, `COLLEGE_ADMIN`, `ACADEMIC_STAFF`, `STUDENT`).

---

## TASK-03.02 — Authentication Backend Service & APIs (MVP)
**Priority:** P0  
- [ ] Configure Spring Security filter chain with stateless JWT or secure HTTP-only session cookies.
- [ ] Implement `POST /api/v1/auth/login` (authenticates `SUPER_ADMIN` and `COLLEGE_ADMIN`; rejects inactive/suspended accounts).
- [ ] Implement `POST /api/v1/auth/logout` (invalidates session/token).
- [ ] Implement `GET /api/v1/auth/me` (returns current user context, role, and `college_id`).
- [ ] Implement brute-force protection (lockout after 5 consecutive failures).
- [ ] Implement password change (`POST /api/v1/auth/change-password`).
- [ ] Implement token-based password reset (`forgot-password` and `reset-password`).
- [ ] Implement audit logging for all authentication events.

---

## TASK-03.03 — User Provisioning Backend (MVP)
**Priority:** P0  
- [ ] Implement `SUPER_ADMIN` endpoint `POST /api/v1/users` to provision initial `COLLEGE_ADMIN` accounts.
- [ ] Enforce backend rule: Only `SUPER_ADMIN` can provision `COLLEGE_ADMIN` accounts.
- [ ] Validate mandatory `college_id` association.
- [ ] Disallow public self-registration.

---

## TASK-03.04 — Authentication Backend Tests (MVP)
**Priority:** P0  
- [ ] Unit tests for `AuthService`, password hashing, and token generation.
- [ ] Integration tests verifying `SUPER_ADMIN` and `COLLEGE_ADMIN` login.
- [ ] Test rejection of invalid credentials, inactive accounts, and brute-force lockout.
- [ ] Test tenant context resolution from authenticated principal.

---

## TASK-03.05 — Authentication Frontend Implementation (MVP)
**Priority:** P0  
- [ ] Create Login page (`/auth/login`) with React Hook Form and Zod validation.
- [ ] Create Forgot Password and Reset Password pages.
- [ ] Implement authentication state store (Zustand) and Axios token synchronization.
- [ ] Implement Protected Route wrappers checking authentication and role (`SUPER_ADMIN` vs `COLLEGE_ADMIN`).
- [ ] Connect frontend to backend auth APIs and test full login/logout flows.

---

# 7. EPIC-04 — College & Tenant Management (MVP)

## Objective
Establish multi-tenant isolation, college onboarding by `SUPER_ADMIN`, and college profile maintenance by `COLLEGE_ADMIN`.

---

## TASK-04.01 — College Data Model & Migration (MVP)
**Priority:** P0  
- [ ] Create migration for `colleges` table: `id`, `name`, `code` (unique), `university_id`, `email`, `phone`, `address`, `city`, `state`, `status`, `created_at`, `updated_at`.
- [ ] Create migration for platform `universities` master reference table.

---

## TASK-04.02 — College Management Backend APIs (MVP)
**Priority:** P0  
- [ ] Implement `POST /api/v1/colleges` (SUPER_ADMIN only): Create new college tenant.
- [ ] Implement `GET /api/v1/colleges` (SUPER_ADMIN only): List all colleges with pagination.
- [ ] Implement `GET /api/v1/colleges/{id}`: Detailed view (SUPER_ADMIN or assigned COLLEGE_ADMIN).
- [ ] Implement `PUT /api/v1/colleges/{id}`: Update permitted metadata.
- [ ] Implement `PATCH /api/v1/colleges/{id}/status`: Activate, suspend, or deactivate college tenant.
- [ ] Enforce tenant boundary: A `COLLEGE_ADMIN` cannot view or update another college's record.

---

## TASK-04.03 — College Backend Tests (MVP)
**Priority:** P0  
- [ ] Test college creation, code uniqueness constraint, and status transitions.
- [ ] Test security: verify `COLLEGE_ADMIN` receives `403 Forbidden` when attempting cross-college operations.

---

## TASK-04.04 — College Management Frontend (MVP)
**Priority:** P0  
- [ ] Create SUPER_ADMIN College Management dashboard (`/admin/colleges`).
- [ ] Create College Onboarding form (Name, Code, Contact, Admin creation).
- [ ] Create COLLEGE_ADMIN College Profile view and edit page (`/college/profile`).
- [ ] Integrate with backend APIs and verify multi-tenant isolation.

---

# 8. EPIC-05 — Academic Structure (MVP)

## Objective
Enable `COLLEGE_ADMIN` to configure programs, semesters, subjects, and credits required for result matching and processing.

---

## TASK-05.01 — Academic Structure Data Model & Migration (MVP)
**Priority:** P0  
- [ ] Create migrations for:
  - `programs`: `id`, `college_id`, `name`, `code`, `degree_type`, `duration_semesters`, `status`.
  - `semesters`: `id`, `program_id`, `semester_number`, `academic_year`.
  - `subjects`: `id`, `college_id`, `program_id`, `semester_id`, `code`, `name`, `credits`, `type`, `max_marks`, `passing_marks`.
- [ ] Add unique constraints on `(college_id, program_id, code)` for subjects.

---

## TASK-05.02 — Academic Structure Backend APIs (MVP)
**Priority:** P0  
- [ ] Implement CRUD APIs for Programs under `/api/v1/academic/programs`.
- [ ] Implement CRUD APIs for Semesters under `/api/v1/academic/semesters`.
- [ ] Implement CRUD APIs for Subjects under `/api/v1/academic/subjects`.
- [ ] Enforce tenant isolation on all academic structure queries.
- [ ] Implement backend validation preventing deletion of subjects referenced in existing academic records.

---

## TASK-05.03 — Academic Structure Backend Tests (MVP)
**Priority:** P0  
- [ ] Test program, semester, and subject creation and unique code validation.
- [ ] Test referential integrity and tenant scoping.

---

## TASK-05.04 — Academic Structure Frontend (MVP)
**Priority:** P0  
- [ ] Create Program Management interface (`/college/academic/programs`).
- [ ] Create Semester and Curriculum configuration interface.
- [ ] Create Subject management table with credit and passing minimum configuration.
- [ ] Integrate with backend APIs.

---

# 9. EPIC-06 — Student Records Management (MVP)

## Objective
Enable `COLLEGE_ADMIN` to create, search, filter, and maintain student academic records (without provisioning student login accounts).

---

## TASK-06.01 — Student Data Model & Migration (MVP)
**Priority:** P0  
- [ ] Create migration for `students` table: `id`, `college_id`, `program_id`, `register_number` (unique within college), `roll_number`, `first_name`, `last_name`, `email`, `admission_year`, `current_semester`, `status`, `created_at`, `updated_at`.
- [ ] Add index on `(college_id, register_number)` for fast result matching.

---

## TASK-06.02 — Student Management Backend APIs (MVP)
**Priority:** P0  
- [ ] Implement `POST /api/v1/students`: Create student academic record.
- [ ] Implement `GET /api/v1/students`: Paginated student list with search (register number, name) and filters (program, semester, status).
- [ ] Implement `GET /api/v1/students/{id}`: Detailed student record.
- [ ] Implement `PUT /api/v1/students/{id}`: Update permitted student demographic and enrollment details.
- [ ] Enforce tenant scoping: All student queries strictly scoped by `college_id`.

---

## TASK-06.03 — Student Management Backend Tests (MVP)
**Priority:** P0  
- [ ] Test student creation and unique register number constraint within college.
- [ ] Test search, filtering, and pagination query performance.
- [ ] Test IDOR prevention: College A cannot view or update College B students.

---

## TASK-06.04 — Student Management Frontend (MVP)
**Priority:** P0  
- [ ] Create Student List page (`/college/students`) with search bar, filters, and server-side pagination.
- [ ] Create Add/Edit Student modal or page with Zod schema validation.
- [ ] Create Student Profile detail view showing enrollment and academic standing.
- [ ] Integrate with backend APIs.

---

# 10. EPIC-07 — Result Import (MVP)

## Objective
Enable `COLLEGE_ADMIN` to upload university result files (Excel and CSV), parse content, map columns, and track import jobs.

---

## TASK-07.01 — Result Import Data Model & Migration (MVP)
**Priority:** P0  
- [ ] Create migration for `result_import_jobs`: `id`, `college_id`, `user_id`, `file_name`, `file_size`, `status`, `total_records`, `valid_records`, `invalid_records`, `created_at`, `updated_at`.
- [ ] Create migration for `staged_result_records`: `id`, `job_id`, `college_id`, `raw_register_number`, `raw_subject_code`, `raw_grade`, `raw_marks`, `raw_status`, `normalized_data` (JSON), `validation_status`, `error_message`.

---

## TASK-07.02 — File Upload & Parsing Backend (MVP)
**Priority:** P0  
- [ ] Implement multipart file upload endpoint `POST /api/v1/result-imports`.
- [ ] Validate file type (`.xlsx`, `.xls`, `.csv`) and size limits.
- [ ] Implement Excel parser using Apache POI.
- [ ] Implement CSV parser using OpenCSV.
- [ ] Implement column mapping and row normalization into `staged_result_records`.
- [ ] Store raw source files in secure staging storage.

---

## TASK-07.03 — Result Import Backend Tests (MVP)
**Priority:** P0  
- [ ] Test parsing with valid Excel and CSV fixtures.
- [ ] Test handling of malformed files, empty rows, and corrupt headers.
- [ ] Test import job status lifecycle.

---

## TASK-07.04 — Result Import Frontend (MVP)
**Priority:** P0  
- [ ] Create Result Import Hub (`/college/results/import`).
- [ ] Create drag-and-drop file upload component with upload progress indicator.
- [ ] Create Import Job History table showing status, record counts, and timestamps.
- [ ] Integrate with backend upload APIs.

---

# 11. EPIC-08 — Result Validation & Review (MVP)

## Objective
Validate staged result records against college student records and academic curriculum, provide actionable error reporting, and allow issue resolution.

---

## TASK-08.01 — Result Validation Engine Backend (MVP)
**Priority:** P0  
- [ ] Implement validation service:
  - Verify mandatory fields.
  - Match student register number against `students` table (flag `STUDENT_NOT_FOUND`).
  - Match subject code against `subjects` table (flag `SUBJECT_NOT_FOUND`).
  - Validate grade against configured grade scale.
  - Detect duplicates within the import job and against existing records.
- [ ] Set record validation status (`VALID`, `INVALID`, `WARNING`).
- [ ] Update import job summary statistics.

---

## TASK-08.02 — Validation Review & Resolution APIs (MVP)
**Priority:** P0  
- [ ] Implement `GET /api/v1/result-imports/{id}/records`: Filter by status (`ALL`, `VALID`, `INVALID`, `WARNING`).
- [ ] Implement `POST /api/v1/result-imports/{id}/revalidate`: Re-run validation after resolving errors.

---

## TASK-08.03 — Result Validation Backend Tests (MVP)
**Priority:** P0  
- [ ] Test matching logic with known students and unknown identifiers.
- [ ] Test duplicate detection and invalid grade rejection.

---

## TASK-08.04 — Validation Review & Error Resolution Frontend (MVP)
**Priority:** P0  
- [ ] Create Validation Summary Dashboard showing total, valid, invalid, and warning counts.
- [ ] Create Staged Records Table with badge status indicators and actionable error descriptions.
- [ ] Provide quick links to add missing subjects or correct roll numbers.
- [ ] Add "Re-validate" button connected to backend API.

---

# 12. EPIC-09 — Result Processing (Authoritative Mutation) (MVP)

## Objective
Atomically convert validated result records into authoritative academic records and examination attempts while preserving historical integrity.

---

## TASK-09.01 — Academic Results Data Model & Migration (MVP)
**Priority:** P0  
- [ ] Create migration for `academic_results`: `id`, `college_id`, `student_id`, `subject_id`, `semester_id`, `exam_session`, `attempt_number`, `grade`, `grade_point`, `credits_earned`, `result_status` (PASS/FAIL/ABSENT), `import_job_id`, `created_at`.
- [ ] Add unique index on `(student_id, subject_id, exam_session, attempt_number)` to guarantee idempotency.

---

## TASK-09.02 — Result Processing Engine Backend (MVP)
**Priority:** P0  
- [ ] Implement `POST /api/v1/result-imports/{id}/process` (COLLEGE_ADMIN only).
- [ ] Enforce precondition: Only records with `VALID` status can be processed.
- [ ] Execute within a Spring `@Transactional` boundary; rollback on unexpected failure.
- [ ] Calculate sitting attempt number for each student-subject sitting.
- [ ] Create permanent academic result records.
- [ ] Trigger backlog determination service.
- [ ] Mark import job `COMPLETED`.
- [ ] Record processing audit event.

---

## TASK-09.03 — Result Processing Backend Tests (MVP)
**Priority:** P0  
- [ ] Test successful processing transaction and attempt number calculation.
- [ ] Test transaction rollback: ensure no partial records persist on failure.
- [ ] Test idempotency: re-running processing does not duplicate result records.

---

## TASK-09.04 — Result Processing Frontend (MVP)
**Priority:** P0  
- [ ] Add "Process Valid Results" confirmation dialog in the validation view.
- [ ] Display processing progress and completion summary.
- [ ] Provide direct navigation to updated academic records and backlog lists.

---

# 13. EPIC-10 — Backlog Tracking (MVP)

## Objective
Automatically track unresolved academic requirements (`OPEN`) and their historical resolution (`RESOLVED`) upon result processing.

---

## TASK-10.01 — Backlog Data Model & Migration (MVP)
**Priority:** P0  
- [ ] Create migration for `backlogs`: `id`, `college_id`, `student_id`, `subject_id`, `origin_semester_id`, `origin_exam_session`, `status` (`OPEN`, `RESOLVED`), `clearing_result_id`, `cleared_exam_session`, `attempts_count`, `created_at`, `updated_at`.
- [ ] Add unique index on `(student_id, subject_id)` where status = 'OPEN'.

---

## TASK-10.02 — Backlog Lifecycle Engine Backend (MVP)
**Priority:** P0  
- [ ] On result processing:
  - If result status = `FAIL`, check for existing `OPEN` backlog. If none, create `OPEN` backlog with `attempts_count = 1`. If existing, increment `attempts_count`.
  - If result status = `PASS` and an `OPEN` backlog exists for student-subject, transition to `RESOLVED` and link `clearing_result_id`.
- [ ] Implement `GET /api/v1/backlogs`: Query backlogs by status, program, semester, student.
- [ ] Implement `GET /api/v1/students/{id}/backlogs`: Detailed backlog sitting history for a specific student.

---

## TASK-10.03 — Backlog Backend Tests (MVP)
**Priority:** P0  
- [ ] Test backlog creation on failed attempt.
- [ ] Test backlog resolution on subsequent pass.
- [ ] Test repeated failed attempts incrementing `attempts_count`.

---

## TASK-10.04 — Backlog Management Frontend (MVP)
**Priority:** P0  
- [ ] Create College Backlog Tracking page (`/college/backlogs`).
- [ ] Implement tabs for "Active Backlogs" and "Cleared History".
- [ ] Add filters for Program, Semester, Subject, and Student.
- [ ] Display attempt history timelines for unresolved subjects.

---

# 14. EPIC-11 — Academic Passport (Administrative Read Model) (MVP)

## Objective
Provide `COLLEGE_ADMIN` with a comprehensive, verified longitudinal view of any student's academic journey.

---

## TASK-11.01 — Academic Passport Projection Backend (MVP)
**Priority:** P0  
- [ ] Implement projection service aggregating:
  - Student identity, program, and current semester.
  - Semester-by-semester course registrations and grades.
  - Historical examination sitting attempts per subject.
  - Total credits earned, calculated SGPA, and cumulative CGPA.
  - Active backlogs and clearance timeline.
- [ ] Implement `GET /api/v1/students/{id}/passport` (COLLEGE_ADMIN only).
- [ ] Enforce strict read-only model: Passport projection cannot directly mutate academic results.

---

## TASK-11.02 — Academic Passport Backend Tests (MVP)
**Priority:** P0  
- [ ] Test projection accuracy against known multi-semester student results.
- [ ] Test attempt history display and backlog consistency.

---

## TASK-11.03 — Academic Passport Frontend (MVP)
**Priority:** P0  
- [ ] Create Student Academic Passport viewer (`/college/students/{id}/passport`).
- [ ] Render student profile banner, CGPA/Credit metric cards, and semester accordion panels.
- [ ] Display verified grades, sitting attempts, and backlog status badges.
- [ ] Include print / PDF export stylesheet.

---

# 15. EPIC-12 — College Academic Analytics (MVP)

## Objective
Provide institutional academic performance dashboards for `COLLEGE_ADMIN`.

---

## TASK-12.01 — Analytics Query Engine Backend (MVP)
**Priority:** P0  
- [ ] Implement optimized aggregation queries:
  - College pass and failure rates per exam session.
  - Semester progression and retention metrics.
  - Subject-level failure hot-spots (highest backlog density).
  - SGPA and CGPA distribution curves across cohorts.
- [ ] Implement `GET /api/v1/analytics/college-overview`.
- [ ] Enforce data integrity: Missing result data is never coerced to zero or failure.
- [ ] Ensure queries are strictly scoped by `college_id`.

---

## TASK-12.02 — Analytics Backend Tests (MVP)
**Priority:** P0  
- [ ] Test aggregation logic across various cohort sizes.
- [ ] Verify query execution plans and index usage.

---

## TASK-12.03 — Analytics Dashboard Frontend (MVP)
**Priority:** P0  
- [ ] Create College Analytics Dashboard (`/college/analytics`) using Recharts.
- [ ] Render KPI summary cards, pass/fail bar charts, and SGPA distribution histograms.
- [ ] Add interactive filters for Program, Academic Year, and Semester.

---

# 16. EPIC-13 — Post-MVP Features (Deferred Scope)

> [!NOTE]
> The following tasks belong to post-MVP epics and are explicitly deferred. They are recorded here to guide future expansion.

## TASK-13.01 — Academic Staff Role & Account Provisioning (POST-MVP)
**Priority:** P1 (Post-MVP)  
- [ ] Update `users` table and endpoints to allow `COLLEGE_ADMIN` to provision `ACADEMIC_STAFF` accounts.
- [ ] Implement departmental permission scoping for staff users.

## TASK-13.02 — Academic Staff Operational Portal (POST-MVP)
**Priority:** P1 (Post-MVP)  
- [ ] Create staff portal routes (`/staff/*`).
- [ ] Implement delegated result upload, validation review, and student advisement.

## TASK-13.03 — Student Account Provisioning & Authentication (POST-MVP)
**Priority:** P1 (Post-MVP)  
- [ ] Allow linking student records to new user accounts in `users` table.
- [ ] Enable student authentication (`POST /api/v1/auth/login`) with role `STUDENT`.
- [ ] Create `/api/v1/me/**` endpoints resolving strictly to the authenticated student's identity.

## TASK-13.04 — Student Self-Service Portal (POST-MVP)
**Priority:** P1 (Post-MVP)  
- [ ] Implement Student Portal (`/student/*`): Dashboard, personal results, backlogs, and personal Academic Passport.
- [ ] Implement personal academic analytics and password change for students.

---

# 17. EPIC-14 — End-to-End Integration & Release Hardening (MVP)

## Objective
Verify the complete two-role MVP workflow, perform security reviews, and execute release gates.

---

## TASK-14.01 — End-to-End Workflow Verification (MVP)
**Priority:** P0  
- [ ] Execute complete manual and automated test script:
  1. `SUPER_ADMIN` creates College and provisions `COLLEGE_ADMIN`.
  2. `COLLEGE_ADMIN` logs in, configures Programs, Semesters, and Subjects.
  3. `COLLEGE_ADMIN` adds Student records.
  4. `COLLEGE_ADMIN` uploads university result file.
  5. System validates records; errors are inspected and resolved.
  6. `COLLEGE_ADMIN` triggers Authoritative Processing.
  7. Results and attempt histories are persisted; backlogs are updated.
  8. `COLLEGE_ADMIN` inspects student Academic Passport and reviews College Analytics.

---

## TASK-14.02 — Multi-Tenant Security Verification (MVP)
**Priority:** P0  
- [ ] Create College A and College B test tenants.
- [ ] Attempt cross-tenant access for students, imports, results, backlogs, and analytics; verify all return `403 Forbidden`.
- [ ] Perform IDOR vulnerability scan on all `/api/v1/**` endpoints.

---

## TASK-14.03 — Performance & Large-Dataset Testing (MVP)
**Priority:** P0  
- [ ] Test result file import with 5,000+ records.
- [ ] Verify parsing time, validation throughput, and transactional processing time.
- [ ] Verify database index usage and pagination query performance.

---

# 18. MVP Task Completion Checklist

Before declaring the MVP development complete, verify:
- [ ] EPIC-01 (Project Foundation) complete.
- [ ] EPIC-02 (Application Foundation) complete.
- [ ] EPIC-03 (Authentication & Provisioning: 2 roles) complete.
- [ ] EPIC-04 (College & Tenant Management) complete.
- [ ] EPIC-05 (Academic Structure) complete.
- [ ] EPIC-06 (Student Records Management) complete.
- [ ] EPIC-07 (Result Import) complete.
- [ ] EPIC-08 (Result Validation & Resolution) complete.
- [ ] EPIC-09 (Result Processing & Attempts) complete.
- [ ] EPIC-10 (Backlog Tracking) complete.
- [ ] EPIC-11 (Academic Passport: Admin View) complete.
- [ ] EPIC-12 (College Analytics) complete.
- [ ] EPIC-14 (Integration & Hardening) complete.
- [ ] All post-MVP features (Staff Portal, Student Portal) cleanly deferred.
- [ ] Multi-tenant isolation verified server-side.
