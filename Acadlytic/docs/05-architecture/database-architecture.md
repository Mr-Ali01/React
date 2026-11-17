# Acadlytic — Database Architecture

**Project:** Acadlytic  
**Document:** Database Architecture  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  
**Database:** MySQL  
**Backend:** Java + Spring Boot  
**ORM:** Spring Data JPA + Hibernate  

---

# 1. Purpose

This document defines the database architecture for Acadlytic.

It describes:

- database technology
- database design principles
- tenant model
- core entities
- entity ownership
- relationships
- primary keys
- foreign keys
- indexes
- unique constraints
- normalization
- audit fields
- historical data preservation
- result import storage
- result validation storage
- result processing storage
- backlog storage
- academic calculation storage
- authorization-related data
- transaction and integrity requirements
- migration strategy
- database security
- backup considerations
- future extensibility

This document defines the database structure at an architectural level.

Exact SQL migrations and implementation-specific column definitions should be created during development.

---

# 2. Database Technology

Acadlytic will use:

> **MySQL**

The backend will access MySQL through:

```text
Spring Boot
    ↓
Spring Data JPA
    ↓
Hibernate
    ↓
JDBC
    ↓
MySQL
```

The application must not allow the React frontend to connect directly to MySQL.

---

# 3. Database Architecture Goals

The database must provide:

- strong relational integrity
- tenant isolation
- normalized data
- historical academic preservation
- reliable result processing
- duplicate prevention
- efficient querying
- clear ownership
- transaction support
- auditability
- scalable result imports
- secure access
- future extensibility

The database should support the MVP without unnecessary complexity.

---

# 4. Database Design Principle

The database must follow this principle:

> **Store authoritative data once, reference it where possible, and derive secondary views from authoritative data.**

This prevents multiple modules from maintaining conflicting copies of the same information.

Example:

```text
Student Management
       ↓
Authoritative Student
       ↓
Results / Backlogs / Passport / Analytics
       ↓
Reference Student
```

---

# 5. Database Architecture Style

Acadlytic will use a:

> **Relational Database Architecture**

The database will primarily use normalized relational tables with:

- primary keys
- foreign keys
- unique constraints
- indexes
- status fields
- timestamps
- transactional operations

---

# 6. Storage Engine

Tables should use a transactional MySQL storage engine such as:

> **InnoDB**

InnoDB is required for:

- transactions
- foreign keys
- row-level locking
- crash recovery
- referential integrity

---

# 7. Character Set

The database should use:

```text
utf8mb4
```

This provides broad Unicode support.

The database, tables, and relevant columns should use a consistent UTF-8-compatible configuration.

---

# 8. Tenant Model

Acadlytic is a multi-tenant SaaS platform.

The primary tenant boundary is:

> **College**

Conceptually:

```text
Platform
   │
   ├── College A
   │      ├── Students
   │      ├── Academic Data
   │      ├── Results
   │      └── Backlogs
   │
   ├── College B
   │      ├── Students
   │      ├── Academic Data
   │      ├── Results
   │      └── Backlogs
   │
   └── College C
          ├── Students
          ├── Academic Data
          ├── Results
          └── Backlogs
```

College-specific data must be isolated by `college_id` or an equivalent tenant relationship.

---

# 9. Tenant Isolation Principle

Tenant isolation must be enforced by the backend.

The database structure should support tenant-aware queries.

Example:

```text
SELECT *
FROM students
WHERE id = ?
AND college_id = ?;
```

The frontend must never be trusted to provide valid tenant context.

Tenant context must come from the authenticated backend identity and authorization system.

---

# 10. Global vs Tenant Data

Not every table belongs directly to a college.

### Global/reference data

Examples:

- universities
- roles
- system-level configuration
- certain academic reference data

### Tenant-owned data

Examples:

- students
- college users
- enrollments
- result imports
- processed results
- backlogs

The final schema must clearly distinguish global reference data from tenant-owned data.

---

# 11. Primary Key Strategy

The application should use a consistent primary key strategy.

A practical initial approach is:

> **Numeric surrogate primary keys**

Example:

```text
BIGINT
```

with auto-generated values.

Example:

```text
id BIGINT PRIMARY KEY AUTO_INCREMENT
```

The final choice should be applied consistently across the schema unless a specific entity requires another strategy.

---

# 12. Business Identifiers vs Database IDs

Database IDs and business identifiers must remain separate.

Example:

```text
students
-----------------------------
id                     ← database identity
university_identifier  ← business identity
```

A student's university identifier must not be used as the database primary key.

This allows:

- internal identity stability
- future university changes
- imported identifiers
- integration flexibility

---

# 13. UUID Consideration

UUIDs may be introduced where external exposure of sequential database IDs presents a requirement.

However, UUIDs should not be introduced simply because they are popular.

The initial MVP should prefer a consistent strategy.

Any change to UUID-based identifiers must be reflected across:

- database
- JPA entities
- APIs
- frontend
- indexes
- migrations

---

# 14. Naming Convention

Database naming should use:

> **snake_case**

Examples:

```text
student_id
college_id
academic_year_id
created_at
updated_at
```

Table names should generally use plural nouns:

```text
users
colleges
students
courses
subjects
results
backlogs
```

---

# 15. Common Audit Columns

Persistent business tables should generally contain:

```text
created_at
updated_at
```

Where applicable, additional fields may include:

```text
created_by
updated_by
```

Audit requirements must be decided according to the sensitivity of the entity.

Not every table needs every audit field.

---

# 16. Timestamp Standard

The backend should use a consistent timestamp strategy.

The preferred architectural principle is:

> **Store timestamps in UTC and convert them for display at the application layer.**

This avoids timezone inconsistencies across:

- colleges
- users
- result imports
- audit records
- background jobs

---

# 17. Status Instead of Physical Deletion

For important business entities, physical deletion should generally be avoided when historical records depend on them.

Example:

```text
ACTIVE
INACTIVE
SUSPENDED
```

can be used instead of deleting a college.

This preserves historical academic data.

---

# 18. Soft Deletion

Soft deletion should only be used where there is a genuine business requirement.

Possible implementation:

```text
deleted_at
```

or an appropriate status.

Do not add soft deletion to every table automatically.

Academic history should generally be preserved rather than deleted.

---

# 19. Core Database Domains

The database can be conceptually divided into:

```text
Identity & Access
        ↓
Tenant / College
        ↓
Academic Structure
        ↓
Students & Enrollment
        ↓
Result Import
        ↓
Result Validation
        ↓
Result Processing
        ↓
Backlog
        ↓
Academic Calculations
        ↓
Academic Passport
        ↓
Analytics
        ↓
Audit / Operations
```

---

# 20. Core Entity Overview

The initial database will require entities conceptually representing:

### Identity

- users
- roles
- user_roles

### Tenant

- colleges
- college_admin relationships where required

### Academic Structure

- universities
- courses
- academic_years
- semesters
- subjects
- course_subjects where required

### Students

- students
- student_enrollments

### Results

- result_import_jobs
- result_import_records
- result_validation_errors
- academic_results
- result_attempts

### Backlogs

- backlogs
- backlog_history where required

### Calculations

- academic_calculations or equivalent calculation records where persistence is required

### Operations

- audit_logs

Not every conceptual object must necessarily become a separate table.

---

# 21. University Entity

The University entity represents an academic university.

Conceptually:

```text
universities
----------------------------
id
name
code
status
created_at
updated_at
```

University should be a referenced master entity.

Colleges should reference:

```text
college.university_id
```

rather than storing the university name repeatedly.

---

# 22. University Ownership

University master data is platform-level reference data.

It should not be independently created or modified by individual College Admin users.

Possible ownership:

```text
SUPER_ADMIN
    ↓
University Master
```

College Admin:

```text
READ
```

according to authorization.

---

# 23. College Entity

The College entity represents a tenant.

Conceptually:

```text
colleges
----------------------------
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

Important relationships:

```text
University
    ↓
College
```

---

# 24. College Constraints

The college table should enforce:

- primary key
- unique college code
- valid university reference
- valid status
- required name
- required code

College name does not necessarily need to be globally unique.

---

# 25. User Entity

The `users` table represents application identities.

Conceptually:

```text
users
----------------------------
id
college_id
email
password_hash
first_name
last_name
status
created_at
updated_at
```

The exact relationship between `users` and `college_id` depends on the final identity model.

Platform-level users such as `SUPER_ADMIN` may not belong to a college.

---

# 26. User Roles

Roles should be represented consistently.

Core roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

A role model may use:

```text
roles
----------------------------
id
name
```

and:

```text
user_roles
----------------------------
user_id
role_id
```

This allows future support for multiple roles per user if required.

---

# 27. Account Provisioning

Account creation must follow the provisioning rules defined by Authentication.

Conceptually:

```text
SUPER_ADMIN
    ↓
COLLEGE_ADMIN

COLLEGE_ADMIN
    ↓
ACADEMIC_STAFF
    ↓
STUDENT
```

Public self-registration is not required for the MVP.

---

# 28. Student Entity

The `students` table owns student identity.

Conceptually:

```text
students
----------------------------
id
college_id
user_id
university_identifier
first_name
last_name
email
phone
date_of_birth
gender
status
created_at
updated_at
```

The exact personal-data fields should follow the final Student Management specification and privacy requirements.

---

# 29. Student Identity Rule

The university-issued student identifier should be the preferred business identifier for result matching.

Example:

```text
university_identifier
```

This may represent:

- hall ticket number
- roll number
- registration number
- university student ID

depending on the university.

Student name must not be the primary identity key for result matching.

---

# 30. Student Uniqueness

A student's university identifier should be unique within the appropriate identity boundary.

The final constraint must account for the platform's university and college model.

A conceptual uniqueness rule may be:

```text
UNIQUE (
    university_id,
    university_identifier
)
```

or an equivalent constraint based on the final schema.

This must be decided before migration implementation.

---

# 31. Student Enrollment

Enrollment represents a student's association with an academic program.

Conceptually:

```text
student_enrollments
----------------------------
id
student_id
course_id
academic_year_id
admission_year
status
start_date
end_date
created_at
updated_at
```

This separates:

> Student identity

from:

> Academic enrollment.

---

# 32. Why Enrollment Is Separate

A student may have:

- one academic program
- a transfer
- program changes
- different academic periods
- historical enrollment information

Keeping enrollment separate prevents student identity from being tightly coupled to one academic structure.

---

# 33. Course / Program Entity

Courses represent academic programs.

Conceptually:

```text
courses
----------------------------
id
university_id
name
code
duration
status
created_at
updated_at
```

Examples:

```text
BCA
B.Sc Computer Science
MCA
MBA
```

The exact terminology may be `course`, `program`, or another domain term.

The project should choose one consistent terminology.

---

# 34. Academic Year Entity

Academic years should be represented explicitly.

Conceptually:

```text
academic_years
----------------------------
id
college_id
name
start_date
end_date
status
created_at
updated_at
```

Example:

```text
2025-2026
2026-2027
```

Whether academic years are college-specific or university-level must follow the final academic structure design.

---

# 35. Semester Entity

A semester represents an academic period.

Conceptually:

```text
semesters
----------------------------
id
course_id
name
sequence_number
created_at
updated_at
```

Example:

```text
Semester 1
Semester 2
Semester 3
```

The final relationship may include academic year depending on the academic structure model.

---

# 36. Subject Entity

Subjects represent academic subjects.

Conceptually:

```text
subjects
----------------------------
id
university_id
code
name
credits
status
created_at
updated_at
```

Subject code should be the primary matching identifier during result import where available.

---

# 37. Course-Subject Relationship

A course may contain many subjects.

A subject may potentially belong to multiple courses or academic structures.

Therefore, a mapping table may be required:

```text
course_subjects
----------------------------
id
course_id
subject_id
semester_id
credits
is_active
```

This allows subject offerings to vary by course and semester.

---

# 38. Academic Structure Relationship

Conceptually:

```text
University
    ↓
College
    ↓
Course / Program
    ↓
Semester
    ↓
Subjects
```

The exact relationship between university, college, course, academic year, semester, and subject must be finalized in the detailed database model.

---

# 39. Result Import Job

The `result_import_jobs` table represents an import operation.

Conceptually:

```text
result_import_jobs
----------------------------
id
college_id
university_id
source_type
file_name
external_result_id
result_release_name
published_at
status
records_count
success_count
error_count
created_by
created_at
updated_at
```

Possible source types:

```text
EXCEL
CSV
UNIVERSITY_API
WEBHOOK
AUTHORIZED_FEED
```

The last three are future capabilities.

---

# 40. Import Job Status

Possible statuses include:

```text
UPLOADED
PARSING
VALIDATING
READY_FOR_REVIEW
PROCESSING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

The exact status lifecycle must remain consistent with `result-import.md`.

---

# 41. Result Import Record

Each imported source row should be represented independently.

Conceptually:

```text
result_import_records
----------------------------
id
import_job_id
row_number
student_identifier
subject_code
raw_payload
normalized_data
validation_status
processing_status
error_message
created_at
updated_at
```

The exact storage type for `raw_payload` and `normalized_data` must be selected based on the final implementation.

---

# 42. Raw Result Preservation

Raw imported information should be preserved where required for:

- debugging
- auditability
- validation
- reprocessing
- source comparison

However, raw data must not automatically become the authoritative academic record.

The authoritative academic record is created only after successful result processing.

---

# 43. Result Validation Errors

Validation errors may be stored in a separate table:

```text
result_validation_errors
----------------------------
id
import_record_id
error_code
field_name
message
severity
created_at
```

Possible severity:

```text
ERROR
WARNING
```

This allows one imported record to have multiple validation issues.

---

# 44. Validation Status

The imported record may have:

```text
PENDING
VALID
INVALID
WARNING
```

Validation status must remain separate from processing status.

For example:

```text
validation_status = VALID
processing_status = PENDING
```

means the record is valid but has not yet been processed.

---

# 45. Academic Result Entity

The `academic_results` entity represents authoritative processed academic information.

Conceptually:

```text
academic_results
----------------------------
id
student_id
course_id
semester_id
academic_year_id
subject_id
result_status
marks
grade
grade_point
credits
attempt_number
processed_at
created_at
updated_at
```

The exact fields depend on the final academic result model.

---

# 46. Result Attempt History

Historical attempts must be preserved.

A student may have:

```text
Attempt 1 → FAIL
Attempt 2 → PASS
```

The database must not simply overwrite Attempt 1.

Conceptually:

```text
result_attempts
----------------------------
id
student_id
subject_id
semester_id
attempt_number
attempt_type
marks
grade
grade_point
result_status
result_release_id
processed_at
created_at
```

The exact model may combine or separate result attempts from `academic_results`.

---

# 47. Historical Result Principle

The database must preserve academic history.

Do not replace:

```text
FAIL
```

with:

```text
PASS
```

without preserving the original attempt.

Correct model:

```text
Subject
 ├── Attempt 1 → FAIL
 └── Attempt 2 → PASS
                    ↓
              Current Outcome
                    ↓
                  CLEARED
```

---

# 48. Current Subject Outcome

The system may need a representation of the current academic outcome.

Example:

```text
CLEARED
ACTIVE_BACKLOG
```

This must be derived or maintained according to the authoritative result-processing/backlog rules.

Historical attempts remain unchanged.

---

# 49. Result Identity and Duplicate Prevention

A result record must have a stable identity for duplicate detection.

Conceptually:

```text
University
+
Result Release
+
Student Identifier
+
Subject Code
+
Attempt
```

This identity must prevent accidental duplicate processing.

The exact database uniqueness constraint should reflect the finalized result model.

---

# 50. Result Release

A result release represents a published result set.

Conceptually:

```text
result_releases
----------------------------
id
university_id
external_result_id
name
exam_type
published_at
created_at
```

Examples:

```text
Regular Examination
Supplementary Examination
Semester Examination
```

Whether `result_releases` is implemented as a separate entity or represented within `result_import_jobs` must be decided during detailed schema design.

---

# 51. Result Processing Job

Large result processing operations may require a job record.

Conceptually:

```text
result_processing_jobs
----------------------------
id
import_job_id
status
total_records
processed_records
success_count
error_count
started_at
completed_at
created_at
updated_at
```

This supports asynchronous processing and status tracking.

---

# 52. Backlog Entity

The `backlogs` table represents the current backlog state.

Conceptually:

```text
backlogs
----------------------------
id
student_id
subject_id
course_id
semester_id
status
first_failed_attempt_id
cleared_attempt_id
created_at
updated_at
```

Possible statuses:

```text
ACTIVE
CLEARED
```

The exact state model must follow the backlog feature specification.

---

# 53. Backlog History

Backlog lifecycle changes should preserve historical information where required.

Example:

```text
Subject
   ↓
FAIL
   ↓
Backlog Created
   ↓
Supplementary PASS
   ↓
Backlog Cleared
```

The original failure must remain traceable.

A separate history table may be used:

```text
backlog_history
----------------------------
id
backlog_id
previous_status
new_status
result_attempt_id
changed_at
changed_by
```

---

# 54. Backlog Ownership

Backlog state belongs to the Backlog Tracking module.

Result Processing can trigger a backlog operation:

```text
Result Processing
      ↓
Backlog Service
      ↓
Backlog State
```

Result Processing must not directly manipulate backlog tables outside the backlog domain's defined operation.

---

# 55. Academic Calculation Data

SGPA and CGPA are derived academic values.

The database architecture must distinguish:

```text
Source Academic Results
```

from:

```text
Calculated Academic Metrics
```

If calculation results are persisted, the persistence model must clearly identify them as derived values.

---

# 56. Calculation Record

A possible conceptual model is:

```text
academic_calculations
----------------------------
id
student_id
semester_id
calculation_type
value
calculated_at
calculation_version
```

Possible calculation types:

```text
SGPA
CGPA
```

However, this table should only be introduced if persisted calculation snapshots are required.

The system should not duplicate calculations unnecessarily.

---

# 57. Calculation Version

If academic calculation rules change over time, calculation versioning may become important.

Example:

```text
calculation_version = 1
calculation_version = 2
```

This allows the system to understand which rule set generated a stored value.

This is a future extensibility consideration and must not be confused with a specific university's current formula.

---

# 58. Academic Passport Data

Academic Passport is primarily a read-oriented representation.

The preferred architecture is:

```text
Authoritative Academic Data
          ↓
Academic Passport Service
          ↓
Passport API
```

A dedicated `academic_passport` table is not automatically required.

---

# 59. Academic Passport Projection

If performance eventually requires a read model, a projection table may be introduced.

Example:

```text
academic_passport_projection
----------------------------
student_id
summary_data
last_updated_at
```

This should remain derived from authoritative academic data.

It must never become an independent source of truth.

---

# 60. Analytics Data

Analytics is also derived.

For MVP, analytics should primarily query:

```text
students
academic_results
result_attempts
backlogs
academic_structure
```

A separate analytics database is not required initially.

---

# 61. Analytics Read Model

A dedicated analytics/read model may be introduced later if:

- data volume becomes large
- dashboard queries become expensive
- reporting requirements grow
- real-time transactional queries become unsuitable

Possible future architecture:

```text
MySQL Transactional Data
          ↓
Analytics Pipeline
          ↓
Analytics Read Model
```

This is outside the initial MVP.

---

# 62. Audit Log

A centralized audit table may be used:

```text
audit_logs
----------------------------
id
actor_user_id
college_id
action
entity_type
entity_id
metadata
ip_address
created_at
```

Possible actions:

```text
LOGIN
LOGOUT
ACCOUNT_CREATED
PASSWORD_CHANGED
COLLEGE_CREATED
COLLEGE_UPDATED
STUDENT_CREATED
RESULT_IMPORTED
RESULT_PROCESSED
BACKLOG_UPDATED
```

Sensitive data should not be unnecessarily stored in audit metadata.

---

# 63. Foreign Key Strategy

Foreign keys should be used to protect relational integrity.

Examples:

```text
students.college_id
        ↓
colleges.id
```

```text
students.user_id
        ↓
users.id
```

```text
result_import_records.import_job_id
        ↓
result_import_jobs.id
```

```text
academic_results.student_id
        ↓
students.id
```

Foreign keys should be introduced wherever they represent genuine ownership/dependency relationships.

---

# 64. Foreign Key Deletion Strategy

Cascade deletion must be used carefully.

For academic records:

> Do not casually cascade-delete historical data.

For example:

```text
College
   ↓
Students
   ↓
Results
   ↓
Backlogs
```

Deleting a college must not automatically destroy the academic history.

Prefer:

```text
ACTIVE
INACTIVE
SUSPENDED
```

over destructive deletion for important business entities.

---

# 65. Unique Constraints

Important business identities should use database-level uniqueness.

Potential examples:

```text
users.email
colleges.code
subjects.code within appropriate academic boundary
student university identifier within appropriate boundary
```

Result identity should also have a uniqueness mechanism.

Application-level duplicate checking alone is insufficient.

---

# 66. Indexing Strategy

Indexes should be created for:

- primary keys
- foreign keys
- frequently queried business identifiers
- unique identifiers
- tenant filtering
- result filtering
- backlog filtering
- import job lookup
- audit lookup

Examples:

```text
students.college_id
students.university_identifier
academic_results.student_id
academic_results.subject_id
academic_results.semester_id
backlogs.student_id
result_import_records.import_job_id
```

Indexes must be based on actual query patterns.

---

# 67. Composite Indexes

Composite indexes may be required for common queries.

Example:

```text
(college_id, university_identifier)
```

or:

```text
(student_id, semester_id)
```

or:

```text
(import_job_id, validation_status)
```

The exact index set should be finalized after reviewing API queries and expected workload.

---

# 68. Indexing Rule

Do not index every column.

Excessive indexes increase:

- storage usage
- insert cost
- update cost
- migration complexity

Indexes should support actual access patterns.

---

# 69. Normalization

The database should generally follow relational normalization principles.

Avoid storing repeated data unnecessarily.

Bad:

```text
student
----------------
college_name
university_name
course_name
semester_name
```

when these already exist as entities.

Better:

```text
student
   ↓
college_id

college
   ↓
university_id
```

---

# 70. Controlled Denormalization

Denormalization may be used when justified by:

- performance
- reporting
- read models
- caching
- historical snapshots

Any denormalized value must have a clearly defined source of truth.

---

# 71. Data Duplication Rule

The same authoritative business data must not be maintained independently by multiple modules.

Example:

```text
Student name
```

should have one authoritative source.

Other modules should reference the student rather than maintain their own authoritative copy.

---

# 72. Historical Data Rule

Academic data is historical.

The database must preserve:

- previous attempts
- previous result outcomes
- backlog history
- result release context
- processing history where required
- important audit events

Corrections should produce traceable changes rather than silently destroying history.

---

# 73. Result Correction

If an imported result is corrected:

```text
Original Result
      ↓
Correction / New Result
      ↓
Reprocessing
      ↓
Updated Current Outcome
```

The implementation must preserve enough history to understand what happened.

The exact correction workflow belongs to the result-processing design.

---

# 74. Transaction Integrity

Operations that modify multiple related records must use transactions.

Example:

```text
Result Processing
      │
      ├── Result Attempt
      ├── Academic Result
      ├── Backlog
      └── Calculation
```

The backend must define whether these changes are:

- atomic
- batch-atomic
- per-student atomic
- per-record atomic

The strategy must be explicit for large imports.

---

# 75. Batch Processing

Large imports should not necessarily be processed in one giant transaction.

Example:

```text
10,000 records
      ↓
Batch 1 → 500
Batch 2 → 500
Batch 3 → 500
...
```

Batch size should be configurable.

The system must still provide accurate:

- success count
- failure count
- processing status
- error information

---

# 76. Import Idempotency

If the same import or processing request is retried, duplicate academic records must not be created.

Idempotency should be enforced using:

- unique business identity
- processing state
- job state
- transaction checks
- application-level idempotency where required

---

# 77. Database-Level Integrity

The database should enforce integrity through:

- primary keys
- foreign keys
- unique constraints
- not-null constraints
- appropriate data types
- check constraints where supported and useful
- transactional writes

Business rules that require application context remain in the service/domain layer.

---

# 78. Database Constraints vs Business Rules

Not every rule belongs in MySQL.

### Database responsibility

```text
ID uniqueness
Foreign-key validity
Required values
Basic data integrity
```

### Application responsibility

```text
User authorization
Tenant authorization
Result-processing workflow
Backlog lifecycle
Academic calculation rules
```

Both layers work together.

---

# 79. MySQL Data Types

Use appropriate MySQL types.

Examples:

```text
BIGINT
VARCHAR
TEXT
DECIMAL
DATE
DATETIME / TIMESTAMP
BOOLEAN / TINYINT
```

Academic numeric values must use types appropriate for their precision requirements.

Do not use floating-point types for values that require exact decimal precision without justification.

---

# 80. Marks and Grade Storage

Marks should be stored in a numeric representation appropriate to the university's configured grading model.

For example:

```text
marks
```

may require decimal support if fractional marks are possible.

Grade should be stored separately:

```text
grade
grade_point
```

This prevents the system from assuming that all universities use the same grading model.

---

# 81. Credits

Credits should be represented independently from marks.

Conceptually:

```text
subject
    ↓
credits
```

and:

```text
academic_result
    ↓
earned_credits
```

The distinction may be necessary where attempted and earned credits differ.

Exact rules depend on the academic regulation.

---

# 82. Null vs Zero

The database must distinguish:

```text
NULL
```

from:

```text
0
```

For example:

- missing marks ≠ zero marks
- unavailable CGPA ≠ CGPA 0
- unknown credits ≠ 0 credits

The application must not silently convert missing values into zero.

---

# 83. Result Status

Result status should be represented using controlled values.

Possible conceptual values:

```text
PASS
FAIL
ABSENT
WITHHELD
INCOMPLETE
CANCELLED
```

The exact allowed statuses may vary by university.

Therefore, the architecture should allow configuration rather than assuming a universal status list.

---

# 84. Attempt Type

Result attempts may require:

```text
REGULAR
SUPPLEMENTARY
REVALUATION
IMPROVEMENT
```

The exact values depend on the university and result model.

The database should support extension without redesigning the entire academic model.

---

# 85. Academic Structure Flexibility

The schema must not assume:

```text
Every university has exactly 8 semesters.
```

It must support different academic structures.

Similarly, it must not assume:

- identical grading scales
- identical credit systems
- identical subject naming
- identical examination types
- identical result formats

---

# 86. Regulation Compatibility

The database should support future regulation-specific configuration.

Possible future entities:

```text
regulations
grading_rules
credit_rules
calculation_rules
eligibility_rules
```

These are not required as a complete Regulation Engine in the MVP.

The current schema should remain extensible enough to add them later.

---

# 87. Multi-University Support

The platform is initially designed around university-affiliated colleges.

The database should therefore support:

```text
University A
   ↓
College 1
College 2

University B
   ↓
College 3
College 4
```

University-specific result processing should not require redesigning the core student/result model.

---

# 88. Multi-College Support

A single university may have many colleges.

Therefore:

```text
universities
    1
    │
    └────── N colleges
```

Each college is independently isolated as a tenant.

---

# 89. Student-to-College Relationship

A student belongs to a college tenant for the relevant academic context.

The database must make the college relationship explicit.

This relationship is important for:

- tenant isolation
- authorization
- analytics
- result imports
- student portal access

---

# 90. User-to-College Relationship

College-level users should be associated with their tenant.

Example:

```text
COLLEGE_ADMIN
     ↓
College A
```

```text
ACADEMIC_STAFF
     ↓
College A
```

The backend uses this relationship to determine access.

---

# 91. Student User Relationship

If students authenticate through the same `users` identity system:

```text
users
  1
  │
  └── 1 student
```

may be used.

The exact cardinality must support the final account-provisioning model.

---

# 92. Authentication Data vs Student Data

Authentication identity and academic student identity should remain conceptually separate.

```text
User
 ├── email
 ├── password
 └── role

Student
 ├── university identifier
 ├── academic identity
 └── college
```

This separation prevents authentication concerns from contaminating academic data.

---

# 93. Source-of-Truth Mapping

| Data | Owner |
|---|---|
| User identity | Authentication |
| Roles | Authentication / Authorization |
| College | College Management |
| University | Academic/platform master |
| Student | Student Management |
| Enrollment | Academic/Student domain |
| Course | Academic Structure |
| Semester | Academic Structure |
| Subject | Academic Structure |
| Import Job | Result Import |
| Imported Record | Result Import |
| Validation State | Result Validation |
| Processed Result | Result Processing |
| Result Attempts | Result Processing |
| SGPA/CGPA | Academic Calculation responsibility |
| Backlog | Backlog Tracking |
| Academic Passport | Derived/read representation |
| Analytics | Derived/analysis layer |
| Audit Event | Audit/Operations |

---

# 94. Module-to-Table Ownership

A conceptual ownership map:

```text
Authentication
 ├── users
 ├── roles
 └── user_roles

College Management
 └── colleges

Academic Structure
 ├── universities
 ├── courses
 ├── academic_years
 ├── semesters
 ├── subjects
 └── course_subjects

Student Management
 ├── students
 └── student_enrollments

Result Import
 ├── result_import_jobs
 └── result_import_records

Result Validation
 └── result_validation_errors

Result Processing
 ├── academic_results
 ├── result_attempts
 └── result_processing_jobs

Backlog Tracking
 ├── backlogs
 └── backlog_history

Operations
 └── audit_logs
```

---

# 95. Cross-Module Database Rule

A module must not directly modify another module's authoritative tables simply because it can access them.

For example:

```text
Analytics
      X
      ↓
UPDATE backlogs
```

is not allowed.

Instead:

```text
Analytics
      ↓
READ
      ↓
Backlog Data
```

For mutations:

```text
Result Processing
      ↓
Backlog Service
      ↓
Backlog Module
```

---

# 96. Repository Rule

Spring repositories should primarily operate on entities owned by their module.

Avoid creating a repository in one module whose purpose is to modify another module's authoritative data.

Cross-module reads may use:

- application services
- dedicated query services
- read projections
- carefully designed repository queries

depending on the use case.

---

# 97. Database Access Security

The application database account should follow least privilege.

Production credentials should:

- not be committed to Git
- not be exposed to the frontend
- not be embedded in source code
- be supplied securely through environment configuration/secrets

Database access should only be available to the backend infrastructure that requires it.

---

# 98. SQL Injection Protection

The backend must use parameterized queries through:

- JPA
- Spring Data
- prepared statements
- safe query APIs

User input must never be concatenated directly into SQL.

---

# 99. Database Migration Strategy

Database schema changes must be version controlled.

A migration framework should be selected:

```text
Flyway
```

or:

```text
Liquibase
```

The final choice should be recorded before implementation begins.

The migration tool becomes the authoritative mechanism for schema evolution.

---

# 100. Migration Rules

Every schema change must be:

- versioned
- reviewable
- reproducible
- tested
- compatible with deployment procedures

Developers should not manually modify production schemas as the normal development workflow.

---

# 101. Seed Data

Initial reference data may be inserted through migrations or controlled seed scripts.

Possible seed data:

```text
Roles
System statuses
Reference configuration
Initial development university
```

Production seed data must be carefully controlled.

---

# 102. Development Database

Developers should be able to create a fresh database from migrations.

Expected workflow:

```text
Empty MySQL Database
       ↓
Run Migrations
       ↓
Create Schema
       ↓
Seed Required Reference Data
       ↓
Application Starts
```

This ensures reproducibility.

---

# 103. Test Database

Automated tests should use an isolated database.

Possible approaches:

- dedicated MySQL test database
- Testcontainers MySQL
- controlled integration-test environment

Tests must not use production data.

---

# 104. Backup Strategy

Production MySQL must have a backup strategy.

The strategy should define:

- backup frequency
- retention
- storage location
- encryption
- restore procedure
- recovery testing

A backup is not considered reliable until restoration has been tested.

---

# 105. Disaster Recovery

The production architecture should eventually define:

```text
Backup
   ↓
Secure Storage
   ↓
Restore Procedure
   ↓
Recovery Environment
```

Recovery objectives such as RPO and RTO should be defined before production launch.

---

# 106. Data Retention

Retention policies must be defined for:

- audit logs
- import files
- raw result records
- processing jobs
- application logs
- historical academic data

Academic records should generally have longer retention requirements than temporary operational data.

---

# 107. Personal Data

Student information may contain personal data.

The database must therefore apply appropriate controls for:

- access
- storage
- logging
- exports
- backups
- retention

Sensitive personal data should not be exposed unnecessarily through APIs or logs.

---

# 108. Data Export

If exports are implemented, exported data must respect:

- role authorization
- tenant isolation
- student privacy
- audit requirements

Exports should not bypass normal backend authorization.

---

# 109. Performance Architecture

The database should initially support:

- indexed transactional queries
- pagination
- batch processing
- aggregate queries
- efficient joins
- controlled result imports

Do not introduce a separate data warehouse for the MVP unless actual requirements justify it.

---

# 110. Large Result Imports

Large result files may contain thousands of records.

The database architecture should therefore support:

```text
Import Job
     ↓
Import Records
     ↓
Validation
     ↓
Batch Processing
     ↓
Academic Records
```

Bulk operations should be carefully designed to avoid:

- excessive memory usage
- enormous transactions
- N+1 queries
- duplicate records
- database connection exhaustion

---

# 111. Result Query Optimization

Common queries should be supported by appropriate indexes.

Examples:

```text
Student → all results
Student → semester results
Student → active backlogs
Import Job → import records
Import Job → validation errors
Course → student results
Semester → results
```

---

# 112. Analytics Query Optimization

Analytics queries may aggregate large datasets.

The backend should prefer:

- database-side aggregation
- indexed filtering
- grouped queries
- projections
- pagination where appropriate

Avoid loading thousands of entities into Java memory just to calculate simple aggregates.

---

# 113. N+1 Prevention

The JPA layer must be monitored for N+1 queries.

Potential solutions include:

- fetch joins
- projections
- explicit query design
- entity graphs
- batch fetching

Do not solve N+1 problems by making all relationships eager.

---

# 114. Database Connection Pool

Spring Boot's database connection pool should be configured appropriately.

The configuration must consider:

- application instance count
- MySQL connection limits
- expected concurrent requests
- background jobs

The application must not create excessive database connections.

---

# 115. Transaction Isolation

MySQL transaction isolation should use a sensible default unless a specific workflow requires otherwise.

Higher isolation levels should not be introduced unnecessarily because they may reduce concurrency.

Concurrency-sensitive workflows should be analyzed individually.

---

# 116. Optimistic Locking

Optimistic locking may be used for records that can be edited concurrently.

Example:

```text
version
```

field:

```java
@Version
private Long version;
```

Potential candidates include:

- college configuration
- student profile
- editable academic configuration
- processing job state

The exact use should be determined during implementation.

---

# 117. Processing Job Concurrency

Background jobs must prevent the same job from being processed simultaneously by multiple workers.

Possible mechanisms:

- status transition checks
- database locking
- unique processing tokens
- optimistic locking
- job queue controls

The chosen mechanism must be documented in the implementation.

---

# 118. Database and API Architecture

The database should support the API contracts without forcing API consumers to understand database structure.

For example:

```text
API:
GET /api/v1/me/academic-passport
```

does not mean:

```text
SELECT * FROM academic_passport;
```

The service layer decides how the response is assembled.

---

# 119. Database and Backend Architecture

Backend layers:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
JPA/Hibernate
    ↓
MySQL
```

Database architecture defines what the repository persists.

Backend architecture defines how application logic interacts with that persistence.

---

# 120. Database and Data Ownership

Database design must reflect `data-ownership.md`.

The database must not create ambiguous ownership.

For every important table, determine:

```text
Who owns it?
Who creates records?
Who updates records?
Who can read it?
Is it authoritative?
Is it derived?
```

---

# 121. Conceptual Entity Relationship

A simplified relationship model:

```text
UNIVERSITY
    │
    └──────< COLLEGE
                 │
                 ├──────< USERS
                 │
                 ├──────< STUDENTS
                 │            │
                 │            └──────< STUDENT_ENROLLMENTS
                 │                         │
                 │                         ↓
                 │                       COURSE
                 │                         │
                 │                         └──────< SEMESTER
                 │                                      │
                 │                                      └──────< SUBJECT
                 │
                 └──────< RESULT_IMPORT_JOBS
                                │
                                └──────< RESULT_IMPORT_RECORDS
                                             │
                                             └──────< VALIDATION_ERRORS

STUDENT
   │
   ├──────< RESULT_ATTEMPTS
   │
   ├──────< ACADEMIC_RESULTS
   │
   └──────< BACKLOGS
```

This is conceptual and does not represent the final physical ERD.

---

# 122. High-Level Data Flow

The database lifecycle is:

```text
University Result
       ↓
Result Import Job
       ↓
Import Records
       ↓
Validation
       ↓
Processed Academic Results
       ↓
Result Attempts
       ↓
Backlog State
       ↓
Academic Calculations
       ↓
Academic Passport
       ↓
Analytics
```

---

# 123. Source-of-Truth Flow

```text
Students
    ↓
Student Management
    ↓
Student Table

Academic Structure
    ↓
Academic Structure Module
    ↓
Academic Tables

Imported Results
    ↓
Result Import
    ↓
Import Tables

Validated Results
    ↓
Result Validation
    ↓
Validation State

Processed Results
    ↓
Result Processing
    ↓
Academic Result Tables

Backlogs
    ↓
Backlog Module
    ↓
Backlog Tables

Analytics
    ↓
Derived Queries
```

---

# 124. What Should Not Be Stored as Authoritative Data

The following should not independently become authoritative copies:

```text
Analytics values
Academic Passport summaries
Student Portal values
Dashboard KPI snapshots
Imported raw values
Frontend-calculated academic results
```

These must derive from the correct source.

---

# 125. Database Anti-Patterns

Avoid:

### Duplicate Student Tables

```text
students
analytics_students
passport_students
result_students
```

when all represent the same student.

---

### Database-as-API

Do not expose database structure directly to frontend clients.

---

### Giant Table

Do not place:

```text
student
college
course
subject
result
backlog
```

into one enormous table.

---

### JSON for Everything

Do not store the entire relational model as JSON.

JSON/raw payloads should only be used where semi-structured data is genuinely required.

---

### No Foreign Keys

Avoid relying entirely on application code for relational integrity.

---

### Destructive Academic Updates

Do not overwrite historical attempts without preserving history.

---

# 126. Database Coding Rules

Developers must:

- follow naming conventions
- use migrations
- use foreign keys where appropriate
- use indexes based on query patterns
- avoid unnecessary duplication
- preserve academic history
- use transactions for multi-record operations
- use appropriate data types
- avoid storing secrets
- avoid plaintext passwords
- avoid uncontrolled cascading deletes
- document unusual schema decisions

---

# 127. AI Database Coding Rules

AI coding agents must:

1. read `data-ownership.md`
2. read the relevant feature specification
3. read `backend-architecture.md`
4. read `api-architecture.md`
5. follow this database architecture
6. never invent a new authoritative table without justification
7. never duplicate student identity unnecessarily
8. never remove historical academic records casually
9. never bypass foreign-key relationships
10. never introduce database changes without migrations
11. never expose database entities directly as API contracts
12. never invent university-specific academic formulas
13. preserve tenant isolation
14. add indexes only when justified
15. add tests for important persistence behavior
16. document unresolved schema decisions

---

# 128. Database Development Workflow

Database changes should follow:

```text
Feature Requirement
        ↓
Data Ownership Check
        ↓
Entity Identification
        ↓
Relationship Design
        ↓
Constraint Design
        ↓
Index Design
        ↓
Migration
        ↓
Entity Mapping
        ↓
Repository
        ↓
Integration Test
        ↓
Review
```

---

# 129. Database Definition of Done

A database feature is complete when:

- ownership is defined
- entity purpose is clear
- relationships are defined
- primary keys are defined
- foreign keys are defined
- unique constraints are defined
- indexes are reviewed
- audit requirements are defined
- historical-data requirements are addressed
- migration is created
- JPA mapping is implemented
- repository queries are tested
- tenant isolation is verified
- transaction behavior is verified
- performance risks are reviewed
- rollback strategy is considered

---

# 130. Initial Core Tables

The initial schema is expected to contain tables conceptually similar to:

```text
users
roles
user_roles

universities
colleges

courses
academic_years
semesters
subjects
course_subjects

students
student_enrollments

result_import_jobs
result_import_records
result_validation_errors
result_processing_jobs

academic_results
result_attempts

backlogs
backlog_history

audit_logs
```

Additional tables may be introduced where the finalized domain model requires them.

---

# 131. Tables That Should Not Be Added Automatically

Do not automatically create separate tables for:

```text
academic_passport
analytics
dashboard
student_portal
```

because these are primarily read/presentation/derived layers.

A dedicated table should only be introduced when there is a clear architectural reason.

---

# 132. Future Tables

Future capabilities may introduce tables such as:

```text
regulations
grading_rules
credit_rules
calculation_rules
university_connectors
result_release_sources
notifications
subscriptions
invoices
usage_records
```

These are outside the MVP database scope unless requirements change.

---

# 133. Future University Integration

The database should eventually support:

```text
University
     ↓
University Connector
     ↓
Result Release
     ↓
Import / Processing
```

Integration-specific metadata should not contaminate the core academic result model.

---

# 134. Future SaaS Billing

Billing is outside the current academic MVP.

Future billing entities may include:

```text
subscriptions
plans
invoices
payments
usage_records
```

These should be introduced as a separate billing domain.

---

# 135. Future Multi-Campus Support

If the product later supports multiple campuses under one organization, the tenant model may evolve from:

```text
College
```

to:

```text
Organization
   ↓
Campus
   ↓
Academic Data
```

The MVP should not introduce this complexity without a validated requirement.

---

# 136. Important Unresolved Database Decisions

The following require final design decisions before production implementation:

1. Exact ID strategy: `BIGINT` vs UUID.
2. Exact University/College ownership model.
3. Exact student enrollment relationships.
4. Exact semester/academic-year relationships.
5. Exact result release model.
6. Whether `academic_results` and `result_attempts` are separate tables or one normalized result-attempt model.
7. Exact SGPA/CGPA persistence strategy.
8. Exact backlog history model.
9. Flyway vs Liquibase.
10. Exact audit-log structure.
11. File storage strategy for imported files.
12. Exact retention policy.
13. Production backup strategy.
14. Indexes based on finalized API queries.

These decisions should be resolved before final production migrations.

---

# 137. Recommended Physical Database Direction

The physical schema should evolve in this order:

```text
Identity
   ↓
Tenant
   ↓
Academic Structure
   ↓
Students / Enrollment
   ↓
Result Import
   ↓
Validation
   ↓
Result Processing
   ↓
Backlog
   ↓
Calculations
   ↓
Audit
```

This order respects the major dependency relationships.

---

# 138. Database Architecture Summary

Acadlytic will use:

```text
MySQL
  +
InnoDB
  +
Relational Schema
  +
Spring Data JPA
  +
Hibernate
```

The database will provide a strong foundation for:

- multi-tenant colleges
- student management
- academic structure
- university result imports
- result validation
- result processing
- historical result attempts
- backlog tracking
- academic calculations
- Academic Passport
- analytics
- auditing

---

# 139. Final Database Architecture

The final conceptual architecture is:

```text
                         MySQL
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
   Identity             Tenant             Academic
       │                   │                   │
    Users/Roles         Colleges        Courses/Semesters
                                           Subjects
       │
       └───────────────────┬───────────────────┘
                           │
                        Students
                           │
                    Student Enrollment
                           │
                           ↓
                    Result Import
                           │
                           ↓
                    Result Validation
                           │
                           ↓
                    Result Processing
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
        Academic       Backlogs     Calculations
         Results
              │            │            │
              └────────────┼────────────┘
                           ↓
                  Academic Passport
                           ↓
                       Analytics
```

The authoritative academic data remains at the processed-result/backlog/calculation layer, while Academic Passport and Analytics remain derived/read-oriented layers.

---

# 140. Document Status

**Document:** Database Architecture  
**Project:** Acadlytic  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

This document establishes the MySQL database architecture for the Acadlytic MVP.

The next implementation-level database work should convert this architecture into a finalized **ERD + table specification + migration plan**, without changing ownership or business rules silently.