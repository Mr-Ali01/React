# Acadlytic — Responsive Design Specification

**Project:** Acadlytic  
**Document:** Responsive Design Specification  
**Version:** 1.0  
**Status:** Draft / Under Review  
**Related Area:** `06-design/`

---

## 1. Purpose

This document defines the responsive design strategy for Acadlytic.

It establishes how the application should adapt across:

- mobile phones
- tablets
- laptops
- desktop monitors
- large desktop displays

The goal is to provide a consistent, usable, accessible, and efficient experience without creating separate desktop and mobile applications.

Responsive behavior must be implemented as part of the same React application.

---

# 2. Scope

This document defines responsive behavior for:

- public website
- authentication pages
- application shell
- navigation
- dashboards
- college management
- student management
- academic structure
- result import
- result validation
- result processing
- backlog management
- Academic Passport
- analytics
- student portal
- forms
- tables
- charts
- modals
- drawers
- cards
- notifications
- empty/loading/error states

This document does not define:

- database structure
- API implementation
- backend architecture
- business rules
- academic calculation formulas
- detailed component styling
- exact pixel-perfect visual design

Those responsibilities belong to the appropriate architecture and design documents.

---

# 3. Responsive Design Principles

Acadlytic must follow these principles.

## 3.1 Mobile First

The UI should be designed from the smallest practical viewport first and progressively enhanced for larger screens.

```text
Mobile
  ↓
Tablet
  ↓
Desktop
  ↓
Large Desktop
```

Do not design desktop first and simply shrink the interface.

---

## 3.2 One Application, Multiple Layouts

The application should use the same:

- components
- routes
- business logic
- API layer
- data models
- feature modules

Responsive behavior should primarily change presentation and layout.

---

## 3.3 Content Priority

When screen space becomes limited, lower-priority content may be:

- hidden
- collapsed
- moved
- summarized
- placed behind an interaction

Important information must remain visible.

For example:

```text
Student Name
Current CGPA
Current Semester
Active Backlogs
```

should have higher priority than secondary metadata.

---

## 3.4 Touch-Friendly Interaction

Mobile interfaces must support touch interaction comfortably.

Interactive elements should have sufficient:

- size
- spacing
- visual separation
- touch area

Avoid small controls that require precise tapping.

---

## 3.5 No Horizontal Page Overflow

The overall page must not unintentionally overflow horizontally.

Exceptions may exist for content that naturally requires horizontal scrolling, such as:

- large academic tables
- analytics tables
- result datasets

In those cases, the specific component may scroll horizontally while the page itself remains stable.

---

# 4. Responsive Breakpoints

Acadlytic should use a small, predictable breakpoint system.

The implementation should align with the project's Tailwind CSS configuration unless the design system explicitly changes the values.

Proposed conceptual breakpoints:

| Device | Width |
|---|---:|
| Small mobile | `< 640px` |
| Large mobile / small tablet | `640px – 767px` |
| Tablet | `768px – 1023px` |
| Desktop | `1024px – 1279px` |
| Large desktop | `1280px+` |

The exact breakpoint implementation must remain centralized in the frontend design system/Tailwind configuration.

Do not create arbitrary breakpoints for individual components unless there is a documented design requirement.

---

# 5. Mobile-First Strategy

Base CSS should target mobile.

Larger layouts should be added progressively.

Conceptually:

```text
Base
→ Mobile

md
→ Tablet

lg
→ Desktop

xl
→ Large Desktop
```

Example:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
```

This means:

```text
Mobile      → 1 column
Tablet      → 2 columns
Large       → 4 columns
```

Avoid writing separate mobile and desktop components when responsive CSS can solve the problem.

---

# 6. Container System

Application content should use a consistent container system.

Conceptually:

```text
┌───────────────────────────────────────────────┐
│                Application                    │
│                                               │
│     ┌───────────────────────────────────┐     │
│     │          Content Container         │     │
│     │                                   │     │
│     │             Content               │     │
│     │                                   │     │
│     └───────────────────────────────────┘     │
│                                               │
└───────────────────────────────────────────────┘
```

The container should:

- use responsive horizontal padding
- prevent excessive line length
- support wide dashboards
- remain usable on mobile

Large screens should not result in extremely wide text blocks.

---

# 7. Page Padding

Page-level horizontal padding should scale with viewport size.

Conceptually:

```text
Mobile      → small padding
Tablet      → medium padding
Desktop     → larger padding
Large       → controlled maximum content width
```

The application should avoid hardcoded large margins that cause mobile overflow.

---

# 8. Application Shell

The authenticated application shell consists of:

```text
┌─────────────────────────────────────────────┐
│ Header                                      │
├───────────────┬─────────────────────────────┤
│ Sidebar       │ Main Content                │
│               │                             │
│               │                             │
└───────────────┴─────────────────────────────┘
```

On smaller screens:

```text
┌──────────────────────────────┐
│ Header + Menu                │
├──────────────────────────────┤
│                              │
│ Main Content                 │
│                              │
└──────────────────────────────┘
```

The desktop sidebar should not permanently consume significant mobile screen width.

---

# 9. Header Responsive Behavior

## Desktop

The header may contain:

- logo/brand
- page context
- search where applicable
- notifications
- user profile
- user menu

## Tablet

Secondary items may be reduced.

## Mobile

The header should prioritize:

- menu trigger
- page title/context
- essential actions
- user/profile access

Non-essential header content should move into menus.

---

# 10. Sidebar Responsive Behavior

## Desktop

Sidebar remains visible.

Possible states:

```text
Expanded
Collapsed
```

## Tablet

Sidebar may use:

- collapsed mode
- expandable mode
- overlay mode

depending on available width.

## Mobile

Sidebar should become a drawer.

```text
Screen
┌──────────────────────────┐
│                          │
│       Main Content       │
│                          │
│                    ┌─────┤
│                    │ Nav │
│                    │     │
│                    │     │
└────────────────────┴─────┘
```

The drawer should:

- open from the configured side
- overlay the application
- provide a close mechanism
- close after navigation where appropriate
- trap focus while open
- prevent unintended background interaction

---

# 11. Mobile Navigation

Mobile navigation should follow the navigation specification.

Primary options include:

- drawer navigation
- compact top navigation
- bottom navigation for highly frequent student actions

The application should not display both a full sidebar and full bottom navigation simultaneously unless specifically justified.

Navigation priorities must be role-aware.

---

# 12. Bottom Navigation

A bottom navigation pattern may be used for student-facing mobile experiences where it improves access to frequently used areas.

Example:

```text
┌──────────────────────────────┐
│                              │
│         Page Content         │
│                              │
├──────┬──────┬──────┬────────┤
│ Home │Result│Backlog│Profile│
└──────┴──────┴──────┴────────┘
```

It should contain only high-frequency destinations.

Do not place every application route into bottom navigation.

---

# 13. Typography Responsiveness

Typography should scale according to screen size without causing layout instability.

Large headings may use:

```text
Mobile → smaller size
Tablet → medium size
Desktop → larger size
```

Important rules:

- avoid excessively large mobile headings
- maintain readable line height
- avoid text clipping
- preserve hierarchy
- avoid unnecessarily long lines

Headings should wrap naturally where required.

---

# 14. Spacing Responsiveness

Spacing should adapt to available screen space.

Mobile interfaces generally require tighter spacing than desktop interfaces.

However, spacing must not become so compact that:

- controls become difficult to use
- sections become visually crowded
- touch targets overlap

Use design-system spacing tokens rather than arbitrary values.

---

# 15. Grid Responsiveness

Cards and dashboard sections should use responsive grids.

Example:

```text
Mobile:
┌─────────────┐
│ KPI         │
└─────────────┘
┌─────────────┐
│ KPI         │
└─────────────┘

Tablet:
┌───────┬───────┐
│ KPI   │ KPI   │
└───────┴───────┘

Desktop:
┌──────┬──────┬──────┬──────┐
│ KPI  │ KPI  │ KPI  │ KPI  │
└──────┴──────┴──────┴──────┘
```

The number of columns should depend on available width rather than fixed device assumptions.

---

# 16. Dashboard Responsiveness

Dashboards must prioritize the most important information.

Typical order:

```text
Page Header
↓
Primary KPIs
↓
Important Alerts
↓
Primary Charts
↓
Detailed Data
↓
Secondary Information
```

On mobile:

- KPI cards stack or use compact grids
- charts become single-column
- secondary charts may move below primary content
- large tables may become scrollable
- filters may collapse into a filter drawer

---

# 17. KPI Cards

KPI cards should adapt from:

```text
Desktop → horizontal grid
Mobile  → stacked or compact grid
```

Important values should remain readable.

Example:

```text
┌─────────────────────┐
│ Current CGPA        │
│                     │
│ 8.42                │
│ +0.18 this semester │
└─────────────────────┘
```

Do not force desktop-sized cards onto mobile screens.

---

# 18. Forms

Forms must be responsive.

## Desktop

Multi-column forms may be used when fields are logically related.

Example:

```text
┌─────────────────┬─────────────────┐
│ First Name      │ Last Name       │
├─────────────────┼─────────────────┤
│ Email           │ Phone           │
└─────────────────┴─────────────────┘
```

## Mobile

The same form should generally become:

```text
┌────────────────────────────┐
│ First Name                 │
├────────────────────────────┤
│ Last Name                  │
├────────────────────────────┤
│ Email                      │
├────────────────────────────┤
│ Phone                      │
└────────────────────────────┘
```

Fields should stack when the available width becomes insufficient.

---

# 19. Form Actions

Desktop:

```text
[Cancel] [Save]
```

Mobile:

```text
[Save]
[Cancel]
```

or another consistent full-width action arrangement defined by the design system.

Primary actions must remain easy to locate.

---

# 20. Form Validation

Validation messages must remain visible and readable on mobile.

Avoid:

- validation text extending outside the viewport
- tiny error messages
- error icons without explanatory text
- tooltips as the only error explanation

Field errors should appear close to the relevant field.

---

# 21. Tables

Academic data frequently requires tables.

Tables should not simply be compressed until unreadable.

Possible responsive strategies:

1. horizontal scrolling
2. priority columns
3. responsive column hiding
4. row-to-card transformation
5. detail drawer
6. expandable rows

The appropriate strategy depends on the table.

---

# 22. Result Tables

Result tables may contain:

- subject code
- subject name
- credits
- marks
- grade
- grade point
- status
- attempt

On mobile, not every column must remain visible simultaneously.

Primary information should remain accessible.

Example mobile priority:

```text
Subject
Grade
Status
```

Secondary information may be available through:

```text
View Details
```

or an expandable row.

---

# 23. Result Import Table

Result Import is a data-heavy workflow.

Desktop may display:

```text
Row
Student ID
Student Name
Subject Code
Marks
Grade
Status
Validation
Actions
```

Mobile should prioritize:

```text
Student
Subject
Status
Validation
```

Detailed row information can be shown in an expandable section or drawer.

---

# 24. Result Validation

Validation errors should remain understandable on mobile.

Instead of displaying a very wide error table, mobile may use:

```text
┌────────────────────────────┐
│ Row 27                     │
│ Student: 22A123            │
│ Subject: CS401             │
│ Status: INVALID            │
│                            │
│ Error: Unknown subject     │
└────────────────────────────┘
```

The exact interaction should remain consistent with the page specification.

---

# 25. Result Processing

Processing status should be visible without requiring a wide desktop table.

Example:

```text
Processing
██████████████░░░░ 78%

780 / 1000 records processed
```

On mobile:

- progress should remain visible
- job status should remain readable
- errors should be accessible
- retry actions should remain available where permitted

---

# 26. Academic Passport Responsiveness

Academic Passport contains substantial academic information.

Desktop may use:

```text
Student Header
↓
Summary Cards
↓
Academic Timeline
↓
Semester Results
↓
Backlog
↓
Attempt History
```

Mobile should use:

```text
Student Header
↓
Summary
↓
Semester Selector
↓
Semester Result
↓
Backlog
↓
Attempt History
```

Large academic tables should use responsive patterns rather than shrinking text excessively.

---

# 27. Backlog Management

Backlog views should prioritize:

- subject
- semester
- status
- attempt/current state

Additional history can be expanded.

Mobile backlog cards may look conceptually like:

```text
┌──────────────────────────┐
│ CS401                    │
│ Data Structures          │
│ Semester 3               │
│                          │
│ Status: Active Backlog   │
└──────────────────────────┘
```

---

# 28. Analytics Responsiveness

Analytics must remain useful without requiring a desktop monitor.

## Desktop

Charts may be arranged:

```text
┌──────────────────────┬──────────────────────┐
│ SGPA Trend           │ Grade Distribution   │
├──────────────────────┼──────────────────────┤
│ Backlog Analytics    │ Pass/Fail            │
└──────────────────────┴──────────────────────┘
```

## Mobile

Charts should generally stack:

```text
┌──────────────────────┐
│ SGPA Trend           │
└──────────────────────┘

┌──────────────────────┐
│ Grade Distribution   │
└──────────────────────┘

┌──────────────────────┐
│ Backlog Analytics    │
└──────────────────────┘
```

Charts must remain readable.

---

# 29. Charts

Charts should respond to available width.

Rules:

- charts must not overflow their containers
- labels should remain readable
- legends should wrap or reposition
- tooltips should work on touch devices
- charts should have meaningful empty states
- data should not rely only on color

For mobile, overly dense charts should be simplified where necessary.

---

# 30. Filter Responsiveness

Desktop filters may appear horizontally:

```text
Academic Year | Course | Semester | Search | Apply
```

Mobile filters should generally become:

```text
[ Filters ]

Academic Year
Course
Semester
Search

[Apply Filters]
```

A filter drawer or modal may be used for complex filter sets.

---

# 31. Search

Search inputs should:

- remain usable on mobile
- have adequate width
- support keyboard interaction
- not force horizontal overflow

On small screens, search may occupy a full row.

---

# 32. Modals

Desktop dialogs may have constrained widths.

Mobile dialogs should generally use:

- near-full width
- appropriate horizontal padding
- scrollable content when necessary

Avoid dialogs that extend beyond the viewport.

---

# 33. Drawers

Drawers are appropriate for:

- mobile navigation
- filters
- row details
- secondary actions

Drawer content must support:

- scrolling
- focus management
- closing
- keyboard navigation
- touch interaction

---

# 34. Alerts and Toasts

Notifications must remain visible without blocking important content.

On mobile:

- avoid extremely wide toast containers
- avoid placing notifications over critical controls
- allow long messages to wrap
- ensure sufficient contrast

Critical errors should not rely only on temporary toasts.

---

# 35. File Upload

Result Import file upload must support mobile where technically appropriate.

The UI should clearly display:

- accepted file types
- file size limits
- selected file
- upload status
- validation status
- errors

Large file processing should not require the browser to perform heavy processing.

---

# 36. Public Website

Public pages must also be responsive.

Pages include:

```text
/
/about
/features
/contact
```

Hero sections should adapt from:

```text
Desktop:
Text + Visual
```

to:

```text
Mobile:
Text
↓
Visual
```

Navigation should collapse into a mobile menu.

---

# 37. Authentication Pages

Login and password-management pages should remain simple on mobile.

Example:

```text
┌────────────────────────────┐
│          Acadlytic         │
│                            │
│ Email                      │
│ [____________________]     │
│                            │
│ Password                   │
│ [____________________]     │
│                            │
│ [ Login ]                  │
│                            │
│ Forgot password?           │
└────────────────────────────┘
```

Authentication forms should not require horizontal scrolling.

---

# 38. Student Portal

Student Portal should receive particular attention for mobile usability.

Common student actions should be easy to access:

- dashboard
- results
- backlogs
- Academic Passport
- analytics
- profile

Mobile navigation should prioritize these actions.

---

# 39. Touch Targets

Interactive controls must have sufficiently large touch areas.

This applies to:

- buttons
- links
- icons
- checkboxes
- radio buttons
- dropdowns
- table actions
- navigation items

Do not rely on tiny icon-only controls without sufficient hit area.

---

# 40. Icon-Only Controls

Icon-only buttons should:

- have accessible labels
- have sufficient touch area
- provide visible hover/focus states where applicable
- use consistent icons

Example:

```tsx
<button
  aria-label="Open student actions"
>
  <MoreVertical />
</button>
```

---

# 41. Orientation

The application should support:

- portrait orientation
- landscape orientation

Important workflows should not break when the user rotates a device.

Data-heavy tables may benefit from landscape orientation but should remain usable in portrait through responsive strategies.

---

# 42. Accessibility

Responsive design must preserve accessibility.

Requirements include:

- keyboard navigation
- visible focus states
- logical tab order
- accessible labels
- semantic HTML
- ARIA only where necessary
- sufficient contrast
- screen-reader support
- responsive text
- no information conveyed by color alone

Responsive changes must not remove accessibility information.

---

# 43. Reduced Motion

Users who prefer reduced motion should receive reduced or disabled non-essential animations.

The frontend should respect:

```css
@media (prefers-reduced-motion: reduce) {
    /* reduce non-essential animation */
}
```

Animations must never interfere with usability.

---

# 44. Mobile Performance

Responsive design must consider mobile network and device limitations.

Avoid:

- unnecessarily large JavaScript bundles
- huge images
- unnecessary chart rendering
- excessive API requests
- rendering thousands of records at once
- unnecessary animations

Use:

- lazy loading
- code splitting
- pagination
- virtualization where appropriate
- optimized images
- server-side filtering
- asynchronous processing

---

# 45. Responsive Images

Images should:

- scale within their containers
- preserve aspect ratio
- avoid layout shifts
- use appropriate resolutions

Conceptually:

```css
img {
    max-width: 100%;
    height: auto;
}
```

Where appropriate, responsive image techniques should be used.

---

# 46. Large Data Sets

Acadlytic contains potentially large datasets.

Responsive design must not be used as a reason to load all records into the browser.

For example:

```text
Student List
     ↓
Server-side pagination
     ↓
Filtered results
     ↓
Responsive presentation
```

The frontend should request only the data required for the current view.

---

# 47. Responsive Loading States

Loading states must adapt to the layout.

Examples:

```text
Desktop:
[Card] [Card] [Card] [Card]

Mobile:
[Card]
[Card]
[Card]
```

Skeleton components should use the same responsive layout as the final content whenever practical.

---

# 48. Responsive Empty States

Empty states should remain centered and readable.

Example:

```text
┌────────────────────────────┐
│                            │
│      No Results Found      │
│                            │
│ No academic results are    │
│ available for this period. │
│                            │
│      [Change Filter]       │
│                            │
└────────────────────────────┘
```

Avoid overly large empty-state illustrations on mobile.

---

# 49. Responsive Error States

Errors must remain visible and actionable.

Mobile error states should support:

- readable messages
- retry actions
- navigation back
- support/contact action where applicable

Critical errors should not disappear automatically.

---

# 50. Browser Support

The application should support modern versions of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

Mobile browser support should include modern:

- Chrome on Android
- Safari on iOS

Exact browser support policy should be finalized before production release.

---

# 51. Device Testing Matrix

Responsive testing should include at minimum:

| Category | Example |
|---|---|
| Small Mobile | 320px |
| Standard Mobile | 375px |
| Large Mobile | 430px |
| Tablet | 768px |
| Large Tablet | 1024px |
| Laptop | 1280px |
| Desktop | 1440px |
| Large Desktop | 1920px |

These are testing reference sizes, not necessarily application breakpoints.

---

# 52. Responsive Testing Areas

Every important page should be tested for:

- layout
- navigation
- typography
- forms
- buttons
- tables
- charts
- dialogs
- drawers
- scrolling
- loading states
- empty states
- error states
- accessibility
- keyboard navigation
- touch interaction
- orientation changes

---

# 53. Responsive Testing Workflow

For every major page:

```text
Desktop
   ↓
Tablet
   ↓
Mobile
   ↓
Landscape
   ↓
Keyboard Navigation
   ↓
Accessibility Check
   ↓
Performance Check
```

Responsive testing should be part of normal feature development, not only final QA.

---

# 54. Tailwind CSS Implementation

Acadlytic uses Tailwind CSS for responsive styling.

Responsive classes should use the configured breakpoint system.

Example:

```tsx
<div className="
    grid
    grid-cols-1
    md:grid-cols-2
    xl:grid-cols-4
    gap-4
">
```

Avoid excessive arbitrary values.

Prefer:

```text
Design tokens
↓
Tailwind utilities
↓
Reusable components
```

instead of:

```text
Page-specific arbitrary CSS
```

---

# 55. Component-Level Responsiveness

Reusable components must define their responsive behavior where appropriate.

For example:

```text
KpiCard
ResultTable
FilterBar
PageHeader
Modal
Drawer
Sidebar
ChartCard
```

A page should not repeatedly implement the same responsive behavior for each component.

---

# 56. Responsive Component Rule

A component should be responsible for its presentation behavior, while the page should control composition.

Example:

```text
Page
 ├── PageHeader
 ├── FilterBar
 ├── KpiGrid
 │    └── KpiCard
 └── ResultTable
```

The page decides:

```text
What components appear
```

The component decides:

```text
How it responds to available space
```

---

# 57. Avoid Device-Specific JavaScript

Do not use JavaScript to detect mobile devices for ordinary layout behavior.

Avoid patterns such as:

```tsx
if (window.innerWidth < 768) {
    // render mobile version
}
```

Use CSS responsive behavior whenever possible.

JavaScript should be used only when interaction behavior genuinely differs.

Examples where JavaScript may be justified:

- mobile drawer state
- responsive chart behavior requiring library configuration
- interaction-specific behavior

---

# 58. Responsive Route Behavior

Routes should remain identical across device sizes.

For example:

```text
/app/students
```

must work on:

- mobile
- tablet
- desktop

Responsive design should not create separate routes such as:

```text
/mobile/students
/desktop/students
```

---

# 59. URL State

Responsive layout changes must not unnecessarily reset:

- filters
- pagination
- search
- selected semester
- selected course
- sort order

Where appropriate, state should remain encoded in the URL or application state according to the page specification.

---

# 60. Responsive Accessibility Testing

Each important responsive state should be tested for:

- keyboard access
- focus visibility
- screen reader interpretation
- dialog focus trapping
- mobile drawer focus
- accessible table navigation
- form error association
- button labels
- responsive hidden content

A desktop-accessible interface is not automatically mobile-accessible.

---

# 61. Responsive Security Considerations

Responsive UI must not change authorization behavior.

Hiding an action on mobile does not constitute authorization.

For example:

```text
Mobile:
Delete button hidden
```

does not mean:

```text
Backend:
Delete operation allowed
```

Authorization must always be enforced by the backend.

---

# 62. Role-Based Responsive Navigation

Different roles may have different navigation structures.

The responsive layout must preserve role-based permissions.

Example:

```text
SUPER_ADMIN
Desktop Sidebar
      ↓
Mobile Drawer

COLLEGE_ADMIN
Desktop Sidebar
      ↓
Mobile Drawer

STUDENT
Desktop Sidebar
      ↓
Mobile Drawer / Bottom Navigation
```

The responsive version must never expose routes that the user is not authorized to access.

---

# 63. Responsive Data Density

Academic and administrative applications contain information-dense interfaces.

The goal is not to maximize the amount of information visible on every screen.

Instead:

```text
Desktop
→ High information density

Tablet
→ Moderate information density

Mobile
→ Priority information + progressive disclosure
```

This prevents unreadable mobile interfaces.

---

# 64. Progressive Disclosure

When information cannot reasonably fit on a small screen, use progressive disclosure.

Possible mechanisms:

- expandable rows
- detail pages
- drawers
- accordions
- tabs
- "View Details"
- secondary action menus

Do not simply reduce font size until everything fits.

---

# 65. Responsive Action Hierarchy

Actions should maintain consistent priority.

Example:

```text
Primary:
[Save]

Secondary:
[Cancel]

Destructive:
[Delete]
```

Mobile should not accidentally make destructive actions more prominent than the primary workflow.

---

# 66. Responsive Pagination

Pagination should adapt to screen width.

Desktop may display:

```text
Previous  1  2  3  4  5  Next
```

Mobile may display:

```text
[Previous]  Page 3 of 20  [Next]
```

The exact component should follow the design system.

---

# 67. Responsive Breadcrumbs

Desktop may display:

```text
Students / Student Details / Results
```

Mobile may simplify this to:

```text
← Student Results
```

Important navigation context must remain accessible.

---

# 68. Responsive Notifications

Notifications should adapt to available space.

Desktop may use a notification panel.

Mobile may use:

- full-width panel
- drawer
- dedicated notifications page

depending on final product requirements.

---

# 69. Responsive Settings

Settings pages should use:

```text
Desktop:
Sidebar + Content

Mobile:
Section selector + Content
```

Settings navigation should not consume excessive mobile width.

---

# 70. Responsive Profile

Profile pages should adapt from:

```text
Desktop:
Profile Header + Information Grid
```

to:

```text
Mobile:
Profile Header
↓
Information Sections
```

Editable fields should remain easy to use on touch devices.

---

# 71. Responsive Academic Timeline

Academic timelines should avoid forcing horizontal layouts on mobile.

Desktop:

```text
Semester 1 ─── Semester 2 ─── Semester 3 ─── Semester 4
```

Mobile:

```text
Semester 1
   ↓
Semester 2
   ↓
Semester 3
   ↓
Semester 4
```

The semantic timeline should remain unchanged while presentation adapts.

---

# 72. Responsive Status Indicators

Statuses such as:

- Active
- Inactive
- Suspended
- Passed
- Failed
- Pending
- Valid
- Invalid
- Processing

should remain readable at all viewport sizes.

Do not rely only on color.

Use:

```text
Icon + Label
```

where appropriate.

---

# 73. Responsive Accessibility and Contrast

Responsive layouts must preserve the design system's accessibility requirements.

Text should not become:

- too small
- too faint
- too tightly spaced

Focus states must remain visible regardless of viewport.

---

# 74. Responsive Performance Budget

Responsive implementation should avoid unnecessary duplication.

Do not load:

```text
Desktop component
+
Mobile component
```

when CSS can provide the required behavior.

Prefer shared components with responsive presentation.

---

# 75. Anti-Patterns

The following patterns should be avoided.

### Anti-pattern 1 — Desktop-only layout

```text
Desktop layout
↓
shrink everything
↓
mobile
```

---

### Anti-pattern 2 — Device-specific routes

```text
/mobile/dashboard
/desktop/dashboard
```

---

### Anti-pattern 3 — Excessive breakpoint usage

```text
sm
md
custom-1
custom-2
custom-3
custom-4
```

without a real design requirement.

---

### Anti-pattern 4 — Tiny mobile text

Making text extremely small just to fit more information.

---

### Anti-pattern 5 — Horizontal page overflow

Allowing the entire application to scroll horizontally because of one component.

---

### Anti-pattern 6 — Mobile-only business logic

Changing business behavior based on viewport size.

---

### Anti-pattern 7 — Hiding important information

Removing critical academic information simply because the viewport is small.

Use progressive disclosure instead.

---

### Anti-pattern 8 — Unusable tables

Shrinking a desktop table until text becomes unreadable.

---

# 76. AI Coding Agent Rules

AI coding agents implementing responsive behavior must:

1. Follow `design-system.md`.
2. Follow `navigation.md`.
3. Follow `page-specifications.md`.
4. Follow this responsive specification.
5. Use the configured Tailwind breakpoints.
6. Prefer mobile-first CSS.
7. Avoid device-specific routes.
8. Avoid unnecessary duplicate components.
9. Avoid device detection for normal layout behavior.
10. Preserve accessibility.
11. Preserve backend authorization.
12. Preserve API contracts.
13. Preserve business logic.
14. Preserve data ownership.
15. Test mobile, tablet, and desktop layouts.
16. Avoid introducing arbitrary breakpoints without justification.
17. Avoid horizontal page overflow.
18. Use progressive disclosure for dense data.
19. Preserve important information.
20. Document significant responsive exceptions.

---

# 77. Definition of Done

Responsive implementation for a feature is complete when:

- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Large-screen layout remains usable
- [ ] No unintended page-level horizontal overflow exists
- [ ] Forms are usable on touch devices
- [ ] Tables have an appropriate mobile strategy
- [ ] Charts remain readable
- [ ] Dialogs/drawers work on mobile
- [ ] Navigation works across breakpoints
- [ ] Keyboard navigation works
- [ ] Focus states remain visible
- [ ] Accessibility requirements are met
- [ ] Loading states are responsive
- [ ] Empty states are responsive
- [ ] Error states are responsive
- [ ] Performance is acceptable on mobile
- [ ] Role-based visibility remains correct
- [ ] Backend authorization remains unchanged
- [ ] No unnecessary device-specific logic was introduced
- [ ] Responsive behavior has been tested at defined reference sizes

---

# 78. Unresolved Decisions

The following decisions remain subject to design review:

1. Exact breakpoint values.
2. Final maximum content widths.
3. Whether student mobile navigation uses bottom navigation.
4. Exact mobile sidebar/drawer behavior.
5. Which result tables use horizontal scrolling versus row transformation.
6. Which analytics charts require mobile-specific configurations.
7. Exact mobile pagination behavior.
8. Exact responsive filter drawer behavior.
9. Browser support versions.
10. Device/browser QA matrix for production.

These decisions should be finalized before the design system is marked **Approved**.

---

# 79. Relationship With Other Documents

## Design System

Defines:

- visual tokens
- typography
- colors
- spacing
- components
- states

This document defines how those elements adapt responsively.

---

## Navigation

Defines:

- routes
- navigation hierarchy
- role-based navigation
- mobile navigation behavior

This document defines responsive presentation of those navigation structures.

---

## Page Specifications

Defines:

- page purpose
- page content
- page actions
- page structure

This document defines how those pages adapt to viewport size.

---

## Frontend Architecture

Defines:

- React architecture
- component architecture
- state management
- routing
- frontend technology

This document defines responsive presentation behavior within that architecture.

---

## API Architecture

Defines:

- endpoints
- DTOs
- pagination
- filtering
- backend contracts

Responsive UI must consume the same API contracts regardless of device.

---

# 80. Final Responsive Architecture

The intended responsive model is:

```text
                    Acadlytic UI
                         │
                Mobile-First Design
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Mobile         Tablet         Desktop
          │              │              │
          └──────────────┼──────────────┘
                         │
                 Shared React App
                         │
              Shared Feature Components
                         │
                 Shared API Layer
                         │
                  Spring Boot API
                         │
                       MySQL
```

The application should provide one consistent product experience while adapting:

- layout
- navigation
- information density
- component arrangement
- interaction patterns
- tables
- charts
- forms
- navigation controls

according to available screen space.

The business rules, authorization rules, data ownership, API contracts, and academic logic must remain independent of viewport size.

---

# 81. Final Responsive Principles

The final responsive design rules are:

```text
Mobile First
      ↓
Shared Components
      ↓
Progressive Enhancement
      ↓
Priority-Based Information
      ↓
Responsive Navigation
      ↓
Responsive Data Presentation
      ↓
Accessible Interaction
      ↓
Performance-Aware Rendering
```

The objective is not to create a smaller desktop application.

The objective is to provide an appropriate Acadlytic experience for each available viewport while preserving the same product model, data, security, and functionality.

---

# 82. Document Status

**Status:** Draft / Under Review

This document is ready to guide responsive implementation at the architectural/design level, but the final responsive rules should be reviewed together with:

- `design-system.md`
- `navigation.md`
- `page-specifications.md`
- `frontend-architecture.md`

After the complete design system is reviewed and approved, this document should move to:

**Approved / Implementation Ready**