# Authentication Implementation

**Document:** `09-development/implementation-notes/authentication-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Authentication & User Provisioning  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, Security Reviewers, QA Engineers, AI Coding Assistants

---

# 1. Purpose

This document defines the implementation foundation for authentication and account provisioning in Acadlytic.

It translates the existing authentication feature specification into concrete implementation guidance for:

- user accounts
- login
- logout
- current-user context
- account provisioning
- roles
- tenant association
- authorization foundation
- protected routes
- password management
- account status
- failed-login protection
- security events
- auditability
- frontend authentication state
- backend security configuration

This document covers the authentication foundation required before implementing most protected application features.

---

# 2. Authentication & Onboarding Scope

The MVP authentication and onboarding system must support:

- college registration application intake (Option A Onboarding)
- registration status lifecycle (`PENDING`, `APPROVED`, `REJECTED`)
- platform administrative review queue for `SUPER_ADMIN`
- registration approval and rejection operations
- automated college tenant initialization upon approval
- token-based college administrator account activation
- login
- logout
- current authenticated user context (`/me`)
- role-based authorization foundation (`SUPER_ADMIN`, `COLLEGE_ADMIN`)
- tenant/college context binding (`college_id`)
- account status enforcement (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
- password setup, change, and token-based reset
- failed-login protection (lockout after threshold)
- protected backend APIs
- protected frontend routes
- security and onboarding audit events
- strict tenant isolation

### Key Scope Boundary:
- **Public College Registration is ENABLED:** Prospective colleges can submit an onboarding application.
- **Public User Self-Registration is DISABLED:** Individual users cannot create unattached accounts.
- **SUPER_ADMIN Manual User Provisioning is REMOVED:** `SUPER_ADMIN` approves college applications; the college's designated administrator activates their own account and establishes credentials.

---

# 3. Authentication Actors

Acadlytic supports the following actors across its lifecycle:

```text
SUPER_ADMIN                      (MVP Active: Platform Owner & Operator)
COLLEGE_ADMIN                    (MVP Active: Approved College Administrator)
ACADEMIC_STAFF                   (Post-MVP: Delegated Departmental Staff)
STUDENT                          (Post-MVP: Authenticated Student Self-Service)
Prospective College / Applicant  (MVP Active: Public Onboarding via /register-college)
```

Public visitors are not authenticated application users.

---

# 4. Authentication vs Authorization vs Onboarding

These concerns must remain separate architectural boundaries.

### Authentication

Answers:

> Who is this user?

Examples:

- login
- password verification
- session/token validation
- current-user retrieval

### Authorization

Answers:

> What is this authenticated user allowed to do?

Examples:

- role checks
- permission checks
- tenant checks
- resource ownership checks

### College Onboarding & Account Provisioning

Answers:

> How does a customer tenant and application identity enter the system?

MVP Workflow (Option A):

- Prospective College submits public registration application
- Super Admin reviews and approves/rejects the application
- Designated Administrator activates account via secure token and sets password

Post-MVP Extensions:

- Option C: Self-service plan purchase and automated instant provisioning
- College Admin provisions Academic Staff accounts
- College Admin provisions Student user accounts linked to academic records

---

# 5. Account Creation & Onboarding Model

General public user self-registration is strictly disabled in the MVP.

Customer onboarding and account establishment follow **Option A: College Registration & Approval**:

```text
Prospective College (Customer / Tenant)
       │
       ▼ Public Registration Form (/register-college)
Submits College Registration Application (POST /api/v1/college-registrations)
(Institution Profile + Designated Administrator Contact)
       │
       ▼ Stored in Database
Application Stored with status = PENDING
[No tenant record or user credentials created yet]
       │
       ▼ Review by SUPER_ADMIN (/admin/registrations)
SUPER_ADMIN Reviews Pending Queue
       │
       ├──────────────────────────────────────────────┐
       ▼                                              ▼
[REJECT APPLICATION]                             [APPROVE APPLICATION]
POST .../{id}/reject                             POST .../{id}/approve
       │                                              │
       ▼                                              ▼
Status = REJECTED                                Status = APPROVED
Rejection reason captured                        1. College tenant created (colleges table)
Registration remains inaccessible                2. Secure activation token generated
Zero tenant access granted                       3. Invitation delivered to administrator
                                                      │
                                                      ▼ Administrator Sets Credentials
                                                 Opens /activate-account?token=...
                                                 Submits POST /api/v1/auth/activate-account
                                                      │
                                                      ▼ Account Created & Bound
                                                 User record created in users table:
                                                 - role = COLLEGE_ADMIN
                                                 - college_id = approved college_id
                                                 - status = ACTIVE
                                                      │
                                                      ▼ Active Operations
                                                 COLLEGE_ADMIN logs in (/auth/login)
                                                 Redirected to /college/dashboard
```

### Post-MVP Account Provisioning:
In Post-MVP phases:
1. **Option C Onboarding:** Colleges purchase subscription plans via payment gateway, triggering automated tenant and administrator provisioning without manual review.
2. **Staff Provisioning:** `COLLEGE_ADMIN` creates `ACADEMIC_STAFF` accounts within their college.
3. **Student Account Provisioning:** `COLLEGE_ADMIN` or authorized staff provisions `STUDENT` login accounts linked to existing student records.

The following users cannot create accounts:

```text
STUDENT
PUBLIC VISITOR
```

---

# 6. Account Provisioning Principle

Establishing a tenant or user account must validate:

- application status (must be `APPROVED` before user activation)
- activation token validity and non-expiration
- creator/approver identity and authority
- target role (strictly `COLLEGE_ADMIN` for approved college administrators in MVP)
- tenant context binding (`college_id`)
- email normalization and platform-wide uniqueness
- required profile and institutional data
- account status initialization (`ACTIVE`)
- password strength policy
- audit requirements (registration submission, approval/rejection, account activation)

The frontend must not be allowed to bypass these checks.

---

# 7. User and College Lifecycle

### College Registration Lifecycle:
```text
Application Submitted (PENDING)
       │
       ├── SUPER_ADMIN Rejection ──→ REJECTED (Reason captured; zero access)
       │
       └── SUPER_ADMIN Approval  ──→ APPROVED
                                         │
                                         ▼
                                     College Tenant Created (colleges table)
                                     Status = ACTIVE (or SUSPENDED / INACTIVE by Admin)
```

### User Account Lifecycle:
```text
Activation Token Issued (Pending Activation)
       │
       ▼ Token Validated & Password Established
ACTIVE
       │
       ├── Administrative Deactivation ──→ INACTIVE
       │
       └── Security / Lockout Policy   ──→ SUSPENDED
```

The persisted status values must remain consistent with the database schema design.

---

# 8. User Identity

A user should have a stable database identifier.

Conceptually:

```text
users
├── id
├── email
├── password_hash
├── role
├── college_id
├── status
├── created_at
└── updated_at
```

This is conceptual only. The final schema must be implemented through the database migration strategy.

---

# 9. Email Identity

Email should be treated as a login identity where the authentication design uses email login.

Requirements:

- normalize email consistently
- enforce appropriate uniqueness
- avoid duplicate active identities
- prevent accidental whitespace variations
- validate format

The final case-normalization policy must be standardized.

---

# 10. Password Storage

Passwords must never be stored in plaintext.

The database should contain only a secure password hash.

Conceptually:

```text
User Password
      ↓
Password Hashing
      ↓
password_hash
```

Password hashes must never be returned through an API.

---

# 11. Password Hashing

The backend security implementation should use a modern password hashing mechanism supported by Spring Security.

The selected hashing configuration must:

- use a strong adaptive password hashing algorithm
- use an appropriate work factor
- support secure password verification
- allow future work-factor upgrades

The exact encoder configuration is an implementation decision.

---

# 12. Spring Security Foundation

Spring Security should be the primary backend security framework.

The security layer should provide:

- authentication
- request authorization
- password verification
- security context
- protected endpoints
- authentication failure handling
- logout handling
- security headers where appropriate
- session/token integration

The exact authentication mechanism remains an unresolved implementation decision.

---

# 13. Authentication Mechanism

The final authentication/session strategy must be selected before production implementation.

Possible approaches include:

### Session-Based Authentication

```text
Browser
 ↓
Login
 ↓
Server Session
 ↓
Secure Session Cookie
```

### Token-Based Authentication

```text
Browser
 ↓
Login
 ↓
Access Token / Session Strategy
 ↓
Authenticated API Requests
```

The project should choose one coherent strategy.

Do not mix authentication models unnecessarily.

---

# 14. Authentication Recommendation Boundary

Regardless of the selected mechanism, the implementation must provide:

- secure authentication state
- secure logout
- expiration handling
- session invalidation where applicable
- protection against credential exposure
- backend authorization
- tenant isolation

The exact storage mechanism must be formally reviewed before implementation is marked `Approved`.

---

# 15. Login Flow

Conceptual login flow:

```text
User
 ↓
Login Form
 ↓
POST /api/v1/auth/login
 ↓
Validate Credentials
 ↓
Authenticate User
 ↓
Verify Account Status
 ↓
Establish Authentication State
 ↓
Return Safe User Context
 ↓
Frontend Loads /api/v1/me
 ↓
Application Dashboard
```

---

# 16. Login Request

The login request should contain only the information required for authentication.

Conceptually:

```text
POST /api/v1/auth/login
```

Request:

```text
{
  "email": "user@example.com",
  "password": "..."
}
```

The exact request DTO must be defined in the API implementation.

---

# 17. Login Response

The login response must never expose:

- password
- password hash
- internal security credentials
- unnecessary sensitive user data

The response should provide only what the frontend requires to establish the authenticated application state.

The exact response depends on the final authentication mechanism.

---

# 18. Current User

The frontend should retrieve authenticated user information through:

```text
GET /api/v1/me
```

The response may contain:

```text
id
name
email
role
college
status
```

The exact DTO must be defined by the backend API contract.

---

# 19. Current User Purpose

`/me` provides the frontend with the authoritative authenticated context.

It should support:

- role-aware navigation
- tenant context
- profile display
- protected route behavior
- permission-aware UI

The frontend should not reconstruct the current user from arbitrary local values.

---

# 20. Logout

Logout should invalidate the authentication state according to the selected authentication mechanism.

Endpoint:

```text
POST /api/v1/auth/logout
```

The operation should:

- invalidate session/token state where applicable
- clear server-side authentication state where required
- clear client authentication state
- return the user to the login/public area

---

# 21. Frontend Logout

The frontend should:

1. request logout
2. clear relevant client state
3. invalidate authenticated queries
4. clear user context
5. redirect to login/public route

The frontend must not assume that simply deleting a local value is sufficient to log out securely.

---

# 22. Authentication State

The frontend should distinguish:

```text
UNKNOWN
AUTHENTICATED
UNAUTHENTICATED
```

Conceptually:

```text
Application Start
      ↓
Check Authentication
      ↓
Loading
      ↓
Authenticated ──→ Application
      │
      └──────────→ Unauthenticated ──→ Login
```

Avoid flashing protected application content before authentication state is resolved.

---

# 23. Protected Routes

Protected routes should be implemented centrally.

Conceptually:

```text
/app/*
   ↓
Authenticated?
   ├── No → /login
   └── Yes
        ↓
      Role/Permission
        ├── Allowed → Page
        └── Denied → Unauthorized
```

Frontend route protection is a UX boundary.

Backend authorization remains authoritative.

---

# 24. Backend Authorization

Every protected backend endpoint must independently verify authorization.

Never rely on:

```text
hidden frontend button
```

or:

```text
frontend route protection
```

as the security mechanism.

---

# 25. Role Hierarchy

Roles are:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

The implementation must not assume that role names alone define every permission.

Authorization should be based on explicit role/permission rules.

---

# 26. SUPER_ADMIN

`SUPER_ADMIN` operates at the platform level.

MVP capabilities include:

- manage colleges
- create College Admin accounts
- manage College Admin assignment
- view platform-level information permitted by the application
- manage platform-level configuration where defined

A Super Admin is not automatically allowed to perform every future feature.

Permissions must remain explicit.

---

# 27. COLLEGE_ADMIN

`COLLEGE_ADMIN` operates within an assigned college tenant.

Capabilities include:

- manage permitted college information
- create Academic Staff
- create Student accounts
- manage students
- manage academic workflows permitted by the role
- access authorized college analytics

A College Admin must not access another college's tenant data.

---

# 28. ACADEMIC_STAFF

`ACADEMIC_STAFF` operates within the assigned college.

Capabilities depend on the feature permission model.

Potential MVP capabilities include:

- student management where permitted
- result import workflows
- validation workflows
- processing workflows
- backlog workflows
- academic analytics where permitted
- student provisioning where explicitly allowed

The exact permission matrix must follow the authentication specification.

---

# 29. STUDENT

A student is restricted to self-service access.

Examples:

```text
/me
/me/dashboard
/me/results
/me/backlogs
/me/academic-passport
/me/analytics
/me/profile
```

A student must not gain access to another student's records by changing an identifier.

---

# 30. Tenant Context

Every college-scoped authenticated request must operate within the user's authorized tenant context.

Conceptually:

```text
Authenticated User
      ↓
User Role
      ↓
Assigned College
      ↓
Tenant Context
      ↓
Authorized Operation
```

The tenant context must be established by trusted backend authentication information.

It must not be trusted from arbitrary request parameters.

---

# 31. Tenant Context Security

The backend must not allow a user to simply submit:

```text
collegeId = anotherCollege
```

and thereby change their tenant.

Tenant context should come from authenticated identity and authorized relationships.

---

# 32. Tenant-Aware Queries

Tenant-scoped repository queries should ensure the college boundary is respected.

Conceptually:

```text
findStudent(studentId, collegeId)
```

is safer than:

```text
findStudent(studentId)
```

when the operation is college-scoped.

The exact repository pattern should follow backend architecture.

---

# 33. IDOR Prevention

Insecure:

```text
GET /api/v1/students/100
```

with only:

```text
studentId = 100
```

being checked.

Secure conceptual flow:

```text
Authenticated User
 ↓
Role
 ↓
College Context
 ↓
Student 100 belongs to authorized college?
 ↓
Permission
 ↓
Allow / Deny
```

Every resource identifier must be evaluated in its authorization context.

---

# 34. College Registration Intake API

Conceptual public onboarding endpoint:

```text
POST /api/v1/college-registrations
```

This endpoint is publicly accessible and accepts applications from prospective institutions.

Example conceptual request payload:

```json
{
  "collegeName": "St. Xavier Institute of Engineering",
  "collegeCode": "SXIE",
  "universityAffiliation": "University of Mumbai",
  "website": "https://www.sxie.edu.in",
  "address": {
    "street": "Mahim Causeway",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400016"
  },
  "contactPerson": {
    "firstName": "Dr. Rajesh",
    "lastName": "Sharma",
    "email": "principal@sxie.edu.in",
    "phone": "+919876543210",
    "designation": "Principal / Director"
  }
}
```

The backend must:
- validate required fields and email format
- normalize the proposed administrator email (lowercase, trim)
- verify email uniqueness across both `users` and pending `college_registrations`
- persist the application with status `PENDING`
- record an intake audit event (`COLLEGE_REGISTRATION_SUBMITTED`)
- return `201 Created` with a safe public tracking reference

The backend must **never** create a tenant record in `colleges` or a user account in `users` during public registration intake.

---

# 35. Target Role Validation

In the MVP, active user accounts enter the system **strictly through approved college onboarding**:

```text
Approved Registration
       ↓
Account Activation Token
       ↓
Target Role: COLLEGE_ADMIN (Bound to approved college_id)
```

Direct administrative user creation via `POST /api/v1/users` is not used in the MVP.

In Post-MVP phases, controlled delegation will support:

```text
COLLEGE_ADMIN → ACADEMIC_STAFF    Allowed (Post-MVP)
COLLEGE_ADMIN → STUDENT           Allowed (Post-MVP)
ACADEMIC_STAFF → STUDENT          Allowed where permitted (Post-MVP)
STUDENT → ANY                     Denied
PUBLIC VISITOR → ANY USER         Denied
```

The backend must reject any request attempting to create or activate a role not authorized for the current workflow.

---

# 36. Tenant Assignment During Provisioning

For all college-scoped accounts:

```text
COLLEGE_ADMIN
ACADEMIC_STAFF (Post-MVP)
STUDENT (Post-MVP)
```

the user must be permanently and securely bound to the verified `college_id`.

- In the MVP, the `college_id` is derived strictly from the `colleges` record created when `SUPER_ADMIN` approved the registration application.
- The administrator activation request cannot supply or modify `college_id`.
- The backend derives the tenant association from the validated, unexpired activation token.
- A user account can never belong to multiple colleges or change its tenant association via request parameters.

---

# 37. Super Admin Registration Review & Approval Workflow

`SUPER_ADMIN` oversees the onboarding pipeline through dedicated platform management endpoints:

```text
GET  /api/v1/college-registrations          (List pending/reviewed applications)
GET  /api/v1/college-registrations/{id}     (Inspect application details)
POST /api/v1/college-registrations/{id}/approve
POST /api/v1/college-registrations/{id}/reject
```

Conceptual approval flow:

```text
SUPER_ADMIN
    │
    ▼ Reviews application in /admin/registrations
Approves application (POST .../{id}/approve)
    │
    ▼ Transactional Execution:
1. Application status transitions PENDING → APPROVED
2. New tenant record created in colleges table (unique college_id assigned)
3. Cryptographically random, time-limited activation token generated
4. Email notification with activation link dispatched to proposed administrator
5. Audit event COLLEGE_REGISTRATION_APPROVED recorded
```

Conceptual rejection flow:

```text
SUPER_ADMIN
    │
    ▼ Rejects application (POST .../{id}/reject) with mandatory reason
1. Application status transitions PENDING → REJECTED
2. Rejection reason recorded in registration record
3. Audit event COLLEGE_REGISTRATION_REJECTED recorded
4. Zero tenant or user records created; institution has no access
```

`SUPER_ADMIN` does not manually create user accounts, set passwords, or manage credentials for individual colleges.

---

# 38. College Administrator Account Activation API

Conceptual activation endpoint:

```text
POST /api/v1/auth/activate-account
```

The designated administrator receives an invitation link with a secure token:
`https://app.acadlytic.com/activate-account?token=xyz...`

Example request payload:

```json
{
  "token": "4f9b2c8a1e...",
  "password": "SecurePassword123!"
}
```

The backend must:
1. Validate token existence, expiration, and single-use status.
2. Verify that the associated registration application is in `APPROVED` status.
3. Verify that the approved college tenant exists and is in `ACTIVE` status.
4. Validate that the password meets institutional complexity rules.
5. Hash the password with a strong hashing algorithm (BCrypt/Argon2).
6. Atomically insert the new user into the `users` table:
   - `email`: Normalized administrator email from registration
   - `password_hash`: Secure hash
   - `role`: `COLLEGE_ADMIN`
   - `college_id`: Approved tenant `college_id`
   - `status`: `ACTIVE`
7. Mark the activation token as used/invalidated.
8. Record the `COLLEGE_ADMIN_ACTIVATED` audit event.
9. Return a success response directing the administrator to login.

---

# 39. Student Academic Records vs. User Authentication Accounts

In the MVP, student management exists strictly as an administrative academic capability:

```text
COLLEGE_ADMIN
      ↓
Manages Student Academic Records (POST /api/v1/students)
(Roll numbers, programs, admission years, student profiles)
      ↓
Stored in students table
[Zero entries created in users table]
```

In Post-MVP phases:
- Existing student records will be linked to authentication credentials via a dedicated student provisioning workflow.
- Authentication identity (`users`) and academic identity (`students`) will remain distinct, referenced via foreign keys.
Student Profile
```

This separation is important because authentication identity and academic identity are different concepts.

---

# 40. User vs Student

Do not assume:

```text
users = students
```

Instead:

```text
User
 ↓
Authentication Identity

Student
 ↓
Academic Identity
```

A student account may reference a student record.

The exact relationship must be defined in the Student Management implementation.

---

# 41. Account Activation

Provisioned accounts may require activation or password setup.

Possible flow:

```text
Account Created
      ↓
Pending Activation
      ↓
Password Setup
      ↓
Active
```

The exact activation mechanism is an unresolved implementation decision.

---

# 42. Password Setup

If accounts are provisioned without an initial password, the system should provide a secure password setup mechanism.

The mechanism must use:

- time-limited setup credentials/token where applicable
- secure transport
- one-time or invalidated setup links
- expiration
- audit/security events

The exact implementation remains to be finalized.

---

# 43. Password Change

Authenticated users should be able to change their password.

Conceptual endpoint:

```text
PUT /api/v1/me/password
```

Request may include:

```text
{
  "currentPassword": "...",
  "newPassword": "..."
}
```

The backend must:

- authenticate the user
- verify current password where required
- validate the new password
- securely hash the new password
- invalidate relevant sessions/tokens if required
- record a security event

---

# 44. Password Reset

The MVP should support password reset if included in the authentication specification.

Conceptual flow:

```text
Forgot Password
      ↓
Submit Email
      ↓
Create Secure Reset Token
      ↓
Deliver Reset Mechanism
      ↓
Validate Token
      ↓
Set New Password
      ↓
Invalidate Token
      ↓
Complete
```

The system must not reveal whether an arbitrary email exists if that would create account enumeration risk.

---

# 45. Forgot Password Response

A secure forgot-password response should avoid confirming account existence.

For example, the frontend can display a generic message indicating that the request was received.

The exact wording is a UX decision.

---

# 46. Password Policy

The project must define a password policy.

At minimum it should establish:

- minimum length
- maximum practical length
- allowed characters
- common-password handling where appropriate
- password confirmation
- password reuse policy if required

Avoid overly restrictive rules that encourage users to choose weak predictable passwords.

The exact policy remains an implementation decision.

---

# 47. Failed Login Protection

The system should protect against repeated failed authentication attempts.

Possible controls:

- rate limiting
- progressive delays
- temporary account lock
- IP-based controls where appropriate
- security event logging

The exact mechanism must be selected based on deployment and threat model.

---

# 48. Failed Login Event

A failed login attempt may generate a security event containing information such as:

```text
event_type
timestamp
identifier
source/request context
reason category
```

Do not store plaintext passwords.

Do not log submitted passwords.

---

# 49. Account Status

Account status must be checked during authentication.

Conceptually:

```text
User Found
 ↓
Password Correct?
 ↓
Account Active?
 ↓
Authorized to Login?
```

Inactive/suspended users must not authenticate successfully.

---

# 50. Suspended Accounts

A suspended account should receive a controlled authentication failure.

The system should not expose unnecessary administrative details.

The frontend should display a safe, understandable message.

---

# 51. Session Expiration

The frontend must handle authentication expiration.

Possible behavior:

```text
API Request
 ↓
401 Unauthorized
 ↓
Authentication State Cleared
 ↓
Redirect to Login
```

The exact behavior depends on the selected authentication mechanism.

---

# 52. Concurrent Sessions

The project should define whether users may have:

- multiple active sessions
- one active session
- controlled session limits

This is an unresolved implementation decision.

If session management supports revocation, security-sensitive events should be auditable.

---

# 53. Security Headers

The backend security layer should configure appropriate HTTP security headers.

The exact configuration depends on:

- deployment
- frontend hosting
- CSP strategy
- authentication mechanism

Headers should be reviewed during the security phase.

---

# 54. CORS

Development may require:

```text
Frontend
http://localhost:5173

Backend
http://localhost:8080
```

CORS should explicitly permit the required development origin.

Production CORS must be restricted to trusted origins.

Never use unrestricted wildcard configuration in production where credentials/security require tighter control.

---

# 55. CSRF Considerations

CSRF protection requirements depend on the selected authentication mechanism.

If authentication relies on browser cookies, CSRF protection must be explicitly evaluated and implemented appropriately.

If a different mechanism is selected, its corresponding browser security model must be reviewed.

This decision must not be left implicit.

---

# 56. Authentication API Structure

Conceptual API structure:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

GET  /api/v1/me
PUT  /api/v1/me/profile
PUT  /api/v1/me/password

POST /api/v1/users
```

Additional endpoints may be introduced where required by account provisioning or administration.

---

# 57. Authentication Controller

Controllers should remain thin.

Example conceptual responsibilities:

```text
AuthController
 ├── receive request
 ├── validate DTO
 ├── call authentication service
 └── return response
```

Controllers should not contain:

- password hashing logic
- tenant business logic
- database queries
- authorization workflows

---

# 58. Authentication Service

The authentication service should coordinate:

- credential validation
- account status
- authentication
- session/token establishment
- current-user context
- security events

The exact service structure should follow the backend foundation.

---

# 59. User Provisioning Service

Account provisioning should be implemented as an application/domain operation.

Responsibilities include:

- validate creator
- validate target role
- validate tenant
- validate email
- create user
- create associated profile where required
- establish activation state
- record audit/security event

---

# 60. Authorization Service

Authorization should provide reusable checks where appropriate.

Potential concepts:

```text
canCreateUser()
canManageUser()
canViewStudent()
canProcessResults()
canAccessCollege()
```

Avoid scattering role strings throughout controllers.

---

# 61. Role Constants

Role names should be represented consistently.

Do not use arbitrary strings throughout the codebase:

```text
"admin"
"ADMIN"
"collegeAdmin"
"college_admin"
```

Use one authoritative representation.

---

# 62. Permission Model

The MVP may begin with role-based authorization.

Conceptually:

```text
Role
 ↓
Permissions
 ↓
Resource / Action
```

A more granular permission system may be introduced later if required.

Do not over-engineer permissions before actual requirements justify them.

---

# 63. Backend Request Context

Authenticated requests should expose trusted user context to the application layer.

Conceptually:

```text
HTTP Request
 ↓
Spring Security
 ↓
Authenticated Principal
 ↓
Application Security Context
 ↓
Tenant Context
 ↓
Service
```

Business services should not repeatedly parse raw authentication headers.

---

# 64. Security Context

The security context should provide enough information for:

- user identity
- role
- college/tenant
- authorization decisions

Sensitive authentication credentials should not be propagated unnecessarily through application layers.

---

# 65. Frontend Authentication Service

Frontend authentication API methods should be centralized.

Conceptual:

```text
authApi.login()
authApi.logout()
authApi.forgotPassword()
authApi.resetPassword()
authApi.getCurrentUser()
authApi.changePassword()
```

Components should not construct authentication requests manually.

---

# 66. Frontend Auth Hook

A centralized hook may expose:

```text
useAuth()
```

Possible responsibilities:

- current user
- authentication status
- login action
- logout action
- role information

It should not become a replacement for TanStack Query.

---

# 67. Current User Query

Current user information should be treated as server state.

Conceptually:

```text
useCurrentUser()
       ↓
GET /api/v1/me
       ↓
TanStack Query
```

The application should use this state to determine authenticated UI.

---

# 68. Authentication Loading Screen

During initial authentication resolution, the application should show a controlled loading state.

Avoid:

```text
Login Page
   ↓
Dashboard flashes
   ↓
Login Page again
```

Authentication initialization should be coordinated with routing.

---

# 69. Unauthorized Page

A dedicated unauthorized page should exist for authenticated users who lack permission.

Route concept:

```text
/app/unauthorized
```

or an equivalent application-level route.

It should explain that the current account does not have permission to access the requested resource.

---

# 70. Not Found vs Unauthorized

These states must remain distinct.

### 401

User is not authenticated.

Typical response:

```text
Login required
```

### 403

User is authenticated but not authorized.

Typical response:

```text
You do not have permission to access this page.
```

### 404

Requested resource/page does not exist or is intentionally not exposed.

---

# 71. Account Enumeration Protection

Authentication flows should avoid revealing unnecessary information such as:

```text
This email exists.
```

or:

```text
This email does not exist.
```

where doing so creates account enumeration risk.

This is especially important for password reset.

---

# 72. Audit Events

Important onboarding, authentication, and administrative events must be auditable.

Core audit events:

```text
COLLEGE_REGISTRATION_SUBMITTED   (Public application intake)
COLLEGE_REGISTRATION_APPROVED    (SUPER_ADMIN approval; tenant created)
COLLEGE_REGISTRATION_REJECTED    (SUPER_ADMIN rejection; reason logged)
COLLEGE_ADMIN_ACTIVATED          (Administrator completes activation with token)
LOGIN_SUCCESS                    (Successful authentication)
LOGIN_FAILURE                    (Invalid credentials or blocked status)
ACCOUNT_LOCKED                   (Brute-force lockout triggered)
LOGOUT                           (Active session/token terminated)
PASSWORD_CHANGED                 (Authenticated password change)
PASSWORD_RESET_REQUESTED         (Password reset token issued)
PASSWORD_RESET_COMPLETED         (Password reset token redeemed)
ACCOUNT_SUSPENDED                (Account locked by administrator)
ACCOUNT_REACTIVATED              (Account restored by administrator)
```

The final event taxonomy must be standardized across backend modules.

---

# 73. Audit Actor

For administrative and onboarding operations, audit records must capture:

```text
Actor
Action
Target
Timestamp
Result
Metadata
```

Examples:

```text
SUPER_ADMIN
    ↓
Approved College Application (SXIE)
    ↓
Generated college_id: 12
    ↓
Timestamp: 2026-10-15T10:30:00Z
    ↓
Result: SUCCESS
```

and:

```text
Proposed Administrator
    ↓
Activated COLLEGE_ADMIN Account
    ↓
Target college_id: 12
    ↓
Timestamp: 2026-10-15T11:00:00Z
    ↓
Result: SUCCESS
```

---

# 74. Security Event vs Audit Event

These concepts may overlap but should remain semantically clear.

### Security Event

Security-sensitive activity:

- failed login attempts
- brute-force lockout triggered
- password reset requested/completed
- activation token anomaly or replay attempt

### Audit Event

Administrative and onboarding lifecycle activity:

- college registration submitted
- college registration approved/rejected
- college administrator account activated
- college tenant status changed (activated/suspended)
- role changed (Post-MVP)

The implementation may store these together or separately depending on the final design.

---

# 75. Sensitive Logging Rules

Never log:

```text
password
password_hash
authentication token
activation token
reset token
session secret
```

Avoid logging unnecessary student academic information during authentication flows.

---

# 76. Onboarding & Account Validation Pipeline

### 1. Application Submission Validation:
```text
Validate Form Fields
       ↓
Normalize Email (lowercase, trim)
       ↓
Verify Email Uniqueness (no duplicate active user or pending application)
       ↓
Verify College Code Uniqueness
       ↓
Persist Application (status = PENDING)
       ↓
Audit Event (COLLEGE_REGISTRATION_SUBMITTED)
```

### 2. Approval Validation:
```text
Authenticate Actor (must be SUPER_ADMIN)
       ↓
Verify Application Exists & status == PENDING
       ↓
Create College Tenant in colleges table (assign college_id)
       ↓
Update Registration status = APPROVED
       ↓
Generate Cryptographically Secure Activation Token
       ↓
Dispatch Activation Invitation Email
       ↓
Audit Event (COLLEGE_REGISTRATION_APPROVED)
```

### 3. Account Activation Validation:
```text
Validate Activation Token (exists, unexpired, unused)
       ↓
Verify Associated Application status == APPROVED
       ↓
Verify Associated College Tenant status == ACTIVE
       ↓
Validate Password Policy Compliance
       ↓
Hash Password (BCrypt)
       ↓
Create User (role = COLLEGE_ADMIN, college_id = approved college_id, status = ACTIVE)
       ↓
Invalidate Activation Token
       ↓
Audit Event (COLLEGE_ADMIN_ACTIVATED)
```

---

# 77. Duplicate Email Handling

If an email already exists, account creation should return a controlled conflict response.

Conceptually:

```text
409 Conflict
```

The exact error code should follow the API error contract.

Do not create duplicate identities.

---

# 78. Account Provisioning Transaction

Where user creation requires multiple persistent records:

```text
Create User
      +
Create Student/Profile Relationship
      +
Create Required Account State
      +
Audit
```

these operations should be transactionally consistent where appropriate.

---

# 79. Student Account Linking

If a student already exists academically, creating the authentication account should link to the existing student record rather than creating a duplicate academic identity.

Conceptually:

```text
Existing Student
      ↓
Create User
      ↓
Link User → Student
```

The final database relationship is defined by Student Management.

---

# 80. Role Change

Role changes are security-sensitive.

If role changes are supported, the system must:

- authorize the actor
- validate target role
- validate tenant
- update role safely
- invalidate/re-evaluate active authentication where required
- audit the change

Role changes should not be implemented casually as ordinary profile edits.

---

# 81. College Admin Replacement

If a College Admin is replaced:

```text
Existing College Admin
      ↓
Deactivate / Remove Assignment
      ↓
Assign New College Admin
      ↓
Audit
```

Historical activity should remain traceable to the original actor.

The exact replacement workflow belongs to College Management.

---

# 82. Account Deactivation

Deactivation should normally preserve:

- account identity
- audit history
- related academic history

The account should become unable to authenticate.

---

# 83. Authentication & Onboarding Test Strategy

Authentication and onboarding tests must cover:

### College Registration & Approval (Option A)

- valid registration submission returns 201 with tracking reference
- registration stored with `PENDING` status
- duplicate email rejected with 409 Conflict
- duplicate college code rejected with 409 Conflict
- invalid email format or missing required fields rejected with 400 Bad Request
- public registration attempting to assign role or college_id is sanitized/rejected
- Super Admin can list pending registrations (paginated)
- Super Admin can inspect registration application details
- Super Admin can reject registration with reason -> status transitions to `REJECTED`
- Super Admin can approve registration -> status transitions to `APPROVED`, college tenant created in `colleges`, activation token issued
- non-Super-Admin attempting to approve/reject receives 403 Forbidden
- unauthenticated request to review endpoints receives 401 Unauthorized

### Account Activation

- valid activation token allows setting password and creates active `COLLEGE_ADMIN`
- created user is strictly bound to the approved `college_id`
- expired activation token is rejected with 400/410
- reused activation token is rejected
- forged or non-existent activation token is rejected
- weak password rejected against password policy

### Login

- valid credentials for active account authenticate successfully
- invalid credentials rejected with generic error
- inactive account rejected
- suspended account rejected
- account of pending or rejected college cannot log in
- missing fields rejected
- malformed email rejected

### Logout

- valid logout terminates active session / invalidates refresh token
- expired session handled gracefully
- repeated logout handled safely

### Password Management

- valid password change updates hash
- invalid current password rejected
- weak password rejected
- forgot-password does not leak account existence
- valid reset token allows setting new password
- expired or reused reset token rejected

---

# 84. Tenant Isolation Tests

Tests must explicitly verify:

```text
College A
 ↓
User A (COLLEGE_ADMIN A)
 ↓
Student A
```

cannot access:

```text
College B
 ↓
User B (COLLEGE_ADMIN B)
 ↓
Student B
```

Test cases should include:

- direct ID manipulation across college boundaries
- query parameters and path parameters cross-tenant tampering
- POST payload tenant manipulation
- update and delete cross-tenant requests
- list endpoints strictly scoped by authenticated `college_id`
- pending or rejected registration attempting to query tenant endpoints receives 403 Forbidden

---

# 85. Authorization Test Matrix

The authorization matrix governs all onboarding, authentication, and tenant operations:

| Operation | Super Admin | College Admin | Academic Staff | Student | Public Visitor |
|---|:---:|:---:|:---:|:---:|:---:|
| Submit College Registration | No | No | No | No | **Yes** |
| List / View Registration Applications | **Yes** | No | No | No | No |
| Approve / Reject Registration | **Yes** | No | No | No | No |
| Activate College Admin Account | No | **Token Holder** | No | No | **Token Holder** |
| Login (`/auth/login`) | **Yes** | **Yes** | Post-MVP | Post-MVP | No |
| Current User (`/auth/me`) | **Yes** | **Yes** | Post-MVP | Post-MVP | No |
| Manage Own College Profile | Platform Scope | **Own College** | No | No | No |
| Manage Other College Data | Platform Scope | **No (403)** | No | No | No |
| Provision Staff Accounts | No | Post-MVP | No | No | No |
| Provision Student Accounts | No | Post-MVP | Scoped (Post-MVP)| No | No |

---

# 86. Frontend Authentication & Onboarding Tests

The frontend test suite should cover:

- public college registration form (`/register-college`): validation, submission, error handling
- registration success confirmation page (`/registration-success`)
- account activation form (`/activate-account`): token extraction, password validation, submission
- login form: validation errors, successful submission, loading state
- authentication store initialization and persistence
- route guards: `/admin/*` requires `SUPER_ADMIN`, `/college/*` requires `COLLEGE_ADMIN`
- unauthorized page displayed for role mismatch
- logout clears authentication state and redirects to login
- session expiration redirects to login with return path

---

# 87. Security Test Cases

At minimum verify:

```text
□ Public registration cannot assign itself SUPER_ADMIN or any role
□ Public registration cannot supply or override college_id
□ Pending college cannot access protected college operations
□ Rejected college cannot access protected college operations
□ Unapproved college cannot have an active COLLEGE_ADMIN user
□ Invalid credentials fail with generic error
□ Suspended account cannot log in
□ COLLEGE_ADMIN cannot access another college's tenant data (IDOR)
□ Activation token expires after time window
□ Activation token cannot be reused
□ Password never appears in API response or logs
□ Reset token expires and cannot be reused
```

---

# 88. Authentication & Onboarding Implementation Sequence

Recommended module implementation sequence:

```text
1. Configure Spring Security base filter chain and CORS/CSRF rules
2. Create user and role persistence entities (`users`, `Role` enum)
3. Create college registration persistence entity (`college_registrations`)
4. Configure password hashing (BCryptPasswordEncoder)
5. Implement public college registration intake API (POST /api/v1/college-registrations)
6. Implement Super Admin registration review APIs (GET /api/v1/college-registrations, GET .../{id})
7. Implement Super Admin approval and rejection APIs (POST .../{id}/approve, POST .../{id}/reject)
8. Implement college tenant creation in `colleges` upon registration approval
9. Implement secure activation token generation and email dispatch mechanism
10. Implement administrator account activation API (POST /api/v1/auth/activate-account)
11. Implement user login API (POST /api/v1/auth/login)
12. Implement current-user profile API (GET /api/v1/auth/me)
13. Implement logout API (POST /api/v1/auth/logout)
14. Implement backend role-based authorization and tenant context scoping
15. Implement account status validation (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
16. Implement password change and token-based password reset
17. Implement failed-login tracking and brute-force lockout
18. Implement audit logging for registrations, approvals, activations, and logins
19. Implement frontend public registration form (/register-college) and success page
20. Implement frontend Super Admin registration review hub (/admin/registrations)
21. Implement frontend administrator activation page (/activate-account)
22. Implement frontend login page, auth store (Zustand), and role route guards
23. Execute comprehensive unit, integration, and security/IDOR tests
```

---

# 89. Authentication & Onboarding Acceptance Criteria

The implementation is acceptable when:

### Onboarding (Option A)
- [ ] Prospective colleges can submit registration via `/register-college`.
- [ ] Submitted applications are persisted with `PENDING` status.
- [ ] Super Admin can view, inspect, approve, and reject registrations.
- [ ] Rejection captures a mandatory audit reason and grants no tenant access.
- [ ] Approval initializes a new college tenant and issues an activation token.
- [ ] Designated administrator can activate their account and set their password.
- [ ] Newly activated administrator is strictly bound to the approved `college_id`.
- [ ] Pending or rejected colleges cannot access protected college operations.

### Login & Authentication
- [ ] Valid users can authenticate.
- [ ] Invalid credentials are rejected with generic errors.
- [ ] Inactive and suspended users cannot authenticate.
- [ ] Authentication state is established securely.

### Authorization & Multi-Tenancy
- [ ] Protected APIs require authentication.
- [ ] Role checks enforce `SUPER_ADMIN` and `COLLEGE_ADMIN` permissions.
- [ ] Tenant checks enforce strict `college_id` scoping.
- [ ] Cross-tenant access (IDOR) attempts return 403 Forbidden.

### Password Security
- [ ] Passwords are encrypted with BCrypt/Argon2.
- [ ] Passwords never appear in responses or log files.
- [ ] Password change works for authenticated users.
- [ ] Password reset generates single-use, time-limited tokens.

### Frontend
- [ ] Public registration page works.
- [ ] Super Admin registration review hub works.
- [ ] Account activation page works.
- [ ] Login page works.
- [ ] Route guards protect `/admin/*` and `/college/*`.

### Security & Audit
- [ ] Failed login lockout is enforced.
- [ ] Onboarding and authentication audit events are recorded.
- [ ] Sensitive credentials and tokens are excluded from logs.

---

# 90. Definition of Done

`authentication-implementation.md` is considered implemented when:

1. Spring Security is configured with base security filters.
2. User and College Registration persistence models are operational.
3. Public college registration intake endpoint works with email uniqueness validation.
4. Super Admin registration review, approval, and rejection endpoints are operational.
5. Approval transaction creates `colleges` tenant record and activation token.
6. Rejection records audit reason and denies all access.
7. Account activation endpoint verifies token, sets password, and establishes `COLLEGE_ADMIN` user.
8. Login, logout, and current-user (`/me`) endpoints are operational.
9. Protected backend endpoints enforce role authorization and tenant isolation.
10. Account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`) is enforced.
11. Password management (change and reset) is operational.
12. Brute-force failed login lockout is enforced.
13. Audit events for registration, approval, rejection, activation, and login are recorded.
14. React public registration and activation pages are operational.
15. React Super Admin review hub and College Admin dashboards are protected by route guards.
16. Integration, security, and tenant isolation tests pass with zero critical defects.
17. No sensitive credentials or tokens are exposed in API responses or logs.

---

# 91. Unresolved Implementation Decisions

The following decisions must be finalized during review:

- session-based vs token-based authentication
- access-token/refresh-token strategy if tokens are selected
- secure cookie strategy if cookies are selected
- CSRF protection strategy
- session duration
- refresh/session rotation
- concurrent session policy
- password policy
- account activation mechanism
- password reset delivery mechanism
- email provider
- rate limiting implementation
- temporary account lock policy
- exact role-permission matrix
- security event storage model
- audit event storage model
- exact user/student relationship
- exact account status enum
- MFA requirement, if introduced later

---

# 92. Relationship With Other Documents

This document depends on:

```text
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/frontend-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md

06-design/navigation.md
06-design/page-specifications.md

07-project-rules/coding-rules.md
07-project-rules/frontend-rules.md
07-project-rules/backend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/authentication.md

09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
09-development/implementation-notes/frontend-foundation.md
09-development/implementation-notes/database-setup.md
```

It supports the later implementation of:

```text
college-management-implementation.md
academic-structure-implementation.md
student-management-implementation.md
result-import-implementation.md
result-validation-implementation.md
result-processing-implementation.md
backlog-implementation.md
academic-passport-implementation.md
analytics-implementation.md
student-portal-implementation.md
```

---

# 93. Status

**Draft / Under Review**

This document defines the concrete implementation foundation for Acadlytic authentication and account provisioning.

It must progress through:

```text
Draft
 ↓
Under Review
 ↓
Approved
 ↓
Implementation Ready
 ↓
Implemented
 ↓
Maintained
```

Authentication must not be treated as implementation-ready until the unresolved security decisions have been formally reviewed.

---

# 94. Final Authentication Principle

Acadlytic authentication must follow this principle:

> **Authenticate the identity, authorize the action, derive the tenant from trusted context, preserve auditability, and never rely on the frontend as the security boundary.**

For Acadlytic specifically:

```text
Identity
   ↓
Authentication
   ↓
Role
   ↓
Tenant
   ↓
Authorization
   ↓
Resource Ownership
   ↓
Action
```

Every protected operation must pass through the appropriate parts of this chain.