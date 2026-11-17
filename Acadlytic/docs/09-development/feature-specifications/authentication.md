# Authentication & Authorization Feature Specification

**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Module:** Authentication & Authorization  
**Document:** Feature Specification  
**Version:** 1.1  
**Status:** Draft / Implementation Ready  
**Last Updated:** 2026-10-15 (Revised for SaaS Customer Onboarding & Registration Approval)

---

# 1. Purpose

The Authentication & Authorization module provides secure identity verification, session management, and multi-tenant access control for Acadlytic.

Acadlytic is a multi-tenant Software-as-a-Service (SaaS) platform:
- **`SUPER_ADMIN`**: The owner and operator of the Acadlytic platform.
- **College**: A customer and tenant organization that subscribes to or registers for Acadlytic.
- **`COLLEGE_ADMIN`**: The primary administrative account belonging to an approved and activated college customer/tenant.
- **`ACADEMIC_STAFF`**: Future departmental role (Post-MVP).
- **`STUDENT`**: Future student self-service role (Post-MVP).

The module is responsible for:

- Processing public college customer registration applications (MVP Onboarding — Option A).
- Enabling platform administrators (`SUPER_ADMIN`) to review, approve, or reject college registration applications.
- Securely activating college administrator accounts post-approval without manual account creation by `SUPER_ADMIN`.
- Authenticating approved users with valid credentials.
- Establishing secure authenticated sessions/tokens.
- Identifying the user's role and establishing authorization context.
- Resolving and enforcing the user's college tenant context (`college_id`).
- Protecting college and student academic records across tenant boundaries.
- Managing user account lifecycle and password security.
- Recording immutable security audit events for onboarding and authentication activities.
- Providing an extensible role foundation that initially activates two MVP roles while accommodating future role expansion.

Authentication is the foundational prerequisite for all protected Acadlytic operations.

---

# 2. Scope

## 2.1 MVP Scope (Two Active Roles & Registration Approval Onboarding)

The MVP authentication system supports **exactly two active user roles**:
1. `SUPER_ADMIN` (Platform Operator & Platform Owner)
2. `COLLEGE_ADMIN` (College Academic Administrator of an Approved Tenant)

Key MVP capabilities:
- **Public College Registration (Option A):** Prospective institutions submit an onboarding application (`POST /api/v1/college-registrations`).
- **Registration Application Review:** `SUPER_ADMIN` views pending registration queue (`GET /api/v1/college-registrations`, `GET /api/v1/college-registrations/{id}`).
- **Registration Approval/Rejection:** `SUPER_ADMIN` approves or rejects applications (`POST /api/v1/college-registrations/{id}/approve` and `/reject`).
- **College Administrator Account Activation:** Designated administrator receives a secure invitation token, sets their password, and activates their account (`POST /api/v1/auth/activate-account`).
- **User Login:** Authenticated access for active accounts (`POST /api/v1/auth/login`).
- **User Logout:** Session/token invalidation (`POST /api/v1/auth/logout`).
- **Current Authenticated User Context:** Trusted profile retrieval (`GET /api/v1/auth/me`).
- **Role-Based Authorization:** Strict enforcement of `SUPER_ADMIN` and `COLLEGE_ADMIN` permissions.
- **Multi-Tenant Context Binding:** Server-enforced `college_id` scoping for all college operations.
- **Password Security:** Password change (`POST /api/v1/auth/change-password`) and secure token-based password reset (`POST /api/v1/auth/forgot-password` and `reset-password`).
- **Account Status Enforcement:** `ACTIVE`, `INACTIVE`, `SUSPENDED` validation on authentication.
- **Brute-Force Protection:** Failed-login tracking, temporary lockout after threshold.
- **Security Audit Logging:** Traceable events for registrations, approvals, activations, logins, and lockouts.
- **Protected Routes:** Dedicated route guards for public onboarding, platform administration (`/admin/*`), and college operations (`/college/*`).

### Explicitly Excluded from MVP:
- `SUPER_ADMIN` manual user creation via `POST /api/v1/users`.
- Public user self-registration (users cannot sign up without an approved college registration).
- `ACADEMIC_STAFF` account login.
- `STUDENT` account login.
- Social authentication (Google, Microsoft).
- University SSO / SAML / LDAP integration.

## 2.2 Post-MVP Scope (Future Extensibility)

The following capabilities are architecturally accommodated but deferred to post-MVP releases:
- **Subscription-Based Self-Service Onboarding (Option C):** Automated plan selection, payment gateway integration (Stripe/Razorpay), and instant self-service tenant provisioning.
- `ACADEMIC_STAFF` user login and delegated departmental role authorization.
- `STUDENT` user authentication, personal credentials, and self-service access.
- Provisioning of staff accounts and student login accounts by `COLLEGE_ADMIN`.
- Enterprise Single Sign-On (Google Workspace, Microsoft Entra ID).
- University SAML/LDAP SSO integrations.
- Multi-factor authentication (MFA / TOTP).
- Passkeys / WebAuthn.

---

# 3. Actors

Acadlytic's authentication and onboarding system distinguishes between active MVP actors and future post-MVP actors:

| Actor | Lifecycle Phase | Authentication / Interaction Mechanism | Role Scope |
|---|---|---|---|
| **`SUPER_ADMIN`** | **MVP (Active)** | Email + Password | Platform Scope (Platform Owner & Operator) |
| **`COLLEGE_ADMIN`** | **MVP (Active)** | Email + Password (Activated post-approval) | College Tenant Scope (`college_id`) |
| **`ACADEMIC_STAFF`** | **POST-MVP** | Email + Password | College Tenant Scope (`college_id`) |
| **`STUDENT`** | **POST-MVP** | Email/Identifier + Password | Self-Service Scope (`/me`) |
| **Prospective College / Applicant** | **MVP & Post-MVP** | Public Registration Submission | Public Onboarding Scope (`/register-college`) |
| **Public Visitor** | MVP & Post-MVP | None | Public routes only (Login, Forgot Password) |

> [!IMPORTANT]
> **Student Records vs. Student User Accounts:**  
> In the MVP, student academic records exist in the database and are managed by `COLLEGE_ADMIN`. However, students do **not** have login credentials or user accounts in the `users` table during the MVP.

---

# 4. Core Concepts

## 4.1 User Entity

A user represents an authenticated identity within Acadlytic.

Core attributes:
- `id` (BIGINT, auto-increment primary key)
- `college_id` (BIGINT, nullable for `SUPER_ADMIN`, mandatory for `COLLEGE_ADMIN`)
- `email` (VARCHAR, normalized, unique across the platform)
- `password_hash` (VARCHAR, BCrypt/Argon2 hash)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role` (ENUM: `SUPER_ADMIN`, `COLLEGE_ADMIN`, `ACADEMIC_STAFF`, `STUDENT`)
- `status` (ENUM: `ACTIVE`, `INACTIVE`, `SUSPENDED`)
- `failed_login_attempts` (INT, default 0)
- `locked_until` (TIMESTAMP, nullable)
- `last_login_at` (TIMESTAMP, nullable)
- `created_at` / `updated_at` (TIMESTAMP, UTC)

## 4.2 Role Enumeration

The role system is defined to be future-proof:

```java
public enum Role {
    SUPER_ADMIN,     // Active in MVP
    COLLEGE_ADMIN,   // Active in MVP
    ACADEMIC_STAFF,  // Post-MVP
    STUDENT          // Post-MVP
}
```

In the MVP, only `SUPER_ADMIN` and `COLLEGE_ADMIN` accounts can be provisioned and authenticated. If an account with `ACADEMIC_STAFF` or `STUDENT` attempts to authenticate, the system rejects the request with a clear configuration message or treats it as unauthorized.

## 4.3 Tenant Isolation Boundary

In Acadlytic, the **College** is the primary tenant boundary:

```text
Platform Scope
      │
SUPER_ADMIN (Platform Owner)
      │
      ├───────────────────────────────┐
      ↓                               ↓
College Tenant A (college_id: 1)     College Tenant B (college_id: 2)
      │                               │
COLLEGE_ADMIN A                      COLLEGE_ADMIN B
```

- Every `COLLEGE_ADMIN` account is strictly bound to its assigned `college_id`.
- The backend resolves the tenant context exclusively from the verified token/session.
- Tenant isolation must be enforced on every database query and service operation.

## 4.4 Account Lifecycle States

- `ACTIVE`: The account is active; authentication is allowed.
- `INACTIVE`: The account has been deactivated; login is rejected.
- `SUSPENDED`: The account is locked due to security policy or administrator action; login is rejected.

## 4.5 Architectural Entities: Application vs. Tenant vs. User Identity

To ensure strict tenant security and clean domain boundaries, the system explicitly separates:

1. **College Registration Application (`college_registrations`):**
   - An unapproved prospective institution intake record.
   - Captures college name, requested code, university affiliation, contact information, and proposed administrator details.
   - Governed by lifecycle states: `PENDING`, `APPROVED`, `REJECTED`.
   - Confers **zero** authentication or tenant access permissions.
2. **Approved College Tenant (`colleges`):**
   - A verified institutional customer account created exclusively upon `SUPER_ADMIN` approval.
   - Assigned a persistent `college_id` and unique `code`.
   - Holds operational status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
   - Serves as the authoritative multi-tenant boundary for all academic data.
3. **Authenticated College Administrator User (`users`):**
   - The user account established when the proposed administrator activates their account post-approval.
   - Possesses role `COLLEGE_ADMIN` and an immutable foreign-key link to the approved `college_id`.
   - Never created manually by `SUPER_ADMIN`; activated by the college administrator via secure token.

---

# 5. College Onboarding & Account Provisioning Model

Acadlytic operates as a multi-tenant SaaS platform where colleges are customers. Controlled SaaS onboarding replaces manual user provisioning.

### 5.1 MVP Onboarding Flow — Option A: College Registration & Approval

Option A is the authoritative onboarding workflow for the MVP:

```text
Prospective College (Customer / Tenant)
     │
     ▼ 1. Visits Public Portal & Navigates to /register-college
Submits Public Registration Application (POST /api/v1/college-registrations)
(Institution Profile + Proposed Administrator Details)
     │
     ▼ 2. Application Stored in Database
Stored with status = PENDING
[No user account or college tenant created yet]
     │
     ▼ 3. SUPER_ADMIN Login & Review
SUPER_ADMIN logs in -> Reviews pending applications queue (/admin/registrations)
     │
     ├───────────────────────────────────────────────┐
     ▼                                               ▼
[REJECT APPLICATION]                            [APPROVE APPLICATION]
POST .../{id}/reject                            POST .../{id}/approve
     │                                               │
     ▼                                               ▼
Status = REJECTED                               Status = APPROVED
Reason captured for audit                       1. College tenant created (colleges table)
Registration remains inaccessible               2. Secure, time-limited activation token issued
Zero tenant access granted                      3. Activation link emailed to administrator
                                                     │
                                                     ▼ 4. Account Activation
                                                Administrator opens /activate-account?token=...
                                                Submits password & profile (POST /api/v1/auth/activate-account)
                                                     │
                                                     ▼ 5. User Account Established
                                                Active record created in users table:
                                                - role = COLLEGE_ADMIN
                                                - college_id = approved college_id
                                                - status = ACTIVE
                                                     │
                                                     ▼ 6. Login & Operation
                                                COLLEGE_ADMIN logs in via /auth/login
                                                Redirected to /college/dashboard
```

#### Detailed Step Breakdown:
1. **Public Application Submission:** A representative of a prospective college visits the public site and fills the college registration form. The submission includes institution name, proposed college code, university affiliation, address, official website, and designated administrator contact details (name, official email, phone, designation).
2. **Pending Queue:** The application is persisted in `college_registrations` with status `PENDING`. No tenant records or user credentials are created.
3. **Platform Administrative Review:** `SUPER_ADMIN` inspects the application in the administration dashboard (`GET /api/v1/college-registrations/{id}`).
4. **Approval / Rejection Decision:**
   - **If Rejected:** `SUPER_ADMIN` submits `POST /api/v1/college-registrations/{id}/reject` with a mandatory rejection explanation. The application transitions to `REJECTED`. The institution receives no tenant access.
   - **If Approved:** `SUPER_ADMIN` submits `POST /api/v1/college-registrations/{id}/approve`. The application transitions to `APPROVED`. The system atomically creates a new record in `colleges` with a generated `college_id` and operational status `ACTIVE`.
5. **Administrator Account Activation:**
   - The system generates a cryptographically secure, time-limited (e.g., 48 hours), single-use activation token.
   - The proposed administrator receives an invitation link (`/activate-account?token={token}`).
   - The administrator accesses the page, confirms their institutional identity, and establishes their password.
   - Upon submission (`POST /api/v1/auth/activate-account`), the backend verifies the token, hashes the password with BCrypt, creates the `COLLEGE_ADMIN` user in the `users` table bound strictly to the approved `college_id`, invalidates the token, and emits an activation audit event.
6. **Authenticated Operations:** The newly activated `COLLEGE_ADMIN` logs in via `POST /api/v1/auth/login` and begins collegiate operations.

---

### 5.2 Post-MVP Onboarding — Option C: Subscription-Based Self-Service

Option C is designed as an architectural extension for post-MVP commercial scaling:

```text
Prospective College
     │
     ▼ 1. Visits Public Pricing Page (/pricing)
Selects Subscription Plan (Starter / Growth / Enterprise)
     │
     ▼ 2. Payment Processing
Completes checkout via integrated Payment Gateway (e.g., Stripe / Razorpay)
Payment webhook confirms transaction
     │
     ▼ 3. Automated Tenant & Admin Provisioning
Platform automatically creates college record in colleges table
Administrator completes immediate credential setup
     │
     ▼ 4. Instant College Access
COLLEGE_ADMIN accesses dashboard; subscription plan limits enforced
```

#### Future Capabilities:
- Tiered subscription plan management (record limits, feature toggles).
- Commercial payment gateway checkout & webhook reconciliation.
- Automated recurring billing, invoices, upgrades, downgrades, and cancellations.
- Instant, zero-touch tenant onboarding without manual `SUPER_ADMIN` review.

---

### 5.3 Provisioning Permissions Matrix

| Actor | MVP Capability | Post-MVP Capability |
|---|---|---|
| **Public Visitor / Prospective College** | Submit College Registration Application (`Option A`) | Submit Registration (`Option A`) or Purchase Subscription (`Option C`) |
| **`SUPER_ADMIN`** | Review, Approve, or Reject College Registration Applications; activate/suspend college tenants | Same + Subscription & Plan Management |
| **`COLLEGE_ADMIN`** | Activate own account post-approval; manage student academic records (no user credentials) | Provision `ACADEMIC_STAFF` accounts; provision `STUDENT` user accounts |
| **`ACADEMIC_STAFF`** | *Role not active in MVP* | Provision `STUDENT` accounts where delegated |
| **`STUDENT`** | *Role not active in MVP* | None (Self-service only) |

---

### 5.4 Mandatory Onboarding & Provisioning Rules

1. **Public College Registration is Allowed:** Prospective institutions may freely submit applications via `/register-college`.
2. **Public User Self-Registration is FORBIDDEN:** General visitors cannot register standalone user accounts. All accounts must be tied to an approved college tenant.
3. **Separation of Registration and Authentication:** College registration and user authentication are entirely distinct domain models. Submitting an application does not create a user session or user identity.
4. **No Unauthorized Access for Pending/Rejected Colleges:** A pending, rejected, or inactive college registration has no tenant presence in `colleges` and zero access to protected collegiate APIs.
5. **No Active Admin Before Approval:** A college cannot obtain an active `COLLEGE_ADMIN` account before explicit platform approval.
6. **No Manual User Provisioning by Super Admin:** `SUPER_ADMIN` approves or rejects college registration applications; `SUPER_ADMIN` does not manually invent, create, or manage passwords for individual college administrator accounts.
7. **Strict Tenant Association:** Every `COLLEGE_ADMIN` must be bound exclusively to the approved `college_id` of their college.
8. **Email Normalization & Uniqueness:** Administrator emails are trimmed, lowercased, and checked for uniqueness across all active users and pending registrations.
9. **Never Trust Client-Supplied Roles or Tenants:** The backend must never accept `role`, `college_id`, or `status` parameters from untrusted client requests.
10. **Privilege Escalation Protection:** Public registration forms cannot specify user roles or grant `SUPER_ADMIN` permissions.
11. **Student Records $\neq$ User Accounts:** In the MVP, student records created in Student Management (`POST /api/v1/students`) exist solely as academic domain data and do not generate user credentials or entries in `users`.

---

# 6. Authentication & Onboarding Flows

## 6.1 College Registration, Approval & Administrator Activation Flow

```text
Prospective College (Applicant)      SUPER_ADMIN (Platform Owner)        Server / Database
               │                                   │                            │
               │ 1. POST /api/v1/college-registrations                         │
               │    { institutionProfile, proposedAdminContact }                │
               │───────────────────────────────────────────────────────────────►│
               │                                   │                            │ 2. Validate format & uniqueness
               │                                   │                            │ 3. Save as PENDING (college_registrations)
               │                                   │                            │    [Zero tenant or user created]
               │ 201 Created { id, status: "PENDING" }                         │
               │◄───────────────────────────────────────────────────────────────│
               │                                   │                            │
               │                                   │ 4. GET /api/v1/college-registrations (Queue)
               │                                   │◄───────────────────────────│
               │                                   │ 5. Inspect application details
               │                                   │                            │
               │                                   │ 6. POST .../{id}/approve (or /reject)
               │                                   │───────────────────────────►│
               │                                   │                            │ 7. If Reject: status = REJECTED, audit reason
               │                                   │                            │ 8. If Approve: status = APPROVED
               │                                   │                            │    - Create tenant in colleges (college_id)
               │                                   │                            │    - Issue secure activation token
               │                                   │ 200 OK { collegeId, status }│
               │                                   │◄───────────────────────────│
               │                                   │                            │
Designated Administrator                           │                            │
               │                                   │                            │
               │ 9. Receives activation email with invitation link              │
               │◄───────────────────────────────────────────────────────────────│
               │                                   │                            │
               │ 10. Navigates to /activate-account?token={token}               │
               │ 11. POST /api/v1/auth/activate-account { token, password }     │
               │───────────────────────────────────────────────────────────────►│
               │                                   │                            │ 12. Validate token & non-expiry
               │                                   │                            │ 13. BCrypt hash password
               │                                   │                            │ 14. Create user in users:
               │                                   │                            │     - role = COLLEGE_ADMIN
               │                                   │                            │     - college_id = approved college_id
               │                                   │                            │     - status = ACTIVE
               │                                   │                            │ 15. Invalidate activation token
               │                                   │                            │ 16. Record ACTIVATION audit event
               │ 200 OK { message: "Account successfully activated." }          │
               │◄───────────────────────────────────────────────────────────────│
               │                                   │                            │
               ▼                                   │                            │
Proceeds to Login (/auth/login)                    │                            │
```

## 6.2 User Login Flow

```text
Client (Browser)                                    Server (Spring Boot)
      │                                                      │
      │ 1. POST /api/v1/auth/login {email, password}         │
      │─────────────────────────────────────────────────────►│
      │                                                      │ 2. Validate input format
      │                                                      │ 3. Normalize email
      │                                                      │ 4. Check brute-force lockout
      │                                                      │ 5. Find user by email
      │                                                      │ 6. Verify role (SUPER_ADMIN or COLLEGE_ADMIN)
      │                                                      │ 7. Check account status == ACTIVE
      │                                                      │ 8. Verify password hash (BCrypt)
      │                                                      │ 9. Reset failed_login_attempts
      │                                                      │ 10. Generate session / JWT token
      │                                                      │ 11. Record LOGIN_SUCCESS audit event
      │                                                      │
      │ 200 OK { token/session, user: { id, role, collegeId} }│
      │◄─────────────────────────────────────────────────────│
      │                                                      │
      ▼                                                      ▼
Redirect to Authorized Dashboard
(/admin/dashboard or /college/dashboard)
```

## 6.3 Authentication Failure Handling

- If the user does not exist or the password is incorrect, return `401 Unauthorized` with a generic message:
  ```json
  {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
  ```
- Increment `failed_login_attempts`.
- If `failed_login_attempts >= MAX_ATTEMPTS` (default: 5), set `locked_until = now() + 15 minutes` and record `ACCOUNT_LOCKED` audit event.
- Return `429 Too Many Requests` or `401 Unauthorized` indicating temporary lockout.

## 6.4 Logout Flow

- `POST /api/v1/auth/logout` invalidates the active session or JWT refresh token on the server.
- The client clears stored tokens and redirects to `/auth/login`.

## 6.5 Current User Inquiry (`/auth/me`)

- `GET /api/v1/auth/me` validates the token/session and returns:
  ```json
  {
    "id": 101,
    "email": "admin@examplecollege.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "COLLEGE_ADMIN",
    "collegeId": 5,
    "status": "ACTIVE"
  }
  ```
- If the token is invalid or expired, return `401 Unauthorized`.

---

# 7. Role Permissions & Authorization Rules

## 7.1 SUPER_ADMIN Permissions (MVP)

- Review pending college registration applications (`GET /api/v1/college-registrations`, `GET /api/v1/college-registrations/{id}`).
- Approve or reject college registrations (`POST /api/v1/college-registrations/{id}/approve`, `POST /api/v1/college-registrations/{id}/reject`).
- Manage college tenants (`/api/v1/colleges/**`): View list, view profile, update administrative metadata, activate, suspend.
- Manage platform master data (Universities).
- View platform system health and security audit logs.
- Does not manually provision individual `COLLEGE_ADMIN` accounts; accounts are activated post-approval by the college administrator.
- Cannot perform routine college-internal exam result imports or edits unless explicitly authorized for platform support.

## 7.2 COLLEGE_ADMIN Permissions (MVP)

- Manage own college profile (`GET /api/v1/colleges/my-college`, `PUT`).
- Manage college academic structure (`/api/v1/academic/**`): Programs, semesters, subjects.
- Manage student records (`/api/v1/students/**`): Create, view, update, search, filter.
- Manage result imports (`/api/v1/result-imports/**`): Upload files, review validation, resolve errors.
- Execute result processing (`POST /api/v1/result-imports/{id}/process`).
- Manage backlog tracking (`/api/v1/backlogs/**`).
- View student Academic Passports (`/api/v1/students/{id}/passport`).
- View college academic analytics (`/api/v1/analytics/**`).
- Strictly isolated to `college_id`: Cannot access or query resources from any other college.

## 7.3 ACADEMIC_STAFF Permissions (POST-MVP Extension)

- Will perform delegated student record maintenance, result file uploads, and departmental reviews.
- Role checks must be structured so this role can be enabled via permission configuration without refactoring controllers.

## 7.4 STUDENT Permissions (POST-MVP Extension)

- Will authenticate to personal self-service portal via `/api/v1/me/**`.
- Will view own Academic Passport, results, backlogs, and individual analytics.
- Will be strictly prohibited from modifying authoritative academic results.

---

# 8. Password Management & Recovery

## 8.1 Password Policy
- Minimum length: 8 characters.
- Must contain at least one uppercase letter, one lowercase letter, and one number.
- Plaintext password must never be stored, logged, or serialized in API responses.

## 8.2 Password Change
- Endpoint: `POST /api/v1/auth/change-password`
- Requires `currentPassword` and `newPassword`.
- Re-authenticates the current password before updating to the new password hash.

## 8.3 Forgot Password & Reset
1. `POST /api/v1/auth/forgot-password { "email": "user@example.com" }`
   - Always returns `200 OK` with generic feedback: *"If an active account exists, reset instructions have been issued."*
   - Generates a cryptographically random, time-limited (1 hour), single-use token.
2. `POST /api/v1/auth/reset-password { "token": "xyz", "newPassword": "secret" }`
   - Validates token existence, expiration, and non-use.
   - Updates password hash, invalidates token, and invalidates active sessions.

---

# 9. Tenant Isolation Architecture

Tenant isolation is enforced strictly on the backend:

```java
// Conceptual Spring Security Service Scoping
public List<StudentResponse> getStudents(Long collegeId, Pageable pageable) {
    Long authCollegeId = SecurityUtils.getCurrentUserCollegeId();
    if (!authCollegeId.equals(collegeId)) {
        throw new AccessDeniedException("Cross-tenant access prohibited.");
    }
    return studentRepository.findAllByCollegeId(authCollegeId, pageable);
}
```

The system rejects any request where a `COLLEGE_ADMIN` attempts to query, update, or reference entities belonging to a different `college_id`.

---

# 10. Security Audit Logging

The authentication and onboarding module records immutable audit events:

| Event Type | Trigger | Captured Metadata |
|---|---|---|
| `COLLEGE_REGISTRATION_SUBMITTED` | Prospective college submits registration | Registration ID, Institution Name, Proposed Code, Admin Email, IP, Timestamp |
| `COLLEGE_REGISTRATION_APPROVED`  | SUPER_ADMIN approves college application | Registration ID, Approver User ID, Generated College ID, Timestamp |
| `COLLEGE_REGISTRATION_REJECTED`  | SUPER_ADMIN rejects college application | Registration ID, Approver User ID, Rejection Reason, Timestamp |
| `COLLEGE_ADMIN_ACTIVATED`        | Administrator completes token activation | User ID, Role (`COLLEGE_ADMIN`), College ID, IP, Timestamp |
| `LOGIN_SUCCESS`                  | Successful authentication | User ID, Role, College ID, IP, Timestamp |
| `LOGIN_FAILURE`                  | Invalid credentials | Submitted email, Reason, IP, Timestamp |
| `ACCOUNT_LOCKED`                 | Failed attempts threshold met | User ID, Lockout duration, IP, Timestamp |
| `LOGOUT`                         | User session terminated | User ID, Timestamp |
| `PASSWORD_CHANGED`               | Password successfully updated | User ID, Timestamp |
| `PASSWORD_RESET_REQ`             | Reset token issued | User ID, Timestamp |
| `PASSWORD_RESET_DONE`            | Reset completed | User ID, Timestamp |

Passwords, reset tokens, activation tokens, and session keys are **strictly excluded** from audit logs.

---

# 11. Frontend Route Guard Architecture

The React frontend organizes routes by authentication, onboarding, and role requirements:

```text
/register-college            -> Public (College registration application form)
/registration-success        -> Public (Application submission confirmation)
/activate-account            -> Public with token (Administrator password setup)
/auth/login                  -> Public (redirects to dashboard if already authenticated)
/auth/forgot-password        -> Public
/auth/reset-password         -> Public

/admin/*                     -> Protected: requires SUPER_ADMIN
  ├── /admin/dashboard       -> Platform overview
  ├── /admin/registrations   -> College registration applications queue (Review, Approve, Reject)
  ├── /admin/registrations/:id -> Application detail inspection
  └── /admin/colleges        -> Active college tenant management

/college/*                   -> Protected: requires COLLEGE_ADMIN (bound to college_id)
  ├── /college/dashboard
  ├── /college/academic
  ├── /college/students
  ├── /college/results/import
  ├── /college/backlogs
  ├── /college/passports
  └── /college/analytics

/student/*                   -> Deferred (POST-MVP)
```

Frontend route guards intercept navigation and verify user authentication state. Unauthorized navigation redirects to `/auth/login` or an Access Denied view.

---

# 12. Acceptance Criteria & Test Scenarios

### AC-01 — Successful Two-Role Login
- `SUPER_ADMIN` logs in and receives platform administrative context.
- `COLLEGE_ADMIN` logs in and receives college-scoped context with valid `college_id`.

### AC-02 — Rejection of Deferred Roles
- Attempted login by any account not possessing `SUPER_ADMIN` or `COLLEGE_ADMIN` role is rejected.

### AC-03 — Cross-Tenant Access Rejection
- `COLLEGE_ADMIN` for College A attempting to access College B data receives `403 Forbidden`.

### AC-04 — Public College Registration Submission
- Prospective college submits registration via `/register-college` (`POST /api/v1/college-registrations`).
- Application is persisted with `PENDING` status; duplicate college codes or active emails return `409 Conflict`.
- No user credentials or active college tenant records are created at this stage.

### AC-05 — SUPER_ADMIN Registration Review, Approval & Rejection
- `SUPER_ADMIN` reviews pending queue.
- If rejected (`POST .../reject`), application status is updated to `REJECTED`, formal reason is captured, and no tenant access is granted.
- If approved (`POST .../approve`), application status is updated to `APPROVED`, college tenant record is provisioned in `colleges`, and an activation token is generated.

### AC-06 — College Administrator Account Activation
- Designated administrator opens `/activate-account?token=...` and establishes password.
- Submitting `POST /api/v1/auth/activate-account` creates active `users` entry with `COLLEGE_ADMIN` role linked strictly to the approved `college_id`.
- The activation token is invalidated and cannot be reused.
- `COLLEGE_ADMIN` can now log in via `/auth/login`.

### AC-07 — Inaccessibility for Pending or Rejected Colleges
- A pending or rejected college registration cannot authenticate or access protected college endpoints.

### AC-08 — Brute-Force Lockout
- 5 consecutive failed logins lock the account for 15 minutes.

### AC-09 — Student Records Distinction
- Creating a student record in the Student Management module does not create an entry in the `users` table and does not enable student login.

---

# 13. Definition of Done for Authentication

The Authentication module is implementation-ready and verified when:
- [x] Only `SUPER_ADMIN` and `COLLEGE_ADMIN` are active in MVP.
- [x] `ACADEMIC_STAFF` and `STUDENT` are documented as future role extensions.
- [x] Option A (College Registration & Approval) is fully specified as the MVP onboarding mechanism.
- [x] `SUPER_ADMIN` reviews, approves, or rejects college registrations without manually creating individual administrator accounts.
- [x] Designated administrator account activation via secure token is defined.
- [x] `COLLEGE_ADMIN` is strictly scoped to their assigned `college_id`.
- [x] Pending or rejected colleges are strictly prevented from accessing protected operations.
- [x] Secure password hashing, brute-force protection, and audit logging are specified.
- [x] Public user self-registration is explicitly disabled for MVP; public college registration is enabled.
- [x] Student academic records remain separate from user login credentials.
