# Acadlytic Design System

**Project:** Acadlytic  
**Document:** Design System  
**Version:** 1.0  
**Status:** Draft / Under Review  
**Last Updated:** 2026-10-04  
**Owner:** Acadlytic Product & Engineering Team  

---

# 1. Purpose

This document defines the visual, interaction, accessibility, and component design foundation for the Acadlytic platform.

The design system establishes consistent rules for:

- Colors
- Typography
- Spacing
- Layout
- Components
- Forms
- Tables
- Dashboards
- Academic data visualization
- Status indicators
- Feedback states
- Responsive behavior
- Dark mode
- Accessibility
- Motion
- Content and microcopy
- Frontend implementation

The purpose is to ensure that all Acadlytic interfaces feel like one coherent product regardless of:

- User role
- Module
- Page
- Device
- Screen size
- Light or dark theme

---

# 2. Design System Principles

The Acadlytic design system follows these principles.

## 2.1 Clarity First

Academic data can become complex quickly.

The interface must make important information easy to understand.

Prioritize:

- Clear labels
- Strong visual hierarchy
- Meaningful grouping
- Predictable interactions
- Minimal unnecessary decoration

---

## 2.2 Data Should Be Easy to Scan

Acadlytic contains:

- Student records
- Results
- Marks
- Grades
- SGPA
- CGPA
- Credits
- Backlogs
- Academic history
- Analytics

Users should be able to scan information quickly without reading every element.

Use:

- Tables
- Cards
- Badges
- Section headings
- Summary metrics
- Consistent alignment
- Appropriate whitespace

---

## 2.3 Actions Must Be Predictable

The same action should behave consistently throughout the application.

For example:

- Primary actions use the same button style.
- Destructive actions use the same visual treatment.
- Forms use consistent validation behavior.
- Modals behave consistently.
- Tables use consistent pagination.
- Status values use consistent badges.

---

## 2.4 Progressive Disclosure

Do not display every available detail at once.

Show:

1. Important summary information
2. Frequently used actions
3. Relevant details
4. Advanced information when requested

Example:

```text
Student
    ↓
Academic Summary
    ↓
Semester
    ↓
Subject Details
    ↓
Attempt History
```

---

## 2.5 Accessibility Is a Requirement

Accessibility is part of the design system, not an optional enhancement.

Interfaces must support:

- Keyboard navigation
- Visible focus states
- Screen readers
- Sufficient color contrast
- Semantic HTML
- Appropriate ARIA attributes
- Reduced motion preferences
- Accessible form validation

---

## 2.6 Responsive by Default

The system must work across:

- Desktop
- Laptop
- Tablet
- Mobile

Responsive behavior must not simply shrink desktop interfaces.

Components should adapt their layout and interaction model according to available space.

---

## 2.7 Consistency Over Individual Preference

Developers should use existing design-system components and tokens instead of creating one-off styles.

A new visual pattern should be introduced only when an existing pattern cannot satisfy the requirement.

---

# 3. Product Visual Direction

Acadlytic should communicate:

- Professional
- Modern
- Reliable
- Academic
- Structured
- Data-driven
- Trustworthy
- Calm
- Accessible

The interface should feel suitable for an institutional academic platform rather than a casual consumer application.

Avoid excessive:

- Gradients
- Decorative illustrations
- Heavy shadows
- Excessive animations
- Large visual effects
- Unnecessary rounded containers
- Dense visual noise

The visual hierarchy should primarily come from:

- Typography
- Spacing
- Contrast
- Alignment
- Surface hierarchy
- Consistent component patterns

---

# 4. Design Goals

The design system must support the following goals.

## 4.1 Administrative Efficiency

College administrators and academic staff should be able to perform repetitive operations efficiently.

Examples:

- Student search
- Result import
- Validation
- Backlog review
- Academic filtering
- Data inspection

---

## 4.2 Student Comprehension

Students should be able to understand their academic information without needing technical knowledge.

Examples:

```text
CGPA: 8.24
Current Semester: 4
Active Backlogs: 1
Credits Completed: 82
```

The meaning of the information should be immediately understandable.

---

## 4.3 Data Confidence

The interface should visually distinguish:

- Valid information
- Warnings
- Errors
- Pending operations
- Completed operations
- Active records
- Historical records

---

## 4.4 Operational Feedback

Long-running operations such as result imports must clearly communicate:

```text
Uploaded
    ↓
Parsing
    ↓
Validating
    ↓
Ready for Review
    ↓
Processing
    ↓
Completed
```

Users must never be left wondering whether an operation is still running.

---

# 5. Design Tokens

Design tokens are the shared values used throughout the application.

Tokens should be represented using CSS variables and consumed through Tailwind CSS.

Example:

```css
:root {
    --color-primary: ...;
    --color-background: ...;
    --color-surface: ...;
    --color-text: ...;
    --color-border: ...;
}
```

The exact production palette is subject to final design review.

---

# 6. Color System

## 6.1 Color Philosophy

Colors must communicate hierarchy and meaning.

Color should not be used merely for decoration.

Primary colors should establish brand identity.

Semantic colors should communicate system state.

---

# 7. Semantic Color Categories

The design system should provide the following semantic categories.

| Token | Purpose |
|---|---|
| Primary | Main brand actions and interactive elements |
| Primary Hover | Hover state of primary elements |
| Primary Active | Active/pressed state |
| Secondary | Secondary actions |
| Accent | Supporting visual emphasis |
| Background | Application background |
| Surface | Cards, panels and containers |
| Surface Elevated | Elevated surfaces such as dialogs |
| Text Primary | Main text |
| Text Secondary | Supporting text |
| Text Muted | Low-emphasis text |
| Border | Default borders |
| Border Strong | Emphasized borders |
| Success | Successful state |
| Warning | Warning state |
| Error | Error/destructive state |
| Info | Informational state |

---

# 8. Proposed Semantic Color Structure

The initial system should use semantic names rather than hard-coded color names.

Example:

```text
--color-primary
--color-primary-hover
--color-primary-active

--color-background
--color-surface
--color-surface-elevated

--color-text-primary
--color-text-secondary
--color-text-muted

--color-border
--color-border-strong

--color-success
--color-warning
--color-error
--color-info
```

Components should reference semantic tokens.

Avoid:

```text
bg-blue-600
text-gray-700
border-red-500
```

inside reusable components when a semantic token is available.

Prefer:

```text
bg-primary
text-text-primary
border-border
```

---

# 9. Light Theme

The light theme should prioritize:

- High readability
- Clean surfaces
- Clear borders
- Moderate contrast
- Professional institutional appearance

Recommended hierarchy:

```text
Application Background
        ↓
Surface
        ↓
Elevated Surface
        ↓
Primary Content
        ↓
Secondary Content
        ↓
Muted Content
```

Exact color values remain subject to visual review.

---

# 10. Dark Theme

Acadlytic should support a dark theme.

Dark mode must not simply invert every color.

Dark mode should use:

- Dark neutral backgrounds
- Slightly lighter surfaces
- Appropriate border contrast
- Adjusted text contrast
- Carefully adapted semantic colors

Avoid pure black backgrounds unless specifically required.

Example hierarchy:

```text
Dark Background
        ↓
Dark Surface
        ↓
Elevated Surface
        ↓
Primary Text
        ↓
Secondary Text
        ↓
Muted Text
```

---

# 11. Theme Implementation

Theme switching should use class-based dark mode.

Tailwind configuration:

```text
darkMode: 'class'
```

The application should apply:

```html
<html class="dark">
```

for dark mode.

Theme tokens should be defined using CSS variables.

This allows the same components to work across themes without duplicating component styles.

---

# 12. Color Accessibility

Color must never be the only way to communicate information.

For example, this is insufficient:

```text
Red = Failed
Green = Passed
```

The interface should also use:

```text
Failed
Passed
```

and optionally an icon.

Status should remain understandable for users with color-vision deficiencies.

---

# 13. Typography

Typography must create a clear hierarchy between:

- Page titles
- Section titles
- Subsections
- Body content
- Labels
- Metadata
- Table content
- Status information

The typography system should prioritize readability over decorative typography.

---

# 14. Font Family

The production font family should be selected during visual design validation.

The chosen font must provide:

- Good readability
- Strong Latin character support
- Clear numeric characters
- Multiple font weights
- Good rendering on Windows and modern browsers

The application should define the font through a central token rather than hard-coding it throughout components.

Example:

```text
font-sans
```

---

# 15. Typography Scale

The design system should define a consistent type scale.

| Role | Suggested Size |
|---|---:|
| Display | 40–48px |
| H1 | 32–40px |
| H2 | 24–32px |
| H3 | 20–24px |
| H4 | 18–20px |
| Body Large | 16px |
| Body | 14–16px |
| Body Small | 13–14px |
| Caption | 12px |
| Label | 12–14px |

Exact values may be adjusted during implementation.

---

# 16. Font Weight

Recommended hierarchy:

```text
Regular      400
Medium       500
Semibold     600
Bold         700
```

Avoid excessive use of bold text.

Use weight to establish hierarchy, not to compensate for poor spacing.

---

# 17. Line Height

Recommended guidelines:

```text
Headings:
1.15 – 1.30

Body:
1.50 – 1.70

Labels:
1.30 – 1.50
```

Dense tables may use tighter line heights where readability remains acceptable.

---

# 18. Numeric Typography

Academic metrics contain many numbers.

Examples:

```text
8.42
82
92%
4.00
120
```

Numbers should have consistent alignment and formatting.

For tables containing numerical values:

- Right-align numeric columns where appropriate.
- Maintain consistent decimal precision.
- Avoid unnecessary decimal values.
- Use tabular numeric styling where supported.

---

# 19. Spacing System

The application should use a consistent spacing scale.

Recommended base unit:

```text
4px
```

Example:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
80px
```

Spacing should be selected from the shared scale rather than arbitrary values.

---

# 20. Spacing Rules

Use smaller spacing for:

- Icon and label
- Form label and input
- Related metadata

Use medium spacing for:

- Form fields
- Card sections
- Table sections

Use larger spacing for:

- Page sections
- Major content groups
- Dashboard sections

---

# 21. Layout Containers

The application should use consistent content containers.

General structure:

```text
Application Shell
    └── Main Content
          └── Content Container
                ├── Page Header
                ├── Page Content
                └── Page Sections
```

Pages should avoid unnecessary full-width content.

Data-heavy interfaces may use wider containers where required.

---

# 22. Grid System

The system should use CSS Grid and Flexbox.

Typical layouts:

```text
1 column
2 columns
3 columns
4 columns
```

The number of columns should adapt based on available screen width.

Example:

```text
Desktop:
4 KPI cards

Tablet:
2 KPI cards

Mobile:
1 KPI card
```

---

# 23. Border Radius

Use a limited set of radius tokens.

Example:

```text
Small
Medium
Large
Full
```

Typical use:

```text
Small:
inputs, badges

Medium:
buttons, cards

Large:
larger panels, dialogs

Full:
avatars, status pills
```

Avoid excessive rounding.

---

# 24. Elevation and Shadows

Elevation should communicate hierarchy.

Use shadows primarily for:

- Dropdowns
- Modals
- Floating panels
- Elevated cards where necessary

Do not use heavy shadows on every card.

The default interface should remain visually clean.

---

# 25. Iconography

Acadlytic should use **Lucide React** as the standard icon library.

Icons must:

- Have consistent stroke style
- Have predictable sizing
- Support accessibility
- Communicate familiar actions

Examples:

```text
Search
Filter
Plus
Edit
Trash
Download
Upload
ChevronDown
ChevronRight
Check
X
AlertTriangle
Info
Menu
Settings
```

---

# 26. Icon Rules

Icons should support text rather than replace important labels.

Prefer:

```text
[icon] Add Student
```

over:

```text
[icon only]
```

Icon-only controls must provide:

- Accessible label
- Tooltip where appropriate
- Visible focus state

Do not use decorative icons that create ambiguity.

---

# 27. Button System

Buttons should communicate action hierarchy.

Required variants:

```text
Primary
Secondary
Outline
Ghost
Destructive
Link
```

---

# 28. Button Hierarchy

Use:

### Primary

For the main action.

Example:

```text
Create Student
Import Results
Save Changes
```

### Secondary

For supporting actions.

Example:

```text
Cancel
Back
View Details
```

### Destructive

For dangerous actions.

Example:

```text
Deactivate College
Delete Record
```

### Ghost

For low-emphasis actions.

Example:

```text
More
Close
```

---

# 29. Button States

Every interactive button must define:

```text
Default
Hover
Focus
Active
Disabled
Loading
```

Loading state should prevent accidental duplicate submission.

Example:

```text
Save Changes
      ↓
Saving...
```

---

# 30. Links

Links should be visually distinguishable from ordinary text.

Use links for navigation rather than styling buttons as links.

Examples:

```text
View Student
View Academic Passport
View Import Details
```

---

# 31. Form Controls

Supported controls include:

- Input
- Textarea
- Select
- Search input
- Checkbox
- Radio
- Switch
- Date picker
- File upload
- Multi-select

All controls must have consistent:

- Height
- Border
- Radius
- Typography
- Focus state
- Disabled state
- Error state

---

# 32. Form Structure

Recommended structure:

```text
Field Label
Helper Text (optional)
Input
Validation Message
```

Example:

```text
College Code
Unique identifier for the college.

[ CSE001 ]

College code is already in use.
```

---

# 33. Form Labels

Every form control must have a meaningful label.

Do not rely exclusively on placeholders.

Bad:

```text
[Enter email]
```

Good:

```text
Email Address
[Enter email]
```

---

# 34. Placeholder Text

Placeholders should provide examples or hints.

They should not replace labels.

Example:

```text
Student ID
[Enter university student ID]
```

---

# 35. Validation States

Form controls must support:

```text
Default
Focus
Success
Warning
Error
Disabled
Read-only
```

Errors must explain how the user can correct the problem.

Bad:

```text
Invalid input.
```

Better:

```text
Student ID is required.
```

---

# 36. Cards

Cards are used to group related information.

Common Acadlytic cards:

- KPI cards
- Student summary
- Academic summary
- Semester summary
- Backlog summary
- Import summary
- Analytics summary

Cards should not be used merely because a visual container is available.

---

# 37. KPI Cards

Dashboard KPI cards should communicate:

```text
Metric
Value
Optional comparison/context
Optional icon
```

Example:

```text
Active Backlogs

3

Across current academic records
```

The metric must be more visually prominent than supporting text.

---

# 38. Status Badges

Status badges should provide compact state information.

Examples:

```text
ACTIVE
INACTIVE
SUSPENDED

VALID
INVALID
WARNING

PROCESSING
COMPLETED
FAILED

PASS
FAIL
CLEARED
```

Status colors must be semantic and consistent.

---

# 39. Status Mapping

The same status should always use the same semantic category.

Example:

```text
Success:
PASS
CLEARED
COMPLETED
ACTIVE

Warning:
WARNING
PENDING

Error:
FAIL
INVALID
FAILED

Neutral:
PROCESSING
DRAFT
INACTIVE
```

Exact mappings may be refined per domain during implementation.

---

# 40. Tables

Tables are a primary component of Acadlytic because the platform contains substantial structured academic data.

Tables must prioritize:

- Readability
- Scannability
- Alignment
- Sorting
- Filtering
- Pagination
- Responsive behavior

---

# 41. Table Rules

Recommended alignment:

```text
Text → Left
Numbers → Right
Status → Center or Left
Actions → Right
```

Column headings must clearly identify the data.

Avoid unnecessary columns.

---

# 42. Academic Result Tables

Example:

```text
Subject Code | Subject | Marks | Grade | Credits | Status
```

Result tables should make academic status immediately understandable.

Important status information should not rely exclusively on color.

---

# 43. Table States

Tables must support:

```text
Loading
Loaded
Empty
Error
Partial Data
```

Empty state example:

```text
No students found

Try changing your search or filters.
```

---

# 44. Pagination

Pagination should be consistent across administrative lists.

Provide:

- Current page
- Total/available information where practical
- Previous
- Next
- Page size where required

Large datasets should use server-side pagination.

---

# 45. Tabs

Tabs should be used for related views at the same hierarchy level.

Examples:

```text
Overview
Results
Backlogs
Analytics
```

Do not use tabs for unrelated workflows.

Tabs must provide:

- Active state
- Hover state
- Focus state
- Keyboard navigation
- Accessible labels

---

# 46. Breadcrumbs

Breadcrumbs may be used for deep administrative navigation.

Example:

```text
Students
    >
Student Details
    >
Academic History
```

They should communicate hierarchy rather than duplicate the primary navigation.

---

# 47. Dropdowns

Dropdown menus should be used for:

- Contextual actions
- Secondary actions
- Filters
- Select controls

Dropdowns must:

- Open predictably
- Close on outside interaction where appropriate
- Support keyboard navigation
- Have accessible focus management

---

# 48. Modals and Dialogs

Dialogs should be reserved for focused tasks.

Examples:

- Confirmation
- Small forms
- Important warnings
- Destructive actions

Avoid using dialogs for large workflows when a dedicated page is more appropriate.

---

# 49. Destructive Confirmation

Destructive actions should clearly communicate consequences.

Example:

```text
Deactivate College?

The college will no longer be active, but historical academic
records will be preserved.

[Cancel] [Deactivate College]
```

---

# 50. Drawers

Drawers may be used for:

- Quick details
- Filters
- Secondary information
- Mobile navigation

Drawers should not become an alternative application layout without a clear reason.

---

# 51. Tooltips

Tooltips should provide additional context for unfamiliar icons or abbreviated information.

Do not use tooltips for essential information that users must always see.

Tooltips should not replace accessible labels.

---

# 52. Alerts

Alerts communicate important contextual information.

Variants:

```text
Success
Info
Warning
Error
```

Use alerts for persistent contextual messages.

---

# 53. Toast Notifications

Toasts should communicate short-lived operation results.

Examples:

```text
Student created successfully.
```

```text
Results imported successfully.
```

```text
Unable to save changes.
```

Do not put critical information only inside a toast.

---

# 54. Loading States

Loading states must clearly communicate that content is being retrieved or processed.

Use:

- Skeletons
- Spinners
- Progress indicators
- Loading buttons

Choose the appropriate mechanism based on operation duration.

---

# 55. Skeleton Loading

Skeletons are preferred for page content where the final layout is known.

Example:

```text
[████████████]
[██████]
[████████████████]
```

Skeletons should roughly represent the expected content structure.

---

# 56. Long-Running Operation States

Operations such as result import and processing should use explicit progress/status UI.

Example:

```text
Import Results

✓ File uploaded
✓ File parsed
✓ Records validated
→ Processing records
○ Academic records update
○ Completed
```

If exact percentage progress is unavailable, do not display a fabricated percentage.

---

# 57. Empty States

Empty states should answer:

1. What is empty?
2. Why might it be empty?
3. What can the user do next?

Example:

```text
No Results Available

No academic results have been processed for this semester yet.

[Import Results]
```

---

# 58. Error States

Error states should be:

- Clear
- Actionable
- Non-technical where possible

Example:

```text
Unable to load student records.

Please try again.

[Retry]
```

Technical details may be logged or exposed through an appropriate diagnostic mechanism rather than displayed by default.

---

# 59. Academic-Specific UI Patterns

Acadlytic requires several domain-specific patterns.

These patterns should be standardized.

---

# 60. Semester Summary

A semester summary may contain:

```text
Semester 4

SGPA       8.42
Credits    22
Subjects   6
Backlogs   1
Status     In Progress
```

The layout should prioritize the most important academic metrics.

---

# 61. SGPA and CGPA Display

SGPA and CGPA should be visually prominent.

Example:

```text
CGPA

8.42 / 10
```

Where applicable, the scale should be clearly communicated.

Do not imply a scale if the academic regulation does not define it.

---

# 62. Backlog Status

Backlog UI should distinguish between:

```text
Active
Cleared
Historical
```

Example:

```text
Active Backlogs: 2
Cleared Backlogs: 4
```

Do not hide historical attempts when they are relevant to the academic record.

---

# 63. Academic Timeline

The Academic Passport may use a timeline for:

```text
Semester 1
    ↓
Semester 2
    ↓
Semester 3
    ↓
Semester 4
```

The timeline should communicate progression rather than become decorative.

---

# 64. Attempt History

Attempt history should clearly distinguish attempts.

Example:

```text
Attempt 1
Result: FAIL

Attempt 2
Result: PASS

Current Outcome: CLEARED
```

Historical data should remain visually distinguishable from the current academic outcome.

---

# 65. Result Import UI

The result import workflow should visually communicate:

```text
Upload
   ↓
Map Columns
   ↓
Validate
   ↓
Review
   ↓
Process
   ↓
Complete
```

The user must be able to understand where they are in the process.

---

# 66. Import Validation Summary

Validation results should summarize:

```text
Total Records
Valid
Invalid
Warnings
Duplicates
```

Example:

```text
1,240 Records

Valid       1,180
Warnings      32
Invalid       20
Duplicates     8
```

Detailed records should be available separately.

---

# 67. Analytics Design

Analytics should prioritize decision-relevant information.

A dashboard should generally follow:

```text
Summary KPIs
     ↓
Trends
     ↓
Breakdowns
     ↓
Detailed Data
```

Avoid displaying large numbers of charts without interpretation.

---

# 68. Charts

Charts should be used when visual representation provides meaningful insight.

Possible charts:

- SGPA trend
- CGPA trend
- Pass/fail distribution
- Grade distribution
- Backlog distribution
- Course performance

Charts must include:

- Meaningful labels
- Accessible alternatives where necessary
- Clear legends
- Appropriate units
- Consistent formatting

---

# 69. Chart Color Rules

Charts should use the semantic color system.

Avoid assigning arbitrary colors to the same meaning in different charts.

For example:

```text
Pass → Success
Fail → Error
Warning → Warning
Neutral → Neutral
```

---

# 70. Dashboard Design

Dashboards should avoid visual overload.

Recommended structure:

```text
Page Header
    ↓
Filters
    ↓
KPI Summary
    ↓
Primary Insights
    ↓
Trends
    ↓
Detailed Tables
```

The exact arrangement belongs to individual page specifications.

---

# 71. Role-Aware UI

The interface may adapt according to the user's role.

Roles:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

The UI may hide actions that the user cannot perform.

However:

> Hiding an action in the frontend is not an authorization mechanism.

Backend authorization remains mandatory.

---

# 72. Tenant-Aware UI

College-specific users should see only information relevant to their authorized college.

The frontend should not assume tenant isolation is enforced only through filtering.

The backend remains responsible for tenant isolation.

---

# 73. Navigation Consistency

Navigation patterns should remain consistent across roles.

However, available navigation items may differ according to role.

Example:

```text
Student:
Dashboard
Academic Passport
Results
Backlogs
Analytics
Profile
Settings

College Admin:
Dashboard
Students
Academic Structure
Results
Backlogs
Analytics
Settings
```

Detailed navigation is defined in:

```text
06-design/navigation.md
```

---

# 74. Responsive Design

The design system establishes responsive principles.

Detailed breakpoint and page-level responsive behavior belongs in:

```text
06-design/responsive-design.md
```

General principles:

- Desktop-first data density where appropriate
- Mobile-first usability for student-facing interfaces
- Tables must remain usable on small screens
- Navigation must adapt
- Forms must stack appropriately
- Cards should reflow
- Charts must resize
- Touch targets must remain usable

---

# 75. Mobile Navigation

Mobile navigation should use a dedicated navigation pattern rather than simply shrinking the desktop sidebar.

Possible pattern:

```text
Header
    ↓
Menu Button
    ↓
Mobile Navigation Drawer
```

The drawer must support:

- Keyboard focus
- Close action
- Escape key
- Appropriate overlay
- Accessible labeling

---

# 76. Touch Targets

Interactive controls should provide sufficiently large touch targets.

Avoid tightly packed controls on mobile.

Particular attention should be given to:

- Icon buttons
- Pagination
- Table actions
- Navigation
- Form controls

---

# 77. Accessibility

Acadlytic should target **WCAG 2.2 AA** as the accessibility baseline where practical.

Accessibility requirements include:

- Semantic HTML
- Keyboard accessibility
- Visible focus
- Sufficient contrast
- Accessible labels
- Screen reader compatibility
- Logical heading hierarchy
- Error identification
- Accessible status messages
- Reduced motion support

---

# 78. Keyboard Navigation

All interactive controls must be keyboard accessible.

Required support includes:

```text
Tab
Shift + Tab
Enter
Space
Escape
Arrow keys
```

where appropriate for the component.

---

# 79. Focus States

Every interactive component must have a visible focus state.

Do not remove browser focus indicators without providing an accessible replacement.

---

# 80. ARIA Usage

ARIA should be used when semantic HTML alone cannot communicate the required behavior.

Examples:

```text
aria-label
aria-expanded
aria-controls
aria-describedby
aria-invalid
aria-live
```

Do not add ARIA attributes unnecessarily.

---

# 81. Form Accessibility

Forms must support:

- Explicit labels
- Error association
- Helper text association
- Keyboard navigation
- Focus management
- Accessible validation messages

Example:

```text
<label>
<input>
<p>Helper text</p>
<p>Error message</p>
```

---

# 82. Reduced Motion

Animations must respect:

```text
prefers-reduced-motion
```

Users who prefer reduced motion should not receive unnecessary animation.

---

# 83. Motion Design

Motion should communicate:

- State changes
- Navigation
- Hierarchy
- Feedback

Avoid decorative animation that does not improve usability.

Recommended animation characteristics:

```text
Short
Subtle
Predictable
Purposeful
```

---

# 84. Animation Examples

Appropriate:

```text
Modal opening
Dropdown appearing
Sidebar transition
Loading state
Progress update
Accordion expansion
```

Avoid:

```text
Continuous decorative movement
Excessive bouncing
Large page transitions
Distracting animations
```

---

# 85. Content and Microcopy

Acadlytic language should be:

- Clear
- Professional
- Direct
- Consistent
- User-oriented

Avoid unnecessarily technical terminology in user-facing interfaces.

For example:

Bad:

```text
Persistence operation failed.
```

Better:

```text
Unable to save the student record.
```

---

# 86. Action Labels

Actions should use clear verbs.

Prefer:

```text
Add Student
Import Results
Save Changes
View Results
Download Report
```

Avoid vague labels:

```text
Submit
Proceed
Process
Click Here
```

unless context makes the meaning explicit.

---

# 87. Confirmation Messages

Confirmation messages should communicate the completed action.

Example:

```text
Student created successfully.
```

rather than:

```text
Success!
```

---

# 88. Error Message Principles

Error messages should explain:

```text
What happened?
Why did it happen?
What can the user do?
```

Example:

```text
The result file contains unsupported columns.

Review the column mapping and try again.
```

---

# 89. Date and Time Formatting

Date and time presentation must be consistent throughout the application.

The exact format should be established as a project-wide convention.

Example:

```text
15 Mar 2026
15 Mar 2026, 10:30 AM
```

Technical timestamps should not normally be displayed directly to end users.

---

# 90. Number Formatting

Numbers should use consistent formatting.

Examples:

```text
1,250
92.4%
8.42
```

Do not inconsistently mix formatting conventions across pages.

---

# 91. Academic Data Formatting

Academic values should be displayed according to their defined academic rules.

Examples:

```text
SGPA: 8.42
CGPA: 8.24
Credits: 22
Marks: 82
```

The UI must not invent academic calculation rules.

---

# 92. File Upload Component

The file upload component must communicate:

- Supported formats
- Maximum file size
- Upload state
- Validation state
- Errors
- Selected file
- Removal/replacement action

Example:

```text
Upload University Result

Supported formats: XLSX, CSV

[ Choose File ]

No file selected
```

---

# 93. Drag and Drop

Drag-and-drop may be supported for desktop file upload.

However, there must always be a standard file picker alternative.

Example:

```text
Drag and drop your file here

or

[ Choose File ]
```

---

# 94. Confirmation Before Processing

For potentially consequential academic operations, the interface should provide a clear review step before final processing where applicable.

Example:

```text
1,180 valid records
32 warnings
20 invalid records

[Back] [Process Valid Records]
```

---

# 95. Data Integrity in UI

The interface must not imply that data has been successfully processed before the backend confirms success.

For example:

Do not display:

```text
Result processed successfully
```

until the backend operation has actually completed successfully.

---

# 96. Optimistic UI

Optimistic updates should be used carefully.

Avoid optimistic updates for operations affecting authoritative academic records unless the operation and rollback semantics are explicitly defined.

Examples requiring caution:

- Result processing
- Backlog updates
- Student academic records
- SGPA/CGPA changes

---

# 97. Loading and Data Freshness

When displayed data may be stale or is being refreshed, the UI should provide appropriate feedback.

Examples:

```text
Last updated: 15 Mar 2026, 10:30 AM
```

where useful.

Do not display fake or approximate timestamps.

---

# 98. Component State Standard

Reusable components should define their states explicitly.

Minimum expected states:

```text
Default
Hover
Focus
Active
Disabled
Loading
Error
Empty
```

Not every component requires every state, but the relevant states must be intentionally designed.

---

# 99. Component Naming

Component names should describe their purpose.

Examples:

```text
Button
Input
Select
Modal
DataTable
Pagination
StatusBadge
KpiCard
EmptyState
ErrorState
LoadingState
StudentSummaryCard
SemesterResultTable
BacklogStatus
```

Avoid names based purely on appearance.

Bad:

```text
BlueBox
BigCard
RoundedPanel
```

---

# 100. Component Reusability

Reusable components should be created when a pattern appears across multiple modules.

Examples:

```text
DataTable
StatusBadge
SearchInput
FilterBar
PageHeader
ConfirmDialog
EmptyState
```

Do not prematurely create abstractions for one-off components.

---

# 101. Design Tokens in Tailwind

Tailwind CSS should consume the project's semantic design tokens.

Conceptual example:

```text
bg-background
bg-surface
bg-primary
text-text-primary
text-text-secondary
border-border
text-success
text-error
```

The exact Tailwind configuration belongs to frontend implementation.

---

# 102. CSS Variable Strategy

Theme-sensitive values should use CSS variables.

Example:

```css
:root {
    --color-background: ...;
    --color-surface: ...;
    --color-text-primary: ...;
}

.dark {
    --color-background: ...;
    --color-surface: ...;
    --color-text-primary: ...;
}
```

Components should consume the variables rather than directly defining separate light/dark styles wherever possible.

---

# 103. Hard-Coded Style Rule

Avoid repeated hard-coded visual values.

Bad:

```text
padding: 17px
border-radius: 13px
color: #...
```

throughout unrelated components.

Prefer shared design tokens.

---

# 104. Design Consistency Rule

The following must remain consistent throughout Acadlytic:

- Button hierarchy
- Form controls
- Status colors
- Typography
- Spacing
- Border radius
- Focus states
- Tables
- Empty states
- Loading states
- Error states
- Icons

A component should not introduce a visually different pattern without documented justification.

---

# 105. Anti-Patterns

The following patterns should be avoided.

## 105.1 Excessive Cards

Do not place every piece of information inside a separate card.

---

## 105.2 Excessive Colors

Do not assign arbitrary colors to different data values.

---

## 105.3 Color-Only Status

Do not communicate status using color alone.

---

## 105.4 Inconsistent Buttons

Do not create multiple unrelated button styles for the same action hierarchy.

---

## 105.5 Inconsistent Spacing

Do not use arbitrary spacing values when the design token system provides an appropriate value.

---

## 105.6 Giant Tables on Mobile

Do not simply overflow every desktop table horizontally without considering mobile usability.

---

## 105.7 Excessive Animation

Do not use animation merely to make the interface look active.

---

## 105.8 Frontend-Only Authorization

Do not assume hiding an action means the user is unauthorized.

Backend authorization is authoritative.

---

# 106. Frontend Architecture Relationship

The design system is implemented within the frontend architecture.

Primary technologies:

```text
React
TypeScript
Vite
Tailwind CSS
Lucide React
```

The design system should be exposed through reusable React components.

---

# 107. Component Organization

Conceptual structure:

```text
frontend/src/
├── components/
│   ├── ui/
│   ├── shared/
│   └── layouts/
│
├── features/
│   ├── auth/
│   ├── students/
│   ├── academic/
│   ├── results/
│   ├── backlogs/
│   ├── passport/
│   └── analytics/
│
└── pages/
```

The design system primarily defines reusable components under:

```text
components/ui/
components/shared/
```

---

# 108. Design System vs Page Specifications

This document defines reusable design rules.

It does not define the exact layout of individual pages.

Page-level specifications belong in:

```text
06-design/page-specifications.md
```

For example:

This document defines:

```text
KPI Card
```

The page specification defines:

```text
College Dashboard
    → 4 KPI Cards
    → Analytics Chart
    → Recent Results
```

---

# 109. Design System vs Navigation

Navigation structure is defined separately in:

```text
06-design/navigation.md
```

This document defines the visual and interaction rules for navigation components.

---

# 110. Design System vs Responsive Design

Detailed responsive behavior belongs in:

```text
06-design/responsive-design.md
```

This document establishes general responsive principles and component behavior.

---

# 111. Accessibility Testing

Accessibility should be evaluated using:

- Keyboard testing
- Screen reader testing where applicable
- Browser accessibility tools
- Automated accessibility checks
- Color contrast checks

Accessibility should be part of QA rather than a final afterthought.

---

# 112. Visual Testing

Reusable components should be visually checked across:

```text
Light mode
Dark mode
Desktop
Tablet
Mobile
```

Important states should also be tested:

```text
Default
Hover
Focus
Disabled
Loading
Error
Empty
```

---

# 113. Design Review Checklist

Before approving a component, verify:

- Is the hierarchy clear?
- Is the component reusable?
- Does it use design tokens?
- Does it work in light mode?
- Does it work in dark mode?
- Is it responsive?
- Is keyboard interaction supported?
- Is focus visible?
- Are status colors semantic?
- Are labels clear?
- Are loading/error/empty states defined?
- Does it follow existing patterns?

---

# 114. AI Coding Agent Rules

AI coding agents working on Acadlytic frontend code must follow these rules.

### Rule 1

Use existing design-system components before creating new components.

### Rule 2

Use semantic design tokens instead of arbitrary colors.

### Rule 3

Do not introduce a new spacing scale.

### Rule 4

Do not create arbitrary button variants.

### Rule 5

Do not use color as the only status indicator.

### Rule 6

Do not remove focus indicators.

### Rule 7

Use semantic HTML wherever possible.

### Rule 8

Use Lucide React for standard interface icons.

### Rule 9

Do not invent academic terminology or academic rules.

### Rule 10

Do not implement SGPA/CGPA formulas in the UI unless explicitly required by the authoritative business logic.

### Rule 11

Do not use frontend visibility as a substitute for authorization.

### Rule 12

Do not introduce a new design pattern without checking existing components and design specifications.

### Rule 13

Support light and dark themes where the application shell supports them.

### Rule 14

Do not hard-code fake loading progress or fake data freshness information.

### Rule 15

Keep accessibility requirements intact when modifying components.

---

# 115. Definition of Done

A design-system component is considered complete when:

- Its purpose is documented.
- Its visual hierarchy is defined.
- Its relevant states are defined.
- Light mode is supported.
- Dark mode is supported where applicable.
- Responsive behavior is considered.
- Keyboard interaction is supported where applicable.
- Accessibility requirements are satisfied.
- Semantic tokens are used.
- Reusability is considered.
- Component naming follows project conventions.
- No unnecessary one-off styling is introduced.
- The component has been visually reviewed.

---

# 116. Unresolved Design Decisions

The following decisions remain subject to final design review:

1. Final brand color palette.
2. Final typography/font family.
3. Exact typography scale.
4. Exact spacing tokens.
5. Exact border-radius tokens.
6. Exact shadow/elevation tokens.
7. Final dark-mode palette.
8. Final chart palette.
9. Final breakpoint values.
10. Final component library implementation strategy.
11. Final visual treatment for academic status states.
12. Final mobile table interaction pattern.
13. Final date/time display conventions.

These decisions should be finalized before the design system is marked:

```text
Approved
```

---

# 117. Relationship With Project Architecture

The design system depends on and must remain consistent with:

```text
05-architecture/frontend-architecture.md
05-architecture/api-architecture.md
05-architecture/system-architecture.md
05-architecture/data-ownership.md
```

The design system does not change:

- Backend business rules
- Database ownership
- API contracts
- Authorization rules
- Academic calculation rules

---

# 118. Relationship With Feature Specifications

Feature specifications define functional behavior.

The design system defines how that behavior should be visually and interactively represented.

Example:

```text
Result Import Feature Specification
        ↓
Defines what result import does

Design System
        ↓
Defines reusable upload, validation,
status, table, alert and progress patterns
```

---

# 119. Design Architecture Flow

The overall relationship is:

```text
Design System
      ↓
Reusable UI Components
      ↓
Feature UI
      ↓
Page Specifications
      ↓
Role-Specific Pages
      ↓
Application Interface
```

---

# 120. Final Design System Model

```text
                 Acadlytic Design System
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     Tokens          Components         Patterns
        │                 │                 │
   ┌────┼────┐       ┌────┼────┐       ┌────┼────┐
   │    │    │       │    │    │       │    │    │
 Colors Type Spacing Buttons Forms   Tables States
   │    │    │       │    │    │       │    │    │
   └────┼────┘       └────┼────┘       └────┼────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ↓
                  Feature Interfaces
                          ↓
                     Page Design
                          ↓
                  Acadlytic Product UI
```

---

# 121. Final Principles

The Acadlytic interface should always prioritize:

```text
Clarity
   ↓
Consistency
   ↓
Accessibility
   ↓
Data Readability
   ↓
Predictability
   ↓
Responsiveness
   ↓
Visual Quality
```

The design system exists to make Acadlytic feel like one coherent academic platform rather than a collection of independently designed pages.

---

# 122. Document Status

**Current Status:** Draft / Under Review

This document is the initial design-system foundation.

It should be reviewed together with:

```text
06-design/navigation.md
06-design/page-specifications.md
06-design/responsive-design.md
```

After the design system, navigation, page specifications, and responsive rules are reviewed and finalized, the status may be changed to:

```text
Approved / Implementation Ready
```

Until then, implementation should follow these rules while keeping unresolved visual decisions configurable through design tokens.