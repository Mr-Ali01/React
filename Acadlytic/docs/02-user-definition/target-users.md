# Acadlytic — Target Users

**Document:** `02-user-definition/target-users.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Status:** Draft / Under Review  
**Document Type:** Target User Definition  
**Last Updated:** 2026-10-05 (Revised for Two-Role MVP Scope)

---

# 1. Purpose

This document defines the users and organizational roles that Acadlytic is intended to serve.

The purpose is to establish:

- who uses Acadlytic in the Minimum Viable Product (MVP)
- who will use Acadlytic in post-MVP phases
- what responsibilities each user role has
- what information each user role needs
- what actions each user role can perform
- what information each user role must not access
- how user roles relate to the multi-tenant architecture
- the distinction between managing student academic records and providing student login accounts

Target-user definitions guide product requirements, UX design, authorization, API design, and testing.

---

# 2. Product User Model

Acadlytic is designed primarily for university-affiliated colleges within a multi-tenant architecture where the college is the primary tenant boundary.

### 2.1 MVP User Model (Active Roles)

For the MVP, Acadlytic supports exactly **two active user roles**:

```text
Acadlytic Platform
        │
        ├── SUPER_ADMIN (Platform Operator)
        │
        └── College Tenant (college_id)
              │
              └── COLLEGE_ADMIN (College Academic Administrator)
```

In the MVP, all college-level academic operations—including configuring academic structures, managing student records, importing university result files, validating and resolving result errors, processing results into authoritative academic records, tracking backlogs, and viewing college analytics—are performed by `COLLEGE_ADMIN`.

### 2.2 Post-MVP User Model (Future Extensibility)

In post-MVP phases, the college tenant will expand to support specialized operational and self-service roles:

```text
Acadlytic Platform (Post-MVP)
        │
        ├── SUPER_ADMIN (Platform Operator)
        │
        └── College Tenant (college_id)
              │
              ├── COLLEGE_ADMIN (Executive & Administrative Lead)
              │
              ├── ACADEMIC_STAFF (Operational Academic & Exam Staff) [POST-MVP]
              │
              └── STUDENT (Self-Service Academic Consumer) [POST-MVP]
```

---

# 3. Primary Target Organization

## University-Affiliated College

The primary organizational customer is a college that operates under a university academic structure and receives academic result information from that university.

The college needs to manage:

- students and enrollments
- academic programs and courses
- semesters and academic regulations
- subjects and credits
- university examination results
- longitudinal academic records
- backlog tracking and clearance history
- institutional academic analytics

Acadlytic provides a structured, validated, and auditable academic data layer around these workflows.

---

# 4. User Role Overview

| Role | Lifecycle Phase | Scope | Primary Purpose in Acadlytic |
|---|---|---|---|
| `SUPER_ADMIN` | **MVP (Active)** | Platform | Create and manage colleges, provision College Admins, manage platform operations |
| `COLLEGE_ADMIN` | **MVP (Active)** | College Tenant | Manage college profile, academic structure, student records, result import/validation/processing, backlogs, and analytics |
| `ACADEMIC_STAFF` | **POST-MVP** | College Tenant | Perform delegated academic operations, result handling, and record reviews under assigned permissions |
| `STUDENT` | **POST-MVP** | Individual | Authenticate to personal portal, view personal results, Academic Passport, backlogs, and individual analytics |

> [!IMPORTANT]
> **Crucial Architectural Distinction:**  
> **Student records and student academic data are fully in scope for the MVP.**  
> `COLLEGE_ADMIN` creates and manages student records, and the system processes and tracks results for those students. However, **student user accounts, student authentication, and the student-facing portal are strictly POST-MVP.**

---

# 5. SUPER_ADMIN — MVP (Active Role)

## 5.1 Role Definition

The **SUPER_ADMIN** is a platform-level administrator responsible for operating the Acadlytic service, provisioning tenants, and managing platform configurations. This role operates outside individual college tenants.

## 5.2 Primary Responsibilities

In the MVP, the SUPER_ADMIN is responsible for:

- Creating and managing college tenants.
- Activating, deactivating, and suspending college accounts.
- Creating and provisioning initial `COLLEGE_ADMIN` accounts.
- Managing platform-level reference data (e.g., master university entries).
- Managing platform-level administrative operations and configurations.
- Viewing platform-level operational statistics and system health.
- Accessing college-level information only according to strictly defined platform administration permissions for support.

## 5.3 Primary Needs

The SUPER_ADMIN needs visibility into:

- List of registered colleges and their subscription/activation status.
- College administrator details and account statuses.
- Platform activity and security audit logs.
- System operational health and import error rates across the platform.

## 5.4 Typical MVP Tasks

```text
Create College Tenant
        ↓
Configure Basic College Metadata
        ↓
Create & Provision COLLEGE_ADMIN Account
        ↓
Monitor College Activation Status
        ↓
Support Platform-Level Inquiries
```

## 5.5 Access Boundary

SUPER_ADMIN capabilities must be explicitly defined and audited:

- SUPER_ADMIN does not perform day-to-day academic operations (e.g., does not routinely edit student results).
- All platform-level administrative actions must be logged in security audit events.

---

# 6. COLLEGE_ADMIN — MVP (Active Role)

## 6.1 Role Definition

The **COLLEGE_ADMIN** is the primary administrative and operational user within an affiliated college tenant. In the MVP, the College Admin acts as both the administrative lead (Principal, Vice-Principal, Dean, Academic Director) and the chief academic operator (Head of Examination Cell / Academic In-charge).

## 6.2 Primary Responsibilities

In the MVP, the COLLEGE_ADMIN is responsible for the complete academic workflow:

1. **College Profile:** Manage permitted college information (address, contact details).
2. **Academic Structure:** Configure universities, courses/programs, regulations, academic years, semesters, and subjects (including subject codes and credits).
3. **Student Record Management:** Create, search, filter, view, and update student demographic and enrollment records (**without provisioning student login accounts**).
4. **University Result Import:** Upload external university result files (Excel `.xlsx`/`.xls` and CSV).
5. **Result Validation & Review:** Inspect parsing outputs, review validation errors (unmatched students, missing subjects, invalid grade codes), and resolve supported validation issues.
6. **Result Processing:** Execute authoritative processing of validated records into permanent academic records, creating examination attempt histories.
7. **Backlog Tracking:** Monitor open backlogs, verify automatic resolution upon passing attempts, and inspect backlog histories.
8. **Academic Passport:** Access the comprehensive longitudinal read-model (Academic Passport) for any enrolled student.
9. **College Analytics:** Access institutional dashboards showing student performance, cohort progression, pass/fail ratios, SGPA/CGPA distributions, and backlog analytics.

## 6.3 Primary Needs

The COLLEGE_ADMIN needs:

- Intuitive file upload and structured column-mapping tools for university result sheets.
- Clear, actionable validation summaries detailing valid, invalid, and warning records.
- Transactional confidence that invalid records will not corrupt the academic database.
- Centralized visibility into student academic trajectories across multiple semesters.
- Accurate backlog summaries to identify students needing academic intervention.

## 6.4 Typical MVP Workflow

```text
Log in to College Admin Portal
        ↓
Configure Academic Structure (Programs, Semesters, Subjects)
        ↓
Create / Maintain Student Records
        ↓
Upload University Result File (Excel / CSV)
        ↓
Review Validation Errors (Unmatched roll numbers, invalid grades)
        ↓
Resolve Issues & Revalidate
        ↓
Confirm & Trigger Authoritative Processing
        ↓
Inspect Updated Academic Records & Backlogs
        ↓
Review Longitudinal Academic Passports & College Analytics
```

## 6.5 Access Boundary & Tenant Isolation

- A `COLLEGE_ADMIN` is strictly confined to their own college tenant (`college_id`).
- All queries, mutations, and file operations must be scoped by the authenticated user's `college_id`.
- Access to another college's student records, results, or analytics must be unconditionally denied at the backend API layer with `403 Forbidden`.

---

# 7. Post-MVP Roles (Planned for Future Extensibility)

To ensure the architecture remains future-proof, the following two roles are fully designed but intentionally deferred to post-MVP releases.

## 7.1 ACADEMIC_STAFF — POST-MVP

### Role Definition
Staff members (HODs, Examination Cell operators, faculty members, academic coordinators) who perform delegated academic operations within a college tenant.

### Planned Post-MVP Responsibilities:
- Manage assigned student cohorts and department-specific records.
- Upload and validate university result files under delegated authority.
- Review validation exceptions and submit batches for administrative sign-off.
- Track department-level backlog lists and academic performance indicators.
- Assist students with academic inquiries.

### MVP Status:
**Not active in MVP.** In the MVP, all academic management and result processing tasks are executed directly by the `COLLEGE_ADMIN`. The authentication system and user entities must remain extensible so `ACADEMIC_STAFF` can be enabled post-MVP without schema refactoring.

---

## 7.2 STUDENT — POST-MVP

### Role Definition
An individual student enrolled in a college tenant who interacts with Acadlytic as a self-service consumer of their verified academic records.

### Planned Post-MVP Responsibilities:
- Authenticate via secure personal credentials (`/auth/login`).
- View personal Student Dashboard.
- Access the self-service **Academic Passport** displaying verified longitudinal history.
- Inspect semester-by-semester results, grade breakdowns, SGPA, and cumulative CGPA.
- Track individual backlog statuses, sitting histories, and clearance outcomes.
- View personal academic analytics and progression indicators.
- Manage personal settings and password changes.

### MVP Status:
**Not active in MVP.** Students do **not** have login access, credentials, or a Student Portal in the MVP.  
However, **Student Records** (names, register numbers, course enrollments, examination attempts, and backlog states) are actively created, processed, and maintained in the MVP by `COLLEGE_ADMIN`. Post-MVP implementation will simply attach user authentication credentials to existing student records.

---

# 8. User Scope & Tenant Model

Acadlytic enforces strict tenant boundaries at the database and application levels:

```text
Platform Scope (SUPER_ADMIN)
      │
      ├───────────────────────────────┐
      ↓                               ↓
College Tenant A (college_id: 101)   College Tenant B (college_id: 102)
      │                               │
COLLEGE_ADMIN (College A)            COLLEGE_ADMIN (College B)
      │                               │
Students (College A records)         Students (College B records)
Results (College A records)          Results (College B records)
```

A user belonging to College A cannot view or manipulate College B data through:
- URL parameter manipulation (IDOR attempts)
- Request body alterations
- Direct API calls
- Client-side state overrides

---

# 9. User-to-Data Relationship Matrix

| Data Entity | SUPER_ADMIN (MVP) | COLLEGE_ADMIN (MVP) | ACADEMIC_STAFF (Post-MVP) | STUDENT (Post-MVP) |
|---|---|---|---|---|
| **College Configuration** | Platform-level (Create/Status) | Own College (Read/Update) | Limited Read | No Access |
| **Academic Structure** | Global Reference / Support | Own College (Full Manage) | Operational Read | Read-Only |
| **Student Records** | Support / Audit View | Own College (Full Manage) | Own Dept / Assigned | Self (Read-Only) |
| **Student Login Accounts** | No | Post-MVP Feature | Post-MVP Feature | Self (Post-MVP) |
| **Result Imports & Raw Files** | Audit / Support | Own College (Full Manage) | Delegated Manage | No Access |
| **Result Validation** | Support View | Own College (Review/Resolve) | Delegated Review | No Access |
| **Result Processing** | Support View | Own College (Execute) | Delegated Execute | No Access |
| **Authoritative Records** | Support View | Own College (Read/Manage) | Permitted Read | Self (Read-Only) |
| **Backlog Tracking** | Support View | Own College (Full View) | Permitted View | Self (Read-Only) |
| **Academic Passport** | Support View | Own College (Full View) | Permitted View | Self (Read-Only) |
| **College Analytics** | Platform Summary | Own College (Full Analytics)| Assigned Analytics | Self Analytics Only |
| **Other Colleges' Data** | Controlled Admin View | **Denied (403)** | **Denied (403)** | **Denied (403)** |

---

# 10. User Lifecycle & Account Provisioning

Acadlytic uses controlled administrative provisioning rather than open public self-registration.

### 10.1 MVP Provisioning Flow

```text
SUPER_ADMIN
    │
    ▼
Creates College Tenant
    │
    ▼
Creates / Provisions COLLEGE_ADMIN Account (Email, Temp Password / Activation)
    │
    ▼
COLLEGE_ADMIN Activates Account & Logs In
    │
    ▼
COLLEGE_ADMIN Manages College & Creates Student Academic Records
(No student login accounts created in MVP)
```

### 10.2 Post-MVP Provisioning Flow

```text
COLLEGE_ADMIN
    │
    ├── Provisions ACADEMIC_STAFF Accounts
    │
    └── Provisions STUDENT Login Accounts (Linked to existing Student Records)
```

### 10.3 Account States

All user accounts support the following lifecycle states:
- `INVITED` / `PENDING_ACTIVATION`
- `ACTIVE` (only active accounts can authenticate)
- `SUSPENDED`
- `DISABLED`

---

# 11. User Priority Matrix

### MVP Priority:
1. **`COLLEGE_ADMIN`** — Primary user driving value delivery (result ingestion, validation, processing, backlog tracking, analytics).
2. **`SUPER_ADMIN`** — Administrative operator enabling tenant onboarding and platform health.

### Post-MVP Priority:
3. **`ACADEMIC_STAFF`** — Operational scaling for large colleges with departmental delegation.
4. **`STUDENT`** — High-volume self-service access to verified Academic Passports.

---

# 12. User Goals Summary

### SUPER_ADMIN (MVP)
> *"Onboard colleges efficiently, provision administrators reliably, and maintain high platform stability and security."*

### COLLEGE_ADMIN (MVP)
> *"Eliminate manual spreadsheet result processing, maintain verified student academic records, identify and track backlogs automatically, and access reliable academic analytics."*

### ACADEMIC_STAFF (Post-MVP)
> *"Handle departmental exam verification quickly with minimal administrative friction."*

### STUDENT (Post-MVP)
> *"Access my transparent, verified academic history and backlog status at any time without visiting the college exam office."*

---

# 13. Definition of Done for User Definition

This target user specification is complete and verified when:
- [x] Only `SUPER_ADMIN` and `COLLEGE_ADMIN` are active in the MVP.
- [x] `ACADEMIC_STAFF` and `STUDENT` are explicitly documented as post-MVP capabilities.
- [x] The distinction between student records (MVP) and student login accounts (post-MVP) is clearly documented.
- [x] Tenant boundaries and permissions for both MVP roles are established.
- [x] Future role expansion architecture is preserved.
