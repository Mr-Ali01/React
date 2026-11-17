# Acadlytic — Backend Foundation

**Document:** `09-development/implementation-notes/backend-foundation.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Type:** Development Implementation Note  
**Status:** Draft / Under Review  
**Version:** 1.0

---

# 1. Purpose

This document defines the implementation foundation of the Acadlytic backend.

It establishes how the Spring Boot application should be structured before feature modules are implemented.

The foundation includes:

- Spring Boot application setup
- Java 21 configuration
- Maven configuration
- package structure
- configuration management
- database integration foundation
- REST API foundation
- DTO conventions
- validation
- exception handling
- security foundation
- logging
- OpenAPI
- transaction boundaries
- common backend utilities
- testing foundation

This document does not implement feature-specific business logic.

Feature behavior must follow the corresponding feature specification.

---

# 2. Backend Architecture

Acadlytic will use a **modular monolith**.

```text
Client
  ↓
REST Controller
  ↓
Application / Service Layer
  ↓
Domain Logic
  ↓
Repository
  ↓
MySQL
```

Cross-cutting infrastructure surrounds these layers:

```text
Security
Validation
Exception Handling
Logging
Transactions
Configuration
Observability
```

The backend should remain modular internally while running as one deployable application.

---

# 3. Backend Technology Baseline

| Technology | Role |
|---|---|
| Java 21 | Application language/runtime |
| Spring Boot | Application framework |
| Spring Web | REST API |
| Spring Security | Security |
| Spring Data JPA | Persistence |
| Hibernate | ORM |
| MySQL | Database |
| Maven | Build system |
| Bean Validation | Request validation |
| Apache POI | Excel processing |
| OpenCSV | CSV processing |
| Springdoc OpenAPI | API documentation |

Only dependencies required by the approved architecture should be introduced.

---

# 4. Application Entry Point

The application entry point should be:

```text
com.acadlytic.AcadlyticApplication
```

Example responsibility:

```java
@SpringBootApplication
public class AcadlyticApplication {

    public static void main(String[] args) {
        SpringApplication.run(AcadlyticApplication.class, args);
    }
}
```

The application class should remain lightweight.

Business logic must not be placed inside the application entry point.

---

# 5. Package Structure

The backend should follow:

```text
com.acadlytic/
│
├── AcadlyticApplication.java
│
├── config/
│
├── security/
│
├── common/
│
├── exception/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── colleges/
│   ├── students/
│   ├── academic/
│   ├── results/
│   ├── backlogs/
│   ├── passport/
│   └── analytics/
│
└── jobs/
```

---

# 6. Configuration Package

The `config` package contains application-wide infrastructure configuration.

Potential responsibilities:

- database configuration where required
- Jackson configuration
- CORS configuration
- OpenAPI configuration
- application properties
- bean configuration
- general infrastructure settings

Configuration classes should not contain business logic.

---

# 7. Security Package

The `security` package owns application security infrastructure.

Potential components:

```text
security/
├── SecurityConfig
├── authentication/
├── authorization/
├── tenant/
└── user/
```

The exact classes should be introduced only when their responsibility is required.

Feature-specific authorization must still be implemented according to the feature specification.

---

# 8. Common Package

The `common` package contains genuinely reusable infrastructure.

Examples:

```text
common/
├── dto/
├── enums/
├── pagination/
├── response/
├── auditing/
└── util/
```

Common code must satisfy:

> Reuse must represent a real shared concept, not merely similar-looking code.

Avoid creating a generic utility class containing unrelated methods.

---

# 9. Exception Package

Application-wide exception handling belongs in:

```text
exception/
```

Potential components:

```text
exception/
├── GlobalExceptionHandler
├── ErrorCode
├── ApiError
├── ResourceNotFoundException
├── ValidationException
├── AuthorizationException
└── ConflictException
```

Actual exception classes should be added only when required.

---

# 10. Feature Module Structure

Each major feature module should remain internally organized.

Example:

```text
modules/
└── students/
    ├── controller/
    ├── service/
    ├── domain/
    ├── repository/
    ├── dto/
    ├── mapper/
    └── validation/
```

Not every module must contain every directory.

Create only the layers needed by that module.

---

# 11. Controller Layer

Controllers are responsible for:

- receiving HTTP requests
- validating request DTOs
- invoking application/service logic
- returning appropriate HTTP responses

Controllers should not contain substantial business logic.

Avoid:

```text
Controller
    ↓
Business calculations
    ↓
Database queries
```

Prefer:

```text
Controller
    ↓
Service/Application Operation
    ↓
Domain Logic
    ↓
Repository
```

---

# 12. Service/Application Layer

The service/application layer coordinates use cases.

Responsibilities include:

- authorization-aware operations
- transaction boundaries
- coordinating domain operations
- repository interaction
- validation orchestration
- integration with other modules through approved interfaces

Business rules must remain explicit.

---

# 13. Domain Layer

The domain layer represents business concepts and rules.

Examples include:

- student
- academic result
- backlog
- academic structure
- import result
- processing operation

The domain layer should protect important invariants.

For example:

```text
Processed academic results
        ↓
must preserve historical attempts
```

and:

```text
Backlog state
        ↓
must follow approved academic result rules
```

---

# 14. Repository Layer

Repositories are responsible for persistence operations.

Spring Data JPA should be used where appropriate.

Repository code should:

- use explicit queries where necessary
- avoid inefficient queries
- support pagination
- respect tenant boundaries
- avoid unnecessary eager loading
- avoid N+1 query patterns

---

# 15. DTO Strategy

API requests and responses should use DTOs.

Do not expose JPA entities directly as API contracts.

Recommended structure:

```text
Request DTO
     ↓
Controller
     ↓
Service
     ↓
Domain/Entity
     ↓
Repository
```

And:

```text
Repository
     ↓
Domain/Entity
     ↓
Mapper
     ↓
Response DTO
     ↓
Controller
```

---

# 16. Request DTOs

Request DTOs should represent what the API accepts.

Example conceptual structure:

```java
public record CreateStudentRequest(
    String studentIdentifier,
    String firstName,
    String lastName
) {}
```

Actual fields must follow the student feature specification.

Do not add speculative fields.

---

# 17. Response DTOs

Response DTOs should expose only information required by the client.

Do not expose:

- passwords
- security credentials
- internal database implementation details
- unnecessary internal identifiers
- sensitive information

---

# 18. Validation

Use Jakarta Bean Validation for request-level validation.

Examples:

```text
@NotBlank
@NotNull
@Email
@Size
@Pattern
```

Example:

```java
public record CreateStudentRequest(

    @NotBlank
    String studentIdentifier,

    @NotBlank
    String firstName

) {}
```

Validation must be meaningful to the actual domain.

---

# 19. Business Validation

Bean Validation is not sufficient for business rules.

Example:

```text
@NotBlank
```

can validate that a value exists.

It cannot determine:

```text
Does this student belong to this college?
```

That requires application/domain validation.

Therefore:

```text
Request Validation
        +
Business Validation
        +
Authorization
        +
Tenant Validation
```

must all be considered.

---

# 20. Global Exception Handling

The backend should use centralized exception handling.

Conceptual flow:

```text
Controller
    ↓
Exception
    ↓
GlobalExceptionHandler
    ↓
Standard API Error
```

The API should not expose stack traces to normal clients.

---

# 21. Error Contract

The backend should provide a consistent error structure.

Conceptual example:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Student was not found.",
  "details": {},
  "timestamp": "2026-01-01T10:00:00Z",
  "path": "/api/v1/students/123"
}
```

The final contract must remain consistent with:

```text
05-architecture/api-architecture.md
```

---

# 22. HTTP Status Conventions

Use HTTP status codes consistently.

Typical examples:

| Status | Usage |
|---|---|
| 200 | Successful retrieval/update |
| 201 | Resource created |
| 202 | Long-running operation accepted |
| 204 | Successful operation with no response body |
| 400 | Invalid request |
| 401 | Unauthenticated |
| 403 | Unauthorized |
| 404 | Resource not found |
| 409 | Conflict |
| 422 | Semantically invalid input where adopted |
| 500 | Unexpected server error |

The final API contract remains authoritative.

---

# 23. REST Controller Naming

Use resource-oriented routes.

Examples:

```text
/api/v1/students
/api/v1/colleges
/api/v1/result-imports
/api/v1/backlogs
```

Avoid action-heavy URLs when a resource-oriented operation is sufficient.

---

# 24. API Versioning

The initial API version is:

```text
/api/v1
```

Controllers should follow this version boundary.

Example:

```text
/api/v1/students
```

Future incompatible API changes should use an appropriate versioning strategy rather than silently breaking existing clients.

---

# 25. Pagination

Large collections should not return unbounded datasets.

Pagination should be used for:

- students
- colleges
- result imports
- result records
- backlogs
- analytics tables
- other potentially large collections

The pagination contract must remain consistent across the API.

---

# 26. Filtering and Searching

Filtering should be implemented explicitly.

Examples:

```text
student status
course
semester
subject
result status
backlog status
```

Do not create unrestricted dynamic database filtering without considering:

- authorization
- performance
- SQL behavior
- index requirements

---

# 27. Transaction Management

Transactions must be applied to operations requiring atomicity.

Examples:

```text
Result Processing
      ↓
Persist Result
      ↓
Update Academic State
      ↓
Update Backlog
      ↓
Commit
```

If a required atomic operation fails:

```text
Rollback
```

unless the approved processing model explicitly supports controlled partial success.

---

# 28. Result Processing Transaction Boundary

Result processing is particularly sensitive.

The implementation must prevent situations such as:

```text
Result saved
    ↓
Backlog update fails
    ↓
System reports successful processing
```

The transaction design must reflect the result-processing specification.

---

# 29. Idempotency

Retryable operations must be designed to avoid duplicate effects.

Particularly important for:

- result processing
- import processing
- background jobs
- external integrations

Conceptual requirement:

```text
Same operation
     +
Same valid identity
     ↓
Should not create unintended duplicate state
```

---

# 30. Tenant Context

Acadlytic is multi-tenant.

The college is the primary tenant boundary for college-owned academic data.

The backend must establish tenant context from trusted authentication information.

Do not trust a client-provided tenant ID as the sole authorization mechanism.

---

# 31. Tenant-Aware Request Flow

```text
HTTP Request
     ↓
Authentication
     ↓
Current User
     ↓
Role
     ↓
Tenant / College Context
     ↓
Authorization
     ↓
Application Operation
     ↓
Tenant-Scoped Data
```

---

# 32. IDOR Protection

Every object-level operation must verify authorization.

Example:

```text
GET /api/v1/students/{studentId}
```

must not simply retrieve the student by ID.

The backend must verify that the authenticated user is permitted to access that student.

---

# 33. `/me` Endpoints

Self-service operations should use `/me` where appropriate.

Examples:

```text
/api/v1/me
/api/v1/me/dashboard
/api/v1/me/results
/api/v1/me/backlogs
/api/v1/me/academic-passport
/api/v1/me/analytics
```

This reduces unnecessary client-controlled identity parameters.

---

# 34. JPA Entity Rules

Entities should represent persistence/domain state.

Avoid:

- exposing entities directly through REST
- excessive bidirectional relationships
- uncontrolled cascading
- unnecessary eager loading
- entity methods that hide significant side effects

Relationships should be designed deliberately.

---

# 35. Fetch Strategy

Default to controlled data fetching.

Avoid unnecessary:

```text
FetchType.EAGER
```

especially for large relationships.

Use:

- explicit queries
- projections
- joins where justified
- pagination
- controlled fetch plans

where appropriate.

---

# 36. N+1 Query Prevention

Before completing a feature:

- inspect generated queries
- identify repeated queries
- verify collection loading
- use appropriate joins/projections
- test realistic dataset sizes

This is especially important for:

- student lists
- academic Passport
- analytics
- result processing
- backlog views

---

# 37. Database Constraint Strategy

Important domain constraints should be reinforced at the database level where appropriate.

Examples:

- unique student identifier within required scope
- unique college code
- foreign key integrity
- required fields
- duplicate result protection

Application validation must not be the only protection for critical invariants.

---

# 38. Auditability

Important operations should be traceable.

Potential auditable actions include:

- account creation
- role changes
- college creation
- student creation
- result import
- result validation
- result processing
- backlog state changes
- security-sensitive operations

Audit design must follow the security and feature specifications.

---

# 39. Logging Rules

Logs should help diagnose problems without exposing sensitive data.

Log useful information such as:

- request correlation ID
- operation
- module
- outcome
- error category
- processing job ID

Avoid logging:

- passwords
- tokens
- credentials
- unnecessary personal data
- complete sensitive result payloads

---

# 40. Configuration Management

Use strongly typed configuration where appropriate.

Application configuration should be separated from source code.

Potential configuration groups:

```text
database
security
application
file-processing
CORS
OpenAPI
logging
jobs
```

---

# 41. Environment Profiles

At minimum:

```text
dev
prod
```

Additional environments may be introduced later.

Environment-specific configuration must not alter business behavior unexpectedly.

---

# 42. Database Connection Pool

The application should use a connection pool through the standard Spring Boot/JPA configuration.

Pool settings should be tuned only after understanding:

- deployment resources
- expected concurrent traffic
- query duration
- database capacity

Do not prematurely optimize connection settings.

---

# 43. File Processing Foundation

Result imports require file processing.

The backend must establish safe file handling before implementing result import.

Requirements include:

- file type validation
- file size limits
- safe storage
- controlled parsing
- malformed file handling
- processing status
- error reporting

Detailed import behavior belongs to:

```text
result-import.md
```

---

# 44. Background Job Foundation

Long-running operations such as result processing should not unnecessarily block HTTP requests.

The architecture supports asynchronous processing where required.

Conceptual flow:

```text
POST processing request
        ↓
Create Job
        ↓
202 Accepted
        ↓
Background Processing
        ↓
Job Status
        ↓
Completed / Failed
```

The exact background-job implementation remains an implementation decision to be finalized before development.

---

# 45. Job Status

Long-running operations should expose clear status.

For example:

```text
PENDING
RUNNING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

The exact statuses must follow the relevant feature specification.

---

# 46. OpenAPI

OpenAPI documentation should be generated from the backend API.

It should document:

- routes
- request DTOs
- response DTOs
- validation
- authentication
- authorization requirements
- error responses
- pagination
- filters

API documentation must be updated with API changes.

---

# 47. Security Baseline

Before implementing protected feature APIs:

- [ ] Authentication foundation
- [ ] Authorization foundation
- [ ] Password security
- [ ] Secure headers where appropriate
- [ ] CORS restrictions
- [ ] Input validation
- [ ] Error sanitization
- [ ] Tenant isolation
- [ ] IDOR protection
- [ ] Sensitive logging prevention

---

# 48. CORS

Development may permit the configured local frontend origin.

Production must use an explicit allowlist.

Do not use unrestricted wildcard CORS for authenticated production APIs unless explicitly justified and reviewed.

---

# 49. Authentication Boundary

Authentication should establish:

```text
Authenticated User
       ↓
User Identity
       ↓
Roles
       ↓
Tenant Context
       ↓
Authorization
```

Authentication and authorization must remain conceptually separate.

---

# 50. Authorization Boundary

Authorization determines:

> What is this authenticated user allowed to do?

Examples:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Role definitions and permissions must follow the authentication feature specification.

---

# 51. Module Communication

Modules should communicate through controlled application/domain interfaces.

Avoid:

```text
Module A
   ↓
directly modifies
   ↓
Module B's internal database state
```

Prefer:

```text
Module A
   ↓
Application/domain operation
   ↓
Module B
```

This preserves ownership boundaries.

---

# 52. Data Ownership

Backend implementation must respect:

```text
College
→ College Management

Student
→ Student Management

Course/Semester/Subject
→ Academic Structure

Import
→ Result Import

Validation
→ Result Validation

Processed Result
→ Result Processing

Backlog
→ Backlog Tracking

Passport
→ Read-oriented projection

Analytics
→ Derived layer
```

A module may consume another module's data without owning it.

---

# 53. Academic Data Integrity

The backend must preserve the following principles:

### Missing is not Zero

Do not convert unavailable academic data into:

```text
0
```

unless the source explicitly represents zero.

---

### Preserve History

Do not overwrite historical attempts merely to show a current state.

---

### No Invented Formula

Do not implement SGPA, CGPA, percentage, or university-specific academic rules without an approved source/rule.

---

### Source of Truth

Derived views must consume authoritative academic data.

---

# 54. Result Processing Boundary

The backend must distinguish:

```text
Raw Imported Data
        ↓
Normalized Data
        ↓
Validated Data
        ↓
Processed Authoritative Result
        ↓
Derived Backlog / Passport / Analytics
```

A raw imported record must not automatically become an authoritative academic result.

---

# 55. Testing Structure

Backend tests should broadly follow:

```text
src/test/java/com/acadlytic/
├── modules/
├── security/
├── common/
└── integration/
```

Test structure may evolve as modules mature.

---

# 56. Unit Testing

Unit tests should cover:

- business rules
- service behavior
- validation
- mappings
- calculations
- edge cases

Do not test implementation details unnecessarily.

---

# 57. Integration Testing

Integration tests should verify:

- database behavior
- repositories
- API behavior
- transactions
- authentication
- authorization
- tenant isolation

---

# 58. API Testing

Every important API should verify:

- valid request
- invalid request
- unauthenticated request
- unauthorized request
- wrong tenant
- missing resource
- conflict
- expected successful response

---

# 59. Backend Build Verification

The backend must pass:

```bash
mvn clean
mvn test
mvn package
```

before being considered stable for the next implementation stage.

---

# 60. Code Quality

Backend code should follow:

- meaningful names
- small focused methods
- explicit responsibilities
- minimal duplication
- clear exception handling
- controlled dependencies
- appropriate abstractions

Avoid overengineering.

---

# 61. Dependency Rules

Before adding a dependency:

1. identify the requirement
2. verify whether Spring Boot already provides the capability
3. verify whether the project already has an equivalent
4. evaluate security and maintenance
5. add only if justified

Do not add libraries simply because they are popular.

---

# 62. Backend Implementation Workflow

For each backend feature:

```text
Read Feature Specification
        ↓
Read Architecture
        ↓
Identify Data Ownership
        ↓
Design Database Impact
        ↓
Design DTOs
        ↓
Implement Repository
        ↓
Implement Domain/Application Logic
        ↓
Implement Controller
        ↓
Implement Authorization
        ↓
Implement Tests
        ↓
Review Queries
        ↓
Review Security
        ↓
Update API Documentation
```

---

# 63. Backend Foundation Acceptance Criteria

The backend foundation is complete when:

- [ ] Spring Boot application starts
- [ ] Java 21 is configured
- [ ] Maven build succeeds
- [ ] MySQL connection works
- [ ] package structure exists
- [ ] REST API foundation exists
- [ ] global exception handling exists
- [ ] validation foundation exists
- [ ] security foundation exists
- [ ] tenant-context foundation exists
- [ ] DTO approach is established
- [ ] OpenAPI foundation exists
- [ ] logging foundation exists
- [ ] test foundation exists
- [ ] no critical setup errors remain

---

# 64. Backend Foundation Definition of Done

This implementation note can be considered implemented when a clean environment can:

```text
Clone Repository
      ↓
Configure Environment
      ↓
Start MySQL
      ↓
Start Spring Boot
      ↓
Connect to Database
      ↓
Execute Test Suite
      ↓
Build Application
      ↓
Expose API
```

without requiring undocumented manual backend configuration.

---

# 65. Unresolved Implementation Decisions

The following remain open until explicitly finalized:

- authentication/session mechanism
- exact password-reset delivery mechanism
- exact background job technology
- production database hosting
- file-storage provider
- email provider
- notification infrastructure
- advanced observability platform
- caching strategy
- production scaling configuration

These decisions must not be silently introduced through implementation.

---

# 66. Relationship With Next Documents

This document establishes the backend foundation.

The next implementation notes should address:

```text
backend-foundation.md
        ↓
frontend-foundation.md
        ↓
database-setup.md
        ↓
authentication-implementation.md
```

Frontend and database implementation may proceed in parallel once their dependencies are understood.

---

# 67. AI Coding Rules for Backend Foundation

When AI is used:

- inspect existing files before modifying them
- follow the established package structure
- do not invent modules
- do not change architecture without approval
- do not introduce unnecessary dependencies
- do not expose JPA entities directly
- do not bypass authorization
- do not bypass tenant isolation
- do not invent academic formulas
- do not create destructive migrations
- generate tests with meaningful implementation
- explain significant configuration changes
- keep changes scoped to the requested task

---

# 68. Status

**Status:** Draft / Under Review

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

# 69. Final Principle

> **The backend foundation must provide a secure, modular, testable, tenant-aware platform on which Acadlytic's academic features can be implemented without compromising data ownership or academic integrity.**