# Acadlytic — Project Glossary

**Document:** `00-project-context/glossary.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Project Glossary  
**Last Updated:** 2026-10-05

---

## 1. Purpose

This document defines the standard terminology used throughout the Acadlytic project.

The glossary exists to ensure that:

- product documents use consistent terminology
- technical documents use consistent domain language
- developers and designers interpret concepts consistently
- academic concepts are not confused with application concepts
- similar terms are not used interchangeably when they represent different concepts
- future documentation and implementation remain aligned

When a term has a specific meaning in Acadlytic, that meaning should be preferred over informal alternatives.

---

# 2. Product Terms

## 2.1 Acadlytic

**Definition:**  
Acadlytic is an academic intelligence and academic records platform designed primarily for university-affiliated colleges.

It transforms university result information into structured academic records, backlog intelligence, Academic Passports, and academic analytics.

---

## 2.2 Academic Intelligence

**Definition:**  
The ability to transform reliable academic records into meaningful information, analytics, and eventually decision-support capabilities.

Academic intelligence is built on top of trustworthy academic data.

```text
Academic Data
      ↓
Structured Records
      ↓
Analytics
      ↓
Intelligence
```

---

## 2.3 Academic Data

**Definition:**  
Information related to a student's academic journey and the academic structures required to interpret that information.

Examples include:

- student academic identity
- course/program
- semester
- subject
- examination result
- attempt
- credits
- SGPA
- CGPA
- backlog state

---

## 2.4 Academic Record

**Definition:**  
A structured representation of authoritative academic information associated with a student.

Academic records are created through the controlled result-processing workflow.

---

## 2.5 Academic Passport

**Definition:**  
A trusted, read-oriented representation of a student's academic journey.

It may contain:

- student profile
- program
- semester history
- subject results
- attempts
- SGPA
- CGPA
- credits
- backlog information
- academic status

The Academic Passport is not a separate source of academic truth.

---

## 2.6 Academic Journey

**Definition:**  
The longitudinal progression of a student's academic history across semesters, subjects, attempts, results, credits, and academic outcomes.

---

## 2.7 Academic Intelligence Platform

**Definition:**  
A system that combines structured academic data, analytics, and academic decision-support capabilities.

Acadlytic is intended to evolve into an academic intelligence platform rather than remain only a result-processing application.

---

# 3. Organization and Tenant Terms

## 3.1 Platform

**Definition:**  
The complete Acadlytic software system and its supporting infrastructure.

---

## 3.2 College

**Definition:**  
A university-affiliated educational institution using Acadlytic.

In the MVP, the college is the primary tenant boundary.

---

## 3.3 Tenant

**Definition:**  
An isolated organizational context whose data must be protected from other organizational contexts.

For the MVP, a college represents the primary tenant.

---

## 3.4 Tenant Isolation

**Definition:**  
The security and architectural requirement that data belonging to one tenant must not be accessible to another tenant unless an explicitly authorized platform-level operation permits it.

Tenant isolation must be enforced on the backend.

---

## 3.5 University

**Definition:**  
An academic authority associated with colleges and responsible for the academic structure, regulations, or examination results relevant to those colleges.

University-specific rules must not be assumed unless explicitly defined.

---

## 3.6 University-Affiliated College

**Definition:**  
A college whose academic programs, examinations, or results are associated with a university.

This is the primary institutional environment targeted by Acadlytic.

---

## 3.7 Multi-Tenant

**Definition:**  
An architecture in which one Acadlytic platform instance can support multiple independent college tenants while maintaining data isolation between them.

---

# 4. User and Role Terms

## 4.1 User

**Definition:**  
A person with an authenticated account in Acadlytic.

A user account represents an application identity.

---

## 4.2 SUPER_ADMIN

**Definition:**  
A platform-level administrative role with authorized access to platform-level operations.

Typical responsibilities include:

- college management
- College Admin management
- platform administration
- authorized cross-tenant operations

---

## 4.3 COLLEGE_ADMIN

**Definition:**  
A college-level administrative role responsible for managing authorized operations within a college tenant.

---

## 4.4 ACADEMIC_STAFF

**Definition:**  
A role intended for academic operational staff who perform authorized academic workflows.

Examples include:

- student academic operations
- result processing
- academic record review
- backlog-related operations
- academic analytics

---

## 4.5 STUDENT

**Definition:**  
An authenticated student account that provides authorized self-service access to the student's own academic information.

---

## 4.6 Public Visitor

**Definition:**  
An unauthenticated person accessing publicly available Acadlytic pages.

A Public Visitor does not have access to protected academic information.

---

## 4.7 Authentication

**Definition:**  
The process of establishing **who a user is**.

Conceptually:

> Authentication answers: **Who are you?**

---

## 4.8 Authorization

**Definition:**  
The process of determining whether an authenticated identity is allowed to perform a particular action or access particular information.

Conceptually:

> Authorization answers: **What are you allowed to do?**

---

## 4.9 Account Provisioning

**Definition:**  
The controlled process through which an application account is created and associated with an appropriate tenant and role.

MVP provisioning is controlled rather than public self-registration.

---

## 4.10 Self-Service

**Definition:**  
A user workflow in which an authenticated user accesses or manages information that belongs to that user's own identity.

For student self-service, Acadlytic uses `/me` API patterns where appropriate.

---

# 5. Academic Structure Terms

## 5.1 Academic Structure

**Definition:**  
The hierarchical academic entities required to interpret student academic results.

The conceptual structure is:

```text
University
    ↓
College
    ↓
Course / Program
    ↓
Semester
    ↓
Subject
```

---

## 5.2 Course

**Definition:**  
An academic program or course of study in which students are enrolled.

The exact academic meaning may depend on institutional terminology.

---

## 5.3 Program

**Definition:**  
An academic course of study associated with a student's enrollment.

Where the project uses `Course / Program`, the final database and API terminology should remain consistent after the academic model is finalized.

---

## 5.4 Semester

**Definition:**  
A defined academic period within a course or program.

A semester normally has an explicit ordering within the academic program.

---

## 5.5 Subject

**Definition:**  
An academic unit or course component for which a student may receive an academic result.

A subject may have:

- subject code
- name
- credits
- academic context

---

## 5.6 Subject Code

**Definition:**  
The institutional identifier used to identify a subject.

Subject code is preferred over subject name for result matching where an official code exists.

---

## 5.7 Credits

**Definition:**  
The academic credit value associated with a subject or academic component.

Credit interpretation must follow the applicable academic configuration or institutional rules.

---

## 5.8 Academic Context

**Definition:**  
The collection of academic information required to correctly interpret a result.

Examples include:

- university
- college
- course/program
- semester
- subject
- regulation where applicable
- result release
- examination context

---

# 6. Student Terms

## 6.1 Student

**Definition:**  
An academic identity representing a person enrolled in a course/program within a college tenant.

A student is an academic identity, not merely a user account.

---

## 6.2 Student Identity

**Definition:**  
The information used to uniquely identify a student within the academic system.

Where an official academic identifier exists, it should be used as the primary identity for result matching.

---

## 6.3 Student Identifier

**Definition:**  
An official identifier associated with a student in the academic system.

Examples may include:

- university registration number
- enrollment number
- official student identifier

The exact identifier depends on the institution.

---

## 6.4 Student Registration Number

**Definition:**  
An official academic identifier used to identify a student.

It should be treated as a primary result-matching identity when applicable.

---

## 6.5 Student Name

**Definition:**  
The student's human-readable name.

Student name is useful for display and review but should not be treated as the primary result identity when a reliable official identifier exists.

---

## 6.6 Student Status

**Definition:**  
The lifecycle state of a student record.

Examples may include:

- active
- inactive
- graduated
- suspended

The exact status model is defined by the relevant implementation and requirements documentation.

---

# 7. Result Terms

## 7.1 University Result

**Definition:**  
Academic result information received from a university or another authorized academic source.

---

## 7.2 Result File

**Definition:**  
An external file containing academic result information.

MVP supported formats include:

- Excel
- CSV

---

## 7.3 Result Import

**Definition:**  
The process of bringing external academic result information into Acadlytic.

Result Import is an **ingestion boundary**, not the academic truth engine.

---

## 7.4 Imported Result

**Definition:**  
A result record that has been received and represented within the result-import workflow but has not necessarily become authoritative academic data.

---

## 7.5 Raw Data

**Definition:**  
Information preserved as received from the external source before normalization or transformation.

---

## 7.6 Normalized Data

**Definition:**  
Imported data transformed into the internal structure and representation expected by Acadlytic.

Normalization may include:

- formatting
- standardization
- parsing
- type conversion
- field mapping

Normalization does not automatically make data academically valid.

---

## 7.7 Result Validation

**Definition:**  
The process of checking imported and normalized result records against defined validation rules before authoritative processing.

---

## 7.8 Validation Status

The state assigned to an imported result during validation.

MVP validation statuses are:

- `PENDING`
- `VALID`
- `INVALID`
- `WARNING`

---

## 7.9 VALID

**Definition:**  
A result record that satisfies the required validation rules and is eligible for authoritative processing under the applicable workflow.

---

## 7.10 INVALID

**Definition:**  
A result record that fails one or more required validation rules and must not be processed as authoritative academic data.

---

## 7.11 WARNING

**Definition:**  
A result record containing a condition that does not necessarily make it invalid but requires explicit handling according to the defined workflow.

Warnings must not automatically bypass academic controls.

---

## 7.12 PENDING

**Definition:**  
A result record whose validation state has not yet been finalized.

---

## 7.13 Result Processing

**Definition:**  
The authoritative workflow that converts eligible validated result records into authoritative academic records.

Result Processing is the primary academic mutation boundary.

---

## 7.14 Processed Result

**Definition:**  
A result that has successfully passed the authoritative processing workflow and has become part of the academic record.

---

## 7.15 Authoritative Academic Data

**Definition:**  
Academic information that the system recognizes as the trusted source for downstream academic views and calculations.

---

## 7.16 Result Release

**Definition:**  
A defined release or publication context associated with a set of university results.

A result release may be used to identify and distinguish separate result publications.

---

## 7.17 Examination Attempt

**Definition:**  
A student's individual attempt at obtaining a result for an academic subject or requirement.

Attempts are historical academic events and must be preserved.

---

## 7.18 Attempt History

**Definition:**  
The ordered historical record of a student's attempts for an academic subject or requirement.

Example:

```text
Attempt 1 → Fail
Attempt 2 → Fail
Attempt 3 → Pass
```

---

## 7.19 Regular Attempt

**Definition:**  
An examination attempt associated with the normal academic examination cycle.

The exact institutional definition may vary.

---

## 7.20 Supplementary Attempt

**Definition:**  
An examination attempt associated with a supplementary or additional examination cycle.

The exact institutional definition may vary.

---

## 7.21 Duplicate Result

**Definition:**  
A result record that represents the same logical academic result identity as another record when the record should not be duplicated.

Duplicate detection must consider the approved academic identity rules.

---

## 7.22 Result Matching

**Definition:**  
The process of associating an imported result with an existing student and subject within the correct academic context.

Student matching should use the official academic identifier where available.

Subject matching should use the subject code where available.

---

## 7.23 Unknown Student

**Definition:**  
An imported result whose student identifier cannot be matched to an existing authorized student record.

Unknown students must be flagged for review rather than silently creating student accounts or records.

---

## 7.24 Unknown Subject

**Definition:**  
An imported result whose subject identifier cannot be matched to the expected academic structure.

Unknown subjects must be flagged rather than silently created.

---

# 8. Backlog Terms

## 8.1 Backlog

**Definition:**  
An unresolved academic requirement associated with a student and an academic subject/context.

A backlog is not itself an examination attempt.

---

## 8.2 Open Backlog

**Definition:**  
A backlog that remains unresolved.

---

## 8.3 Resolved Backlog

**Definition:**  
A backlog whose underlying academic requirement has been successfully resolved according to authoritative processed academic data.

---

## 8.4 Backlog Lifecycle

The conceptual backlog lifecycle is:

```text
OPEN
  ↓
Subsequent Attempt
  ↓
PASS
  ↓
RESOLVED
```

A failed subsequent attempt may keep the backlog open.

---

## 8.5 Backlog Origin

**Definition:**  
The first authoritative result or academic event that caused the requirement to become unresolved.

---

## 8.6 Backlog Resolution Result

**Definition:**  
The authoritative result that demonstrates that an open backlog has been resolved.

---

# 9. Academic Metric Terms

## 9.1 SGPA

**Definition:**  
Semester Grade Point Average.

SGPA represents an academic performance metric for a defined semester.

The exact calculation must follow the applicable university or academic configuration.

Acadlytic must not invent a universal SGPA formula where the institutional rule is unknown.

---

## 9.2 CGPA

**Definition:**  
Cumulative Grade Point Average.

CGPA represents a cumulative academic performance metric across the applicable academic period.

The exact calculation must follow the applicable academic rules.

---

## 9.3 Percentage

**Definition:**  
A percentage-based representation of academic performance.

Percentage conversion must follow the applicable institutional or academic rule where such a rule is required.

---

## 9.4 Grade

**Definition:**  
An academic result classification associated with a student's performance in a subject or academic component.

The exact grade system depends on the applicable academic configuration.

---

## 9.5 Grade Point

**Definition:**  
A numerical value associated with an academic grade where the applicable grading system defines one.

---

## 9.6 Pass

**Definition:**  
An academic outcome indicating that the student has satisfied the applicable passing requirement for a result.

The exact pass rule must be defined by the applicable academic configuration.

---

## 9.7 Fail

**Definition:**  
An academic outcome indicating that the student has not satisfied the applicable passing requirement.

A failed result may contribute to an open backlog according to the applicable academic rules.

---

## 9.8 Missing Data

**Definition:**  
Information that is unavailable, absent, or not applicable.

Missing data must not automatically be interpreted as:

- zero
- fail
- no credits
- no attempt

---

# 10. Passport Terms

## 10.1 Passport View

**Definition:**  
A read-oriented representation of authoritative academic information assembled for display.

---

## 10.2 Passport Summary

**Definition:**  
A summarized representation of the student's academic Passport information.

It may include:

- current academic status
- SGPA/CGPA
- credits
- backlog summary
- overall academic information

---

## 10.3 Passport Read Model

**Definition:**  
A query-oriented representation optimized for retrieving Academic Passport information.

A read model must not become an independent academic source of truth.

---

# 11. Analytics Terms

## 11.1 Analytics

**Definition:**  
Derived information generated from authoritative academic data.

Analytics is a read/analysis layer.

---

## 11.2 KPI

**Definition:**  
Key Performance Indicator.

A KPI is a defined metric used to summarize an important academic or operational measurement.

---

## 11.3 Student Analytics

**Definition:**  
Academic analytics focused on an individual student's academic performance and progress.

---

## 11.4 Semester Analytics

**Definition:**  
Analytics describing academic performance within a specific semester.

---

## 11.5 Course Analytics

**Definition:**  
Analytics describing academic performance across students within a course/program.

---

## 11.6 Subject Analytics

**Definition:**  
Analytics describing performance and outcomes associated with a subject.

---

## 11.7 College Analytics

**Definition:**  
Analytics describing academic outcomes across the college tenant.

---

## 11.8 Pass Rate

**Definition:**  
A metric representing the proportion of relevant academic result records or students that satisfy the defined pass criteria.

The exact denominator and counting method must be explicitly defined before implementation.

---

## 11.9 Backlog Rate

**Definition:**  
A metric representing the proportion or count of students or academic requirements that meet the defined backlog criteria.

The denominator must be explicitly defined for each use case.

---

## 11.10 Double Counting

**Definition:**  
A calculation error in which the same student, subject, result, or attempt is counted more than once when the metric does not intend to count it multiple times.

Analytics must explicitly distinguish:

- unique students
- unique subjects
- attempts
- result records

---

# 12. API and Technical Terms

## 12.1 API

**Definition:**  
Application Programming Interface used by frontend, integrations, or other authorized clients to interact with Acadlytic backend capabilities.

---

## 12.2 REST API

**Definition:**  
The HTTP-based API style used for Acadlytic application endpoints.

The primary API namespace is:

```text
/api/v1
```

---

## 12.3 API Version

**Definition:**  
A versioned API namespace used to manage API compatibility.

Current planned version:

```text
v1
```

---

## 12.4 DTO

**Definition:**  
Data Transfer Object.

A DTO represents data exchanged across API or application boundaries.

Acadlytic should not expose JPA entities directly as API contracts.

---

## 12.5 Endpoint

**Definition:**  
A specific API operation exposed through a defined HTTP method and URL.

Example:

```text
GET /api/v1/me
```

---

## 12.6 `/me`

**Definition:**  
An API convention representing the currently authenticated user's authorized self-service context.

Examples include:

```text
GET /api/v1/me
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
```

---

## 12.7 IDOR

**Definition:**  
Insecure Direct Object Reference.

An authorization vulnerability in which a user can access an object belonging to another user or tenant by manipulating an identifier.

Acadlytic must protect all object-based endpoints against IDOR.

---

## 12.8 Tenant Context

**Definition:**  
The trusted tenant identity associated with the current authenticated request.

Tenant context must be derived from trusted server-side identity and authorization information rather than blindly accepting tenant identifiers from the client.

---

## 12.9 Pagination

**Definition:**  
A mechanism for retrieving large result sets in manageable pages rather than loading all records at once.

---

## 12.10 Filtering

**Definition:**  
Restricting returned records according to defined criteria.

---

## 12.11 Sorting

**Definition:**  
Ordering returned records according to an approved field and direction.

---

## 12.12 Idempotency

**Definition:**  
The property that repeating the same operation under the same intended request conditions does not unintentionally create duplicate or inconsistent state.

Idempotency is particularly important for result processing and retryable operations.

---

## 12.13 Transaction

**Definition:**  
A database operation boundary within which related changes are treated as one logical unit.

Academic processing must use appropriate transaction boundaries to preserve consistency.

---

## 12.14 Concurrency

**Definition:**  
The condition in which multiple operations may attempt to modify or process related data at the same time.

Acadlytic must protect critical academic operations from concurrent processing errors.

---

# 13. Architecture Terms

## 13.1 Modular Monolith

**Definition:**  
An application deployed as a single primary backend application while maintaining clear internal module boundaries.

Acadlytic uses a modular monolith for the initial architecture.

---

## 13.2 Module

**Definition:**  
A bounded area of application responsibility with defined ownership, dependencies, and interfaces.

Examples include:

- students
- results
- backlogs
- analytics

---

## 13.3 Domain

**Definition:**  
A business area with related concepts, rules, and operations.

---

## 13.4 Application Layer

**Definition:**  
The layer responsible for coordinating application use cases and business workflows.

---

## 13.5 Domain Layer

**Definition:**  
The layer containing domain concepts and business rules.

---

## 13.6 Repository

**Definition:**  
An abstraction responsible for persistence and retrieval of application data.

---

## 13.7 Read-Oriented Layer

**Definition:**  
A layer primarily responsible for retrieving and presenting information rather than owning authoritative mutations.

Academic Passport and Analytics are examples.

---

## 13.8 Source of Truth

**Definition:**  
The authoritative location or domain responsible for maintaining the correct state of a particular business concept.

A source of truth must have clear ownership.

---

## 13.9 Derived Data

**Definition:**  
Information calculated, summarized, projected, or assembled from authoritative data.

Examples include:

- analytics
- KPI values
- Passport summaries
- charts
- dashboard metrics

---

# 14. File and Import Terms

## 14.1 File Upload

**Definition:**  
The process of transferring a result file into Acadlytic.

File uploads must be subject to security and validation controls.

---

## 14.2 File Validation

**Definition:**  
Checking an uploaded file for requirements such as:

- supported type
- file size
- readability
- structural validity
- security constraints

---

## 14.3 Column Mapping

**Definition:**  
The association between external result-file columns and Acadlytic's normalized result fields.

---

## 14.4 Parsing

**Definition:**  
The process of reading the structure and values contained in an uploaded file.

---

## 14.5 Import Job

**Definition:**  
A tracked processing operation associated with importing a result file.

An import job may have states such as:

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

## 14.6 Import Record

**Definition:**  
An individual normalized result record associated with a result import job.

---

## 14.7 Import Error

**Definition:**  
An issue encountered during file ingestion, parsing, normalization, matching, or validation.

---

## 14.8 Import Warning

**Definition:**  
A condition identified during import or validation that requires attention but may not necessarily prevent processing.

---

# 15. Security Terms

## 15.1 Security Boundary

**Definition:**  
A point at which access, identity, permissions, or trust must be explicitly enforced.

Examples include:

- API endpoints
- tenant boundaries
- file uploads
- database operations
- academic mutations

---

## 15.2 Role-Based Access Control

**Definition:**  
An authorization model in which permissions are associated with roles and users are granted access according to their roles.

---

## 15.3 Access Control

**Definition:**  
The mechanisms used to determine whether an identity is allowed to perform an action or access information.

---

## 15.4 Audit Event

**Definition:**  
A recorded event representing an important security, administrative, or academic operation.

Examples may include:

- user provisioning
- college creation
- result processing
- account status changes
- sensitive academic operations

---

## 15.5 Security Event

**Definition:**  
An event relevant to authentication, authorization, account security, or other security-sensitive activity.

---

## 15.6 Cross-Tenant Access

**Definition:**  
Unauthorized access by one tenant to data belonging to another tenant.

Cross-tenant access is a critical security defect.

---

# 16. Development and Quality Terms

## 16.1 MVP

**Definition:**  
Minimum Viable Product.

The smallest planned version of Acadlytic that provides the core academic workflow and establishes the foundation for future product development.

---

## 16.2 Feature

**Definition:**  
A user-facing or system capability that provides defined product value.

---

## 16.3 Feature Specification

**Definition:**  
A detailed document defining the requirements, behavior, boundaries, APIs, security, testing, and acceptance criteria for a feature.

---

## 16.4 Implementation Note

**Definition:**  
A development-oriented document describing how an approved feature or system capability should be implemented.

---

## 16.5 Epic

**Definition:**  
A large body of related work that represents a significant product or technical capability.

---

## 16.6 Task

**Definition:**  
A specific actionable development or project-management unit derived from an epic or implementation requirement.

---

## 16.7 Acceptance Criteria

**Definition:**  
Specific conditions that must be satisfied for a feature or task to be considered acceptable.

---

## 16.8 Definition of Done

**Definition:**  
The agreed conditions required before work can be considered complete.

The project's Definition of Done may include:

- implementation
- testing
- security review
- code review
- documentation
- QA
- deployment verification

---

## 16.9 Regression

**Definition:**  
A defect in previously working functionality caused by a change elsewhere in the system.

---

## 16.10 Bug

**Definition:**  
A confirmed deviation between expected behavior and actual behavior.

A bug may be:

- functional
- security-related
- academic-data related
- performance-related
- accessibility-related
- integration-related

---

## 16.11 Severity

**Definition:**  
The impact level of a defect.

The project uses:

- `S1` Critical
- `S2` High
- `S3` Medium
- `S4` Low

---

## 16.12 Priority

**Definition:**  
The urgency with which a defect or task should be addressed.

The project uses:

- `P0` Immediate
- `P1` Release Blocking
- `P2` High
- `P3` Normal
- `P4` Low

Severity and priority are different concepts.

---

# 17. Environment Terms

## 17.1 Development Environment

**Definition:**  
The environment used for active development and local testing.

---

## 17.2 Preview Environment

**Definition:**  
A deployed environment used to verify a release candidate before production.

---

## 17.3 Production Environment

**Definition:**  
The live environment used by real users and real operational data.

---

## 17.4 Release Candidate

**Definition:**  
A specific build considered sufficiently complete and stable for final QA and release verification.

---

## 17.5 Deployment

**Definition:**  
The process of delivering a specific application version and its required configuration to an environment.

---

## 17.6 Rollback

**Definition:**  
The controlled process of reverting an application deployment to a previous known version.

Database rollback must be treated separately because database changes may be irreversible.

---

# 18. Monitoring and Operations Terms

## 18.1 Monitoring

**Definition:**  
The collection and analysis of system signals used to determine whether Acadlytic is operating correctly.

---

## 18.2 Observability

**Definition:**  
The ability to understand the internal state and behavior of the system through appropriate logs, metrics, traces, events, and other evidence.

---

## 18.3 Correlation ID

**Definition:**  
An identifier used to associate related logs and operations belonging to the same request or workflow.

---

## 18.4 Background Job

**Definition:**  
A task executed outside the immediate request-response cycle.

Potential examples include:

- large result-file processing
- asynchronous validation
- result processing
- scheduled synchronization
- notification delivery

---

## 18.5 Incident

**Definition:**  
An event that causes or threatens significant impact to application availability, security, tenant isolation, academic data integrity, or critical functionality.

---

## 18.6 Academic Data Incident

**Definition:**  
An incident involving incorrect, corrupted, lost, duplicated, unauthorized, or otherwise compromised academic data.

Academic data incidents require special handling because restoring application availability alone may not resolve the underlying problem.

---

# 19. Future Product Terms

## 19.1 University Integration

**Definition:**  
An authorized technical connection between Acadlytic and a university system or approved academic data source.

---

## 19.2 University Connector

**Definition:**  
A software component responsible for communicating with a specific authorized university data source.

---

## 19.3 Connector Registry

**Definition:**  
A mechanism for registering and selecting supported university integration connectors.

---

## 19.4 Regulation

**Definition:**  
A defined academic rule set associated with a university, program, or academic period.

---

## 19.5 Regulation Version

**Definition:**  
A specific version of an academic regulation set.

Versioning is important because academic requirements can change over time.

---

## 19.6 Regulation & Credit Eligibility Engine

**Definition:**  
A future subsystem intended to evaluate academic eligibility and completion requirements using explicitly defined academic regulations.

This is outside the MVP.

---

## 19.7 Academic What-If Simulator

**Definition:**  
A future capability that allows users to explore hypothetical academic scenarios without modifying authoritative academic records.

---

## 19.8 Academic Risk Intelligence

**Definition:**  
A future capability for identifying academic patterns that may require attention.

Risk indicators must be explainable and based on trustworthy data.

---

## 19.9 AI Academic Query

**Definition:**  
A future AI-assisted capability allowing authorized users to ask natural-language questions about academic information.

AI responses must be grounded in authorized system data and must not become the source of academic truth.

---

## 19.10 SaaS

**Definition:**  
Software as a Service.

A future commercial model in which Acadlytic may be offered as a subscription-based platform.

---

## 19.11 Multi-Campus

**Definition:**  
A future organizational model in which a higher-level organization may manage multiple college or campus tenants.

---

# 20. Important Distinctions

The following concepts must not be treated as interchangeable.

| Term A | Term B | Distinction |
|---|---|---|
| Authentication | Authorization | Identity verification vs permission |
| User | Student | Application identity vs academic identity |
| Student | Student Account | Academic record vs login identity |
| Result Import | Result Processing | Ingestion vs authoritative mutation |
| Validation | Processing | Checking data vs committing authoritative data |
| Attempt | Backlog | Historical examination event vs unresolved requirement |
| Academic Record | Academic Passport | Source data vs read-oriented representation |
| Academic Record | Analytics | Authoritative data vs derived information |
| Raw Data | Normalized Data | External representation vs internal representation |
| Valid | Processed | Validation outcome vs authoritative processing outcome |
| Student Name | Student Identifier | Display identity vs reliable academic matching identity |
| Subject Name | Subject Code | Human-readable label vs institutional identifier |
| Severity | Priority | Impact vs urgency |
| Bug | Feature Request | Incorrect behavior vs requested new behavior |
| Tenant | User | Organization boundary vs individual identity |
| College | University | Institution using platform vs academic authority |
| Actual Result | What-If Result | Authoritative academic fact vs hypothetical scenario |
| AI Output | Academic Truth | Generated interpretation vs authoritative system data |

---

# 21. Terminology Rules

The following terminology rules apply to future documentation and implementation.

### Rule 1

Use **Result Import** for the ingestion workflow.

Do not use "result processing" to describe simple file upload.

### Rule 2

Use **Result Validation** for validation activities.

Do not treat validation as successful processing.

### Rule 3

Use **Result Processing** for the authoritative academic mutation workflow.

### Rule 4

Use **Attempt** for a historical examination/result event.

### Rule 5

Use **Backlog** for an unresolved academic requirement.

### Rule 6

Use **Academic Passport** for the read-oriented longitudinal academic representation.

### Rule 7

Use **Analytics** for derived academic information.

### Rule 8

Use **Student Identifier** or the approved institutional identifier for result matching.

Do not describe student name matching as the primary identity mechanism.

### Rule 9

Use **College** as the MVP tenant boundary unless the architecture explicitly introduces a higher-level organizational model.

### Rule 10

Use **Authoritative Academic Data** when referring to processed academic information that serves as the trusted source for downstream capabilities.

---

# 22. Status Vocabulary

Acadlytic documentation uses the following general status lifecycle:

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

Individual features, jobs, records, and incidents may use their own domain-specific status values.

Those status values must not be assumed to be interchangeable.

---

# 23. Academic Data Lifecycle Vocabulary

The standard academic data lifecycle is:

```text
External Result
      ↓
Imported
      ↓
Normalized
      ↓
Validated
      ↓
Processed
      ↓
Authoritative
      ↓
Derived
```

The terms should be used consistently across:

- product documentation
- API documentation
- database design
- backend code
- frontend UI
- testing
- monitoring
- audit logs

---

# 24. Core Domain Vocabulary

The most important Acadlytic domain concepts are:

```text
University
College
Tenant
User
Student
Course / Program
Semester
Subject
Result
Attempt
Backlog
Academic Record
Academic Passport
Analytics
```

These concepts form the foundation of the product domain.

---

# 25. Glossary Maintenance

This glossary should be updated when:

- a new core domain concept is introduced
- an existing concept changes meaning
- terminology becomes ambiguous
- a product decision establishes a new standard term
- an API or database concept requires standardized naming
- a future capability introduces important new terminology

Terminology should not be changed casually once it is used across APIs, database schemas, documentation, and source code.

A terminology change should be reviewed for its impact on:

- product documentation
- architecture
- API contracts
- database naming
- frontend labels
- backend classes
- tests
- audit logs
- monitoring
- external integrations

---

# 26. Definition of Done

This glossary is ready for approval when:

- core Acadlytic terminology is defined
- academic terms are clearly distinguished
- technical terms are clearly distinguished
- security terminology is defined
- result lifecycle terminology is consistent
- backlog and attempt terminology is consistent
- Passport and Analytics terminology is consistent
- tenant terminology is clear
- future product terminology is clearly marked as future
- terminology matches the project overview and vision
- no conflicting definitions remain
- unresolved terminology decisions are explicitly identified

---

# 27. Final Principle

> **Consistent terminology is part of system correctness. When the same academic concept is given different meanings across product, API, database, frontend, and backend documentation, implementation errors become more likely. Acadlytic should therefore maintain one shared vocabulary for its academic domain and technical boundaries.**

--- 