# Academic Passport Implementation

**Document:** `09-development/implementation-notes/academic-passport-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Academic Passport  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for the **Academic Passport** module in Acadlytic.

The Academic Passport provides a consolidated, student-readable representation of a student's academic history.

It brings together:

- student academic identity
- program/course information
- semester history
- subject results
- attempts
- SGPA
- CGPA
- credits
- backlog status
- overall academic summary

The Academic Passport is a **read-oriented representation**.

It is not the authoritative source of academic data.

---

# 2. Core Principle

The Academic Passport should answer:

> **What does the student's academic record currently look like across their academic journey?**

The conceptual flow is:

```text
Authoritative Academic Data
        ↓
Result History
        ↓
Backlog State
        ↓
Academic Calculations
        ↓
Academic Passport Projection
        ↓
Student / Staff View
```

The Passport must not independently modify academic results.

---

# 3. Scope

MVP Academic Passport includes:

- student academic profile
- program/course
- academic timeline
- semester list
- semester results
- subject results
- grades/outcomes
- credits
- SGPA
- CGPA
- backlog summary
- attempt information
- current academic status where authoritative data supports it
- student self-service view
- authorized staff view
- responsive presentation
- read-oriented APIs

---

# 4. Out of Scope

MVP does not include:

- public academic profile sharing
- downloadable official certificates
- degree certificates
- university verification
- digital signatures
- university API synchronization
- AI-generated academic recommendations
- predictive performance
- academic risk prediction
- What-If simulation
- graduation eligibility engine
- regulation/credit eligibility engine
- manual result editing
- direct Passport data mutation

These may be considered later.

---

# 5. Ownership

The Academic Passport owns:

```text
Passport Representation
Passport Projection/Read Model
Passport Summary Presentation
```

It does **not** own:

```text
Student Identity
Academic Structure
Authoritative Results
Backlog Lifecycle
Academic Calculation Rules
```

Those remain owned by their respective modules.

---

# 6. Source of Truth

The Academic Passport must consume authoritative data from:

```text
Student Management
Academic Structure
Result Processing
Backlog Tracking
```

Conceptually:

```text
Student
   +
Academic Structure
   +
Processed Results
   +
Backlogs
   ↓
Academic Passport
```

The Passport must never become a second source of truth.

---

# 7. Read-Oriented Architecture

The preferred implementation is a read-oriented projection or composition layer.

Conceptually:

```text
Authoritative Domain Data
          ↓
     Projection Builder
          ↓
   Academic Passport
          ↓
       Read APIs
```

The implementation may use:

- database projection
- optimized queries
- materialized/read-model tables
- service-level composition

The final strategy must follow the approved database architecture.

---

# 8. Passport Generation

The Passport may be generated or refreshed after authoritative academic changes.

Typical triggers include:

```text
Result Processed
Result Corrected
Backlog Opened
Backlog Resolved
Academic Structure Updated
Student Academic Context Updated
```

The exact event/update mechanism remains an implementation decision.

---

# 9. Passport Is Not a Calculation Engine

The Passport must not independently invent or redefine:

- SGPA formulas
- CGPA formulas
- grade mappings
- credit rules
- pass/fail rules

Where calculations are required, they must come from approved academic configuration and authoritative processing logic.

---

# 10. Student Identity

The Passport must be tied to the correct student identity.

The primary relationship is:

```text
Student
   ↓
Academic Passport
```

A student's name must not be used as the unique identity.

The implementation should use the internal student identifier and approved academic identifiers.

---

# 11. Student Context

The Passport may display:

- student name
- student identifier
- enrollment/registration identifier
- course/program
- college
- university
- academic year/session where available

Only data supported by the authoritative student and academic models should be displayed.

---

# 12. Tenant Context

The Academic Passport is tenant-aware.

For college users:

```text
Authenticated User
        ↓
Trusted Tenant Context
        ↓
Student
        ↓
Academic Passport
```

A user must never retrieve a Passport from another college by manipulating a student ID.

---

# 13. Student Self-Service

Students should access their own Passport through:

```text
GET /api/v1/me/academic-passport
```

The backend derives the student identity from authenticated context.

The frontend must not be treated as the security boundary.

---

# 14. Staff Access

Authorized:

- COLLEGE_ADMIN
- ACADEMIC_STAFF

may access Passport information for students within their authorized tenant and permissions.

---

# 15. Super Admin Access

SUPER_ADMIN may access Passport information according to platform-wide administrative permissions.

The implementation must still maintain explicit authorization rules.

---

# 16. Passport Structure

Conceptually:

```text
Academic Passport
├── Student Profile
├── Academic Summary
├── Academic Timeline
├── Semester Performance
├── Subject Results
├── Backlog Summary
└── Attempt History
```

---

# 17. Academic Summary

The summary may contain:

```text
Total Semesters
Completed Semesters
Current Semester
Total Credits
Earned Credits
Current CGPA
Latest SGPA
Open Backlogs
Resolved Backlogs
```

Only values supported by authoritative data should be displayed.

---

# 18. CGPA

CGPA displayed by the Passport must come from the approved academic calculation process.

Do not calculate CGPA independently in the frontend.

Example:

```text
Backend
   ↓
Authoritative CGPA
   ↓
Passport API
   ↓
Frontend
```

---

# 19. SGPA

Semester SGPA should similarly come from authoritative academic calculation logic.

The Passport should display the stored/derived authoritative value.

---

# 20. Credits

The Passport may display:

- semester credits
- earned credits
- total attempted credits
- total completed credits

The exact terminology must match the approved academic model.

Do not assume that:

```text
Attempted Credits = Earned Credits
```

---

# 21. Grade Information

A subject result may contain:

```text
Subject Code
Subject Name
Credits
Grade
Grade Point
Marks
Result Outcome
Attempt
```

Only fields actually supported by the authoritative result model should be returned.

---

# 22. Semester Structure

The Passport should group results by academic semester.

Example:

```text
Semester 1
├── Subject A
├── Subject B
└── Subject C

Semester 2
├── Subject D
├── Subject E
└── Subject F
```

Semester ordering must use academic structure ordering rather than alphabetical ordering.

---

# 23. Semester Summary

Each semester may display:

```text
Semester
Academic Year
SGPA
Credits
Passed Subjects
Failed Subjects
Backlogs
```

The exact summary fields depend on available authoritative data.

---

# 24. Subject Result

A subject result should identify:

```text
Subject Code
Subject Name
Credits
Outcome
Grade
Attempt
Result Type
Semester
```

The exact response depends on the finalized result model.

---

# 25. Attempts

Attempts must remain visible where relevant.

Example:

```text
CS101

Attempt 1 → FAIL
Attempt 2 → PASS
```

The Passport should not erase the earlier failed attempt merely because the subject was later cleared.

---

# 26. Backlog Integration

Backlog information should come from Backlog Tracking.

Conceptually:

```text
Result History
      +
Backlog State
      ↓
Academic Passport
```

The Passport should not independently determine whether a student has a backlog.

---

# 27. Current Backlogs

The Passport may show:

```text
Open Backlogs: 2
```

and provide links to detailed backlog information.

The detailed lifecycle remains owned by Backlog Tracking.

---

# 28. Resolved Backlogs

Where supported, the Passport may show resolved backlog information.

Example:

```text
Mathematics
Status: Resolved
Resolution Attempt: Semester 4
```

---

# 29. Academic Timeline

A timeline can provide a high-level academic journey:

```text
Year 1
 ├── Semester 1
 └── Semester 2

Year 2
 ├── Semester 3
 └── Semester 4
```

The timeline should use actual academic context rather than assuming fixed academic-year structures.

---

# 30. Passport API

Primary student endpoint:

```text
GET /api/v1/students/{studentId}/academic-passport
```

---

# 31. Self-Service Passport API

Student endpoint:

```text
GET /api/v1/me/academic-passport
```

This should be the preferred endpoint for the student portal.

---

# 32. Semester Passport API

For a specific semester:

```text
GET /api/v1/students/{studentId}/academic-passport/semesters/{semesterId}
```

Authorization must verify that the semester belongs to the student's academic context.

---

# 33. Passport Summary API

A summary endpoint may be exposed as:

```text
GET /api/v1/students/{studentId}/academic-passport/summary
```

It should return only summary information required by the consuming interface.

---

# 34. Response Design

A conceptual response:

```json
{
  "student": {
    "id": "...",
    "name": "...",
    "studentIdentifier": "..."
  },
  "academicSummary": {
    "cgpa": 8.21,
    "earnedCredits": 96,
    "openBacklogs": 1
  },
  "semesters": []
}
```

The final DTO schema must follow the approved API contract.

---

# 35. DTO Strategy

Do not expose JPA entities directly.

Use dedicated DTOs/projections such as:

```text
AcademicPassportResponse
AcademicPassportSummaryResponse
PassportSemesterResponse
PassportSubjectResultResponse
PassportAttemptResponse
```

---

# 36. Query Strategy

The Passport should avoid loading the entire academic graph through naive JPA relationships.

Avoid:

```text
Passport
 → Student
 → Course
 → Semesters
 → Subjects
 → Results
 → Attempts
 → Backlogs
```

with uncontrolled lazy-loading.

Use:

- projections
- optimized queries
- explicit joins
- batch loading
- read models

where appropriate.

---

# 37. N+1 Prevention

Passport retrieval must not produce one database query per:

- semester
- subject
- result
- attempt
- backlog

Query patterns must be reviewed using SQL logging/profiling during development.

---

# 38. Performance

Passport retrieval is a read-heavy operation.

The implementation should optimize:

- student lookup
- semester grouping
- result retrieval
- backlog summary
- SGPA/CGPA retrieval
- attempt history

---

# 39. Pagination

The primary Passport may not need pagination if the academic history is reasonably bounded.

However, large result histories should not cause uncontrolled response sizes.

If required, detailed sections such as attempt history may be paginated independently.

The final strategy must be based on actual usage and dataset size.

---

# 40. Caching

Caching may be considered for read-heavy Passport requests.

Potential cache key:

```text
academic-passport:{tenantId}:{studentId}
```

Cache invalidation must occur after relevant academic changes.

Caching must never return data across tenants.

Caching is optional for MVP unless performance testing demonstrates a need.

---

# 41. Projection Refresh

A projection can be refreshed after:

```text
Result Processing
Backlog Update
Academic Correction
```

The refresh must be reliable.

A failed projection refresh must not roll back authoritative academic data unless the architecture explicitly requires synchronous consistency.

---

# 42. Consistency Model

The authoritative academic data has priority over the Passport projection.

If a projection becomes stale:

```text
Authoritative Data
   ≠
Passport Projection
```

the system must have a mechanism to refresh/rebuild the Passport.

---

# 43. Projection Rebuild

A rebuild process should be possible if a read model is used.

Conceptually:

```text
Authoritative Data
      ↓
Rebuild Passport Projection
      ↓
Updated Read Model
```

This supports recovery from projection corruption or migration.

---

# 44. Result Processing Integration

After successful result processing:

```text
Processed Result
      ↓
Backlog Update
      ↓
Passport Refresh
```

The Passport should only reflect successfully committed academic data.

---

# 45. Backlog Integration

After backlog state changes:

```text
Backlog OPEN/RESOLVED
      ↓
Passport Refresh
```

The Passport should consume the backlog state rather than duplicate its business logic.

---

# 46. Analytics Integration

Analytics may consume the same authoritative data used by the Passport.

The Passport itself should not become the source for analytics calculations.

Preferred:

```text
Authoritative Academic Data
       ↙             ↘
Passport           Analytics
```

Not:

```text
Authoritative Data
       ↓
Passport
       ↓
Analytics
```

---

# 47. Student Portal

The Student Portal should display the Passport through:

```text
Dashboard
   ↓
Academic Passport
```

The portal should not create its own academic record representation.

---

# 48. Frontend Route

The general Passport route is:

```text
/app/academic-passport
```

Student-specific route:

```text
/app/students/:studentId/academic-passport
```

---

# 49. Student Passport Page

The page should provide a clear academic overview.

Suggested sections:

```text
Student Header
Academic Summary
Semester Performance
Subject Results
Backlog Summary
Attempt History
```

---

# 50. Summary Cards

Potential cards:

```text
CGPA
Credits Earned
Semesters Completed
Open Backlogs
```

Cards must communicate actual values only.

Do not display:

```text
"Excellent"
"At Risk"
"Top Performer"
```

unless an approved analytics/risk rule explicitly supports such classification.

---

# 51. Semester Performance UI

Semester results may be displayed as:

```text
Semester 1
SGPA: 8.10
Credits: 24

Semester 2
SGPA: 8.45
Credits: 26
```

The UI should remain readable on mobile.

---

# 52. Subject Results UI

Use an accessible table on larger screens.

On smaller screens, use:

- responsive table
- stacked cards
- expandable rows

depending on the approved design system.

---

# 53. Attempt Display

Attempt information should make the distinction between attempts clear.

Example:

```text
Subject: CS101

Attempt 1
FAIL

Attempt 2
PASS
```

Do not visually imply that the first attempt has been deleted.

---

# 54. Backlog Indicators

Backlog status should be communicated through:

- text
- semantic status
- optional icon
- appropriate visual styling

Do not depend exclusively on red/green colors.

---

# 55. Loading State

The Passport page should support:

```text
Loading Skeleton
```

for:

- summary
- semester list
- result sections

Avoid blank screens while data is loading.

---

# 56. Empty State

If no academic result history exists:

```text
No academic result history is available yet.
```

Do not display:

```text
CGPA = 0
Backlogs = 0
Credits = 0
```

unless those are actual authoritative values.

---

# 57. Partial Data

If some academic history is unavailable, communicate it accurately.

Example:

```text
Academic history is incomplete for this student.
```

Do not infer missing semesters as completed or failed.

---

# 58. Error State

The frontend should distinguish:

```text
Unauthorized
Forbidden
Not Found
Server Error
Temporary Failure
```

Use the common application error-handling patterns.

---

# 59. TanStack Query

Frontend server state should use TanStack Query.

Conceptual hooks:

```text
useAcademicPassport(studentId)
useMyAcademicPassport()
useAcademicPassportSemester(studentId, semesterId)
useAcademicPassportSummary(studentId)
```

Exact naming may vary according to project conventions.

---

# 60. Client State

Do not store the entire Passport permanently in global Zustand state unless a clear cross-page requirement exists.

Prefer server-state caching through TanStack Query.

---

# 61. Refresh

The Passport should refresh when relevant authoritative data changes.

Possible mechanisms:

- query invalidation
- route refetch
- event-driven invalidation
- explicit refresh

Avoid unnecessary polling.

---

# 62. Authorization UI

Frontend navigation may hide actions/pages based on role.

However:

> Frontend visibility is not authorization.

Backend authorization remains mandatory.

---

# 63. Tenant Isolation

The frontend must not construct arbitrary cross-tenant Passport requests.

The backend must independently validate:

```text
Authenticated User
      ↓
Tenant
      ↓
Student
      ↓
Passport
```

---

# 64. IDOR Protection

Requests such as:

```text
GET /api/v1/students/123/academic-passport
```

must verify that the requester is authorized to access student `123`.

Changing the URL ID must never bypass authorization.

---

# 65. Student `/me` Protection

For students:

```text
GET /api/v1/me/academic-passport
```

must resolve the current student from trusted authenticated identity.

Never accept:

```text
?studentId=...
```

as the security mechanism.

---

# 66. Audit

Passport retrieval is normally read-only.

Depending on audit requirements, sensitive administrative access may be logged.

The Passport itself should not generate mutation events because it does not own academic mutations.

---

# 67. No Direct Editing

The Passport UI must not allow editing:

- marks
- grades
- SGPA
- CGPA
- credits
- backlog status
- attempt history

Academic corrections must occur through their authoritative workflows.

---

# 68. Academic Corrections

If a result is corrected:

```text
Result Processing
      ↓
Authoritative Result Updated
      ↓
Backlog State Recalculated
      ↓
Passport Refreshed
```

The Passport must reflect the corrected authoritative state.

---

# 69. Security Tests

Test:

```text
Student A → own Passport → allowed
Student A → Student B Passport → denied

College A staff → College A student → allowed
College A staff → College B student → denied
```

Also test inactive users and unauthorized roles.

---

# 70. Unit Tests

Test:

```text
PassportSummaryTest
PassportSemesterGroupingTest
PassportResultMappingTest
PassportBacklogMappingTest
PassportAttemptHistoryTest
PassportEmptyStateTest
PassportProjectionTest
```

---

# 71. Integration Tests

Verify:

```text
Result Processing
      ↓
Passport
```

and:

```text
Backlog Tracking
      ↓
Passport
```

Expected behavior:

- processed result appears
- SGPA/CGPA reflects authoritative values
- backlog state appears correctly
- attempts remain visible
- corrected data is reflected

---

# 72. API Tests

Test:

```text
GET /api/v1/students/{studentId}/academic-passport
GET /api/v1/me/academic-passport
GET /api/v1/students/{studentId}/academic-passport/semesters/{semesterId}
GET /api/v1/students/{studentId}/academic-passport/summary
```

Test:

- valid request
- unauthorized request
- forbidden request
- invalid ID
- cross-tenant request
- missing academic data
- incomplete academic history

---

# 73. Performance Tests

Measure:

- Passport response time
- database query count
- query execution time
- large academic-history performance
- concurrent student requests

Avoid premature caching before measuring actual performance.

---

# 74. Data Integrity Tests

Verify that:

```text
Result Processing
      ↓
Authoritative Result
```

remains unchanged by Passport reads.

Verify that:

```text
Passport
```

cannot independently modify academic state.

---

# 75. Responsive Requirements

Passport must work at:

```text
320px
375px
430px
768px
1024px
1280px
1440px
1920px
```

Requirements include:

- no horizontal page overflow
- readable result tables
- responsive summary cards
- accessible controls
- mobile-friendly semester navigation
- usable attempt history

---

# 76. Accessibility

The Passport must support:

- semantic headings
- keyboard navigation
- visible focus
- accessible tables
- accessible status labels
- screen-reader-friendly summaries
- sufficient contrast
- reduced-motion support
- meaningful empty/error states

---

# 77. Performance Rules

Frontend must:

- avoid rendering unnecessary large result lists
- use query caching appropriately
- avoid duplicate API requests
- lazy-load heavy sections where justified
- avoid unnecessary chart rendering
- avoid client-side recalculation of authoritative academic metrics

---

# 78. API Error Handling

Use the common API error contract.

Potential errors:

```text
STUDENT_NOT_FOUND
PASSPORT_NOT_FOUND
TENANT_ACCESS_DENIED
ACADEMIC_CONTEXT_NOT_FOUND
SEMESTER_NOT_FOUND
```

Do not expose stack traces to clients.

---

# 79. Database Considerations

If a dedicated Passport projection is implemented, indexes should support:

```text
student_id
college_id
semester_id
subject_id
```

and other actual query patterns.

The final schema must be consistent with database ownership rules.

---

# 80. Projection vs Live Composition

Two possible approaches:

### Option A — Live Composition

```text
API Request
   ↓
Query authoritative tables
   ↓
Compose response
```

Advantages:

- always current
- fewer synchronization concerns

Disadvantages:

- potentially expensive queries
- complex joins

### Option B — Read Projection

```text
Authoritative Data
      ↓
Projection
      ↓
Passport API
```

Advantages:

- optimized reads
- predictable response structure
- easier complex presentation queries

Disadvantages:

- consistency management
- projection refresh/rebuild required

The final choice remains an architectural decision.

---

# 81. Recommended MVP Approach

Unless performance requirements demonstrate a need for a dedicated read model, begin with a carefully optimized read-oriented service/query layer.

Do not introduce unnecessary projection infrastructure prematurely.

The implementation should preserve the ability to introduce a dedicated read model later.

---

# 82. API Response Stability

Passport response DTOs should not expose internal database structure.

For example, avoid returning:

```text
JPA entity relationships
```

directly.

Instead return a stable application-level contract.

---

# 83. Versioning

Passport APIs follow:

```text
/api/v1
```

Future breaking changes should use the established API versioning strategy.

---

# 84. Authorization Matrix

Conceptually:

| Role | Own Passport | Same-College Student | Cross-College |
|---|---:|---:|---:|
| STUDENT | Yes | No | No |
| ACADEMIC_STAFF | N/A | Yes, authorized | No |
| COLLEGE_ADMIN | N/A | Yes, authorized | No |
| SUPER_ADMIN | N/A | According to platform permissions | According to platform permissions |
| Public Visitor | No | No | No |

Exact permissions remain subject to the approved authorization model.

---

# 85. Acceptance Criteria

Academic Passport is acceptable when:

### Academic Data

- [ ] Student identity is correct.
- [ ] Course/program context is correct.
- [ ] Semester history is correct.
- [ ] Subject results are correct.
- [ ] Attempts are preserved.
- [ ] SGPA is authoritative.
- [ ] CGPA is authoritative.
- [ ] Credits are authoritative.
- [ ] Backlog state is authoritative.

### Security

- [ ] Tenant isolation works.
- [ ] IDOR protection works.
- [ ] Student `/me` access is isolated.
- [ ] Unauthorized users are rejected.

### Integration

- [ ] Result Processing updates visible academic history.
- [ ] Backlog Tracking state is reflected.
- [ ] Analytics can independently consume authoritative data.
- [ ] Student Portal can display the Passport.

### UX

- [ ] Loading states work.
- [ ] Empty states work.
- [ ] Error states work.
- [ ] Responsive layout works.
- [ ] Accessibility requirements are met.

### Performance

- [ ] No uncontrolled N+1 queries.
- [ ] Large academic histories remain usable.
- [ ] API response performance is acceptable.

---

# 86. Definition of Done

Academic Passport is implemented when:

1. Passport APIs are implemented.
2. Student self-service endpoint works.
3. Authorized staff endpoint works.
4. Tenant isolation passes.
5. IDOR tests pass.
6. Student identity is correctly resolved.
7. Semester grouping works.
8. Subject result mapping works.
9. Attempt history works.
10. SGPA/CGPA values are authoritative.
11. Credit information is authoritative.
12. Backlog state is integrated.
13. Result Processing integration works.
14. Backlog Tracking integration works.
15. Student Portal integration works.
16. Frontend Passport page works.
17. Loading/empty/error states work.
18. Responsive behavior works.
19. Accessibility checks pass.
20. Unit tests pass.
21. Integration tests pass.
22. API/security tests pass.
23. Performance is acceptable.
24. No critical academic-data integrity issue remains.

---

# 87. Unresolved Implementation Decisions

The following require review:

- live composition vs dedicated read projection
- projection refresh mechanism
- projection rebuild mechanism
- exact Passport DTO schema
- exact academic summary fields
- credit terminology
- current academic status definition
- result correction handling
- revaluation handling
- improvement attempt handling
- caching strategy
- cache invalidation
- Passport export requirements
- official document generation
- administrative access scope
- audit requirements for Passport reads
- large-history pagination strategy

---

# 88. Relationship With Other Documents

This document depends on:

```text
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

09-development/feature-specifications/academic-passport.md
09-development/feature-specifications/result-processing.md
09-development/feature-specifications/backlog-tracking.md
09-development/feature-specifications/student-portal.md
09-development/feature-specifications/analytics.md

09-development/implementation-notes/result-processing-implementation.md
09-development/implementation-notes/backlog-implementation.md
```

It provides implementation context for:

```text
analytics-implementation.md
student-portal-implementation.md
integration-hardening.md
```

---

# 89. AI-Assisted Development Rules

AI coding assistants implementing Academic Passport must:

- read the Academic Passport feature specification first
- read Result Processing and Backlog Tracking implementation notes
- treat Passport as read-oriented
- never make Passport the academic source of truth
- never edit authoritative results from Passport code
- never independently invent SGPA/CGPA formulas
- never infer missing academic data
- never convert missing values into zero
- preserve attempt history
- preserve tenant isolation
- enforce authorization server-side
- use `/me` for student self-service
- prevent IDOR
- avoid exposing JPA entities
- avoid N+1 queries
- avoid unnecessary global client state
- keep Analytics independent from Passport
- never introduce predictive or AI classifications without approved requirements
- write tests for incomplete academic history
- write security tests for cross-tenant access
- stop and request clarification when academic semantics are undefined

---

# 90. Review Checklist

Before moving this document to `Approved`:

```text
□ Passport ownership is clear
□ Source-of-truth boundaries are clear
□ Student identity is defined
□ Tenant boundary is defined
□ Staff authorization is defined
□ Student /me access is defined
□ Semester structure is defined
□ Subject result structure is defined
□ Attempt history is defined
□ SGPA/CGPA ownership is defined
□ Credit ownership is defined
□ Backlog integration is defined
□ Result Processing integration is defined
□ API structure is defined
□ DTO strategy is defined
□ Query strategy is defined
□ N+1 prevention is defined
□ Projection strategy is defined
□ Caching decision is documented
□ Frontend structure is defined
□ Responsive behavior is defined
□ Accessibility is defined
□ Testing strategy is defined
□ Security testing is defined
□ Performance testing is defined
□ Unresolved decisions are documented
```

---

# 91. Status

**Draft / Under Review**

This document is not yet implementation-approved.

Lifecycle:

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

---

# 92. Final Academic Passport Principle

> **The Academic Passport is a trusted view of the student's academic journey, not a second academic database.**

The intended architecture is:

```text
                    ┌─────────────────────┐
                    │ Student Management  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Academic Structure  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Result Processing   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Backlog Tracking    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Academic Passport  │
                    │   Read-Oriented     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
             Student        Staff          Portal
```

The Passport should provide a complete, understandable, historically safe representation of academic progress while keeping all academic mutations inside their authoritative domain boundaries.