# Acadlytic Navigation Architecture

**Project:** Acadlytic  
**Document:** Navigation Architecture  
**Version:** 1.0  
**Status:** Draft / Under Review  
**Last Updated:** 2026-10-04  
**Owner:** Acadlytic Product & Engineering Team  

---

# 1. Purpose

This document defines the navigation architecture for the Acadlytic platform.

It establishes:

- Application navigation structure
- Role-based navigation
- Primary navigation
- Secondary navigation
- Header navigation
- Sidebar navigation
- Mobile navigation
- Breadcrumbs
- Route organization
- Active navigation states
- Navigation permissions
- Navigation visibility rules
- Navigation hierarchy
- Navigation behavior
- Deep-link behavior
- Error and fallback navigation
- Accessibility requirements

The purpose is to ensure that users can move through Acadlytic predictably and efficiently.

---

# 2. Navigation Principles

Acadlytic navigation follows these principles.

## 2.1 Role-Based Navigation

Different users have different responsibilities.

The navigation must reflect the user's authorized capabilities.

Primary roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Navigation visibility may differ between these roles.

However:

> Frontend navigation visibility is not an authorization mechanism.

The backend remains responsible for authorization.

---

## 2.2 Task-Oriented Navigation

Navigation should be organized around what users need to accomplish rather than internal technical modules.

For example:

```text
Students
Results
Backlogs
Analytics
```

is preferable to exposing implementation concepts such as:

```text
StudentModule
ResultProcessingService
AnalyticsRepository
```

---

## 2.3 Predictable Hierarchy

Users should be able to understand:

```text
Where am I?
Where can I go?
How do I return?
What is the current section?
```

---

## 2.4 Minimal Navigation

Only frequently relevant destinations should appear in primary navigation.

Less frequently used actions should be placed under:

- Secondary navigation
- Context menus
- Settings
- Detail pages

---

## 2.5 Consistent Navigation

Navigation patterns must remain consistent across the application.

Examples:

- Sidebar remains structurally consistent.
- Active item is clearly identifiable.
- Mobile navigation follows one pattern.
- Breadcrumbs follow one hierarchy.
- Back navigation behaves predictably.

---

# 3. Application Navigation Architecture

The overall navigation structure is:

```text
Acadlytic
│
├── Public Website
│
├── Authentication
│
└── Authenticated Application
    │
    ├── SUPER_ADMIN
    │
    ├── COLLEGE_ADMIN
    │
    ├── ACADEMIC_STAFF
    │
    └── STUDENT
```

Each authenticated role receives a role-appropriate navigation experience.

---

# 4. Public Navigation

The public website is accessible without authentication.

Recommended public navigation:

```text
Home
About
Features
Calculators / Tools
Contact
Login
```

The exact public website navigation may evolve independently from the authenticated application.

---

# 5. Authentication Navigation

Authentication-related pages are separate from application navigation.

Typical routes:

```text
/login
/forgot-password
/reset-password
```

Potential future routes:

```text
/activate-account
/set-password
```

Authentication pages should not display the authenticated application sidebar.

---

# 6. Authenticated Application Shell

The authenticated application should use a consistent application shell.

Conceptual structure:

```text
┌─────────────────────────────────────────────────────┐
│ Header                                  User Menu   │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│ Sidebar       │ Main Content                        │
│               │                                     │
│ Navigation    │ Page                                │
│               │                                     │
│               │                                     │
└───────────────┴─────────────────────────────────────┘
```

The shell contains:

- Header
- Sidebar
- Main content
- User/account controls

---

# 7. Application Header

The header provides global application-level controls.

Typical elements:

```text
Logo / Brand
Page or application context
Notifications (when implemented)
User menu
```

The header should not become overloaded with feature-specific actions.

Feature-specific actions belong inside the page content.

---

# 8. User Menu

The authenticated user menu may contain:

```text
Profile
Settings
Change Password
Logout
```

Availability may differ by role.

For students, this may correspond to:

```text
Profile
Settings
Logout
```

---

# 9. Sidebar Navigation

The sidebar is the primary navigation mechanism for desktop authenticated users.

It should contain:

- Primary destinations
- Logical grouping
- Active route
- Optional section labels
- Collapse behavior where implemented

The sidebar should not contain every possible action.

---

# 10. Sidebar Groups

Navigation items should be grouped according to user tasks.

Example administrative structure:

```text
Dashboard

Academic
    Students
    Academic Structure
    Results
    Backlogs

Insights
    Analytics

System
    Settings
```

Exact groupings may vary by role.

---

# 11. SUPER_ADMIN Navigation

The Super Admin manages the Acadlytic platform and tenant-level entities.

Recommended navigation:

```text
Dashboard

Platform
    Colleges
    Users

Academic
    Academic Structure
    Results
    Backlogs

Insights
    Analytics

System
    Settings
    Audit / Activity Logs
```

Some items may be restricted to specific Super Admin permissions as the permission model evolves.

---

# 12. SUPER_ADMIN Responsibilities Reflected in Navigation

Navigation should support Super Admin tasks such as:

- Managing colleges
- Managing college administrators
- Viewing platform-level information
- Managing platform configuration
- Reviewing audit information
- Managing supported academic structures where authorized

Super Admin should not automatically receive unrestricted student-facing functionality unless explicitly required.

---

# 13. COLLEGE_ADMIN Navigation

College Admin operates within a college tenant.

Recommended navigation:

```text
Dashboard

Academic
    Students
    Academic Structure
    Results
    Backlogs

Insights
    Analytics

College
    College Profile

Settings
    Settings
```

Result Import may appear under:

```text
Results
```

or as a dedicated result workflow depending on final page specifications.

---

# 14. ACADEMIC_STAFF Navigation

Academic Staff primarily performs academic operations.

Recommended navigation:

```text
Dashboard

Academic
    Students
    Academic Structure
    Results
    Backlogs

Insights
    Analytics

Profile
    Profile
    Settings
```

The exact available actions depend on the final permission model.

---

# 15. STUDENT Navigation

Student navigation should be significantly simpler.

Recommended navigation:

```text
Dashboard

Academic
    Academic Passport
    Results
    Backlogs
    Analytics

Account
    Profile
    Settings
```

Student navigation should not expose administrative operations such as:

- Result Import
- Result Validation
- Result Processing
- College Management
- Academic Structure Management

---

# 16. Student Navigation Philosophy

Student navigation should focus on answering:

```text
How am I performing?
What are my results?
What backlogs do I have?
What is my academic history?
What is my progress?
```

The student should not need to understand internal Acadlytic modules.

---

# 17. Navigation Role Matrix

| Navigation Area | Super Admin | College Admin | Academic Staff | Student |
|---|---:|---:|---:|---:|
| Dashboard | Yes | Yes | Yes | Yes |
| Colleges | Yes | No | No | No |
| Users | Yes | Limited | Limited | No |
| Students | Yes | Yes | Yes | No |
| Academic Structure | Yes | Yes | Yes | No |
| Results | Yes | Yes | Yes | Own |
| Result Import | Yes | Yes | Yes | No |
| Backlogs | Yes | Yes | Yes | Own |
| Academic Passport | Authorized | Authorized | Authorized | Own |
| Analytics | Platform/Authorized | College | Authorized | Own |
| College Profile | Yes | Own College | View where permitted | No |
| Settings | Platform | College | User | User |
| Audit Logs | Yes | Limited where authorized | Limited where authorized | No |

This matrix represents navigation visibility and expected access.

Backend authorization remains authoritative.

---

# 18. Navigation vs Authorization

Navigation must not be treated as security.

For example:

```text
Student
    ↓
Does not see /results/import
```

does not mean the endpoint is secure.

The backend must independently reject unauthorized requests.

Required flow:

```text
Frontend Navigation
       ↓
User selects page
       ↓
Route Guard
       ↓
API Request
       ↓
Backend Authentication
       ↓
Backend Authorization
       ↓
Tenant Validation
       ↓
Response
```

---

# 19. Route Architecture

Frontend routes should follow resource-oriented URL structures.

Recommended base:

```text
/
```

Public:

```text
/
/about
/features
/contact
```

Authentication:

```text
/login
/forgot-password
/reset-password
```

Authenticated application:

```text
/app
```

---

# 20. Dashboard Routes

Recommended:

```text
/app
/app/dashboard
```

The application may use `/app` as the authenticated entry point and redirect users to their role-appropriate dashboard.

Example:

```text
/app
   ↓
Role Detection
   ↓
Role Dashboard
```

---

# 21. College Routes

Recommended:

```text
/app/colleges
/app/colleges/:collegeId
/app/colleges/:collegeId/edit
```

For Super Admin.

College-specific profile:

```text
/app/college
/app/college/edit
```

may be used for College Admin depending on the final routing strategy.

---

# 22. Student Routes

Administrative student management:

```text
/app/students
/app/students/:studentId
/app/students/:studentId/edit
```

Student self-service:

```text
/app/academic-passport
/app/results
/app/backlogs
/app/analytics
```

Students should generally use `/me` APIs behind these pages rather than relying on user-editable student IDs.

---

# 23. Academic Structure Routes

Recommended:

```text
/app/academic
/app/academic/courses
/app/academic/courses/:courseId
/app/academic/semesters
/app/academic/subjects
```

The exact hierarchy depends on the final academic-structure page specification.

---

# 24. Result Routes

Recommended:

```text
/app/results
/app/results/import
/app/results/import/:importId
/app/results/import/:importId/validation
/app/results/import/:importId/records
/app/results/import/:importId/processing
```

These routes represent the result workflow.

---

# 25. Backlog Routes

Recommended:

```text
/app/backlogs
/app/students/:studentId/backlogs
```

The first route is intended for authorized administrative views.

The second may be used for authorized student-detail views.

Students should use:

```text
/app/backlogs
```

with their own `/me/backlogs` API.

---

# 26. Academic Passport Routes

Administrative/student-detail view:

```text
/app/students/:studentId/academic-passport
```

Student self-service:

```text
/app/academic-passport
```

Backend API selection determines whether the request uses:

```text
/students/{studentId}/academic-passport
```

or:

```text
/me/academic-passport
```

---

# 27. Analytics Routes

Administrative analytics:

```text
/app/analytics
/app/analytics/courses/:courseId
/app/analytics/semesters/:semesterId
```

Student analytics:

```text
/app/analytics
```

The page content and API response must be role-aware.

---

# 28. Settings Routes

Recommended:

```text
/app/settings
/app/settings/profile
/app/settings/security
```

Additional settings may be introduced later.

Settings should not become a catch-all location for unrelated features.

---

# 29. Route Naming Rules

Routes should:

- Use lowercase
- Use plural nouns for collections
- Use stable resource identifiers
- Avoid implementation terminology
- Avoid verbs where possible

Prefer:

```text
/students/:studentId
```

over:

```text
/getStudent/:studentId
```

Prefer:

```text
/results/import
```

over:

```text
/processResultFile
```

---

# 30. Route Parameters

Resource identifiers should be used consistently.

Example:

```text
/students/:studentId
```

not:

```text
/students/:id
```

when the route contains multiple resource types and explicit naming improves readability.

---

# 31. Nested Routes

Nested routes should represent genuine hierarchy.

Example:

```text
/students/:studentId/academic-passport
```

is appropriate because the passport belongs to the student.

Avoid deeply nested URLs when they do not communicate meaningful resource relationships.

---

# 32. Active Navigation State

The active navigation item must clearly communicate the current section.

Possible indicators:

- Background
- Text weight
- Icon treatment
- Border/accent indicator

Do not rely solely on color.

---

# 33. Parent Navigation State

If a child route is active, the parent navigation group should also communicate its active state.

Example:

```text
Academic
   ├── Students      ← active
   ├── Results
   └── Backlogs
```

The `Academic` group remains visually expanded/active.

---

# 34. Navigation Expansion

Expandable navigation groups should:

- Clearly show expanded/collapsed state
- Support keyboard interaction
- Preserve active child visibility
- Avoid unexpected navigation when expanding

Example:

```text
Academic  v
    Students
    Results
    Backlogs
```

---

# 35. Sidebar Collapse

If sidebar collapse is implemented, collapsed mode should preserve usability.

Collapsed mode may display:

```text
[icon]
[icon]
[icon]
```

but each icon-only item must have:

- Accessible label
- Tooltip where appropriate
- Visible active state

---

# 36. Mobile Navigation

Mobile devices should use a mobile navigation pattern.

Recommended structure:

```text
┌───────────────────────────┐
│ Menu     Acadlytic   User │
└───────────────────────────┘
```

Opening the menu:

```text
┌───────────────────────────┐
│ Navigation Drawer         │
│                           │
│ Dashboard                 │
│ Students                  │
│ Results                   │
│ Backlogs                  │
│ Analytics                 │
│                           │
└───────────────────────────┘
```

The exact visual implementation belongs to the design system.

---

# 37. Mobile Drawer Rules

The mobile navigation drawer should:

- Open from a consistent direction
- Provide a clear close action
- Close with Escape where applicable
- Support keyboard focus
- Prevent inaccessible background interaction where required
- Preserve the active route
- Close after navigation where appropriate

---

# 38. Mobile Bottom Navigation

A bottom navigation bar may be considered for student-facing mobile interfaces if usability testing supports it.

Potential destinations:

```text
Home
Passport
Results
Backlogs
More
```

This is optional and should not duplicate the complete desktop navigation.

---

# 39. Breadcrumb Navigation

Breadcrumbs should communicate page hierarchy.

Example:

```text
Students
  /
Rahul Sharma
  /
Academic Passport
```

The current page should not normally be presented as an interactive breadcrumb link.

---

# 40. Breadcrumb Rules

Breadcrumbs should:

- Follow route hierarchy
- Use meaningful names
- Avoid technical IDs
- Support keyboard navigation
- Remain readable on mobile

Example:

Bad:

```text
Students / 18372 / academic-passport
```

Better:

```text
Students / Rahul Sharma / Academic Passport
```

---

# 41. Back Navigation

Back actions should be used where users naturally enter a detail workflow.

Example:

```text
← Back to Students
```

The destination should be predictable.

Browser back navigation must also remain functional.

---

# 42. Deep Links

Every valid application route should be directly addressable.

Example:

```text
/app/students/123
```

Refreshing the page should not cause the application to lose the route.

The deployment configuration must support SPA fallback routing.

---

# 43. Unauthorized Route

When a user attempts to access a route they are not authorized to access, the application should display an appropriate unauthorized page.

Example:

```text
Access Restricted

You do not have permission to access this page.

[Return to Dashboard]
```

Typical HTTP/API response:

```text
403 Forbidden
```

---

# 44. Unauthenticated Route

If an unauthenticated user attempts to access a protected route:

```text
Protected Route
      ↓
No valid authentication
      ↓
Login
```

After successful login, the application may return the user to the originally requested route where safe and appropriate.

---

# 45. Not Found Route

Invalid application routes should display a dedicated not-found page.

Example:

```text
Page Not Found

The page you are looking for does not exist.

[Go to Dashboard]
```

Typical route:

```text
*
```

for the frontend fallback.

---

# 46. Inactive Account Navigation

If an authenticated account becomes inactive or suspended, the application must not continue providing normal authenticated navigation.

The application should respond according to the authentication/session policy.

Potential flow:

```text
Authenticated Session
        ↓
Account Status Check
        ↓
Inactive/Suspended
        ↓
Restricted Access
        ↓
Appropriate Message / Logout
```

---

# 47. Tenant-Aware Navigation

College users operate within a tenant.

The UI may display the current college context.

Example:

```text
Acadlytic

ABC College of Engineering
```

This helps prevent accidental confusion when users work with college-specific data.

---

# 48. Tenant Switching

Tenant switching should not be exposed to ordinary College Admin or Academic Staff users.

If multi-tenant switching is required for Super Admin in the future, it should use an explicit controlled mechanism.

Example:

```text
Current College
ABC College

[Switch College]
```

Tenant switching must update backend context and permissions safely.

---

# 49. College Context Indicator

Where useful, the authenticated application may display:

```text
College: ABC College
```

This should be especially considered on administrative pages where users may perform consequential academic operations.

---

# 50. Navigation and Result Processing

Result processing is a high-impact workflow.

Navigation should make the workflow clear:

```text
Results
    ↓
Import Results
    ↓
Import Details
    ↓
Validation
    ↓
Review
    ↓
Processing
    ↓
Completed
```

Users should not need to navigate through unrelated pages to complete an import.

---

# 51. Navigation and Academic Passport

Academic Passport is a primary academic destination for students.

Student navigation:

```text
Dashboard
    ↓
Academic Passport
    ↓
Semester
    ↓
Subject Details
    ↓
Attempt History
```

Administrative users may reach a student's passport from:

```text
Students
    ↓
Student Details
    ↓
Academic Passport
```

---

# 52. Navigation and Analytics

Analytics should be accessible from a dedicated navigation destination.

Example:

```text
Insights
    └── Analytics
```

Analytics pages may then provide:

```text
College
Course
Semester
Student
Subject
```

depending on role and authorization.

---

# 53. Navigation and Search

Search should be available where users frequently need to locate records.

Examples:

```text
Student Search
Result Search
College Search
```

Search should not become the primary replacement for navigation.

---

# 54. Navigation and Filters

Filters belong within the relevant page rather than the global navigation.

Example:

```text
Analytics
    ↓
Academic Year
Course
Semester
```

These should not become sidebar navigation items.

---

# 55. Navigation and Notifications

Notifications are not part of the initial MVP navigation requirement.

If introduced later, notifications may appear in the application header.

Potential future notifications:

- Import completed
- Import failed
- Important academic updates
- Administrative alerts

Notification behavior must be documented separately before implementation.

---

# 56. Navigation Accessibility

Navigation must support:

- Keyboard navigation
- Semantic navigation landmarks
- Screen reader labels
- Visible focus
- Current-page indication
- Expand/collapse announcements where appropriate
- Accessible mobile drawer behavior

Use appropriate semantic elements such as:

```html
<nav>
```

for navigation areas.

---

# 57. Current Page Accessibility

The active navigation item should expose appropriate semantic state.

Where applicable:

```html
aria-current="page"
```

should be used.

Expandable navigation groups should use:

```html
aria-expanded="true|false"
```

when appropriate.

---

# 58. Navigation Icons

Icons should be consistent with the design system.

Recommended examples:

```text
Dashboard       → LayoutDashboard
Students        → Users
Academic        → GraduationCap
Results         → FileText
Backlogs        → AlertCircle
Analytics       → BarChart3
Settings        → Settings
Profile         → User
Colleges        → Building2
```

The final icon mapping may be adjusted during implementation.

---

# 59. Navigation Labels

Navigation labels should be:

- Short
- Familiar
- Consistent
- Action-oriented where appropriate

Prefer:

```text
Students
Results
Backlogs
Analytics
```

Avoid:

```text
Student Management Module
Academic Result Processing Management
Backlog Management System
```

---

# 60. Navigation Ordering

Primary navigation should prioritize frequency and importance.

General order:

```text
Dashboard
Core Academic Work
Insights
Administration
Settings
```

Role-specific ordering may differ.

---

# 61. Student Navigation Ordering

Recommended:

```text
Dashboard
Academic Passport
Results
Backlogs
Analytics
Profile
Settings
```

This prioritizes the student's most important academic information.

---

# 62. College Admin Navigation Ordering

Recommended:

```text
Dashboard
Students
Academic Structure
Results
Backlogs
Analytics
College
Settings
```

---

# 63. Academic Staff Navigation Ordering

Recommended:

```text
Dashboard
Students
Academic Structure
Results
Backlogs
Analytics
Settings
```

---

# 64. Super Admin Navigation Ordering

Recommended:

```text
Dashboard
Colleges
Users
Academic Structure
Results
Backlogs
Analytics
Audit / Activity
Settings
```

Exact ordering may change when platform administration requirements are finalized.

---

# 65. Navigation Visibility Rules

A navigation item should be displayed only when:

1. The user is authenticated where authentication is required.
2. The user's role is eligible.
3. The relevant feature is enabled.
4. The tenant context is valid where applicable.

However, visibility is only a UX optimization.

The backend must enforce the actual permission.

---

# 66. Feature Flags

Future features may be hidden behind feature flags.

Example:

```text
Feature Available?
       ↓
Yes → Show Navigation
No  → Hide Navigation
```

Feature flags must not bypass authorization.

---

# 67. Disabled Navigation Items

Disabled navigation items should be used sparingly.

If a feature is unavailable, it is generally better to hide it unless showing it provides meaningful context.

Do not show large numbers of permanently disabled menu items.

---

# 68. Navigation State Persistence

Where useful, the application may preserve:

- Sidebar collapsed state
- Expanded navigation groups
- Selected filters where appropriate

Persistence must not override route correctness or authorization.

---

# 69. Navigation on Page Refresh

Refreshing the browser must preserve:

- Current route
- Valid application state
- Authentication state according to the session mechanism

The application should not always redirect users to the dashboard after every refresh.

---

# 70. Navigation After Login

After successful login:

```text
Login
   ↓
Authentication
   ↓
Role Resolution
   ↓
Tenant Resolution
   ↓
Role-Appropriate Destination
```

Example:

```text
SUPER_ADMIN
    → Platform Dashboard

COLLEGE_ADMIN
    → College Dashboard

ACADEMIC_STAFF
    → Academic Dashboard

STUDENT
    → Student Dashboard
```

---

# 71. Navigation After Logout

After logout:

```text
Logout
   ↓
Session Invalidation
   ↓
Clear Authenticated Client State
   ↓
Login / Public Landing Page
```

Protected pages must no longer be accessible through client-side navigation.

---

# 72. Navigation Error Handling

Navigation-related errors should not leave the application in an unusable state.

If a destination fails to load:

```text
Page
  ↓
Loading
  ↓
Error
  ↓
Retry / Navigate Back
```

The global application shell should remain functional where possible.

---

# 73. Navigation Performance

Navigation should feel immediate.

Requirements include:

- Lazy loading of large route modules
- Code splitting
- Efficient route guards
- Avoiding unnecessary API requests
- Preserving appropriate cached data
- Showing loading states during transitions where required

---

# 74. Route-Based Code Splitting

Large application areas should be loaded on demand.

Conceptual structure:

```text
Application
    ↓
Route
    ↓
Load Feature Bundle
    ↓
Render Page
```

This is especially useful for:

- Analytics
- Result Import
- Administrative modules

---

# 75. Navigation and Frontend Architecture

Navigation must remain consistent with:

```text
05-architecture/frontend-architecture.md
```

Recommended React structure:

```text
app/
├── router/
├── layouts/
└── providers/
```

Routes should be defined centrally rather than scattered throughout feature components.

---

# 76. Recommended Route Structure

Conceptual:

```text
src/
└── app/
    ├── router/
    │   ├── routes.tsx
    │   ├── protected-routes.tsx
    │   └── route-guards.tsx
    │
    └── layouts/
        ├── PublicLayout.tsx
        ├── AuthLayout.tsx
        ├── AppLayout.tsx
        └── StudentLayout.tsx
```

Exact implementation may be adjusted during development.

---

# 77. Layout Architecture

Recommended layout hierarchy:

```text
PublicLayout
    └── Public Pages

AuthLayout
    └── Login / Password Pages

AppLayout
    ├── Header
    ├── Sidebar
    └── Main Content

Student-specific layout
    └── Student navigation variation where required
```

A separate StudentLayout is optional if the common AppLayout can satisfy the requirements cleanly.

---

# 78. Navigation and API Architecture

Navigation must remain consistent with:

```text
05-architecture/api-architecture.md
```

The frontend must not infer authorization from navigation configuration alone.

API responses remain authoritative for:

- Authentication
- Authorization
- Tenant context
- Resource availability

---

# 79. Navigation and Data Ownership

Navigation must not introduce data ownership.

For example:

```text
Results Navigation
```

does not mean the navigation layer owns result data.

Data ownership remains defined in:

```text
05-architecture/data-ownership.md
```

Navigation is purely a presentation and access mechanism.

---

# 80. Navigation and Feature Specifications

Navigation destinations must map to implemented feature capabilities.

Example:

```text
Students
    ↓
Student Management Feature

Results
    ↓
Result Import
Result Validation
Result Processing

Backlogs
    ↓
Backlog Tracking

Academic Passport
    ↓
Academic Passport

Analytics
    ↓
Analytics
```

---

# 81. AI Coding Agent Rules

AI coding agents must follow these navigation rules.

### Rule 1

Do not create routes without checking the existing route architecture.

### Rule 2

Do not expose administrative navigation to students.

### Rule 3

Do not treat hidden navigation as authorization.

### Rule 4

Do not duplicate route definitions unnecessarily.

### Rule 5

Use consistent route naming.

### Rule 6

Use semantic navigation labels.

### Rule 7

Use existing layouts where appropriate.

### Rule 8

Use existing navigation components before creating new ones.

### Rule 9

Do not introduce a new sidebar/header pattern without design review.

### Rule 10

Protect authenticated routes.

### Rule 11

Preserve tenant boundaries.

### Rule 12

Use `/me` APIs for student self-service where specified by API architecture.

### Rule 13

Do not expose internal implementation names in user-facing navigation.

### Rule 14

Maintain accessible navigation states.

### Rule 15

Do not assume a route is authorized simply because it is displayed.

---

# 82. Navigation Testing

Navigation should be tested for each role.

## SUPER_ADMIN

Verify:

- Platform navigation appears correctly.
- College management is accessible.
- Restricted college operations are enforced.
- Unauthorized routes are rejected.

## COLLEGE_ADMIN

Verify:

- Own college context is correct.
- Student navigation is available.
- Administrative platform navigation is unavailable.
- Cross-college routes are rejected.

## ACADEMIC_STAFF

Verify:

- Academic operations are available according to permissions.
- Administrative platform routes are unavailable.
- Student data access is appropriately restricted.

## STUDENT

Verify:

- Student navigation is visible.
- Only own academic data is accessible.
- Administrative routes are inaccessible.
- Direct URL access cannot bypass authorization.

---

# 83. Navigation Acceptance Criteria

The navigation architecture is acceptable when:

- Each role receives an appropriate navigation structure.
- Protected routes require authentication.
- Backend authorization remains authoritative.
- Tenant isolation is preserved.
- Active routes are clearly indicated.
- Mobile navigation is usable.
- Breadcrumbs accurately represent hierarchy.
- Invalid routes display a not-found state.
- Unauthorized routes display an appropriate access state.
- Browser refresh preserves valid routes.
- Deep links work correctly.
- Navigation is keyboard accessible.
- Navigation follows the design system.
- No duplicate navigation patterns exist without justification.

---

# 84. Definition of Done

Navigation architecture is considered implementation-ready when:

- Role navigation is finalized.
- Route hierarchy is finalized.
- Public/authenticated boundaries are defined.
- Protected route behavior is defined.
- Mobile navigation behavior is defined.
- Breadcrumb rules are defined.
- Active-state behavior is defined.
- Tenant context behavior is defined.
- Unauthorized and not-found behavior is defined.
- Accessibility requirements are defined.
- Route naming conventions are documented.
- Navigation is aligned with frontend architecture.
- Navigation is aligned with API architecture.
- Navigation is aligned with feature specifications.

---

# 85. Unresolved Navigation Decisions

The following decisions remain subject to review:

1. Final Super Admin navigation structure.
2. Final College Admin navigation structure.
3. Final Academic Staff permission-to-navigation mapping.
4. Whether Student requires a separate layout.
5. Whether mobile student navigation should use bottom navigation.
6. Final notification placement.
7. Final tenant/college context display.
8. Exact sidebar collapse behavior.
9. Final route naming for academic structure pages.
10. Final analytics route hierarchy.
11. Final settings hierarchy.
12. Whether audit logs require a dedicated navigation destination.
13. Whether some administrative workflows should use dedicated task pages instead of nested routes.

These should be finalized before changing the document status to:

```text
Approved / Implementation Ready
```

---

# 86. Navigation Architecture Flow

The final navigation relationship is:

```text
Authentication
      ↓
User Identity
      ↓
Role
      ↓
Tenant Context
      ↓
Navigation Configuration
      ↓
Route Guard
      ↓
Page
      ↓
Backend Authorization
      ↓
Authorized Data
```

---

# 87. Final Navigation Model

```text
                         Acadlytic
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Public Website               Authentication
                                             │
                                             ↓
                                      Authenticated App
                                             │
               ┌─────────────┬─────────────┼─────────────┐
               │             │             │             │
          Super Admin   College Admin   Academic Staff  Student
               │             │             │             │
               ↓             ↓             ↓             ↓
          Role-Based     Role-Based    Role-Based    Role-Based
          Navigation     Navigation    Navigation    Navigation
               │             │             │             │
               └─────────────┴─────────────┼─────────────┘
                                             ↓
                                       Route Guards
                                             ↓
                                      Backend Security
                                             ↓
                                      Tenant Isolation
                                             ↓
                                       Authorized UI
```

---

# 88. Document Status

**Current Status:** Draft / Under Review

This document defines the initial navigation architecture for Acadlytic.

It should be reviewed together with:

```text
06-design/design-system.md
06-design/page-specifications.md
06-design/responsive-design.md
05-architecture/frontend-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md
```

After the navigation structure, route hierarchy, role mapping, responsive behavior, and page specifications are reviewed and finalized, this document may be changed to:

```text
Approved / Implementation Ready
```