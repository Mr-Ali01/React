# Acadlytic Coding Rules

**Document:** `07-project-rules/coding-rules.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Status:** Draft / Under Review  
**Version:** 1.0  
**Last Updated:** 2026-10-04

---

## 1. Purpose

This document defines the general coding standards and engineering rules for the Acadlytic codebase.

These rules apply across:

- Frontend
- Backend
- Database
- APIs
- Business logic
- Result processing
- Backlog management
- Academic Passport
- Analytics
- Integrations
- Background jobs
- Tests
- Configuration
- Documentation

The purpose is to keep the codebase:

- readable
- predictable
- maintainable
- secure
- testable
- modular
- scalable
- consistent
- easy for another developer or AI coding agent to understand

These rules complement:

- `frontend-rules.md`
- `backend-rules.md`
- `database-rules.md`
- `security-rules.md`
- `ai-coding-rules.md`
- architecture documentation
- feature specifications

This document provides the **general engineering rules**. More specific rules take precedence where applicable.

---

# 2. Core Engineering Principles

All Acadlytic development should follow these principles.

## 2.1 Correctness Over Cleverness

Prefer code that is:

- obvious
- explicit
- predictable
- easy to test

Avoid unnecessarily clever implementations.

Bad:

```java
return condition ? calculate(a) : calculate(b);
```

when the logic is complex enough to require explanation.

Prefer:

```java
if (condition) {
    return calculateForPrimaryCase(a);
}

return calculateForAlternativeCase(b);
```

when it improves readability.

---

## 2.2 Simplicity Over Premature Abstraction

Do not create abstractions simply because two pieces of code currently look similar.

First understand whether they represent the same concept.

Avoid:

```text
GenericAcademicThingManager
UniversalProcessor
BaseEverythingService
CommonHelper
```

when a domain-specific implementation is clearer.

---

## 2.3 Explicit Domain Meaning

Acadlytic is an academic platform.

Names should communicate academic meaning.

Prefer:

```text
studentId
semesterId
subjectCode
resultReleaseId
attemptNumber
backlogStatus
processedAt
```

Avoid ambiguous names:

```text
id1
type
data
value
status1
record
```

unless their meaning is obvious from the immediate context.

---

# 3. Source-of-Truth Rule

Every important piece of data must have a clearly defined owner.

The implementation must follow the ownership defined in:

`05-architecture/data-ownership.md`

Examples:

| Data | Primary Owner |
|---|---|
| College | College Management |
| Student | Student Management |
| Course | Academic Structure |
| Semester | Academic Structure |
| Subject | Academic Structure |
| Imported result | Result Import |
| Validation state | Result Validation |
| Processed result | Result Processing |
| Backlog | Backlog Tracking |
| Academic Passport | Read-oriented projection |
| Analytics | Derived/read layer |

---

## 3.1 Never Create Silent Duplicate Sources of Truth

Do not maintain the same authoritative value independently in multiple modules.

For example, if CGPA is authoritative in result processing, another module must not independently maintain a competing CGPA value.

Allowed:

```text
Result Processing
      ↓
Academic Passport projection
      ↓
Student Portal
```

Not allowed:

```text
Result Processing → CGPA
Student Portal → separate CGPA
Analytics → separate CGPA
```

unless explicitly designed as a derived/read model.

---

# 4. Module Boundaries

Acadlytic uses a modular-monolith architecture.

Major modules include:

```text
auth
users
colleges
students
academic
results
backlogs
passport
analytics
```

Modules must have clear responsibilities.

---

## 4.1 Do Not Bypass Module Ownership

A module must not directly modify another module's internal data simply because the database makes it technically possible.

Bad:

```text
Analytics → directly UPDATE backlog table
```

Correct:

```text
Analytics
   ↓
read/query
   ↓
Backlog-owned data
```

For mutations:

```text
Module A
   ↓
Application Service / Domain Operation
   ↓
Module B
```

---

## 4.2 Avoid Cross-Module Database Coupling

Avoid code where one module directly manipulates another module's tables.

For example:

```sql
UPDATE backlog_records ...
```

should not appear inside an unrelated analytics implementation.

Cross-module operations must go through an appropriate application/domain boundary.

---

# 5. Naming Conventions

Names must be descriptive and consistent.

## 5.1 Variables

Use meaningful nouns.

Good:

```java
studentId
collegeId
resultImportId
validationStatus
attemptNumber
```

Bad:

```java
x
tmp
obj
data
value
```

unless they are genuinely local mathematical or temporary variables.

---

## 5.2 Methods

Methods should normally represent an action.

Good:

```text
createStudent()
validateResult()
processImport()
calculateBacklog()
getAcademicPassport()
updateCollegeStatus()
```

Avoid:

```text
doStuff()
handleData()
process()
execute()
run()
```

when the actual responsibility can be expressed more clearly.

---

## 5.3 Boolean Names

Boolean values should communicate state or condition.

Good:

```text
isActive
isProcessed
hasBacklog
canEdit
isValidated
```

Avoid:

```text
activeFlag
check
status
value
```

when a clearer boolean name is possible.

---

## 5.4 Constants

Constants must use clear names.

Java:

```java
MAX_LOGIN_ATTEMPTS
DEFAULT_PAGE_SIZE
MAX_FILE_SIZE
```

TypeScript:

```typescript
DEFAULT_PAGE_SIZE
MAX_IMPORT_FILE_SIZE
```

Avoid unexplained numeric literals.

---

# 6. Functions and Methods

Functions should have one clear responsibility.

Bad:

```text
processStudent()
```

if it:

- validates student
- creates account
- calculates CGPA
- creates backlog
- sends email
- writes audit log
- generates passport

That should be decomposed into appropriate responsibilities.

---

## 6.1 Keep Methods Small When Possible

Do not enforce an arbitrary line count.

Instead ask:

> Can this method be understood as one logical operation?

If not, consider decomposition.

---

## 6.2 Avoid Deep Nesting

Avoid:

```text
if
  if
    if
      if
        if
```

Prefer:

- guard clauses
- extracted methods
- clear validation
- early returns

Example:

```java
if (student == null) {
    throw new StudentNotFoundException();
}

if (!student.isActive()) {
    throw new InactiveStudentException();
}

processStudent(student);
```

---

# 7. Null and Optional Handling

Null handling must be explicit.

Do not silently convert missing data into valid-looking values.

Especially important for academic data.

Never assume:

```text
missing CGPA = 0
missing marks = 0
missing credits = 0
```

unless the domain specification explicitly defines that behavior.

---

## 7.1 Missing Is Not Zero

This rule is critical for analytics.

These states are different:

```text
0
null
unknown
not applicable
not attempted
not available
```

Do not collapse them into a single value.

---

# 8. Error Handling

Errors must be handled deliberately.

Do not:

```text
catch exception
ignore exception
continue silently
```

Bad:

```java
try {
    process();
} catch (Exception e) {
}
```

Never silently swallow exceptions.

---

## 8.1 Use Meaningful Exceptions

Prefer domain-specific exceptions where appropriate.

Examples:

```text
StudentNotFoundException
CollegeNotFoundException
DuplicateResultException
InvalidResultException
UnauthorizedOperationException
ImportProcessingException
```

---

## 8.2 Do Not Expose Internal Errors

API responses must not expose:

- stack traces
- SQL queries
- database credentials
- internal file paths
- implementation details

Use stable application error codes and safe messages.

---

# 9. Validation Rules

Validation must happen at the correct boundary.

Typical layers:

```text
Frontend validation
        ↓
API request validation
        ↓
Business validation
        ↓
Database constraints
```

Frontend validation improves user experience.

Backend validation protects the system.

Database constraints protect data integrity.

---

## 9.1 Never Trust Frontend Validation

A frontend validation rule is not a security boundary.

For example:

```text
Frontend:
role = STUDENT
```

does not mean the backend should trust it.

The backend must independently validate:

- authentication
- authorization
- tenant
- role
- ownership
- business rules

---

# 10. Business Logic

Business rules must live in the appropriate application/domain layer.

Do not place important business logic inside:

- React components
- controllers
- repositories
- SQL queries
- UI event handlers

unless the logic is specifically presentation/query related.

---

## 10.1 Controllers Should Not Become Business Logic Containers

Avoid:

```text
Controller
 ├── validation
 ├── business calculations
 ├── database logic
 ├── authorization rules
 ├── processing
 └── response construction
```

Prefer:

```text
Controller
   ↓
Application Service
   ↓
Domain Logic
   ↓
Repository
```

---

# 11. Academic Calculation Rules

Academic calculations are domain-sensitive.

Do not invent formulas.

Examples include:

- SGPA
- CGPA
- percentage
- grade
- credits
- backlog classification
- pass/fail
- attempt handling

If the applicable university/regulation formula is not defined in the specification:

1. do not guess
2. do not hard-code an assumed formula
3. mark the requirement as unresolved
4. obtain the required academic rule
5. document the rule before implementation

---

## 11.1 Preserve Academic History

Never overwrite historical academic attempts simply to show the latest result.

The system must distinguish:

```text
Attempt 1
Attempt 2
Attempt 3
```

when applicable.

Historical records are important for:

- backlog tracking
- academic history
- analytics
- auditability
- Academic Passport

---

# 12. Result Data Rules

Result-related code must follow the defined result lifecycle.

```text
Import
 ↓
Normalization
 ↓
Validation
 ↓
Processing
 ↓
Academic Record
 ↓
Backlog / Passport / Analytics
```

Do not bypass this lifecycle without an explicit design decision.

---

## 12.1 Do Not Process Invalid Results

Invalid records must not silently become authoritative academic records.

The implementation must respect validation status.

---

## 12.2 Student Matching

Student matching must use the authoritative student identifier where defined.

Do not use student name as the primary identity mechanism.

Names can be:

- duplicated
- misspelled
- formatted differently
- changed

Therefore:

```text
Student Identifier > Name
```

for identity matching.

---

## 12.3 Subject Matching

Subject code should be used where defined as the authoritative matching key.

Do not silently create a new subject because an imported subject cannot be matched.

Unknown subjects should follow the result-validation workflow.

---

# 13. Backlog Rules

Backlog is a domain concept, not merely a UI badge.

Backlog state must be derived and maintained according to the defined result-processing rules.

Do not create independent backlog logic in:

- analytics
- student portal
- Academic Passport
- frontend

unless it is explicitly a read-only presentation calculation.

---

# 14. Academic Passport Rules

Academic Passport is a read-oriented representation.

It is not the primary source of truth.

Therefore:

```text
Authoritative academic data
        ↓
Passport projection/read model
        ↓
Student/Admin UI
```

Do not allow the Passport UI to directly edit authoritative academic records.

---

# 15. Analytics Rules

Analytics must use authoritative or explicitly derived data.

Analytics must not:

- invent missing values
- treat missing as zero
- modify academic records
- create competing calculations
- silently reinterpret attempts
- bypass tenant boundaries

Analytics is primarily a read/analysis layer.

---

# 16. Database Access

Database access must remain within the backend persistence boundary.

Do not access MySQL directly from the frontend.

Correct:

```text
React
 ↓
REST API
 ↓
Spring Boot
 ↓
Repository
 ↓
MySQL
```

Incorrect:

```text
React
 ↓
MySQL
```

---

## 16.1 Repository Responsibility

Repositories should primarily handle:

- persistence
- retrieval
- queries
- filtering
- pagination

They should not contain large business workflows.

---

# 17. Entities and DTOs

Do not expose persistence entities directly as API contracts unless explicitly approved.

Prefer:

```text
Entity
 ↓
Mapper
 ↓
Response DTO
```

and:

```text
Request DTO
 ↓
Validation
 ↓
Application Service
 ↓
Entity/domain model
```

Benefits:

- API stability
- security
- separation of concerns
- controlled serialization
- easier evolution

---

# 18. API Contract Rules

API contracts must remain predictable.

Follow:

```text
/api/v1/...
```

Use resource-oriented endpoints.

Examples:

```text
GET    /api/v1/students
GET    /api/v1/students/{studentId}
POST   /api/v1/students
PUT    /api/v1/students/{studentId}
```

Avoid arbitrary action-heavy URLs unless an operation genuinely represents a domain command.

---

## 18.1 API Versioning

Do not silently break an existing API contract.

Breaking changes require:

- review
- documentation
- versioning strategy
- frontend compatibility assessment
- migration plan where necessary

---

# 19. Authentication and Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> What can the user do?

Never treat authentication as authorization.

Every protected operation must enforce authorization server-side.

---

## 19.1 Role Rules

Current primary roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Do not add a new role simply to bypass an authorization problem.

First determine whether:

- existing role permissions
- ownership
- tenant context
- resource-level authorization

can solve the requirement.

---

# 20. Tenant Isolation

Acadlytic is multi-tenant.

The college is the primary tenant boundary for college-owned data.

Every tenant-sensitive operation must establish:

```text
Authenticated User
        ↓
Tenant Context
        ↓
Authorization
        ↓
Resource Access
```

Never trust a frontend-provided `collegeId` as sufficient authorization.

---

## 20.1 IDOR Protection

A valid authenticated user must not automatically gain access to any resource simply because they know its ID.

Example:

```text
/students/123
```

must not expose student `123` if that student belongs to another college and the user is not authorized.

---

# 21. `/me` Endpoints

Self-service operations should prefer `/me` endpoints where defined.

Examples:

```text
GET /api/v1/me
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

This reduces unnecessary exposure of user-controlled identifiers for self-service operations.

---

# 22. Transactions

Use transactions around operations that must succeed or fail as a logical unit.

Especially important for:

- result processing
- backlog updates
- academic record updates
- account provisioning
- critical multi-table writes

Avoid unnecessarily large transactions.

---

# 23. Idempotency

Operations that may be retried must be designed carefully.

This is particularly important for:

- result processing
- imports
- background jobs
- integrations
- webhook-like operations
- provisioning

Repeated execution must not silently create duplicate academic records.

---

# 24. Concurrency

Assume two requests can happen at approximately the same time.

Consider concurrency for:

- result processing
- account creation
- imports
- backlog updates
- status transitions
- administrative actions

Database constraints, locking, idempotency, or appropriate transaction isolation should be used where necessary.

---

# 25. Date and Time

Use a consistent date/time strategy.

Where timestamps represent system events, store them in a consistent canonical representation, preferably UTC.

Examples:

```text
createdAt
updatedAt
processedAt
validatedAt
```

Display formatting belongs to the presentation layer.

Do not mix arbitrary timezone assumptions throughout the application.

---

# 26. Identifiers

Use stable identifiers.

Do not use:

- names
- email addresses
- display labels

as database primary keys unless explicitly designed.

Foreign-key relationships should use stable IDs.

---

# 27. Pagination

Do not return unlimited records from APIs.

Use pagination for potentially large collections:

```text
students
results
imports
validation records
backlogs
audit logs
analytics records
```

The API should define consistent pagination semantics.

---

# 28. Search and Filtering

Search/filter behavior must be:

- explicit
- validated
- predictable
- efficiently queried

Do not load thousands of records into the frontend simply to filter them in JavaScript.

Prefer server-side filtering for large datasets.

---

# 29. Performance

Performance should be considered during implementation rather than after the system becomes slow.

Watch for:

- N+1 queries
- unnecessary API requests
- excessive frontend re-renders
- large payloads
- unbounded queries
- expensive calculations
- repeated database lookups
- unnecessary file processing
- large synchronous operations

Do not optimize blindly.

Measure first when optimization is not obvious.

---

# 30. File Processing

Result import supports:

- Excel
- CSV

File processing must include appropriate:

- file type validation
- size validation
- parsing validation
- structure validation
- error handling
- duplicate handling
- auditability

Never trust file extensions alone.

---

# 31. Background Jobs

Long-running operations should not block normal HTTP requests unnecessarily.

Examples:

```text
large result import
large validation operation
result processing
future university synchronization
bulk processing
```

Where asynchronous processing is used, expose a meaningful job/status model.

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

# 32. Logging

Logs must help diagnose problems without exposing sensitive information.

Useful log context may include:

```text
correlationId
userId
collegeId
operation
resourceId
resultImportId
status
duration
```

Do not log:

- passwords
- tokens
- secrets
- sensitive credentials
- unnecessary academic data

---

# 33. Auditability

Important administrative and academic operations should be auditable.

Examples:

- account creation
- account status changes
- role changes
- college changes
- result import
- result processing
- backlog-changing operations
- security-sensitive actions

Audit data should be useful for investigation without becoming a duplicate business source of truth.

---

# 34. Configuration

Do not hard-code environment-specific configuration.

Avoid:

```java
String databasePassword = "password123";
```

Use environment/configuration management.

Examples:

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
JWT_SECRET
FILE_STORAGE_CONFIG
```

Secrets must never be committed to Git.

---

# 35. Dependency Rules

Before adding a dependency:

1. confirm that it solves a real requirement
2. check whether an existing dependency already provides the capability
3. consider maintenance status
4. consider security implications
5. consider bundle/build impact
6. document the reason when appropriate

Do not add libraries for trivial functionality that can be implemented safely without them.

---

# 36. Comments

Comments should explain **why**, not simply repeat **what** the code does.

Bad:

```java
// Increment counter
counter++;
```

Good:

```java
// Preserve the original attempt number because academic history
// must remain immutable after processing.
attemptNumber++;
```

---

## 36.1 Avoid Commented-Out Code

Do not keep large blocks of obsolete code commented out.

Use Git history instead.

---

# 37. TODO Rules

Use TODO only when the future work is meaningful and identifiable.

Good:

```text
TODO: Add authorized university API adapter after API contract is confirmed.
```

Bad:

```text
TODO: Fix this
TODO: Improve
TODO: Something
```

Important unresolved decisions should also be recorded in the appropriate documentation.

---

# 38. Dead Code

Do not leave:

- unused methods
- unused imports
- unused variables
- unreachable branches
- abandoned components
- obsolete API clients
- duplicate implementations

in the codebase without justification.

Remove dead code or document why it must remain.

---

# 39. Duplication

Avoid unnecessary duplication.

However:

> Duplication is sometimes preferable to premature abstraction.

Do not create a generic abstraction merely because two implementations have similar syntax.

Abstract when they share:

- domain meaning
- lifecycle
- change pattern
- responsibility

not merely appearance.

---

# 40. Frontend General Rules

Frontend-specific standards are defined in:

`frontend-rules.md`

General rules:

- TypeScript should be used consistently.
- Avoid `any`.
- Keep business logic out of presentation components.
- Use the API as the source of authoritative academic data.
- Handle loading, error, empty, and success states.
- Do not trust frontend authorization.
- Keep server state and UI state conceptually separate.
- Respect responsive and accessibility requirements.
- Do not expose secrets in frontend code.

---

# 41. Backend General Rules

Backend-specific standards are defined in:

`backend-rules.md`

General rules:

- Controllers should remain thin.
- Business logic belongs in application/domain services.
- Repositories handle persistence.
- DTOs define API boundaries.
- Validate input.
- Enforce authorization server-side.
- Enforce tenant isolation.
- Use transactions deliberately.
- Preserve academic history.
- Use meaningful exceptions.
- Avoid leaking persistence models through APIs.

---

# 42. Database General Rules

Database-specific standards are defined in:

`database-rules.md`

General rules:

- enforce important integrity constraints
- use foreign keys appropriately
- use indexes based on query patterns
- avoid unnecessary duplication
- preserve historical academic data
- use migrations
- avoid destructive schema changes without migration planning
- consider tenant filtering/indexing
- use appropriate data types
- avoid storing derived values as authoritative data without a clear reason

---

# 43. Security Rules

Security-specific standards are defined in:

`security-rules.md`

Security rules always take priority over convenience.

Never weaken:

- authentication
- authorization
- tenant isolation
- password protection
- secret handling
- input validation
- file security
- auditability

simply to make development easier.

---

# 44. Testing Rules

Code should be testable by design.

Tests should cover appropriate levels:

```text
Unit
 ↓
Integration
 ↓
API
 ↓
Security
 ↓
End-to-End
```

Critical academic workflows require stronger coverage.

Especially:

- result validation
- result processing
- attempt handling
- backlog transitions
- academic calculations
- tenant isolation
- authorization
- account provisioning

---

## 44.1 Test Business Rules, Not Implementation Details

Prefer:

```text
Given valid result
When result is processed
Then academic record is created
And backlog state is updated correctly
```

over tests that merely verify internal method calls.

---

# 45. Git Rules

Commits should be:

- focused
- understandable
- related to one logical change

Avoid huge commits containing unrelated:

```text
feature + refactor + formatting + dependency upgrade
```

unless there is a legitimate reason.

---

## 45.1 Do Not Commit Secrets

Never commit:

```text
.env
passwords
API keys
JWT secrets
private credentials
production secrets
```

Use environment configuration and secret management.

---

# 46. Refactoring Rules

Refactoring should have a clear reason.

Good reasons:

- remove duplication
- improve maintainability
- fix architectural violation
- improve testability
- remove dead code
- improve performance
- address security issue

Avoid unrelated refactoring while implementing a feature.

---

# 47. Breaking Changes

Before introducing a breaking change, evaluate:

```text
Database
Backend
API
Frontend
Tests
Existing data
Deployment
Documentation
```

Do not assume that changing one layer has no effect on the others.

---

# 48. Migration Rules

Database schema changes must be handled through the project's migration strategy.

Do not manually change production schema without a documented migration.

A migration should consider:

- existing data
- backward compatibility
- indexes
- constraints
- rollback/recovery
- deployment order

---

# 49. API and Frontend Synchronization

When changing an API:

1. update API contract
2. update backend implementation
3. update frontend types/services
4. update UI usage
5. update tests
6. update documentation

Do not silently change response fields or semantics.

---

# 50. Academic Data Integrity

Academic data must be treated as high-integrity business data.

Rules:

- preserve history
- avoid silent overwrites
- preserve attempts
- validate imported data
- track processing
- avoid invented values
- maintain auditability
- use transactions for critical updates
- do not silently convert unknown values
- maintain source context where required

---

# 51. Error Recovery

Failures should leave the system in a known state.

For example:

```text
Import
 ↓
Validation
 ↓
Processing
```

If processing fails, the system must not appear to the user as though it completed successfully.

Use explicit statuses and error information.

---

# 52. State Transition Rules

Important domain statuses should have controlled transitions.

Example:

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

Do not allow arbitrary status changes from any state.

---

# 53. Data Integrity Over UI Convenience

Never weaken backend/domain rules merely because a frontend interaction is easier that way.

For example:

```text
UI allows action
```

does not imply:

```text
business operation is valid
```

The backend remains authoritative.

---

# 54. Accessibility and Usability

All user-facing functionality should consider:

- keyboard navigation
- visible focus
- semantic HTML
- accessible labels
- appropriate ARIA usage
- readable error messages
- sufficient contrast
- responsive behavior
- reduced motion preferences

Accessibility should not be treated as a final cosmetic task.

---

# 55. Performance and User Experience

The application should provide meaningful feedback for long-running operations.

Examples:

```text
Uploading...
Validating...
Processing...
Completed
Failed
```

Do not leave users wondering whether an action succeeded.

---

# 56. Documentation Rules

When implementation changes a documented behavior, update the relevant documentation.

Documentation may include:

```text
PRD
Feature Specification
Architecture
API documentation
Database documentation
Project Rules
Task breakdown
Implementation notes
Changelog
```

Code and documentation should not intentionally contradict each other.

---

# 57. Architecture Decision Rules

When a significant technical decision is made, document:

- problem
- decision
- alternatives considered
- reason
- consequences
- affected modules

Do not hide important architectural decisions inside implementation code.

---

# 58. AI-Assisted Development

AI coding agents must follow:

`ai-coding-rules.md`

AI-generated code is treated exactly like human-written code for:

- correctness
- security
- testing
- review
- architecture
- maintainability

Never merge AI-generated code merely because it compiles.

---

# 59. Code Review Rules

Every meaningful change should be reviewed for:

### Correctness

- Does it satisfy the requirement?
- Are edge cases handled?

### Architecture

- Is the correct module responsible?
- Are boundaries respected?

### Security

- Is authorization enforced?
- Is tenant isolation preserved?
- Are sensitive values protected?

### Data integrity

- Can data be duplicated?
- Can historical data be lost?
- Can invalid data become authoritative?

### Performance

- Are queries bounded?
- Are unnecessary requests introduced?

### Maintainability

- Is the implementation understandable?
- Is abstraction justified?

### Testing

- Are important behaviors covered?

---

# 60. Definition of Done

A coding task is not considered complete merely because the code works locally.

A meaningful implementation should satisfy applicable items:

- [ ] Requirement understood
- [ ] Correct module selected
- [ ] Architecture respected
- [ ] Source-of-truth rules respected
- [ ] Tenant isolation verified
- [ ] Authorization verified
- [ ] Input validation implemented
- [ ] Error handling implemented
- [ ] Database changes migrated
- [ ] API contract updated if necessary
- [ ] Frontend updated if necessary
- [ ] Tests added/updated
- [ ] Edge cases considered
- [ ] Academic history preserved
- [ ] No secrets committed
- [ ] Logging is appropriate
- [ ] Documentation updated
- [ ] No unnecessary refactoring
- [ ] Code reviewed
- [ ] Relevant security checks completed

---

# 61. Rule Priority

When rules conflict, use the following priority:

```text
1. Security and legal/data-protection requirements
2. Explicit product requirements
3. Approved architecture decisions
4. Feature specifications
5. Database/data-ownership rules
6. Backend/frontend specific rules
7. General coding rules
8. Developer preference
```

A developer preference must not override a documented architectural or security requirement.

---

# 62. Relationship With Other Documents

This document should be used together with:

```text
07-project-rules/
├── coding-rules.md
├── frontend-rules.md
├── backend-rules.md
├── database-rules.md
├── security-rules.md
└── ai-coding-rules.md
```

Architecture:

```text
05-architecture/
```

Feature behavior:

```text
09-development/feature-specifications/
```

Testing:

```text
10-testing/
```

Security review:

```text
11-security/
```

The documents are complementary.

They should not contain conflicting definitions of the same core rule.

---

# 63. Unresolved Decisions

The following items should remain explicitly documented until finalized:

- exact authentication/session mechanism
- account activation mechanism
- password reset delivery mechanism
- database migration technology
- file storage implementation
- background job implementation
- exact university-specific academic calculation rules
- exact multi-tenant database strategy
- caching strategy
- production deployment architecture
- observability stack
- notification/email provider

Do not silently invent these decisions during implementation.

---

# 64. Status

**Current Status:** Draft / Under Review

This document becomes **Approved** only after review against:

- system architecture
- frontend rules
- backend rules
- database rules
- security rules
- AI coding rules
- feature specifications

After approval, implementation should follow this document unless an explicit architectural or product decision supersedes it.

---

# 65. Final Engineering Principle

> **Write code that preserves correctness, domain meaning, security, data integrity, and maintainability before optimizing for speed of implementation.**

For Acadlytic specifically:

```text
Correctness
    ↓
Data Integrity
    ↓
Security
    ↓
Architecture
    ↓
Maintainability
    ↓
Performance
    ↓
Developer Convenience
```

Developer convenience must never compromise academic data integrity or system security.