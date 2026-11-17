# Acadlytic — Backend Architecture

**Project:** Acadlytic  
**Document:** Backend Architecture  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  
**Backend:** Java + Spring Boot  
**Database:** MySQL  
**ORM:** Spring Data JPA + Hibernate  
**Build Tool:** Maven  
**API Style:** REST API  

---

# 1. Purpose

This document defines the backend architecture of Acadlytic.

It describes how the Java/Spring Boot backend is structured, how modules are organized, how requests flow through the application, where business logic belongs, how modules communicate, and how security, validation, transactions, persistence, and background processing are handled.

The backend must provide a secure, maintainable, modular foundation for the Acadlytic platform.

---

# 2. Backend Architecture Goals

The backend architecture must provide:

- clear module boundaries
- maintainable Java code
- separation of concerns
- secure REST APIs
- role-based authorization
- tenant isolation
- centralized business rules
- transaction integrity
- reliable result processing
- historical academic data preservation
- scalable result import processing
- testability
- consistent error handling
- clear database access patterns
- future extensibility

The backend should support the current MVP without introducing unnecessary microservice complexity.

---

# 3. Backend Architecture Style

Acadlytic will use a:

> **Modular Monolith Architecture**

The backend will initially run as a single Spring Boot application while maintaining clear internal module boundaries.

```text
                    Acadlytic Backend
                           │
              ┌────────────┴────────────┐
              │     Spring Boot App     │
              └────────────┬────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
   Auth Module       College Module      Student Module
       │                   │                   │
 Academic Module     Result Module       Backlog Module
       │                   │                   │
 Passport Module     Analytics Module    Import Module
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                     MySQL Database
```

Microservices are **not required for the MVP**.

---

# 4. Why Modular Monolith

A modular monolith is preferred because:

- the project is initially developed as one platform
- modules have strong relationships
- academic processing requires transactional consistency
- deployment is simpler
- development and debugging are easier
- infrastructure requirements are lower
- database transactions are easier to manage
- unnecessary distributed-system complexity is avoided

The internal module boundaries should still be strong enough to allow future extraction into services if required.

---

# 5. Backend Technology Stack

## 5.1 Core Backend

| Technology | Purpose |
|---|---|
| Java | Backend programming language |
| Spring Boot | Application framework |
| Spring Web | REST APIs |
| Spring Security | Authentication and authorization |
| Spring Data JPA | Persistence abstraction |
| Hibernate | ORM |
| Maven | Build and dependency management |
| MySQL | Relational database |
| Bean Validation | Request/data validation |
| Jackson | JSON serialization/deserialization |

---

# 6. Supporting Technologies

The following technologies may be used where required:

- Flyway or Liquibase for database migrations
- Apache POI for Excel processing
- OpenCSV for CSV processing
- Spring Scheduler for scheduled tasks
- Spring Batch for large-scale batch processing where required
- Springdoc OpenAPI for API documentation
- Redis for future caching/background-processing support
- JUnit for unit testing
- Mockito for mocking
- Testcontainers for integration testing

Technology should only be added when it solves an actual project requirement.

---

# 7. Backend Request Flow

A normal API request should follow this structure:

```text
React Frontend
      ↓
HTTP Request
      ↓
Controller
      ↓
Authentication / Authorization
      ↓
Request Validation
      ↓
Application Service
      ↓
Domain / Business Logic
      ↓
Repository
      ↓
JPA / Hibernate
      ↓
MySQL
      ↓
Repository
      ↓
Service
      ↓
Response DTO
      ↓
Controller
      ↓
JSON Response
      ↓
React Frontend
```

Controllers must not contain business logic.

---

# 8. Backend Layered Architecture

Each backend module should generally follow:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Where necessary, domain-specific components may exist between the service and repository layers.

Recommended structure:

```text
Controller
    ↓
Application Service
    ↓
Domain Logic
    ↓
Repository
    ↓
Persistence
```

---

# 9. Controller Layer

Controllers are responsible for:

- receiving HTTP requests
- mapping URL parameters
- receiving request DTOs
- triggering request validation
- invoking application services
- returning response DTOs
- selecting appropriate HTTP status codes

Controllers must not:

- contain complex business rules
- directly access repositories
- directly modify database entities
- perform large result-processing operations
- calculate academic rules
- implement authorization manually in every method

Example:

```java
@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/{studentId}")
    public StudentResponse getStudent(
            @PathVariable Long studentId) {

        return studentService.getStudent(studentId);
    }
}
```

---

# 10. Service Layer

The service layer contains application-level business operations.

Responsibilities include:

- business workflows
- authorization-aware operations
- transaction boundaries
- coordinating multiple repositories
- coordinating multiple modules
- enforcing business rules
- triggering domain operations
- handling application workflows

Example:

```text
ResultProcessingService
        │
        ├── validate processing state
        ├── load validated records
        ├── process result attempts
        ├── update academic records
        ├── update backlog
        ├── update calculations
        └── update academic passport
```

---

# 11. Repository Layer

Repositories are responsible for persistence operations.

Spring Data JPA will be used for database access.

Repositories should:

- query entities
- save entities
- update entities
- delete where explicitly permitted
- perform optimized database queries
- support pagination
- support filtering

Repositories must not contain business workflows.

Example:

```java
public interface StudentRepository
        extends JpaRepository<Student, Long> {

    Optional<Student> findByUniversityIdentifier(
            String universityIdentifier
    );
}
```

---

# 12. Entity Layer

JPA entities represent persistent database data.

Entities should contain:

- identifiers
- persistent fields
- relationships
- persistence mappings
- necessary entity-level behavior

Entities should not become containers for large application workflows.

Example:

```text
Student
 ├── id
 ├── college
 ├── universityIdentifier
 ├── name
 ├── email
 ├── status
 ├── createdAt
 └── updatedAt
```

---

# 13. DTO Architecture

The backend must use DTOs for API communication.

JPA entities should not normally be returned directly from controllers.

Recommended structure:

```text
Request DTO
    ↓
Controller
    ↓
Service
    ↓
Entity
    ↓
Repository
    ↓
Entity
    ↓
Mapper
    ↓
Response DTO
```

Benefits:

- prevents accidental entity exposure
- avoids leaking internal fields
- provides stable API contracts
- separates database structure from API structure
- improves security
- makes API evolution easier

---

# 14. Request DTOs

Request DTOs represent client input.

Examples:

```text
LoginRequest
CreateCollegeRequest
UpdateCollegeRequest
CreateStudentRequest
CreateCourseRequest
ResultImportRequest
ProcessResultRequest
ChangePasswordRequest
```

Request DTOs must use validation annotations where applicable.

Example:

```java
public class CreateStudentRequest {

    @NotBlank
    private String universityIdentifier;

    @NotBlank
    private String name;

    @Email
    private String email;
}
```

---

# 15. Response DTOs

Response DTOs represent API output.

Examples:

```text
UserResponse
CollegeResponse
StudentResponse
ResultResponse
BacklogResponse
AcademicPassportResponse
AnalyticsDashboardResponse
ImportJobResponse
```

Only fields required by the API contract should be returned.

---

# 16. Backend Modules

The backend will contain the following major modules:

```text
modules/
├── auth/
├── users/
├── colleges/
├── students/
├── academic/
├── results/
├── backlogs/
├── passport/
└── analytics/
```

Result import and processing functionality may be organized under the `results` module or separated into dedicated submodules depending on implementation complexity.

---

# 17. Authentication Module

The Authentication module owns:

- login
- logout
- authentication state
- password management
- account status validation
- authentication security
- current-user context

It must integrate with Spring Security.

Authentication must not be implemented independently inside each business module.

---

# 18. Authorization

Authorization determines whether an authenticated user may perform an operation.

Primary roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Authorization must be enforced on the backend.

Frontend route protection is not sufficient.

---

# 19. Tenant Isolation

College is the primary tenant boundary.

College-specific operations must verify the user's tenant context.

Example:

```text
Authenticated User
       ↓
User → College
       ↓
Requested Resource
       ↓
Resource College
       ↓
Compare Tenant Context
       ↓
Allow / Deny
```

A user must never access another college's protected data simply by changing an ID in the request.

---

# 20. IDOR Protection

The backend must protect against insecure direct object references.

For example:

```text
GET /api/v1/students/101
```

must not automatically mean that every authenticated user can access student `101`.

The backend must verify:

```text
Authenticated User
        ↓
Role
        ↓
College/Tenant
        ↓
Requested Student
        ↓
Authorization
```

---

# 21. Current User Context

Spring Security should provide the authenticated user context to the application.

Business modules should not trust:

```text
userId
collegeId
role
```

sent by the frontend when these values can be derived from the authenticated session/token.

The backend should derive security-sensitive identity from the authenticated context.

---

# 22. College Management Module

The College Management module owns:

- college creation
- college profile
- college status
- college administration assignment
- college-specific configuration

Primary responsibilities:

```text
CollegeController
CollegeService
CollegeRepository
CollegeEntity
CollegeMapper
```

---

# 23. Student Management Module

The Student Management module owns:

- student identity
- student profile
- student lifecycle
- student status
- student-college association
- student academic enrollment references where applicable

Student identity must not be duplicated across Result Import, Analytics, or Academic Passport modules.

---

# 24. Academic Structure Module

The Academic Structure module owns:

- university
- courses/programs
- academic years
- semesters
- subjects
- credits
- academic structure relationships

Conceptually:

```text
University
    ↓
Course / Program
    ↓
Academic Year
    ↓
Semester
    ↓
Subjects
```

Exact relationships will be finalized in the database architecture.

---

# 25. Result Import Module

The Result Import module owns the import workflow.

Responsibilities:

- file upload
- file metadata
- import job
- parsing
- raw imported records
- column mapping
- normalization
- import status
- import errors
- import history

Flow:

```text
Excel / CSV
    ↓
Upload
    ↓
Import Job
    ↓
Parsing
    ↓
Normalization
    ↓
Validation
```

The import module must not directly bypass Result Validation and Result Processing.

---

# 26. Result Validation Module

The Result Validation module is responsible for determining whether imported records are valid for processing.

It validates:

- required fields
- student identity
- subject identity
- course
- semester
- academic year
- marks
- grades
- result status
- duplicates
- attempt information
- configured business rules

Validation must not directly create the final academic result.

---

# 27. Result Processing Module

The Result Processing module owns the processing workflow for validated results.

Responsibilities include:

- processing valid result records
- preserving attempt history
- updating academic result records
- coordinating academic calculations
- triggering backlog updates
- updating academic passport projections where applicable
- maintaining processing status
- ensuring idempotency
- maintaining transaction integrity

Conceptual flow:

```text
Validated Result
      ↓
Result Processing Service
      ↓
Academic Result
      ↓
Attempt History
      ↓
Calculation
      ↓
Backlog Update
      ↓
Academic Passport Update
```

---

# 28. Result Processing Transaction

Result processing can affect multiple academic domains.

Where consistency requires it, processing should execute within controlled database transactions.

Example:

```text
Process Result
      │
      ├── Save Result Attempt
      ├── Update Current Outcome
      ├── Update SGPA/CGPA
      ├── Update Backlog
      └── Update Academic Passport
             │
             ↓
        Transaction Commit
```

If the operation fails before commit, the transaction should roll back where the operation is designed as atomic.

Large imports should use controlled batch transactions rather than one enormous transaction.

---

# 29. Backlog Module

The Backlog module owns:

- backlog records
- active backlog state
- backlog lifecycle
- backlog clearing
- backlog history

Result Processing may trigger a backlog operation, but it does not become the owner of backlog state.

Example:

```text
Result Processing
        ↓
Backlog Service
        ↓
Backlog Record
```

This prevents multiple modules from independently changing backlog state.

---

# 30. Academic Calculation Responsibility

SGPA and CGPA calculations must be handled by an authoritative academic calculation responsibility.

The backend must not invent university-specific formulas.

The architecture should allow calculation rules to be configured or extended based on the applicable academic regulation.

Conceptually:

```text
Processed Academic Results
          ↓
Academic Calculation
          ↓
SGPA / CGPA
```

Detailed calculation rules belong to the appropriate academic calculation specification and database model.

---

# 31. Academic Passport Module

Academic Passport is a read-oriented academic representation.

It should not become a second source of truth for academic results.

Preferred flow:

```text
Authoritative Academic Data
          ↓
Academic Passport Service
          ↓
Passport Response
```

If a projection/read model is introduced later, it must remain derived from authoritative academic records.

---

# 32. Analytics Module

Analytics is a read/analysis layer.

It may calculate:

- student performance
- SGPA trends
- CGPA summaries
- backlog statistics
- pass/fail statistics
- subject performance
- course summaries
- semester summaries
- college-level KPIs

Analytics must not modify authoritative academic data.

```text
Academic Data
     ↓
Analytics Queries
     ↓
Aggregations
     ↓
Analytics Response
```

---

# 33. Cross-Module Communication

Modules should communicate through application/domain services rather than directly manipulating another module's entities.

Bad:

```text
AnalyticsService
    ↓
Directly modifies StudentEntity
```

Good:

```text
ResultProcessingService
    ↓
BacklogService
    ↓
Backlog operation
```

The owner module remains responsible for its own data.

---

# 34. Dependency Direction

The dependency direction should remain controlled.

Conceptually:

```text
Controller
    ↓
Application Service
    ↓
Domain / Module Service
    ↓
Repository
    ↓
Database
```

Cross-module dependencies should be explicit.

Avoid circular dependencies:

```text
Module A → Module B → Module A
```

If circular dependencies appear, the domain boundary should be reviewed.

---

# 35. Common Package

Shared technical functionality may exist under:

```text
common/
```

Examples:

```text
common/
├── dto/
├── enums/
├── exception/
├── response/
├── validation/
├── audit/
├── security/
└── util/
```

The common package must contain genuinely shared infrastructure.

Business logic must remain inside its owning module.

---

# 36. Exception Handling

The application should use centralized exception handling.

Recommended approach:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    ...
}
```

The backend should return a consistent error structure.

Example:

```json
{
  "timestamp": "2026-10-04T12:00:00Z",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "The request contains invalid data.",
  "path": "/api/v1/students"
}
```

Internal stack traces must not be exposed to clients.

---

# 37. Business Exceptions

Business-specific failures should use meaningful application exceptions.

Examples:

```text
StudentNotFoundException
CollegeNotFoundException
DuplicateStudentException
InvalidResultException
ResultProcessingException
UnauthorizedOperationException
TenantAccessDeniedException
ImportValidationException
```

These should map to standardized API error responses.

---

# 38. Validation

Validation occurs at multiple levels.

```text
Request Validation
        ↓
Business Validation
        ↓
Domain Validation
        ↓
Database Constraints
```

Each level serves a different purpose.

### Request validation

Checks basic input.

Examples:

- required field
- string length
- email format
- numeric format

### Business validation

Checks application rules.

Examples:

- student belongs to college
- duplicate university identifier
- result belongs to correct semester

### Database constraints

Protect data integrity.

Examples:

- primary keys
- foreign keys
- unique constraints
- not-null constraints

---

# 39. Transaction Management

Spring's transaction management should be used.

Typical transactional operations include:

```text
Create Student
Update College
Create Academic Structure
Process Result
Update Backlog
Change Account Status
```

Example:

```java
@Transactional
public void processResult(...) {
    ...
}
```

Transaction boundaries should be placed around business operations rather than individual repository calls.

---

# 40. Concurrency

The backend must consider concurrent operations.

Examples:

```text
Two admins process the same import
Two users update the same record
Two jobs process the same result
```

The implementation should use appropriate:

- unique constraints
- transaction isolation
- locking where required
- idempotency
- status checks

Do not introduce locking everywhere without a demonstrated concurrency requirement.

---

# 41. Idempotency

Operations that may be retried must be designed to avoid duplicate effects.

This is particularly important for:

- result processing
- import processing
- background jobs
- external integrations
- payment-related operations in future versions

Example:

```text
Same Result
    ↓
Same Processing Request
    ↓
Existing Processed Identity
    ↓
Do Not Create Duplicate Academic Result
```

---

# 42. Background Processing

Large operations should not block normal HTTP requests.

Examples:

- large Excel imports
- result validation
- result processing
- bulk calculations
- future university synchronization

Conceptual flow:

```text
HTTP Request
     ↓
Create Job
     ↓
Return 202 Accepted
     ↓
Background Worker
     ↓
Process Job
     ↓
Update Job Status
```

The frontend can retrieve job status through an API.

---

# 43. Import Processing

Result import processing should be designed as a controlled pipeline:

```text
Upload
  ↓
Create Import Job
  ↓
Parse
  ↓
Normalize
  ↓
Validate
  ↓
Preview
  ↓
Process
  ↓
Complete
```

The backend must prevent the frontend from directly inserting result records into authoritative academic tables.

---

# 44. File Processing Security

Uploaded files are untrusted input.

The backend must validate:

- file type
- file extension
- file size
- content structure
- required columns
- malformed records

Uploaded files should not be executed.

Temporary files should be handled securely and removed according to the application's retention policy.

---

# 45. API Security

The backend must enforce:

- authentication
- authorization
- tenant isolation
- IDOR protection
- input validation
- secure password handling
- rate limiting where required
- secure file handling
- safe error responses
- audit logging for sensitive actions

Security must be enforced server-side.

---

# 46. Password Security

Passwords must never be stored as plaintext.

Spring Security's password encoding facilities should be used.

Conceptually:

```text
Plain Password
      ↓
Password Encoder
      ↓
Password Hash
      ↓
MySQL
```

The application should use a modern password hashing algorithm supported by the chosen Spring Security configuration.

---

# 47. Audit Logging

Important operations should generate audit events.

Examples:

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
ACCOUNT_STATUS_CHANGED
```

Audit records should contain enough information to understand:

- who performed the action
- what action occurred
- which resource was affected
- when it happened
- relevant tenant context
- operation outcome

---

# 48. Logging

Application logs should support:

- debugging
- operational monitoring
- error investigation
- security investigation

Logs must not expose sensitive information.

Never log:

- passwords
- authentication secrets
- access tokens
- sensitive personal data unnecessarily
- complete uploaded files

---

# 49. Request Correlation

Requests should have a correlation/request ID.

Conceptually:

```text
Frontend Request
      ↓
Request ID
      ↓
Controller
      ↓
Service
      ↓
Repository
      ↓
Logs
```

This allows a single operation to be traced across backend logs.

---

# 50. Configuration Management

Configuration must not be hard-coded into Java classes.

Use Spring configuration:

```text
application.yml
application-dev.yml
application-prod.yml
```

Environment-specific secrets should be supplied through environment variables or a secure secret-management mechanism.

Examples:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
```

Secrets must not be committed to Git.

---

# 51. Environment Separation

The application should support separate environments:

```text
Development
     ↓
Testing
     ↓
Staging / Preview
     ↓
Production
```

Production credentials and data must never be used casually in development.

---

# 52. Database Access

The backend will use:

```text
Spring Data JPA
        ↓
Hibernate
        ↓
JDBC
        ↓
MySQL
```

Repositories should use optimized queries where necessary.

Avoid unnecessary entity loading and N+1 query problems.

---

# 53. N+1 Query Prevention

The backend must identify and prevent N+1 query patterns.

For example:

```text
Load 100 students
      ↓
100 additional college queries
```

should be avoided.

Use appropriate:

- joins
- fetch strategies
- projections
- optimized repository queries
- batch fetching

Do not use eager loading everywhere as a blanket solution.

---

# 54. Pagination

Large collections must be paginated.

Examples:

```text
Students
Results
Backlogs
Import Records
Audit Logs
Analytics records where applicable
```

Spring Data's `Pageable` can be used.

Example:

```java
Page<Student> findAll(Pageable pageable);
```

---

# 55. Search and Filtering

Search/filtering should be implemented server-side for large datasets.

Examples:

```text
Student search
College search
Result filtering
Backlog filtering
Import history filtering
Analytics filtering
```

The frontend should not download an entire dataset just to perform filtering.

---

# 56. API Response Mapping

The backend should use dedicated mapping logic where needed.

Conceptually:

```text
Entity
  ↓
Mapper
  ↓
Response DTO
```

Mapping logic should not be duplicated across multiple controllers.

---

# 57. Backend Package Structure

Recommended initial structure:

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

# 58. Module-Level Package Structure

Each module should generally follow:

```text
students/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── mapper/
├── validation/
└── exception/
```

Example:

```text
students/
├── controller/
│   └── StudentController.java
│
├── service/
│   └── StudentService.java
│
├── repository/
│   └── StudentRepository.java
│
├── entity/
│   └── Student.java
│
├── dto/
│   ├── CreateStudentRequest.java
│   └── StudentResponse.java
│
├── mapper/
│   └── StudentMapper.java
│
└── validation/
    └── StudentValidator.java
```

The exact package structure may evolve as the module becomes more complex.

---

# 59. Authentication Package Structure

Conceptually:

```text
auth/
├── controller/
├── service/
├── dto/
├── security/
├── entity/
├── repository/
└── mapper/
```

Security configuration that applies globally may remain under the root `security/` package.

---

# 60. Result Module Structure

Result processing is expected to be one of the most complex modules.

A possible structure:

```text
results/
├── controller/
├── service/
│   ├── import/
│   ├── validation/
│   └── processing/
├── repository/
├── entity/
├── dto/
├── mapper/
├── validation/
└── calculation/
```

This structure should be refined during implementation based on actual complexity.

---

# 61. Academic Calculation Boundary

Academic calculation code should not be scattered throughout:

```text
ResultController
StudentService
BacklogService
AnalyticsService
```

Instead, calculation responsibilities should have a clear boundary.

Conceptually:

```text
academic/
└── calculation/
    ├── service/
    ├── rules/
    └── model/
```

The exact implementation depends on the final academic calculation architecture.

---

# 62. Database Migration

Database schema changes must be version controlled.

A migration tool such as:

```text
Flyway
```

or

```text
Liquibase
```

should be selected before implementation.

Example migration sequence:

```text
V1__create_users.sql
V2__create_colleges.sql
V3__create_students.sql
V4__create_academic_structure.sql
...
```

The chosen migration tool becomes the authoritative mechanism for schema evolution.

---

# 63. Database Schema Responsibility

The backend must follow the database architecture and data ownership rules.

Backend code must not introduce new persistent entities casually.

Before adding a new entity, determine:

```text
Why does this data exist?
        ↓
Which module owns it?
        ↓
Is it authoritative or derived?
        ↓
Does it already exist?
        ↓
What relationships does it have?
```

---

# 64. Backend and Data Ownership

The backend is responsible for enforcing the data ownership architecture.

Example:

```text
Student Management
       ↓
Student data authority

Backlog Tracking
       ↓
Backlog authority

Result Processing
       ↓
Processed academic result authority

Analytics
       ↓
Derived analytics only
```

A module must not silently become the owner of another module's data.

---

# 65. Backend and API Architecture

The backend implements the contracts defined by:

```text
api-architecture.md
```

API architecture defines:

- endpoints
- HTTP methods
- request/response concepts
- status codes
- API conventions

Backend architecture defines:

- how those APIs are implemented
- controllers
- services
- repositories
- domain logic
- transactions
- security
- persistence

---

# 66. Backend and Frontend

React communicates with the backend through REST APIs.

```text
React
   ↓
HTTP / JSON
   ↓
Spring Boot REST Controller
   ↓
Service
   ↓
Database
```

The frontend must not directly access MySQL.

---

# 67. Backend and Academic Passport

Academic Passport should consume authoritative academic information.

```text
Result Processing
       ↓
Authoritative Academic Data
       ↓
Academic Passport Service
       ↓
Student Passport API
```

The Passport module must not independently modify academic results.

---

# 68. Backend and Analytics

Analytics should query authoritative data.

```text
Students
Results
Backlogs
Academic Structure
        ↓
Analytics Service
        ↓
Aggregate Queries
        ↓
Analytics DTO
```

Analytics should not update academic records.

---

# 69. Backend and Student Portal

The Student Portal is primarily a frontend/access layer.

Student-specific APIs should prefer:

```text
/api/v1/me/...
```

where appropriate.

Example:

```text
GET /api/v1/me
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

The backend must derive the student identity from the authenticated user.

---

# 70. Testing Architecture

The backend should contain:

```text
Unit Tests
Integration Tests
API Tests
Security Tests
Repository Tests
Business Rule Tests
```

Important areas include:

- authentication
- authorization
- tenant isolation
- student ownership
- result validation
- result processing
- backlog lifecycle
- academic calculations
- import processing
- duplicate prevention

---

# 71. Unit Testing

Unit tests should test isolated business logic.

Examples:

```text
StudentServiceTest
ResultValidationServiceTest
BacklogServiceTest
AcademicCalculationServiceTest
```

External dependencies should be mocked where appropriate.

---

# 72. Integration Testing

Integration tests should verify interactions between:

```text
Service
   ↓
Repository
   ↓
MySQL
```

Testcontainers may be used to run MySQL during integration testing.

---

# 73. Security Testing

Security tests must verify:

- unauthenticated requests are rejected
- unauthorized roles are rejected
- tenant isolation works
- students cannot access another student's data
- college admins cannot access another college
- protected endpoints require authentication
- sensitive operations require appropriate roles

---

# 74. Result Processing Testing

Result processing requires particularly strong testing.

Test scenarios should include:

```text
Valid result
Invalid result
Duplicate result
Failed subject
Passed subject
Supplementary pass
Repeated attempt
Existing backlog
Cleared backlog
Partial import
Retry
Concurrent processing
Processing failure
Transaction rollback
```

---

# 75. Performance Considerations

The backend should be designed for:

- large student datasets
- large result files
- bulk processing
- pagination
- aggregate analytics queries
- controlled background processing

Performance optimization should be evidence-driven.

Avoid premature optimization.

---

# 76. Caching

Caching is not required for every backend operation.

Potential future caching candidates include:

- academic structure reference data
- frequently accessed dashboard data
- configuration
- read-heavy analytics

Caching must never create a conflicting source of truth.

Authoritative writes must update the actual database first.

---

# 77. API Documentation

Springdoc OpenAPI should be considered for API documentation.

The API documentation should describe:

- endpoints
- request parameters
- request DTOs
- response DTOs
- status codes
- authentication requirements
- error responses

API documentation must remain synchronized with implementation.

---

# 78. Backend Configuration Rules

Configuration should be externalized.

Do not hard-code:

```text
Database passwords
JWT secrets
API secrets
Storage credentials
Production URLs
```

Use environment-specific configuration.

---

# 79. Deployment Architecture

Initial deployment can follow:

```text
                    Internet
                       │
                       ↓
                  Reverse Proxy
                       │
                       ↓
                Spring Boot App
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
           MySQL              Storage
```

React frontend can be deployed separately.

Example:

```text
React Frontend
      ↓
Spring Boot API
      ↓
MySQL
```

---

# 80. Backend Scalability

The modular monolith should remain stateless where possible.

This allows future horizontal scaling:

```text
                Load Balancer
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Backend    Backend    Backend
          │          │          │
          └──────────┼──────────┘
                     ↓
                   MySQL
```

Session/authentication design should support this architecture.

---

# 81. Future Microservice Extraction

If Acadlytic grows significantly, some modules could potentially become independent services.

Possible candidates:

```text
Result Processing Service
Import Processing Service
Analytics Service
Notification Service
University Integration Service
```

However, this is a future architectural option.

The MVP must remain a modular monolith unless actual scale or organizational requirements justify extraction.

---

# 82. University Integration Boundary

Future university integrations must not be embedded throughout the backend.

Use an integration boundary.

Conceptually:

```text
University Integration
        ↓
University Connector
        ↓
Common Result Model
        ↓
Result Import / Processing
```

Possible future connectors:

```text
OUConnector
JNTUHConnector
GenericFileConnector
```

The exact university integrations are outside the current MVP.

---

# 83. Backend Coding Principles

Backend code must follow:

- single responsibility
- clear module ownership
- dependency inversion where appropriate
- low coupling
- high cohesion
- meaningful naming
- small focused methods
- reusable services
- DTO-based API contracts
- centralized exception handling
- explicit transaction boundaries
- secure defaults

---

# 84. Backend Anti-Patterns

Avoid:

### Fat Controllers

```text
Controller
 ├── validation
 ├── business logic
 ├── database calls
 └── calculations
```

### Direct Controller-to-Repository

```text
Controller
     ↓
Repository
```

### Entity Exposure

```text
Controller
     ↓
JPA Entity
```

### Cross-Module Database Mutation

```text
Analytics
     ↓
Directly modifies Backlog table
```

### Business Logic in Frontend

```text
React
     ↓
Calculates official CGPA
```

Official academic rules must be enforced by the backend.

---

# 85. Backend Security Rules

The backend must:

1. authenticate protected requests
2. authorize every protected operation
3. enforce tenant isolation
4. prevent IDOR
5. validate all external input
6. protect passwords
7. protect secrets
8. prevent SQL injection through safe persistence mechanisms
9. validate uploaded files
10. avoid sensitive logging
11. return safe error messages
12. audit sensitive operations
13. protect administrative endpoints
14. enforce server-side business rules

---

# 86. AI Coding Agent Rules

AI coding agents working on the backend must:

- read `data-ownership.md`
- read relevant feature specifications
- read `api-architecture.md`
- read `database-architecture.md`
- follow the defined module ownership
- never invent academic formulas
- never bypass authorization
- never bypass tenant isolation
- never directly modify another module's data
- use DTOs for APIs
- use services for business workflows
- use repositories for persistence
- respect transaction boundaries
- preserve historical academic records
- avoid duplicate result processing
- write tests for new business logic
- avoid unnecessary dependencies
- avoid unnecessary architectural changes

AI agents must not silently change architecture decisions.

---

# 87. Backend Development Workflow

Each backend feature should follow:

```text
Feature Specification
        ↓
Data Ownership Check
        ↓
Database Model Check
        ↓
API Contract Check
        ↓
Backend Design
        ↓
Entity / Repository
        ↓
Service / Business Logic
        ↓
Controller
        ↓
Validation
        ↓
Security
        ↓
Tests
        ↓
Code Review
```

---

# 88. Backend Feature Definition of Done

A backend feature is complete only when:

- requirements are implemented
- correct module owns the functionality
- API contract is implemented
- DTOs are defined
- validation is implemented
- authorization is implemented
- tenant isolation is verified
- database operations are implemented
- transactions are correctly defined
- errors are handled
- audit requirements are handled
- unit tests exist
- integration/API tests exist where appropriate
- security tests exist where applicable
- documentation is updated
- no known critical defects remain

---

# 89. Important Architecture Decisions

The backend architecture establishes these decisions:

| Decision | Choice |
|---|---|
| Backend Language | Java |
| Framework | Spring Boot |
| Architecture | Modular Monolith |
| API | REST |
| ORM | Hibernate |
| Persistence | Spring Data JPA |
| Database | MySQL |
| Build Tool | Maven |
| Security | Spring Security |
| API Documentation | OpenAPI / Springdoc |
| File Processing | Apache POI / OpenCSV |
| Testing | JUnit + Mockito |
| Large Job Processing | Background processing / Spring Batch where required |

---

# 90. Unresolved Decisions

The following should be finalized during the corresponding architecture/design work:

- JWT vs session-based authentication strategy
- exact Spring Security configuration
- Flyway vs Liquibase
- exact MySQL schema
- UUID vs numeric ID strategy
- background job implementation
- file storage strategy
- Redis requirement
- exact academic calculation model
- university master-data model
- student enrollment model
- audit-log persistence model
- production infrastructure
- backup strategy
- monitoring/observability stack

These decisions must not be silently invented during feature implementation.

---

# 91. Backend Architecture Flow

The overall backend architecture is:

```text
                    React Frontend
                           │
                           ↓
                    REST API / JSON
                           │
                           ↓
                    Spring Security
                           │
                           ↓
                       Controller
                           │
                           ↓
                    Application Service
                           │
              ┌────────────┴────────────┐
              ↓                         ↓
        Business Rules            Domain Operations
              │                         │
              └────────────┬────────────┘
                           ↓
                       Repository
                           │
                           ↓
                   Spring Data JPA
                           │
                           ↓
                       Hibernate
                           │
                           ↓
                         MySQL
```

For asynchronous operations:

```text
React
  ↓
REST API
  ↓
Create Job
  ↓
202 Accepted
  ↓
Background Processing
  ↓
Result / Import Processing
  ↓
MySQL
  ↓
Job Status API
  ↓
React
```

---

# 92. Relationship With Architecture Documents

Backend Architecture depends on:

```text
Feature Specifications
        ↓
Data Ownership
        ↓
Database Architecture
        ↓
API Architecture
        ↓
Backend Architecture
```

Backend Architecture then guides:

```text
Development
    ↓
Testing
    ↓
Security Review
    ↓
Deployment
```

---

# 93. Final Backend Architecture

Acadlytic will use a **Java + Spring Boot modular monolith** backed by **MySQL**.

The backend will follow:

```text
React
  ↓
REST API
  ↓
Spring Security
  ↓
Controllers
  ↓
Application Services
  ↓
Business / Domain Logic
  ↓
Repositories
  ↓
Spring Data JPA / Hibernate
  ↓
MySQL
```

Core principles:

- modular architecture
- clear ownership
- DTO-based APIs
- service-oriented business logic
- repository-based persistence
- centralized security
- tenant isolation
- transaction integrity
- historical data preservation
- asynchronous processing for large jobs
- backend-enforced academic rules
- testable and maintainable Java code

---

# 94. Document Status

**Document:** Backend Architecture  
**Project:** Acadlytic  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

This document defines the backend architectural direction for the current Acadlytic MVP.

Detailed implementation decisions must remain consistent with:

- Product Requirements
- Functional Requirements
- Feature Specifications
- Data Ownership
- Database Architecture
- API Architecture
- Security Rules
- Project Coding Rules