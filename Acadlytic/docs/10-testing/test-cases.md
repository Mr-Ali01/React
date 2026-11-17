# Core Test Cases

## Authentication
- valid login
- invalid password
- unauthorized route
- expired session
- role restriction

## Tenant Isolation
- College A cannot read College B
- College A cannot update College B
- student cannot read another student

## Result Import
- valid Excel
- valid CSV
- unsupported file
- malformed row
- missing identifier
- unknown subject
- duplicate record
- invalid grade
- repeated import
- failed processing recovery

## Backlog
- fail creates backlog
- pass creates no backlog
- later pass clears backlog
- previous attempt remains visible
- duplicate result does not duplicate backlog

## Academic Passport
- all processed semesters appear
- grades map correctly
- credits aggregate correctly
- backlog state is consistent

## Analytics
- counts match source data
- filters respect tenant
- drill-down respects authorization


# Acadlytic — Test Cases

**Document:** `10-testing/test-cases.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Type:** Test Case Specification  
**Status:** Draft / Under Review  
**Related Documents:**
- `10-testing/test-strategy.md`
- `07-project-rules/security-rules.md`
- `07-project-rules/backend-rules.md`
- `07-project-rules/frontend-rules.md`
- `07-project-rules/database-rules.md`
- `09-development/feature-specifications/`
- `09-development/implementation-notes/`

---

## 1. Purpose

This document defines the concrete test cases required to verify that Acadlytic behaves correctly across its functional workflows, academic data lifecycle, security boundaries, tenant isolation, user interfaces, APIs, database operations, and integrations.

The purpose is not simply to verify that individual screens work.

The test cases must establish that:

- academic data remains accurate
- tenant boundaries remain enforced
- users can perform only authorized actions
- imported results are validated before becoming authoritative
- processed results remain historically safe
- backlogs correctly represent unresolved academic requirements
- Academic Passport reflects authoritative academic data
- analytics correctly derive metrics without double-counting
- Student Portal exposes only permitted student information
- asynchronous workflows remain observable and recoverable
- duplicate processing does not corrupt academic records
- frontend and backend behavior remain consistent

---

# 2. Test Case Structure

Each test case should contain:

| Field | Description |
|---|---|
| Test Case ID | Unique identifier |
| Module | Functional area |
| Scenario | What is being tested |
| Preconditions | Required setup |
| Test Data | Data required |
| Steps | Actions to perform |
| Expected Result | Expected system behavior |
| Priority | Critical / High / Medium / Low |
| Type | Functional / Security / Integration / UI / etc. |
| Status | Not Run / Pass / Fail / Blocked |

---

# 3. Test Data Strategy

Test data must be deterministic and reusable.

The test environment should contain:

```text
University
    ↓
College A
    ↓
Course A
    ↓
Semester 1
    ↓
Subjects
    ↓
Students
    ↓
Results
```

A second tenant must exist:

```text
University
    ↓
College B
    ↓
Course B
    ↓
Students
    ↓
Results
```

This is required for tenant-isolation testing.

## 3.1 Test Users

At minimum:

```text
SUPER_ADMIN
COLLEGE_ADMIN_A
ACADEMIC_STAFF_A
STUDENT_A
COLLEGE_ADMIN_B
ACADEMIC_STAFF_B
STUDENT_B
```

## 3.2 Student Test Data

Include:

- valid student
- duplicate student identifier
- inactive student
- student from another college
- student with no results
- student with one semester result
- student with multiple semester results
- student with backlog
- student whose backlog is later resolved
- student with supplementary attempts

## 3.3 Result Test Data

Include:

- valid passed result
- valid failed result
- supplementary result
- duplicate result
- unknown student
- unknown subject
- invalid marks
- missing marks
- missing student identifier
- missing subject code
- invalid semester
- invalid course
- invalid attempt
- warning-level record
- malformed CSV
- malformed Excel file
- unsupported file type

---

# 4. Authentication Test Cases

## TC-AUTH-001 — Valid Login

**Module:** Authentication  
**Priority:** Critical  
**Type:** Functional

### Preconditions

- Active user exists.
- Correct email and password are available.

### Steps

1. Open `/login`.
2. Enter valid credentials.
3. Submit the login form.

### Expected Result

- Authentication succeeds.
- User receives an authenticated session/token according to the approved authentication mechanism.
- User is redirected to the appropriate application area.
- User identity is available to the frontend.
- User role is available to authorization logic.
- Tenant context is correctly established.

---

## TC-AUTH-002 — Invalid Password

### Steps

1. Enter a valid email.
2. Enter an incorrect password.
3. Submit.

### Expected Result

- Login fails.
- No authenticated session is created.
- Generic authentication error is displayed.
- Sensitive authentication information is not exposed.

---

## TC-AUTH-003 — Unknown User

### Steps

1. Enter an email that does not exist.
2. Enter any password.
3. Submit.

### Expected Result

- Authentication fails.
- No account information is unnecessarily disclosed.
- Security event is recorded where applicable.

---

## TC-AUTH-004 — Inactive User Login

### Preconditions

- User account is inactive/suspended.

### Expected Result

- Login is rejected.
- User cannot access protected application resources.

---

## TC-AUTH-005 — Protected Route Without Authentication

### Steps

1. Open a protected route directly without authentication.

### Expected Result

- Access is denied.
- User is redirected to login or receives the appropriate unauthorized response.
- No protected data is exposed.

---

## TC-AUTH-006 — Logout

### Steps

1. Login.
2. Select Logout.
3. Attempt to access a protected route.

### Expected Result

- Authentication state is cleared.
- Protected resources are no longer accessible.

---

## TC-AUTH-007 — Current User Endpoint

**Endpoint:**

```text
GET /api/v1/me
```

### Expected Result

- Authenticated user information is returned.
- Response does not expose sensitive fields.
- Tenant and role information are consistent with the authenticated identity.

---

## TC-AUTH-008 — Password Change

### Expected Result

- Correct current password is required.
- New password is validated.
- Password is securely stored.
- Old password no longer authenticates after successful change.

---

## TC-AUTH-009 — Password Reset

### Expected Result

- Reset process follows the approved password-reset workflow.
- Reset token is protected.
- Expired/invalid token is rejected.
- Password is changed only after successful verification.

---

## TC-AUTH-010 — Failed Login Protection

### Steps

1. Repeatedly submit invalid credentials.
2. Observe authentication behavior.

### Expected Result

- Failed-login protection is triggered according to the configured security policy.
- No unlimited brute-force authentication behavior is permitted.

---

# 5. Authorization and Role Test Cases

## TC-ROLE-001 — SUPER_ADMIN Access

Verify that SUPER_ADMIN can access permitted platform-level administrative operations.

---

## TC-ROLE-002 — COLLEGE_ADMIN Access

Verify that COLLEGE_ADMIN can access permitted operations within the assigned college.

---

## TC-ROLE-003 — ACADEMIC_STAFF Access

Verify that ACADEMIC_STAFF can perform only permitted academic operations.

---

## TC-ROLE-004 — STUDENT Access

Verify that STUDENT can access only student-facing resources.

---

## TC-ROLE-005 — Student Cannot Access Admin Endpoint

### Expected Result

- Backend returns `403 Forbidden` or equivalent authorization failure.
- Frontend visibility alone is not relied upon for security.

---

## TC-ROLE-006 — Role Escalation Attempt

Attempt to modify a request to use a higher-privilege role.

### Expected Result

- Request is rejected.
- Server derives authorization from trusted identity/context.
- Client-provided role cannot elevate privileges.

---

# 6. Tenant Isolation Test Cases

Tenant isolation is a critical Acadlytic requirement.

## TC-TENANT-001 — College A Cannot View College B Student

### Steps

1. Authenticate as College A user.
2. Attempt to retrieve College B student data.

### Expected Result

- Request is rejected or returns no unauthorized resource.
- College B data is never exposed.

---

## TC-TENANT-002 — Cross-Tenant Student URL Access

### Steps

1. Authenticate as College A.
2. Obtain a College B student ID.
3. Open:

```text
/app/students/{collegeBStudentId}
```

### Expected Result

- Access is denied.
- No College B information is rendered.

---

## TC-TENANT-003 — Cross-Tenant API IDOR

Attempt:

```text
GET /api/v1/students/{foreignStudentId}
```

### Expected Result

- Backend rejects unauthorized access.
- Changing the ID in the URL does not bypass authorization.

---

## TC-TENANT-004 — Cross-Tenant Result Import

Attempt to process or access an import belonging to another college.

### Expected Result

- Operation is rejected.

---

## TC-TENANT-005 — Cross-Tenant Analytics

Attempt to request analytics for another college.

### Expected Result

- Unauthorized data is not included in the response.

---

# 7. College Management Test Cases

## TC-COLLEGE-001 — Create College

**Actor:** SUPER_ADMIN

### Expected Result

- College is created with valid required fields.
- Unique college code is enforced.
- Audit information is recorded.

---

## TC-COLLEGE-002 — Non-SUPER_ADMIN Creates College

### Expected Result

- Operation is rejected.

---

## TC-COLLEGE-003 — Duplicate College Code

### Expected Result

- Creation fails.
- Database uniqueness is preserved.
- Clear validation error is returned.

---

## TC-COLLEGE-004 — Update College

### Expected Result

- Authorized fields are updated.
- Historical academic data remains intact.

---

## TC-COLLEGE-005 — Deactivate College

### Expected Result

- College becomes inactive/deactivated.
- Historical data remains preserved.
- Physical deletion does not occur.

---

## TC-COLLEGE-006 — Suspended College Access

### Expected Result

- Application behavior follows the approved college-status policy.
- Unauthorized operational access is blocked where required.

---

# 8. Academic Structure Test Cases

## TC-ACADEMIC-001 — Create Course

### Expected Result

- Course belongs to the correct college.
- Required fields are validated.

---

## TC-ACADEMIC-002 — Duplicate Course Code

### Expected Result

- Duplicate is rejected according to the approved uniqueness rule.

---

## TC-ACADEMIC-003 — Create Semester

### Expected Result

- Semester belongs to the correct course.
- Ordering is valid.

---

## TC-ACADEMIC-004 — Duplicate Semester Order

### Expected Result

- Duplicate semester ordering is rejected.

---

## TC-ACADEMIC-005 — Create Subject

### Expected Result

- Subject belongs to the correct academic context.
- Subject code and credits are validated.

---

## TC-ACADEMIC-006 — Cross-College Academic Reference

Attempt to associate a student/result with an academic structure belonging to another college.

### Expected Result

- Operation is rejected.

---

# 9. Student Management Test Cases

## TC-STUDENT-001 — Create Student

### Expected Result

- Student is created within the correct tenant.
- Official student identifier is stored.
- Course association is validated.

---

## TC-STUDENT-002 — Duplicate Student Identifier

### Expected Result

- Duplicate identifier is rejected according to the configured tenant/academic uniqueness rules.

---

## TC-STUDENT-003 — Student Search

Verify search by:

- official identifier
- name
- permitted filters

### Expected Result

- Matching records are returned.
- Search does not expose another tenant's records.

---

## TC-STUDENT-004 — Student Detail

### Expected Result

Authorized users can view permitted student academic identity information.

---

## TC-STUDENT-005 — Student Status Change

### Expected Result

- Status changes correctly.
- Historical academic data remains preserved.

---

## TC-STUDENT-006 — Student Account Relationship

Verify that a student identity and authentication account remain correctly associated without treating the user account as the academic source of truth.

---

# 10. Result Import Test Cases

## TC-IMPORT-001 — Upload Valid CSV

### Expected Result

- File is accepted.
- Import record is created.
- Status progresses through the import lifecycle.

---

## TC-IMPORT-002 — Upload Valid Excel File

### Expected Result

- `.xlsx` file is parsed successfully.
- Records are normalized.

---

## TC-IMPORT-003 — Unsupported File Type

Upload an unsupported file.

### Expected Result

- Upload is rejected.
- No academic records are created.

---

## TC-IMPORT-004 — Empty File

### Expected Result

- Import is rejected or marked failed according to the import policy.
- No invalid academic records become authoritative.

---

## TC-IMPORT-005 — Malformed CSV

### Expected Result

- Parser detects malformed content.
- Import does not silently create incorrect academic data.

---

## TC-IMPORT-006 — Missing Required Column

### Expected Result

- Import validation identifies the missing column.
- Processing is blocked.

---

## TC-IMPORT-007 — Unknown Student

### Expected Result

- Record is flagged.
- Student is not automatically created.

---

## TC-IMPORT-008 — Unknown Subject

### Expected Result

- Record is flagged.
- Subject is not automatically created.

---

## TC-IMPORT-009 — Duplicate Result Record

### Expected Result

- Duplicate is detected.
- Duplicate processing does not create multiple authoritative records.

---

## TC-IMPORT-010 — Import Ownership

Attempt to access another college's import.

### Expected Result

- Access is denied.

---

# 11. Result Validation Test Cases

## TC-VALIDATION-001 — Required Fields Validation

### Expected Result

Records missing required fields become `INVALID` or the appropriate validation status.

---

## TC-VALIDATION-002 — Student Identity Validation

### Expected Result

- Known student passes identity validation.
- Unknown student is flagged.
- Student name alone is not used as the authoritative matching identity.

---

## TC-VALIDATION-003 — Subject Identity Validation

### Expected Result

- Known subject code matches.
- Unknown subject code produces a validation error.

---

## TC-VALIDATION-004 — Academic Context Validation

Verify:

- course
- semester
- subject relationship
- student course relationship

### Expected Result

Invalid academic relationships are rejected.

---

## TC-VALIDATION-005 — Invalid Result Value

Test invalid marks/grade/result values.

### Expected Result

- Record is marked invalid.
- Invalid data cannot proceed as valid.

---

## TC-VALIDATION-006 — Missing Value vs Zero

### Expected Result

The system does not treat a missing academic value as numeric zero unless explicitly defined by approved business rules.

---

## TC-VALIDATION-007 — Duplicate Detection

### Expected Result

Duplicate academic result identity is detected before processing.

---

## TC-VALIDATION-008 — Validation Summary

Endpoint:

```text
GET /api/v1/result-imports/{importId}/validation-summary
```

### Expected Result

Summary accurately reports:

- valid records
- invalid records
- warnings
- pending records
- validation errors

---

## TC-VALIDATION-009 — Validation Does Not Mutate Academic Truth

### Expected Result

Validation alone does not:

- create authoritative result records
- create backlog records
- update SGPA
- update CGPA
- update Academic Passport

---

# 12. Result Processing Test Cases

## TC-PROCESS-001 — Process Valid Import

### Expected Result

- Eligible records are processed.
- Authoritative result records are created.
- Processing occurs within the correct tenant.

---

## TC-PROCESS-002 — Process Invalid Import

### Expected Result

- Processing is blocked.
- Invalid records cannot become authoritative.

---

## TC-PROCESS-003 — Process Pending Validation

### Expected Result

- Processing is blocked until required validation is complete.

---

## TC-PROCESS-004 — Process Warning Record

### Expected Result

Warning records are processed only if the approved business policy explicitly permits them.

---

## TC-PROCESS-005 — Transaction Rollback

Create a controlled failure during processing.

### Expected Result

- Transaction rolls back where atomicity is required.
- Partial corruption of authoritative academic data does not occur.

---

## TC-PROCESS-006 — Idempotent Processing

### Steps

1. Process an import.
2. Submit the same processing request again.

### Expected Result

- Duplicate authoritative records are not created.
- Existing processed state is safely recognized.

---

## TC-PROCESS-007 — Concurrent Processing

Trigger the same processing operation concurrently.

### Expected Result

- Only one valid processing outcome is committed.
- Database constraints/locking/idempotency prevent duplication.

---

## TC-PROCESS-008 — Historical Attempt Preservation

Process multiple attempts for the same student and subject.

### Expected Result

- Each legitimate attempt is preserved.
- Previous attempts are not overwritten.

---

## TC-PROCESS-009 — Regular Result

### Expected Result

Regular attempt is stored correctly.

---

## TC-PROCESS-010 — Supplementary Result

### Expected Result

Supplementary attempt is stored as a distinct attempt where appropriate.

---

# 13. Academic Calculation Test Cases

Academic formulas must use approved academic configuration rather than invented assumptions.

## TC-CALC-001 — SGPA Calculation

### Expected Result

- SGPA is calculated using the approved formula/configuration.
- Result is associated with the correct semester.

---

## TC-CALC-002 — CGPA Calculation

### Expected Result

- CGPA reflects the approved calculation rule.
- Previous academic history is correctly included.

---

## TC-CALC-003 — Missing Academic Data

### Expected Result

Missing values do not silently become zero.

---

## TC-CALC-004 — Reprocessing Does Not Double Count

Process/reprocess the same result.

### Expected Result

SGPA/CGPA is not inflated by duplicate processing.

---

# 14. Backlog Test Cases

## TC-BACKLOG-001 — Failed Result Creates Backlog

### Expected Result

A failed academic requirement creates or maintains the appropriate open backlog.

---

## TC-BACKLOG-002 — Repeated Failure

### Expected Result

Repeated failed attempts do not create duplicate backlog requirements for the same unresolved academic context.

---

## TC-BACKLOG-003 — Supplementary Pass Resolves Backlog

### Expected Result

A later successful attempt resolves the corresponding backlog.

---

## TC-BACKLOG-004 — Attempt History

### Expected Result

All relevant attempts remain visible in chronological/history context.

---

## TC-BACKLOG-005 — Backlog Cannot Be Arbitrarily Created

Attempt unrestricted manual creation through an API.

### Expected Result

Operation is rejected unless explicitly supported by an approved workflow.

---

## TC-BACKLOG-006 — Resolved Backlog Preservation

### Expected Result

Resolved backlog history remains available for audit/history.

---

## TC-BACKLOG-007 — Backlog Tenant Isolation

### Expected Result

Users cannot view another college's backlog records.

---

# 15. Academic Passport Test Cases

## TC-PASSPORT-001 — Student Passport

### Expected Result

Passport displays:

- student profile
- program
- semester history
- subject results
- attempts
- SGPA
- CGPA
- credits
- backlog summary

where authoritative data exists.

---

## TC-PASSPORT-002 — Passport Uses Authoritative Data

### Expected Result

Passport reflects processed academic data and does not create conflicting academic values.

---

## TC-PASSPORT-003 — Passport After Result Processing

### Steps

1. Process a valid result.
2. Open Academic Passport.

### Expected Result

Passport reflects the newly processed academic state.

---

## TC-PASSPORT-004 — Passport After Backlog Resolution

### Expected Result

Backlog summary reflects the resolved state.

---

## TC-PASSPORT-005 — Student `/me` Passport

Endpoint:

```text
GET /api/v1/me/academic-passport
```

### Expected Result

Student receives only their own passport.

---

## TC-PASSPORT-006 — Unauthorized Student Passport Access

Student A attempts to access Student B's passport.

### Expected Result

Access is denied.

---

# 16. Analytics Test Cases

## TC-ANALYTICS-001 — Dashboard KPI

### Expected Result

Dashboard KPIs accurately represent authoritative academic data.

---

## TC-ANALYTICS-002 — Student Analytics

### Expected Result

Student-level analytics match the student's processed academic history.

---

## TC-ANALYTICS-003 — Semester Analytics

### Expected Result

Semester metrics use only relevant academic records.

---

## TC-ANALYTICS-004 — Course Analytics

### Expected Result

Course analytics aggregate only students belonging to the authorized course/tenant.

---

## TC-ANALYTICS-005 — Subject Analytics

### Expected Result

Subject-level metrics are calculated from the correct subject records.

---

## TC-ANALYTICS-006 — Backlog Analytics

### Expected Result

Open/resolved backlog metrics correctly reflect backlog lifecycle state.

---

## TC-ANALYTICS-007 — Missing Data

### Expected Result

Missing academic information is not incorrectly interpreted as zero or fail.

---

## TC-ANALYTICS-008 — Attempt Double Counting

### Expected Result

Metrics distinguish between:

- attempts
- unique students
- unique academic requirements

where required.

---

## TC-ANALYTICS-009 — Unauthorized Analytics

### Expected Result

Analytics cannot expose another tenant's data.

---

## TC-ANALYTICS-010 — Filter Combination

Test combinations of:

- course
- semester
- subject
- student
- status

### Expected Result

Filters produce consistent and correctly scoped results.

---

# 17. Student Portal Test Cases

## TC-PORTAL-001 — Student Dashboard

### Expected Result

Dashboard displays authorized academic summary.

---

## TC-PORTAL-002 — Student Results

### Expected Result

Student can view their own results.

---

## TC-PORTAL-003 — Student Backlogs

### Expected Result

Student sees their current and historical backlog information according to the approved visibility rules.

---

## TC-PORTAL-004 — Student Analytics

### Expected Result

Student analytics show only the student's authorized information.

---

## TC-PORTAL-005 — Student Profile

### Expected Result

Student can view permitted profile information.

---

## TC-PORTAL-006 — Student Profile Update

### Expected Result

Only fields permitted by the product rules can be modified.

---

## TC-PORTAL-007 — Student Cannot Edit Results

### Expected Result

Student has no supported operation to modify authoritative academic results.

---

## TC-PORTAL-008 — Student Cannot Edit Backlog State

### Expected Result

Student cannot arbitrarily mark a backlog as resolved.

---

# 18. API Test Cases

## TC-API-001 — Invalid Request Body

### Expected Result

API returns structured validation errors.

---

## TC-API-002 — Missing Authentication

### Expected Result

Protected API returns appropriate authentication failure.

---

## TC-API-003 — Insufficient Authorization

### Expected Result

API returns appropriate authorization failure.

---

## TC-API-004 — Invalid Resource ID

### Expected Result

API returns an appropriate error without exposing internal details.

---

## TC-API-005 — Resource Not Found

### Expected Result

Correct not-found behavior is returned.

---

## TC-API-006 — Stable Error Contract

### Expected Result

Errors contain the approved structure and stable error code where applicable.

---

## TC-API-007 — Pagination

### Expected Result

Pagination correctly limits results and returns expected metadata.

---

## TC-API-008 — Sorting

### Expected Result

Allowed sort fields work correctly.

---

## TC-API-009 — Filtering

### Expected Result

Allowed filters are validated and correctly applied.

---

# 19. Database Test Cases

## TC-DB-001 — Unique Constraint

Verify unique constraints for critical identifiers.

---

## TC-DB-002 — Foreign Key Integrity

Attempt to create records referencing nonexistent entities.

### Expected Result

Operation is rejected.

---

## TC-DB-003 — Tenant Ownership Integrity

Verify tenant-owned entities cannot reference entities from another tenant where such relationships are prohibited.

---

## TC-DB-004 — Transaction Rollback

Verify failed multi-step operations do not leave inconsistent partial state.

---

## TC-DB-005 — Migration Test

Run database migrations on a clean database.

### Expected Result

- All migrations succeed.
- Schema matches application expectations.

---

## TC-DB-006 — Migration Compatibility

Run migrations against a representative existing schema.

### Expected Result

Existing valid data remains intact.

---

# 20. File Upload Security Test Cases

## TC-FILE-001 — Allowed Extension

Verify supported CSV/Excel files are accepted.

---

## TC-FILE-002 — Oversized File

### Expected Result

File exceeding the configured limit is rejected.

---

## TC-FILE-003 — Malicious Filename

Upload a file with path traversal-like filename.

### Expected Result

Filename cannot control filesystem location.

---

## TC-FILE-004 — Malicious File Content

Upload a file containing unexpected/malicious content.

### Expected Result

File processing does not execute uploaded content.

---

## TC-FILE-005 — Unauthorized File Access

Attempt to access another tenant's imported file.

### Expected Result

Access is denied.

---

# 21. Security Test Cases

## TC-SEC-001 — SQL Injection

Attempt SQL injection through:

- search
- filters
- IDs
- query parameters
- form fields

### Expected Result

Injection does not alter query behavior or database structure.

---

## TC-SEC-002 — XSS

Attempt script injection through user-controlled fields.

### Expected Result

Script is not executed.

---

## TC-SEC-003 — IDOR

Modify resource IDs in API requests.

### Expected Result

Unauthorized records remain inaccessible.

---

## TC-SEC-004 — Privilege Escalation

Attempt to perform an administrator action as a lower-privileged user.

### Expected Result

Request is rejected.

---

## TC-SEC-005 — Sensitive Data Exposure

Inspect API responses.

### Expected Result

Passwords, secrets, tokens, and other sensitive fields are not unnecessarily exposed.

---

## TC-SEC-006 — Authentication Bypass

Attempt to access protected endpoints through manipulated requests.

### Expected Result

Authentication cannot be bypassed.

---

# 22. Frontend Test Cases

## TC-UI-001 — Login Form Validation

Verify:

- required fields
- invalid email
- password validation
- loading state
- error state
- success state

---

## TC-UI-002 — Protected Route Guard

### Expected Result

Unauthenticated users cannot access protected pages.

---

## TC-UI-003 — Role-Based Navigation

### Expected Result

Navigation reflects permitted functionality.

Backend authorization remains authoritative.

---

## TC-UI-004 — Loading State

Verify all asynchronous pages display an appropriate loading state.

---

## TC-UI-005 — Empty State

Verify empty datasets show meaningful empty states rather than broken layouts.

---

## TC-UI-006 — Error State

Verify API failures produce understandable error UI.

---

## TC-UI-007 — Result Import Progress

### Expected Result

Long-running import/validation/processing states are visible and understandable.

---

## TC-UI-008 — Form Submission Prevention

Repeated rapid submission must not accidentally create duplicate records.

---

# 23. Responsive Test Cases

Test at minimum:

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

## TC-RESP-001 — No Horizontal Page Overflow

### Expected Result

No unintended horizontal scrolling exists.

---

## TC-RESP-002 — Mobile Navigation

### Expected Result

Navigation is usable on mobile.

---

## TC-RESP-003 — Responsive Tables

### Expected Result

Large data tables remain usable without breaking the page layout.

---

## TC-RESP-004 — Result Import Interface

### Expected Result

Upload, preview, validation errors, and processing status remain usable on small screens.

---

## TC-RESP-005 — Analytics Charts

### Expected Result

Charts remain readable and usable across supported viewport sizes.

---

# 24. Accessibility Test Cases

## TC-A11Y-001 — Keyboard Navigation

All interactive functionality must be reachable using the keyboard.

---

## TC-A11Y-002 — Visible Focus

Focused controls have a visible focus indicator.

---

## TC-A11Y-003 — Form Labels

Inputs have accessible labels.

---

## TC-A11Y-004 — Error Association

Validation errors are associated with their corresponding controls.

---

## TC-A11Y-005 — Modal/Drawer Accessibility

Dialogs and drawers correctly manage:

- focus
- keyboard interaction
- closing behavior
- accessible naming

---

## TC-A11Y-006 — Reduced Motion

Users requesting reduced motion do not receive unnecessary animations.

---

# 25. Integration Test Cases

## TC-INT-001 — Complete Result Lifecycle

Execute:

```text
Upload
 ↓
Parse
 ↓
Validate
 ↓
Review
 ↓
Process
 ↓
Result Record
 ↓
Backlog
 ↓
Passport
 ↓
Analytics
```

### Expected Result

All modules agree on the resulting academic state.

---

## TC-INT-002 — Failed Result Lifecycle

### Expected Result

A failed result correctly affects:

- authoritative result history
- backlog lifecycle
- Academic Passport
- analytics

without duplicating state.

---

## TC-INT-003 — Passing Attempt Resolves Backlog

### Expected Result

Processing a successful later attempt updates all dependent read views consistently.

---

## TC-INT-004 — Reprocessing Lifecycle

### Expected Result

Retrying a completed operation does not corrupt academic history.

---

## TC-INT-005 — Import Failure Recovery

### Expected Result

Failed imports remain identifiable and recoverable according to the supported workflow.

---

# 26. Performance Test Cases

## TC-PERF-001 — Large Result Import

Use a representative large result file.

### Expected Result

Import completes within the approved performance target without excessive memory consumption.

---

## TC-PERF-002 — Large Validation Batch

### Expected Result

Validation remains performant and avoids N+1 database behavior.

---

## TC-PERF-003 — Analytics Dashboard

### Expected Result

Dashboard query performance remains within the approved target for representative data volume.

---

## TC-PERF-004 — Student List

### Expected Result

Student list remains responsive with pagination and filtering.

---

# 27. Concurrency Test Cases

## TC-CONC-001 — Concurrent Import Processing

Two workers attempt to process the same import.

### Expected Result

Only the valid processing operation succeeds.

---

## TC-CONC-002 — Concurrent Backlog Resolution

Two attempts attempt to resolve the same backlog.

### Expected Result

Final state remains consistent and duplicate resolution records are not created.

---

## TC-CONC-003 — Concurrent Student Creation

Two requests attempt to create the same student identifier.

### Expected Result

Database constraints and application logic prevent duplicate authoritative identities.

---

# 28. Audit and Observability Test Cases

## TC-AUDIT-001 — College Creation Audit

### Expected Result

Creation event identifies:

- actor
- operation
- target
- timestamp
- relevant context

---

## TC-AUDIT-002 — Result Processing Audit

### Expected Result

Processing operation is traceable to the relevant import/job and actor/system process.

---

## TC-AUDIT-003 — Security Event Logging

Verify important authentication/security failures are logged according to the security policy.

---

## TC-AUDIT-004 — Correlation ID

### Expected Result

Relevant backend operations can be traced across logs using the configured correlation mechanism.

---

# 29. Regression Test Suite

The following areas must be included in regression testing after significant changes:

```text
Authentication
Authorization
Tenant isolation
College management
Academic structure
Student management
Result import
Result validation
Result processing
Backlog lifecycle
Academic calculations
Academic Passport
Analytics
Student Portal
File upload
API contracts
Database migrations
Security controls
Responsive UI
Accessibility
```

---

# 30. Critical Release Test Cases

The following tests are release-blocking.

| Test Area | Release Blocking |
|---|---|
| Login | Yes |
| Authorization | Yes |
| Tenant isolation | Yes |
| IDOR protection | Yes |
| Student identity | Yes |
| Result validation | Yes |
| Result processing | Yes |
| Duplicate processing | Yes |
| Academic calculation | Yes |
| Backlog lifecycle | Yes |
| Passport correctness | Yes |
| Analytics correctness | Yes |
| Database integrity | Yes |
| File upload security | Yes |
| Production migrations | Yes |
| Critical E2E workflow | Yes |

A release must not proceed if a critical academic-data or security test fails.

---

# 31. Test Case Execution Status

Each test case should be tracked using:

```text
NOT_RUN
PASS
FAIL
BLOCKED
SKIPPED
```

## 31.1 Failure Recording

A failed test should record:

- test case ID
- environment
- build/version
- test data
- reproduction steps
- expected result
- actual result
- screenshot/log where useful
- severity
- related bug ID

---

# 32. Severity Classification

## Critical

Examples:

- cross-tenant data exposure
- incorrect academic result processing
- duplicate authoritative academic records
- incorrect SGPA/CGPA
- authentication bypass
- privilege escalation
- irreversible data corruption

## High

Examples:

- backlog incorrectly resolved
- result validation bypass
- Passport showing incorrect academic data
- analytics showing materially incorrect academic metrics
- major workflow failure

## Medium

Examples:

- non-critical API validation issue
- incorrect filter behavior
- UI workflow issue with workaround

## Low

Examples:

- minor visual defect
- non-critical spacing issue
- minor copy inconsistency

---

# 33. Test Execution Order

Testing should generally follow the dependency chain:

```text
1. Database
2. Backend Foundation
3. Authentication
4. Authorization
5. Tenant Isolation
6. College Management
7. Academic Structure
8. Student Management
9. Result Import
10. Result Validation
11. Result Processing
12. Backlog Tracking
13. Academic Passport
14. Analytics
15. Student Portal
16. End-to-End Integration
17. Security
18. Accessibility
19. Performance
20. Regression
21. Production Smoke
```

---

# 34. Definition of Test Complete

A feature should not be considered tested merely because the happy path passes.

A feature is considered adequately tested when:

- happy path passes
- validation failures pass
- authorization passes
- tenant isolation passes
- edge cases pass
- error handling passes
- database integrity passes
- relevant integration tests pass
- relevant UI tests pass
- responsive behavior is verified
- accessibility is verified where applicable
- security tests are completed
- regression tests pass
- known defects are documented
- acceptance criteria are satisfied

---

# 35. Academic Data Integrity Gate

Before declaring the academic workflow complete, verify:

```text
Student Identity
        ↓
Academic Context
        ↓
Imported Result
        ↓
Validation
        ↓
Processing
        ↓
Authoritative Result
        ↓
Attempt History
        ↓
Backlog State
        ↓
SGPA / CGPA
        ↓
Academic Passport
        ↓
Analytics
        ↓
Student Portal
```

Every stage must remain consistent with the previous authoritative state.

No downstream read model should silently invent or contradict academic data.

---

# 36. AI-Assisted Testing Rules

AI-generated tests may be used to accelerate test development, but every generated test must be reviewed.

AI must not:

- invent university grading formulas
- assume unknown academic rules
- weaken security assertions
- remove tenant-isolation checks
- replace deterministic assertions with vague assertions
- ignore historical attempts
- treat missing values as zero
- approve academic calculations without defined rules
- generate tests that depend on unstable data
- hide failed tests
- mark tests as passing without execution

AI-generated tests must be validated against:

- feature specifications
- implementation notes
- project rules
- approved academic configuration
- API contracts
- database constraints

---

# 37. Test Review Checklist

Before approving a test suite, verify:

- [ ] Test cases have unique IDs
- [ ] Critical workflows are covered
- [ ] Negative cases are covered
- [ ] Authorization is tested
- [ ] Tenant isolation is tested
- [ ] IDOR is tested
- [ ] Result lifecycle is tested
- [ ] Duplicate processing is tested
- [ ] Historical attempts are tested
- [ ] Backlog lifecycle is tested
- [ ] Academic calculations are tested
- [ ] Analytics double-counting is tested
- [ ] Missing data behavior is tested
- [ ] File upload security is tested
- [ ] API errors are tested
- [ ] Database constraints are tested
- [ ] Responsive behavior is tested
- [ ] Accessibility is tested
- [ ] Performance is tested where required
- [ ] Concurrency is tested for critical mutations
- [ ] Auditability is tested
- [ ] End-to-end workflow is tested
- [ ] Release-blocking tests are identified

---

# 38. Acceptance Criteria

This document is considered complete when:

1. Major MVP features have concrete test cases.
2. Authentication and authorization have positive and negative cases.
3. Tenant isolation has explicit test coverage.
4. Result Import has file, parsing, identity, duplicate, and error cases.
5. Result Validation has deterministic validation cases.
6. Result Processing has transaction, idempotency, concurrency, and history cases.
7. Backlog lifecycle is explicitly tested.
8. Academic Passport correctness is tested.
9. Analytics correctness and double-counting prevention are tested.
10. Student Portal permissions are tested.
11. API and database behavior are covered.
12. Security testing is represented.
13. Accessibility and responsive behavior are represented.
14. Integration workflows are covered.
15. Release-blocking cases are identified.
16. AI-assisted testing rules are defined.

---

# 39. Unresolved Decisions

The following remain implementation-dependent and should be finalized before execution:

- exact authentication mechanism
- exact password policy
- exact rate-limiting thresholds
- exact file-size limits
- exact supported Excel/CSV formats
- exact academic calculation configuration
- exact warning-processing policy
- exact analytics performance targets
- exact load-test volumes
- exact browser support matrix
- exact accessibility compliance target
- exact retention period for import files
- exact audit-log retention
- exact background-job implementation
- exact production observability stack

These decisions must not be silently invented inside test cases.

---

# 40. Status

**Current Status:** Draft / Under Review

This document becomes **Approved** only after the test cases have been reviewed against the final implementation, API contracts, database schema, security configuration, and approved academic rules.

---

# 41. Final Principle

> **A test case is successful only when it proves that the system behaves correctly—not merely that the requested action completes.**

For Acadlytic, correctness means preserving the integrity of the academic data lifecycle:

```text
Identity
   ↓
Academic Context
   ↓
Import
   ↓
Validation
   ↓
Processing
   ↓
Authoritative Result
   ↓
Attempts
   ↓
Backlog
   ↓
Academic Calculations
   ↓
Academic Passport
   ↓
Analytics
   ↓
Student Portal
```

Every critical transition must be correct, secure, traceable, tenant-safe, and historically consistent.