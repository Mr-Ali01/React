# Backlog Tracking

**Project:** Acadlytic  
**Module:** Backlog Tracking  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

# 1. Purpose

The Backlog Tracking module manages the complete lifecycle of a student's failed or pending academic subjects.

It provides Acadlytic with a centralized record of:

- active backlogs
- cleared backlogs
- backlog attempts
- failed attempts
- supplementary attempts
- backlog creation
- backlog clearance
- backlog history
- current backlog status
- backlog counts
- backlog-related academic information

The module must preserve historical attempts rather than replacing previous results.

---

# 2. Scope

## 2.1 MVP Scope

The MVP includes:

- backlog creation
- backlog identification
- backlog status management
- backlog attempt tracking
- backlog clearance
- supplementary result integration
- failed result integration
- backlog history
- active backlog listing
- cleared backlog listing
- student-level backlog summary
- college-level backlog summary where required
- result-processing integration
- Academic Passport integration
- authorization
- tenant isolation
- audit events
- protected APIs
- validation
- duplicate protection

---

# 2.2 Out of Scope

The following are outside the MVP:

- automatic university result monitoring
- university API integration
- predictive backlog risk
- AI backlog recommendations
- automatic exam registration
- supplementary exam fee management
- exam timetable management
- hall-ticket generation
- university-specific eligibility engine
- graduation eligibility engine
- academic what-if simulation
- student notifications unless separately implemented
- payment processing

---

# 3. Actors

| Actor | Responsibility |
|---|---|
| SUPER_ADMIN | Platform-level oversight |
| COLLEGE_ADMIN | Manage backlog information for their college |
| ACADEMIC_STAFF | Manage/review backlog records according to permissions |
| STUDENT | View their own backlog information |
| Public Visitor | No access |

---

# 4. Core Concepts

## 4.1 Backlog

A backlog represents an academic subject that the student has not successfully cleared according to the applicable result rules.

---

## 4.2 Active Backlog

An active backlog is a subject that currently remains uncleared.

Example:

```text
Subject: CS301
Result: FAIL
Backlog: ACTIVE
```

---

## 4.3 Cleared Backlog

A backlog becomes cleared when the student successfully satisfies the applicable passing requirement for that subject.

Example:

```text
Subject: CS301

Attempt 1 → FAIL
Attempt 2 → PASS

Backlog → CLEARED
```

---

## 4.4 Backlog Attempt

A backlog attempt represents an examination/result attempt associated with the subject.

Example:

```text
Attempt 1 → FAIL
Attempt 2 → FAIL
Attempt 3 → PASS
```

All relevant attempts should remain available as historical information.

---

# 5. Backlog Lifecycle

The basic lifecycle is:

```text id="q7m3x8"
Result
   ↓
FAIL
   ↓
Backlog Created
   ↓
ACTIVE
   ↓
New Attempt
   ↓
FAIL / PASS
   ↓
ACTIVE / CLEARED
```

---

# 6. Backlog Creation

A backlog is normally created when Result Processing determines that a subject result represents a failure according to the applicable academic rules.

Example:

```text id="x5v8c2"
Validated Result
      ↓
Result Processing
      ↓
FAIL
      ↓
Backlog Created
```

Backlog creation must not occur directly from an unvalidated import row.

---

# 7. Backlog Creation Rules

When a failed result is processed:

1. Identify the student.
2. Identify the subject.
3. Identify the academic context.
4. Identify the result attempt.
5. Check whether an active backlog already exists.
6. Create or update the appropriate backlog record.
7. Preserve the result attempt.
8. Record the source result.

---

# 8. Duplicate Backlog Protection

The system must not create duplicate active backlog records for the same academic subject context.

For example, repeatedly processing the same failed result must not produce:

```text
CS301 → ACTIVE
CS301 → ACTIVE
CS301 → ACTIVE
```

Instead, the existing backlog must be identified.

---

# 9. Backlog Identity

A backlog should be associated with the student's subject and academic history.

Conceptually:

```text id="m4q8x2"
Student
+
Subject
+
Academic Context
```

The exact identity and uniqueness constraints must be finalized in Database Architecture.

---

# 10. Backlog Status

The MVP should support at least:

```text id="v3n7c5"
ACTIVE
CLEARED
```

Additional statuses may be introduced later if required by academic rules.

---

# 11. Active Backlog

An active backlog means:

```text id="x8m2q6"
Student has not yet cleared the subject.
```

An active backlog should appear in:

- student academic record
- Academic Passport
- backlog dashboard
- relevant analytics

---

# 12. Cleared Backlog

A backlog becomes cleared when a valid result indicates that the student has successfully passed the subject.

Example:

```text id="q5c8v3"
Previous:
FAIL → ACTIVE

New:
PASS → CLEARED
```

The original failed attempt must remain in history.

---

# 13. Backlog Clearance

Clearance should normally happen through Result Processing.

Flow:

```text id="m7x3q8"
New Result
   ↓
Validation
   ↓
Processing
   ↓
PASS
   ↓
Find Active Backlog
   ↓
Mark CLEARED
```

The Backlog module should not independently invent whether a result is a pass.

---

# 14. Backlog Attempt History

Each relevant result attempt must be traceable.

Example:

```text id="v8q2m5"
Subject: Database Management

Attempt 1
Result: FAIL

Attempt 2
Result: FAIL

Attempt 3
Result: PASS
```

The backlog record should expose this history without deleting previous attempts.

---

# 15. Supplementary Results

Supplementary results are commonly associated with clearing existing failed subjects.

When a supplementary result is processed:

```text id="x4m8c2"
Supplementary Result
       ↓
Subject
       ↓
Existing Backlog
       ↓
PASS?
    ↙     ↘
  YES      NO
   ↓        ↓
CLEARED   ACTIVE
```

The exact result classification must follow the configured university/result rules.

---

# 16. Multiple Failed Attempts

A student may fail the same subject multiple times.

Example:

```text id="q6v3n8"
Attempt 1 → FAIL
Attempt 2 → FAIL
Attempt 3 → FAIL
```

The system must maintain:

```text
One logical backlog
+
Multiple attempts
```

It should not create an unrelated backlog entity for every failed attempt unless the academic model explicitly requires that behavior.

---

# 17. Pass After Failure

Example:

```text id="m5x8c3"
Semester 2:
CS301 → FAIL

Backlog:
CS301 → ACTIVE

Later:
CS301 → PASS

Backlog:
CS301 → CLEARED
```

The historical failure must remain visible.

---

# 18. Backlog Reopening

If an official correction changes a previously passing result to a failing result, the system may need to reopen the backlog.

Example:

```text id="v7q2m4"
Original:
PASS

Corrected Official Result:
FAIL

Backlog:
CLEARED → ACTIVE
```

This must only occur through a controlled correction/reprocessing workflow.

---

# 19. Backlog History

The system should preserve:

- original failed result
- attempt number
- examination/result context
- subsequent attempts
- clearance result
- clearance date/source
- correction history where applicable

---

# 20. Current Backlog State

The system must distinguish historical attempts from current state.

Example:

```text id="x3m8q5"
History:
Attempt 1 → FAIL
Attempt 2 → PASS

Current State:
CLEARED
```

The latest valid academic state should determine the current backlog status according to the configured rules.

---

# 21. Backlog and Academic Structure

Each backlog must reference the relevant academic structure.

Conceptually:

```text id="q8v3m6"
University
   ↓
College
   ↓
Course
   ↓
Semester
   ↓
Subject
   ↓
Backlog
```

The backlog must not depend only on the subject name.

---

# 22. Subject Identity

Subject matching should use the configured subject identity, preferably the subject code.

Example:

```text id="m6x2c8"
Subject Code: CS301
Subject Name: Database Management Systems
```

The subject code should be used where available rather than relying on name matching.

---

# 23. Credits and Backlogs

The backlog may reference the credits associated with the subject.

Credits should come from the authoritative Academic Structure where applicable.

The backlog module should not independently modify subject credits.

---

# 24. Backlog and SGPA

Backlog Tracking should not independently calculate SGPA.

The responsibilities are separated:

```text id="v4q7m2"
Result Processing
      ↓
SGPA / CGPA
```

and:

```text
Result Processing
      ↓
Backlog State
```

Backlog Tracking stores and exposes backlog information.

---

# 25. Backlog and CGPA

Backlog Tracking must not invent CGPA rules.

CGPA calculations belong to Result Processing and the applicable academic/regulation rules.

Backlog state may be consumed by analytics and Academic Passport.

---

# 26. Backlog Summary

For a student, the system should provide a summary such as:

```text id="x8m3v5"
Active Backlogs: 2
Cleared Backlogs: 4
Total Historical Backlog Subjects: 6
```

The exact summary definitions must remain consistent with the academic data model.

---

# 27. Student Backlog List

Students should be able to view their own backlog information.

Example:

| Subject | Semester | Status | Latest Attempt |
|---|---|---|---|
| CS301 | Semester 2 | Active | Fail |
| CS405 | Semester 4 | Cleared | Pass |

---

# 28. Active Backlog List

Authorized college users should be able to view active backlogs within their permitted college.

Useful filters may include:

- course
- semester
- academic year
- subject
- student
- status

---

# 29. Backlog Search

The backend should support controlled search/filtering.

Example:

```text
Course: MCA
Semester: 2
Status: ACTIVE
Subject: CS301
```

Filtering must remain tenant-scoped.

---

# 30. Backlog Sorting

The frontend may allow sorting by:

- student
- subject
- semester
- status
- latest attempt
- created date
- updated date

Sorting must not expose records outside the authorized tenant.

---

# 31. Backlog Details

A backlog details view should provide:

```text id="m7c3q8"
Student
Subject
Course
Semester
Academic Year
Current Status
Original Failed Attempt
Latest Attempt
Attempt History
Clearance Result
Source Result
```

---

# 32. Backlog API

Example:

```http id="v5x8m2"
GET /api/v1/backlogs
```

The API should support authorized filtering.

---

# 33. Student Backlog API

```http id="q3m7c8"
GET /api/v1/students/{studentId}/backlogs
```

A student may access only their own backlog information.

Authorized college staff may access students within their permitted college.

---

# 34. Backlog Details API

```http id="x8m4v2"
GET /api/v1/backlogs/{backlogId}
```

The backend must enforce tenant and authorization checks.

---

# 35. Backlog History API

```http id="m5q8c3"
GET /api/v1/backlogs/{backlogId}/attempts
```

This endpoint should expose the historical attempts associated with the backlog.

---

# 36. Backlog Status API

The system may expose:

```http id="v7x2m8"
GET /api/v1/backlogs/{backlogId}/status
```

The status should be derived from authoritative academic records rather than trusted from client input.

---

# 37. Manual Backlog Modification

The MVP should avoid unrestricted manual backlog editing.

Academic backlog state should normally be derived from processed result data.

If authorized staff need to correct data, the correction must follow a controlled workflow with auditability.

---

# 38. Manual Correction

A future controlled correction flow may be:

```text id="q4m8x2"
Correction Request
      ↓
Authorization
      ↓
Reason
      ↓
Audit
      ↓
Correction
      ↓
Recalculate Academic State
```

Direct database modification is not an acceptable application workflow.

---

# 39. Result Processing Integration

Result Processing is the primary producer of backlog changes.

```text id="x7c3m5"
Result Validation
      ↓
Result Processing
      ↓
Backlog Tracking
```

Result Processing may:

- create backlog
- update attempt history
- clear backlog
- reopen backlog where an official correction requires it

---

# 40. Academic Passport Integration

Academic Passport should consume backlog state.

Example:

```text id="m8v2q6"
Backlog Tracking
      ↓
Active Backlogs
      ↓
Academic Passport
```

The Passport must reflect the current authoritative state.

---

# 41. Analytics Integration

Analytics may consume:

- active backlog count
- cleared backlog count
- backlog by semester
- backlog by subject
- backlog by course
- backlog clearance trends

Analytics should use authoritative backlog records.

---

# 42. Tenant Isolation

Every backlog belongs to a college context through its associated student/academic records.

The backend must prevent cross-college access.

Example:

```text id="q6x3m8"
College A User
      ↓
College A Students
      ↓
College A Backlogs
```

A College A user must never access College B backlog data by changing an ID.

---

# 43. Authorization

### SUPER_ADMIN

May access permitted backlog information across colleges.

### COLLEGE_ADMIN

May access backlog information belonging to their college.

### ACADEMIC_STAFF

May access backlog information according to assigned permissions.

### STUDENT

May view their own backlog information.

### Public Visitor

No access.

---

# 44. Database Requirements

Conceptually, the system may maintain:

```text id="v8m4c2"
backlogs
├── id
├── student_id
├── subject_id
├── course_id
├── semester_id
├── college_id
├── status
├── original_result_id
├── cleared_result_id
├── created_at
├── cleared_at
└── updated_at
```

The exact schema belongs to Database Architecture.

---

# 45. Attempt Data

Attempt information may be represented through the authoritative result records rather than duplicated unnecessarily.

Conceptually:

```text id="x5q7m3"
Backlog
   ↓
Result Attempts
   ├── Attempt 1
   ├── Attempt 2
   └── Attempt 3
```

The final implementation should avoid unnecessary duplication of academic data.

---

# 46. Referential Integrity

Backlog records must reference valid:

- students
- subjects
- academic structures
- result records

Foreign-key relationships should be used where appropriate.

---

# 47. Backlog Deletion

Historical backlog records should not normally be physically deleted.

Instead:

```text id="m3v8q5"
Historical Record
      ↓
Preserve
```

If an official correction invalidates a backlog, the system should preserve the audit/history rather than silently deleting it.

---

# 48. Processing Idempotency

Repeated processing of the same result must not create:

- duplicate backlog
- duplicate attempt
- duplicate clearance
- inconsistent status

The backlog state must be safely derived from authoritative processed results.

---

# 49. Concurrency

The system must handle concurrent result processing safely.

Example:

```text id="q8x3m6"
User A → Process PASS
User B → Process PASS
```

The final state must contain:

```text
One clearance
+
No duplicate backlog update
```

---

# 50. Audit Events

Important events should generate audit records.

Examples:

```text id="v6m2q8"
BACKLOG_CREATED
BACKLOG_ATTEMPT_RECORDED
BACKLOG_CLEARED
BACKLOG_REOPENED
BACKLOG_CORRECTION_APPLIED
```

Audit records should include appropriate:

- actor
- college
- student
- backlog
- result
- timestamp
- action

---

# 51. Security Requirements

The module must enforce:

- authentication
- authorization
- tenant isolation
- IDOR protection
- server-side status derivation
- protected academic data
- audit logging
- input validation
- referential integrity
- safe handling of historical records

---

# 52. Frontend Requirements

The student dashboard should provide an understandable backlog view.

Example:

```text id="x4q8m3"
Academic Backlogs

Active Backlogs
----------------
2 Subjects

Cleared Backlogs
----------------
4 Subjects
```

---

# 53. Active Backlog UI

The active backlog table may contain:

| Subject | Code | Semester | Latest Attempt | Status |
|---|---|---|---|---|
| Database Management | CS301 | 2 | Fail | Active |

The UI should provide access to attempt history.

---

# 54. Backlog History UI

Example:

```text id="m7v3c8"
CS301 — Database Management

Attempt 1
FAIL

Attempt 2
FAIL

Attempt 3
PASS

Current Status
CLEARED
```

The historical sequence should be visually clear.

---

# 55. Empty State

If a student has no active backlog:

```text id="q5x8m2"
No Active Backlogs

Your current academic record shows
no active backlogs.
```

The frontend must distinguish:

```text
No active backlog
```

from:

```text
Data unavailable
```

---

# 56. Loading State

The frontend must provide an appropriate loading state while backlog data is retrieved.

---

# 57. Error State

If backlog data cannot be retrieved:

```text id="v8m3q6"
Unable to load backlog information.
Please try again.
```

The UI must not display stale or fabricated backlog status as current data.

---

# 58. Edge Cases

## Student Has Never Failed

No active backlog should be created.

---

## Same Subject Failed Multiple Times

Maintain:

```text
One logical backlog
+
Multiple attempts
```

unless the academic model requires another representation.

---

## Subject Passed on Supplementary Attempt

The active backlog becomes cleared.

Historical failure remains.

---

## Result Correction Changes PASS to FAIL

The backlog may be reopened through controlled correction processing.

---

## Result Correction Changes FAIL to PASS

The backlog may be cleared through controlled correction processing.

---

## Duplicate Import

Repeated processing must not create duplicate backlog records.

---

## Student Transfer

If student academic records are migrated between permitted college contexts in a future workflow, backlog ownership must follow the authoritative migration rules.

This is outside the MVP.

---

# 59. Data Consistency Rules

The following must remain true:

```text id="x7m4c8"
If backlog.status = ACTIVE
→ Student has no authoritative passing outcome that clears it.

If backlog.status = CLEARED
→ A valid passing outcome exists that clears it.
```

These are conceptual invariants and must be implemented according to the final academic data model.

---

# 60. Backlog Count Consistency

The active backlog count shown to the student should be derived from authoritative records.

Example:

```text id="m5q8v2"
Database:
2 ACTIVE

Dashboard:
Active Backlogs = 2
```

The frontend must not independently calculate the authoritative count from cached or incomplete result data.

---

# 61. Performance Requirements

The module should support efficient queries for:

- student's active backlogs
- student's backlog history
- college-wide active backlogs
- subject-wise backlog counts
- semester-wise backlog counts

Appropriate indexes should be defined during database design.

Potential indexed fields include:

```text id="q8x3m5"
student_id
college_id
subject_id
semester_id
status
created_at
updated_at
```

---

# 62. API Error Handling

The API should use standardized application errors.

Examples:

```text id="v4m7c2"
BACKLOG_NOT_FOUND
STUDENT_NOT_FOUND
SUBJECT_NOT_FOUND
UNAUTHORIZED_BACKLOG_ACCESS
CROSS_TENANT_ACCESS
INVALID_BACKLOG_STATE
```

The final error taxonomy must follow the project's centralized error-handling rules.

---

# 63. AI Coding Agent Rules

When implementing Backlog Tracking, an AI coding agent must:

1. Read Result Processing first.
2. Read Result Validation.
3. Read Student Management.
4. Read Academic Structure.
5. Read Academic Passport before implementing Passport integration.
6. Never create a backlog from an unvalidated result.
7. Never use student name as the primary identity.
8. Preserve all relevant result attempts.
9. Never silently delete historical attempts.
10. Never create duplicate active backlogs.
11. Make backlog updates idempotent.
12. Use authoritative result records.
13. Never invent university-specific pass/fail rules.
14. Use configured academic rules.
15. Do not calculate SGPA inside Backlog Tracking.
16. Do not calculate CGPA inside Backlog Tracking.
17. Do not bypass Result Processing.
18. Enforce tenant isolation.
19. Enforce authorization on every protected endpoint.
20. Prevent IDOR.
21. Reuse centralized audit infrastructure.
22. Reuse centralized error handling.
23. Keep business logic outside controllers.
24. Use transactions where backlog state and result state must remain consistent.
25. Add concurrency tests.
26. Add idempotency tests.
27. Add cross-tenant security tests.
28. Do not directly modify database records outside the application workflow.
29. Preserve source/result traceability.
30. Follow the project database conventions.

---

# 64. Acceptance Criteria

The module is acceptable when:

- [ ] Failed results can create backlogs.
- [ ] Invalid results cannot create backlogs.
- [ ] Duplicate backlog creation is prevented.
- [ ] Multiple attempts are preserved.
- [ ] Supplementary results can clear backlogs.
- [ ] Failed supplementary attempts keep the backlog active.
- [ ] Historical attempts remain accessible.
- [ ] Current backlog status is accurate.
- [ ] Official corrections can update backlog state through controlled processing.
- [ ] Active backlog count is accurate.
- [ ] Student can view their own backlog information.
- [ ] Authorized college users can view permitted backlog information.
- [ ] Cross-tenant access is rejected.
- [ ] Backlog records are traceable to results.
- [ ] Academic Passport receives current backlog state.
- [ ] Analytics can consume authoritative backlog data.
- [ ] Audit events are recorded.
- [ ] Historical records are protected from accidental deletion.
- [ ] Processing is idempotent.
- [ ] Concurrent processing is handled safely.
- [ ] Appropriate indexes are implemented.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Security tests pass.
- [ ] QA acceptance criteria pass.

---

# 65. Test Scenarios

## Backlog Creation

- Failed result creates backlog.
- Passing result does not create backlog.
- Invalid result does not create backlog.
- Same failed result processed twice creates only one logical backlog.

## Multiple Attempts

- First failure is stored.
- Second failure is stored.
- Third attempt is stored.
- Historical attempts remain accessible.

## Clearance

- Passing supplementary result clears backlog.
- Passing regular result clears applicable backlog.
- Clearance result is linked to the backlog.
- Previous failures remain in history.

## Reopening

- Corrected PASS → FAIL can reopen backlog.
- Corrected FAIL → PASS can clear backlog.
- Correction remains auditable.

## Security

- Student can access own backlog.
- Student cannot access another student's backlog.
- College Admin can access own college backlog.
- College Admin cannot access another college's backlog.
- Unauthorized users are rejected.

## Consistency

- Active backlog has no authoritative clearing result.
- Cleared backlog has a valid clearing result.
- Duplicate processing does not create duplicate records.

## Integration

- Result Processing creates backlog.
- Result Processing clears backlog.
- Academic Passport reflects backlog state.
- Analytics receives correct backlog information.

---

# 66. Definition of Done

Backlog Tracking is complete when:

- [ ] Backlog lifecycle is implemented.
- [ ] Backlog creation is integrated with Result Processing.
- [ ] Backlog clearance is integrated.
- [ ] Multiple attempts are preserved.
- [ ] Duplicate protection is implemented.
- [ ] Idempotency is implemented.
- [ ] Concurrency is controlled.
- [ ] Student backlog API is implemented.
- [ ] Authorized college backlog APIs are implemented.
- [ ] Backlog details and history are available.
- [ ] Tenant isolation is implemented.
- [ ] Authorization is implemented.
- [ ] Audit events are implemented.
- [ ] Academic Passport integration is implemented.
- [ ] Analytics integration is supported.
- [ ] Database constraints are implemented.
- [ ] Required indexes are implemented.
- [ ] Unit tests are implemented.
- [ ] Integration tests are implemented.
- [ ] Security tests are implemented.
- [ ] QA testing is completed.
- [ ] Code review is completed.

---

# 67. Future Extensions

## Backlog Risk Intelligence

Future versions may identify students with increasing backlog risk.

Example:

```text id="x6m3q8"
Semester Results
      ↓
Backlog Trend
      ↓
Risk Analysis
```

---

## Backlog Clearance Planning

Future versions may allow students or academic staff to plan which backlogs to clear first.

---

## Exam Registration Integration

A future integration could connect backlog records with supplementary examination registration.

---

## University-Specific Rules

Future Regulation Engine support may define:

- maximum attempts
- supplementary rules
- carry-forward rules
- promotion rules
- credit requirements
- eligibility rules

---

## Academic What-If Simulator

Future versions may allow:

```text id="q8v3m5"
"If I clear these 3 backlogs,
what will my academic status become?"
```

This belongs to the future Academic What-If module, not the MVP backlog module.

---

# 68. Related Documents

This module depends on:

```text
00-project-context/project-overview.md

03-prd/product-requirements.md
03-prd/mvp-scope.md
03-prd/functional-requirements.md

04-tech-stack/*

05-architecture/*

07-project-rules/*

09-development/feature-specifications/authentication.md
09-development/feature-specifications/college-management.md
09-development/feature-specifications/academic-structure.md
09-development/feature-specifications/student-management.md
09-development/feature-specifications/result-import.md
09-development/feature-specifications/result-validation.md
09-development/feature-specifications/result-processing.md
```

Related modules:

```text
academic-passport.md
analytics.md
student-portal.md
```

---

# 69. Document Status

**Status:** Draft / Implementation Ready

This document defines the Backlog Tracking boundary of Acadlytic.

It describes how the platform creates, tracks, clears, and preserves student backlog information.

It does not replace:

- Result Processing specification
- Academic Structure specification
- Academic Passport specification
- Analytics specification
- Regulation Engine specification
- Database Architecture
- API Architecture
- Security Architecture
- source code
- database migrations