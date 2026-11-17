# Analytics

**Project:** Acadlytic  
**Module:** Analytics  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

# 1. Purpose

The Analytics module provides academic insights and summarized information derived from authoritative data within Acadlytic.

It helps authorized users understand:

- student academic performance
- semester performance
- SGPA and CGPA trends
- backlog patterns
- pass/fail statistics
- credit completion
- course-level performance
- semester-level performance
- student-level academic summaries
- college-level academic summaries

The Analytics module converts academic records into useful metrics, visualizations, summaries, and reports.

---

# 2. Core Principle

Analytics must be a **read-only analytical layer** over authoritative academic data.

```text id="q7m3x8"
Academic Structure
       ↓
Student Records
       ↓
Processed Results
       ↓
Backlog Records
       ↓
Academic Passport
       ↓
Analytics
```

Analytics must not become an independent source of academic truth.

---

# 3. Scope

## 3.1 MVP Scope

The MVP includes:

- student-level academic analytics
- semester-level analytics
- course-level analytics
- college-level academic summaries
- SGPA trends
- CGPA summaries
- backlog statistics
- pass/fail statistics
- subject performance summaries
- credit completion summaries
- basic dashboard KPIs
- filtering
- date/academic-year filtering
- course filtering
- semester filtering
- student filtering where authorized
- role-based access
- tenant isolation
- protected APIs
- responsive analytics dashboard

---

# 3.2 Out of Scope

The following are outside the MVP:

- predictive academic analytics
- AI-generated recommendations
- machine-learning risk prediction
- automatic intervention recommendations
- advanced forecasting
- academic what-if simulation
- graduation eligibility engine
- university API analytics
- external benchmarking
- cross-college analytics for College Admin
- public academic analytics
- automated notifications
- advanced BI/data warehouse infrastructure

---

# 4. Actors

| Actor | Responsibility |
|---|---|
| SUPER_ADMIN | Platform-level analytics and permitted cross-college insights |
| COLLEGE_ADMIN | Analytics for their college |
| ACADEMIC_STAFF | Analytics according to permissions |
| STUDENT | Personal academic analytics |
| Public Visitor | No access |

---

# 5. Analytics Data Sources

Analytics should consume authoritative data from:

```text id="m5x8c2"
Students
Academic Structure
Processed Results
Backlogs
Academic Records
Academic Passport
```

Raw imported files should not be treated as authoritative analytics data.

---

# 6. Data Flow

```text id="v8q3m6"
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
Analytics
```

Only successfully processed academic information should contribute to official analytics.

---

# 7. Analytics Responsibility Boundary

Analytics answers:

> "What does the academic data tell us?"

It does not answer:

> "Is this result valid?"

That responsibility belongs to Result Validation.

It does not answer:

> "How should this result change the academic record?"

That responsibility belongs to Result Processing.

---

# 8. Academic Analytics Levels

Analytics should operate at multiple levels:

```text id="x4m7c8"
College
   ↓
Course
   ↓
Semester
   ↓
Student
   ↓
Subject
```

The user's authorization determines which level they can access.

---

# 9. Student Analytics

A student should be able to view analytics about their own academic performance.

Possible metrics:

- current CGPA
- semester SGPA
- SGPA trend
- active backlog count
- cleared backlog count
- credits earned
- semester performance
- subject performance

---

# 10. Student Analytics Example

```text id="q8v3m5"
Current CGPA: 7.64

Semester Performance:
Semester 1 → 7.42
Semester 2 → 7.85
Semester 3 → 7.61
Semester 4 → 7.70

Active Backlogs: 2
Credits Earned: 82
```

The displayed values must come from authoritative academic records.

---

# 11. Student Performance Trend

The system may visualize SGPA across semesters.

Example:

```text id="m6x2q8"
Semester 1 → 7.42
Semester 2 → 7.85
Semester 3 → 7.61
Semester 4 → 7.70
```

The trend is a visualization of stored academic data.

It must not independently recalculate SGPA.

---

# 12. CGPA Analytics

The dashboard may display:

- current CGPA
- CGPA by academic period where supported
- CGPA progression
- comparison against the student's previous semesters where meaningful

The actual CGPA must come from authoritative academic calculation.

---

# 13. Backlog Analytics

The system may display:

- active backlog count
- cleared backlog count
- historical backlog count
- backlog by semester
- backlog by subject
- backlog clearance trend

Example:

```text id="v7q3m8"
Active Backlogs: 2
Cleared Backlogs: 4
Total Historical Backlogs: 6
```

---

# 14. Course-Level Analytics

Authorized college users may view analytics for a course.

Example:

```text id="x5m8c2"
MCA

Students: 240
Average CGPA: 7.31
Active Backlogs: 48
Pass Rate: 82%
```

These values must be calculated from authorized academic records.

---

# 15. Semester Analytics

Semester-level analytics may include:

- number of students
- pass rate
- failure rate
- average SGPA
- backlog count
- credits earned
- subject performance

Example:

```text id="q3v7m5"
Semester 2

Students: 120
Pass Rate: 84%
Average SGPA: 7.42
Active Backlogs: 18
```

---

# 16. Subject Analytics

Subject-level analytics may include:

- students attempted
- pass count
- fail count
- pass rate
- average marks where available
- grade distribution
- backlog count

Example:

```text id="m8x2c6"
Database Systems

Students: 120
Pass: 105
Fail: 15
Pass Rate: 87.5%
```

Subject analytics must use the configured subject identity.

---

# 17. Pass Rate

Pass rate may be calculated as:

```text id="v4q8m2"
Pass Rate =
Passed Students
--------------
Attempted Students
× 100
```

The exact definition of "attempted" and "passed" must follow the academic data model.

The system must avoid counting duplicate attempts as separate students.

---

# 18. Failure Rate

Failure rate may be calculated as:

```text id="x7m3c8"
Failure Rate =
Failed Students
--------------
Attempted Students
× 100
```

The calculation must be consistent with the Pass Rate definition.

---

# 19. Student Counting

When calculating college/course/semester statistics, a student must normally be counted once within the relevant metric unless the metric explicitly measures attempts.

For example:

```text id="q6v8m3"
Student A
Attempt 1 → FAIL
Attempt 2 → PASS
```

A student-level pass rate should not incorrectly count this as two students.

Attempt-level analytics may count attempts separately when explicitly defined.

---

# 20. Attempt Analytics

Where required, the system may distinguish:

```text id="m4x7c2"
Student Performance
vs.
Attempt Performance
```

Student-level metrics should normally focus on current/authoritative outcomes.

Attempt-level metrics may analyze examination attempts separately.

---

# 21. Grade Distribution

Where grade information is available, Analytics may display grade distribution.

Example:

```text id="v8q3m5"
A → 25 students
B → 48 students
C → 32 students
D → 10 students
F → 5 students
```

The grade categories must come from the applicable academic configuration.

---

# 22. Credit Analytics

The system may display:

- total registered credits
- earned credits
- remaining credits where determinable
- credits by semester
- credit completion rate where defined

The system must not invent remaining-credit requirements without an applicable academic structure/rule.

---

# 23. Credit Completion

Where sufficient information exists:

```text id="x5m8q3"
Credit Completion =
Earned Credits
--------------
Required Credits
× 100
```

This metric should only be shown when required credits are authoritative and available.

Otherwise, the system should display earned credits without inventing a completion percentage.

---

# 24. College Dashboard

The College Admin dashboard may provide high-level KPIs.

Suggested MVP cards:

```text id="q7v3m8"
Total Students
Active Backlogs
Average CGPA
Pass Rate
Credits Earned
```

Only metrics supported by available authoritative data should be displayed.

---

# 25. College Performance Overview

The dashboard may include:

```text id="m8c2x5"
Student Count
Average CGPA
Average SGPA
Pass Rate
Failure Rate
Active Backlogs
```

The system should provide the academic context for each metric.

---

# 26. Course Comparison

Authorized users may compare courses within their permitted college.

Example:

| Course | Students | Avg CGPA | Pass Rate | Active Backlogs |
|---|---:|---:|---:|---:|
| MCA | 240 | 7.31 | 82% | 48 |
| MBA | 180 | 7.45 | 86% | 31 |

This feature should only be enabled where the college has multiple relevant courses.

---

# 27. Semester Comparison

Users may compare semester performance.

Example:

```text id="v6m3q8"
Semester 1 → Pass Rate 81%
Semester 2 → Pass Rate 84%
Semester 3 → Pass Rate 88%
```

The system should make the academic context explicit.

---

# 28. Subject Performance Ranking

The system may display subjects by:

- pass rate
- failure rate
- average marks
- backlog count

Example:

```text id="x8q2m5"
Highest Failure Subjects

1. Database Systems
2. Operating Systems
3. Computer Networks
```

This is descriptive analytics only.

It must not be presented as causal analysis.

---

# 29. Top/Bottom Performance

Analytics may identify:

- highest-performing subjects
- lowest-performing subjects
- highest-performing semesters
- lowest-performing semesters

The calculation criteria must be explicitly defined.

---

# 30. Student Performance Distribution

Authorized college users may view distributions such as:

```text id="m5v8c3"
CGPA Range

9.0 – 10.0
8.0 – 8.99
7.0 – 7.99
6.0 – 6.99
Below 6.0
```

The ranges must be configurable rather than hard-coded where possible.

---

# 31. Academic Year Filtering

Analytics should support academic-year filtering where the underlying records contain academic year information.

Example:

```text id="q3x7m8"
Academic Year:
2025–26
```

All metrics displayed should use the selected filter.

---

# 32. Course Filtering

Authorized users may filter analytics by course.

Example:

```text id="v8m2c5"
Course:
MCA
```

The backend must enforce that the selected course belongs to the user's permitted college context.

---

# 33. Semester Filtering

Users may filter by semester.

Example:

```text id="x4q7m3"
Semester:
Semester 2
```

---

# 34. Student Filtering

College users may search for a student and view their analytics where authorized.

Search may use:

- student ID
- university registration number
- name
- course

Student name should not be used as the authoritative identity.

---

# 35. Date Filtering

Where appropriate, analytics may support:

- academic year
- result release
- semester

Calendar date filtering should not replace academic-context filtering when academic periods are the meaningful unit.

---

# 36. Filter Combination

Filters should work together.

Example:

```text id="m8x3q6"
Academic Year: 2025–26
Course: MCA
Semester: 2
```

The resulting analytics must represent only records matching all selected filters.

---

# 37. Filter Validation

The backend must validate filters.

Invalid or unauthorized filter values must not expose data.

Example:

```text id="v5q8m2"
College A User
       ↓
Course from College B
       ↓
REJECT
```

---

# 38. Dashboard Refresh

The dashboard should provide a controlled way to refresh analytics.

The frontend should request current data rather than assuming that cached values are always current.

---

# 39. Data Freshness

Analytics should reflect successfully processed academic records.

Example:

```text id="x7m3c8"
Result Imported
       ↓
Validated
       ↓
Not Yet Processed
       ↓
Analytics unchanged
```

After successful processing:

```text id="q8v2m5"
Processed
   ↓
Analytics updated
```

---

# 40. Analytics Source of Truth

Analytics must use:

```text id="m4x7c8"
Authoritative Academic Records
```

and not:

```text id="v8q2m3"
Raw Import Files
```

or:

```text id="x5m8c2"
Frontend-calculated values
```

---

# 41. Calculation Responsibility

Analytics may calculate **aggregate metrics**.

For example:

```text id="q7v3m8"
Average CGPA
Pass Rate
Failure Rate
Student Count
Backlog Count
```

But it must not redefine academic calculations.

For example:

```text id="m6x2c8"
SGPA Formula
CGPA Formula
Grade Mapping
Pass/Fail Rules
```

belong to academic/result rules.

---

# 42. SGPA Responsibility

Analytics may aggregate or visualize SGPA values.

Example:

```text id="v4m8q2"
Average SGPA across students
```

But it must not independently calculate an individual student's SGPA using an invented formula.

---

# 43. CGPA Responsibility

Analytics may:

- display CGPA
- calculate average CGPA across students where meaningful
- group students by CGPA ranges

It must use the authoritative student CGPA.

---

# 44. Backlog Responsibility

Analytics may count and group backlogs.

It must consume the authoritative Backlog Tracking state.

It must not independently determine:

```text id="x8q3m5"
PASS → CLEAR
FAIL → CREATE
```

That belongs to Result Processing and Backlog Tracking.

---

# 45. Data Aggregation

The analytics service may aggregate:

```text id="m5v8c2"
COUNT
SUM
AVG
MIN
MAX
GROUP BY
```

according to defined business metrics.

The metric definitions must be documented and consistent.

---

# 46. Null and Missing Data

Analytics must handle missing academic data safely.

Example:

```text id="q3x7m8"
CGPA unavailable
```

should not automatically become:

```text id="v6m2c5"
CGPA = 0
```

Missing values must remain distinguishable from actual zero values.

---

# 47. Partial Data

If only some semester results are available, the analytics response should indicate that the dataset is partial where necessary.

The system must not present partial data as a complete academic history.

---

# 48. Duplicate Data

Analytics queries must avoid double-counting duplicated academic records.

Duplicate prevention should primarily be enforced at the academic data layer.

Analytics should also use appropriate query logic to prevent incorrect aggregates.

---

# 49. Historical Attempts

Analytics must define whether a metric uses:

- current/latest outcome
- all attempts
- active backlog
- historical backlog

Each metric must have a clear definition.

---

# 50. Metric Definitions

Every official dashboard metric should have a documented definition.

Example:

```text id="x8m3q5"
Metric:
Pass Rate

Definition:
Percentage of distinct students with a passing
outcome among students with an applicable result
for the selected academic context.
```

This prevents different screens from calculating the same metric differently.

---

# 51. Analytics API

A dashboard endpoint may be:

```http id="q7v3m8"
GET /api/v1/analytics/dashboard
```

It may accept filters such as:

```text id="m8x2c5"
academicYearId
courseId
semesterId
```

The exact API contract should follow API Architecture.

---

# 52. Student Analytics API

```http id="v4q8m3"
GET /api/v1/students/{studentId}/analytics
```

The endpoint must enforce student-level authorization.

---

# 53. Course Analytics API

```http id="x5m7c2"
GET /api/v1/analytics/courses/{courseId}
```

The backend must verify that the requesting user is authorized to access the course.

---

# 54. Semester Analytics API

```http id="q8v3m6"
GET /api/v1/analytics/semesters/{semesterId}
```

---

# 55. Subject Analytics API

```http id="m4x7q8"
GET /api/v1/analytics/subjects/{subjectId}
```

Subject analytics must remain within the user's authorized college context.

---

# 56. Backlog Analytics API

```http id="v8m2c5"
GET /api/v1/analytics/backlogs
```

Possible filters:

```text id="x3q7m8"
courseId
semesterId
academicYearId
subjectId
status
```

---

# 57. Analytics Response

A dashboard response may conceptually contain:

```json id="k5q8m3"
{
  "studentCount": 240,
  "averageCgpa": 7.31,
  "passRate": 82.0,
  "failureRate": 18.0,
  "activeBacklogs": 48
}
```

The actual API contract belongs to API Architecture.

---

# 58. Database Requirements

Analytics should primarily query existing authoritative tables.

Potential sources include:

```text id="v7m3x8"
students
courses
semesters
subjects
student_results
backlogs
academic_records
```

The exact schema belongs to Database Architecture.

---

# 59. Analytics Tables

A dedicated analytics table is not required for MVP unless query performance demonstrates a need.

The initial architecture should prefer querying authoritative relational data.

---

# 60. Materialized Analytics

If the dataset becomes large, future versions may use:

```text id="q4x8m2"
Operational Database
       ↓
Aggregation / ETL
       ↓
Analytics Read Model
```

This is a future performance architecture, not an MVP requirement.

---

# 61. Database Performance

Analytics queries must avoid unnecessarily expensive operations.

The implementation should consider:

- indexes
- aggregation efficiency
- pagination
- query plans
- appropriate joins
- selective filtering

---

# 62. N+1 Prevention

The backend must avoid N+1 query patterns when generating analytics.

Example of undesirable behavior:

```text id="m8v3q5"
1 query → students
100 queries → individual student results
```

Analytics should use appropriate aggregate queries or optimized data access.

---

# 63. Caching

Analytics results may be cached where appropriate.

Caching must:

- respect tenant boundaries
- respect filters
- have a clear invalidation/expiration strategy
- not expose stale data as current where freshness is required

Caching is optional for MVP.

---

# 64. Frontend Analytics Dashboard

The College Admin dashboard may contain:

```text id="x5q8m3"
┌───────────────────────────────────────┐
│ Total Students │ Avg CGPA │ Pass Rate │
├───────────────────────────────────────┤
│ SGPA Trend                             │
├───────────────────────────────────────┤
│ Backlog Overview │ Grade Distribution │
├───────────────────────────────────────┤
│ Course / Semester Performance          │
└───────────────────────────────────────┘
```

The exact visual design belongs to the Design System.

---

# 65. Student Analytics Dashboard

The Student dashboard may contain:

```text id="q7m3v8"
Current CGPA
SGPA Trend
Credits Earned
Active Backlogs
Semester Performance
Subject Performance
```

---

# 66. KPI Cards

KPI cards should clearly identify:

- metric name
- value
- academic context
- applicable period where needed

Example:

```text id="m4x8c2"
Pass Rate
82%

Academic Year:
2025–26
```

---

# 67. Charts

Potential MVP charts include:

- SGPA trend
- CGPA trend where supported
- backlog distribution
- grade distribution
- pass/fail distribution

Charts must be accessible and accompanied by meaningful text/data where required.

---

# 68. Tables

Analytics tables should support:

- sorting
- filtering
- pagination where needed
- responsive behavior

Large datasets should not be rendered entirely in the browser.

---

# 69. Loading State

Analytics dashboards must show loading states while metrics are being retrieved.

---

# 70. Empty State

Example:

```text id="v8q3m5"
No academic data is available
for the selected filters.
```

The system must distinguish this from an API error.

---

# 71. Error State

Example:

```text id="x6m2c8"
Unable to load analytics.
Please try again.
```

The UI must not display stale or fabricated metrics as current.

---

# 72. Responsive Design

Analytics must work on:

- desktop
- tablet
- mobile

Charts and tables must adapt to smaller screens.

---

# 73. Accessibility

Analytics interfaces should support:

- semantic headings
- keyboard navigation
- accessible charts
- table accessibility
- readable metric labels
- sufficient contrast
- non-color-only status indicators

---

# 74. Export

Exporting analytics to CSV/PDF is not required for MVP unless explicitly added to the product requirements.

If implemented later, exports must apply the same:

- authorization
- tenant isolation
- filtering
- metric definitions

as the dashboard.

---

# 75. Audit Requirements

Normal analytics viewing may not require a detailed audit event for every request.

However, sensitive administrative exports or report generation should be auditable when implemented.

Potential events:

```text id="q3v7m8"
ANALYTICS_VIEWED
ANALYTICS_EXPORTED
REPORT_GENERATED
```

---

# 76. Security Requirements

The Analytics module must enforce:

- authentication
- authorization
- tenant isolation
- IDOR protection
- server-side filtering
- protected APIs
- secure academic data handling
- safe logging
- export authorization

---

# 77. Tenant Isolation

Analytics queries must always include the correct tenant boundary.

Example:

```text id="m8x3q5"
College A
   ↓
College A Students
   ↓
College A Results
   ↓
College A Analytics
```

A College A user must never obtain College B metrics by changing query parameters.

---

# 78. Role-Based Analytics Access

### SUPER_ADMIN

May access permitted platform-level analytics.

### COLLEGE_ADMIN

May access analytics for their college.

### ACADEMIC_STAFF

May access analytics according to assigned permissions.

### STUDENT

May access only their own academic analytics.

### Public Visitor

No analytics access.

---

# 79. IDOR Protection

The backend must verify ownership/authorization for:

```text id="x4m7v8"
collegeId
courseId
semesterId
studentId
subjectId
```

Client-provided IDs must never be treated as authorization.

---

# 80. Metric Integrity

Analytics must have deterministic definitions.

The same filter and same underlying data should produce the same metric unless the data changes.

Metric definitions should be versioned or documented when business rules change.

---

# 81. Academic Rule Changes

If a university/regulation changes calculation rules, analytics must use the appropriate authoritative academic values.

Analytics should not silently reinterpret historical results using a newer formula.

---

# 82. Historical Data

Historical academic records should remain analytically accessible.

However, the system should distinguish:

```text id="q7m3x8"
Historical Result
```

from:

```text id="v8c2m5"
Current Academic Outcome
```

where the distinction matters.

---

# 83. Analytics and Corrections

When an academic result is corrected:

```text id="m4x8q3"
Corrected Result
      ↓
Result Processing
      ↓
Academic Record
      ↓
Analytics
```

Analytics should reflect the corrected authoritative state after successful processing.

---

# 84. Analytics and Backlogs

Analytics should consume Backlog Tracking state.

Example:

```text id="x7v3m8"
Backlog Tracking
      ↓
Active Backlog Count
      ↓
Analytics
```

The Analytics module must not independently determine backlog status.

---

# 85. Analytics and Academic Passport

Academic Passport provides a student-centric consolidated view.

Analytics provides aggregate and analytical views.

```text id="q8m2c5"
Academic Records
      ├──→ Academic Passport
      └──→ Analytics
```

Analytics should not treat the UI representation of the Passport as its database source.

---

# 86. Analytics and Result Processing

Result Processing changes authoritative academic data.

Analytics reads that data.

```text id="v5x8m3"
Result Processing
       ↓
Academic Records
       ↓
Analytics
```

Analytics must never modify result records.

---

# 87. Analytics and Result Import

Raw imported records are not official academic records.

Therefore:

```text id="m7q3x8"
Result Import
      ↓
Validation
      ↓
Processing
      ↓
Analytics
```

An imported file that has not been processed must not affect official dashboard metrics.

---

# 88. Edge Cases

## No Results

Display an appropriate empty state.

---

## Partial Results

Clearly identify incomplete academic data where necessary.

---

## No Backlogs

Display:

```text id="x4m8c2"
Active Backlogs: 0
```

Do not treat zero as missing data.

---

## Missing CGPA

Display unavailable rather than zero.

---

## Duplicate Attempts

Do not double-count students in student-level metrics.

---

## Corrected Results

Use the current authoritative result state after successful correction processing.

---

## Cross-Tenant ID

Reject unauthorized access.

---

## Unauthorized Course

Reject the request even if the course ID exists.

---

# 89. API Error Handling

Possible application errors:

```text id="q6v3m8"
ANALYTICS_ACCESS_DENIED
ANALYTICS_NOT_FOUND
INVALID_ANALYTICS_FILTER
CROSS_TENANT_ACCESS
STUDENT_ANALYTICS_ACCESS_DENIED
COURSE_ANALYTICS_ACCESS_DENIED
```

The final error taxonomy must follow centralized project rules.

---

# 90. AI Coding Agent Rules

When implementing Analytics, an AI coding agent must:

1. Read Result Processing.
2. Read Backlog Tracking.
3. Read Academic Passport.
4. Read Academic Structure.
5. Never use raw imported results as official analytics data.
6. Never modify academic records from Analytics.
7. Never calculate university-specific SGPA independently.
8. Never calculate university-specific CGPA independently.
9. Never invent pass/fail rules.
10. Never invent credit requirements.
11. Use authoritative academic records.
12. Define every official metric clearly.
13. Prevent duplicate student counting.
14. Distinguish student-level metrics from attempt-level metrics.
15. Enforce tenant isolation.
16. Enforce role-based access.
17. Prevent IDOR.
18. Validate all filters server-side.
19. Prevent N+1 database queries.
20. Use efficient aggregate queries.
21. Keep controllers thin.
22. Keep metric logic in appropriate services.
23. Reuse centralized authorization.
24. Reuse centralized error handling.
25. Reuse audit infrastructure.
26. Add metric unit tests.
27. Add authorization tests.
28. Add cross-tenant tests.
29. Add duplicate-counting tests.
30. Add filtering tests.
31. Add data-consistency tests.
32. Do not introduce machine learning into the MVP.
33. Do not introduce predictive analytics into the MVP.
34. Do not introduce a separate analytics database unless explicitly approved.
35. Follow project database and API conventions.

---

# 91. Acceptance Criteria

The module is acceptable when:

- [ ] Student analytics are available.
- [ ] College analytics are available.
- [ ] Course analytics are available where applicable.
- [ ] Semester analytics are available.
- [ ] Subject analytics are available.
- [ ] SGPA values are displayed correctly.
- [ ] CGPA values are displayed correctly.
- [ ] Pass rate is calculated consistently.
- [ ] Failure rate is calculated consistently.
- [ ] Backlog counts are correct.
- [ ] Credit metrics are correct where supported.
- [ ] Filters work correctly.
- [ ] Combined filters work correctly.
- [ ] Missing data is handled correctly.
- [ ] Duplicate attempts do not incorrectly inflate student counts.
- [ ] Only processed academic data contributes to official analytics.
- [ ] Corrections are reflected after successful processing.
- [ ] Student can access only their own analytics.
- [ ] College users can access only permitted college data.
- [ ] Cross-tenant access is blocked.
- [ ] IDOR attacks are blocked.
- [ ] Analytics cannot modify academic records.
- [ ] Dashboard loading states work.
- [ ] Empty states work.
- [ ] Error states work.
- [ ] Responsive UI works.
- [ ] Accessibility requirements are satisfied.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Security tests pass.
- [ ] QA acceptance criteria pass.

---

# 92. Test Scenarios

## Student Analytics

- Student sees own CGPA.
- Student sees semester SGPA.
- Student sees backlog count.
- Student sees credit information.
- Student cannot access another student's analytics.

## College Analytics

- College Admin sees correct student count.
- College Admin sees correct pass rate.
- College Admin sees correct backlog count.
- College Admin sees correct average CGPA.
- College Admin cannot access another college.

## Course Analytics

- Course filter returns correct data.
- Unauthorized course is rejected.
- Multiple courses can be compared where permitted.

## Semester Analytics

- Semester filter works.
- Academic year + semester filter works.
- Metrics match authoritative records.

## Subject Analytics

- Subject pass count is correct.
- Subject fail count is correct.
- Subject pass rate is correct.
- Duplicate attempts do not incorrectly double-count students.

## Backlog Analytics

- Active backlog count is correct.
- Cleared backlog count is correct.
- Backlog filtering works.

## Data Integrity

- Unprocessed imported result does not affect analytics.
- Successfully processed result affects analytics.
- Corrected result updates analytics.
- Failed processing does not produce false analytics.

## Missing Data

- Missing CGPA does not become zero.
- No-result state is handled correctly.
- Partial academic history is identified appropriately.

## Security

- Student cannot access another student's analytics.
- College Admin cannot access another college.
- Unauthorized filters are rejected.
- Manipulated IDs are rejected.

## Performance

- Aggregate queries perform efficiently.
- Large student populations do not trigger N+1 queries.
- Pagination works where required.

---

# 93. Definition of Done

Analytics is complete when:

- [ ] Analytics architecture is implemented.
- [ ] Student analytics are implemented.
- [ ] College analytics are implemented.
- [ ] Course analytics are implemented where required.
- [ ] Semester analytics are implemented.
- [ ] Subject analytics are implemented where required.
- [ ] Pass/fail metrics are implemented.
- [ ] SGPA/CGPA display is implemented.
- [ ] Backlog metrics are implemented.
- [ ] Credit metrics are implemented where supported.
- [ ] Dashboard APIs are implemented.
- [ ] Filtering is implemented.
- [ ] Tenant isolation is implemented.
- [ ] Authorization is implemented.
- [ ] IDOR protection is implemented.
- [ ] Metric definitions are documented.
- [ ] Aggregate queries are optimized.
- [ ] N+1 issues are prevented.
- [ ] Loading states are implemented.
- [ ] Empty states are implemented.
- [ ] Error states are implemented.
- [ ] Responsive UI is implemented.
- [ ] Accessibility requirements are implemented.
- [ ] Unit tests are implemented.
- [ ] Integration tests are implemented.
- [ ] Security tests are implemented.
- [ ] Performance is reviewed.
- [ ] Code review is completed.
- [ ] QA testing is completed.

---

# 94. Future Extensions

## Predictive Academic Analytics

Future versions may analyze:

- backlog risk
- CGPA decline
- SGPA decline
- credit completion risk
- repeated failures

These features require separate predictive models and validation.

---

## Academic Risk Intelligence

A future module may provide:

```text id="x8m3q5"
Academic Data
      ↓
Risk Engine
      ↓
Risk Indicators
      ↓
Academic Staff Dashboard
```

This must remain separate from basic Analytics.

---

## AI Academic Insights

Future versions may allow academic staff to ask:

```text id="q7v3m8"
Which subjects have the highest failure rate?

Which semester has the highest backlog?

Which course has the lowest average CGPA?
```

This belongs to a future AI Query layer.

---

## Academic What-If Simulator

Future analytics may support scenarios such as:

```text id="m4x8c2"
What happens to CGPA
if a student clears a backlog?
```

This belongs to the Academic What-If Simulator.

---

## Advanced Reporting

Future versions may support:

- scheduled reports
- downloadable reports
- executive reports
- department reports
- semester reports
- university-specific reports

---

## Analytics Read Model

As data volume grows, Acadlytic may introduce:

```text id="v5q8m3"
Operational Database
        ↓
Aggregation Pipeline
        ↓
Analytics Read Model
        ↓
Dashboard
```

This should only be introduced when justified by scale and performance requirements.

---

# 95. Related Documents

This module depends on:

```text id="x7m3c8"
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
09-development/feature-specifications/backlog-tracking.md
09-development/feature-specifications/academic-passport.md
```

Related modules:

```text id="m8v2q5"
student-portal.md
```

Future related modules:

```text id="x3q7m8"
regulation-engine.md
academic-risk-intelligence.md
academic-what-if.md
ai-query.md
```

---

# 96. Document Status

**Status:** Draft / Implementation Ready

This document defines the Analytics boundary of Acadlytic.

Analytics is a read/analysis layer over authoritative academic information.

Its primary responsibility is:

```text id="q8m3v5"
Authoritative Academic Data
        ↓
Aggregation
        ↓
Metrics
        ↓
Visualization
        ↓
Academic Insights
```

Analytics must not:

- modify academic results
- create backlogs
- clear backlogs
- redefine SGPA/CGPA rules
- validate imported results
- process university result files
- become an independent source of academic truth

The MVP focuses on **descriptive academic analytics**. Predictive analytics, AI insights, risk intelligence, and what-if analysis remain future extensions.