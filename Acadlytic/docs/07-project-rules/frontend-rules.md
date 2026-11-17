# Acadlytic — Frontend Rules

**Project:** Acadlytic  
**Document:** Frontend Rules  
**Version:** 1.0  
**Status:** Draft / Under Review  
**Related Area:** `07-project-rules/`

---

# 1. Purpose

This document defines frontend-specific development rules for the Acadlytic web application.

These rules apply to:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Axios
- Recharts
- Lucide React

The purpose is to keep the frontend:

- consistent
- maintainable
- accessible
- responsive
- type-safe
- secure
- performant
- aligned with backend APIs
- aligned with the product architecture

---

# 2. Frontend Technology Baseline

The frontend technology baseline is:

```text
React
TypeScript
Vite
Tailwind CSS
React Router
TanStack Query
Zustand
React Hook Form
Zod
Axios
Recharts
Lucide React
```

The exact dependency versions are controlled by the frontend project configuration.

Do not upgrade major dependencies without reviewing compatibility.

---

# 3. Frontend Architecture

The frontend follows a feature-oriented architecture.

Conceptually:

```text
frontend/
└── src/
    ├── app/
    ├── pages/
    ├── features/
    ├── components/
    ├── hooks/
    ├── services/
    ├── store/
    ├── types/
    └── utils/
```

Feature-specific code should remain close to its feature.

---

# 4. Source of Truth

The frontend is not the source of truth for business data.

Authoritative data belongs to the backend/domain layer.

The frontend should:

- request data
- display data
- collect user input
- provide interaction
- perform UX-level validation
- send commands to the backend

The frontend must not independently redefine backend business rules.

---

# 5. Business Logic Rule

Do not place authoritative business logic inside React components.

Avoid implementing rules such as:

```text
Can this user process results?
Can this student access another student?
Should a backlog be cleared?
Is a result valid?
What is the official CGPA?
```

only in frontend code.

The backend must enforce these rules.

The frontend may mirror rules for user experience, but the backend remains authoritative.

---

# 6. TypeScript Rule

TypeScript must be used for application code.

Avoid introducing untyped JavaScript files into core application logic unless explicitly justified.

Prefer:

```typescript
type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";
```

over:

```typescript
const status: any = value;
```

---

# 7. Avoid `any`

The use of `any` should be avoided.

Bad:

```typescript
function processStudent(data: any) {
}
```

Prefer:

```typescript
function processStudent(data: StudentResponse) {
}
```

If a value is genuinely unknown, use:

```typescript
unknown
```

and validate/narrow it before use.

---

# 8. Type Definitions

API and domain types should be explicitly defined.

Example:

```typescript
interface StudentSummary {
  id: string;
  name: string;
  registrationNumber: string;
  status: StudentStatus;
}
```

Types should represent the API contract or frontend domain model clearly.

---

# 9. API Response Types

API responses should not be treated as untyped objects.

Prefer:

```typescript
const response =
  await studentApi.getStudent(studentId);
```

where the API method has a known response type.

Avoid:

```typescript
const response: any = await axios.get(...);
```

---

# 10. API Layer

Frontend API calls should be centralized.

Recommended structure:

```text
services/
├── api-client.ts
├── auth-api.ts
├── college-api.ts
├── student-api.ts
├── academic-api.ts
├── result-api.ts
├── backlog-api.ts
├── passport-api.ts
└── analytics-api.ts
```

Feature-specific API functions may also live inside the corresponding feature module when that structure is more appropriate.

---

# 11. Axios Configuration

Axios should use a centralized configured client.

Conceptually:

```typescript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});
```

Do not configure separate ad-hoc Axios clients throughout the application without a documented reason.

---

# 12. API Error Handling

API errors should be normalized through the shared API/error handling layer.

Components should not independently interpret every possible HTTP error format.

The frontend should understand the standard backend error contract defined by:

```text
05-architecture/api-architecture.md
```

---

# 13. Authentication State

Authentication state should be centralized.

It should represent information such as:

- authenticated state
- current user
- role
- college/tenant context where applicable
- session state

Avoid duplicating authentication state across many unrelated components.

---

# 14. `/me` API Rule

Student self-service should prefer `/me` endpoints where defined.

For example:

```text
GET /api/v1/me
GET /api/v1/me/dashboard
GET /api/v1/me/results
GET /api/v1/me/backlogs
GET /api/v1/me/academic-passport
GET /api/v1/me/analytics
```

The frontend should not require students to manually supply their own student ID when the backend already provides a `/me` endpoint.

---

# 15. Authorization in Frontend

The frontend may hide or disable actions based on role.

For example:

```text
SUPER_ADMIN
→ College creation visible

STUDENT
→ College creation hidden
```

However:

> Frontend visibility is not authorization.

The backend must independently enforce authorization.

---

# 16. Protected Routes

Protected application routes must use a centralized route protection strategy.

Conceptually:

```text
Route
 ↓
Authentication Check
 ↓
Authorization Check
 ↓
Tenant/Resource Check
 ↓
Page
```

Unauthorized users must not gain access merely by typing a URL manually.

---

# 17. Route Structure

Routes must follow the navigation specification.

Example:

```text
/app
/app/dashboard

/app/colleges
/app/colleges/:collegeId

/app/students
/app/students/:studentId

/app/results
/app/results/import

/app/backlogs
/app/academic-passport
/app/analytics
```

Do not create arbitrary routes without updating the navigation and page specifications.

---

# 18. Route Naming

Routes should be:

- predictable
- resource-oriented
- readable
- stable

Avoid unnecessary abbreviations.

Prefer:

```text
/app/students
```

over:

```text
/app/std
```

---

# 19. Page vs Component

A page represents a route-level experience.

A component represents reusable UI or feature behavior.

Example:

```text
pages/
└── college/
    └── CollegeDetailsPage.tsx

features/
└── colleges/
    ├── CollegeHeader.tsx
    ├── CollegeDetails.tsx
    └── CollegeActions.tsx
```

Avoid putting an entire complex page into one giant component.

---

# 20. Component Responsibility

Components should have a clear responsibility.

A component may handle:

- presentation
- user interaction
- composition
- local UI state

It should not become responsible for:

- database access
- authentication implementation
- business-rule ownership
- complex unrelated feature logic

---

# 21. Component Size

There is no strict line-count limit.

However, split a component when:

- it contains unrelated responsibilities
- logic becomes difficult to understand
- repeated UI exists
- testing becomes difficult
- conditional rendering becomes excessive

Do not split components merely to reduce line count.

---

# 22. Props

Props should be explicit and typed.

Prefer:

```typescript
interface StudentCardProps {
  student: StudentSummary;
  onView: (studentId: string) => void;
}
```

Avoid broad prop objects with unclear responsibilities.

---

# 23. Prop Drilling

Avoid excessive prop drilling.

If data must pass through many unrelated components, consider:

- composition
- context where appropriate
- Zustand for genuine global client state
- TanStack Query for server state

Do not introduce global state merely to avoid one or two levels of props.

---

# 24. Server State

Server state should primarily be managed through TanStack Query.

Examples:

- students
- colleges
- results
- backlogs
- Academic Passport
- analytics
- import jobs

Conceptually:

```text
Backend API
    ↓
TanStack Query
    ↓
React Components
```

---

# 25. Client State

Local UI state should remain local where possible.

Examples:

- modal open/close
- selected tab
- temporary form state
- drawer state
- expanded row

Use:

```typescript
useState
useReducer
```

where appropriate.

---

# 26. Global Client State

Zustand may be used for genuinely global client state.

Examples may include:

- authentication/session-related UI state
- application preferences
- theme
- persistent UI settings

Do not store all server data in Zustand.

---

# 27. Avoid Duplicate State

Do not maintain multiple independent copies of the same server data.

Bad:

```text
TanStack Query
      +
Zustand
      +
local component state
```

all containing separate copies of the same student record.

Prefer a single authoritative frontend representation.

---

# 28. Forms

Forms should use:

```text
React Hook Form
+
Zod
```

where appropriate.

Form responsibilities include:

- collecting input
- client-side validation
- displaying errors
- submission state

Backend validation remains authoritative.

---

# 29. Form Schema

Validation schemas should correspond to the expected input.

Example:

```typescript
const studentSchema = z.object({
  name: z.string().min(1),
  registrationNumber: z.string().min(1),
});
```

Do not duplicate complex backend business rules unnecessarily in frontend schemas.

---

# 30. Validation Messages

Validation messages should be:

- clear
- actionable
- close to the relevant field
- accessible

Avoid technical messages such as:

```text
ERR_FIELD_42
```

as the only user-facing message.

---

# 31. Loading States

Every asynchronous feature should consider loading behavior.

Examples:

- page loading
- table loading
- form submission
- import upload
- validation processing
- background processing

Use consistent loading components.

---

# 32. Error States

Every major asynchronous view should have an error state.

Example:

```text
Unable to load students.

[Try Again]
```

Do not leave the user with:

- blank screen
- endless spinner
- raw error object

---

# 33. Empty States

Empty data is not necessarily an error.

Examples:

```text
No students found.
No backlogs found.
No results available.
No imports have been created.
```

Provide useful context and an appropriate next action where possible.

---

# 34. Partial Data

Acadlytic may contain incomplete academic history.

The UI must distinguish:

```text
No data
```

from:

```text
Data unavailable / incomplete
```

Do not silently display incomplete data as complete academic history.

---

# 35. Result Import UI

The result import workflow should follow:

```text
Upload
 ↓
Configure
 ↓
Preview
 ↓
Validate
 ↓
Review
 ↓
Process
 ↓
Result
```

The frontend should not attempt to replace backend validation or processing.

---

# 36. Large Result Imports

Large result files must be processed asynchronously where required.

The frontend should:

1. submit the import
2. receive the job/import ID
3. display processing state
4. retrieve status
5. display validation/processing results
6. allow permitted follow-up actions

Do not keep a long-running HTTP request open unnecessarily.

---

# 37. Import Progress

Import progress should clearly communicate:

- current state
- records processed
- total records where available
- errors
- completion state

Example:

```text
Processing Results

780 / 1000 records

██████████████░░░░

Status: Processing
```

---

# 38. Tables

Tables should be reusable and consistent.

Important capabilities may include:

- sorting
- pagination
- filtering
- row actions
- selection where required
- responsive behavior
- loading
- empty state
- error state

Do not implement separate pagination logic for every table.

---

# 39. Server-Side Pagination

Large datasets must use backend pagination.

For example:

```text
GET /api/v1/students?page=0&size=20
```

The frontend must not download all students merely to display page one.

---

# 40. Search

Search for large datasets should use backend APIs.

Example:

```text
GET /api/v1/students?search=Samir
```

The frontend should not load the complete dataset and filter it locally unless the dataset is intentionally small and the page specification allows it.

---

# 41. URL-Based Filters

Filters that are important for navigation or shareable views should use URL query parameters where appropriate.

Examples:

```text
/app/students?course=BCA&year=2026
```

This helps preserve:

- refresh state
- browser navigation
- deep links
- shareable views

---

# 42. Debounced Search

Search fields that trigger server requests should use appropriate debouncing.

Do not make an API request for every individual keystroke unless explicitly required.

---

# 43. Tables and Mobile

Tables must follow:

```text
06-design/responsive-design.md
```

Possible mobile strategies:

- horizontal scrolling
- hidden secondary columns
- expandable rows
- detail drawer
- card representation

Do not reduce the table font until it becomes unreadable.

---

# 44. Charts

Charts should use the application's approved charting library.

Current baseline:

```text
Recharts
```

Charts must have:

- labels
- accessible context
- loading state
- empty state
- error state
- responsive sizing

---

# 45. Chart Data

Charts should receive prepared data from the appropriate feature/service layer.

Avoid placing complex data transformation logic directly inside chart JSX.

Prefer:

```text
API Response
 ↓
Data Transformation
 ↓
Chart Data
 ↓
Chart Component
```

---

# 46. Academic Calculations in Frontend

Do not independently calculate official:

- SGPA
- CGPA
- backlog state
- credit eligibility

in the frontend unless the feature specification explicitly requires a client-side calculator.

Official academic values must come from authoritative backend data.

---

# 47. Student Portal Rules

The Student Portal is read-oriented for academic information.

Students may view:

- results
- backlogs
- Academic Passport
- analytics

Students must not use the frontend to modify official academic records.

---

# 48. Academic Passport UI

Academic Passport should display authoritative academic information.

It must not independently derive conflicting values.

For example, if the backend returns:

```text
CGPA = 8.42
```

the frontend should display the value rather than independently recalculating it.

---

# 49. Analytics UI

Analytics pages should use backend-provided metrics.

The frontend may transform data for visualization but must not redefine official metric semantics.

Avoid changing:

```text
pass rate
failure rate
student count
credit completion
```

without documented requirements.

---

# 50. Date and Time

Frontend date/time formatting must follow the application's timezone rules.

Do not manually parse date strings using unreliable string operations.

Use a consistent date/time utility strategy.

---

# 51. Currency and Number Formatting

Formatting should be centralized where practical.

Examples:

```text
CGPA → 8.42
Percentage → 82.50%
Count → 1,250
```

Do not duplicate formatting logic throughout components.

---

# 52. Accessibility

Frontend components must follow accessibility requirements.

Required practices include:

- semantic HTML
- keyboard navigation
- visible focus
- accessible labels
- proper heading hierarchy
- correct form associations
- appropriate ARIA
- sufficient contrast
- accessible tables
- accessible dialogs

---

# 53. ARIA Rule

Use ARIA when necessary.

Do not add ARIA attributes blindly.

Prefer semantic HTML first.

For example:

```html
<button>
  Save
</button>
```

is preferable to creating a clickable `<div>` and attempting to make it behave like a button with ARIA.

---

# 54. Icon Rules

Use the project's approved icon library:

```text
Lucide React
```

Do not use arbitrary icon libraries for isolated components without approval.

Icon-only controls must have accessible labels.

---

# 55. Tailwind CSS

Tailwind CSS is the primary styling system.

Prefer utility classes and design tokens.

Avoid large amounts of component-specific custom CSS unless required.

---

# 56. Design Tokens

Do not hardcode repeated visual values everywhere.

Prefer centralized tokens for:

- colors
- spacing
- typography
- radius
- shadows
- breakpoints

The design system is the visual source of truth.

---

# 57. Dark Mode

Dark mode must follow the project design system.

Components must support both themes where dark mode is part of the product requirement.

Do not hardcode colors that break dark mode.

---

# 58. Responsive Design

All frontend features must follow:

```text
06-design/responsive-design.md
```

The baseline strategy is:

```text
Mobile First
↓
Tablet
↓
Desktop
↓
Large Desktop
```

---

# 59. Avoid Arbitrary Breakpoints

Do not create custom breakpoints for individual components unless required.

Prefer the project's centralized Tailwind breakpoint system.

---

# 60. Avoid Device Detection

Do not use JavaScript viewport detection for normal layout decisions.

Avoid:

```typescript
if (window.innerWidth < 768) {
  // mobile layout
}
```

Use CSS responsive utilities where possible.

---

# 61. Animations

Animations should be:

- subtle
- purposeful
- performant
- accessible

Avoid excessive animations in academic/admin workflows.

Respect:

```css
prefers-reduced-motion
```

---

# 62. Performance

Frontend performance must be considered from the beginning.

Use:

- route-based code splitting
- lazy loading
- memoization where justified
- pagination
- virtualization for very large lists
- optimized assets
- efficient queries

Do not optimize blindly.

Measure meaningful bottlenecks.

---

# 63. React Re-Renders

Avoid unnecessary re-renders.

However, do not add `useMemo`, `useCallback`, or `memo` everywhere without evidence.

Optimization should improve real performance rather than reduce readability.

---

# 64. Lists and Keys

React lists must use stable keys.

Prefer:

```tsx
students.map(student => (
  <StudentRow key={student.id} />
))
```

Avoid using array indexes as keys when list ordering can change.

---

# 65. Effects

`useEffect` should be used for synchronization with external systems.

Avoid using effects for calculations that can happen during rendering.

Do not create unnecessary effect chains.

---

# 66. Data Fetching

Do not fetch the same data repeatedly from multiple components without a clear reason.

Use TanStack Query caching and query composition appropriately.

---

# 67. Query Keys

Query keys must be stable and descriptive.

Example:

```typescript
[
  "students",
  {
    collegeId,
    courseId,
    page,
  }
]
```

Query keys must include variables that affect the requested data.

---

# 68. Mutation Handling

Mutations should provide:

- loading state
- success handling
- error handling
- cache invalidation/update where appropriate

After a mutation, ensure affected queries do not display stale data.

---

# 69. Optimistic Updates

Optimistic updates should only be used when:

- the operation is safe to represent optimistically
- rollback behavior is defined
- consistency implications are understood

Do not use optimistic updates for complex academic processing unless explicitly approved.

---

# 70. File Upload Security

Frontend file validation improves UX but is not security.

The frontend may validate:

- extension
- file size
- obvious type

The backend must perform authoritative validation.

---

# 71. Sensitive Data in Browser

Do not unnecessarily store sensitive data in:

- localStorage
- sessionStorage
- URL query strings
- browser logs

Authentication token storage strategy must follow the approved security architecture.

---

# 72. Secrets

Never place:

- API secrets
- database passwords
- private keys
- integration credentials

in frontend code.

Anything shipped to the browser should be considered public.

---

# 73. Console Logging

Production frontend code must not contain debugging logs that expose sensitive or unnecessary information.

Avoid:

```typescript
console.log(user);
console.log(token);
```

Use the project's approved error/reporting mechanism where applicable.

---

# 74. Error Boundaries

Major application areas should have appropriate error boundaries.

A rendering error in one feature should not unnecessarily destroy the complete application session.

---

# 75. Testing

Frontend code should include appropriate tests.

Depending on the feature:

```text
Component tests
Hook tests
Utility tests
API integration tests
End-to-end tests
Accessibility tests
```

Critical workflows should have automated coverage.

---

# 76. Component Test Requirements

Reusable components should be tested for important states.

For example:

```text
Button
→ default
→ loading
→ disabled
→ error-related context

DataTable
→ loading
→ empty
→ populated
→ error
→ pagination
```

---

# 77. Feature Testing

Important workflows should test complete user behavior.

Examples:

```text
Login
Result Import
Result Validation
Result Processing
Student Portal
Academic Passport
Backlog View
Analytics
```

---

# 78. Frontend Security Testing

Frontend testing should verify:

- protected routes
- unauthorized states
- role-based navigation
- token/session handling
- XSS-safe rendering
- safe file handling
- tenant-aware UI behavior

Backend authorization remains mandatory.

---

# 79. Dependency Rules

Before adding a frontend dependency:

1. Check whether the project already provides the capability.
2. Check whether an existing dependency can solve it.
3. Review maintenance.
4. Review security.
5. Review bundle impact.
6. Review TypeScript support.
7. Review license compatibility.

---

# 80. File Organization

Prefer:

```text
features/
  students/
    components/
    hooks/
    api/
    types/
    utils/
```

for feature-specific code when appropriate.

Shared components belong under shared/component areas.

Do not create a global utility for logic used by only one feature.

---

# 81. Utility Rules

Utilities should be:

- small
- generic
- deterministic where possible
- independently testable

Avoid putting feature-specific business logic into:

```text
utils/
```

---

# 82. Hooks

Custom hooks should represent reusable React behavior.

Examples:

```text
useAuth()
useDebounce()
usePagination()
useStudentFilters()
useAcademicPassport()
```

A hook should have a clear responsibility.

---

# 83. Custom Hook Rules

Avoid hooks that secretly perform many unrelated operations.

Bad conceptual example:

```text
useEverything()
```

Prefer focused hooks.

---

# 84. Constants

Frontend constants should be centralized when shared.

Examples:

```text
route constants
status labels
pagination defaults
feature configuration
```

Do not duplicate route strings throughout components.

---

# 85. Routes as Constants

Where appropriate, route generation should be centralized.

Avoid repeatedly writing fragile strings such as:

```typescript
`/app/students/${student.id}/academic-passport`
```

in many unrelated places.

Prefer route helper functions when complexity justifies them.

---

# 86. User-Facing Text

User-facing text should be clear and consistent.

Avoid inconsistent terminology such as:

```text
Student Record
Student Profile
Learner
Student Data
```

when the product terminology is simply:

```text
Student
```

Use the project glossary and design documentation.

---

# 87. Terminology

Use the established Acadlytic terminology:

```text
College
Student
Course
Semester
Subject
Result
Backlog
Academic Passport
Analytics
Result Import
Result Validation
Result Processing
```

Do not invent alternative names casually.

---

# 88. Confirmation Dialogs

Destructive actions should require appropriate confirmation.

Examples:

- deactivating a college
- suspending an account
- deleting permitted non-academic data

Confirmation should explain the consequence.

Do not use confirmation dialogs for every harmless action.

---

# 89. Destructive Academic Actions

Official academic data must be handled carefully.

Actions affecting:

- processed results
- attempts
- backlogs
- Academic Passport
- historical records

must follow the feature specification and backend authorization.

The frontend must not expose arbitrary delete/edit controls.

---

# 90. Unsaved Changes

Forms with significant edits should consider unsaved-change protection.

Examples:

- college profile
- student profile
- academic configuration

The behavior should be consistent with the application's navigation strategy.

---

# 91. Browser Refresh

Important workflow pages should remain usable after refresh where the state can be reconstructed from:

- URL
- server state
- authenticated session

Do not rely solely on ephemeral component state for essential workflow context.

---

# 92. Deep Links

Every authorized route should be directly navigable.

For example:

```text
/app/students/123
```

must work after a browser refresh if the user is authorized.

---

# 93. Loading Navigation

When navigation triggers a route-level loading state:

- preserve application shell
- provide visual feedback
- avoid blank screens
- avoid unnecessary full-page reloads

---

# 94. Accessibility and Loading

Loading indicators should not trap keyboard users.

Where appropriate, communicate asynchronous state through accessible status messaging.

---

# 95. Internationalization Readiness

The initial UI language may be English.

However:

- avoid embedding user-facing text into complex logic
- keep labels centralized where practical
- avoid layout assumptions that break with longer translated strings

---

# 96. Frontend Documentation

Significant frontend decisions should be documented.

Examples:

- navigation changes
- state-management decisions
- reusable component conventions
- responsive exceptions
- accessibility decisions
- dependency choices

---

# 97. AI Coding Agent Rules

AI coding agents working on the frontend must:

1. Read `coding-rules.md`.
2. Read `frontend-architecture.md`.
3. Read `design-system.md`.
4. Read `navigation.md`.
5. Read `page-specifications.md`.
6. Read `responsive-design.md`.
7. Read the relevant feature specification.
8. Follow API contracts.
9. Follow data ownership rules.
10. Never invent business rules.
11. Never bypass backend authorization.
12. Avoid unnecessary dependencies.
13. Preserve TypeScript typing.
14. Preserve accessibility.
15. Preserve responsive behavior.
16. Add/update tests.
17. Avoid unrelated refactoring.
18. Explain significant architectural changes.

---

# 98. Frontend Implementation Flow

A frontend feature should generally follow:

```text
Feature Requirement
       ↓
Feature Specification
       ↓
Page Specification
       ↓
Navigation
       ↓
Design System
       ↓
API Contract
       ↓
Feature Components
       ↓
State / Data Fetching
       ↓
Validation
       ↓
Responsive Implementation
       ↓
Accessibility
       ↓
Tests
       ↓
Code Review
```

---

# 99. Frontend Definition of Done

A frontend feature is complete when:

- [ ] Correct route exists
- [ ] Page follows page specification
- [ ] Navigation is updated
- [ ] Components follow design system
- [ ] TypeScript types are defined
- [ ] API integration follows the API architecture
- [ ] Server state uses the approved approach
- [ ] Forms use approved validation patterns
- [ ] Loading state exists
- [ ] Empty state exists
- [ ] Error state exists
- [ ] Authorization-aware UI is implemented
- [ ] Responsive behavior is implemented
- [ ] Accessibility is verified
- [ ] Tests are added/updated
- [ ] No unnecessary dependencies were added
- [ ] No sensitive information is exposed
- [ ] No business rules were moved into the frontend incorrectly
- [ ] Code review is completed

---

# 100. Relationship With Other Rules

Frontend development must follow:

```text
07-project-rules/coding-rules.md
        ↓
07-project-rules/frontend-rules.md
        ↓
Frontend Architecture
        ↓
Design System
        ↓
Page Specifications
        ↓
Feature Specifications
```

If a conflict is discovered, it must be reviewed rather than silently ignored.

---

# 101. Final Frontend Engineering Model

The Acadlytic frontend should follow:

```text
React + TypeScript
        ↓
Feature-Oriented Architecture
        ↓
Reusable Components
        ↓
TanStack Query
        ↓
Centralized API Layer
        ↓
Typed Contracts
        ↓
Responsive Design
        ↓
Accessible UI
        ↓
Secure Backend Interaction
```

The frontend is responsible for delivering a clear and efficient user experience.

The backend remains responsible for:

- authorization
- tenant isolation
- business rules
- data integrity
- academic processing
- source-of-truth data

---

# 102. Document Status

**Status:** Draft / Under Review

This document defines the frontend-specific engineering rules for Acadlytic.

It should be reviewed together with:

- `coding-rules.md`
- `backend-rules.md`
- `database-rules.md`
- `security-rules.md`
- `ai-coding-rules.md`
- `frontend-architecture.md`
- `design-system.md`
- `navigation.md`
- `page-specifications.md`
- `responsive-design.md`

After review and finalization, the document should move to:

**Approved / Implementation Ready**