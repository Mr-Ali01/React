# Analytics Implementation

**Document:** `09-development/implementation-notes/analytics-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Academic Analytics  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for the **Academic Analytics** module in Acadlytic.

Analytics provides read-oriented academic insights derived from authoritative student and result data.

The module is intended to help authorized users understand:

- student performance
- semester performance
- course performance
- subject performance
- SGPA trends
- CGPA summaries
- pass/fail outcomes
- backlog patterns
- credit completion
- academic KPIs

Analytics must provide accurate information without becoming a second source of academic truth.

---

# 2. Core Principle

Analytics answers:

> **What does the available authoritative academic data tell us about academic performance?**

The conceptual flow is:

```text
Authoritative Academic Data
        ↓
Processed Results
        ↓
Backlog State
        ↓
Approved Academic Metrics
        ↓
Analytics Queries
        ↓
Authorized Insights
```

Analytics must never modify the underlying academic record.

---

# 3. Scope

MVP Analytics includes:

- student-level analytics
- semester-level analytics
- course/program-level analytics
- subject-level analytics
- college-level academic KPIs
- SGPA trends
- CGPA summaries
- pass/fail statistics
- backlog statistics
- credit summaries
- subject performance
- semester performance
- authorized filters
- role-aware analytics
- responsive dashboards
- read-only APIs

---

# 4. Out of Scope

MVP does not include:

- predictive analytics
- AI-based predictions
- academic risk scoring
- AI recommendations
- What-If simulation
- graduation prediction
- placement prediction
- dropout prediction
- machine-learning models
- automatic intervention recommendations
- external BI integrations
- public academic analytics
- university API analytics
- advanced regulation analysis
- custom report builder

These may be introduced after the MVP.

---

# 5. Ownership

Analytics owns:

```text id="c7m4x9"
Analytics Queries
Metric Aggregation
Analytics DTOs
Dashboard Data
Derived Academic Insights
```

Analytics does not own:

```text id="v2n8q5"
Students
Academic Structure
Authoritative Results
Backlogs
SGPA/CGPA Calculation Rules
```

Those remain owned by their respective modules.

---

# 6. Source of Truth

Analytics must consume authoritative academic data.

Preferred relationship:

```text id="m8x3k7"
Student Management
       │
Academic Structure
       │
Result Processing
       │
Backlog Tracking
       │
       ▼
    Analytics
```

Analytics must not become the source of truth for any academic entity.

---

# 7. Read-Only Boundary

Analytics APIs must be read-only in MVP.

They should not:

- edit marks
- change grades
- create results
- resolve backlogs
- change student information
- modify academic structure

Analytics is a query and interpretation layer.

---

# 8. Authoritative Academic Data

Only processed/authoritative academic information should contribute to official analytics.

The following must not normally contribute:

```text id="q6w2p4"
Raw imported records
Invalid result records
Pending validation records
Unprocessed result records
```

Conceptually:

```text id="h5c8r2"
Imported
   ↓
Validated
   ↓
Processed
   ↓
Authoritative
   ↓
Analytics
```

---

# 9. Data Integrity Principle

Analytics must never manufacture academic information.

Examples:

```text id="k3p9v6"
Missing Result ≠ Zero Marks
Missing SGPA ≠ 0.00
Unknown Grade ≠ Fail
No Record ≠ Passed
```

Missing data must remain distinguishable from actual zero values.

---

# 10. Student Analytics

Student analytics may include:

- current CGPA
- semester SGPA trend
- credits
- passed subjects
- failed subjects
- open backlogs
- resolved backlogs
- attempt history
- subject performance

The exact metrics must use approved academic semantics.

---

# 11. Student Analytics API

Primary endpoint:

```text id="w4m8q1"
GET /api/v1/students/{studentId}/analytics
```

For student self-service:

```text id="x7n2c5"
GET /api/v1/me/analytics
```

The `/me` endpoint must derive student identity from authenticated context.

---

# 12. Student Analytics Response

A conceptual response:

```json id="d3p7m9"
{
  "summary": {
    "cgpa": 8.21,
    "earnedCredits": 96,
    "openBacklogs": 1
  },
  "semesterPerformance": [],
  "subjectPerformance": [],
  "backlogSummary": {}
}
```

The exact DTO must be defined by the approved API contract.

---

# 13. Semester Analytics

Semester analytics may include:

```text id="b8q4m2"
SGPA
Credits
Passed Subjects
Failed Subjects
Backlogs
Subject Performance
```

Endpoint:

```text id="n5x7c3"
GET /api/v1/analytics/semesters/{semesterId}
```

Access must verify the semester's tenant and academic context.

---

# 14. Course Analytics

Course/program analytics may include:

- student count
- average CGPA where meaningful
- SGPA distributions
- pass/fail statistics
- backlog counts
- subject performance
- semester performance

Endpoint:

```text id="p2m8y6"
GET /api/v1/analytics/courses/{courseId}
```

The exact metrics must be approved before implementation.

---

# 15. Subject Analytics

Subject analytics may include:

- number of students with processed results
- pass count
- fail count
- pass rate
- grade distribution where supported
- backlog count
- performance by semester

Endpoint:

```text id="s6k3q8"
GET /api/v1/analytics/subjects/{subjectId}
```

---

# 16. Backlog Analytics

Backlog analytics may include:

- open backlog count
- resolved backlog count
- backlog distribution by semester
- backlog distribution by subject
- backlog distribution by course

Endpoint:

```text id="r7m2x5"
GET /api/v1/analytics/backlogs
```

Backlog state must come from Backlog Tracking.

---

# 17. College Dashboard

College-level analytics may provide KPIs such as:

```text id="z4p8n6"
Total Students
Students With Results
Average CGPA
Average SGPA
Open Backlogs
Resolved Backlogs
Pass Rate
```

The exact KPI list must be finalized during implementation.

---

# 18. Role-Based Analytics

Analytics visibility depends on role.

Conceptually:

| Role | Student Analytics | College Analytics | Cross-College |
|---|---:|---:|---:|
| STUDENT | Own only | No | No |
| ACADEMIC_STAFF | Authorized students | Authorized college | No |
| COLLEGE_ADMIN | Authorized college | Own college | No |
| SUPER_ADMIN | According to platform permissions | Platform scope | According to permission |

The backend must enforce these boundaries.

---

# 19. Tenant Isolation

College analytics must never mix data from multiple colleges unless the requester has explicit platform-level authorization.

For normal college users:

```text id="k5x9m3"
User
 ↓
College Tenant
 ↓
Analytics Query
 ↓
Same Tenant Data
```

Tenant filtering must occur server-side.

---

# 20. IDOR Protection

Analytics endpoints accepting identifiers must verify authorization.

For example:

```text id="c7n4x8"
GET /api/v1/analytics/courses/{courseId}
```

must verify that the course belongs to an accessible tenant.

Changing the ID must not expose another college's analytics.

---

# 21. `/me` Analytics

Students should use:

```text id="m3q8v5"
GET /api/v1/me/analytics
```

The backend should resolve:

```text id="j6w2p9"
Authenticated User
      ↓
Student Identity
      ↓
Student Analytics
```

Do not accept an arbitrary student ID as the security mechanism.

---

# 22. Metric Definition

Every analytics metric must have a clear definition.

For example:

```text id="n4k7x2"
Pass Rate
=
Passed Processed Results
÷
Eligible Processed Results
× 100
```

The final definition depends on the approved academic result semantics.

Do not implement ambiguous metrics based on assumptions.

---

# 23. Processed Results Only

Analytics should normally query processed results.

Example:

```text id="g5m2r8"
Result Import
      ↓
Validation
      ↓
Processing
      ↓
Authoritative Result
      ↓
Analytics
```

This prevents invalid or unprocessed data from affecting official dashboards.

---

# 24. Attempt Handling

Attempt-based analytics must define whether the metric counts:

- attempts
- unique students
- unique subjects
- latest outcome
- final outcome

These are not interchangeable.

For example:

```text id="p9v4c2"
Student A:
Attempt 1 → FAIL
Attempt 2 → PASS
```

A pass-rate metric based on students should not count this as two students.

---

# 25. Avoid Double Counting

Analytics must explicitly distinguish:

```text id="q6x8m1"
Attempt Count
```

from:

```text id="v3n7p5"
Student Count
```

and:

```text id="k8c2r4"
Subject Requirement Count
```

Do not aggregate attempts as students.

---

# 26. Latest vs Historical Outcome

For metrics involving current academic status, use the approved latest/final outcome logic.

For historical analysis, preserve individual attempts.

Example:

```text id="t5w9x3"
Historical:
FAIL → PASS

Current:
PASS
```

The metric definition must determine which representation is appropriate.

---

# 27. SGPA Analytics

SGPA trend data should come from authoritative semester-level academic calculations.

Example:

```text id="x2m6q8"
Semester 1 → 7.8
Semester 2 → 8.1
Semester 3 → 8.4
```

Do not recalculate SGPA in the frontend.

---

# 28. CGPA Analytics

CGPA should be sourced from approved authoritative calculation logic.

Analytics may display:

- current CGPA
- CGPA distribution
- CGPA range counts

where supported.

Do not invent formulas for institutions with unknown calculation rules.

---

# 29. Grade Distribution

Where grade data exists, Analytics may provide:

```text id="b6q1n8"
A → 25
B → 40
C → 20
D → 8
F → 7
```

The grade categories must come from the academic configuration/result model.

---

# 30. Pass/Fail Analytics

Pass/fail metrics must use authoritative result outcomes.

Do not infer:

```text id="z7m4p2"
Missing Grade → Fail
```

Instead:

```text id="s9c6x1"
Missing/Unknown
```

should remain distinguishable.

---

# 31. Backlog Analytics

Backlog analytics should use current backlog state.

For example:

```text id="j4p7m9"
Open Backlogs = COUNT(OPEN backlog records)
```

Historical resolved backlogs should not be included in current open-backlog KPIs.

---

# 32. Credit Analytics

Possible metrics:

```text id="n8x2c5"
Earned Credits
Attempted Credits
Required Credits
Remaining Credits
```

However, `Required Credits` should only be displayed if an approved academic configuration provides the requirement.

Do not infer degree requirements.

---

# 33. Missing Academic Data

Analytics must distinguish:

```text id="r6m3k8"
No Data
```

from:

```text id="c2v7p4"
Zero
```

For example:

```text
Average CGPA = null
```

is different from:

```text
Average CGPA = 0
```

when no eligible records exist.

---

# 34. Filters

Analytics may support filters such as:

```text id="q4n8x2"
Academic Year
Course
Semester
Subject
Result Type
Status
```

Only filters supported by authoritative data should be exposed.

---

# 35. Filter Validation

Filters must be validated server-side.

For example:

```text id="m7c5p9"
semesterId
```

must belong to an accessible academic context.

A malicious request must not bypass tenant isolation through filter parameters.

---

# 36. Date Filtering

Where result dates are supported, analytics may provide:

```text id="x5q2v7"
From
To
```

The exact date semantics must be clearly defined.

Avoid using client-local dates for server-side academic aggregation without an agreed timezone strategy.

---

# 37. Pagination

Large analytics detail datasets should be paginated.

Examples:

- student lists
- subject result lists
- backlog records
- detailed grade distributions

Summary KPI responses generally do not require pagination.

---

# 38. Sorting

Detailed analytics tables may support:

```text id="k3m8x5"
CGPA
SGPA
Student Name
Student Identifier
Backlog Count
Credits
```

Sorting should be performed server-side.

---

# 39. Search

Where analytics includes student lists, search may support:

- student identifier
- official registration number
- name

Search must remain tenant-scoped.

---

# 40. Dashboard API

A college dashboard may use:

```text id="f8q3m6"
GET /api/v1/analytics/dashboard
```

It should return a purpose-built response rather than forcing the frontend to make many independent requests.

---

# 41. Dashboard Response

Conceptually:

```json id="h2v7x4"
{
  "kpis": {},
  "semesterPerformance": [],
  "backlogSummary": {},
  "subjectPerformance": [],
  "gradeDistribution": []
}
```

The exact response must be finalized with the page specification.

---

# 42. Query Layer

Analytics should use a dedicated query/service layer.

Conceptually:

```text id="p5n8x2"
AnalyticsController
        ↓
AnalyticsService
        ↓
AnalyticsQueryRepository
        ↓
MySQL
```

The analytics query layer should optimize read-heavy operations.

---

# 43. Repository Strategy

Analytics queries may use:

- Spring Data projections
- JPQL
- native SQL
- dedicated query repositories

The choice should be based on query complexity and performance.

Do not use native SQL unnecessarily.

---

# 44. DTO Strategy

Do not return entities.

Use purpose-built DTOs:

```text id="m8c4q7"
DashboardAnalyticsResponse
StudentAnalyticsResponse
CourseAnalyticsResponse
SemesterAnalyticsResponse
SubjectAnalyticsResponse
BacklogAnalyticsResponse
```

---

# 45. Query Optimization

Analytics can involve:

- `COUNT`
- `AVG`
- `SUM`
- `GROUP BY`
- joins
- conditional aggregation

Queries must be reviewed for:

- index usage
- unnecessary joins
- duplicate rows
- incorrect grouping
- aggregation inflation

---

# 46. Duplicate Rows

Joining multiple academic relationships can unintentionally multiply rows.

Example:

```text id="v5x8n3"
Student
 ×
Attempts
 ×
Backlogs
```

may inflate counts.

Analytics queries must explicitly control aggregation boundaries.

---

# 47. Example Double-Counting Risk

If one student has:

```text id="j7m4c9"
3 result attempts
2 backlogs
```

a careless join may produce:

```text id="q8p2x6"
3 × 2 = 6 rows
```

A student count based on those rows would be incorrect.

Use appropriate:

- `COUNT(DISTINCT ...)`
- subqueries
- separate aggregates
- pre-aggregated views/read models

where necessary.

---

# 48. Performance Strategy

Begin with optimized SQL queries against authoritative tables.

Only introduce:

- materialized analytics tables
- caching
- background aggregation
- OLAP systems

if actual scale or performance requirements justify them.

---

# 49. Caching

Caching may be considered for expensive dashboard summaries.

Potential key:

```text id="x4m7n2"
analytics:dashboard:{tenantId}:{filterHash}
```

Cache invalidation must account for academic data changes.

Caching is optional for MVP.

---

# 50. Cache Safety

Cache keys must include all authorization/tenant dimensions necessary to prevent data leakage.

Never use:

```text id="k5v9c3"
analytics:dashboard
```

as a global cache key.

---

# 51. Analytics Consistency

Analytics should reflect successfully committed authoritative data.

The preferred sequence is:

```text id="s3q7m1"
Academic Transaction
      ↓
Commit
      ↓
Analytics Reads New State
```

Analytics must not expose partially committed academic state.

---

# 52. Eventual Consistency

If future analytics projections are introduced, analytics may become eventually consistent.

The UI should be able to communicate stale data where necessary.

MVP should prefer direct authoritative queries where practical.

---

# 53. Frontend Analytics Routes

Approved routes include:

```text id="n6c2x8"
/app/analytics
/app/analytics/courses/:courseId
/app/analytics/semesters/:semesterId
```

Student-specific analytics may be accessed through the student portal and:

```text id="z7p4m1"
/app/students/:studentId/analytics
```

if included in the final route implementation.

---

# 54. Dashboard Layout

A college analytics dashboard may contain:

```text id="c8m5x2"
KPI Cards
Performance Overview
Semester Performance
Backlog Summary
Subject Performance
Grade Distribution
```

The final page composition follows `page-specifications.md`.

---

# 55. KPI Cards

KPI cards should display:

- metric name
- current value
- appropriate unit
- optional comparison
- accessible label

Avoid decorative metrics with no defined meaning.

---

# 56. Charts

Recommended visualization types:

```text id="q3v8m5"
Line Chart
→ SGPA trend

Bar Chart
→ Semester comparison

Bar/Column Chart
→ Subject performance

Donut/Pie
→ Grade distribution where appropriate

KPI
→ Summary metrics
```

Chart choice should match the data relationship.

---

# 57. Chart Accessibility

Charts must not rely exclusively on visual interpretation.

Provide:

- accessible labels
- data summaries
- table alternative where appropriate
- meaningful titles
- units

---

# 58. Responsive Analytics

Analytics dashboards must work across:

```text id="x7m2p4"
320px
375px
430px
768px
1024px
1280px
1440px
1920px
```

Requirements:

- no horizontal page overflow
- readable KPI cards
- responsive charts
- usable filters
- accessible tables
- mobile-friendly data presentation

---

# 59. Mobile Analytics

On mobile:

```text id="n4q8c6"
KPI Cards
↓
Filters
↓
Primary Chart
↓
Secondary Charts
↓
Detailed Tables
```

Charts may stack vertically.

Avoid squeezing multiple complex charts into narrow columns.

---

# 60. Filters UI

Filters should be:

- keyboard accessible
- clearly labeled
- responsive
- easy to reset
- reflected in URL state where appropriate

---

# 61. URL State

Dashboard filters may be encoded in the URL when useful.

Example:

```text id="m7x3q9"
 /app/analytics?course=bca&semester=4
```

This enables:

- deep linking
- browser navigation
- sharing within authorized contexts
- state restoration

The backend must still validate all filters.

---

# 62. TanStack Query

Analytics server state should use TanStack Query.

Conceptual hooks:

```text id="v8p4m2"
useAnalyticsDashboard()
useStudentAnalytics(studentId)
useCourseAnalytics(courseId)
useSemesterAnalytics(semesterId)
useSubjectAnalytics(subjectId)
useBacklogAnalytics()
```

Exact names may vary.

---

# 63. Query Keys

Query keys should include all relevant filters.

Conceptually:

```text id="c6m9x1"
[
  "analytics",
  "dashboard",
  tenantId,
  filters
]
```

This prevents incorrect cached results.

---

# 64. Loading State

Use:

- skeleton KPI cards
- chart skeletons
- table loading states

Do not display fabricated zero values during loading.

---

# 65. Empty State

Example:

```text id="r2n7x5"
No processed academic data is available for the selected filters.
```

This is different from:

```text id="w4c8m1"
0 students passed.
```

---

# 66. Error State

Analytics errors should distinguish:

```text id="q5m3x8"
Unauthorized
Forbidden
Invalid Filter
Not Found
Temporary Failure
Server Error
```

Use the shared application error contract.

---

# 67. Export

CSV/PDF export is not required for the core MVP unless explicitly included in the product scope.

If later implemented:

- enforce same authorization
- apply the same filters
- generate from authoritative analytics queries
- audit sensitive exports where required

---

# 68. Security

Analytics must enforce:

- authentication
- authorization
- tenant isolation
- IDOR protection
- filter validation
- safe logging
- response minimization

---

# 69. Sensitive Aggregates

Even aggregated data may become sensitive when the population is very small.

For example:

```text id="p8m4x2"
One student
```

may effectively expose individual academic performance.

Any future cross-tenant/public analytics must consider minimum cohort sizes and privacy requirements.

This is out of MVP scope but should be considered before public analytics is introduced.

---

# 70. Logging

Operational logs may contain:

```text id="x7c3m9"
analyticsEndpoint
tenantId
requestId
filterSummary
duration
resultCount
```

Do not log complete student academic histories.

---

# 71. Audit

Analytics is read-oriented.

MVP may not require audit logging for every ordinary analytics request.

Administrative or sensitive report access may require audit logging based on the final security policy.

---

# 72. Unit Tests

Unit tests should cover:

```text id="m5x8q2"
StudentAnalyticsServiceTest
DashboardAnalyticsServiceTest
CourseAnalyticsServiceTest
SemesterAnalyticsServiceTest
SubjectAnalyticsServiceTest
BacklogAnalyticsServiceTest
MetricDefinitionTest
```

---

# 73. Metric Tests

Test:

```text id="c8q4m7"
Pass Rate
Student Count
Attempt Count
Average SGPA
Average CGPA
Backlog Count
Credit Totals
Grade Distribution
```

with carefully constructed datasets.

---

# 74. Double-Counting Tests

Create test data containing:

```text id="j6p2x8"
Multiple attempts
Multiple subjects
Multiple backlogs
Multiple semesters
```

Verify that aggregates remain correct.

---

# 75. Missing Data Tests

Test:

```text id="x4m7c1"
Missing SGPA
Missing grade
Missing result
Missing semester
No results
No backlog
```

Ensure missing data is not incorrectly converted into zero/fail.

---

# 76. Integration Tests

Verify:

```text id="q8n3m5"
Result Processing
      ↓
Analytics
```

and:

```text id="w6c2p9"
Backlog Tracking
      ↓
Analytics
```

Expected results must reflect authoritative state.

---

# 77. Security Tests

Test:

```text id="r4m8x2"
College A → College A Analytics → Allowed
College A → College B Analytics → Denied
Student → Own Analytics → Allowed
Student → Another Student Analytics → Denied
Unauthorized Role → Denied
```

Also test manipulated course/semester/subject filters.

---

# 78. Performance Tests

Measure:

- dashboard query time
- aggregation query time
- database query count
- large student population
- many result attempts
- many subjects
- concurrent dashboard requests

---

# 79. Database Indexing

Indexes should support actual analytics access patterns.

Potential candidates:

```text id="n7x3m5"
college_id
student_id
course_id
semester_id
subject_id
result_status
result_type
attempt_number
```

The final index strategy must be based on actual queries and execution plans.

Do not add indexes blindly.

---

# 80. Read Model Option

If analytics queries become too expensive, a dedicated analytics read model may be introduced.

Conceptually:

```text id="c5m8x2"
Authoritative Academic Data
          ↓
Aggregation Pipeline
          ↓
Analytics Read Model
          ↓
Analytics API
```

This is not required for initial MVP implementation.

---

# 81. No AI in MVP

Analytics must not silently introduce:

- prediction
- recommendation
- risk classification
- AI-generated conclusions

For example, the system should not automatically state:

```text id="m4x7q2"
"Student is likely to fail next semester."
```

without an explicitly approved predictive feature.

---

# 82. No What-If Logic

Analytics must not implement:

```text id="x8n3c5"
"If the student scores 9.0 next semester..."
```

That belongs to the future Academic What-If Simulator.

---

# 83. No Eligibility Logic

Analytics should not determine:

```text id="p7m2v9"
"Student is eligible for graduation."
```

unless a formally approved eligibility engine exists.

Analytics may display relevant academic facts, but eligibility determination belongs to the Regulation & Credit Eligibility Engine.

---

# 84. No University-Specific Assumptions

Do not hard-code assumptions such as:

```text id="c6x4m8"
fixed grade mappings
fixed CGPA formula
fixed pass marks
fixed credit requirements
fixed semester count
```

unless explicitly configured and approved for the applicable academic context.

---

# 85. API Contract Stability

Analytics response contracts should remain independent of internal SQL schema.

Do not expose:

- database column names unnecessarily
- internal table relationships
- JPA entity structures
- implementation-specific aggregation details

---

# 86. Acceptance Criteria

Analytics is acceptable when:

### Data

- [ ] Only authoritative processed data contributes.
- [ ] Missing data is not converted into zero.
- [ ] Attempt handling is explicitly defined.
- [ ] Backlog counts are correct.
- [ ] SGPA/CGPA values are authoritative.
- [ ] Credit metrics are correct.
- [ ] Aggregates do not double-count.

### Security

- [ ] Tenant isolation works.
- [ ] IDOR protection works.
- [ ] Student `/me` access works.
- [ ] Role authorization works.
- [ ] Filters cannot bypass authorization.

### APIs

- [ ] Dashboard API works.
- [ ] Student analytics API works.
- [ ] Course analytics API works.
- [ ] Semester analytics API works.
- [ ] Subject analytics API works.
- [ ] Backlog analytics API works.

### Frontend

- [ ] Dashboard works.
- [ ] Filters work.
- [ ] Charts work.
- [ ] Tables work.
- [ ] Loading states work.
- [ ] Empty states work.
- [ ] Error states work.
- [ ] Responsive behavior works.
- [ ] Accessibility requirements are met.

### Performance

- [ ] Queries are optimized.
- [ ] N+1 issues are avoided.
- [ ] Large datasets remain usable.
- [ ] Dashboard performance is acceptable.

---

# 87. Definition of Done

Analytics is implemented when:

1. Analytics query layer exists.
2. Dashboard API works.
3. Student analytics API works.
4. Course analytics API works.
5. Semester analytics API works.
6. Subject analytics API works.
7. Backlog analytics API works.
8. Authoritative-data boundary is enforced.
9. Tenant isolation passes.
10. IDOR tests pass.
11. Metric definitions are documented.
12. Attempt handling is correct.
13. Double-counting tests pass.
14. Missing-data tests pass.
15. Database queries are optimized.
16. Frontend analytics dashboard works.
17. Filters work.
18. Charts work.
19. Tables work.
20. Loading/empty/error states work.
21. Responsive behavior works.
22. Accessibility checks pass.
23. Unit tests pass.
24. Integration tests pass.
25. Security tests pass.
26. Performance tests pass.
27. No predictive/AI behavior has been introduced unintentionally.
28. No critical academic-data integrity issue remains.

---

# 88. Unresolved Implementation Decisions

The following require review:

- exact KPI list
- exact metric definitions
- attempt-counting rules
- latest-vs-historical outcome rules
- grade distribution definition
- pass-rate denominator
- credit metric definitions
- average CGPA/SGPA methodology
- exact dashboard response
- query repository strategy
- native SQL usage
- caching strategy
- cache invalidation
- analytics read model requirements
- export requirements
- minimum cohort privacy requirements
- exact analytics authorization matrix
- audit requirements for sensitive analytics access

---

# 89. Relationship With Other Documents

This document depends on:

```text id="x8m4q2"
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/database-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md

06-design/design-system.md
06-design/navigation.md
06-design/page-specifications.md
06-design/responsive-design.md

07-project-rules/coding-rules.md
07-project-rules/frontend-rules.md
07-project-rules/backend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/analytics.md
09-development/feature-specifications/result-processing.md
09-development/feature-specifications/backlog-tracking.md
09-development/feature-specifications/academic-passport.md
09-development/feature-specifications/student-portal.md

09-development/implementation-notes/result-processing-implementation.md
09-development/implementation-notes/backlog-implementation.md
09-development/implementation-notes/academic-passport-implementation.md
```

It provides implementation context for:

```text id="m7x2c8"
student-portal-implementation.md
integration-hardening.md
```

---

# 90. AI-Assisted Development Rules

AI coding assistants implementing Analytics must:

- read the Analytics feature specification first
- read Result Processing, Backlog Tracking, and Academic Passport implementation notes
- treat analytics as read-only
- use authoritative processed academic data
- never modify academic records
- never invent academic formulas
- never treat missing data as zero
- never treat missing data as failure
- distinguish students from attempts
- prevent double counting
- validate every tenant-scoped filter
- enforce authorization server-side
- protect `/me` endpoints
- prevent IDOR
- avoid N+1 queries
- avoid exposing JPA entities
- document metric definitions before implementation
- avoid predictive logic
- avoid AI-generated academic conclusions
- avoid What-If logic
- avoid eligibility decisions
- write tests using realistic multi-attempt datasets
- stop and request clarification when metric semantics are ambiguous

---

# 91. Review Checklist

Before moving this document to `Approved`:

```text id="v5n8q3"
□ Analytics ownership is clear
□ Source-of-truth boundary is clear
□ Read-only boundary is clear
□ Authoritative processed data requirement is clear
□ Student analytics is defined
□ Course analytics is defined
□ Semester analytics is defined
□ Subject analytics is defined
□ Backlog analytics is defined
□ Dashboard API is defined
□ Metric definitions are documented
□ Attempt handling is defined
□ Double-counting prevention is defined
□ Missing-data behavior is defined
□ Tenant isolation is defined
□ IDOR protection is defined
□ Filter authorization is defined
□ Query strategy is defined
□ DTO strategy is defined
□ Performance strategy is defined
□ Caching decision is documented
□ Frontend routes are defined
□ Chart strategy is defined
□ Responsive behavior is defined
□ Accessibility is defined
□ Testing strategy is defined
□ Security testing is defined
□ Performance testing is defined
□ AI/predictive boundary is explicit
□ Unresolved decisions are documented
```

---

# 92. Status

**Draft / Under Review**

This document is not yet implementation-approved.

Lifecycle:

```text id="n4x7m2"
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

# 93. Final Analytics Principle

> **Analytics explains authoritative academic data; it must never redefine it.**

The intended architecture is:

```text id="c8m5x2"
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
                    │     Analytics       │
                    │     Read Layer      │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
              Dashboard      Student       Reports
```

Analytics should provide accurate, explainable, tenant-safe academic insights while preserving the separation between authoritative academic state and derived analysis.