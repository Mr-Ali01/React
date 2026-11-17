# Student Portal Implementation

**Document:** `09-development/implementation-notes/student-portal-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Student Portal  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for the **Student Portal** in Acadlytic.

The Student Portal is the authenticated student-facing application through which students can view their academic information.

It provides access to:

- dashboard
- academic passport
- results
- backlogs
- analytics
- profile
- settings
- security/password management
- logout

The Student Portal is a **presentation and access layer**.

It does not own academic data or academic business rules.

---

# 2. Core Principle

The Student Portal answers:

> **What academic information is available to me, and where can I view it?**

The conceptual architecture is:

```text
id="s7p4k2"
Authoritative Academic Data
          ↓
Academic Services
          ↓
Student Portal APIs
          ↓
React Student Portal
          ↓
Student
```

The portal must never become an independent academic data store.

---

# 3. Scope

MVP Student Portal includes:

- authenticated student access
- student dashboard
- academic summary
- Academic Passport
- results
- backlog information
- academic analytics
- student profile
- account settings
- password change
- logout
- protected routes
- role-aware navigation
- responsive interface
- loading states
- empty states
- error states
- accessibility

---

# 4. Out of Scope

MVP does not include:

- student self-registration
- university result submission
- result editing
- marks correction
- course registration
- exam registration
- fee payment
- attendance
- hostel
- library
- placement management
- transport
- scholarship management
- AI academic assistant
- predictive risk analysis
- What-If simulator
- graduation eligibility calculation
- public academic profile
- certificate generation

These may be considered in future releases.

---

# 5. Portal Ownership

The Student Portal owns:

```text
id="m5x8q2"
Student-Facing Presentation
Navigation
Client-Side State
UI Interaction
Student Self-Service Requests
```

It does not own:

```text
id="c7n4p9"
Student Academic Identity
Academic Results
Backlogs
Academic Passport
Analytics
Academic Rules
```

Those remain owned by their respective backend modules.

---

# 6. Backend Source of Truth

The portal must consume backend APIs.

Preferred architecture:

```text
id="x4q8m2"
React
  ↓
API Client
  ↓
Spring Boot REST API
  ↓
Application Services
  ↓
Domain / Query Layer
  ↓
MySQL
```

The frontend must not connect directly to MySQL.

---

# 7. Authentication Boundary

The Student Portal is accessible only to authenticated users with the STUDENT role.

Conceptually:

```text
id="p6m3x8"
Login
  ↓
Authentication
  ↓
Authenticated Identity
  ↓
Role = STUDENT
  ↓
Student Portal
```

Authentication and authorization remain backend responsibilities.

---

# 8. Student Identity

The authenticated user account and academic student record are related but distinct concepts.

Conceptually:

```text
id="r8x2c5"
User Account
     ↓
Student Identity
     ↓
Academic Record
```

The portal must retrieve the correct student context from the backend.

It must not assume that a frontend user ID is automatically a student ID.

---

# 9. `/me` Principle

Student self-service APIs should use `/me` wherever appropriate.

Examples:

```text
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
GET /api/v1/me/profile
```

This reduces the risk of exposing arbitrary student identifiers in self-service workflows.

---

# 10. Student Portal Route

The primary application route is:

```text
/app
```

The student dashboard is:

```text
/app/dashboard
```

Other student-facing routes follow the approved navigation architecture.

---

# 11. Student Portal Navigation

The primary navigation is:

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

Navigation visibility must be role-aware.

A student must not see administrative modules such as:

- College Management
- Academic Structure Management
- Result Import
- Result Validation
- Result Processing administration

unless an explicitly approved requirement introduces such access.

---

# 12. Dashboard

The dashboard is the student's primary landing page.

It should provide a concise overview of:

```text
Academic Summary
Recent Academic Activity
Current Performance
Backlog Summary
Quick Access
```

The dashboard must not duplicate the entire Academic Passport.

---

# 13. Dashboard API

Primary endpoint:

```text
GET /api/v1/me/dashboard
```

The endpoint should provide a purpose-built dashboard response.

It should avoid forcing the frontend to make many unrelated API requests when a consolidated response is appropriate.

---

# 14. Dashboard Summary

Possible summary information:

```text
Current CGPA
Latest SGPA
Credits Earned
Open Backlogs
Semesters Completed
```

Only authoritative values should be displayed.

---

# 15. Dashboard Performance

The dashboard may display:

- recent SGPA
- CGPA trend
- latest semester result
- academic progress

Detailed analysis remains under the Analytics section.

---

# 16. Dashboard Backlog Summary

The dashboard may show:

```text
Open Backlogs: 2
```

with a link to:

```text
/app/students/:studentId/backlogs
```

or the student-facing backlog route defined by the final navigation implementation.

The dashboard must not independently calculate backlog state.

---

# 17. Dashboard Quick Actions

Potential quick actions:

```text
View Academic Passport
View Results
View Backlogs
View Analytics
View Profile
```

Quick actions must route to existing portal functionality.

---

# 18. Dashboard Empty State

If the student has no processed academic data:

```text
Your academic record is not available yet.
```

Do not display:

```text
CGPA: 0
Backlogs: 0
Credits: 0
```

unless these are authoritative values.

---

# 19. Academic Passport

The Student Portal consumes the Academic Passport.

The Passport provides:

- academic profile
- semester history
- subject results
- SGPA
- CGPA
- credits
- backlog summary
- attempt history

The portal must not rebuild Passport logic independently.

---

# 20. Passport API

The preferred student endpoint is:

```text
GET /api/v1/me/academic-passport
```

The backend determines the student's identity from authenticated context.

---

# 21. Results

The Results section provides students with their processed academic results.

Route:

```text
/app/results
```

API:

```text
GET /api/v1/me/results
```

---

# 22. Result Display

A result record may contain:

```text
Subject Code
Subject Name
Credits
Grade
Grade Point
Marks
Outcome
Semester
Attempt
Result Type
```

Only fields available from the authoritative result model should be shown.

---

# 23. Result History

Students should be able to understand repeated attempts.

Example:

```text
CS101

Attempt 1 → FAIL
Attempt 2 → PASS
```

The portal must not hide historical attempts merely because a later attempt succeeded.

---

# 24. Result Filtering

The Results page may support filters such as:

```text
Semester
Academic Year
Subject
Result Type
Outcome
```

Filters must be validated by the backend.

---

# 25. Result Sorting

Possible sorting:

```text
Semester
Subject
Result Date
Grade
Outcome
```

The exact sort options should follow the final page specification.

---

# 26. Result Pagination

If result history becomes large, the API should support pagination.

Example:

```text
GET /api/v1/me/results?page=0&size=20
```

The frontend should not request an unbounded result history by default.

---

# 27. Backlogs

The Backlogs section provides the student's unresolved and historical backlog information.

API:

```text
GET /api/v1/me/backlogs
```

The backend owns backlog state.

---

# 28. Backlog Display

The portal may show:

```text
Subject
Subject Code
Semester
Status
Attempts
Latest Attempt
Resolution Information
```

The exact fields depend on the Backlog API contract.

---

# 29. Backlog Status

Recommended statuses:

```text
OPEN
RESOLVED
```

Status should be represented using text and accessible visual indicators.

---

# 30. Backlog Attempt History

Example:

```text
Mathematics

Attempt 1
FAIL
Semester 2

Attempt 2
PASS
Semester 4

Status
RESOLVED
```

Historical information must remain visible.

---

# 31. Analytics

The Student Portal consumes student-specific analytics.

API:

```text
GET /api/v1/me/analytics
```

Possible metrics:

```text
CGPA
SGPA Trend
Credits
Pass/Fail
Backlogs
Subject Performance
```

Analytics logic remains owned by the Analytics module.

---

# 32. Analytics Presentation

The portal may display:

- KPI cards
- SGPA trend
- CGPA summary
- subject performance
- backlog summary

Charts must be understandable and responsive.

---

# 33. Profile

The Profile page provides the student's permitted profile information.

API:

```text
GET /api/v1/me/profile
PUT /api/v1/me/profile
```

Only fields explicitly allowed for student self-service may be edited.

---

# 34. Profile Fields

Potential editable fields:

```text
Email
Phone
Address
Profile Photo
```

The final editable-field list must be approved.

Academic identity fields should generally not be editable by students without an authorized correction workflow.

---

# 35. Protected Academic Identity

Students should not directly edit:

```text
Student Identifier
University Registration Number
Course
Program
College
Academic Enrollment
Academic Results
```

unless an explicit workflow supports the change.

---

# 36. Settings

Settings may include:

```text
Profile
Security
Password
```

Route:

```text
/app/settings
/app/settings/profile
/app/settings/security
```

---

# 37. Password Change

The Student Portal may provide password change functionality.

API:

```text
PUT /api/v1/me/password
```

The backend should:

1. authenticate the current user
2. verify current password where required
3. validate the new password
4. securely hash the new password
5. invalidate sessions/tokens according to the authentication strategy
6. record the security event

---

# 38. Logout

Logout endpoint:

```text
POST /api/v1/auth/logout
```

The frontend must clear appropriate local authentication state after successful logout.

---

# 39. Authentication State

The frontend needs to know whether the current session is:

```text
Loading
Authenticated
Unauthenticated
Unauthorized
```

Do not assume authentication based only on local UI state.

The backend remains authoritative.

---

# 40. Protected Routes

Student portal routes must be protected.

Conceptually:

```text
ProtectedRoute
    ↓
Authentication Check
    ↓
Role Check
    ↓
Student Portal
```

However, route guards improve UX; they do not replace backend authorization.

---

# 41. Unauthorized Behavior

If an authenticated non-student attempts to access a student-only route:

```text
403 Forbidden
```

or the appropriate application-level authorization behavior should be displayed.

---

# 42. Unauthenticated Behavior

If the user is not authenticated:

```text
401 Unauthorized
```

The frontend should redirect to:

```text
/login
```

while preserving the intended destination where safe.

---

# 43. Session Expiration

If a student's session expires:

```text
API
 ↓
401
 ↓
Frontend detects expiration
 ↓
Clear stale authentication state
 ↓
Redirect to Login
```

Avoid infinite redirect loops.

---

# 44. Tenant Isolation

Students normally belong to exactly one college tenant.

The backend must derive the tenant from trusted authenticated context.

The frontend must not be trusted to provide:

```text
collegeId
```

as the authorization mechanism.

---

# 45. IDOR Protection

The portal must avoid unnecessary arbitrary student IDs.

For student self-service, prefer:

```text
/me
```

instead of:

```text
/students/{studentId}
```

The backend must still protect every endpoint.

---

# 46. API Client

The frontend should use a centralized API client.

Conceptually:

```text
src/services/
    apiClient.ts
```

Responsibilities may include:

- base URL
- authentication handling
- JSON serialization
- error normalization
- request headers
- response handling
- timeout configuration

---

# 47. Axios

Axios may be used as the HTTP client according to the frontend architecture.

A centralized Axios instance should prevent duplicated configuration.

Avoid creating separate uncontrolled clients throughout the application.

---

# 48. TanStack Query

Server state should be managed through TanStack Query.

Conceptual hooks:

```text
useCurrentUser()
useStudentDashboard()
useMyResults()
useMyBacklogs()
useMyAcademicPassport()
useMyAnalytics()
useMyProfile()
```

---

# 49. Client State

Zustand may be used for limited client state such as:

```text
Sidebar state
UI preferences
Temporary UI state
```

Do not store authoritative academic records in global client state.

---

# 50. Query Cache

Academic data should remain primarily in TanStack Query.

Example:

```text
["me", "academic-passport"]
["me", "results"]
["me", "backlogs"]
["me", "analytics"]
```

Query keys should be consistent.

---

# 51. Query Invalidation

After profile updates:

```text
Invalidate profile query
```

After password changes:

```text
Refresh authentication state if required
```

Academic data should generally be refreshed based on backend state rather than manually mutated in the frontend cache.

---

# 52. Dashboard Data Strategy

The dashboard should use a purpose-built API where practical.

Avoid making the initial dashboard load trigger many independent requests such as:

```text
User
Passport
Results
Backlogs
Analytics
Profile
```

if the same information can be returned efficiently by the dashboard endpoint.

---

# 53. Navigation

Student navigation should contain only authorized student-facing functionality.

Suggested order:

```text
Dashboard
Academic Passport
Results
Backlogs
Analytics
Profile
Settings
```

Logout should remain visually separated from primary navigation where appropriate.

---

# 54. Active Navigation

The active route must be clearly identifiable.

The implementation should use React Router route state rather than manually comparing arbitrary URLs where possible.

---

# 55. Mobile Navigation

On smaller screens, the portal may use:

- mobile drawer
- bottom navigation
- responsive menu

The chosen pattern must follow the approved responsive design.

---

# 56. Responsive Layout

The portal must support:

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

Requirements:

- no horizontal page overflow
- touch-friendly controls
- readable tables
- responsive cards
- usable charts
- accessible mobile navigation

---

# 57. Dashboard Responsive Layout

Desktop:

```text
Summary Cards
      ↓
Main Performance Area
      ↓
Secondary Information
```

Mobile:

```text
Summary Cards
      ↓
Performance
      ↓
Backlogs
      ↓
Quick Actions
```

Exact layout follows the design system.

---

# 58. Results Responsive Layout

On desktop, results may use a table.

On mobile, use:

- responsive table
- horizontal scrolling within a bounded container
- stacked result cards
- expandable rows

Do not allow the entire page to overflow horizontally.

---

# 59. Accessibility

The Student Portal must support:

- keyboard navigation
- visible focus
- semantic headings
- accessible forms
- accessible tables
- accessible charts
- screen-reader-friendly status
- sufficient contrast
- reduced motion
- accessible error messages

---

# 60. Forms

Profile/settings forms must use:

- explicit labels
- validation messages
- required-field indicators
- keyboard accessibility
- submit/loading states
- server-side error handling

Do not rely only on placeholder text as a label.

---

# 61. Validation

Frontend validation may use Zod and React Hook Form.

However:

> Client-side validation improves UX; backend validation protects data integrity.

Every mutation must be validated server-side.

---

# 62. Error Handling

The portal should normalize backend errors into user-friendly messages.

Examples:

```text
401 → Please sign in again.
403 → You do not have permission to access this page.
404 → The requested information was not found.
422 → Please correct the highlighted fields.
500 → Something went wrong. Please try again.
```

Do not expose stack traces.

---

# 63. Loading States

Every asynchronous page should define loading behavior.

Examples:

```text
Dashboard → Skeleton
Results → Table Skeleton
Passport → Summary + Content Skeleton
Analytics → KPI + Chart Skeleton
Profile → Form Skeleton
```

---

# 64. Empty States

Examples:

### Results

```text
No academic results are available yet.
```

### Backlogs

```text
No active backlogs.
```

### Analytics

```text
Not enough processed academic data is available for analytics.
```

The exact wording can follow the design system.

---

# 65. Error States

Each major page should provide a recoverable error state.

Include:

- explanation
- retry action where appropriate
- navigation back to a safe page

---

# 66. Stale Data

If cached academic data may be stale, the UI should refresh appropriately.

Avoid presenting outdated academic information as newly processed information.

Where necessary, display an appropriate refresh or updated timestamp.

---

# 67. Profile Updates

Profile mutation flow:

```text
Form
 ↓
Client Validation
 ↓
API Request
 ↓
Backend Authorization
 ↓
Backend Validation
 ↓
Persist
 ↓
Return Updated Profile
 ↓
Invalidate/Update Query
 ↓
Success Feedback
```

---

# 68. Academic Data Mutation

The Student Portal must not provide direct mutations for:

- marks
- grades
- results
- SGPA
- CGPA
- backlogs

Academic mutations belong to authorized backend workflows.

---

# 69. Notifications

MVP may provide basic UI feedback through:

- success message
- error message
- toast
- inline validation

Push/email notifications are not part of the core Student Portal unless separately approved.

---

# 70. Security

The Student Portal must follow:

- secure authentication
- secure session/token handling
- backend authorization
- tenant isolation
- IDOR prevention
- safe API errors
- secure password handling
- no sensitive academic data in URLs unnecessarily
- no secrets in frontend source
- no authorization decisions based solely on frontend state

---

# 71. Browser Storage

Do not store sensitive authentication material in insecure browser storage unless the authentication architecture explicitly approves it.

The final authentication strategy determines whether tokens are handled through:

- secure cookies
- in-memory state
- another approved mechanism

This remains an authentication implementation decision.

---

# 72. CSRF

If authentication uses cookie-based sessions, CSRF protection must be implemented according to the approved backend security architecture.

If token-based authentication is selected, the corresponding threat model must be followed.

Do not assume one strategy without finalizing authentication architecture.

---

# 73. XSS Protection

Never inject untrusted academic/profile data using unsafe HTML rendering.

Avoid unnecessary:

```text
dangerouslySetInnerHTML
```

Any HTML rendering must be explicitly sanitized and justified.

---

# 74. Sensitive Data Exposure

Do not expose:

- password hashes
- security tokens
- internal database IDs unless required
- other students' information
- internal system metadata
- unnecessary personal data

---

# 75. Academic Privacy

A student should only see their own academic information.

Examples:

```text
Student A → own results → allowed
Student A → Student B results → denied
Student A → Student B Passport → denied
Student A → Student B analytics → denied
```

---

# 76. Frontend Architecture

The Student Portal should follow the feature-oriented frontend structure.

Relevant areas:

```text
src/
├── pages/student/
├── features/
│   ├── auth/
│   ├── passport/
│   ├── results/
│   ├── backlogs/
│   └── analytics/
├── components/
├── hooks/
├── services/
├── store/
├── types/
└── utils/
```

Exact structure follows the approved frontend architecture.

---

# 77. Feature Separation

Avoid one large:

```text
StudentDashboard.tsx
```

containing all student functionality.

Prefer feature-oriented components and pages.

---

# 78. Shared Components

Reusable components may include:

```text
StudentSummaryCard
AcademicMetricCard
ResultTable
BacklogStatusBadge
SemesterCard
EmptyState
ErrorState
LoadingSkeleton
PageHeader
```

Shared components must remain generic enough to reuse.

---

# 79. Types

Frontend API response types should be defined centrally.

Examples:

```text
Student
StudentDashboard
AcademicPassport
AcademicResult
Backlog
StudentAnalytics
StudentProfile
```

Avoid using `any` for API responses.

---

# 80. API Type Safety

API response types should correspond to backend DTO contracts.

If a backend response changes, the frontend type should be updated deliberately.

Do not silently use optional properties to hide API contract mismatches.

---

# 81. Route-Level Code Splitting

Student portal pages can be lazy-loaded.

Example:

```text
Dashboard
Passport
Results
Backlogs
Analytics
Settings
```

This keeps the initial application bundle smaller.

---

# 82. Performance

The portal should:

- lazy-load routes
- avoid unnecessary rerenders
- cache server state
- paginate large datasets
- avoid loading all academic history unnecessarily
- avoid expensive client-side calculations

---

# 83. Academic Calculations on Frontend

Do not implement authoritative:

```text
CGPA calculation
SGPA calculation
Backlog calculation
Pass/fail determination
```

in the frontend.

The frontend displays backend-authoritative values.

---

# 84. Search

If search is introduced for student results or academic records, the backend should perform the authoritative search.

Do not download the entire academic record and filter sensitive data only in the browser.

---

# 85. Deep Linking

Every Student Portal page should be directly accessible through its URL after authentication.

Examples:

```text
/app/dashboard
/app/academic-passport
/app/results
/app/backlogs
/app/analytics
/app/profile
/app/settings/security
```

---

# 86. Browser Refresh

Refreshing a protected page must not cause permanent logout solely because React state was reset.

Authentication state must be restored using the approved authentication mechanism.

---

# 87. Not Found

Unknown portal routes should display the shared application Not Found page.

Example:

```text
/app/unknown-page
```

should not render a blank page.

---

# 88. Unauthorized Page

If the user is authenticated but does not have permission:

```text
403
```

should result in the approved unauthorized experience.

---

# 89. API Retry

Do not blindly retry all requests.

Safe GET requests may use controlled retry behavior.

Mutations should not automatically retry unless idempotency is guaranteed.

---

# 90. Offline/Network Failure

For network failure:

- preserve user-entered form data where safe
- show a clear error
- provide retry
- avoid silently discarding changes

---

# 91. Testing Strategy

Student Portal testing should cover:

```text
Component Tests
Page Tests
Hook Tests
API Integration Tests
Route Tests
Accessibility Tests
Responsive Tests
Security Tests
End-to-End Tests
```

---

# 92. Authentication Tests

Test:

```text
Unauthenticated user
Authenticated student
Authenticated non-student
Expired session
Logout
Password change
```

---

# 93. Authorization Tests

Test:

```text
Student → own data → allowed
Student → another student's data → denied
Student → admin route → denied
Student → another tenant → denied
```

---

# 94. Dashboard Tests

Verify:

- summary values
- loading state
- empty state
- error state
- navigation
- responsive layout

---

# 95. Results Tests

Verify:

- results load
- filters work
- pagination works
- attempt history displays
- empty state works
- unauthorized data is inaccessible

---

# 96. Backlog Tests

Verify:

- open backlog displays
- resolved backlog displays
- attempts display
- status is correct
- no arbitrary status editing exists

---

# 97. Passport Tests

Verify:

- academic summary
- semester grouping
- subject results
- SGPA/CGPA
- credits
- backlog summary
- attempt history

---

# 98. Analytics Tests

Verify:

- student analytics load
- charts receive correct data
- missing data is handled
- no client-side academic recalculation occurs

---

# 99. Profile Tests

Verify:

- profile loads
- allowed fields can be edited
- forbidden fields cannot be edited
- validation works
- backend errors are shown

---

# 100. Accessibility Tests

Test:

- keyboard navigation
- focus order
- form labels
- table accessibility
- status accessibility
- chart alternatives
- screen-reader semantics

---

# 101. Responsive Tests

Test at:

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

Check:

- navigation
- dashboard
- results
- Passport
- backlogs
- analytics
- profile/settings

---

# 102. End-to-End Student Journey

The complete journey should work:

```text
Login
 ↓
Dashboard
 ↓
Academic Passport
 ↓
Results
 ↓
Backlogs
 ↓
Analytics
 ↓
Profile
 ↓
Settings
 ↓
Logout
```

---

# 103. Result-to-Portal Flow

Academic data should follow:

```text
University Result
      ↓
Import
      ↓
Validation
      ↓
Processing
      ↓
Authoritative Result
      ↓
Passport / Backlog / Analytics
      ↓
Student Portal
```

The Student Portal is the final presentation layer in this chain.

---

# 104. Data Refresh After Processing

After a result is processed, the student's next portal request should eventually reflect:

- new result
- updated SGPA
- updated CGPA
- updated backlog
- updated Passport
- updated analytics

The exact consistency timing depends on the approved implementation architecture.

---

# 105. No Direct Database Access

The React application must never:

- connect directly to MySQL
- contain database credentials
- execute SQL
- bypass backend APIs

---

# 106. Environment Configuration

Frontend environment variables may include:

```text
VITE_API_BASE_URL
```

Only non-secret configuration belongs in frontend environment variables.

Never expose:

```text
Database Password
JWT Secret
API Private Key
Encryption Key
```

in frontend environment variables.

---

# 107. Production Build

Production frontend should:

- use production API URL
- disable development-only debugging
- remove unnecessary console logs
- build successfully
- pass lint/type checks
- pass tests
- use optimized assets

---

# 108. Error Monitoring

If monitoring is introduced, frontend errors should include enough context for debugging without exposing sensitive student data.

Avoid sending complete academic records to error monitoring services.

---

# 109. Analytics Privacy

Student analytics data must not be accidentally sent to third-party analytics services as identifiable academic information.

Any third-party analytics integration must undergo security/privacy review.

---

# 110. Acceptance Criteria

Student Portal is acceptable when:

### Authentication

- [ ] Student can log in.
- [ ] Unauthenticated access is blocked.
- [ ] Non-student roles cannot access student-only pages.
- [ ] Logout works.
- [ ] Session expiration is handled.

### Dashboard

- [ ] Dashboard loads.
- [ ] Academic summary is correct.
- [ ] Backlog summary is correct.
- [ ] Quick navigation works.
- [ ] Loading/empty/error states work.

### Academic Passport

- [ ] Passport loads.
- [ ] Semester history is correct.
- [ ] Subject results are correct.
- [ ] SGPA/CGPA are authoritative.
- [ ] Attempts are preserved.
- [ ] Backlog state is correct.

### Results

- [ ] Results load.
- [ ] Filters work.
- [ ] Pagination works where required.
- [ ] Attempts remain visible.
- [ ] Empty/error states work.

### Backlogs

- [ ] Open backlogs display correctly.
- [ ] Resolved backlogs display correctly.
- [ ] Attempt history displays.
- [ ] Students cannot arbitrarily modify backlog state.

### Analytics

- [ ] Student analytics load.
- [ ] Metrics are correct.
- [ ] Charts are responsive.
- [ ] Missing data is handled correctly.

### Profile/Settings

- [ ] Profile loads.
- [ ] Allowed profile fields can be updated.
- [ ] Forbidden academic fields cannot be modified.
- [ ] Password change works.
- [ ] Security errors are handled.

### Security

- [ ] Tenant isolation works.
- [ ] IDOR protection works.
- [ ] Students can access only their own academic data.
- [ ] Sensitive data is not exposed.
- [ ] Backend remains the authorization boundary.

### UX

- [ ] Responsive layout works.
- [ ] Accessibility checks pass.
- [ ] Loading states work.
- [ ] Empty states work.
- [ ] Error states work.
- [ ] Deep links work.
- [ ] Browser refresh works.

---

# 111. Definition of Done

Student Portal is implemented when:

1. Student authentication works.
2. Protected routing works.
3. Student dashboard works.
4. `/me` APIs are integrated.
5. Academic Passport is integrated.
6. Results are integrated.
7. Backlogs are integrated.
8. Analytics are integrated.
9. Profile is implemented.
10. Settings are implemented.
11. Password change works.
12. Logout works.
13. Role-based navigation works.
14. Tenant isolation passes.
15. IDOR tests pass.
16. Academic privacy tests pass.
17. Loading states work.
18. Empty states work.
19. Error states work.
20. Responsive layouts work.
21. Accessibility checks pass.
22. API integration tests pass.
23. Component/page tests pass.
24. End-to-end student journey passes.
25. Production build succeeds.
26. No critical security issue remains.
27. No critical academic-data integrity issue remains.

---

# 112. Unresolved Implementation Decisions

The following require review:

- final authentication mechanism
- session/token storage strategy
- session expiration behavior
- refresh-token strategy if applicable
- exact editable profile fields
- profile-photo support
- exact student dashboard KPI list
- result filtering options
- result pagination strategy
- Passport rendering strategy
- analytics chart list
- mobile navigation pattern
- notification strategy
- third-party error monitoring
- frontend analytics/privacy policy
- API retry policy
- cache invalidation strategy

---

# 113. Relationship With Other Documents

This document depends on:

```text
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/frontend-architecture.md
05-architecture/backend-architecture.md
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

09-development/feature-specifications/student-portal.md
09-development/feature-specifications/authentication.md
09-development/feature-specifications/academic-passport.md
09-development/feature-specifications/result-processing.md
09-development/feature-specifications/backlog-tracking.md
09-development/feature-specifications/analytics.md

09-development/implementation-notes/authentication-implementation.md
09-development/implementation-notes/result-processing-implementation.md
09-development/implementation-notes/backlog-implementation.md
09-development/implementation-notes/academic-passport-implementation.md
09-development/implementation-notes/analytics-implementation.md
```

The next implementation document is:

```text
09-development/implementation-notes/integration-hardening.md
```

---

# 114. AI-Assisted Development Rules

AI coding assistants implementing the Student Portal must:

- read the Student Portal feature specification first
- read Authentication implementation
- read Academic Passport implementation
- read Backlog Tracking implementation
- read Analytics implementation
- treat the frontend as a presentation/access layer
- never treat frontend state as the authorization boundary
- use `/me` endpoints for student self-service
- never expose another student's academic data
- never trust client-provided tenant IDs
- never implement academic calculations independently
- never edit authoritative academic data from the portal
- preserve historical attempts
- never expose sensitive authentication data
- never place secrets in frontend code
- avoid direct database access
- avoid unnecessary global academic state
- use TanStack Query for server state
- use shared API/error handling
- preserve accessibility
- test cross-student and cross-tenant access
- stop and request clarification when student permissions or editable fields are undefined

---

# 115. Review Checklist

Before moving this document to `Approved`:

```text
□ Student Portal ownership is clear
□ Backend source of truth is clear
□ Authentication boundary is defined
□ Student identity mapping is defined
□ /me strategy is defined
□ Dashboard is defined
□ Academic Passport integration is defined
□ Results integration is defined
□ Backlog integration is defined
□ Analytics integration is defined
□ Profile is defined
□ Settings are defined
□ Password change is defined
□ Logout is defined
□ Protected routes are defined
□ Role-based navigation is defined
□ Tenant isolation is defined
□ IDOR protection is defined
□ API client strategy is defined
□ TanStack Query strategy is defined
□ Client-state boundary is defined
□ Responsive behavior is defined
□ Accessibility is defined
□ Error/loading/empty states are defined
□ Testing strategy is defined
□ Security testing is defined
□ Production build requirements are defined
□ Unresolved decisions are documented
```

---

# 116. Status

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

# 117. Final Student Portal Principle

> **The Student Portal should make authoritative academic information easy for a student to access without becoming an independent source of academic truth.**

The intended architecture is:

```text
                    ┌─────────────────────┐
                    │   Authentication    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Student Identity  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Student Portal API │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
        Academic           Results           Backlogs
        Passport                             
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                         ┌───────────┐
                         │ Analytics │
                         └─────┬─────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Student     │
                    │       Portal        │
                    └─────────────────────┘
```

The Student Portal is therefore the **student-facing access layer over Acadlytic's authoritative academic platform**. It should be secure, responsive, accessible, and deliberately thin: display authoritative information, provide approved self-service actions, and never bypass the domain boundaries that protect academic data.