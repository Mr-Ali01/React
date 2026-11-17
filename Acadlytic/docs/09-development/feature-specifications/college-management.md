# College Management Feature Specification

**Project:** Acadlytic

**Module:** College Management

**Document:** Feature Specification

**Version:** 1.0

**Status:** Draft / Implementation Ready

---

# 1. Purpose

The College Management module is responsible for creating, configuring, maintaining, and managing colleges within the Acadlytic platform.

In Acadlytic, each college represents a primary tenant boundary.

The module is responsible for:

- creating colleges;
- maintaining college information;
- assigning a College Admin;
- managing college account status;
- maintaining tenant-level configuration;
- viewing college information;
- updating college information;
- activating or deactivating colleges;
- enforcing tenant isolation;
- maintaining college-level audit events.

College Management is a foundational module because most college-specific data in Acadlytic must belong to a valid college/tenant.

---

# 2. Scope

## 2.1 MVP Scope

The MVP College Management module will support:

- College creation;
- College listing;
- College details;
- College profile update;
- College status management;
- College Admin assignment;
- College Admin replacement;
- College search;
- College filtering;
- College-level tenant isolation;
- College validation;
- College audit events;
- Protected college-management APIs;
- Protected frontend routes.

---

## 2.2 Out of Scope

The following are not part of the initial College Management MVP:

- Multi-campus hierarchy;
- Advanced campus management;
- College billing;
- Subscription management;
- College payment management;
- University API integration;
- University result synchronization;
- College attendance;
- College fee management;
- Hostel management;
- Library management;
- Transport management;
- Placement management;
- Advanced organization hierarchy;
- Custom domain management.

These may be added in future versions.

---

# 3. Actors

The College Management module initially has the following actors:

| Role | College Management Access |
|---|---|
| SUPER_ADMIN | Full platform-level college management |
| COLLEGE_ADMIN | View and update own college where permitted |
| ACADEMIC_STAFF | Limited read access where permitted |
| STUDENT | No college-management access |
| Public Visitor | No college-management access |

The exact permissions must always be enforced by the backend.

---

# 4. Core Concepts

## 4.1 College

A college represents an organization using Acadlytic.

A college is also the primary tenant boundary for college-specific data.

A college has:

```text
id
name
code
university
email
phone
address
city
state
country
postalCode
status
createdAt
updatedAt
```

The final fields may be extended according to the product requirements and database architecture.

---

## 4.2 College ID

Every college must have a unique system-generated identifier.

Example:

```text
collegeId = "clg_01HXYZ..."
```

The internal college ID should be used as the primary database reference.

The system must not rely only on the college name for identification.

---

## 4.3 College Code

A college may have a unique human-readable code.

Example:

```text
OU-HYD-001
```

The college code may be used for:

- administration;
- search;
- identification;
- imports;
- reporting;
- integrations.

College code uniqueness must be enforced according to the application's scope.

---

## 4.4 College Status

Initial college states:

```text
ACTIVE
INACTIVE
SUSPENDED
```

### ACTIVE

The college is operational and authorized users may access permitted college functionality.

### INACTIVE

The college is not currently active.

College users should not be able to perform normal authenticated college operations while the college is inactive, according to the authentication and authorization rules.

### SUSPENDED

The college has been explicitly suspended.

College access must be blocked according to platform security rules.

---

# 5. College Creation

College creation is a platform-level administrative operation.

Only a `SUPER_ADMIN` may create a new college in the MVP.

```text
SUPER_ADMIN
      ↓
Create College
      ↓
Validate College Data
      ↓
Check Uniqueness
      ↓
Create College
      ↓
Assign College Admin
      ↓
Create Audit Event
```

A College Admin must not be able to create another college.

---

# 6. College Creation API

Endpoint:

```http
POST /api/v1/colleges
```

Example request:

```json
{
  "name": "ABC Degree College",
  "code": "ABC-001",
  "university": "Osmania University",
  "email": "admin@abc.edu",
  "phone": "+91XXXXXXXXXX",
  "address": "Hyderabad",
  "city": "Hyderabad",
  "state": "Telangana",
  "country": "India",
  "postalCode": "500000"
}
```

The backend must:

1. authenticate the requesting user;
2. verify `SUPER_ADMIN` authorization;
3. validate the request;
4. normalize applicable fields;
5. validate college code uniqueness;
6. validate required fields;
7. create the college;
8. assign the initial status;
9. create the audit event.

---

# 7. Initial College Status

A newly created college should normally receive:

```text
ACTIVE
```

unless the platform provisioning workflow explicitly requires another initial state.

The status must not be determined solely by a client-provided value.

The backend must control the initial state.

---

# 8. College Admin Assignment

A College Admin is responsible for managing a specific college.

During initial provisioning, the Super Admin may assign a College Admin to the newly created college.

Example:

```text
SUPER_ADMIN
      ↓
Create College
      ↓
Create / Select College Admin
      ↓
Associate Admin with College
```

The College Admin must only receive access to the assigned college.

A College Admin must not automatically receive platform-wide administrative privileges.

---

# 9. College Admin Replacement

The Super Admin must be able to replace or change the College Admin of a college.

Example:

```text
College A

Current Admin
     ↓
Replace
     ↓
New College Admin
```

When the College Admin changes:

- the old account must lose the applicable College Admin permissions;
- the new account must receive the applicable permissions;
- the college association must remain correct;
- the change must be audited.

The old user account should not automatically be deleted unless explicitly required.

---

# 10. College Profile

A college profile contains the basic information required to identify and administer the college.

The profile may include:

```text
College Name
College Code
University
Email
Phone
Address
City
State
Country
Postal Code
Status
```

The profile should be extendable without requiring changes to unrelated modules.

---

# 11. College Profile Update

Endpoint:

```http
PUT /api/v1/colleges/{collegeId}
```

or the application's standardized partial-update convention may be used if defined by the backend architecture.

College Admin may update permitted profile information for their own college.

Super Admin may update any college.

Academic Staff and Students must not update college profile information unless explicitly authorized.

---

# 12. College Profile Update Authorization

Authorization rules:

```text
SUPER_ADMIN
    ↓
Can update any college

COLLEGE_ADMIN
    ↓
Can update own college

ACADEMIC_STAFF
    ↓
No college profile modification

STUDENT
    ↓
No college profile modification
```

The backend must verify the requested `collegeId` against the authenticated user's tenant context.

The frontend must not be trusted to enforce this restriction.

---

# 13. College Listing

Endpoint:

```http
GET /api/v1/colleges
```

College listing is primarily a Super Admin operation.

The endpoint may support:

- pagination;
- search;
- status filtering;
- university filtering;
- sorting.

Example:

```http
GET /api/v1/colleges?page=0&size=20&status=ACTIVE
```

The exact query parameter conventions must follow the project's API standards.

---

# 14. College Details

Endpoint:

```http
GET /api/v1/colleges/{collegeId}
```

The system must verify whether the authenticated user has permission to view the requested college.

Example:

```text
SUPER_ADMIN
    ↓
College A
    ✓ Allowed

COLLEGE_ADMIN A
    ↓
College A
    ✓ Allowed

COLLEGE_ADMIN A
    ↓
College B
    ✗ Rejected
```

---

# 15. College Search

The system should support searching colleges using appropriate fields.

Possible search fields:

```text
College Name
College Code
University
City
State
```

Search must respect authorization boundaries.

A College Admin must not receive unrestricted platform-wide college data unless explicitly permitted.

---

# 16. College Status Management

Endpoint:

```http
PATCH /api/v1/colleges/{collegeId}/status
```

Example request:

```json
{
  "status": "SUSPENDED"
}
```

Only authorized platform administrators may change the college's operational status.

Recommended MVP rule:

```text
SUPER_ADMIN
    ↓
Can change college status

COLLEGE_ADMIN
    ↓
Cannot suspend/deactivate own college
```

This prevents a College Admin from accidentally or intentionally disabling the tenant itself.

---

# 17. College Deactivation

The MVP should prefer deactivation over physical deletion.

Example:

```text
ACTIVE
  ↓
INACTIVE
```

Deactivation must not automatically delete:

- students;
- results;
- backlogs;
- academic records;
- audit history.

Historical data must remain preserved according to the application's retention policy.

---

# 18. College Deletion

Physical college deletion is **not part of the MVP**.

The system should use status-based deactivation instead.

This prevents accidental loss of:

```text
Students
Results
Backlogs
Academic Records
Academic Passport Data
Audit Records
```

Any future permanent deletion mechanism must require a separate data-retention and security specification.

---

# 19. Tenant Isolation

Tenant isolation is a mandatory security requirement.

Every college-specific resource must be associated with a valid college/tenant.

Example:

```text
College A
├── Users
├── Students
├── Academic Structure
├── Results
├── Backlogs
└── Academic Passports

College B
├── Users
├── Students
├── Academic Structure
├── Results
├── Backlogs
└── Academic Passports
```

College A users must not access College B's private resources.

The backend must enforce tenant isolation.

---

# 20. Tenant Context

For authenticated college users, the tenant context should come from the authenticated security context and trusted server-side data.

The backend must not trust:

```text
collegeId supplied by frontend
hidden form fields
URL parameters alone
client-side state
localStorage values
frontend filters
```

for authorization decisions.

The requested resource must be checked against the authenticated user's permitted tenant.

---

# 21. College Data Ownership

College-specific data belongs to the corresponding college tenant.

Examples:

```text
Student
    → College

Academic Program
    → College

Course
    → College

Result Record
    → Student → College

Backlog
    → Student → College

Academic Passport
    → Student → College
```

The College Management module establishes the tenant boundary.

Other modules must reference the college rather than creating independent tenant identities.

---

# 22. College Validation

The backend must validate college information before persistence.

Validation should include:

- required name;
- valid college code;
- college code uniqueness;
- valid email where provided;
- valid phone format where applicable;
- valid postal code where applicable;
- valid status;
- valid university reference where applicable.

Validation rules should be centralized and reused where appropriate.

---

# 23. College Code Uniqueness

College code must be unique according to the platform's defined uniqueness policy.

Example:

```text
ABC-001
```

cannot be assigned to two colleges if college code is globally unique.

If a duplicate code is submitted:

```text
409 Conflict
```

should be returned.

---

# 24. College Name Uniqueness

College names should not automatically be treated as globally unique unless the product requirements explicitly require this.

Two colleges may have similar or identical names.

The system should primarily identify colleges using:

```text
collegeId
collegeCode
```

rather than relying only on college name.

---

# 25. University Association

A college may be associated with a university.

Example:

```text
College
    ↓
Osmania University
```

The university association should use the appropriate reference defined by the Academic Structure architecture.

The College Management module should not duplicate university master data.

If a University Management module is introduced later, the college should reference the university entity.

---

# 26. Audit Events

College-management operations are security- and administration-sensitive.

Recommended audit events:

```text
COLLEGE_CREATED
COLLEGE_UPDATED
COLLEGE_STATUS_CHANGED
COLLEGE_ADMIN_ASSIGNED
COLLEGE_ADMIN_REPLACED
COLLEGE_DEACTIVATED
```

Audit information may include:

```text
eventId
actorUserId
collegeId
eventType
timestamp
IP address where justified
user-agent where justified
success/failure
relevant context
```

Audit logs must not contain passwords, authentication tokens, or other sensitive credentials.

---

# 27. API Specification

## Create College

```http
POST /api/v1/colleges
```

Possible responses:

```text
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
409 Conflict
422 Unprocessable Entity
```

---

## List Colleges

```http
GET /api/v1/colleges
```

Possible responses:

```text
200 OK
401 Unauthorized
403 Forbidden
```

---

## Get College

```http
GET /api/v1/colleges/{collegeId}
```

Possible responses:

```text
200 OK
401 Unauthorized
403 Forbidden
404 Not Found
```

---

## Update College

```http
PUT /api/v1/colleges/{collegeId}
```

Possible responses:

```text
200 OK
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
```

---

## Change College Status

```http
PATCH /api/v1/colleges/{collegeId}/status
```

Possible responses:

```text
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

---

# 28. Error Handling

The College Management APIs must use the application's standardized error structure.

Example:

```json
{
  "code": "COLLEGE_NOT_FOUND",
  "message": "College was not found.",
  "timestamp": "2026-01-01T10:00:00Z"
}
```

Possible error codes:

```text
COLLEGE_NOT_FOUND
COLLEGE_CODE_ALREADY_EXISTS
COLLEGE_INVALID_STATUS
COLLEGE_ACCESS_DENIED
COLLEGE_INVALID_DATA
COLLEGE_ADMIN_ASSIGNMENT_INVALID
```

The API must not expose:

- SQL errors;
- stack traces;
- database implementation details;
- internal exception details.

---

# 29. Database Requirements

A conceptual `colleges` table should contain:

```text
colleges

id
name
code
university_id
email
phone
address
city
state
country
postal_code
status
created_at
updated_at
```

The exact columns depend on the final database architecture.

College-specific tables should reference the college using foreign keys where appropriate.

Example:

```text
students.college_id
academic_programs.college_id
users.college_id
```

---

# 30. Database Constraints

The database must enforce appropriate constraints.

Examples:

- primary key on college ID;
- unique college code;
- valid status;
- valid university foreign key where applicable;
- required fields;
- timestamps;
- appropriate indexes;
- foreign-key relationships.

Database constraints must complement backend validation.

Backend validation must not be treated as a replacement for database integrity.

---

# 31. Indexing Requirements

The database should provide appropriate indexes for common college-management operations.

Potential indexes:

```text
colleges.code
colleges.status
colleges.university_id
colleges.name
```

The final indexing strategy belongs to the database architecture and should be based on actual query patterns.

---

# 32. Frontend Requirements

College Management screens may include:

```text
/admin/colleges
/admin/colleges/create
/admin/colleges/:collegeId
/admin/colleges/:collegeId/edit
```

The College Admin interface may include:

```text
/college/settings
/college/profile
```

The exact route structure must follow the frontend architecture.

---

# 33. College List UI

The Super Admin college list should support:

- college name;
- college code;
- university;
- location;
- status;
- College Admin;
- created date;
- actions.

Actions may include:

```text
View
Edit
Change Status
Manage Admin
```

The UI must not expose actions the current user is not authorized to perform.

---

# 34. College Form Validation

The frontend should validate:

- required fields;
- college name;
- college code;
- email;
- phone;
- postal code;
- other applicable fields.

Frontend validation improves user experience.

Backend validation remains mandatory.

---

# 35. Loading and Error States

The frontend must handle:

```text
Loading
Success
Validation Error
Unauthorized
Forbidden
Not Found
Conflict
Server Error
```

For example:

```text
Loading Colleges
      ↓
Display College List
```

If the request fails:

```text
API Error
      ↓
Display Appropriate Error
```

The frontend must not silently ignore API failures.

---

# 36. Edge Cases

## Case 1: Duplicate College Code

A Super Admin attempts to create a college using an existing code.

Result:

```text
409 Conflict
```

College creation is rejected.

---

## Case 2: Unauthorized College Creation

A College Admin attempts to create a college.

Result:

```text
403 Forbidden
```

---

## Case 3: Cross-Tenant College Access

A College Admin from College A requests College B.

Result:

```text
403 Forbidden
```

or an appropriate resource-visibility response according to the application's security policy.

---

## Case 4: Invalid College ID

A request references a nonexistent college.

Result:

```text
404 Not Found
```

---

## Case 5: College Deactivated

A college is changed from:

```text
ACTIVE
```

to:

```text
INACTIVE
```

College users must be prevented from performing operations that require an active college.

Historical data must remain preserved.

---

## Case 6: Suspended College

A college is suspended.

Result:

```text
College-specific access is blocked according to platform security rules.
```

The suspension must not delete historical data.

---

## Case 7: College Admin Removed

A College Admin is replaced or removed.

Result:

```text
Old Admin
    ↓
College Admin permission removed

New Admin
    ↓
College Admin permission assigned
```

The operation must be audited.

---

## Case 8: Duplicate College Name

Two colleges have the same or similar name.

Result:

```text
Allowed unless the application's uniqueness policy explicitly prohibits it.
```

College ID and college code remain the primary identifiers.

---

# 37. Security Requirements

The College Management module must address:

- backend authorization;
- tenant isolation;
- role-based access control;
- secure college identification;
- database foreign-key integrity;
- audit logging;
- input validation;
- restricted administrative operations;
- secure API endpoints;
- protection against unauthorized status changes;
- protection against cross-tenant access.

The system must never rely solely on:

```text
frontend route guards
hidden fields
client-side role checks
URL IDs
localStorage
```

for authorization.

---

# 38. Acceptance Criteria

## AC-01 — Create College

**Given:** An authenticated Super Admin.

**When:** Valid college information is submitted.

**Then:** A new college is created successfully.

---

## AC-02 — Unauthorized College Creation

**Given:** A College Admin.

**When:** The user attempts to create a college.

**Then:** The backend rejects the request.

---

## AC-03 — Duplicate College Code

**Given:** A college already uses a specific college code.

**When:** Another college is created with the same code.

**Then:** The system rejects the request.

---

## AC-04 — View Own College

**Given:** A College Admin belonging to College A.

**When:** The administrator requests College A.

**Then:** The college information is returned.

---

## AC-05 — Cross-Tenant Access

**Given:** A College Admin belonging to College A.

**When:** The administrator requests College B.

**Then:** The backend rejects the request.

---

## AC-06 — Update Own College

**Given:** A College Admin with permission to update college information.

**When:** Valid profile information is submitted.

**Then:** The College A profile is updated.

---

## AC-07 — Update Another College

**Given:** A College Admin belonging to College A.

**When:** The administrator attempts to update College B.

**Then:** The backend rejects the request.

---

## AC-08 — College Status

**Given:** A Super Admin.

**When:** The administrator changes a college status.

**Then:** The status is updated and the operation is audited.

---

## AC-09 — Deactivation

**Given:** An active college.

**When:** The college is deactivated.

**Then:** Restricted college operations are blocked while historical data remains preserved.

---

## AC-10 — College Admin Assignment

**Given:** A Super Admin.

**When:** A valid College Admin is assigned to a college.

**Then:** The user receives the applicable College Admin permissions for that college.

---

## AC-11 — College Admin Replacement

**Given:** A college already has a College Admin.

**When:** The Super Admin assigns a replacement administrator.

**Then:** The old administrator loses the applicable College Admin permissions and the new administrator receives them.

---

## AC-12 — Tenant Integrity

**Given:** A college-specific resource is created.

**When:** The resource is persisted.

**Then:** It is associated with the correct college tenant.

---

## AC-13 — Audit Event

**Given:** A college-management operation is successfully completed.

**When:** The operation finishes.

**Then:** The appropriate audit event is recorded.

---

# 39. Test Scenarios

The implementation must test at least:

1. Create college successfully.
2. Create college with invalid data.
3. Create college with duplicate code.
4. Create college as Super Admin.
5. Attempt college creation as College Admin.
6. Attempt college creation as Academic Staff.
7. Attempt college creation as Student.
8. List colleges as Super Admin.
9. View college details.
10. View own college as College Admin.
11. Attempt cross-tenant college access.
12. Update own college.
13. Attempt to update another college.
14. Change college status.
15. Attempt unauthorized status change.
16. Deactivate college.
17. Verify historical data remains preserved.
18. Suspend college.
19. Assign College Admin.
20. Replace College Admin.
21. Verify old administrator permissions are removed.
22. Verify new administrator permissions are applied.
23. Validate university association.
24. Validate database foreign keys.
25. Verify audit events.
26. Verify unauthorized API requests.
27. Verify invalid college ID.
28. Verify standardized API errors.
29. Verify sensitive data is absent from logs.
30. Verify tenant isolation at database/service level.

---

# 40. AI Coding Agent Rules

When implementing College Management, the AI coding agent must:

1. Read the project architecture first.
2. Read the project rules before writing code.
3. Read this feature specification before implementation.
4. Read the Authentication specification before implementing authorization.
5. Follow the existing technology stack.
6. Not invent new roles.
7. Not invent new tenant rules.
8. Not implement authorization only on the frontend.
9. Enforce tenant isolation on the backend.
10. Never trust client-provided tenant identifiers for authorization.
11. Use database migrations for schema changes.
12. Maintain foreign-key integrity.
13. Reuse shared authentication and security infrastructure.
14. Follow existing API conventions.
15. Add automated tests.
16. Add audit events for required administrative operations.
17. Avoid modifying unrelated modules.
18. Do not physically delete college data unless explicitly specified by a future requirement.
19. Document any architectural deviation.
20. Stop and request clarification if a requirement is ambiguous.

---

# 41. Definition of Done

College Management is complete only when:

- [ ] Super Admin can create colleges.
- [ ] Unauthorized users cannot create colleges.
- [ ] College information can be viewed according to permissions.
- [ ] Authorized users can update permitted college information.
- [ ] College code uniqueness is enforced.
- [ ] College status management works.
- [ ] College Admin assignment works.
- [ ] College Admin replacement works.
- [ ] Tenant isolation works.
- [ ] Cross-tenant access is rejected.
- [ ] College deactivation works.
- [ ] Historical data remains preserved after deactivation.
- [ ] Audit events are recorded.
- [ ] API errors are standardized.
- [ ] Database constraints are implemented.
- [ ] Database migrations are tested.
- [ ] Backend authorization tests pass.
- [ ] Tenant-isolation tests pass.
- [ ] Frontend protected routes work.
- [ ] Code review passes.
- [ ] Security review passes.
- [ ] QA acceptance criteria pass.

---

# 42. Future Extensions

Future College Management capabilities may include:

- Multi-campus management;
- campus hierarchy;
- multiple departments;
- college-level subscription management;
- billing;
- usage limits;
- custom college branding;
- custom domains;
- college-specific notification settings;
- college-level integrations;
- advanced organization hierarchy;
- multi-college administration;
- enterprise multi-campus management.

These capabilities should be added as extensions without breaking the existing tenant model.

---

# 43. Related Documents

This feature specification should be read together with:

```text
03-prd/product-requirements.md
03-prd/mvp-scope.md
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

04-tech-stack/backend.md
04-tech-stack/frontend.md
04-tech-stack/database.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/frontend-architecture.md
05-architecture/database-architecture.md

07-project-rules/coding-rules.md
07-project-rules/backend-rules.md
07-project-rules/frontend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/authentication.md

10-testing/test-strategy.md
11-security/security-review.md
12-code-review/review-checklist.md
```

---

# 44. Document Status

```text
Feature: College Management
Specification: Complete
Implementation: Not Started
Testing: Not Started
Security Review: Not Started
Code Review: Not Started
QA: Not Started
```

This document defines **what College Management must do**.

It does not define every Java class, React component, SQL query, or implementation detail. Those belong to the implementation phase and must follow this specification.