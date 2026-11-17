# Acadlytic — Backend Technology Stack

**Document:** `04-tech-stack/backend.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Backend Technology Stack  
**Last Updated:** 2026-10-05

---

# 1. Purpose

This document defines the backend technology stack for Acadlytic.

The backend is responsible for:

- authentication
- authorization
- tenant isolation
- user management
- college management
- academic structure
- student management
- result import
- result parsing and normalization
- result validation
- result processing
- academic records
- backlog tracking
- Academic Passport
- analytics
- auditability
- API services
- background processing
- data integrity

The backend is the authoritative application layer for academic data and business rules.

---

# 2. Backend Architecture

Acadlytic will use a **Java and Spring Boot modular monolith**.

```text
React Frontend
      ↓
REST API
      ↓
Spring Boot Application
      ↓
Application / Domain Logic
      ↓
Repositories
      ↓
MySQL
```

The initial architecture will **not use microservices**.

The modular monolith provides clear domain separation while avoiding unnecessary operational complexity during the MVP stage.

---

# 3. Primary Backend Stack

| Technology | Purpose | Status |
|---|---|---|
| Java 21 | Backend programming language | Selected |
| Spring Boot | Application framework | Selected |
| Spring Web | REST API | Selected |
| Spring Security | Authentication and authorization | Selected |
| Spring Data JPA | Persistence abstraction | Selected |
| Hibernate | JPA implementation / ORM | Selected |
| Bean Validation | Request and data validation | Selected |
| Maven | Build and dependency management | Selected |
| MySQL | Relational database | Selected |
| Apache POI | Excel processing | Selected |
| OpenCSV | CSV processing | Selected |
| Spring Scheduler / Spring Batch | Background processing | Selected |
| Springdoc OpenAPI | API documentation | Selected |

---

# 4. Java 21

## 4.1 Purpose

Java 21 will be the primary backend programming language.

It provides:

- strong type safety
- mature enterprise ecosystem
- object-oriented programming
- extensive library support
- long-term support characteristics
- compatibility with the Spring ecosystem

---

## 4.2 Java Coding Standard

The backend should use modern Java practices while avoiding unnecessary complexity.

The codebase should prioritize:

- readability
- type safety
- immutability where appropriate
- clear domain modeling
- meaningful naming
- testability

---

# 5. Spring Boot

## 5.1 Purpose

Spring Boot will provide the core application framework.

It will manage:

- application configuration
- dependency injection
- web application infrastructure
- REST APIs
- database integration
- security integration
- validation
- operational endpoints

---

## 5.2 Application Entry Point

The application should have a single primary Spring Boot application entry point.

Example:

```text
com.acadlytic
└── AcadlyticApplication.java
```

---

# 6. Spring Web

Spring Web will provide REST API functionality.

The backend will expose endpoints under the versioned API namespace.

Example:

```text
/api/v1/auth
/api/v1/students
/api/v1/result-imports
/api/v1/backlogs
/api/v1/analytics
```

Controllers should remain focused on:

- request handling
- request validation
- authorization integration
- response mapping

Business logic should not be placed directly inside controllers.

---

# 7. Spring Security

## 7.1 Purpose

Spring Security will provide the backend security foundation.

Responsibilities include:

- authentication
- authorization
- role-based access control
- protected endpoints
- security context
- password security
- authentication failure handling

---

## 7.2 Role Model

The primary roles are:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

The backend must enforce role permissions.

---

## 7.3 Tenant Security

Spring Security will participate in enforcing tenant-aware access.

However, tenant isolation must not depend solely on authentication configuration.

Business and persistence layers must also verify tenant boundaries.

---

# 8. Authentication Architecture

The exact authentication mechanism will be finalized during backend implementation.

The architecture must support:

```text
Authentication
      ↓
Authenticated User
      ↓
Role
      ↓
Tenant Context
      ↓
Authorization
```

The backend must never trust client-supplied role or tenant information.

---

# 9. Password Security

Passwords must be securely hashed using an established password hashing mechanism supported by the security framework.

The backend must never:

- store plain-text passwords
- log passwords
- return passwords through APIs
- expose password hashes unnecessarily

---

# 10. Spring Data JPA

## 10.1 Purpose

Spring Data JPA will provide repository and persistence support.

It will be used for:

- entity persistence
- repository abstractions
- query methods
- transaction integration
- database access

---

# 11. Hibernate

Hibernate will serve as the JPA implementation.

It will manage object-relational mapping between Java domain/persistence models and MySQL.

---

# 12. Persistence Architecture

The recommended flow is:

```text
Controller
    ↓
Application Service
    ↓
Domain Logic
    ↓
Repository
    ↓
JPA / Hibernate
    ↓
MySQL
```

The controller must not directly manipulate repositories for complex business operations.

---

# 13. Entity Design

Entities should represent persistence concepts and relationships.

Potential major entities include:

```text
User
College
Program
Semester
Subject
Student
ResultImport
ResultImportRecord
AcademicRecord
AcademicAttempt
Backlog
AuditEvent
```

The final entity model is defined by the database architecture and implementation.

---

# 14. DTO Architecture

The backend shall use DTOs for API contracts.

Recommended separation:

```text
Request DTO
     ↓
Controller
     ↓
Application Service
     ↓
Domain / Entity
     ↓
Repository
```

Persistence entities should not automatically become API response models.

---

# 15. Bean Validation

Bean Validation will be used for request validation.

Validation may include:

- required fields
- string length
- numeric limits
- email format
- enum values
- date constraints
- file-related metadata

Example conceptual usage:

```java
@NotBlank
private String studentIdentifier;
```

Validation must also be enforced at the business level where simple field validation is insufficient.

---

# 16. Transaction Management

Spring transaction management will be used for authoritative academic operations.

Critical workflows should use appropriate transaction boundaries.

Example:

```text
Result Processing
      ↓
Academic Record
      ↓
Attempt
      ↓
Backlog
      ↓
Derived State
```

These updates must not leave unintended partial state.

---

# 17. Result Import Technology

The result import system must support common structured result files.

MVP formats:

- `.xlsx`
- `.xls` where supported
- `.csv`

The implementation should use appropriate libraries rather than custom spreadsheet parsing.

---

# 18. Apache POI

Apache POI will be used for Excel processing.

Responsibilities include:

- workbook reading
- worksheet access
- row processing
- cell extraction
- value conversion

The parser must normalize imported values before validation.

---

# 19. OpenCSV

OpenCSV will be used for CSV processing where appropriate.

Responsibilities include:

- CSV parsing
- row extraction
- field handling
- delimiter-aware processing

CSV input must still pass through the same validation pipeline as Excel input.

---

# 20. Result Import Pipeline

The backend import pipeline shall follow:

```text
File Upload
     ↓
File Validation
     ↓
Parsing
     ↓
Normalization
     ↓
Student Matching
     ↓
Subject Matching
     ↓
Academic Validation
     ↓
Duplicate Detection
     ↓
Review
     ↓
Processing
     ↓
Authoritative Academic Data
```

Result import must not directly modify authoritative academic records.

---

# 21. Validation Architecture

Validation shall occur before authoritative processing.

The conceptual pipeline is:

```text
Required Fields
      ↓
Student Identity
      ↓
Student Context
      ↓
Subject Identity
      ↓
Academic Context
      ↓
Result Values
      ↓
Attempt
      ↓
Duplicate
      ↓
Business Rules
```

The exact validation rules depend on configured academic data.

---

# 22. Result Processing Architecture

Result Processing is the authoritative mutation boundary.

Only eligible validated records may be processed.

Processing may update:

- academic records
- attempts
- latest outcomes
- backlog state
- configured academic metrics
- Academic Passport derived state

---

# 23. Backlog Processing

Backlog state must be derived from processed academic outcomes.

The backend must distinguish:

```text
Attempt
≠
Backlog
```

An attempt represents a historical academic effort.

A backlog represents an unresolved academic requirement.

---

# 24. Academic Calculation Architecture

Academic calculations shall be configuration-driven.

Potential calculations include:

- SGPA
- CGPA
- percentage
- grade
- grade point
- credits

The backend must not invent university-specific formulas.

If the required academic rule is unavailable, the system must not fabricate a result.

---

# 25. Academic Passport Architecture

The Academic Passport will be a read-oriented representation of authoritative academic data.

Conceptually:

```text
Authoritative Academic Records
           ↓
      Passport Service
           ↓
      Passport DTO
           ↓
        Frontend
```

The Passport must not become an independent source of truth.

---

# 26. Analytics Architecture

Analytics will be derived from authoritative processed academic records.

```text
Processed Academic Data
        ↓
Analytics Queries
        ↓
Aggregated Metrics
        ↓
Analytics DTOs
        ↓
React Dashboard
```

The backend must prevent:

- double counting
- treating missing data as zero
- mixing historical attempts incorrectly
- using unprocessed import data as authoritative analytics input

---

# 27. Query Architecture

The backend should distinguish between:

- write-oriented domain operations
- read-oriented analytical queries

Complex dashboard queries should not unnecessarily load full entity graphs.

Read-oriented queries may use optimized projections or DTO queries where appropriate.

---

# 28. Repository Layer

Repositories should encapsulate persistence access.

Examples:

```text
StudentRepository
SubjectRepository
AcademicRecordRepository
ResultImportRepository
BacklogRepository
```

Repositories should not contain unrelated business rules.

---

# 29. Service Layer

Application services should coordinate use cases.

Examples:

```text
AuthenticationService
CollegeService
StudentService
ResultImportService
ResultValidationService
ResultProcessingService
BacklogService
AcademicPassportService
AnalyticsService
```

Services should enforce application workflow boundaries.

---

# 30. Domain Logic

Important academic rules should be represented explicitly in the domain/application layer rather than scattered throughout controllers.

Examples:

- result eligibility
- attempt handling
- backlog resolution
- duplicate detection
- academic calculations
- processing rules

---

# 31. Exception Handling

The backend should use centralized exception handling.

A consistent mechanism should map application exceptions to API responses.

Expected categories include:

```text
Validation Error
Authentication Error
Authorization Error
Resource Not Found
Conflict
Business Rule Violation
File Processing Error
Unexpected Server Error
```

Internal implementation details must not be exposed to clients.

---

# 32. Error Response

The API should return a consistent error structure.

Conceptual example:

```json
{
  "timestamp": "2026-10-05T10:30:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "The request contains invalid data.",
  "errors": []
}
```

The exact contract will be finalized during API implementation.

---

# 33. Maven

Maven will be used for:

- dependency management
- compilation
- testing
- packaging
- build lifecycle
- plugin management

The project should use a controlled dependency strategy.

---

# 34. Dependency Management

Dependencies must be:

- necessary
- maintained
- compatible with Java 21
- compatible with Spring Boot
- reviewed for security issues

Unnecessary dependencies should not be introduced.

---

# 35. Background Processing

Result imports may require background processing.

The backend may use:

- Spring Scheduler
- Spring Batch

depending on the complexity and scale of the implementation.

---

# 36. Spring Scheduler

Spring Scheduler may be used for lightweight scheduled tasks.

Potential examples:

- maintenance tasks
- cleanup tasks
- periodic operational checks

It should not be used as a replacement for a full job-processing architecture when imports become complex.

---

# 37. Spring Batch

Spring Batch may be used when result processing requires robust batch capabilities.

Potential capabilities include:

- chunk processing
- job execution
- retry
- restartability
- job status
- large dataset processing

The MVP should introduce Spring Batch only when the import-processing requirements justify it.

---

# 38. OpenAPI

Springdoc OpenAPI will be used to document the REST API.

API documentation should describe:

- endpoints
- parameters
- request bodies
- response schemas
- authentication
- errors
- examples

---

# 39. Logging

The backend shall use structured and meaningful application logging.

Important operations should include sufficient context for troubleshooting.

Logs must not expose:

- passwords
- secrets
- database credentials
- authentication tokens
- unnecessary sensitive student data

---

# 40. Correlation IDs

The backend should support correlation IDs for tracing requests across logs.

Conceptually:

```text
Frontend Request
      ↓
Correlation ID
      ↓
Controller
      ↓
Service
      ↓
Repository
      ↓
Log Entries
```

This is especially useful for:

- result imports
- background jobs
- processing failures
- production troubleshooting

---

# 41. Database Transactions

Transactions should be applied at appropriate service/use-case boundaries.

Example:

```text
@Transactional
processResult(...)
```

The transaction boundary must be designed around the business operation rather than placed indiscriminately on every method.

---

# 42. Concurrency Control

The backend must protect academic processing from concurrent modifications.

Potential mechanisms include:

- database constraints
- optimistic locking
- pessimistic locking where justified
- processing-state checks
- unique constraints
- idempotency controls

The implementation should choose the simplest mechanism that reliably protects the business invariant.

---

# 43. Idempotency

Critical processing operations must be idempotent or otherwise protected against duplicate execution.

Important operations include:

- result processing
- import retry
- background job retry
- backlog state changes

---

# 44. Multi-Tenant Backend Design

The backend will use a shared application architecture with tenant-aware data.

Conceptually:

```text
Acadlytic Application
       ↓
College A Data
College B Data
College C Data
```

Tenant context must be enforced for all tenant-owned resources.

---

# 45. Tenant Context

For college-scoped operations, the backend should determine the current tenant from authenticated user context.

The system must not blindly trust:

```text
collegeId
```

provided by the frontend.

The backend should verify that the authenticated user is authorized for the requested tenant.

---

# 46. Student Self-Service

Student APIs should use authenticated identity.

Preferred conceptual pattern:

```text
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/passport
GET /api/v1/me/analytics
```

The backend must prevent a student from accessing another student's data by modifying identifiers.

---

# 47. Backend Package Structure

Recommended structure:

```text
backend/
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/
    │   │       └── acadlytic/
    │   │           ├── AcadlyticApplication.java
    │   │           │
    │   │           ├── config/
    │   │           ├── security/
    │   │           ├── common/
    │   │           ├── exception/
    │   │           │
    │   │           ├── modules/
    │   │           │   ├── auth/
    │   │           │   ├── users/
    │   │           │   ├── colleges/
    │   │           │   ├── students/
    │   │           │   ├── academic/
    │   │           │   ├── results/
    │   │           │   ├── backlogs/
    │   │           │   ├── passport/
    │   │           │   └── analytics/
    │   │           │
    │   │           └── jobs/
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── application-prod.yml
    │
    └── test/
```

---

# 48. Module Structure

Each major module should remain logically isolated.

Example:

```text
results/
├── controller/
├── dto/
├── entity/
├── repository/
├── service/
├── validation/
└── mapper/
```

The exact internal structure may vary by module complexity.

---

# 49. Backend Configuration

Configuration should be environment-aware.

Expected environments:

```text
Development
Preview/Staging
Production
```

Example configuration categories:

```text
Database
Security
API
File Upload
Logging
CORS
External Services
```

Secrets must be supplied through secure environment configuration.

---

# 50. Database Migration

Database schema changes should be version controlled.

A migration tool should be selected and standardized during project setup.

The backend must not rely on manually modifying production databases without tracked schema changes.

---

# 51. CORS

Cross-Origin Resource Sharing must be configured according to the actual frontend deployment environment.

Development origins may differ from production origins.

CORS must not be configured as unrestricted access in production without a justified security reason.

---

# 52. File Storage

The backend must separate file-upload handling from academic record storage.

Imported files may be stored through:

- local storage during development
- object storage in production

The final production storage mechanism will be defined in the infrastructure documentation.

---

# 53. Backend Testing Stack

Backend testing should cover:

```text
Unit Tests
Integration Tests
Repository Tests
Controller/API Tests
Security Tests
Tenant Isolation Tests
Result Import Tests
Result Validation Tests
Result Processing Tests
```

Critical academic workflows require automated regression coverage.

---

# 54. Testing Priorities

Highest-priority backend tests include:

1. authentication
2. authorization
3. tenant isolation
4. student self-service protection
5. result parsing
6. result validation
7. result processing
8. duplicate prevention
9. backlog lifecycle
10. academic calculations
11. transaction behavior
12. idempotency

---

# 55. Backend Performance Principles

The backend should:

- use pagination
- avoid N+1 queries
- use appropriate indexes
- avoid unnecessary entity loading
- use optimized read queries for analytics
- process large imports safely
- avoid unnecessary database round trips

Performance optimization should be evidence-driven.

---

# 56. Backend Security Principles

The backend must follow:

```text
Never Trust the Client
        ↓
Authenticate
        ↓
Authorize
        ↓
Validate
        ↓
Enforce Tenant Boundary
        ↓
Execute Business Rule
        ↓
Persist Safely
        ↓
Audit
```

---

# 57. Technology Boundaries

The backend must not:

- expose database credentials
- expose persistence entities unnecessarily
- trust frontend authorization
- accept arbitrary tenant context
- invent academic calculations
- bypass validation before processing
- silently overwrite academic history
- allow duplicate authoritative processing
- place all business logic inside controllers

---

# 58. Backend Technology Decision

The selected backend stack is:

```text
Java 21
+
Spring Boot
+
Spring Web
+
Spring Security
+
Spring Data JPA
+
Hibernate
+
Bean Validation
+
Maven
+
MySQL
+
Apache POI
+
OpenCSV
+
Spring Scheduler / Spring Batch
+
Springdoc OpenAPI
```

This stack supports the current MVP while leaving room for future expansion.

---

# 59. Future Backend Capabilities

The architecture should be able to support future capabilities such as:

- university APIs
- university result feeds
- webhooks
- integration connectors
- advanced regulation engines
- eligibility calculation
- What-If simulation
- academic risk intelligence
- AI Query
- predictive analytics
- SaaS billing
- multi-campus enterprise capabilities

These are outside the current MVP backend scope.

---

# 60. Definition of Done

The backend technology stack is sufficiently defined when:

- Java version is selected
- Spring Boot is selected
- REST API framework is selected
- security framework is selected
- persistence technology is selected
- database is selected
- validation approach is selected
- build tool is selected
- result file processing libraries are selected
- background processing approach is defined
- API documentation approach is defined
- backend package structure is defined
- modular monolith approach is documented
- transaction strategy is documented
- idempotency requirements are documented
- tenant isolation requirements are documented
- testing expectations are documented
- configuration strategy is documented
- security boundaries are documented

---

# 61. Final Principle

> **The Acadlytic backend is the authoritative application layer responsible for secure access, tenant isolation, academic business rules, result processing, data integrity, and reliable persistence.**

The backend should remain a **modular monolith** during the MVP, with clear domain boundaries and strong separation between API, application logic, domain behavior, persistence, and infrastructure.