# Bug Tracking

## Bug Severity
### Critical
Security breach, tenant data exposure, data corruption, or complete production outage.

### High
Core academic workflow unusable or incorrect.

### Medium
Important functionality impaired but workaround exists.

### Low
Minor UI/UX or non-critical defect.

## Bug Record
- ID
- Title
- Environment
- Steps to reproduce
- Expected result
- Actual result
- Severity
- Evidence
- Root cause
- Fix
- Regression test
- Status

## Rule
Any academic-data bug should include a regression test when technically practical.


# Acadlytic — Bug Tracking

**Document:** `10-testing/bug-tracking.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Type:** Bug Tracking & Defect Management Specification  
**Status:** Draft / Under Review  
**Related Documents:**
- `10-testing/test-strategy.md`
- `10-testing/test-cases.md`
- `07-project-rules/coding-rules.md`
- `07-project-rules/security-rules.md`
- `07-project-rules/backend-rules.md`
- `07-project-rules/frontend-rules.md`
- `07-project-rules/database-rules.md`
- `09-development/feature-specifications/`
- `09-development/implementation-notes/`

---

# 1. Purpose

This document defines the defect-management process for Acadlytic.

The objective is to ensure that every discovered defect is:

- clearly documented
- reproducible
- classified correctly
- prioritized according to impact
- assigned to an appropriate owner
- fixed without introducing regressions
- independently verified where required
- tracked through closure
- included in regression testing when appropriate

Bug tracking is especially important for Acadlytic because incorrect behavior can affect academic records, backlog status, SGPA/CGPA, analytics, tenant isolation, and student information.

A visually minor defect may therefore have significantly greater business impact if it affects academic data or security.

---

# 2. Scope

This process applies to defects found in:

- frontend
- backend
- REST APIs
- database
- authentication
- authorization
- tenant isolation
- academic structure
- student management
- result import
- result validation
- result processing
- academic calculations
- backlog tracking
- Academic Passport
- analytics
- Student Portal
- file processing
- background jobs
- integrations
- deployment
- accessibility
- responsive behavior
- performance
- security
- observability

It applies throughout:

```text
Development
    ↓
Local Testing
    ↓
Integration Testing
    ↓
QA
    ↓
Preview
    ↓
Production
```

---

# 3. What Is a Bug?

A bug is behavior that does not conform to an approved requirement, specification, acceptance criterion, security rule, API contract, academic rule, or expected system behavior.

Examples:

- a student can view another college's student
- a failed result does not create the expected backlog
- a passed supplementary attempt fails to resolve a backlog
- the same result is processed twice
- SGPA is calculated incorrectly
- analytics double-count attempts
- an unauthorized user can call an admin API
- an uploaded result file creates incorrect records
- a required validation error is not detected
- a mobile page becomes unusable

---

# 4. Bug vs Change Request

Not every unexpected behavior is a bug.

## 4.1 Bug

The implementation does not satisfy an already-approved requirement.

Example:

> Requirement says only SUPER_ADMIN can create a college, but COLLEGE_ADMIN can create one.

This is a bug.

## 4.2 Change Request

The requested behavior was never part of the approved scope.

Example:

> Add a feature allowing students to download a public academic certificate.

If this feature was not specified, it is a change request rather than a bug.

## 4.3 Unresolved Requirement

If the specification itself is ambiguous, the issue should not immediately be implemented as a bug fix.

Instead:

```text
Ambiguous Requirement
        ↓
Clarification
        ↓
Decision
        ↓
Specification Update
        ↓
Implementation
```

---

# 5. Bug Lifecycle

The standard lifecycle is:

```text
NEW
 ↓
TRIAGED
 ↓
ASSIGNED
 ↓
IN PROGRESS
 ↓
FIX READY
 ↓
IN QA
 ↓
VERIFIED
 ↓
CLOSED
```

Alternative states:

```text
NEW
 ↓
TRIAGED
 ↓
DUPLICATE
REJECTED
WONT_FIX
CANNOT_REPRODUCE
DEFERRED
BLOCKED
```

---

# 6. Bug Status Definitions

## NEW

A defect has been reported but has not yet been reviewed.

## TRIAGED

The defect has been reviewed and classified.

## ASSIGNED

The defect has an owner.

## IN PROGRESS

Development work has started.

## FIX READY

The developer believes the fix is complete and ready for verification.

## IN QA

QA/testing is actively verifying the fix.

## VERIFIED

The original defect has been successfully reproduced as fixed and relevant regression checks pass.

## CLOSED

The issue is fully resolved and no further action is required.

## REOPENED

The issue was previously marked resolved but the defect still exists or has returned.

## BLOCKED

Progress cannot continue because of a dependency or unresolved issue.

## DEFERRED

The issue is valid but intentionally postponed.

## DUPLICATE

The same defect is already tracked by another issue.

## REJECTED

The reported behavior is not considered a defect based on approved requirements.

## WONT_FIX

The defect is acknowledged but will not be fixed due to an approved product or technical decision.

## CANNOT_REPRODUCE

The defect cannot currently be reproduced using the available information or environment.

---

# 7. Bug Report Requirements

Every meaningful bug should contain enough information for another developer or tester to reproduce it.

Minimum information:

```text
Bug ID
Title
Module
Environment
Build/Version
Severity
Priority
Reporter
Date
Preconditions
Steps to Reproduce
Expected Result
Actual Result
Evidence
Reproducibility
Related Test Case
Related Feature
```

---

# 8. Bug Title Convention

Bug titles should be concise and descriptive.

Recommended format:

```text
[Module] — [Observed Problem]
```

Examples:

```text
[Result Processing] — Duplicate processing creates multiple result records

[Backlog] — Passing supplementary result does not resolve backlog

[Analytics] — Student count is double-counted for repeated attempts

[Authorization] — College Admin can access another college's student

[Import] — Unknown student is automatically created
```

Avoid titles such as:

```text
Not working
Bug
Issue
Error
Something wrong
```

---

# 9. Bug Report Template

Use the following structure:

```text
Bug ID:
Title:
Module:
Feature:
Environment:
Build/Version:
Severity:
Priority:
Reporter:
Date:

Preconditions:
-

Steps to Reproduce:
1.
2.
3.

Expected Result:
-

Actual Result:
-

Reproducibility:
Always / Intermittent / Rare

Test Case:
-

Evidence:
Screenshot / Video / Logs / API Response

Impact:
-

Related Issue:
-

Additional Notes:
-
```

---

# 10. Severity Classification

Severity represents the technical or business impact of the defect.

## S1 — Critical

A defect that causes severe security, academic-data, system-integrity, or availability problems.

Examples:

- cross-tenant academic data exposure
- authentication bypass
- privilege escalation
- incorrect authoritative academic records
- duplicate processing corrupting academic history
- incorrect SGPA/CGPA affecting authoritative records
- irreversible data corruption
- production-wide inability to process results

**Expected handling:** Immediate investigation.

---

## S2 — High

A major defect that significantly affects a core workflow but does not necessarily corrupt the entire system.

Examples:

- result validation allows materially invalid data through
- backlog resolution is incorrect
- Academic Passport shows materially incorrect academic information
- critical API workflow fails
- major Student Portal functionality is unavailable
- important analytics are materially incorrect

**Expected handling:** High-priority fix.

---

## S3 — Medium

A defect affecting a meaningful workflow with a workaround or limited scope.

Examples:

- incorrect filtering
- non-critical API validation issue
- minor calculation display issue where authoritative data remains correct
- secondary workflow failure
- moderate UI usability issue

**Expected handling:** Planned fix.

---

## S4 — Low

A minor issue with limited impact.

Examples:

- minor spacing issue
- typography inconsistency
- non-critical visual alignment
- minor copy issue

**Expected handling:** Fix during normal maintenance.

---

# 11. Priority Classification

Severity and priority are separate.

Severity describes **impact**.

Priority describes **when the issue should be fixed**.

## P0 — Immediate

Used for:

- security breach
- data corruption
- cross-tenant exposure
- authentication bypass
- production academic-data corruption

---

## P1 — Release Blocking

Must be resolved before the affected release.

Examples:

- result processing failure
- incorrect academic calculation
- major tenant-isolation defect
- critical backlog lifecycle defect

---

## P2 — High

Should be fixed in the current development cycle where practical.

---

## P3 — Normal

Planned for a future development cycle.

---

## P4 — Low

Can be addressed during maintenance or UI cleanup.

---

# 12. Severity vs Priority

Severity and priority should not be automatically treated as identical.

Example:

| Bug | Severity | Priority |
|---|---|---|
| Cross-tenant data exposure | Critical | P0 |
| Incorrect CGPA in authoritative record | Critical | P0/P1 |
| Result processing unavailable | High/Critical | P1 |
| Analytics filter incorrect | Medium | P2 |
| Button alignment issue | Low | P4 |

A low-severity defect may still have high priority if it affects an important release milestone.

---

# 13. Academic Data Defects

Academic data defects require special handling.

Examples:

- wrong result
- wrong attempt
- wrong backlog
- wrong SGPA
- wrong CGPA
- wrong credit total
- wrong semester association
- incorrect subject mapping
- duplicate academic result
- incorrect historical attempt

These defects must be treated as higher risk than ordinary UI defects.

Before fixing an academic-data defect:

1. identify affected records
2. identify the source of the incorrect state
3. determine whether authoritative data was modified
4. determine whether derived data was affected
5. determine whether other students are affected
6. determine whether tenant boundaries are affected
7. identify required correction strategy
8. verify historical integrity
9. add regression coverage

---

# 14. Security Defects

Security defects must be escalated immediately.

Examples:

- authentication bypass
- authorization bypass
- IDOR
- tenant isolation failure
- privilege escalation
- sensitive data exposure
- SQL injection
- stored XSS
- unsafe file upload
- credential leakage

Security defects should not be discussed in public issue trackers containing sensitive exploit details.

The issue should contain only the information required for controlled remediation.

---

# 15. Tenant Isolation Defects

Any defect that allows one college to access another college's data is critical.

Examples:

```text
College A
   ↓
GET Student B
   ↓
College B data returned
```

or:

```text
College A
   ↓
Analytics request
   ↓
College B metrics included
```

or:

```text
College A
   ↓
Result Import ID belonging to College B
   ↓
Import data returned
```

These defects must be:

- immediately escalated
- fixed before release
- covered by regression tests
- reviewed for similar endpoints
- reviewed for similar resources

Fixing only the reported endpoint is insufficient if the same authorization pattern exists elsewhere.

---

# 16. Bug Reproduction

A bug should be reproduced before implementation begins whenever possible.

The tester should determine:

- whether the bug is deterministic
- whether it occurs in frontend, backend, database, or integration
- whether it is environment-specific
- whether it is user/role-specific
- whether it is tenant-specific
- whether it is data-specific
- whether it occurs under concurrency
- whether it depends on a particular browser/device

---

# 17. Reproducibility

Use:

```text
Always
Intermittent
Rare
Unable to Reproduce
```

For intermittent defects, record:

- approximate frequency
- environment
- timing
- user role
- data conditions
- request sequence
- relevant logs

---

# 18. Root Cause Classification

After investigation, defects should be classified by root cause.

Possible categories:

```text
Requirement
Design
Frontend
Backend
Database
Security
Academic Rule
Integration
Concurrency
Performance
Configuration
Deployment
Infrastructure
Test Data
Third Party
Documentation
```

Example:

```text
Bug:
CGPA is incorrect.

Root Cause:
Academic calculation configuration was incorrectly implemented.
```

Another:

```text
Bug:
College A can access College B student.

Root Cause:
Repository query did not apply tenant context.
```

---

# 19. Root Cause Analysis

For significant defects, perform root cause analysis.

Recommended structure:

```text
Problem
   ↓
Immediate Cause
   ↓
Underlying Cause
   ↓
Why Was It Not Detected?
   ↓
Corrective Action
   ↓
Preventive Action
```

Example:

```text
Problem:
Duplicate result records were created.

Immediate Cause:
Processing request was executed twice.

Underlying Cause:
Idempotency protection was incomplete.

Detection Gap:
Concurrency test was missing.

Corrective Action:
Add processing idempotency protection.

Preventive Action:
Add concurrent-processing regression test.
```

---

# 20. Fix Requirements

A fix should not simply make the visible symptom disappear.

The developer must verify:

- root cause is addressed
- affected data remains correct
- existing behavior is preserved
- authorization remains intact
- tenant isolation remains intact
- database constraints remain valid
- API contract remains compatible
- frontend state remains consistent
- relevant regression tests are added or updated

---

# 21. Regression Requirement

Every significant defect should result in regression coverage.

For example:

### Original Bug

A supplementary pass does not resolve a backlog.

### Required regression coverage

```text
Failed attempt
      ↓
Backlog OPEN
      ↓
Supplementary FAIL
      ↓
Backlog OPEN
      ↓
Supplementary PASS
      ↓
Backlog RESOLVED
```

The regression test should prevent the same defect from returning.

---

# 22. Bug Verification

QA should verify:

1. original reproduction steps
2. expected behavior
3. relevant edge cases
4. related workflows
5. regression tests
6. security implications where applicable

A bug should not be closed merely because the developer says it is fixed.

---

# 23. Reopened Bug

A bug should be reopened if:

- original behavior still occurs
- fix works only under one condition
- regression reveals the same problem
- fix introduced another equivalent failure
- data remains incorrect
- security boundary remains bypassable

A reopened issue should include:

```text
Reproduction after fix
Environment
Build/version
Actual behavior
Expected behavior
Evidence
```

---

# 24. Duplicate Bug Handling

When two reports describe the same root issue:

1. keep the earliest or primary issue
2. mark the other as `DUPLICATE`
3. reference the primary bug
4. preserve relevant evidence from the duplicate report

Do not delete useful defect information.

---

# 25. Cannot Reproduce

If a bug cannot be reproduced:

1. verify environment
2. verify test data
3. verify build/version
4. inspect logs
5. inspect network/API behavior
6. attempt reproduction again
7. request additional evidence if needed

Do not immediately classify a legitimate report as invalid simply because it cannot be reproduced once.

---

# 26. Deferred Bugs

A valid defect may be deferred when:

- impact is low
- workaround exists
- affected functionality is not part of current release
- fix requires larger architectural work
- release timing does not justify immediate remediation

Deferred bugs must still contain:

- reason for deferral
- severity
- priority
- affected feature
- proposed future milestone

---

# 27. Bug Triage Process

Bug triage should follow:

```text
Bug Report
    ↓
Validate Report
    ↓
Reproduce
    ↓
Classify
    ↓
Determine Severity
    ↓
Determine Priority
    ↓
Identify Owner
    ↓
Schedule Fix
```

---

# 28. Triage Checklist

For each new defect:

- [ ] Is it reproducible?
- [ ] Is it actually a bug?
- [ ] What requirement is violated?
- [ ] What module is affected?
- [ ] Does it affect academic data?
- [ ] Does it affect security?
- [ ] Does it affect tenant isolation?
- [ ] Is production affected?
- [ ] How many users are affected?
- [ ] Is data corruption possible?
- [ ] Is there a workaround?
- [ ] Is regression coverage required?
- [ ] Does it block release?

---

# 29. Ownership

Possible ownership areas:

| Area | Typical Owner |
|---|---|
| React UI | Frontend |
| API/controller | Backend |
| Business logic | Backend/domain |
| Database/schema | Backend/database |
| Academic calculations | Backend/domain + academic review |
| Authentication | Backend/security |
| Authorization | Backend/security |
| Tenant isolation | Backend/security |
| Import parser | Backend/integration |
| Analytics | Backend/analytics |
| Accessibility | Frontend/QA |
| Responsive UI | Frontend/QA |
| Deployment | Infrastructure |
| Documentation | Responsible feature owner |

Ownership does not remove cross-team review requirements.

---

# 30. Bug Fix Workflow

Recommended workflow:

```text
Bug Identified
      ↓
Bug Reported
      ↓
Triage
      ↓
Assigned
      ↓
Root Cause Investigation
      ↓
Fix Implemented
      ↓
Unit/Component Tests
      ↓
Integration Tests
      ↓
QA Verification
      ↓
Regression
      ↓
Verified
      ↓
Closed
```

---

# 31. Development Branching

Bug fixes should use an identifiable branch or equivalent workflow.

Example:

```text
fix/result-processing-duplicate-records
fix/backlog-resolution
fix/tenant-isolation-student-api
fix/analytics-double-count
```

The branch should reference the corresponding bug ID when the repository workflow supports it.

---

# 32. Commit Convention

Bug-fix commits should clearly identify the defect.

Example:

```text
fix: prevent duplicate result processing
fix: enforce tenant filter on student lookup
fix: correct backlog resolution on supplementary pass
fix: prevent analytics attempt double-counting
```

Avoid vague commits:

```text
fix bug
changes
update
minor fix
```

---

# 33. Pull Request Requirements for Bug Fixes

A bug-fix PR should include:

```text
Bug ID
Problem
Root Cause
Solution
Tests Added/Updated
Regression Coverage
Security Impact
Database Impact
API Impact
```

For academic-data defects, additionally include:

```text
Affected Data
Historical Data Impact
Correction Strategy
Calculation Impact
Backlog Impact
Passport Impact
Analytics Impact
```

---

# 34. Production Bug Handling

Production defects require additional controls.

## Step 1 — Detect

Sources may include:

- monitoring
- logs
- support reports
- QA
- user reports
- automated tests

## Step 2 — Assess

Determine:

- severity
- scope
- affected tenants
- affected students
- security implications
- data integrity impact

## Step 3 — Contain

Where appropriate:

- disable affected feature
- block unsafe operation
- restrict access
- pause processing
- prevent additional corruption

## Step 4 — Fix

Implement and verify the fix.

## Step 5 — Recover

Correct affected data where required.

## Step 6 — Verify

Perform targeted and regression testing.

## Step 7 — Document

Record root cause and preventive action.

---

# 35. Production Academic Data Incident

If incorrect academic data reaches production:

```text
Incorrect Data Detected
        ↓
Stop Further Corruption
        ↓
Identify Affected Records
        ↓
Identify Root Cause
        ↓
Preserve Evidence
        ↓
Correct Authoritative Data Safely
        ↓
Rebuild/Refresh Derived Views
        ↓
Verify Passport
        ↓
Verify Analytics
        ↓
Verify Student Portal
        ↓
Regression Test
        ↓
Close Incident
```

Corrections must preserve legitimate historical attempts and auditability.

Do not simply overwrite historical data to make the current display appear correct.

---

# 36. Bug Data Correction Rules

When a defect has corrupted academic data:

- do not manually edit production rows without an approved correction procedure
- preserve original evidence where required
- identify affected records
- use controlled migration/correction scripts
- make corrections auditable
- verify database constraints
- verify dependent read models
- verify analytics
- verify student-facing views
- perform post-correction reconciliation

---

# 37. Bug Tracking Metrics

Useful metrics include:

### Defect Count

Number of reported defects.

### Open Defects

Number of unresolved defects.

### Critical Defects

Number of S1 defects.

### Defect Resolution Time

Time between:

```text
Reported → Verified
```

### Reopen Rate

Percentage of defects reopened after attempted resolution.

### Escape Rate

Defects discovered after release.

### Regression Rate

Defects that return after being fixed.

### Module Defect Density

Defects relative to module size or feature scope.

---

# 38. Release Bug Threshold

A release should not proceed when unresolved defects include:

- critical security vulnerabilities
- tenant-isolation failures
- authentication bypass
- privilege escalation
- authoritative academic-data corruption
- incorrect academic calculations
- unrecoverable result-processing corruption
- critical database integrity problems

High-severity defects require explicit release approval if they remain unresolved.

---

# 39. Bug Acceptance Criteria

A bug fix is considered acceptable when:

1. Original reproduction steps no longer reproduce the defect.
2. Expected behavior is achieved.
3. Root cause is addressed.
4. Relevant unit/component tests pass.
5. Relevant integration tests pass.
6. Regression tests pass.
7. Security impact is reviewed where applicable.
8. Tenant isolation is verified where applicable.
9. Academic data integrity is verified where applicable.
10. No unacceptable new defect is introduced.

---

# 40. Bug Closure Checklist

Before closing:

- [ ] Original bug reproduced before fix
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Unit tests updated
- [ ] Integration tests updated
- [ ] Regression test added where required
- [ ] QA verification completed
- [ ] Security implications reviewed
- [ ] Academic data implications reviewed
- [ ] Tenant isolation reviewed
- [ ] Database impact reviewed
- [ ] API impact reviewed
- [ ] Documentation updated if necessary
- [ ] Evidence attached
- [ ] Release/build recorded

---

# 41. Example Bug Reports

## Example 1 — Tenant Isolation

```text
Bug ID:
BUG-SEC-001

Title:
[Authorization] — College Admin can access another college's student

Module:
Student Management

Severity:
S1 — Critical

Priority:
P0

Steps:
1. Login as College Admin A.
2. Obtain Student B's ID.
3. Call GET /api/v1/students/{studentBId}.

Expected:
Request is rejected.

Actual:
Student B's data is returned.

Impact:
Cross-tenant data exposure.

Required Action:
Immediately block unauthorized access and review similar endpoints.
```

---

## Example 2 — Academic Data

```text
Bug ID:
BUG-RESULT-001

Title:
[Result Processing] — Reprocessing creates duplicate result records

Severity:
S1 — Critical

Priority:
P0

Steps:
1. Upload valid result.
2. Validate result.
3. Process result.
4. Process same import again.

Expected:
Second operation is idempotent.

Actual:
Second operation creates duplicate authoritative records.

Impact:
Academic history and analytics become incorrect.

Required Action:
Fix idempotency and add concurrency regression tests.
```

---

## Example 3 — UI

```text
Bug ID:
BUG-UI-001

Title:
[Student Portal] — Results table overflows mobile viewport

Severity:
S4 — Low

Priority:
P4

Steps:
1. Open Student Results.
2. Set viewport to 320px.
3. View results table.

Expected:
Table remains usable without unintended page overflow.

Actual:
Page content extends beyond viewport.

Required Action:
Fix responsive table behavior.
```

---

# 42. AI-Assisted Bug Tracking Rules

AI may assist with:

- bug summarization
- reproduction-step formatting
- duplicate detection
- test-case suggestions
- root-cause hypotheses
- regression-test suggestions
- issue categorization

AI must not:

- declare a bug fixed without test evidence
- downgrade security severity
- ignore tenant-isolation problems
- invent academic rules
- invent reproduction results
- fabricate logs
- fabricate test execution
- mark tests as passed without execution
- recommend deleting historical academic data merely to fix a display issue

AI-generated root-cause analysis is a hypothesis until verified by the development/testing team.

---

# 43. Bug Review Checklist

Before approving a bug resolution process, verify:

- [ ] Lifecycle is defined
- [ ] Severity is defined
- [ ] Priority is defined
- [ ] Reproduction process is defined
- [ ] Root-cause process is defined
- [ ] Academic-data handling is defined
- [ ] Security handling is defined
- [ ] Tenant-isolation handling is defined
- [ ] Production incident process is defined
- [ ] Regression requirements are defined
- [ ] Closure criteria are defined
- [ ] Reopen criteria are defined
- [ ] AI-assisted bug handling is controlled

---

# 44. Relationship with Test Cases

Bug tracking and test cases are connected:

```text
Test Case
    ↓
Execution
    ↓
Failure
    ↓
Bug
    ↓
Fix
    ↓
Regression Test
    ↓
Verification
    ↓
Closure
```

A defect discovered through testing should reference the relevant test case whenever possible.

A significant defect should normally result in a permanent regression test.

---

# 45. Relationship with Release Management

Bug status directly affects release readiness.

```text
Open Critical Bug
       ↓
Release Blocked

Open High Bug
       ↓
Release Review Required

Open Medium Bug
       ↓
Evaluate Risk

Open Low Bug
       ↓
May Be Deferred
```

The final decision must consider:

- severity
- affected users
- security
- academic data
- workaround
- release scope
- risk of introducing the fix
- production impact

---

# 46. Unresolved Decisions

The following should be finalized during project implementation:

- exact issue-tracking platform
- bug ID format if an external tracker is adopted
- team ownership model
- SLA for each severity
- production incident escalation process
- security vulnerability reporting workflow
- production data correction approval process
- release sign-off authority
- defect dashboard/metrics tooling
- automated issue creation from CI/CD
- integration between commits, pull requests, and bug records

These decisions should not be silently invented inside implementation code.

---

# 47. Definition of Done

The bug-tracking process is considered implemented when:

- defects have a standardized reporting format
- lifecycle states are defined
- severity and priority are defined
- security defects have escalation rules
- academic-data defects have special handling
- tenant-isolation defects are release-blocking
- root-cause analysis is defined
- regression requirements are defined
- production defects have a controlled process
- bug closure requires verification
- reopened defects are handled
- release thresholds are defined
- AI-assisted bug management has explicit controls

---

# 48. Status

**Current Status:** Draft / Under Review

This document becomes **Approved** after review against the actual development workflow, issue-tracking tooling, CI/CD process, security process, and production incident procedures.

---

# 49. Final Principle

> **A bug is not truly resolved when the visible symptom disappears. It is resolved when the underlying cause is addressed, the expected behavior is verified, affected data remains correct, and the defect is unlikely to return.**

For Acadlytic, defect management must give special priority to:

```text
Security
   ↓
Tenant Isolation
   ↓
Academic Data Integrity
   ↓
Historical Accuracy
   ↓
Calculation Correctness
   ↓
Workflow Reliability
   ↓
User Experience
```

The objective is not to achieve zero reported bugs.

The objective is to ensure that no unresolved defect can silently compromise the correctness, security, or trustworthiness of Acadlytic.