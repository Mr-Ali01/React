# College Management Implementation

**Document:** `09-development/implementation-notes/college-management-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — College & Tenant Management  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for College Management in Acadlytic.

College Management establishes the college as the primary tenant boundary for college-scoped application data.

It covers:

- college creation
- college listing
- college details
- college updates
- college status management
- College Admin assignment
- tenant isolation
- backend authorization
- frontend pages
- validation
- auditability
- API implementation
- database integration
- testing

---

# 2. Feature Scope

The MVP College Management implementation must support:

- Super Admin creating colleges
- Super Admin viewing colleges
- Super Admin viewing college details
- authorized college information updates
- college status management
- College Admin assignment/replacement
- tenant-aware access
- college-level authorization
- auditability
- protected APIs
- responsive frontend management pages

---

# 3. College as Tenant

Acadlytic is a multi-tenant application.

For college-scoped functionality:

```text
College
   ↓
Tenant Boundary
   ↓
Students
Academic Structure
Results
Backlogs
Analytics
Academic Passport
Users
```

The college is therefore more than an ordinary CRUD entity.

It establishes the security and data-isolation boundary for college-scoped records.

---

# 4. Ownership

College Management owns:

```text
College
College Identity
College Status
College Administrative Metadata
College Admin Assignment
```

It does not own:

```text
Student Academic Records
Courses
Subjects
Results
Backlogs
Academic Passport
Analytics
```

Those remain owned by their respective modules.

---

# 5. MVP Authority

Only `SUPER_ADMIN` creates a college in the MVP.

```text
SUPER_ADMIN
      ↓
Create College
      ↓
College Tenant
      ↓
Assign College Admin
```

A College Admin must not create another college.

---

# 6. Supported Roles

College Management interacts with:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Primary management authority:

```text
SUPER_ADMIN
```

College-scoped access:

```text
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

according to their authorized operations.

---

# 7. College Lifecycle

A college should have an explicit lifecycle.

Conceptually:

```text
Created
   ↓
Active
   ↓
Suspended
   ↓
Inactive
```

The final status enum must be consistent with the database and product specification.

---

# 8. No Physical Deletion in MVP

College deletion should not be implemented as physical database deletion in the MVP.

Instead:

```text
Active
  ↓
Suspended / Inactive
```

This preserves:

- historical records
- academic results
- student history
- audit records
- relationships
- reporting integrity

---

# 9. Conceptual College Model

The conceptual college model is:

```text
College
├── id
├── name
├── code
├── university_id
├── email
├── phone
├── address
├── city
├── state
├── country
├── postal_code
├── status
├── created_at
└── updated_at
```

The exact database schema must be implemented through migrations.

---

# 10. College Identifier

Every college must have a stable internal identifier.

The identifier should be:

- unique
- immutable
- used for relationships
- safe for API resource identification

The identifier must not be used as a substitute for authorization.

---

# 11. College Code

Each college should have a unique college code.

Example:

```text
OU-ABC-001
```

The code should be:

- unique
- validated
- normalized consistently
- stable after creation unless an explicit administrative workflow permits change

College name does not need to be globally unique.

---

# 12. College Name

Multiple colleges may have the same or similar names.

Therefore:

```text
college.name
```

must not be used as the unique tenant identifier.

The system should rely on:

```text
college.id
college.code
```

for reliable identification.

---

# 13. University Relationship

The conceptual college model contains:

```text
university_id
```

This supports future university-specific academic configuration.

The University master structure must be defined by the Academic Structure/database architecture.

College Management should reference the university rather than duplicating university information.

---

# 14. College Creation Flow

Conceptual flow:

```text
SUPER_ADMIN
     ↓
Open College Management
     ↓
Create College
     ↓
Enter College Information
     ↓
Validate Request
     ↓
Validate College Code
     ↓
Validate University
     ↓
Create College
     ↓
Audit Event
     ↓
College Created
```

---

# 15. College Creation Authorization

The backend must verify:

```text
Authenticated?
       ↓
SUPER_ADMIN?
       ↓
Allowed?
```

A frontend-only restriction is insufficient.

Even if the UI hides the Create College button, the API must independently reject unauthorized requests.

---

# 16. College Creation API

Primary endpoint:

```text
POST /api/v1/colleges
```

Conceptual request:

```json
{
  "name": "Example College",
  "code": "EXC001",
  "universityId": "...",
  "email": "college@example.edu",
  "phone": "...",
  "address": "...",
  "city": "...",
  "state": "...",
  "country": "India",
  "postalCode": "..."
}
```

The exact DTO must be defined by the API contract.

---

# 17. College Creation Validation

The backend should validate:

- required fields
- name format
- code format
- code uniqueness
- university existence
- email format
- phone format where applicable
- postal code format where applicable
- supported status
- field length limits

The backend remains authoritative even when frontend validation exists.

---

# 18. College Code Uniqueness

The application should check code uniqueness before creation.

The database must also enforce uniqueness.

This provides:

```text
Application Validation
+
Database Constraint
```

Both layers are required.

---

# 19. Race Condition Protection

Two administrators could theoretically submit the same college code simultaneously.

Therefore:

```text
Application Check
```

must not be considered sufficient.

The database unique constraint remains the final integrity boundary.

A duplicate constraint violation should be converted into a stable API error.

---

# 20. College List

Primary endpoint:

```text
GET /api/v1/colleges
```

The list should support appropriate:

- pagination
- search
- filtering
- sorting

At minimum, Super Admin should be able to find colleges efficiently.

---

# 21. College Search

Search may support fields such as:

- college name
- college code
- city
- state
- status

Search behavior should be standardized with the project's API architecture.

Avoid loading the entire college table into the browser for search.

---

# 22. College Filtering

Possible filters:

```text
status
university
state
city
```

Only filters required by the current product scope should be implemented.

Do not introduce unnecessary filter complexity.

---

# 23. College Pagination

College lists should use server-side pagination.

Conceptually:

```text
GET /api/v1/colleges?page=0&size=20
```

The exact query convention must follow the API architecture.

The frontend should not assume that all colleges are returned in one response.

---

# 24. College Detail

Endpoint:

```text
GET /api/v1/colleges/{collegeId}
```

The response should contain the college information required by the management UI.

It should not automatically expose unrelated student or academic records.

---

# 25. College Detail Authorization

For Super Admin:

```text
SUPER_ADMIN
    ↓
Authorized College
```

For College Admin:

```text
COLLEGE_ADMIN
    ↓
Own College Only
```

For other roles:

```text
ACADEMIC_STAFF / STUDENT
    ↓
Only where explicitly required
```

---

# 26. College Update

Endpoint:

```text
PUT /api/v1/colleges/{collegeId}
```

or an equivalent partial-update design where defined by the API contract.

The backend must verify:

- authentication
- role
- tenant/resource ownership
- valid fields
- university reference
- code uniqueness where code changes are allowed

---

# 27. College Admin Update Rights

A College Admin may update permitted information for their own college.

The implementation must distinguish between:

```text
Platform-level fields
```

and:

```text
College-editable fields
```

A College Admin must not modify platform-controlled fields without explicit permission.

---

# 28. Super Admin Update Rights

Super Admin may update authorized college information across tenants.

However, Super Admin access should still follow explicit application rules.

Do not assume unrestricted access means every future field is editable.

---

# 29. Immutable Fields

Some fields should normally be treated as stable identifiers.

Potential immutable fields:

```text
id
```

Potentially controlled fields:

```text
code
university_id
```

Whether these can change must be explicitly defined.

Changing tenant identity fields can have significant downstream consequences.

---

# 30. College Status Management

Endpoint:

```text
PATCH /api/v1/colleges/{collegeId}/status
```

Conceptual request:

```json
{
  "status": "SUSPENDED"
}
```

The backend must validate permitted status transitions.

---

# 31. Status Transition Rules

The implementation should prevent invalid lifecycle transitions.

Conceptually:

```text
ACTIVE
  ↓
SUSPENDED

SUSPENDED
  ↓
ACTIVE

ACTIVE
  ↓
INACTIVE
```

The exact lifecycle rules must be finalized before implementation.

---

# 32. Suspended College Behavior

When a college becomes suspended:

- new access should be restricted according to policy
- college users may be prevented from logging in
- new academic operations may be blocked
- historical data should remain preserved
- audit history should remain available to authorized administrators

The exact restrictions must be implemented consistently across authentication and feature modules.

---

# 33. College Status and Authentication

College status must integrate with authentication.

Conceptually:

```text
User Login
    ↓
User Active?
    ↓
College Active?
    ↓
Allow / Reject
```

A college-scoped user should not remain fully operational if the tenant itself has been suspended, unless an explicit administrative exception exists.

---

# 34. College Admin Assignment

College Admin assignment connects:

```text
College
   ↕
User
```

A College Admin must belong to the college they administer.

---

# 35. College Admin Assignment Flow

Conceptually:

```text
SUPER_ADMIN
     ↓
Select College
     ↓
Select / Create College Admin
     ↓
Validate User Role
     ↓
Validate College Assignment
     ↓
Assign
     ↓
Audit
```

---

# 36. Assignment Validation

Before assignment:

```text
User exists?
       ↓
Role = COLLEGE_ADMIN?
       ↓
Eligible account status?
       ↓
College assignment valid?
       ↓
Proceed
```

The backend must perform all checks.

---

# 37. Admin Replacement

If a college already has an assigned College Admin, replacement must be handled explicitly.

Conceptually:

```text
Existing Admin
      ↓
Replacement Request
      ↓
Validate New Admin
      ↓
Remove/Deactivate Previous Assignment
      ↓
Assign New Admin
      ↓
Audit
```

Historical audit records must remain intact.

---

# 38. Multiple College Admins

Whether a college may have:

```text
one College Admin
```

or:

```text
multiple College Admins
```

must be finalized as a product/business rule.

The implementation should not silently assume a one-to-one relationship unless the approved design requires it.

---

# 39. User Provisioning Integration

College Management depends on Authentication/User Provisioning.

College creation itself is owned by College Management.

College Admin account creation is owned by Authentication/User Provisioning.

Therefore:

```text
College Management
       ↓
Requests / coordinates
       ↓
User Provisioning
```

Avoid duplicating user creation logic inside College Management.

---

# 40. Transaction Boundary

Where college creation and related administrative setup are performed together, transaction boundaries must be explicit.

For example:

```text
Create College
      +
Create/Assign Admin
```

may require transactional coordination depending on the final workflow.

The system must avoid partial administrative state.

---

# 41. Tenant Isolation

Tenant isolation is a mandatory security requirement.

For college-scoped users:

```text
Authenticated User
      ↓
Assigned College
      ↓
Allowed Resources
```

A request must never be able to arbitrarily change the tenant by modifying:

```text
collegeId
```

in a URL or request body.

---

# 42. IDOR Prevention

Unsafe:

```text
GET /api/v1/colleges/25
```

with no authorization check.

Safe conceptual flow:

```text
Request
 ↓
Authenticated Principal
 ↓
Role
 ↓
College Relationship
 ↓
Resource Authorization
 ↓
Allow / Deny
```

---

# 43. Super Admin Tenant Scope

Super Admin operates at the platform level.

Therefore, Super Admin may be authorized to access multiple colleges.

This does not remove the requirement for explicit authorization checks.

The backend should identify Super Admin as a platform-level actor rather than treating it as a normal college tenant user.

---

# 44. College Admin Tenant Scope

College Admin must always be associated with a college.

A College Admin request should resolve to:

```text
authenticatedUser.collegeId
```

or its equivalent trusted relationship.

The client must not define the tenant boundary.

---

# 45. Academic Staff Tenant Scope

Academic Staff must also operate within their assigned college.

Any future cross-college role must be modeled explicitly rather than inferred.

---

# 46. Student Tenant Scope

Students belong to a college through their academic identity.

Student access should normally use:

```text
/api/v1/me/*
```

for self-service operations.

This reduces unnecessary exposure to arbitrary identifiers.

---

# 47. College Repository

The repository should provide persistence operations appropriate to the College entity.

Potential operations:

```text
findById()
findByCode()
existsByCode()
findAll()
search()
save()
```

The exact repository interface should follow Spring Data JPA conventions.

---

# 48. College Service

The application service should coordinate:

- creation
- retrieval
- update
- status changes
- authorization checks
- validation
- audit events
- transaction boundaries

The service must not expose persistence entities directly through API controllers.

---

# 49. College Controller

The controller should remain thin.

Conceptually:

```text
CollegeController
      ↓
Validate DTO
      ↓
Call CollegeService
      ↓
Return DTO
```

The controller should not contain:

- SQL
- repository logic
- tenant business rules
- status transition logic
- authorization bypasses

---

# 50. DTO Strategy

Use separate DTOs for API boundaries.

Potential DTOs:

```text
CreateCollegeRequest
UpdateCollegeRequest
UpdateCollegeStatusRequest
CollegeResponse
CollegeSummaryResponse
CollegePageResponse
```

Do not expose JPA entities directly.

---

# 51. College Response

A college response may contain:

```text
id
name
code
university
contact information
location
status
createdAt
updatedAt
```

The exact response fields should match frontend requirements and API design.

---

# 52. Error Handling

Expected errors include:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
```

The exact status mapping should follow the global API error contract.

---

# 53. College Not Found

If a requested college does not exist:

```text
404 Not Found
```

should be returned where appropriate.

Do not expose database-specific exception messages.

---

# 54. Duplicate College Code

If a college code already exists:

```text
409 Conflict
```

with a stable application error code should be returned.

Example conceptual error:

```json
{
  "code": "COLLEGE_CODE_ALREADY_EXISTS",
  "message": "The college code is already in use."
}
```

The final error contract must follow the API architecture.

---

# 55. Validation Errors

Validation errors should identify relevant fields without exposing internal implementation details.

Example:

```json
{
  "code": "VALIDATION_ERROR",
  "fieldErrors": {
    "name": "College name is required."
  }
}
```

The exact error schema must remain consistent across the application.

---

# 56. Audit Events

College Management should record important administrative events.

Examples:

```text
COLLEGE_CREATED
COLLEGE_UPDATED
COLLEGE_STATUS_CHANGED
COLLEGE_ADMIN_ASSIGNED
COLLEGE_ADMIN_REPLACED
```

The final audit event taxonomy must be standardized.

---

# 57. Audit Actor

Each administrative event should identify:

```text
actor
action
target
timestamp
result
```

Example:

```text
SUPER_ADMIN
    ↓
COLLEGE_CREATED
    ↓
College: ABC College
    ↓
Timestamp
```

---

# 58. Audit Data Integrity

Audit history should not be casually deleted when a college is deactivated.

Historical administrative actions must remain available according to retention policy.

---

# 59. Frontend College Management

The frontend should provide management pages according to the approved navigation:

```text
/app/colleges
/app/colleges/new
/app/colleges/:collegeId
/app/colleges/:collegeId/edit
```

---

# 60. College List Page

The College List page should support:

- page title
- search
- filters where required
- create action for authorized users
- table/list
- status display
- pagination
- loading state
- empty state
- error state

---

# 61. College Table

Potential columns:

```text
College
Code
University
Location
Status
Created
Actions
```

The exact columns should follow page specifications.

---

# 62. College Create Page

The create page should contain:

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
```

Only required fields should be marked required.

---

# 63. College Edit Page

The edit page should load existing college data before rendering editable fields.

Conceptual flow:

```text
Open Edit
   ↓
GET College
   ↓
Loading
   ↓
Populate Form
   ↓
Edit
   ↓
Submit
```

Avoid rendering stale or undefined values as valid form state.

---

# 64. College Detail Page

The detail page should present:

- college identity
- university
- contact information
- location
- status
- administrative information
- relevant actions

It should not become a general dashboard for unrelated academic data.

---

# 65. Status Action UI

Status changes should use an explicit confirmation pattern for destructive or operationally significant actions.

Example:

```text
Active
   ↓
Suspend College
   ↓
Confirmation
   ↓
API Request
   ↓
Updated Status
```

---

# 66. Loading States

College pages should provide loading states for:

- list loading
- detail loading
- form initialization
- submit
- status changes

Buttons performing mutations should prevent accidental duplicate submission.

---

# 67. Empty State

If no colleges exist:

```text
No colleges found.
```

The UI should distinguish between:

```text
No colleges exist
```

and:

```text
No colleges match the current search/filter.
```

---

# 68. Error State

The frontend should show a useful error state when:

- list loading fails
- college detail fails
- create fails
- update fails
- status change fails

Technical server errors should not be dumped directly into the UI.

---

# 69. Frontend API Layer

College API methods should be centralized.

Conceptually:

```text
collegeApi.list()
collegeApi.getById()
collegeApi.create()
collegeApi.update()
collegeApi.updateStatus()
```

Components should not manually construct Axios requests.

---

# 70. TanStack Query

Server state should use TanStack Query.

Conceptually:

```text
useColleges()
useCollege(collegeId)
useCreateCollege()
useUpdateCollege()
useUpdateCollegeStatus()
```

Mutation success should invalidate or update affected queries.

---

# 71. Query Invalidation

After creating a college:

```text
Create College
    ↓
Invalidate College List
```

After updating:

```text
Update College
    ↓
Invalidate/Update:
    College Detail
    College List
```

After status change:

```text
Update Status
    ↓
Refresh affected queries
```

---

# 72. Form Handling

College forms should use the established frontend form architecture.

Expected technologies:

```text
React Hook Form
+
Zod
```

Frontend validation improves UX.

Backend validation remains authoritative.

---

# 73. Form Submission

Submission flow:

```text
User
 ↓
Client Validation
 ↓
API Request
 ↓
Server Validation
 ↓
Success / Error
```

The frontend must map backend field errors to the appropriate form controls where possible.

---

# 74. Unsaved Changes

If the edit page supports navigation warnings, this behavior should be implemented consistently across the application.

Do not introduce page-specific unsaved-change logic that conflicts with shared navigation behavior.

---

# 75. Role-Aware UI

The frontend should hide or disable actions that the current role cannot perform.

For example:

```text
Create College
```

should only appear to authorized users.

However:

> UI visibility is not authorization.

The backend must enforce the actual permission.

---

# 76. Responsive Behavior

College management pages must follow the responsive design specification.

Desktop:

```text
Sidebar
Main Content
Wide Table
```

Mobile:

```text
Header
Navigation Drawer
Stacked Filters
Responsive Cards/List
```

Wide tables should not create uncontrolled page-level horizontal overflow.

---

# 77. Accessibility

College management must support:

- keyboard navigation
- visible focus states
- accessible form labels
- accessible error messages
- semantic buttons
- meaningful table headers
- dialog accessibility
- appropriate ARIA attributes
- sufficient contrast

Do not use color alone to communicate status.

---

# 78. College Status Presentation

Status should be represented using:

```text
Label
+
Semantic visual indicator
```

Examples:

```text
Active
Suspended
Inactive
```

Color alone must not communicate the state.

---

# 79. Backend Test Structure

Tests should cover:

```text
Controller
Service
Repository
Authorization
Tenant Isolation
Integration
```

The exact testing strategy follows the backend testing foundation.

---

# 80. College Creation Tests

Test:

```text
Valid creation
Missing name
Missing code
Duplicate code
Invalid university
Invalid email
Unauthorized role
Malformed request
```

---

# 81. College Update Tests

Test:

```text
Valid update
Unauthorized update
Cross-tenant update
Invalid fields
Nonexistent college
Duplicate code
Immutable field manipulation
```

---

# 82. Status Tests

Test:

```text
Valid status change
Invalid status change
Unauthorized status change
Suspended college behavior
Repeated status update
Nonexistent college
```

---

# 83. Tenant Isolation Tests

Explicitly test:

```text
College A user
     ↓
College B resource
     ↓
403 / 404 according to security policy
```

Test direct manipulation of:

```text
collegeId
URL parameters
request body
query parameters
```

---

# 84. College Admin Tests

Test:

```text
Super Admin creates College Admin
Super Admin assigns College Admin
Super Admin replaces College Admin
College Admin accesses own college
College Admin attempts another college
Staff attempts admin operation
Student attempts admin operation
```

---

# 85. Frontend Tests

Test:

```text
College list renders
Search works
Pagination works
Create form validates
Create succeeds
Create failure displays correctly
Detail page loads
Edit page loads
Update succeeds
Status confirmation works
Unauthorized actions are hidden
Loading states work
Empty states work
```

---

# 86. Integration Test Flow

An end-to-end college workflow should verify:

```text
Login as Super Admin
       ↓
Create College
       ↓
College Appears in List
       ↓
Open College
       ↓
Update College
       ↓
Assign College Admin
       ↓
Verify Admin Tenant
       ↓
Suspend College
       ↓
Verify College User Restrictions
```

---

# 87. Performance Considerations

College Management is not expected to be a high-volume module compared with results or analytics.

Nevertheless:

- use pagination
- avoid unnecessary joins
- avoid N+1 queries
- index college code
- index status where useful
- index university relationship
- avoid loading unrelated academic data on the college detail page

---

# 88. Database Indexing

At minimum, consider indexes/constraints for:

```text
college.code UNIQUE
college.university_id
college.status
```

Additional indexes should be based on actual query patterns.

Do not add indexes without understanding their write/storage cost.

---

# 89. Transaction Management

Use transactions for state-changing operations where multiple records must remain consistent.

Examples:

```text
College Admin assignment
College Admin replacement
College status transition
```

The exact transaction boundary must be defined at the service/application layer.

---

# 90. Concurrency

Potential concurrent scenarios include:

- two admins editing the same college
- simultaneous status changes
- simultaneous admin assignment
- duplicate college creation attempts

The implementation should use appropriate database constraints and concurrency controls.

Optimistic locking may be considered where meaningful.

---

# 91. API Security

All protected College Management APIs must verify:

```text
Authentication
+
Authorization
+
Tenant Scope
+
Resource Access
```

Do not rely solely on controller-level role annotations if resource-level authorization is also required.

---

# 92. Data Exposure

College APIs should expose only the fields required by the requesting role.

Avoid exposing:

- internal database details
- security information
- unrelated user data
- unnecessary audit information
- internal identifiers not required by the client

---

# 93. Implementation Sequence

Recommended sequence:

```text
1. Create College database migration
2. Create College entity/model
3. Create College repository
4. Create College DTOs
5. Implement College service
6. Implement authorization checks
7. Implement create API
8. Implement list API
9. Implement detail API
10. Implement update API
11. Implement status API
12. Implement audit events
13. Implement College Admin assignment integration
14. Add backend tests
15. Create frontend College API layer
16. Create College queries/mutations
17. Create College List page
18. Create College Create page
19. Create College Detail page
20. Create College Edit page
21. Implement status actions
22. Add frontend tests
23. Run tenant-isolation tests
24. Run end-to-end workflow
25. Security review
```

---

# 94. Acceptance Criteria

College Management is acceptable when:

### College Creation

- [ ] Only authorized Super Admin users can create colleges.
- [ ] Required fields are validated.
- [ ] College code is unique.
- [ ] University relationship is validated.
- [ ] Invalid requests are rejected.
- [ ] Successful creation is auditable.

### College Retrieval

- [ ] Authorized users can list colleges.
- [ ] Pagination works.
- [ ] Search works where implemented.
- [ ] Detail page returns correct information.
- [ ] Unauthorized access is rejected.

### College Update

- [ ] Authorized users can update permitted fields.
- [ ] Unauthorized users cannot update colleges.
- [ ] Cross-tenant updates are prevented.
- [ ] Validation is enforced.
- [ ] Changes are auditable.

### Status

- [ ] Status changes are authorized.
- [ ] Invalid transitions are prevented.
- [ ] Historical data remains preserved.
- [ ] Suspended/inactive behavior integrates with authentication.

### College Admin

- [ ] Super Admin can assign a College Admin.
- [ ] Admin assignment validates role.
- [ ] Admin assignment validates tenant relationship.
- [ ] Replacement is handled safely.
- [ ] Assignment is auditable.

### Security

- [ ] Tenant isolation is enforced server-side.
- [ ] IDOR attempts fail.
- [ ] Frontend restrictions are not treated as security controls.
- [ ] No unauthorized college data is exposed.

### Frontend

- [ ] College list works.
- [ ] Create form works.
- [ ] Detail page works.
- [ ] Edit page works.
- [ ] Status actions work.
- [ ] Loading, empty, and error states work.
- [ ] Responsive behavior works.
- [ ] Accessibility requirements are met.

---

# 95. Definition of Done

College Management is considered implemented when:

1. College persistence is operational.
2. Database constraints are applied.
3. College creation works.
4. College listing works.
5. College detail works.
6. College updates work.
7. College status management works.
8. Tenant boundaries are enforced.
9. College Admin assignment works.
10. Authentication integration works.
11. Audit events are recorded.
12. Backend authorization tests pass.
13. Tenant isolation tests pass.
14. Frontend management pages are implemented.
15. Frontend API integration is complete.
16. Responsive behavior is verified.
17. Accessibility checks pass.
18. Integration workflow passes.
19. Security review passes.
20. No known critical authorization defect remains.

---

# 96. Unresolved Implementation Decisions

The following decisions remain subject to review:

- exact college status enum
- exact status transition rules
- one vs multiple College Admins per college
- exact university master implementation
- whether college code can ever be changed
- College Admin editable fields
- Super Admin field permissions
- college suspension behavior
- whether Super Admin can access all college academic data directly
- exact audit event storage model
- optimistic locking requirement
- exact API error codes
- college archival policy
- retention policy for inactive colleges

---

# 97. Relationship With Other Documents

This document depends on:

```text
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/database-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md

06-design/navigation.md
06-design/page-specifications.md
06-design/responsive-design.md

07-project-rules/coding-rules.md
07-project-rules/frontend-rules.md
07-project-rules/backend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/college-management.md

09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
09-development/implementation-notes/frontend-foundation.md
09-development/implementation-notes/authentication-implementation.md
```

It provides the foundation for:

```text
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

# 98. AI-Assisted Development Rules

AI coding assistants implementing College Management must:

- read the relevant architecture documents first
- read `college-management.md`
- read authentication implementation
- respect tenant isolation
- never bypass backend authorization
- never expose JPA entities directly
- never invent database fields
- never invent status values
- never create public college self-registration
- never silently add cross-tenant access
- never use college name as the tenant identifier
- preserve audit requirements
- reuse existing API/error patterns
- reuse shared frontend components
- follow established React Query patterns
- follow established form validation patterns
- write tests for authorization-sensitive changes
- flag unresolved decisions rather than inventing policy

AI-generated code must not silently change the security model.

---

# 99. Review Checklist

Before moving this document to `Approved`, verify:

```text
□ College ownership is clear
□ Tenant boundary is clear
□ Creation authority is clear
□ College Admin authority is clear
□ Status lifecycle is defined
□ No-delete policy is preserved
□ API endpoints match API architecture
□ DTO strategy is consistent
□ Authentication integration is clear
□ Tenant isolation is explicit
□ IDOR prevention is explicit
□ Audit requirements are clear
□ Frontend pages match navigation
□ Responsive behavior is defined
□ Testing requirements are defined
□ Unresolved decisions are documented
```

---

# 100. Status

**Draft / Under Review**

This document is not yet considered implementation-approved.

The implementation should proceed through:

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

# 101. Final College Management Principle

> **A college is a tenant boundary, not merely a CRUD record.**

The implementation must therefore preserve this invariant:

```text
College
   ↓
Tenant Context
   ↓
Authorized Users
   ↓
Authorized Resources
   ↓
Authorized Operations
```

Every college-scoped operation must respect this boundary while preserving historical academic and administrative data.