# Result Validation

**Project:** Acadlytic  
**Module:** Result Validation  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

# 1. Purpose

The Result Validation module validates normalized result records produced by the Result Import module before those records are committed to the student's academic record.

The module ensures that imported result data is:

- structurally valid
- academically valid
- associated with the correct student
- associated with the correct subject
- compatible with the configured academic structure
- valid according to the available result rules
- free from duplicate records
- suitable for result processing

The module must identify invalid records without silently modifying or inventing academic data.

---

# 2. Scope

## 2.1 MVP Scope

The MVP includes:

- imported record validation
- required-field validation
- student validation
- subject validation
- course validation
- semester validation
- academic year validation
- academic structure validation
- marks validation
- grade validation
- result-status validation
- duplicate validation
- attempt validation where available
- validation error generation
- row-level validation status
- validation summary
- validation preview
- valid/invalid record separation
- validation history
- tenant isolation
- authorization
- audit events

---

## 2.2 Out of Scope

The following are outside the MVP unless explicitly configured:

- advanced university regulation engine
- automatic graduation eligibility
- credit eligibility calculations
- CGPA recalculation
- predictive academic analysis
- AI-based anomaly detection
- university API validation
- automatic university correction requests
- automatic result amendment
- student notification

These may be introduced in future versions.

---

# 3. Actors

| Actor | Responsibility |
|---|---|
| SUPER_ADMIN | Platform-level oversight |
| COLLEGE_ADMIN | Review and process result validation |
| ACADEMIC_STAFF | Review validation results according to permissions |
| STUDENT | No validation access |
| Public Visitor | No access |

---

# 4. Core Concepts

## 4.1 Validation

Validation determines whether an imported result record satisfies Acadlytic's defined requirements.

Example:

```text id="u4a8g2"
Imported Result
      ↓
Validation
      ↓
VALID / INVALID / WARNING
```

---

# 5. Validation Status

Each result import record should have a validation status.

Supported statuses:

```text id="2p5m8f"
PENDING
VALID
INVALID
WARNING
```

Processing status must remain separate from validation status.

For example:

```text id="6v5f3q"
Validation:
VALID

Processing:
NOT_PROCESSED
```

A valid record is not automatically a processed record.

---

# 6. Validation Pipeline

The validation pipeline should follow a predictable sequence.

```text id="9d3n2h"
Imported Record
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
Final Validation Status
```

---

# 7. Required Field Validation

The system must verify that required fields are available.

Depending on the configured result format, required fields may include:

```text id="x6k3yz"
Student Identifier
Subject Code
Marks
Grade
Result Status
```

A missing required field must produce a validation error.

Example:

```text id="g6f0qv"
MISSING_STUDENT_IDENTIFIER
```

---

# 8. Student Validation

The system must verify that the imported student can be identified.

Validation sequence:

```text id="8x7k2r"
Student Identifier
      ↓
Student Master
      ↓
Exact Match
```

If a student is found:

```text id="q6a3wv"
STUDENT_MATCHED
```

If no student is found:

```text id="4s7v1d"
STUDENT_NOT_FOUND
```

---

# 9. Student Identity Rule

The student's official academic identifier must be preferred.

Example:

```text id="3z5n1m"
University Roll Number
Hall Ticket Number
Registration Number
```

Student name must not be used as the primary identity key.

---

# 10. Ambiguous Student Match

If the validation system encounters multiple possible students for the same supplied identity information, it must not select one automatically.

Expected:

```text id="0k2x7a"
AMBIGUOUS_STUDENT_MATCH
```

The record must be sent for manual review.

---

# 11. Subject Validation

The system must validate the subject using the subject code.

```text id="c1r9hy"
Subject Code
      ↓
Subject Master
      ↓
Exact Match
```

If the subject exists:

```text id="x4m8bq"
SUBJECT_MATCHED
```

If it does not:

```text id="r8j2kq"
SUBJECT_NOT_FOUND
```

---

# 12. Subject Name Rule

Subject name must not be the primary subject identity.

Example:

```text id="6v7m2s"
DBMS
Database Management Systems
Database Management System
```

Different textual names may refer to the same academic subject.

Subject code must therefore be preferred.

---

# 13. Course Validation

The result must belong to the student's configured course.

Example:

```text id="q2y8hp"
Import Context:
BCA

Student:
BCA
```

Valid.

Example:

```text id="m5t3vw"
Import Context:
BCA

Student:
MCA
```

Invalid.

Error:

```text id="f2p7dk"
COURSE_MISMATCH
```

---

# 14. Semester Validation

The result must correspond to the expected semester.

Example:

```text id="0z9n4x"
Import:
Semester 3

Academic Record:
Semester 3
```

Valid.

If the academic context does not match:

```text id="7r5x1c"
SEMESTER_MISMATCH
```

---

# 15. Academic Year Validation

The system must validate the academic year associated with the result.

The academic year must:

- exist
- belong to the college
- be compatible with the import context
- remain valid even when inactive if processing historical results

Inactive does not mean invalid.

---

# 16. Academic Structure Validation

The result must be compatible with the configured:

```text id="4p8n2m"
College
Course
Semester
Subject
Academic Year
```

Example:

```text id="j2h6w8"
BCA
  ↓
Semester 3
  ↓
CS301
```

If CS301 is not assigned to BCA Semester 3:

```text id="9x3k5q"
ACADEMIC_STRUCTURE_MISMATCH
```

---

# 17. Subject-Course Validation

The subject must belong to the configured curriculum.

Example:

```text id="e5r7c2"
Course: BCA
Semester: 3
Subject: CS301
```

If CS301 belongs only to another course:

```text id="h8n4z1"
INVALID_SUBJECT_ASSOCIATION
```

---

# 18. Marks Validation

If the result contains marks, the system must validate their format and range.

Example:

```text id="s5k8y2"
78 → Valid
85.5 → Valid
```

Invalid:

```text id="p4m7x9"
ABC
```

Error:

```text id="n6q2v8"
INVALID_MARKS_FORMAT
```

---

# 19. Marks Range

Where maximum marks are known, the system must validate:

```text id="a7c3m9"
0 ≤ marks ≤ maximum_marks
```

Example:

```text id="y5r8k1"
Maximum Marks = 100
Marks = 105
```

Expected:

```text id="d2f6q4"
MARKS_OUT_OF_RANGE
```

The system must not assume a universal maximum mark if the configured university/result format does not define one.

---

# 20. Missing Marks

Missing marks must not automatically be converted to zero.

Example:

```text id="g8v2k5"
"N/A"
```

may represent:

- absent
- withheld
- unavailable
- not applicable

The system must interpret such values according to the configured result rules.

---

# 21. Grade Validation

Grades must be validated against the applicable grade rules.

Examples:

```text id="w5q9m3"
A
A+
B
B+
O
F
```

The accepted values must be defined by the university/regulation configuration.

Unknown values must generate:

```text id="x3c7v8"
UNKNOWN_GRADE
```

---

# 22. Grade and Marks Consistency

Where a university regulation defines a relationship between marks and grade, the system may validate consistency.

Example:

```text id="m2k6p9"
Marks → 85
Grade → F
```

If the configured regulation says this combination is impossible:

```text id="j7n4q2"
GRADE_MARK_MISMATCH
```

This validation must only be applied when the relevant grading rule is configured.

The system must not invent grading thresholds.

---

# 23. Result Status Validation

Result status must use a recognized value.

Possible statuses may include:

```text id="r8y5m2"
PASS
FAIL
ABSENT
WITHHELD
INCOMPLETE
```

The exact supported values must come from the configured result source/rules.

Unknown status:

```text id="c4v7x9"
INVALID_RESULT_STATUS
```

---

# 24. Pass/Fail Consistency

Where sufficient data is available, the system may validate consistency between:

```text id="v2m8k5"
Grade
Marks
Result Status
```

Example:

```text id="w9n3c6"
Grade = F
Result Status = PASS
```

If the configured rules establish this as invalid:

```text id="p5x7k2"
RESULT_STATUS_MISMATCH
```

The system must not apply such a rule without a defined regulation.

---

# 25. Duplicate Validation

The validation system must detect duplicate records.

Conceptual identity:

```text id="h4q8n2"
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

Duplicate detection must operate both:

- within the current import
- against existing processed result data

---

# 26. Duplicate Within Import

Example:

```text id="y3m7p8"
Row 10 → OU123456 + CS301
Row 80 → OU123456 + CS301
```

If both represent the same attempt:

```text id="q6x2v4"
DUPLICATE_RECORD_IN_FILE
```

---

# 27. Duplicate Existing Result

If an identical result already exists:

```text id="f8n5k3"
DUPLICATE_EXISTING_RESULT
```

The system must prevent accidental duplicate academic records.

---

# 28. Attempt Validation

If the source provides attempt information, the system should validate it.

Example:

```text id="m7r2x9"
Attempt 1
Attempt 2
Attempt 3
```

An attempt must be associated with a valid result context.

The system must preserve attempt history.

---

# 29. Supplementary Result Validation

A supplementary result must not automatically replace the original attempt.

Example:

```text id="c8q4v1"
Attempt 1 → FAIL
Attempt 2 → PASS
```

Both attempts may need to remain part of the academic history.

The Result Processing module determines how the latest valid outcome affects the student's current academic status.

---

# 30. Validation Errors

Every validation error should have:

```text id="k5p8x2"
Error Code
Error Message
Field
Row Number
Severity
```

Example:

```text id="w4n7c9"
Row: 42
Field: subjectCode
Code: SUBJECT_NOT_FOUND
Severity: ERROR
```

---

# 31. Validation Severity

The system should distinguish:

```text id="x7m2q4"
ERROR
WARNING
```

### ERROR

The record cannot be processed until the issue is resolved.

### WARNING

The record may be processed if the defined rule allows it.

The system must not treat warnings as errors automatically.

---

# 32. Validation Summary

After validation, the system should calculate:

```text id="v5c8n2"
Total Records
Valid Records
Invalid Records
Warnings
Student Match Failures
Subject Match Failures
Academic Structure Failures
Duplicate Records
Value Validation Failures
```

Example:

```text id="p2x7m4"
Total: 500
Valid: 460
Invalid: 30
Warnings: 10
Duplicates: 15
```

The counts must reflect actual row-level validation results.

---

# 33. Validation Result

Each row should have a final validation state.

Example:

```text id="j6n3q8"
VALID
INVALID
WARNING
```

A record is `VALID` only when all required validation rules have passed.

---

# 34. Validation Independence

Validation must be separated from processing.

```text id="f3k7v2"
Import
  ↓
Validation
  ↓
VALID
  ↓
Processing
```

Validation must not:

- create result records
- update CGPA
- update backlog status
- update Academic Passport

Those operations belong to Result Processing and related modules.

---

# 35. Validation Preview

Administrators must be able to inspect validation results before processing.

The preview should show:

```text id="c9m4x7"
Student
Subject
Marks
Grade
Result Status
Validation Status
Errors
```

The user must be able to filter:

```text id="h2v8p5"
All
Valid
Invalid
Warnings
Duplicates
```

---

# 36. Validation API

Validation may be initiated through:

```http id="m5q8x3"
POST /api/v1/result-imports/{importId}/validate
```

The API must verify:

- import exists
- user has permission
- import belongs to the user's college
- import is in a valid state for validation

---

# 37. Validation Summary API

```http id="x8n2c6"
GET /api/v1/result-imports/{importId}/validation-summary
```

The response should contain:

```text id="r4v7m1"
Total Records
Valid Records
Invalid Records
Warnings
Error Counts
```

---

# 38. Validation Records API

```http id="q7m3x5"
GET /api/v1/result-imports/{importId}/validation-records
```

Supported filters may include:

```text id="c8n4v2"
status
errorCode
studentIdentifier
subjectCode
```

Pagination should be supported for large imports.

---

# 39. Revalidation

A result import may require revalidation after a correction.

Example:

```text id="j4x8m2"
Invalid Subject
      ↓
Academic Structure Corrected
      ↓
Revalidate
      ↓
Valid
```

Revalidation must update validation status based on the current source data and configuration.

It must not silently alter the original source file.

---

# 40. Validation State Rules

The system should prevent invalid state transitions.

Example:

```text id="p8v3k6"
PENDING
   ↓
VALID
   ↓
PROCESSING
```

Invalid:

```text id="m4q7x2"
PROCESSED
   ↓
PENDING
```

unless a defined correction/reprocessing workflow exists.

---

# 41. Import Status vs Validation Status

These are separate concepts.

Example:

```text id="z6k2p8"
Import Status:
READY_FOR_REVIEW

Validation:
100 VALID
```

Another example:

```text id="r3x7m5"
Import Status:
READY_FOR_REVIEW

Validation:
80 VALID
20 INVALID
```

The import job status represents the lifecycle of the import.

The validation status represents the state of individual records.

---

# 42. Database Requirements

The validation information may be stored on the import-record model or through a dedicated validation model depending on architecture.

Conceptually:

```text id="f5m8q2"
result_import_records
 ├── validation_status
 ├── validation_error_code
 ├── validation_error_message
 ├── validation_severity
 └── validated_at
```

If multiple validation errors per record are required, a separate table may be preferable.

---

# 43. Multiple Validation Errors

A single record may contain multiple problems.

Example:

```text id="v7x3m9"
Student Not Found
+
Subject Not Found
+
Invalid Marks
```

The system should preserve all relevant validation errors rather than reporting only the first error, where practical.

This improves correction efficiency.

---

# 44. Validation Error Model

If a separate error model is used, conceptually:

```text id="q5n8c2"
result_validation_errors
 ├── id
 ├── import_record_id
 ├── field
 ├── error_code
 ├── message
 ├── severity
 └── created_at
```

The final database design remains the responsibility of database architecture.

---

# 45. Validation Performance

Result validation may involve thousands of records.

The implementation should avoid:

```text id="m8q2x5"
one database query per row
```

where practical.

The system should use:

- batch queries
- indexed lookups
- efficient caching where appropriate
- controlled batch processing

The exact optimization belongs to backend architecture.

---

# 46. Large Import Handling

Large result files should not require the browser to perform validation logic.

Preferred architecture:

```text id="c7m3v9"
Browser
   ↓
Upload
   ↓
Backend
   ↓
Validation Job
   ↓
Database
   ↓
Validation Summary
```

The frontend displays the server-generated validation result.

---

# 47. Security Requirements

The validation module must enforce:

- authentication
- role-based authorization
- tenant isolation
- IDOR protection
- server-side validation
- protected import access
- secure result data handling
- audit logging
- no sensitive data leakage through errors
- no unauthorized validation of another college's imports

---

# 48. Audit Events

Important validation actions should generate audit events.

Examples:

```text id="x5m8q3"
RESULT_VALIDATION_STARTED
RESULT_VALIDATION_COMPLETED
RESULT_VALIDATION_FAILED
RESULT_REVALIDATED
```

Audit records should include:

```text id="n2v7c4"
actor
college
import_id
action
timestamp
```

---

# 49. Edge Cases

## Student Not Found

```text id="m8q3x7"
Student Identifier → No Match
```

Expected:

```text id="k4v9p2"
INVALID
STUDENT_NOT_FOUND
```

---

## Multiple Student Matches

Expected:

```text id="q7n2x5"
INVALID
AMBIGUOUS_STUDENT_MATCH
```

---

## Subject Not Found

Expected:

```text id="v3m8c1"
INVALID
SUBJECT_NOT_FOUND
```

---

## Wrong Course

Expected:

```text id="x5q7n4"
INVALID
COURSE_MISMATCH
```

---

## Wrong Semester

Expected:

```text id="m2c8v6"
INVALID
SEMESTER_MISMATCH
```

---

## Invalid Marks

Expected:

```text id="p7x3n9"
INVALID
INVALID_MARKS_FORMAT
```

---

## Marks Outside Range

Expected:

```text id="c4m8q2"
INVALID
MARKS_OUT_OF_RANGE
```

---

## Unknown Grade

Expected:

```text id="n5v7x3"
INVALID
UNKNOWN_GRADE
```

---

## Duplicate Record

Expected:

```text id="q8m2c5"
INVALID
DUPLICATE_EXISTING_RESULT
```

---

## Valid Historical Result

An inactive academic year contains a historical result.

Expected:

```text id="v4x7n2"
VALID
```

Inactive academic year does not automatically make historical data invalid.

---

# 50. Acceptance Criteria

The feature is acceptable when:

- [ ] Imported records can be validated.
- [ ] Required fields are validated.
- [ ] Students are matched using the appropriate identifier.
- [ ] Unknown students are flagged.
- [ ] Ambiguous student matches are flagged.
- [ ] Subjects are matched using subject code.
- [ ] Unknown subjects are flagged.
- [ ] Course compatibility is validated.
- [ ] Semester compatibility is validated.
- [ ] Academic year is validated.
- [ ] Academic structure is validated.
- [ ] Marks format is validated.
- [ ] Marks range is validated where configured.
- [ ] Grades are validated.
- [ ] Result status is validated.
- [ ] Duplicate records are detected.
- [ ] Validation errors are stored.
- [ ] Multiple validation errors can be represented where required.
- [ ] Validation summary is generated.
- [ ] Valid and invalid records are separated.
- [ ] Validation is independent from result processing.
- [ ] Revalidation is supported where required.
- [ ] Tenant isolation is enforced.
- [ ] Authorization is enforced.
- [ ] Audit events are generated.
- [ ] Large imports can be validated without relying on browser-side processing.

---

# 51. Test Scenarios

## Required Fields

- Missing student identifier.
- Missing subject code.
- Missing marks.
- Missing grade.
- Missing result status.

## Student Matching

- Exact student match.
- Student not found.
- Ambiguous student match.
- Incorrect identifier.
- Duplicate student identifier.

## Subject Matching

- Valid subject code.
- Unknown subject code.
- Subject belonging to another curriculum.
- Inactive subject.

## Academic Structure

- Correct course.
- Wrong course.
- Correct semester.
- Wrong semester.
- Correct academic year.
- Historical inactive academic year.
- Subject not associated with semester.

## Result Values

- Valid marks.
- Invalid marks.
- Marks outside range.
- Valid grade.
- Unknown grade.
- Valid result status.
- Invalid result status.

## Duplicate Detection

- Duplicate inside same file.
- Duplicate against existing result.
- Different attempt of same subject.
- Same student and subject across different result releases.

## Security

- Unauthorized validation.
- Cross-tenant import access.
- Manipulated import ID.
- Manipulated college ID.
- Student attempting validation API.
- Public visitor attempting validation API.

---

# 52. AI Coding Agent Rules

When implementing Result Validation, an AI coding agent must:

1. Read Result Import before implementing validation.
2. Read Academic Structure.
3. Read Student Management.
4. Keep validation separate from result processing.
5. Never create result records during validation.
6. Never update CGPA during validation.
7. Never update backlog state during validation.
8. Never update Academic Passport during validation.
9. Prefer official student identifiers.
10. Never use student name as the primary identity.
11. Use subject code as the primary subject match.
12. Never silently create students.
13. Never silently create subjects.
14. Never silently overwrite existing results.
15. Preserve all relevant validation errors.
16. Preserve source-row traceability.
17. Enforce tenant isolation.
18. Reuse authorization infrastructure.
19. Reuse audit infrastructure.
20. Reuse existing error conventions.
21. Use batch operations for large imports where practical.
22. Add unit tests for every major validation rule.
23. Add integration tests for validation workflows.
24. Add cross-tenant security tests.
25. Do not invent university grading rules.
26. Apply regulation-specific validation only when the relevant rule is configured.
27. Do not introduce microservices for validation.
28. Follow the project's background-job architecture for large imports.

---

# 53. Definition of Done

Result Validation is complete when:

- [ ] Validation pipeline is implemented.
- [ ] Required-field validation is implemented.
- [ ] Student matching is implemented.
- [ ] Subject matching is implemented.
- [ ] Academic structure validation is implemented.
- [ ] Course validation is implemented.
- [ ] Semester validation is implemented.
- [ ] Academic year validation is implemented.
- [ ] Marks validation is implemented.
- [ ] Grade validation is implemented.
- [ ] Result-status validation is implemented.
- [ ] Duplicate detection is implemented.
- [ ] Validation errors are persisted.
- [ ] Validation summary is implemented.
- [ ] Validation records can be inspected.
- [ ] Revalidation is implemented where required.
- [ ] Tenant isolation is implemented.
- [ ] Authorization is implemented.
- [ ] Audit events are implemented.
- [ ] Unit tests are implemented.
- [ ] Integration tests are implemented.
- [ ] Security tests are completed.
- [ ] Performance is acceptable for expected import sizes.
- [ ] Code review is completed.
- [ ] QA acceptance criteria are passed.

---

# 54. Future Extensions

## Regulation Engine

Future validation may use university-specific regulations:

```text id="m7q3x8"
University
    ↓
Regulation
    ↓
Grade Rules
    ↓
Credit Rules
    ↓
Result Validation
```

---

## Advanced Academic Validation

Future versions may validate:

- credit requirements
- promotion rules
- semester eligibility
- maximum attempts
- supplementary rules
- graduation eligibility

---

## Anomaly Detection

Future versions may detect unusual patterns such as:

- impossible grade/mark combinations
- unexpected subject combinations
- inconsistent result formats
- abnormal result structures

These should be treated as validation assistance, not automatic truth.

---

# 55. Related Documents

This module depends on:

```text id="g4x8m2"
00-project-context/project-overview.md

03-prd/product-requirements.md
03-prd/mvp-scope.md
03-prd/functional-requirements.md

04-tech-stack/*

05-architecture/*

07-project-rules/*

09-development/feature-specifications/authentication.md
09-development/feature-specifications/college-management.md
09-development/feature-specifications/academic-structure.md
09-development/feature-specifications/student-management.md
09-development/feature-specifications/result-import.md
```

Related modules:

```text id="v8n3q5"
result-processing.md
backlog-tracking.md
academic-passport.md
analytics.md
student-portal.md
```

---

# 56. Document Status

**Status:** Draft / Implementation Ready

This document defines the validation boundary of the Acadlytic Result Engine.

It determines whether imported result records are acceptable for processing.

It does not define:

- result persistence logic
- SGPA/CGPA calculation implementation
- backlog state updates
- Academic Passport updates
- university API integration
- database migration implementation
- source code

Those responsibilities belong to their respective modules and architecture documents.