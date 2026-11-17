# Acadlytic — Functional Requirements

**Document:** `03-prd/functional-requirements.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Status:** Draft / Under Review  
**Document Type:** Functional Requirements Specification  
**Last Updated:** 2026-10-05 (Revised for Two-Role MVP Scope)

---

# 1. Purpose

This document defines the functional requirements of Acadlytic.

Functional requirements describe what the system must do across its functional domains:

- authentication and authorization (two active MVP roles)
- college management
- user provisioning
- academic structure
- student records management
- result import
- result validation
- result review and issue resolution
- result processing
- academic records and attempt preservation
- backlog tracking
- Academic Passport (administrative read model)
- institutional analytics
- post-MVP capabilities (Academic Staff operations and Student Portal)
- security, tenant isolation, and auditability

This document serves as the functional contract during development, API design, and automated testing.

---

# 2. Functional Requirement Conventions

Each requirement follows this format:

```text
FR-[MODULE]-[NUMBER] — [Title]
Priority: [MUST | SHOULD | COULD | FUTURE]
Actors: [Role(s)]
Description: [System behavior]
Acceptance Criteria: [Verifiable conditions]
```

### Priority Definitions

| Priority | Meaning |
|---|---|
| `MUST` | **Required for MVP.** Core two-role workflow capability. |
| `SHOULD` | **Important for MVP.** Highly desirable enhancement within MVP scope. |
| `COULD` | **Optional for MVP.** Non-blocking enhancement. |
| `FUTURE` | **Post-MVP.** Fully defined feature deferred to subsequent releases. |

---

# 3. Authentication & Authorization Requirements

## FR-AUTH-001 — User Login

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`, `COLLEGE_ADMIN`

The system shall authenticate authorized users possessing active credentials.

### Acceptance Criteria
- Valid credentials authenticate the user via `POST /api/v1/auth/login`.
- Invalid credentials return a generic `401 Unauthorized` response without leaking account existence.
- Authenticated user context is established containing user ID, role, and assigned `college_id`.
- Accounts in `INACTIVE` or `SUSPENDED` status are rejected with `403 Forbidden`.
- In MVP, login is restricted to active `SUPER_ADMIN` and `COLLEGE_ADMIN` accounts.
- Staff and Student login attempts are rejected during MVP as post-MVP features.

---

## FR-AUTH-002 — User Logout

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`, `COLLEGE_ADMIN`

The system shall safely terminate an authenticated user session.

### Acceptance Criteria
- `POST /api/v1/auth/logout` invalidates the active session or refresh token server-side.
- Protected resources can no longer be accessed using the terminated credentials.
- Client state is purged and the user is redirected to the login interface.

---

## FR-AUTH-003 — Role-Based Authorization

**Priority:** MUST  
**Actors:** All actors, System

The system shall strictly enforce server-side permissions based on assigned user roles.

### Acceptance Criteria
- MVP actively supports two roles: `SUPER_ADMIN` and `COLLEGE_ADMIN`.
- System architecture supports future roles (`ACADEMIC_STAFF`, `STUDENT`) via extensible role enumerations.
- Authorization checks are applied on all protected backend API routes.
- Unauthorized actions return `403 Forbidden`.
- Frontend route guards provide UX navigation assistance, but backend authorization is mandatory.

---

## FR-AUTH-004 — College Tenant Context Binding

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`, System

The system shall associate every college-scoped request with the trusted tenant identifier (`college_id`) derived exclusively from the authenticated user context.

### Acceptance Criteria
- Tenant context is resolved from the server-side authentication token/session.
- Client-supplied `college_id` headers or query parameters cannot override the user's authentic college tenant.
- All database queries for college resources automatically apply the authenticated `college_id` filter.
- Requests targeting another college's resources are rejected with `403 Forbidden`.

---

## FR-AUTH-005 — Secure Password Management

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`, `COLLEGE_ADMIN`

The system shall provide secure password update and reset capabilities.

### Acceptance Criteria
- Passwords are never stored or transmitted in plain text.
- Passwords are hashed using an adaptive hashing algorithm (e.g., BCrypt).
- Password change requires verifying the existing password (`POST /api/v1/auth/change-password`).
- Password reset employs cryptographically secure, time-limited, single-use tokens (`POST /api/v1/auth/forgot-password` and `/reset-password`).
- Reset endpoints never disclose whether an email address exists in the system.

---

## FR-AUTH-006 — Account Status Enforcement

**Priority:** MUST  
**Actors:** System

The system shall evaluate user account lifecycle states (`ACTIVE`, `INACTIVE`, `SUSPENDED`).

### Acceptance Criteria
- Only accounts with `ACTIVE` status can authenticate.
- Suspending or deactivating an account immediately blocks subsequent authenticated API requests.

---

# 4. College Management Requirements

## FR-COL-001 — Create College Tenant

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`

The system shall allow `SUPER_ADMIN` to register a new college tenant.

### Acceptance Criteria
- Requires college name, unique college code, university affiliation reference, and primary contact details.
- Validates that college code is globally unique across the platform.
- Generates a unique surrogate tenant identifier (`college_id`).
- Creates an audit record documenting college creation.

---

## FR-COL-002 — View College Profile

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`, `COLLEGE_ADMIN`

The system shall permit authorized users to inspect college profile information.

### Acceptance Criteria
- `SUPER_ADMIN` can view profile details for any college tenant.
- `COLLEGE_ADMIN` can view only their own assigned college profile.
- Attempt by `COLLEGE_ADMIN` to view another college returns `403 Forbidden`.

---

## FR-COL-003 — Update College Information

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`, `COLLEGE_ADMIN`

The system shall allow authorized updates to college profile metadata.

### Acceptance Criteria
- `SUPER_ADMIN` can update all permitted college attributes, including administrative status.
- `COLLEGE_ADMIN` can update operational contact details and address for their own college.
- Modifications are validated and auditable.

---

## FR-COL-004 — College Activation and Suspension

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`

The system shall support activating, deactivating, and suspending college tenants.

### Acceptance Criteria
- Deactivated or suspended colleges cannot execute academic operations or logins.
- College deactivation **must not delete** historical student records or examination results.

---

# 5. User Provisioning Requirements

## FR-USER-001 — Provision College Admin Account

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`

The system shall allow `SUPER_ADMIN` to provision the primary `COLLEGE_ADMIN` account for an active college.

### Acceptance Criteria
- Requires administrator name, valid unique email, and assigned `college_id`.
- Rejects duplicate email addresses across the platform.
- Dispatches a secure activation token or establishes a secure initial password.
- Records a security audit event for user creation.

---

## FR-USER-002 — Assign User Role

**Priority:** MUST  
**Actors:** `SUPER_ADMIN`, System

The system shall enforce permitted role assignments.

### Acceptance Criteria
- In MVP, `SUPER_ADMIN` may only assign the `COLLEGE_ADMIN` role.
- Users cannot assign roles to themselves or elevate their own privileges.
- Unauthorized role assignments return `403 Forbidden`.

---

## FR-USER-003 — Enforce College Membership Context

**Priority:** MUST  
**Actors:** System

Every provisioned `COLLEGE_ADMIN` must be irrevocably linked to exactly one active `college_id`.

### Acceptance Criteria
- `COLLEGE_ADMIN` cannot be created without a valid, active college tenant reference.
- Cross-tenant user assignment without platform authorization is rejected.

---

## FR-USER-004 — Provision Academic Staff and Student Accounts

**Priority:** FUTURE (Post-MVP)  
**Actors:** `COLLEGE_ADMIN`

The system will allow `COLLEGE_ADMIN` to provision login accounts for `ACADEMIC_STAFF` and `STUDENT` users.

### Acceptance Criteria (Post-MVP)
- Staff accounts are provisioned with specific departmental permissions.
- Student login accounts are linked to existing student academic records.
- Deferred to post-MVP; in MVP, students do not possess login accounts.

---

# 6. Academic Structure Requirements

## FR-ACADEMIC-001 — Manage Academic Programs / Courses

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow `COLLEGE_ADMIN` to create, view, update, and manage academic programs (e.g., B.Tech CSE, MBA).

### Acceptance Criteria
- Programs are strictly scoped to the user's `college_id`.
- Each program defines code, name, degree level, duration, and affiliated university reference.

---

## FR-ACADEMIC-002 — Manage Semesters / Academic Terms

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow `COLLEGE_ADMIN` to define semester sequences and academic terms.

### Acceptance Criteria
- Semesters are linked to programs (e.g., Semester 1 through Semester 8).
- Maintains ordering and active academic session context.

---

## FR-ACADEMIC-003 — Manage Subjects and Credits

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow `COLLEGE_ADMIN` to configure subjects for each program and semester.

### Acceptance Criteria
- Subject entity defines subject code (e.g., `CS301`), title, credits, type (Theory/Practical), and passing minimum.
- Subject codes within a program must be unique.
- Subject code is indexed to support fast result matching during import.

---

## FR-ACADEMIC-004 — Academic Hierarchy Integrity

**Priority:** MUST  
**Actors:** System

The system shall enforce referential integrity across the academic hierarchy:
$$\text{University} \longrightarrow \text{Program} \longrightarrow \text{Semester} \longrightarrow \text{Subject}$$

### Acceptance Criteria
- Deleting an academic entity with dependent student records or examination results is prohibited.
- Status flags (`ACTIVE` / `INACTIVE`) are used instead of destructive physical deletion.

---

# 7. Student Records Management Requirements

> [!NOTE]
> Student Records Management is a core MVP capability. `COLLEGE_ADMIN` manages student records without creating student login accounts.

## FR-STU-001 — Create Student Academic Record

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow `COLLEGE_ADMIN` to create student demographic and academic records.

### Acceptance Criteria
- Captures official university student identifier (Register / Roll Number), full name, email, admission batch, and enrolled program.
- Enforces uniqueness of the official student identifier within the college tenant.
- Generates a persistent internal surrogate primary key (`id`).
- Associating a student does **not** create a login account in the MVP.

---

## FR-STU-002 — Student Official Academic Identifier

**Priority:** MUST  
**Actors:** System

The system shall mandate an official academic identifier for every student record to serve as the anchor for result matching.

### Acceptance Criteria
- Identifier is normalized (trimmed, case-standardized) upon persistence.
- Official identifier cannot be duplicated within the same college tenant.

---

## FR-STU-003 — View Student Profile and Academic Record

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow `COLLEGE_ADMIN` to view detailed student academic profiles.

### Acceptance Criteria
- Displays student details, program, batch, status, and historical academic standing.
- Scoped strictly to students belonging to the administrator's college.

---

## FR-STU-004 — Search and Filter Student Records

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall provide high-performance search and filtering across college students.

### Acceptance Criteria
- Search by official identifier (prefix/exact) and name.
- Filter by program, batch, semester, and academic status (`ACTIVE`, `GRADUATED`, `DETAINED`).
- Paginated results with server-side limit and offset.

---

## FR-STU-005 — Update Student Record

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow permitted student demographic and enrollment fields to be updated.

### Acceptance Criteria
- Updating student profile metadata does not mutate or invalidate historical examination results.
- Updates are auditable.

---

# 8. Result Import Requirements

## FR-IMPORT-001 — Upload University Result File

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow `COLLEGE_ADMIN` to upload university result files.

### Acceptance Criteria
- Supported formats: Excel (`.xlsx`, `.xls`) and CSV (`.csv`).
- Multipart file upload via `POST /api/v1/result-imports`.
- Enforces configured maximum file size limits (e.g., 25MB).
- Uploaded files are stored in a secure staging directory; never directly written to authoritative tables.

---

## FR-IMPORT-002 — File Validation and Integrity Check

**Priority:** MUST  
**Actors:** System

The system shall validate uploaded file integrity prior to parsing.

### Acceptance Criteria
- Validates MIME type and structural integrity.
- Rejects corrupt or password-protected spreadsheets with actionable error messages.

---

## FR-IMPORT-003 — Create Traceable Import Job

**Priority:** MUST  
**Actors:** System

Every result upload shall instantiate a persistent `result_import_jobs` record.

### Acceptance Criteria
- Records job ID, filename, file size, uploading `user_id`, `college_id`, timestamp, and initial status `UPLOADED`.
- Lifecycle transitions: `UPLOADED` $\rightarrow$ `PARSING` $\rightarrow$ `VALIDATING` $\rightarrow$ `READY_FOR_REVIEW` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED` / `FAILED`.

---

## FR-IMPORT-004 — Parse Spreadsheet Content

**Priority:** MUST  
**Actors:** System

The system shall parse rows and cells from uploaded workbooks or CSV files into staged raw records.

### Acceptance Criteria
- Apache POI handles Excel formats; OpenCSV handles CSV files.
- Handles empty rows, headers, and numeric cell formatting safely without throwing unhandled exceptions.

---

## FR-IMPORT-005 — Column Mapping and Normalization

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`, System

The system shall map raw spreadsheet columns to standardized internal result fields.

### Acceptance Criteria
- Maps: Student Register Number, Student Name (for verification), Subject Code, Internal Marks, External Marks, Total Marks, Grade, Result Status (Pass/Fail/Absent), Credits, Exam Session.
- Trims whitespace and normalizes codes consistently.
- Preserves raw input values for audit and discrepancy analysis.

---

## FR-IMPORT-006 — Import Job Status Inquiries

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall expose the status and progress of import jobs via `GET /api/v1/result-imports/{id}`.

---

# 9. Result Validation & Review Requirements

## FR-VALID-001 — Mandatory Field Verification

**Priority:** MUST  
**Actors:** System

The system shall verify the presence of mandatory fields in every staged record.

### Acceptance Criteria
- Records missing register number, subject code, or grade are flagged `INVALID`.

---

## FR-VALID-002 — Student Identity Matching

**Priority:** MUST  
**Actors:** System

The system shall match staged records against enrolled college students using the official student identifier.

### Acceptance Criteria
- Match succeeds if official identifier exists in the current college tenant.
- Record flagged `INVALID` (error code: `STUDENT_NOT_FOUND`) if identifier does not exist.
- Name-only matching is strictly forbidden.

---

## FR-VALID-003 — Subject Code Matching

**Priority:** MUST  
**Actors:** System

The system shall match staged subject codes against configured subjects in the college curriculum.

### Acceptance Criteria
- Record flagged `INVALID` (error code: `SUBJECT_NOT_FOUND`) if subject code does not exist.

---

## FR-VALID-004 — Academic Context Verification

**Priority:** MUST  
**Actors:** System

The system shall verify that the subject and student program align with the exam context.

---

## FR-VALID-005 — Grade Scale Validation

**Priority:** MUST  
**Actors:** System

The system shall validate grade values against configured grading regulations (e.g., O, A+, A, B+, B, C, P, F, AB).

### Acceptance Criteria
- Unrecognized grade values are flagged `INVALID`.

---

## FR-VALID-006 — Duplicate Detection

**Priority:** MUST  
**Actors:** System

The system shall detect duplicate results within the file and against existing processed results.

### Acceptance Criteria
- Duplicate within the same exam session is flagged `WARNING` or `INVALID`.
- Valid subsequent attempts in distinct exam sessions are recognized as valid attempts.

---

## FR-VALID-007 — Validation Summary & Error Display

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall present a comprehensive validation breakdown:
- Total records parsed
- Valid records ready for processing
- Invalid records with specific failure reasons
- Warnings requiring review

---

## FR-VALID-008 — Validation Issue Resolution and Revalidation

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall allow `COLLEGE_ADMIN` to resolve supported issues (e.g., adding a missing subject code to academic structure or correcting an unmapped student register number) and re-trigger validation.

---

# 10. Result Processing Requirements (Authoritative Mutation)

## FR-PROC-001 — Authoritative Processing Execution

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall execute authoritative processing exclusively on validated records upon explicit confirmation by `COLLEGE_ADMIN`.

### Acceptance Criteria
- Triggered via `POST /api/v1/result-imports/{id}/process`.
- Unvalidated or invalid records cannot be processed into authoritative academic tables.

---

## FR-PROC-002 — Transactional Atomicity

**Priority:** MUST  
**Actors:** System

Authoritative processing must execute within managed database transactions.

### Acceptance Criteria
- If a fatal processing error occurs, all partial mutations are rolled back.
- No partial or corrupted student semester state is committed.

---

## FR-PROC-003 — Historical Attempt Preservation

**Priority:** MUST  
**Actors:** System

Processing must record distinct examination attempts and **never overwrite** historical sittings.

### Acceptance Criteria
- Each sitting generates a distinct attempt record:
  $$\text{Attempt 1 (Nov 2024): Fail} \quad \longrightarrow \quad \text{Attempt 2 (Apr 2025): Pass}$$
- Both attempts remain permanently stored and queryable in academic records.

---

## FR-PROC-004 — Idempotent Processing

**Priority:** MUST  
**Actors:** System

Processing the same import job repeatedly must not duplicate authoritative result records.

---

## FR-PROC-005 — Automatic Backlog State Trigger

**Priority:** MUST  
**Actors:** System

Processing an examination outcome must atomically trigger backlog state updates.

### Acceptance Criteria
- Failing grade on an academic requirement creates or updates an `OPEN` backlog.
- Passing grade on a previously failed subject moves the corresponding backlog to `RESOLVED`.

---

## FR-PROC-006 — Processing Audit Record

**Priority:** MUST  
**Actors:** System

The system shall record an immutable processing audit entry documenting the `user_id`, timestamp, records processed, and job reference.

---

# 11. Academic Records & Backlog Tracking Requirements

## FR-RECORD-001 — Longitudinal Academic History

**Priority:** MUST  
**Actors:** System, `COLLEGE_ADMIN`

The system shall maintain longitudinal academic records accessible across all semesters for each student.

---

## FR-RECORD-002 — Academic Metric Calculation Boundary

**Priority:** MUST  
**Actors:** System

The system shall calculate SGPA, CGPA, and credits earned strictly according to configured university regulations without inventing unsupported formulas.

---

## FR-BACKLOG-001 — Automated Backlog Creation

**Priority:** MUST  
**Actors:** System

An `OPEN` backlog record shall be created whenever a processed result indicates a non-passing outcome in an academic course requirement.

---

## FR-BACKLOG-002 — Automated Backlog Resolution

**Priority:** MUST  
**Actors:** System

An open backlog shall automatically transition to `RESOLVED` when a qualifying passing result is processed for that subject.

---

## FR-BACKLOG-003 — Backlog History Preservation

**Priority:** MUST  
**Actors:** System

The system shall maintain the complete history of each backlog: origin semester, failed attempt dates, clearing attempt date, and elapsed semesters.

---

## FR-BACKLOG-004 — College Backlog Inquiries

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

`COLLEGE_ADMIN` can search, filter, and export active and resolved backlog lists across programs, batches, and subjects.

---

# 12. Academic Passport Requirements (Administrative Read Model)

## FR-PASS-001 — Academic Passport Projection

**Priority:** MUST  
**Actors:** System

The system shall generate a consolidated read-oriented projection of a student's verified academic journey from authoritative records.

---

## FR-PASS-002 — Academic Passport Content

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The Academic Passport interface for `COLLEGE_ADMIN` shall display:
- Student identity and registration information.
- Program details, current semester, and academic standing.
- Term-by-term enrolled subjects, credits, and earned grades.
- Examination sitting attempt breakdowns.
- Accumulated credits and verified SGPA/CGPA.
- Current backlog status (active requirements and resolved history).

---

## FR-PASS-003 — Read-Model Boundary Invariant

**Priority:** MUST  
**Actors:** System

The Academic Passport is strictly a projection. It does not own data and cannot be used to modify authoritative academic results directly.

---

## FR-PASS-004 — Student Self-Service Passport Access

**Priority:** FUTURE (Post-MVP)  
**Actors:** `STUDENT`

The system will allow authenticated students to view their own Academic Passport via the Student Portal.

---

# 13. College Academic Analytics Requirements

## FR-ANALYTICS-001 — Institutional Performance Dashboard

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

The system shall compute and display college-level academic KPIs:
- Overall college pass and failure percentages.
- Cohort progression rates across semesters.
- Subject-level performance hot-spots (highest failure rates).
- SGPA and CGPA distribution histograms.
- Active backlog density by program and semester.

---

## FR-ANALYTICS-002 — Derived Data Integrity

**Priority:** MUST  
**Actors:** System

Analytics calculations shall run strictly against authoritative processed records. Missing results must never be converted to zero or failure without explicit business rule justification.

---

## FR-ANALYTICS-003 — Multi-Dimensional Filtering

**Priority:** MUST  
**Actors:** `COLLEGE_ADMIN`

Analytics queries must support filtering by academic program, batch, semester, and academic session while strictly enforcing tenant boundaries.

---

# 14. Post-MVP Capabilities (Future Scope)

The following requirements describe post-MVP capabilities. They are fully architected but excluded from the active MVP release gate.

## FR-STAFF-001 — Academic Staff Authentication & Portal

**Priority:** FUTURE (Post-MVP)  
**Actors:** `ACADEMIC_STAFF`

The system will allow departmental academic staff to log in and perform delegated operational tasks:
- Departmental student management.
- Delegated result file upload and initial validation.
- Departmental backlog and performance tracking.

---

## FR-PORTAL-001 — Student Authentication

**Priority:** FUTURE (Post-MVP)  
**Actors:** `STUDENT`

The system will allow students to authenticate using their official credentials via `POST /api/v1/auth/login`.

---

## FR-PORTAL-002 — Student Dashboard & Profile

**Priority:** FUTURE (Post-MVP)  
**Actors:** `STUDENT`

The student will access a personal dashboard summarizing current semester progress, recent examination outcomes, and enrolled subjects.

---

## FR-PORTAL-003 — Student Self-Service Results & Backlogs

**Priority:** FUTURE (Post-MVP)  
**Actors:** `STUDENT`

The student will view their published semester results and personal backlog tracking records via secure `/api/v1/me/*` endpoints.

---

## FR-PORTAL-004 — Student Self-Service Academic Passport

**Priority:** FUTURE (Post-MVP)  
**Actors:** `STUDENT`

The student will view and export their personal verified Academic Passport.

---

## FR-PORTAL-005 — Student Personal Analytics

**Priority:** FUTURE (Post-MVP)  
**Actors:** `STUDENT`

The student will view personal academic trends (SGPA trajectory, credit accumulation pace).

---

## FR-PORTAL-006 — Student Self-Service Ownership Invariant

**Priority:** FUTURE (Post-MVP)  
**Actors:** System

Student API endpoints must resolve strictly to the authenticated student's identity (`/me`). A student can never request another student's data.

---

# 15. Cross-Cutting Functional Requirements

## FR-TENANT-001 — Server-Side Multi-Tenant Isolation

**Priority:** MUST  
**Actors:** System

All tenant-scoped database entities (`colleges`, `users`, `programs`, `subjects`, `students`, `results`, `backlogs`) must be partitioned by `college_id`. Cross-tenant queries are rejected server-side.

---

## FR-AUDIT-001 — Comprehensive Security and Operational Auditing

**Priority:** MUST  
**Actors:** System

The system shall log security-sensitive and business-critical operations:
- User login success and failure.
- College tenant creation and status changes.
- College administrator provisioning.
- Result file uploads.
- Result processing execution and record volumes.
- Backlog manual status corrections (if permitted).

---

## FR-PAGE-001 — Server-Side Pagination and Sorting

**Priority:** MUST  
**Actors:** System

All list endpoints (students, result records, validation errors, backlogs) shall implement standardized server-side pagination (`page`, `size`, `sort`) returning pagination metadata (`totalElements`, `totalPages`, `currentPage`).

---

# 16. Role-Based Functional Matrix

| Functional Area | SUPER_ADMIN (MVP) | COLLEGE_ADMIN (MVP) | ACADEMIC_STAFF (Post-MVP) | STUDENT (Post-MVP) |
|---|---|---|---|---|
| **Manage Colleges** | Full Access | No Access | No Access | No Access |
| **Manage College Profile** | Read / Status | Full Access (Own) | Read-Only | No Access |
| **Provision College Admin** | Full Access | No Access | No Access | No Access |
| **Provision Staff / Student Accounts** | No Access | Post-MVP Feature | No Access | No Access |
| **Academic Structure** | Global Reference | Full Access (Own) | Operational Read | Read-Only |
| **Student Records Management** | Audit View | Full Access (Own) | Delegated Access | Read-Only (Self) |
| **Student Login / Portal** | No Access | No Access | No Access | Self (`/me`) |
| **Import University Results** | Audit View | Full Access (Own) | Delegated Access | No Access |
| **Validate Results** | Support View | Full Access (Own) | Delegated Access | No Access |
| **Process Results** | Support View | Full Access (Own) | Delegated Access | No Access |
| **Authoritative Academic Records**| Support View | Full Access (Own) | Operational Read | Read-Only (Self) |
| **Backlog Tracking** | Support View | Full Access (Own) | Operational Read | Read-Only (Self) |
| **Academic Passport** | Support View | Full Access (Own) | Operational Read | Read-Only (Self) |
| **College Analytics** | Platform Summary | Full Access (Own) | Departmental Read | Personal Metrics Only |

---

# 17. Functional Requirement Traceability & Priority Summary

```text
MVP MUST-HAVE CHAIN (Two-Role Architecture):
FR-AUTH (001-006) ──► FR-COL (001-004) ──► FR-USER (001-003)
                                                  │
                                                  ▼
FR-ACADEMIC (001-004) ──► FR-STU (001-005) ──► FR-IMPORT (001-006)
                                                  │
                                                  ▼
FR-VALID (001-008) ──► FR-PROC (001-006) ──► FR-RECORD (001-002)
                                                  │
                                                  ▼
FR-BACKLOG (001-004) ──► FR-PASS (001-003) ──► FR-ANALYTICS (001-003)
                                                  │
                                                  ▼
                                          [MVP RELEASE GATE]
                                                  │
                                                  ▼
POST-MVP EXTENSIONS:
FR-USER-004 (Staff/Student Accounts)
FR-STAFF-001 (Academic Staff Portal)
FR-PORTAL-001 to 006 (Student Self-Service Portal)
FR-PASS-004 (Student Self-Service Passport Access)
```

---

# 18. Definition of Done for Functional Requirements

This document is verified and approved when:
- [x] All MVP requirements specify only `SUPER_ADMIN` and `COLLEGE_ADMIN` as active actors.
- [x] Student Records Management is preserved as an active MVP administrative capability.
- [x] Student authentication, student portal, and staff accounts are clearly marked as `FUTURE` (Post-MVP).
- [x] Tenant isolation and server-side authorization are mandatory across all functional areas.
- [x] Requirement IDs remain consistent, unambiguous, and traceable.
