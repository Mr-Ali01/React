# Student Management Implementation

**Document:** `09-development/implementation-notes/student-management-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Student Management  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for Student Management in Acadlytic.

Student Management establishes the student identity and academic enrollment context required by:

- result import
- result validation
- result processing
- backlog tracking
- Academic Passport
- analytics
- student portal

The student record is a core domain entity, but it is not the authoritative source for academic result history.

---

# 2. Core Principle

A student represents an academic identity within a college.

Conceptually:

```text
College
   ↓
Student
   ↓
Course / Program
   ↓
Academic Records
```

Student Management owns the student identity and enrollment context.

Academic result history remains owned by Result Processing.

---

# 3. Scope

The MVP Student Management implementation covers:

- student creation
- student listing
- student search
- student detail
- student profile updates
- student status
- student-course association
- student identifiers
- tenant isolation
- account relationship
- validation
- APIs
- frontend management
- result-import compatibility
- Academic Passport compatibility
- testing

---

# 4. Out of Scope

The MVP does not implement:

- student self-registration
- fees
- attendance
- hostel
- library
- transport
- placement
- course registration
- exam registration
- student academic result editing
- AI-based student risk prediction
- What-If simulation
- automatic university synchronization

---

# 5. Student Ownership

Student Management owns:

```text
Student Identity
Student Profile
Student Identifier
College Association
Course / Program Association
Student Status
Enrollment Context
```

It does not own:

```text
Processed Results
SGPA / CGPA History
Backlogs
Academic Passport
Analytics
```

Those belong to their respective modules.

---

# 6. Student as Tenant-Scoped Entity

Students are college-scoped.

Conceptually:

```text
College A
├── Student A1
├── Student A2
└── Student A3

College B
├── Student B1
├── Student B2
└── Student B3
```

A user from College A must never access College B students unless an explicitly authorized platform-level role allows it.

---

# 7. Student Identity

Every student requires a stable internal identifier.

Conceptually:

```text
student.id
```

The internal ID must be:

- unique
- immutable
- safe for API resource identification
- independent of student display name
- independent of university registration number

---

# 8. University Student Identifier

A student normally has an official academic identifier such as:

```text
University Registration Number
Roll Number
Enrollment Number
Student ID
```

The exact terminology depends on the university.

Acadlytic should support a stable external/academic identifier for result matching.

---

# 9. Student Identifier Principle

The official student identifier should be the primary matching key for university result imports whenever available.

Example:

```text
Imported Registration Number
          ↓
Student Management
          ↓
Matching Student
```

Do not use student name as the primary identity key.

---

# 10. Name Matching

Names may vary because of:

- spelling differences
- capitalization
- initials
- spacing
- abbreviations
- source-file formatting

Therefore:

```text
Student Name
```

should not be treated as a unique identity.

Name may be used as supporting information during manual review, but not as the primary automatic matching key.

---

# 11. Student Status

Student status should be explicit.

Potential MVP states include:

```text
ACTIVE
INACTIVE
```

Additional statuses may be introduced if approved.

The exact status enumeration must remain consistent across the system.

---

# 12. Historical Students

A student should not be physically deleted merely because they are no longer active.

Historical students may have:

- result records
- backlog records
- passport history
- audit records
- analytics history

Therefore deactivation is preferred over physical deletion.

---

# 13. Student Lifecycle

Conceptually:

```text
Created
   ↓
Active
   ↓
Inactive
```

The final lifecycle rules must be aligned with the approved product requirements.

---

# 14. Student Course Association

A student should be associated with an academic course/program.

Conceptually:

```text
Student
   ↓
Course
   ↓
College
```

The course must belong to the student's college.

---

# 15. Course Validation

When assigning a student to a course:

```text
Student College
      ↓
Course College
      ↓
Must Match
```

The backend must reject cross-college course associations.

---

# 16. Student Enrollment Context

The student record may need enrollment information such as:

- admission year
- academic year
- course
- batch
- current semester where applicable
- enrollment/registration number
- status

Only fields required by the approved data model should be implemented.

---

# 17. Current Semester

The system must distinguish between:

```text
Student's academic structure
```

and:

```text
Latest processed result
```

A student's current semester should not be inferred blindly from the latest imported result.

If current semester is stored, it must follow an explicit enrollment/business rule.

---

# 18. Student Profile

Student profile information may include:

```text
Name
Email
Phone
Date of Birth
Gender where required
Registration Number
Course
Admission Year
Status
```

The exact fields must follow the approved product and privacy requirements.

Avoid collecting personal information that is not needed by MVP.

---

# 19. Student Account Relationship

Student Management and Authentication are separate concerns.

Conceptually:

```text
User Account
     ↕
Student Profile
```

A user account answers:

> Who can log in?

A student record answers:

> Which academic student does this identity represent?

---

# 20. Student User Provisioning

The Student account may be created through Authentication/User Provisioning.

Student Management should not duplicate password or authentication logic.

Conceptually:

```text
Student Management
      ↓
Student Identity
      ↓
Authentication/User Provisioning
      ↓
Student User Account
```

---

# 21. Student Creation Authority

Student creation in MVP should be controlled by authorized college users.

Potential authorized roles:

```text
COLLEGE_ADMIN
ACADEMIC_STAFF
```

The exact permission should follow the approved authentication and account-provisioning rules.

Students must not create academic student records for themselves.

---

# 22. Student Creation Flow

Conceptually:

```text
Authorized User
      ↓
Create Student
      ↓
Validate College
      ↓
Validate Course
      ↓
Validate Identifier
      ↓
Create Student
      ↓
Optional User Provisioning
      ↓
Audit
```

---

# 23. Student Creation API

Primary endpoint:

```text
POST /api/v1/students
```

Conceptual request:

```json
{
  "registrationNumber": "REG001",
  "name": "Example Student",
  "email": "student@example.com",
  "phone": "...",
  "courseId": "...",
  "admissionYear": 2026
}
```

The final request DTO must follow the approved API contract.

---

# 24. Student Creation Validation

Backend validation should verify:

- required fields
- registration number
- name
- email where required
- phone where required
- course existence
- course/college relationship
- admission year
- status
- duplicate student identifier

---

# 25. Student Identifier Uniqueness

The uniqueness scope must be explicitly defined.

A likely MVP rule is:

```text
College + Registration Number
```

rather than assuming the identifier is globally unique.

If the university guarantees global uniqueness, that can be represented as a stronger constraint later.

---

# 26. Duplicate Student Prevention

The system must prevent accidental creation of duplicate student identities.

Example:

```text
College A
REG001
```

already exists.

A second:

```text
College A
REG001
```

must be rejected or sent through an explicit duplicate-resolution workflow.

---

# 27. Duplicate Student Error

Conceptually:

```json
{
  "code": "STUDENT_IDENTIFIER_ALREADY_EXISTS",
  "message": "A student with this registration number already exists."
}
```

The final error contract must follow the global API error structure.

---

# 28. Student List API

Primary endpoint:

```text
GET /api/v1/students
```

The API should support:

- pagination
- search
- filtering
- sorting where required
- tenant scoping

---

# 29. Student Search

Search may support:

- registration number
- student name
- email
- course
- status

Registration number should provide the strongest exact-match behavior.

---

# 30. Student Pagination

Student lists must use server-side pagination.

Conceptually:

```text
GET /api/v1/students?page=0&size=20
```

The frontend should not assume that the entire student population is returned in one response.

---

# 31. Student Filtering

Potential filters:

```text
course
status
admissionYear
semester where explicitly supported
```

Only required filters should be implemented.

---

# 32. Student Detail API

Endpoint:

```text
GET /api/v1/students/{studentId}
```

The response should provide the student information required by the management UI.

It should not automatically return:

- full academic result history
- all analytics
- all backlog records
- unrelated sensitive data

Those belong to dedicated resources.

---

# 33. Student Detail Authorization

For College Admin:

```text
Own College Students
```

For Academic Staff:

```text
Authorized Students Within Assigned College
```

For Student:

```text
Own Student Record
```

For Super Admin:

```text
Authorized Platform-Level Access
```

The exact role permissions must follow the approved authorization matrix.

---

# 34. Student Update

Endpoint:

```text
PUT /api/v1/students/{studentId}
```

or the approved partial-update equivalent.

The backend must verify:

- authentication
- authorization
- tenant scope
- student existence
- field permissions
- validation

---

# 35. Student Profile vs Academic Data

Student Management should not allow arbitrary editing of processed academic results.

For example, an administrator editing:

```text
Student Name
```

must not automatically modify:

```text
Historical Result Records
Backlogs
Academic Passport snapshots/read models
```

unless a specific domain operation requires it.

---

# 36. Registration Number Changes

Registration number changes require special care because result import depends on the identifier.

Before allowing changes, consider:

- existing results
- import history
- backlog records
- audit records
- external university references

A controlled administrative workflow may be preferable.

---

# 37. Student Status API

Potential endpoint:

```text
PATCH /api/v1/students/{studentId}/status
```

Conceptual request:

```json
{
  "status": "INACTIVE"
}
```

Status changes must be authorized and audited.

---

# 38. Student Deactivation

Deactivation should preserve:

- student record
- result history
- backlog history
- passport history
- audit history

It should not physically delete academic data.

---

# 39. Student Login Relationship

If a student has an application account:

```text
Login
  ↓
User
  ↓
Student Association
  ↓
Student Record
```

The authenticated student's identity must be resolved from trusted server-side relationships.

---

# 40. `/me` Student Access

Student self-service should prefer:

```text
GET /api/v1/me
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

rather than requiring the student to provide arbitrary student IDs.

---

# 41. IDOR Prevention

Unsafe:

```text
GET /api/v1/students/100
```

with no ownership validation.

Safe conceptual flow:

```text
Authenticated User
       ↓
Role
       ↓
Student Association / College Scope
       ↓
Requested Student
       ↓
Authorization
       ↓
Allow / Reject
```

---

# 42. Tenant Isolation

A request must never be able to access another college's student simply by changing:

```text
studentId
collegeId
courseId
```

in the URL, body, or query parameters.

The backend must derive and verify the tenant relationship.

---

# 43. Student-to-Course Relationship Validation

Before assigning a course:

```text
Student College
       ↓
Course College
       ↓
Same?
```

If not:

```text
Reject
```

This prevents corrupted cross-tenant academic relationships.

---

# 44. Student-to-University Context

A student's academic course determines their university context through the college/academic structure.

The system should avoid duplicating university information unnecessarily.

---

# 45. Student Repository

Potential operations:

```text
findById()
findByRegistrationNumber()
existsByRegistrationNumber()
findAll()
search()
findByCollege()
findByCourse()
```

The exact method set should follow actual use cases.

---

# 46. Tenant-Aware Repository Queries

Where appropriate, use scoped queries such as:

```text
findStudentByIdAndCollegeId()
```

This reduces accidental cross-tenant retrieval.

---

# 47. Student Service

The service layer should coordinate:

- student creation
- student retrieval
- student update
- status changes
- course association
- authorization
- tenant validation
- audit events
- account provisioning integration

---

# 48. Student Controller

The controller should remain thin.

Conceptually:

```text
StudentController
      ↓
Request DTO Validation
      ↓
StudentService
      ↓
Response DTO
```

The controller should not contain:

- SQL
- persistence logic
- complex academic business rules
- direct entity exposure

---

# 49. DTO Strategy

Potential DTOs:

```text
CreateStudentRequest
UpdateStudentRequest
UpdateStudentStatusRequest
StudentResponse
StudentSummaryResponse
StudentPageResponse
```

Use separate request and response DTOs where appropriate.

---

# 50. Student Response

A management response may contain:

```text
id
registrationNumber
name
email
phone
course
admissionYear
status
createdAt
updatedAt
```

The exact response should be role-aware and privacy-conscious.

---

# 51. Sensitive Information

Only necessary student personal data should be returned.

Avoid unnecessarily exposing:

- authentication credentials
- password information
- internal security identifiers
- unrelated personal information
- full academic records from a basic student endpoint

---

# 52. Student Management Audit

Important events may include:

```text
STUDENT_CREATED
STUDENT_UPDATED
STUDENT_STATUS_CHANGED
STUDENT_COURSE_CHANGED
STUDENT_ACCOUNT_LINKED
STUDENT_ACCOUNT_CREATED
```

The final audit taxonomy should be standardized.

---

# 53. Audit Actor

Administrative actions should capture:

```text
actor
action
target student
timestamp
result
```

Historical audit data must remain intact.

---

# 54. Frontend Routes

Student Management follows:

```text
/app/students
/app/students/new
/app/students/:studentId
/app/students/:studentId/edit
```

Additional student-specific academic routes belong to their respective modules.

---

# 55. Student List Page

The Student List page should provide:

- page title
- search
- filters
- create action for authorized users
- student table/list
- status
- course
- registration number
- pagination
- loading state
- empty state
- error state

---

# 56. Student Table

Potential columns:

```text
Student
Registration Number
Course
Admission Year
Status
Actions
```

The table should avoid exposing unnecessary personal information.

---

# 57. Student Create Page

Potential fields:

```text
Registration Number
Student Name
Email
Phone
Course
Admission Year
Status
```

Only approved fields should be collected.

---

# 58. Student Edit Page

Flow:

```text
Open Edit
   ↓
Load Student
   ↓
Populate Form
   ↓
Modify Allowed Fields
   ↓
Validate
   ↓
Submit
```

Immutable or controlled fields should be disabled or handled through dedicated workflows.

---

# 59. Student Detail Page

The detail page should present:

```text
Student Identity
Course
Enrollment Information
Status
Account Information where authorized
```

Academic records should be accessed through dedicated tabs/links to:

- Results
- Backlogs
- Academic Passport
- Analytics

---

# 60. Student Academic Navigation

Conceptually:

```text
Student Detail
 ├── Overview
 ├── Results
 ├── Backlogs
 ├── Academic Passport
 └── Analytics
```

These remain separate feature boundaries.

---

# 61. Student Forms

Use the established form stack:

```text
React Hook Form
+
Zod
```

Frontend validation should provide immediate feedback.

Backend validation remains authoritative.

---

# 62. Student API Client

Centralize API access.

Conceptually:

```text
studentApi.list()
studentApi.getById()
studentApi.create()
studentApi.update()
studentApi.updateStatus()
```

Components should not manually construct HTTP requests.

---

# 63. TanStack Query

Use TanStack Query for student server state.

Conceptually:

```text
useStudents()
useStudent(studentId)
useCreateStudent()
useUpdateStudent()
useUpdateStudentStatus()
```

---

# 64. Query Invalidation

After creation:

```text
Create Student
     ↓
Invalidate Student List
```

After update:

```text
Update Student
     ↓
Invalidate / Update Student Detail
     ↓
Refresh Student List if necessary
```

---

# 65. Search State

Search/filter state may be represented in URL query parameters where appropriate.

Example:

```text
/app/students?search=REG001&status=ACTIVE
```

This improves:

- deep linking
- refresh behavior
- browser navigation
- reproducibility

---

# 66. Loading States

Implement loading states for:

- student list
- student detail
- student form initialization
- create mutation
- update mutation
- status mutation

---

# 67. Empty States

Differentiate:

```text
No students exist.
```

from:

```text
No students match your search.
```

Authorized users should receive an appropriate action when the entire student list is empty.

---

# 68. Error States

Handle:

- network failure
- unauthorized
- forbidden
- not found
- validation failure
- duplicate identifier
- server failure

Avoid exposing raw backend stack traces.

---

# 69. Responsive Design

Student management must support:

```text
320px
375px
430px
768px
1024px
1280px
1440px
1920px
```

On mobile:

- filters can collapse
- table can transform into cards/list
- actions remain accessible
- forms stack
- long registration numbers should not break layout

---

# 70. Accessibility

Required:

- semantic form labels
- keyboard navigation
- focus states
- accessible status controls
- accessible dialogs
- table semantics
- appropriate ARIA attributes
- sufficient contrast
- no color-only status communication

---

# 71. Database Migration

Recommended migration sequence:

```text
1. Student table
2. Foreign keys
3. Unique constraints
4. Required indexes
5. Audit integration
6. Optional account relationship constraints
```

Migration order must follow the project's actual migration mechanism.

---

# 72. Student Table Concept

Conceptually:

```text
students
---------
id
college_id
course_id
registration_number
name
email
phone
admission_year
status
created_at
updated_at
```

The final schema may include additional approved enrollment fields.

---

# 73. Foreign Keys

Conceptually:

```text
students.college_id
    → colleges.id

students.course_id
    → courses.id
```

These relationships protect referential integrity.

---

# 74. Database Constraints

Potential constraints:

```text
registration_number
college_id + registration_number
course_id
status
```

The final uniqueness scope must be approved.

---

# 75. Indexing

Consider indexes for:

```text
students.college_id
students.course_id
students.registration_number
students.status
students.admission_year
```

Actual indexes should be based on query patterns.

---

# 76. Student Account Relationship

If a student is linked to an application user, the relationship should be explicit.

Conceptually:

```text
User
  ↓
Student
```

or:

```text
Student
  ↓
User
```

The final cardinality and database model must be approved.

---

# 77. One Student — One Account

The preferred MVP model should generally prevent multiple active student accounts from representing the same student identity unless explicitly required.

This protects:

- privacy
- portal consistency
- authorization
- auditability

---

# 78. Account Provisioning Integration

If a student account is provisioned:

```text
Create Student
     ↓
Create / Link User
     ↓
Assign STUDENT role
     ↓
Associate College
     ↓
Associate Student
```

Authentication owns password/account security.

Student Management owns the academic identity.

---

# 79. Result Import Dependency

Result Import must be able to locate students using the approved identifier.

Conceptually:

```text
Imported Registration Number
       ↓
Student Identifier Lookup
       ↓
Student
```

If no match exists:

```text
UNKNOWN_STUDENT
```

should be generated for validation/review.

---

# 80. Unknown Student Policy

The import pipeline must not silently create students from result files.

Instead:

```text
Unknown Student
      ↓
Validation Issue
      ↓
Authorized Review
```

Automatic creation can introduce duplicate or incorrect student identities.

---

# 81. Student Name Mismatch

If registration number matches but name differs:

```text
Registration Number
       ↓
Matches Student
       ↓
Name Difference
```

The system may produce a warning for review rather than treating the record as a completely unknown student.

The final severity rule belongs to Result Validation.

---

# 82. Result History Independence

Changing a student's profile name should not rewrite the historical source/result identity unless an explicit data-correction operation exists.

Historical result records must remain auditable.

---

# 83. Student Course Change

Changing a student's course is a sensitive academic operation.

Before allowing it, consider:

- existing results
- semester history
- backlogs
- Academic Passport
- analytics
- result imports

A dedicated controlled operation may be safer than a generic profile update.

---

# 84. Admission Year

Admission year should be represented consistently.

Avoid free-form strings such as:

```text
"2024 batch"
"2024-25"
"Batch 2024"
```

inside a numeric field.

Use a structured representation.

---

# 85. Student Status and Academic Records

Making a student inactive should not automatically delete or alter:

- processed results
- backlogs
- passport
- analytics

It changes the student's lifecycle state.

---

# 86. Performance

Student Management may contain large populations.

Therefore:

- paginate lists
- index identifiers
- avoid loading academic history on basic list pages
- avoid N+1 course queries
- use DTO projections where useful
- use server-side search
- avoid unnecessary joins

---

# 87. Concurrency

Potential concurrent operations:

- two admins editing a student
- simultaneous status changes
- duplicate student creation
- course reassignment

Database constraints and appropriate optimistic concurrency controls should be used where required.

---

# 88. Transaction Boundaries

Student creation should normally be transactional.

Student update should normally be transactional.

Course reassignment should be transactional if it modifies multiple related records.

Account provisioning coordination requires explicit transaction/failure semantics.

---

# 89. Failure Handling

If student creation succeeds but optional account provisioning fails, the system must follow a defined policy.

Possible strategies:

```text
Student creation + account creation in one transaction
```

or:

```text
Student created
↓
Account provisioning job
↓
Retry / failure state
```

The final approach depends on the authentication implementation.

The system must not leave ambiguous account state.

---

# 90. Testing — Creation

Test:

```text
Valid student
Missing identifier
Duplicate identifier
Missing name
Invalid course
Cross-tenant course
Unauthorized role
Invalid email
Invalid admission year
```

---

# 91. Testing — Retrieval

Test:

```text
Student exists
Student not found
Authorized college access
Unauthorized college access
Cross-tenant IDOR
Student self-access
```

---

# 92. Testing — Update

Test:

```text
Valid update
Unauthorized update
Cross-tenant update
Invalid fields
Registration number restrictions
Course change restrictions
Inactive student
Nonexistent student
```

---

# 93. Testing — Status

Test:

```text
Activate
Deactivate
Invalid transition
Unauthorized status change
Repeated status change
Historical data preservation
```

---

# 94. Testing — Result Compatibility

Verify:

```text
Known registration number matches student
Unknown registration number is flagged
Name mismatch produces correct validation behavior
Cross-tenant student match is impossible
Inactive student follows approved import rule
```

---

# 95. Frontend Testing

Test:

```text
Student list
Search
Filters
Pagination
Create form
Edit form
Detail page
Status action
Validation
Duplicate identifier error
Unauthorized UI
Loading states
Empty states
Error states
Responsive layout
```

---

# 96. End-to-End Workflow

Verify:

```text
Authorized College Admin
        ↓
Create Student
        ↓
Student Appears in List
        ↓
Open Student
        ↓
Update Profile
        ↓
Provision / Link Account
        ↓
Import Result
        ↓
Result Matches Student
        ↓
Student Academic Record Updated
```

The result-processing steps are verified by their respective modules.

---

# 97. Security Verification

Before approval:

```text
□ Student data is tenant-isolated
□ Cross-tenant access fails
□ IDOR attempts fail
□ Student self-access is restricted to own identity
□ Role restrictions are enforced
□ Personal data exposure is minimized
□ Authentication data is not returned by Student APIs
□ Student creation cannot be performed by students
```

---

# 98. Acceptance Criteria

Student Management is acceptable when:

### Student Identity

- [ ] Every student has a stable internal ID.
- [ ] Official student identifier is stored.
- [ ] Duplicate student identities are prevented.
- [ ] Name is not used as the primary identity key.

### Academic Association

- [ ] Student belongs to a college.
- [ ] Student can be associated with a valid course.
- [ ] Course belongs to the same college.
- [ ] Cross-tenant relationships are rejected.

### Management

- [ ] Authorized users can create students.
- [ ] Authorized users can view students.
- [ ] Authorized users can update permitted fields.
- [ ] Authorized users can change status.
- [ ] Historical students are preserved.

### Result Integration

- [ ] Result imports can match students by identifier.
- [ ] Unknown students are flagged.
- [ ] Name mismatch can be handled according to validation rules.
- [ ] Import cannot silently create students.

### Security

- [ ] Tenant isolation is enforced server-side.
- [ ] IDOR protection is implemented.
- [ ] Student self-service is restricted to the authenticated student.
- [ ] Sensitive information is minimized.

### Frontend

- [ ] Student list works.
- [ ] Search works.
- [ ] Filters work where implemented.
- [ ] Create form works.
- [ ] Detail page works.
- [ ] Edit page works.
- [ ] Status management works.
- [ ] Responsive behavior works.
- [ ] Accessibility requirements are met.

---

# 99. Definition of Done

Student Management is considered implemented when:

1. Student database structure is implemented.
2. Foreign keys are enforced.
3. Identifier constraints are enforced.
4. Required indexes are implemented.
5. Student creation works.
6. Student listing works.
7. Student search works.
8. Student detail works.
9. Student update works.
10. Student status management works.
11. Tenant isolation is implemented.
12. IDOR protection is tested.
13. Course association validation works.
14. Authentication/account relationship is integrated.
15. Result Import can resolve students.
16. Audit events are implemented.
17. Backend tests pass.
18. Frontend tests pass.
19. Responsive behavior is verified.
20. End-to-end workflow passes.
21. Security review passes.
22. No critical student identity-integrity issue remains.

---

# 100. Unresolved Implementation Decisions

The following require review:

- exact student profile fields
- exact registration-number terminology
- identifier uniqueness scope
- whether university registration number is globally unique
- exact student status enum
- student account cardinality
- automatic vs manual student account provisioning
- student course-change policy
- registration-number change policy
- current-semester representation
- batch representation
- College Admin vs Academic Staff creation permissions
- inactive student result-import behavior
- name mismatch severity
- personal-data retention policy
- student archival policy

---

# 101. Relationship With Other Documents

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

09-development/feature-specifications/student-management.md

09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
09-development/implementation-notes/authentication-implementation.md
09-development/implementation-notes/college-management-implementation.md
09-development/implementation-notes/academic-structure-implementation.md
```

It provides the foundation for:

```text
result-import-implementation.md
result-validation-implementation.md
result-processing-implementation.md
backlog-implementation.md
academic-passport-implementation.md
analytics-implementation.md
student-portal-implementation.md
```

---

# 102. AI-Assisted Development Rules

AI coding assistants implementing Student Management must:

- read the Student Management feature specification first
- respect college tenant boundaries
- never use student name as the primary identity key
- never silently create students from imported result data
- never expose authentication credentials
- never expose JPA entities directly
- never bypass backend authorization
- never allow cross-tenant course assignment
- preserve historical academic relationships
- avoid modifying result history through profile updates
- flag ambiguous identifier rules
- reuse existing DTO/error/query patterns
- write explicit tenant-isolation tests
- write result-matching compatibility tests
- follow established frontend form and query patterns

AI must not invent university-specific student identifiers or academic rules.

---

# 103. Review Checklist

Before moving this document to `Approved`:

```text
□ Student ownership is clear
□ Student identity strategy is clear
□ Registration-number strategy is clear
□ Tenant boundary is clear
□ Course relationship is clear
□ Account relationship is clear
□ Result Import dependency is clear
□ Historical preservation is clear
□ Status lifecycle is clear
□ API structure is consistent
□ Database constraints are clear
□ Personal-data exposure is controlled
□ IDOR protection is explicit
□ Frontend routes are defined
□ Testing requirements are defined
□ Security requirements are defined
□ Unresolved decisions are documented
```

---

# 104. Status

**Draft / Under Review**

This document is not yet implementation-approved.

Lifecycle:

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

# 105. Final Student Management Principle

> **A student is an academic identity within a tenant, not merely a user account or a row in a table.**

The implementation must preserve:

```text
College
   ↓
Student Identity
   ↓
Course / Enrollment Context
   ↓
Academic Records
   ↓
Result History
   ↓
Backlogs / Passport / Analytics
```

Student Management must provide a stable, tenant-safe identity foundation while leaving academic result ownership to the appropriate downstream modules.