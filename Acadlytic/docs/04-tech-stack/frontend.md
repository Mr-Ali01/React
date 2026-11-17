# Acadlytic — Frontend Technology Stack

**Document:** `04-tech-stack/frontend.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Frontend Technology Stack  
**Last Updated:** 2026-10-05

---

# 1. Purpose

This document defines the frontend technology stack for Acadlytic.

The frontend is responsible for:

- public-facing pages
- authentication interfaces
- administrator dashboards
- college management interfaces
- academic management
- student management
- result import workflows
- result validation and review
- academic records
- backlog tracking
- Academic Passport
- analytics dashboards
- student portal
- responsive user interfaces
- communication with the backend REST API

The frontend must remain a presentation and interaction layer.

It must not become the authoritative source of academic data or security rules.

---

# 2. Frontend Architecture

Acadlytic will use a modern React-based frontend.

```text
Browser
   ↓
React Application
   ↓
Routing
   ↓
Pages
   ↓
Feature Modules
   ↓
Reusable Components
   ↓
API Services
   ↓
Spring Boot REST API
```

The frontend communicates with the backend through HTTP/HTTPS APIs.

```text
React
  ↓
HTTP/HTTPS
  ↓
Spring Boot API
  ↓
Business Logic
  ↓
MySQL
```

The browser must never connect directly to MySQL.

---

# 3. Primary Frontend Stack

| Technology | Purpose | Status |
|---|---|---|
| React | UI framework/library | Selected |
| TypeScript | Static typing | Selected |
| Vite | Development/build tooling | Selected |
| Tailwind CSS | Styling and responsive UI | Selected |
| React Router | Client-side routing | Selected |
| TanStack Query | Server-state management | Selected |
| Zustand | Lightweight client state | Selected |
| React Hook Form | Form management | Selected |
| Zod | Client-side schema validation | Selected |
| Axios | HTTP client | Selected |
| Recharts | Analytics visualization | Selected |
| Lucide React | Icons | Selected |

---

# 4. React

## 4.1 Purpose

React is the primary UI technology for Acadlytic.

React will be used to build:

- pages
- layouts
- forms
- dashboards
- tables
- cards
- filters
- modals
- result-import workflows
- analytics visualizations
- student-facing views

---

## 4.2 React Architecture Principles

The frontend should use component-based architecture.

Components should have clear responsibilities.

Avoid creating large components that contain:

- API communication
- business logic
- complex state management
- UI rendering
- validation
- data transformation

all in one file.

---

# 5. TypeScript

## 5.1 Purpose

TypeScript will be used as the primary frontend programming language.

It provides static typing for:

- API responses
- API requests
- component props
- application state
- form data
- route parameters
- domain models
- utility functions

---

## 5.2 Type Safety

Important application data should have explicit types.

Example:

```ts
interface Student {
  id: number;
  studentIdentifier: string;
  name: string;
  programId: number;
  status: StudentStatus;
}
```

Avoid unnecessary use of:

```ts
any
```

when a meaningful type can be defined.

---

## 5.3 API Types

Frontend API types should correspond to API contracts rather than directly mirroring backend persistence entities.

```text
Backend Entity
      ↓
Backend DTO
      ↓
REST API
      ↓
Frontend API Type
```

---

# 6. Vite

## 6.1 Purpose

Vite will be used as the frontend development and build tool.

Responsibilities include:

- local development server
- module bundling
- production build
- environment configuration
- development-time hot module replacement

---

## 6.2 Development

The development environment should support fast feedback during implementation.

Typical command:

```bash
npm run dev
```

---

## 6.3 Production Build

Production builds should generate optimized static assets.

Typical command:

```bash
npm run build
```

---

# 7. Tailwind CSS

## 7.1 Purpose

Tailwind CSS will be used for styling the Acadlytic interface.

It will provide:

- layout utilities
- spacing
- typography
- colors
- responsive behavior
- states
- component styling

---

## 7.2 Design System

Tailwind usage should follow the Acadlytic design system.

Repeated visual values should be represented through shared design tokens where practical.

Avoid arbitrary styling differences between similar components.

---

## 7.3 Responsive Design

The interface must support responsive layouts.

Primary target categories:

```text
Desktop
Tablet
Mobile
```

Student-facing interfaces should receive particular attention for smaller screens.

---

# 8. React Router

## 8.1 Purpose

React Router will manage client-side navigation.

It will support areas such as:

```text
/
 /login

/admin
/admin/colleges
/admin/users

/college
/college/students
/college/results
/college/backlogs
/college/analytics

/student
/student/dashboard
/student/results
/student/backlogs
/student/passport
/student/analytics
```

The exact route structure will follow the navigation and architecture documentation.

---

## 8.2 Protected Routes

Protected routes shall prevent unauthorized users from accessing application areas.

However, route protection is not a replacement for backend authorization.

```text
Frontend Route Guard
        +
Backend Authorization
```

Both are required.

---

# 9. TanStack Query

## 9.1 Purpose

TanStack Query will manage server state.

It is suitable for:

- fetching students
- fetching academic records
- result-import status
- backlog data
- Academic Passport data
- analytics
- caching
- refetching
- mutation state

---

## 9.2 Server State vs Client State

Server state includes data owned by the backend.

Examples:

```text
Students
Results
Backlogs
Academic Records
Analytics
College Information
```

Client state includes temporary UI/application state.

Examples:

```text
Modal Open/Closed
Selected Tab
Sidebar State
Temporary Filters
```

These should not be unnecessarily mixed.

---

## 9.3 Query Invalidation

After a successful mutation, affected queries should be invalidated or updated appropriately.

Example:

```text
Process Result
      ↓
Academic Record Changed
      ↓
Invalidate Academic Record Query
      ↓
Refresh Relevant UI
```

---

# 10. Zustand

## 10.1 Purpose

Zustand will be used for lightweight client-side state where global state is actually required.

Potential use cases:

- authentication UI state
- application preferences
- sidebar state
- selected interface context
- temporary workflow state

---

## 10.2 State Management Rule

Do not place all application data into a global Zustand store.

Backend-owned data should normally remain managed through TanStack Query.

---

# 11. React Hook Form

## 11.1 Purpose

React Hook Form will be used for complex forms.

Potential use cases:

- login
- college creation
- user creation
- student creation
- academic structure forms
- filters
- configuration forms

---

## 11.2 Form Design

Forms should provide:

- clear labels
- validation feedback
- loading state
- disabled state during submission
- successful submission feedback
- meaningful error messages

---

# 12. Zod

## 12.1 Purpose

Zod will provide frontend schema validation where useful.

It may validate:

- form input
- API response assumptions
- query parameters
- local data structures

---

## 12.2 Backend Validation Remains Authoritative

Frontend validation improves user experience.

It does not replace backend validation.

```text
Frontend Validation
       ↓
User Experience
       ↓
Backend Validation
       ↓
Security + Data Integrity
```

---

# 13. Axios

## 13.1 Purpose

Axios will be used as the HTTP client where appropriate.

It will provide a centralized API communication layer.

---

## 13.2 Central API Client

A shared Axios instance should be created rather than configuring HTTP behavior independently throughout the application.

Conceptually:

```text
services/
└── api/
    ├── client.ts
    ├── authApi.ts
    ├── studentsApi.ts
    ├── resultsApi.ts
    ├── backlogsApi.ts
    └── analyticsApi.ts
```

---

## 13.3 API Error Handling

The API client should normalize common API errors so feature components do not need to duplicate HTTP error-handling logic.

---

# 14. Recharts

## 14.1 Purpose

Recharts will be used for academic analytics visualizations.

Potential visualizations include:

- pass/fail distribution
- backlog trends
- semester performance
- SGPA trends
- CGPA trends
- subject performance
- program-level metrics

---

## 14.2 Analytics Principle

Charts must represent backend-provided academic metrics.

The frontend must not independently redefine authoritative academic calculations.

---

# 15. Lucide React

## 15.1 Purpose

Lucide React will provide the application's icon system.

Icons may be used for:

- navigation
- actions
- status
- dashboards
- tables
- forms
- notifications

---

## 15.2 Icon Consistency

The project should use a consistent icon library rather than mixing multiple unrelated icon systems without a documented reason.

---

# 16. Frontend Folder Structure

Recommended structure:

```text
frontend/
├── public/
│
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
│   │   ├── colleges/
│   │   ├── users/
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
│   │
│   ├── services/
│   │   ├── api/
│   │   └── storage/
│   │
│   ├── store/
│   │
│   ├── types/
│   │
│   ├── utils/
│   │
│   ├── assets/
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

The exact configuration may change during implementation without changing the architectural principles.

---

# 17. Page Layer

The `pages` directory should contain route-level screens.

Examples:

```text
pages/
├── auth/
│   └── LoginPage.tsx
│
├── admin/
│   ├── DashboardPage.tsx
│   ├── CollegesPage.tsx
│   └── UsersPage.tsx
│
├── college/
│   ├── DashboardPage.tsx
│   ├── StudentsPage.tsx
│   ├── ResultsPage.tsx
│   ├── BacklogsPage.tsx
│   └── AnalyticsPage.tsx
│
└── student/
    ├── DashboardPage.tsx
    ├── ResultsPage.tsx
    ├── BacklogsPage.tsx
    ├── PassportPage.tsx
    └── AnalyticsPage.tsx
```

Pages should compose feature components rather than contain all feature logic themselves.

---

# 18. Feature Layer

Feature modules represent business capabilities.

Example:

```text
features/results/
├── components/
├── hooks/
├── api/
├── types/
└── utils/
```

The feature layer may contain:

- feature-specific components
- API hooks
- validation
- types
- UI state
- feature utilities

---

# 19. Shared UI Components

Reusable UI components should be placed in:

```text
components/ui/
```

Examples:

- Button
- Input
- Select
- Modal
- Dialog
- Table
- Badge
- Card
- Dropdown
- Tabs
- Pagination
- Alert
- EmptyState
- LoadingState

---

# 20. Shared Components

Components that are not tied to a single feature should be placed in:

```text
components/shared/
```

Examples:

- PageHeader
- SearchBar
- DataTable
- FilterBar
- ErrorState
- LoadingSpinner
- ConfirmDialog

Feature-specific behavior should remain inside the corresponding feature module.

---

# 21. Layouts

Application layouts should be centralized.

Examples:

```text
layouts/
├── PublicLayout.tsx
├── AuthLayout.tsx
├── AdminLayout.tsx
├── CollegeLayout.tsx
└── StudentLayout.tsx
```

Layouts may manage:

- navigation
- sidebar
- header
- page container
- responsive structure

---

# 22. API Service Layer

Frontend API communication shall be centralized.

Example:

```text
services/api/
├── client.ts
├── authApi.ts
├── collegeApi.ts
├── userApi.ts
├── academicApi.ts
├── studentApi.ts
├── resultImportApi.ts
├── resultValidationApi.ts
├── resultProcessingApi.ts
├── backlogApi.ts
├── passportApi.ts
└── analyticsApi.ts
```

Components should not contain scattered raw HTTP requests.

---

# 23. Authentication State

The frontend may maintain the minimum authentication information required for the user experience.

It may need to know:

- authenticated/unauthenticated state
- current user
- role
- tenant context where appropriate

The frontend must not treat its stored state as proof of authorization.

---

# 24. Token and Credential Handling

Authentication implementation must follow the backend security model.

The frontend must:

- avoid exposing credentials
- avoid logging tokens
- avoid placing sensitive information into URLs
- use secure transport
- follow the chosen authentication/session mechanism

The exact token-storage strategy must be finalized together with the backend authentication implementation.

---

# 25. Loading States

Every asynchronous workflow should provide an appropriate loading state.

Examples:

```text
Loading students...
Loading academic records...
Uploading result...
Validating results...
Processing results...
Loading analytics...
```

Loading states should prevent confusing duplicate actions.

---

# 26. Empty States

The UI shall distinguish between:

- no data
- data still loading
- data unavailable because of an error
- filtered results with no matches

Example:

```text
No students found.

Try changing your search or filters.
```

An empty state must not be presented as an error.

---

# 27. Error States

The frontend shall provide understandable error states.

Examples:

```text
Unable to load students.
Please try again.
```

For import validation:

```text
12 records require attention.

Review the validation issues before processing.
```

Internal backend details must not be displayed to ordinary users.

---

# 28. Form Validation

Frontend forms should validate obvious user input before submission.

Examples:

- required fields
- invalid email
- invalid number
- invalid date
- invalid format
- missing selection

However:

> Client-side validation is a usability mechanism, not a security boundary.

---

# 29. Result Import UI Requirements

The result import interface should support a clear workflow:

```text
Select File
    ↓
Upload
    ↓
Parsing
    ↓
Validation
    ↓
Review
    ↓
Resolve Issues
    ↓
Revalidate
    ↓
Process
    ↓
Completion Summary
```

The frontend must reflect the backend import state.

---

# 30. Result Validation UI

Validation screens should clearly distinguish:

- valid records
- invalid records
- warnings
- unresolved records

The interface should allow authorized users to identify the reason for a validation issue.

---

# 31. Result Processing UI

The processing interface should communicate:

- whether processing can start
- current processing state
- successful records
- failed records
- processing completion
- processing errors

The frontend must not imply successful processing before receiving authoritative backend confirmation.

---

# 32. Academic Passport UI

The Academic Passport should present a consolidated read-oriented academic view.

Possible sections:

```text
Student Profile
Academic Program
Semester Summary
Subject Results
Attempt History
Credits
SGPA
CGPA
Backlogs
Current Academic Status
```

The UI should consume backend-derived data rather than independently calculating authoritative values.

---

# 33. Analytics UI

Analytics pages should provide understandable visual representations.

Potential components:

- KPI cards
- charts
- tables
- filters
- semester selectors
- program selectors
- subject selectors

Charts must clearly communicate:

- metric name
- relevant period/context
- units
- empty state
- loading state
- error state

---

# 34. Tables

Tables should support appropriate:

- pagination
- sorting
- filtering
- search
- row actions
- responsive behavior

Large datasets should not be rendered entirely on the client when server-side pagination is appropriate.

---

# 35. Responsive Tables

On smaller screens, large tables should use an appropriate strategy such as:

- horizontal scrolling
- responsive row layout
- prioritized columns
- separate mobile detail view

Critical academic information must remain accessible.

---

# 36. Accessibility

Frontend implementation should consider:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- appropriate ARIA attributes
- readable error messages
- sufficient contrast
- non-color-only status communication

Accessibility should be considered during component development rather than added only at the end.

---

# 37. Frontend Performance

The frontend should minimize unnecessary work.

Appropriate techniques may include:

- code splitting
- lazy loading
- query caching
- pagination
- memoization where justified
- optimized assets
- avoiding unnecessary global state
- minimizing duplicate API requests

Optimization should be based on measured bottlenecks rather than premature complexity.

---

# 38. Frontend Security Boundary

The frontend must never be treated as the final security layer.

For example:

```text
Frontend:
Hide Admin Button
        ↓
Backend:
Verify ADMIN Permission
        ↓
Allow/Deny
```

Removing a button does not constitute authorization.

---

# 39. Environment Configuration

Frontend environment-specific configuration should be externalized.

Typical values may include:

```text
VITE_API_BASE_URL
```

Example:

```text
Development
http://localhost:8080/api/v1

Production
https://api.example.com/api/v1
```

Actual production URLs will be defined during deployment configuration.

Secrets must not be embedded into frontend source code.

---

# 40. Frontend Testing Stack

The frontend should support testing at multiple levels.

Recommended categories:

```text
Unit Tests
Component Tests
Integration Tests
End-to-End Tests
Accessibility Tests
```

The exact testing libraries should be finalized in the testing documentation and project setup.

---

# 41. Frontend Coding Principles

The frontend implementation should follow these principles:

1. Prefer TypeScript types over `any`.
2. Keep components focused.
3. Avoid unnecessary global state.
4. Keep API communication centralized.
5. Keep business rules out of presentational components.
6. Do not duplicate backend business logic unnecessarily.
7. Reuse common UI components.
8. Keep feature modules organized.
9. Handle loading, empty, and error states.
10. Keep accessibility in mind.
11. Do not trust client-side authorization.
12. Do not expose sensitive information.
13. Preserve backend data semantics.
14. Keep academic calculations consistent with configured backend rules.

---

# 42. Frontend Technology Decision

The selected frontend stack is:

```text
React
+
TypeScript
+
Vite
+
Tailwind CSS
+
React Router
+
TanStack Query
+
Zustand
+
React Hook Form
+
Zod
+
Axios
+
Recharts
+
Lucide React
```

This stack provides:

- component-based development
- static typing
- modern build tooling
- responsive styling
- structured routing
- server-state management
- lightweight client-state management
- form handling
- validation
- API communication
- analytics visualization
- consistent icons

---

# 43. Frontend Scope Boundary

The frontend is responsible for:

- presentation
- interaction
- client-side validation
- navigation
- API communication
- local UI state
- server-state presentation

The frontend is **not** responsible for being the authoritative source of:

- student academic records
- result processing
- backlog state
- SGPA/CGPA rules
- tenant authorization
- role authorization
- academic truth

These responsibilities belong to the backend and domain architecture.

---

# 44. Definition of Done

The frontend technology stack is considered sufficiently defined when:

- React is selected
- TypeScript is selected
- Vite is selected
- Tailwind CSS is selected
- routing technology is selected
- server-state management is defined
- client-state management is defined
- form handling is defined
- validation approach is defined
- API communication approach is defined
- analytics visualization technology is defined
- icon system is defined
- frontend structure is documented
- API boundary is documented
- authentication boundary is documented
- tenant/security boundary is documented
- responsive requirements are documented
- accessibility expectations are documented
- performance principles are documented
- testing expectations are documented

---

# 45. Final Principle

> **The Acadlytic frontend is a typed, component-based presentation layer that communicates with the backend through well-defined APIs while keeping academic truth, authorization, tenant isolation, and business rules on the server.**

The frontend should make the academic workflow understandable and efficient without becoming responsible for authoritative academic decisions.