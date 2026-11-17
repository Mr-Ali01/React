# Backlog Tracking Implementation

**Document:** `09-development/implementation-notes/backlog-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Backlog Tracking  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for Backlog Tracking in Acadlytic.

Backlog Tracking represents a student's unresolved academic subject/result state based on authoritative processed academic results.

The module must maintain an accurate lifecycle of academic backlogs across attempts.

The implementation must ensure that:

- backlogs are derived from authoritative result outcomes
- historical attempts are preserved
- a later passing attempt can resolve an earlier backlog
- failed attempts do not overwrite history
- backlog state is tenant-isolated
- backlog records remain traceable to academic results
- the frontend presents current and historical backlog information clearly
- backlog mutations are controlled by backend domain logic

---

# 2. Core Principle

Backlog Tracking answers:

> **Which academic requirements currently remain unresolved for a student, and what is their historical attempt state?**

The core relationship is:

```text id="f6v7dx"
Processed Academic Result
        ↓
Result Outcome
        ↓
Backlog Domain Logic
        ↓
Current Backlog State
        ↓
Student / Academic Passport / Analytics
```

Backlog is a derived academic state, but it must be persisted or represented through an authoritative domain model where required for lifecycle tracking.

---

# 3. Scope

MVP Backlog Tracking covers:

- backlog identification
- backlog creation
- backlog status
- backlog resolution
- attempt history
- current unresolved backlogs
- resolved backlog history
- subject association
- student association
- semester/context association
- result association
- backlog summary
- authorized viewing
- backend-controlled lifecycle updates
- tenant isolation
- auditability
- student portal visibility
- analytics integration

---

# 4. Out of Scope

MVP does not include:

- university degree eligibility
- graduation eligibility
- promotion rules
- advanced regulation engine
- credit completion engine
- predictive backlog risk
- AI backlog recommendations
- automatic exam registration
- fee/payment processing
- university API synchronization
- manual arbitrary backlog creation without an authoritative academic basis

---

# 5. Ownership

Backlog Tracking owns:

```text id="y2n1zv"
Backlog Lifecycle
Backlog Status
Backlog Identity
Backlog Resolution State
Backlog Attempt Association
Backlog Summary
```

It depends on:

```text id="5f7w2d"
Student Management
Academic Structure
Result Processing
```

It provides information to:

```text id="7d8y4s"
Academic Passport
Analytics
Student Portal
```

---

# 6. Source of Truth

The academic result remains authoritative.

Backlog state is derived from processed academic outcomes.

Therefore:

```text id="5x1o7k"
Processed Result
      ↓
Authoritative Outcome
      ↓
Backlog State
```

Backlog Tracking must not independently invent an academic outcome.

---

# 7. Backlog Boundary

Result Processing determines the authoritative academic result.

Backlog Tracking determines the backlog state resulting from that outcome.

```text id="wq0xgb"
Result Processing
      ↓
Result Outcome
      ↓
Backlog Tracking
      ↓
Backlog State
```

This prevents duplicate result-processing logic inside the backlog module.

---

# 8. Backlog Identity

A backlog should identify the unresolved academic requirement rather than merely one failed result row.

Conceptually:

```text id="k5j7y6"
Student
+
Subject
+
Academic Context
```

The exact identity model must be finalized with the database design.

---

# 9. Attempts vs Backlog

These are different concepts.

Example:

```text id="g7b0wm"
Student: S001
Subject: CS101

Attempt 1 → FAIL
Attempt 2 → FAIL
Attempt 3 → PASS
```

The system may have:

```text id="q8d3kp"
One Backlog
Three Attempts
Current State → RESOLVED
```

The system must not create three independent current backlogs merely because three attempts occurred.

---

# 10. Backlog Lifecycle

A conceptual lifecycle is:

```text id="8g6y2x"
No Backlog
    ↓
OPEN
    ↓
OPEN after additional failed attempts
    ↓
RESOLVED
```

The exact status vocabulary should be standardized.

Recommended MVP statuses:

```text id="4m2e1y"
OPEN
RESOLVED
```

Optional future states may include:

```text id="j6g3e8"
WITHDRAWN
INVALIDATED
```

These should not be added without a clear business requirement.

---

# 11. OPEN

An OPEN backlog means the student's academic requirement remains unresolved.

Example:

```text id="t7o8p1"
Result:
FAIL

Backlog:
OPEN
```

---

# 12. RESOLVED

A RESOLVED backlog means the relevant academic requirement has subsequently been satisfied according to the authoritative result outcome.

Example:

```text id="k9x4q2"
Attempt 1 → FAIL
Attempt 2 → PASS

Backlog:
RESOLVED
```

---

# 13. Backlog Creation

Backlog creation should normally occur as a consequence of Result Processing.

Flow:

```text id="g5e8cr"
Validated Result
      ↓
Result Processing
      ↓
Result = Fail/Unresolved
      ↓
Backlog Tracking
      ↓
OPEN Backlog
```

Do not allow a normal user to arbitrarily create a backlog disconnected from an academic result.

---

# 14. Backlog Resolution

Resolution should also be driven by Result Processing.

Flow:

```text id="2z4j6a"
New Processed Result
      ↓
Result = Pass
      ↓
Find Matching OPEN Backlog
      ↓
Resolve Backlog
```

The resolution must be deterministic.

---

# 15. Matching Backlog to Result

The system should match using stable academic identity:

```text id="r9k7qu"
Student
+
Subject
+
Academic Context
```

The exact identity must align with the result and academic-structure models.

Do not use student name as the identity.

---

# 16. Failed Result

When an authoritative processed result indicates an unresolved/failing outcome:

```text id="b2m6er"
Processed Result
      ↓
Fail
      ↓
Find Existing Backlog
```

If none exists:

```text id="g7l0kq"
Create OPEN Backlog
```

If one already exists:

```text id="c6s9b2"
Keep Backlog OPEN
Add/associate Attempt
```

---

# 17. Passing Result

When a later authoritative result indicates the subject has been successfully cleared:

```text id="4n8p2m"
Processed Result
      ↓
Pass
      ↓
Find OPEN Backlog
      ↓
Resolve Backlog
```

If no OPEN backlog exists, no new backlog should be created.

---

# 18. Multiple Failed Attempts

Example:

```text id="5z8j6x"
Attempt 1 → FAIL
Attempt 2 → FAIL
Attempt 3 → FAIL
```

Expected state:

```text id="r4x0sp"
Backlog → OPEN
Attempts → 3
```

Do not create three active backlog entities for the same unresolved requirement.

---

# 19. Failed Then Passed

Example:

```text id="y3j8tw"
Attempt 1 → FAIL
Attempt 2 → PASS
```

Expected:

```text id="8z6b4v"
Backlog → RESOLVED
Attempts → 2
Resolution Attempt → Attempt 2
```

Historical failure must remain available.

---

# 20. Result Corrections

If an authoritative result is corrected:

```text id="7k1c3e"
Original → FAIL
Corrected → PASS
```

the backlog state must be recalculated according to the authoritative corrected result.

The system must preserve an audit trail of the correction.

---

# 21. Invalidated Results

If an authoritative result is invalidated or withdrawn in a future-supported workflow, backlog state may need recalculation.

This behavior is an unresolved decision unless explicitly supported.

---

# 22. Backlog Data Model

Conceptually:

```text id="7k9s0c"
Backlog
├── id
├── student
├── subject
├── course/program
├── semester/context
├── status
├── first_failed_result
├── latest_attempt
├── resolved_by_result
├── opened_at
├── resolved_at
├── created_at
└── updated_at
```

The exact fields must follow the finalized database architecture.

---

# 23. Backlog Attempt Association

Attempts should remain associated with authoritative result records.

Conceptually:

```text id="2d0j7x"
Backlog
   ↓
Attempt History
   ├── Result 1
   ├── Result 2
   └── Result 3
```

Do not duplicate complete result data inside the backlog entity unless required.

---

# 24. Source Result Reference

A backlog should be traceable to:

- first result that opened it
- latest relevant attempt
- result that resolved it, if resolved

This supports auditability.

---

# 25. First Failed Result

Where modeled, retain the first authoritative result that caused the backlog to open.

Example:

```text id="2v7e0p"
First Failed Result
→ Semester 2
→ CS101
→ FAIL
```

This helps preserve academic history.

---

# 26. Latest Attempt

The backlog may reference the latest relevant attempt.

Example:

```text id="g5p8mc"
Latest Attempt
→ Supplementary
→ Semester 3
→ PASS
```

If the backlog is resolved, this may also be the resolution attempt.

---

# 27. Resolution Result

For a resolved backlog, retain the authoritative result that resolved it.

Example:

```text id="3m7r4p"
Resolved By:
Result ID = ...
```

---

# 28. Backlog Summary

The system should provide:

```text id="s6o4x8"
Total Backlogs
Open Backlogs
Resolved Backlogs
```

Additional summaries may include:

```text id="7v1n9j"
Open by Semester
Open by Subject
Open by Course
```

where supported by analytics requirements.

---

# 29. Student Backlog API

Primary endpoint:

```text id="7s9k4p"
GET /api/v1/students/{studentId}/backlogs
```

The response should provide the authorized student's backlog information.

---

# 30. Current User Backlog API

For student self-service:

```text id="k2p4w8"
GET /api/v1/me/backlogs
```

This endpoint must derive the student identity from authenticated context.

Do not accept an arbitrary student ID for `/me`.

---

# 31. College Backlog API

A college-level view may use:

```text id="3z8k7q"
GET /api/v1/analytics/backlogs
```

for aggregated backlog analytics.

The dedicated student backlog endpoint should remain focused on individual backlog information.

---

# 32. Backlog List Requirements

Authorized staff should be able to filter by useful attributes.

Potential filters:

```text id="6w2p9f"
Student
Course
Semester
Subject
Status
Attempt
```

The final filter set should remain aligned with actual workflows.

---

# 33. Pagination

Backlog lists must be paginated.

Do not return all college backlogs in a single response.

Example:

```text id="q6m1z8"
GET /api/v1/students/{studentId}/backlogs?page=0&size=20
```

The exact pagination contract follows the API architecture.

---

# 34. Sorting

Useful sorting may include:

```text id="f3j7z1"
Latest Attempt
Opened Date
Resolved Date
Subject
Semester
Status
```

Sorting must be implemented server-side.

---

# 35. Backlog Detail

A detail response may include:

```text id="8m0s4e"
Student
Subject
Course
Semester
Status
First Failed Result
Latest Attempt
Resolution Result
Attempt History
Opened At
Resolved At
```

---

# 36. Attempt History

Attempt history should be presented chronologically.

Example:

```text id="9c4f5b"
Attempt 1
FAIL
Semester 2

Attempt 2
FAIL
Semester 3

Attempt 3
PASS
Semester 4
```

This is especially important for academic transparency.

---

# 37. Manual Backlog Mutation

MVP should not provide unrestricted manual backlog creation or arbitrary status changes.

Users should not be able to simply select:

```text id="4n0k5q"
Status = RESOLVED
```

without an authoritative academic basis.

---

# 38. Administrative Correction

A future controlled administrative correction workflow may be introduced.

If introduced, it must require:

- explicit permission
- reason
- audit event
- actor
- timestamp
- before/after state

It should not silently alter academic history.

---

# 39. Backlog Service

Conceptually:

```text id="2o9c8r"
BacklogService
├── openBacklog(...)
├── keepOpen(...)
├── resolveBacklog(...)
├── findOpenBacklog(...)
├── findStudentBacklogs(...)
└── getBacklogSummary(...)
```

The final API/class structure may differ.

---

# 40. Result Processing Integration

Result Processing should invoke a domain operation rather than directly modifying backlog tables.

Conceptually:

```text id="9d7k1x"
ResultProcessingService
        ↓
BacklogService
        ↓
Backlog Domain Operation
```

This preserves ownership.

---

# 41. Open Backlog Operation

Conceptually:

```text id="0q2y9f"
openBacklog(
    student,
    subject,
    academicContext,
    result
)
```

The operation should:

1. verify required identity
2. find an existing open backlog
3. create one if none exists
4. associate the result attempt
5. preserve audit information

---

# 42. Resolve Backlog Operation

Conceptually:

```text id="k6r2s8"
resolveBacklog(
    backlog,
    result
)
```

The operation should:

1. verify the backlog is open
2. verify the result resolves the requirement
3. record resolution result
4. set status to RESOLVED
5. set resolution timestamp
6. preserve history
7. emit appropriate audit information

---

# 43. Idempotency

Backlog operations must be idempotent.

Processing the same result twice must not:

```text id="4n2m7c"
create duplicate backlog
```

or:

```text id="2s7x5q"
resolve the same backlog twice
```

without a meaningful state change.

---

# 44. Database Constraints

Where possible, enforce uniqueness for active backlog identity.

Conceptually:

```text id="8k1v9p"
Student
+
Subject
+
Academic Context
+
OPEN
```

The exact implementation may use a unique constraint or another database strategy depending on the selected schema.

---

# 45. Concurrency

Two result-processing operations may attempt to open or resolve the same backlog simultaneously.

The system must prevent duplicate active backlog rows.

Possible mechanisms:

- database uniqueness
- locking
- transaction isolation
- optimistic locking

The final strategy must be approved during implementation.

---

# 46. Transaction Boundary

Backlog changes should occur within the appropriate Result Processing transaction.

Example:

```text id="n7k0c5"
Persist Result
      ↓
Update Backlog
      ↓
Commit
```

If the authoritative result transaction rolls back, the related backlog mutation must not remain incorrectly committed.

---

# 47. Historical Integrity

Backlog tracking must never destroy historical attempts.

Avoid designs where:

```text id="h6y8p0"
FAIL → PASS
```

simply changes the original result row.

Instead:

```text id="e2c4j7"
Attempt 1 → FAIL
Attempt 2 → PASS
```

and:

```text id="u3p8x1"
Backlog → RESOLVED
```

---

# 48. Current State vs History

The system should make both concepts available:

```text id="v9p3c2"
Current Backlog State
```

and:

```text id="q5k7m1"
Historical Attempts
```

Users should not need to infer current state by manually examining every result attempt.

---

# 49. Academic Passport Integration

Academic Passport may present:

```text id="0b3m6x"
Open Backlogs
Resolved Backlogs
Attempt History
```

It should obtain the data from the authoritative backlog/result sources.

---

# 50. Analytics Integration

Analytics may derive:

- total open backlogs
- backlog count by semester
- backlog count by course
- backlog count by subject
- resolved backlog counts
- student backlog summaries

Analytics must not modify backlog state.

---

# 51. Student Portal Integration

The Student Portal should expose:

```text id="f2x6y4"
Backlogs
```

with:

- subject
- semester
- status
- attempt history
- resolution information where applicable

Students must have read-only access to their own data.

---

# 52. College Staff View

Authorized staff may view backlog information for students in their tenant.

The backend must enforce tenant isolation regardless of frontend navigation.

---

# 53. Student Access Control

A student requesting:

```text id="m3j9y7"
GET /api/v1/students/{anotherStudentId}/backlogs
```

must be rejected unless the authorization model explicitly permits that access.

Normal student self-service should use:

```text id="6x8c3k"
/api/v1/me/backlogs
```

---

# 54. Security

Backlog data must enforce:

- authentication
- authorization
- tenant isolation
- IDOR protection
- student self-service isolation
- safe logging
- auditability

---

# 55. Sensitive Data

Backlog information is academic data.

Do not:

- expose it publicly
- include unnecessary personal data
- log complete academic histories
- return unrelated student information

---

# 56. Audit Events

Potential events:

```text id="4x7m2s"
BACKLOG_OPENED
BACKLOG_ATTEMPT_ADDED
BACKLOG_RESOLVED
BACKLOG_ADMIN_CORRECTION
```

The final audit taxonomy should be standardized.

---

# 57. Audit Actor

An audit record should identify whether the change originated from:

```text id="7c5m2p"
Human User
```

or:

```text id="8v0k4q"
System Result Processing
```

---

# 58. Logging

Safe operational logs may include:

```text id="y3v8k2"
backlogId
studentId
subjectId
collegeId
operation
status
correlationId
```

Avoid logging unnecessary student personal data.

---

# 59. Error Handling

Possible domain errors:

```text id="7g5w2a"
BACKLOG_NOT_FOUND
BACKLOG_ALREADY_RESOLVED
INVALID_BACKLOG_TRANSITION
STUDENT_NOT_FOUND
SUBJECT_NOT_FOUND
RESULT_NOT_FOUND
TENANT_ACCESS_DENIED
```

The final error catalog should be centralized.

---

# 60. Invalid State Transitions

Examples:

```text id="6x4p7s"
RESOLVED → OPEN
```

must not happen through normal processing.

Similarly:

```text id="0m2q6r"
OPEN → OPEN
```

should not create a duplicate backlog.

---

# 61. Repeated Passing Result

If a student already has:

```text id="f6r9w3"
Backlog = RESOLVED
```

and another result for the same subject is processed, the system must determine whether it represents:

- another attempt
- improvement
- correction
- duplicate

It must not blindly create another backlog or alter the resolved state.

---

# 62. Result Correction Handling

If an authoritative result changes:

```text id="q4p2n8"
PASS → FAIL
```

the backlog state may need to reopen.

If:

```text id="w7s1m5"
FAIL → PASS
```

the backlog may need to resolve.

Such transitions must be handled through an explicit result-correction workflow if corrections are supported.

---

# 63. Deactivation

Deactivating a student must not delete historical backlog information.

Similarly, deactivating a subject must not destroy historical backlog records.

---

# 64. Database Performance

Important query patterns include:

```text id="s5f8q3"
Find student's open backlogs
Find student's backlog history
Find open backlog by identity
Find backlog by subject
Find backlog by semester
Find backlog by course
```

Indexes should support actual access patterns.

---

# 65. N+1 Prevention

Avoid loading:

```text id="e5v7r2"
Backlog
  → Student
  → Subject
  → Course
  → Semester
  → Attempts
```

with one query per record.

Use appropriate fetch strategies, projections, joins, or batch fetching.

---

# 66. DTO Strategy

Do not expose JPA entities directly.

Use dedicated DTOs for:

```text id="n4x7q1"
Backlog Summary
Backlog Detail
Backlog Attempt
Student Backlog List
```

---

# 67. Frontend Route

The approved student-specific route is:

```text id="9k3v8m"
/app/students/:studentId/backlogs
```

The general application may also provide a backlog view where supported by the page specification.

---

# 68. Student Backlog Page

The page should show:

```text id="m4q8z7"
Backlog Summary
Open Backlogs
Resolved Backlogs
Attempt History
Filters
```

---

# 69. Backlog Status UI

Example:

```text id="5x2n7p"
OPEN
```

and:

```text id="9q4m1s"
RESOLVED
```

Status must be understandable without relying only on color.

---

# 70. Backlog Table

Potential columns:

```text id="7f1x4n"
Subject
Subject Code
Course
Semester
Status
Attempts
Latest Attempt
Opened
Resolved
```

The exact columns depend on the page specification.

---

# 71. Backlog Detail View

The detail view should present:

```text id="r7c4m9"
Subject Information
Academic Context
Current Status
First Failed Attempt
All Attempts
Resolution Result
Timeline
```

---

# 72. Attempt Timeline

A timeline is useful for communicating academic history:

```text id="k4x8p2"
Semester 2
FAIL
   ↓
Semester 3
FAIL
   ↓
Semester 4
PASS
   ↓
Backlog Resolved
```

This is a presentation layer concern; the backend should provide structured attempt history.

---

# 73. Empty State

If a student has no open backlog:

```text id="f6n1q8"
No active backlogs.
```

If no historical backlogs exist:

```text id="p2w7x5"
No backlog history is available.
```

Do not imply academic success solely from missing data.

---

# 74. Missing Data

Do not treat missing result history as:

```text id="0r7c5e"
No Backlog
```

unless the system has sufficient authoritative academic history to establish that state.

Missing data and zero backlogs are different concepts.

---

# 75. Accessibility

Backlog pages must support:

- keyboard navigation
- accessible tables
- accessible status indicators
- visible focus
- semantic headings
- screen-reader-friendly timelines
- non-color-only status communication
- responsive layouts

---

# 76. Unit Tests

Unit tests should cover:

```text id="x7m4p1"
OpenBacklogTest
ResolveBacklogTest
RepeatedFailureTest
FailThenPassTest
DuplicateBacklogTest
AttemptHistoryTest
InvalidTransitionTest
IdempotencyTest
```

---

# 77. Integration Tests

Test:

```text id="w6p2n8"
Result Processing
      ↓
Backlog Tracking
```

Verify:

- failed result opens backlog
- repeated failure keeps backlog open
- later pass resolves backlog
- attempts remain preserved
- duplicate processing is safe

---

# 78. Security Tests

Test:

```text id="h2v5m7"
Cross-tenant access
Student accessing another student's backlog
Unauthorized staff
IDOR
Inactive user
Invalid student ID
```

---

# 79. Concurrency Tests

Test simultaneous:

```text id="p4x7c2"
Fail Result Processing
```

to ensure only one active backlog is created.

Also test simultaneous resolution.

---

# 80. Data Integrity Tests

Verify:

```text id="j8r3q5"
Processed Result
      ↕
Backlog
```

remains consistent.

A backlog must never exist without an appropriate authoritative academic basis under normal system operation.

---

# 81. End-to-End Workflow

The complete workflow is:

```text id="w2q6n8"
University Result
      ↓
Import
      ↓
Validation
      ↓
Processing
      ↓
Result = FAIL
      ↓
Backlog OPEN
      ↓
Later Result Import
      ↓
Validation
      ↓
Processing
      ↓
Result = PASS
      ↓
Backlog RESOLVED
```

Historical attempts remain preserved throughout.

---

# 82. Acceptance Criteria

Backlog Tracking is acceptable when:

### Creation

- [ ] Failed/unresolved authoritative results can create backlogs.
- [ ] Existing open backlogs are reused.
- [ ] Duplicate active backlogs cannot be created.

### Lifecycle

- [ ] OPEN state works.
- [ ] RESOLVED state works.
- [ ] Invalid transitions are blocked.
- [ ] Later passing results resolve the correct backlog.

### History

- [ ] Multiple attempts are preserved.
- [ ] First failed result is traceable where modeled.
- [ ] Resolution result is traceable where modeled.
- [ ] Historical results are never silently overwritten.

### Security

- [ ] Tenant isolation is enforced.
- [ ] Student self-service is isolated.
- [ ] IDOR protection works.
- [ ] Unauthorized mutations are rejected.

### Integration

- [ ] Result Processing can open backlogs.
- [ ] Result Processing can resolve backlogs.
- [ ] Academic Passport can consume backlog state.
- [ ] Analytics can consume backlog state.
- [ ] Student Portal can display backlog information.

### Reliability

- [ ] Backlog operations are idempotent.
- [ ] Concurrency is controlled.
- [ ] Database constraints protect active backlog identity.
- [ ] Transaction boundaries preserve consistency.

---

# 83. Definition of Done

Backlog Tracking is implemented when:

1. Backlog domain model is implemented.
2. Backlog status lifecycle is implemented.
3. Failed-result backlog creation works.
4. Repeated failed attempts work.
5. Later passing attempt resolution works.
6. Attempt history is preserved.
7. Result references are preserved.
8. Duplicate active backlogs are prevented.
9. Idempotency is implemented.
10. Concurrency protection is implemented.
11. Transaction integration is implemented.
12. Result Processing integration works.
13. Academic Passport integration works.
14. Analytics integration works.
15. Student Portal integration works.
16. Authorized APIs work.
17. Tenant isolation passes.
18. IDOR protection passes.
19. Unit tests pass.
20. Integration tests pass.
21. Security tests pass.
22. Concurrency tests pass.
23. Frontend backlog views work.
24. Audit events work.
25. No critical academic-data integrity issue remains.

---

# 84. Unresolved Implementation Decisions

The following require review:

- exact backlog identity
- exact backlog database schema
- exact status vocabulary
- whether backlog is persisted independently or fully derived
- attempt association model
- first-failed-result representation
- latest-attempt representation
- resolution-result representation
- revaluation handling
- improvement-result handling
- result-correction handling
- inactive-student processing policy
- subject deactivation behavior
- manual administrative correction workflow
- concurrency strategy
- database uniqueness strategy
- exact backlog analytics
- exact audit-event catalog

---

# 85. Relationship With Other Documents

This document depends on:

```text id="0s8p5n"
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/database-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md

06-design/navigation.md
06-design/page-specifications.md
06-design/responsive-design.md

07-project-rules/coding-rules.md
07-project-rules/frontend-rules.md
07-project-rules/backend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/backlog-tracking.md
09-development/feature-specifications/result-processing.md
09-development/feature-specifications/academic-passport.md
09-development/feature-specifications/analytics.md
09-development/feature-specifications/student-portal.md

09-development/implementation-notes/result-processing-implementation.md
```

It provides the implementation foundation for:

```text id="m8q3y7"
academic-passport-implementation.md
analytics-implementation.md
student-portal-implementation.md
integration-hardening.md
```

---

# 86. AI-Assisted Development Rules

AI coding assistants implementing Backlog Tracking must:

- read the Backlog Tracking feature specification first
- read Result Processing before implementing backlog mutations
- treat processed academic results as the authoritative source
- never create arbitrary backlogs from frontend actions
- never use student name as backlog identity
- never use subject name as the primary identity
- preserve all historical attempts
- distinguish backlog identity from attempt identity
- prevent duplicate active backlogs
- implement idempotency
- handle concurrent processing safely
- never silently overwrite result history
- never invent university eligibility rules
- never infer graduation eligibility from backlog count
- enforce tenant isolation
- enforce student self-service isolation
- preserve auditability
- keep analytics and Academic Passport read-oriented
- use database constraints where appropriate
- write tests for fail/retry/pass lifecycle
- stop and request clarification when academic semantics are undefined

---

# 87. Review Checklist

Before moving this document to `Approved`:

```text id="y5r2k8"
□ Backlog ownership is clear
□ Result Processing boundary is clear
□ Backlog identity is defined
□ Attempt identity is defined
□ Lifecycle is defined
□ Open state is defined
□ Resolved state is defined
□ Failed-result creation is defined
□ Later-pass resolution is defined
□ Historical attempts are preserved
□ Duplicate protection is defined
□ Idempotency is defined
□ Concurrency strategy is defined
□ Transaction boundary is defined
□ Tenant isolation is explicit
□ Student self-service isolation is explicit
□ Audit requirements are defined
□ Academic Passport integration is defined
□ Analytics integration is defined
□ Student Portal integration is defined
□ Testing strategy is defined
□ Unresolved decisions are documented
```

---

# 88. Status

**Draft / Under Review**

This document is not yet implementation-approved.

Lifecycle:

```text id="n5w8x2"
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

---

# 89. Final Backlog Tracking Principle

> **A backlog represents an unresolved academic requirement, while attempts represent the student's historical efforts to resolve it. Never confuse the two.**

The intended lifecycle is:

```text id="c6r4m8"
Processed Result
      ↓
FAIL
      ↓
Backlog OPEN
      ↓
Additional Attempts
      ↓
PASS
      ↓
Backlog RESOLVED
```

The system must preserve the complete academic history while maintaining a clear current backlog state.