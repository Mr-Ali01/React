# Acadlytic — MVP Scope

**Document:** `03-prd/mvp-scope.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Status:** Draft / Under Review  
**Document Type:** MVP Scope Specification  
**Last Updated:** 2026-10-15 (Revised for SaaS Customer Onboarding & Registration Approval)

---

# 1. Purpose

This document defines the scope of the **Minimum Viable Product (MVP)** for Acadlytic.

The purpose of the MVP is to deliver the smallest complete, reliable, and secure product that solves the core academic-data problem for university-affiliated colleges.

The MVP focuses on one primary operational workflow executed within an affiliated college tenant:

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

The MVP proves that Acadlytic can reliably transform external university result data into trusted, structured longitudinal academic records and actionable institutional intelligence.

---

# 2. MVP Objective

The primary objective of the MVP is to provide a working academic data platform that enables:

1. A platform operator (`SUPER_ADMIN`) to:
   - manage and oversee the Acadlytic SaaS platform;
   - review, approve, or reject public college registration applications;
   - activate and oversee college customer/tenant accounts.
2. A college administrator (`COLLEGE_ADMIN`) belonging to an approved college tenant to:
   - complete account activation and establish credentials upon college approval;
   - configure the institution's academic structure (universities, courses, semesters, subjects, credits);
   - create and maintain student academic records;
   - import university examination result files (Excel and CSV);
   - validate imported records and identify data anomalies;
   - resolve supported validation exceptions;
   - process validated results into authoritative academic records with full attempt preservation;
   - track student backlog lifecycles (opening on failure, clearing on qualifying pass);
   - view longitudinal student academic journeys via the Academic Passport read model;
   - analyze institutional academic performance through college-level analytics dashboards.

---

# 3. MVP Product Statement

> **Acadlytic MVP enables university-affiliated colleges to import, validate, process, and analyze student academic results—transforming fragmented university exam sheets into centralized longitudinal records, automated backlog intelligence, Academic Passports, and institutional analytics through a secure, two-role multi-tenant system.**

---

# 4. MVP Target Organization & Multi-Tenancy

The MVP is designed for **university-affiliated colleges**.

- The **College** is the primary tenant boundary (`college_id`).
- All academic structures, student records, examination attempts, backlogs, and analytics are strictly isolated by college tenant.
- Cross-tenant data leakage is strictly prohibited and enforced at the server API layer.

---

# 5. Revised MVP User Roles Strategy

The Acadlytic MVP initially supports **exactly TWO active user roles**:

1. **`SUPER_ADMIN`** (Active in MVP)
2. **`COLLEGE_ADMIN`** (Active in MVP)

The following two roles are planned and architected, but explicitly classified as **POST-MVP**:

3. **`ACADEMIC_STAFF`** (Post-MVP)
4. **`STUDENT`** (Post-MVP)

### Active MVP Roles Summary

| Role | Scope | MVP Responsibilities |
|---|---|---|
| **`SUPER_ADMIN`** | Platform | Platform owner and operator. Reviews and approves/rejects public college registration applications, activates/suspends college tenant accounts, manages platform reference data, monitors system operations. Does not manually create individual `COLLEGE_ADMIN` accounts. |
| **`COLLEGE_ADMIN`** | College Tenant | Administrator belonging to an approved and activated college customer/tenant. Completes account activation upon application approval, manages college profile, configures academic structures, manages student records, imports result files, validates and reviews results, processes results into authoritative records, tracks backlogs, views Academic Passports, views college analytics. |

### Post-MVP Roles Summary

| Role | Planned Scope | Post-MVP Responsibilities |
|---|---|---|
| **`ACADEMIC_STAFF`** | College Tenant | Delegated departmental operations, assistant result importing, validation review. |
| **`STUDENT`** | Individual (`/me`) | Authenticated personal login, student dashboard, personal Academic Passport, semester results, personal backlog tracking, personal analytics. |

> [!IMPORTANT]
> **Essential Scope Distinction: Student Records vs. Student User Accounts**  
> - **Student Records are IN-SCOPE for MVP:** `COLLEGE_ADMIN` creates and manages student records (student register number, name, course enrollment, academic status). Result processing matches against these records, updates their attempts, and computes their backlogs.
> - **Student User Accounts & Student Portal are OUT-OF-SCOPE for MVP:** Students do not receive login accounts, passwords, or access to a student-facing portal in the MVP. Student self-service is scheduled for Post-MVP development.

---

# 6. MVP Core Workflow

The complete end-to-end MVP workflow follows the SaaS customer onboarding and operational lifecycle:

```text
Prospective College (Customer / Tenant)
     ↓
Submits Public College Registration Application (/register-college)
     ↓
Application Stored with PENDING Status
     ↓
SUPER_ADMIN (Platform Owner)
     ↓
Reviews Registration in Admin Dashboard (/admin/registrations)
     ↓
Approves Application (System creates college tenant with college_id)
[If Rejected: registration marked REJECTED with reason; no tenant access granted]
     ↓
Secure Account Activation Token Issued to Proposed College Administrator
     ↓
Designated Administrator Completes Account Activation & Sets Password
     ↓
Administrator User Created with COLLEGE_ADMIN Role Bound to college_id
     ↓
COLLEGE_ADMIN Logs In (/auth/login) & Accesses College Dashboard
     ↓
Configure Academic Structure (Programs, Semesters, Subjects, Credits)
     ↓
Create & Manage Student Records (Demographics, Register Numbers)
     ↓
Import University Result File (.xlsx, .xls, .csv)
     ↓
Validate Imported Records (Match Students, Match Subjects, Check Grades)
     ↓
Review Validation Exceptions & Warnings
     ↓
Resolve Supported Data Issues & Revalidate
     ↓
Process Valid Records (Transactional Database Mutation)
     ↓
Authoritative Academic Records Created & Historical Attempts Preserved
     ↓
Backlog States Updated (OPEN on fail / RESOLVED on pass)
     ↓
Inspect Student Academic Passport (Administrative Read View)
     ↓
Analyze Institutional Performance via College Analytics Dashboard
```

---

# 7. MVP Scope Overview

| Product Capability | MVP Status | Responsible Role / Notes |
|---|---|---|
| **Authentication & Authorization** | **In Scope** | Supported for `SUPER_ADMIN` and `COLLEGE_ADMIN` only. |
| **Public College Registration** | **In Scope** | Public application submission by prospective college (`/register-college`). |
| **College Registration & Approval**| **In Scope** | `SUPER_ADMIN` reviews, approves, or rejects pending college applications. |
| **College Admin Account Activation**| **In Scope** | Designated administrator establishes credentials post-approval via secure token. |
| **Public User Self-Registration**  | **Disabled** | Public self-registration without approved college tenant is strictly forbidden. |
| **Staff & Student Account Provisioning** | **Post-MVP** | User accounts for staff and students are deferred. |
| **College Tenant Management** | **In Scope** | Platform tenant oversight by `SUPER_ADMIN`; profile by `COLLEGE_ADMIN`. |
| **Academic Structure** | **In Scope** | Programs, semesters, subjects, credits managed by `COLLEGE_ADMIN`. |
| **Student Record Management** | **In Scope** | Administrative CRUD, search, filter by `COLLEGE_ADMIN`. |
| **Result File Import** | **In Scope** | Excel (`.xlsx`/`.xls`) and CSV ingestion by `COLLEGE_ADMIN`. |
| **Result Validation & Matching** | **In Scope** | Automatic student identifier matching, subject code matching. |
| **Validation Issue Resolution** | **In Scope** | Review errors, fix mappings, revalidate by `COLLEGE_ADMIN`. |
| **Authoritative Result Processing** | **In Scope** | Transactional processing, attempt history preservation. |
| **Academic Records & History** | **In Scope** | Longitudinal record preservation, attempt sit tracking. |
| **Backlog Tracking** | **In Scope** | Lifecycle tracking (`OPEN` / `RESOLVED`) by `COLLEGE_ADMIN`. |
| **Academic Passport (Admin View)** | **In Scope** | Consolidated student academic read-view for `COLLEGE_ADMIN`. |
| **College Academic Analytics** | **In Scope** | Institutional KPIs, pass rates, SGPA trends for `COLLEGE_ADMIN`. |
| **Student Portal & Student Login** | **Post-MVP** | Student self-service access deferred to post-MVP. |
| **Academic Staff Portal & Accounts**| **Post-MVP** | Delegated staff accounts deferred to post-MVP. |
| **Live University APIs / Webhooks** | **Post-MVP** | External direct university API synchronization deferred. |
| **Automated University Scraping**   | **Out of Scope** | Explicitly forbidden. |
| **AI Academic Advisor / Query**    | **Post-MVP** | Natural language queries and predictive risk deferred. |
| **What-If Academic Simulator**     | **Post-MVP** | Hypothetical grade modeling deferred. |
| **Full Regulation / Eligibility**  | **Post-MVP** | Automated progression engine deferred. |
| **Mobile Application**             | **Post-MVP** | Native iOS/Android apps deferred. |
| **Subscription Self-Service (Option C)** | **Post-MVP** | Self-service plan purchase, automated provisioning, billing deferred. |

---

# 8. Detailed MVP In-Scope Modules

## 8.1 Module 1 — Authentication & Authorization (Two-Role MVP)

### Included:
- Secure login with email and password (`POST /api/v1/auth/login`).
- Secure logout and credential invalidation (`POST /api/v1/auth/logout`).
- Current authenticated user context (`GET /api/v1/auth/me`).
- Role-based authorization enforcing the two active MVP roles:
  - `SUPER_ADMIN`
  - `COLLEGE_ADMIN`
- Password change and secure password reset workflow (token-based).
- College administrator account activation (`POST /api/v1/auth/activate-account`).
- Account status enforcement (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- Brute-force protection (failed-login tracking, temporary lockout).
- Security audit events for authentication and onboarding lifecycle.
- Strict server-side college tenant context binding (`college_id`).

### College Onboarding & Account Provisioning Model (Option A):
- Acadlytic is a multi-tenant SaaS platform where `SUPER_ADMIN` is the platform owner/operator and Colleges are customers/tenants.
- `SUPER_ADMIN` does **not** manually create individual `COLLEGE_ADMIN` accounts.
- Prospective colleges apply via a public registration form (`/register-college`, `POST /api/v1/college-registrations`).
- Applications are recorded with `PENDING` status.
- `SUPER_ADMIN` reviews applications and can approve or reject each submission (`POST /api/v1/college-registrations/{id}/approve` or `/reject`).
- Upon approval, the system creates the college tenant and issues a secure, time-limited activation token to the designated administrator.
- The designated administrator activates their account, establishes their login password, and receives the `COLLEGE_ADMIN` role bound strictly to the approved `college_id`.
- Public user self-registration is strictly disabled: individual users cannot register without an approved college tenant application.
- College registration and user authentication are completely separate processes.
- Pending or rejected college applications cannot access protected college operations.

### Excluded from MVP:
- `ACADEMIC_STAFF` account login.
- `STUDENT` account login.
- Social authentication (Google, Microsoft).
- University SSO / SAML / LDAP integration.

---

## 8.2 Module 2 — College & Registration Management

### Included:
- **College Registration Lifecycle (Option A):**
  - Public registration application submission by prospective colleges.
  - Review queue for `SUPER_ADMIN` with detailed application inspection.
  - Approval workflow: creates college tenant record, binds administrator contact, issues activation invitation.
  - Rejection workflow: records formal rejection reason; ensures no tenant credentials are generated.
- **`SUPER_ADMIN` Tenant Management:**
  - View list and detailed profiles of registered and active colleges.
  - Update college administrative information.
  - Activate, deactivate, or suspend college tenants.
- **`COLLEGE_ADMIN` Tenant Operations:**
  - View own college profile.
  - Update permitted college metadata (contact, address).
- Tenant isolation enforcement: all college operations strictly isolated by `college_id`.
- Data preservation: deactivating a college retains its historical academic records.

### Excluded:
- Multi-campus organizational hierarchies.
- Commercial billing, payment gateways, and subscription tier management (Option C deferred to Post-MVP).
- Subscription billing and automated tier management.

---

## 8.3 Module 3 — Academic Structure

### Included:
- `COLLEGE_ADMIN` management of academic reference entities:
  - Programs / Courses (e.g., B.Tech Computer Science).
  - Academic Regulations & Batches (reference configuration).
  - Semesters / Academic Terms.
  - Subjects / Courses (Subject code, Subject name, Credits, Type).
- Relationship validation: Course $\rightarrow$ Semester $\rightarrow$ Subject.
- Reference integrity for student assignment and result matching.

### Excluded:
- Automated university curriculum web synchronization.
- Complex dynamic prerequisite validation engines.

---

## 8.4 Module 4 — Student Management (Record Management)

### Included:
- `COLLEGE_ADMIN` capabilities:
  - Create student academic records individually.
  - Maintain official university student identifiers (Register / Roll Numbers).
  - Record student profile information (Name, Email, Contact, Admission Year).
  - Associate students with their Course/Program and Academic Context.
  - View, search, and filter student records.
  - Update permitted student demographic and enrollment details.
  - Set student academic status (`ACTIVE`, `INACTIVE`, `GRADUATED`, `DETAINED`).

### Crucial Invariant:
- Student records exist as authoritative domain entities for result processing and backlog tracking.
- Creating a student record does **not** create a student login account in the MVP.

### Excluded:
- Student self-registration and student portal login.
- Non-academic ERP modules (Attendance, Hostel, Fees, Transport, Placement).

---

## 8.5 Module 5 — Result Import

### Included:
- Ingestion of university result sheets by `COLLEGE_ADMIN`.
- Supported file formats: Excel (`.xlsx`, `.xls`) and Comma-Separated Values (`.csv`).
- File upload validation (MIME type, size limits, file integrity).
- Asynchronous or synchronous parsing using Apache POI and OpenCSV.
- Column mapping from raw headers to standardized internal schema.
- Data normalization (trimming, case standardization, clean representations).
- Traceable import job lifecycle:
  `UPLOADED` $\rightarrow$ `PARSING` $\rightarrow$ `VALIDATING` $\rightarrow$ `READY_FOR_REVIEW` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED` / `FAILED`.

### Excluded:
- Automated direct university portal scraping.
- University webhook listeners.

---

## 8.6 Module 6 — Result Validation & Review

### Included:
- Comprehensive validation pipeline executing prior to authoritative mutation:
  1. **Required Fields Check:** Validates presence of student ID, subject code, marks/grades.
  2. **Student Identity Matching:** Matches imported records against college student records via official academic identifier. Unknown identifiers flagged as errors.
  3. **Subject Matching:** Matches imported subject codes against configured subjects. Unmatched subjects flagged.
  4. **Academic Context Check:** Validates consistency of program and semester.
  5. **Result Value Check:** Validates grades against configured university grade scales.
  6. **Duplicate Detection:** Identifies duplicate records within the import file and against existing database records.
- Record-level validation classification: `PENDING`, `VALID`, `INVALID`, `WARNING`.
- Actionable validation summary displayed to `COLLEGE_ADMIN`.
- In-place issue resolution (correcting unmapped subjects or roll numbers) and revalidation.

---

## 8.7 Module 7 — Result Processing (Authoritative Mutation)

### Included:
- Explicit execution of processing by `COLLEGE_ADMIN` for validated records.
- Transactional persistence: records are committed atomically; errors trigger safe rollback.
- Creation of permanent academic results and attempt records.
- Preservation of historical examination attempts (subsequent attempts never overwrite previous attempts).
- Idempotent processing: retrying the same import job does not duplicate result records.
- Automatic triggering of backlog state transitions.
- Processing audit logging (timestamp, user, file reference, record counts).

---

## 8.8 Module 8 — Academic Records & Attempt History

### Included:
- Longitudinal academic history for all enrolled students.
- Storage of examination sitting records:
  - Student, Subject, Semester, Exam Session (e.g., Nov/Dec 2025).
  - Attempt Number (1, 2, 3...).
  - Grade, Grade Points, Credits Earned, Result Status (PASS / FAIL / ABSENT).
- Calculation of approved academic metrics (SGPA, CGPA) according to configured rules without formula fabrication.

---

## 8.9 Module 9 — Backlog Tracking

### Included:
- Automated backlog determination based on processed results:
  - Failed attempt on an academic requirement initiates an `OPEN` backlog.
  - Subsequent passing attempt transitions the backlog to `RESOLVED`.
- Historical tracking: preserves origin semester, failed attempts, sit dates, clearing date, and clearing attempt.
- Administrative backlog dashboard for `COLLEGE_ADMIN` to query active backlogs by student, program, semester, and subject.

---

## 8.10 Module 10 — Academic Passport (Administrative Read Model)

### Included:
- Comprehensive, read-oriented longitudinal view of any student's academic history, accessible by `COLLEGE_ADMIN`.
- Visual components:
  - Student identity and enrollment summary.
  - Semester-by-semester course progress.
  - Subject attempt histories and verified grades.
  - Credit accumulation and SGPA/CGPA progression.
  - Active and resolved backlog status summary.
- Strict read-model architecture: derived directly from authoritative records; cannot be independently edited.

---

## 8.11 Module 11 — College Academic Analytics

### Included:
- Institutional academic performance dashboards for `COLLEGE_ADMIN`:
  - Student enrollment counts and demographic summaries.
  - Overall college pass/fail percentages per examination session.
  - Semester and program performance comparisons.
  - Subject-level failure and backlog hot-spot analysis.
  - SGPA and CGPA distribution curves across cohorts.
  - Open backlog volume and progression trends.
- Correct handling of missing data (missing results are never coerced to zero or failure).

---

# 9. Explicitly Excluded (Post-MVP Capabilities)

The following capabilities are explicitly deferred to post-MVP phases:

1. **Student Self-Service Portal:** Student login, personal dashboards, and self-service Academic Passport views.
2. **Academic Staff Accounts:** Separate login and delegated operational roles for departmental staff.
3. **Automated Live University Connectors:** Direct APIs, automated file download bots, or webhooks.
4. **Predictive AI & Machine Learning:** AI-based dropout risk prediction, automated student advisement.
5. **Academic What-If Simulator:** Interactive grade forecasting calculators.
6. **Advanced Regulation & Eligibility Engine:** Complex credit-rule automation before explicit university specifications are gathered.
7. **Comprehensive College ERP Features:** Fees, attendance, hostel, library, timetable, payroll, and placement.
8. **Mobile Native Apps:** iOS and Android applications.
9. **Subscription-Based Self-Service Onboarding & SaaS Billing (Option C):** Self-service plan selection, Stripe/payment gateway integration, subscription lifecycle management, and instant automated tenant provisioning.

---

# 10. MVP User Interface Scope

The MVP user interface is structured for public prospective college onboarding and the two active roles:

### 1. Public Web Interface
- Public Homepage / Landing page.
- College Registration Application Form (`/register-college`).
- Registration Success Confirmation (`/registration-success`).
- Account Activation & Password Setup (`/activate-account`).
- User Login (`/auth/login`), Forgot Password (`/auth/forgot-password`), and Reset Password (`/auth/reset-password`).

### 2. `SUPER_ADMIN` Portal
- Platform Overview Dashboard (active colleges, system health, pending applications count).
- College Registration Applications Hub (`/admin/registrations`): Review pending queue, application inspection, Approve / Reject action with audit reason.
- College Tenant Management (`/admin/colleges`): Active tenants list, college profile details, tenant status toggle (Active/Suspended).
- Platform Reference Data (Universities Master).
- Security Audit Log Viewer.

### 3. `COLLEGE_ADMIN` Portal
- College Executive Dashboard (student count, latest imports, open backlogs, pass rates).
- College Profile Settings.
- Academic Structure Configuration (Programs, Batches, Semesters, Subjects).
- Student Management (List, Add Student, Edit, Search, Filters, Student Profile).
- Result Import Hub (Upload File, Job History, Column Mapping).
- Validation & Review Center (Validation Summary, Record Table, Error Resolution).
- Processing Operations (Trigger Process, Processing Audit).
- Backlog Management (Active Backlogs, Cleared Backlogs, Subject Analytics).
- Student Academic Passport Viewer (Comprehensive longitudinal student inspection).
- Academic Analytics Dashboard (Institutional charts, cohort analysis).

---

# 11. MVP Success Criteria

The Acadlytic MVP is successful when an affiliated college can reliably execute the full lifecycle:

```text
1. College submits public registration application (/register-college).
2. SUPER_ADMIN reviews and approves the application in Admin Dashboard (/admin/registrations).
3. Designated administrator receives activation link, activates account, and establishes password.
4. COLLEGE_ADMIN logs in (/auth/login) with tenant context strictly bound to approved college_id.
5. COLLEGE_ADMIN configures Programs, Semesters, and Subjects.
6. COLLEGE_ADMIN adds or verifies Student Records.
7. COLLEGE_ADMIN imports a university result Excel or CSV file.
8. System validates records and flags invalid grades or unmatched students.
9. COLLEGE_ADMIN resolves errors and triggers Authoritative Processing.
10. System updates longitudinal academic records and attempt histories.
11. System automatically creates or resolves Backlogs.
12. COLLEGE_ADMIN inspects the student's Academic Passport.
13. COLLEGE_ADMIN reviews updated institutional performance on the Analytics Dashboard.
```

---

# 12. Non-Negotiable MVP Principles

1. **Two Active Roles Only:** Only `SUPER_ADMIN` and `COLLEGE_ADMIN` possess active accounts.
2. **Student Records $\neq$ Student Accounts:** Student data is processed in MVP; student login is Post-MVP.
3. **No Unvalidated Writes:** Uploaded files never directly modify authoritative academic records.
4. **Preserve History:** Failed attempts are never overwritten by subsequent passes.
5. **Strict Multi-Tenancy:** All college data is isolated by `college_id` at the database and API layers.
6. **No Fabricated Formulas:** Academic metrics are calculated only according to approved university regulations.
