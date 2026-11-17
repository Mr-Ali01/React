# Academic Structure

**Project:** Acadlytic  
**Module:** Academic Structure  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

## 1. Purpose

The Academic Structure module defines and manages the academic hierarchy and academic entities required by a college to maintain student academic records.

The module provides the foundation required for:

- student enrollment
- semester management
- subject management
- course/program management
- academic year management
- result processing
- backlog tracking
- Academic Passport
- academic analytics

The module must ensure that academic records are associated with the correct college, course, semester, subject, and academic period.

Academic Structure is a foundational module. Result-related modules must depend on the academic entities defined here instead of storing duplicate academic information.

---

# 2. Scope

## 2.1 MVP Scope

The MVP includes:

- Academic Year management
- Course/Program management
- Semester management
- Subject management
- Course-Semester association
- Semester-Subject association
- Subject metadata
- Academic structure validation
- College-level academic structure isolation
- Search and filtering
- Active/inactive status management
- Protected APIs
- Role-based authorization
- Audit events
- Backend validation
- Frontend management interfaces

---

## 2.2 Out of Scope

The following are outside the MVP:

- University API integration
- Automatic university curriculum synchronization
- Automatic syllabus updates
- AI-based curriculum analysis
- Attendance management
- Faculty workload management
- Timetable management
- Examination scheduling
- Fee management
- Placement management
- Course recommendation
- Advanced curriculum version comparison
- Automated regulation eligibility engine

These may be introduced in future versions.

---

# 3. Actors

| Actor | Responsibility |
|---|---|
| SUPER_ADMIN | Platform-level administration and oversight |
| COLLEGE_ADMIN | Manage academic structure of their college |
| ACADEMIC_STAFF | View academic structure and perform permitted academic operations |
| STUDENT | View academic structure relevant to their academic record |
| Public Visitor | No access |

---

# 4. Core Concepts

## 4.1 Academic Year

An Academic Year represents the period in which academic activities are conducted.

Example:

```text
2025-26
2026-27
2027-28
```

An academic year belongs to a college.

---

## 4.2 Course / Program

A Course represents an academic program offered by a college.

Examples:

```text
BCA
B.Sc Computer Science
B.Com
MCA
MBA
```

A course belongs to a college.

A course may have multiple semesters.

---

## 4.3 Semester

A Semester represents an academic stage within a course.

Examples:

```text
Semester 1
Semester 2
Semester 3
Semester 4
Semester 5
Semester 6
```

A semester belongs to a course.

---

## 4.4 Subject

A Subject represents an academic subject that may be evaluated during a semester.

Examples:

```text
Data Structures
Database Management Systems
Operating Systems
Machine Learning
Java Programming
```

A subject belongs to a college and is associated with one or more course-semester structures according to the configured curriculum.

---

## 4.5 Subject Code

The Subject Code is the academic identifier used to identify a subject.

Example:

```text
CS301
MCA301
BCA401
```

Subject codes must be stored separately from subject names because subject names may change while the academic identifier remains stable.

---

## 4.6 Credits

Credits represent the academic credit value assigned to a subject.

Example:

```text
4 Credits
3 Credits
2 Credits
```

Credits are required for academic calculations where applicable.

---

## 4.7 Academic Structure

The complete academic relationship is:

```text
College
   ↓
Academic Year
   ↓
Course / Program
   ↓
Semester
   ↓
Subject
```

The exact relationship between academic year and curriculum must support future curriculum/regulation versions without requiring redesign of historical student results.

---

# 5. Academic Structure Ownership

Each academic structure belongs to a specific college.

Example:

```text
College A
 ├── BCA
 │    ├── Semester 1
 │    ├── Semester 2
 │    └── Semester 3
 │
 └── B.Com
      ├── Semester 1
      └── Semester 2
```

College B must not access or modify College A's academic structure.

Tenant isolation must be enforced on the backend.

---

# 6. Academic Year Management

## 6.1 Create Academic Year

Authorized users may create an academic year for their college.

Example:

```text
2026-27
```

The system must validate:

- required value
- valid format
- uniqueness within the college
- valid start/end representation
- no duplicate academic year

---

## 6.2 Academic Year Status

An academic year may have:

```text
ACTIVE
INACTIVE
```

Only active academic years should be selectable for new academic operations unless a specific historical operation allows inactive years.

Historical academic records must continue to reference inactive academic years.

---

## 6.3 Academic Year API

```http
POST /api/v1/academic-years
```

```http
GET /api/v1/academic-years
```

```http
GET /api/v1/academic-years/{academicYearId}
```

```http
PUT /api/v1/academic-years/{academicYearId}
```

```http
PATCH /api/v1/academic-years/{academicYearId}/status
```

---

# 7. Course / Program Management

## 7.1 Create Course

COLLEGE_ADMIN may create a course for their college.

Example:

```text
Course Name: Bachelor of Computer Applications
Course Code: BCA
Duration: 3 Years
```

The system must validate:

- course name
- course code
- duration
- college ownership
- duplicate course code

---

## 7.2 Course Status

Courses may have:

```text
ACTIVE
INACTIVE
```

Inactive courses must not be available for new student academic assignments unless explicitly allowed for historical records.

Existing student records must remain associated with inactive courses.

---

## 7.3 Course API

```http
POST /api/v1/courses
```

```http
GET /api/v1/courses
```

```http
GET /api/v1/courses/{courseId}
```

```http
PUT /api/v1/courses/{courseId}
```

```http
PATCH /api/v1/courses/{courseId}/status
```

---

# 8. Course Duration

A course should define its expected academic duration.

Example:

```text
BCA → 3 Years
MCA → 2 Years
```

The duration may be represented using:

```text
duration_value
duration_unit
```

Example:

```text
duration_value = 3
duration_unit = YEARS
```

The implementation must not assume that every program has the same duration.

---

# 9. Semester Management

## 9.1 Create Semester

A semester belongs to a course.

Example:

```text
BCA
 ├── Semester 1
 ├── Semester 2
 ├── Semester 3
 ├── Semester 4
 ├── Semester 5
 └── Semester 6
```

The system must maintain the semester sequence.

---

## 9.2 Semester Number

Semester number must be a positive integer.

Example:

```text
1
2
3
4
5
6
```

Duplicate semester numbers must not exist within the same course.

---

## 9.3 Semester Status

A semester may have:

```text
ACTIVE
INACTIVE
```

Historical student records must remain valid even if a semester is later marked inactive.

---

## 9.4 Semester API

```http
POST /api/v1/courses/{courseId}/semesters
```

```http
GET /api/v1/courses/{courseId}/semesters
```

```http
GET /api/v1/semesters/{semesterId}
```

```http
PUT /api/v1/semesters/{semesterId}
```

```http
PATCH /api/v1/semesters/{semesterId}/status
```

---

# 10. Subject Management

## 10.1 Create Subject

COLLEGE_ADMIN may create subjects for their college.

Example:

```text
Subject Code: CS301
Subject Name: Database Management Systems
Credits: 4
```

The system must validate:

- subject code
- subject name
- credits
- college ownership
- duplicate subject code

---

## 10.2 Subject Status

Subjects may have:

```text
ACTIVE
INACTIVE
```

An inactive subject should not be selectable for new curriculum assignments.

Historical result records must remain associated with the subject.

---

## 10.3 Subject API

```http
POST /api/v1/subjects
```

```http
GET /api/v1/subjects
```

```http
GET /api/v1/subjects/{subjectId}
```

```http
PUT /api/v1/subjects/{subjectId}
```

```http
PATCH /api/v1/subjects/{subjectId}/status
```

---

# 11. Subject Code Uniqueness

Subject codes must be unique within a college.

Example:

```text
College A → CS301
College B → CS301
```

This is allowed because they belong to different tenants.

Within the same college:

```text
CS301
CS301
```

must not be allowed as duplicate subject definitions.

---

# 12. Subject-Course-Semester Association

Creating a subject does not automatically assign it to a semester.

The system must support explicit association.

Example:

```text
Course:
BCA

Semester:
Semester 3

Subjects:
- CS301 → Database Management Systems
- CS302 → Operating Systems
- CS303 → Java Programming
```

This association is required for result processing.

---

# 13. Curriculum Structure

The curriculum structure may be represented as:

```text
College
   ↓
Course
   ↓
Semester
   ↓
Subject
```

Example:

```text
ABC College
   ↓
BCA
   ↓
Semester 3
   ↓
CS301 - DBMS
CS302 - Operating Systems
CS303 - Java
```

The result engine must use this structure to determine whether an imported subject belongs to the student's course and semester.

---

# 14. Subject Association API

```http
POST /api/v1/semesters/{semesterId}/subjects
```

The request must contain the subject reference.

Example conceptual request:

```json
{
  "subjectId": 101
}
```

The backend must verify:

- semester exists
- course exists
- subject exists
- all belong to the same college
- subject is active
- duplicate association does not exist

---

# 15. Remove Subject Association

Removing a subject from a curriculum must not delete the subject itself.

Example:

```text
Subject
   ↓
remains in subject master

Curriculum Association
   ↓
removed/deactivated
```

Historical result records must remain intact.

Physical deletion of academic entities referenced by historical results is prohibited.

---

# 16. Academic Structure Validation

The system must validate academic relationships before saving.

Examples:

### Invalid

```text
College A
Course from College B
Semester from College A
```

This must be rejected.

### Invalid

```text
Semester 3
Subject belonging to another college
```

This must be rejected.

### Invalid

```text
Course does not exist
↓
Create Semester
```

This must be rejected.

---

# 17. Cross-Tenant Protection

A user from College A must never be able to:

- view College B courses
- view College B subjects
- modify College B semesters
- associate College B subjects
- change College B academic years
- access College B academic structure through manipulated IDs

The backend must verify tenant ownership on every protected operation.

Frontend hiding is not a security mechanism.

---

# 18. Academic Structure and Students

Students will later reference:

```text
college_id
course_id
academic_year_id
```

The student's semester progression will reference the appropriate semester structure.

The Student Management module must not create duplicate course or subject definitions.

It must reference the Academic Structure module.

---

# 19. Academic Structure and Results

The Result Engine will use:

```text
College
Course
Semester
Subject
Academic Year
```

to validate imported results.

Example:

```text
Imported Result
      ↓
Student Identifier
      ↓
Student Course
      ↓
Student Semester
      ↓
Subject Code
      ↓
Subject Master
      ↓
Curriculum Association
      ↓
Result Validation
```

If the subject cannot be matched to the configured academic structure, the result must be flagged for review.

---

# 20. Academic Structure and Backlogs

Backlog records must reference the academic subject and semester rather than storing only free-text subject names.

Example:

```text
Backlog
 ├── Student
 ├── Subject
 ├── Semester
 ├── Attempt
 └── Status
```

This allows backlog history to remain consistent even when subject display names change.

---

# 21. Historical Data Protection

Academic structure changes must not corrupt historical academic records.

For example:

```text
2024
Subject Name = Database Management System

2026
Subject Name = Advanced Database Management System
```

Historical result records must preserve their historical context.

Therefore:

- avoid destructive deletion
- use inactive status
- preserve references
- maintain audit history where required

---

# 22. Academic Structure Search

The system should support searching:

### Courses

```text
BCA
Computer
MCA
```

### Subjects

```text
DBMS
CS301
Operating
```

Search must be tenant-scoped.

---

# 23. Filtering

The frontend should support filters where applicable:

### Course Filters

```text
Status
Academic Year
```

### Subject Filters

```text
Course
Semester
Status
Subject Code
```

### Semester Filters

```text
Course
Status
```

---

# 24. Database Requirements

The conceptual data model should include:

### academic_years

```text
id
college_id
name
start_date
end_date
status
created_at
updated_at
```

### courses

```text
id
college_id
name
code
duration_value
duration_unit
status
created_at
updated_at
```

### semesters

```text
id
course_id
number
name
status
created_at
updated_at
```

### subjects

```text
id
college_id
code
name
credits
status
created_at
updated_at
```

### semester_subjects

```text
id
semester_id
subject_id
created_at
updated_at
```

These are conceptual requirements. Final database implementation must follow the database architecture and migration rules.

---

# 25. Database Constraints

The database should enforce appropriate constraints.

Examples:

```text
academic_years.college_id → colleges.id

courses.college_id → colleges.id

semesters.course_id → courses.id

subjects.college_id → colleges.id

semester_subjects.semester_id → semesters.id

semester_subjects.subject_id → subjects.id
```

Unique constraints should include:

```text
college_id + academic_year_name
college_id + course_code
college_id + subject_code
course_id + semester_number
semester_id + subject_id
```

The exact constraint names are implementation details.

---

# 26. Indexing Requirements

Indexes should be provided for frequently queried fields.

Recommended indexes include:

```text
academic_years.college_id
courses.college_id
courses.code
semesters.course_id
subjects.college_id
subjects.code
semester_subjects.semester_id
semester_subjects.subject_id
```

Composite indexes should be added where supported by actual query patterns.

Do not add indexes blindly.

---

# 27. API Authorization

### SUPER_ADMIN

May:

- view academic structures across colleges
- manage where platform-level administration requires it
- inspect tenant configuration

### COLLEGE_ADMIN

May:

- create academic years
- create courses
- create semesters
- create subjects
- associate subjects
- update academic structures
- activate/deactivate academic entities

Only within their own college.

### ACADEMIC_STAFF

May:

- view academic structure
- perform permitted academic operations

Write permissions must be explicitly controlled.

### STUDENT

May:

- view relevant academic structure

Students must not modify academic structure.

### Public Visitor

No access.

---

# 28. API Error Handling

The API must return consistent errors.

Examples:

```text
ACADEMIC_YEAR_NOT_FOUND
COURSE_NOT_FOUND
SEMESTER_NOT_FOUND
SUBJECT_NOT_FOUND
DUPLICATE_COURSE_CODE
DUPLICATE_SUBJECT_CODE
DUPLICATE_SEMESTER
DUPLICATE_SUBJECT_ASSOCIATION
INVALID_ACADEMIC_STRUCTURE
CROSS_TENANT_ACCESS
ACADEMIC_ENTITY_INACTIVE
FORBIDDEN
VALIDATION_ERROR
```

Error responses must not expose internal implementation details.

---

# 29. Frontend Requirements

The frontend should provide dedicated management interfaces for:

```text
Academic Years
Courses
Semesters
Subjects
Curriculum / Subject Assignment
```

The UI must provide:

- loading state
- empty state
- validation errors
- server errors
- success feedback
- confirmation for destructive/deactivating actions
- search
- filtering where required
- pagination where required

---

# 30. Academic Structure Navigation

The College Admin navigation may contain:

```text
Academic
 ├── Academic Years
 ├── Courses
 ├── Semesters
 ├── Subjects
 └── Curriculum
```

The exact navigation layout belongs to the design specification.

---

# 31. Forms

### Course Form

Fields:

```text
Course Name
Course Code
Duration
Status
```

### Subject Form

Fields:

```text
Subject Name
Subject Code
Credits
Status
```

### Academic Year Form

Fields:

```text
Academic Year
Start Date
End Date
Status
```

### Semester Form

Fields:

```text
Semester Number
Semester Name
Status
```

---

# 32. Form Validation

Validation must occur on both:

```text
Frontend
Backend
```

Frontend validation improves user experience.

Backend validation is authoritative.

Examples:

```text
Course Name → required
Course Code → required
Subject Code → required
Credits → positive value
Semester Number → positive integer
Academic Year → valid format
```

---

# 33. Loading and Error States

The UI must handle:

```text
Loading
Empty data
Validation error
Unauthorized
Forbidden
Not found
Server error
Network failure
```

The interface must not silently fail.

---

# 34. Edge Cases

The system must handle:

### Duplicate Course

User attempts to create:

```text
BCA
```

when the same course code already exists in the college.

Expected:

```text
Reject request.
Show duplicate-course error.
```

---

### Duplicate Subject

User attempts to create an existing subject code.

Expected:

```text
Reject request.
```

---

### Duplicate Semester

User attempts to create:

```text
Semester 3
```

twice for the same course.

Expected:

```text
Reject request.
```

---

### Duplicate Subject Association

User attempts to assign the same subject to the same semester twice.

Expected:

```text
Reject request.
```

---

### Inactive Subject

User attempts to assign an inactive subject to a new curriculum.

Expected:

```text
Reject request or require explicit reactivation.
```

---

### Cross-Tenant ID Manipulation

User changes:

```text
/course/101
```

to:

```text
/course/202
```

where course 202 belongs to another college.

Expected:

```text
403 Forbidden
```

or an equivalent tenant-isolation response according to the project's security policy.

---

### Historical Subject

A subject referenced by historical results becomes inactive.

Expected:

```text
Historical results remain accessible.
```

---

# 35. Security Requirements

The module must follow the project's security rules.

Required controls:

- authentication
- authorization
- tenant isolation
- server-side validation
- input validation
- parameterized database access through the persistence layer
- protection against IDOR
- audit logging for important administrative changes
- no trust in frontend tenant identifiers
- no exposure of internal database details

A user-provided `collegeId` must never override the authenticated tenant context.

---

# 36. Audit Events

Important academic structure changes should generate audit events.

Examples:

```text
ACADEMIC_YEAR_CREATED
ACADEMIC_YEAR_UPDATED
ACADEMIC_YEAR_STATUS_CHANGED

COURSE_CREATED
COURSE_UPDATED
COURSE_STATUS_CHANGED

SEMESTER_CREATED
SEMESTER_UPDATED
SEMESTER_STATUS_CHANGED

SUBJECT_CREATED
SUBJECT_UPDATED
SUBJECT_STATUS_CHANGED

SUBJECT_ASSIGNED_TO_SEMESTER
SUBJECT_REMOVED_FROM_SEMESTER
```

Audit records should identify:

```text
actor
action
entity
entity_id
timestamp
tenant/college
```

The exact audit schema is defined by the security/audit architecture.

---

# 37. Acceptance Criteria

The feature is acceptable when:

- [ ] College Admin can create an academic year.
- [ ] College Admin can create a course.
- [ ] College Admin can create semesters for a course.
- [ ] College Admin can create subjects.
- [ ] Subjects can be associated with semesters.
- [ ] Duplicate course codes are rejected within a college.
- [ ] Duplicate subject codes are rejected within a college.
- [ ] Duplicate semester numbers are rejected within a course.
- [ ] Duplicate subject-semester associations are rejected.
- [ ] Academic entities can be activated/deactivated.
- [ ] Historical references remain valid after deactivation.
- [ ] Tenant isolation is enforced server-side.
- [ ] Unauthorized users cannot modify academic structure.
- [ ] Students can view relevant academic structure only.
- [ ] Validation occurs on the backend.
- [ ] Important changes generate audit events.
- [ ] APIs return consistent validation and authorization errors.
- [ ] Frontend handles loading, empty, success, and error states.

---

# 38. Test Scenarios

## Academic Year

- Create valid academic year.
- Create duplicate academic year.
- Update academic year.
- Deactivate academic year.
- Attempt cross-tenant access.

## Course

- Create valid course.
- Create duplicate course code.
- Update course.
- Deactivate course.
- Access another college's course.

## Semester

- Create semester.
- Create duplicate semester number.
- Update semester.
- Deactivate semester.
- Create semester for another college's course.

## Subject

- Create subject.
- Create duplicate subject code.
- Update subject.
- Deactivate subject.
- Attempt cross-tenant access.

## Curriculum

- Assign subject to semester.
- Assign same subject twice.
- Assign inactive subject.
- Remove subject association.
- Verify historical records remain valid.

## Security

- Unauthorized API request.
- Insufficient-role request.
- Manipulated tenant ID.
- Manipulated entity ID.
- Access inactive entity.
- Verify audit events.

---

# 39. AI Coding Agent Rules

When implementing this module, an AI coding agent must:

1. Read the project architecture before modifying code.
2. Read authentication and authorization rules.
3. Preserve tenant isolation.
4. Never trust frontend-provided `collegeId`.
5. Resolve tenant context from the authenticated user where applicable.
6. Reuse existing security utilities.
7. Reuse existing API response/error conventions.
8. Reuse existing audit infrastructure.
9. Follow the project's database migration rules.
10. Do not create duplicate academic entities.
11. Do not silently delete historical academic data.
12. Do not modify result-processing logic while implementing academic structure unless explicitly required.
13. Do not introduce a microservice for this module.
14. Do not introduce new libraries without approval.
15. Add automated tests for business rules and authorization.
16. Do not bypass backend validation.
17. Keep academic entities college-scoped.
18. Preserve historical references.
19. Keep implementation consistent with the existing module structure.

---

# 40. Definition of Done

Academic Structure is complete when:

- [ ] Backend entities are implemented.
- [ ] Database migrations are implemented.
- [ ] Relationships and constraints are implemented.
- [ ] APIs are implemented.
- [ ] Authentication and authorization are integrated.
- [ ] Tenant isolation is tested.
- [ ] Validation is implemented.
- [ ] Audit events are implemented.
- [ ] Frontend management screens are implemented.
- [ ] Loading and error states are implemented.
- [ ] Unit tests are implemented.
- [ ] Integration/API tests are implemented.
- [ ] Security tests are completed.
- [ ] Code review is completed.
- [ ] Documentation is updated.
- [ ] Feature passes QA acceptance criteria.

---

# 41. Future Extensions

Possible future capabilities:

### Curriculum Versioning

Support multiple curriculum versions:

```text
BCA Curriculum 2024
BCA Curriculum 2025
BCA Curriculum 2026
```

---

### Regulation Management

Associate academic structures with university regulations.

Example:

```text
OU Regulation 2025
```

---

### University Curriculum Sync

When an authorized university integration becomes available:

```text
University
    ↓
University Connector
    ↓
Curriculum Data
    ↓
Acadlytic Academic Structure
```

---

### Credit Eligibility Engine

Future rules may determine:

```text
earned credits
required credits
remaining credits
graduation eligibility
```

---

### Curriculum Comparison

Compare curriculum versions:

```text
2025 Curriculum
vs
2026 Curriculum
```

---

# 42. Related Documents

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
```

Related future modules:

```text
student-management.md
result-import.md
result-validation.md
result-processing.md
backlog-tracking.md
academic-passport.md
analytics.md
student-portal.md
```

---

# 43. Document Status

**Status:** Draft / Implementation Ready

This document defines the expected behavior and implementation requirements for the Acadlytic Academic Structure module.

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