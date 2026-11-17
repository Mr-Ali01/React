# Result Processing

**Project:** Acadlytic  
**Module:** Result Processing  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

# 1. Purpose

The Result Processing module converts validated result records into official academic records within Acadlytic.

It is responsible for applying validated results to:

- student academic records
- semester result records
- subject results
- result attempts
- SGPA
- CGPA
- backlog records
- Academic Passport
- academic analytics

The module must process only records that have successfully passed the required validation rules.

---

# 2. Scope

## 2.1 MVP Scope

The MVP includes:

- processing validated result records
- creating result records
- updating result records where explicitly permitted
- maintaining result attempts
- semester result association
- SGPA calculation where required data is available
- CGPA calculation where required data is available
- backlog creation
- backlog clearing
- Academic Passport update
- processing status tracking
- processing statistics
- transaction handling
- duplicate protection
- audit events
- tenant isolation
- authorization
- processing history
- processing error handling

---

## 2.2 Out of Scope

The following are outside the MVP unless explicitly configured:

- automatic university API synchronization
- university result scraping
- predictive academic analytics
- AI-generated academic recommendations
- graduation eligibility engine
- advanced regulation engine
- academic what-if simulation
- automatic student notifications
- fee processing
- attendance processing
- placement processing

---

# 3. Actors

| Actor | Responsibility |
|---|---|
| SUPER_ADMIN | Platform-level oversight |
| COLLEGE_ADMIN | Manage result processing for their college |
| ACADEMIC_STAFF | Process validated results according to permissions |
| STUDENT | View processed academic records only |
| Public Visitor | No access |

---

# 4. Core Principle

The Result Processing module must follow this rule:

```text id="x8q3m5"
Import
   ↓
Validation
   ↓
VALID
   ↓
Processing
   ↓
Academic Records
```

Invalid records must not be processed as valid academic results.

---

# 5. Processing Lifecycle

```text id="q4v7n2"
VALIDATED
    ↓
READY_FOR_PROCESSING
    ↓
PROCESSING
    ↓
PROCESSED
```

If processing fails:

```text id="m8c3x6"
PROCESSING
    ↓
PROCESSING_FAILED
```

For partial processing:

```text id="r5n9k2"
PROCESSING
    ↓
COMPLETED_WITH_ERRORS
```

---

# 6. Processing Status

Supported processing states:

```text id="v7m2q8"
NOT_PROCESSED
READY_FOR_PROCESSING
PROCESSING
PROCESSED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

The backend must control state transitions.

---

# 7. Processing Eligibility

An import may be processed only when:

- the import exists
- the user is authorized
- the import belongs to the user's college
- required validation is complete
- required records are valid
- the import is not already successfully processed
- the academic context is valid

---

# 8. Valid Record Requirement

A record may enter processing only if:

```text id="p3x8m5"
validation_status = VALID
```

Warnings may be processed only when the applicable rule explicitly permits them.

Invalid records must remain unprocessed.

---

# 9. Processing Scope

The system must clearly distinguish:

```text id="j6q2v9"
Import Job
     ↓
Import Records
     ↓
Validated Records
     ↓
Processed Records
```

Processing one import does not mean every source row was successfully processed.

The system must maintain row-level processing status.

---

# 10. Processing Statistics

The import job should track:

```text id="c8m4x7"
total_records
valid_records
invalid_records
processing_started
processed_records
successful_records
failed_records
skipped_records
```

The statistics must represent actual processing results.

---

# 11. Student Academic Record

A processed result becomes part of the student's academic history.

Conceptually:

```text id="n5v2q8"
Student
   ↓
Academic Record
   ↓
Semester
   ↓
Subject Results
```

The academic record must preserve historical result information.

---

# 12. Subject Result

A subject result should represent the student's outcome for a particular subject attempt.

Conceptual fields may include:

```text id="m7x3c9"
student_id
subject_id
semester_id
academic_year_id
result_release_id
attempt
marks
grade
grade_point
credits
result_status
```

The exact database model belongs to Database Architecture.

---

# 13. Result Identity

A processed result must have a stable identity.

A conceptual identity is:

```text id="q8v4n2"
University
+
Result Release
+
Student
+
Subject
+
Attempt
```

This identity prevents accidental duplicate academic records.

---

# 14. Result Creation

When a valid result does not already exist:

```text id="x4m7p2"
Validated Result
      ↓
Create Subject Result
```

The created result must retain its source information.

---

# 15. Result Update

Existing results must not be overwritten automatically.

An update is permitted only when an explicit correction/reprocessing rule allows it.

Example:

```text id="c6n3v8"
Existing Result
      ↓
Official Corrected Result
      ↓
Controlled Correction
```

All corrections must be auditable.

---

# 16. Result History

The system should preserve academic history where a student has multiple attempts or corrected results.

Example:

```text id="m5q8x2"
Attempt 1 → FAIL
Attempt 2 → PASS
```

The first attempt must not simply disappear when the second attempt is processed.

---

# 17. Attempt Management

If the result source provides attempt information, the system must preserve it.

Example:

```text id="v8c4m1"
Subject: CS301

Attempt 1:
FAIL

Attempt 2:
PASS
```

Both attempts may remain in the academic history.

---

# 18. Attempt Number

If attempt information is not directly available, the system may derive an attempt according to the configured result rules.

The system must not guess attempt numbers from arbitrary file ordering.

Where attempt cannot be reliably determined, the record should require appropriate configuration or review.

---

# 19. Regular and Supplementary Results

The system must distinguish result contexts when the source provides them.

Example:

```text id="p7m2x8"
REGULAR
SUPPLEMENTARY
REVALUATION
```

The exact result types must come from the configured university/result source.

---

# 20. Revaluation / Correction

If a university releases a corrected or revaluated result, the system must preserve the previous academic record according to the configured correction policy.

The new official result must be traceable to its source release.

The system must not silently delete historical data.

---

# 21. Result Status

Processed results may have statuses such as:

```text id="n4q7m2"
PASS
FAIL
ABSENT
WITHHELD
INCOMPLETE
```

The exact values depend on the configured result rules.

---

# 22. Credits

Where credits are available, the processed result should associate the student result with the subject's configured credit value.

Example:

```text id="c8x3v6"
Subject:
CS301

Credits:
4
```

Credits should normally come from the Academic Structure rather than being blindly trusted from an imported file when the authoritative curriculum configuration already defines them.

If the source and configured values conflict, the record should be flagged according to the applicable validation rules.

---

# 23. Grade Point

Where grade-point mapping is configured, the system should derive or validate the grade point using the applicable university/regulation rules.

Example:

```text id="q6m2x9"
Grade
  ↓
Grade Point
```

The system must not use a universal grade-point mapping for every university.

---

# 24. SGPA Calculation

SGPA represents the semester grade-point average.

Conceptually:

```text id="v5n8c2"
SGPA =
Σ(Credit × Grade Point)
-----------------------
       Σ Credits
```

The calculation must use the applicable university/regulation rules.

---

# 25. SGPA Processing

After subject results for a semester have been processed:

```text id="m3x7q9"
Subject Results
      ↓
Credits + Grade Points
      ↓
SGPA Calculation
      ↓
Semester Academic Record
```

The system must ensure that all required subject results are available before calculating the final SGPA.

---

# 26. SGPA Recalculation

If a result correction changes a subject result:

```text id="x8c4m2"
Corrected Subject Result
        ↓
Recalculate Semester SGPA
```

The recalculated SGPA must be derived from the current authoritative academic records according to the applicable regulation.

---

# 27. CGPA Calculation

CGPA represents cumulative grade-point performance across applicable semesters.

A generic conceptual formula may be:

```text id="q7m3v8"
CGPA =
Σ(Credit × Grade Point)
-----------------------
       Σ Credits
```

The actual calculation must follow the applicable university/regulation rules.

Acadlytic must not assume that every university calculates CGPA identically.

---

# 28. CGPA Processing

After processing a semester:

```text id="c5x9m2"
Semester Results
      ↓
Semester GPA
      ↓
Cumulative Academic Record
      ↓
CGPA Recalculation
```

The system must recalculate cumulative values when required.

---

# 29. CGPA History

The system should maintain sufficient historical information to determine how CGPA was produced.

A student record should allow the system to identify:

```text id="m8q4v2"
Semester 1
Semester 2
Semester 3
...
Current CGPA
```

---

# 30. Backlog Processing

Result Processing must integrate with Backlog Tracking.

Basic workflow:

```text id="v3n7x8"
Result
  ↓
Pass / Fail
  ↓
Backlog Decision
```

---

# 31. Backlog Creation

If a subject result indicates failure according to configured rules:

```text id="q5m2c9"
FAIL
  ↓
Create / Update Backlog
```

The backlog must reference:

```text id="x7v4n2"
Student
Subject
Semester
Academic Year
Attempt
Result
```

---

# 32. Backlog Clearing

If a previously failed subject is later passed:

```text id="m6q8x3"
Existing Backlog
      ↓
Supplementary Result
      ↓
PASS
      ↓
Backlog Cleared
```

The original backlog history must remain auditable.

---

# 33. Backlog Status

The backlog lifecycle should be compatible with the Backlog Tracking module.

Possible states may include:

```text id="n8x3q5"
OPEN
CLEARED
CARRIED_FORWARD
```

The final backlog state model is defined by `backlog-tracking.md`.

---

# 34. Backlog Attempt History

The system must preserve multiple attempts.

Example:

```text id="c7m2v9"
Attempt 1 → FAIL
Attempt 2 → FAIL
Attempt 3 → PASS
```

The student should retain a complete attempt history.

---

# 35. Academic Passport Update

Successfully processed results must update the student's Academic Passport.

Conceptually:

```text id="x5q8m3"
Processed Result
      ↓
Academic Record
      ↓
Academic Passport
```

The Academic Passport should reflect the latest valid academic state.

---

# 36. Academic Passport Data

Depending on the Academic Passport specification, processing may update:

- semester results
- subject outcomes
- SGPA
- CGPA
- backlog status
- credits earned
- academic milestones

The exact fields are defined by `academic-passport.md`.

---

# 37. Analytics Update

Processed academic data must become available to Analytics.

Conceptually:

```text id="m4v7x2"
Processed Results
      ↓
Academic Data
      ↓
Analytics
```

Analytics should consume authoritative academic records rather than raw import rows.

---

# 38. Processing Order

A recommended logical sequence is:

```text id="q8c3n5"
1. Load validated records
2. Verify processing eligibility
3. Resolve student
4. Resolve subject
5. Create/update result attempt
6. Apply result status
7. Update backlog state
8. Recalculate semester GPA where applicable
9. Recalculate cumulative GPA where applicable
10. Update Academic Passport
11. Update analytics source data
12. Record audit event
13. Mark record processed
```

The actual transaction strategy may batch these operations.

---

# 39. Transaction Integrity

Academic result processing is a high-integrity operation.

The system must avoid situations where:

```text id="x6m2v8"
Result saved
but
Backlog not updated
```

or:

```text id="c4q7n3"
Subject result saved
but
semester result remains inconsistent
```

Processing must use appropriate transaction boundaries.

---

# 40. Processing Transaction

Where multiple related records must remain consistent, they should be committed within the same transaction boundary where technically appropriate.

Example:

```text id="m8v3q5"
Subject Result
+
Backlog Update
+
Semester Summary
```

must not leave the database in an invalid intermediate state after a failed transaction.

---

# 41. Batch Processing

Large imports should be processed in controlled batches.

Example:

```text id="q3x7m9"
1000 Records
   ↓
Batch 1
Batch 2
Batch 3
...
```

Batch size must be configurable.

The system must maintain row-level processing status.

---

# 42. Failure Handling

If processing fails for a record, the system must:

- record the failure
- preserve the error
- avoid falsely marking it as successful
- maintain transaction consistency
- allow controlled retry where appropriate

Example:

```text id="v5m8x2"
PROCESSING_FAILED
```

---

# 43. Retry

A failed processing record may be retried after the cause is resolved.

Retry must:

- verify current record state
- re-check processing eligibility
- prevent duplicate creation
- remain auditable

The system must not blindly execute the same database operation again.

---

# 44. Idempotency

Processing must be idempotent.

If the same processing request is submitted twice:

```text id="c8q3m7"
Request 1 → Process
Request 2 → Already Processed
```

The second request must not create duplicate academic records.

---

# 45. Concurrent Processing

Two users must not be able to process the same import simultaneously in a way that causes duplicate or inconsistent results.

The backend should use appropriate:

- state checks
- locking
- transactional controls
- idempotency mechanisms

---

# 46. Processing Lock

Before processing begins, the system should transition the import into:

```text id="m7x2q5"
PROCESSING
```

Only one valid processing operation should own the import at a time.

---

# 47. Authorization

### SUPER_ADMIN

May process results across permitted college contexts.

### COLLEGE_ADMIN

May process results belonging to their college.

### ACADEMIC_STAFF

May process results according to assigned permissions.

### STUDENT

Cannot process results.

### Public Visitor

Cannot process results.

---

# 48. Tenant Isolation

Every processed result must remain associated with the correct college.

The backend must verify:

```text id="x4m8c2"
Authenticated User
       ↓
College Context
       ↓
Import Job
       ↓
Student
       ↓
Academic Result
```

A user must never be able to process another college's import by modifying IDs in the request.

---

# 49. Audit Events

Important processing actions should generate audit events.

Examples:

```text id="q6v3m8"
RESULT_PROCESSING_STARTED
RESULT_RECORD_PROCESSED
RESULT_RECORD_PROCESSING_FAILED
RESULT_PROCESSING_COMPLETED
RESULT_PROCESSING_COMPLETED_WITH_ERRORS
RESULT_REPROCESSING_STARTED
RESULT_CORRECTION_APPLIED
```

Audit records should include:

```text id="n7x2c5"
actor
college
import_id
result_id
action
timestamp
```

---

# 50. Processing API

The processing operation may be exposed as:

```http id="m4q8x3"
POST /api/v1/result-imports/{importId}/process
```

The backend must verify:

- authentication
- authorization
- tenant ownership
- import status
- validation status
- processing state
- duplicate protection

---

# 51. Processing Status API

```http id="v8c2m5"
GET /api/v1/result-imports/{importId}/processing-status
```

The response may include:

```text id="x3q7n9"
status
totalRecords
processedRecords
successfulRecords
failedRecords
skippedRecords
startedAt
completedAt
```

---

# 52. Processing Error API

```http id="m5x8q2"
GET /api/v1/result-imports/{importId}/processing-errors
```

The API should support pagination and filtering where required.

---

# 53. Result Record API

Processed academic results may be exposed through the Student Academic Record APIs.

Example:

```http id="q7v3n8"
GET /api/v1/students/{studentId}/results
```

Access must follow the authorization and tenant rules defined by the platform.

---

# 54. Database Requirements

The processing module should integrate with the academic result data model.

Conceptually:

```text id="x4m7c2"
student_results
 ├── id
 ├── student_id
 ├── subject_id
 ├── semester_id
 ├── academic_year_id
 ├── result_release_id
 ├── attempt
 ├── marks
 ├── grade
 ├── grade_point
 ├── credits
 ├── result_status
 ├── source_import_id
 ├── created_at
 └── updated_at
```

The final schema is defined by Database Architecture.

---

# 55. Source Traceability

Every processed result should be traceable back to its source import.

Conceptually:

```text id="n6q2v8"
Student Result
      ↓
Import Record
      ↓
Import Job
      ↓
Source File
```

This is required for auditing and investigation.

---

# 56. Processing History

The system should maintain enough information to determine:

- when the result was processed
- who processed it
- which import produced it
- whether it was a first attempt or correction
- whether processing succeeded
- whether a retry occurred

---

# 57. Correction Handling

If a university provides corrected data:

```text id="v3m8q5"
Original Result
      ↓
Corrected Result
      ↓
Validation
      ↓
Controlled Processing
```

The system must preserve the correction history.

Corrections must not bypass validation.

---

# 58. Result Processing and Validation Separation

The following boundary must remain strict:

### Result Validation

Determines:

```text id="q5x7m2"
Is this result acceptable?
```

### Result Processing

Determines:

```text id="c8v3n6"
What should Acadlytic do with this accepted result?
```

Validation must not perform processing.

Processing must not bypass validation.

---

# 59. Frontend Requirements

The frontend should provide:

```text id="m7q2x8"
Import Details
      ↓
Validation Summary
      ↓
Ready for Processing
      ↓
Process Results
      ↓
Processing Progress
      ↓
Processing Summary
```

---

# 60. Processing Confirmation

Before processing, the UI should clearly display:

```text id="x5v8m3"
You are about to process:

Total Valid Records: 950
Invalid Records: 50
```

The user should explicitly confirm processing.

---

# 61. Processing Progress

For long-running imports, the UI should display progress where available.

Example:

```text id="q3m7c8"
Processing Results

Processed:
720 / 950

Successful:
715

Failed:
5
```

The frontend must use backend status rather than estimating progress independently.

---

# 62. Processing Completion

Successful processing:

```text id="v8x2n4"
Processing Completed

Total Valid Records: 950
Processed: 950
Successful: 950
Failed: 0
```

Partial completion:

```text id="m4c7q9"
Processing Completed With Errors

Valid Records: 950
Processed: 950
Successful: 940
Failed: 10
```

---

# 63. Edge Cases

## Already Processed Import

If an import is already successfully processed:

```text id="x6q3m8"
IMPORT_ALREADY_PROCESSED
```

The system must not process it again automatically.

---

## Invalid Import

If required validation has not passed:

```text id="v5n8c2"
IMPORT_NOT_READY
```

Processing must be blocked.

---

## Student Deleted or Deactivated

If the student reference becomes unavailable after validation but before processing, processing must re-check the student.

The system must not create an invalid reference.

---

## Subject Configuration Changed

If the academic structure changes between validation and processing, the system should re-check relevant dependencies before committing results.

---

## Duplicate Processing Request

A second processing request must not create duplicate records.

---

## Partial Processing Failure

Successful records remain clearly marked as processed, while failed records remain retryable where appropriate.

---

# 64. Security Requirements

The module must enforce:

- authentication
- authorization
- tenant isolation
- IDOR protection
- server-side state validation
- transaction integrity
- secure audit logging
- protected academic data
- no sensitive data leakage
- no client-side trust for processing decisions

---

# 65. AI Coding Agent Rules

When implementing Result Processing, an AI coding agent must:

1. Read Result Import.
2. Read Result Validation.
3. Read Student Management.
4. Read Academic Structure.
5. Read Backlog Tracking before implementing backlog updates.
6. Read Academic Passport before implementing passport updates.
7. Never process invalid records.
8. Never bypass validation.
9. Never silently overwrite existing academic results.
10. Preserve result attempts.
11. Preserve source traceability.
12. Make processing idempotent.
13. Prevent concurrent duplicate processing.
14. Use appropriate transactions.
15. Never calculate grades using invented rules.
16. Use configured university/regulation rules.
17. Never silently create missing students.
18. Never silently create missing subjects.
19. Enforce tenant isolation.
20. Reuse authentication and authorization infrastructure.
21. Reuse audit infrastructure.
22. Reuse centralized error handling.
23. Do not put business logic in controllers.
24. Keep processing logic in the appropriate backend service/module layer.
25. Use batch processing for large imports where appropriate.
26. Add retry-safe behavior.
27. Add unit tests for processing rules.
28. Add integration tests for transactions.
29. Add security tests for cross-tenant access.
30. Add idempotency/concurrency tests.
31. Do not introduce microservices for this module.
32. Do not introduce university scraping as part of result processing.

---

# 66. Acceptance Criteria

The module is acceptable when:

- [ ] Only validated records can be processed.
- [ ] Processing state is tracked.
- [ ] Result records are created correctly.
- [ ] Existing records are protected from accidental duplication.
- [ ] Attempt history is preserved.
- [ ] Regular/supplementary context is preserved where available.
- [ ] SGPA is calculated according to configured rules.
- [ ] CGPA is calculated according to configured rules.
- [ ] Backlogs are created when required.
- [ ] Existing backlogs can be cleared when a valid pass is processed.
- [ ] Academic Passport is updated.
- [ ] Processing statistics are accurate.
- [ ] Processing errors are recorded.
- [ ] Retry behavior is safe.
- [ ] Processing is idempotent.
- [ ] Concurrent processing is controlled.
- [ ] Source traceability is preserved.
- [ ] Audit events are generated.
- [ ] Tenant isolation is enforced.
- [ ] Authorization is enforced.
- [ ] Transactions preserve academic data consistency.
- [ ] Unit tests are implemented.
- [ ] Integration tests are implemented.
- [ ] Security tests are implemented.
- [ ] QA acceptance criteria are passed.

---

# 67. Test Scenarios

## Processing Eligibility

- Valid import can be processed.
- Invalid import cannot be processed.
- Unvalidated import cannot be processed.
- Already processed import cannot be processed again.

## Result Creation

- New result is created.
- Existing result is detected.
- Duplicate result is prevented.
- Source import is linked.

## Attempts

- First attempt is stored.
- Second attempt is stored separately.
- Failed attempt remains in history.
- Passed supplementary attempt clears applicable backlog.

## SGPA

- Valid semester results calculate SGPA.
- Correct credit values are used.
- Correct grade points are used.
- SGPA recalculates after controlled correction.

## CGPA

- Cumulative records calculate CGPA.
- Historical semesters are included according to rules.
- CGPA recalculates after a valid correction.

## Backlog

- Failed result creates backlog.
- Existing backlog remains open after another failure.
- Passed result clears applicable backlog.
- Attempt history remains preserved.

## Academic Passport

- New semester result appears.
- SGPA is reflected.
- CGPA is reflected.
- Backlog state is reflected.

## Transactions

- Successful transaction commits all required changes.
- Failed transaction does not leave inconsistent academic state.
- Partial batch processing is correctly tracked.

## Security

- Unauthorized processing is rejected.
- Cross-tenant processing is rejected.
- Student cannot process results.
- Manipulated import IDs are rejected.

## Idempotency

- Duplicate processing request does not create duplicate results.
- Concurrent processing does not create duplicate results.

---

# 68. Definition of Done

Result Processing is complete when:

- [ ] Processing eligibility rules are implemented.
- [ ] Validated records can be processed.
- [ ] Academic result records are persisted.
- [ ] Attempt history is preserved.
- [ ] Duplicate processing is prevented.
- [ ] SGPA calculation is implemented according to configured rules.
- [ ] CGPA calculation is implemented according to configured rules.
- [ ] Backlog creation is integrated.
- [ ] Backlog clearing is integrated.
- [ ] Academic Passport update is integrated.
- [ ] Processing status is implemented.
- [ ] Processing statistics are implemented.
- [ ] Processing errors are persisted.
- [ ] Retry behavior is implemented.
- [ ] Idempotency is implemented.
- [ ] Concurrent processing is controlled.
- [ ] Transactions are implemented correctly.
- [ ] Source traceability is implemented.
- [ ] Audit events are implemented.
- [ ] Tenant isolation is tested.
- [ ] Authorization is tested.
- [ ] Unit tests are implemented.
- [ ] Integration tests are implemented.
- [ ] Security tests are implemented.
- [ ] Code review is completed.
- [ ] QA acceptance criteria are passed.

---

# 69. Future Extensions

## Regulation Engine

A future Regulation Engine may control:

- grade-point mappings
- SGPA rules
- CGPA rules
- credit rules
- pass/fail rules
- supplementary rules
- promotion rules
- graduation eligibility

---

## University Result Connectors

Future integrations may provide:

```text id="q7m3x8"
University API
      ↓
Result Connector
      ↓
Import
      ↓
Validation
      ↓
Processing
```

---

## Automatic Result Monitoring

Authorized university integrations may support:

```text id="x5v8c2"
Scheduler / Webhook
       ↓
New Result Release
       ↓
Import
       ↓
Validation
       ↓
Processing
```

---

## Advanced Academic Calculations

Future versions may support:

- university-specific CGPA formulas
- regulation-specific credit calculations
- distinction/classification
- graduation eligibility
- earned-credit tracking
- cumulative backlog intelligence

---

# 70. Related Documents

This module depends on:

```text id="m4x8q2"
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
09-development/feature-specifications/result-validation.md
```

Related modules:

```text id="v8n3c5"
backlog-tracking.md
academic-passport.md
analytics.md
student-portal.md
```

---

# 71. Document Status

**Status:** Draft / Implementation Ready

This document defines the Result Processing boundary of Acadlytic.

It describes how validated university result data becomes part of the student's authoritative academic record.

It does not replace:

- Academic Structure specification
- Backlog Tracking specification
- Academic Passport specification
- Analytics specification
- Regulation Engine specification
- Database Architecture
- API Architecture
- Security Architecture
- source code
- database migration files