# Acadlytic — API Architecture

**Project:** Acadlytic  
**Document:** API Architecture  
**Version:** 1.0  
**Status:** Draft / Architecture Ready  
**Last Updated:** 2026-10-04

---

# 1. Purpose

This document defines the API architecture for Acadlytic.

It establishes:

- API design principles
- API versioning
- URL conventions
- resource boundaries
- authentication
- authorization
- tenant isolation
- request and response conventions
- validation
- error handling
- pagination
- filtering
- sorting
- search
- API contracts
- module ownership
- cross-module operations
- idempotency
- concurrency
- file upload APIs
- result-processing APIs
- audit behavior
- security requirements
- API development rules

The purpose is to ensure that all Acadlytic APIs follow a consistent architecture.

This document does not replace individual feature specifications.

Feature specifications remain the source for detailed feature behavior.

---

# 2. API Architecture Overview

Acadlytic follows a client-server architecture:

```text
React Frontend
      ↓
HTTP / HTTPS
      ↓
Spring Boot REST API
      ↓
Application Services
      ↓
Domain Modules
      ↓
Repositories
      ↓
PostgreSQL
```

Supporting services may include:

```text
React
  ↓
Spring Boot API
  ├── PostgreSQL
  ├── Redis
  ├── Object Storage
  └── Background Jobs
```

The API layer acts as the controlled boundary between the frontend and backend business logic.

---

# 3. API Technology

The backend API will use:

```text
Java 21
Spring Boot
Spring MVC / REST
Spring Security
Spring Data JPA
Hibernate
Bean Validation
```

API documentation should use:

```text
OpenAPI
Springdoc OpenAPI
```

The API should communicate using:

```text
JSON
```

except where file uploads/downloads require another content type.

---

# 4. API Style

Acadlytic will use a REST-oriented API architecture.

Example:

```http
GET /api/v1/students
```

rather than:

```http
GET /getStudents
```

Resources should be represented as nouns.

Preferred:

```text
/students
/colleges
/results
/backlogs
```

Avoid action-heavy URLs where a resource-oriented operation is possible.

---

# 5. API Base URL

All application APIs should use the common prefix:

```text
/api/v1
```

Example:

```text
/api/v1/students
/api/v1/colleges
/api/v1/results
/api/v1/backlogs
```

Authentication endpoints may also follow the same versioning convention:

```text
/api/v1/auth/login
/api/v1/auth/logout
```

---

# 6. API Versioning

The MVP API will use URL-based versioning:

```text
/api/v1
```

Future breaking changes may introduce:

```text
/api/v2
```

Example:

```text
/api/v1/students
/api/v2/students
```

A breaking change must not silently alter the behavior expected by existing clients.

---

# 7. HTTPS

Production APIs must use HTTPS.

Example:

```text
https://api.acadlytic.com/api/v1/...
```

HTTP should not be used for authenticated production traffic.

Development may use:

```text
http://localhost:8080
```

where appropriate.

---

# 8. Resource-Oriented API Design

API resources should correspond to business/domain concepts.

Examples:

```text
College
Student
Course
Semester
Subject
Result Import
Result
Backlog
Academic Passport
Analytics
User
```

The API should not expose raw database table structures.

Bad:

```text
/api/v1/result_import_records
```

as the primary public API design.

Better:

```text
/api/v1/result-imports/{importId}/records
```

---

# 9. API Domain Boundaries

The API should follow module ownership.

Conceptually:

```text
Authentication
    ↓
/auth

College Management
    ↓
/colleges

Student Management
    ↓
/students

Academic Structure
    ↓
/courses
/semesters
/subjects

Result Import
    ↓
/result-imports

Result Processing
    ↓
/results

Backlog Tracking
    ↓
/backlogs

Academic Passport
    ↓
/students/{studentId}/academic-passport

Analytics
    ↓
/analytics

Student Portal
    ↓
/me
```

---

# 10. Authentication API

Authentication is responsible for identity and account access.

Core endpoints:

```http
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
PUT  /api/v1/auth/password
```

The exact endpoint set must remain aligned with the Authentication feature specification.

---

# 11. Login API

```http
POST /api/v1/auth/login
```

Purpose:

- authenticate the user
- establish authenticated session/token context
- return authorized user information where appropriate

Conceptual request:

```json
{
  "email": "user@example.com",
  "password": "********"
}
```

The API must not return the password.

---

# 12. Login Response

A successful response may contain:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "COLLEGE_ADMIN",
    "collegeId": "college-id"
  }
}
```

The exact authentication/session representation depends on the selected security architecture.

The API contract must not expose sensitive authentication information.

---

# 13. Logout API

```http
POST /api/v1/auth/logout
```

Purpose:

- terminate the authenticated session
- invalidate applicable authentication state
- record security/audit information where required

The endpoint should be safe to call even when the client has already lost local authentication state.

---

# 14. Current User API

```http
GET /api/v1/auth/me
```

Purpose:

Return the authenticated user's identity and authorization context.

Example:

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "ACADEMIC_STAFF",
  "collegeId": "college-id",
  "status": "ACTIVE"
}
```

---

# 15. Account Creation API

Account creation is part of the identity/account lifecycle.

MVP does not provide public self-registration.

Controlled provisioning is required.

Conceptually:

```text
SUPER_ADMIN
    ↓
Create College Admin

COLLEGE_ADMIN
    ↓
Create Academic Staff
Create Student

ACADEMIC_STAFF
    ↓
Create Student where permitted
```

Public visitors cannot create accounts.

---

# 16. Account Provisioning Endpoints

The final API may use role-scoped resources such as:

```http
POST /api/v1/users
GET  /api/v1/users
GET  /api/v1/users/{userId}
PATCH /api/v1/users/{userId}/status
```

or domain-specific provisioning endpoints.

The final endpoint choice must preserve the ownership and authorization rules established in Authentication.

---

# 17. Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What are you allowed to do?
```

Every protected API must enforce authorization on the backend.

Frontend route protection is not sufficient.

---

# 18. Role-Based Authorization

MVP roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Authorization must be based on:

```text
Role
+
Tenant Context
+
Resource Ownership
+
Operation
```

Example:

```text
COLLEGE_ADMIN
+
College A
+
Student from College A
+
READ
=
Allowed
```

---

# 19. Tenant Isolation

Every tenant-scoped API must enforce college isolation.

Example:

```http
GET /api/v1/students/123
```

The backend must verify:

```text
Student 123
      ↓
College A
      ↓
Current user authorized for College A?
```

A valid authentication token alone does not grant access to all colleges.

---

# 20. IDOR Protection

The API must protect against insecure direct object references.

Example attack:

```text
User belongs to College A

GET /api/v1/students/100
```

then changes:

```text
GET /api/v1/students/101
```

where Student 101 belongs to College B.

The API must reject the request.

---

# 21. `/me` API Pattern

Student self-service APIs should prefer:

```text
/api/v1/me
```

rather than requiring the frontend to supply the student's ID.

Examples:

```http
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

This reduces unnecessary exposure of identity identifiers and simplifies authorization.

---

# 22. College Management APIs

Core APIs:

```http
POST  /api/v1/colleges
GET   /api/v1/colleges
GET   /api/v1/colleges/{collegeId}
PUT   /api/v1/colleges/{collegeId}
PATCH /api/v1/colleges/{collegeId}/status
```

Authorization follows the College Management specification.

---

# 23. College Creation

```http
POST /api/v1/colleges
```

MVP:

```text
SUPER_ADMIN → Allowed
COLLEGE_ADMIN → Not allowed
ACADEMIC_STAFF → Not allowed
STUDENT → Not allowed
Public → Not allowed
```

The backend must validate:

- college name
- college code
- university
- contact information
- required fields
- uniqueness rules

---

# 24. College Listing

```http
GET /api/v1/colleges
```

Primarily intended for platform-level administration.

The API should support:

```text
search
status
university
pagination
sorting
```

Example:

```http
GET /api/v1/colleges?page=0&size=20&status=ACTIVE
```

---

# 25. College Details

```http
GET /api/v1/colleges/{collegeId}
```

The API must enforce authorization before returning the college.

---

# 26. College Update

```http
PUT /api/v1/colleges/{collegeId}
```

Only authorized users may update the resource.

College Admin may update permitted fields for their own college.

College Admin must not modify tenant identity or ownership fields unless explicitly authorized.

---

# 27. College Status

```http
PATCH /api/v1/colleges/{collegeId}/status
```

Possible statuses:

```text
ACTIVE
INACTIVE
SUSPENDED
```

Status transitions must follow business rules.

---

# 28. Student Management APIs

Core endpoints:

```http
POST   /api/v1/students
GET    /api/v1/students
GET    /api/v1/students/{studentId}
PUT    /api/v1/students/{studentId}
PATCH  /api/v1/students/{studentId}/status
```

Exact operations depend on Student Management requirements.

---

# 29. Student Creation

```http
POST /api/v1/students
```

The API must validate:

- college context
- university identifier
- required personal fields
- course/enrollment information
- duplicate identity

The client must not be able to create a student in another tenant.

---

# 30. Student Search

Example:

```http
GET /api/v1/students?search=202600123
```

Search may support:

- university student identifier
- name
- email
- course
- academic year
- status

Search results must remain tenant-scoped.

---

# 31. Student Details

```http
GET /api/v1/students/{studentId}
```

The API should return student information appropriate to the caller's role.

Sensitive information must be minimized.

---

# 32. Academic Structure APIs

Academic Structure APIs may include:

```http
GET /api/v1/universities
GET /api/v1/courses
GET /api/v1/courses/{courseId}
GET /api/v1/semesters
GET /api/v1/subjects
```

Management endpoints depend on the role and academic structure requirements.

---

# 33. Result Import API

Core endpoint:

```http
POST /api/v1/result-imports
```

Purpose:

- upload/import a result source
- create an import job
- validate source metadata
- initiate parsing

---

# 34. Result Import File Upload

Result imports may use:

```text
multipart/form-data
```

Example:

```http
POST /api/v1/result-imports
Content-Type: multipart/form-data
```

Possible fields:

```text
file
universityId
courseId
semesterId
academicYearId
source
```

The exact required fields depend on the import source.

---

# 35. Import File Security

Uploaded files are untrusted input.

The backend must validate:

- file size
- extension
- MIME type where appropriate
- file structure
- expected columns
- malicious content
- storage path
- authorization

Uploaded files must not be publicly accessible by default.

---

# 36. Result Import Status API

```http
GET /api/v1/result-imports/{importId}
```

Example response:

```json
{
  "id": "import-id",
  "status": "READY_FOR_REVIEW",
  "recordsCount": 1200,
  "successCount": 1150,
  "errorCount": 50
}
```

---

# 37. Import Records API

```http
GET /api/v1/result-imports/{importId}/records
```

Purpose:

- preview imported records
- display validation state
- display errors
- filter records

Possible filters:

```text
status
validationStatus
studentIdentifier
subjectCode
```

---

# 38. Result Validation API

Validation is a separate business operation.

```http
POST /api/v1/result-imports/{importId}/validate
```

Purpose:

- validate imported records
- identify invalid records
- identify warnings
- generate validation summary

Validation must not automatically create final academic results.

---

# 39. Validation Summary API

```http
GET /api/v1/result-imports/{importId}/validation-summary
```

Example:

```json
{
  "total": 1200,
  "valid": 1150,
  "invalid": 35,
  "warnings": 15
}
```

The exact categories must follow the Result Validation specification.

---

# 40. Validation Records API

```http
GET /api/v1/result-imports/{importId}/validation-records
```

Purpose:

Return validation-specific information for records requiring review.

---

# 41. Result Processing API

Result processing converts validated records into authoritative academic results.

Possible endpoint:

```http
POST /api/v1/result-imports/{importId}/process
```

The processing operation must:

- verify authorization
- verify validation state
- process eligible records
- preserve attempts
- update backlog state
- update academic calculations where applicable
- maintain audit history
- enforce idempotency

---

# 42. Processing Status API

```http
GET /api/v1/result-imports/{importId}/processing-status
```

The API may return:

```json
{
  "status": "COMPLETED_WITH_ERRORS",
  "total": 1200,
  "processed": 1150,
  "failed": 50
}
```

---

# 43. Result APIs

Processed results may be accessed through:

```http
GET /api/v1/results
GET /api/v1/results/{resultId}
GET /api/v1/students/{studentId}/results
GET /api/v1/me/results
```

The API must distinguish between:

```text
Imported source data
```

and:

```text
Processed authoritative academic results
```

---

# 44. Result Filtering

Result APIs may support:

```text
student
course
semester
academic year
subject
result status
attempt
```

Example:

```http
GET /api/v1/results?semesterId=3&academicYearId=2026
```

All filters must be authorization-aware.

---

# 45. Backlog APIs

Core endpoints:

```http
GET /api/v1/backlogs
GET /api/v1/backlogs/{backlogId}
GET /api/v1/students/{studentId}/backlogs
GET /api/v1/me/backlogs
```

Backlog creation/clearing should normally occur through the result-processing/business workflow rather than arbitrary client-side CRUD.

---

# 46. Backlog Mutation Rule

A client should not be allowed to directly perform:

```http
PUT /api/v1/backlogs/123
```

to arbitrarily change academic backlog status unless an explicitly authorized correction workflow exists.

Backlog lifecycle must remain controlled by its domain rules.

---

# 47. Academic Passport APIs

Core APIs:

```http
GET /api/v1/students/{studentId}/academic-passport
GET /api/v1/students/{studentId}/academic-passport/summary
GET /api/v1/students/{studentId}/academic-passport/semesters/{semesterId}
GET /api/v1/me/academic-passport
```

The Academic Passport API is read-oriented.

---

# 48. Academic Passport Response

Conceptual response:

```json
{
  "student": {},
  "program": {},
  "summary": {
    "cgpa": 8.2,
    "creditsEarned": 80,
    "activeBacklogs": 1
  },
  "semesters": []
}
```

The exact response contract should follow the Academic Passport feature specification.

---

# 49. Analytics APIs

Core APIs:

```http
GET /api/v1/analytics/dashboard
GET /api/v1/students/{studentId}/analytics
GET /api/v1/analytics/courses/{courseId}
GET /api/v1/analytics/semesters/{semesterId}
GET /api/v1/analytics/subjects/{subjectId}
GET /api/v1/analytics/backlogs
GET /api/v1/me/analytics
```

Analytics APIs are read-only.

---

# 50. Analytics Authorization

Analytics visibility depends on role and tenant.

Example:

```text
SUPER_ADMIN
    ↓
Platform-level analytics where permitted

COLLEGE_ADMIN
    ↓
Own college analytics

ACADEMIC_STAFF
    ↓
Authorized academic analytics

STUDENT
    ↓
Own analytics
```

Cross-college analytics must not be exposed to College Admin.

---

# 51. Dashboard API

```http
GET /api/v1/analytics/dashboard
```

Possible filters:

```text
academicYearId
courseId
semesterId
```

The response may contain:

```text
totalStudents
averageCgpa
averageSgpa
passRate
failureRate
activeBacklogs
clearedBacklogs
```

Every metric must have a documented definition.

---

# 52. Student Portal APIs

The Student Portal should use `/me` endpoints where possible.

```http
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
GET /api/v1/me/profile
PUT /api/v1/me/profile
PUT /api/v1/me/password
POST /api/v1/auth/logout
```

---

# 53. API HTTP Methods

Use standard HTTP semantics.

```text
GET
    Retrieve

POST
    Create / initiate operation

PUT
    Replace/update resource

PATCH
    Partial update

DELETE
    Delete only where explicitly supported
```

Academic historical data should generally not support destructive DELETE operations.

---

# 54. HTTP Status Codes

Common responses:

```text
200 OK
201 Created
202 Accepted
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

The exact use must remain consistent.

---

# 55. 401 Unauthorized

Use `401 Unauthorized` when the request lacks valid authentication.

Examples:

```text
Missing token
Expired session
Invalid authentication
```

---

# 56. 403 Forbidden

Use `403 Forbidden` when the user is authenticated but does not have permission.

Example:

```text
Student attempts to access college administration endpoint.
```

---

# 57. 404 Not Found

Use `404 Not Found` when an authorized resource does not exist.

Care must be taken not to leak information about resources belonging to unauthorized tenants.

---

# 58. 409 Conflict

Use `409 Conflict` for business conflicts.

Examples:

```text
Duplicate student identifier
Duplicate result attempt
College code already exists
Import already processing
```

---

# 59. 422 Unprocessable Entity

Use `422` where the request is structurally valid but fails domain validation.

Examples:

```text
Invalid academic context
Invalid result combination
Invalid business state transition
```

The final error strategy should remain consistent throughout the API.

---

# 60. Standard Error Response

All APIs should return a consistent error structure.

Conceptual format:

```json
{
  "timestamp": "2026-10-04T14:20:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "The request contains invalid data.",
  "path": "/api/v1/students",
  "errors": []
}
```

The implementation may use a slightly different field naming convention, but the structure must remain consistent.

---

# 61. Validation Error Structure

Field-level errors should identify the affected field.

Example:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_EMAIL",
      "message": "Enter a valid email address."
    }
  ]
}
```

---

# 62. Error Codes

Errors should have stable machine-readable codes.

Example:

```text
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_LOCKED
COLLEGE_NOT_FOUND
COLLEGE_CODE_EXISTS
STUDENT_NOT_FOUND
STUDENT_IDENTIFIER_EXISTS
IMPORT_FILE_INVALID
IMPORT_VALIDATION_FAILED
RESULT_DUPLICATE
BACKLOG_NOT_FOUND
ACCESS_DENIED
```

Frontend behavior should rely on codes where appropriate rather than parsing human-readable messages.

---

# 63. Error Message Security

Error messages must not expose:

- passwords
- database details
- SQL statements
- stack traces
- internal infrastructure
- secret configuration
- sensitive student data

Production responses should use safe error messages.

Detailed technical information belongs in protected server logs.

---

# 64. Request Validation

Spring Bean Validation should validate API input.

Examples:

```text
@NotBlank
@Email
@Size
@Pattern
@Positive
@Valid
```

Validation should occur before business processing.

---

# 65. Business Validation

Request validation and business validation are different.

Example:

```text
@NotBlank
```

checks that:

```text
studentIdentifier
```

is provided.

Business validation checks:

```text
Does this student identifier already exist?
```

Both layers are required.

---

# 66. Response DTOs

APIs should use DTOs rather than exposing JPA entities directly.

Architecture:

```text
Controller
   ↓
Request DTO
   ↓
Application Service
   ↓
Domain / Entity
   ↓
Response DTO
```

Avoid returning database entities directly from controllers.

---

# 67. Entity Exposure Rule

Never assume:

```text
Database Entity = API Response
```

The API response should be deliberately designed.

This prevents accidental exposure of:

- internal IDs
- security fields
- audit fields
- password hashes
- internal relationships

---

# 68. Request DTO Rule

Incoming API requests should use dedicated request DTOs.

Example:

```text
CreateStudentRequest
UpdateStudentRequest
CreateCollegeRequest
ProcessResultImportRequest
```

Do not bind arbitrary JSON directly to persistent entities.

---

# 69. Pagination

Collection APIs should support pagination.

Recommended parameters:

```text
page
size
sort
```

Example:

```http
GET /api/v1/students?page=0&size=25
```

The backend should enforce a maximum page size.

Example:

```text
size <= 100
```

The exact limit may be configured.

---

# 70. Pagination Response

Conceptual response:

```json
{
  "content": [],
  "page": 0,
  "size": 25,
  "totalElements": 250,
  "totalPages": 10
}
```

The exact response contract should remain consistent across collection APIs.

---

# 71. Sorting

Example:

```http
GET /api/v1/students?sort=createdAt,desc
```

The backend must whitelist sortable fields.

The client must not be able to inject arbitrary SQL through the sort parameter.

---

# 72. Filtering

Filters must be explicitly supported by the resource.

Example:

```http
GET /api/v1/students?status=ACTIVE&courseId=10
```

Unknown filters should not silently alter query behavior.

---

# 73. Search

Search parameters should be clearly defined.

Example:

```http
GET /api/v1/students?search=2026001
```

Search must remain tenant-scoped and authorization-aware.

---

# 74. API Response Consistency

Similar resources should use similar response structures.

For example:

```text
GET /students
GET /courses
GET /subjects
```

should follow consistent collection/pagination conventions.

---

# 75. Idempotency

Operations that may be retried must be designed for idempotency.

Especially:

```text
Result Processing
Import Processing
Potential Future Payments
External Integrations
```

Example:

```text
Same result processed twice
        ↓
One authoritative academic result
```

not:

```text
Two duplicate results
```

---

# 76. Idempotency Key

Where appropriate, clients or internal jobs may provide an idempotency key.

Example:

```http
Idempotency-Key: abc123
```

The backend must define:

- key scope
- retention
- uniqueness
- replay behavior
- failure behavior

The exact mechanism should be finalized during backend implementation.

---

# 77. Long-Running Operations

Large result imports and processing should not block an HTTP request indefinitely.

Preferred pattern:

```text
POST
  ↓
Create Job
  ↓
202 Accepted
  ↓
Background Processing
  ↓
GET Job Status
```

Example:

```http
POST /api/v1/result-imports/{importId}/process
```

Response:

```json
{
  "jobId": "job-id",
  "status": "PROCESSING"
}
```

---

# 78. Background Job Status

A job status API may return:

```text
PENDING
RUNNING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

The exact lifecycle must remain consistent with Result Import and Result Processing specifications.

---

# 79. API Timeouts

Long-running academic processing must not rely on extremely long HTTP timeouts.

Instead:

```text
Request
 ↓
Job created
 ↓
Background processing
 ↓
Status polling / future notification
```

---

# 80. File Download APIs

If future functionality provides downloadable:

- import reports
- validation reports
- analytics exports
- academic documents

the API must verify authorization before generating or returning files.

Generated files should not automatically become public.

---

# 81. API Auditability

Sensitive API operations should produce audit events.

Examples:

```text
College created
User provisioned
Student created
Result imported
Result processed
Academic record corrected
College suspended
Password changed
```

Read-only operations may be audited selectively depending on security requirements.

---

# 82. API Logging

Application logs should include useful operational context.

Potential fields:

```text
request_id
user_id
college_id
endpoint
method
status
duration
```

Do not log:

```text
password
access token
refresh token
sensitive personal data
```

unless explicitly required and safely protected.

---

# 83. Request Correlation

Each API request should have a correlation/request identifier.

Example:

```text
X-Request-Id
```

This helps trace:

```text
Frontend request
      ↓
API
      ↓
Service
      ↓
Database
      ↓
Background Job
```

The exact implementation can use Spring-compatible request correlation mechanisms.

---

# 84. Rate Limiting

Rate limiting should be applied to sensitive endpoints.

Especially:

```text
Login
Password reset
Public endpoints
File upload
Expensive analytics
```

The exact limits should be configured based on deployment and security requirements.

---

# 85. Authentication Rate Limiting

Repeated failed login attempts must trigger appropriate protection.

Possible controls:

```text
Rate limiting
Temporary lock
Progressive delay
Audit event
```

This must remain consistent with Authentication feature requirements.

---

# 86. CORS

CORS should be explicitly configured.

Production should allow only trusted frontend origins.

Do not use:

```text
Access-Control-Allow-Origin: *
```

for authenticated production APIs unless the security architecture explicitly permits it.

---

# 87. CSRF

CSRF protection requirements depend on the selected authentication/session mechanism.

If browser cookies are used for authentication, CSRF protection must be explicitly addressed.

If a token-based mechanism is used, the architecture must still evaluate browser-specific threats.

This decision must be finalized with the Authentication security architecture.

---

# 88. API Security Headers

Production API infrastructure should use appropriate security headers through the application or reverse proxy.

Examples may include:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security
```

Exact configuration belongs to the security/deployment architecture.

---

# 89. OpenAPI Documentation

The API should be documented using OpenAPI.

Documentation should describe:

- endpoints
- parameters
- request schemas
- response schemas
- authentication
- error responses
- status codes
- examples

The OpenAPI specification should remain synchronized with implementation.

---

# 90. API Documentation Rule

When an API changes:

```text
Implementation
+
OpenAPI Documentation
+
Feature Specification
```

must remain consistent.

Do not update only the code.

---

# 91. API Contract Stability

Once an API is consumed by the frontend or external client, breaking changes must be controlled.

Avoid silently changing:

```text
field names
field types
status values
error codes
response structures
```

without versioning or a migration strategy.

---

# 92. Backward Compatibility

Non-breaking changes may include:

- adding optional response fields
- adding optional request fields
- adding new endpoints

Breaking changes may include:

- removing fields
- changing field types
- changing required behavior
- changing status semantics

Breaking changes require explicit versioning or migration.

---

# 93. API Transaction Boundary

Controllers should not contain complex transaction logic.

Preferred architecture:

```text
Controller
    ↓
Application Service
    ↓
Domain Operation
    ↓
Repository
```

Transactions should normally be managed at the application/service layer.

---

# 94. Cross-Module API Operations

An API endpoint may orchestrate multiple modules without making one module the owner of all involved data.

Example:

```text
POST /result-imports/{id}/process
```

may orchestrate:

```text
Result Processing
      ↓
Academic Calculation
      ↓
Backlog Tracking
      ↓
Academic Passport projection
```

Ownership remains separate.

---

# 95. Result Processing API Flow

The expected flow is:

```text
Client
  ↓
POST /result-imports/{id}/process
  ↓
Authorization
  ↓
Validation State Check
  ↓
Create Processing Job
  ↓
202 Accepted
  ↓
Background Processing
  ↓
Persist Academic Results
  ↓
Update Backlog
  ↓
Update Academic Calculations
  ↓
Update Read Models
  ↓
Audit
```

---

# 96. API and Source of Truth

The API must respect source-of-truth ownership.

Example:

```text
POST /result-imports
```

creates an import job.

It must not directly create:

```text
academic_results
```

without the required validation and processing workflow.

---

# 97. API and Academic Passport

Academic Passport APIs should read from authoritative academic data.

The API must not accept arbitrary student result information from the frontend to construct an Academic Passport.

Bad:

```http
PUT /api/v1/students/123/academic-passport
```

for arbitrary academic result changes.

The Passport should be derived from authoritative academic records.

---

# 98. API and Analytics

Analytics APIs must be read-only in MVP.

Example:

```http
GET /api/v1/analytics/dashboard
```

Analytics endpoints must not mutate:

```text
students
results
backlogs
academic structure
```

---

# 99. API and Database

The API must not expose database implementation details.

The following should remain internal:

```text
table names
column names
database joins
repository implementation
SQL
internal foreign key structure
```

The API exposes business concepts.

---

# 100. API and Frontend

Frontend components should consume API services rather than constructing database assumptions.

Example:

```text
React
  ↓
studentsApi.getStudents()
  ↓
GET /api/v1/students
```

The frontend should not assume that:

```text
student table
```

exists or mirror the database schema unnecessarily.

---

# 101. API Testing

Every API should have tests covering:

### Authentication

- valid login
- invalid login
- locked account
- logout
- unauthenticated access

### Authorization

- role access
- tenant isolation
- IDOR protection

### Validation

- required fields
- invalid values
- duplicate values

### Business Logic

- valid state transition
- invalid state transition
- duplicate processing

### Errors

- 400
- 401
- 403
- 404
- 409
- 422
- 500

---

# 102. Result Import API Testing

Tests should cover:

```text
valid Excel
valid CSV
invalid file
oversized file
missing columns
unknown student
unknown subject
duplicate record
invalid marks
invalid grade
successful validation
failed validation
successful processing
partial processing
repeated processing
```

---

# 103. Tenant Isolation Testing

For every tenant-scoped API:

```text
College A user
      ↓
College A resource → allowed

College A user
      ↓
College B resource → rejected
```

This must be tested explicitly.

---

# 104. Student Authorization Testing

For student APIs:

```text
Student A
    ↓
Student A data → allowed

Student A
    ↓
Student B data → rejected
```

The backend must enforce this regardless of frontend behavior.

---

# 105. API Performance

Performance requirements should be defined around realistic workloads.

Examples:

```text
Student list
Result list
Backlog list
Dashboard
Analytics
Import preview
Import processing
```

Large operations must use:

```text
pagination
batching
async jobs
aggregation
indexes
```

where appropriate.

---

# 106. API Caching

Caching may be used for appropriate read-heavy data.

Potential candidates:

```text
University list
Academic structure
Course metadata
Subject metadata
Dashboard summaries
```

Do not cache mutable academic information without a clear invalidation strategy.

---

# 107. Cache and Source of Truth

Caching never changes ownership.

Example:

```text
PostgreSQL
    ↓
Source of Truth

Redis
    ↓
Cache
```

If Redis contains a stale value, PostgreSQL remains authoritative.

---

# 108. API Security Rules

All protected APIs must:

1. authenticate the caller
2. authorize the operation
3. validate the request
4. enforce tenant isolation
5. prevent IDOR
6. sanitize/validate input
7. avoid sensitive data leakage
8. log security-relevant events
9. apply rate limits where appropriate
10. return safe errors

---

# 109. API Coding Rules

Backend developers and AI coding agents must follow:

### Rule 1

Do not expose JPA entities directly.

### Rule 2

Use DTOs.

### Rule 3

Do not put business logic inside controllers.

### Rule 4

Do not trust client-provided tenant IDs.

### Rule 5

Do not bypass authorization.

### Rule 6

Do not allow direct academic-result mutation from Student Portal APIs.

### Rule 7

Do not allow arbitrary backlog mutation.

### Rule 8

Use pagination for large collections.

### Rule 9

Use stable error codes.

### Rule 10

Use validation at both request and business levels.

### Rule 11

Use transactions for atomic operations.

### Rule 12

Make retryable operations idempotent.

### Rule 13

Do not return sensitive fields.

### Rule 14

Do not log secrets.

### Rule 15

Keep OpenAPI documentation synchronized with implementation.

### Rule 16

Do not invent university-specific academic rules.

### Rule 17

Do not create duplicate sources of truth.

### Rule 18

Follow the ownership defined in `data-ownership.md`.

---

# 110. API Architecture Flow

The complete request flow is:

```text
React Frontend
      ↓
HTTP Request
      ↓
API Gateway / Reverse Proxy
      ↓
Spring Security
      ↓
Authentication
      ↓
Authorization
      ↓
Tenant Context
      ↓
Controller
      ↓
Request Validation
      ↓
Application Service
      ↓
Domain Logic
      ↓
Repository
      ↓
PostgreSQL
      ↓
Response DTO
      ↓
HTTP Response
      ↓
React Frontend
```

---

# 111. Long-Running Academic Processing Flow

```text
React
  ↓
POST /result-imports/{id}/process
  ↓
Spring Security
  ↓
Authorization
  ↓
Create Processing Job
  ↓
202 Accepted
  ↓
Background Worker
  ↓
Validation Check
  ↓
Result Processing
  ↓
Academic Result
  ↓
Backlog Update
  ↓
Calculation Update
  ↓
Audit
  ↓
Job Completed
  ↓
Frontend checks status
```

---

# 112. Recommended API Module Structure

The backend API should logically follow:

```text
backend/
└── modules/
    ├── auth/
    │   ├── controller/
    │   ├── dto/
    │   └── service/
    │
    ├── colleges/
    │   ├── controller/
    │   ├── dto/
    │   └── service/
    │
    ├── students/
    ├── academic/
    ├── results/
    ├── backlogs/
    ├── passport/
    └── analytics/
```

The exact package structure will be defined in `backend-architecture.md`.

---

# 113. API Dependency Direction

The preferred dependency direction is:

```text
Controller
   ↓
Application Service
   ↓
Domain / Business Logic
   ↓
Repository
   ↓
Database
```

Avoid:

```text
Controller
   ↓
Repository
```

for business-heavy operations.

---

# 114. API Architecture and Feature Specifications

Each feature specification remains authoritative for detailed behavior.

Examples:

```text
authentication.md
        ↓
Authentication APIs

college-management.md
        ↓
College APIs

student-management.md
        ↓
Student APIs

result-import.md
        ↓
Import APIs

result-validation.md
        ↓
Validation APIs

result-processing.md
        ↓
Processing APIs

backlog-tracking.md
        ↓
Backlog APIs

academic-passport.md
        ↓
Passport APIs

analytics.md
        ↓
Analytics APIs

student-portal.md
        ↓
Student APIs
```

This document standardizes the API architecture across them.

---

# 115. API Architecture and Database Architecture

The relationship is:

```text
Database Architecture
        ↓
Data Entities / Relationships
        ↓
Domain Model
        ↓
Application Services
        ↓
API Resources
```

The API should not simply expose every database table.

---

# 116. API Architecture and Data Ownership

The relationship is:

```text
Data Ownership
      ↓
Who owns the data?
      ↓
API Architecture
      ↓
Who is allowed to mutate/read it?
```

Example:

```text
Backlog Tracking
      ↓
owns backlog
      ↓
Result Processing can trigger backlog operation
      ↓
Student can only read own backlog
```

---

# 117. API Architecture and Security

Security must be enforced at multiple levels:

```text
Authentication
      ↓
Authorization
      ↓
Tenant Isolation
      ↓
Resource Ownership
      ↓
Business Validation
      ↓
Database Constraints
```

No single layer should be treated as the only security boundary.

---

# 118. Unresolved API Decisions

The following decisions should be finalized during backend/security architecture:

## 118.1 Authentication Mechanism

Choose between the appropriate session/token architecture.

Consider:

- browser security
- refresh behavior
- CSRF
- token storage
- logout
- expiration
- multi-device sessions

---

## 118.2 Account Activation

Determine whether provisioned users:

```text
receive temporary credentials
```

or:

```text
receive an activation link
```

or use another controlled activation flow.

---

## 118.3 File Storage

Finalize whether imported files use:

```text
local development storage
```

and:

```text
S3 / Cloudflare R2 / equivalent
```

in production.

---

## 118.4 Background Job Technology

MVP may use Spring-based background processing.

If workload grows, dedicated job infrastructure may be introduced.

---

## 118.5 API Gateway

MVP may operate behind:

```text
Nginx / reverse proxy
```

A dedicated API gateway is not required unless future scale/security requirements justify it.

---

# 119. Definition of Done

API architecture is considered ready when:

- API versioning is defined
- URL conventions are defined
- resource boundaries are defined
- authentication endpoints are defined
- authorization model is defined
- tenant isolation is defined
- IDOR protection is defined
- `/me` strategy is defined
- CRUD conventions are defined
- request/response DTO strategy is defined
- validation strategy is defined
- error format is defined
- HTTP status conventions are defined
- pagination is defined
- filtering is defined
- sorting is defined
- search is defined
- idempotency requirements are defined
- asynchronous processing is defined
- file upload behavior is defined
- audit behavior is defined
- logging requirements are defined
- rate limiting requirements are defined
- CORS/security considerations are defined
- OpenAPI strategy is defined
- API testing requirements are defined
- AI coding rules are defined
- unresolved decisions are documented

---

# 120. Final API Architecture

The intended API architecture is:

```text
                    React Frontend
                          │
                          ↓
                    HTTPS / JSON
                          │
                          ↓
                    /api/v1/*
                          │
                          ↓
                 Spring Security
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
        Authentication          Authorization
                                      │
                                      ↓
                               Tenant Context
                                      │
                                      ↓
                                Controllers
                                      │
                                      ↓
                            Application Services
                                      │
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
                Students          Results          Academic
                    ↓                 ↓                 ↓
                Backlogs          Passport         Analytics
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ↓
                                 Repositories
                                      ↓
                                  PostgreSQL
```

The central API principle is:

```text
HTTP API
   ↓
Business operation
   ↓
Domain ownership
   ↓
Database integrity
```

The API must remain a **business-oriented contract**, not a direct representation of database tables.

---

# 121. Document Status

**Document:** `api-architecture.md`  
**Version:** 1.0  
**Status:** Draft / Architecture Ready

Next architecture documents:

```text
05-architecture/
├── system-architecture.md
├── frontend-architecture.md
├── backend-architecture.md
├── database-architecture.md
├── integration-architecture.md
├── data-ownership.md
└── api-architecture.md          ← Current
```

Recommended next step:

```text
api-architecture.md
        ↓
backend-architecture.md
```

`backend-architecture.md` should define how the Spring Boot application is internally structured, including modules, packages, controllers, services, domain logic, repositories, security, background jobs, exception handling, transactions, and integration boundaries.