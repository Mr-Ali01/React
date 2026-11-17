# Acadlytic — Frontend Architecture

**Project:** Acadlytic  
**Document:** Frontend Architecture  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  
**Frontend:** React  
**Language:** TypeScript  
**Build Tool:** Vite  
**Styling:** Tailwind CSS  
**Backend:** Java + Spring Boot  
**Database:** MySQL  
**API:** REST API  

---

# 1. Purpose

This document defines the frontend architecture of Acadlytic.

It describes:

- React application structure
- page organization
- routing
- layouts
- feature modules
- reusable components
- state management
- API communication
- authentication state
- authorization-aware UI
- tenant-aware behavior
- forms and validation
- loading and error handling
- data fetching
- caching
- responsive design
- accessibility
- frontend security
- testing
- frontend development rules

The frontend must provide a maintainable interface for Super Admins, College Admins, Academic Staff, and Students.

---

# 2. Frontend Architecture Goals

The frontend must provide:

- clear feature boundaries
- reusable components
- predictable routing
- consistent UI
- secure access control
- centralized API communication
- reliable server-state management
- responsive interfaces
- accessible components
- consistent form validation
- predictable loading/error states
- minimal duplication
- maintainable React code

---

# 3. Frontend Technology Stack

The initial frontend stack is:

| Technology | Purpose |
|---|---|
| React | UI framework |
| TypeScript | Type-safe JavaScript |
| Vite | Development/build tooling |
| Tailwind CSS | Styling |
| React Router | Routing |
| TanStack Query | Server-state/data fetching |
| Zustand | Lightweight client-state management |
| React Hook Form | Form management |
| Zod | Schema validation |
| Axios | HTTP client |
| Recharts | Charts and analytics |
| Lucide React | Icons |

The exact library versions should be locked in `package.json`.

---

# 4. Frontend Architecture Style

Acadlytic will use a:

> **Feature-Oriented React Architecture**

The application should be organized primarily around business features rather than creating one large global component structure.

Conceptually:

```text
React Application
       │
       ├── App / Routing
       │
       ├── Shared UI
       │
       ├── Authentication
       │
       ├── College Management
       │
       ├── Student Management
       │
       ├── Academic Structure
       │
       ├── Results
       │
       ├── Backlogs
       │
       ├── Academic Passport
       │
       └── Analytics
```

---

# 5. Frontend Application Flow

The general application flow is:

```text
Browser
   ↓
React Application
   ↓
Router
   ↓
Authentication State
   ↓
Protected Route
   ↓
Page
   ↓
Feature Component
   ↓
API Service / Query
   ↓
Spring Boot REST API
   ↓
Response
   ↓
TanStack Query / Local State
   ↓
UI
```

---

# 6. Frontend Project Structure

Recommended structure:

```text
frontend/
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── router/
│   │   ├── providers/
│   │   └── layouts/
│   │
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── college/
│   │   └── student/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── colleges/
│   │   ├── students/
│   │   ├── academic/
│   │   ├── results/
│   │   ├── backlogs/
│   │   ├── passport/
│   │   └── analytics/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── shared/
│   │   └── layouts/
│   │
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   └── styles/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

---

# 7. App Layer

The `app/` directory contains application-level configuration.

```text
app/
├── router/
├── providers/
└── layouts/
```

Responsibilities include:

- application initialization
- routing
- global providers
- authentication provider
- query provider
- theme provider
- application layouts

Business-specific logic should not be placed here unless it is genuinely application-wide.

---

# 8. Providers

Global providers may include:

```text
QueryClientProvider
AuthProvider
ThemeProvider
RouterProvider
```

Conceptually:

```text
App
 │
 ├── Router
 │
 ├── Query Provider
 │
 ├── Auth Provider
 │
 └── Theme Provider
```

Only globally required providers should be placed here.

---

# 9. Routing

React Router will manage frontend routes.

Routes should be organized according to user roles and application areas.

Conceptually:

```text
/
├── public
├── auth
├── admin
├── college
└── student
```

---

# 10. Public Routes

Public pages may include:

```text
/
 /about
 /features
 /contact
 /login
```

The exact public website routes depend on the final product design.

Public routes must not expose protected academic information.

---

# 11. Authentication Routes

Authentication-related pages may include:

```text
/login
/forgot-password
/reset-password
/change-password
```

Account activation/invitation routes may be added if required by the account-provisioning flow.

---

# 12. Super Admin Routes

Conceptually:

```text
/admin
/admin/dashboard
/admin/colleges
/admin/colleges/:collegeId
/admin/universities
/admin/users
/admin/settings
```

Only routes required by the MVP should be implemented.

---

# 13. College Admin Routes

Conceptually:

```text
/college
/college/dashboard
/college/students
/college/students/:studentId
/college/academic
/college/results
/college/results/import
/college/results/:importId
/college/backlogs
/college/analytics
/college/settings
```

The exact route hierarchy should follow the final navigation specification.

---

# 14. Student Routes

Conceptually:

```text
/student
/student/dashboard
/student/academic-passport
/student/results
/student/backlogs
/student/analytics
/student/profile
/student/settings
```

Students should access their own academic information through `/me` APIs where appropriate.

---

# 15. Protected Routes

Protected routes must verify authentication.

Conceptually:

```text
Route
 ↓
Is authenticated?
 ↓
No → Login
 ↓
Yes
 ↓
Check authorization
 ↓
Allow / Deny
```

Frontend route protection improves UX but does not replace backend authorization.

---

# 16. Authorization-Aware UI

The frontend may hide or disable features that a user is not allowed to use.

Example:

```text
SUPER_ADMIN
    → College Management

COLLEGE_ADMIN
    → Student Management
    → Result Import

ACADEMIC_STAFF
    → Academic Operations

STUDENT
    → Own Academic Data
```

However:

> **UI authorization is not security.**

The Spring Boot backend must enforce the actual permission.

---

# 17. Role-Based Navigation

Navigation should be generated according to the authenticated user's role where practical.

Example:

```text
User
 ↓
Role
 ↓
Navigation Configuration
 ↓
Visible Navigation
```

Avoid scattering role checks throughout unrelated components.

---

# 18. Tenant-Aware Frontend

The frontend must respect the authenticated user's college context.

For College Admin and Academic Staff:

```text
Authenticated User
        ↓
College Context
        ↓
College-specific APIs
        ↓
College-specific UI
```

The frontend must not allow a user to arbitrarily switch to another college unless the backend explicitly supports that capability.

---

# 19. Student `/me` Pattern

Student self-service should prefer APIs such as:

```text
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

This reduces unnecessary exposure of student IDs in frontend URLs and complements backend IDOR protection.

---

# 20. Feature Architecture

Each major business feature should contain its own frontend logic.

Example:

```text
features/students/
├── api/
├── components/
├── hooks/
├── schemas/
├── types/
└── utils/
```

This prevents unrelated features from becoming tightly coupled.

---

# 21. Authentication Feature

Example:

```text
features/auth/
├── api/
│   └── authApi.ts
├── components/
│   ├── LoginForm.tsx
│   └── PasswordForm.tsx
├── hooks/
├── schemas/
├── types/
└── utils/
```

Authentication-specific UI and logic should remain inside this feature.

---

# 22. College Feature

Example:

```text
features/colleges/
├── api/
├── components/
│   ├── CollegeForm.tsx
│   ├── CollegeTable.tsx
│   └── CollegeStatusBadge.tsx
├── hooks/
├── schemas/
├── types/
└── utils/
```

---

# 23. Student Feature

Example:

```text
features/students/
├── api/
├── components/
│   ├── StudentForm.tsx
│   ├── StudentTable.tsx
│   ├── StudentProfile.tsx
│   └── StudentFilters.tsx
├── hooks/
├── schemas/
├── types/
└── utils/
```

---

# 24. Academic Feature

The Academic feature may contain:

```text
features/academic/
├── api/
├── components/
├── hooks/
├── schemas/
├── types/
└── utils/
```

It may cover:

- courses
- academic years
- semesters
- subjects
- academic structure

---

# 25. Result Feature

The Result feature is expected to be one of the largest frontend modules.

Possible structure:

```text
features/results/
├── api/
├── components/
│   ├── ResultTable.tsx
│   ├── ResultFilters.tsx
│   ├── ImportUploader.tsx
│   ├── ImportPreview.tsx
│   ├── ValidationSummary.tsx
│   └── ProcessingStatus.tsx
├── hooks/
├── schemas/
├── types/
└── utils/
```

---

# 26. Backlog Feature

```text
features/backlogs/
├── api/
├── components/
│   ├── BacklogTable.tsx
│   ├── BacklogStatusBadge.tsx
│   └── BacklogSummary.tsx
├── hooks/
├── types/
└── utils/
```

Backlog UI should display authoritative backlog information from the backend.

---

# 27. Academic Passport Feature

```text
features/passport/
├── api/
├── components/
│   ├── PassportHeader.tsx
│   ├── AcademicSummary.tsx
│   ├── SemesterTimeline.tsx
│   ├── SemesterResult.tsx
│   └── AttemptHistory.tsx
├── hooks/
└── types/
```

The frontend should not calculate the official academic values.

---

# 28. Analytics Feature

```text
features/analytics/
├── api/
├── components/
│   ├── KpiCard.tsx
│   ├── SgpaTrendChart.tsx
│   ├── BacklogChart.tsx
│   ├── PassRateChart.tsx
│   └── GradeDistribution.tsx
├── hooks/
├── types/
└── utils/
```

Analytics components should consume backend-provided metrics.

---

# 29. Pages vs Features

The architecture should distinguish:

> **Page = route-level composition**

from:

> **Feature = business functionality**

Example:

```text
StudentDashboardPage
       ↓
AcademicSummary
       ↓
BacklogSummary
       ↓
SgpaTrend
       ↓
RecentResults
```

The page composes features/components rather than containing all business logic itself.

---

# 30. Shared Components

Shared components should be placed under:

```text
components/shared/
```

Examples:

```text
PageHeader
EmptyState
LoadingState
ErrorState
ConfirmDialog
SearchInput
DataTable
Pagination
StatusBadge
```

These should be reusable across features.

---

# 31. UI Components

Primitive reusable UI components belong under:

```text
components/ui/
```

Examples:

```text
Button
Input
Select
Dialog
Dropdown
Tabs
Card
Badge
Tooltip
Table
Checkbox
```

These should remain generic.

---

# 32. UI vs Business Components

A UI component should not contain business rules.

Bad:

```text
Button
    ↓
Calculates CGPA
```

Good:

```text
AcademicSummary
    ↓
Displays backend-provided CGPA
```

---

# 33. Layout Architecture

Layouts should be separated from individual pages.

Possible layouts:

```text
PublicLayout
AuthLayout
AdminLayout
CollegeLayout
StudentLayout
```

Example:

```text
CollegeLayout
├── Sidebar
├── Header
├── Breadcrumbs
└── Main Content
```

---

# 34. Responsive Layout

The application must support:

- desktop
- laptop
- tablet
- mobile

Tailwind responsive utilities should be used consistently.

The layout should not depend on fixed desktop-only dimensions.

---

# 35. Navigation Architecture

Navigation should support:

- role-aware items
- active route state
- nested navigation
- mobile navigation
- breadcrumbs where useful
- accessible keyboard navigation

Navigation configuration should preferably be centralized.

---

# 36. API Layer

API communication should be centralized.

Recommended structure:

```text
services/
├── apiClient.ts
├── authApi.ts
├── collegeApi.ts
├── studentApi.ts
├── academicApi.ts
├── resultApi.ts
├── backlogApi.ts
├── passportApi.ts
└── analyticsApi.ts
```

Alternatively, API functions can live inside each feature.

The final structure should avoid duplicate API-client logic.

---

# 37. Axios Client

A centralized Axios client may handle:

- base URL
- headers
- authentication
- response parsing
- common errors
- request correlation
- interceptors

Example conceptual flow:

```text
Feature API
    ↓
apiClient
    ↓
Axios
    ↓
Spring Boot API
```

---

# 38. API Base URL

The frontend should not hard-code environment-specific API URLs.

Use environment configuration.

Example:

```text
VITE_API_BASE_URL
```

Possible environments:

```text
Development
Staging
Production
```

---

# 39. Server State

Server-provided data should primarily be managed using:

> **TanStack Query**

Examples:

- students
- results
- backlogs
- academic structure
- analytics
- dashboard data

This provides:

- caching
- refetching
- loading states
- error handling
- query invalidation

---

# 40. Client State

Client-only state may use:

> **Zustand**

Examples:

- sidebar state
- theme
- temporary UI preferences
- selected filters where appropriate
- modal state
- non-server application state

Do not store all server data in Zustand.

---

# 41. Server State vs Client State

Use this rule:

```text
Server-owned data
        ↓
TanStack Query

UI/application state
        ↓
Zustand / React State
```

Example:

```text
Student results → TanStack Query

Sidebar open/closed → React State / Zustand
```

---

# 42. Authentication State

Authentication state should have a centralized source.

It may contain:

```text
user
role
college context
authentication status
```

The frontend should retrieve the current authenticated user from the backend rather than trusting stale local storage information.

---

# 43. Token / Session Handling

The final authentication architecture must determine whether the application uses:

- secure cookie-based sessions
- access/refresh tokens
- another Spring Security-supported mechanism

The frontend architecture should remain compatible with the selected backend strategy.

Do not hard-code the authentication mechanism prematurely.

---

# 44. Sensitive Storage

Sensitive authentication credentials should not be stored insecurely in browser storage.

The final authentication strategy must define:

- credential storage
- session persistence
- token handling
- logout behavior
- expiration behavior

Security decisions belong to the authentication architecture.

---

# 45. API Error Handling

The frontend should normalize API errors.

Example:

```text
API Error
   ↓
apiClient
   ↓
Error normalization
   ↓
Feature / Hook
   ↓
UI Error State
```

The UI should display user-friendly messages rather than raw server errors.

---

# 46. HTTP Error Handling

The frontend should handle common statuses:

```text
400
401
403
404
409
422
429
500
503
```

Example:

```text
401 → Authentication required
403 → Access denied
404 → Resource not found
409 → Conflict
422 → Validation error
500 → Server error
```

---

# 47. Authentication Error Flow

If the backend returns an authentication failure:

```text
API
 ↓
401
 ↓
Auth Handler
 ↓
Clear invalid authentication state
 ↓
Redirect to Login
```

The exact behavior depends on the final authentication strategy.

---

# 48. Authorization Error Flow

For:

```text
403 Forbidden
```

the frontend should show an appropriate access-denied state.

It should not attempt to bypass the backend restriction.

---

# 49. Loading States

Every asynchronous feature should define a loading state.

Examples:

```text
Skeleton
Spinner
Loading table
Loading card
Progress indicator
```

Avoid blank screens while data is loading.

---

# 50. Empty States

Empty data must have an intentional UI.

Examples:

```text
No students found.
No backlogs.
No results available.
No imports yet.
No analytics data.
```

Empty state should not be confused with an error.

---

# 51. Error States

Pages and components consuming APIs must define error behavior.

Example:

```text
Failed to load students.
[Retry]
```

Errors should be recoverable where possible.

---

# 52. Form Architecture

Forms should use:

```text
React Hook Form
+
Zod
```

Conceptual flow:

```text
User Input
   ↓
React Hook Form
   ↓
Zod Validation
   ↓
API Request
   ↓
Backend Validation
   ↓
Success / Error
```

Frontend validation improves UX but does not replace backend validation.

---

# 53. Form Validation Rule

Every important form should have:

- required-field validation
- format validation
- length validation
- user-friendly messages
- server-error handling
- submit/loading state
- success feedback

---

# 54. Backend Validation Remains Authoritative

For example:

```text
Frontend:
"College code is available."

Backend:
"College code already exists."
```

The backend response remains authoritative.

The frontend must gracefully handle the conflict.

---

# 55. Result Import UI

Result import should support:

```text
Upload
 ↓
File validation
 ↓
Column mapping
 ↓
Preview
 ↓
Validation
 ↓
Validation summary
 ↓
Processing
 ↓
Completion
```

The frontend must not process thousands of result rows as the authoritative processing engine.

---

# 56. Import Progress

Large imports should display job progress where supported.

Example:

```text
Importing Results

Records processed:
4,500 / 10,000

Valid:
4,320

Errors:
180

Status:
PROCESSING
```

The frontend retrieves status from the backend.

---

# 57. Long-Running Operations

The frontend must support asynchronous operations.

Example:

```text
POST /result-imports
       ↓
202 Accepted
       ↓
Job ID
       ↓
Poll / subscribe for status
       ↓
Completed
```

The exact polling strategy should avoid excessive API requests.

---

# 58. Result Validation UI

Validation should clearly distinguish:

```text
VALID
INVALID
WARNING
DUPLICATE
```

The UI should provide:

- total records
- valid records
- invalid records
- warning count
- error details
- row information
- affected field where available

---

# 59. Result Processing UI

Processing state should be visible.

Possible states:

```text
READY
PROCESSING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

The UI must not imply success before the backend confirms successful processing.

---

# 60. Academic Passport UI

The Academic Passport should display:

```text
Student Identity
Program
Academic Summary
CGPA
SGPA
Credits
Backlog Summary
Semester Timeline
Subject Results
Attempt History
```

The values should come from backend APIs.

---

# 61. Analytics UI

Analytics pages may contain:

```text
KPI Cards
Charts
Tables
Filters
Date / Academic Year filters
Course filters
Semester filters
Student filters
```

Filters should be sent to the backend where the dataset is large.

---

# 62. Chart Architecture

Charts should consume structured API responses.

Example:

```json
{
  "labels": ["Semester 1", "Semester 2"],
  "values": [7.8, 8.2]
}
```

The frontend should not reconstruct official academic metrics from raw results unless explicitly required for presentation.

---

# 63. Data Tables

Reusable tables should support:

- pagination
- sorting
- filtering
- search
- loading state
- empty state
- error state
- responsive behavior

Large datasets should use server-side pagination.

---

# 64. Search Architecture

For large datasets:

```text
Search Input
    ↓
Debounce
    ↓
API Request
    ↓
Backend Search
    ↓
Paginated Results
```

Do not load the entire student database into the browser.

---

# 65. Filtering

Filters should be represented predictably.

Example:

```text
academicYear
course
semester
status
search
page
size
sort
```

The frontend should serialize filters consistently.

---

# 66. Query Keys

TanStack Query keys should uniquely represent query parameters.

Conceptually:

```text
["students", { page, size, search, status }]
```

This prevents unrelated cached queries from being mixed.

---

# 67. Cache Invalidation

After mutations, related queries should be invalidated or updated.

Example:

```text
Create Student
      ↓
Invalidate students list
      ↓
Refetch
```

Similarly:

```text
Process Result
      ↓
Invalidate
 ├── Results
 ├── Backlogs
 ├── Passport
 └── Analytics
```

The backend remains the source of truth.

---

# 68. Optimistic Updates

Optimistic UI updates should only be used when:

- failure can be handled safely
- the operation is reversible
- temporary inconsistency is acceptable

Do not use optimistic updates for critical academic processing unless explicitly justified.

---

# 69. Academic Data Safety

The frontend must treat academic data as sensitive and authoritative.

Do not allow the frontend to directly modify:

- processed results
- official SGPA
- official CGPA
- backlog status
- academic history

unless the backend provides an explicitly authorized workflow.

---

# 70. Academic Calculation Rule

The frontend should not independently define university-specific SGPA/CGPA formulas.

Example:

```text
Backend
  ↓
Official Academic Calculation
  ↓
API
  ↓
Frontend Display
```

This prevents frontend/backend calculation inconsistencies.

---

# 71. Type Architecture

TypeScript types should represent API contracts.

Example:

```text
types/
├── auth.ts
├── college.ts
├── student.ts
├── academic.ts
├── result.ts
├── backlog.ts
├── passport.ts
└── analytics.ts
```

Types should remain aligned with backend DTO contracts.

---

# 72. API Type Safety

Where practical, API response types should be explicitly typed.

Avoid:

```typescript
const data: any = ...
```

Use:

```typescript
const data: StudentResponse = ...
```

Avoid unnecessary use of `any`.

---

# 73. Constants

Application constants should be centralized.

Examples:

```text
ROLE
RESULT_STATUS
BACKLOG_STATUS
IMPORT_STATUS
ROUTES
QUERY_KEYS
```

Do not duplicate string literals throughout the application.

---

# 74. Utility Functions

Shared utility functions may be placed under:

```text
utils/
```

Examples:

```text
formatDate
formatNumber
formatPercentage
formatApiError
buildQueryParams
```

Utilities must remain generic.

Business-specific logic belongs in the relevant feature.

---

# 75. Date and Time Handling

The frontend should respect the backend timestamp strategy.

Backend timestamps are expected to be UTC.

The frontend converts timestamps for display where appropriate.

Example:

```text
Backend
2026-10-04T12:00:00Z

       ↓

User Interface
04 Oct 2026, 5:30 PM
```

The frontend must not silently change the stored source value.

---

# 76. Accessibility

The frontend must follow accessibility principles.

Requirements include:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- appropriate ARIA usage
- sufficient contrast
- accessible forms
- accessible dialogs
- accessible tables

ARIA should supplement semantic HTML rather than replace it.

---

# 77. Responsive Design

The UI should be designed mobile-first where appropriate.

Major layouts must support:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Complex tables should provide an appropriate mobile representation rather than forcing horizontal overflow everywhere.

---

# 78. Theme Architecture

If light/dark mode is implemented, theme state should be centralized.

Conceptually:

```text
Theme State
   ↓
Root HTML / Theme Provider
   ↓
Tailwind Theme
   ↓
Application
```

Components should not independently manage global theme state.

---

# 79. Frontend Security Rules

The frontend must:

- never contain database credentials
- never contain server secrets
- never trust client-side authorization
- never expose sensitive tokens unnecessarily
- validate user input for UX
- avoid dangerous HTML injection
- handle authentication expiry
- avoid exposing sensitive academic data in public routes

---

# 80. XSS Prevention

React's default rendering behavior should be preferred.

Avoid unnecessary use of:

```text
dangerouslySetInnerHTML
```

If HTML must be rendered, it must be sanitized through an appropriate trusted mechanism.

---

# 81. Environment Variables

Frontend environment variables must contain only values that are safe to expose to the browser.

Example:

```text
VITE_API_BASE_URL
```

Do not place:

```text
database password
private API key
JWT signing secret
server credentials
```

in frontend environment variables.

---

# 82. Error Boundary

React error boundaries should be considered for application-level rendering failures.

Conceptually:

```text
React Application
      ↓
Error Boundary
      ↓
Fallback UI
```

A component crash should not necessarily produce a completely blank application.

---

# 83. Frontend Logging

Frontend logging should support debugging without exposing sensitive information.

Do not log:

- passwords
- access tokens
- sensitive student information
- private academic records unnecessarily

Production logging should be controlled.

---

# 84. Performance

The frontend should consider:

- code splitting
- lazy routes
- image optimization
- query caching
- pagination
- virtualization for very large tables
- minimizing unnecessary renders
- bundle size

Performance optimization should be evidence-driven.

---

# 85. Route Lazy Loading

Large application sections can be lazy-loaded.

Example:

```text
Admin Module
College Module
Student Module
Analytics Module
```

This can reduce initial JavaScript bundle size.

---

# 86. Component Re-rendering

Avoid unnecessary re-renders by:

- keeping state close to where it is used
- using stable query keys
- avoiding unnecessary global state
- memoizing only when beneficial
- splitting large components

Do not add `useMemo` or `useCallback` everywhere without a demonstrated need.

---

# 87. Frontend Testing

The frontend should include:

- component tests
- hook tests
- form validation tests
- routing tests
- API integration tests
- authorization UI tests
- critical user-flow tests

Potential tools include:

```text
Vitest
React Testing Library
Playwright
```

---

# 88. Component Testing

Components should test:

- rendering
- user interaction
- validation
- loading states
- error states
- accessibility where appropriate

Example:

```text
StudentForm
    ↓
Valid Input
    ↓
Submit
    ↓
API Call
    ↓
Success
```

---

# 89. End-to-End Testing

Critical flows should be tested end-to-end.

Examples:

```text
Login
Create Student
Import Results
Validate Results
Process Results
View Backlog
View Academic Passport
View Analytics
```

---

# 90. Frontend and Backend Contract Testing

The frontend must remain aligned with backend API contracts.

When backend DTOs or API contracts change:

```text
Backend API
     ↓
API Contract
     ↓
Frontend Types
     ↓
Frontend API Service
     ↓
UI
```

Breaking changes must be reviewed across both sides.

---

# 91. Frontend and Database

The frontend must never depend directly on database schema.

Incorrect:

```text
React
  ↓
MySQL
```

Correct:

```text
React
  ↓
Spring Boot API
  ↓
MySQL
```

Database changes should be isolated behind backend APIs.

---

# 92. Frontend and Data Ownership

The frontend must respect module ownership.

Example:

```text
Result Processing
     ↓
Official Result

Backlog Tracking
     ↓
Official Backlog

Analytics
     ↓
Derived Analytics
```

The UI must not create competing sources of truth.

---

# 93. Frontend and API Architecture

The frontend implements the contracts defined by:

```text
api-architecture.md
```

The frontend should not invent endpoints.

Example:

```text
GET /api/v1/me/results
```

should be consumed according to the API contract.

---

# 94. Frontend and Backend Architecture

The frontend communicates with:

```text
Spring Boot REST API
```

It should not know about:

- JPA entities
- Hibernate mappings
- MySQL tables
- database foreign keys

The frontend consumes API DTOs.

---

# 95. Feature Development Workflow

A new frontend feature should follow:

```text
Feature Specification
       ↓
API Contract
       ↓
Frontend Page
       ↓
Feature Components
       ↓
API Hook
       ↓
State / Query
       ↓
Loading / Error / Empty States
       ↓
Responsive UI
       ↓
Accessibility
       ↓
Tests
```

---

# 96. Frontend Coding Principles

The frontend should follow:

- component composition
- single responsibility
- feature isolation
- reusable UI primitives
- typed API contracts
- predictable state management
- accessible HTML
- responsive design
- minimal duplication
- clear naming
- small focused components

---

# 97. Frontend Anti-Patterns

Avoid:

### Giant Components

```text
Dashboard.tsx
    ↓
2,000 lines
```

Break complex pages into feature components.

### Global State for Everything

Do not put all application data into Zustand.

### API Calls Directly Everywhere

Do not write raw Axios calls in every component.

### Business Logic in UI

Do not calculate authoritative academic results inside React components.

### Duplicate Components

Do not create separate copies of the same generic UI component.

---

# 98. AI Coding Agent Rules

AI coding agents must:

1. read the relevant feature specification
2. read `data-ownership.md`
3. read `api-architecture.md`
4. read `backend-architecture.md`
5. follow this frontend architecture
6. use TypeScript types
7. use existing shared components
8. avoid unnecessary dependencies
9. avoid duplicating API logic
10. never bypass backend authorization
11. never expose secrets
12. never calculate official academic values independently
13. preserve responsive behavior
14. preserve accessibility
15. include loading/error/empty states
16. add appropriate tests
17. avoid changing unrelated modules
18. document significant architectural changes

---

# 99. Frontend Development Workflow

The standard development process is:

```text
Requirement
    ↓
Feature Specification
    ↓
API Contract
    ↓
Route
    ↓
Page
    ↓
Components
    ↓
API Hook
    ↓
Query / State
    ↓
Validation
    ↓
Responsive Design
    ↓
Accessibility
    ↓
Testing
    ↓
Review
```

---

# 100. Frontend Definition of Done

A frontend feature is complete when:

- route is implemented
- page is implemented
- required components exist
- API integration works
- TypeScript types are defined
- loading state exists
- empty state exists
- error state exists
- form validation exists where required
- authorization-aware UI exists
- responsive behavior works
- accessibility is reviewed
- tests are added
- API contract is respected
- no sensitive data is exposed
- no critical UI defects remain

---

# 101. Initial Frontend Module Map

```text
features/
├── auth/
├── colleges/
├── students/
├── academic/
├── results/
├── backlogs/
├── passport/
└── analytics/
```

These modules correspond to the primary backend/domain boundaries.

---

# 102. Frontend Dependency Direction

The preferred dependency direction is:

```text
Pages
  ↓
Features
  ↓
Shared Components / Hooks
  ↓
API / Services
```

Shared components should not import business-specific feature modules.

Avoid circular dependencies.

---

# 103. Shared Component Dependency Rule

Good:

```text
StudentPage
    ↓
DataTable
```

Bad:

```text
DataTable
    ↓
StudentService
```

Generic UI components must remain independent from business modules.

---

# 104. Route Dependency Rule

Routes should compose pages.

Example:

```text
Route
 ↓
StudentResultsPage
 ↓
ResultFilters
ResultTable
Pagination
```

The router should not contain business logic.

---

# 105. Frontend Architecture Flow

The complete frontend architecture is:

```text
                         React Application
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
          Router             Providers          Layouts
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                              Pages
                                │
                              Features
                                │
                   ┌────────────┴────────────┐
                   │                         │
              Components                  Hooks
                   │                         │
                   └────────────┬────────────┘
                                │
                         API / Query Layer
                                │
                           REST / JSON
                                │
                         Spring Boot API
```

---

# 106. Complete Application Architecture

Frontend and backend together:

```text
                         User
                          │
                          ↓
                    React Frontend
                          │
                ┌─────────┴─────────┐
                │                   │
             Router              UI State
                │                   │
                └─────────┬─────────┘
                          ↓
                    API / Query
                          │
                          ↓
                  Spring Boot API
                          │
                   Spring Security
                          │
                      Controllers
                          │
                       Services
                          │
                    Domain Logic
                          │
                    Repositories
                          │
                  JPA / Hibernate
                          │
                          ↓
                        MySQL
```

---

# 107. Frontend Architecture Principles

The frontend architecture is based on these principles:

1. React is the presentation layer.
2. Backend APIs are the source of application truth.
3. Feature boundaries should remain clear.
4. Server state and client state should remain separate.
5. Backend authorization is authoritative.
6. Students should use `/me` APIs for self-service.
7. Academic calculations come from authoritative backend logic.
8. Shared components should remain generic.
9. API communication should be centralized.
10. Large datasets must use server-side pagination/filtering.
11. Loading, empty, and error states are mandatory.
12. Accessibility and responsiveness are part of feature completion.

---

# 108. Unresolved Frontend Decisions

The following should be finalized during implementation/design:

- exact authentication storage mechanism
- final route hierarchy
- exact navigation structure
- exact component library usage
- exact theme system
- exact API client configuration
- polling vs another mechanism for long-running jobs
- frontend error-reporting solution
- exact testing stack
- exact chart library configuration
- whether generated API types will be used
- final mobile navigation pattern

These decisions should not silently alter backend or database architecture.

---

# 109. Relationship With Architecture Documents

Frontend Architecture depends on:

```text
Product Requirements
        ↓
Feature Specifications
        ↓
Data Ownership
        ↓
API Architecture
        ↓
Backend Architecture
        ↓
Frontend Architecture
```

Frontend Architecture then guides:

```text
UI Implementation
       ↓
Frontend Development
       ↓
Testing
       ↓
QA
```

---

# 110. Final Frontend Architecture

Acadlytic will use a **React + TypeScript + Vite** frontend with a feature-oriented architecture.

The application will follow:

```text
React
  ↓
React Router
  ↓
Pages / Layouts
  ↓
Feature Modules
  ↓
Shared Components
  ↓
TanStack Query / Client State
  ↓
REST API
  ↓
Spring Boot
  ↓
MySQL
```

The frontend remains a presentation and interaction layer.

Authoritative business rules, authorization, tenant isolation, result processing, backlog state, and academic calculations remain backend responsibilities.

---

# 111. Document Status

**Document:** Frontend Architecture  
**Project:** Acadlytic  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

This document defines the frontend architectural direction for the Acadlytic MVP.

Detailed UI behavior should be defined in the Design and Page Specification documents before implementation.