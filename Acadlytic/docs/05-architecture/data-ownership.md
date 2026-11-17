# Cross-Module Data Ownership

**Project:** Acadlytic  
**Document:** Cross-Module Data Ownership  
**Version:** 1.0  
**Status:** Draft / Architecture Baseline  

---

# 1. Purpose

This document defines data ownership across the Acadlytic modules.

Its purpose is to establish:

- which module owns each business domain
- which module is the authoritative source of truth
- which module is allowed to create data
- which module is allowed to update data
- which modules can read the data
- which modules must not modify the data
- relationships between modules
- dependencies between modules
- ownership boundaries
- source-of-truth rules
- cross-module data access rules

This document acts as a bridge between:

```text
Feature Specifications
        ↓
Data Ownership
        ↓
Database Architecture
        ↓
API Architecture
        ↓
Implementation
```

---

# 2. Core Principle

Every important business domain must have a clearly defined **primary owner**.

The owning module is responsible for:

- defining the meaning of the data
- enforcing business rules for that data
- controlling authorized mutations
- maintaining the authoritative state
- exposing the data to other modules through defined interfaces

Other modules may consume the data, but they must not create competing sources of truth.

---

# 3. Why Data Ownership Is Required

Without explicit ownership, multiple modules may independently modify or calculate the same information.

For example:

```text
Result Processing → CGPA
Academic Passport → CGPA
Analytics → CGPA
Student Portal → CGPA
```

This creates the possibility of inconsistent values.

The preferred model is:

```text
Authoritative Academic Calculation
             ↓
          CGPA
             ↓
    ┌────────┼────────┐
    ↓        ↓        ↓
Passport Analytics Portal
   READ       READ     READ
```

There should be one authoritative interpretation of important academic data.

---

# 4. Ownership Definitions

## 4.1 Primary Owner

The **Primary Owner** is the module that is authoritative for a specific business domain.

The owner is responsible for:

- business rules
- authorized creation
- authorized updates
- lifecycle
- validation rules
- source-of-truth state

---

## 4.2 Consumer

A **Consumer** is a module that uses data owned by another module.

A consumer may:

- read the data
- display the data
- calculate derived information from the data
- use the data as an input

A consumer must not independently change the owner's authoritative data.

---

## 4.3 Source of Truth

The **Source of Truth** is the authoritative representation of a business fact.

Example:

```text
Current Active Backlog
        ↓
Backlog Tracking
```

Therefore:

```text
Student Portal → displays backlog
Academic Passport → displays backlog
Analytics → analyzes backlog

Backlog Tracking → owns backlog state
```

---

## 4.4 Derived Data

Derived data is information calculated from authoritative data.

Examples:

- analytics metrics
- dashboard summaries
- academic progress indicators
- Passport presentation data
- performance trends

Derived data must not silently become a competing source of truth.

---

# 5. Acadlytic Module Ownership Overview

The primary ownership model is:

| Business Domain | Primary Owner |
|---|---|
| User Account | Authentication |
| Role and Account Authorization | Authentication |
| College/Tenant | College Management |
| Student Identity | Student Management |
| Student Enrollment | Student Management / Academic Structure boundary |
| University | Academic Structure / Master Data |
| Course | Academic Structure |
| Academic Year | Academic Structure |
| Semester | Academic Structure |
| Subject | Academic Structure |
| Result Import Job | Result Import |
| Imported Result Record | Result Import |
| Validation State | Result Validation |
| Validation Errors | Result Validation |
| Processed Academic Result | Result Processing |
| Result Attempt History | Result Processing |
| Academic Calculation | Result Processing / Academic Calculation domain |
| Current Backlog State | Backlog Tracking |
| Backlog History | Backlog Tracking |
| Academic Passport Representation | Academic Passport |
| Academic Analytics | Analytics |
| Student Portal Experience | Student Portal |

Where ownership requires further domain refinement, the ambiguity is explicitly documented later in this document rather than silently resolved.

---

# 6. Authentication Ownership

## 6.1 Owner

**Authentication**

Authentication owns the identity and account lifecycle required for authenticated access.

---

## 6.2 Authentication Owns

Authentication is responsible for:

- user account identity
- authentication credentials
- account status
- roles
- authorization context
- login state
- password lifecycle
- authentication security events
- session management

---

## 6.3 Consumers

Authentication information may be consumed by:

- College Management
- Student Management
- Result Processing
- Backlog Tracking
- Academic Passport
- Analytics
- Student Portal

---

## 6.4 Mutation Rule

Other modules must not directly modify authentication credentials or authentication state.

For example:

```text
Student Portal
      ↓
Authentication Service
      ↓
Password Change
```

Not:

```text
Student Portal
      ↓
users table
      ↓
Direct password modification
```

---

# 7. College Management Ownership

## 7.1 Owner

**College Management**

College Management owns the college/tenant domain.

---

## 7.2 College Management Owns

- college identity
- college code
- college profile
- college status
- university association
- tenant-level configuration defined for the college
- college administrative ownership/assignment

---

## 7.3 Consumers

College information is consumed by:

- Student Management
- Academic Structure
- Result Import
- Result Validation
- Result Processing
- Backlog Tracking
- Academic Passport
- Analytics
- Student Portal

---

## 7.4 Tenant Boundary

College is the primary tenant boundary for MVP.

Conceptually:

```text
College
   ↓
Students
Academic Data
Results
Backlogs
Analytics
```

A module must not bypass the college tenant boundary.

---

# 8. Student Management Ownership

## 8.1 Owner

**Student Management**

Student Management owns student identity and student master information.

---

## 8.2 Student Management Owns

Examples include:

- student identity
- student identifier
- university registration number
- student profile
- student-college association
- student academic association
- student status
- permitted enrollment information

---

## 8.3 Consumers

Student information is consumed by:

- Result Import
- Result Validation
- Result Processing
- Backlog Tracking
- Academic Passport
- Analytics
- Student Portal

---

## 8.4 Student Identity Rule

Student name must not be used as the primary identity for result matching.

Preferred identity:

```text
University-issued student identifier
        ↓
Student Management
        ↓
Student Record
```

---

## 8.5 Mutation Rule

Result modules must not create a student automatically simply because a student identifier appears in an imported result.

Unknown students should be flagged for review.

```text
Unknown Student
      ↓
Result Validation
      ↓
Validation Error / Review
```

not:

```text
Unknown Student
      ↓
Automatically create Student
```

---

# 9. Academic Structure Ownership

## 9.1 Owner

**Academic Structure**

Academic Structure owns the academic definitions used by the platform.

---

## 9.2 Academic Structure Owns

Examples include:

- university academic definitions
- courses
- academic years
- semesters
- subjects
- subject codes
- subject credits
- academic structure relationships
- applicable academic configuration

---

## 9.3 Consumers

Academic Structure is consumed by:

- Student Management
- Result Import
- Result Validation
- Result Processing
- Backlog Tracking
- Academic Passport
- Analytics
- Student Portal

---

## 9.4 Subject Ownership

Subject identity is owned by Academic Structure.

For example:

```text
Subject Code
Subject Name
Credits
Semester Association
```

Result Processing must not independently redefine subject identity.

---

# 10. Student Enrollment Ownership

Student enrollment represents the relationship between a student and an academic structure.

Conceptually:

```text
Student
   ↓
Enrollment
   ↓
Course
   ↓
Academic Year / Batch
```

The ownership boundary between Student Management and Academic Structure must remain explicit.

### Current architectural rule

- Academic Structure owns the definitions.
- Student Management owns the student's association with those definitions.

Therefore:

```text
Academic Structure
    ↓
defines Course

Student Management
    ↓
associates Student with Course
```

This distinction should be preserved during database design.

---

# 11. Result Import Ownership

## 11.1 Owner

**Result Import**

Result Import owns the ingestion of external result data.

---

## 11.2 Result Import Owns

- import jobs
- uploaded files
- import source
- source metadata
- result release information
- raw imported records
- column mapping
- parsing state
- import status
- import-level errors
- import history

---

## 11.3 Consumers

Result Import data is consumed by:

- Result Validation
- Result Processing
- authorized administrative interfaces

---

## 11.4 Import Does Not Own Official Academic Results

Result Import must not become the source of truth for processed academic results.

The flow is:

```text
University File
      ↓
Result Import
      ↓
Imported Records
      ↓
Result Validation
      ↓
Result Processing
      ↓
Official Academic Result
```

---

# 12. Result Validation Ownership

## 12.1 Owner

**Result Validation**

Result Validation owns the validation state of imported result records.

---

## 12.2 Result Validation Owns

- validation status
- validation errors
- validation warnings
- validation summary
- validation outcome
- validation rules applied during the validation stage

---

## 12.3 Validation Does Not Own Academic Results

Validation determines whether data is acceptable for processing.

It does not become the authoritative academic record.

```text
VALID
  ↓
Result Processing
  ↓
Official Academic Result
```

---

# 13. Result Processing Ownership

## 13.1 Owner

**Result Processing**

Result Processing is responsible for converting validated result information into authoritative academic records.

---

## 13.2 Result Processing Owns

- processed academic results
- result processing state
- result attempt history
- current academic outcome
- processing integrity
- idempotent processing behavior
- academic result persistence
- academic calculation orchestration

---

## 13.3 Result Processing Is the Academic Result Authority

The authoritative academic result should originate from successful Result Processing.

```text
Imported
    ↓
Validated
    ↓
Processed
    ↓
Authoritative Academic Result
```

Unprocessed imported data must not be treated as an official academic result.

---

# 14. Result Attempt History

Result attempt history belongs to the result domain.

The system must preserve historical attempts.

Example:

```text
Subject: Database Systems

Attempt 1 → FAIL
Attempt 2 → PASS
```

The system should not simply overwrite Attempt 1 with Attempt 2.

The historical attempt remains part of the academic record.

---

# 15. Academic Calculation Ownership

Academic calculations such as SGPA and CGPA must have one authoritative calculation responsibility.

For MVP, Result Processing orchestrates the update of academic calculations based on successfully processed academic results.

The detailed calculation rules must come from the applicable academic/regulation configuration.

---

## 15.1 Calculation Rule

The following modules must not independently implement their own CGPA calculation:

```text
Student Portal
Academic Passport
Analytics
```

Instead:

```text
Authoritative Academic Calculation
             ↓
           SGPA
           CGPA
             ↓
    ┌────────┼────────┐
    ↓        ↓        ↓
Passport Analytics Portal
```

---

# 16. SGPA and CGPA Source-of-Truth Rule

SGPA and CGPA must have an authoritative academic calculation.

Consumers may:

- display them
- aggregate them where appropriate
- analyze them
- show trends

Consumers must not redefine the calculation formula.

---

# 17. Backlog Tracking Ownership

## 17.1 Owner

**Backlog Tracking**

Backlog Tracking owns the current backlog state and backlog lifecycle.

---

## 17.2 Backlog Tracking Owns

- active backlog
- backlog creation
- backlog clearance
- backlog status
- backlog history
- attempt-related backlog transitions
- backlog lifecycle

---

## 17.3 Backlog Consumers

Backlog information is consumed by:

- Academic Passport
- Analytics
- Student Portal

---

# 18. Backlog State Rule

The Student Portal must not determine whether a student has a backlog.

Analytics must not determine whether a student has a backlog.

Academic Passport must not determine whether a student has a backlog.

Instead:

```text
Result Processing
       ↓
Backlog Tracking
       ↓
Current Backlog State
       ↓
Passport / Analytics / Portal
```

---

# 19. Backlog Lifecycle

A simplified lifecycle is:

```text
Result Processing
      ↓
FAIL
      ↓
Create / Update Active Backlog
```

and:

```text
Supplementary / Later Result
      ↓
PASS
      ↓
Clear Active Backlog
      ↓
Preserve Historical Attempt
```

The detailed lifecycle remains defined by `backlog-tracking.md`.

---

# 20. Academic Passport Ownership

## 20.1 Owner

**Academic Passport**

Academic Passport owns the representation of the student's consolidated academic journey.

---

## 20.2 Important Boundary

Academic Passport is a **read-oriented representation**, not the primary source of truth for academic facts.

Therefore:

```text
Academic Results → Result Processing
Backlogs → Backlog Tracking
Student Identity → Student Management
Academic Definitions → Academic Structure
```

Academic Passport combines these authoritative sources into a student-facing academic representation.

---

# 21. Academic Passport Data Rule

The Passport should be derived from authoritative academic information.

Conceptually:

```text
Student
   +
Academic Structure
   +
Processed Results
   +
Backlogs
   +
Academic Calculations
        ↓
Academic Passport
```

The Passport should not independently invent or redefine those values.

---

# 22. Analytics Ownership

## 22.1 Owner

**Analytics**

Analytics owns analytics definitions and aggregation logic.

---

## 22.2 Analytics Owns

Examples include:

- KPI definitions
- aggregate calculations
- performance metrics
- trend calculations
- pass/fail metrics
- backlog metrics
- grade distributions
- course-level summaries
- semester-level summaries

---

## 22.3 Analytics Does Not Own Academic Facts

Analytics must not become the source of truth for:

- students
- subjects
- results
- backlogs
- CGPA
- SGPA

Instead:

```text
Authoritative Data
        ↓
Analytics
        ↓
Derived Metrics
```

---

# 23. Analytics Source Data

Analytics may consume:

```text
Students
Academic Structure
Processed Results
Backlogs
Academic Calculations
Academic Passport
```

Where possible, Analytics should consume authoritative underlying data rather than treating a presentation layer as its primary source.

---

# 24. Student Portal Ownership

## 24.1 Owner

**Student Portal**

Student Portal owns the student-facing experience.

---

## 24.2 Student Portal Owns

- student navigation
- student dashboard presentation
- student-facing page structure
- UI state
- student-facing interaction
- authorized student settings experience

---

## 24.3 Student Portal Does Not Own Academic Facts

The Student Portal must not become the authority for:

- student identity
- results
- SGPA
- CGPA
- backlog status
- academic structure
- analytics calculations

It consumes those domains.

---

# 25. Student Portal Data Flow

```text
Authentication
      ↓
Student Identity
      ↓
Student Portal
      ↓
Authorized Academic Services
      ↓
Authoritative Academic Data
```

---

# 26. Source-of-Truth Matrix

| Data | Source of Truth |
|---|---|
| User Account | Authentication |
| Credentials | Authentication |
| Role | Authentication |
| Account Status | Authentication |
| College | College Management |
| College Status | College Management |
| Student Identity | Student Management |
| Student Identifier | Student Management |
| Student Profile | Student Management |
| Student Enrollment | Student Management |
| Course Definition | Academic Structure |
| Semester Definition | Academic Structure |
| Subject Definition | Academic Structure |
| Subject Credits | Academic Structure |
| Imported Result | Result Import |
| Import Job | Result Import |
| Validation Status | Result Validation |
| Validation Errors | Result Validation |
| Processed Result | Result Processing |
| Result Attempt History | Result Processing |
| SGPA | Academic Calculation / Result Processing |
| CGPA | Academic Calculation / Result Processing |
| Current Backlog | Backlog Tracking |
| Backlog History | Backlog Tracking |
| Academic Passport Representation | Academic Passport |
| Analytics Metrics | Analytics |
| Student Portal UI State | Student Portal |

---

# 27. Read / Write Responsibility Matrix

| Domain | Primary Owner | Other Modules |
|---|---|---|
| User Account | Authentication | Read |
| College | College Management | Read |
| Student | Student Management | Read |
| Academic Structure | Academic Structure | Read |
| Result Import | Result Import | Read / Process |
| Validation | Result Validation | Read / Consume |
| Processed Result | Result Processing | Read |
| SGPA / CGPA | Academic Calculation / Result Processing | Read |
| Backlog | Backlog Tracking | Read |
| Academic Passport | Academic Passport | Read |
| Analytics | Analytics | Read |
| Student Portal | Student Portal | Presentation |

---

# 28. Mutation Authority

Only the appropriate owner may perform authoritative mutations.

Example:

```text
Student
   ↓
Student Management
   ↓
Authorized Update
```

not:

```text
Student Portal
   ↓
Direct database mutation
```

Similarly:

```text
Backlog
   ↓
Backlog Tracking
```

not:

```text
Analytics
   ↓
Update backlog
```

---

# 29. Cross-Module Mutation Rule

A module may need to **cause** a change in another module without becoming the owner of that data.

For example:

```text
Result Processing
       ↓
Backlog update required
       ↓
Backlog Tracking
       ↓
Update Backlog
```

Result Processing initiates the business event/process.

Backlog Tracking remains the owner of backlog state.

---

# 30. Command vs Ownership

The module that initiates an operation does not necessarily own the resulting data.

Example:

```text
Result Processing
      ↓
"Student failed subject"
      ↓
Backlog Tracking
      ↓
Create Active Backlog
```

Ownership remains:

```text
Backlog Tracking = Backlog Owner
```

---

# 31. Cross-Module Read Rule

A module may consume another module's data when the dependency is explicitly defined.

Example:

```text
Analytics
   ↓
reads
   ↓
Processed Results
```

Analytics must not maintain a conflicting copy of the official result solely for convenience unless a formally defined read model is introduced.

---

# 32. Cross-Module Write Rule

Direct cross-module database writes should be avoided.

Preferred:

```text
Module A
   ↓
Application Service / API / Domain Operation
   ↓
Module B
   ↓
Module B owns mutation
```

Avoid:

```text
Module A
   ↓
Directly UPDATE Module B's tables
```

This rule protects module boundaries.

---

# 33. Database Ownership Rule

Database table ownership should follow domain ownership.

For example:

```text
Student Management
        ↓
Student-related authoritative data

Backlog Tracking
        ↓
Backlog-related authoritative data

Result Processing
        ↓
Processed result-related authoritative data
```

A module should not directly manipulate another module's authoritative tables.

Exact table boundaries are defined later in Database Architecture.

---

# 34. Historical Data Rule

Historical academic information must be preserved where required.

Examples:

- previous result attempts
- previous backlog states
- processed result history
- audit events

Current state should not replace required historical information.

---

# 35. No Silent Data Duplication

Modules must not create independent copies of authoritative business facts without a documented reason.

For example, avoid unnecessary duplication such as:

```text
students.cgpa
academic_passport.cgpa
analytics.cgpa
student_portal.cgpa
```

unless the architecture explicitly defines these as derived/read-model values.

---

# 36. Derived Data Rule

Derived data may exist when it improves:

- performance
- reporting
- dashboard rendering
- search
- read-model efficiency

However, the architecture must identify:

```text
Source
Transformation
Refresh Strategy
Invalidation Strategy
Owner
```

The derived value must never silently replace the authoritative source.

---

# 37. Tenant Ownership

College is the primary tenant boundary.

Tenant-scoped data must remain associated with the correct college.

Conceptually:

```text
College
   ↓
Student
   ↓
Academic Data
   ↓
Results
   ↓
Backlogs
   ↓
Analytics
```

Cross-tenant access must be prohibited unless explicitly authorized by the platform-level Super Admin context.

---

# 38. Tenant Isolation Rule

Every tenant-scoped operation must enforce tenant authorization on the backend.

The frontend cannot be trusted to provide the correct:

```text
collegeId
```

The backend must derive or verify tenant context from the authenticated identity and authorized request.

---

# 39. Identity Resolution

Student-facing operations should preferably resolve the student from the authenticated user.

Preferred:

```http
GET /api/v1/me/results
```

rather than relying on:

```http
GET /api/v1/students/{studentId}/results
```

for normal student self-service operations.

This reduces unnecessary exposure of identifiers and strengthens authorization.

---

# 40. IDOR Prevention

A student must never be able to access another student's data by changing an identifier.

Example attack:

```text
Student A
    ↓
/students/101/results

changes URL to:

/students/102/results
```

The backend must reject the request if student `102` is not authorized for the authenticated user.

---

# 41. Module Dependency Direction

The preferred conceptual dependency direction is:

```text
Authentication
      ↓
College / Student / Academic Structure
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
      ↓
Student Portal
```

This is a conceptual flow, not a strict requirement that every module directly call the next module.

---

# 42. Important Dependency Clarification

Academic Passport and Analytics are primarily consumers of authoritative academic data.

Therefore:

```text
Result Processing
       ↓
Academic Data
       ↓
Passport / Analytics
```

not:

```text
Passport
   ↓
modifies
   ↓
Result Processing
```

and not:

```text
Analytics
   ↓
modifies
   ↓
Academic Data
```

---

# 43. Result Lifecycle Across Modules

The complete result lifecycle is:

```text
University Result
      ↓
Result Import
      ↓
Imported Result
      ↓
Result Validation
      ↓
Validated Result
      ↓
Result Processing
      ↓
Processed Academic Result
      ↓
Backlog Tracking
      ↓
Academic Passport
      ↓
Analytics
      ↓
Student Portal
```

Each stage has a distinct responsibility.

---

# 44. Responsibility Boundaries

## Authentication

Answers:

> Who is this user?

---

## College Management

Answers:

> Which college/tenant exists and what is its state?

---

## Student Management

Answers:

> Who is this student and what is the student's master information?

---

## Academic Structure

Answers:

> What academic structure does the institution use?

---

## Result Import

Answers:

> What result data was received/imported?

---

## Result Validation

Answers:

> Is the imported result data valid for processing?

---

## Result Processing

Answers:

> What official academic result should be recorded after successful processing?

---

## Backlog Tracking

Answers:

> What is the student's current backlog state?

---

## Academic Passport

Answers:

> What does the student's academic journey look like as a consolidated representation?

---

## Analytics

Answers:

> What insights and metrics can be derived from authoritative academic data?

---

## Student Portal

Answers:

> How does the student securely access and view their academic information?

---

# 45. Ownership Conflict Rules

If two modules appear to own the same business fact, the conflict must be resolved before implementation.

Examples:

```text
Student Management vs Student Portal
```

Resolution:

```text
Student Management = owner
Student Portal = consumer
```

---

```text
Backlog Tracking vs Analytics
```

Resolution:

```text
Backlog Tracking = owner
Analytics = consumer
```

---

```text
Result Processing vs Academic Passport
```

Resolution:

```text
Result Processing = academic result owner
Academic Passport = representation/consumer
```

---

# 46. Ambiguous Ownership Requiring Architecture Review

The following areas require explicit decisions before final database design:

### 46.1 University Master Data

The system needs a clear master-data ownership decision for:

```text
University
University Code
University Configuration
```

The preferred direction is to treat University as shared master/reference data associated with Academic Structure, but the final ownership should be confirmed in Database Architecture.

---

### 46.2 Academic Calculation Domain

SGPA and CGPA calculation responsibility is currently associated with Result Processing / academic calculation.

Before implementation, the architecture should determine whether calculation rules should remain inside Result Processing or become a separate academic calculation domain/service.

The important requirement is:

> There must be one authoritative calculation responsibility.

---

### 46.3 Student Enrollment

Current boundary:

```text
Academic Structure
    ↓
defines academic structures

Student Management
    ↓
associates students with those structures
```

Database Architecture must define the exact entity relationship.

---

# 47. Data Ownership Decision Checklist

Before moving to Database Architecture, confirm:

- [ ] Every major business domain has an owner.
- [ ] Every source of truth is identified.
- [ ] Every authoritative mutation has an owner.
- [ ] Read-only consumers are identified.
- [ ] Cross-module write rules are defined.
- [ ] Tenant ownership is defined.
- [ ] Student identity ownership is defined.
- [ ] Academic structure ownership is defined.
- [ ] Result ownership is defined.
- [ ] Result attempt ownership is defined.
- [ ] SGPA ownership is defined.
- [ ] CGPA ownership is defined.
- [ ] Backlog ownership is defined.
- [ ] Academic Passport boundary is defined.
- [ ] Analytics boundary is defined.
- [ ] Student Portal boundary is defined.
- [ ] Historical data ownership is defined.
- [ ] Ambiguous domains are documented.
- [ ] No module has competing ownership of the same business fact.

---

# 48. AI Coding Agent Rules

When implementing Acadlytic, an AI coding agent must:

1. Identify the owning module before modifying business data.
2. Never modify another module's authoritative data directly.
3. Use defined application services/APIs/domain operations for cross-module mutations.
4. Never create a second source of truth for existing business data.
5. Never calculate SGPA independently in the Student Portal.
6. Never calculate CGPA independently in Analytics.
7. Never determine backlog state in the Student Portal.
8. Never treat Academic Passport as the source of truth for academic results.
9. Never treat Analytics as the source of truth for academic records.
10. Preserve tenant boundaries.
11. Preserve student-level authorization.
12. Prevent IDOR.
13. Preserve historical academic information.
14. Follow the ownership matrix before creating new entities.
15. If ownership is ambiguous, stop and request an architectural decision rather than inventing one.
16. Do not introduce direct cross-module database writes without explicit architectural approval.
17. Keep derived data clearly separated from authoritative data.
18. Follow the feature specification of the owning module.
19. Follow Database Architecture once established.
20. Follow API Architecture once established.

---

# 49. Relationship With Feature Specifications

Data Ownership does not replace the feature specifications.

The documents have different responsibilities.

```text
Feature Specification
        ↓
Defines module behavior

Data Ownership
        ↓
Defines who owns the data

Database Architecture
        ↓
Defines how data is persisted

API Architecture
        ↓
Defines how modules communicate

Implementation
        ↓
Builds the system
```

---

# 50. Relationship With Database Architecture

This document must be completed before finalizing database architecture.

Database Architecture should use this document to determine:

- entity ownership
- table boundaries
- foreign-key relationships
- unique constraints
- tenant keys
- historical records
- derived/read models
- indexes
- deletion strategy

Database Architecture must not contradict this document without an explicit architecture decision.

---

# 51. Relationship With API Architecture

API design should respect module ownership.

For example:

```text
GET /api/v1/me/results
```

may expose Result Processing data to a student.

But the API does not transfer ownership of the result to Student Portal.

Ownership remains:

```text
Result Processing
```

The API is simply an access mechanism.

---

# 52. Conceptual Architecture

The resulting ownership model is:

```text
                         AUTHENTICATION
                              │
                              ↓
                       USER / ROLE / SESSION
                              │
             ┌────────────────┴────────────────┐
             ↓                                 ↓
    COLLEGE MANAGEMENT                  STUDENT MANAGEMENT
             │                                 │
             │                         ┌───────┴────────┐
             │                         ↓                ↓
             │                  ACADEMIC STRUCTURE   ENROLLMENT
             │                         │                │
             └─────────────────────────┴────────────────┘
                                      ↓
                               RESULT IMPORT
                                      ↓
                             RESULT VALIDATION
                                      ↓
                              RESULT PROCESSING
                                      │
                         ┌────────────┴────────────┐
                         ↓                         ↓
                 BACKLOG TRACKING          ACADEMIC RESULTS
                         │                         │
                         └────────────┬────────────┘
                                      ↓
                              ACADEMIC PASSPORT
                                      │
                                      ↓
                                  ANALYTICS
                                      │
                                      ↓
                               STUDENT PORTAL
```

---

# 53. Final Ownership Model

The core ownership model of Acadlytic is:

```text
Authentication
    → User identity and authentication

College Management
    → College / tenant

Student Management
    → Student identity and student association

Academic Structure
    → Academic definitions

Result Import
    → Imported result data

Result Validation
    → Validation state

Result Processing
    → Official processed academic results

Academic Calculation
    → Authoritative SGPA / CGPA calculation responsibility

Backlog Tracking
    → Current and historical backlog state

Academic Passport
    → Consolidated academic representation

Analytics
    → Derived academic metrics and insights

Student Portal
    → Student-facing experience
```

---

# 54. Final Principle

The most important architectural rule in Acadlytic is:

> **One business fact should have one authoritative owner. Other modules should consume that fact rather than independently redefining it.**

Therefore:

```text
ONE SOURCE OF TRUTH
        ↓
MANY AUTHORIZED CONSUMERS
```

This principle must guide the Database Architecture, API Architecture, backend implementation, frontend implementation, testing, and future feature development.

---

# 55. Document Status

**Status:** Draft / Architecture Baseline

This document establishes the initial cross-module data ownership model for Acadlytic.

Before implementation begins, the ownership decisions identified as ambiguous in this document must be finalized during:

```text
Database Architecture
        ↓
API Architecture
        ↓
Implementation Planning
```

Any future module that introduces a new business entity must define its ownership before implementation.