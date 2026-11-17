# Acadlytic — Coding Rules

**Project:** Acadlytic  
**Document:** Coding Rules  
**Version:** 1.0  
**Status:** Draft / Under Review  
**Related Area:** `07-project-rules/`

---

# 1. Purpose

This document defines the general coding standards and engineering rules for the Acadlytic codebase.

These rules apply to:

- frontend code
- backend code
- database-related code
- APIs
- integrations
- tests
- configuration
- utilities
- shared components
- background jobs

The purpose is to keep the codebase:

- consistent
- readable
- maintainable
- testable
- secure
- scalable
- understandable by developers and AI coding agents

---

# 2. Scope

These rules apply to all source code added to the Acadlytic repository.

The rules cover:

- naming
- project structure
- code organization
- functions
- classes
- components
- error handling
- validation
- logging
- comments
- dependencies
- configuration
- testing
- security
- Git practices
- AI-assisted development

Technology-specific rules are defined separately:

```text
07-project-rules/
├── coding-rules.md
├── frontend-rules.md
├── backend-rules.md
├── database-rules.md
├── security-rules.md
└── ai-coding-rules.md
```

This document provides the common baseline.

---

# 3. Core Engineering Principles

Acadlytic development should follow these principles:

1. Prefer clarity over cleverness.
2. Prefer simple solutions over unnecessary abstraction.
3. Keep modules focused.
4. Keep business rules explicit.
5. Do not duplicate business logic.
6. Keep source-of-truth ownership clear.
7. Validate input at system boundaries.
8. Never trust client-side validation alone.
9. Preserve historical academic data.
10. Keep authorization on the backend.
11. Keep frontend and backend responsibilities separate.
12. Write testable code.
13. Avoid unnecessary dependencies.
14. Avoid premature optimization.
15. Document important architectural decisions.

---

# 4. Code Readability

Code must be written for humans first.

Prefer:

```java
calculateSemesterResult();
```

over:

```java
csr();
```

Prefer:

```java
studentAcademicRecord;
```

over:

```java
sar;
```

Short names are acceptable for conventional concepts such as:

```text
id
url
api
dto
http
sql
```

---

# 5. Naming Principles

Names must communicate intent.

A name should answer:

> What does this thing represent?

Avoid vague names such as:

```text
data
info
temp
value
obj
item
thing
result
```

when a more meaningful name is possible.

For example:

```java
StudentResult result;
```

may be acceptable when the context is clear.

But:

```java
Object data;
```

should generally be avoided.

---

# 6. General Naming Conventions

Use:

```text
Classes          → PascalCase
Interfaces      → PascalCase
Methods         → camelCase
Variables       → camelCase
Constants       → UPPER_SNAKE_CASE
Packages        → lowercase
Database tables → snake_case
Database columns→ snake_case
API paths       → lowercase/kebab or resource-oriented convention
React components→ PascalCase
React hooks     → camelCase beginning with use
```

Examples:

```java
StudentService
StudentController
ResultProcessingService
MAX_LOGIN_ATTEMPTS
```

---

# 7. Boolean Naming

Boolean values should read naturally.

Prefer:

```java
isActive
hasBacklog
canProcess
isValid
isAuthenticated
```

Avoid:

```java
activeFlag
backlogFlag
checkStatus
```

unless the meaning genuinely requires those names.

---

# 8. Constants

Repeated fixed values should not be scattered throughout the code.

Prefer:

```java
private static final int MAX_LOGIN_ATTEMPTS = 5;
```

instead of:

```java
if (attempts >= 5) {
}
```

However, do not create constants for values that are used only once and have no semantic meaning.

---

# 9. Magic Numbers

Avoid unexplained magic numbers.

Bad:

```java
if (status == 3) {
}
```

Better:

```java
if (status == StudentStatus.ACTIVE) {
}
```

or:

```java
private static final int MAX_ATTEMPTS = 3;
```

The meaning should be explicit.

---

# 10. Function and Method Rules

Functions should generally perform one logical responsibility.

Prefer:

```java
validateStudent();
matchStudent();
processResult();
```

rather than one extremely large method performing every operation.

A method should not become a "god method" containing:

- validation
- persistence
- authorization
- calculations
- notifications
- logging
- formatting

all at once.

---

# 11. Method Size

There is no mandatory maximum line count.

However, a method should be reconsidered when:

- it becomes difficult to understand
- it contains several unrelated responsibilities
- it requires excessive nesting
- it becomes difficult to test
- the same logic needs to be extracted

Do not split methods purely to satisfy an arbitrary line limit.

---

# 12. Conditional Logic

Prefer readable conditions.

Avoid deeply nested conditions:

```java
if (...) {
    if (...) {
        if (...) {
            if (...) {
            }
        }
    }
}
```

Use:

- guard clauses
- extracted methods
- clear validation steps

where appropriate.

Example:

```java
if (!studentExists) {
    throw new StudentNotFoundException();
}

if (!studentBelongsToCollege) {
    throw new AccessDeniedException();
}
```

---

# 13. Null Handling

Null handling must be deliberate.

Do not silently ignore required values.

Bad:

```java
if (student != null) {
    process(student);
}
```

when a missing student should actually be an error.

Prefer explicit domain behavior:

```java
Student student = studentRepository.findById(studentId)
    .orElseThrow(StudentNotFoundException::new);
```

---

# 14. Optional Values

Optional values should be represented clearly.

For Java backend code, use `Optional` where appropriate for repository/service return values.

Do not use `Optional` indiscriminately for:

- every field
- method parameters
- simple local variables

---

# 15. Exception Handling

Exceptions must represent meaningful failure conditions.

Avoid:

```java
catch (Exception e) {
}
```

Silent exception swallowing is prohibited.

Bad:

```java
try {
    process();
} catch (Exception e) {
    // ignore
}
```

If an exception cannot be recovered from, it should be handled or propagated intentionally.

---

# 16. Error Messages

Error messages should:

- explain the problem
- avoid leaking sensitive information
- remain useful to the client
- use stable error codes where APIs require them

Do not expose:

- passwords
- tokens
- secrets
- stack traces
- database credentials
- internal security details

to users.

---

# 17. Validation

Validation must happen at appropriate boundaries.

Examples:

```text
HTTP request
    ↓
Request validation
    ↓
Business validation
    ↓
Domain operation
    ↓
Persistence
```

Client-side validation improves user experience.

Server-side validation protects the system.

Client-side validation must never replace backend validation.

---

# 18. Business Rules

Business rules must live in appropriate backend/domain services.

Do not implement critical business rules only in React.

Examples:

- student ownership
- tenant isolation
- result processing
- backlog lifecycle
- grade validation
- duplicate prevention
- account permissions

must be enforced server-side.

---

# 19. Source-of-Truth Rule

Every important piece of data must have a clear owner.

Examples:

```text
College
→ College Management

Student
→ Student Management

Course / Semester / Subject
→ Academic Structure

Import Job
→ Result Import

Validation State
→ Result Validation

Processed Academic Result
→ Result Processing

Backlog
→ Backlog Tracking

Academic Passport
→ Read-oriented representation

Analytics
→ Derived/read layer
```

Developers must consult:

```text
05-architecture/data-ownership.md
```

before modifying cross-module data.

---

# 20. Cross-Module Mutation

One module must not directly modify another module's owned data without going through the appropriate application/domain operation.

Avoid:

```text
Analytics
    ↓
UPDATE student_result
```

Instead:

```text
Analytics
    ↓
Read authoritative data
```

For mutations:

```text
Result Processing
    ↓
Backlog domain operation
    ↓
Backlog Tracking
```

Ownership must remain clear.

---

# 21. Database Access

Application code should not bypass the defined persistence layer without a documented reason.

Avoid arbitrary SQL scattered throughout services.

Use the project's configured persistence approach:

```text
Spring Data JPA
Hibernate
Repositories
Services
```

Native SQL may be used when justified by:

- performance
- database-specific functionality
- complex query requirements

Such usage should be documented.

---

# 22. Entity Exposure

Persistence entities must not automatically become API responses.

Use:

```text
Entity
↓
Service
↓
DTO
↓
Controller
↓
API Response
```

Do not expose JPA entities directly unless explicitly approved by the architecture.

---

# 23. DTO Rules

DTOs should represent API contracts.

Use separate request and response DTOs where appropriate.

Examples:

```text
CreateStudentRequest
UpdateStudentRequest
StudentResponse
StudentSummaryResponse
```

Do not include unnecessary internal fields in public responses.

---

# 24. API Contract Stability

Once an API contract is established, changes must be deliberate.

Before changing:

- endpoint
- request field
- response field
- status code
- error structure

check:

```text
API Architecture
Feature Specification
Frontend Usage
Tests
```

Breaking changes require versioning or an explicit migration strategy.

---

# 25. Authentication and Authorization

Authentication and authorization must never be treated as frontend-only concerns.

The backend must verify:

- authenticated identity
- role
- tenant
- resource ownership
- permission

For every protected operation.

A hidden button is not authorization.

---

# 26. Tenant Isolation

Acadlytic is multi-tenant.

Tenant boundaries must be enforced server-side.

Every college-specific operation must verify the appropriate tenant context.

Never trust a client-provided `collegeId` without authorization validation.

---

# 27. IDOR Prevention

Resource IDs received from clients must never automatically grant access.

For example:

```text
GET /api/v1/students/123
```

must verify that the authenticated user is authorized to access student `123`.

Never assume:

```text
authenticated = authorized
```

---

# 28. Logging

Logs should provide enough information to diagnose problems without exposing sensitive data.

Good log information may include:

- timestamp
- request/correlation ID
- operation
- module
- status
- duration
- relevant resource ID

Avoid logging:

- passwords
- access tokens
- refresh tokens
- secrets
- sensitive personal data unnecessarily

---

# 29. Correlation IDs

Requests should support correlation/request IDs where defined by the architecture.

Conceptually:

```text
Client
  ↓
Request ID
  ↓
Controller
  ↓
Service
  ↓
Repository / Job
  ↓
Logs
```

This allows a single operation to be traced across layers.

---

# 30. Comments

Comments should explain **why**, not simply repeat **what** the code does.

Bad:

```java
// increment counter
counter++;
```

Better:

```java
// Retry count is incremented only after a failed external processing attempt.
retryCount++;
```

Avoid comments that become incorrect when code changes.

---

# 31. TODO Rules

TODO comments should be meaningful.

Bad:

```java
// TODO fix
```

Better:

```java
// TODO: Replace file-based result import with the authorized university connector
// when the university integration contract becomes available.
```

Important TODOs should also be tracked in project documentation or issue management.

---

# 32. Dead Code

Do not keep unused:

- methods
- variables
- imports
- components
- services
- dependencies
- commented-out implementations

unless there is a documented reason.

Version control already preserves previous code.

---

# 33. Duplicate Code

Avoid unnecessary duplication.

If the same logic is genuinely shared, consider:

- shared utility
- service
- reusable component
- domain operation

However, do not create abstractions merely because two pieces of code currently look similar.

Prefer meaningful abstraction over premature abstraction.

---

# 34. Abstraction Rule

Create an abstraction when:

- behavior is genuinely shared
- the abstraction has a clear responsibility
- it improves maintainability
- it reduces meaningful duplication

Do not create:

```text
GenericManager
GenericProcessor
GenericHelper
GenericService
```

without a clear domain purpose.

---

# 35. Dependency Management

Every dependency must have a reason.

Before adding a library, evaluate:

- existing project capabilities
- maintenance status
- security
- bundle/build impact
- license
- community adoption
- compatibility
- whether the functionality can be implemented simply without another dependency

Avoid dependency duplication.

---

# 36. Configuration

Configuration should not be hardcoded.

Examples:

- database URLs
- credentials
- API keys
- environment-specific URLs
- secrets
- storage configuration

Use environment/configuration management.

Never commit secrets to Git.

---

# 37. Environment Separation

The application should distinguish:

```text
Development
Testing
Preview/Staging
Production
```

Environment-specific behavior should be configured rather than hardcoded.

Example:

```text
application-dev.yml
application-prod.yml
```

must not contain committed production secrets.

---

# 38. Frontend Environment Variables

Frontend environment variables must be treated carefully.

Anything bundled into a browser application should be considered potentially public.

Never put secret credentials into frontend environment variables.

Only public configuration belongs in frontend build-time variables.

---

# 39. API Calls

Frontend API calls should go through the centralized API/service layer.

Avoid scattered direct calls such as:

```typescript
fetch("https://api.example.com/...")
```

throughout UI components.

Prefer:

```text
Component
↓
Feature API/service
↓
HTTP client
↓
Backend API
```

---

# 40. State Management

Use the appropriate state mechanism.

Prefer:

```text
Server state
→ TanStack Query

Local component state
→ React useState/useReducer

Global client state
→ Zustand where required
```

Do not put all application state into one global store.

---

# 41. Component Responsibility

React components should primarily handle:

- presentation
- interaction
- composition

Business logic should be placed in appropriate:

- hooks
- services
- feature modules
- backend services

Do not create extremely large components containing the entire feature.

---

# 42. Reusable Components

Reusable UI components should:

- have clear responsibilities
- have predictable props
- avoid unnecessary feature-specific assumptions
- remain accessible
- support responsive behavior
- have consistent states

Examples:

```text
Button
Modal
DataTable
Pagination
FormField
EmptyState
LoadingState
ErrorState
```

---

# 43. Feature Modules

Feature code should remain close to the feature.

Example:

```text
features/
├── students/
├── results/
├── backlogs/
├── passport/
└── analytics/
```

Avoid placing feature-specific logic into unrelated global folders.

---

# 44. Backend Module Boundaries

Backend modules should follow domain boundaries.

Example:

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

A module should not become dependent on every other module.

---

# 45. Dependency Direction

Dependencies should follow architectural boundaries.

Conceptually:

```text
Controller
   ↓
Application/Service
   ↓
Domain
   ↓
Persistence / Infrastructure
```

Cross-module dependencies must follow the ownership and architecture rules.

Avoid circular dependencies.

---

# 46. Circular Dependencies

Do not introduce:

```text
Module A → Module B
Module B → Module A
```

without an explicit architectural reason.

If a circular dependency appears, reconsider:

- ownership
- service boundaries
- shared abstractions
- domain responsibilities

---

# 47. Transactions

Transactions should protect meaningful business operations.

For example:

```text
Result Processing
    ↓
Persist Result
    ↓
Update Academic State
    ↓
Update Backlog
    ↓
Update Passport Projection
```

The exact transaction strategy must follow:

```text
05-architecture/system-architecture.md
05-architecture/api-architecture.md
feature specifications
```

Do not add arbitrary transaction boundaries.

---

# 48. Idempotency

Retryable operations must be safe against duplicate execution where required.

This is particularly important for:

- result imports
- result processing
- background jobs
- external integrations

Use the architecture-defined idempotency strategy.

Never assume a network request will execute exactly once.

---

# 49. Historical Data

Academic history must be preserved.

Do not overwrite historical attempts simply to represent the latest result.

For example:

```text
Attempt 1 → FAIL
Attempt 2 → PASS
```

Both attempts should remain available where required.

Current status may become:

```text
CLEARED
```

but historical attempts remain preserved.

---

# 50. Academic Calculation Rules

Developers must not invent university-specific academic formulas.

Before implementing:

- SGPA
- CGPA
- grade conversion
- credit calculation
- percentage conversion
- eligibility

consult the relevant academic rules and feature specifications.

If the required rule is not documented, mark it as an unresolved decision rather than guessing.

---

# 51. Result Processing Rules

Result processing must respect:

```text
Result Import
      ↓
Result Validation
      ↓
Result Processing
      ↓
Academic Records
      ↓
Backlog
      ↓
Academic Passport
      ↓
Analytics
```

Do not bypass validation unless explicitly defined by the architecture.

---

# 52. Backlog Rules

Backlog state must be controlled by the Backlog Tracking domain.

Examples:

```text
FAIL
 ↓
Create / Update Active Backlog

SUPPLEMENTARY PASS
 ↓
Clear Active Backlog
 ↓
Preserve History
```

Other modules may request backlog operations but must not silently redefine backlog business rules.

---

# 53. Analytics Rules

Analytics must be derived from authoritative data.

Analytics code must not:

- modify academic records
- modify backlog state
- redefine SGPA/CGPA
- treat missing data as zero
- double-count attempts

Every official metric must have a documented definition.

---

# 54. Academic Passport Rules

Academic Passport is a read-oriented academic representation.

It must not become a competing source of truth.

Do not independently maintain conflicting academic values in the passport layer.

---

# 55. File Processing Rules

Uploaded files must be treated as untrusted input.

File processing must include:

- file type validation
- size validation
- safe storage
- parser validation
- error handling
- tenant association
- authorization

Do not trust:

- filename
- MIME type alone
- spreadsheet contents
- client-provided metadata

---

# 56. External Integration Rules

External integrations must use explicit adapters.

Conceptually:

```text
External Source
      ↓
Connector / Adapter
      ↓
Normalized Data
      ↓
Acadlytic Domain
```

Do not spread external-system-specific logic throughout core business modules.

---

# 57. Unauthorized Scraping

Do not implement unauthorized university scraping as a core integration strategy.

The architecture should support:

- authorized APIs
- authorized feeds
- webhooks
- official exports
- Excel/CSV files

where available and permitted.

---

# 58. Background Jobs

Long-running operations should not block ordinary HTTP requests unnecessarily.

Examples:

- large result imports
- result processing
- scheduled integration checks
- large analytics generation

Use the project's background job strategy.

Job states must be observable.

---

# 59. Concurrency

Code must account for concurrent operations where business correctness requires it.

Examples:

- two administrators processing the same result import
- duplicate result uploads
- simultaneous account updates
- concurrent backlog updates

Use appropriate:

- database constraints
- optimistic locking
- transaction boundaries
- idempotency
- job locking

according to the architecture.

---

# 60. Database Constraints

Application validation is not a substitute for database integrity.

Where appropriate, enforce:

- unique constraints
- foreign keys
- not-null constraints
- indexes
- check constraints where supported and useful

Database rules are defined in:

```text
07-project-rules/database-rules.md
```

and the database architecture.

---

# 61. API Error Handling

API errors should use the standardized error response defined by:

```text
05-architecture/api-architecture.md
```

Do not create feature-specific error response formats without approval.

---

# 62. Testing Rules

New functionality should include appropriate tests.

Depending on the feature:

```text
Unit tests
Integration tests
Repository tests
API tests
Component tests
End-to-end tests
```

Critical business rules should have automated tests.

---

# 63. Test Naming

Test names should describe behavior.

Prefer:

```java
shouldCreateBacklogWhenStudentFailsSubject()
```

over:

```java
testBacklog()
```

A test name should make the expected behavior obvious.

---

# 64. Test Isolation

Tests should not depend on:

- execution order
- another test's database state
- developer-specific configuration
- external services unless intentionally mocked/integrated

Each test should establish the state it requires.

---

# 65. Test Data

Test data should be:

- deterministic
- minimal
- meaningful
- isolated

Do not use real student personal data in development or testing.

---

# 66. Security by Default

New code must assume:

```text
Input is untrusted.
Client is untrusted.
IDs are untrusted.
Files are untrusted.
External systems are untrusted.
```

Security should be the default behavior, not an optional enhancement.

---

# 67. Sensitive Data

Do not expose sensitive information unnecessarily.

Examples include:

- passwords
- authentication tokens
- secret keys
- private integration credentials
- unnecessary personal information

Only collect and expose data required for the feature.

---

# 68. Personal Data

Student information must be handled carefully.

Developers should:

- minimize exposure
- avoid unnecessary logging
- protect APIs
- enforce tenant isolation
- use authorized access only
- avoid exposing student data in URLs/logs where unnecessary

---

# 69. Git Rules

Git should be used as the project's source-control system.

Commits should be:

- focused
- meaningful
- reviewable

Avoid huge commits containing unrelated changes.

---

# 70. Commit Naming

Use a consistent commit convention.

Recommended format:

```text
type(scope): description
```

Examples:

```text
feat(auth): add account provisioning
fix(results): prevent duplicate result processing
refactor(students): simplify student service
test(backlogs): add supplementary pass tests
docs(api): update result processing endpoints
```

---

# 71. Pull Requests

Pull requests should explain:

- what changed
- why it changed
- affected modules
- tests performed
- database changes
- API changes
- security implications
- known limitations

---

# 72. Code Review

Reviewers should check:

```text
Correctness
Architecture
Security
Data ownership
Performance
Testing
Readability
API compatibility
Database impact
Responsive frontend behavior
```

A feature should not be approved solely because it works in a happy-path demo.

---

# 73. Breaking Changes

Breaking changes require explicit review.

Examples:

- API contract changes
- database schema changes
- authentication changes
- permission changes
- data ownership changes
- route changes
- major dependency changes

Document migration requirements where necessary.

---

# 74. Database Migration Rules

Database schema changes must be version-controlled.

Do not manually modify production schema without a controlled migration strategy.

Migration tooling and exact practices will be defined by:

```text
05-architecture/database-architecture.md
07-project-rules/database-rules.md
```

---

# 75. Dependency Updates

Dependency updates should be reviewed for:

- compatibility
- security vulnerabilities
- breaking changes
- build impact
- runtime behavior

Do not upgrade major dependencies blindly.

---

# 76. Performance Rules

Performance should be considered during implementation.

Avoid:

- N+1 database queries
- unnecessary API requests
- loading entire datasets
- unnecessary React re-renders
- unbounded result processing
- expensive operations inside HTTP requests
- duplicate calculations

Optimize based on measured or clearly understood bottlenecks.

---

# 77. Caching

Caching should only be introduced where justified.

Before caching, identify:

- source of truth
- invalidation strategy
- stale-data tolerance
- tenant boundaries
- authorization boundaries

Incorrect caching can cause data leakage or stale academic information.

---

# 78. Pagination

Large collections should use pagination.

Examples:

- students
- result records
- imports
- backlogs
- analytics datasets

Do not return thousands of records unnecessarily.

---

# 79. Search and Filtering

Search and filtering should preferably occur server-side for large datasets.

Example:

```text
Student Search
     ↓
API
     ↓
Database Query
     ↓
Paginated Results
```

Do not download the entire student database to the browser just to filter it.

---

# 80. Frontend Error Boundaries

React applications should use appropriate error boundaries around major application areas where required.

A failure in one UI area should not unnecessarily crash the entire application.

---

# 81. Accessibility

All UI code should follow the accessibility requirements defined by the design system.

Developers should use:

- semantic HTML
- accessible labels
- keyboard support
- visible focus states
- appropriate ARIA
- accessible forms
- accessible tables
- sufficient contrast

---

# 82. Responsive Design

Frontend implementation must follow:

```text
06-design/responsive-design.md
```

Every feature should be tested at:

- mobile
- tablet
- desktop

Responsive behavior must not be added as an afterthought.

---

# 83. Internationalization

The initial product may use English as the primary interface language.

However, user-facing text should not be unnecessarily scattered throughout complex logic if future localization is expected.

Language-specific strings should be structured so localization can be introduced later.

---

# 84. Date and Time

Date/time handling must be explicit.

Where applicable:

```text
Storage
→ UTC

Display
→ User/application timezone
```

Do not manually manipulate dates using ambiguous string operations.

Use established date/time libraries and documented timezone rules.

---

# 85. IDs

IDs should be treated as opaque identifiers.

Do not assume clients can infer:

- database sequence
- internal structure
- tenant
- permissions

from an ID.

Authorization must always be performed independently.

---

# 86. API URLs

Do not construct API URLs manually in many unrelated components.

Use the centralized API configuration.

Example:

```text
API Base URL
+
Version
+
Resource
```

instead of hardcoded URLs throughout the application.

---

# 87. Feature Flags

Feature flags should be used when a feature needs controlled rollout.

Examples:

```text
advancedAnalytics
universityIntegration
whatIfSimulator
```

Do not leave permanent unused feature flags without documentation.

---

# 88. Experimental Code

Experimental features must not silently become production architecture.

If an experiment is introduced:

- isolate it
- document it
- define its purpose
- define its removal or adoption criteria

---

# 89. Documentation

Important implementation decisions should be documented.

Documentation should answer:

- What was decided?
- Why?
- What alternatives were considered?
- What constraints exist?
- What future change might require revisiting it?

Do not document obvious implementation details that the code already clearly communicates.

---

# 90. Architecture Decision Records

Significant architectural decisions should be recorded when appropriate.

Examples:

- modular monolith instead of microservices
- MySQL selection
- authentication strategy
- result import architecture
- university integration approach
- Academic Passport projection model

---

# 91. AI-Assisted Development

AI coding agents may be used to assist development.

However, AI-generated code must follow the same engineering standards as manually written code.

AI output must not automatically be considered correct.

Developers must review:

- architecture
- business rules
- security
- authorization
- database impact
- performance
- tests
- edge cases

---

# 92. AI Context Requirements

Before modifying a feature, an AI coding agent should inspect the relevant documentation.

At minimum:

```text
Project Context
↓
Relevant Feature Specification
↓
Data Ownership
↓
Relevant Architecture
↓
Project Rules
↓
Existing Implementation
```

The agent must not invent missing requirements.

---

# 93. AI Coding Boundaries

AI coding agents must not:

- invent business rules
- invent academic formulas
- bypass authorization
- modify another module's data ownership
- expose entities directly
- remove validation without justification
- silently change APIs
- silently change database schema
- introduce unnecessary dependencies
- replace architecture without approval

---

# 94. AI Change Scope

An AI agent should make the smallest coherent change required to satisfy the task.

Avoid unrelated refactoring during feature implementation.

If a broader refactor is necessary, explain:

- why
- what files are affected
- risks
- expected benefit

---

# 95. AI Verification

AI-generated code should be verified with:

```text
Compilation
↓
Unit Tests
↓
Integration Tests
↓
API Tests
↓
Frontend Tests
↓
Security Review
↓
Manual Verification
```

where applicable.

---

# 96. Definition of Done for Code

Code is considered complete when:

- [ ] Requirement is implemented
- [ ] Correct module owns the behavior
- [ ] Architecture is respected
- [ ] Data ownership is respected
- [ ] Authorization is enforced
- [ ] Validation is implemented
- [ ] Error handling is implemented
- [ ] Tests are added/updated
- [ ] No obvious security issue exists
- [ ] No unnecessary dependency was introduced
- [ ] No unnecessary duplication exists
- [ ] Responsive behavior is verified for frontend changes
- [ ] API contract is verified for API changes
- [ ] Database changes are migrated and tested
- [ ] Documentation is updated where required
- [ ] Code review is completed

---

# 97. Pre-Commit Checklist

Before committing:

```text
[ ] Code compiles
[ ] Tests pass
[ ] No debug statements remain
[ ] No secrets are committed
[ ] No unnecessary files are committed
[ ] Formatting is correct
[ ] Imports are clean
[ ] API changes are intentional
[ ] Database changes are intentional
[ ] Security implications reviewed
```

---

# 98. Pre-Pull-Request Checklist

Before opening a PR:

```text
[ ] Feature requirement verified
[ ] Relevant feature specification followed
[ ] Data ownership verified
[ ] Architecture verified
[ ] Tests added/updated
[ ] Error handling verified
[ ] Authorization verified
[ ] Tenant isolation verified
[ ] Responsive behavior verified
[ ] Documentation updated
[ ] Migration included where necessary
```

---

# 99. Anti-Patterns

The following should generally be avoided:

- God classes
- God components
- God services
- massive controllers
- business logic in controllers
- business logic in React components
- direct database access from controllers
- direct cross-module database mutation
- duplicated business rules
- hardcoded secrets
- silent exception handling
- arbitrary API formats
- unnecessary global state
- unnecessary dependencies
- premature microservices
- premature abstraction
- device-specific business logic
- undocumented schema changes
- undocumented breaking API changes

---

# 100. Rule Priority

When rules conflict, use the following priority:

```text
Security
   ↓
Data Integrity
   ↓
Business Requirements
   ↓
Architecture
   ↓
API Contract
   ↓
Maintainability
   ↓
Performance
   ↓
Convenience
```

Security and data integrity must not be sacrificed for convenience.

---

# 101. Relationship With Other Project Rules

This document provides common engineering rules.

Technology-specific rules are defined in:

```text
frontend-rules.md
backend-rules.md
database-rules.md
security-rules.md
ai-coding-rules.md
```

Those documents may add stricter rules for their respective areas.

They should not silently contradict the architecture.

---

# 102. Relationship With Architecture

Coding rules must be implemented within the architecture defined in:

```text
05-architecture/
├── system-architecture.md
├── frontend-architecture.md
├── backend-architecture.md
├── database-architecture.md
├── integration-architecture.md
├── data-ownership.md
└── api-architecture.md
```

If implementation requirements conflict with architecture, the conflict should be identified and resolved before coding.

---

# 103. Relationship With Feature Specifications

Feature specifications define feature-specific behavior.

For example:

```text
09-development/feature-specifications/result-processing.md
```

defines result-processing behavior.

This document defines the engineering rules used to implement that behavior.

Therefore:

```text
Feature Specification
        +
Architecture
        +
Project Rules
        ↓
Implementation
```

---

# 104. Rule Change Process

These rules may evolve.

A rule should be changed when:

- architecture changes
- technology changes
- a repeated engineering problem is identified
- security requirements change
- scalability requirements change
- a better standardized approach is adopted

Important rule changes should be documented and reviewed.

---

# 105. Final Coding Model

Acadlytic development should follow:

```text
Requirement
    ↓
Feature Specification
    ↓
Architecture
    ↓
Data Ownership
    ↓
Project Rules
    ↓
Implementation
    ↓
Tests
    ↓
Code Review
    ↓
Security Review
    ↓
Deployment
```

Code should be treated as an implementation of documented product and architecture decisions—not as the place where undocumented business requirements are invented.

---

# 106. Document Status

**Status:** Draft / Under Review

This document provides the baseline engineering rules for Acadlytic.

It should be reviewed together with:

- `frontend-rules.md`
- `backend-rules.md`
- `database-rules.md`
- `security-rules.md`
- `ai-coding-rules.md`

After the project-wide rules are reviewed and finalized, this document should move to:

**Approved / Implementation Ready**