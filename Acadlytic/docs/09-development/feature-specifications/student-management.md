# Student Management

**Project:** Acadlytic  
**Module:** Student Management  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

# 1. Purpose

The Student Management module manages the complete student master record required by Acadlytic.

It provides a centralized student record that can be used by:

- Result Import
- Result Validation
- Result Processing
- Backlog Tracking
- Academic Passport
- Analytics
- Student Portal

The module establishes the relationship between a student and the college's academic structure.

The Student Management module must maintain accurate student identity and academic enrollment information without duplicating academic master data.

---

# 2. Scope

## 2.1 MVP Scope

The MVP includes:

- Student creation
- Student listing
- Student details
- Student profile update
- Student search
- Student filtering
- Student status management
- Student enrollment information
- Course association
- Academic year association
- Student identifier management
- Student import-ready structure
- Tenant isolation
- Role-based authorization
- Backend validation
- Audit events
- Protected APIs
- Frontend student management interface

---

## 2.2 Out of Scope

The following are outside the MVP:

- Student self-registration
- Admission workflow
- Online application forms
- Fee management
- Attendance
- Hostel
- Library
- Transport
- Placement
- Scholarship management
- Parent/guardian portal
- Student messaging
- Biometric integration
- Aadhaar or government identity verification
- University API student synchronization
- AI-based student profiling
- Predictive academic risk

These may be added in future versions.

---

# 3. Actors

| Actor | Responsibility |
|---|---|
| SUPER_ADMIN | Platform-level student oversight where required |
| COLLEGE_ADMIN | Manage students belonging to their college |
| ACADEMIC_STAFF | Manage students according to assigned permissions |
| STUDENT | View own profile and academic information |
| Public Visitor | No student access |

---

# 4. Core Concepts

## 4.1 Student

A Student represents a learner registered with a college using Acadlytic.

A student belongs to exactly one college within the tenant model.

Example:

```text
College
   ↓
Student
   ↓
Academic Enrollment
```

---

## 4.2 Student Identifier

The Student Identifier is the primary academic identifier used by the college/university for identifying a student.

Examples:

```text
University Roll Number
Hall Ticket Number
Registration Number
Student ID
```

The exact identifier type depends on the academic institution.

---

## 4.3 College Student ID

Acadlytic may maintain its own internal student identifier.

This must be different from external university identifiers.

Example:

```text
Acadlytic Student ID:
STU-000102

University Identifier:
OU123456789
```

The internal database ID must not be exposed unnecessarily to users.

---

## 4.4 Student Status

The MVP should support:

```text
ACTIVE
INACTIVE
```

Historical academic records must remain available when a student becomes inactive.

The implementation may later extend this into a richer lifecycle such as:

```text
ACTIVE
INACTIVE
GRADUATED
WITHDRAWN
TRANSFERRED
```

If these additional statuses are introduced, they must be explicitly incorporated into the product rules.

---

# 5. Student Ownership

Every student must belong to a college.

Example:

```text
College A
 ├── Student 1
 ├── Student 2
 └── Student 3

College B
 ├── Student 4
 └── Student 5
```

College A users must never access Student 4 or Student 5.

Tenant isolation must be enforced on the backend.

---

# 6. Student Academic Association

A student must be associated with the academic structure required to interpret their academic records.

Minimum MVP associations:

```text
Student
 ├── College
 ├── Course
 └── Academic Year
```

The relevant semester should be derived from academic progression/result records rather than treating the student's current semester as the permanent identity of the student.

---

# 7. Student Profile

The student profile may contain:

```text
Student ID
Student Identifier
First Name
Middle Name
Last Name
Email
Phone
Date of Birth
Gender
Course
Academic Year
Status
```

Only fields required by the product should be collected.

The system must avoid collecting unnecessary sensitive personal information.

---

# 8. Student Name

The system should store student name components separately where required:

```text
first_name
middle_name
last_name
```

The frontend may display a combined name:

```text
First Name + Middle Name + Last Name
```

A display name must not be used as the student's unique identifier.

---

# 9. Student Identifier Rules

The student identifier must be treated as an important matching field because the Result Engine will use it to match university results to students.

Example:

```text
University Result
        ↓
Student Identifier
        ↓
Acadlytic Student
```

The system must prefer an official university-issued identifier over name-based matching.

---

# 10. Student Identifier Uniqueness

The identifier should be unique within the appropriate college/university context.

Example:

```text
College A → OU12345
College A → OU12346
```

Duplicate identifiers within the same relevant scope must be rejected.

The final uniqueness scope must align with the university integration and Result Engine design.

---

# 11. Student Creation

## 11.1 Authorized Users

In MVP:

### COLLEGE_ADMIN

May create students belonging to their own college.

### ACADEMIC_STAFF

May create students if the role/permission configuration allows it.

### SUPER_ADMIN

May create or manage students where platform-level administration requires it.

### STUDENT

Cannot create another student account.

### Public Visitor

Cannot create a student record.

---

# 12. Student Creation Requirements

A student creation request must contain the minimum required information.

Conceptually:

```text
Student Identifier
First Name
Last Name
Course
Academic Year
Status
```

Optional fields may include:

```text
Middle Name
Email
Phone
Date of Birth
Gender
```

The exact required fields must follow the final PRD and database design.

---

# 13. Student Creation Validation

The backend must validate:

- required fields
- valid student identifier
- student identifier uniqueness
- valid college
- valid course
- valid academic year
- course belongs to the same college
- academic year belongs to the same college
- valid email where provided
- valid phone where provided
- valid status

Invalid requests must be rejected.

---

# 14. Student Creation API

```http
POST /api/v1/students
```

Conceptual request:

```json
{
  "studentIdentifier": "OU123456",
  "firstName": "Rahul",
  "middleName": "",
  "lastName": "Kumar",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "courseId": 101,
  "academicYearId": 20,
  "status": "ACTIVE"
}
```

The backend must derive or verify the college context from the authenticated user.

The frontend must not be trusted to establish tenant ownership.

---

# 15. Student Listing

Authorized users must be able to list students within their permitted tenant.

```http
GET /api/v1/students
```

The API should support:

- pagination
- search
- filtering
- sorting where required

Example:

```text
GET /api/v1/students?page=0&size=20
```

---

# 16. Student Search

The system should support searching by:

- student identifier
- student name
- email where permitted
- phone where permitted
- course

Example:

```text
Search:
OU123456
```

or:

```text
Search:
Rahul Kumar
```

Search must remain tenant-scoped.

---

# 17. Student Filtering

The student list should support filters such as:

```text
Course
Academic Year
Status
```

Example:

```text
Course = BCA
Academic Year = 2026-27
Status = ACTIVE
```

The final filter set may be extended according to actual UI and reporting requirements.

---

# 18. Student Details

A user with appropriate permission can view a student's details.

```http
GET /api/v1/students/{studentId}
```

The response may include:

```text
Basic Profile
Academic Enrollment
Current Status
Student Identifier
Course
Academic Year
```

Academic results, backlog information, and Academic Passport information should be retrieved through their respective modules rather than duplicating the complete data into the Student Management API.

---

# 19. Student Profile Update

Authorized users may update permitted student information.

```http
PUT /api/v1/students/{studentId}
```

Editable fields may include:

```text
First Name
Middle Name
Last Name
Email
Phone
Date of Birth
Gender
```

Changes to important academic identity fields must have stricter authorization and audit requirements.

---

# 20. Academic Field Changes

Fields such as:

```text
Student Identifier
Course
Academic Year
```

must not be changed casually because they affect result matching and historical academic records.

Any such update must:

- validate the new value
- verify tenant ownership
- verify referenced academic entities
- preserve historical integrity
- generate an audit event

If the product later requires formal enrollment history, these changes should be represented through an enrollment/history model rather than overwriting historical data.

---

# 21. Student Status Management

The API should support status changes.

```http
PATCH /api/v1/students/{studentId}/status
```

Example:

```json
{
  "status": "INACTIVE"
}
```

Deactivation must not delete academic records.

---

# 22. Student Deactivation

When a student becomes inactive:

- student record remains stored
- historical results remain stored
- backlog records remain stored
- Academic Passport remains available according to authorization
- student cannot be treated as an active student for new operations where prohibited

The exact behavior of student login after deactivation must follow Authentication rules.

---

# 23. Student Deletion

Physical deletion of a student is not part of the MVP.

Reason:

Student records may be referenced by:

```text
Results
Backlogs
Academic Passport
Audit Records
Analytics
```

Deleting the student could compromise historical integrity.

Use status/lifecycle handling instead.

---

# 24. Student and User Account Separation

A student record and a login account are related but are not the same concept.

Example:

```text
Student
   ↓
Academic Identity

User
   ↓
Authentication Identity
```

A student may later receive a user account for the Student Portal.

The Student Management module must not duplicate authentication credentials.

Authentication remains managed by the Authentication module.

---

# 25. Student User Provisioning

When Student Portal accounts are enabled, the system may associate:

```text
Student
   ↕
User Account
```

The association must use a proper reference.

The Student Management module must not directly manage:

- passwords
- sessions
- login tokens
- password reset logic

Those remain part of Authentication.

---

# 26. Student Import Readiness

The Student Management module should be designed to support future bulk student import.

Potential sources:

```text
Excel
CSV
University Data
College ERP
```

Bulk import is not required for the initial Student Management implementation unless explicitly included in the MVP.

However, the student data model must not prevent future import functionality.

---

# 27. Student Import Matching

Future imports should use:

```text
Student Identifier
```

as the preferred matching field.

The following must not be used as the primary identity match:

```text
Name alone
Email alone
Phone alone
```

Name-based matching may be used only as a secondary/manual review mechanism if explicitly supported by the Result Engine.

---

# 28. Course Association Validation

When creating or updating a student:

```text
Student
   ↓
Course
```

the backend must verify that the course belongs to the same college as the student.

Invalid:

```text
Student → College A
Course → College B
```

Expected:

```text
Reject request
```

---

# 29. Academic Year Association Validation

The academic year must belong to the same college.

Invalid:

```text
Student → College A
Academic Year → College B
```

Expected:

```text
Reject request
```

---

# 30. Student and Academic Structure

Student Management must reference Academic Structure entities.

It must not create duplicate records such as:

```text
Student Course Name
Student Semester Name
Student Subject Name
```

when the corresponding master data already exists.

Use references such as:

```text
course_id
academic_year_id
```

instead.

---

# 31. Student and Result Engine

The Result Engine will use Student Management to identify students.

Example:

```text
University Result
       ↓
Student Identifier
       ↓
Student Master
       ↓
Matched Student
       ↓
Result Processing
```

If no student is found:

```text
Result
   ↓
Unmatched Student
   ↓
Manual Review
```

The system must not silently create a student from an imported result unless an explicit import policy permits it.

---

# 32. Student and Backlog Tracking

Backlog records must reference the student.

Example:

```text
Student
   ↓
Backlog
   ├── Subject
   ├── Semester
   ├── Attempt
   └── Status
```

Student deletion must therefore not be used as a normal lifecycle operation.

---

# 33. Student and Academic Passport

The Academic Passport will aggregate student academic information.

Conceptually:

```text
Student
   ↓
Academic Passport
   ├── Academic History
   ├── Semester Results
   ├── SGPA
   ├── CGPA
   ├── Backlogs
   └── Achievements / Future Extensions
```

The Academic Passport should consume student identity from Student Management.

---

# 34. Student Listing Authorization

### SUPER_ADMIN

May access students according to platform-level permissions.

### COLLEGE_ADMIN

May access students belonging to their own college.

### ACADEMIC_STAFF

May access students according to assigned permissions within their college.

### STUDENT

May access only their own student record.

### Public Visitor

No access.

---

# 35. Student Self-Access

When the Student Portal is implemented, a student must not be able to manipulate:

```text
studentId
collegeId
courseId
```

to access another student's record.

The backend must derive the student identity from the authenticated user-to-student association.

Example:

```text
Authenticated User
       ↓
Student Account Association
       ↓
Student Record
```

not:

```text
Frontend studentId
       ↓
Trust request
```

---

# 36. Tenant Isolation

Every student query must be tenant-aware.

For example:

```text
SELECT students
WHERE college_id = authenticatedCollegeId
```

The actual implementation must use the project's persistence/security architecture rather than embedding raw SQL into controllers.

Tenant isolation must exist at the service/data-access layer.

---

# 37. Database Requirements

Conceptual `students` table:

```text
id
college_id
student_identifier
first_name
middle_name
last_name
email
phone
date_of_birth
gender
course_id
academic_year_id
status
created_at
updated_at
```

The final schema must follow the database architecture.

---

# 38. Student-User Association

If Student Portal authentication is implemented, a relationship may be required between:

```text
users
students
```

Conceptually:

```text
student_id
user_id
```

The final relationship and uniqueness rules must be defined by the Authentication and database architecture.

---

# 39. Database Constraints

Recommended constraints include:

```text
students.college_id → colleges.id

students.course_id → courses.id

students.academic_year_id → academic_years.id
```

The system must ensure that referenced entities belong to the same college.

A normal foreign key alone may not fully enforce tenant consistency, so application/service-level validation is also required.

---

# 40. Student Identifier Indexing

The student identifier is a high-frequency lookup field.

An appropriate index must exist for:

```text
college_id
student_identifier
```

A composite uniqueness constraint/index should be considered according to the final identity scope.

---

# 41. Student Search Indexes

Indexes should be considered for frequently queried fields such as:

```text
college_id
student_identifier
course_id
academic_year_id
status
```

Name search strategy should be chosen based on actual database query patterns.

Do not introduce unnecessary indexes without evidence.

---

# 42. API Error Handling

The API should use consistent error codes.

Examples:

```text
STUDENT_NOT_FOUND
DUPLICATE_STUDENT_IDENTIFIER
INVALID_COURSE
INVALID_ACADEMIC_YEAR
CROSS_TENANT_ACCESS
STUDENT_INACTIVE
FORBIDDEN
VALIDATION_ERROR
```

The API must not expose internal database or stack-trace information.

---

# 43. Frontend Requirements

The frontend should provide:

```text
Students
 ├── Student List
 ├── Add Student
 ├── Student Details
 └── Edit Student
```

The student list should support:

- search
- filters
- pagination
- status display
- course display
- academic year display

---

# 44. Student List UI

Recommended columns:

```text
Student Identifier
Student Name
Course
Academic Year
Email
Status
Actions
```

The exact columns may change according to the final design specification.

---

# 45. Student Form

The student creation/edit form should contain:

```text
Student Identifier
First Name
Middle Name
Last Name
Email
Phone
Date of Birth
Gender
Course
Academic Year
Status
```

Fields should be displayed according to role and operation.

For example, academic identity fields may be restricted during normal profile editing.

---

# 46. Form Validation

Frontend validation should provide immediate feedback.

Backend validation remains authoritative.

Examples:

```text
Student Identifier → required
First Name → required
Last Name → required
Course → required
Academic Year → required
Email → valid format if provided
Phone → valid format if provided
```

---

# 47. Loading and Error States

The UI must support:

```text
Loading
Empty Student List
Search No Results
Validation Error
Unauthorized
Forbidden
Not Found
Server Error
Network Error
```

The UI must provide clear feedback rather than silently failing.

---

# 48. Edge Cases

## Duplicate Student Identifier

If an existing student has:

```text
OU123456
```

and another student attempts to use the same identifier within the applicable scope:

```text
Reject request.
```

---

## Student With Inactive Course

A student may retain historical association with a course that later becomes inactive.

The historical student record must remain valid.

---

## Student With Inactive Academic Year

Historical students may remain associated with an academic year that is no longer active.

This must not corrupt historical records.

---

## Cross-Tenant Course

Student belongs to College A but selected course belongs to College B.

Expected:

```text
Reject request.
```

---

## Cross-Tenant Academic Year

Student belongs to College A but selected academic year belongs to College B.

Expected:

```text
Reject request.
```

---

## Student Deactivation With Results

A student with existing results is deactivated.

Expected:

```text
Student remains stored.
Results remain stored.
Backlogs remain stored.
Academic Passport remains intact.
```

---

## Student Deactivation With Active Login

If the student has a login account, the authentication layer must apply the account-status rules defined in Authentication.

Student Management must not implement separate login logic.

---

## Student Not Found During Result Import

Expected:

```text
Result
  ↓
Unmatched Student
  ↓
Import Review
```

The system must not silently associate the result with another student.

---

# 49. Security Requirements

The module must follow project security rules.

Required controls:

- authentication
- role-based authorization
- tenant isolation
- server-side validation
- IDOR protection
- input validation
- audit logging
- no trust in frontend tenant identifiers
- no unauthorized student profile access
- no exposure of sensitive information beyond role requirements

Student personal information must be returned only to authorized users.

---

# 50. Audit Events

Important student changes should generate audit events.

Examples:

```text
STUDENT_CREATED
STUDENT_UPDATED
STUDENT_STATUS_CHANGED
STUDENT_IDENTIFIER_CHANGED
STUDENT_COURSE_CHANGED
STUDENT_ACADEMIC_YEAR_CHANGED
STUDENT_USER_ASSOCIATED
STUDENT_USER_DISASSOCIATED
```

Audit records should identify:

```text
actor
action
entity
entity_id
college/tenant
timestamp
```

The exact audit schema is defined by the security architecture.

---

# 51. Acceptance Criteria

The feature is acceptable when:

- [ ] Authorized staff can create a student.
- [ ] Student identifier is validated.
- [ ] Duplicate student identifiers are rejected according to the defined scope.
- [ ] Students are associated with a valid course.
- [ ] Students are associated with a valid academic year.
- [ ] Course and academic year belong to the same college as the student.
- [ ] Authorized users can list students.
- [ ] Authorized users can search students.
- [ ] Authorized users can filter students.
- [ ] Authorized users can view student details.
- [ ] Authorized users can update permitted student fields.
- [ ] Student status can be changed.
- [ ] Deactivation does not delete historical academic data.
- [ ] Students cannot access another student's record.
- [ ] Tenant isolation is enforced server-side.
- [ ] Important changes generate audit events.
- [ ] Student records are usable by Result Import.
- [ ] Student records are usable by Backlog Tracking.
- [ ] Student records are usable by Academic Passport.
- [ ] APIs return consistent errors.
- [ ] Frontend handles loading, empty, validation, and error states.

---

# 52. Test Scenarios

## Student Creation

- Create valid student.
- Create student with missing required fields.
- Create duplicate student identifier.
- Create student with invalid course.
- Create student with invalid academic year.
- Create student using another college's course.
- Create student using another college's academic year.

## Student Update

- Update profile information.
- Update invalid email.
- Update invalid phone.
- Change course.
- Change academic year.
- Change student identifier.
- Verify audit events.

## Student Listing

- List students.
- Search by identifier.
- Search by name.
- Filter by course.
- Filter by academic year.
- Filter by status.
- Verify pagination.

## Student Status

- Deactivate student.
- Verify historical results remain.
- Verify backlog records remain.
- Verify Academic Passport remains.

## Authorization

- SUPER_ADMIN access.
- COLLEGE_ADMIN access.
- ACADEMIC_STAFF access.
- STUDENT self-access.
- Student attempting another student's record.
- Public visitor attempting student API.

## Tenant Isolation

- College A accessing College B student.
- College A accessing College B course.
- College A accessing College B academic year.
- Manipulated student ID.
- Manipulated college ID.

---

# 53. AI Coding Agent Rules

When implementing Student Management, an AI coding agent must:

1. Read Authentication and authorization rules first.
2. Read College Management and Academic Structure specifications.
3. Preserve tenant isolation.
4. Never trust a frontend-provided `collegeId`.
5. Validate course ownership.
6. Validate academic year ownership.
7. Reuse existing academic master data.
8. Never duplicate course or subject names inside student records unless explicitly required.
9. Never use student name as the primary identity.
10. Prefer student identifier for academic matching.
11. Do not silently create students during result import.
12. Preserve historical student references.
13. Do not physically delete students in MVP.
14. Reuse existing audit infrastructure.
15. Reuse existing API error conventions.
16. Reuse existing security utilities.
17. Do not introduce unnecessary libraries.
18. Add tests for business rules.
19. Add tenant-isolation tests.
20. Add authorization tests.
21. Keep authentication logic inside the Authentication module.
22. Keep result-processing logic inside Result modules.
23. Do not introduce microservices for Student Management.
24. Follow the project's database migration rules.

---

# 54. Definition of Done

Student Management is complete when:

- [ ] Student entity is implemented.
- [ ] Database migration is implemented.
- [ ] Foreign-key relationships are implemented.
- [ ] Student identifier constraints are implemented.
- [ ] CRUD APIs are implemented.
- [ ] Student status management is implemented.
- [ ] Search and filtering are implemented.
- [ ] Pagination is implemented where required.
- [ ] Authentication is integrated.
- [ ] Authorization is integrated.
- [ ] Tenant isolation is implemented.
- [ ] Backend validation is implemented.
- [ ] Audit events are implemented.
- [ ] Frontend student screens are implemented.
- [ ] Loading and error states are implemented.
- [ ] Unit tests are implemented.
- [ ] API/integration tests are implemented.
- [ ] Security tests are completed.
- [ ] Code review is completed.
- [ ] Documentation is updated.
- [ ] QA acceptance criteria are passed.

---

# 55. Future Extensions

## Bulk Student Import

Support:

```text
Excel
CSV
```

with:

```text
Upload
↓
Parse
↓
Validate
↓
Preview
↓
Match
↓
Import
```

---

## University Student Synchronization

Future authorized university integrations may provide student data.

```text
University
    ↓
University Connector
    ↓
Student Data
    ↓
Validation
    ↓
Acadlytic Student Master
```

---

## Enrollment History

Future versions may maintain complete enrollment history:

```text
Student
 ├── Course History
 ├── Academic Year History
 ├── Semester History
 └── Status History
```

This is preferable to overwriting important historical academic information.

---

## Student Portal

Students may eventually access:

```text
Profile
Academic Results
SGPA
CGPA
Backlogs
Academic Passport
Academic Analytics
```

---

## Student Bulk Operations

Future administrative features may include:

- bulk status update
- bulk course assignment
- bulk academic year assignment
- bulk export

These operations must have appropriate authorization and audit logging.

---

# 56. Related Documents

This module depends on:

```text
00-project-context/project-overview.md

03-prd/product-requirements.md
03-prd/functional-requirements.md

04-tech-stack/*

05-architecture/*

07-project-rules/*

09-development/feature-specifications/authentication.md
09-development/feature-specifications/college-management.md
09-development/feature-specifications/academic-structure.md
```

Related future modules:

```text
result-import.md
result-validation.md
result-processing.md
backlog-tracking.md
academic-passport.md
analytics.md
student-portal.md
```

---

# 57. Document Status

**Status:** Draft / Implementation Ready

This document defines the expected behavior and implementation requirements for the Acadlytic Student Management module.

It does not replace:

- system architecture
- database architecture
- API architecture
- security architecture
- UI design specifications
- coding rules
- database migration files
- source code

Those documents remain authoritative for their respective concerns.