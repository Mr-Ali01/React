# Security Rules

**Project:** Acadlytic  
**Document:** Security Development Rules  
**Path:** `07-project-rules/security-rules.md`  
**Status:** Draft / Under Review  
**Applies To:** Authentication, authorization, tenant isolation, API security, data protection, account security, file uploads, integrations, logging, database security, frontend/backend boundaries, and deployment security

---

# 1. Purpose

This document defines the security rules for Acadlytic.

Acadlytic handles academic and personal information belonging to students, colleges, academic staff, and administrators. Security must therefore be treated as a system-wide requirement rather than only an authentication concern.

The security model must protect:

- user accounts
- student information
- academic results
- backlog information
- Academic Passport data
- college/tenant data
- uploaded result files
- integration credentials
- audit information
- API access
- administrative operations

The primary security objectives are:

```text
Confidentiality
Integrity
Availability
Accountability
Tenant Isolation
Least Privilege
```

---

# 2. Security Principles

Acadlytic follows these principles:

1. Security must be enforced server-side.
2. Authentication and authorization are separate concerns.
3. Tenant isolation is mandatory.
4. Users receive only required permissions.
5. Sensitive data must be protected at rest and in transit.
6. Client-controlled identifiers must never be trusted for authorization.
7. Academic data must be protected from unauthorized modification.
8. Security events must be auditable.
9. Secrets must never be committed to source control.
10. Security failures must fail safely.
11. Security controls must not be bypassed for convenience.
12. AI-generated code must follow the same security requirements as manually written code.

---

# 3. Security Architecture

The conceptual security flow is:

```text
Request
   ↓
Transport Security
   ↓
Authentication
   ↓
User Identity
   ↓
Role
   ↓
Tenant Context
   ↓
Resource Ownership
   ↓
Permission
   ↓
Business Rule
   ↓
Data Access
```

Every protected operation must pass through the appropriate controls.

---

# 4. Security Scope

Security applies to:

```text
Public Website
Authentication
Account Management
College Management
Student Management
Academic Structure
Result Import
Result Validation
Result Processing
Backlog Tracking
Academic Passport
Analytics
Student Portal
Administration
Integrations
Background Jobs
Database
File Storage
Deployment Infrastructure
```

---

# 5. Threat Model

The system should assume that:

- users may intentionally manipulate requests
- users may modify IDs
- clients may be compromised
- browsers may be inspected
- API requests may be replayed
- uploaded files may be malicious
- accounts may be attacked
- external services may fail or behave unexpectedly
- developers may accidentally expose secrets
- misconfigured authorization may expose another tenant's data

Security controls must therefore exist independently of frontend behavior.

---

# 6. User Roles

MVP roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

There is also:

```text
PUBLIC_VISITOR
```

which represents unauthenticated public access rather than an authenticated application role.

---

# 7. Role Responsibilities

### SUPER_ADMIN

May manage platform-level operations, including:

- colleges
- college administrators
- platform configuration
- authorized administrative operations

### COLLEGE_ADMIN

May manage permitted operations within their own college.

### ACADEMIC_STAFF

May perform permitted academic operations within their college.

### STUDENT

May access their own academic information and permitted account operations.

### PUBLIC_VISITOR

May access only explicitly public resources.

---

# 8. Least Privilege

Every role must receive the minimum permissions necessary.

Do not grant broad permissions simply because they make implementation easier.

For example:

```text
STUDENT
```

must not automatically gain access to:

```text
all students
all college results
college administration
result processing
```

---

# 9. Authentication vs Authorization

These are separate security controls.

### Authentication

Answers:

> Who is the user?

### Authorization

Answers:

> What is this user allowed to do?

A valid login does not automatically authorize every API operation.

---

# 10. Authentication Requirements

Protected APIs must require authenticated users.

Authentication must establish a trusted user identity before protected operations are executed.

The exact authentication/token/session architecture must remain aligned with `authentication.md`.

---

# 11. Unauthenticated Access

Unauthenticated users may access only explicitly public resources.

Examples:

```text
/
/about
/features
/contact
/login
/forgot-password
/reset-password
```

Application APIs must not accidentally become public.

---

# 12. Authentication Failure

Authentication failures must not reveal unnecessary information.

Avoid responses that distinguish too clearly between:

```text
email exists
email does not exist
```

during sensitive operations such as password reset.

Use appropriate generic responses where required.

---

# 13. Password Security

Passwords must:

- never be stored in plaintext
- never be logged
- never be returned through APIs
- never be stored in frontend local storage
- never appear in audit logs

Use a strong adaptive password hashing mechanism supported by Spring Security.

---

# 14. Password Policy

The final password policy must define:

- minimum length
- allowed characters
- common-password handling
- password history if required
- reset behavior

Do not impose unnecessarily complicated password rules that reduce usability without improving meaningful security.

---

# 15. Password Reset

Password reset must use a secure, time-limited mechanism.

Reset tokens must:

- be cryptographically secure
- expire
- be single-use
- become invalid after successful reset
- not be logged
- not be exposed through analytics/audit data

The exact delivery mechanism remains an implementation decision.

---

# 16. Account Activation

New accounts created by administrators must have a defined activation/password setup flow.

Account creation must not result in an insecure default password shared through an unsafe channel.

The final activation mechanism must align with `authentication.md`.

---

# 17. Account Status

Accounts should have controlled lifecycle states.

Examples:

```text
ACTIVE
INACTIVE
LOCKED
SUSPENDED
```

Exact states must remain aligned with the authentication feature specification.

Inactive/suspended users must not continue accessing protected application functionality.

---

# 18. Failed Login Protection

The system must protect authentication endpoints against repeated failed attempts.

Controls may include:

- rate limiting
- temporary lockout
- progressive delay
- security event logging

The exact mechanism should be finalized during security implementation.

---

# 19. Session/Token Security

The final authentication mechanism must protect:

- session identifiers
- access tokens
- refresh tokens where applicable
- authentication cookies

Credentials must not be exposed to JavaScript unnecessarily.

The final token/session architecture must be documented before production.

---

# 20. Token Storage

Do not store authentication secrets in insecure browser storage without a documented security decision.

The frontend authentication strategy must be selected with consideration for:

- XSS
- CSRF
- token theft
- expiration
- logout
- refresh
- revocation

---

# 21. Logout

Logout must invalidate the relevant authenticated state according to the selected authentication architecture.

A logout request must not merely redirect the user while leaving a valid long-lived credential active.

---

# 22. Authorization Model

Authorization must consider:

```text
User
+
Role
+
Tenant
+
Resource
+
Action
```

Example:

```text
Can this user
    ↓
with this role
    ↓
access this college
    ↓
access this student
    ↓
perform this operation?
```

---

# 23. Server-Side Authorization

Authorization must always be enforced on the backend.

Frontend restrictions such as:

```javascript
if (role === "STUDENT") hideButton();
```

are UX controls, not security controls.

A malicious client can bypass them.

---

# 24. Tenant Isolation

Tenant isolation is one of Acadlytic's highest-priority security requirements.

A college user must only access authorized data belonging to their college.

Example:

```text
College A User
     ↓
College A Context
     ↓
College A Students
     ↓
College A Results
```

The user must never be able to manipulate an ID to access College B data.

---

# 25. Tenant Context

Tenant context must come from a trusted server-side source.

Do not trust:

```text
collegeId
```

sent by the browser as proof of authorization.

The backend must derive or verify tenant context from the authenticated identity and authorized relationships.

---

# 26. IDOR Protection

The application must protect against Insecure Direct Object Reference vulnerabilities.

Unsafe pattern:

```text
GET /api/v1/students/500
```

followed by:

```text
SELECT * FROM students WHERE id = 500
```

without authorization checks.

Correct approach:

```text
Authenticated User
        ↓
Authorized College
        ↓
Student 500 belongs to allowed scope?
        ↓
Allow / Deny
```

---

# 27. Resource Ownership

Before returning or modifying a resource, verify ownership/access.

This applies to:

- students
- results
- imports
- backlogs
- Academic Passport
- analytics
- college records
- uploaded files

---

# 28. `/me` Security

Self-service APIs should use `/me` where appropriate.

Examples:

```text
GET /api/v1/me
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

These endpoints should derive the student/user identity from the authenticated principal.

Do not require students to send their own student ID as proof of identity.

---

# 29. Administrative Access

Administrative endpoints must have explicit authorization.

Examples:

```text
College creation
College status changes
User provisioning
Role assignment
Result processing
Academic administration
```

Administrative permissions must never be inferred from frontend route visibility.

---

# 30. College Administration

In the MVP:

```text
SUPER_ADMIN
    ↓
creates/manages college

COLLEGE_ADMIN
    ↓
manages permitted operations
within own college
```

A College Admin must not modify another college merely by supplying another `collegeId`.

---

# 31. User Provisioning Security

Account creation must validate:

- creator permission
- target role
- college association
- email uniqueness
- account status
- activation process

A lower-privileged user must not create a higher-privileged account.

---

# 32. Role Escalation Protection

Users must not be able to modify their own role through profile/update APIs.

For example, a student must never be able to submit:

```json
{
  "role": "COLLEGE_ADMIN"
}
```

and have the backend accept it.

Role changes must use authorized administrative operations.

---

# 33. Mass Assignment Protection

Do not bind arbitrary request fields directly to entities.

A request such as:

```json
{
  "name": "...",
  "role": "SUPER_ADMIN",
  "collegeId": 999
}
```

must not automatically update every entity field.

Use explicit request DTOs and controlled mapping.

---

# 34. Input Validation

All external input must be validated.

Inputs include:

- query parameters
- path variables
- request bodies
- form data
- uploaded files
- headers
- external integration responses

Validation must include:

- type
- length
- format
- range
- allowed values
- business rules

---

# 35. Input Is Untrusted

Treat all client input as untrusted, including:

```text
IDs
names
emails
search values
sort fields
filters
file names
file contents
status values
```

Never assume that a value is safe merely because the frontend generated it.

---

# 36. SQL Injection Prevention

Never construct SQL by concatenating user input.

Bad:

```java
"SELECT * FROM students WHERE name = '" + name + "'"
```

Use:

- JPA parameters
- JPQL parameters
- prepared statements
- safe query builders

---

# 37. XSS Protection

User-controlled text must not be rendered as trusted HTML without sanitization.

Potentially user-controlled content includes:

- names
- descriptions
- notes
- contact messages
- imported text

The frontend must escape output appropriately.

The backend must not unnecessarily return executable HTML.

---

# 38. HTML Content

If future functionality allows rich HTML content, it must use an explicit sanitization policy.

Do not allow arbitrary HTML simply because a field is stored as `TEXT`.

---

# 39. CSRF

The CSRF strategy must match the selected authentication mechanism.

If authentication uses cookies, appropriate CSRF protection is required for state-changing requests.

If the final architecture uses a token mechanism with a different threat model, the corresponding protections must be documented.

Do not disable CSRF protection without understanding the authentication architecture.

---

# 40. CORS

CORS must be explicitly configured.

Production should not use unrestricted origins such as:

```text
*
```

for authenticated credentialed APIs.

Allowed origins should be environment-specific.

---

# 41. HTTPS

Production communication must use HTTPS.

Sensitive information must not be transmitted over unsecured HTTP.

This includes:

- login credentials
- passwords/reset operations
- academic data
- API credentials
- administrative operations

---

# 42. Security Headers

Production responses should use appropriate security headers where applicable.

Potential controls include:

- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- frame protection
- Strict-Transport-Security

Exact configuration should be finalized during deployment/security implementation.

---

# 43. File Upload Security

Result import accepts Excel/CSV files.

Uploaded files must be treated as untrusted.

Security controls must include:

- size limits
- allowed file types
- structural validation
- filename handling
- safe storage
- content validation
- access control
- retention policy

---

# 44. File Extension Validation

Do not trust only:

```text
.xlsx
.csv
```

as proof of file type.

Validate the actual file structure/content using the appropriate parser.

---

# 45. File Size Limits

Upload limits must be enforced server-side.

Do not allow unlimited file uploads.

Limits should protect against:

- memory exhaustion
- disk exhaustion
- denial-of-service
- accidental oversized files

---

# 46. Filename Security

Never use a user-provided filename directly as a server filesystem path.

Avoid path traversal vulnerabilities such as:

```text
../../some-file
```

Generate safe internal filenames/identifiers.

---

# 47. Uploaded File Storage

Uploaded files must be stored outside publicly accessible web roots unless public access is explicitly required.

Access must be authorized through the backend.

---

# 48. Uploaded Academic Data

Result files may contain sensitive student information.

They must therefore receive access controls comparable to the academic data derived from them.

Do not make uploaded result files publicly accessible through predictable URLs.

---

# 49. File Retention

The project must define how long uploaded result files remain available.

Retention must consider:

- operational usefulness
- security
- storage cost
- academic traceability
- privacy requirements

Do not retain sensitive files indefinitely without justification.

---

# 50. External Integrations

External integration requests must be secured.

Never expose integration credentials to:

- frontend code
- students
- unauthorized staff
- API responses
- logs

---

# 51. Integration Credential Storage

Integration credentials must be stored securely.

The exact mechanism may use:

- encrypted storage
- secret manager
- environment secrets
- secure credential vault

The final production mechanism remains an architecture decision.

---

# 52. External API Validation

Never blindly trust external API responses.

Validate:

- schema
- identifiers
- expected values
- response size
- authentication state
- error conditions

External data must pass through the appropriate normalization/validation process.

---

# 53. Integration Failure

External integration failure must fail safely.

For example:

```text
University API unavailable
        ↓
Sync fails
        ↓
Local academic data remains unchanged
```

Do not partially overwrite authoritative academic records because an external response was malformed.

---

# 54. Rate Limiting

Rate limiting should be considered for:

- login
- password reset
- public APIs
- expensive search endpoints
- result import initiation
- administrative bulk operations

Rate limits must not become a substitute for authorization.

---

# 55. Brute-Force Protection

Authentication endpoints must be protected from repeated automated attempts.

Potential controls:

- rate limits
- account lockout
- progressive delays
- IP/device signals
- security event monitoring

The exact implementation must be finalized during security implementation.

---

# 56. Enumeration Protection

Sensitive endpoints should avoid unnecessarily revealing whether an account/resource exists.

This is especially relevant to:

- login
- password reset
- account lookup
- student lookup

Responses should reveal only information the caller is authorized to know.

---

# 57. API Error Security

Error responses must not expose:

- stack traces
- SQL queries
- database credentials
- filesystem paths
- internal class names
- secret configuration
- sensitive student data

Return stable error codes and safe messages.

---

# 58. Exception Handling

Use centralized exception handling.

Unexpected exceptions should be:

```text
logged internally
+
returned as safe generic API errors
```

Do not return raw Java/Spring exceptions to clients.

---

# 59. Security Logging

Security events should be logged appropriately.

Examples:

```text
login failure
account lock
password reset
role change
account creation
permission denial
tenant access denial
result processing operation
administrative action
```

Logs must not contain passwords or authentication secrets.

---

# 60. Audit Logging

Important security and administrative operations should be auditable.

Audit data should capture, where appropriate:

```text
actor
action
resource
resource_id
tenant
timestamp
outcome
correlation/trace ID
```

Do not store unnecessary sensitive payloads.

---

# 61. Log Injection

User-controlled input must not be allowed to manipulate log structure.

Log values should be safely encoded/structured.

Avoid directly concatenating arbitrary user input into logs.

---

# 62. Sensitive Logging

Never log:

```text
password
password reset token
access token
refresh token
API secret
database password
private encryption key
```

Do not log complete student result files.

---

# 63. Secrets Management

Secrets must never be committed to Git.

Examples:

```text
database password
JWT signing secret
API keys
Stripe secret
email credentials
university API credentials
encryption keys
```

Use environment variables or an approved secrets manager.

---

# 64. `.env` and Local Secrets

Local secret files must be excluded from source control.

Example:

```text
.env
.env.local
```

must not be committed when they contain real secrets.

Provide safe example configuration separately.

---

# 65. Secret Rotation

Production secrets must be rotatable.

The system should avoid designs where changing a secret requires source-code modification.

---

# 66. Database Security

Database access must follow least privilege.

The application database user should not receive unnecessary administrative privileges.

Avoid using the MySQL root account for the application.

---

# 67. Database Network Access

Production database access should be restricted to authorized application/infrastructure components.

Do not expose the database publicly without a justified security architecture.

---

# 68. Database Credentials

Database credentials must:

- remain outside source code
- remain outside frontend code
- not appear in logs
- not appear in screenshots/documentation
- be stored securely

---

# 69. Data Encryption

Production transport must use encryption.

Sensitive data at rest may require encryption depending on:

- sensitivity
- infrastructure
- compliance
- threat model

Do not introduce custom cryptography.

Use proven libraries and platform mechanisms.

---

# 70. Password Hashing vs Encryption

Passwords must be **hashed**, not encrypted for later recovery.

Encryption is appropriate for recoverable secrets where necessary.

Never design a password system that requires decrypting user passwords.

---

# 71. Academic Data Integrity

Academic results are sensitive not only because they are confidential but because they must remain accurate.

Unauthorized modification could affect:

- SGPA
- CGPA
- backlog status
- Academic Passport
- analytics

Therefore result-processing APIs require strict authorization and auditing.

---

# 72. Result Processing Authorization

Only authorized roles may initiate result processing.

Students must not be able to process or modify official academic results.

The exact role permissions must follow the result-processing specification.

---

# 73. Result Import Authorization

Result imports must be restricted to authorized college/platform users.

A student must not be able to upload an arbitrary result file into the college system.

---

# 74. Result Validation Security

Validation endpoints must verify that the caller has access to the corresponding import.

A user must not be able to modify:

```text
/imports/500
```

if import `500` belongs to another college.

---

# 75. Result Processing Idempotency

Processing must be safe against accidental repeated requests.

Security and integrity controls should prevent:

```text
same result
+
same processing command
+
duplicate academic record
```

---

# 76. Backlog Security

Backlog state must not be directly editable by unauthorized users.

Backlog changes should occur through approved domain operations.

Historical academic data must remain protected.

---

# 77. Academic Passport Security

Academic Passport data contains sensitive student information.

Access must be restricted according to role.

Students may access their own Passport.

Authorized college staff may access student Passports according to their permissions.

Unauthorized cross-tenant access must be denied.

---

# 78. Analytics Security

Analytics can reveal sensitive aggregate information.

Examples:

- pass rates
- backlog rates
- subject performance
- student performance

Analytics endpoints must therefore enforce tenant and role restrictions.

Do not assume that aggregated data is automatically non-sensitive.

---

# 79. Student Privacy

Students should only receive information they are authorized to view.

A student must not be able to query another student's:

- results
- backlog
- Passport
- analytics
- personal information

by changing an ID in the URL.

---

# 80. Administrative Data Exposure

Administrative responses should expose only the information required by the current role.

Do not return internal security metadata unnecessarily.

---

# 81. API Enumeration

Sequential IDs can make resource enumeration easier.

Regardless of whether IDs are sequential or UUID-based, authorization must always be enforced.

Changing the ID format is not a substitute for authorization.

---

# 82. Background Job Security

Background jobs must execute with an appropriate security context or explicitly recorded system identity.

A job must not accidentally cross tenant boundaries.

Every job should retain enough context to identify:

```text
job
tenant
initiator
operation
```

where appropriate.

---

# 83. Scheduled Job Security

Scheduled jobs must not assume that all data is globally accessible.

Tenant-aware jobs must iterate through authorized tenant contexts safely.

---

# 84. Job Isolation

A failed job for one tenant must not corrupt or expose another tenant's data.

Background processing must preserve tenant boundaries throughout:

```text
Job
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

# 85. Transaction Security

Security-sensitive database operations should use appropriate transaction boundaries.

A transaction must not unintentionally bypass authorization because the operation is being performed internally.

Authorization should occur before the protected state mutation.

---

# 86. Concurrency Security

Concurrent requests must not bypass business security controls.

Examples:

```text
two role changes
two account activations
duplicate result processing
simultaneous backlog updates
```

Use appropriate:

- unique constraints
- state checks
- transactions
- optimistic locking
- idempotency

---

# 87. Dependency Security

Dependencies must be reviewed regularly.

Avoid:

- abandoned libraries
- unnecessary dependencies
- libraries with known critical vulnerabilities
- duplicate libraries serving the same purpose

Dependency updates should be tested before adoption.

---

# 88. Dependency Locking

Dependency versions should be controlled.

Builds should not unexpectedly resolve to incompatible versions.

Use Maven dependency management consistently.

---

# 89. Security Updates

Critical security vulnerabilities should be prioritized.

A vulnerable dependency affecting:

- authentication
- web processing
- file parsing
- database access
- serialization

requires prompt review.

---

# 90. Serialization Security

Do not enable unsafe polymorphic deserialization or equivalent dangerous serialization behavior without a specific security-reviewed requirement.

Only deserialize expected formats and structures.

---

# 91. File Parser Security

Libraries used to parse Excel/CSV files must be kept updated.

Large/malformed files must not be allowed to cause uncontrolled resource consumption.

---

# 92. Resource Exhaustion

Security includes protection against excessive resource consumption.

Potential attack vectors:

- huge file uploads
- extremely large query sizes
- expensive filters
- repeated imports
- repeated password reset requests
- repeated analytics requests

Use limits and rate controls where required.

---

# 93. Request Size Limits

Set appropriate request body limits.

Do not allow arbitrary request sizes simply because the framework default permits them.

---

# 94. Pagination Limits

Clients must not request unlimited records.

Example:

```text
size=1000000
```

must be rejected or capped.

---

# 95. Search Limits

Search APIs must use reasonable:

- result limits
- query lengths
- execution constraints

Expensive search functionality must be protected from abuse.

---

# 96. Security of Public Endpoints

Public endpoints must be reviewed separately because they do not have authenticated identity.

Examples:

```text
contact
public information
authentication
password reset
```

Public endpoints should have:

- rate limiting where appropriate
- input validation
- abuse protection
- safe error handling

---

# 97. Contact Form Security

If the public website contains a contact form, protect it against:

- spam
- oversized requests
- malicious content
- header injection
- automated abuse

The exact anti-abuse mechanism is an implementation decision.

---

# 98. Frontend Security Boundary

The frontend must never contain:

```text
database credentials
server secrets
private API keys
integration credentials
JWT signing secrets
```

Frontend environment variables must be treated as public unless the build system guarantees otherwise.

---

# 99. Public Configuration

Anything shipped to the browser should be assumed observable by users.

Do not put secrets into:

```text
VITE_*
REACT_APP_*
public/
frontend source
```

if those values are intended to remain secret.

---

# 100. Security of Error Pages

Unauthorized and not-found responses must not reveal whether sensitive resources exist when the caller is not authorized to know.

For example, an unauthorized student lookup should not leak another student's existence through different error behavior.

---

# 101. Security Testing

Security testing must include:

### Authentication

- valid login
- invalid login
- locked account
- expired credentials
- logout

### Authorization

- role restrictions
- tenant restrictions
- ownership restrictions
- privilege escalation

### Input Security

- SQL injection attempts
- XSS payloads
- invalid IDs
- malformed JSON
- oversized requests

### File Security

- wrong extension
- malformed Excel
- oversized file
- malicious filename
- unauthorized download

---

# 102. Tenant Isolation Tests

At minimum test:

```text
College A user → College A data → allowed

College A user → College B data → denied
```

Test this for:

- students
- results
- imports
- backlogs
- Passport
- analytics
- college management

---

# 103. IDOR Tests

For every resource endpoint containing an ID:

```text
authorized resource → allowed
unauthorized resource → denied
nonexistent resource → safe response
```

Do not test only the happy path.

---

# 104. Role Escalation Tests

Verify that:

```text
STUDENT
```

cannot become:

```text
ACADEMIC_STAFF
COLLEGE_ADMIN
SUPER_ADMIN
```

through:

- profile APIs
- request manipulation
- mass assignment
- direct endpoint access

---

# 105. Security Regression Tests

Security bugs should produce regression tests where practical.

Once fixed, the same vulnerability should not be reintroduced accidentally.

---

# 106. Production Security Checklist

Before production deployment:

- [ ] HTTPS enabled
- [ ] secrets externalized
- [ ] production secrets verified
- [ ] database access restricted
- [ ] authentication configured
- [ ] authorization tested
- [ ] tenant isolation tested
- [ ] IDOR tested
- [ ] CORS restricted
- [ ] CSRF strategy verified
- [ ] rate limits configured
- [ ] upload limits configured
- [ ] security headers configured
- [ ] error responses reviewed
- [ ] logs reviewed
- [ ] sensitive logging disabled
- [ ] backups configured
- [ ] dependencies checked
- [ ] security tests passing

---

# 107. Security Incident Response

A security incident should be treated as a production priority.

Examples:

- credential exposure
- cross-tenant data access
- unauthorized result modification
- leaked API secret
- compromised account
- malicious file execution
- database exposure

The incident process should include:

```text
Detect
 ↓
Contain
 ↓
Investigate
 ↓
Remediate
 ↓
Verify
 ↓
Document
 ↓
Prevent recurrence
```

The detailed incident-response process belongs in:

```text
15-monitoring/incident-response.md
```

---

# 108. Credential Compromise

If a secret is exposed:

1. revoke/rotate it
2. determine exposure scope
3. inspect logs
4. identify affected systems
5. deploy replacement credentials
6. remove the secret from source/history where appropriate
7. document the incident

Do not merely delete the visible secret and assume the incident is resolved.

---

# 109. Cross-Tenant Data Incident

If cross-tenant access is discovered:

1. stop the affected operation where practical
2. identify affected tenants
3. identify affected records
4. revoke/limit access if necessary
5. patch authorization
6. add regression tests
7. inspect logs
8. document the incident

---

# 110. Academic Data Integrity Incident

If unauthorized academic modification is detected:

1. identify affected records
2. preserve evidence
3. identify source/import history
4. determine correct authoritative state
5. restore/correct through approved domain operations
6. audit the correction
7. identify the security weakness
8. add regression protection

Do not directly manipulate production academic tables without a controlled recovery procedure.

---

# 111. AI Security Rules

AI coding agents must treat security requirements as mandatory.

AI must never:

- disable authentication to make a feature work
- bypass authorization
- remove tenant filters
- expose JPA entities
- store passwords in plaintext
- log secrets
- hardcode credentials
- disable CSRF without justification
- use unrestricted CORS
- remove validation
- bypass database constraints
- expose uploaded files publicly
- trust client-supplied role/tenant information
- invent security-sensitive behavior

---

# 112. AI Security Review Process

Before accepting AI-generated backend code:

```text
Read feature requirement
        ↓
Read authentication rules
        ↓
Read security rules
        ↓
Inspect authorization
        ↓
Inspect tenant isolation
        ↓
Inspect input validation
        ↓
Inspect data exposure
        ↓
Inspect database access
        ↓
Inspect logs
        ↓
Run security tests
```

---

# 113. AI Must Not Guess Security Decisions

If the implementation requires an unresolved security decision, the AI must not silently choose a risky default.

Examples:

- token storage
- refresh-token strategy
- encryption approach
- secret storage
- public endpoint behavior
- tenant authorization
- role permissions

The ambiguity must be identified and resolved through project architecture.

---

# 114. Definition of Done

A security-sensitive feature is complete when:

- [ ] authentication requirement defined
- [ ] authorization requirement defined
- [ ] tenant scope defined
- [ ] resource ownership verified
- [ ] input validation implemented
- [ ] error handling reviewed
- [ ] sensitive data exposure reviewed
- [ ] logging reviewed
- [ ] audit requirements reviewed
- [ ] database access secured
- [ ] file handling secured where applicable
- [ ] security tests added
- [ ] IDOR tests added where applicable
- [ ] role tests added
- [ ] cross-tenant tests added
- [ ] documentation updated
- [ ] code review completed

---

# 115. Security Review Checklist

Before approving a feature, ask:

### Authentication

- Who can access this feature?

### Authorization

- What roles can perform each operation?

### Tenant Isolation

- Can a user access another college's data?

### Ownership

- Can a user access another user's resource?

### Input

- Is all external input validated?

### Database

- Are queries parameterized?

### Data Exposure

- Is unnecessary sensitive information returned?

### Files

- Are uploaded files restricted and safely stored?

### Logging

- Could logs expose secrets or personal data?

### Errors

- Could errors reveal implementation details?

### Concurrency

- Can duplicate requests bypass security?

### Audit

- Is the operation traceable?

---

# 116. Security Anti-Patterns

Avoid:

### Frontend-Only Authorization

```text
Hide button = security
```

It is not.

### Trusting `collegeId`

```text
request.collegeId
```

must not automatically determine authorization.

### Trusting `userId`

A client-supplied user ID does not prove identity.

### Mass Assignment

Binding arbitrary JSON directly to entities.

### Plaintext Passwords

Never acceptable.

### Secrets in Git

Never acceptable.

### Public Upload Storage

Sensitive academic files must not be publicly accessible by default.

### `Access-Control-Allow-Origin: *`

Do not use blindly for authenticated APIs.

### Detailed Production Exceptions

Never expose stack traces to users.

### Authorization After Data Retrieval

Avoid loading sensitive data first and checking permission later if the query itself can enforce scope.

### Security Through Obscurity

Changing IDs does not replace authorization.

---

# 117. Rule Priority

When security rules conflict with convenience or implementation preferences:

```text
1. Security
2. Data protection
3. Data integrity
4. Legal/compliance requirements where applicable
5. Product requirements
6. Feature specifications
7. Architecture
8. Performance
9. Developer convenience
```

Security must not be weakened to simplify development.

---

# 118. Relationship With Other Documents

This document must be used together with:

```text
03-prd/
├── product-requirements.md
├── functional-requirements.md
└── non-functional-requirements.md

05-architecture/
├── system-architecture.md
├── backend-architecture.md
├── database-architecture.md
├── api-architecture.md
├── data-ownership.md
└── integration-architecture.md

07-project-rules/
├── coding-rules.md
├── frontend-rules.md
├── backend-rules.md
├── database-rules.md
└── ai-coding-rules.md

09-development/feature-specifications/
├── authentication.md
├── college-management.md
├── academic-structure.md
├── student-management.md
├── result-import.md
├── result-validation.md
├── result-processing.md
├── backlog-tracking.md
├── academic-passport.md
├── analytics.md
└── student-portal.md
```

`authentication.md` remains the detailed feature-level authority for authentication/account lifecycle behavior.

---

# 119. Unresolved Security Decisions

The following decisions remain subject to final security/architecture review:

- authentication mechanism
- access-token strategy
- refresh-token/session strategy
- token/cookie storage strategy
- CSRF strategy
- password policy
- account activation mechanism
- password-reset delivery
- login lockout/rate-limit implementation
- production CORS origins
- security-header configuration
- file storage security
- file retention
- encryption-at-rest requirements
- integration credential storage
- secrets manager
- API rate limiting
- audit-log retention
- monitoring/security alerting
- dependency vulnerability scanning
- production security incident process details

These must be finalized before production deployment.

---

# 120. Review Status

**Status:** Draft / Under Review

This document must be reviewed against:

- authentication
- system architecture
- backend architecture
- database architecture
- API architecture
- data ownership
- integration architecture
- backend rules
- database rules
- all feature specifications

After review:

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

---

# 121. Final Security Principle

Acadlytic must follow:

```text
Never Trust the Client
        ↓
Authenticate the User
        ↓
Authorize the Action
        ↓
Verify the Tenant
        ↓
Verify Resource Ownership
        ↓
Validate the Input
        ↓
Protect the Data
        ↓
Audit Important Operations
```

Security is not a feature added after development.

Security is a property of every feature, API, database operation, integration, and deployment.