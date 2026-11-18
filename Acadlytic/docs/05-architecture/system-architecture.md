# Acadlytic — System Architecture

**Project:** Acadlytic  
**Document:** System Architecture  
**Version:** 1.1  
**Status:** Approved / Aligned with Finalized MVP Architecture  

---

# 1. Purpose

This document defines the high-level system architecture of Acadlytic.

It describes:

- overall system structure
- architectural style
- application layers
- major modules
- module boundaries
- data flow
- request flow
- authentication flow
- tenant isolation
- result processing flow
- frontend/backend communication
- database interaction
- integration boundaries
- background processing
- security boundaries
- deployment architecture
- scalability strategy
- architectural principles

This document is the top-level technical architecture reference for the project.

Detailed implementation decisions are defined in the corresponding architecture documents.

---

# 2. System Overview

Acadlytic is a multi-tenant academic intelligence platform designed for university-affiliated colleges.

The system centralizes student academic information and provides:

- SaaS college onboarding, document verification, and `SUPER_ADMIN` approval
- student records management (MVP admin records)
- academic structure management
- university result import
- result validation
- result processing
- backlog tracking
- Academic Passport (administrative read model in MVP)
- academic analytics
- delegated academic staff portal *(Post-MVP — Phase 15)*
- student self-service portal *(Post-MVP — Phase 16)*

The core system follows this flow:

```text
University Result / College Data
            ↓
      Result Import
            ↓
     Result Validation
            ↓
     Result Processing
            ↓
    Academic Records
       ↙         ↘
  Backlogs      Academic Passport
                    ↓
                Analytics
                    ↓
      College Dashboard (MVP)
      Student Portal (Post-MVP — Phase 16)
```

---

# 3. Architectural Goals

The architecture must provide:

- maintainability
- modularity
- security
- tenant isolation
- data integrity
- clear ownership
- extensibility
- testability
- scalability
- reliable academic processing
- controlled external integrations
- clear separation of concerns

The architecture should support future growth without prematurely introducing unnecessary distributed-system complexity.

---

# 4. Architectural Style

Acadlytic will initially use a:

> **Modular Monolith Architecture**

The application will be deployed as a primary Spring Boot backend while maintaining strong internal module boundaries.

Conceptually:

```text
                    Acadlytic Application
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Security          Application         Modules
        │                  │                  │
        │                  │        ┌─────────┼─────────┐
        │                  │        │         │         │
        │                  │     Students  Results   Analytics
        │                  │
        └──────────────────┼───────────────────────────┘
                           │
                        MySQL
```

---

# 5. Why Modular Monolith

A modular monolith is preferred for the initial version because Acadlytic is still establishing:

- domain boundaries
- product-market fit
- academic rules
- university integration requirements
- operational scale

It provides:

- simpler development
- simpler deployment
- easier debugging
- lower infrastructure cost
- simpler local development
- straightforward transactions
- fewer distributed-system problems

The architecture must still maintain module boundaries so that specific modules can be extracted later if necessary.

---

# 6. System Context

At the highest level (Active MVP actors: `SUPER_ADMIN` and `COLLEGE_ADMIN`; `ACADEMIC_STAFF`, `STUDENT` authentication, and `BRANCH_ADMIN` are Post-MVP):

```text
                         ┌──────────────────────┐
                         │ University / Sources │
                         └──────────┬───────────┘
                                    │
                             Result Data
                                    │
                                    ▼
┌──────────────────────┐ ┌─────────────────────┐
│ Super Admin (MVP)    │▶│                     │
└──────────────────────┘ │                     │
┌──────────────────────┐ │      Acadlytic      │
│ College Admin (MVP)  │▶│                     │
└──────────────────────┘ │     Platform        │
┌──────────────────────┐ │                     │
│Academic Staff        │▶│  (Modular Monolith) │
│(Post-MVP — Phase 15) │ │                     │
└──────────────────────┘ │                     │
┌──────────────────────┐ │                     │
│Student Portal        │▶│                     │
│(Post-MVP — Phase 16) │ └──────────┬──────────┘
└──────────────────────┘            │
                                    ▼
                    MySQL 8 (Data + Spring Session JDBC)
```

*Note: Student academic records are managed in MVP by `COLLEGE_ADMIN`. `ACADEMIC_STAFF` (Phase 15), `STUDENT` authentication / Student Portal (Phase 16), and `BRANCH_ADMIN` / branch management (Phase 18.6; no branch tables or features in MVP) are explicitly Post-MVP.*

---

# 7. Major System Components

Acadlytic consists of:

```text
1. Public Website & Public College Registration
2. Authentication & Authorization (Stateful Sessions via Spring Session JDBC + SPA CSRF)
3. College Registration Approval & College Management
4. Student Records Management (MVP Admin Records)
5. Academic Structure
6. Result Import
7. Result Validation
8. Result Processing
9. Backlog Tracking
10. Academic Passport (Admin Read View in MVP)
11. Analytics
12. Student Portal (Post-MVP — Phase 16)
13. Integration Layer
14. Background Jobs & Transactional Email Outbox
15. Database (MySQL 8)
16. Audit and Security Infrastructure
```

---

# 8. System Layers

The application is divided into logical layers:

```text
┌─────────────────────────────────────────────┐
│              Presentation Layer             │
│               React Frontend                │
├─────────────────────────────────────────────┤
│                  API Layer                   │
│              Spring REST API                │
├─────────────────────────────────────────────┤
│              Application Layer              │
│          Use Cases / Services               │
├─────────────────────────────────────────────┤
│                 Domain Layer                │
│      Business Rules / Domain Concepts       │
├─────────────────────────────────────────────┤
│           Infrastructure Layer              │
│ Database / Files / Email / External APIs    │
└─────────────────────────────────────────────┘
```

---

# 9. Presentation Layer

The frontend is responsible for:

- user interface
- navigation
- forms
- client-side validation
- displaying data
- loading states
- error states
- responsive behavior
- charts
- accessibility

Technology:

```text
React
TypeScript
Vite
Tailwind CSS
```

The frontend must not directly access the database.

---

# 10. API Layer

The API layer exposes backend functionality through HTTP/JSON APIs.

Technology:

```text
Spring Boot
Spring Web
REST API
```

Responsibilities include:

- request handling
- authentication context
- authorization
- request validation
- DTO conversion
- response formatting
- HTTP status handling

Controllers should not contain complex business logic.

---

# 11. Application Layer

The application layer coordinates use cases.

Examples:

```text
Create College
Create Student
Import Results
Validate Results
Process Results
View Academic Passport
Generate Analytics
```

Conceptually:

```text
Controller
    ↓
Application Service
    ↓
Domain Logic
    ↓
Repository / Infrastructure
```

---

# 12. Domain Layer

The domain layer contains important business concepts and rules.

Examples:

```text
Student
College
Course
Semester
Subject
Result
Result Attempt
Backlog
Academic Record
Academic Passport
```

The domain layer should not depend directly on:

- React
- HTTP controllers
- database implementation
- external university APIs

---

# 13. Infrastructure Layer

The infrastructure layer handles technical implementations.

Examples:

```text
MySQL
JPA / Hibernate
File Storage
Email
External APIs
University Connectors
Background Jobs
```

Infrastructure implements interfaces required by application/domain logic.

---

# 14. Frontend Architecture

The frontend follows feature-oriented architecture.

Conceptually:

```text
frontend/
└── src/
    ├── app/
    ├── pages/
    ├── features/
    ├── components/
    ├── hooks/
    ├── services/
    ├── store/
    ├── types/
    └── utils/
```

Detailed frontend structure is defined in:

```text
05-architecture/frontend-architecture.md
```

---

# 15. Backend Architecture

The backend follows module-oriented architecture.

Conceptually:

```text
backend/
└── src/main/java/com/acadlytic/
    ├── config/
    ├── security/
    ├── common/
    ├── exception/
    ├── modules/
    │   ├── auth/
    │   ├── colleges/
    │   ├── students/
    │   ├── academic/
    │   ├── results/
    │   ├── backlogs/
    │   ├── passport/
    │   ├── analytics/
    │   └── integrations/
    └── jobs/
```

Detailed backend architecture is defined separately.

---

# 16. Core Business Modules

The major business modules are:

```text
Authentication
College Management
Student Management
Academic Structure
Result Import
Result Validation
Result Processing
Backlog Tracking
Academic Passport
Analytics
Student Portal (Post-MVP — Phase 16)
```

Each module has a defined responsibility.

---

# 17. Authentication Module

Authentication is responsible for:

- stateful HTTP-only session lifecycle persisted in **MySQL 8** via **Spring Session JDBC** (**no JWT**)
- Spring Security 6 SPA CSRF protection (`GET /api/v1/auth/csrf`, `XSRF-TOKEN` / `X-XSRF-TOKEN`)
- login, logout, current user (`GET /api/v1/auth/me`), and session revocation
- public college registration (`POST /api/v1/auth/register-college`), email verification, and email change
- password management (`BCryptPasswordEncoder(12)`), password reset, and lockout protection
- one-time env-driven `SUPER_ADMIN` bootstrap (`SuperAdminBootstrapRunner`)
- authentication security and audit logging

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

---

# 18. College Management Module

College Management owns:

- college
- college identity
- college code
- college status
- university association
- college profile
- college administration assignment

College is the primary tenant boundary.

---

# 19. Student Management Module

Student Management owns:

- student identity
- student profile
- student identifier
- enrollment relationship
- student lifecycle

Student records are associated with a college.

---

# 20. Academic Structure Module

Academic Structure owns:

- university
- course/program
- academic year
- semester
- subject
- credits
- academic structure relationships

This module provides the structure against which results are interpreted.

---

# 21. Result Import Module

Result Import owns:

- import jobs
- uploaded files
- imported records
- source metadata
- parsing
- normalization
- import preview
- duplicate detection
- import history

Result Import does not own processed academic outcomes.

---

# 22. Result Validation Module

Result Validation owns:

- validation status
- validation errors
- warnings
- validation summaries
- validation rules applied to imported records

Validation determines whether imported records are acceptable for processing.

---

# 23. Result Processing Module

Result Processing owns the transition from validated result data to authoritative academic records.

Responsibilities include:

- processing validated results
- preserving attempts
- updating academic outcomes
- coordinating calculations
- triggering backlog updates
- updating academic information

---

# 24. Backlog Tracking Module

Backlog Tracking owns:

- active backlog state
- backlog lifecycle
- backlog clearing
- backlog history
- backlog status

Result Processing may trigger a backlog change, but Backlog Tracking owns backlog rules and state.

---

# 25. Academic Passport Module

Academic Passport provides a centralized academic representation.

It presents:

- academic history
- semester results
- subject results
- SGPA
- CGPA
- credits
- backlog summary
- academic progress
- attempt history

Academic Passport is not the source of truth for processed academic records.

---

# 26. Analytics Module

Analytics provides derived academic insights.

Examples:

- pass rate
- failure rate
- SGPA trends
- CGPA summaries
- backlog statistics
- subject performance
- course performance
- semester performance

Analytics must not modify authoritative academic records.

---

# 27. Student Portal (Post-MVP — Phase 16)

> **Post-MVP Scope:** Student authentication and the Student Portal are **Post-MVP (Phase 16)**. In MVP, student academic records, Academic Passports, and analytics are managed and viewed exclusively by authorized `COLLEGE_ADMIN` users within their approved college.

When introduced in Phase 16, the Student Portal acts as a read-oriented self-service presentation and access layer.

It allows authenticated `STUDENT` users to:

- view dashboard
- view academic records
- view Academic Passport
- view results
- view backlogs
- view analytics
- manage permitted profile information
- manage account settings

Students cannot directly modify academic records.

---

# 28. Integration Module

The Integration module isolates external systems.

Examples:

```text
University API
University Webhook
Excel
CSV
Email Provider
Object Storage
```

The integration layer must not directly modify authoritative academic data.

---

# 29. Module Dependency Model

The preferred dependency direction is:

```text
Authentication
      ↓
College
      ↓
Student
      ↓
Academic Structure
      ↓
Result Import
      ↓
Result Validation
      ↓
Result Processing
      ↓
Backlog Tracking
      ↓
Academic Passport
      ↓
Analytics
```

However, this is a conceptual data-flow representation, not a requirement that every module directly depend on the previous module.

---

# 30. Important Dependency Rule

A module may consume another module's data without becoming its owner.

For example:

```text
Analytics
    ↓ reads
Academic Records
```

does not mean:

```text
Analytics
    ↓ owns
Academic Records
```

Ownership remains with the authoritative module.

---

# 31. Data Ownership Principle

Every important business entity must have a clear source of truth.

Examples:

| Data | Owner |
|---|---|
| User | Authentication |
| College | College Management |
| Student | Student Management |
| Course | Academic Structure |
| Subject | Academic Structure |
| Imported Result | Result Import |
| Validation Result | Result Validation |
| Processed Academic Result | Result Processing |
| Backlog | Backlog Tracking |
| Academic Passport | Read-oriented academic representation |
| Analytics | Analytics |

Detailed ownership rules are defined in:

```text
05-architecture/data-ownership.md
```

---

# 32. No Direct Cross-Module Database Mutation

A module should not directly modify another module's data merely because it has database access.

Incorrect:

```text
Result Processing
      ↓
UPDATE backlog_table
```

Preferred:

```text
Result Processing
      ↓
Backlog Application Operation
      ↓
Backlog Module
```

The exact implementation may use an application service/domain operation within the modular monolith.

---

# 33. Multi-Tenant Architecture

Acadlytic is multi-tenant.

Each college represents a tenant.

Conceptually:

```text
                    Acadlytic
                       │
          ┌────────────┴────────────┐
          │                         │
       College A                 College B
       Tenant A                  Tenant B
          │                         │
      Students                  Students
      Results                   Results
      Backlogs                  Backlogs
      Analytics                 Analytics
```

Tenant data must never leak between colleges.

---

# 34. Tenant Context

Every authenticated request that accesses tenant-specific resources must establish the tenant context.

Conceptually:

```text
Authenticated User
       ↓
User Role
       ↓
College / Tenant
       ↓
Tenant Context
       ↓
Authorized Resource Access
```

---

# 35. Tenant Isolation

Tenant isolation must be enforced server-side.

It must not depend only on frontend filtering.

Incorrect:

```text
Frontend:
?collegeId=123
```

Correct:

```text
Backend:
Authenticated User
       ↓
Authorized Tenant
       ↓
Query restricted to tenant
```

---

# 36. IDOR Protection

An authenticated user must not be able to access another tenant's resource simply by changing an ID.

Example:

```text
/api/v1/students/101
```

must verify:

```text
Student 101
    ↓
College ownership
    ↓
Current user's authorized tenant
```

---

# 37. Authentication Flow

The general authentication flow is:

```text
User
 ↓
React Login Page
 ↓
POST /api/v1/auth/login
 ↓
Spring Security
 ↓
Validate Credentials
 ↓
Create Spring Session JDBC Session in MySQL 8 & Issue HttpOnly Cookie
 ↓
Return User & College Authorization Status (No JWT)
 ↓
Frontend Hydrates UI State via GET /api/v1/auth/me
 ↓
Protected Routes (Restricted Onboarding or Full Management Dashboard)
```

The finalized stateful session, cookie (`ACADLYTIC_SID` dev / `__Host-ACADLYTIC_SID` prod), and SPA CSRF strategy is defined in `authentication.md` and `authentication-implementation.md` (`ADR-01` – `ADR-05`).

---

# 38. Authorization Flow

Every protected operation follows:

```text
Request
   ↓
Authentication
   ↓
Identify User
   ↓
Identify Role
   ↓
Identify Tenant
   ↓
Check Permission
   ↓
Check Resource Ownership
   ↓
Execute Operation
```

---

# 39. Request Flow

A normal API request follows:

```text
React
 ↓
HTTP Request
 ↓
Spring Security
 ↓
Controller
 ↓
Request DTO Validation
 ↓
Application Service
 ↓
Domain Logic
 ↓
Repository
 ↓
MySQL
 ↓
Domain/Application Result
 ↓
Response DTO
 ↓
JSON Response
 ↓
React
```

---

# 40. Read Request Flow

Example (MVP): Approved `COLLEGE_ADMIN` views a student's Academic Passport (`GET /api/v1/students/{studentId}/academic-passport`).  
*(In Post-MVP Phase 16, an authenticated `STUDENT` will view their own Academic Passport via `GET /api/v1/me/academic-passport`.)*

```text
COLLEGE_ADMIN (MVP)  /  STUDENT (Post-MVP — Phase 16)
 ↓
React
 ↓
GET /api/v1/students/{studentId}/academic-passport  (Post-MVP Student: GET /api/v1/me/academic-passport)
 ↓
Spring Session JDBC Authentication (MySQL 8)
 ↓
Role, Tenant & Approval Authorization
 ↓
Academic Passport Service
 ↓
Academic Data
 ↓
Response DTO
 ↓
React
```

---

# 41. Result Import Flow

The complete result import process is:

```text
College Admin (MVP) / Academic Staff (Post-MVP — Phase 15)
      ↓
Upload Excel/CSV
      ↓
Result Import Job
      ↓
File Parsing
      ↓
Normalization
      ↓
Student Matching
      ↓
Subject Matching
      ↓
Validation
      ↓
Preview
      ↓
Processing
      ↓
Academic Records
```

---

# 42. Result Processing Flow

```text
Validated Results
       ↓
Processing Job
       ↓
Process Valid Records
       ↓
Preserve Attempts
       ↓
Update Academic Outcome
       ↓
Update Backlog
       ↓
Update SGPA/CGPA
       ↓
Update Academic Passport
       ↓
Analytics Reflect New Data
```

---

# 43. Result Processing as a Critical Boundary

Result Processing is one of the most important consistency boundaries in Acadlytic.

It must ensure that:

- invalid results are not processed
- duplicate results are not created
- attempts are preserved
- backlog state remains consistent
- academic calculations remain consistent
- passport information reflects successful processing

---

# 44. Academic Data Flow

The authoritative academic data flow is:

```text
Result Source
     ↓
Result Import
     ↓
Result Validation
     ↓
Result Processing
     ↓
Academic Records
     ├── Backlogs
     ├── Academic Passport
     └── Analytics
```

The downstream modules should not independently redefine the academic result.

---

# 45. Source of Truth

The system follows this principle:

> **Store authoritative academic information once and derive downstream representations from it.**

Avoid maintaining multiple independent versions of the same academic fact.

---

# 46. Historical Data Preservation

Academic history must be preserved.

The system should not simply overwrite:

```text
Attempt 1 → FAIL
Attempt 2 → PASS
```

with:

```text
PASS
```

Instead:

```text
Attempt 1 → FAIL
Attempt 2 → PASS
Current Outcome → CLEARED
```

This preserves the academic history.

---

# 47. Database Architecture

Acadlytic uses:

```text
MySQL
```

The backend uses:

```text
Spring Data JPA
Hibernate
```

The database stores authoritative application data and required operational information.

Detailed database design is defined in:

```text
05-architecture/database-architecture.md
```

---

# 48. Database Interaction

The preferred flow is:

```text
Application Service
       ↓
Repository
       ↓
JPA / Hibernate
       ↓
MySQL
```

Controllers must not directly query the database.

---

# 49. API Architecture

The backend exposes versioned APIs:

```text
/api/v1/...
```

The API architecture follows:

- REST-oriented resources
- DTOs
- validation
- authorization
- tenant isolation
- standardized errors
- pagination
- filtering
- sorting
- idempotency where required

Detailed rules are defined in:

```text
05-architecture/api-architecture.md
```

---

# 50. Frontend and Backend Boundary

The frontend communicates only through the backend API.

```text
React
   ↓
REST API
   ↓
Spring Boot
   ↓
Application
   ↓
MySQL
```

The frontend must not:

- connect directly to MySQL
- contain database credentials
- contain private university API credentials
- implement authoritative academic business rules

---

# 51. Background Processing

Long-running operations should not block normal HTTP requests.

Examples:

- large result import
- result validation
- result processing
- future university synchronization
- report generation

Flow:

```text
User
 ↓
POST Request
 ↓
Create Job
 ↓
202 Accepted
 ↓
Background Worker
 ↓
Process
 ↓
Update Job Status
```

---

# 52. Job Architecture

Conceptually:

```text
Job Request
     ↓
Job Record
     ↓
Queue / Scheduler / Worker
     ↓
Processing
     ↓
Job Status
```

The exact job technology may be finalized in backend architecture.

---

# 53. File Processing

Result files should be processed server-side.

```text
Browser
   ↓
Multipart Upload
   ↓
Spring Boot
   ↓
Secure File Storage
   ↓
Background Processing
```

Large files should not be fully loaded into browser memory unnecessarily.

---

# 54. External Integration Flow

Future university integration:

```text
University
     ↓
University Connector
     ↓
Integration Layer
     ↓
Normalized Result
     ↓
Result Import
     ↓
Validation
     ↓
Processing
```

The core academic modules remain independent from the university-specific protocol.

---

# 55. Security Architecture

Security is applied at multiple levels.

```text
Frontend
   ↓
HTTPS
   ↓
Spring Security
   ↓
Authentication
   ↓
Authorization
   ↓
Tenant Isolation
   ↓
Application Validation
   ↓
Database Constraints
```

---

# 56. Security Responsibilities

Security controls include:

- authentication
- authorization
- password security
- tenant isolation
- IDOR prevention
- input validation
- file validation
- secure headers
- HTTPS
- rate limiting
- audit logging
- secret protection
- safe error handling

---

# 57. Audit Architecture

Sensitive operations should generate audit events.

Examples:

```text
LOGIN
LOGOUT
ACCOUNT_CREATED
PASSWORD_CHANGED
COLLEGE_CREATED
STUDENT_CREATED
RESULT_IMPORTED
RESULT_PROCESSED
BACKLOG_UPDATED
INTEGRATION_EXECUTED
```

Audit logs should be separate from normal application logging.

---

# 58. Error Handling

The backend should use centralized exception handling.

Flow:

```text
Exception
   ↓
Global Exception Handler
   ↓
Standard Error Response
   ↓
HTTP Response
   ↓
Frontend Error Handling
```

Internal implementation details should not be unnecessarily exposed.

---

# 59. API Error Model

A consistent API error structure should contain concepts such as:

```text
code
message
details
timestamp
correlationId
```

Validation errors may additionally contain:

```text
field
rejectedValue
reason
```

---

# 60. Logging Architecture

Application logging should support:

- debugging
- operational monitoring
- security investigation
- integration troubleshooting

Logs should include useful context such as:

```text
timestamp
level
service/module
correlationId
operation
```

Sensitive information must not be logged unnecessarily.

---

# 61. Observability

The production system should eventually provide:

```text
Logs
Metrics
Health Checks
Correlation IDs
Error Monitoring
```

Future distributed tracing can be introduced if system complexity requires it.

---

# 62. Caching

Caching may be used for read-heavy, low-volatility data.

Possible candidates:

- academic structure
- reference data
- configuration
- analytics summaries

Authoritative academic writes must not be hidden behind stale cache behavior.

---

# 63. Cache Principle

The database remains the source of truth.

```text
Application
   ↓
Cache
   ↓
Database
```

Cache invalidation must be explicitly designed for any cached academic data.

---

# 64. Performance Architecture

The system should optimize:

- database queries
- indexes
- pagination
- batch processing
- aggregate queries
- result import processing
- API payload size
- frontend rendering

Avoid:

- N+1 queries
- loading entire tables
- unnecessary API calls
- duplicate calculations
- unbounded result sets

---

# 65. Scalability Strategy

Acadlytic should scale incrementally.

Initial:

```text
React
   ↓
Spring Boot
   ↓
MySQL
```

Later:

```text
React
   ↓
Load Balancer
   ↓
Multiple Spring Boot Instances
   ↓
MySQL
```

Background workers can be scaled independently if required.

---

# 66. Horizontal Scaling

Application nodes must not hold sticky in-memory session state.

This allows:

```text
Request
 ├── Instance A
 ├── Instance B
 └── Instance C
       │
       ▼
MySQL 8 (Spring Session JDBC + Authoritative Data)
```

Shared authenticated session state is persisted externally in **MySQL 8** via **Spring Session JDBC** (`ADR-02`) rather than local JVM memory, allowing horizontal scaling without Redis or JWT.

---

# 67. Deployment Architecture

A production deployment may use:

```text
                    Internet
                       │
                       ▼
                Reverse Proxy
                    / Nginx
                       │
          ┌────────────┴────────────┐
          │                         │
      React App                 Spring Boot
                                  │
                                  ▼
                                MySQL
```

Additional infrastructure may include:

```text
Object Storage
Background Worker
Monitoring
Email Provider
```

---

# 68. Containerization

Docker may be used to standardize environments.

Conceptually:

```text
Docker
├── Frontend
├── Backend
├── MySQL
└── Supporting Services
```

Development and production containerization may differ.

---

# 69. Environment Separation

The project should support separate environments:

```text
Development
Staging / Preview
Production
```

Each environment should have separate:

- database
- credentials
- secrets
- external integrations
- configuration

---

# 70. CI/CD Architecture

A future CI/CD pipeline:

```text
Git Push
   ↓
CI
   ├── Build
   ├── Unit Tests
   ├── Integration Tests
   ├── Lint / Static Analysis
   └── Security Checks
   ↓
Build Artifact
   ↓
Preview / Staging
   ↓
QA
   ↓
Production
```

---

# 71. Migration Architecture

Database schema changes must use version-controlled migrations.

Preferred approach:

```text
Flyway
```

Conceptually:

```text
Application Version
       ↓
Flyway Migration
       ↓
MySQL Schema
```

Manual production schema changes should be avoided.

---

# 72. Backup and Recovery

Production database backups should support:

- scheduled backups
- recovery testing
- retention policy
- disaster recovery

Backup strategy is an infrastructure/operations concern but must protect authoritative academic records.

---

# 73. Data Integrity

Academic data requires strong consistency.

The system should use:

- foreign keys
- unique constraints
- transactions
- validation
- idempotency
- controlled mutations

Data integrity is more important than premature optimization.

---

# 74. Transaction Boundaries

Transactions should be placed around logically atomic operations.

Example:

```text
Process Student Result
       ↓
Persist Result
       ↓
Update Academic Outcome
       ↓
Update Related Academic State
       ↓
Commit
```

Long external API calls should not remain inside database transactions.

---

# 75. Idempotency

Retryable operations must support idempotency.

Especially:

- result processing
- webhook handling
- external synchronization
- job retries

The same external/result event should not create duplicate academic outcomes.

---

# 76. Concurrency Control

The system should prevent conflicting processing.

Example:

```text
Import Job A
     ↓
Processing

Import Job B
     ↓
Same Result Release
```

The application should prevent duplicate concurrent processing where required.

---

# 77. Academic Consistency Boundary

A processed academic result should maintain consistency across:

```text
Result
Backlog
Academic Calculation
Academic Passport
```

A processing operation should have a clearly defined transaction and failure strategy.

---

# 78. Module Communication

Within the modular monolith, modules should communicate through:

- application services
- domain operations
- defined interfaces
- events where appropriate

Avoid arbitrary direct access to another module's internal implementation.

---

# 79. Domain Events

Domain/application events may be used for decoupled downstream actions.

Example:

```text
ResultProcessed
       ↓
 ┌─────┼───────────────┐
 ↓     ↓               ↓
Backlog Passport     Analytics
```

Events should be introduced where they provide meaningful decoupling, not merely for complexity.

---

# 80. Synchronous vs Asynchronous Operations

Use synchronous operations for:

- simple reads
- small CRUD operations
- simple validation

Use asynchronous processing for:

- large imports
- large result processing
- scheduled synchronization
- report generation
- future university synchronization

---

# 81. Public Website

The public website provides:

- product information
- features
- calculators/resources where applicable
- contact
- authentication entry points

It must not expose private student academic information.

---

# 82. Role-Based System Access

Active MVP roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
```

Post-MVP roles (explicitly excluded from MVP authentication and authorization):

```text
ACADEMIC_STAFF  (Post-MVP — Phase 15)
STUDENT         (Post-MVP — Phase 16; Student academic records remain in MVP)
BRANCH_ADMIN    (Post-MVP — Phase 18.6; no branch tables or features in MVP)
```

Access model:

```text
SUPER_ADMIN (Active MVP)
    ↓
Platform Management & College Registration Approval

COLLEGE_ADMIN (Active MVP — 1 active admin per college in MVP)
    ↓
Restricted Onboarding Dashboard → Full College Management (once APPROVED & ACTIVE)

ACADEMIC_STAFF (Post-MVP — Phase 15)
    ↓
Delegated Academic Operations

STUDENT (Post-MVP — Phase 16)
    ↓
Own Academic Information (Student Self-Service Portal)

BRANCH_ADMIN (Post-MVP — Phase 18.6)
    ↓
Multi-Campus / Branch Administration
```

Exact permissions are defined by authorization rules in `authentication.md` and `security-rules.md`.

---

# 83. Super Admin Boundary (Active MVP Role)

SUPER_ADMIN operates at platform level.

Typical responsibilities:

- review, approve, request action on, or reject college registration applications (`expectedVersion` concurrency protection)
- manage college tenant lifecycle status (`ACTIVE`, `SUSPENDED`, `INACTIVE`)
- manage platform configuration and supported universities
- manage platform operations

`SUPER_ADMIN` is bootstrapped via `SuperAdminBootstrapRunner` and does **not** manually create `COLLEGE_ADMIN` credentials. Super Admin access must still be audited.

---

# 84. College Admin Boundary (Active MVP Role)

COLLEGE_ADMIN operates within a college tenant (MVP enforces **exactly one active `COLLEGE_ADMIN` per college** via MySQL 8 `VIRTUAL` generated column `active_college_admin_college_id`).

Typical responsibilities:

- complete email verification, upload verification documents, and submit registration for `SUPER_ADMIN` review via the immediate restricted onboarding dashboard
- once `colleges.approval_status = APPROVED` and `colleges.status = ACTIVE`:
  - manage students (academic records)
  - manage academic structure where permitted
  - import results
  - review validation
  - process results where permitted
  - view Academic Passports and institutional analytics
  - manage academic operations

College Admin must not access academic management APIs before approval or access another college's tenant data.

---

# 85. Academic Staff Boundary (Post-MVP — Phase 15)

> **Post-MVP Scope:** `ACADEMIC_STAFF` is **not active in MVP** and is deferred to Phase 15.

When implemented in Phase 15, `ACADEMIC_STAFF` will perform permitted delegated academic operations within their college:

- student management
- result imports
- result validation
- academic review
- backlog review
- academic reporting

Exact permissions must be configurable or explicitly defined in Phase 15.

---

# 86. Student Boundary (Post-MVP — Phase 16)

> **Post-MVP Scope:** `STUDENT` authentication and the Student Self-Service Portal are **not active in MVP** and are deferred to Phase 16. Student academic records remain in MVP and are managed by `COLLEGE_ADMIN`.

When implemented in Phase 16, authenticated `STUDENT` users will be able to:

- view own academic information
- view results
- view backlog
- view Academic Passport
- view analytics
- manage permitted account/profile settings

Student academic records are read-only.

---

# 87. Academic Record Read Model

Some modules are read-oriented.

For example:

```text
Processed Academic Records
          ↓
    Academic Passport
          ↓
College Admin (MVP) / Student Portal (Post-MVP — Phase 16)
```

and:

```text
Processed Academic Records
          ↓
       Analytics
          ↓
   College Dashboard
```

This prevents multiple modules from independently storing conflicting academic facts.

---

# 88. Analytics Architecture

Analytics is derived from authoritative data.

```text
Authoritative Academic Data
          ↓
       Queries
          ↓
     Aggregations
          ↓
       Analytics
```

The MVP does not require a separate analytics warehouse.

---

# 89. Future Analytics Architecture

At larger scale:

```text
Transactional Database
        ↓
Event / ETL Pipeline
        ↓
Analytics Read Model
        ↓
Reporting / BI
```

This is a future optimization.

---

# 90. Integration Boundary

External systems must enter through controlled integration boundaries.

```text
External System
       ↓
Connector / Adapter
       ↓
Integration Layer
       ↓
Application Layer
       ↓
Domain
```

External systems must never receive direct database access.

---

# 91. API Boundary

External clients communicate through:

```text
HTTPS
  ↓
API Gateway / Reverse Proxy
  ↓
Spring Boot REST API
```

The database remains private.

---

# 92. Database Boundary

The database should be accessible only to trusted backend infrastructure.

```text
Internet
   ✕
   ↓
MySQL

Spring Boot
   ✓
   ↓
MySQL
```

Frontend clients must never connect directly to MySQL.

---

# 93. File Boundary

Uploaded files must follow:

```text
Client
  ↓
Authenticated API
  ↓
Secure File Handling
  ↓
Storage
```

Files should not become publicly accessible simply because they were uploaded.

---

# 94. System-Level Data Flow

The overall academic lifecycle is:

```text
                 University / College
                         │
                         ▼
                  Result Source
                         │
                         ▼
                  Result Import
                         │
                         ▼
                 Result Validation
                         │
                         ▼
                 Result Processing
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
          Results     Backlogs    Calculations
             │                       │
             └───────────┬───────────┘
                         ▼
                 Academic Passport
                         │
                         ▼
                    Analytics
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
  College Dashboard (MVP)   Student Portal (Post-MVP)
```

---

# 95. Failure Isolation

A failure in one subsystem should not unnecessarily corrupt another subsystem.

Examples:

```text
Email Failure
     ↓
Academic Processing remains successful
```

```text
University API Failure
     ↓
Existing Academic Data remains available
```

```text
Analytics Failure
     ↓
Academic Records remain authoritative
```

---

# 96. Recovery Principle

The system should favor:

> **Recoverable operations over destructive operations.**

Examples:

- preserve import history
- preserve result attempts
- preserve audit events
- preserve failed job information
- allow controlled retries
- avoid destructive deletion of academic history

---

# 97. Soft Deactivation

Important entities should generally support lifecycle states rather than immediate physical deletion where historical records depend on them.

Example:

```text
College
ACTIVE
INACTIVE
SUSPENDED
```

A college should generally be deactivated rather than physically deleted.

---

# 98. Data Lifecycle

Conceptually:

```text
Create
  ↓
Active
  ↓
Updated
  ↓
Historical
  ↓
Archived / Retained
```

Academic history should not be casually deleted.

---

# 99. Architecture Principles

Acadlytic follows these principles:

### Principle 1 — Single Source of Truth

Each authoritative business fact has one owner.

### Principle 2 — Separation of Concerns

UI, API, business logic, and infrastructure remain separated.

### Principle 3 — Tenant Isolation

College data is strictly isolated.

### Principle 4 — Explicit Ownership

Modules do not silently take ownership of another module's data.

### Principle 5 — Historical Preservation

Academic attempts and history are preserved.

### Principle 6 — Controlled Mutation

Academic data changes occur through defined business operations.

### Principle 7 — Integration Isolation

External systems are isolated behind adapters/connectors.

### Principle 8 — Security by Default

Authorization and tenant isolation are backend responsibilities.

### Principle 9 — Async for Long Operations

Large operations run through background jobs.

### Principle 10 — Modular Monolith First

Do not introduce microservices before scale requires them.

---

# 100. Architectural Anti-Patterns

The following should be avoided.

## 100.1 Direct Frontend Database Access

```text
React → MySQL
```

Not allowed.

---

## 100.2 Direct External API From Frontend

```text
React → University API
```

Not allowed when credentials or trusted integration logic are required.

---

## 100.3 Business Logic in Controllers

```text
Controller
   ↓
Huge Business Logic
```

Avoid.

---

## 100.4 Cross-Module Database Mutation

```text
Analytics
   ↓
UPDATE academic_results
```

Not allowed.

---

## 100.5 Duplicate Academic Truth

Avoid storing independent copies of:

```text
CGPA
SGPA
Backlog State
Current Result
```

unless the copy is explicitly defined as a derived/read model.

---

## 100.6 University-Specific Logic Everywhere

Avoid:

```text
if OU
if JNTUH
if XYZ
```

throughout the application.

Keep university-specific logic inside integration adapters.

---

## 100.7 Premature Microservices

Do not split the application into multiple services simply because multiple modules exist.

---

# 101. Technology Architecture

The current technology direction is:

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
React Router
TanStack Query
Zustand
React Hook Form
Zod
Axios
Recharts
Lucide React
```

## Backend

```text
Java 21
Spring Boot 3
Spring Security 6 (Stateful HTTP-only Sessions + SPA CSRF; no JWT)
Spring Session JDBC
Spring Data JPA
Hibernate
Bean Validation
Maven
```

## Database

```text
MySQL 8 (Authoritative Data, Spring Session JDBC, Transactional Email Outbox)
```

## Supporting Technologies

```text
Docker
Git
GitHub
Flyway
Testcontainers (MySQL 8.0.36)
Mailpit (Local Dev SMTP)
Nginx (Production Same-Origin Reverse Proxy)
```

The exact versions should be maintained separately in project configuration.

---

# 102. Development Architecture

Local development:

```text
Developer
    │
    ├── React/Vite
    │
    ├── Spring Boot
    │
    └── MySQL
```

Optional supporting services may run through Docker.

---

# 103. Preview Architecture

A preview/staging environment should approximate production:

```text
Internet
   ↓
Reverse Proxy
   ↓
React
   ↓
Spring Boot
   ↓
MySQL
```

Test data must be isolated from production data.

---

# 104. Production Architecture

A basic production deployment:

```text
                         Internet
                            │
                            ▼
                     DNS / HTTPS
                            │
                            ▼
                      Reverse Proxy
                            │
                 ┌──────────┴──────────┐
                 │                     │
              Frontend              Backend
                 │                     │
                 │                     ▼
                 │                   MySQL
                 │
                 └───────────────┐
                                 │
                          Object Storage
```

Additional workers may be added:

```text
Backend
   ↓
Background Worker
```

---

# 105. Future Scale Architecture

If scale requires it:

```text
                         Internet
                            │
                       Load Balancer
                            │
             ┌──────────────┼──────────────┐
             │              │              │
         Backend A      Backend B      Backend C
             │              │              │
             └──────────────┼──────────────┘
                            │
                          MySQL
                            │
                    Read / Scale Strategy
```

Background processing may scale independently.

---

# 106. Potential Future Service Extraction

If a subsystem becomes sufficiently large, candidates may include:

```text
Integration Service
Reporting Service
Notification Service
Analytics Service
```

Extraction must be driven by:

- scale
- deployment independence
- operational requirements
- team boundaries
- performance

not by module count alone.

---

# 107. Architecture Evolution

The architecture is intentionally designed to evolve:

```text
Phase 1
Modular Monolith
      ↓
Phase 2
Scaled Modular Monolith
      ↓
Phase 3
Selective Service Extraction
```

The system should not be designed around hypothetical scale before real requirements exist.

---

# 108. Relationship With Architecture Documents

This document is the top-level architecture reference.

Detailed documents provide specialized architecture.

```text
system-architecture.md
        │
        ├── data-ownership.md
        ├── database-architecture.md
        ├── api-architecture.md
        ├── backend-architecture.md
        ├── frontend-architecture.md
        └── integration-architecture.md
```

---

# 109. Architecture Document Responsibility

| Document | Responsibility |
|---|---|
| `system-architecture.md` | Overall system |
| `data-ownership.md` | Data ownership |
| `database-architecture.md` | Database structure |
| `api-architecture.md` | API design |
| `backend-architecture.md` | Backend implementation structure |
| `frontend-architecture.md` | Frontend structure |
| `integration-architecture.md` | External integrations |

No detailed architecture document should contradict the system-level architecture without an explicit architectural decision.

---

# 110. AI Coding Agent Rules

Before implementing a feature, an AI coding agent must:

1. read this document
2. read the relevant feature specification
3. read `data-ownership.md`
4. read the relevant architecture document
5. identify the owning module
6. identify data dependencies
7. identify API requirements
8. follow tenant isolation
9. follow authorization rules
10. avoid cross-module ownership violations
11. preserve historical academic data
12. avoid inventing academic rules
13. add appropriate tests
14. avoid unnecessary architectural changes

---

# 111. Architecture Decision Rules

When an implementation decision is unclear:

1. Prefer the existing project documentation.
2. Prefer the owning module's rules.
3. Prefer the source-of-truth definition.
4. Avoid duplicating business logic.
5. Avoid introducing unnecessary infrastructure.
6. Document unresolved decisions.
7. Do not silently change architectural boundaries.

---

# 112. Finalized & Deferred Architectural Decisions

Core MVP authentication, session, onboarding, storage-abstraction, email-outbox, and testing decisions (`ADR-01` – `ADR-19`) are **FINALIZED** in `authentication.md` and `authentication-implementation.md` (stateful HTTP-only sessions via Spring Session JDBC + MySQL 8, Spring Security 6 SPA CSRF, transactional email outbox with `SKIP LOCKED`, `DocumentStorageService` and `EmailSender` ports, Testcontainers MySQL `8.0.36`).

The following items remain explicitly **DEFERRED** for later phases and must not be invented prematurely:

- **ADR-11b (Post-MVP Phase 18.7):** Automated document malware/AV scanning
- **ADR-15b (Phase 14 MVP Release Gate):** Exact commercial production SMTP vendor selection
- **ADR-16b (Phase 14 MVP Release Gate):** Exact production S3-compatible object storage provider selection
- production hosting provider and monitoring/alerting platform (Phase 14)
- optional future caching technology (Redis is not used in MVP)
- advanced analytics architecture, university-specific connector implementations, and future event infrastructure (Post-MVP Phase 18)

---

# 113. Definition of Done

The system architecture is considered established when:

- overall system structure is documented
- architectural style is defined
- modules are identified
- module responsibilities are defined
- data ownership is established
- tenant architecture is defined
- frontend/backend boundaries are defined
- database boundary is defined
- API boundary is defined
- integration boundary is defined
- background processing is defined
- security boundaries are defined
- result processing flow is documented
- historical data strategy is defined
- scalability strategy is documented
- deployment direction is documented
- architecture documents are internally consistent
- unresolved decisions are explicitly documented

---

# 114. Final System Architecture

The final high-level architecture is:

```text
                              USERS
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
  Super Admin (MVP)     College Admin (MVP)    Academic Staff (Post-MVP)
                                               & Student Portal (Post-MVP)
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                         React Frontend
                                │
                  HTTPS (Session Cookie + SPA CSRF)
                                │
                                ▼
                     Spring Boot REST API
                                │
                    ┌───────────┴───────────┐
                    │                       │
               Spring Security        Application Layer
            (Spring Session JDBC)           │
                    │                ┌──────┴──────┐
                    │                │             │
                    │             Domain      Use Cases
                    │                │             │
                    │        ┌───────┼─────────────┤
                    │        │       │             │
                    │      Student Results      Analytics
                    │        │       │             │
                    │        │       │             │
                    │        └───────┼─────────────┘
                    │                │
                    │        Infrastructure
                    │                │
                    │       ┌────────┼─────────┐
                    │       │        │         │
                    │    MySQL 8  Storage   Integrations
                    │  (Data +    (Local /  (Email Outbox,
                    │   Sessions)   S3)      University APIs,
                    │                        Excel / CSV)
                    │
                    └──────────────────────────────┘

Academic Result Flow:

University / File
       ↓
Integration / Adapter
       ↓
Result Import
       ↓
Result Validation
       ↓
Result Processing
       ↓
Authoritative Academic Records
       ├── Backlog Tracking
       ├── Academic Calculations
       ├── Academic Passport
       └── Analytics
```

---

# 115. Final Architectural Principle

The fundamental architecture of Acadlytic is:

> **A secure, multi-tenant modular monolith in which the React frontend communicates with a Spring Boot API, authoritative academic data is maintained through clearly owned domain modules, MySQL acts as the transactional data store, long-running academic operations are processed asynchronously, and external university systems are isolated behind integration adapters.**

The architecture is intentionally designed so that Acadlytic can begin with **Excel/CSV-based result processing** and later support **authorized university APIs, webhooks, and automated result integrations** without changing the core academic domain.

---

# 116. Document Status

**Document:** System Architecture  
**Project:** Acadlytic  
**Version:** 1.1  
**Status:** Approved / Aligned with Finalized MVP Architecture  

This document serves as the top-level technical architecture reference for Acadlytic. Detailed implementation decisions must remain consistent with this architecture and the specialized architecture documents.