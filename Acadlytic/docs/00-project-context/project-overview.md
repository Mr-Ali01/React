# Acadlytic — Project Overview

**Document:** `00-project-context/project-overview.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Project Context  
**Last Updated:** 2026-10-05

---

## 1. Document Purpose

This document provides the high-level overview of the Acadlytic platform.

It establishes the project's:

- identity
- purpose
- problem space
- target environment
- core workflow
- primary users
- product boundaries
- major capabilities
- MVP direction
- technical direction
- architectural principles
- academic data principles
- relationship with the rest of the project documentation

This document is intentionally high-level.

It does not replace detailed product requirements, feature specifications, architecture documents, implementation notes, security rules, testing documentation, or deployment documentation.

---

## 2. Project Identity

### 2.1 Product Name

**Acadlytic**

### 2.2 Product Category

Acadlytic is an **academic intelligence and academic records platform for university-affiliated colleges**.

### 2.3 Product Positioning

> Acadlytic helps university-affiliated colleges turn university results into centralized student academic records, backlog intelligence, academic passports, and actionable academic insights.

### 2.4 Primary Environment

Acadlytic is designed primarily for:

- universities
- university-affiliated colleges
- college academic administration
- academic staff
- students

The initial product focus is on the **college side of university-affiliated academic management**, particularly the processing and utilization of university examination results.

---

## 3. Product Vision

Acadlytic aims to provide colleges with a centralized and trustworthy academic data platform that transforms fragmented university result information into structured, longitudinal student academic records.

The platform should allow a college to move from:

```text
University Result Files
        ↓
Manual Processing
        ↓
Scattered Records
        ↓
Difficult Backlog Tracking
        ↓
Limited Academic Visibility
```

toward:

```text
University Result
        ↓
Result Processing
        ↓
Student Academic Record
        ↓
Backlog Tracking
        ↓
Academic Passport
        ↓
College Analytics
```

The long-term direction is to evolve Acadlytic into a broader academic intelligence platform while preserving academic correctness, historical integrity, tenant isolation, and trustworthy source data.

---

## 4. Problem Statement

University-affiliated colleges may receive academic result information in files, spreadsheets, or other university-provided formats.

Managing this information can create several operational problems.

### 4.1 Fragmented Academic Data

Student academic information may be distributed across:

- university result files
- spreadsheets
- college records
- manually maintained documents
- separate student records
- different semester result files

This makes it difficult to maintain a consistent longitudinal academic record.

### 4.2 Manual Result Processing

Academic staff may need to manually:

- inspect result files
- identify students
- match subjects
- verify academic context
- record results
- track failed subjects
- update student records
- prepare reports

Manual processing increases operational effort and creates opportunities for errors.

### 4.3 Student Matching Problems

A result file may contain student information that needs to be matched against existing college records.

Using names as the primary matching mechanism is unsafe because:

- names can be duplicated
- spelling may differ
- formatting may change
- names may contain variations
- students may have similar names

Acadlytic therefore treats the student's official academic identifier as the primary identity mechanism for result matching.

### 4.4 Difficult Backlog Tracking

When a student fails a subject, the academic requirement may remain unresolved until a later attempt is successfully completed.

Without a structured system, it can be difficult to determine:

- which subjects are currently pending
- when the backlog originated
- how many attempts occurred
- whether the backlog has been resolved
- which result resolved it

Acadlytic treats a backlog as an **unresolved academic requirement**, while individual examination attempts remain historical academic records.

### 4.5 Incomplete Longitudinal Academic History

Academic information becomes more useful when semester results, attempts, credits, SGPA, CGPA, and backlog history can be viewed together.

Acadlytic aims to provide this longitudinal view through the **Academic Passport**.

### 4.6 Limited Academic Visibility

Colleges may need to understand academic performance at different levels, including:

- individual students
- semesters
- subjects
- courses/programs
- college-level academic performance
- backlog patterns

Acadlytic provides an analytics layer derived from authoritative academic data.

---

## 5. Core Product Concept

Acadlytic is built around a controlled academic data lifecycle.

```text
University Result
        ↓
Result Import
        ↓
Result Validation
        ↓
Result Processing
        ↓
Authoritative Academic Records
        ↓
┌───────────────┬──────────────────┬─────────────────┐
│               │                  │                 │
↓               ↓                  ↓                 ↓
Backlogs    Academic Passport   Analytics      Student Portal
```

Each stage has a defined responsibility.

### Result Import

Responsible for bringing external result data into the platform.

### Result Validation

Responsible for determining whether imported records satisfy required validation rules.

### Result Processing

Responsible for converting validated records into authoritative academic data.

### Backlog Tracking

Responsible for representing unresolved academic requirements and their history.

### Academic Passport

Provides a trusted read-oriented view of a student's academic journey.

### Analytics

Provides derived academic insights from authoritative processed data.

### Student Portal

Provides students with authorized access to their academic information.

---

## 6. Core Product Principles

Acadlytic is built around the following principles.

### 6.1 Academic Data Must Be Trustworthy

Academic information must not become authoritative merely because it was uploaded.

The system must distinguish between:

- imported data
- normalized data
- validated data
- processed authoritative data
- derived information

### 6.2 Validation Before Authority

The platform must validate result records before allowing them to become authoritative academic records.

```text
Imported
   ↓
Validated
   ↓
Processed
   ↓
Authoritative
```

Invalid or unresolved records must not silently become academic truth.

### 6.3 Preserve Academic History

Academic history must not be overwritten merely because a newer result exists.

The platform must preserve:

- attempts
- result history
- backlog history
- processing traceability
- source information where applicable

Historical information is part of the academic record.

### 6.4 Backlog Is Not an Attempt

A backlog represents an unresolved academic requirement.

An attempt represents an examination/result event associated with that requirement.

Conceptually:

```text
Student
   │
   └── Subject
          │
          ├── Attempt 1 → Fail
          ├── Attempt 2 → Fail
          └── Attempt 3 → Pass
                         ↓
                  Backlog Resolved
```

The system must not confuse the backlog lifecycle with the attempt history.

### 6.5 One Source of Truth

Each important domain concept must have a clear ownership boundary.

| Domain | Primary Responsibility |
|---|---|
| College | College Management |
| Student | Student Management |
| Academic Structure | Academic Structure |
| Imported Results | Result Import |
| Validation State | Result Validation |
| Processed Results | Result Processing |
| Backlog | Backlog Tracking |
| Academic Passport | Read-oriented representation |
| Analytics | Derived/read layer |
| Student Portal | Presentation/access layer |

Derived modules must not silently become alternative sources of truth.

---

## 7. Multi-Tenant Model

Acadlytic is designed as a **multi-tenant platform**.

For the MVP, the primary tenant boundary is the **college**.

Conceptually:

```text
Acadlytic Platform
        │
        ├── College A
        │     ├── Users
        │     ├── Students
        │     ├── Academic Structure
        │     └── Academic Results
        │
        ├── College B
        │     ├── Users
        │     ├── Students
        │     ├── Academic Structure
        │     └── Academic Results
        │
        └── College C
              ├── Users
              ├── Students
              ├── Academic Structure
              └── Academic Results
```

Data belonging to one college must not be accessible to another college unless an explicitly authorized platform-level operation permits it.

Tenant isolation is a **backend security requirement**, not merely a frontend filtering mechanism.

---

## 8. User Roles

### 8.1 SUPER_ADMIN

Platform-level administrative role.

Typical responsibilities include:

- managing colleges
- managing College Admin assignments
- platform-level administration
- authorized cross-tenant administration

### 8.2 COLLEGE_ADMIN

College-level administrative role.

Typical responsibilities include:

- managing college users
- managing students
- managing academic information where authorized
- accessing college academic records
- initiating result workflows
- viewing college-level academic information

### 8.3 ACADEMIC_STAFF

Academic operational role.

Typical responsibilities include:

- student academic operations
- result import/validation/processing where authorized
- backlog-related academic workflows
- academic record review
- academic analytics access according to permissions

### 8.4 STUDENT

Student self-service role.

Students can access authorized information about their own academic records, including:

- dashboard
- results
- backlog information
- Academic Passport
- analytics
- profile
- settings

Students must not directly edit authoritative academic results.

---

## 9. MVP Scope

The MVP focuses on the academic result lifecycle and its immediate academic outputs.

### 9.1 MVP Capabilities

The MVP includes:

- multi-tenant college management
- authentication and authorization
- user provisioning
- academic structure
- student management
- Excel/CSV university result import
- result validation
- result processing
- academic result history
- backlog tracking
- Academic Passport
- basic academic analytics
- student portal

---

## 10. MVP Workflow

The primary MVP workflow is:

```text
SUPER_ADMIN
    ↓
Create College
    ↓
College Admin
    ↓
Configure Academic Structure
    ↓
Create/Manage Students
    ↓
Import University Results
    ↓
Validate Imported Records
    ↓
Review Validation Results
    ↓
Process Valid Results
    ↓
Update Academic Records
    ↓
Update Backlog State
    ↓
Academic Passport
    ↓
Analytics
    ↓
Student Portal
```

The workflow must preserve data ownership and authorization at every stage.

---

## 11. Result Processing Philosophy

Result processing is one of the most important parts of Acadlytic.

The system must distinguish between:

### Raw Input

Information as received from the external result source.

### Normalized Input

Data transformed into the platform's internal representation.

### Validated Data

Data that passes the defined validation rules.

### Processed Data

Validated data that has successfully passed the authoritative processing workflow.

### Derived Data

Information calculated or presented from authoritative records.

The conceptual lifecycle is:

```text
External Result
      ↓
Import
      ↓
Normalize
      ↓
Validate
      ↓
Process
      ↓
Authoritative Result
      ↓
Derived Academic Views
```

The system must not skip the validation boundary.

---

## 12. Academic Calculations

Acadlytic may display academic metrics such as:

- SGPA
- CGPA
- percentage where applicable
- credits
- pass/fail information
- backlog counts
- academic progress

However, Acadlytic must **not invent university-specific academic formulas or rules**.

University-specific academic rules must eventually be represented through approved academic configuration or future regulation functionality.

Until such rules are explicitly defined and approved, the implementation must not assume a universal formula where the university-specific rule is unknown.

---

## 13. Academic Passport

The Academic Passport is a trusted, read-oriented representation of a student's academic journey.

It may present:

- student profile
- program/course
- semester history
- subject results
- attempts
- SGPA
- CGPA
- credits
- backlog information
- academic status

The Academic Passport is **not a second source-of-truth database**.

Its information must be derived from authoritative academic records.

---

## 14. Analytics

Analytics provides derived academic information.

MVP analytics may include:

- student performance
- semester performance
- course-level performance
- subject-level performance
- SGPA trends
- CGPA summaries
- pass/fail metrics
- backlog metrics
- credit information
- academic KPIs

Analytics must follow several rules:

- processed academic data is authoritative
- missing data must not automatically become zero
- missing data must not automatically become failure
- attempts must not be accidentally double-counted
- unique students and examination attempts must be distinguished
- analytics must not redefine academic truth

---

## 15. Student Portal

The Student Portal provides students with authorized access to their own academic information.

The portal may include:

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

The Student Portal is a presentation and access layer.

It does not own academic data.

Students must not be allowed to:

- edit processed results
- manually change SGPA/CGPA
- resolve their own backlog
- modify authoritative academic history

---

## 16. What Is Outside the MVP?

The following capabilities are intentionally outside the initial MVP.

### University Integrations

- live university APIs
- university webhooks
- automatic university result monitoring
- unauthorized university scraping

### Advanced Academic Intelligence

- predictive analytics
- AI-based academic risk prediction
- AI academic query
- advanced recommendation systems
- Academic What-If Simulator

### Advanced Academic Rules

- Regulation & Credit Eligibility Engine
- advanced eligibility automation
- university-specific rule automation before requirements are defined

### Other College ERP Functions

The MVP does not attempt to become a complete college ERP.

Examples include:

- fees
- attendance
- hostel
- library
- transport
- HR
- payroll
- placement
- examination registration
- course registration

### Other Product Features

- mobile application
- SaaS subscription billing
- multi-campus enterprise management
- advanced BI
- public Academic Passport sharing

These may be considered in later product phases.

---

## 17. Future Product Direction

After the MVP is stable, Acadlytic may evolve toward:

```text
MVP Academic Platform
        ↓
Authorized University Integrations
        ↓
Regulation & Eligibility Engine
        ↓
Academic What-If Simulator
        ↓
Academic Risk Intelligence
        ↓
AI Academic Query
        ↓
Advanced Analytics
        ↓
SaaS / Enterprise Platform
```

Future capabilities must be introduced only when their requirements, data quality, security implications, and academic correctness can be established.

---

## 18. Technical Direction

The initial implementation uses a modern web application architecture.

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Axios
- Recharts
- Lucide React

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- Bean Validation
- Maven

### Database

- MySQL

### File Processing

- Apache POI for Excel
- OpenCSV for CSV

### API

REST API under:

```text
/api/v1
```

### Architecture

Acadlytic initially uses a:

> **Modular Monolith**

Microservices are not the initial architecture.

The system should maintain clear module boundaries so that future extraction remains possible if justified.

---

## 19. High-Level System Architecture

Conceptually:

```text
                    Acadlytic
                       │
        ┌──────────────┴──────────────┐
        │                             │
    React Frontend               REST API
        │                             │
        │                      Spring Boot
        │                             │
        │                 ┌───────────┴───────────┐
        │                 │                       │
        │             Application              Domain
        │                 │                       │
        │                 └───────────┬───────────┘
        │                             │
        │                         Repositories
        │                             │
        │                           MySQL
        │
        └─────────────── User Interface
```

Supporting infrastructure may include:

- background jobs
- file storage
- logging
- monitoring
- audit events
- deployment infrastructure
- backups
- CI/CD

---

## 20. Major Application Modules

The major functional modules are:

```text
Authentication
Users
Colleges
Academic Structure
Students
Result Import
Result Validation
Result Processing
Backlog Tracking
Academic Passport
Analytics
Student Portal
```

Each module must have clear ownership and boundaries.

---

## 21. Security Foundation

Security is a core platform requirement.

Acadlytic must enforce:

- authentication
- authorization
- role-based access
- tenant isolation
- IDOR protection
- server-side permission checks
- secure password handling
- protected APIs
- secure file uploads
- input validation
- SQL injection protection
- XSS protection
- secure configuration
- auditability
- secure logging
- HTTPS in deployed environments

The frontend must never be treated as the security boundary.

---

## 22. Data Integrity Foundation

Because Acadlytic manages academic information, data integrity is a primary system requirement.

The system must preserve:

- student identity
- result history
- examination attempts
- backlog history
- processing traceability
- academic context
- source information where applicable

The platform must avoid:

- silent overwrites
- accidental duplicate results
- incorrect student matching
- cross-tenant data access
- invalid results becoming authoritative
- loss of historical attempts
- incorrect backlog resolution
- analytics double-counting

---

## 23. Development Philosophy

Development should proceed in controlled stages.

```text
Documentation
      ↓
Documentation Review
      ↓
Architecture Finalization
      ↓
Database Design
      ↓
API Contract
      ↓
Project Setup
      ↓
Backend Foundation
      ↓
Frontend Foundation
      ↓
Feature Development
      ↓
Integration
      ↓
Testing
      ↓
Security Review
      ↓
Preview Deployment
      ↓
QA
      ↓
Production
```

Implementation should not begin by bypassing the design and contract stages.

---

## 24. Documentation as Source of Truth

Acadlytic documentation is organized into the following major areas:

```text
00 Project Context
01 Research
02 User Definition
03 PRD
04 Tech Stack
05 Architecture
06 Design
07 Project Rules
08 Task Breakdown
09 Development
10 Testing
11 Security
12 Code Review
13 Deployment
14 QA
15 Monitoring
16 Iteration
```

Each level serves a different purpose.

High-level project documents should not duplicate detailed implementation decisions unnecessarily.

Detailed implementation documents should remain consistent with the approved product and architecture decisions.

---

## 25. Documentation Status

The documentation lifecycle is:

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

This document is currently:

**Draft / Under Review**

It should become **Approved** only after the project documentation review confirms that its statements are consistent with the PRD, architecture, technical direction, and implementation constraints.

---

## 26. Project Success Criteria

The MVP should be considered successful when a college can reliably perform the core academic workflow:

```text
College
  ↓
Academic Structure
  ↓
Students
  ↓
University Result Import
  ↓
Validation
  ↓
Processing
  ↓
Academic Records
  ↓
Backlog Tracking
  ↓
Academic Passport
  ↓
Analytics
  ↓
Student Portal
```

while maintaining:

- correct academic data
- preserved history
- tenant isolation
- secure access
- traceable processing
- reliable derived information
- acceptable application performance
- usable responsive interfaces

---

## 27. Non-Negotiable Product Rules

The following rules apply across Acadlytic.

1. **Never invent university-specific academic rules.**
2. **Never allow invalid academic data to silently become authoritative.**
3. **Never use student names as the primary result identity when an official academic identifier exists.**
4. **Never silently overwrite academic history.**
5. **Never treat a backlog as the same thing as an examination attempt.**
6. **Never allow students to directly modify authoritative academic results.**
7. **Never rely on frontend authorization for security.**
8. **Never allow cross-tenant academic data access.**
9. **Never allow analytics to redefine authoritative academic data.**
10. **Never treat the Academic Passport as a second source of truth.**
11. **Never silently convert missing academic information into zero or failure.**
12. **Never introduce a complex future feature without defining its academic, security, data, and operational requirements.**

---

## 28. Relationship With Other Documents

This document provides project context for the documents that follow.

### Related Project Context

```text
project-overview.md
      ├── vision.md
      └── glossary.md
```

### Product Definition

```text
Project Overview
      ↓
Research
      ↓
User Definition
      ↓
PRD
```

### Technical Definition

```text
PRD
      ↓
Tech Stack
      ↓
Architecture
      ↓
Design
      ↓
Project Rules
```

### Implementation

```text
Architecture
      ↓
Task Breakdown
      ↓
Development
      ↓
Testing
      ↓
Security
      ↓
Deployment
      ↓
QA
      ↓
Monitoring
      ↓
Iteration
```

---

## 29. Open Decisions

The following areas remain subject to detailed documentation and review where they have not already been finalized elsewhere:

- exact authentication mechanism
- session/token strategy
- account activation mechanism
- password reset delivery
- file storage implementation
- background job technology
- exact academic calculation configuration
- university master-data management
- final database schema
- final API contracts
- production infrastructure provider
- notification/email provider
- retention policies
- future university integration contracts

These decisions must be resolved in the appropriate architecture, database, API, security, or infrastructure documentation rather than being invented in this project overview.

---

## 30. Definition of Done

This document is ready for approval when:

- project identity is clear
- product positioning is clear
- problem space is defined
- core workflow is defined
- primary users are defined
- MVP boundary is clear
- future scope is separated from MVP
- architectural direction is consistent
- academic data principles are documented
- security principles are documented
- multi-tenant model is clear
- major modules are identified
- no unsupported university-specific rules have been invented
- terminology is consistent with the remaining project documentation
- open decisions are explicitly identified

---

## 31. Final Principle

> **Acadlytic exists to transform fragmented university result information into trustworthy, structured, longitudinal academic intelligence for colleges—without compromising academic correctness, historical integrity, security, or tenant isolation.**