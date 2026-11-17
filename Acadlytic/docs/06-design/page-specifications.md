# Acadlytic Page Specifications

**Project:** Acadlytic  
**Document:** Page Specifications  
**Version:** 1.0  
**Status:** Draft / Under Review  
**Last Updated:** 2026-10-04  
**Owner:** Acadlytic Product & Engineering Team  

---

# 1. Purpose

This document defines the page-level structure and user-interface requirements for the Acadlytic platform.

It answers:

- What pages exist?
- Who can access each page?
- What is the purpose of each page?
- What information does each page display?
- What actions can users perform?
- Which components are required?
- What loading, empty, and error states exist?
- Which APIs provide the data?
- How does each page relate to the underlying feature specification?
- How should pages behave responsively?

This document converts the navigation architecture into concrete page requirements.

---

# 2. Scope

This document covers pages for:

```text
Public Website
Authentication
Super Admin
College Admin
Academic Staff
Student
```

Core MVP modules covered:

```text
Authentication
College Management
Student Management
Academic Structure
Result Import
Result Validation
Result Processing
Backlog Tracking
Academic Passport
Analytics
Student Portal
```

---

# 3. Page Specification Principles

## 3.1 Page Is a Presentation Layer

A page must not become the source of truth for business data.

Pages consume data through the API architecture.

```text
Page
 ↓
API
 ↓
Application / Domain Logic
 ↓
Database
```

---

## 3.2 Feature Specifications Remain Authoritative

Page specifications describe the UI representation of a feature.

The corresponding feature specification remains authoritative for business behavior.

Example:

```text
Result Import Feature Specification
        ↓
Defines result import behavior

Page Specification
        ↓
Defines how result import is presented
```

---

## 3.3 Backend Authorization Remains Authoritative

A page may hide actions that a user cannot perform.

However:

> The backend must independently enforce authorization.

---

# 4. Page Classification

Acadlytic pages are grouped into:

```text
1. Public Pages
2. Authentication Pages
3. Platform Administration Pages
4. College Administration Pages
5. Academic Operation Pages
6. Student Pages
7. Shared Detail Pages
```

---

# 5. Page Inventory

## 5.1 Public Pages

```text
/
/about
/features
/contact
```

---

## 5.2 Authentication Pages

```text
/login
/forgot-password
/reset-password
```

Future:

```text
/activate-account
/set-password
```

---

## 5.3 Platform Administration Pages

```text
/app
/app/colleges
/app/colleges/:collegeId
/app/colleges/:collegeId/edit
/app/users
/app/audit
```

---

## 5.4 Academic Administration Pages

```text
/app/students
/app/students/:studentId
/app/academic
/app/academic/courses
/app/academic/semesters
/app/academic/subjects
/app/results
/app/results/import
/app/results/import/:importId
/app/results/import/:importId/validation
/app/results/import/:importId/processing
/app/backlogs
/app/analytics
```

---

## 5.5 Student Pages

```text
/app
/app/academic-passport
/app/results
/app/backlogs
/app/analytics
/app/profile
/app/settings
```

---

# 6. Shared Page Structure

Most authenticated pages should follow:

```text
Application Shell
    ↓
Page Header
    ↓
Page Description / Context
    ↓
Primary Actions
    ↓
Filters / Controls
    ↓
Main Content
    ↓
Secondary Content
```

Not every page requires every section.

---

# 7. Page Header

A standard page header should contain:

```text
Page Title
Optional Description
Optional Breadcrumb
Optional Primary Action
Optional Secondary Actions
```

Example:

```text
Students

Manage students and view their academic records.

[Search]                         [Add Student]
```

---

# 8. Dashboard Pages

Dashboard pages provide role-specific summaries and entry points.

They should not attempt to expose every feature on one screen.

General structure:

```text
Dashboard
    ↓
Summary KPIs
    ↓
Important Trends / Information
    ↓
Recent Activity
    ↓
Quick Actions
```

---

# 9. Super Admin Dashboard

**Route:**

```text
/app
```

**Primary User:**

```text
SUPER_ADMIN
```

## Purpose

Provide a high-level overview of the Acadlytic platform.

## Main Sections

```text
Platform Overview
College Summary
User Summary
Academic Activity
Recent Activity
System Status
```

## Possible KPIs

```text
Total Colleges
Active Colleges
Total Users
Students
Recent Result Imports
Processing Jobs
```

Exact metrics must be defined according to available authoritative data.

## Actions

Potential actions:

```text
Manage Colleges
View Users
View Analytics
View Audit Activity
```

## States

Must support:

- Loading
- Loaded
- Empty
- Partial data
- Error

---

# 10. College Admin Dashboard

**Route:**

```text
/app
```

**Primary Users:**

```text
COLLEGE_ADMIN
```

## Purpose

Provide a summary of the college's academic data and operational activity.

## Main Sections

```text
College Summary
Student Summary
Result Summary
Backlog Summary
Academic Performance
Recent Result Activity
```

## KPI Examples

```text
Total Students
Active Students
Recent Results
Active Backlogs
Average CGPA
```

Metrics must use documented analytics definitions.

---

# 11. Academic Staff Dashboard

**Route:**

```text
/app
```

**Primary Users:**

```text
ACADEMIC_STAFF
```

## Purpose

Provide quick access to academic operations.

## Main Sections

```text
Student Summary
Recent Results
Import Status
Validation Issues
Backlog Summary
Academic Activity
```

The dashboard should prioritize operational tasks over platform administration.

---

# 12. Student Dashboard

**Route:**

```text
/app
```

**Primary User:**

```text
STUDENT
```

## Purpose

Provide a concise overview of the student's academic performance.

## Main Sections

```text
Academic Summary
Current Semester
SGPA
CGPA
Credits
Active Backlogs
Recent Results
Academic Progress
Quick Links
```

Example:

```text
CGPA
8.42

Current Semester
4

Active Backlogs
1

Credits Completed
82
```

---

# 13. Login Page

**Route:**

```text
/login
```

## Purpose

Authenticate registered users.

## Components

```text
Acadlytic Logo
Email / Username
Password
Remember Me (if supported)
Login Button
Forgot Password
Error Message
```

## Behavior

On successful authentication:

```text
Login
 ↓
Authentication
 ↓
Role Resolution
 ↓
Tenant Resolution
 ↓
Dashboard
```

## Validation

Required:

- Identifier
- Password

## States

```text
Default
Submitting
Invalid Credentials
Account Inactive
Account Locked
Server Error
Success
```

---

# 14. Forgot Password Page

**Route:**

```text
/forgot-password
```

## Purpose

Allow users to initiate password recovery.

## Components

```text
Email / Account Identifier
Submit
Back to Login
```

## Security

The UI must not reveal whether a particular account exists unless the security design explicitly permits it.

---

# 15. Reset Password Page

**Route:**

```text
/reset-password
```

## Components

```text
New Password
Confirm Password
Password Requirements
Reset Password
```

## States

```text
Valid Token
Expired Token
Invalid Token
Password Validation Error
Success
Failure
```

---

# 16. College List Page

**Route:**

```text
/app/colleges
```

**Primary User:**

```text
SUPER_ADMIN
```

## Purpose

Display and manage colleges registered on the platform.

## Main Components

```text
Page Header
Search
Filters
College Table
Pagination
Create College Button
```

## Table Columns

Possible columns:

```text
College Name
College Code
University
Status
Created Date
Actions
```

## Actions

```text
View
Edit
Change Status
```

Physical deletion is not an MVP action.

---

# 17. Create College Page

**Route:**

```text
/app/colleges/new
```

## Purpose

Create a new college tenant.

## Form Sections

```text
College Information
University Association
Contact Information
Address
Initial Configuration
```

## Required Fields

Defined by the College Management feature specification.

Potential fields:

```text
Name
Code
University
Email
Phone
Address
City
State
Country
Postal Code
```

## Actions

```text
Create College
Cancel
```

---

# 18. College Details Page

**Route:**

```text
/app/colleges/:collegeId
```

## Purpose

Display detailed information about a college.

## Sections

```text
College Header
College Information
University
Contact Information
Status
College Admin
Activity
```

## Actions

```text
Edit
Change Status
Manage Admin
```

Actions depend on authorization.

---

# 19. College Edit Page

**Route:**

```text
/app/colleges/:collegeId/edit
```

## Purpose

Update editable college information.

## Form

Use the same form conventions as the Create College page.

## Behavior

The page must clearly distinguish:

```text
Editable
Read-only
System-managed
```

fields.

---

# 20. Student List Page

**Route:**

```text
/app/students
```

**Users:**

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
```

## Purpose

Search, filter, and manage students.

## Components

```text
Page Header
Search
Filters
Student Table
Pagination
Add Student
```

## Filters

Potential filters:

```text
Course
Semester
Academic Year
Status
```

## Table Columns

```text
Student ID
Name
Course
Semester
Academic Year
Status
CGPA
Backlogs
Actions
```

Only authoritative or available values should be displayed.

---

# 21. Create Student Page

**Route:**

```text
/app/students/new
```

## Purpose

Create/provision a student record.

## Form Sections

```text
Identity
Contact
Academic Enrollment
Account Information
```

The exact account provisioning behavior must follow the Authentication feature specification.

## Actions

```text
Create Student
Cancel
```

---

# 22. Student Details Page

**Route:**

```text
/app/students/:studentId
```

## Purpose

Provide a centralized view of a student's academic identity.

## Sections

```text
Student Header
Basic Information
Academic Enrollment
Academic Summary
Current Semester
Backlogs
Recent Results
Academic Passport
```

## Actions

```text
Edit
View Academic Passport
View Results
View Backlogs
View Analytics
```

---

# 23. Student Edit Page

**Route:**

```text
/app/students/:studentId/edit
```

## Purpose

Update permitted student information.

The page must respect:

- Role permissions
- Tenant boundaries
- Field ownership
- Academic data ownership

Academic results must not be edited through ordinary student profile forms.

---

# 24. Academic Structure Page

**Route:**

```text
/app/academic
```

## Purpose

Provide an overview of academic structure.

## Main Sections

```text
Courses
Semesters
Subjects
Academic Years
```

The exact entities depend on the final academic-structure architecture.

---

# 25. Course List Page

**Route:**

```text
/app/academic/courses
```

## Components

```text
Page Header
Search
Filters
Course Table
Pagination
Create Course
```

## Table

Potential columns:

```text
Course Code
Course Name
Program
Duration
Status
Actions
```

---

# 26. Semester Page

**Route:**

```text
/app/academic/semesters
```

## Purpose

Manage or view semester definitions.

## Components

```text
Semester List
Academic Year
Semester Number
Status
Actions
```

---

# 27. Subject Page

**Route:**

```text
/app/academic/subjects
```

## Purpose

Manage subject definitions.

## Components

```text
Search
Course Filter
Semester Filter
Subject Table
```

## Columns

```text
Subject Code
Subject Name
Credits
Course
Semester
Status
```

---

# 28. Results Page

**Route:**

```text
/app/results
```

## Purpose

Provide access to processed academic results and result workflows.

## Main Sections

```text
Result Overview
Filters
Result Records
Import Results
Import History
```

## Filters

Potential filters:

```text
Academic Year
Course
Semester
Result Release
Student
Result Status
```

---

# 29. Result Import Page

**Route:**

```text
/app/results/import
```

## Purpose

Start a university result import.

## Workflow

```text
Upload
 ↓
Source / Context
 ↓
Column Mapping
 ↓
Validation
 ↓
Review
 ↓
Processing
```

## Components

```text
File Upload
Source Selection
Academic Context
Column Mapping
Continue / Validate
```

---

# 30. Result Import Details Page

**Route:**

```text
/app/results/import/:importId
```

## Purpose

Display the status and details of an import job.

## Sections

```text
Import Header
Import Status
Academic Context
File Information
Processing Summary
Validation Summary
Record Summary
Activity
```

## Status

Possible:

```text
UPLOADED
PARSING
VALIDATING
READY_FOR_REVIEW
PROCESSING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

---

# 31. Result Validation Page

**Route:**

```text
/app/results/import/:importId/validation
```

## Purpose

Allow authorized users to review validation results before processing.

## Summary

```text
Total Records
Valid
Invalid
Warnings
Duplicates
```

## Record Table

Potential columns:

```text
Row
Student ID
Subject Code
Marks
Grade
Status
Validation Errors
```

## Actions

```text
Review
Filter
View Errors
Continue to Processing
```

Processing must follow the Result Processing feature rules.

---

# 32. Result Processing Page

**Route:**

```text
/app/results/import/:importId/processing
```

## Purpose

Display the processing state of validated result records.

## Workflow Display

```text
Validation Complete
       ↓
Processing
       ↓
Academic Records
       ↓
Backlogs
       ↓
Academic Passport
       ↓
Analytics
       ↓
Completed
```

## Components

```text
Processing Status
Record Summary
Success Count
Failure Count
Error Summary
Processing Log / Activity
```

Do not fabricate progress percentages.

---

# 33. Result Record Page

**Route:**

```text
/app/results/:resultId
```

## Purpose

Display a processed academic result record.

## Sections

```text
Student
Academic Context
Subject
Marks
Grade
Credits
Attempt
Result Status
Processing Information
```

Historical attempt information must remain distinguishable from current outcome.

---

# 34. Backlog List Page

**Route:**

```text
/app/backlogs
```

## Users

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
```

## Purpose

Provide a centralized view of active and historical backlog information.

## Components

```text
Summary
Filters
Backlog Table
Pagination
```

## Filters

```text
Academic Year
Course
Semester
Subject
Status
Student
```

---

# 35. Backlog Table

Potential columns:

```text
Student
Subject
Semester
Attempt
Status
Created Date
Cleared Date
Actions
```

## Status

```text
ACTIVE
CLEARED
HISTORICAL
```

The exact domain status values must follow the Backlog Tracking feature specification.

---

# 36. Student Backlog Page

**Route:**

```text
/app/backlogs
```

for Student.

## Purpose

Display the student's own backlog information.

## Sections

```text
Active Backlogs
Cleared Backlogs
Attempt History
```

## Restrictions

Students must not:

- Modify backlog records
- Mark backlogs as cleared
- Delete backlog records
- Change academic results

---

# 37. Academic Passport Page

**Route:**

```text
/app/academic-passport
```

for Student.

Administrative detail route:

```text
/app/students/:studentId/academic-passport
```

## Purpose

Present the student's longitudinal academic record.

## Main Sections

```text
Student Header
Academic Summary
Semester Timeline
Semester Results
Subject Results
Backlog Summary
Attempt History
Academic Progress
```

---

# 38. Academic Passport Header

The header may contain:

```text
Student Name
Student ID
Program / Course
Current Semester
Current Academic Status
```

Sensitive information should only be displayed according to authorization.

---

# 39. Academic Summary

Possible metrics:

```text
CGPA
Current SGPA
Credits Completed
Active Backlogs
Cleared Backlogs
```

The page must display authoritative calculated values rather than inventing calculations.

---

# 40. Semester Timeline

Example:

```text
Semester 1
    ↓
Semester 2
    ↓
Semester 3
    ↓
Semester 4
```

Each semester may provide:

```text
SGPA
Credits
Subjects
Backlogs
Status
```

---

# 41. Semester Details

A semester detail view may contain:

```text
Semester Information
SGPA
Credits
Subject Results
Backlog Information
Attempt Information
```

---

# 42. Analytics Dashboard

**Route:**

```text
/app/analytics
```

## Purpose

Provide authorized academic performance analytics.

## Layout

```text
Filters
   ↓
KPI Summary
   ↓
Performance Trends
   ↓
Backlog Analysis
   ↓
Grade / Pass-Fail Analysis
   ↓
Detailed Data
```

---

# 43. College Analytics

For authorized college users:

```text
College Overview
Course Performance
Semester Performance
Subject Performance
Backlog Trends
Pass/Fail Trends
```

Analytics must follow the definitions in the Analytics feature specification.

---

# 44. Student Analytics

For students:

```text
Current CGPA
SGPA Trend
Academic Progress
Backlogs
Credits
Performance Summary
```

The student should not see other students' data.

---

# 45. Profile Page

**Route:**

```text
/app/profile
```

## Purpose

Display the authenticated user's profile.

## Components

```text
Profile Information
Account Information
Role
College Context where applicable
```

Editable fields must follow account/profile ownership rules.

---

# 46. Settings Page

**Route:**

```text
/app/settings
```

## Sections

```text
Account
Security
Preferences
```

Potential settings:

```text
Password
Theme
Notification Preferences
```

Only implemented settings should be displayed.

---

# 47. Error Page

Generic application error page.

Possible route/state:

```text
500 / application error
```

## Content

```text
Something went wrong.

Please try again.

[Retry]
[Go to Dashboard]
```

Avoid exposing stack traces or sensitive technical information.

---

# 48. Not Found Page

**Route:**

```text
*
```

## Content

```text
Page Not Found

The page you are looking for does not exist.

[Go to Dashboard]
```

Public users may instead receive:

```text
[Go to Home]
```

---

# 49. Unauthorized Page

## Purpose

Inform users that they do not have permission to access a page.

Example:

```text
Access Restricted

You do not have permission to access this page.

[Return to Dashboard]
```

---

# 50. Shared Search Pattern

Search pages should use a consistent pattern:

```text
Search Input
    ↓
Filters
    ↓
Results
    ↓
Pagination
```

Search should support:

- Debouncing where appropriate
- Loading state
- No-results state
- Error state
- Clear search action

---

# 51. Shared Filter Pattern

Filters should be displayed close to the data they control.

Example:

```text
Academic Year
Course
Semester
Status
```

Provide:

```text
Apply
Clear
```

where required.

---

# 52. Shared Table Pattern

Most administrative data pages should use:

```text
Page Header
    ↓
Search / Filters
    ↓
Table
    ↓
Pagination
```

The table should support:

- Loading
- Empty
- Error
- Pagination
- Sorting where supported
- Row actions

---

# 53. Detail Page Pattern

Detail pages should generally use:

```text
Breadcrumb
    ↓
Page Header
    ↓
Summary
    ↓
Detailed Sections
    ↓
Related Information
```

Example:

```text
Students
  /
Student Name

Student Summary
Academic Information
Results
Backlogs
Academic Passport
```

---

# 54. Form Page Pattern

Create/edit pages should generally use:

```text
Breadcrumb
    ↓
Page Header
    ↓
Form Sections
    ↓
Validation
    ↓
Actions
```

Actions should normally be placed consistently at the bottom or in the page header according to workflow importance.

---

# 55. Loading State Requirements

Every data-dependent page must define:

```text
Initial Loading
Refreshing
Action Loading
```

Skeletons should be preferred where the page structure is known.

---

# 56. Empty State Requirements

Every list page must define an empty state.

Example:

```text
No students found.

Try changing your search or filters.
```

Where an obvious first action exists:

```text
No students yet.

[Add Student]
```

---

# 57. Error State Requirements

Every data-dependent page must define an error state.

Example:

```text
Unable to load student records.

[Retry]
```

Errors should not leave a blank page without explanation.

---

# 58. Partial Data State

Pages that combine multiple independent API requests must handle partial failures.

Example:

```text
Academic Summary
✓ Loaded

Analytics
Unable to load analytics.

[Retry Analytics]
```

One failed section should not necessarily prevent the entire page from rendering.

---

# 59. Responsive Page Requirements

Each page must be reviewed for:

```text
Desktop
Tablet
Mobile
```

Responsive behavior must follow:

```text
06-design/responsive-design.md
```

---

# 60. Mobile Page Priorities

On mobile:

1. Page title
2. Primary action
3. Important summary
4. Core data
5. Secondary information
6. Advanced actions

should receive priority.

---

# 61. Page-Level Accessibility

Every page must provide:

- Logical heading hierarchy
- Keyboard navigation
- Accessible labels
- Visible focus
- Semantic landmarks
- Accessible status messages
- Sufficient contrast
- Screen-reader-friendly interactions

---

# 62. Page and API Mapping

Pages must consume the APIs defined in:

```text
05-architecture/api-architecture.md
```

Examples:

```text
Student Dashboard
    → GET /api/v1/me/dashboard

Student Results
    → GET /api/v1/me/results

Student Backlogs
    → GET /api/v1/me/backlogs

Academic Passport
    → GET /api/v1/me/academic-passport

Student Analytics
    → GET /api/v1/me/analytics
```

Administrative pages use resource-specific APIs according to role and authorization.

---

# 63. Page and Feature Mapping

| Page | Primary Feature |
|---|---|
| Login | Authentication |
| College List | College Management |
| College Details | College Management |
| Student List | Student Management |
| Student Details | Student Management |
| Academic Structure | Academic Structure |
| Results | Result Processing |
| Result Import | Result Import |
| Validation | Result Validation |
| Processing | Result Processing |
| Backlogs | Backlog Tracking |
| Academic Passport | Academic Passport |
| Analytics | Analytics |
| Student Dashboard | Student Portal |

---

# 64. Page and Data Ownership

Pages must respect the ownership model.

Examples:

```text
Student Data
→ Student Management

Academic Structure
→ Academic Structure

Imported Records
→ Result Import

Validation State
→ Result Validation

Processed Results
→ Result Processing

Backlogs
→ Backlog Tracking

Academic Passport
→ Read-oriented projection

Analytics
→ Derived read layer
```

A page must not directly mutate another module's source-of-truth data without going through the appropriate application/domain operation.

---

# 65. Result Workflow Page Relationship

The result workflow should remain connected:

```text
Results
   ↓
Import
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

Users should be able to navigate between related stages where the workflow state permits.

---

# 66. Academic Passport Page Relationship

The Academic Passport should connect to:

```text
Student
   ↓
Academic Passport
   ├── Semester Results
   ├── Subject Results
   ├── Backlogs
   └── Attempt History
```

The passport should not become a separate duplicate academic database.

---

# 67. Analytics Page Relationship

Analytics should link to underlying records where useful.

Example:

```text
Backlog Count: 42
       ↓
View Backlogs
```

```text
Students with Backlogs: 18
       ↓
View Students
```

Links must respect authorization and tenant boundaries.

---

# 68. Action Hierarchy

Each page should define:

### Primary Action

The most important action.

### Secondary Action

Supporting action.

### Contextual Action

Available for a specific record.

### Destructive Action

Requires additional care and confirmation.

Example:

```text
Student List

Primary:
[Add Student]

Contextual:
View
Edit

Destructive:
Deactivate
```

---

# 69. Destructive Action UI

Destructive actions must:

- Be clearly labeled
- Communicate consequences
- Require confirmation where appropriate
- Not be placed accidentally beside common actions
- Respect backend authorization

Example:

```text
Deactivate Student?

The account will no longer be active.
Historical academic records will be preserved.

[Cancel] [Deactivate]
```

---

# 70. Page Security Rules

Pages must:

- Require authentication where appropriate
- Respect role authorization
- Respect tenant isolation
- Prevent IDOR
- Avoid exposing sensitive information
- Avoid exposing backend implementation details
- Use secure API calls
- Never rely on client-side authorization alone

---

# 71. Page Performance

Pages should:

- Avoid unnecessary API requests
- Use pagination for large datasets
- Lazy-load heavy features
- Avoid rendering thousands of records simultaneously
- Use server-side filtering where appropriate
- Cache safe read data where appropriate

---

# 72. Page State Management

Page state should be separated into:

```text
Server State
Client UI State
Form State
URL State
Authentication State
```

Examples:

```text
Server State:
Students

Client State:
Sidebar open/closed

Form State:
Create Student form

URL State:
Search/filter/page

Authentication:
Current user/session
```

---

# 73. URL State

Search, filters, sorting, and pagination should use URL state where preserving or sharing the page state is useful.

Example:

```text
/students?course=BCA&semester=4&page=2
```

This improves:

- Refresh behavior
- Deep linking
- Browser navigation
- Shareability

---

# 74. Page Navigation Preservation

When users return from a detail page to a list, the application should preserve useful context where appropriate.

Example:

```text
Student List
    ↓
Page 3
    ↓
Student Details
    ↓
Back
    ↓
Page 3
```

This should not compromise correctness or data freshness.

---

# 75. AI Coding Agent Rules

AI coding agents must follow these rules when creating pages.

### Rule 1

Check the page specification before implementing a new page.

### Rule 2

Check the corresponding feature specification.

### Rule 3

Use existing design-system components.

### Rule 4

Use existing application layouts.

### Rule 5

Do not create new navigation patterns unnecessarily.

### Rule 6

Do not invent business rules.

### Rule 7

Do not calculate authoritative academic values in the frontend.

### Rule 8

Do not bypass API authorization.

### Rule 9

Implement loading, empty, and error states.

### Rule 10

Implement responsive behavior.

### Rule 11

Implement accessibility requirements.

### Rule 12

Respect tenant boundaries.

### Rule 13

Use `/me` endpoints for student self-service where specified.

### Rule 14

Do not directly mutate source-of-truth data owned by another module.

### Rule 15

Do not expose internal database structure through the UI.

---

# 76. Page Acceptance Criteria

A page is considered complete when:

- Its purpose is documented.
- Authorized roles are defined.
- Route is defined.
- Navigation entry is defined where applicable.
- Layout is defined.
- Components are identified.
- Primary actions are defined.
- API dependencies are identified.
- Loading state is defined.
- Empty state is defined.
- Error state is defined.
- Authorization behavior is defined.
- Tenant behavior is defined where applicable.
- Responsive behavior is defined.
- Accessibility requirements are defined.
- Related feature specification is identified.
- Design-system components are used.

---

# 77. Page Implementation Checklist

Before implementing a page, verify:

```text
□ Feature specification reviewed
□ Navigation specification reviewed
□ Design system reviewed
□ API endpoints identified
□ Authorization identified
□ Tenant boundary identified
□ Source-of-truth identified
□ Page layout defined
□ Components identified
□ Loading state defined
□ Empty state defined
□ Error state defined
□ Responsive behavior defined
□ Accessibility defined
□ Primary action defined
□ Secondary actions defined
□ Destructive actions defined
□ URL state defined where applicable
```

---

# 78. Unresolved Page Decisions

The following require final design review:

1. Exact dashboard layouts.
2. Final KPI selection for each role.
3. Exact college form fields.
4. Exact student form fields.
5. Final academic structure page hierarchy.
6. Exact result table columns.
7. Exact import wizard structure.
8. Final validation review experience.
9. Final result-processing progress interface.
10. Exact Academic Passport visualization.
11. Final analytics chart selection.
12. Final mobile table patterns.
13. Final profile/settings structure.
14. Final notification UI.
15. Final audit-log page requirements.

These decisions should be finalized during detailed UI design.

---

# 79. Relationship With Responsive Design

Page-level responsive behavior must be finalized alongside:

```text
06-design/responsive-design.md
```

That document will define:

- Breakpoints
- Mobile layouts
- Tablet layouts
- Desktop layouts
- Responsive tables
- Mobile navigation
- Responsive forms
- Responsive dashboards
- Responsive charts

---

# 80. Relationship With Design System

All pages must use:

```text
06-design/design-system.md
```

for:

- Colors
- Typography
- Spacing
- Buttons
- Forms
- Tables
- Cards
- Status badges
- Modals
- Alerts
- Loading states
- Empty states
- Error states

---

# 81. Relationship With Navigation

All pages must follow:

```text
06-design/navigation.md
```

for:

- Routes
- Role navigation
- Active states
- Breadcrumbs
- Sidebar
- Mobile navigation
- Route guards

---

# 82. Final Page Architecture

```text
                    Page Specification
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Purpose          Layout          Behavior
          │                │                │
          └────────────────┼────────────────┘
                           ↓
                     UI Components
                           ↓
                    API Integration
                           ↓
                 Authorization / Tenant
                           ↓
                    Backend Services
                           ↓
                       Data
```

---

# 83. Final Acadlytic Page Model

```text
                         Acadlytic
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
     Public              Auth                  App
       │                    │                    │
       ↓                    ↓                    ↓
   Marketing             Login              Role Resolution
                                                │
                     ┌──────────────┬───────────┼──────────────┐
                     │              │           │              │
                 Super Admin   College Admin  Academic Staff  Student
                     │              │           │              │
                     └──────────────┴───────────┼──────────────┘
                                                ↓
                                          Dashboard
                                                ↓
                  ┌───────────────┬────────────┼───────────────┐
                  │               │            │               │
               Students       Academic       Results        Analytics
                  │               │            │               │
                  │               │       ┌────┼────┐          │
                  │               │       │    │    │          │
                  │               │    Import Validate Process │
                  │               │                         │
                  └───────────────┼─────────────────────────┘
                                  ↓
                             Backlogs
                                  ↓
                         Academic Passport
```

---

# 84. Document Status

**Current Status:** Draft / Under Review

This document defines the page-level UI foundation for Acadlytic.

It should be reviewed together with:

```text
06-design/design-system.md
06-design/navigation.md
06-design/responsive-design.md
05-architecture/system-architecture.md
05-architecture/frontend-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md
09-development/feature-specifications/
```

After the page inventory, page layouts, role access, API mapping, responsive behavior, and detailed UI requirements are reviewed and finalized, this document may be changed to:

```text
Approved / Implementation Ready
```