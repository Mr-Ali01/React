# Database Setup

**Document:** `09-development/implementation-notes/database-setup.md`  
**Project:** Acadlytic  
**Phase:** Development — Database Foundation  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Full-Stack Developers, Database Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the implementation foundation for the Acadlytic MySQL database.

It translates the database architecture and database rules into concrete development guidance for:

- local database setup
- schema management
- migration strategy
- naming conventions
- primary keys
- foreign keys
- indexes
- constraints
- tenant isolation
- timestamps
- auditability
- academic data integrity
- transaction boundaries
- development and testing databases

This document establishes the database foundation before implementing feature-specific persistence.

It does not replace individual feature specifications or the complete database schema design.

---

# 2. Database Technology

Acadlytic uses:

| Area | Technology |
|---|---|
| Database | MySQL |
| ORM | Hibernate |
| Persistence | Spring Data JPA |
| Language | Java 21 |
| Framework | Spring Boot |
| Build Tool | Maven |
| Migration Tool | To be finalized |
| Local Development | MySQL / Docker |
| Production | Managed MySQL or equivalent |

The exact MySQL version must be selected and documented before production deployment.

---

# 3. Database Architecture Principle

The database is the persistent storage layer for the Acadlytic modular monolith.

Conceptually:

```text
React Frontend
      ↓
Spring Boot REST API
      ↓
Application / Domain Layer
      ↓
Repository Layer
      ↓
Hibernate / JPA
      ↓
MySQL
```

The frontend must never communicate directly with MySQL.

---

# 4. Database Responsibilities

The database is responsible for:

- persistent storage
- relational integrity
- uniqueness constraints
- foreign-key relationships
- transactional persistence
- historical academic records
- tenant-scoped data
- indexes required for query performance
- timestamps
- status persistence
- audit-related persistence where applicable

The database is not responsible for implementing the complete application business workflow.

Business rules belong in the appropriate backend application/domain layer.

---

# 5. Local Database Setup

A local development database should be created specifically for Acadlytic.

Recommended conceptual configuration:

```text
Database:
acadlytic

Host:
localhost

Port:
3306

Username:
acadlytic_app

Password:
development-only credential
```

The actual development credentials must not be committed to Git.

---

# 6. Docker Development Database

Docker may be used to provide a reproducible local MySQL environment.

Conceptually:

```text
docker-compose.yml
        ↓
MySQL Container
        ↓
acadlytic database
        ↓
Spring Boot
```

The database container should use a persistent development volume.

Example conceptual structure:

```text
docker/
└── mysql/
```

The exact Docker configuration should remain aligned with `project-setup.md`.

---

# 7. Database Environment Separation

Separate database environments must be maintained.

At minimum:

```text
Development
Testing
Preview/Staging
Production
```

Never point local development code at the production database.

Never run destructive development scripts against production.

---

# 8. Database Configuration

Spring Boot database configuration should be environment-specific.

Conceptual configuration:

```text
application.yml
application-dev.yml
application-test.yml
application-prod.yml
```

Example conceptual properties:

```text
spring.datasource.url
spring.datasource.username
spring.datasource.password
spring.jpa.hibernate.ddl-auto
```

Production credentials must be supplied through secure environment configuration.

---

# 9. Schema Management

The database schema must be version-controlled.

Schema changes must not depend on manually modifying production tables.

Preferred lifecycle:

```text
Developer Changes Schema
        ↓
Migration Created
        ↓
Migration Tested
        ↓
Migration Reviewed
        ↓
Migration Applied
        ↓
Application Uses New Schema
```

The migration technology is currently an implementation decision and must be finalized before schema-dependent development progresses significantly.

Candidates may include:

- Flyway
- Liquibase

One migration system should be selected rather than mixing multiple schema migration tools.

---

# 10. Migration Principles

Every schema change should be:

- versioned
- repeatable in a fresh environment
- reviewable
- testable
- reversible where practical
- compatible with the deployment strategy

Avoid manual undocumented schema changes.

---

# 11. Initial Migration

The initial database migration should establish the foundation required by the first application modules.

It should not attempt to implement every future Acadlytic feature immediately.

The schema should grow through controlled migrations.

Initial migration areas may include:

```text
users
colleges
core reference structures
audit/security foundations where required
```

Feature-specific tables should be introduced with their corresponding implementation phase where practical.

---

# 12. Naming Convention

Database naming should use:

```text
snake_case
```

Examples:

```text
college_id
created_at
updated_at
student_identifier
semester_id
result_import_id
```

Avoid:

```text
collegeId
createdAt
StudentIdentifier
```

---

# 13. Table Naming

Table names should normally use plural snake_case nouns.

Examples:

```text
users
colleges
students
courses
semesters
subjects
result_imports
result_records
backlogs
```

The final table inventory must be determined during detailed database design.

---

# 14. Column Naming

Column names should:

- use lowercase
- use snake_case
- describe the stored value
- avoid unnecessary abbreviations

Good:

```text
created_at
updated_at
college_id
university_id
student_identifier
status
```

Avoid:

```text
crt_dt
upd
cid
sid
```

unless the abbreviation is an established domain convention.

---

# 15. Primary Keys

Every persistent entity requiring independent identity should have a primary key.

Conceptually:

```text
id
```

The exact identifier type must be standardized.

Potential options include:

- BIGINT
- UUID

The final project-wide identifier strategy remains an unresolved implementation decision.

The same strategy should be used consistently unless there is a justified exception.

---

# 16. Identifier Requirements

Identifiers should:

- uniquely identify records
- remain stable
- not encode business meaning
- not depend on display names
- not be reused after deletion

Avoid identifiers such as:

```text
student_2026_001
```

unless explicitly required as a separate business identifier.

A student's university registration number may be stored separately from the database primary key.

---

# 17. Business Identifiers

Business identifiers should be stored separately from database identifiers.

For example:

```text
students
├── id
└── student_identifier
```

The `id` identifies the database record.

`student_identifier` represents the university/institutional identifier used for academic matching.

This distinction is important for result imports.

---

# 18. Foreign Keys

Relationships between persistent entities should normally be represented using foreign keys.

Examples:

```text
students.college_id
students.course_id
subjects.semester_id
result_records.student_id
result_records.subject_id
backlogs.student_id
```

Foreign keys provide database-level referential integrity.

---

# 19. Foreign-Key Naming

Foreign keys should follow:

```text
<referenced_entity>_id
```

Examples:

```text
college_id
student_id
course_id
semester_id
subject_id
result_import_id
```

Avoid ambiguous names such as:

```text
ref_id
parent_id
owner
```

unless the relationship is intentionally generic.

---

# 20. Tenant Model

Acadlytic is a multi-tenant application.

The primary tenant boundary for college-scoped data is the college.

Conceptually:

```text
College
   ↓
Tenant Boundary
   ↓
College-Owned Data
```

Examples include:

- students
- academic structures where college-owned
- imports
- academic records
- backlogs
- analytics

The exact ownership of each entity follows `data-ownership.md`.

---

# 21. Tenant Identifier

College-scoped tables should generally provide a reliable path to the owning college.

Where appropriate, this may be represented directly by:

```text
college_id
```

or through a relationship that unambiguously determines the tenant.

The final schema should avoid requiring inefficient or ambiguous tenant resolution.

---

# 22. Tenant Isolation

Tenant isolation must be enforced at multiple layers:

```text
Authentication
      ↓
Authorization
      ↓
Application Tenant Context
      ↓
Repository Query
      ↓
Database Relationship / Constraint
```

A database column alone is not sufficient to guarantee tenant isolation.

The backend must enforce tenant scope on every applicable operation.

---

# 23. Cross-Tenant Access

The database and application design must prevent accidental cross-tenant access.

Example:

```text
College A
 ├── Student A1
 └── Student A2

College B
 ├── Student B1
 └── Student B2
```

A College A user must never receive Student B data.

This must be protected against both:

- UI mistakes
- malicious identifier manipulation

---

# 24. IDOR Protection

The following request must not automatically imply access:

```text
GET /api/v1/students/123
```

The backend must verify:

```text
Authenticated User
      ↓
Role
      ↓
Tenant
      ↓
Student Ownership
      ↓
Permission
```

Database access should therefore be designed to support secure tenant-aware queries.

---

# 25. Unique Constraints

Business uniqueness should be enforced at the database level where appropriate.

Examples:

```text
college.code
user.email
```

For tenant-scoped identifiers, uniqueness may need to include the tenant.

Example conceptual constraint:

```text
(college_id, student_identifier)
```

The exact constraints depend on business rules.

---

# 26. Uniqueness and Result Imports

Result identity requires special care.

A result record may involve:

```text
University
College
Student
Result Release
Subject
Attempt
```

The final uniqueness strategy must prevent accidental duplicate academic records while preserving legitimate attempts.

A result from a supplementary examination must not be treated as a duplicate merely because the student and subject are the same.

---

# 27. Nullability

Columns should be nullable only when the domain genuinely permits missing values.

Avoid making every field nullable.

Example:

```text
name
code
status
created_at
```

should generally have required values when the domain requires them.

Nullable columns should have a documented semantic meaning.

---

# 28. Missing vs Zero

Academic data must distinguish:

```text
NULL / Missing
```

from:

```text
0 / Zero
```

For example:

```text
marks = NULL
```

does not necessarily mean:

```text
marks = 0
```

The application must preserve this distinction.

This is particularly important for:

- marks
- credits
- SGPA
- CGPA
- percentage
- academic metrics

---

# 29. Academic Decimal Precision

Academic numeric fields must use appropriate decimal precision.

Do not use floating-point database types blindly for authoritative academic values.

Potential examples:

```text
DECIMAL(p,s)
```

may be appropriate for:

- SGPA
- CGPA
- percentage
- marks where decimal marks are supported

The exact precision and scale must follow the university/result format requirements.

---

# 30. Status Columns

Status values should be explicit and controlled.

Examples:

```text
ACTIVE
INACTIVE
SUSPENDED
PENDING
VALID
INVALID
WARNING
PROCESSING
COMPLETED
FAILED
CANCELLED
```

The database representation should align with backend enum/domain conventions.

Avoid arbitrary free-text status values.

---

# 31. Enum Strategy

The project must establish a consistent strategy for persisted enums.

Possible approaches:

- VARCHAR string values
- lookup/reference tables

For stable domain statuses, string values may be appropriate.

Avoid storing ordinal numeric enum positions such as:

```text
0
1
2
```

because changing enum ordering can corrupt semantic meaning.

---

# 32. Timestamps

Persistent records should generally include:

```text
created_at
updated_at
```

where applicable.

Timestamps should be handled consistently across the application.

The exact timezone storage strategy must align with the system-wide time model.

---

# 33. UTC Strategy

The system architecture proposes UTC as the source of truth for system timestamps.

Conceptually:

```text
Database
   ↓
UTC
   ↓
Backend
   ↓
User Timezone
   ↓
Frontend Display
```

The final implementation must standardize:

- JDBC timezone behavior
- MySQL timezone behavior
- Java time types
- serialization format
- frontend date conversion

---

# 34. Java Time Types

Backend persistence should prefer modern Java time APIs.

Potential types include:

```text
Instant
LocalDate
LocalDateTime
OffsetDateTime
```

The correct type depends on whether timezone information is semantically relevant.

Do not use legacy date APIs unnecessarily.

---

# 35. Soft Deletion

The MVP should avoid physical deletion of important academic history.

For entities such as:

- colleges
- students
- academic records
- result records
- backlog history

deactivation/status mechanisms should generally be preferred where business rules require historical preservation.

The exact deletion policy must be defined per entity.

---

# 36. Academic History Preservation

Academic records are historical data.

The database must preserve:

- previous attempts
- supplementary attempts
- original result context
- processed result history
- backlog history where applicable

A new result must not silently overwrite the historical record.

---

# 37. Result Attempts

Result data should support multiple legitimate attempts.

Conceptually:

```text
Student
  ↓
Subject
  ├── Attempt 1 → Failed
  ├── Attempt 2 → Passed
  └── Attempt 3 → ...
```

The schema must not model the student-subject relationship as a single immutable result.

---

# 38. Current vs Historical Academic State

The system may need both:

```text
Historical Records
```

and:

```text
Current Academic State
```

These should not be confused.

Historical records preserve what happened.

Current state represents the latest authoritative interpretation.

The exact projection/model strategy follows the Result Processing specification.

---

# 39. Academic Record Ownership

The authoritative academic record is owned by the Result Processing domain.

The database design should support that ownership.

Academic Passport and Analytics should not become independent competing sources of academic truth.

---

# 40. Backlog Data

Backlog information must be consistent with processed academic results.

A backlog should not be independently created without respecting the result-processing workflow.

Conceptually:

```text
Processed Result
      ↓
Academic State
      ↓
Backlog State
```

The exact backlog lifecycle is defined in `backlog-tracking.md`.

---

# 41. Academic Passport Data

Academic Passport is primarily a read-oriented representation.

The database should avoid creating a second independent source of truth simply for Passport display.

Possible implementation approaches include:

- projection queries
- read models
- materialized representations where justified

The final strategy remains an implementation decision.

---

# 42. Analytics Data

Analytics should primarily be derived from authoritative academic data.

Avoid storing duplicated analytics values unless there is a clear performance requirement.

If derived values are persisted, their refresh/update strategy must be explicit.

---

# 43. Indexing Principles

Indexes should support actual query patterns.

Common candidates may include:

```text
college_id
student_identifier
email
course_id
semester_id
subject_id
result_import_id
status
created_at
```

Exact indexes should be based on:

- API queries
- filters
- joins
- sorting
- uniqueness requirements

Do not create indexes for every column automatically.

---

# 44. Composite Indexes

Composite indexes should follow actual query patterns.

For example:

```text
(college_id, status)
```

may support a tenant-scoped status query.

Another possible pattern:

```text
(student_id, semester_id)
```

may support academic history retrieval.

The exact index order must follow query predicates and selectivity.

---

# 45. Index Review

Every important query should be evaluated for:

- expected cardinality
- filtering
- sorting
- joins
- pagination
- index usage

Database performance should be measured rather than guessed.

---

# 46. Foreign-Key Indexes

Foreign-key columns used in joins and filters should be indexed appropriately.

Examples:

```text
college_id
student_id
course_id
semester_id
subject_id
```

The database engine and actual schema must be considered when determining whether an explicit index is required.

---

# 47. Pagination Support

Large tables must support efficient pagination.

Likely candidates:

- students
- result records
- imports
- validation records
- backlogs
- audit records

The schema should support the backend pagination strategy.

For large datasets, cursor/keyset pagination may eventually be considered.

---

# 48. Search Fields

Frequently searched fields should be indexed when justified.

Potential examples:

```text
student_identifier
email
college_code
course_code
subject_code
```

Do not assume that an index automatically makes arbitrary text search efficient.

---

# 49. Database Transactions

Transactions should protect business operations that must succeed or fail atomically.

Examples:

```text
Result Processing
Student Creation with required relationships
College Creation with required setup
Account Provisioning
Backlog State Updates
```

The transaction boundary should normally align with the application service/domain operation.

---

# 50. Result Processing Transaction

Result processing is particularly sensitive.

Conceptually:

```text
Validate Processing Eligibility
        ↓
Persist Result
        ↓
Update Academic State
        ↓
Update Backlog State
        ↓
Update Required Derived State
        ↓
Audit
        ↓
Commit
```

If the operation fails in a way that requires rollback, the transaction must preserve a consistent academic state.

---

# 51. Long-Running Jobs

Large result imports and processing jobs should not hold one database transaction open for an unnecessarily long time.

Instead:

```text
Job
 ↓
Batch / Controlled Processing
 ↓
Transaction per appropriate unit
```

The exact batching strategy should be determined during result-import/result-processing implementation.

---

# 52. Idempotency

Retryable operations must be designed to avoid duplicate effects.

This is especially important for:

- result processing
- import processing
- account provisioning
- background jobs

Database constraints should support application-level idempotency.

---

# 53. Optimistic Concurrency

Where multiple users may update the same entity, optimistic locking may be appropriate.

A version field may be considered:

```text
version
```

Potential candidates:

- college settings
- student records
- configuration records

The exact use of optimistic locking remains implementation-specific.

---

# 54. JPA Entity Design

JPA entities should represent persistence concerns without becoming the application's API contract.

Avoid returning JPA entities directly from REST controllers.

Preferred flow:

```text
Entity
 ↓
Service
 ↓
Mapper
 ↓
DTO
 ↓
Controller
 ↓
JSON
```

---

# 55. Entity Relationships

JPA relationships should be defined carefully.

Avoid blindly using:

```text
EAGER
```

for relationships.

Prefer controlled fetching according to use cases.

Large academic relationships can easily cause:

- N+1 queries
- excessive memory usage
- slow API responses

---

# 56. Lazy Loading

Collections should generally use lazy loading unless there is a justified reason otherwise.

Example conceptual relationships:

```text
College
 └── students

Student
 └── academic records

Course
 └── subjects
```

The application should explicitly fetch the data required for each use case.

---

# 57. N+1 Query Prevention

Common problematic pattern:

```text
Load 100 students
       ↓
Load course separately for each student
       ↓
101 queries
```

Prefer:

- fetch joins
- entity graphs
- optimized projections
- batch fetching
- purpose-built queries

depending on the use case.

---

# 58. DTO Projections

Read-heavy screens may use projections rather than loading full entities.

Potential candidates:

- dashboards
- analytics
- student lists
- result summaries
- academic Passport views

This can reduce unnecessary data loading.

---

# 59. Database Constraints vs Application Rules

Use database constraints for:

- primary keys
- foreign keys
- uniqueness
- required values
- basic relational integrity

Use application/domain logic for:

- academic workflows
- role permissions
- result processing rules
- backlog transitions
- complex eligibility rules
- tenant authorization

Both layers should work together.

---

# 60. Auditability

Important administrative and academic operations should be traceable.

Potential audit information:

```text
actor
action
entity
entity_id
timestamp
result/status
request/correlation identifier where appropriate
```

The exact audit table and event strategy remains an implementation decision.

---

# 61. Sensitive Data

The database must avoid storing unnecessary sensitive information.

Examples of data requiring careful handling:

- passwords
- authentication credentials
- security tokens
- student personal information
- academic records

Passwords must never be stored in plaintext.

---

# 62. Password Storage

Passwords must be stored only as secure password hashes using the backend security implementation.

Never store:

```text
plain_password
```

Never log passwords.

Never expose password hashes through API responses.

---

# 63. Database Credentials

Database credentials must not be committed to source control.

Use:

- environment variables
- deployment secrets
- secret management systems

depending on environment.

---

# 64. Seed Data

Development seed data may be provided for:

- roles
- development users
- sample colleges
- sample academic structures
- test students

Seed data must be clearly identified as development/test data.

Production seed behavior must be controlled.

---

# 65. Reference Data

Reference/master data may include:

- roles
- statuses where modeled as reference data
- universities
- academic configuration

The project should distinguish between:

```text
Reference Data
```

and:

```text
Tenant-Owned Operational Data
```

The exact university/master-data model remains subject to detailed database design.

---

# 66. University Data

The platform is initially intended for university-affiliated colleges.

A college should be associated with a university where required.

Conceptually:

```text
University
   ↓
College
   ↓
Academic Structure
   ↓
Students
```

The final `universities` schema is not fully defined by this document and must be designed before implementing university-specific master data.

---

# 67. Academic Structure Relationships

The academic structure should support relationships such as:

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

The exact ownership and relationships must follow `academic-structure.md`.

---

# 68. Database Setup Verification

After local setup, verify:

```text
□ MySQL is running
□ acadlytic database exists
□ Application credentials work
□ Spring Boot connects successfully
□ Migration mechanism works
□ Initial schema can be created
□ Application starts with a clean database
□ Application can restart without schema corruption
□ Test database can be recreated
```

---

# 69. Clean Database Test

The project should periodically verify that the application can initialize from an empty database.

Conceptually:

```text
Empty Database
      ↓
Run Migrations
      ↓
Start Application
      ↓
Run Tests
      ↓
Success
```

This prevents undocumented manual schema changes from becoming hidden dependencies.

---

# 70. Migration Testing

Every migration should be tested against:

### Fresh Database

```text
No existing schema
```

### Existing Database

```text
Previous version
↓
New migration
```

### Application Compatibility

```text
New schema
↓
Current application
```

---

# 71. Backup Strategy

Production database backups must be configured before production release.

The final production strategy must define:

- backup frequency
- retention
- encryption
- recovery procedure
- restoration testing
- recovery point objective
- recovery time objective

These belong to the production deployment/operations documentation but must be considered during database design.

---

# 72. Database Monitoring

Production database monitoring should eventually cover:

- CPU
- memory
- storage
- connections
- slow queries
- lock contention
- replication/availability where applicable
- failed queries
- backup status

Exact tooling remains a deployment decision.

---

# 73. Slow Query Monitoring

Slow queries should be identified before they become production incidents.

Important query categories include:

- student search
- result history
- import records
- validation records
- backlog analytics
- dashboards
- academic Passport
- analytics

---

# 74. Development Workflow

For every database change:

```text
1. Identify feature requirement
2. Review data ownership
3. Design required schema change
4. Review relationships
5. Define constraints
6. Define indexes
7. Create migration
8. Update JPA model if required
9. Update repositories/services
10. Test migration
11. Test application
12. Review query performance
13. Commit migration and code together
```

---

# 75. Database Change Rules

Do not:

- manually change shared development schema without documenting it
- modify production schema directly
- remove columns without migration planning
- rename columns without considering deployed application versions
- drop academic history casually
- bypass foreign-key integrity
- use `SELECT *` for performance-sensitive queries
- create unnecessary duplicate tables

---

# 76. Destructive Migrations

Destructive changes require additional review.

Examples:

- dropping a column
- dropping a table
- changing data type
- changing nullable to non-null
- changing identifier strategy

Prefer staged migration where necessary.

Example:

```text
Add New Column
      ↓
Backfill Data
      ↓
Deploy Application
      ↓
Verify
      ↓
Remove Old Column Later
```

---

# 77. Backward Compatibility

During deployments, the database and application may temporarily operate across versions.

Schema changes should consider:

```text
Old Application
      ↕
Transition Schema
      ↕
New Application
```

This is particularly important for production zero/low-downtime deployments.

---

# 78. Testing Database

Automated tests should have an isolated database environment.

The testing database must not use production data.

Tests should be able to:

- create required schema
- insert controlled test data
- run repository tests
- run transaction tests
- clean/reset state

The final testing infrastructure remains an implementation decision.

---

# 79. Test Data Integrity

Test data should include academic edge cases.

Examples:

```text
Student with no results
Student with one semester
Student with multiple attempts
Student with cleared backlog
Student with active backlog
Student with supplementary attempt
Student with missing marks
Student with zero marks
Student with multiple semesters
Multiple colleges
Same student identifier across different colleges
```

These cases are important for validating tenant isolation and academic correctness.

---

# 80. Multi-Tenant Test Cases

Database tests must verify:

```text
College A user
    ↓
College A data → Allowed

College A user
    ↓
College B data → Denied
```

Test both:

- normal requests
- manipulated identifiers

---

# 81. Database Performance Baseline

Before production deployment, establish a baseline for important operations:

- student list
- student detail
- result history
- import record list
- validation summary
- backlog list
- Academic Passport
- dashboard analytics

The baseline should be measured using realistic data volumes where possible.

---

# 82. Large Dataset Consideration

Acadlytic may eventually contain:

```text
Thousands of students per college
+
Multiple semesters
+
Multiple subjects
+
Multiple result attempts
+
Large import files
```

Database design must therefore avoid assuming that MVP test data volume represents production scale.

---

# 83. Result Import Database Considerations

Result imports can create large temporary/processing datasets.

The design should distinguish conceptually between:

```text
Import Job
```

and:

```text
Imported Records
```

An import job should track:

- source information
- status
- timestamps
- summary counts
- errors where applicable

Imported records should remain traceable to their import.

---

# 84. Validation Database Considerations

Validation results should remain associated with the relevant import.

Conceptually:

```text
Result Import
   ↓
Imported Record
   ↓
Validation Result
```

This allows users to review why a record could not be processed.

---

# 85. Processing Database Considerations

Processing must create authoritative academic state without destroying source history.

Conceptually:

```text
Imported Data
      ↓
Validated Data
      ↓
Processed Result
      ↓
Academic State
```

Each stage must remain traceable.

---

# 86. Database Ownership Rule

Every important table/entity must have a clear owning module.

Example:

```text
users              → Authentication / Users
colleges            → College Management
students            → Student Management
courses             → Academic Structure
semesters           → Academic Structure
subjects            → Academic Structure
result_imports      → Result Import
validation_records  → Result Validation
academic_results    → Result Processing
backlogs            → Backlog Tracking
```

The final table names may differ, but ownership must remain explicit.

---

# 87. Cross-Module Database Access

Modules should avoid directly modifying another module's owned data.

Prefer:

```text
Module A
 ↓
Application Service / Domain Operation
 ↓
Module B
```

rather than:

```text
Module A
 ↓
Direct SQL Update
 ↓
Module B Owned Table
```

This protects ownership boundaries.

---

# 88. Repository Rules

Repositories should:

- contain persistence access
- provide purposeful queries
- support tenant-aware access where required
- avoid embedding business workflows
- avoid exposing persistence details outside appropriate layers

Avoid generic repositories that expose unrestricted database operations to every module.

---

# 89. Query Design

Queries should retrieve only the data required.

Prefer:

```text
SELECT required_columns
```

over:

```text
SELECT *
```

especially for:

- large tables
- analytics
- dashboards
- list endpoints
- imports

---

# 90. Bulk Operations

Bulk inserts/updates may be required for result imports.

Bulk operations must be implemented carefully to avoid:

- excessive memory usage
- persistence-context overload
- long-running transactions
- locking problems

Batch size and transaction strategy should be established during result-import implementation.

---

# 91. Persistence Context

Hibernate persistence context size must be considered for large imports.

Do not load thousands of academic records into one persistence context unnecessarily.

Possible strategies include:

- batching
- flushing
- clearing
- controlled transaction boundaries

The exact strategy belongs to the Result Processing implementation.

---

# 92. Database Security Checklist

Before implementation is considered complete:

```text
□ Production credentials are secret-managed
□ No passwords are stored in plaintext
□ Sensitive fields are protected
□ Database is not publicly exposed unnecessarily
□ Application user has only required privileges
□ Production database is separated from development
□ Backups are configured
□ Backup restoration is tested
□ Database connections use secure configuration
□ Tenant isolation is tested
□ Audit requirements are satisfied
```

---

# 93. AI-Assisted Database Development Rules

AI must not:

- invent schema without reviewing data ownership
- create duplicate sources of truth
- remove historical academic records
- add arbitrary columns
- use destructive migrations casually
- invent university-specific result structures
- ignore tenant isolation
- create unbounded relationships
- introduce `EAGER` relationships without justification
- use `SELECT *` in important queries
- store passwords in plaintext
- expose credentials
- bypass migrations
- directly modify production databases

Before creating a table, AI should answer:

```text
1. Which module owns this data?
2. Is this data already represented elsewhere?
3. What is the primary identifier?
4. What is the tenant boundary?
5. What relationships exist?
6. What uniqueness rules apply?
7. What historical data must be preserved?
8. What queries will access this data?
9. What indexes are required?
10. What migration is required?
```

---

# 94. Database Implementation Sequence

The recommended database implementation sequence is:

```text
1. Select migration technology
2. Create local MySQL environment
3. Configure Spring Boot datasource
4. Create migration baseline
5. Implement users/authentication tables
6. Implement colleges
7. Implement academic structure
8. Implement students
9. Implement result import persistence
10. Implement validation persistence
11. Implement processed academic results
12. Implement backlog persistence
13. Implement Passport read model/projections
14. Implement analytics queries/read models
15. Optimize indexes
16. Add audit persistence where required
17. Validate tenant isolation
18. Test large-data behavior
```

---

# 95. Initial Database Acceptance Criteria

The database foundation is acceptable when:

### Environment

- [ ] MySQL runs locally.
- [ ] Acadlytic database can be created.
- [ ] Development configuration works.
- [ ] Test database can be isolated.
- [ ] Docker setup works if Docker is used.

### Schema

- [ ] Migration strategy is selected.
- [ ] Initial migration executes successfully.
- [ ] Schema can be created from an empty database.
- [ ] Schema changes are version-controlled.

### JPA

- [ ] Spring Boot connects to MySQL.
- [ ] Hibernate/JPA configuration is working.
- [ ] Entity mappings follow project rules.
- [ ] DTOs are used at API boundaries.

### Integrity

- [ ] Primary keys are defined.
- [ ] Foreign keys are defined.
- [ ] Required uniqueness constraints are defined.
- [ ] Tenant boundaries are supported.
- [ ] Academic history can be preserved.

### Performance

- [ ] Important foreign keys are indexed appropriately.
- [ ] Important query patterns have appropriate indexes.
- [ ] No obvious N+1 query exists in the foundation.

### Security

- [ ] Credentials are not committed.
- [ ] Production database is isolated.
- [ ] Sensitive information is protected.
- [ ] Tenant isolation strategy is testable.

---

# 96. Definition of Done

`database-setup.md` is considered implemented when:

1. Local MySQL is operational.
2. Spring Boot successfully connects to MySQL.
3. Migration technology has been selected.
4. Database migrations are version-controlled.
5. Empty-database initialization succeeds.
6. Development and test databases are separated.
7. Database naming conventions are established.
8. Primary/foreign key conventions are established.
9. Tenant isolation is represented in the schema design.
10. Academic history preservation is supported.
11. Initial indexes and constraints are reviewed.
12. JPA persistence foundation is operational.
13. Database tests can execute.
14. No production credentials are committed.
15. The database foundation follows project architecture and ownership rules.

---

# 97. Unresolved Implementation Decisions

The following decisions remain open until formally reviewed:

- exact MySQL version
- Flyway vs Liquibase
- BIGINT vs UUID identifier strategy
- final university/master-data schema
- final audit table/event strategy
- exact soft-delete strategy per entity
- exact UTC/timezone persistence configuration
- final result-record schema
- final academic-result history model
- final Passport read-model strategy
- final analytics persistence strategy
- database backup provider
- production database hosting
- database connection pool configuration
- read replica strategy for future scale
- partitioning strategy if eventually required

These decisions must be recorded when finalized.

---

# 98. Relationship With Other Documents

This document depends on:

```text
04-tech-stack/database.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/data-ownership.md
05-architecture/api-architecture.md

07-project-rules/database-rules.md
07-project-rules/backend-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
09-development/implementation-notes/frontend-foundation.md
```

It supports:

```text
09-development/implementation-notes/authentication-implementation.md
09-development/implementation-notes/college-management-implementation.md
09-development/implementation-notes/academic-structure-implementation.md
09-development/implementation-notes/student-management-implementation.md
09-development/implementation-notes/result-import-implementation.md
09-development/implementation-notes/result-validation-implementation.md
09-development/implementation-notes/result-processing-implementation.md
09-development/implementation-notes/backlog-implementation.md
09-development/implementation-notes/academic-passport-implementation.md
09-development/implementation-notes/analytics-implementation.md
09-development/implementation-notes/student-portal-implementation.md
```

---

# 99. Status

**Draft / Under Review**

This document establishes the database implementation foundation for Acadlytic.

It must move through:

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

No feature-specific database implementation should silently contradict this document.

---

# 100. Final Database Principle

The Acadlytic database should be:

> **Relational, tenant-aware, historically accurate, constraint-driven, migration-controlled, performance-conscious, and designed around clear ownership of academic data.**

Most importantly:

> **Academic history must be preserved, tenant boundaries must be enforceable, and there must be one authoritative source of truth for processed academic results.**