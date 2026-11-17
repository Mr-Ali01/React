# Epics

## E1 Authentication & Access
Users, roles, sessions, permissions.

## E2 Tenant & College Management
College configuration and isolation.

## E3 Academic Structure
University, department, course, batch, regulation, semester, subject.

## E4 Student Management
Student lifecycle and enrollment.

## E5 Result Engine
Upload, parse, normalize, validate, match, preview, process.

## E6 Backlog Intelligence
Backlog creation, attempts, clearance, history.

## E7 Academic Passport
Longitudinal student academic view.

## E8 Analytics
Descriptive academic reporting.

## E9 Student Portal
Student-facing academic information.

## E10 Audit & Operations
Import jobs, audit trails, operational status.

## Future Epics
E11 University Integrations
E12 Regulation Engine
E13 Eligibility Intelligence
E14 Academic Simulator
E15 Academic Risk
E16 AI Query
E17 Billing/SaaS Operations


# Acadlytic — Development Epics

**Document:** `08-task-breakdown/epics.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Type:** Development Epic Breakdown  
**Status:** Draft / Under Review  
**Version:** 1.0

---

# 1. Purpose

This document defines the major development epics required to build Acadlytic.

An **Epic** represents a substantial body of related development work that delivers a meaningful capability or establishes an important technical foundation.

This document translates:

```text
Product Requirements
        ↓
Architecture
        ↓
Feature Specifications
        ↓
Roadmap
        ↓
Epics
        ↓
Tasks
```

The epics provide the structure between the high-level roadmap and the detailed implementation tasks.

This document does not define individual coding tasks.

Individual implementation work belongs in:

```text
08-task-breakdown/tasks.md
```

---

# 2. Epic Principles

## 2.1 Epics Must Represent Meaningful Outcomes

An epic should represent a meaningful capability, platform foundation, or development outcome.

Examples:

- Authentication & Identity
- College & Tenant Management
- Result Processing

An epic should not be unnecessarily small.

Avoid creating separate epics such as:

- Create login button
- Create student table
- Add search icon

Those belong to tasks or subtasks.

---

## 2.2 Epics Must Respect Module Ownership

Each epic must respect the ownership boundaries defined by the architecture and data-ownership documentation.

A module must not silently become responsible for another module's authoritative data.

---

## 2.3 Epics Must Follow Dependencies

An epic should not assume that a dependent capability already exists.

For example:

```text
Student Management
        ↓
Result Import
        ↓
Result Validation
        ↓
Result Processing
```

---

## 2.4 Epics Must Respect MVP Scope

An epic must not introduce future functionality into the MVP unless the product scope is explicitly changed.

---

# 3. Epic Hierarchy

Acadlytic development follows:

```text
Roadmap Phase
      ↓
Epic
      ↓
Feature
      ↓
Task
      ↓
Subtask
```

Example:

```text
Phase 6 — Result Import
        ↓
Epic — Result Import
        ↓
Feature — Excel Import
        ↓
Task — Implement Excel parser
        ↓
Subtask — Map worksheet rows to normalized DTO
```

---

# 4. Epic Overview

The Acadlytic MVP is divided into the following major epics:

| ID | Epic | Priority | Phase |
|---|---|---|---|
| EPIC-01 | Project Foundation | P0 | Phase 0 |
| EPIC-02 | Application & Infrastructure Foundation | P0 | Phase 1 |
| EPIC-03 | Authentication & User Provisioning | P0 | Phase 2 |
| EPIC-04 | College & Tenant Management | P0 | Phase 3 |
| EPIC-05 | Academic Structure | P0 | Phase 4 |
| EPIC-06 | Student Management | P0 | Phase 5 |
| EPIC-07 | Result Import | P0 | Phase 6 |
| EPIC-08 | Result Validation | P0 | Phase 7 |
| EPIC-09 | Result Processing | P0 | Phase 8 |
| EPIC-10 | Backlog Tracking | P0 | Phase 9 |
| EPIC-11 | Academic Passport | P0 | Phase 10 |
| EPIC-12 | Academic Analytics | P0 | Phase 11 |
| EPIC-13 | Student Portal | P0 | Phase 12 |
| EPIC-14 | End-to-End Integration & Hardening | P0 | Phase 13 |
| EPIC-15 | Testing & Quality Assurance | P0 | Phase 14 |
| EPIC-16 | Preview Deployment | P0 | Phase 15 |
| EPIC-17 | Production Release | P0 | Phase 16 |

Post-MVP epics are listed separately.

---

# 5. EPIC-01 — Project Foundation

**Epic ID:** `EPIC-01`  
**Priority:** P0  
**Roadmap Phase:** Phase 0  
**Status:** Planned

## Objective

Establish the project-level foundation required for consistent and controlled development.

## Scope

- repository initialization
- source structure
- documentation structure
- Git conventions
- environment conventions
- development standards
- project configuration
- project README
- engineering baseline

## Major Outcomes

- consistent project structure
- documented development conventions
- reproducible project setup
- controlled source management

## Dependencies

None.

## Related Documentation

- project overview
- architecture documentation
- project rules
- AI coding rules

## Exit Criteria

- repository structure established
- development conventions documented
- required baseline documentation available
- project can be initialized consistently

---

# 6. EPIC-02 — Application & Infrastructure Foundation

**Epic ID:** `EPIC-02`  
**Priority:** P0  
**Roadmap Phase:** Phase 1  
**Status:** Planned

## Objective

Establish the technical platform on which all business modules will run.

## Scope

### Backend

- Java 21
- Spring Boot
- Maven
- Spring Data JPA
- Hibernate
- validation
- exception handling
- configuration profiles
- logging
- OpenAPI

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- Zustand where required
- shared UI foundation

### Database

- MySQL
- migration system
- development database
- test database

### Infrastructure

- Docker where applicable
- environment configuration
- basic CI

## Major Outcomes

A functioning frontend/backend/database development environment.

## Dependencies

`EPIC-01`

## Exit Criteria

- application starts
- database connection works
- migrations work
- frontend communicates with backend
- foundational tooling works

---

# 7. EPIC-03 — Authentication & User Provisioning

**Epic ID:** `EPIC-03`  
**Priority:** P0  
**Roadmap Phase:** Phase 2  
**Status:** Planned

## Objective

Implement identity, authentication, authorization, account lifecycle, and controlled account provisioning.

## Actors

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
PUBLIC VISITOR
```

## Scope

- login
- logout
- current user
- authentication state
- role-based authorization
- protected routes
- tenant context
- password management
- password reset
- account status
- failed-login protection
- account creation
- user provisioning
- security/audit events

## Provisioning

```text
SUPER_ADMIN
      ↓
COLLEGE_ADMIN

COLLEGE_ADMIN
      ↓
ACADEMIC_STAFF
      ↓
STUDENT
```

Where permitted, Academic Staff may create Students.

Public self-registration is not part of the MVP.

## Dependencies

- `EPIC-02`

## Exit Criteria

- users authenticate securely
- role authorization works
- protected routes work
- account provisioning works
- tenant context is available
- password lifecycle works

---

# 8. EPIC-04 — College & Tenant Management

**Epic ID:** `EPIC-04`  
**Priority:** P0  
**Roadmap Phase:** Phase 3  
**Status:** Planned

## Objective

Establish colleges as the primary tenant boundary.

## Scope

- college creation
- college listing
- college details
- college update
- college status
- College Admin assignment
- tenant isolation

## Key Rules

- SUPER_ADMIN creates colleges
- College Admin operates within the authorized college
- cross-tenant access is prohibited
- historical data must be preserved
- physical deletion is not the default MVP behavior

## Dependencies

- `EPIC-03`

## Exit Criteria

- colleges can be managed
- tenant context is enforced
- cross-tenant access is prevented
- college status affects application behavior

---

# 9. EPIC-05 — Academic Structure

**Epic ID:** `EPIC-05`  
**Priority:** P0  
**Roadmap Phase:** Phase 4  
**Status:** Planned

## Objective

Create the academic structure required to interpret student results.

## Scope

- courses
- semesters
- subjects
- academic relationships
- course-semester relationships
- semester-subject relationships
- academic reference data

## Structure

```text
College
   ↓
Course
   ↓
Semester
   ↓
Subject
```

## Important Rule

University-specific academic rules and formulas must not be invented.

## Dependencies

- `EPIC-04`

## Exit Criteria

- academic structures can be managed
- subjects can be associated with appropriate academic contexts
- result records can reference academic structures

---

# 10. EPIC-06 — Student Management

**Epic ID:** `EPIC-06`  
**Priority:** P0  
**Roadmap Phase:** Phase 5  
**Status:** Planned

## Objective

Establish authoritative student identity and academic association.

## Scope

- student creation
- student listing
- student detail
- student update
- student status
- student identifier
- course association
- academic association
- search
- filtering

## Key Rule

The official student identifier is the primary mechanism for result matching.

Names must not be treated as the authoritative matching key.

## Dependencies

- `EPIC-05`

## Exit Criteria

- students can be created and managed
- students belong to the correct tenant
- students have valid academic context
- student identity is ready for result matching

---

# 11. EPIC-07 — Result Import

**Epic ID:** `EPIC-07`  
**Priority:** P0  
**Roadmap Phase:** Phase 6  
**Status:** Planned

## Objective

Import university result files into a controlled processing pipeline.

## Scope

- Excel upload
- CSV upload
- file validation
- parsing
- column mapping
- normalization
- student matching
- subject matching
- duplicate detection
- preview
- import history
- import job tracking
- import errors

## Processing Pipeline

```text
File
 ↓
Upload
 ↓
Parse
 ↓
Normalize
 ↓
Match
 ↓
Duplicate Detection
 ↓
Preview
 ↓
Validation
```

## Key Rules

- upload does not equal processing
- upload does not equal authoritative academic data
- unknown students are flagged
- unknown subjects are flagged
- imported data must remain traceable

## Dependencies

- `EPIC-06`

## Exit Criteria

- supported files can be imported
- records are normalized
- matching is reliable
- errors are visible
- import history is preserved

---

# 12. EPIC-08 — Result Validation

**Epic ID:** `EPIC-08`  
**Priority:** P0  
**Roadmap Phase:** Phase 7  
**Status:** Planned

## Objective

Validate normalized result records before authoritative processing.

## Scope

- required-field validation
- student validation
- subject validation
- academic context validation
- result value validation
- duplicate validation
- business-rule validation
- warning handling
- validation summary
- validation records

## Validation States

```text
PENDING
VALID
INVALID
WARNING
```

## Dependencies

- `EPIC-07`
- `EPIC-05`
- `EPIC-06`

## Exit Criteria

- records receive deterministic validation status
- invalid records are identifiable
- warnings are distinguishable
- validation does not modify authoritative academic records

---

# 13. EPIC-09 — Result Processing

**Epic ID:** `EPIC-09`  
**Priority:** P0  
**Roadmap Phase:** Phase 8  
**Status:** Planned

## Objective

Convert validated result records into authoritative academic records.

## Scope

- processing jobs
- result persistence
- transaction management
- attempt history
- regular/supplementary results
- current/latest outcome
- backlog update
- SGPA/CGPA update where applicable
- Academic Passport update trigger
- audit trail
- idempotency
- processing recovery

## Core Flow

```text
Validated Result
      ↓
Processing
      ↓
Authoritative Academic Record
      ↓
Backlog State
      ↓
Academic Summary
      ↓
Passport / Analytics Read Models
```

## Critical Rules

- preserve historical attempts
- prevent duplicate processing
- use transactions
- maintain academic data integrity
- never invent academic formulas
- missing values must not automatically become zero

## Dependencies

- `EPIC-08`

## Exit Criteria

- valid results become authoritative records
- attempt history is preserved
- downstream academic state is updated correctly
- processing is auditable and recoverable

---

# 14. EPIC-10 — Backlog Tracking

**Epic ID:** `EPIC-10`  
**Priority:** P0  
**Roadmap Phase:** Phase 9  
**Status:** Planned

## Objective

Provide reliable backlog lifecycle tracking.

## Scope

- backlog identification
- active backlog
- cleared backlog
- attempt history
- backlog status
- backlog summary
- student backlog view
- backlog analytics foundation

## Lifecycle

```text
Result Attempt
      ↓
Outcome
      ↓
Backlog Determination
      ↓
ACTIVE
      ↓
Future Attempt
      ↓
CLEARED / ACTIVE
```

## Key Rule

Backlog state is derived from authoritative academic results.

## Dependencies

- `EPIC-09`

## Exit Criteria

- active backlogs are correct
- cleared backlogs are represented
- attempts are preserved
- backlog summaries match academic records

---

# 15. EPIC-11 — Academic Passport

**Epic ID:** `EPIC-11`  
**Priority:** P0  
**Roadmap Phase:** Phase 10  
**Status:** Planned

## Objective

Provide a centralized read-oriented representation of a student's academic history.

## Scope

- student profile summary
- academic history
- semester results
- subject results
- SGPA
- CGPA
- credits
- backlog summary
- attempt history
- academic status

## Architecture

```text
Authoritative Academic Data
          ↓
    Projection / Read Model
          ↓
     Academic Passport
```

## Key Rule

The Academic Passport is not the source of truth.

## Dependencies

- `EPIC-09`
- `EPIC-10`

## Exit Criteria

- Passport accurately reflects authoritative data
- historical academic information is preserved
- backlog information is consistent
- authorization is enforced

---

# 16. EPIC-12 — Academic Analytics

**Epic ID:** `EPIC-12`  
**Priority:** P0  
**Roadmap Phase:** Phase 11  
**Status:** Planned

## Objective

Provide basic academic analytics based on authoritative processed data.

## Scope

- college analytics
- student analytics
- course analytics
- semester analytics
- subject analytics
- SGPA trends
- CGPA summaries
- pass/fail metrics
- backlog metrics
- credit metrics
- authorized filters

## Key Rules

- analytics are derived
- analytics are not authoritative
- no double-counting attempts
- missing data must not become zero
- tenant boundaries must be respected

## Dependencies

- `EPIC-09`
- `EPIC-10`
- `EPIC-11`

## Exit Criteria

- authorized users can view analytics
- calculations are consistent
- filters work
- tenant isolation is enforced
- analytics performance is acceptable

---

# 17. EPIC-13 — Student Portal

**Epic ID:** `EPIC-13`  
**Priority:** P0  
**Roadmap Phase:** Phase 12  
**Status:** Planned

## Objective

Provide students with secure self-service access to their academic information.

## Scope

- student dashboard
- Academic Passport
- results
- backlogs
- analytics
- profile
- settings
- password management
- logout

## Navigation

```text
Dashboard
Academic Passport
Results
Backlogs
Analytics
Profile
Settings
Logout
```

## Key Rules

Students:

- can view their own academic data
- cannot modify authoritative results
- cannot access other students' data

## Dependencies

- `EPIC-03`
- `EPIC-06`
- `EPIC-10`
- `EPIC-11`
- `EPIC-12`

## Exit Criteria

- student portal is functional
- self-service authorization works
- student data isolation is verified
- profile and security settings work

---

# 18. EPIC-14 — End-to-End Integration & Hardening

**Epic ID:** `EPIC-14`  
**Priority:** P0  
**Roadmap Phase:** Phase 13  
**Status:** Planned

## Objective

Connect all MVP modules into one reliable end-to-end workflow.

## Scope

- frontend/backend integration
- API contract verification
- module integration
- state transition verification
- tenant isolation verification
- authorization verification
- result pipeline integration
- Passport consistency
- analytics consistency
- student portal consistency
- error recovery
- integration hardening

## End-to-End Flow

```text
College
  ↓
Academic Structure
  ↓
Student
  ↓
Result Import
  ↓
Validation
  ↓
Processing
  ↓
Academic Record
  ↓
Backlog
  ↓
Academic Passport
  ↓
Analytics
  ↓
Student Portal
```

## Dependencies

- `EPIC-03` through `EPIC-13`

## Exit Criteria

The complete MVP workflow operates as one coherent system.

---

# 19. EPIC-15 — Testing & Quality Assurance

**Epic ID:** `EPIC-15`  
**Priority:** P0  
**Roadmap Phase:** Phase 14  
**Status:** Planned

## Objective

Verify functional correctness, academic data integrity, security, performance, and usability.

## Scope

### Backend Testing

- unit tests
- service tests
- repository tests
- API tests
- integration tests

### Frontend Testing

- component tests
- page tests
- interaction tests
- route tests

### End-to-End

- authentication
- college management
- student management
- result workflow
- backlog lifecycle
- Passport
- analytics
- student portal

### Security

- IDOR
- tenant isolation
- authorization
- role escalation
- input validation
- authentication abuse
- file upload security

### Performance

- database queries
- pagination
- large imports
- batch processing
- analytics queries
- N+1 detection

## Dependencies

- `EPIC-14`

## Exit Criteria

- critical tests pass
- release-blocking defects are resolved
- security checks pass
- academic integrity is verified

---

# 20. EPIC-16 — Preview Deployment

**Epic ID:** `EPIC-16`  
**Priority:** P0  
**Roadmap Phase:** Phase 15  
**Status:** Planned

## Objective

Deploy Acadlytic into a controlled preview/staging environment.

## Scope

- deployment configuration
- environment variables
- database migrations
- frontend deployment
- backend deployment
- HTTPS
- logging
- monitoring
- backups
- smoke testing
- preview QA

## Dependencies

- `EPIC-15`

## Exit Criteria

- preview environment works
- deployment is repeatable
- complete MVP workflow works
- critical issues are resolved

---

# 21. EPIC-17 — Production Release

**Epic ID:** `EPIC-17`  
**Priority:** P0  
**Roadmap Phase:** Phase 16  
**Status:** Planned

## Objective

Release the validated MVP into production.

## Scope

- production environment
- production database
- secure secrets
- production migrations
- HTTPS
- monitoring
- logging
- backups
- rollback strategy
- production smoke tests
- release validation

## Dependencies

- `EPIC-16`

## Exit Criteria

- production deployment succeeds
- smoke tests pass
- monitoring is active
- backups are verified
- rollback process is available

---

# 22. Post-MVP Epics

The following epics are intentionally outside the MVP.

They should not be implemented until the MVP is stable and the product scope is explicitly expanded.

---

## EPIC-18 — Authorized University Integrations

**Priority:** P1 — Post-MVP

### Scope

- university APIs
- authorized feeds
- webhooks
- automated synchronization
- connector management
- synchronization monitoring
- retry/recovery

### Rules

Only authorized integration mechanisms may be used.

Unauthorized scraping or bypassing university controls is not part of the product.

---

# 23. EPIC-19 — Regulation & Credit Eligibility Engine

**Priority:** P1 — Post-MVP

## Scope

- university regulations
- regulation versions
- credit requirements
- eligibility rules
- progression rules
- configurable academic policies

## Key Principle

Academic regulations should be configuration-driven where practical rather than hard-coded throughout the application.

---

# 24. EPIC-20 — Academic What-If Simulator

**Priority:** P1 — Post-MVP

## Scope

- target CGPA scenarios
- hypothetical marks/results
- future semester scenarios
- academic planning
- target achievement analysis

The simulator must not modify authoritative academic records.

---

# 25. EPIC-21 — Academic Risk Intelligence

**Priority:** P2 — Post-MVP

## Scope

Potential capabilities:

- academic risk indicators
- backlog risk
- performance trends
- progression risk
- intervention indicators

Predictive functionality must be introduced only after reliable academic data and clearly defined analytical models exist.

---

# 26. EPIC-22 — AI Academic Query

**Priority:** P2 — Post-MVP

## Scope

Potential capabilities:

- natural-language academic questions
- student academic summaries
- college-level questions
- contextual academic insights

## Security Requirements

AI access must respect:

- authentication
- authorization
- tenant isolation
- student data boundaries
- data minimization
- source-of-truth rules

AI must not be treated as an authority over academic records.

---

# 27. EPIC-23 — SaaS Billing & Subscription Management

**Priority:** P2 — Post-MVP

## Scope

- subscription plans
- billing
- usage limits
- plan management
- payment integration
- organization billing
- enterprise plans

This is outside the current MVP.

---

# 28. EPIC-24 — Multi-Campus Enterprise Management

**Priority:** P2 — Post-MVP

## Scope

Potential capabilities:

```text
Organization
   ↓
Campus
   ↓
College
   ↓
Academic Structure
   ↓
Students
```

Potential features:

- multi-campus organizations
- centralized administration
- cross-campus analytics
- organization-level settings
- enterprise controls

This should be implemented only after the single-college tenant model is stable.

---

# 29. Epic Dependency Graph

The primary MVP dependency chain is:

```text
EPIC-01
Project Foundation
      ↓
EPIC-02
Application & Infrastructure
      ↓
EPIC-03
Authentication
      ↓
EPIC-04
College / Tenant
      ↓
EPIC-05
Academic Structure
      ↓
EPIC-06
Student Management
      ↓
EPIC-07
Result Import
      ↓
EPIC-08
Result Validation
      ↓
EPIC-09
Result Processing
      ↓
EPIC-10
Backlog Tracking
      ↓
EPIC-11
Academic Passport
      ↓
EPIC-12
Analytics
      ↓
EPIC-13
Student Portal
      ↓
EPIC-14
Integration & Hardening
      ↓
EPIC-15
Testing & QA
      ↓
EPIC-16
Preview Deployment
      ↓
EPIC-17
Production Release
```

---

# 30. Parallel Work Opportunities

Not all work must be strictly sequential.

After the required foundation exists, some epics may proceed partially in parallel.

For example:

```text
                    ┌── Design System
                    │
Foundation ─────────┼── Navigation
                    │
                    ├── Authentication UI
                    │
                    └── Backend Foundation
```

Later:

```text
Academic Structure ──────┐
                         ├── Student Management
Database Foundation ─────┘

Result Import ───────────┐
                         ├── Validation
Validation Rules ────────┘
```

Parallel work must respect:

- API dependencies
- database dependencies
- ownership boundaries
- security requirements
- source-of-truth rules

---

# 31. Epic Priority Model

Priority levels:

| Priority | Meaning |
|---|---|
| P0 | Required for MVP |
| P1 | Important post-MVP capability |
| P2 | Future expansion |
| P3 | Long-term / optional |

The current MVP epics are P0.

Post-MVP priorities may change based on product validation.

---

# 32. Epic Status Model

Each epic should use one of the following statuses:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
IN_REVIEW
COMPLETED
DEFERRED
CANCELLED
```

Status must represent the actual development state.

An epic must not be marked `COMPLETED` merely because its UI has been created.

---

# 33. Epic Definition of Done

An epic is complete only when:

- scope is implemented
- required database changes are complete
- backend behavior is implemented
- API contracts are stable
- frontend integration is complete where applicable
- validation is implemented
- authorization is implemented
- tenant isolation is verified where applicable
- tests are present
- critical defects are resolved
- security requirements are satisfied
- documentation is updated
- code review is completed
- acceptance criteria are satisfied

---

# 34. Academic Data Integrity Requirements

All academic-data epics must follow these rules.

## 34.1 Preserve History

Historical attempts must not be silently overwritten.

---

## 34.2 Missing Is Not Zero

Missing academic information must not automatically be interpreted as zero.

---

## 34.3 No Invented Formulas

University-specific formulas must not be guessed.

---

## 34.4 Authoritative Source

Processed academic records remain the source of truth.

---

## 34.5 Derived Views

The following are derived or read-oriented:

- Academic Passport
- Analytics
- Student dashboard summaries

---

## 34.6 Controlled Mutations

Backlog and academic state changes must occur through controlled domain/application operations.

---

# 35. Security Requirements Across Epics

Every epic involving protected data must consider:

- authentication
- authorization
- tenant isolation
- IDOR protection
- input validation
- secure error handling
- auditability
- least privilege
- sensitive data protection
- secure file handling
- secure database access

Security must not be treated as a final-stage feature.

---

# 36. AI-Assisted Development Rules

AI-assisted implementation must follow the project's AI coding rules.

AI must:

- review the relevant epic before implementation
- review the corresponding feature specification
- follow architecture boundaries
- follow coding rules
- follow security rules
- follow database rules
- avoid inventing requirements
- avoid unnecessary refactoring
- avoid unrelated modifications
- generate tests for critical business logic
- flag unresolved decisions
- preserve existing contracts

AI-generated code is not considered complete until it has been reviewed and tested.

---

# 37. Relationship With `roadmap.md`

`roadmap.md` defines the development sequence.

`epics.md` defines the major bodies of work within that sequence.

```text
Roadmap
   ↓
Phase
   ↓
Epic
```

Example:

```text
Roadmap Phase 8
      ↓
Result Processing
      ↓
EPIC-09
```

The epic must remain consistent with the roadmap.

---

# 38. Relationship With `tasks.md`

`tasks.md` will decompose each epic into actionable implementation work.

Example:

```text
EPIC-09
Result Processing
      ↓
Feature
Result Persistence
      ↓
Task
Create Result Entity
      ↓
Task
Implement Processing Service
      ↓
Task
Implement Transaction Boundary
      ↓
Task
Add Idempotency Protection
      ↓
Task
Write Processing Tests
```

Tasks must not silently introduce new product requirements.

---

# 39. Epic Change Management

If an epic changes significantly, review:

1. Product Requirements
2. Feature Specification
3. Architecture
4. Data Ownership
5. Database Rules
6. Security Rules
7. Roadmap
8. Related Tasks

A significant scope change should update the authoritative source document before implementation.

---

# 40. Epic Review Checklist

Before approving an epic, verify:

### Scope

- [ ] Objective is clear
- [ ] Scope is defined
- [ ] MVP boundary is clear
- [ ] Out-of-scope behavior is clear

### Architecture

- [ ] Module ownership is clear
- [ ] Dependencies are identified
- [ ] Source of truth is clear
- [ ] Integration boundaries are clear

### Data

- [ ] Database responsibilities are understood
- [ ] Historical data requirements are understood
- [ ] Tenant boundaries are defined

### Security

- [ ] Authentication requirements identified
- [ ] Authorization requirements identified
- [ ] Tenant isolation considered
- [ ] Sensitive data requirements considered

### Engineering

- [ ] Testing requirements identified
- [ ] Performance considerations identified
- [ ] Error handling considered
- [ ] Observability considered

### Delivery

- [ ] Exit criteria are defined
- [ ] Dependencies are defined
- [ ] Priority is assigned
- [ ] Status is assigned

---

# 41. Unresolved Decisions

The following decisions remain outside the responsibility of this document and must be resolved in their appropriate source documents:

- final authentication/session mechanism
- account activation implementation
- background processing technology
- file storage provider
- production infrastructure provider
- observability tooling
- notification provider
- detailed university-specific academic formulas
- detailed regulation engine design
- production scaling strategy
- SaaS billing architecture

No epic should invent these decisions during implementation.

---

# 42. Status

**Status:** Draft / Under Review

The epic structure should move through:

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

An epic becomes **Implementation Ready** only after its scope, dependencies, acceptance criteria, architecture impact, and related requirements have been reviewed.

---

# 43. Final Epic Principle

Acadlytic should be built as a sequence of cohesive, testable capabilities rather than as disconnected screens or isolated technical features.

The core MVP progression is:

```text
Foundation
   ↓
Identity
   ↓
Tenant
   ↓
Academic Structure
   ↓
Students
   ↓
Results
   ↓
Validation
   ↓
Processing
   ↓
Backlogs
   ↓
Academic Passport
   ↓
Analytics
   ↓
Student Portal
   ↓
Quality
   ↓
Deployment
```

Each epic must strengthen the same central product workflow:

> **Turn university result data into reliable, traceable, tenant-isolated student academic records and actionable academic intelligence.**