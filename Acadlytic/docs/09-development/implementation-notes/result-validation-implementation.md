# Result Validation Implementation

**Document:** `09-development/implementation-notes/result-validation-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Result Validation  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for Result Validation in Acadlytic.

Result Validation is the quality-control boundary between normalized imported result data and authoritative academic result processing.

Its responsibility is to determine whether imported result records are:

- valid,
- invalid,
- warnings requiring review,
- or still pending validation.

The validation layer must prevent malformed, inconsistent, duplicated, or incorrectly matched result records from being processed into authoritative academic data.

---

# 2. Core Principle

Result Validation answers:

> **Can this normalized imported result record safely proceed to Result Processing?**

The implementation flow is:

```text
Imported Result Record
        ↓
Required Field Validation
        ↓
Student Validation
        ↓
Subject Validation
        ↓
Academic Context Validation
        ↓
Result Value Validation
        ↓
Duplicate Validation
        ↓
Business Rule Validation
        ↓
Validation Status
        ↓
Result Processing
```

---

# 3. Scope

MVP Result Validation covers:

- required-field validation
- student matching validation
- subject matching validation
- course validation
- semester validation
- academic-context validation
- result-value validation
- grade/result-status validation
- duplicate detection
- attempt validation
- warnings
- errors
- validation summary
- record-level validation details
- batch validation
- revalidation
- validation auditability
- tenant isolation
- Result Processing handoff

---

# 4. Out of Scope

Result Validation does not own:

- file upload
- Excel/CSV parsing
- source-file storage
- final academic result persistence
- backlog creation/update
- final CGPA calculation
- Academic Passport generation
- analytics
- predictive academic analysis
- AI-based academic interpretation
- university API synchronization
- unauthorized university result scraping
- advanced regulation/eligibility engine unless explicitly added later

---

# 5. Validation Ownership

Result Validation owns:

```text
Validation Status
Validation Errors
Validation Warnings
Validation Rules
Validation Summary
Validation Execution State
```

It does not own:

```text
Imported File
Student Identity
Academic Structure
Authoritative Processed Result
Backlog
Academic Passport
Analytics
```

---

# 6. Validation Boundary

The module sits between Result Import and Result Processing:

```text
Result Import
      ↓
Normalized Imported Record
      ↓
Result Validation
      ↓
Validated Record
      ↓
Result Processing
      ↓
Authoritative Academic Record
```

No authoritative result should bypass this boundary unless an explicitly approved system workflow requires it.

---

# 7. Validation Status

The approved record-level validation status model is:

```text
PENDING
VALID
INVALID
WARNING
```

These statuses must not be confused with the overall import-job processing status.

---

# 8. Meaning of Validation Status

## PENDING

Validation has not yet completed.

```text
PENDING
```

The record must not be processed as a valid academic result.

---

## VALID

The record passed all required validation rules.

```text
VALID
```

It may proceed to Result Processing according to the processing policy.

---

## INVALID

The record contains a blocking problem.

Examples:

- student cannot be identified
- subject cannot be identified
- required field missing
- invalid result value
- invalid academic context
- blocking duplicate

An invalid record must not be processed.

---

## WARNING

The record has a non-blocking issue requiring awareness or review.

Examples:

- source name differs from stored student name
- subject name differs while subject code matches
- non-critical source formatting discrepancy

Whether WARNING records may be processed must be explicitly controlled by Result Processing policy.

---

# 9. Validation Pipeline

The recommended validation pipeline is:

```text
Imported Record
      ↓
1. Required Fields
      ↓
2. Student
      ↓
3. Subject
      ↓
4. Academic Context
      ↓
5. Result Values
      ↓
6. Duplicate
      ↓
7. Business Rules
      ↓
8. Final Status
```

Validation should be deterministic.

---

# 10. Validation Execution

Validation may be initiated through:

```text
POST /api/v1/result-imports/{importId}/validate
```

The operation should validate all eligible records for the import.

For large imports, validation should execute asynchronously.

---

# 11. Validation Authorization

Only authorized users should be able to initiate validation.

Potential roles:

```text
COLLEGE_ADMIN
ACADEMIC_STAFF
```

The exact permission matrix must follow the approved authorization rules.

Students must not initiate official result validation.

---

# 12. Tenant Isolation

Validation must always operate inside the authenticated user's college tenant.

The backend must verify:

```text
Authenticated User
        ↓
College Tenant
        ↓
Import
        ↓
Imported Records
```

A user from College A must never validate or inspect College B records.

---

# 13. Import Ownership Verification

Before validation starts:

1. authenticate the user
2. authorize the operation
3. resolve trusted tenant context
4. load the import
5. verify the import belongs to that tenant
6. verify the import is in a valid state
7. start validation

Never trust a frontend-supplied college ID.

---

# 14. Valid Import States

Validation should only run when the import is in an appropriate state.

Typical flow:

```text
UPLOADED
   ↓
PARSING
   ↓
VALIDATING
```

If the import has already failed or been cancelled, validation should not start unless an explicit reprocessing workflow permits it.

---

# 15. Validation Job State

The overall import status may become:

```text
VALIDATING
```

while individual records maintain:

```text
PENDING
VALID
INVALID
WARNING
```

Example:

```text
Import Status:
VALIDATING

Record Status:
PENDING
VALID
INVALID
WARNING
```

---

# 16. Validation Summary

After validation, the system should provide a summary such as:

```text
Total Records
Valid
Invalid
Warnings
Pending
```

Where useful, additional categories may include:

```text
Unknown Students
Unknown Subjects
Duplicates
Missing Required Fields
Invalid Results
Academic Context Errors
```

---

# 17. Validation Summary API

Endpoint:

```text
GET /api/v1/result-imports/{importId}/validation-summary
```

The response should provide aggregated validation information.

It should not return every individual record.

---

# 18. Validation Records API

Endpoint:

```text
GET /api/v1/result-imports/{importId}/validation-records
```

The endpoint should support:

- pagination
- status filtering
- error-code filtering
- student filtering where authorized
- subject filtering where authorized

---

# 19. Validation Error Model

Each validation issue should have structured information.

Conceptually:

```json
{
  "code": "STUDENT_NOT_FOUND",
  "severity": "ERROR",
  "field": "registrationNumber",
  "rowNumber": 42,
  "message": "No matching student was found."
}
```

The exact response contract must follow the API architecture.

---

# 20. Validation Severity

At minimum:

```text
ERROR
WARNING
```

An error is blocking.

A warning is non-blocking unless the processing policy explicitly treats it as blocking.

---

# 21. Stable Error Codes

Validation errors should use stable machine-readable codes.

Examples:

```text
REQUIRED_FIELD_MISSING
STUDENT_NOT_FOUND
STUDENT_IDENTIFIER_INVALID
STUDENT_CONTEXT_MISMATCH
SUBJECT_NOT_FOUND
SUBJECT_CODE_INVALID
COURSE_NOT_FOUND
SEMESTER_NOT_FOUND
ACADEMIC_CONTEXT_INVALID
RESULT_VALUE_INVALID
GRADE_INVALID
CREDIT_VALUE_INVALID
DUPLICATE_RECORD
ATTEMPT_INVALID
```

The final catalog should be maintained centrally.

---

# 22. Required Field Validation

Check all mandatory normalized fields.

Examples:

```text
Student Identifier
Subject Code
Academic Context
Result Information
```

The exact mandatory fields depend on the approved normalized result model.

---

# 23. Missing vs Zero

The validation layer must preserve the distinction:

```text
NULL / missing
```

and:

```text
0
```

These must not be treated as equivalent.

For example:

```text
marks = null
```

is different from:

```text
marks = 0
```

---

# 24. Student Validation

The student must resolve to an existing student identity.

Primary identity:

```text
Official Student/Registration Identifier
```

Student name must not be the primary matching key.

---

# 25. Unknown Student

If no student matches:

```text
STUDENT_NOT_FOUND
```

The record should become:

```text
INVALID
```

unless a separately approved workflow defines another status.

Do not automatically create a student.

---

# 26. Student Name Mismatch

If registration number matches but name differs:

```text
Identifier → Match
Name → Mismatch
```

The result may become:

```text
WARNING
```

if the discrepancy is non-blocking.

The exact severity should be configurable/approved.

---

# 27. Student Context Validation

The matched student must belong to the expected academic context.

Examples:

```text
Student Course
        vs
Imported Course
```

or:

```text
Student College
        vs
Import College
```

A mismatch should be treated as a blocking error where it can cause incorrect academic attribution.

---

# 28. Cross-Tenant Student Protection

A student belonging to another college must never be matched into the current import.

This is both:

- a validation rule
- a security rule

The repository/service query must enforce tenant scope.

---

# 29. Subject Validation

The imported subject must resolve to the academic structure.

Primary identifier:

```text
Subject Code
```

Subject name is secondary evidence.

---

# 30. Unknown Subject

If no subject matches:

```text
SUBJECT_NOT_FOUND
```

The record should normally become:

```text
INVALID
```

The system must not silently create a new subject.

---

# 31. Subject Name Mismatch

Example:

```text
Subject Code → Match
Subject Name → Different
```

This may produce:

```text
WARNING
```

if the code is authoritative and the discrepancy is non-blocking.

The final severity must follow approved academic rules.

---

# 32. Course Validation

The subject must belong to the expected course/program.

Example:

```text
Imported Course
        ↓
Course
        ↓
Subject
```

A subject belonging to a different academic program must not be accepted silently.

---

# 33. Semester Validation

The semester must resolve to a valid semester for the student's course/program.

Example:

```text
Student
  ↓
Course
  ↓
Semester
```

An invalid semester relationship should produce a blocking validation error.

---

# 34. Academic Context Validation

The complete academic context should be internally consistent:

```text
College
  ↓
Course
  ↓
Semester
  ↓
Subject
```

The student must also belong to the appropriate college/course context.

---

# 35. Result Value Validation

Validate result values according to the normalized model.

Potential fields:

```text
Marks
Grade
Grade Point
Credits
Result Status
Attempt Type
```

Validation must distinguish between:

- numeric result values
- symbolic outcomes
- absent/fail indicators
- missing values

---

# 36. Marks Validation

Where marks are numeric, validate:

- numeric format
- allowed range
- decimal precision where applicable

Do not invent a universal maximum mark.

University-specific maximums must come from approved academic configuration.

---

# 37. Grade Validation

If a grade is supplied:

```text
A
B+
O
F
```

etc., validate it against the applicable grading configuration where available.

Do not hard-code one university's grade scale into generic validation logic.

---

# 38. Grade Point Validation

Grade points should be validated only when the academic configuration defines the applicable scale.

Do not assume:

```text
A = 8
```

or any other mapping without an approved rule.

---

# 39. Credit Validation

Where credits are supplied:

- validate numeric format
- validate non-negative values
- validate against subject configuration where applicable

Do not silently replace imported credits with configured credits without an explicit rule.

---

# 40. Result Status Validation

Possible source statuses may include:

```text
PASS
FAIL
ABSENT
WITHHELD
```

The actual supported values depend on the source/result model.

Normalization should occur before validation.

---

# 41. Absent Values

Values such as:

```text
AB
ABSENT
```

must not automatically become:

```text
marks = 0
```

unless the approved university-specific rule explicitly requires that representation.

---

# 42. Attempt Validation

Attempt information must remain explicit.

Possible values:

```text
REGULAR
SUPPLEMENTARY
REPEAT
IMPROVEMENT
```

The final allowed values must come from the academic result model.

Multiple attempts must not overwrite one another.

---

# 43. Duplicate Validation

Duplicate validation must identify whether the imported record represents an existing logical result.

Conceptual identity:

```text
University
+
Result Release
+
Student Identifier
+
Subject Code
+
Attempt
```

The final identity definition must align with Result Processing.

---

# 44. Duplicate Within Same Import

Example:

```text
Row 25
Student 123
Subject CS101

Row 78
Student 123
Subject CS101
```

If both represent the same attempt, the duplicate must be flagged.

---

# 45. Duplicate Against Existing Data

The validator should check relevant authoritative/history data where required.

It must not silently replace an existing result.

Potential result:

```text
DUPLICATE_RECORD
```

with:

```text
INVALID
```

or:

```text
WARNING
```

depending on the approved re-import policy.

---

# 46. Historical Attempts

A previous failed attempt and a later passed attempt are not necessarily duplicates.

Example:

```text
Attempt 1 → FAIL
Attempt 2 → PASS
```

Both may be valid historical records.

Validation must preserve attempt identity.

---

# 47. Revaluation/Improvement

If revaluation or improvement results are supported:

- preserve the source attempt/event
- do not blindly overwrite the original result
- apply approved result-processing rules

The exact academic model remains an unresolved implementation decision if not yet specified.

---

# 48. Business Rule Validation

Business rules may include:

- student belongs to course
- subject belongs to course
- semester belongs to course
- subject belongs to semester where modeled
- result attempt is valid
- required result information exists
- record is not a forbidden duplicate

Do not embed future regulation/eligibility logic into this module.

---

# 49. Regulation Boundary

The MVP validator must not become a complete university regulation engine.

Out of scope:

```text
Degree eligibility
Credit completion rules
Minimum CGPA for graduation
Backlog eligibility rules
Promotion rules
University-specific academic progression rules
```

These belong to future Regulation & Credit Eligibility Engine capabilities.

---

# 50. Validation Rule Ordering

Recommended order:

```text
1. Required Fields
2. Student Identity
3. Student Context
4. Subject Identity
5. Academic Context
6. Result Values
7. Attempt
8. Duplicate
9. Business Rules
```

This ordering reduces unnecessary downstream queries.

---

# 51. Fail-Fast vs Collect-All

Validation should generally collect all meaningful record-level errors rather than stopping at the first error.

Example:

```text
Row 42
- Student not found
- Subject code missing
```

The user should see both issues where technically safe.

However, dependent rules may be skipped when their required input is missing.

---

# 52. Validation Dependency

Example:

```text
Student not found
       ↓
Cannot validate student-course relationship
```

Do not produce misleading secondary errors.

---

# 53. Validation Engine

A rule-oriented design is recommended.

Conceptually:

```text
ValidationEngine
      ↓
ValidationRule[]
      ↓
ValidationResult
```

Each rule should have:

- rule identifier
- severity
- applicable condition
- validation logic
- error code
- message

---

# 54. Example Rule Structure

Conceptually:

```text
StudentExistsRule
SubjectExistsRule
AcademicContextRule
ResultValueRule
DuplicateRule
AttemptRule
```

The final class structure may differ based on backend architecture.

---

# 55. Deterministic Validation

For the same:

```text
Imported Record
+
Academic Configuration
+
Authoritative Data
```

the validator should produce the same result.

Avoid random or opaque validation behavior.

---

# 56. Validation Persistence

Validation results should be persisted so the system can:

- display them
- filter them
- audit them
- resume processing
- avoid unnecessary recalculation

The exact schema must follow database architecture.

---

# 57. Revalidation

Records may need to be revalidated when:

- student data is corrected
- academic structure is corrected
- import mapping is corrected
- source record is corrected

Revalidation must not silently modify authoritative results.

---

# 58. Revalidation API

A future or optional endpoint may be:

```text
POST /api/v1/result-imports/{importId}/validate
```

The same validation operation can be made idempotent where appropriate.

Avoid creating unnecessary duplicate endpoints.

---

# 59. Validation Idempotency

Running validation twice on the same unchanged import should not:

- duplicate records
- duplicate errors
- alter unrelated data
- create duplicate audit events unnecessarily

The final validation execution model should define whether previous validation results are replaced or versioned.

---

# 60. Batch Validation

Large imports should be validated in batches.

Benefits:

- predictable memory use
- shorter transactions
- scalable processing
- better recovery
- progress tracking

---

# 61. Transaction Boundaries

Avoid one transaction around the entire import.

Use bounded transactions for:

```text
Validation Batch
```

The validator should not lock large portions of the database unnecessarily.

---

# 62. Query Optimization

Validation can produce many database queries.

Avoid:

```text
for each row:
    query student
    query subject
    query course
```

This can produce an N+1 query pattern.

Prefer:

```text
Batch identifiers
      ↓
Batch database lookup
      ↓
In-memory matching
```

where appropriate.

---

# 63. Student Lookup Optimization

For a batch of records:

```text
Student IDs:
S001
S002
S003
...
```

fetch the required student identities efficiently.

The repository must still enforce tenant boundaries.

---

# 64. Subject Lookup Optimization

Similarly:

```text
Subject Codes:
CS101
CS102
CS103
...
```

may be resolved in batches.

Subject lookups must be scoped to the appropriate academic context.

---

# 65. Duplicate Query Optimization

Duplicate checks should avoid querying the database separately for every record where possible.

Batch identity keys can be prepared and checked efficiently.

---

# 66. Validation Performance

Performance targets should be established using representative university files.

Measure:

- records per second
- database queries
- memory usage
- CPU usage
- validation duration
- error aggregation cost

Do not define unrealistic performance numbers before benchmarking.

---

# 67. Validation Progress

For asynchronous validation, track progress where practical.

Example:

```text
Validated:
3,500 / 10,000
```

Progress should be informational and must not be treated as authoritative until the job completes.

---

# 68. Frontend Validation Route

The approved route is:

```text
/app/results/import/:importId/validation
```

This page is responsible for presenting validation results.

---

# 69. Validation Page

The page should contain:

```text
Import Summary
Validation Status
Validation Metrics
Filters
Validation Record Table
Errors
Warnings
Next Action
```

---

# 70. Validation Summary Cards

Possible cards:

```text
Total
Valid
Warnings
Invalid
Pending
```

Additional issue-specific metrics may be shown where useful.

---

# 71. Validation Record Table

Possible columns:

```text
Row
Student
Registration Number
Subject
Subject Code
Semester
Result
Status
Issue
```

Columns should remain focused on review.

---

# 72. Validation Filters

Useful filters include:

```text
Status
Error Code
Student
Subject
Attempt
```

The exact filter set should remain limited to useful operational needs.

---

# 73. Validation Detail

Selecting a record should show:

```text
Source Row
Normalized Values
Student Match
Subject Match
Academic Context
Validation Issues
Warnings
```

This helps staff understand why a record cannot proceed.

---

# 74. Error Presentation

User-facing messages should be understandable.

Bad:

```text
FK_9328_CONSTRAINT
```

Better:

```text
The subject code does not match any subject configured for this course.
```

The frontend may show both:

```text
Human message
Error code
```

where useful.

---

# 75. Warning Presentation

Warnings should be visually distinct from errors but not rely only on color.

Example:

```text
Warning
Student name differs from the imported result file.
```

---

# 76. Processing Gate

The frontend must not allow processing of records that are:

```text
INVALID
PENDING
```

unless an explicitly approved administrative workflow permits it.

Valid records may proceed.

WARNING records require an explicit policy.

---

# 77. Processing Button

The UI should communicate clearly:

```text
Process Valid Results
```

rather than:

```text
Process Everything
```

This reduces accidental processing of invalid records.

---

# 78. Server-Side Processing Gate

Even if the frontend hides an action, the backend must independently verify validation status.

Never rely on frontend state.

The processing endpoint must re-check:

```text
record validation status
tenant
authorization
processing state
```

---

# 79. Security

Result Validation must enforce:

- authentication
- role authorization
- tenant isolation
- IDOR protection
- secure error handling
- protected result data
- safe logging

---

# 80. IDOR Protection

This request:

```text
GET /api/v1/result-imports/123
```

must not succeed simply because the user knows `123`.

The backend must verify ownership through trusted tenant context.

---

# 81. Audit Events

Important events may include:

```text
RESULT_VALIDATION_STARTED
RESULT_VALIDATION_COMPLETED
RESULT_VALIDATION_FAILED
RESULT_RECORD_INVALIDATED
RESULT_RECORD_VALIDATED
```

The final audit taxonomy should remain consistent across modules.

---

# 82. Logging Rules

Do not log complete result records.

Safe logs may include:

```text
importId
collegeId
validation batch
record count
duration
error code
correlation ID
```

Sensitive student data must be minimized.

---

# 83. API Error Handling

Validation APIs should use standard application errors.

Examples:

```text
IMPORT_NOT_FOUND
IMPORT_NOT_READY
VALIDATION_ALREADY_RUNNING
FORBIDDEN
VALIDATION_FAILED
```

The exact error catalog should remain centralized.

---

# 84. Frontend State Management

Use TanStack Query for:

- validation summary
- validation records
- validation status
- validation mutation

Avoid copying server validation data into global Zustand state unless there is a demonstrated client-state requirement.

---

# 85. Loading States

The validation UI should distinguish:

```text
Loading Import
Running Validation
Loading Records
Filtering Records
Refreshing Status
```

Do not show a generic spinner for every state.

---

# 86. Empty States

Examples:

### No validation issues

```text
All imported records passed validation.
```

### No matching filter results

```text
No validation records match the selected filters.
```

### No records

```text
This import contains no result records.
```

---

# 87. Accessibility

Validation UI must support:

- keyboard navigation
- accessible table headers
- semantic status information
- visible focus
- accessible error messages
- screen-reader-friendly alerts
- non-color-only status indicators
- responsive review interface

---

# 88. Validation Tests

Unit tests should cover individual validation rules.

Examples:

```text
RequiredFieldRuleTest
StudentExistsRuleTest
SubjectExistsRuleTest
AcademicContextRuleTest
ResultValueRuleTest
DuplicateRuleTest
AttemptRuleTest
```

---

# 89. Integration Tests

Test:

```text
Import → Validation
```

with realistic database data.

Verify:

- correct status
- correct errors
- correct warnings
- tenant isolation
- database persistence

---

# 90. Security Tests

Test:

```text
Unauthorized validation
Cross-tenant import validation
Cross-tenant student matching
Cross-tenant subject matching
IDOR
Forbidden roles
```

---

# 91. Validation Fixture Data

Create representative test fixtures covering:

```text
Valid result
Missing student
Unknown student
Student name mismatch
Unknown subject
Subject name mismatch
Invalid semester
Invalid course
Invalid marks
Invalid grade
Missing result
Duplicate row
Historical duplicate
Multiple attempts
```

---

# 92. Large Import Tests

Test representative large files to verify:

- memory usage
- validation throughput
- batch behavior
- progress
- database performance
- transaction boundaries
- failure recovery

---

# 93. End-to-End Workflow

The complete validation workflow should verify:

```text
Result File
    ↓
Result Import
    ↓
Normalized Records
    ↓
Validation Started
    ↓
Validation Rules
    ↓
Record Statuses
    ↓
Validation Summary
    ↓
Review
    ↓
Process Valid Records
```

---

# 94. Acceptance Criteria

Result Validation is acceptable when:

### Validation Execution

- [ ] Authorized users can start validation.
- [ ] Validation operates within the correct college tenant.
- [ ] Import state is checked before validation.
- [ ] Validation status is tracked.

### Record Validation

- [ ] Required fields are checked.
- [ ] Students are validated.
- [ ] Subjects are validated.
- [ ] Academic context is validated.
- [ ] Result values are validated.
- [ ] Attempts are validated.
- [ ] Duplicates are detected.
- [ ] Errors and warnings are persisted.

### Workflow

- [ ] Validation summary is available.
- [ ] Validation records are pageable.
- [ ] Records can be filtered.
- [ ] Validation results are reviewable.
- [ ] Invalid records cannot enter normal processing.
- [ ] Warning policy is enforced.
- [ ] Processing performs server-side validation checks.

### Security

- [ ] Tenant isolation passes.
- [ ] IDOR tests pass.
- [ ] Unauthorized users are rejected.
- [ ] Sensitive data is not logged.

### Performance

- [ ] Batch validation works.
- [ ] N+1 query problems are avoided.
- [ ] Large import testing is completed.

---

# 95. Definition of Done

Result Validation is implemented when:

1. Validation API is implemented.
2. Validation status lifecycle works.
3. Required-field validation works.
4. Student validation works.
5. Subject validation works.
6. Academic context validation works.
7. Result-value validation works.
8. Attempt validation works.
9. Duplicate validation works.
10. Error/warning persistence works.
11. Validation summary works.
12. Validation records API works.
13. Pagination works.
14. Filtering works.
15. Tenant isolation passes.
16. IDOR protection passes.
17. Background validation works where required.
18. Batch processing is implemented.
19. Unit tests pass.
20. Integration tests pass.
21. Security tests pass.
22. Large-file tests pass.
23. Frontend validation page works.
24. Processing gate is enforced.
25. Auditability is implemented.
26. Documentation is reviewed.
27. No critical data-integrity issue remains.

---

# 96. Unresolved Implementation Decisions

The following require review:

- exact validation rule catalog
- exact severity for student name mismatch
- exact severity for subject name mismatch
- warning processing policy
- duplicate re-import policy
- revaluation/improvement handling
- exact attempt model
- university-specific result-status configuration
- grade configuration source
- marks-range configuration
- validation batch size
- background job technology
- validation progress representation
- validation-result versioning
- revalidation policy after source-data changes
- exact audit-event catalog

---

# 97. Relationship With Other Documents

This document depends on:

```text
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/database-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md

06-design/navigation.md
06-design/page-specifications.md
06-design/responsive-design.md

07-project-rules/coding-rules.md
07-project-rules/frontend-rules.md
07-project-rules/backend-rules.md
07-project-rules/database-rules.md
07-project-rules/security-rules.md
07-project-rules/ai-coding-rules.md

09-development/feature-specifications/result-import.md
09-development/feature-specifications/result-validation.md
09-development/feature-specifications/result-processing.md

09-development/implementation-notes/result-import-implementation.md
09-development/implementation-notes/backend-foundation.md
```

It provides the implementation foundation for:

```text
result-processing-implementation.md
backlog-implementation.md
academic-passport-implementation.md
analytics-implementation.md
student-portal-implementation.md
```

---

# 98. AI-Assisted Development Rules

AI coding assistants implementing Result Validation must:

- read the Result Validation feature specification first
- read Result Import and Result Processing specifications
- preserve the Import/Validation/Processing boundaries
- never silently create students
- never silently create subjects
- never use student name as the primary identity
- never use subject name as the primary identity
- preserve multiple attempts
- distinguish missing values from zero
- never invent university-specific grading rules
- never invent marks ranges
- never convert absent into zero without an approved rule
- enforce tenant isolation
- perform server-side validation
- prevent invalid records from bypassing processing gates
- avoid N+1 queries
- use batch validation where appropriate
- write tests for malformed and conflicting records
- preserve stable error codes
- never hide unresolved academic rules by guessing

---

# 99. Review Checklist

Before moving this document to `Approved`:

```text
□ Validation boundary is clear
□ Import boundary is clear
□ Processing boundary is clear
□ Status model is defined
□ Error/warning model is defined
□ Required fields are defined
□ Student validation is defined
□ Subject validation is defined
□ Academic context validation is defined
□ Result-value validation is defined
□ Attempt handling is defined
□ Duplicate handling is defined
□ Warning policy is identified
□ Tenant isolation is explicit
□ IDOR protection is explicit
□ Batch validation is defined
□ Performance strategy is defined
□ Frontend review workflow is defined
□ Testing strategy is defined
□ Unresolved decisions are documented
```

---

# 100. Status

**Draft / Under Review**

This document is not yet implementation-approved.

Lifecycle:

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

---

# 101. Final Result Validation Principle

> **Validate before trusting; preserve evidence before transforming; never allow invalid academic data to become authoritative data.**

The intended boundary is:

```text
Imported Data
      ↓
Normalize
      ↓
Validate
      ↓
Review
      ↓
Process
      ↓
Authoritative Academic Record
```

Result Validation protects the integrity of the entire Acadlytic academic-data pipeline.