# Acadlytic — Database Technology Stack

**Document:** `04-tech-stack/database.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Database Technology Stack  
**Last Updated:** 2026-10-05

---

# 1. Purpose

This document defines the database technology stack and database-level technology decisions for Acadlytic.

The database must support:

- multi-tenant college data
- users and roles
- academic structures
- students
- subjects
- result imports
- result validation
- processed academic records
- attempts
- backlogs
- Academic Passport data
- analytics
- audit records
- historical academic data
- transactional consistency
- secure data access

The database is a critical source of authoritative academic data.

---

# 2. Selected Database

Acadlytic will use:

**MySQL**

The database will be used as the primary relational persistence layer for the MVP.

---

# 3. Why a Relational Database

Acadlytic contains strongly related academic entities.

Examples:

```text
College
   ↓
Program
   ↓
Semester
   ↓
Subject

College
   ↓
Student
   ↓
Academic Record
   ↓
Attempt
   ↓
Backlog
```

A relational database provides:

- structured relationships
- foreign keys
- transactions
- constraints
- indexing
- consistent joins
- reliable persistence
- mature Java integration

These characteristics are important for academic data integrity.

---

# 4. Database Technology Stack

| Technology | Purpose | Status |
|---|---|---|
| MySQL | Primary relational database | Selected |
| InnoDB | Transactional storage engine | Required |
| JDBC | Java database connectivity | Used through Spring ecosystem |
| Spring Data JPA | Persistence abstraction | Selected |
| Hibernate | ORM | Selected |
| SQL | Relational querying | Required |
| Database migrations | Version-controlled schema changes | Required |

---

# 5. Storage Engine

The database should use **InnoDB** for application tables.

InnoDB provides important capabilities such as:

- transactions
- row-level locking
- foreign key support
- crash recovery
- reliable concurrent access

Academic processing requires these capabilities.

---

# 6. Database Role in the Architecture

The database sits below the backend application layer.

```text
React Frontend
      ↓
REST API
      ↓
Spring Boot
      ↓
Application / Domain Logic
      ↓
Repository
      ↓
Hibernate / JPA
      ↓
MySQL
```

The frontend must never communicate directly with MySQL.

---

# 7. Database Ownership

The backend application owns database access.

Only the backend should perform application-level database operations.

The frontend must not:

- access database credentials
- execute SQL
- modify academic records directly
- bypass backend validation

---

# 8. Multi-Tenant Database Model

Acadlytic will use a shared database with tenant-aware data.

Conceptually:

```text
Acadlytic Database
│
├── College A
│   ├── Users
│   ├── Students
│   ├── Academic Data
│   └── Results
│
├── College B
│   ├── Users
│   ├── Students
│   ├── Academic Data
│   └── Results
│
└── College C
    ├── Users
    ├── Students
    ├── Academic Data
    └── Results
```

The college is the primary tenant boundary.

---

# 9. Tenant Identification

Tenant-owned records should have an appropriate relationship to the college/tenant.

Conceptually:

```text
College
   │
   ├── Users
   ├── Students
   ├── Programs
   ├── Academic Records
   ├── Result Imports
   └── Backlogs
```

The exact foreign-key structure is defined by the database architecture and implementation.

---

# 10. Tenant Isolation

Tenant isolation must be enforced by the backend.

The database design should support tenant-safe queries.

A request for one college must never accidentally return records belonging to another college.

Example:

```text
Authenticated User
        ↓
Tenant Context
        ↓
Authorized Query
        ↓
College-Scoped Data
```

---

# 11. Database Naming Conventions

Database naming should remain consistent throughout the project.

Recommended conventions:

- lowercase names
- `snake_case`
- singular or plural convention selected consistently
- descriptive table names
- descriptive column names
- no unnecessary abbreviations

Example:

```text
students
academic_records
result_imports
result_import_records
backlogs
audit_events
```

The final naming convention must be applied consistently.

---

# 12. Primary Keys

Each major entity should have a stable primary key.

The application should use identifiers that are:

- unique
- stable
- non-semantic
- safe to expose through APIs where appropriate

Database-generated identifiers or UUID-based identifiers may be used depending on the final implementation decision.

The identifier strategy must remain consistent across the system.

---

# 13. Foreign Keys

Foreign keys should be used to represent important relational dependencies.

Example:

```text
students.college_id
        ↓
colleges.id
```

Foreign keys help protect referential integrity.

---

# 14. Referential Integrity

The database should prevent invalid relationships where practical.

Examples:

- an academic record should reference an existing student
- an attempt should reference an existing academic record or appropriate academic context
- a backlog should reference valid student/subject context
- a result import record should belong to a valid import

---

# 15. Normalization

The database should use appropriate relational normalization.

The goal is to:

- minimize unnecessary duplication
- preserve data consistency
- avoid update anomalies
- maintain clear ownership of data

Normalization should not be taken to an extreme where important read operations become unnecessarily complex.

---

# 16. Source of Truth

The database must clearly distinguish between authoritative and derived data.

Conceptually:

```text
Processed Academic Data
        ↓
Authoritative Data
        ↓
┌───────┴────────┐
↓                ↓
Passport       Analytics
Derived        Derived
```

The Academic Passport and analytics layer must not silently become alternative sources of truth.

---

# 17. Result Import Storage

Result imports should preserve information about the imported file and processing lifecycle.

An import may contain information such as:

- import identifier
- college
- uploaded file metadata
- upload timestamp
- processing status
- source/result release context
- total records
- valid records
- invalid records
- warning records
- processing status
- error information

---

# 18. Raw Import Data

The system should distinguish imported raw/normalized data from authoritative academic records.

Conceptually:

```text
Uploaded File
      ↓
Imported Data
      ↓
Normalized Data
      ↓
Validated Data
      ↓
Processed Academic Data
```

Unvalidated imported data must not be treated as authoritative academic history.

---

# 19. Result Import Records

Individual imported rows should be traceable to their parent import.

Conceptually:

```text
Result Import
     │
     ├── Import Record
     ├── Import Record
     ├── Import Record
     └── Import Record
```

This enables:

- validation review
- error reporting
- processing traceability
- import-level reporting

---

# 20. Student Identity

The database must distinguish between the platform's internal student identifier and university/student identifiers used for matching.

The official student identifier is important for result matching.

The system must not assume that a student's display name is a reliable unique identifier.

---

# 21. Student Matching

Result matching should use configured authoritative identifiers.

A conceptual matching priority is:

```text
Student Identifier
      ↓
Student Context
      ↓
Authorized Match
```

Name-only matching must not automatically create or associate an academic record.

---

# 22. Subject Identity

Subjects should have stable identities within the academic structure.

Important attributes may include:

- subject code
- subject name
- credits
- semester
- program
- academic context

Subject code is an important result-import matching key.

---

# 23. Academic Structure

The database must represent the academic hierarchy required by the product.

Conceptually:

```text
College
   ↓
Program
   ↓
Academic Context
   ↓
Semester
   ↓
Subject
```

The exact structure may vary according to supported academic configurations.

---

# 24. Academic Context

Academic records should retain sufficient academic context to prevent ambiguity between similar courses, semesters, programs, or regulations.

The system should avoid assuming that:

```text
Subject Code
```

is globally unique across every university and academic context.

Uniqueness should be defined according to the applicable academic scope.

---

# 25. Result Release

Result processing should preserve the result-release context.

A result release may represent a particular university result publication.

The database should retain enough information to distinguish multiple releases and attempts.

---

# 26. Attempts

Academic attempts must be stored as historical records.

Conceptually:

```text
Student
   ↓
Subject
   ↓
Attempts
   ├── Regular
   ├── Supplementary
   └── Other configured attempt
```

An attempt must not simply overwrite previous academic history.

---

# 27. Backlog Data

Backlog records represent unresolved academic requirements.

The database must preserve the distinction between:

```text
Attempt History
        ≠
Backlog State
```

A later passing attempt may resolve an existing backlog while historical attempts remain preserved.

---

# 28. Backlog Lifecycle

The database should support at least:

```text
OPEN
RESOLVED
```

The lifecycle should preserve enough information to understand:

- when the backlog originated
- which subject it concerns
- relevant attempts
- when it was resolved
- which result caused resolution

---

# 29. Academic Records

Academic records should represent processed authoritative outcomes.

Potential information includes:

- student
- academic context
- subject
- current/latest outcome
- grade
- grade point
- credits
- pass/fail state
- attempt relationship
- result-release relationship

The exact schema will be defined in the database architecture and implementation.

---

# 30. Historical Data Preservation

Academic history must not be destroyed simply because a newer result exists.

The database should preserve:

- historical attempts
- result releases
- important state transitions
- backlog history
- audit information

This is essential for longitudinal academic records.

---

# 31. Duplicate Prevention

Database constraints should support duplicate prevention where the business rule requires uniqueness.

For example, result identity may depend on a combination such as:

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

The exact uniqueness constraint must follow the finalized domain rules.

---

# 32. Constraints

The database should use appropriate constraints for:

- primary keys
- foreign keys
- unique values
- required values
- valid relationships

Constraints should protect important invariants that should never be violated.

---

# 33. Indexing

Indexes should be created for frequently queried fields.

Likely candidates include:

- student identifiers
- college identifiers
- subject codes
- program identifiers
- semester identifiers
- result import identifiers
- result release identifiers
- backlog status
- student/subject relationships

Indexes must be based on actual query patterns.

---

# 34. Composite Indexes

Composite indexes may be required for frequent multi-column queries.

Examples:

```text
college_id + student_identifier
program_id + semester_id
student_id + subject_id
result_release_id + student_identifier
```

The final index design should be based on actual query plans and workload.

---

# 35. Query Performance

Database performance should be protected by:

- appropriate indexing
- pagination
- efficient joins
- selective queries
- avoiding unnecessary entity loading
- query-plan analysis
- avoiding N+1 query patterns

---

# 36. Pagination

Large datasets must not be returned without pagination.

Important paginated resources include:

- students
- result imports
- import records
- academic records
- backlogs
- users
- analytics tables where applicable

The backend should enforce reasonable page-size limits.

---

# 37. Transactions

Academic processing must use database transactions where multiple related records must remain consistent.

Example:

```text
Process Result
      ↓
Academic Record Update
      ↓
Attempt Creation
      ↓
Backlog Update
      ↓
Commit
```

If the transaction fails, the system must not leave an unintended partial state.

---

# 38. Concurrency

The database must support safe concurrent operations.

Important scenarios include:

- two users processing the same import
- duplicate processing attempts
- simultaneous academic updates
- concurrent backlog updates

Possible mechanisms include:

- unique constraints
- optimistic locking
- transactional boundaries
- row-level locking where justified

---

# 39. Idempotency

Database design should support idempotent processing where required.

If the same operation is retried, the system should avoid creating duplicate authoritative academic data.

Idempotency must be implemented at the application and database levels where appropriate.

---

# 40. Soft Deactivation

Important institutional records should generally not be physically deleted when deletion would compromise historical integrity.

For example:

```text
ACTIVE
INACTIVE
SUSPENDED
```

may be preferable to deleting a college or student-related history.

The exact lifecycle depends on the entity.

---

# 41. Academic Data Deletion

Academic records should not be casually deleted.

Any destructive operation affecting authoritative academic data requires:

- explicit authorization
- business justification
- appropriate auditability
- protection against accidental deletion

Where possible, historical records should be preserved.

---

# 42. Audit Data

The database should support audit information for important operations.

Potential audit events include:

- login/security events
- user creation
- role changes
- college changes
- result import
- validation resolution
- result processing
- backlog changes
- important administrative actions

Audit design must balance traceability with data minimization.

---

# 43. Audit vs Academic History

Audit events and academic history serve different purposes.

```text
Academic History
→ What happened academically?

Audit Event
→ Who performed an important system action and when?
```

They must not be treated as interchangeable.

---

# 44. Analytics Data

MVP analytics should preferably be generated from authoritative academic data rather than maintaining unnecessary duplicated analytics tables.

Conceptually:

```text
Authoritative Academic Data
          ↓
       Queries
          ↓
      Aggregations
          ↓
       Analytics
```

Materialized or pre-aggregated analytics can be introduced later if performance requires them.

---

# 45. Missing Data vs Zero

The database and query layer must distinguish:

```text
0
```

from:

```text
Unknown / Missing
```

For example:

- zero backlog is not the same as unknown backlog
- zero credits is not automatically the same as missing credits
- zero students is different from unavailable data

Analytics queries must preserve this distinction.

---

# 46. Database Security

Database access credentials must:

- remain outside source code
- be supplied through secure configuration
- use least privilege
- differ by environment where appropriate

The application database user should not automatically have unrestricted administrative privileges.

---

# 47. Sensitive Data

The database may contain sensitive academic and account information.

Access must be controlled at the application layer.

Sensitive fields should not be unnecessarily exposed through:

- logs
- API responses
- error messages
- debug output

---

# 48. Backup Strategy

The production database must have regular backups.

Backup requirements should include:

- automated backup
- retention policy
- backup integrity verification
- restoration testing
- appropriate access controls

Detailed production backup architecture belongs in the infrastructure documentation.

---

# 49. Development Database

Development environments should use a separate database from production.

Example:

```text
acadlytic_dev
acadlytic_preview
acadlytic_prod
```

The exact naming convention may vary by deployment environment.

Production data must not be copied into development without an approved data-protection process.

---

# 50. Database Migrations

Schema changes must be version controlled.

A migration mechanism should track:

```text
Version 1
Version 2
Version 3
...
```

Each schema change should be reproducible.

Developers should not rely on manually modifying shared databases.

---

# 51. Migration Principles

Database migrations should:

- be deterministic
- be reviewable
- be tested
- preserve existing data where required
- avoid destructive changes without explicit justification
- support deployment consistency

---

# 52. ORM Boundaries

Hibernate/JPA will be used for normal application persistence.

However, not every query must be forced through entity-based access.

For complex read-heavy operations, the backend may use:

- JPQL
- native SQL where justified
- projections
- optimized repository queries

The choice should prioritize correctness and maintainability.

---

# 53. N+1 Query Prevention

The backend must actively avoid N+1 query patterns.

Developers should inspect generated SQL for important workflows.

Potential techniques include:

- fetch joins
- entity graphs
- projections
- dedicated queries
- batch fetching where appropriate

---

# 54. Database Testing

Database-related tests should verify:

- entity relationships
- constraints
- repository behavior
- transaction behavior
- duplicate prevention
- tenant isolation
- result processing
- backlog transitions
- migration correctness

---

# 55. Academic Calculation Data Integrity

Academic calculations must be based on valid authoritative data.

The database must not allow invalid calculation inputs to become authoritative merely because the values are syntactically valid.

For example:

```text
Grade = "A"
```

being syntactically valid does not automatically mean that it is valid for every university configuration.

---

# 56. University-Specific Rules

The database architecture must allow future academic configurations without hardcoding assumptions into the schema unnecessarily.

Future support may include:

- regulations
- grading scales
- credit rules
- calculation rules
- eligibility rules

However, these capabilities are outside the MVP database scope unless explicitly implemented.

---

# 57. Database Technology Decision

The selected database approach is:

```text
MySQL
+
InnoDB
+
Spring Data JPA
+
Hibernate
+
Version-Controlled Migrations
```

This provides a reliable relational foundation for the MVP.

---

# 58. Future Database Scalability

The database architecture should leave room for future improvements such as:

- read replicas
- query optimization
- caching
- partitioning where justified
- analytics optimization
- archival strategies
- larger import workloads

These should only be introduced when actual workload requirements justify them.

---

# 59. Explicit Database Non-Goals

The MVP database will not be designed around:

- distributed databases
- database-per-service architecture
- microservices
- event-sourced academic history
- unnecessary data duplication
- a separate analytics warehouse
- real-time university synchronization

These may be reconsidered in future versions.

---

# 60. Definition of Done

The database technology stack is sufficiently defined when:

- MySQL is selected
- InnoDB is selected
- JPA/Hibernate persistence is established
- tenant-aware database design is documented
- primary-key strategy is documented
- foreign-key strategy is documented
- naming conventions are defined
- indexing principles are defined
- transaction requirements are defined
- concurrency requirements are defined
- idempotency requirements are defined
- result import storage principles are defined
- academic history preservation is defined
- backlog persistence principles are defined
- audit requirements are defined
- migration requirements are defined
- backup expectations are documented
- database security requirements are documented
- testing requirements are documented

---

# 61. Final Principle

> **The Acadlytic database must preserve authoritative academic history, enforce relational integrity, support tenant isolation, and provide a reliable transactional foundation for result processing, backlog tracking, Academic Passport generation, and analytics.**

The database should remain **simple, relational, consistent, and strongly governed by the backend domain rules** rather than becoming a place where business logic is scattered or academic history is silently overwritten.