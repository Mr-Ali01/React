# Frontend Foundation

**Document:** `09-development/implementation-notes/frontend-foundation.md`  
**Project:** Acadlytic  
**Phase:** Development — Frontend Foundation  
**Status:** Draft / Under Review  
**Audience:** Frontend Developers, Full-Stack Developers, Reviewers, AI Coding Assistants

---

## 1. Purpose

This document defines the implementation foundation for the Acadlytic frontend.

It converts the approved frontend architecture, design system, navigation, responsive design, and frontend coding rules into concrete implementation guidance for the React application.

The goal is to establish a stable frontend foundation before implementing feature-specific pages such as:

- Authentication
- College Management
- Academic Structure
- Student Management
- Result Import
- Result Validation
- Result Processing
- Backlog Tracking
- Academic Passport
- Analytics
- Student Portal

This document defines **how the frontend should be structured and initialized**.

It does not replace feature-specific implementation specifications.

---

# 2. Frontend Technology Baseline

The frontend baseline is:

| Area | Technology |
|---|---|
| Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Server State | TanStack Query |
| Client State | Zustand |
| HTTP Client | Axios |
| Forms | React Hook Form |
| Schema Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Package Manager | npm |
| API Format | JSON |
| API Base | `/api/v1` |

The exact package versions should be pinned in `package.json` and upgraded deliberately rather than automatically introducing breaking changes.

---

# 3. Frontend Responsibilities

The frontend is responsible for:

- rendering user interfaces
- navigation
- route protection
- role-aware navigation
- form handling
- client-side validation
- API communication
- server-state management
- local UI state
- loading states
- empty states
- error states
- responsive behavior
- accessibility
- data visualization
- user interaction
- presenting backend-provided academic data

The frontend is **not** the authority for:

- authorization
- tenant isolation
- academic data integrity
- result processing
- backlog business rules
- SGPA/CGPA authoritative calculations
- security-sensitive decisions
- database operations

The backend remains authoritative.

---

# 4. Frontend Architecture

The application follows a feature-oriented React architecture.

```text
frontend/
├── public/
├── src/
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
│   ├── styles/
│   ├── main.tsx
│   └── App.tsx
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

# 5. Application Bootstrap

The frontend entry point should initialize the React application through a predictable provider hierarchy.

Conceptually:

```text
main.tsx
   ↓
React Root
   ↓
Global Providers
   ↓
Router
   ↓
Application Layout
   ↓
Page
```

A typical provider hierarchy may be:

```text
StrictMode
└── QueryClientProvider
    └── App
        └── RouterProvider
```

Additional providers should only be introduced when there is a concrete application requirement.

Avoid creating unnecessary global providers.

---

# 6. `main.tsx`

`main.tsx` should be responsible for application bootstrapping.

Responsibilities:

- import global styles
- initialize React
- initialize required providers
- render the root application
- avoid business logic

It should not contain:

- API calls
- authentication logic
- feature logic
- page-specific state
- complex configuration logic

The entry point should remain small.

---

# 7. `App.tsx`

`App.tsx` should act as the application composition layer.

Responsibilities may include:

- application-level providers
- router integration
- global application components

It should not become a container for all application logic.

Avoid:

```text
App.tsx
├── authentication logic
├── dashboard logic
├── student logic
├── result logic
├── analytics logic
└── all API calls
```

Instead, application responsibilities should remain distributed across the appropriate modules.

---

# 8. Provider Structure

Required providers should be centralized under:

```text
src/app/providers/
```

Possible structure:

```text
providers/
├── query-provider.tsx
├── app-provider.tsx
└── index.ts
```

Providers should have clearly defined responsibilities.

For example:

- Query Provider → TanStack Query
- Application Provider → application-level composition
- Theme handling → theme-specific infrastructure if required

Do not introduce a provider simply to avoid passing one small value through components.

---

# 9. TanStack Query Foundation

TanStack Query is the primary mechanism for server state.

Use it for:

- API data
- lists
- detail records
- dashboard data
- academic passport
- analytics
- result import status
- validation status
- processing status

Do not duplicate server state into Zustand unless there is a clear reason.

Conceptually:

```text
API
 ↓
Axios
 ↓
TanStack Query
 ↓
React Components
```

---

# 10. Query Client

A centralized Query Client should be created.

Conceptual responsibilities:

- query caching
- stale-time configuration
- retry behavior
- mutation behavior
- error handling
- query invalidation

Global defaults should remain conservative.

For example:

- do not retry authentication failures indefinitely
- do not retry validation failures unnecessarily
- do not aggressively refetch static academic structure data
- invalidate related queries after successful mutations

Exact values remain an implementation decision and should be evaluated against API behavior.

---

# 11. Query Key Strategy

Query keys must be predictable and structured.

Example:

```text
['students']
['students', studentId]
['students', studentId, 'backlogs']
['students', studentId, 'academic-passport']
['analytics', 'dashboard']
['analytics', 'students', studentId]
['result-imports']
['result-imports', importId]
```

Query keys should include identifiers and filters that affect the returned data.

Avoid arbitrary strings such as:

```text
['data']
['studentData']
['whatever']
```

---

# 12. Axios API Client

Axios should be centralized.

Recommended location:

```text
src/services/api/
```

Example conceptual structure:

```text
services/
└── api/
    ├── client.ts
    ├── auth-api.ts
    ├── students-api.ts
    ├── academic-api.ts
    ├── results-api.ts
    ├── backlog-api.ts
    ├── passport-api.ts
    └── analytics-api.ts
```

The exact grouping may evolve with feature implementation.

---

# 13. API Client Responsibilities

The centralized Axios client should handle common concerns such as:

- API base URL
- JSON headers
- authentication mechanism integration
- common request configuration
- common response handling
- API error normalization
- correlation/request identifiers where applicable

Feature-specific API modules should use the centralized client.

Avoid creating separate Axios instances inside individual components.

---

# 14. API Boundary

The frontend must treat the backend API as a contract.

```text
React Component
      ↓
Feature Hook
      ↓
API Service
      ↓
Axios Client
      ↓
Spring Boot REST API
```

Components should not directly construct arbitrary Axios requests.

Avoid:

```text
Component
  ↓
axios.get(...)
```

Prefer:

```text
Component
  ↓
useStudents()
  ↓
studentsApi.list()
  ↓
apiClient
```

This improves consistency and testability.

---

# 15. DTO-Oriented Frontend Types

Frontend types should represent API contracts.

Recommended structure:

```text
src/types/
├── auth.ts
├── college.ts
├── student.ts
├── academic.ts
├── result.ts
├── backlog.ts
├── passport.ts
├── analytics.ts
└── api.ts
```

Types should not blindly mirror backend entities.

The frontend should consume API DTOs.

For example:

```text
Backend Entity
      ↓
Backend DTO
      ↓
JSON API
      ↓
Frontend Type
      ↓
React UI
```

---

# 16. API Response Types

Common API response structures should be standardized.

Examples:

```text
ApiError
ApiResponse<T>
PageResponse<T>
ValidationError
FieldError
```

The exact response contract must remain aligned with the backend API architecture.

The frontend must not invent a response format independently.

---

# 17. Error Handling

Frontend error handling must distinguish between:

- validation errors
- authentication errors
- authorization errors
- not-found errors
- conflict errors
- server errors
- network errors
- unexpected client errors

Conceptual mapping:

```text
400 → validation/request problem
401 → unauthenticated
403 → unauthorized
404 → resource not found
409 → conflict
422 → domain validation where applicable
429 → rate limited
5xx → server problem
Network → connectivity problem
```

The exact backend contract remains authoritative.

---

# 18. Global API Error Handling

Centralized API handling should normalize errors into a predictable frontend structure.

For example:

```text
{
  code,
  message,
  fieldErrors,
  requestId
}
```

Do not display raw server stack traces to users.

Do not expose internal exception details.

User-facing messages should be understandable while logs retain technical details where appropriate.

---

# 19. Authentication Foundation

Authentication implementation will be built on top of the frontend foundation.

The frontend must support:

- login
- logout
- current-user retrieval
- protected routes
- role-aware navigation
- authentication state
- session expiration handling
- password-related flows

The frontend must not independently decide whether a user is authorized.

The backend remains authoritative.

---

# 20. Current User

The application should retrieve the authenticated user through a backend endpoint such as:

```text
GET /api/v1/me
```

The returned user context should support:

- user identity
- role
- college/tenant context
- account status
- permissions where defined

The frontend should use this information for UI composition.

---

# 21. Route Protection

Protected routes should be implemented centrally.

Conceptual flow:

```text
Request Route
     ↓
Authenticated?
     ├── No → Login
     └── Yes
          ↓
       Role Allowed?
          ├── No → Unauthorized
          └── Yes → Page
```

Route protection is a frontend UX/security boundary.

It is not a replacement for backend authorization.

---

# 22. Role-Aware Navigation

Supported roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Navigation should be generated according to:

- authenticated state
- role
- tenant context
- feature availability

Example:

```text
SUPER_ADMIN
├── Dashboard
├── Colleges
├── Users
└── System-level areas

COLLEGE_ADMIN
├── Dashboard
├── Students
├── Academic
├── Results
├── Backlogs
├── Academic Passport
└── Analytics

ACADEMIC_STAFF
├── Dashboard
├── Students
├── Academic
├── Results
├── Backlogs
└── Analytics

STUDENT
├── Dashboard
├── Academic Passport
├── Results
├── Backlogs
├── Analytics
├── Profile
└── Settings
```

The exact permission matrix remains controlled by the authentication/authorization specification.

---

# 23. Router Foundation

React Router should define routes centrally.

Recommended location:

```text
src/app/router/
```

Possible structure:

```text
router/
├── index.tsx
├── routes.tsx
├── guards.tsx
└── route-config.ts
```

The router should remain readable.

Avoid embedding large page components directly inside route configuration.

---

# 24. Route Structure

The application should follow the navigation specification.

Primary groups:

```text
/
├── public
├── auth
└── app
```

Application routes should remain under:

```text
/app/*
```

This provides a clean separation between:

- public website
- authentication
- authenticated application

---

# 25. Layout Foundation

Layouts should be separated from pages.

Recommended structure:

```text
src/app/layouts/
├── PublicLayout.tsx
├── AuthLayout.tsx
├── AppLayout.tsx
└── StudentLayout.tsx
```

The exact layout count may change if layouts can be shared cleanly.

---

# 26. Application Shell

The main application shell should support:

```text
┌───────────────────────────────────────┐
│ Header                                │
├──────────────┬────────────────────────┤
│ Sidebar      │ Main Content           │
│              │                        │
│ Navigation   │ Page                   │
│              │                        │
└──────────────┴────────────────────────┘
```

Responsive behavior should follow `responsive-design.md`.

---

# 27. Responsive Shell

Desktop:

```text
Sidebar + Header + Main Content
```

Tablet:

```text
Collapsible Sidebar + Header + Main Content
```

Mobile:

```text
Header
Main Content
Mobile Navigation / Drawer
```

The implementation must not assume desktop dimensions.

Avoid device-specific JavaScript where CSS can solve the problem.

---

# 28. Shared UI Foundation

Shared components belong under:

```text
src/components/ui/
```

Examples:

```text
Button
Input
Select
Textarea
Checkbox
Radio
Switch
Card
Badge
Alert
Modal
Drawer
Dropdown
Tabs
Tooltip
Table
Pagination
Breadcrumb
Skeleton
Spinner
EmptyState
ErrorState
```

These components should provide consistent behavior and visual language.

---

# 29. Feature Components

Feature-specific components belong inside the relevant feature.

Example:

```text
features/students/
├── components/
│   ├── StudentTable.tsx
│   ├── StudentFilters.tsx
│   ├── StudentForm.tsx
│   └── StudentSummaryCard.tsx
├── hooks/
├── services/
├── types/
└── utils/
```

Do not place feature-specific components inside the global UI directory.

---

# 30. Pages vs Components

A page should compose features and shared components.

Conceptually:

```text
Page
 ├── PageHeader
 ├── Filters
 ├── Feature Component
 ├── Data Table
 └── Pagination
```

Avoid placing complete business workflows inside a single page component.

---

# 31. Forms

Forms should use:

- React Hook Form
- Zod where schema validation is appropriate

Responsibilities:

```text
React Hook Form
→ form state
→ field registration
→ submission
→ errors

Zod
→ schema validation
```

Backend validation remains authoritative.

Client validation improves UX but does not replace server validation.

---

# 32. Form Error Handling

Forms should support:

- required field errors
- format errors
- server-side field errors
- submission errors
- loading state
- disabled state
- successful submission state

Example flow:

```text
Submit
 ↓
Client Validation
 ↓
API Request
 ↓
Success
    OR
Server Validation Error
    OR
Unexpected Error
```

---

# 33. Loading States

Every asynchronous page or feature must define appropriate loading behavior.

Possible patterns:

- skeleton
- spinner
- button loading state
- table loading state
- page loading state
- progress indicator

Avoid blank screens while data is loading.

---

# 34. Empty States

Empty states should explain:

1. what is empty
2. why it may be empty
3. what the user can do next

Example:

```text
No students found.

There are no students matching the current filters.

[Clear Filters]
```

Empty state must not be confused with an error state.

---

# 35. Error States

Feature-level errors should provide:

- clear explanation
- retry action where appropriate
- navigation option where appropriate

Example:

```text
Unable to load students.

Please try again.

[Retry]
```

Technical details should not be exposed unnecessarily.

---

# 36. Result Import UI Foundation

Result import is an asynchronous workflow.

The frontend should support:

```text
Upload
 ↓
Import Created
 ↓
Parsing
 ↓
Validation
 ↓
Review
 ↓
Processing
 ↓
Completed
```

The UI must represent backend job status rather than assuming completion.

---

# 37. File Upload

The result import interface should support:

- Excel
- CSV

The frontend should:

- validate file type for UX
- validate file size for UX
- upload using multipart/form-data
- show upload progress where practical
- display server validation errors
- preserve import identifier
- navigate to import details

The backend remains responsible for authoritative file validation.

---

# 38. Import Status Polling

For asynchronous imports, the frontend may use TanStack Query polling or another controlled mechanism.

Conceptual behavior:

```text
Import Created
      ↓
GET import status
      ↓
Still Running?
 ├── Yes → Poll
 └── No  → Stop Polling
```

Polling must stop when:

- job completes
- job fails
- job is cancelled
- component is unmounted
- user no longer has access

Avoid uncontrolled polling.

---

# 39. Validation Review UI

Validation should present:

- total records
- valid records
- invalid records
- warnings
- error categories
- affected student/subject identifiers where permitted
- actionable filters

Example:

```text
Validation Summary

Total Records     1,250
Valid             1,180
Invalid              52
Warnings             18
```

Detailed records should support filtering and pagination.

---

# 40. Processing UI

Processing should communicate:

```text
Ready
Processing
Completed
Completed With Errors
Failed
```

The frontend must not claim that processing succeeded before receiving authoritative backend confirmation.

---

# 41. Academic Data Presentation

Academic information should be displayed with high clarity.

Common patterns include:

- semester tables
- subject result tables
- SGPA cards
- CGPA trend charts
- backlog badges
- credits
- attempt information
- pass/fail status
- academic timeline

The UI should distinguish:

```text
Current Result
Previous Attempt
Backlog
Cleared Backlog
```

Do not visually imply that every result row represents the latest academic state.

---

# 42. Academic Passport UI

Academic Passport is primarily a read-oriented experience.

The frontend should present:

```text
Student Profile
     ↓
Program Information
     ↓
Academic Summary
     ↓
Semester History
     ↓
Subject Results
     ↓
Backlog Summary
     ↓
Academic Progress
```

The frontend must not modify Passport data directly.

Updates occur through authoritative backend workflows.

---

# 43. Analytics Foundation

Analytics components should use:

- Recharts where suitable
- reusable chart wrappers
- responsive containers
- accessible labels
- empty states
- loading states

Charts must not become the only representation of important information.

Important metrics should also have textual/tabular representation.

---

# 44. Analytics Data Integrity

The frontend must display backend-provided analytics accurately.

Do not:

- invent missing values
- convert missing values into zero
- calculate authoritative CGPA independently
- double-count attempts
- silently filter academic records
- change result status for presentation

Presentation transformations must not change semantic meaning.

---

# 45. Zustand Foundation

Zustand should be reserved for client-side state that genuinely needs shared access.

Examples:

- UI preferences
- sidebar state
- temporary UI state
- theme preference where applicable
- local workflow state that is not server-owned

Do not use Zustand as a second API cache.

Avoid:

```text
API
 ↓
Zustand
 ↓
TanStack Query
```

unless there is a specific architectural reason.

---

# 46. Local Component State

Use React local state when state is:

- isolated
- temporary
- component-specific
- not required by unrelated components

Examples:

```text
modalOpen
searchInput
selectedTab
expandedRow
temporaryFormStep
```

Do not globalize every piece of UI state.

---

# 47. Theme Foundation

The frontend should support the project-defined theme system.

Theme implementation must follow the design system.

The implementation should support:

- light mode
- dark mode
- semantic color tokens
- accessible contrast
- consistent component states

Theme state should be applied consistently across the application.

Avoid hardcoding unrelated colors throughout components.

Prefer semantic tokens such as:

```text
background
foreground
surface
border
primary
secondary
muted
success
warning
danger
```

---

# 48. Tailwind CSS

Tailwind should be used consistently.

Prefer:

```text
semantic design tokens
+
reusable components
+
utility classes
```

Avoid large amounts of duplicated arbitrary utility combinations.

When the same pattern appears repeatedly, create a reusable component rather than copying a long class list.

---

# 49. Design Tokens

Design tokens should be centralized according to the design system.

Tokens should cover:

- colors
- typography
- spacing
- radius
- shadows
- component states

Components should consume tokens rather than inventing their own visual language.

---

# 50. Icons

Lucide React should be the default icon library.

Use icons consistently for:

- navigation
- actions
- status indicators
- contextual controls

Icons should not replace text where the action would become ambiguous.

Icon-only buttons must have accessible labels.

---

# 51. Accessibility Foundation

The frontend must follow accessible implementation practices.

Required areas:

- semantic HTML
- keyboard navigation
- visible focus
- accessible labels
- accessible forms
- ARIA only where necessary
- correct button/link semantics
- dialog accessibility
- table semantics
- sufficient contrast
- reduced-motion support

Avoid using ARIA to compensate for incorrect HTML semantics.

---

# 52. Keyboard Navigation

Interactive elements must be keyboard accessible.

Required interactions include:

- navigation
- forms
- dropdowns
- dialogs
- drawers
- tabs
- tables where interactive
- pagination

Focus must not disappear when a modal or drawer opens.

Focus should be restored appropriately when overlays close.

---

# 53. Responsive Design Foundation

The implementation must follow the project's responsive specification.

Reference breakpoints:

```text
<640      Small Mobile
640–767   Large Mobile / Small Tablet
768–1023  Tablet
1024–1279 Desktop
1280+     Large Desktop
```

These are implementation references, not permission to design separate applications for every breakpoint.

The goal is continuous responsive behavior.

---

# 54. Mobile-First Implementation

Components should be designed mobile-first.

Example conceptual progression:

```text
Mobile
 ↓
Tablet
 ↓
Desktop
 ↓
Large Desktop
```

Avoid building desktop-first layouts and attempting to compress them into mobile afterward.

---

# 55. Tables on Mobile

Academic and administrative tables can contain substantial information.

Do not blindly force all columns into narrow mobile screens.

Possible strategies:

- responsive table
- horizontal table container where necessary
- priority columns
- row detail view
- stacked mobile representation

The correct strategy depends on the data.

Do not hide important academic information without providing another accessible way to access it.

---

# 56. Environment Configuration

Frontend environment configuration should use Vite environment variables.

Example:

```text
VITE_API_BASE_URL
```

Development:

```text
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Production values must be supplied through deployment configuration.

Never place secrets in frontend environment variables.

Anything exposed through a Vite build should be considered public.

---

# 57. `.env.example`

The repository should include:

```text
.env.example
```

It should document required non-secret configuration.

Example:

```text
VITE_API_BASE_URL=
```

Actual environment files should not be committed when they contain environment-specific secrets or private configuration.

---

# 58. CORS Development Setup

During local development:

```text
Frontend
http://localhost:5173

Backend
http://localhost:8080
```

The backend must explicitly allow the required development origin.

Do not solve CORS by allowing every origin in production.

---

# 59. Frontend Build

The application must support:

```text
npm install
npm run dev
npm run build
npm run preview
```

The exact scripts should be defined in `package.json`.

Recommended additional scripts:

```text
npm run lint
npm run typecheck
npm run test
```

---

# 60. TypeScript Configuration

TypeScript should use strict checking.

The project should prefer:

```text
strict: true
```

Avoid unnecessary use of:

```text
any
```

When external data is uncertain, use:

- explicit types
- `unknown`
- runtime validation where appropriate

Do not suppress TypeScript errors without understanding the cause.

---

# 61. Feature Folder Convention

Each major feature should have a predictable structure.

Example:

```text
features/results/
├── components/
├── hooks/
├── services/
├── types/
├── utils/
└── index.ts
```

Not every feature requires every folder.

Only create folders that contain meaningful code.

---

# 62. Hooks

Custom hooks should encapsulate reusable behavior.

Examples:

```text
useAuth()
useCurrentUser()
useStudents()
useStudent()
useResultImport()
useAnalytics()
```

Hooks should not become massive business-logic containers.

Complex business rules belong in appropriate layers.

---

# 63. Services

Feature API services should contain API communication.

Example:

```text
studentsApi.list()
studentsApi.getById()
studentsApi.create()
studentsApi.update()
```

Components should not know endpoint URLs.

---

# 64. Utilities

Utilities should contain genuinely reusable pure logic.

Examples:

```text
date formatting
number formatting
file size formatting
query parameter helpers
display helpers
```

Avoid creating generic utility files containing unrelated functions.

---

# 65. Date and Time Handling

Academic data may contain:

- result dates
- semester dates
- processing timestamps
- import timestamps

The frontend must respect the backend's date/time contract.

Do not manually parse dates using fragile string manipulation.

Display timezone-sensitive timestamps consistently.

The authoritative timezone strategy remains a backend/system architecture decision.

---

# 66. Search and Filtering

Search and filtering should be predictable.

Where filters affect server-side data:

```text
UI
 ↓
Query Parameters
 ↓
API
 ↓
Server-side Filtering
```

Do not fetch an entire dataset merely to implement filtering in the browser when the dataset can be large.

---

# 67. URL State

Important page state may be represented in URL query parameters.

Examples:

```text
?page=2
?search=rahul
?status=active
?semester=3
```

URL state is useful for:

- filters
- pagination
- sorting
- search
- shareable views

Avoid putting every transient UI state into the URL.

---

# 68. Pagination

Large collections should use server-side pagination.

Examples:

- students
- result records
- validation records
- imports
- backlogs

The frontend should display:

- current page
- page size
- total results where available
- navigation controls

Pagination state should integrate cleanly with TanStack Query.

---

# 69. Mutation Handling

Mutations should provide:

```text
Idle
Loading
Success
Error
```

After successful mutations, invalidate or update affected queries.

Example:

```text
Create Student
 ↓
Success
 ↓
Invalidate ['students']
 ↓
Student list refreshes
```

Avoid manually maintaining duplicated copies of server state unless necessary.

---

# 70. Confirmation Dialogs

Confirmation should be used for destructive or consequential actions.

Examples:

- deactivate account
- suspend college
- delete/replace configuration where supported
- cancel import
- irreversible workflow actions

The dialog should clearly state:

- action
- consequence
- cancel option
- confirm action

---

# 71. Status Badges

Statuses should use consistent semantic presentation.

Examples:

```text
ACTIVE
INACTIVE
SUSPENDED

PENDING
VALID
INVALID
WARNING

PROCESSING
COMPLETED
FAILED
CANCELLED
```

Do not communicate status using color alone.

---

# 72. Notifications and Toasts

Toasts should be used for short-lived feedback.

Good examples:

```text
Student created successfully.
Import started successfully.
Password updated successfully.
```

Do not put critical information only in a toast.

Important errors should remain visible in the relevant page context.

---

# 73. Protected Data Presentation

The frontend must avoid exposing information that the current user should not see.

Role-based UI hiding is useful for UX.

However:

```text
Hidden UI ≠ Security
```

Every sensitive API operation must be protected by the backend.

---

# 74. Tenant-Aware UI

For college-scoped users, the frontend should operate within the authenticated tenant context.

The frontend must not allow users to arbitrarily change:

```text
collegeId
tenantId
```

to access another college.

Tenant authorization is enforced server-side.

The frontend should reflect the current authorized context.

---

# 75. `/me` APIs

Student self-service screens should prefer `/me` endpoints.

Examples:

```text
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

This reduces unnecessary exposure of student identifiers in self-service workflows.

---

# 76. Code Splitting

Large application areas should be eligible for route-level lazy loading.

Potential areas:

```text
admin
college
students
results
analytics
student portal
```

Code splitting should improve initial load without making the application unnecessarily fragmented.

---

# 77. Performance Foundation

The frontend should avoid:

- unnecessary re-renders
- excessive global state
- large initial bundles
- unnecessary API calls
- unbounded polling
- rendering thousands of records at once
- duplicate data fetching

Performance optimization should be evidence-driven.

Do not add memoization everywhere without a measurable reason.

---

# 78. Testing Foundation

The frontend should eventually support:

### Unit Tests

For:

- utilities
- pure functions
- validation logic
- formatting logic

### Component Tests

For:

- forms
- buttons
- tables
- filters
- important UI states

### Integration Tests

For:

- authentication flows
- result import workflows
- student management workflows
- navigation behavior

### End-to-End Tests

For critical user journeys.

---

# 79. Initial Frontend Verification

Before feature development, verify:

```text
□ React application starts
□ Vite development server works
□ TypeScript compilation works
□ Tailwind styles work
□ React Router works
□ Query Client works
□ Axios client works
□ Environment variables work
□ Base layout renders
□ Responsive shell renders
□ Light/dark theme foundation works
□ Error boundary strategy exists
□ API connectivity can be tested
□ Lint passes
□ Typecheck passes
□ Production build passes
```

---

# 80. Error Boundary

The application should provide a React error boundary strategy for unexpected rendering errors.

The error boundary should:

- prevent complete blank-screen failure where possible
- provide a user-friendly fallback
- allow recovery/reload
- log useful diagnostic information through the appropriate observability mechanism

It should not expose stack traces to normal users.

---

# 81. Development Logging

Development logging may be used for debugging.

Production logging must avoid exposing:

- passwords
- authentication tokens
- sensitive student data
- confidential academic records
- private request payloads

Use structured logging or observability tooling where appropriate.

---

# 82. Security Requirements

Frontend security requirements include:

- never hardcode secrets
- never expose backend credentials
- never trust client-side authorization
- never store sensitive data unnecessarily
- never log passwords/tokens
- avoid unsafe HTML injection
- sanitize/escape dynamic content according to rendering mechanism
- use secure authentication/session strategy defined by backend
- use HTTPS in production

---

# 83. Academic Data Security

Academic data may include sensitive student information.

The frontend should:

- display only authorized information
- avoid unnecessary persistence in local storage
- avoid exposing data through URLs unnecessarily
- clear sensitive temporary state when appropriate
- avoid screenshots/export functionality unless explicitly authorized
- respect role and tenant boundaries

---

# 84. AI-Assisted Frontend Development Rules

AI-generated frontend code must follow project rules.

AI must not:

- invent API endpoints
- invent backend response structures
- invent academic formulas
- bypass authorization
- introduce direct database access
- create duplicate state-management systems
- silently modify architecture
- introduce arbitrary dependencies without justification
- use hardcoded production secrets
- ignore TypeScript errors
- create inaccessible UI
- create desktop-only layouts
- silently change established design tokens

Before implementing an API-dependent feature, AI should verify:

```text
Endpoint
Request
Response
Authorization
Loading State
Error State
Empty State
Mutation Behavior
```

---

# 85. AI Implementation Pattern

For each frontend feature:

```text
Read Feature Specification
        ↓
Read API Contract
        ↓
Identify Page
        ↓
Identify Components
        ↓
Identify API Service
        ↓
Identify Query/Mutation
        ↓
Implement Loading/Error/Empty States
        ↓
Implement Responsive UI
        ↓
Implement Accessibility
        ↓
Test
        ↓
Review
```

AI should not jump directly from a feature request to UI code without understanding the API and ownership boundaries.

---

# 86. Frontend Development Order

The frontend foundation should be implemented in this order:

```text
1. Vite + React + TypeScript
2. Tailwind CSS
3. Base styles/tokens
4. Application providers
5. React Router
6. Layout system
7. Axios client
8. TanStack Query
9. Error handling
10. Shared UI primitives
11. Responsive shell
12. Authentication route foundation
13. Role-aware navigation
14. Feature implementation
```

---

# 87. Initial Shared Components

The first shared components should include:

```text
Button
Input
Label
Select
Textarea
Checkbox
Card
Badge
Alert
Spinner
Skeleton
EmptyState
ErrorState
Modal
Dropdown
Table
Pagination
Breadcrumb
```

Only implement components required by the initial feature set.

Avoid building an entire design system before validating actual application needs.

---

# 88. Initial Application Shell

The first usable shell should include:

```text
Header
Sidebar
Main Content
User Menu
Responsive Navigation
Breadcrumb Area
Page Container
```

The shell should work before feature-specific pages are implemented.

---

# 89. Frontend–Backend Connectivity Verification

A minimal connectivity test should verify:

```text
React
 ↓
Axios
 ↓
Spring Boot
 ↓
/api/v1
 ↓
JSON Response
 ↓
TanStack Query
 ↓
React UI
```

This should be completed before implementing complex workflows.

---

# 90. Frontend Foundation Acceptance Criteria

The frontend foundation is acceptable when:

### Application

- [ ] React application starts successfully.
- [ ] Vite development server works.
- [ ] TypeScript strict checking works.
- [ ] Production build succeeds.

### Styling

- [ ] Tailwind is configured.
- [ ] Design tokens can be consumed.
- [ ] Light/dark foundation exists.
- [ ] Responsive behavior works.

### Routing

- [ ] Public routes work.
- [ ] Authentication routes exist.
- [ ] Application route structure exists.
- [ ] Protected route foundation exists.

### API

- [ ] Axios client exists.
- [ ] API base URL is configurable.
- [ ] API errors have normalized handling.
- [ ] TanStack Query is configured.

### State

- [ ] Server state uses TanStack Query.
- [ ] Client state has a defined strategy.
- [ ] Zustand is not used as an API cache.

### UI

- [ ] Shared UI foundation exists.
- [ ] Loading states exist.
- [ ] Empty states exist.
- [ ] Error states exist.
- [ ] Accessible interaction patterns exist.

### Architecture

- [ ] Feature-oriented structure exists.
- [ ] Pages are separated from feature logic.
- [ ] API services are separated from UI.
- [ ] No feature bypasses architectural boundaries.

### Quality

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Tests can execute.
- [ ] No critical console errors remain.
- [ ] Build succeeds.

---

# 91. Definition of Done

`frontend-foundation.md` is considered implemented when:

1. React/Vite/TypeScript foundation is operational.
2. Tailwind foundation is operational.
3. Router foundation is operational.
4. Application layouts are operational.
5. Axios API client is operational.
6. TanStack Query is operational.
7. Environment configuration is operational.
8. Shared UI foundation is established.
9. Responsive shell is established.
10. Authentication route foundation is established.
11. Role-aware navigation foundation is established.
12. Loading/error/empty patterns are established.
13. Accessibility baseline is established.
14. Frontend testing foundation exists.
15. Production build succeeds.
16. The implementation follows the existing frontend architecture and project rules.

---

# 92. Unresolved Implementation Decisions

The following items remain subject to implementation review:

- exact authentication/session mechanism
- exact token/session storage strategy if applicable
- refresh/session expiration behavior
- exact TanStack Query defaults
- exact Axios interceptor behavior
- exact error response normalization
- final design token implementation
- exact theme persistence mechanism
- exact frontend test framework
- exact E2E framework
- final file upload progress implementation
- exact polling interval strategy
- exact chart library configuration
- final deployment environment variables
- final frontend observability tooling

These decisions must be documented when finalized.

---

# 93. Relationship With Other Documents

This document depends on:

```text
04-tech-stack/
05-architecture/frontend-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md
06-design/design-system.md
06-design/navigation.md
06-design/page-specifications.md
06-design/responsive-design.md
07-project-rules/frontend-rules.md
07-project-rules/coding-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md
09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
```

It supports:

```text
09-development/implementation-notes/authentication-implementation.md
09-development/implementation-notes/college-management-implementation.md
09-development/implementation-notes/academic-structure-implementation.md
09-development/implementation-notes/student-management-implementation.md
09-development/implementation-notes/result-import-implementation.md
09-development/implementation-notes/result-validation-implementation.md
09-development/implementation-notes/result-processing-implementation.md
09-development/implementation-notes/backlog-implementation.md
09-development/implementation-notes/academic-passport-implementation.md
09-development/implementation-notes/analytics-implementation.md
09-development/implementation-notes/student-portal-implementation.md
```

---

# 94. Status

**Draft / Under Review**

This document is the implementation foundation for the Acadlytic React frontend.

It should move through:

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

It must not be treated as permanently final until reviewed against:

- frontend architecture
- API contracts
- design system
- responsive requirements
- security rules
- backend implementation
- actual development constraints

---

# 95. Final Frontend Principle

The Acadlytic frontend should remain:

> **Feature-oriented, API-driven, type-safe, responsive, accessible, tenant-aware, and consistent with the backend as the authoritative source of academic truth.**

The frontend should make the platform easier to use without becoming the place where academic truth or authorization is defined.