# Acadlytic — Product Requirements Document

**Document:** `03-prd/product-requirements.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Status:** Draft / Under Review  
**Document Type:** Product Requirements Document (PRD)  
**Last Updated:** 2026-10-05 (Revised for Two-Role MVP Scope)

---

# 1. Purpose

This document defines the product requirements for **Acadlytic**, an academic intelligence platform designed specifically for university-affiliated colleges.

The document translates the validated problem space, target users, and user journeys into product-level requirements.

It establishes:

- product goals and scope
- revised two-role MVP user definitions and long-term role expansion
- core academic workflows
- functional requirements and boundaries
- business rules and data principles
- security and multi-tenant expectations
- explicit MVP vs. post-MVP scope boundaries
- measurable acceptance criteria

This document serves as the primary product reference guiding architectural decisions, engineering tasks, and quality assurance.

---

# 2. Product Overview

Acadlytic helps university-affiliated colleges transform external university examination result sheets into centralized, structured, and longitudinal academic information.

The core MVP product workflow is:

```text
University Result (Excel / CSV)
            ↓
      Result Import
            ↓
      Result Validation
            ↓
      Issue Resolution
            ↓
      Authoritative Processing
            ↓
      Academic Records & Attempts
            ↓
      Backlog Lifecycle Tracking
            ↓
      Academic Passport (Admin View)
            ↓
      College Academic Analytics
```

In post-MVP phases, this workflow expands to include self-service access via the Student Portal and delegated departmental operations via the Academic Staff Portal.

---

# 3. Product Vision & Mission

## 3.1 Vision

> Build the trusted academic intelligence platform that enables university-affiliated colleges to turn fragmented university result data into reliable longitudinal student academic records, automated backlog intelligence, Academic Passports, and actionable institutional insights.

## 3.2 Mission

To make collegiate academic data:
- **Centralized:** Stored in a single authoritative repository per college tenant.
- **Structured:** Organized into consistent student, semester, subject, and attempt models.
- **Traceable:** Auditable from raw source files to authoritative records.
- **Trustworthy:** Formed strictly through a validation-before-authority pipeline.
- **Actionable:** Visualized through longitudinal passports and institutional analytics.

---

# 4. Problem Statement

University-affiliated colleges face severe operational challenges when managing student academic data:

1. **Fragmented Results:** University examination results arrive periodically in disparate spreadsheets, CSVs, or PDF tables.
2. **Manual Processing Friction:** Exam coordinators spend days manually inspecting files, cross-checking student identities, and re-entering marks.
3. **Student Identity Matching Risks:** Relying on student names causes errors due to spelling variations and duplicates; official university identifiers must be used.
4. **Difficult Backlog Tracking:** Manually determining whether a student has uncleared backlogs from earlier semesters across subsequent examination sittings is highly error-prone.
5. **Lack of Longitudinal History:** Viewing a student's complete 4-year academic trajectory (SGPA/CGPA evolution, accumulated credits, repeated sitting attempts) requires assembling dozens of disconnected files.
6. **Limited Institutional Visibility:** College leadership lacks automated cohort analytics, pass/fail trends, and subject-level failure hot-spot identification.

---

# 5. Product Goals

1. **Centralize Academic Records:** Provide a single source of truth for student academic performance within each college tenant.
2. **Automate Result Ingestion & Validation:** Provide a controlled workflow (`Import` $\rightarrow$ `Validate` $\rightarrow$ `Review` $\rightarrow$ `Process`) that prevents corrupted data from entering the system.
3. **Automate Backlog Intelligence:** Automatically initiate an `OPEN` backlog on exam failure and transition it to `RESOLVED` upon a subsequent qualifying pass.
4. **Preserve Historical Attempts:** Ensure historical examination sittings are never overwritten by subsequent attempts.
5. **Provide Academic Passports:** Offer a consolidated, read-oriented longitudinal view of any student's complete academic journey.
6. **Deliver Actionable Analytics:** Enable college leadership to evaluate performance across programs, semesters, and subjects.
7. **Ensure Multi-Tenant Security:** Enforce strict isolation so no college can access another institution's academic records.

---

# 6. Target Users & Two-Role MVP Strategy

Acadlytic's long-term architecture supports four distinct user roles, but the **MVP initially activates only TWO roles** to accelerate time-to-value:

```text
ACADLYTIC PLATFORM
├── SUPER_ADMIN (Platform Operator) [MVP ACTIVE]
└── COLLEGE TENANT (college_id)
      ├── COLLEGE_ADMIN (College Academic Administrator) [MVP ACTIVE]
      ├── ACADEMIC_STAFF (Departmental Operational Staff) [POST-MVP]
      └── STUDENT (Academic Self-Service Consumer) [POST-MVP]
```

### 6.1 Active MVP Roles

| Role | Scope | MVP Responsibilities |
|---|---|---|
| **`SUPER_ADMIN`** | Platform | Onboards college tenants, provisions `COLLEGE_ADMIN` accounts, manages master platform data, monitors platform health. |
| **`COLLEGE_ADMIN`** | College Tenant | Manages college profile, academic structure, student records, university result imports, validation, authoritative processing, backlogs, Academic Passports, and analytics. |

### 6.2 Post-MVP Roles (Deferred Scope)

| Role | Planned Scope | Post-MVP Responsibilities |
|---|---|---|
| **`ACADEMIC_STAFF`** | College Tenant | Delegated departmental operations, assistant result importing, validation review. |
| **`STUDENT`** | Individual (`/me`) | Authenticated self-service login, student dashboard, personal Academic Passport, semester results, personal backlog tracking, personal analytics. |

> [!IMPORTANT]
> **Crucial Distinction: Student Records vs. Student User Accounts**  
> - **Student Records are part of the MVP:** `COLLEGE_ADMIN` creates and manages student records (student register numbers, names, program enrollments, academic status). Result processing matches against these records, updates their attempts, and computes their backlogs.
> - **Student User Accounts and Student Portal are POST-MVP:** Students will NOT have login access, personal credentials, or a student dashboard during the MVP.

---

# 7. Multi-Tenant Architecture & Data Isolation

- The **College** represents the primary tenant boundary (`college_id`).
- All tenant-owned entities (`users`, `programs`, `semesters`, `subjects`, `students`, `results`, `backlogs`) must contain a `college_id` foreign key.
- The server-side API and database layers must enforce tenant isolation:
  ```sql
  SELECT * FROM students WHERE id = :studentId AND college_id = :authCollegeId;
  ```
- Cross-tenant access is strictly prohibited and returns `403 Forbidden`. The frontend is never trusted for tenant scoping.

---

# 8. Core Product Modules (MVP vs. Post-MVP)

### Active MVP Modules:
1. **Authentication & Authorization:** Secure login/logout, session handling, password management, and RBAC for `SUPER_ADMIN` and `COLLEGE_ADMIN`.
2. **College Management:** Tenant onboarding and management by `SUPER_ADMIN`; profile maintenance by `COLLEGE_ADMIN`.
3. **Academic Structure:** Programs, semesters, subjects, and credit configurations managed by `COLLEGE_ADMIN`.
4. **Student Management:** Student demographic and enrollment records managed by `COLLEGE_ADMIN` (without user accounts).
5. **Result Import:** Excel (`.xlsx`/`.xls`) and CSV file upload, job lifecycle, and column mapping.
6. **Result Validation:** Format, identity, grade, and duplicate checks with actionable error reporting.
7. **Result Review & Resolution:** Exception review, mapping fixes, and revalidation.
8. **Result Processing:** Transactional authoritative persistence, attempt history preservation, and audit logging.
9. **Backlog Tracking:** Automated `OPEN` and `RESOLVED` lifecycle tracking and administrative backlog search.
10. **Academic Passport (Admin View):** Consolidated student longitudinal academic view for `COLLEGE_ADMIN`.
11. **College Academic Analytics:** Cohort performance, pass/fail trends, subject hot-spots, and backlog analytics.

### Post-MVP Modules (Deferred):
12. **Student Self-Service Portal:** Student login, personal dashboard, personal Academic Passport, and `/me` endpoints.
13. **Academic Staff Portal:** Delegated departmental staff accounts and operational workflows.

---

# 9. Core Academic Data Lifecycle

Acadlytic enforces a strict, unidirectional pipeline for academic results:

```text
External Result File (Excel / CSV)
            ↓
      Import Layer (Staging & Raw Storage)
            ↓
     Validation Layer (Identity, Rule & Grade Checks)
            ↓
     Processing Boundary (Transactional Authority Gate)
            ↓
 Authoritative Academic Records & Attempt Histories
            ↓
┌─────────────────────┬──────────────────────┬──────────────────────┐
│                     │                      │                      │
▼                     ▼                      ▼                      ▼
Backlog Engine      Academic Passport      College Analytics      Audit Logs
```

### Invariants:
- **Import $\neq$ Authority:** Uploaded data is staged in quarantined import tables until explicitly processed.
- **Validation Precedes Processing:** Records with validation errors cannot be processed into authoritative tables.
- **Attempts $\neq$ Backlogs:** An attempt is a historical examination sitting; a backlog is an unresolved academic requirement.
- **No Overwriting History:** Attempt 1 (Fail) remains permanently recorded when Attempt 2 (Pass) is committed.
- **No Invented Formulas:** GPA, SGPA, and CGPA formulas must be based on approved university regulations.

---

# 10. Product Functional Requirements Summary

## FR-001 — Authentication (Two-Role MVP)
- Authenticate `SUPER_ADMIN` and `COLLEGE_ADMIN` via email and password.
- Establish secure session/token containing role and `college_id`.
- Support password update and secure token-based password reset.
- Staff and Student login attempts are disabled in the MVP.

## FR-002 — College Management
- `SUPER_ADMIN` creates and configures college tenants.
- `SUPER_ADMIN` provisions initial `COLLEGE_ADMIN` accounts.
- `COLLEGE_ADMIN` views and maintains their college profile.
- Tenant deactivation preserves all historical academic data.

## FR-003 — Academic Structure Management
- `COLLEGE_ADMIN` manages programs, batches, semesters, and subjects.
- Enforces course-semester-subject referential integrity.
- Subject codes are unique per program and indexed for result matching.

## FR-004 — Student Records Management
- `COLLEGE_ADMIN` creates, searches, filters, views, and updates student academic records.
- Enforces uniqueness of official university student identifiers (Register Numbers).
- Student records exist as authoritative domain entities for result processing without requiring login credentials.

## FR-005 — Result Ingestion
- `COLLEGE_ADMIN` uploads Excel (`.xlsx`, `.xls`) and CSV (`.csv`) result files.
- Generates traceable import jobs with states: `UPLOADED`, `PARSING`, `VALIDATING`, `READY_FOR_REVIEW`, `PROCESSING`, `COMPLETED`, `FAILED`.
- Enforces file size limits and validates spreadsheet structure.

## FR-006 — Result Parsing & Normalization
- Apache POI parses Excel files; OpenCSV parses CSV files.
- Column mapping standardizes raw headers to internal result attributes.
- Normalizes data (trims whitespace, formats register numbers) while preserving raw inputs.

## FR-007 — Result Validation Pipeline
- Checks mandatory fields (register number, subject code, marks/grade).
- Matches student register number against college student records (rejects name-only matches).
- Matches subject code against configured academic curriculum.
- Validates grade codes against configured grading scales.
- Detects intra-file and inter-file duplicate submissions.
- Classifies records as `VALID`, `INVALID`, or `WARNING`.

## FR-008 — Validation Review & Error Resolution
- Presents an actionable validation summary to `COLLEGE_ADMIN`.
- Allows `COLLEGE_ADMIN` to correct mapping issues or add missing curriculum entities and revalidate.

## FR-009 — Authoritative Result Processing
- `COLLEGE_ADMIN` explicitly triggers processing of validated records.
- Executes within ACID database transactions; safely rolls back on failure.
- Persists permanent academic results and increments attempt numbers.
- Preserves historical attempts and enforces idempotency against repeat runs.

## FR-010 — Backlog Tracking
- System automatically creates an `OPEN` backlog on academic failure.
- System automatically resolves an open backlog upon a subsequent passing attempt.
- Preserves complete backlog sitting history and clearance timelines.
- `COLLEGE_ADMIN` can search, filter, and inspect institutional backlogs.

## FR-011 — Academic Passport (Administrative Read Model)
- Provides `COLLEGE_ADMIN` with a consolidated longitudinal academic journey view for any student.
- Displays student details, program progression, semester breakdowns, attempt sitting histories, credits, and SGPA/CGPA.
- Strictly read-oriented projection derived from authoritative records.

## FR-012 — College Academic Analytics
- Computes institutional KPIs for `COLLEGE_ADMIN`: pass/fail rates, cohort progression, subject failure hot-spots, SGPA/CGPA distributions, and backlog volume trends.
- Missing examination data is never coerced to zero or failure without business justification.

---

# 11. Post-MVP Product Capabilities (Future Roadmap)

The following modules and capabilities are explicitly scheduled for post-MVP phases:

1. **Student Self-Service Portal:** Student login, personal dashboards, and self-service Academic Passport views.
2. **Academic Staff Accounts & Portal:** Delegated staff login and departmental result operations.
3. **Authorized Live University Integrations:** Automated API connectors, webhooks, and result sync bots.
4. **Regulation & Eligibility Engine:** Automated progression and credit eligibility calculation engine.
5. **Academic What-If Simulator:** Interactive student tool for forecasting required grades to reach target CGPA.
6. **Predictive Academic Risk Intelligence:** AI models identifying students at risk of drop-out or backlog accumulation.
7. **Natural-Language AI Query:** Natural-language question answering across institutional academic records.
8. **General College ERP Capabilities:** Fees, attendance, hostel, library, transport, timetable, and payroll.
9. **Mobile Application:** Native iOS and Android apps for students and staff.
10. **Commercial SaaS Billing:** Automated subscription billing and payment gateways.

---

# 12. Non-Functional Product Requirements

### 12.1 Security & Compliance
- **Server-Side Authorization:** Mandatory on every protected API endpoint.
- **Tenant Isolation:** Enforced on every database query using authenticated `college_id`.
- **Credential Protection:** BCrypt/Argon2 password hashing; no plaintext passwords stored or logged.
- **Audit Trails:** Immutable logging of login attempts, result uploads, and processing executions.
- **File Upload Security:** File extension and MIME type validation; safe storage outside web roots.

### 12.2 Reliability & Data Integrity
- **ACID Transactions:** Processing operations are atomic; partial updates are rolled back.
- **Historical Preservation:** Examination attempts are immutable and permanently preserved.
- **Idempotency:** Repeated execution of processing does not duplicate records.
- **Fail-Safe Validation:** Unvalidated or corrupt records can never enter authoritative tables.

### 12.3 Usability & Performance
- **Clear Exception Messaging:** Validation errors explain exactly why a record failed with clear remediation guidance.
- **Server-Side Pagination:** Applied on all large collections (students, result records, backlogs).
- **Responsive Layouts:** Desktop and tablet optimized for administrative workflows; clean responsive layouts without horizontal overflow.

---

# 13. MVP Definition of Done

The Acadlytic MVP is complete and ready for pilot deployment when:
- [x] Product scope is restricted to the two active roles (`SUPER_ADMIN` and `COLLEGE_ADMIN`).
- [x] `SUPER_ADMIN` can onboard colleges and provision `COLLEGE_ADMIN` accounts.
- [x] `COLLEGE_ADMIN` can configure academic structures and manage student academic records.
- [x] `COLLEGE_ADMIN` can import, validate, and process Excel and CSV university result files.
- [x] Examination attempt histories are immutably preserved.
- [x] Backlog lifecycles (`OPEN` $\rightarrow$ `RESOLVED`) execute automatically upon result processing.
- [x] `COLLEGE_ADMIN` can inspect student Academic Passports and view institutional analytics.
- [x] All tenant isolation and security requirements pass automated verification.
- [x] Student Portal and Academic Staff Portal are cleanly deferred to post-MVP without compromising the architecture.
