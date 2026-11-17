# Student Portal

**Project:** Acadlytic  
**Module:** Student Portal  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

# 1. Purpose

The Student Portal provides students with a secure, centralized interface for accessing their academic information within Acadlytic.

The portal allows a student to:

- access their account
- view their academic profile
- view academic results
- view semester performance
- view SGPA and CGPA
- view credits
- view active backlogs
- view cleared backlogs
- view Academic Passport
- view personal academic analytics
- manage permitted account settings
- securely log out

The Student Portal is the primary student-facing application area of Acadlytic.

---

# 2. Core Principle

The Student Portal is primarily a **presentation and interaction layer**.

It does not become the source of truth for academic information.

```text
Authentication
      ↓
Student Portal
      ↓
Academic Services
      ↓
Authoritative Academic Data
```

Academic information should come from the appropriate backend modules.

---

# 3. Scope

## 3.1 MVP Scope

The MVP includes:

- student login
- authenticated student session
- student dashboard
- student profile
- academic summary
- semester results
- subject results
- SGPA
- CGPA
- credit information
- backlog summary
- Academic Passport access
- personal academic analytics
- account settings
- password change
- logout
- protected routes
- responsive design
- loading states
- empty states
- error states

---

# 4. Out of Scope

The following are outside the MVP:

- student self-registration
- fee payment
- attendance management
- course registration
- examination registration
- hostel management
- library management
- placement management
- direct university communication
- result scraping
- result modification by students
- manual result correction
- AI academic assistant
- predictive academic risk
- Academic What-If Simulator
- public academic profile
- public Passport sharing
- digital certificate verification
- social/community features

---

# 5. Actors

| Actor | Portal Access |
|---|---|
| STUDENT | Full student portal access |
| SUPER_ADMIN | No normal student portal experience; administrative access |
| COLLEGE_ADMIN | College administration interface |
| ACADEMIC_STAFF | Academic administration interface |
| Public Visitor | No portal access |

A user with multiple roles must receive the interface appropriate to the active authorized context.

---

# 6. Student Portal Entry

The normal entry point is:

```text
/login
```

After successful authentication:

```text
Authenticated Student
        ↓
Student Portal
        ↓
Student Dashboard
```

The backend must determine the user's role from the authenticated identity.

The frontend must not decide that a user is a student merely because a URL contains `/student`.

---

# 7. Authentication Dependency

Student Portal depends on the Authentication module for:

- login
- session management
- current-user information
- logout
- password management
- account status
- role authorization

The Student Portal must not implement a second authentication system.

---

# 8. Student Identity

The portal should obtain the authenticated student's identity from the backend.

Conceptually:

```text
Authenticated User
       ↓
User Account
       ↓
Student Profile
       ↓
Student Portal
```

The portal must not trust student identifiers supplied only by the browser.

---

# 9. Student Dashboard

The dashboard is the main landing page after login.

Suggested structure:

```text
Student Dashboard
│
├── Welcome / Student Identity
│
├── Academic Summary
│
├── Current CGPA
│
├── Latest SGPA
│
├── Active Backlogs
│
├── Credits Earned
│
├── Academic Performance
│
├── Recent Results
│
└── Quick Actions
```

---

# 10. Dashboard Summary Cards

The dashboard may display:

```text
Current CGPA
Latest SGPA
Active Backlogs
Credits Earned
```

The values must come from authoritative backend data.

---

# 11. Current CGPA

The portal may display the student's current CGPA.

Example:

```text
Current CGPA
7.64
```

The Student Portal must not calculate CGPA independently.

The value must come from the authoritative academic calculation.

---

# 12. Latest SGPA

The portal may display the latest available semester SGPA.

Example:

```text
Latest SGPA
7.70
Semester 4
```

If no SGPA is available, the portal should display an appropriate unavailable state.

---

# 13. Active Backlogs

The dashboard should clearly show the student's current active backlog count.

Example:

```text
Active Backlogs
2
```

The value must come from Backlog Tracking.

---

# 14. Credits Earned

The portal may display the student's earned credits.

Example:

```text
Credits Earned
82
```

Credits must come from authoritative academic records.

---

# 15. Academic Performance Summary

The dashboard may show a compact performance visualization.

Example:

```text
Semester 1 → 7.42
Semester 2 → 7.85
Semester 3 → 7.61
Semester 4 → 7.70
```

The portal should consume SGPA values rather than independently calculating them.

---

# 16. Recent Results

The dashboard may display recently processed academic results.

Example:

```text
Latest Result
Semester 4

Database Systems     A
Operating Systems    B+
Computer Networks    B
```

Only successfully processed results should appear as official results.

---

# 17. Quick Actions

Suggested actions:

```text
View Academic Passport
View Results
View Backlogs
View Analytics
View Profile
```

---

# 18. Navigation

Suggested student navigation:

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

The final navigation structure should follow the Design System.

---

# 19. Academic Passport Access

The portal should provide direct access to:

```text
Academic Passport
```

The Academic Passport provides the student's consolidated academic history.

The portal should not duplicate all Passport logic.

---

# 20. Results Section

The Results section provides detailed student academic results.

Possible structure:

```text
Results
│
├── Semester 1
├── Semester 2
├── Semester 3
└── Semester 4
```

Each semester may expand to show subject results.

---

# 21. Semester Results

A semester result view may contain:

| Subject | Code | Credits | Grade | Result |
|---|---|---:|---|---|
| Database Systems | CS301 | 4 | A | Pass |
| Operating Systems | CS302 | 4 | B | Pass |

The exact fields depend on available academic data.

---

# 22. Subject Result Details

The student may view:

- subject code
- subject name
- credits
- marks where available
- grade
- grade point where available
- result status
- attempt information

The portal must not modify these values.

---

# 23. Attempt History

Where multiple attempts exist, the student should be able to view the academic history.

Example:

```text
Database Systems

Attempt 1
FAIL

Attempt 2
PASS
```

Historical attempts must not be silently deleted from the student's view.

---

# 24. Current Outcome

The UI should distinguish historical attempts from the current subject outcome.

Example:

```text
Historical Attempt:
FAIL

Current Outcome:
PASS
```

The current outcome comes from authoritative processed academic records.

---

# 25. Backlogs Section

The portal should provide a dedicated backlog view.

Suggested structure:

```text
Backlogs
│
├── Active Backlogs
└── Cleared Backlogs
```

---

# 26. Active Backlogs

Example:

```text
Active Backlogs: 2

Database Systems
Semester 2

Operating Systems
Semester 4
```

The active state comes from Backlog Tracking.

---

# 27. Cleared Backlogs

The student may view previously active backlogs that have been cleared.

Example:

```text
Cleared Backlogs

Data Structures
Cleared in Semester 3
```

Historical backlog information should be preserved.

---

# 28. Backlog Responsibility

The Student Portal does not decide whether a subject is a backlog.

```text
Result Processing
       ↓
Backlog Tracking
       ↓
Student Portal
```

The portal only displays the authoritative state.

---

# 29. Analytics Section

The student may access personal academic analytics.

Possible information:

- CGPA
- semester SGPA
- SGPA trend
- backlog trend
- credits earned
- subject performance

---

# 30. Student Analytics Boundary

The student must only receive analytics for their own academic data.

The portal must not provide:

- another student's analytics
- college-wide analytics
- course-wide analytics
- staff/admin analytics

unless explicitly authorized by a different role.

---

# 31. Profile Section

The student profile may display:

```text
Student Name
University Registration Number
College
University
Program
Course
Batch
Admission Year
```

Editable fields must be explicitly defined.

---

# 32. Profile Editing

The MVP should distinguish between:

### System-managed information

Examples:

- student ID
- university registration number
- college
- course
- academic batch

These should not be freely editable by the student.

### Potentially editable information

Examples may include:

- personal email
- phone number
- profile preferences

Only fields explicitly permitted by Student Management should be editable.

---

# 33. Academic Information Editing

Students must not directly edit:

- marks
- grades
- SGPA
- CGPA
- credits
- result status
- backlog status
- semester results

Academic corrections must follow an authorized administrative workflow.

---

# 34. Result Correction Request

A future workflow may allow students to submit a result discrepancy query.

For example:

```text
Student
   ↓
Report Discrepancy
   ↓
Academic Staff
   ↓
Review
   ↓
Authorized Correction
```

This is outside the MVP unless explicitly implemented.

---

# 35. Account Settings

The student may access:

- change password
- session/logout controls
- permitted account preferences

The settings page must reuse Authentication functionality.

---

# 36. Password Change

The portal may provide:

```text
Current Password
New Password
Confirm New Password
```

Password rules must come from the Authentication module.

The Student Portal must not define a separate password policy.

---

# 37. Logout

The logout action must:

- terminate the authenticated session
- clear relevant client-side authentication state
- redirect the user appropriately
- prevent access to protected student pages after logout

---

# 38. Session Expiration

If the session expires:

```text
Student Portal
      ↓
API Request
      ↓
401 Unauthorized
      ↓
Session Expired
      ↓
Redirect to Login
```

The portal should not expose protected academic information after session expiration.

---

# 39. Protected Routes

Student Portal routes must be protected.

Example:

```text
/student/dashboard
/student/passport
/student/results
/student/backlogs
/student/analytics
/student/profile
/student/settings
```

The exact route structure is determined by Frontend Architecture.

---

# 40. Frontend Authorization

The frontend may hide unauthorized navigation items for usability.

However:

> Frontend route protection is not a security boundary.

The backend must enforce authorization for every protected API.

---

# 41. Student Identity Verification

A student request such as:

```http
GET /api/v1/students/123/results
```

must verify that the authenticated user is authorized to access student `123`.

A student must not be able to change the ID to access another student's data.

---

# 42. IDOR Protection

The backend must prevent:

```text
Student A
   ↓
Change studentId=123
to
studentId=456
   ↓
Student B data
```

The request must be rejected.

---

# 43. Tenant Isolation

Students belong to a college tenant.

The portal must ensure:

```text
Student
   ↓
College
   ↓
Authorized Academic Data
```

A student must never access another college's academic information.

---

# 44. Student Data Scope

The student portal should expose only information relevant to the authenticated student.

Example:

```text
Student A
   ↓
Student A Results
Student A Backlogs
Student A Passport
Student A Analytics
```

---

# 45. API Structure

Potential APIs include:

```http
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
GET /api/v1/me/profile
PUT /api/v1/me/profile
PUT /api/v1/me/password
POST /api/v1/auth/logout
```

The exact contracts must follow API Architecture.

---

# 46. `/me` API Principle

Where possible, student-facing APIs should use the authenticated identity:

```http
GET /api/v1/me/results
```

rather than requiring the browser to supply a student ID.

This reduces unnecessary exposure of internal identifiers and simplifies authorization.

---

# 47. Dashboard API

Example:

```http
GET /api/v1/me/dashboard
```

Possible response sections:

```text
student
academicSummary
latestResult
backlogSummary
performanceSummary
```

The exact response contract belongs to API Architecture.

---

# 48. Results API

```http
GET /api/v1/me/results
```

The API should return only results belonging to the authenticated student.

---

# 49. Backlogs API

```http
GET /api/v1/me/backlogs
```

The API should return the student's authorized backlog information.

---

# 50. Academic Passport API

```http
GET /api/v1/me/academic-passport
```

The API should return the student's Academic Passport.

---

# 51. Analytics API

```http
GET /api/v1/me/analytics
```

The API should return personal academic analytics only.

---

# 52. Profile API

```http
GET /api/v1/me/profile
```

and, where editing is permitted:

```http
PUT /api/v1/me/profile
```

The backend must validate editable fields.

---

# 53. Database Responsibility

Student Portal should not require a separate student-portal database.

It should consume existing entities such as:

```text
users
students
colleges
academic_structure
student_results
backlogs
```

The exact schema belongs to Database Architecture.

---

# 54. Read Model

The dashboard may eventually use an optimized read model.

For MVP, direct service-level aggregation over authoritative records is preferred unless performance requires otherwise.

---

# 55. Data Consistency

The portal must reflect authoritative academic state.

Example:

```text
Result Processing
      ↓
Academic Record Updated
      ↓
Backlog Updated
      ↓
Passport Updated
      ↓
Analytics Updated
      ↓
Student Portal
```

---

# 56. Unprocessed Results

A result that has only been imported or validated must not appear as an official student result.

```text
Imported
   ↓
Validated
   ↓
Not Processed
   ↓
Do not display as official result
```

---

# 57. Processing Failure

If Result Processing fails:

```text
Processing Failed
      ↓
No false academic update
      ↓
Student Portal remains consistent
```

The student should not see a result that was never successfully committed.

---

# 58. Corrected Result

If an authorized academic correction is processed:

```text
Corrected Result
      ↓
Result Processing
      ↓
Academic Record
      ↓
Backlog
      ↓
Passport
      ↓
Analytics
      ↓
Student Portal
```

The portal should reflect the updated authoritative state.

---

# 59. Loading State

Every major portal page must support loading states.

Examples:

```text
Loading dashboard...
Loading results...
Loading Academic Passport...
Loading analytics...
```

---

# 60. Empty State

Examples:

```text
No academic results are available yet.
```

```text
You currently have no active backlogs.
```

```text
Academic analytics are not available yet.
```

Empty state must not be confused with system failure.

---

# 61. Error State

Example:

```text
Unable to load your academic information.
Please try again.
```

The UI should provide a retry mechanism where appropriate.

---

# 62. Offline / Network Failure

If the backend cannot be reached, the portal should display a clear network error.

It must not silently display stale academic data as current unless a deliberately designed cached-data strategy exists.

---

# 63. Responsive Design

The Student Portal must support:

- desktop
- tablet
- mobile

Tables, charts, cards, and navigation must adapt to smaller screens.

---

# 64. Mobile Navigation

The mobile portal should provide a compact navigation mechanism.

Possible navigation:

```text
Dashboard
Passport
Results
Backlogs
Analytics
Profile
```

The exact UI belongs to the Design System.

---

# 65. Accessibility

The portal should support:

- semantic HTML
- keyboard navigation
- accessible forms
- meaningful headings
- accessible tables
- accessible charts
- sufficient color contrast
- visible focus states
- screen-reader-friendly status messages

---

# 66. Notifications

In-app notifications are not required for the MVP.

Future notifications may include:

- new result available
- backlog update
- result correction
- academic announcement

---

# 67. Security Requirements

The Student Portal must enforce:

- authenticated access
- role validation
- tenant isolation
- IDOR protection
- server-side authorization
- secure session handling
- HTTPS in production
- safe error messages
- protection of academic information
- no sensitive academic data in client logs

---

# 68. Sensitive Data

The frontend should avoid storing unnecessary sensitive academic information in:

- localStorage
- sessionStorage
- URL query parameters
- browser logs

The authentication strategy should follow the project's Security Architecture.

---

# 69. API Error Handling

Possible errors include:

```text
UNAUTHORIZED
FORBIDDEN
STUDENT_NOT_FOUND
ACADEMIC_DATA_UNAVAILABLE
RESULTS_NOT_AVAILABLE
BACKLOG_DATA_UNAVAILABLE
SESSION_EXPIRED
```

The final error taxonomy must follow centralized project rules.

---

# 70. Performance Requirements

The Student Portal should load efficiently.

The implementation should:

- avoid unnecessary API requests
- avoid duplicate requests
- use efficient queries
- avoid N+1 database queries
- paginate large result histories where appropriate
- lazy-load non-critical sections where useful

---

# 71. Dashboard API Efficiency

The dashboard should avoid making many independent requests when a single optimized dashboard endpoint can provide the required summary safely.

However, the backend should not create an oversized endpoint that becomes responsible for unrelated functionality.

---

# 72. Caching

Caching may be used for suitable academic summaries.

If caching is introduced:

- student isolation must remain enforced
- tenant isolation must remain enforced
- academic updates must invalidate affected cached data
- stale academic information must not be presented as authoritative where freshness is required

Caching is optional for MVP.

---

# 73. Audit Requirements

Normal student viewing does not necessarily require an audit record for every page view.

However, sensitive actions should be auditable where required.

Potential events:

```text
STUDENT_PROFILE_UPDATED
STUDENT_PASSWORD_CHANGED
STUDENT_LOGOUT
ACADEMIC_PASSPORT_EXPORTED
```

The final audit policy follows Security Architecture.

---

# 74. Student Portal and Authentication

Authentication provides:

```text
Identity
Session
Role
Account Status
Password Management
```

Student Portal provides:

```text
Student Experience
Academic Navigation
Academic Data Presentation
```

---

# 75. Student Portal and Student Management

Student Management is responsible for:

- student identity
- student enrollment information
- academic association

Student Portal presents the information.

```text
Student Management
       ↓
Student Portal
```

---

# 76. Student Portal and Academic Passport

Academic Passport provides the consolidated academic record.

Student Portal provides access to it.

```text
Academic Passport
       ↓
Student Portal
```

The portal must not duplicate Passport business logic.

---

# 77. Student Portal and Analytics

Analytics provides academic metrics and visualizations.

Student Portal provides the student-facing presentation.

```text
Analytics
     ↓
Student Portal
```

---

# 78. Student Portal and Backlog Tracking

Backlog Tracking determines the authoritative backlog state.

Student Portal displays it.

```text
Backlog Tracking
      ↓
Student Portal
```

---

# 79. Student Portal and Result Processing

Result Processing creates/updates authoritative academic records.

Student Portal reads those records.

```text
Result Processing
      ↓
Academic Records
      ↓
Student Portal
```

---

# 80. Student Portal and Result Import

The student should not interact directly with Result Import in MVP.

Result Import is an administrative workflow.

```text
Academic Staff
      ↓
Result Import
      ↓
Result Processing
      ↓
Student Portal
```

---

# 81. Student Actions

MVP student actions include:

```text
View Dashboard
View Results
View Academic Passport
View Backlogs
View Analytics
View Profile
Update Permitted Profile Fields
Change Password
Logout
```

---

# 82. Prohibited Student Actions

Students must not:

- upload university results
- process results
- modify marks
- modify grades
- modify SGPA
- modify CGPA
- create backlogs
- clear backlogs
- change academic structure
- modify course configuration
- access another student's data
- access college administration
- access Super Admin functions

---

# 83. Account Status

If a student account is inactive/suspended:

```text
Student Login
      ↓
Account Status Check
      ↓
Access Denied
```

The portal must not allow access to protected academic information.

Account status is controlled by Authentication/User Management.

---

# 84. Deleted or Deactivated Student

If a student is deactivated, the portal should deny normal access while preserving historical academic records according to the system's retention rules.

Academic history should not be physically deleted merely because portal access is disabled.

---

# 85. Multiple Academic Records

If a student has multiple academic records due to transfer, course change, or other supported scenarios, the portal must follow the academic model defined by Student Management and Academic Structure.

It must not invent its own identity relationship.

---

# 86. Student Search

Students do not need a global student search function in MVP.

The portal should operate on the authenticated student's identity.

---

# 87. Student Dashboard Personalization

The dashboard may display:

```text
Welcome, {Student Name}
```

Personalization must not expose information belonging to other users.

---

# 88. API Authorization Rules

Every `/me` endpoint must:

1. authenticate the user
2. verify the user is a STUDENT for student-specific operations
3. resolve the associated student record
4. retrieve only authorized data
5. enforce tenant boundaries

---

# 89. AI Coding Agent Rules

When implementing Student Portal, an AI coding agent must:

1. Read Authentication.
2. Read Student Management.
3. Read Academic Passport.
4. Read Analytics.
5. Read Backlog Tracking.
6. Read Result Processing.
7. Never implement a second authentication system.
8. Never trust student IDs from the frontend.
9. Prefer `/me` APIs for student-specific data.
10. Enforce backend authorization.
11. Prevent IDOR.
12. Enforce tenant isolation.
13. Never allow students to modify academic records.
14. Never calculate SGPA independently.
15. Never calculate CGPA independently.
16. Never determine backlog state independently.
17. Use authoritative backend data.
18. Keep academic business logic out of UI components.
19. Keep API communication in service/query layers.
20. Reuse shared UI components.
21. Follow existing routing conventions.
22. Follow existing error-handling conventions.
23. Follow existing authentication state management.
24. Do not store unnecessary academic data in localStorage.
25. Avoid N+1 API/database patterns.
26. Handle loading states.
27. Handle empty states.
28. Handle error states.
29. Add authorization tests.
30. Add student data isolation tests.
31. Add cross-tenant tests.
32. Add API integration tests.
33. Add responsive UI tests where applicable.
34. Do not introduce AI functionality into MVP.
35. Do not introduce student self-registration into MVP.
36. Do not implement future features unless explicitly requested.

---

# 90. Acceptance Criteria

The Student Portal is acceptable when:

- [ ] Student can log in.
- [ ] Student can access the dashboard.
- [ ] Student identity is displayed correctly.
- [ ] Current CGPA is displayed correctly.
- [ ] Latest SGPA is displayed correctly where available.
- [ ] Active backlog count is displayed correctly.
- [ ] Credits are displayed correctly where available.
- [ ] Student can view semester results.
- [ ] Student can view subject results.
- [ ] Attempt history is available where applicable.
- [ ] Student can view active backlogs.
- [ ] Student can view cleared backlogs.
- [ ] Student can access Academic Passport.
- [ ] Student can access personal Analytics.
- [ ] Student can view permitted profile information.
- [ ] Student can change password.
- [ ] Student can log out.
- [ ] Protected routes are enforced.
- [ ] Session expiration is handled.
- [ ] Student cannot access another student's data.
- [ ] Cross-tenant access is blocked.
- [ ] Students cannot modify academic results.
- [ ] Unprocessed results are not displayed as official results.
- [ ] Corrected results appear after successful processing.
- [ ] Loading states work.
- [ ] Empty states work.
- [ ] Error states work.
- [ ] Responsive design works.
- [ ] Accessibility requirements are satisfied.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Security tests pass.
- [ ] QA acceptance criteria pass.

---

# 91. Test Scenarios

## Authentication

- Valid student can log in.
- Invalid credentials are rejected.
- Suspended student cannot access the portal.
- Logout terminates access.
- Expired session redirects to login.

## Dashboard

- Student name is correct.
- CGPA is correct.
- Latest SGPA is correct.
- Backlog count is correct.
- Credits are correct.
- Recent results are correct.

## Results

- Student sees own results.
- Semester filtering works.
- Subject details are correct.
- Historical attempts are visible.
- Unprocessed results are not displayed.

## Backlogs

- Active backlogs are correct.
- Cleared backlogs are correct.
- Backlog updates appear after successful processing.

## Academic Passport

- Student can open Passport.
- Passport data matches authoritative academic records.
- Student cannot open another student's Passport.

## Analytics

- Student sees personal analytics.
- SGPA trend is correct.
- CGPA is correct.
- Backlog metrics are correct.
- No college-wide analytics are exposed.

## Profile

- Student can view profile.
- Editable fields can be updated.
- Protected academic fields cannot be modified.

## Security

- Student cannot access another student by changing an ID.
- Student cannot access another college.
- Student cannot call administrative APIs.
- Student cannot modify academic results.
- Frontend restrictions cannot bypass backend authorization.

## UI

- Dashboard works on desktop.
- Dashboard works on mobile.
- Tables are responsive.
- Loading states work.
- Empty states work.
- Error states work.
- Keyboard navigation works.

---

# 92. Definition of Done

Student Portal is complete when:

- [ ] Authentication integration is implemented.
- [ ] Student dashboard is implemented.
- [ ] Academic summary is implemented.
- [ ] Results section is implemented.
- [ ] Backlog section is implemented.
- [ ] Academic Passport integration is implemented.
- [ ] Analytics integration is implemented.
- [ ] Student profile is implemented.
- [ ] Password change is implemented.
- [ ] Logout is implemented.
- [ ] Protected routing is implemented.
- [ ] Backend authorization is implemented.
- [ ] IDOR protection is implemented.
- [ ] Tenant isolation is implemented.
- [ ] Loading states are implemented.
- [ ] Empty states are implemented.
- [ ] Error states are implemented.
- [ ] Responsive UI is implemented.
- [ ] Accessibility requirements are implemented.
- [ ] API integration is implemented.
- [ ] Unit tests are implemented.
- [ ] Integration tests are implemented.
- [ ] Security tests are implemented.
- [ ] Performance is reviewed.
- [ ] Code review is completed.
- [ ] QA testing is completed.

---

# 93. Future Extensions

## Student Notifications

Future notifications may include:

- new result available
- result correction
- backlog status change
- academic announcements

---

## Result Discrepancy Requests

Students may eventually report:

```text
Incorrect Mark
Incorrect Grade
Missing Result
Incorrect Subject
```

These requests can be routed to Academic Staff.

---

## Academic What-If Simulator

Students may eventually simulate:

```text
Expected CGPA
Backlog clearance impact
Target CGPA
Required future performance
```

This should be a separate feature module.

---

## AI Academic Assistant

Future versions may allow students to ask:

```text
What is my current CGPA?

Which subjects do I have backlogs in?

How has my SGPA changed?

Which semester was my best?
```

The AI layer must retrieve authoritative academic data and must not invent academic information.

---

## Digital Academic Passport

Future versions may support:

- verified digital Passport
- PDF Passport
- shareable academic record
- QR verification
- controlled third-party access

---

## Academic Risk Intelligence

Future versions may provide:

- risk indicators
- backlog risk
- performance decline
- academic intervention signals

This should remain separate from the basic Student Portal.

---

# 94. Related Documents

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
09-development/feature-specifications/backlog-tracking.md
09-development/feature-specifications/academic-passport.md
09-development/feature-specifications/analytics.md
```

---

# 95. Document Status

**Status:** Draft / Implementation Ready

This document defines the Student Portal boundary of Acadlytic.

The Student Portal is the primary authenticated student-facing interface.

Its responsibility is:

```text
Authenticate Student
        ↓
Identify Student
        ↓
Retrieve Authorized Academic Data
        ↓
Present Academic Information
        ↓
Provide Student Account Controls
```

The Student Portal must not:

- modify academic records
- calculate university-specific SGPA
- calculate university-specific CGPA
- create or clear backlogs
- validate university result files
- process result imports
- manage academic structure
- provide administrative analytics
- expose another student's data

The Student Portal consumes authoritative information from:

```text
Authentication
Student Management
Academic Structure
Result Processing
Backlog Tracking
Academic Passport
Analytics
```

and provides the student with a secure, centralized academic experience.