# Backend Rules

**Project:** Acadlytic  
**Document:** Backend Development Rules  
**Path:** `07-project-rules/backend-rules.md`  
**Status:** Draft / Under Review  
**Applies To:** Spring Boot backend, Java code, REST APIs, persistence, background processing, integrations, security, and backend tests

---

## 1. Purpose

This document defines the engineering rules for developing the Acadlytic backend.

The backend is responsible for:

- authentication and authorization
- tenant isolation
- API contracts
- business logic
- academic data processing
- result import and processing
- backlog management
- Academic Passport data
- analytics
- persistence
- integrations
- background jobs
- validation
- auditing
- security
- error handling

These rules ensure that backend code remains:

- maintainable
- testable
- secure
- modular
- predictable
- scalable
- consistent with the Acadlytic architecture
- aligned with the defined feature specifications

---

# 2. Backend Technology Baseline

The backend baseline is:

| Area | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot |
| Security | Spring Security |
| Persistence | Spring Data JPA |
| ORM | Hibernate |
| Database | MySQL |
| Build | Maven |
| Validation | Jakarta Bean Validation |
| API | REST/JSON |
| Documentation | OpenAPI |
| Excel Processing | Apache POI |
| CSV Processing | OpenCSV |
| Background Processing | Spring Scheduler / Spring Batch where appropriate |
| Testing | JUnit + Spring testing support |
| Containers | Docker |

Dependencies must be added only when they solve a concrete project requirement.

Avoid adding libraries simply because they are popular.

---

# 3. Architectural Style

Acadlytic uses a **modular monolith** for the initial implementation.

The backend must not be implemented as an uncontrolled collection of unrelated classes.

The preferred structure is:

```text
Controller
    ↓
Application Service
    ↓
Domain / Business Logic
    ↓
Repository
    ↓
Database
```

Where required:

```text
Controller
    ↓
Application Service
    ↓
Domain Service
    ↓
Repository
```

Infrastructure concerns such as external integrations, file storage, email, and connectors should remain behind appropriate abstractions.

---

# 4. Backend Module Structure

The backend should follow feature/module boundaries.

Recommended structure:

```text
com.acadlytic
│
├── config/
├── security/
├── common/
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

Each module should contain only code belonging to that module.

Example:

```text
students/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── mapper/
└── ...
```

The exact package arrangement may evolve, but module ownership must remain clear.

---

# 5. Module Boundaries

Each module owns its own business rules and data operations.

Examples:

| Module | Responsibility |
|---|---|
| Auth | Authentication and account lifecycle |
| Users | User identity and user administration |
| Colleges | College and tenant management |
| Students | Student records |
| Academic | Courses, semesters, subjects and academic structure |
| Results | Import, validation and processing |
| Backlogs | Backlog lifecycle |
| Passport | Academic Passport read model |
| Analytics | Derived academic analytics |

A module must not silently take ownership of another module's data.

---

# 6. Naming Rules

Use clear Java naming conventions.

### Classes

Use PascalCase:

```java
StudentService
ResultImportService
AcademicPassportService
CollegeController
```

### Methods

Use camelCase:

```java
findStudentById()
processResultImport()
calculateSemesterSummary()
```

### Variables

Use meaningful names:

```java
studentId
importJobId
semesterId
validationStatus
```

Avoid:

```java
x
data
temp
obj
value
```

unless the scope genuinely makes the meaning obvious.

---

# 7. Controllers

Controllers are responsible for HTTP concerns.

Controllers may handle:

- request mapping
- authentication context extraction
- request DTO binding
- request validation
- response DTOs
- HTTP status codes

Controllers must not contain substantial business logic.

### Bad

```java
@PostMapping
public Result process(ResultRequest request) {
    // 100 lines of business logic
}
```

### Preferred

```java
@PostMapping
public ResponseEntity<ResultResponse> process(
        @Valid @RequestBody ResultRequest request) {

    return ResponseEntity.ok(
        resultService.process(request)
    );
}
```

Business decisions belong in the service/domain layer.

---

# 8. REST API Rules

API conventions must follow `api-architecture.md`.

Base path:

```text
/api/v1
```

Use resource-oriented URLs.

Preferred:

```text
GET    /api/v1/students
GET    /api/v1/students/{studentId}
POST   /api/v1/students
PUT    /api/v1/students/{studentId}
```

Avoid action-heavy URLs when a resource-oriented design is possible.

For explicit operations, action endpoints may be used where they represent a domain command:

```text
POST /api/v1/result-imports/{importId}/validate
POST /api/v1/result-imports/{importId}/process
PATCH /api/v1/colleges/{collegeId}/status
```

---

# 9. HTTP Status Codes

Use HTTP status codes consistently.

| Situation | Status |
|---|---:|
| Successful GET | 200 |
| Successful update | 200 |
| Successful creation | 201 |
| Accepted asynchronous job | 202 |
| Successful deletion where applicable | 204 |
| Invalid request | 400 |
| Unauthenticated | 401 |
| Unauthorized | 403 |
| Resource not found | 404 |
| Conflict | 409 |
| Validation failure | 422 where appropriate |
| Unexpected server failure | 500 |

Do not return `200 OK` for every situation.

---

# 10. DTO Rules

Do not expose JPA entities directly through REST APIs.

Use:

```text
Request DTO
    ↓
Service
    ↓
Entity
```

and:

```text
Entity
    ↓
Mapper
    ↓
Response DTO
```

Example:

```java
StudentResponse
StudentCreateRequest
StudentUpdateRequest
```

Avoid:

```java
StudentEntity
```

as a public API response.

---

# 11. Entity Rules

Entities represent persistence state.

They should not become containers for unrelated application logic.

Entities should:

- have clear ownership
- contain appropriate relationships
- avoid unnecessary bidirectional relationships
- avoid exposing persistence internals through APIs
- use appropriate ID strategies
- preserve historical data where required

Do not create an entity simply because a class exists conceptually.

---

# 12. Mapper Rules

Mapping between DTOs and entities should be explicit and consistent.

For simple mappings, a dedicated mapper can be used.

Example:

```text
StudentMapper
ResultMapper
CollegeMapper
```

Mapping logic must not contain business decisions.

Bad:

```java
mapper.mapAndDecideWhetherStudentPassed(...)
```

A mapper maps data.

Business services make business decisions.

---

# 13. Dependency Injection

Use Spring dependency injection.

Prefer constructor injection.

```java
@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }
}
```

Avoid field injection:

```java
@Autowired
private StudentRepository repository;
```

Constructor injection improves:

- testability
- immutability
- dependency visibility
- maintainability

---

# 14. Service Layer

Application services coordinate use cases.

Examples:

```text
StudentService
ResultImportService
ResultValidationService
ResultProcessingService
BacklogService
AcademicPassportService
AnalyticsService
```

A service may:

- authorize operations
- validate domain requirements
- coordinate repositories
- execute business workflows
- manage transactions
- publish domain events
- invoke integrations
- return application DTOs

A service must not become a generic "everything service."

---

# 15. Business Logic Rules

Business rules must live on the backend.

The frontend may provide user experience validation, but it is never the final authority.

Examples:

- student identifier uniqueness
- college tenant isolation
- role permissions
- result processing eligibility
- backlog state transitions
- duplicate detection
- result attempt handling
- academic record updates

must be enforced server-side.

---

# 16. Domain Services

Use domain services when a business operation:

- spans multiple entities
- does not naturally belong to one entity
- contains substantial domain logic
- must remain reusable and testable

Examples:

```text
ResultProcessingDomainService
BacklogDomainService
AcademicCalculationService
```

Do not create a domain service for every trivial method.

---

# 17. Repository Rules

Repositories are responsible for persistence access.

Repositories should not contain application workflows.

Preferred:

```java
Optional<Student> findByStudentIdentifier(
    String studentIdentifier
);
```

Avoid putting business workflows into repository classes.

Repositories should expose queries that represent actual persistence requirements.

---

# 18. JPA/Hibernate Rules

Use JPA/Hibernate carefully.

Avoid:

- unnecessary eager loading
- uncontrolled cascading
- huge entity graphs
- accidental lazy-loading loops
- entity serialization
- excessive bidirectional relationships

Prefer explicit fetch strategies.

Default to lazy relationships where appropriate.

---

# 19. N+1 Query Prevention

N+1 queries must be actively avoided.

Before implementing a list endpoint, determine:

- required data
- required relationships
- expected record count
- query count

Use:

- fetch joins
- entity graphs
- projections
- dedicated queries

where appropriate.

Do not solve every query problem by making relationships `EAGER`.

---

# 20. Transactions

Transactions must be placed around business operations that require atomicity.

Examples:

```text
Process Result
Update Result
Update Backlog
Update Academic Summary
Create Audit Record
```

should be considered together when the domain operation requires atomicity.

Use:

```java
@Transactional
```

at the appropriate service/application boundary.

Avoid placing `@Transactional` indiscriminately on every method.

---

# 21. Result Processing Transactions

Result processing is a critical transactional workflow.

A processing operation may involve:

```text
Validated Result
      ↓
Persist Result
      ↓
Update Attempt
      ↓
Update Backlog
      ↓
Update Academic Summary
      ↓
Update Passport Read Model
```

If the domain requires atomicity, partial database updates must not be left behind after a failed transaction.

Long-running work should not hold one database transaction open for the entire job.

---

# 22. Database Access

Database access must be:

- parameterized
- predictable
- indexed where required
- tenant-aware
- paginated for large datasets
- efficient

Never construct SQL by concatenating user input.

Bad:

```java
"SELECT * FROM students WHERE name = '" + name + "'"
```

Use parameterized queries or JPA query parameters.

---

# 23. Pagination

Large collections must not be returned without pagination.

Examples:

```text
GET /api/v1/students?page=0&size=20
GET /api/v1/results?page=0&size=50
GET /api/v1/result-imports?page=0&size=20
```

Maximum page sizes should be enforced server-side.

Do not allow clients to request unlimited records.

---

# 24. Search, Filter and Sort

Search/filter/sort functionality must be:

- explicitly defined
- validated
- database-efficient
- bounded

Never accept arbitrary database column names directly from users.

Prefer an allowlist:

```text
name
studentIdentifier
createdAt
status
```

Unknown sort fields must be rejected or safely ignored according to API contract.

---

# 25. Request Validation

Use Jakarta Bean Validation.

Example:

```java
@NotBlank
private String studentIdentifier;
```

```java
@Email
private String email;
```

```java
@Size(max = 100)
private String name;
```

Validation must happen:

1. at the API boundary
2. at the business-rule layer where required
3. at the database constraint layer where appropriate

Never rely on only one layer.

---

# 26. Business Validation vs Request Validation

These are different.

### Request validation

Checks whether the request is structurally valid.

Example:

```text
email must be valid
name cannot be blank
page size cannot exceed maximum
```

### Business validation

Checks whether the operation is allowed.

Example:

```text
student belongs to another college
result already processed
subject does not belong to semester
college is inactive
```

Both are required.

---

# 27. Exception Handling

Use centralized exception handling.

Recommended:

```text
@RestControllerAdvice
```

The API must return consistent error responses.

Example conceptual structure:

```json
{
  "code": "STUDENT_NOT_FOUND",
  "message": "Student was not found.",
  "details": [],
  "traceId": "..."
}
```

Do not expose stack traces or internal implementation details to users.

---

# 28. Error Codes

Use stable machine-readable error codes.

Examples:

```text
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_LOCKED
COLLEGE_NOT_FOUND
COLLEGE_INACTIVE
STUDENT_NOT_FOUND
STUDENT_ALREADY_EXISTS
RESULT_IMPORT_NOT_FOUND
RESULT_IMPORT_INVALID_STATUS
RESULT_VALIDATION_FAILED
RESULT_DUPLICATE
RESULT_PROCESSING_FAILED
ACCESS_DENIED
TENANT_ACCESS_DENIED
```

Error messages may change, but error codes should remain stable where possible.

---

# 29. Authentication and Authorization

Authentication and authorization must follow `authentication.md`.

The backend is the final authorization authority.

Never rely on frontend route visibility as security.

Every protected operation must verify:

```text
Authenticated user
        ↓
Role
        ↓
Tenant
        ↓
Resource ownership/access
        ↓
Operation permission
```

---

# 30. Tenant Isolation

Acadlytic is multi-tenant.

The college is the primary tenant boundary for college-owned academic data.

Every college-scoped query must enforce tenant context.

Example:

```text
Current User
    ↓
College Context
    ↓
Repository Query
    ↓
College-owned Data
```

Never trust a client-supplied `collegeId` without authorization checks.

---

# 31. IDOR Prevention

Never assume that possessing an object ID grants access.

Bad:

```text
GET /students/500
```

and simply loading student `500`.

The backend must verify that the authenticated user is authorized to access that student.

IDs are identifiers, not permissions.

---

# 32. `/me` Endpoints

Self-service operations should prefer `/me` endpoints where appropriate.

Examples:

```text
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

This reduces unnecessary exposure of user identifiers and clarifies ownership.

---

# 33. Account Lifecycle

Account lifecycle operations must enforce role permissions.

MVP rules include:

```text
SUPER_ADMIN
    → creates COLLEGE_ADMIN

COLLEGE_ADMIN
    → creates ACADEMIC_STAFF
    → creates STUDENT

ACADEMIC_STAFF
    → may create STUDENT where permitted

STUDENT
    → cannot create accounts
```

Public self-registration is not part of the MVP.

Account creation must handle:

- role
- college association
- email uniqueness
- status
- activation
- password setup
- audit logging

---

# 34. Password Handling

Passwords must never be stored in plaintext.

Use a strong adaptive password hashing mechanism supported by Spring Security.

Never:

- log passwords
- return password hashes through APIs
- store passwords in frontend state
- include passwords in audit records

Password reset tokens must be:

- time-limited
- single-use
- securely generated
- invalidated after use

---

# 35. Sensitive Data

Do not log sensitive data unnecessarily.

Avoid logging:

```text
passwords
authentication tokens
reset tokens
session identifiers
secret credentials
API secrets
```

Sensitive integration credentials must be stored securely.

---

# 36. File Upload Rules

Result import supports:

```text
Excel
CSV
```

Uploaded files must be validated for:

- allowed type
- file size
- filename
- structure
- encoding
- expected columns
- malformed content

Never trust the extension alone.

File processing must not execute uploaded content.

---

# 37. Result Import Backend Rules

The result import pipeline must preserve the defined workflow:

```text
Upload
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

The backend must maintain import/job status.

Example:

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

---

# 38. Student Matching

Student matching must use the official student/university identifier wherever available.

Do not automatically match students only by:

```text
name
```

Name-based matching may create false positives.

Unknown students should be flagged for review rather than silently creating incorrect records.

---

# 39. Subject Matching

Subject matching should primarily use the subject code or another authoritative identifier.

Do not silently create a new subject because a result file contains an unknown subject.

Unknown mappings must be explicitly handled.

---

# 40. Duplicate Result Protection

Duplicate identity must be defined according to the result domain.

A conceptual identity may include:

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

The exact implementation must follow the result-processing specification and database constraints.

Duplicate processing must be idempotent where appropriate.

---

# 41. Result Validation Rules

Validation must occur before result processing.

Validation should distinguish:

```text
VALID
INVALID
WARNING
PENDING
```

Validation must not silently mutate authoritative academic records.

The validation layer identifies problems.

The processing layer performs authorized academic state changes.

---

# 42. Result Processing Rules

Only valid or explicitly allowed records may enter processing.

Processing must:

- preserve result history
- preserve attempts
- update current outcome appropriately
- update backlog state
- update academic summaries
- update the Academic Passport read model where required
- remain tenant-safe
- remain auditable

Do not overwrite historical attempts merely to display the latest result.

---

# 43. Academic Calculation Rules

Do not invent university-specific academic formulas.

The system must distinguish between:

```text
Raw academic result data
Calculated academic values
University-specific rules
```

If the university regulation/formula is not explicitly configured or supported, the backend must not silently assume a formula.

This applies to:

- SGPA
- CGPA
- percentage
- grades
- credits
- eligibility

---

# 44. Backlog Rules

Backlog is a domain state, not merely a UI label.

Backlog creation/update must be controlled by the result-processing domain.

Possible lifecycle states may include:

```text
OPEN
CLEARED
```

Additional states may be introduced only when the domain requires them.

A supplementary/passed result must not create another backlog for the same academic requirement.

Historical attempts must remain available.

---

# 45. Academic Passport Rules

The Academic Passport is a read-oriented representation.

It is not the primary source of truth.

Backend ownership remains with authoritative academic modules.

Conceptually:

```text
Authoritative Academic Data
          ↓
Academic Passport Projection
          ↓
Student / Staff View
```

Do not allow normal Passport APIs to directly mutate authoritative academic results.

---

# 46. Analytics Rules

Analytics is a derived/read layer.

Analytics must not become a second source of truth.

Analytics calculations must use authoritative processed academic data.

Important rules:

- do not count invalid imported results
- do not count unprocessed records as academic outcomes
- avoid duplicate attempt counting
- distinguish missing values from zero
- apply tenant filters
- use server-side calculations for authoritative metrics

---

# 47. Background Jobs

Long-running tasks should be asynchronous.

Examples:

- large result parsing
- result validation
- result processing
- bulk calculations
- future university synchronization

The API should return a job/import identifier where appropriate.

Conceptual flow:

```text
POST request
    ↓
Create Job
    ↓
Return 202 Accepted
    ↓
Background Processing
    ↓
Update Status
```

Do not hold an HTTP request open for a large import unnecessarily.

---

# 48. Job Idempotency

Background jobs must be designed for retries.

A retry must not create duplicate academic records.

Use:

- unique constraints
- idempotency keys where appropriate
- processing state
- deterministic identity
- transaction boundaries

Retries must be safe.

---

# 49. Concurrency

Concurrent processing must be considered for:

- result imports
- result processing
- backlog updates
- account status changes
- college administration
- bulk operations

Where two operations can modify the same logical record, the backend must define the expected concurrency behavior.

Possible mechanisms include:

- database constraints
- optimistic locking
- pessimistic locking where justified
- state checks
- idempotency

Do not introduce locking without understanding its performance impact.

---

# 50. Integration Rules

External systems must be accessed through explicit integration abstractions.

Example:

```text
UniversityConnector
```

Potential future adapters:

```text
UniversityApiConnector
UniversityWebhookConnector
UniversityFeedConnector
```

Do not place external HTTP calls directly inside controllers.

---

# 51. Authorized Integrations Only

The MVP must not implement:

- unauthorized scraping
- CAPTCHA bypass
- credential abuse
- unsupported university automation

Future integrations must use authorized APIs, feeds, webhooks, or other permitted mechanisms.

---

# 52. External API Reliability

External integrations must account for:

- timeout
- retry
- rate limits
- unavailable services
- malformed responses
- partial failures
- authentication failure

External failure must not corrupt authoritative local academic records.

---

# 53. Configuration

Environment-specific configuration must not be hardcoded.

Use configuration properties/environment variables for:

```text
database
server
JWT/auth configuration
email
file storage
external APIs
integration credentials
logging
feature flags
```

Do not commit secrets to Git.

---

# 54. Profiles

Use environment-specific Spring configuration where required.

Conceptually:

```text
application.yml
application-dev.yml
application-prod.yml
```

Development configuration must not accidentally contain production credentials.

Production configuration must not be committed as plaintext secrets.

---

# 55. Database Migrations

Database schema changes must be version-controlled.

Use a migration mechanism such as:

```text
Flyway
```

or another approved migration tool.

Never rely on manually editing the production database.

Schema changes must be reviewed and tested before production deployment.

---

# 56. Database Constraints

Business-critical uniqueness should be reinforced at the database layer.

Examples may include:

```text
college code
user email where applicable
student identifier within defined tenant/context
result identity
```

Application validation improves user experience.

Database constraints protect data integrity.

Both are required.

---

# 57. Logging

Backend logs should support debugging and operations without exposing sensitive information.

Useful information includes:

```text
timestamp
log level
module
operation
user context where safe
tenant context where safe
resource identifier
job/import identifier
correlation/trace ID
error code
```

Avoid logging complete uploaded result files.

---

# 58. Correlation IDs

Requests and background jobs should be traceable.

A correlation/trace identifier should allow operators to connect:

```text
HTTP Request
   ↓
Service Operation
   ↓
Background Job
   ↓
Database/Integration Logs
```

The exact observability implementation may be finalized during infrastructure work.

---

# 59. Audit Logging

Security-sensitive and important administrative operations should be auditable.

Examples:

- account creation
- account status change
- role assignment
- college creation
- college status change
- result import
- result processing
- backlog state change
- security events

Audit records should capture enough context to reconstruct what happened without storing unnecessary sensitive information.

---

# 60. Caching

Caching must only be introduced where it provides measurable value.

Potential candidates:

- relatively stable academic reference data
- frequently accessed read models
- configuration/reference data

Do not cache mutable academic data without a clear invalidation strategy.

Never use stale cache data as the authoritative source of academic state.

---

# 61. API Documentation

All public/internal application APIs must be documented using the project's OpenAPI strategy.

Documentation should include:

- endpoint
- HTTP method
- authentication requirement
- roles
- request schema
- response schema
- validation
- error codes
- pagination
- filtering
- examples where useful

API documentation must stay aligned with implementation.

---

# 62. API Versioning

Current API baseline:

```text
/api/v1
```

Breaking API changes must not be introduced casually.

If a future breaking change is required, establish an explicit versioning/migration strategy.

---

# 63. Date and Time

Use a consistent server-side time strategy.

The system should distinguish:

```text
Instant
LocalDate
LocalDateTime
ZoneId
```

Do not treat all dates as simple strings.

Academic events and timestamps must preserve sufficient information for correct interpretation.

The final project-wide timezone policy must remain aligned with architecture documentation.

---

# 64. IDs

IDs must be stable and consistent.

Do not expose internal database assumptions unnecessarily.

The exact ID strategy may be finalized during database architecture.

Whatever strategy is selected must be:

- consistent
- indexed
- safe for APIs
- suitable for distributed/background processing if required

---

# 65. Performance

Backend performance should be considered during implementation rather than only after deployment.

Important areas:

- database query count
- indexing
- pagination
- large imports
- batch processing
- memory usage
- serialization
- API response size
- N+1 queries
- background job throughput

Do not optimize without measurement when the optimization increases complexity.

---

# 66. Large Result Imports

Large result files must not be processed by loading unlimited records into memory.

Prefer:

```text
streaming
batch processing
chunking
bounded collections
```

where appropriate.

The implementation should support predictable memory usage.

---

# 67. API Response Size

Avoid returning unnecessarily large nested objects.

For list APIs, return summary representations.

Use detail endpoints for large or detailed resources.

Example:

```text
GET /students
```

should not automatically return every student's complete academic history.

---

# 68. Testing Requirements

Backend code must be tested at appropriate levels.

Required categories include:

### Unit tests

For:

- business rules
- domain calculations
- validation logic
- state transitions

### Repository tests

For:

- custom queries
- filtering
- tenant isolation
- uniqueness behavior

### Integration tests

For:

- service + database behavior
- result processing
- import workflow
- transactions

### Controller/API tests

For:

- request validation
- response contracts
- status codes
- authentication
- authorization

### Security tests

For:

- role restrictions
- tenant isolation
- IDOR
- unauthorized access

---

# 69. Test Isolation

Tests must not depend on execution order.

Each test should establish its own required state.

Do not rely on manually populated developer databases for automated tests.

---

# 70. Security Testing

Every protected backend feature should include authorization testing.

At minimum verify:

```text
Correct role → allowed
Wrong role → denied
Wrong tenant → denied
Unauthenticated → denied
Non-owned resource → denied
```

---

# 71. Academic Data Testing

Academic features require edge-case tests.

Examples:

- failed subject
- passed subject
- supplementary attempt
- repeated attempt
- unknown student
- unknown subject
- duplicate result
- invalid marks
- missing marks
- missing credits
- partial import failure
- reprocessing
- result correction
- backlog clearance

---

# 72. Code Style

Follow standard Java conventions.

Prefer:

- small methods
- meaningful names
- clear control flow
- immutability where appropriate
- final fields
- constructor injection
- explicit types
- focused classes

Avoid:

- giant service classes
- giant controllers
- deeply nested conditions
- unexplained magic values
- duplicated business logic

---

# 73. Magic Values

Avoid hardcoded business values.

Bad:

```java
if (status == 7) {
    ...
}
```

Prefer:

```java
ResultStatus.PROCESSED
```

or a properly configured domain constant.

---

# 74. Null Handling

Null handling must be deliberate.

Prefer clear domain semantics.

For repository lookups:

```java
Optional<Student>
```

may be appropriate.

Do not blindly wrap every value in `Optional`.

Do not use `Optional` as entity fields unless there is a clear reason.

---

# 75. Collections

Do not return mutable internal collections unnecessarily.

Use appropriate collection types.

Examples:

```java
List
Set
Map
```

Choose based on domain semantics.

Use `Set` when uniqueness is part of the requirement.

---

# 76. Enums

Use enums for controlled finite states.

Examples:

```text
UserRole
AccountStatus
ImportStatus
ValidationStatus
BacklogStatus
```

Do not represent domain states using unexplained strings throughout the codebase.

---

# 77. State Transitions

State changes must be explicit.

For example:

```text
UPLOADED
   ↓
PARSING
   ↓
VALIDATING
   ↓
READY_FOR_REVIEW
   ↓
PROCESSING
   ↓
COMPLETED
```

Invalid transitions must be rejected.

Do not allow arbitrary status updates from controllers.

---

# 78. Cross-Module Operations

Modules may depend on other modules, but ownership must remain clear.

Example:

```text
Result Processing
    ↓
Backlog update
```

does not mean Result Processing owns backlog data.

The Backlog module remains responsible for backlog rules.

Use application/domain operations rather than direct manipulation of another module's persistence model.

---

# 79. Avoid Direct Cross-Module Database Writes

Do not do this:

```text
ResultService
    ↓
directly update backlog tables
```

when the Backlog module owns those rules.

Prefer:

```text
ResultProcessingService
    ↓
Backlog domain/application operation
    ↓
Backlog-owned persistence
```

This prevents ownership confusion.

---

# 80. Domain Events

Domain events may be used where they improve module decoupling.

Examples:

```text
ResultProcessed
BacklogCleared
StudentCreated
CollegeStatusChanged
```

Events must not be introduced merely for architectural complexity.

The initial system should remain understandable.

---

# 81. Transactional Events

If an event must only be published after a successful database transaction, use an appropriate transactional event mechanism.

Do not publish a success event before the authoritative transaction has committed when that could create inconsistent downstream state.

---

# 82. Async Failure Handling

Background jobs must expose meaningful failure state.

A failed job should provide enough information for an operator to understand:

```text
what failed
where it failed
why it failed
whether retry is possible
how many records were affected
```

Sensitive internal stack traces should remain server-side.

---

# 83. Partial Success

Result processing may produce partial success where explicitly supported.

The backend must distinguish:

```text
success
partial success
failure
```

Do not report an import as fully successful if significant records failed processing.

---

# 84. Retry Rules

Retries must be safe.

Do not retry blindly when the error is deterministic.

Examples:

```text
temporary network failure → potentially retry
validation failure → do not blindly retry
duplicate identity → resolve/idempotently handle
authorization failure → do not retry
```

---

# 85. External Integration Credentials

Credentials for university or third-party integrations must:

- never be committed to Git
- never be returned through normal APIs
- never be logged
- be stored using approved secure mechanisms
- be scoped to the appropriate tenant/integration

The exact credential storage mechanism remains an implementation decision unless finalized elsewhere.

---

# 86. File Storage Abstraction

The result-import implementation should avoid tightly coupling business logic to a specific file-storage provider.

Prefer an abstraction such as:

```text
FileStorageService
```

This allows future support for:

```text
local storage
S3-compatible storage
cloud object storage
```

without rewriting result-processing logic.

---

# 87. Email/Notification Abstraction

Email and notifications should be treated as infrastructure concerns.

Business logic should not directly depend on a specific email vendor.

Prefer an abstraction such as:

```text
NotificationService
```

where required.

---

# 88. Security by Default

Backend endpoints should be protected by default.

Public endpoints must be explicitly identified.

Examples of public areas:

```text
/
/about
/features
/contact
/login
```

Protected application APIs require authentication unless explicitly defined otherwise.

---

# 89. Least Privilege

Users must receive only the permissions required for their role.

Do not grant broad permissions merely because they simplify implementation.

Example:

```text
COLLEGE_ADMIN
```

must not automatically receive:

```text
SUPER_ADMIN
```

capabilities.

---

# 90. Data Exposure

API responses must contain only information required by the consuming client.

Do not expose:

- password hashes
- security tokens
- internal secrets
- unnecessary audit metadata
- unrelated tenant data
- internal implementation details

---

# 91. Soft Deactivation vs Physical Deletion

For important academic entities, physical deletion should not be used casually.

Where the product requires historical preservation, prefer:

```text
ACTIVE
INACTIVE
SUSPENDED
```

or equivalent lifecycle states.

College deactivation must preserve historical academic data.

---

# 92. Historical Academic Data

Academic history must be treated as durable data.

Do not overwrite historical attempts simply to display the latest result.

The system should preserve:

```text
attempt
result
status
source/import context
timestamps
```

where required by the feature specification.

---

# 93. Result Source Traceability

Processed academic data should remain traceable to its source import/release where required.

This helps with:

- correction
- auditing
- debugging
- reprocessing
- data provenance

The implementation must preserve enough metadata to understand where a result originated.

---

# 94. Database Indexing

Indexes should support actual query patterns.

Potential areas include:

```text
college_id
student_identifier
student_id
course_id
semester_id
subject_id
status
import_id
result release
created_at
```

Exact indexes must be finalized from database architecture and measured query requirements.

Do not create indexes indiscriminately.

---

# 95. Bulk Operations

Bulk operations must consider:

- transaction size
- memory
- database load
- locking
- retry behavior
- partial failure
- progress tracking

Large bulk operations should use batching where necessary.

---

# 96. API Security Headers and Transport

Production APIs must use HTTPS.

Security headers and transport configuration must follow the deployment/security architecture.

Do not expose production APIs over unsecured HTTP unless a controlled infrastructure layer handles the redirect/termination appropriately.

---

# 97. CORS

CORS must be explicitly configured.

Do not use unrestricted production configuration such as:

```text
*
```

when credentials or authenticated APIs are involved.

Allowed origins should be environment-specific.

---

# 98. Rate Limiting

Rate limiting should be considered for:

- authentication endpoints
- password reset
- public endpoints
- expensive operations
- import initiation
- future public APIs

The exact implementation may be finalized during security/infrastructure design.

---

# 99. Health Checks

The backend should provide operational health information appropriate for deployment.

Health checks should distinguish between:

```text
application available
database available
critical dependency available
```

Do not expose sensitive internal information through public health endpoints.

---

# 100. Graceful Failure

A failure in one subsystem should not unnecessarily corrupt unrelated data.

Examples:

```text
Email failure
    ≠
Result processing rollback
```

unless the email operation is explicitly part of the same required transaction.

Similarly:

```text
Analytics failure
    ≠
Academic result corruption
```

---

# 101. Backend Documentation

Important backend decisions should be documented.

Document:

- non-obvious business rules
- complex algorithms
- important transaction boundaries
- integration behavior
- state machines
- architectural decisions

Do not write comments that simply repeat the code.

---

# 102. Comments

Good:

```java
// A result attempt is retained because supplementary results
// must not overwrite historical academic records.
```

Bad:

```java
// Set result
result.setResult(result);
```

Comments should explain **why**, not merely **what**.

---

# 103. TODO Rules

TODOs must be meaningful.

Bad:

```java
// TODO: fix
```

Good:

```java
// TODO: Replace local file storage with object storage
// after production infrastructure is finalized.
```

If a TODO represents a real architectural decision, it should also be documented in the relevant design document.

---

# 104. Dead Code

Do not leave:

- unused services
- unused repositories
- obsolete endpoints
- commented-out implementations
- unused dependencies

in the codebase without a documented reason.

Remove obsolete code.

---

# 105. Duplicate Business Logic

Business rules must have one authoritative implementation.

Avoid implementing SGPA/CGPA logic separately in:

```text
controller
service
analytics
frontend
```

when the backend owns the authoritative calculation.

Derived views should consume authoritative results.

---

# 106. Frontend/Backend Responsibility

Frontend:

```text
presentation
UX validation
formatting
navigation
state presentation
```

Backend:

```text
authorization
tenant isolation
business validation
academic processing
data integrity
authoritative calculations
```

Never move security-sensitive business rules into the frontend.

---

# 107. API Contract Stability

Frontend and backend must agree on:

- endpoint
- request structure
- response structure
- error codes
- pagination
- filters
- status values

Breaking changes require deliberate coordination.

---

# 108. OpenAPI as Contract Support

OpenAPI should be used to keep API contracts visible and reviewable.

Where appropriate, generated API clients/types may be considered later, but generated artifacts must not replace understanding of the API contract.

---

# 109. Backend AI Coding Rules

AI-generated backend code must follow the same engineering standards as manually written code.

AI must not:

- invent business rules
- invent university formulas
- bypass authorization
- expose entities directly
- create arbitrary database tables
- modify unrelated modules
- introduce dependencies without justification
- disable validation
- weaken security for convenience
- silently change API contracts
- silently change result-processing behavior

AI-generated code must be reviewed before acceptance.

---

# 110. AI Implementation Process

For a backend task, an AI coding agent should follow:

```text
Read project rules
        ↓
Read architecture
        ↓
Read relevant feature specification
        ↓
Inspect existing implementation
        ↓
Identify ownership
        ↓
Plan changes
        ↓
Implement smallest correct change
        ↓
Run tests
        ↓
Review security
        ↓
Review tenant isolation
        ↓
Review transactions
        ↓
Review API contract
        ↓
Report changes
```

---

# 111. AI Must Not Guess Missing Requirements

If a feature specification does not define:

- formula
- state transition
- authorization rule
- data ownership
- integration behavior

the AI must not silently invent one.

It should identify the missing decision and follow the project's documented decision process.

---

# 112. Testing Before Completion

A backend feature is not complete merely because it compiles.

Before marking a feature complete:

- compile
- run unit tests
- run relevant integration tests
- test validation
- test authorization
- test tenant isolation
- test error handling
- test important edge cases
- inspect database behavior
- review logs

---

# 113. Definition of Done

A backend feature is considered done when:

- [ ] requirement is implemented
- [ ] module ownership is clear
- [ ] API contract is defined
- [ ] authorization is implemented
- [ ] tenant isolation is verified
- [ ] request validation is implemented
- [ ] business rules are server-side
- [ ] persistence is correct
- [ ] transaction boundaries are appropriate
- [ ] errors are handled consistently
- [ ] relevant tests pass
- [ ] security cases are tested
- [ ] performance concerns are considered
- [ ] logging is appropriate
- [ ] no secrets are committed
- [ ] documentation is updated where necessary
- [ ] code review is complete

---

# 114. Pre-Commit Checklist

Before committing backend changes:

- [ ] code compiles
- [ ] tests pass
- [ ] no debug code
- [ ] no passwords/secrets
- [ ] no unnecessary dependencies
- [ ] no unused imports
- [ ] no commented-out dead code
- [ ] API changes are intentional
- [ ] authorization checked
- [ ] tenant isolation checked
- [ ] database changes documented
- [ ] migration included if required

---

# 115. Pre-PR Checklist

Before opening a pull request:

- [ ] requirement understood
- [ ] relevant architecture reviewed
- [ ] relevant feature specification reviewed
- [ ] ownership verified
- [ ] API contract reviewed
- [ ] security reviewed
- [ ] tests added/updated
- [ ] migration reviewed
- [ ] performance considered
- [ ] edge cases considered
- [ ] documentation updated
- [ ] unrelated changes removed

---

# 116. Backend Anti-Patterns

Avoid:

### God Service

```text
AcadlyticService
```

containing all business logic.

### God Controller

A controller containing database and business logic.

### Entity Exposure

Returning JPA entities directly from REST endpoints.

### Frontend Security

Trusting frontend role checks.

### Tenant Blind Queries

Queries that omit tenant restrictions.

### Magic Status Values

Using raw integers or strings everywhere.

### Blind Retries

Retrying every failure.

### Unbounded Imports

Loading entire result files into memory.

### EAGER Everywhere

Using eager loading to hide query problems.

### Generic Repository Abuse

One repository containing unrelated business queries.

### Cross-Module Database Mutation

Directly modifying another module's tables.

### Silent Data Correction

Changing academic data without traceability.

---

# 117. Rule Priority

When backend rules conflict, apply this priority:

```text
1. Security and data protection
2. Product requirements
3. Feature specifications
4. System architecture
5. Data ownership rules
6. API architecture
7. Backend rules
8. Coding conventions
9. Developer convenience
```

Security and data integrity take precedence over implementation convenience.

---

# 118. Relationship With Other Documents

This document must be used together with:

```text
03-prd/
├── product-requirements.md
├── functional-requirements.md
└── non-functional-requirements.md

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
├── database-rules.md
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

A feature specification has priority over generic implementation assumptions.

---

# 119. Unresolved Backend Decisions

The following should remain explicitly tracked rather than silently assumed:

- exact authentication/token strategy
- refresh-token/session strategy
- account activation mechanism
- password reset delivery
- exact password hashing configuration
- file storage provider
- background job implementation
- Spring Scheduler vs Spring Batch boundaries
- exact migration tool if not finalized
- exact ID strategy
- caching technology
- rate-limiting implementation
- observability stack
- correlation/trace implementation
- notification provider
- external integration credential storage
- exact API filtering/query framework
- exact university-specific calculation configuration model
- production infrastructure details

These decisions should be finalized through architecture/security/database work before implementation requires them.

---

# 120. Review Status

**Status:** Draft / Under Review

This document should be reviewed against:

- system architecture
- backend architecture
- database architecture
- API architecture
- security rules
- data ownership
- feature specifications
- database rules

Only after review should this document move to:

```text
Approved
```

and later:

```text
Implementation Ready
```

---

# 121. Final Backend Principle

The backend should prioritize:

```text
Correctness
    >
Security
    >
Data Integrity
    >
Maintainability
    >
Performance
    >
Convenience
```

Acadlytic's backend is the authoritative layer for academic data integrity, authorization, tenant isolation, business rules, and processing.

The frontend may present the system.

The backend must protect and enforce the system.