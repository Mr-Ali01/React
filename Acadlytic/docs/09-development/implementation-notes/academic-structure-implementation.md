# Academic Structure Implementation

**Document:** `09-development/implementation-notes/academic-structure-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Academic Structure  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for Academic Structure in Acadlytic.

Academic Structure provides the academic context required by:

- student management
- result import
- result validation
- result processing
- backlog tracking
- Academic Passport
- analytics
- student portal

The module establishes the hierarchy under which academic records are interpreted.

---

# 2. Core Principle

Academic results must never be interpreted without academic context.

Conceptually:

```text
University
    ↓
Course / Program
    ↓
Semester
    ↓
Subject
```

A result record should ultimately be associated with the correct academic structure.

---

# 3. Scope

The MVP Academic Structure implementation covers:

- university reference
- course/program management
- semester management
- subject management
- academic hierarchy
- academic identifiers
- subject codes
- credits
- semester ordering
- active/inactive academic structures
- tenant ownership
- validation
- APIs
- frontend management
- result-import compatibility
- testing

---

# 4. Out of Scope

The MVP does not implement:

- advanced regulation engine
- automated university rule discovery
- live university synchronization
- university scraping
- automatic syllabus extraction
- academic eligibility engine
- advanced credit-rule evaluation
- AI academic recommendations
- What-If simulation

These belong to future capabilities.

---

# 5. Academic Hierarchy

The primary hierarchy is:

```text
University
   ↓
College
   ↓
Course / Program
   ↓
Semester
   ↓
Subject
```

However, University is a master/reference entity while College is the tenant boundary.

Therefore:

```text
University
   ↓
College
   ↓
Academic Structure
```

is the application ownership relationship.

---

# 6. University

A university represents the academic authority under which a college operates.

Examples conceptually:

```text
University
├── name
├── code
├── status
└── metadata
```

The exact University master schema must be finalized before implementation.

---

# 7. University Ownership

University should not be duplicated separately inside every course, semester, or subject record.

Instead:

```text
College
   ↓
University
   ↓
Academic Structure
```

The college references the university.

Academic entities inherit their contextual relationship through the college/program structure where appropriate.

---

# 8. College Relationship

Academic Structure is college-scoped.

Conceptually:

```text
College A
 ├── BCA
 │    ├── Semester 1
 │    ├── Semester 2
 │    └── ...
 │
 └── MCA
      ├── Semester 1
      ├── Semester 2
      └── ...
```

College B must not automatically see College A's academic structure.

---

# 9. Course / Program

A Course represents an academic program offered by a college.

Examples:

```text
BCA
B.Sc Computer Science
B.Com
MCA
MBA
```

The application should use a consistent domain term such as `Course` or `Program`.

The final naming must remain consistent across:

- database
- Java entities
- API
- frontend
- documentation

---

# 10. Course Responsibilities

Academic Structure owns:

- course identity
- course code
- course name
- duration where applicable
- university relationship/context
- college relationship
- status

It does not own:

- students
- results
- backlogs
- analytics

Those modules reference the course.

---

# 11. Course Identifier

Every course requires a stable internal ID.

Example:

```text
course.id
```

The ID must be:

- unique
- immutable
- suitable for relationships
- safe for API resource identification

---

# 12. Course Code

Courses should have an academic code where applicable.

Example:

```text
BCA
MCA
BCS
```

The uniqueness scope must be explicitly defined.

For MVP, course code should generally be unique within the college.

---

# 13. Course Name

Course name is descriptive.

Example:

```text
Bachelor of Computer Applications
Master of Computer Applications
```

Course name should not be treated as the primary identifier.

---

# 14. Course Status

A course should support an explicit lifecycle.

Conceptually:

```text
ACTIVE
INACTIVE
```

An inactive course should remain available for historical academic records.

Physical deletion should not be used where historical records depend on the course.

---

# 15. Course Duration

If duration is stored, it should represent the academic program duration in a consistent unit.

For example:

```text
durationYears
```

or another approved representation.

Do not store mixed textual values such as:

```text
"3 years"
"4 Year"
"2-year"
```

inside a numeric duration field.

---

# 16. Semester

A semester represents an ordered academic period within a course.

Example:

```text
MCA
 ├── Semester 1
 ├── Semester 2
 ├── Semester 3
 └── Semester 4
```

---

# 17. Semester Ordering

Semester ordering is important for:

- result processing
- SGPA progression
- CGPA calculation
- Academic Passport
- analytics
- student timeline

Therefore each semester should have an explicit sequence/order.

Example:

```text
semester_number = 1
semester_number = 2
semester_number = 3
```

---

# 18. Semester Uniqueness

A semester should not be duplicated within the same course.

Conceptually:

```text
Course + Semester Number
```

should be unique.

Example:

```text
MCA + Semester 1
```

should identify one semester within the relevant academic structure.

---

# 19. Semester Status

Semesters may support:

```text
ACTIVE
INACTIVE
```

Inactive historical semesters should remain available for existing student academic records.

---

# 20. Subject

A Subject represents an academic unit within a semester.

Examples:

```text
Design and Analysis of Algorithms
Machine Learning
Database Management Systems
Computer Networks
```

---

# 21. Subject Code

Subject code is critical for result matching.

Example:

```text
CS401
CS402
MCA501
```

The result import system should prefer subject code over subject name for matching.

---

# 22. Subject Name

Subject name is descriptive and may vary slightly between source files.

Therefore:

```text
Subject Code
```

should normally be the stronger matching identifier.

Name-based matching must not silently replace code-based matching.

---

# 23. Subject Credits

Subjects may have credit values.

Example:

```text
Credits = 4
```

Credits are required by academic calculations where the university's grading model depends on them.

However, the application must not invent university-specific credit rules.

---

# 24. Subject Type

If required by the approved academic model, subjects may have types such as:

```text
THEORY
PRACTICAL
PROJECT
ELECTIVE
```

The final subject-type enumeration must be approved before implementation.

Do not introduce additional categories without a product requirement.

---

# 25. Subject Status

Subjects should support:

```text
ACTIVE
INACTIVE
```

Historical subjects must remain available where existing result records reference them.

---

# 26. Academic Structure Relationships

Conceptually:

```text
College
  │
  └── Course
        │
        └── Semester
              │
              └── Subject
```

This relationship must be represented consistently in the database.

---

# 27. Suggested Entity Relationships

Conceptually:

```text
College 1 ─── N Course

Course 1 ─── N Semester

Semester 1 ─── N Subject
```

The exact JPA mappings must be selected carefully to avoid unnecessary eager loading.

---

# 28. JPA Mapping Principle

Avoid large object graphs such as:

```java
College
  -> courses
      -> semesters
          -> subjects
```

being automatically loaded for every request.

Prefer controlled repository queries and DTO projections.

---

# 29. Lazy Loading

Relationships should generally avoid unnecessary eager loading.

The implementation must prevent:

- N+1 queries
- accidental deep graph loading
- excessive API payloads

---

# 30. Database Constraints

Important constraints include:

```text
Course code within appropriate scope
Course belongs to valid college
Semester belongs to valid course
Semester number unique within course
Subject belongs to valid semester
Subject code unique within appropriate academic scope
```

The final constraint scope must match the approved schema.

---

# 31. Academic Structure Creation Flow

Conceptually:

```text
College
   ↓
Create Course
   ↓
Create Semesters
   ↓
Create Subjects
   ↓
Academic Structure Ready
```

---

# 32. Course Creation

Course creation should validate:

- authenticated user
- role
- college scope
- course name
- course code
- university relationship
- duration where applicable
- status

---

# 33. Course Creation Authorization

Depending on final permissions, course creation should be available to authorized:

```text
COLLEGE_ADMIN
```

and potentially designated:

```text
ACADEMIC_STAFF
```

The final permission must be approved before implementation.

Students must not create or modify academic structure.

---

# 34. Course API

Primary endpoints:

```text
POST /api/v1/academic/courses
GET /api/v1/academic/courses
GET /api/v1/academic/courses/{courseId}
PUT /api/v1/academic/courses/{courseId}
PATCH /api/v1/academic/courses/{courseId}/status
```

---

# 35. Course Request DTO

Conceptually:

```json
{
  "name": "Master of Computer Applications",
  "code": "MCA",
  "durationYears": 2,
  "status": "ACTIVE"
}
```

The final request contract must be defined by the API architecture.

---

# 36. Course List

The course list should support:

- pagination where appropriate
- search
- status filtering
- college scope
- sorting where needed

Example conceptual request:

```text
GET /api/v1/academic/courses
```

---

# 37. Course Detail

Endpoint:

```text
GET /api/v1/academic/courses/{courseId}
```

The detail response should not automatically include every semester and subject unless explicitly required.

Use dedicated endpoints or projections for large nested data.

---

# 38. Semester APIs

Potential endpoints:

```text
POST /api/v1/academic/courses/{courseId}/semesters
GET /api/v1/academic/courses/{courseId}/semesters
GET /api/v1/academic/semesters/{semesterId}
PUT /api/v1/academic/semesters/{semesterId}
PATCH /api/v1/academic/semesters/{semesterId}/status
```

---

# 39. Semester Creation Validation

Validate:

- course exists
- course belongs to the correct college
- semester number is valid
- semester number is not duplicated
- status is valid

---

# 40. Subject APIs

Potential endpoints:

```text
POST /api/v1/academic/semesters/{semesterId}/subjects
GET /api/v1/academic/semesters/{semesterId}/subjects
GET /api/v1/academic/subjects/{subjectId}
PUT /api/v1/academic/subjects/{subjectId}
PATCH /api/v1/academic/subjects/{subjectId}/status
```

---

# 41. Subject Creation Validation

Validate:

- semester exists
- semester belongs to correct course
- semester belongs to current college
- subject code
- subject name
- credits
- subject type where applicable
- duplicate subject code
- status

---

# 42. Subject Code Matching

Result Import depends on subject codes.

Therefore:

```text
Academic Structure
       ↓
Subject Code
       ↓
Result Import
       ↓
Subject Matching
```

A subject-code change can affect historical and future imports.

Therefore code changes must be controlled.

---

# 43. Subject Code Changes

Before allowing a subject code change, the implementation should consider:

- existing result records
- historical attempts
- imported result mappings
- backlog references
- Academic Passport
- analytics

The safest MVP approach may be to make subject codes immutable after academic records depend on them.

The final rule requires approval.

---

# 44. Academic Structure and Students

Students reference academic structure.

Conceptually:

```text
Student
  ↓
College
  ↓
Course
```

The student does not own the course.

---

# 45. Academic Structure and Results

Results reference:

```text
Student
Course
Semester
Subject
```

or the minimal approved identifiers necessary to establish academic context.

Result Processing must use the academic structure as a reference, not duplicate it.

---

# 46. Academic Structure and Backlogs

Backlogs depend on subject identity.

Conceptually:

```text
Subject
   ↓
Result Outcome
   ↓
Backlog
```

Therefore subject records must remain stable enough to preserve historical backlog relationships.

---

# 47. Academic Structure and Academic Passport

Academic Passport reads academic structure to display:

```text
Course
Semester
Subject
Credits
```

Passport should not create duplicate subject definitions.

---

# 48. Academic Structure and Analytics

Analytics uses academic structure for grouping:

```text
Course
Semester
Subject
```

Examples:

```text
Course-level performance
Semester-level performance
Subject-level performance
```

---

# 49. Academic Structure and Result Import

Result Import needs to identify:

```text
Student
Subject
Semester
Course
```

The import pipeline should use academic structure validation before processing.

---

# 50. Unknown Subject Handling

If an imported subject code does not exist:

```text
Imported Subject
       ↓
No Matching Subject
       ↓
Validation Error / Review
```

The system must not silently create a subject from an imported result.

Automatic subject creation can corrupt academic structure.

---

# 51. Unknown Course Handling

If the import cannot identify the correct course:

```text
No Course Match
       ↓
Validation Failure / Review
```

Do not guess based only on course name.

---

# 52. Academic Context Validation

A result should not be accepted simply because:

```text
student exists
+
subject exists
```

The system must also verify that the subject belongs to the expected academic context.

Example:

```text
Student Course
      ↓
MCA

Imported Subject
      ↓
MCA Semester 2
```

The relationship must be valid.

---

# 53. Cross-Tenant Academic Structure Protection

A subject belonging to College A must never be attached to a College B result.

The backend must validate the entire relationship chain.

Conceptually:

```text
Result
 ↓
Student College
 ↓
Course College
 ↓
Semester Course
 ↓
Subject Semester
```

All relationships must remain consistent.

---

# 54. Academic Structure Service

The service layer should coordinate:

- course operations
- semester operations
- subject operations
- authorization
- validation
- relationship checks
- status transitions
- audit events

---

# 55. Service Boundaries

Avoid creating one massive service such as:

```text
AcademicStructureService
```

containing every business rule if the module becomes large.

Prefer focused services where useful:

```text
CourseService
SemesterService
SubjectService
```

A higher-level application service may coordinate workflows where necessary.

---

# 56. Repository Layer

Potential repositories:

```text
CourseRepository
SemesterRepository
SubjectRepository
UniversityRepository
```

Repository queries should be designed around actual use cases.

---

# 57. Repository Security

Repositories should not become the sole authorization mechanism.

Authorization belongs at the application/domain boundary.

Repositories should still support scoped queries to reduce accidental cross-tenant data access.

---

# 58. Tenant-Aware Queries

Where appropriate, queries should include college scope.

Conceptually:

```text
findCourseByIdAndCollegeId()
```

rather than retrieving a course globally and trusting the caller.

---

# 59. IDOR Prevention

Unsafe:

```text
GET /api/v1/academic/subjects/999
```

followed by returning the subject without verifying college scope.

Safe:

```text
Request
 ↓
Authenticated User
 ↓
College Context
 ↓
Subject
 ↓
Verify Subject → Semester → Course → College
 ↓
Allow / Reject
```

---

# 60. Status Management

Academic entities should generally use lifecycle states rather than physical deletion.

For example:

```text
Course
ACTIVE → INACTIVE

Semester
ACTIVE → INACTIVE

Subject
ACTIVE → INACTIVE
```

This preserves historical relationships.

---

# 61. Deletion Policy

Physical deletion should be restricted when academic records depend on the entity.

Before deletion is ever considered, the system must check:

- student references
- result references
- backlog references
- import mappings
- passport references
- analytics dependencies

For MVP, deactivation is preferred.

---

# 62. Audit Events

Important events may include:

```text
COURSE_CREATED
COURSE_UPDATED
COURSE_STATUS_CHANGED

SEMESTER_CREATED
SEMESTER_UPDATED
SEMESTER_STATUS_CHANGED

SUBJECT_CREATED
SUBJECT_UPDATED
SUBJECT_STATUS_CHANGED
```

The final audit taxonomy should remain centralized.

---

# 63. Frontend Navigation

Academic Structure should follow the approved navigation:

```text
/app/academic
/app/academic/courses
/app/academic/courses/:courseId
/app/academic/semesters
/app/academic/subjects
```

The exact information architecture may be refined during UI implementation without changing domain ownership.

---

# 64. Academic Dashboard

The Academic landing page may provide:

- total courses
- active courses
- semester overview
- subject count
- quick actions
- recently modified structures

These are presentation concerns and should not introduce a separate source of truth.

---

# 65. Course List Page

The course list should provide:

- course name
- course code
- duration
- status
- semester count
- actions

The UI should avoid loading all subjects merely to display a course list.

---

# 66. Course Detail Page

The course detail page may contain:

```text
Course Information
       ↓
Semester List
       ↓
Semester Details
       ↓
Subject List
```

Use dedicated queries where necessary.

---

# 67. Semester Management UI

Semester management should allow authorized users to:

- create semester
- edit semester
- change status
- view subjects
- navigate to subject management

---

# 68. Subject Management UI

Subject management should allow authorized users to:

- create subject
- edit subject
- view code
- view credits
- view type
- change status

---

# 69. Academic Structure Forms

Forms should use:

```text
React Hook Form
+
Zod
```

where consistent with the project frontend rules.

Validation should include:

- required fields
- field length
- numeric constraints
- enum validation
- duplicate errors from backend

---

# 70. Server State

Use TanStack Query for:

- course lists
- course details
- semester lists
- subject lists
- mutations

Do not duplicate server state unnecessarily in Zustand.

---

# 71. Query Invalidation

After creating a semester:

```text
Create Semester
     ↓
Invalidate Course Detail
     ↓
Refresh Semester List
```

After creating a subject:

```text
Create Subject
     ↓
Invalidate Semester Detail/List
     ↓
Refresh Subject List
```

---

# 72. Loading States

Provide loading states for:

- academic dashboard
- course list
- course detail
- semester list
- subject list
- forms
- mutations

---

# 73. Empty States

Examples:

```text
No courses configured.
```

```text
No semesters configured for this course.
```

```text
No subjects configured for this semester.
```

Empty states should provide an appropriate next action when the user has permission to create the resource.

---

# 74. Error States

Errors should distinguish:

```text
Not Found
Unauthorized
Forbidden
Validation Error
Conflict
Server Error
```

The UI should provide useful recovery actions where possible.

---

# 75. Responsive Design

Academic Structure pages must work across:

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

On smaller screens:

- forms stack vertically
- tables become responsive
- actions remain accessible
- filters may collapse
- hierarchy remains understandable

---

# 76. Accessibility

Required:

- semantic headings
- form labels
- keyboard navigation
- focus visibility
- accessible dialogs
- accessible status indicators
- table semantics
- appropriate ARIA attributes
- no color-only communication

---

# 77. Database Migration Sequence

Recommended migration order:

```text
1. University master/reference
2. Course table
3. Semester table
4. Subject table
5. Required constraints
6. Required indexes
7. Audit integration
```

The final migration ordering must follow the project's migration tool and existing schema.

---

# 78. Course Table Concept

Conceptually:

```text
courses
---------
id
college_id
name
code
duration_years
status
created_at
updated_at
```

The exact schema must be finalized through database design.

---

# 79. Semester Table Concept

Conceptually:

```text
semesters
---------
id
course_id
semester_number
name
status
created_at
updated_at
```

The `name` field is optional depending on the approved design.

---

# 80. Subject Table Concept

Conceptually:

```text
subjects
---------
id
semester_id
code
name
credits
type
status
created_at
updated_at
```

The exact field set depends on the finalized academic model.

---

# 81. Foreign Keys

The database should enforce appropriate relationships:

```text
courses.college_id
    → colleges.id

semesters.course_id
    → courses.id

subjects.semester_id
    → semesters.id
```

Foreign keys protect referential integrity.

---

# 82. Indexing

Consider indexes for:

```text
courses.college_id
courses.code
courses.status

semesters.course_id
semesters.semester_number

subjects.semester_id
subjects.code
subjects.status
```

Unique constraints should be added according to approved uniqueness scope.

---

# 83. Transaction Boundaries

Course creation is normally one transaction.

Semester creation is normally one transaction.

Subject creation is normally one transaction.

Complex bulk academic-structure imports, if introduced later, require dedicated transaction and partial-failure rules.

---

# 84. Concurrency

Potential conflicts include:

- duplicate course creation
- duplicate semester creation
- duplicate subject creation
- simultaneous subject edits
- simultaneous status changes

Database constraints remain the final protection against duplicates.

---

# 85. Academic Structure Import

Bulk academic structure import is not required for the initial implementation unless explicitly approved.

If introduced later, it should use a dedicated import workflow rather than bypassing normal validation.

---

# 86. University-Specific Rules

The module must not hard-code assumptions such as:

```text
Every course has exactly 6 semesters.
Every semester has exactly 5 subjects.
Every subject has exactly 4 credits.
```

Such rules vary by university and program.

The application should store actual configured academic structure.

---

# 87. Calculation Boundary

Academic Structure provides:

```text
credits
semester
subject
course
```

It does not invent:

```text
SGPA formula
CGPA formula
grade-point mapping
passing criteria
```

Those rules must be provided by the appropriate academic/result-processing configuration.

---

# 88. Result Processing Dependency

Result Processing depends on Academic Structure.

Conceptually:

```text
Academic Structure
       ↓
Result Validation
       ↓
Result Processing
       ↓
Academic Record
```

Result Processing should fail safely if required academic context is missing.

---

# 89. Backlog Dependency

Backlog Tracking uses subject identity.

A subject must therefore remain stable enough to identify:

```text
Original Attempt
Current Outcome
Backlog
Later Passing Attempt
```

---

# 90. Student Management Dependency

Student Management requires a valid course/program relationship.

Conceptually:

```text
College
  ↓
Course
  ↓
Student
```

A student should not be assigned to an inactive/nonexistent course without an explicit historical rule.

---

# 91. Testing Strategy

Academic Structure tests should cover:

```text
Unit Tests
Integration Tests
Authorization Tests
Tenant Isolation Tests
Repository Tests
API Tests
Frontend Tests
End-to-End Tests
```

---

# 92. Course Tests

Test:

```text
Valid creation
Duplicate code
Invalid college
Unauthorized creation
Valid update
Unauthorized update
Cross-tenant update
Status change
Nonexistent course
```

---

# 93. Semester Tests

Test:

```text
Valid semester creation
Duplicate semester number
Invalid course
Cross-tenant course
Unauthorized creation
Update
Status change
```

---

# 94. Subject Tests

Test:

```text
Valid subject creation
Duplicate subject code
Invalid semester
Cross-tenant subject creation
Invalid credits
Invalid subject type
Unauthorized update
Status change
```

---

# 95. Relationship Tests

Explicitly verify:

```text
Subject
 ↓
Semester
 ↓
Course
 ↓
College
```

cannot cross tenant boundaries.

Example:

```text
College A
  Course A
    Semester A
      Subject A

College B
  User B
      ↓
attempts to access Subject A
      ↓
Rejected
```

---

# 96. Result Compatibility Tests

Verify that:

- valid subject codes can be matched
- unknown subject codes are rejected/flagged
- subject belongs to expected semester
- subject belongs to expected course
- cross-tenant subject references fail
- inactive subjects follow approved historical behavior

---

# 97. Frontend Tests

Test:

```text
Course list
Course search
Course creation
Course edit
Course status
Semester list
Semester creation
Subject list
Subject creation
Validation errors
Backend conflict errors
Loading states
Empty states
Responsive behavior
```

---

# 98. End-to-End Scenario

A complete academic structure workflow should verify:

```text
Login as authorized College Admin
        ↓
Open Academic Structure
        ↓
Create MCA
        ↓
Create Semester 1
        ↓
Create Subject
        ↓
Open Subject
        ↓
Edit Subject
        ↓
Verify Student/Result modules can reference it
```

---

# 99. Security Verification

Before approval, verify:

```text
□ Cross-tenant access rejected
□ IDOR attempts rejected
□ Role restrictions enforced
□ Inactive resources handled correctly
□ No unauthorized academic structure mutation
□ No JPA entity exposure
□ No sensitive internal data leakage
```

---

# 100. Acceptance Criteria

Academic Structure is acceptable when:

### University

- [ ] College references a valid university.
- [ ] University context is consistently represented.

### Course

- [ ] Authorized users can create courses.
- [ ] Course code is validated.
- [ ] Course belongs to the correct college.
- [ ] Course status works.
- [ ] Historical courses can remain available.

### Semester

- [ ] Authorized users can create semesters.
- [ ] Semester belongs to a valid course.
- [ ] Semester number is unique within its course.
- [ ] Semester ordering is preserved.

### Subject

- [ ] Authorized users can create subjects.
- [ ] Subject belongs to a valid semester.
- [ ] Subject code is validated.
- [ ] Credits are validated.
- [ ] Duplicate subject codes are prevented according to approved scope.

### Security

- [ ] Tenant isolation is enforced.
- [ ] Cross-tenant relationships are rejected.
- [ ] IDOR attempts fail.
- [ ] Frontend restrictions are backed by backend authorization.

### Integration

- [ ] Student Management can reference courses.
- [ ] Result Import can resolve subjects.
- [ ] Result Validation can verify academic context.
- [ ] Backlog Tracking can reference subjects.
- [ ] Academic Passport can display academic structure.
- [ ] Analytics can group by course/semester/subject.

---

# 101. Definition of Done

Academic Structure is considered implemented when:

1. University reference integration is operational.
2. Course persistence is implemented.
3. Semester persistence is implemented.
4. Subject persistence is implemented.
5. Database constraints are applied.
6. Foreign keys are applied.
7. Required indexes are applied.
8. Course APIs work.
9. Semester APIs work.
10. Subject APIs work.
11. Authorization is implemented.
12. Tenant isolation is tested.
13. Frontend management pages are implemented.
14. Forms validate correctly.
15. API conflicts are handled correctly.
16. Audit events are implemented.
17. Result compatibility is verified.
18. Student compatibility is verified.
19. Backend tests pass.
20. Frontend tests pass.
21. End-to-end workflow passes.
22. Security review passes.
23. No critical academic-structure integrity defect remains.

---

# 102. Unresolved Implementation Decisions

The following decisions require review:

- exact University master schema
- whether University is globally managed by Super Admin
- exact Course/Program terminology
- course code uniqueness scope
- exact course duration representation
- semester naming requirements
- exact semester status lifecycle
- subject type enumeration
- subject code uniqueness scope
- subject code immutability
- whether credits are mandatory for every subject
- College Admin vs Academic Staff permissions
- academic structure bulk import
- historical behavior for inactive subjects
- university-specific academic configuration model
- regulation/version relationship
- exact audit implementation

---

# 103. Relationship With Other Documents

This document depends on:

```text
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/database-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md
05-architecture/integration-architecture.md

06-design/navigation.md
06-design/page-specifications.md
06-design/responsive-design.md

07-project-rules/coding-rules.md
07-project-rules/frontend-rules.md
07-project-rules/backend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/academic-structure.md

09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
09-development/implementation-notes/college-management-implementation.md
```

It provides the foundation for:

```text
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

# 104. AI-Assisted Development Rules

AI coding assistants implementing Academic Structure must:

- read the Academic Structure feature specification first
- respect college tenant boundaries
- never invent university-specific academic rules
- never automatically create subjects from unknown result data
- never use subject names as a replacement for subject codes without an explicit rule
- never expose JPA entities directly
- never bypass authorization
- never create cross-tenant relationships
- never physically delete referenced academic entities without an approved policy
- preserve historical references
- reuse shared DTO/error patterns
- reuse frontend query/form patterns
- write relationship and tenant-isolation tests
- flag unresolved academic rules instead of inventing them

---

# 105. Review Checklist

Before moving this document to `Approved`:

```text
□ Academic hierarchy is clear
□ University relationship is clear
□ College ownership is clear
□ Course ownership is clear
□ Semester ownership is clear
□ Subject ownership is clear
□ Identifier strategy is clear
□ Subject-code matching strategy is clear
□ Historical preservation is clear
□ API structure is consistent
□ Database relationships are clear
□ Tenant isolation is explicit
□ Result Import dependency is clear
□ Result Processing dependency is clear
□ Frontend pages are defined
□ Testing requirements are defined
□ Security requirements are defined
□ Unresolved decisions are documented
```

---

# 106. Status

**Draft / Under Review**

This document is not yet considered implementation-approved.

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

# 107. Final Academic Structure Principle

> **Academic Structure defines the context in which academic results are meaningful.**

The implementation must preserve:

```text
College
   ↓
Course
   ↓
Semester
   ↓
Subject
   ↓
Academic Result Context
```

The structure must remain stable, tenant-safe, historically usable, and sufficiently authoritative for downstream result processing without inventing university-specific academic rules.