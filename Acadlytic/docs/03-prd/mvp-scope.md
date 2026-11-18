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
   - review verified college registration applications and documents;
   - approve applications (`APPROVED`), request corrections/additional documents (`ACTION_REQUIRED`), or reject applications (`REJECTED`, including permanent rejection) with a mandatory reason;
   - oversee approved college customer/tenant accounts.
2. A college administrator (`COLLEGE_ADMIN`) to:
   - register their college publicly and establish login credentials during registration (`users.status = ACTIVE` immediately);
   - log in immediately after registration to a **restricted College Dashboard** to verify email, upload required verification documents, submit into the frozen `PENDING` review queue, and respond to `ACTION_REQUIRED`/`REJECTED` feedback via versioned resubmissions while academic management features remain locked until approval;
   - upon `SUPER_ADMIN` approval, automatically unlock full college management capabilities on the same administrator identity and college dashboard to:
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
- **No Branch Hierarchy in MVP:** Branch management and `BRANCH_ADMIN` are strictly Post-MVP. No branch tables or branch-level functionality are created or implemented in the MVP.

---

# 5. Revised MVP User Roles Strategy

The Acadlytic MVP initially supports **exactly TWO active user roles**:

1. **`SUPER_ADMIN`** (Active in MVP)
2. **`COLLEGE_ADMIN`** (Active in MVP — **exactly one active `COLLEGE_ADMIN` per college tenant in MVP**, while keeping the schema extensible for future multiple-admin support without redesign)

The following roles are explicitly classified as **POST-MVP**:

3. **`ACADEMIC_STAFF`** (Post-MVP)
4. **`STUDENT`** (Post-MVP)
5. **`BRANCH_ADMIN`** (Post-MVP — deferred with branch management; no branch tables or branch functionality in MVP)

### Active MVP Roles Summary

| Role | Scope | MVP Responsibilities |
|---|---|---|
| **`SUPER_ADMIN`** | Platform | Platform owner and operator (bootstrapped securely via one-time env-driven startup runner — no public endpoint). Reviews verified college registration applications and documents using optimistic version checks (`expectedVersion`), approves applications (`APPROVED`), requests corrections/documents (`ACTION_REQUIRED`), or rejects applications (`REJECTED`, including permanent rejection) with mandatory reason; activates/suspends college tenant accounts, manages platform reference data, monitors system operations. Does not manually create individual `COLLEGE_ADMIN` credentials. |
| **`COLLEGE_ADMIN`** | College Tenant | Sole active administrator per college tenant in MVP (enforced via MySQL 8 `VIRTUAL` generated column + `UNIQUE` index while keeping `users.college_id` non-unique for Post-MVP multi-admin extensibility). Establishes credentials during public registration (`users.status = ACTIVE` immediately), accesses a restricted onboarding dashboard immediately to verify email and upload required documents before submitting to the frozen `PENDING` review queue, responds to `ACTION_REQUIRED`/`REJECTED` feedback via versioned resubmissions, and upon `APPROVED` status unlocks full college management on the same account and dashboard (college profile, academic structures, student records, result imports, validation, processing, backlogs, Academic Passports, college analytics). |

### Post-MVP Roles Summary

| Role | Planned Scope | Post-MVP Responsibilities |
|---|---|---|
| **`ACADEMIC_STAFF`** | College Tenant | Delegated departmental operations, assistant result importing, validation review. |
| **`STUDENT`** | Individual (`/me`) | Authenticated personal login, student dashboard, personal Academic Passport, semester results, personal backlog tracking, personal analytics. |
| **`BRANCH_ADMIN`** | College Branch | Delegated branch/campus-level administration within multi-branch institutions (requires Post-MVP branch management). |

> [!IMPORTANT]
> **Essential Scope Distinction: Student Records vs. Student User Accounts**  
> - **Student Records are IN-SCOPE for MVP:** `COLLEGE_ADMIN` creates and manages student records (student register number, name, course enrollment, academic status). Result processing matches against these records, updates their attempts, and computes their backlogs.
> - **Student User Accounts & Student Portal are OUT-OF-SCOPE for MVP:** Students do not receive login accounts, passwords, or access to a student-facing portal in the MVP. Student self-service is scheduled for Post-MVP development.

---

# 6. MVP Core Workflow

The complete end-to-end MVP workflow follows the SaaS customer onboarding and operational lifecycle:

`College Registration → Restricted Dashboard → SUPER_ADMIN Verification → Approval or Correction/Resubmission → Full Management Dashboard`

```text
Prospective College (Customer / Tenant)
     ↓
Submits Public College Registration (/register-college)
(Institution Profile + Proposed COLLEGE_ADMIN Credentials; Rate-Limited 5/IP/hr; No Public Doc Multipart)
     ↓
Restricted College Context (approval_status = PENDING, status = PENDING_VERIFICATION)
+ Proposed COLLEGE_ADMIN User Created (users.status = ACTIVE, email_verified_at = NULL)
+ Application v1 Created (status = PENDING, submitted_for_review_at = NULL — not yet in SUPER_ADMIN queue)
     ↓
COLLEGE_ADMIN Logs In Immediately (/auth/login, Stateful HTTP-Only Session Cookie + CSRF)
-> Restricted College Dashboard (Pre-Submission Onboarding)
   1. Verifies Email via 48-hour Single-Use DB-Hashed Token (Transactional Outbox)
   2. Uploads Required Verification Documents (PDF/JPEG/PNG, max 10 MB each, max 5 docs/revision)
   3. Clicks "Submit for Review" -> Sets submitted_for_review_at (Enters SUPER_ADMIN PENDING Queue; Frozen/Read-Only)
   [All Academic Management APIs Blocked with 403 COLLEGE_NOT_APPROVED]
     ↓
SUPER_ADMIN Reviews Verified Application & Documents (/admin/registrations, requires expectedVersion)
     ├── Request Corrections / Docs -> Status = ACTION_REQUIRED (mandatory notes; safety cap 10 revisions)
     │        └── College Reviews Feedback -> Uploads New Immutable Docs / Edits -> Resubmits v+1 -> PENDING (Frozen)
     ├── Reject (Non-Permanent, up to 3 revised submissions) -> Status = REJECTED (mandatory reason)
     │        └── College Reviews Reason -> Revises & Resubmits v+1 (History Preserved) -> PENDING (Frozen)
     ├── Permanent Rejection (explicit flag or 3rd revision rejected) -> permanently_rejected = true,
     │        colleges.status = INACTIVE, users.status = INACTIVE, ALL Sessions Revoked,
     │        Reservations Released (code/email/slot) while Full Audit History Retained
     └── Approve -> Status = APPROVED
              ↓
College Tenant Activated (approval_status = APPROVED, status = ACTIVE)
(Existing ACTIVE COLLEGE_ADMIN Identity & college_id Preserved; Approval Email Dispatched via Transactional Outbox)
     ↓
Session Observes Updated Approval State via GET /api/v1/auth/me -> Full Management Dashboard Unlocked
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
| **Authentication & Authorization** | **In Scope** | Stateful HTTP-only session cookies (Spring Session JDBC + MySQL) + CSRF (no JWT). Supported for `SUPER_ADMIN` and `COLLEGE_ADMIN` only. Backend enforces live role, user status, and college approval/operational status. |
| **Public College Registration** | **In Scope** | Public application submission (`/register-college`) with proposed `COLLEGE_ADMIN` credentials (`users.status = ACTIVE` immediately); IP rate-limited (5/hr) + configurable prod CAPTCHA. Documents uploaded post-login on restricted dashboard. |
| **Email Verification & Restricted Dashboard** | **In Scope** | Immediate post-registration login to restricted dashboard. College verifies email (48h hashed token) and uploads required documents before submitting into the frozen `PENDING` review queue. Academic management APIs return `403`. |
| **College Verification, Resubmission & Approval** | **In Scope** | `SUPER_ADMIN` reviews verified applications using `expectedVersion` (`409` on stale) and marks `APPROVED`, `ACTION_REQUIRED` (safety cap 10), `REJECTED` (up to 3 revisions), or permanently rejected. Immutable versions, documents, and audit history preserved. |
| **Post-Approval Feature Unlocking** | **In Scope** | Approval sets `colleges` to `APPROVED` & `ACTIVE`, unlocking the existing `COLLEGE_ADMIN` dashboard (same identity & `college_id`) with zero separate account/dashboard creation. |
| **Public General-User Self-Registration** | **Disabled** | General public user self-registration outside college registration is strictly forbidden. |
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
| **Branch Management & `BRANCH_ADMIN`** | **Post-MVP** | Multi-branch/campus hierarchy deferred; no branch tables or branch functionality in MVP. |
| **Subscription Self-Service (Option C)** | **Post-MVP** | Can reuse common onboarding and authentication foundations; subscription plans, payment gateway, and billing require additional implementation. |

---

# 8. Detailed MVP In-Scope Modules

## 8.1 Module 1 — Authentication & Authorization (Two-Role MVP)

### Included:
- **Stateful HTTP-Only Session Authentication (No JWT):** Spring Session JDBC persisted in MySQL (`30-min` idle timeout, `12-hour` absolute lifetime, multi-device allowed, session ID rotation on login and privilege changes). Production cookie uses `__Host-ACADLYTIC_SID` (`HttpOnly`, `Secure=true`, `SameSite=Lax`, `Path=/`, no `Domain`).
- **CSRF Protection:** Spring Security 6 SPA CSRF pattern (`CookieCsrfTokenRepository.withHttpOnlyFalse()`, `SpaCsrfTokenRequestHandler`, `GET /api/v1/auth/csrf`, enforced on login, logout, registration, and all state-changing requests; `403 CSRF_TOKEN_INVALID` on failure).
- Secure login (`POST /api/v1/auth/login`), logout (`POST /api/v1/auth/logout`), and authoritative current-user & college verification context (`GET /api/v1/auth/me` returning role, `collegeId`, `userStatus`, `emailVerified`, `submittedForReview`, `collegeApprovalStatus`, `collegeStatus`, and `managementUnlocked`).
- Role-based and live approval-state-aware authorization enforcing the two active MVP roles (`SUPER_ADMIN`, `COLLEGE_ADMIN`).
- **User Status vs. College Approval Status:** `COLLEGE_ADMIN` receives `users.status = ACTIVE` immediately on registration so they can log into the restricted dashboard; **`colleges.approval_status` + `colleges.status`** strictly gate all academic management APIs (`403 COLLEGE_NOT_APPROVED` while unapproved; `403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE` and login blocked if an approved college is suspended).
- **Password & Token Security:** BCrypt work factor `12`, password length `12–128` characters with common/compromised password rejection, authenticated password change (`POST /api/v1/auth/change-password`), single-use DB-hashed password reset token (`1-hour` expiry), single-use DB-hashed email verification token (`48-hour` expiry), and password-confirmed email change (`POST /api/v1/auth/change-email` with 48h re-verification).
- **Brute-Force & Abuse Protection:** `5` consecutive failed logins &rarr; `15-minute` temporary lockout; IP-based rate limiting on public registration (`5 attempts / IP / hour`, `429` + `Retry-After`) and configurable production CAPTCHA.
- **Server-Side Session Revocation:** Logout revokes current session; password change & email change revoke all other sessions and rotate current session ID; password reset, user suspension, college suspension, permanent rejection, admin replacement, and `SUPER_ADMIN` suspension revoke **all** active sessions of affected user(s).
- **One-Time `SUPER_ADMIN` Bootstrap:** Environment-driven, idempotent startup runner (zero public `SUPER_ADMIN` registration endpoint).
- Security audit events and transactional outbox email dispatch (Mailpit in dev; environment-configured SMTP/TLS abstraction in prod).

### College Onboarding & Account Provisioning Model:
- Acadlytic is a multi-tenant SaaS platform where `SUPER_ADMIN` is the platform owner/operator and Colleges are customers/tenants.
- `SUPER_ADMIN` does **not** manually create individual `COLLEGE_ADMIN` credentials.
- Prospective colleges register via `/register-college` (`POST /api/v1/college-registrations`) with institution profile and proposed `COLLEGE_ADMIN` credentials (no multipart document upload on public registration).
- Registration atomically creates a restricted college context (`colleges`: `approval_status = PENDING`, `status = PENDING_VERIFICATION`), application `v1` (`status = PENDING`, `submitted_for_review_at = NULL`), and proposed `COLLEGE_ADMIN` user (`users.status = ACTIVE`, `email_verified_at = NULL`) bound strictly to `college_id`.
- Immediately after registration, `COLLEGE_ADMIN` logs into the **restricted College Dashboard** to verify email (48h hashed token), upload required verification documents (PDF/JPEG/PNG, max 10 MB each, max 5 docs/revision; required categories: `UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`), and click **"Submit for Review"** (`POST /api/v1/college-registrations/my-application/submit`). Only verified, submitted applications enter the `SUPER_ADMIN` `PENDING` review queue, at which point edits and uploads are **frozen/read-only**.
- Unverified and unsubmitted registrations abandoned for **7 days** are automatically soft-archived daily (releasing `college_code`, `email`, and the single-admin slot without touching submitted/approved/historical records).
- `SUPER_ADMIN` inspects verified applications and documents using `expectedVersion` (`409 Conflict` on stale version) and can:
  - **Approve** (`APPROVED`): sets `colleges` to `APPROVED` and `ACTIVE`, unlocking full management features on the existing `COLLEGE_ADMIN` account and dashboard (same `user_id` and `college_id`; zero separate account/dashboard creation), and queues approval email via the transactional outbox.
  - **Request Corrections / Documents** (`ACTION_REQUIRED`, safety cap 10 revisions): records mandatory reviewer feedback; college reviews feedback, uploads new immutable document records, and resubmits `v+1` &rarr; frozen `PENDING`.
  - **Reject** (`REJECTED`, mandatory reason): allows up to **3 revised applications** after initial submission (`v1` initial + up to 3 revisions) with full version/document/decision preservation, OR **permanent rejection** (explicit flag or 3rd revision rejected), which sets `colleges.status = INACTIVE`, `users.status = INACTIVE`, revokes all sessions, releases code/email/slot reservations, and retains full historical audit records.
- **Single Active `COLLEGE_ADMIN` per College (MVP):** Enforced atomically via a MySQL 8 `VIRTUAL` generated column (`active_college_admin_college_id`) + `UNIQUE` index on `users`, while keeping `users.college_id` non-unique (1-to-many) for future multiple-admin support without redesign.
- Public general-user self-registration is strictly disabled.
- Deployment-level selections (exact commercial production SMTP vendor and exact production S3-compatible bucket provider) are explicitly deferred to **Phase 14**; automated document malware scanning is deferred to **Post-MVP (Phase 18)**.

### Excluded from MVP:
- JWT-based authentication.
- `ACADEMIC_STAFF` account login.
- `STUDENT` account login.
- `BRANCH_ADMIN` role and branch-scoped authorization.
- Automated malware scanning for uploaded verification documents (deferred to Post-MVP; MVP enforces MIME + magic-byte validation, allow-list, size/count caps, random keys outside webroot, and safe download headers).
- Social authentication (Google, Microsoft) and University SSO / SAML / LDAP integration.

---

## 8.2 Module 2 — College & Registration Management

### Included:
- **College Registration & Verification Lifecycle:**
  - Public registration application submission by prospective colleges (credentials + institution profile; IP rate-limited 5/hr; configurable prod CAPTCHA).
  - Authenticated restricted onboarding dashboard for email verification, verification document uploads (PDF/JPEG/PNG, max 10 MB, max 5/revision, immutable rows, tenant-scoped streaming outside webroot), initial submission into the frozen `PENDING` review queue, and correction/resubmission for `ACTION_REQUIRED` and non-permanent `REJECTED` applications without discarding historical versions, documents, or review decisions.
  - Review queue for `SUPER_ADMIN` displaying verified, submitted applications with revision history, document inspection, and `expectedVersion`-guarded Approve, Request Action (`ACTION_REQUIRED`), Reject (`REJECTED`), and Permanent Reject actions.
  - Approval workflow: activates the college tenant (`APPROVED` & `ACTIVE`), unlocks management features on the existing `COLLEGE_ADMIN` account, and queues approval email via the transactional outbox (never dispatched inside the DB transaction).
  - Automated 7-day soft-archive cleanup for abandoned unverified/unsubmitted registrations.
- **`SUPER_ADMIN` Tenant Management:**
  - View list and detailed profiles of registered and active colleges.
  - Update college administrative information.
  - Activate, deactivate, or suspend college tenants (suspending/deactivating immediately revokes all sessions and blocks login with `403 COLLEGE_SUSPENDED` / `COLLEGE_INACTIVE`).
- **`COLLEGE_ADMIN` Tenant Operations (Unlocked upon `APPROVED` & `ACTIVE`):**
  - View own college profile.
  - Update permitted college metadata (contact, address).
- Tenant isolation enforcement: all college operations strictly isolated by server-derived `college_id`.
- Data preservation: deactivating/suspending or permanently rejecting a college retains its historical records and audit trails.

### Excluded:
- Branch management, `BRANCH_ADMIN` role, and multi-campus organizational hierarchies (no branch tables or branch functionality are created in MVP).
- Commercial billing, payment gateways, and subscription tier management (Option C deferred to Post-MVP; while Option C can reuse the common onboarding and authentication foundations, subscription and billing integration will require additional implementation).

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
9. **Branch Management & `BRANCH_ADMIN`:** Multi-branch / multi-campus hierarchies and branch-level administration. No branch tables or branch functionality will be created in the MVP.
10. **Subscription-Based Self-Service Onboarding & SaaS Billing (Option C):** Self-service plan selection, payment gateway integration, and subscription lifecycle management. Option C can reuse the common onboarding and authentication foundations established in the MVP, while subscription management and billing integration will require additional implementation.

---

# 10. MVP User Interface Scope

The MVP user interface is structured for public prospective college onboarding and the two active roles:

### 1. Public Web Interface
- Public Homepage / Landing page.
- College Registration Form (`/register-college` — institution profile and proposed `COLLEGE_ADMIN` credential setup; verification documents uploaded post-login on the restricted dashboard).
- Email Verification Confirmation (`/verify-email`) & Email Change Confirmation (`/verify-email-change`).
- User Login (`/auth/login`), Forgot Password (`/auth/forgot-password`), and Reset Password (`/auth/reset-password`).

### 2. `SUPER_ADMIN` Portal
- Platform Overview Dashboard (active colleges, system health, verified `PENDING` / `ACTION_REQUIRED` applications count).
- College Registration Applications Hub (`/admin/registrations`): Review verified `PENDING`, `ACTION_REQUIRED`, `APPROVED`, and `REJECTED` queue, inspect application revisions and verification documents, and execute Approve, Request Action (`ACTION_REQUIRED`), Reject (`REJECTED`), or Permanent Reject with mandatory notes/reason and `expectedVersion`.
- College Tenant Management (`/admin/colleges`): Active tenants list, college profile details, tenant status toggle (Active/Suspended).
- Platform Reference Data (Universities Master).
- Security Audit Log Viewer.

### 3. `COLLEGE_ADMIN` Portal
- **Restricted Onboarding Dashboard (While Pre-Submission, `PENDING`, `ACTION_REQUIRED`, or Non-Permanent `REJECTED`):**
  - Pre-Submission Checklist (Email verification status/resend, required document upload manager, "Submit for Review" action).
  - Application Status & Verification Tracker (frozen read-only status banner while `PENDING` under review; reviewer feedback/rejection reason & remaining resubmission count when `ACTION_REQUIRED` or `REJECTED`; immutable submission version history).
  - Verification Document Manager & Correction/Resubmission View (enabled during pre-submission, `ACTION_REQUIRED`, and non-permanent `REJECTED`; frozen while `PENDING` under review).
  - Locked Academic Management Navigation (visually locked and server-enforced with `403 COLLEGE_NOT_APPROVED` until `APPROVED` & `ACTIVE`).
- **Full College Management Dashboard (Unlocked upon `APPROVED` & `ACTIVE`):**
  - College Executive Dashboard (student count, latest imports, open backlogs, pass rates).
  - College Profile Settings & Email Change Settings.
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
1. College submits public registration (/register-college) with institution profile and proposed COLLEGE_ADMIN credentials (users.status = ACTIVE immediately).
2. COLLEGE_ADMIN logs in immediately (/auth/login, stateful HTTP-only session cookie + CSRF) to the restricted College Dashboard, verifies email (48h hashed token), uploads required verification documents (PDF/JPEG/PNG, max 10 MB), and clicks "Submit for Review" to enter the frozen PENDING review queue while academic management APIs remain locked (403 COLLEGE_NOT_APPROVED).
3. SUPER_ADMIN reviews the verified application and documents in Admin Dashboard (/admin/registrations) using expectedVersion:
   - If corrections/documents are needed (ACTION_REQUIRED) or rejected (REJECTED, up to 3 revised submissions), COLLEGE_ADMIN reviews feedback on the restricted dashboard, uploads new immutable documents/details, and resubmits a new application version (preserving history) back to frozen PENDING.
   - When verified, SUPER_ADMIN approves the application (APPROVED).
4. Approval transitions colleges to APPROVED & ACTIVE, queues notification via transactional outbox, and unlocks all management features on the existing COLLEGE_ADMIN account and dashboard (observed via GET /api/v1/auth/me without creating a second account or dashboard).
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

1. **Two Active Roles Only:** Only `SUPER_ADMIN` and `COLLEGE_ADMIN` possess active accounts. `ACADEMIC_STAFF`, `STUDENT` login, and `BRANCH_ADMIN` are strictly Post-MVP.
2. **Stateful Sessions Only (No JWT):** Authentication uses stateful HTTP-only session cookies (Spring Session JDBC + MySQL) with CSRF protection; backend is the sole source of truth.
3. **One Active `COLLEGE_ADMIN` per College (MVP):** Enforced atomically via MySQL 8 `VIRTUAL` generated column + `UNIQUE` index on `users`, while keeping `users.college_id` non-unique for future multiple-admin support without redesign.
4. **User Status $\neq$ College Approval Status:** Newly registered `COLLEGE_ADMIN` users receive `users.status = ACTIVE` immediately for restricted dashboard access; `colleges.approval_status` (`APPROVED`) and `colleges.status` (`ACTIVE`) strictly gate all academic management APIs.
5. **Verified Queue Entry & Frozen `PENDING`:** Applications require verified email and uploaded documents before entering the `SUPER_ADMIN` `PENDING` queue, and remain read-only/frozen while under review (`expectedVersion` enforced on review actions).
6. **Preserve Application & Audit History:** Resubmissions from `ACTION_REQUIRED` or `REJECTED` (capped at 3 rejection revisions) and permanent rejections never overwrite or discard prior application versions, immutable documents, or review decisions.
7. **No Branch Functionality in MVP:** Branch management and `BRANCH_ADMIN` are Post-MVP; do not create branch tables or implement branch functionality in MVP.
8. **Student Records $\neq$ Student Accounts:** Student data is processed in MVP; student login is Post-MVP.
9. **No Unvalidated Writes:** Uploaded result files never directly modify authoritative academic records.
10. **Preserve History:** Failed exam attempts are never overwritten by subsequent passes.
11. **Strict Multi-Tenancy:** All college data is isolated by `college_id` at the database and API layers.
12. **No Fabricated Formulas:** Academic metrics are calculated only according to approved university regulations.
