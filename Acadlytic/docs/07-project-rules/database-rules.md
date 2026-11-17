# Database Rules

**Project:** Acadlytic  
**Document:** Database Development Rules  
**Path:** `07-project-rules/database-rules.md`  
**Status:** Draft / Under Review  
**Applies To:** MySQL schema, tables, relationships, indexes, constraints, migrations, JPA/Hibernate persistence, queries, transactions, data integrity, and database security

---

# 1. Purpose

This document defines the rules for designing, implementing, modifying, querying, and maintaining the Acadlytic database.

The database must provide:

- data integrity
- tenant isolation
- historical academic preservation
- predictable relationships
- efficient querying
- controlled schema evolution
- transactional consistency
- auditability
- maintainability
- security

The database is a persistence layer. It must not become an uncontrolled location for business logic that belongs in the application/domain layer.

---

# 2. Database Technology Baseline

The initial database baseline is:

| Area | Technology |
|---|---|
| Database | MySQL |
| ORM | Hibernate |
| Persistence | Spring Data JPA |
| Database access | JPA / JPQL / native SQL where justified |
| Migration | Version-controlled migration tool |
| Charset | UTF-8 compatible configuration |
| Storage engine | InnoDB |
| Environment | Development / Test / Production |

The exact production MySQL version must be finalized during infrastructure setup.

---

# 3. Database Architecture Principles

The database must follow these principles:

```text
Data Ownership
      ↓
Clear Relationships
      ↓
Integrity Constraints
      ↓
Efficient Queries
      ↓
Controlled Transactions
      ↓
Auditable Changes
```

Primary principles:

1. One authoritative owner for each important data concept.
2. No unnecessary duplication.
3. Preserve historical academic data.
4. Enforce critical integrity at the database level.
5. Keep tenant boundaries explicit.
6. Design indexes around actual query patterns.
7. Avoid premature optimization.
8. Never use the database as a substitute for domain architecture.

---

# 4. Database Ownership

Database ownership follows `data-ownership.md`.

Conceptually:

| Data | Owner |
|---|---|
| College | College Management |
| User identity | Authentication / Users |
| Student | Student Management |
| Course | Academic Structure |
| Semester | Academic Structure |
| Subject | Academic Structure |
| Result Import Job | Result Import |
| Imported Result Record | Result Import |
| Validation State | Result Validation |
| Processed Result | Result Processing |
| Result Attempt | Result Processing |
| Backlog | Backlog Tracking |
| Academic Passport | Passport read model |
| Analytics | Derived/read layer |

Ownership must remain clear even when multiple modules depend on the same data.

---

# 5. Database Does Not Equal Module

A module and a database table are not necessarily one-to-one.

One module may own multiple tables.

Example:

```text
Result Processing
├── results
├── result_attempts
├── academic_summaries
└── processing_metadata
```

Likewise, a conceptual feature does not automatically require its own table.

Do not create tables merely because a class or UI component exists.

---

# 6. Naming Convention

Use consistent snake_case for database identifiers.

### Tables

```text
students
colleges
courses
semesters
subjects
result_imports
result_records
backlogs
```

### Columns

```text
student_id
college_id
created_at
updated_at
student_identifier
```

Avoid:

```text
Student
studentId
CreatedAt
```

---

# 7. Table Naming

Table names should generally be:

- lowercase
- plural
- descriptive
- consistent

Preferred:

```text
students
colleges
users
subjects
result_imports
```

Avoid unnecessary abbreviations.

Bad:

```text
std
clg
usr_dt
res_imp
```

unless a documented legacy constraint requires them.

---

# 8. Primary Keys

Every major persistent entity should have a primary key.

Example:

```text
id
```

The exact ID strategy must be finalized during database architecture.

Possible strategies may include:

- UUID
- numeric generated IDs
- another approved identifier strategy

Do not mix ID strategies without an explicit architectural reason.

---

# 9. Foreign Keys

Relationships between persistent entities should be represented using foreign keys where appropriate.

Example:

```text
students.college_id
        ↓
colleges.id
```

Foreign keys help prevent orphaned records and invalid references.

Do not rely exclusively on application code for critical referential integrity.

---

# 10. Foreign Key Naming

Use:

```text
<entity>_id
```

Examples:

```text
college_id
student_id
course_id
semester_id
subject_id
import_id
```

The name should clearly identify the referenced entity.

---

# 11. Tenant Boundary

Acadlytic is a multi-tenant system.

The college is the primary tenant boundary for college-owned academic data.

Typical tenant-aware tables should contain a college relationship directly or through a well-defined ownership chain.

Example:

```text
colleges
   ↓
students
   ↓
results
```

The exact design may vary when a parent relationship already provides unambiguous tenant ownership.

---

# 12. Tenant Isolation

Tenant isolation must be enforced at the application layer and supported by database design.

Every tenant-sensitive query must be capable of restricting data to the authorized college.

Example:

```sql
SELECT *
FROM students
WHERE id = ?
  AND college_id = ?;
```

Do not rely on the frontend to provide correct tenant IDs.

---

# 13. Cross-Tenant Data

Cross-tenant access must be explicit.

A user from College A must never accidentally retrieve:

```text
College B students
College B results
College B backlogs
College B analytics
```

This must be tested at repository/service/API levels.

---

# 14. Required Columns

Most persistent business tables should consider:

```text
id
created_at
updated_at
```

Additional lifecycle columns may include:

```text
status
created_by
updated_by
```

Only add columns when they have a defined purpose.

Do not add generic metadata columns to every table automatically.

---

# 15. Timestamp Rules

Use consistent timestamp semantics.

Common fields:

```text
created_at
updated_at
```

For important domain events, more explicit timestamps may be required:

```text
processed_at
published_at
cleared_at
uploaded_at
```

The application must consistently handle timezone semantics.

---

# 16. Date vs Timestamp

Use the appropriate database type.

Use a date when only a calendar date matters:

```text
date_of_birth
academic_year_start
```

Use a timestamp when the exact point in time matters:

```text
created_at
processed_at
uploaded_at
```

Do not store timestamps as arbitrary strings.

---

# 17. Boolean Fields

Boolean-like fields should have clear semantics.

Preferred conceptual names:

```text
is_active
is_verified
is_locked
```

However, lifecycle states should generally use explicit status fields when more than two states exist.

---

# 18. Status Fields

Use controlled status values for domain state.

Examples:

```text
ACTIVE
INACTIVE
SUSPENDED
```

or:

```text
UPLOADED
PARSING
VALIDATING
READY_FOR_REVIEW
PROCESSING
COMPLETED
FAILED
```

The application should use enums or equivalent controlled representations.

---

# 19. Status Transition Integrity

The database should store state, but the application/domain layer should control state transitions.

Do not allow arbitrary controller-driven updates such as:

```text
status = "COMPLETED"
```

without verifying that the transition is valid.

---

# 20. Nullability

Columns should be nullable only when the domain permits absence.

Prefer:

```text
NOT NULL
```

when a value is mandatory.

Do not make every column nullable simply to simplify inserts.

Nullable fields should have a clear semantic meaning.

---

# 21. Missing Value vs Zero

Academic data must distinguish between:

```text
missing
```

and:

```text
0
```

For example:

```text
marks = NULL
```

may mean unavailable/missing.

Whereas:

```text
marks = 0
```

means an actual zero value.

Do not convert missing academic data to zero automatically.

---

# 22. String Columns

String lengths must be chosen based on actual requirements.

Avoid:

```text
VARCHAR(255)
```

for every field without consideration.

Examples:

```text
code
identifier
name
email
address
```

may require different lengths.

---

# 23. Text Columns

Use larger text types only where necessary.

Examples may include:

- notes
- descriptions
- error details
- audit metadata

Do not use large text fields for values that should have structured columns.

---

# 24. Numeric Types

Choose numeric types based on domain precision.

Academic values such as:

```text
marks
credits
SGPA
CGPA
percentage
```

must use types that avoid inappropriate floating-point precision.

The exact precision/scale must be finalized based on university requirements.

Do not blindly use `FLOAT` for every academic decimal.

---

# 25. Academic Calculation Storage

Calculated academic values must have clear ownership.

For example:

```text
SGPA
CGPA
percentage
```

should not be independently recalculated and stored in multiple unrelated tables.

The authoritative calculation/storage strategy must be defined by the academic/result architecture.

---

# 26. Result History

Academic result history must be preserved.

Do not design the database around only:

```text
student + subject + latest_marks
```

when students may have:

- regular attempts
- supplementary attempts
- repeated attempts
- improved results
- corrected results

The schema must support historical attempts where required.

---

# 27. Result Attempts

A result attempt should be distinguishable from another attempt.

Conceptual identity:

```text
Student
+
Subject
+
Attempt
+
Result Release
```

The final uniqueness rule must follow the result-processing specification.

---

# 28. Duplicate Protection

Where duplicate records are not allowed, enforce uniqueness using database constraints where practical.

Application checks alone are insufficient because concurrent requests can bypass them.

Example conceptual constraint:

```text
UNIQUE(
    student_id,
    subject_id,
    attempt
)
```

The exact composite key must follow the domain model.

---

# 29. Import Identity

Result imports should have stable identifiers.

An import may contain:

```text
college
source
result release
file metadata
status
timestamps
```

Each imported record should be traceable to its import/job where required.

---

# 30. Source Traceability

Academic data originating from imports should retain source context where required.

Conceptually:

```text
result
   ↓
result_import
   ↓
source file / release context
```

This supports:

- auditing
- debugging
- reprocessing
- correction
- provenance

---

# 31. Raw vs Processed Data

The database design must distinguish between:

```text
Imported/raw representation
```

and:

```text
Authoritative processed academic state
```

Do not treat an uploaded spreadsheet row as automatically equivalent to an official processed academic record.

---

# 32. Validation Data

Validation errors should be associated with the relevant import/record.

Potential information:

```text
import_id
record_id
error_code
message
severity
field
created_at
```

The exact schema should follow the result validation implementation.

---

# 33. Validation Does Not Mutate Academic State

Validation tables/data must not directly become authoritative academic records.

The conceptual boundary is:

```text
Imported Data
      ↓
Validation
      ↓
Processing
      ↓
Authoritative Academic Data
```

---

# 34. Backlog Data

Backlog records must have enough information to identify the academic requirement involved.

Conceptually:

```text
student
subject
semester/context
status
attempt information
```

Do not model backlog as only:

```text
student_id + subject_name
```

if the academic context matters.

---

# 35. Backlog History

The system should preserve sufficient history to determine how a backlog changed.

For example:

```text
OPEN
 ↓
CLEARED
```

The exact history strategy may use:

- state columns
- attempt records
- audit records
- dedicated history tables

The final approach must be determined by the database/domain design.

---

# 36. Academic Passport

The Academic Passport is read-oriented.

If a materialized/read-model table is used, it must not become an independent authoritative source.

Conceptually:

```text
Authoritative Academic Tables
          ↓
Passport Projection
```

The projection must be refreshable/rebuildable from authoritative data where the architecture requires it.

---

# 37. Analytics Data

Analytics data is derived.

Do not manually edit analytics values as though they were authoritative academic records.

If summary tables/materialized views are used, they must have a defined refresh/update mechanism.

---

# 38. Relationship Design

Relationships should represent actual domain relationships.

Common examples:

```text
College
  └── Students

Course
  └── Semesters

Semester
  └── Subjects

Student
  └── Results

Student
  └── Backlogs
```

Do not create artificial relationships merely to simplify a query.

---

# 39. One-to-Many Relationships

One-to-many relationships should use foreign keys.

Example:

```text
colleges
   1
   |
   N
students
```

The many-side normally owns the foreign key.

---

# 40. Many-to-Many Relationships

Many-to-many relationships should generally use an explicit junction table.

Example:

```text
students
    |
student_courses
    |
courses
```

Do not hide complex many-to-many business semantics inside an ORM annotation without understanding the resulting schema.

---

# 41. Unique Constraints

Use unique constraints for domain requirements that truly require uniqueness.

Examples:

```text
college.code
```

or context-specific identifiers.

Do not make names globally unique unless the product requirement requires it.

Two colleges may have the same name if their codes distinguish them.

---

# 42. Index Rules

Indexes must support actual query patterns.

Potential indexed columns:

```text
college_id
student_id
student_identifier
course_id
semester_id
subject_id
status
import_id
created_at
```

Exact indexes must be derived from:

- APIs
- filters
- joins
- sorting
- reporting
- measured performance

---

# 43. Composite Indexes

Composite indexes should follow actual query predicates.

For example:

```sql
INDEX(college_id, status)
```

may support queries filtering by both tenant and status.

Do not create every possible column combination.

---

# 44. Index Column Order

The order of composite-index columns matters.

Choose ordering based on:

- equality filters
- range filters
- sorting
- query frequency
- cardinality

Index design should be validated against actual query plans.

---

# 45. Foreign Key Indexes

Foreign key columns should be indexed where required for:

- joins
- lookup
- deletes/updates
- tenant filtering

The exact index strategy must be reviewed with the final schema.

---

# 46. Query Rules

Queries should retrieve only the data required.

Avoid:

```sql
SELECT *
```

for performance-sensitive or large queries.

Prefer explicit projections when appropriate.

---

# 47. Pagination at Database Level

Pagination must be applied at the database/query layer.

Do not:

```text
load 100,000 rows
↓
filter in Java
↓
return 20
```

Instead:

```text
database
↓
return required page
↓
application
```

---

# 48. Search Queries

Search queries must be designed for the actual database capabilities.

Avoid expensive wildcard queries on large tables without considering indexes and query plans.

For example:

```text
%keyword%
```

can be expensive on large datasets.

Use an appropriate search strategy if the product later requires advanced search.

---

# 49. Sorting

Only approved sortable fields should be exposed.

Never concatenate arbitrary client-provided column names into SQL.

Use an allowlist or mapped sort specification.

---

# 50. Soft Deletion

Soft deletion may be used where historical preservation requires it.

However, do not add:

```text
deleted_at
```

to every table automatically.

Use lifecycle state only when the domain requires it.

For colleges and important academic data, deactivation/suspension is generally preferred over physical deletion.

---

# 51. Physical Deletion

Physical deletion must be treated cautiously.

Before deleting any record, determine:

- whether it is referenced
- whether history must be preserved
- whether audit records depend on it
- whether the deletion is reversible
- whether legal/business requirements apply

Academic history should generally not be physically deleted as a routine operation.

---

# 52. Cascading Deletes

Database cascades must be used deliberately.

Do not configure cascading deletes simply because JPA makes them convenient.

Dangerous example:

```text
Delete College
    ↓
Delete Students
    ↓
Delete Results
    ↓
Delete Backlogs
```

This could destroy critical historical data.

---

# 53. JPA Cascade Rules

JPA cascade behavior must reflect domain ownership.

Use cascading only when the lifecycle of the child is genuinely owned by the parent.

Do not use:

```text
CascadeType.ALL
```

everywhere.

---

# 54. Lazy Loading

Relationships should generally be lazy unless eager loading is explicitly justified.

Lazy loading helps avoid unnecessarily loading large academic graphs.

However, lazy loading must be handled within appropriate transaction boundaries.

---

# 55. Entity Serialization

JPA entities must not be directly serialized into API responses.

This can cause:

- recursive serialization
- lazy-loading problems
- excessive database queries
- accidental data exposure

Use DTOs.

---

# 56. N+1 Query Prevention

Database design and JPA usage must actively prevent N+1 queries.

Use:

- projections
- fetch joins
- entity graphs
- dedicated queries
- batch fetching where justified

Do not change everything to `EAGER` as a shortcut.

---

# 57. Transactions and Database Consistency

Transactions should protect operations that must succeed or fail together.

Example:

```text
Process Result
      ↓
Insert/Update Result
      ↓
Update Backlog
      ↓
Update Academic Summary
```

If the domain requires atomicity, these changes must be transactionally coordinated.

---

# 58. Long-Running Transactions

Do not keep a database transaction open while:

- reading a large uploaded file
- waiting for external APIs
- performing slow network operations
- processing thousands of records unnecessarily

Break large workflows into appropriate batches/jobs.

---

# 59. Bulk Processing

Large result imports should use batching.

Potential strategies:

```text
read chunk
 ↓
validate chunk
 ↓
process chunk
 ↓
commit
 ↓
next chunk
```

The exact transaction model must balance:

- consistency
- retryability
- performance
- failure recovery

---

# 60. Batch Size

Batch size should be configurable or carefully chosen based on:

- record size
- database capacity
- memory
- transaction duration
- expected import volume

Do not assume one batch size works for all environments.

---

# 61. Concurrency

Database design must account for concurrent updates.

Potentially competing operations include:

- result processing
- duplicate imports
- backlog clearance
- account status changes
- student updates

Use appropriate:

- unique constraints
- optimistic locking
- state checks
- transactions
- locking only when justified

---

# 62. Optimistic Locking

Optimistic locking may be used for records where concurrent modifications are possible.

For example:

```text
version
```

can detect conflicting updates.

Use it where the domain benefits from conflict detection.

Do not add it to every table without justification.

---

# 63. Pessimistic Locking

Pessimistic locks should be used only when necessary.

They can cause:

- blocking
- deadlocks
- reduced throughput

If used, the locking strategy must be documented and tested.

---

# 64. Deadlock Prevention

Database operations should follow consistent ordering where possible.

Avoid unnecessary:

- long transactions
- multiple competing locks
- inconsistent update order

Production deadlocks should be investigated rather than hidden with unlimited retries.

---

# 65. Database Migrations

Every schema change must be version-controlled.

Examples:

```text
V1__initial_schema.sql
V2__add_student_identifier.sql
V3__create_result_imports.sql
```

The exact migration naming convention depends on the selected migration tool.

---

# 66. No Manual Production Schema Changes

Do not directly edit production tables as a normal development workflow.

Schema changes must go through migration files.

Emergency database intervention must be documented and reconciled into version-controlled migrations afterward.

---

# 67. Migration Rules

Each migration should:

- have one clear purpose
- be reviewable
- be tested
- avoid unnecessary destructive operations
- preserve existing data where required
- consider rollback/recovery
- account for production data volume

---

# 68. Destructive Migrations

Operations such as:

```text
DROP COLUMN
DROP TABLE
DELETE DATA
```

require explicit review.

Before a destructive migration:

1. identify affected data
2. verify dependencies
3. back up where appropriate
4. confirm migration behavior
5. test against realistic data
6. document the change

---

# 69. Backward Compatibility

When possible, schema changes should support rolling deployments.

For example:

```text
Add new column
      ↓
Deploy code that can use it
      ↓
Migrate existing data
      ↓
Remove old column later
```

Avoid making code and schema incompatible during deployment.

---

# 70. Seed Data

Seed data should be clearly separated from production business data.

Potential seed data:

```text
roles
system permissions
development reference data
```

Do not insert fake production students/results into production environments.

---

# 71. Reference Data

Reference/master data should have defined ownership.

Examples may include:

```text
universities
courses
subjects
academic regulations
```

The final master-data model must be aligned with the Academic Structure architecture.

---

# 72. University Data

The product initially focuses on university-affiliated colleges.

University-related entities should be modeled so that multiple colleges can reference the same university.

Do not duplicate university details inside every college record when a master reference is appropriate.

---

# 73. Academic Structure Integrity

Academic relationships must be validated.

Examples:

```text
Subject → valid course
Subject → valid semester
Semester → valid course
Student → valid course
Result → valid student
Result → valid subject
```

The database should support these relationships with foreign keys where appropriate.

---

# 74. Result Integrity

A processed result should not reference:

- nonexistent student
- nonexistent subject
- invalid academic context

Database constraints should reinforce these relationships.

Business validation remains the responsibility of the application/domain layer.

---

# 75. Backlog Integrity

A backlog should not reference a nonexistent:

- student
- subject
- academic context

Foreign keys should enforce referential integrity.

---

# 76. Audit Data

Audit data should be designed separately from normal business data where appropriate.

Audit records may include:

```text
actor
action
resource
resource_id
tenant
timestamp
result
metadata
```

Do not store sensitive credentials in audit records.

---

# 77. Audit Immutability

Audit records should generally be append-oriented.

Normal application users should not be able to edit historical audit records.

The exact retention and administrative policy may be finalized later.

---

# 78. Data Retention

Retention rules must be defined for:

- academic records
- result imports
- uploaded files
- validation errors
- audit logs
- job records

Do not automatically delete historical academic information merely to reduce storage.

---

# 79. Uploaded File Retention

Uploaded result files may contain sensitive student data.

Storage/retention must consider:

- access control
- encryption where required
- retention period
- deletion policy
- source traceability

The exact policy must be finalized before production.

---

# 80. Sensitive Database Data

Sensitive information must be protected.

Examples:

- password hashes
- reset-token information
- integration credentials
- security metadata

Use appropriate encryption/hashing/storage strategies.

Do not encrypt every column automatically; encryption has operational and query implications.

---

# 81. Database Credentials

Database credentials must never be hardcoded into:

- Java source
- SQL scripts
- Git
- frontend code
- documentation examples containing real credentials

Use environment/configuration secrets.

---

# 82. Production Database Access

Production database access must be restricted.

Developers should not receive unrestricted production database access by default.

Access should follow least privilege and operational requirements.

---

# 83. Backup

Production database backups are mandatory before production launch.

Backup strategy must define:

- frequency
- retention
- storage
- encryption
- restoration procedure
- backup verification

A backup that has never been restored/tested should not be assumed reliable.

---

# 84. Restore Testing

Database recovery should be tested periodically.

At minimum verify:

```text
backup exists
↓
backup can be restored
↓
schema is valid
↓
important records exist
↓
application can connect
```

---

# 85. Database Monitoring

Production monitoring should track:

- connection count
- query latency
- slow queries
- CPU
- memory
- storage
- locks
- deadlocks
- failed connections
- replication where applicable

The exact monitoring stack is an infrastructure decision.

---

# 86. Slow Queries

Slow queries should be investigated using appropriate database tools.

Do not solve slow queries by blindly adding indexes.

Check:

- query plan
- indexes
- row counts
- joins
- filters
- sorting
- pagination
- data distribution

---

# 87. Query Plan Review

Performance-sensitive queries should be reviewed with `EXPLAIN` or equivalent tooling.

Especially important for:

- analytics
- student search
- result lists
- backlog reports
- large import queries
- dashboard KPIs

---

# 88. Analytics Query Rules

Analytics queries must avoid accidentally multiplying rows through joins.

For example, joining:

```text
students
+
results
+
backlogs
```

may produce duplicated student/result rows if the query is not carefully designed.

Use:

- correct grouping
- distinct logic where justified
- pre-aggregation
- dedicated summary queries

---

# 89. Dashboard Query Rules

Dashboard endpoints should not execute dozens of unrelated queries unnecessarily.

Where appropriate:

- combine queries
- use aggregation
- use summary projections
- cache stable reference data
- use read models

But do not sacrifice correctness merely to reduce query count.

---

# 90. Database and Analytics Source of Truth

Analytics must always derive from authoritative academic data.

The flow should remain:

```text
Imported Result
      ↓
Validated Result
      ↓
Processed Academic Result
      ↓
Analytics
```

Not:

```text
Uploaded Excel
      ↓
Analytics
```

---

# 91. Database and Academic Passport

Academic Passport should derive from authoritative academic data.

It must not become a competing source of truth.

If a Passport projection is stored, it must have a clear rebuild/update strategy.

---

# 92. Database and Student Portal

The Student Portal must consume backend APIs.

It must not access the database directly.

Database credentials must never exist in frontend code.

---

# 93. Database Access Through Backend Only

The architecture is:

```text
React
  ↓
REST API
  ↓
Spring Boot
  ↓
Database
```

Never:

```text
React
  ↓
MySQL
```

---

# 94. Native SQL

Native SQL may be used when it provides a clear advantage, such as:

- complex reporting query
- database-specific optimization
- query impossible/inefficient through JPA

However, native SQL must be:

- reviewed
- parameterized
- tested
- documented where non-obvious

Do not use native SQL merely because it is familiar.

---

# 95. JPQL

JPQL is preferred for portable domain-oriented queries where appropriate.

Queries should remain understandable and efficient.

Avoid creating huge JPQL queries that become impossible to maintain.

---

# 96. Projections

Use projections for read-heavy endpoints where loading complete entities is unnecessary.

Examples:

```text
StudentSummaryProjection
ResultSummaryProjection
AnalyticsSummaryProjection
```

This can reduce:

- memory usage
- query complexity
- serialization overhead

---

# 97. Read Models

Read models may be introduced for:

- Academic Passport
- analytics
- dashboard summaries

A read model must have:

- defined source
- update strategy
- consistency expectations
- rebuild strategy where practical

---

# 98. Denormalization

Denormalization may be used when justified by:

- measurable performance needs
- analytics requirements
- read-model design

Do not duplicate mutable academic data simply to make frontend development easier.

---

# 99. Normalization

Core transactional data should remain appropriately normalized.

Normalization helps maintain:

- consistency
- clear ownership
- reduced duplication
- reliable updates

Denormalize deliberately, not accidentally.

---

# 100. Database Security Rules

The database layer must support:

- least-privilege access
- protected credentials
- encrypted transport where required
- secure backups
- controlled production access
- auditability

Security rules must also be aligned with `security-rules.md`.

---

# 101. Database Testing

Database-related tests should verify:

- constraints
- relationships
- indexes where important
- tenant isolation
- unique constraints
- transaction behavior
- repository queries
- migrations
- result processing
- duplicate protection

---

# 102. Migration Testing

Every migration must be tested against a representative schema/data state.

Test:

```text
clean database
existing database
existing records
migration execution
application startup
```

---

# 103. Repository Testing

Repository tests should cover:

- expected records
- missing records
- tenant restrictions
- filters
- sorting
- pagination
- duplicate conditions
- custom queries

---

# 104. Data Integrity Testing

Important integrity rules should have tests.

Examples:

```text
student belongs to college
result belongs to student
result references valid subject
duplicate result is rejected
cross-tenant result is inaccessible
```

---

# 105. AI Database Rules

AI-generated database changes must follow all database rules.

AI must not:

- create arbitrary tables
- invent relationships
- add duplicate columns
- remove constraints for convenience
- disable foreign keys
- use destructive migrations casually
- create indexes without justification
- change academic data semantics silently
- modify production assumptions without documentation

---

# 106. AI Schema Change Process

Before modifying the schema, an AI coding agent must:

```text
Read database architecture
        ↓
Read data ownership
        ↓
Read relevant feature specification
        ↓
Inspect current schema
        ↓
Identify affected tables
        ↓
Check existing constraints/indexes
        ↓
Design minimal change
        ↓
Create migration
        ↓
Update entities/repositories
        ↓
Update tests
        ↓
Review backward compatibility
```

---

# 107. AI Must Not Guess Schema Ownership

If it is unclear which module owns a table or field, the AI must not silently choose an owner.

It should identify the ambiguity and follow the project's architecture/decision process.

---

# 108. Definition of Done

A database-related change is complete when:

- [ ] ownership is defined
- [ ] schema is documented
- [ ] relationships are correct
- [ ] foreign keys are considered
- [ ] unique constraints are considered
- [ ] indexes are justified
- [ ] nullability is intentional
- [ ] migration is created
- [ ] migration is tested
- [ ] existing data impact is reviewed
- [ ] tenant isolation is verified
- [ ] repository queries are tested
- [ ] transaction behavior is reviewed
- [ ] performance is considered
- [ ] security is reviewed
- [ ] documentation is updated

---

# 109. Pre-Migration Checklist

Before a schema migration:

- [ ] identify affected tables
- [ ] identify affected APIs
- [ ] identify affected entities
- [ ] identify existing data
- [ ] check foreign keys
- [ ] check indexes
- [ ] check unique constraints
- [ ] check application compatibility
- [ ] check migration order
- [ ] consider rollback/recovery
- [ ] test against realistic data

---

# 110. Pre-Production Database Checklist

Before production:

- [ ] schema migration tested
- [ ] production database credentials configured securely
- [ ] backups configured
- [ ] restore process tested
- [ ] indexes reviewed
- [ ] slow-query monitoring configured
- [ ] connection pool configured
- [ ] database access restricted
- [ ] sensitive fields reviewed
- [ ] retention policy defined
- [ ] audit strategy implemented
- [ ] migration process documented

---

# 111. Database Anti-Patterns

Avoid:

### One Table for Everything

```text
acadlytic_data
```

containing unrelated concepts.

### No Foreign Keys

Relying entirely on application code for relationships.

### Unlimited Nullable Columns

Making every field nullable.

### Generic JSON for Everything

Storing core relational data in arbitrary JSON instead of proper columns.

### Duplicate Sources of Truth

Storing the same authoritative academic value independently in multiple places.

### Cascade Deletion Everywhere

Using cascading deletes without understanding historical impact.

### EAGER Relationships Everywhere

Using eager loading to hide query design problems.

### SELECT *

Returning entire tables unnecessarily.

### Unbounded Queries

Loading thousands/millions of rows into application memory.

### Manual Production Changes

Changing production schema directly.

### Unversioned Schema

No migration history.

### Arbitrary Indexes

Creating indexes without query justification.

### Direct Frontend Database Access

Allowing client applications to connect directly to MySQL.

---

# 112. Rule Priority

When database rules conflict, use this priority:

```text
1. Security and data protection
2. Data integrity
3. Product requirements
4. Feature specifications
5. Data ownership
6. Database architecture
7. Backend architecture
8. Database rules
9. Performance optimization
10. Developer convenience
```

Correctness and data integrity take precedence over convenience.

---

# 113. Relationship With Other Documents

This document must be used together with:

```text
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
├── security-rules.md
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

Feature-specific database requirements take precedence over generic assumptions in this document.

---

# 114. Unresolved Database Decisions

The following remain subject to final architecture review:

- exact MySQL version
- exact primary-key strategy
- exact migration framework
- complete database schema
- university master-data model
- regulation/master academic configuration
- exact SGPA/CGPA storage strategy
- exact result-attempt schema
- backlog history implementation
- Academic Passport projection strategy
- analytics summary/read-model strategy
- audit-log schema
- file metadata schema
- file retention strategy
- exact indexing strategy
- full-text/search strategy
- optimistic-locking usage
- production backup provider
- encryption strategy for sensitive fields
- production connection-pool configuration
- database monitoring stack

These decisions should be finalized before implementation depends on them.

---

# 115. Review Status

**Status:** Draft / Under Review

This document must be reviewed against:

- system architecture
- backend architecture
- database architecture
- data ownership
- API architecture
- security rules
- backend rules
- feature specifications

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

# 116. Final Database Principle

Acadlytic's database must preserve the integrity and history of academic information.

The core principle is:

```text
Authoritative Data
      +
Clear Ownership
      +
Strong Integrity
      +
Controlled Access
      +
Historical Preservation
      +
Efficient Queries
```

The database should make incorrect data difficult to create, incorrect access difficult to perform, and valid academic history reliable to retrieve.