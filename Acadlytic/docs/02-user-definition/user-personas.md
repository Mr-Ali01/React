# Acadlytic — User Journeys

**Document:** `02-user-definition/user-journeys.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** User Journeys  
**Last Updated:** 2026-10-05

---

# 1. Purpose

This document defines the major user journeys within Acadlytic.

A user journey describes the sequence of activities a user performs to accomplish a meaningful goal.

The purpose is to define:

- how users enter the system
- what they need to accomplish
- what steps they perform
- what information they need
- what decisions they make
- what system responses are expected
- where errors or exceptions can occur
- what successful completion looks like

These journeys should guide:

- UX design
- navigation
- feature specifications
- API design
- authorization
- testing
- acceptance criteria

---

# 2. Journey Model

The primary Acadlytic journey can be represented as:

```text
University Result
      ↓
Result Import
      ↓
Validation
      ↓
Review
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

Different users interact with different stages of this lifecycle.

---

# 3. Core User Journeys

The MVP includes the following major journeys:

1. Platform administrator onboarding a college
2. College administrator configuring a college
3. College administrator creating academic users
4. Academic staff managing students
5. Academic staff importing university results
6. Academic staff resolving validation issues
7. Academic staff processing validated results
8. Academic staff reviewing academic records
9. Academic staff managing backlog information
10. College administrator reviewing analytics
11. Student accessing academic information
12. Student reviewing Academic Passport
13. Student reviewing backlog status
14. Student reviewing academic performance

---

# 4. Journey 1 — Platform Administrator Onboards a College

## Actor

`SUPER_ADMIN`

## Goal

Create and configure a new college tenant and provision its initial administrator.

---

## 4.1 Preconditions

- SUPER_ADMIN is authenticated.
- SUPER_ADMIN has platform-level authorization.
- The college does not already exist.

---

## 4.2 Journey

```text
Login
  ↓
Open Colleges
  ↓
Create College
  ↓
Enter College Information
  ↓
Validate College Information
  ↓
Create College Tenant
  ↓
Create College Administrator
  ↓
Activate Tenant
  ↓
Confirm Completion
```

---

## 4.3 Required Information

Potential information includes:

- college name
- college code
- university association
- contact information
- tenant status
- initial administrator information

The exact fields should be defined in the college-management feature specification.

---

## 4.4 Success

The college is created with:

- unique tenant identity
- correct configuration
- initial administrator
- appropriate tenant status

---

## 4.5 Failure Scenarios

Potential failures include:

- duplicate college code
- invalid college information
- invalid administrator information
- incomplete required data
- database failure

The system should not create partially configured tenant data.

---

# 5. Journey 2 — College Administrator Configures the College

## Actor

`COLLEGE_ADMIN`

## Goal

Prepare the college tenant for academic operations.

---

## 5.1 Journey

```text
Login
  ↓
Open College Settings
  ↓
Review College Information
  ↓
Configure Academic Structure
  ↓
Configure Programs
  ↓
Configure Semesters
  ↓
Configure Subjects
  ↓
Review Configuration
  ↓
Begin Academic Operations
```

---

## 5.2 Expected Result

The college has the academic context required to:

- create students
- import results
- validate results
- process results
- generate academic information

---

## 5.3 Failure Scenarios

- incomplete academic structure
- duplicate subject codes
- invalid semester configuration
- incorrect academic context
- unauthorized configuration attempt

---

# 6. Journey 3 — College Administrator Creates Academic Users

## Actor

`COLLEGE_ADMIN`

## Goal

Provision staff members who will operate Acadlytic.

---

## 6.1 Journey

```text
Open Users
    ↓
Create User
    ↓
Select Role
    ↓
Enter User Information
    ↓
Validate Information
    ↓
Create Account
    ↓
Send/Provide Access
    ↓
User Activates Account
```

---

## 6.2 Supported Roles

The primary college-level roles are:

- `ACADEMIC_STAFF`
- `STUDENT`

The exact provisioning permissions must follow the authorization rules.

---

## 6.3 Security Requirements

The workflow must:

- enforce tenant ownership
- validate email/account information
- prevent unauthorized role assignment
- record important administrative events
- avoid exposing passwords

---

# 7. Journey 4 — Academic Staff Manages Students

## Actor

`ACADEMIC_STAFF`

## Goal

Maintain student records required for academic operations.

---

## 7.1 Journey

```text
Open Students
    ↓
Search / Browse Students
    ↓
Create or Select Student
    ↓
Enter Academic Information
    ↓
Validate Information
    ↓
Save Student
    ↓
Review Student Record
```

---

## 7.2 Student Information

Depending on the product configuration, information may include:

- official student identifier
- student name
- program
- academic context
- semester
- status

---

## 7.3 Success

The student becomes available for:

- result matching
- academic record management
- backlog tracking
- Academic Passport generation
- student portal access

---

# 8. Journey 5 — Academic Staff Imports University Results

## Actor

`ACADEMIC_STAFF`

## Goal

Import a university result file into Acadlytic.

This is one of the core MVP journeys.

---

## 8.1 Preconditions

- Academic staff is authenticated.
- User has permission to import results.
- College academic structure exists.
- Result file is available.

---

## 8.2 Journey

```text
Open Results
      ↓
Start Import
      ↓
Select Excel / CSV File
      ↓
Upload File
      ↓
Create Import Record
      ↓
Parse File
      ↓
Normalize Records
      ↓
Validate Records
      ↓
Show Validation Summary
```

---

## 8.3 Import States

The import may move through states such as:

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

Possible terminal or exceptional states include:

- `COMPLETED_WITH_ERRORS`
- `FAILED`
- `CANCELLED`

---

## 8.4 Success

The result file is successfully ingested and the academic staff member receives a clear validation summary.

---

# 9. Journey 6 — Academic Staff Resolves Validation Issues

## Actor

`ACADEMIC_STAFF`

## Goal

Review records that cannot safely proceed to authoritative processing.

---

## 9.1 Journey

```text
Open Import
      ↓
View Validation Summary
      ↓
Review Invalid / Warning Records
      ↓
Identify Problem
      ↓
Resolve Student Match
OR
Resolve Subject Match
OR
Correct Source Data
      ↓
Revalidate
      ↓
Review Updated Status
```

---

## 9.2 Possible Issues

Examples include:

- required field missing
- unknown student
- unknown subject
- invalid academic context
- invalid result value
- duplicate record
- unsupported attempt information

---

## 9.3 Important Rule

Validation must not directly mutate authoritative academic records.

The workflow remains:

```text
Import
  ↓
Validate
  ↓
Review
  ↓
Process
```

---

# 10. Journey 7 — Academic Staff Processes Validated Results

## Actor

`ACADEMIC_STAFF`

## Goal

Convert validated result records into authoritative academic records.

---

## 10.1 Preconditions

- Result import has completed validation.
- Records eligible for processing are identified.
- User has processing permission.

---

## 10.2 Journey

```text
Open Validated Import
       ↓
Review Summary
       ↓
Confirm Processing
       ↓
Start Processing
       ↓
Create / Update Academic Records
       ↓
Preserve Attempt History
       ↓
Update Backlog State
       ↓
Update Derived Academic Data
       ↓
Record Audit Information
       ↓
Complete Processing
```

---

## 10.3 Important Boundary

Result processing is the authoritative mutation boundary.

Before processing:

```text
Imported Data
```

After processing:

```text
Authoritative Academic Data
```

---

## 10.4 Processing Requirements

Processing should support:

- transactional behavior
- idempotency
- historical preservation
- duplicate protection
- attempt tracking
- backlog updates
- auditability

---

# 11. Journey 8 — Academic Staff Reviews Academic Records

## Actor

`ACADEMIC_STAFF`

## Goal

View a student's academic history.

---

## 11.1 Journey

```text
Open Students
      ↓
Search Student
      ↓
Open Student Profile
      ↓
Open Academic Record
      ↓
View Semester History
      ↓
View Subject Results
      ↓
View Attempts
      ↓
View SGPA / CGPA
      ↓
View Backlog Status
```

---

## 11.2 Expected Information

The academic record may contain:

- student identity
- academic program
- semester
- subject results
- attempts
- grades
- grade points
- credits
- SGPA
- CGPA
- backlog status

Academic calculations must follow approved academic configuration.

---

# 12. Journey 9 — Academic Staff Manages Backlogs

## Actor

`ACADEMIC_STAFF`

## Goal

Monitor and understand unresolved academic requirements.

---

## 12.1 Journey

```text
Open Backlogs
      ↓
Filter Students
      ↓
Identify Open Backlogs
      ↓
Open Student
      ↓
Review Subject
      ↓
Review Attempt History
      ↓
Monitor Subsequent Result
      ↓
Backlog Remains Open
OR
Backlog Becomes Resolved
```

---

## 12.2 Backlog Lifecycle

```text
Failed Attempt
      ↓
OPEN BACKLOG
      ↓
Subsequent Attempt
      ↓
┌─────┴─────┐
↓           ↓
Fail        Pass
↓           ↓
OPEN       RESOLVED
```

---

## 12.3 Important Distinction

A failed attempt should not be deleted when a later attempt succeeds.

The history should remain available.

---

# 13. Journey 10 — College Administrator Reviews Analytics

## Actor

`COLLEGE_ADMIN`

## Goal

Understand academic performance across the college.

---

## 13.1 Journey

```text
Login
  ↓
Open Analytics
  ↓
Select Scope
  ↓
Select Course / Program / Semester
  ↓
View KPIs
  ↓
Review Trends
  ↓
Identify Areas Requiring Attention
  ↓
Review Supporting Records
```

---

## 13.2 Possible Metrics

Depending on validated requirements:

- student count
- pass rate
- fail rate
- backlog rate
- average SGPA
- average CGPA
- credit completion
- subject performance
- semester performance

---

## 13.3 Important Analytics Rule

Analytics should be derived from authoritative processed data.

```text
Processed Academic Data
        ↓
Derived Metrics
        ↓
Analytics
```

Analytics should not become an independently maintained source of truth.

---

# 14. Journey 11 — Student Accesses Academic Information

## Actor

`STUDENT`

## Goal

Access personal academic information.

---

## 14.1 Journey

```text
Open Login
      ↓
Authenticate
      ↓
Student Dashboard
      ↓
View Academic Summary
      ↓
View Results
      ↓
View Backlogs
      ↓
View Academic Passport
```

---

## 14.2 Access Boundary

A student must only receive information that belongs to that student and is authorized for student self-service.

---

# 15. Journey 12 — Student Reviews Academic Passport

## Actor

`STUDENT`

## Goal

Understand the complete academic journey in one place.

---

## 15.1 Journey

```text
Dashboard
    ↓
Academic Passport
    ↓
Student Profile
    ↓
Academic Program
    ↓
Semester History
    ↓
Subject Results
    ↓
Attempts
    ↓
SGPA / CGPA
    ↓
Credits
    ↓
Backlogs
```

---

## 15.2 Passport Principle

The Academic Passport is a read-oriented representation of authoritative academic data.

It should not become a separate source of truth.

---

# 16. Journey 13 — Student Reviews Backlog Status

## Actor

`STUDENT`

## Goal

Understand which academic requirements remain unresolved.

---

## 16.1 Journey

```text
Dashboard
   ↓
Backlogs
   ↓
View Open Backlogs
   ↓
Select Subject
   ↓
View Attempt History
   ↓
Understand Current Status
```

---

## 16.2 Student View

The student should be able to distinguish:

- open backlog
- resolved backlog
- previous attempts
- latest result

The interface should use clear academic terminology.

---

# 17. Journey 14 — Student Reviews Academic Performance

## Actor

`STUDENT`

## Goal

Understand academic progress over time.

---

## 17.1 Journey

```text
Dashboard
   ↓
Analytics
   ↓
Select Academic Period
   ↓
View SGPA / CGPA
   ↓
View Semester Trends
   ↓
Review Credits
   ↓
Review Subject Performance
```

---

## 17.2 Important Rule

The system should display calculated academic metrics only when the underlying academic data is sufficient and the calculation follows the configured academic rules.

Missing data must not automatically be interpreted as zero.

---

# 18. Exception Journey — Unknown Student

## Actor

`ACADEMIC_STAFF`

## Scenario

A university result contains a student identifier that cannot be matched.

---

## Journey

```text
Result Import
      ↓
Validation
      ↓
Student Not Found
      ↓
Record Marked Unresolved
      ↓
Staff Reviews Record
      ↓
Staff Resolves Match
      ↓
Revalidate
      ↓
Eligible for Processing
```

---

## Important Rule

The system should not silently create a student merely because the identifier is unknown.

---

# 19. Exception Journey — Unknown Subject

## Actor

`ACADEMIC_STAFF`

## Scenario

A result contains a subject code that is not recognized.

---

## Journey

```text
Validation
     ↓
Unknown Subject
     ↓
Record Marked Unresolved
     ↓
Staff Reviews Subject
     ↓
Mapping / Configuration Updated
     ↓
Revalidate
     ↓
Eligible for Processing
```

The system should not silently assign an arbitrary subject.

---

# 20. Exception Journey — Duplicate Result

## Scenario

A result record appears to have already been processed.

---

## Journey

```text
Import
  ↓
Duplicate Detection
  ↓
Potential Duplicate
  ↓
Review Existing Record
  ↓
Determine Duplicate / Legitimate Attempt
  ↓
Allow or Block Processing
```

A duplicate check should consider the configured result identity and attempt semantics.

---

# 21. Exception Journey — Processing Failure

## Scenario

An error occurs during authoritative processing.

---

## Expected Behavior

```text
Processing
    ↓
Error
    ↓
Transaction Handling
    ↓
Rollback / Safe Recovery
    ↓
Record Failure
    ↓
Audit Event
    ↓
Staff Notification
```

The system must avoid leaving partially processed academic data.

---

# 22. Exception Journey — Student Login

## Scenario

A student attempts to authenticate.

### Successful

```text
Credentials
    ↓
Authentication
    ↓
Authorization
    ↓
Student Context
    ↓
Dashboard
```

### Failed

```text
Credentials
    ↓
Authentication Failure
    ↓
Safe Error Message
```

The system should not reveal unnecessary information about account existence.

---

# 23. Cross-Tenant Access Journey

## Scenario

A user from College A attempts to access College B data.

```text
Request
  ↓
Authentication
  ↓
Tenant Context
  ↓
Authorization
  ↓
Tenant Mismatch
  ↓
Access Denied
```

This must be enforced server-side.

Client-side hiding is not sufficient.

---

# 24. Journey Relationship

The major journeys are connected.

```text id="a8h7wz"
College Setup
      ↓
Academic Setup
      ↓
Student Setup
      ↓
Result Import
      ↓
Validation
      ↓
Processing
      ↓
Academic Records
      ↓
Backlogs
      ↓
Academic Passport
      ↓
Analytics
      ↓
Student Portal
```

This represents the core Acadlytic lifecycle.

---

# 25. Journey-to-Feature Mapping

| Journey | Primary Feature |
|---|---|
| College Onboarding | College Management |
| College Configuration | Academic Structure |
| User Provisioning | Authentication / User Management |
| Student Management | Student Management |
| Result Import | Result Import |
| Validation | Result Validation |
| Processing | Result Processing |
| Academic History | Academic Records |
| Backlog Monitoring | Backlog Tracking |
| Passport Review | Academic Passport |
| Institutional Analytics | Analytics |
| Student Self-Service | Student Portal |

---

# 26. Journey Dependencies

Several journeys depend on earlier workflows.

For example:

```text
Academic Passport
       ↑
Academic Records
       ↑
Result Processing
       ↑
Result Validation
       ↑
Result Import
```

Therefore, a failure in an upstream workflow can affect downstream features.

---

# 27. Journey Success Criteria

The core result-processing journey should be considered successful when:

- the file is accepted
- records are parsed correctly
- validation identifies problematic records
- staff can resolve valid issues
- only eligible records are processed
- academic history is preserved
- backlog state is updated correctly
- derived academic information is updated
- audit information is recorded

---

# 28. UX Principles for Journeys

## Principle 1 — Show Progress

Long workflows should clearly communicate their current state.

Example:

```text
Upload → Parse → Validate → Review → Process
```

---

## Principle 2 — Make Errors Actionable

Do not only say:

> Validation failed.

Prefer:

> 12 records could not be matched to existing students.

The user should understand what needs attention.

---

## Principle 3 — Preserve Context

When a user opens an error, the system should provide enough information to understand the record.

---

## Principle 4 — Prevent Unsafe Actions

Processing should require appropriate permissions and confirmation.

---

## Principle 5 — Preserve History

Historical academic information should remain accessible.

---

## Principle 6 — Keep Student Experience Simple

Students should not be exposed to internal result-processing workflows.

---

# 29. Journey State Model

Long-running workflows should expose meaningful states.

Example:

```text id="0fqu8c"
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

Exceptional states:

```text
FAILED
COMPLETED_WITH_ERRORS
CANCELLED
```

---

# 30. Journey Data Boundaries

Each stage should have a clear data responsibility.

| Stage | Responsibility |
|---|---|
| Import | Ingest external data |
| Validation | Determine whether data is eligible |
| Review | Resolve supported issues |
| Processing | Mutate authoritative records |
| Backlog | Maintain unresolved academic requirements |
| Passport | Present academic history |
| Analytics | Derive insights |
| Portal | Present authorized information |

This separation reduces ambiguity between modules.

---

# 31. Journey Security Boundaries

Every journey should respect:

- authentication
- authorization
- tenant isolation
- resource ownership
- role permissions
- audit requirements

The security model applies to both UI actions and API requests.

---

# 32. Journey Testing Requirements

Each journey should eventually have:

### Happy Path Tests

The expected successful workflow.

### Validation Tests

Invalid input and data-quality scenarios.

### Authorization Tests

Unauthorized actions.

### Tenant Isolation Tests

Cross-tenant access attempts.

### Failure Recovery Tests

Database, processing, and integration failures.

### Regression Tests

Previously fixed workflow failures.

---

# 33. Journey Documentation Template

Future journeys should use:

```text
Journey Name
Actor
Goal
Scope
Preconditions
Trigger
Main Flow
Alternative Flows
Exception Flows
Required Data
Expected System Response
Success Criteria
Security Requirements
Audit Requirements
Postconditions
```

This keeps journey documentation consistent.

---

# 34. Definition of Done

This document is ready for approval when:

- all major MVP journeys are documented
- primary actors are identified
- goals are defined
- preconditions are defined
- main flows are documented
- important exception flows are documented
- tenant boundaries are addressed
- security requirements are addressed
- result-processing lifecycle is represented
- student self-service journeys are represented
- journey-to-feature mapping is complete
- testing implications are identified

---

# 35. Final Principle

> **Acadlytic should make the user's complete academic workflow understandable, controlled, and traceable—from receiving university results to producing trustworthy academic records, backlog information, Academic Passports, and analytics.**

Every important journey should have a clear starting point, controlled transitions, meaningful feedback, explicit authorization, safe failure handling, and a measurable successful outcome.