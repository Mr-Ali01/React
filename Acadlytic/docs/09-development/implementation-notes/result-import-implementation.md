# Result Import Implementation

**Document:** `09-development/implementation-notes/result-import-implementation.md`  
**Project:** Acadlytic  
**Phase:** Development — Result Import  
**Status:** Draft / Under Review  
**Audience:** Backend Developers, Frontend Developers, QA Engineers, Security Reviewers, AI Coding Assistants

---

# 1. Purpose

This document defines the concrete implementation approach for Result Import in Acadlytic.

Result Import is responsible for receiving university result files, parsing their contents, normalizing records, identifying academic context, and preparing records for Result Validation.

The import process must preserve source information while preventing unvalidated data from entering authoritative academic records.

---

# 2. Core Principle

Result Import is an ingestion boundary.

The fundamental flow is:

```text
University Result File
        ↓
Upload
        ↓
Import Job
        ↓
Parse
        ↓
Normalize
        ↓
Match Student
        ↓
Match Academic Structure
        ↓
Prepare Imported Records
        ↓
Result Validation
        ↓
Result Processing
```

Result Import must not directly create authoritative academic results.

---

# 3. Scope

The MVP Result Import implementation covers:

- Excel upload
- CSV upload
- file validation
- import job creation
- parsing
- header detection/mapping
- field normalization
- student matching
- subject matching
- academic context matching
- duplicate detection
- import record persistence
- import status tracking
- preview
- validation handoff
- import history
- error reporting
- auditability
- tenant isolation
- background processing where required

---

# 4. Supported Input Formats

MVP supports:

```text
.xlsx
.xls
.csv
```

The final supported formats must match the approved product requirements and dependency compatibility.

Unsupported file types must be rejected before processing.

---

# 5. Out of Scope

MVP does not include:

- direct university APIs
- university web scraping
- browser automation
- CAPTCHA automation
- unauthorized university portal access
- automatic result monitoring
- university webhooks
- automatic result downloads
- predictive analytics
- AI interpretation of result files
- automatic academic structure creation
- automatic student creation from unknown result rows

---

# 6. Import Ownership

Result Import owns:

```text
Import Job
Source File Metadata
Imported Raw/Normalized Records
Import Status
Parsing Errors
Mapping Information
Import-Level Audit Information
```

It does not own:

```text
Student Identity
Academic Structure
Processed Academic Result
Backlog
Academic Passport
Analytics
```

Those remain owned by their respective modules.

---

# 7. Result Import Boundary

The import module should follow:

```text
External File
      ↓
Result Import
      ↓
Normalized Imported Record
      ↓
Result Validation
```

This boundary prevents malformed external data from directly changing academic records.

---

# 8. Import Job

Every uploaded file should create an import job.

Conceptually:

```text id="2u2q51"
Import Job
├── id
├── college
├── source file metadata
├── status
├── created by
├── created at
├── processing timestamps
└── summary
```

The exact schema must follow the finalized database architecture.

---

# 9. Import Status

The approved status model includes:

```text id="4ycex8"
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

The processing status and record validation status are separate concepts.

---

# 10. Import Status Meaning

### `UPLOADED`

File has been successfully received and stored.

### `PARSING`

The system is reading and interpreting the file.

### `VALIDATING`

Imported records are being checked against application rules.

### `READY_FOR_REVIEW`

Import completed its preparation stage and can be reviewed.

### `PROCESSING`

Validated records are being committed by Result Processing.

### `COMPLETED`

Import finished successfully.

### `COMPLETED_WITH_ERRORS`

Import completed but one or more records require attention.

### `FAILED`

Import could not complete.

### `CANCELLED`

Processing was intentionally stopped.

---

# 11. File Upload API

Primary endpoint:

```text id="e6t7pu"
POST /api/v1/result-imports
```

The endpoint accepts multipart form data.

Conceptually:

```text
multipart/form-data
    file
    metadata
```

The exact multipart contract must follow the API architecture.

---

# 12. Upload Authorization

Result Import is restricted to authorized college users.

Potential roles:

```text id="2c8oy6"
COLLEGE_ADMIN
ACADEMIC_STAFF
```

The exact permission matrix must follow the approved authorization design.

Students must not upload official university result files in MVP.

---

# 13. Tenant Context

The college tenant must come from trusted authenticated context.

Do not rely solely on:

```text id="s31e5x"
collegeId
```

provided by the frontend.

Conceptually:

```text id="d8ys7m"
Authenticated User
        ↓
Trusted College Context
        ↓
Create Import Job
```

---

# 14. File Validation

Before accepting the upload, validate:

- file exists
- file is not empty
- supported extension
- supported MIME type where practical
- file size limit
- safe filename handling
- content compatibility
- user authorization

The server must enforce these checks.

---

# 15. File Size Limit

A maximum file size must be configured.

The exact value is an unresolved deployment/product decision.

Example configuration concept:

```yaml
result-import:
  max-file-size: ...
```

Do not hard-code the value in business logic.

---

# 16. Filename Handling

The original filename may be retained as metadata.

However, it must never be trusted as a filesystem path.

Unsafe:

```text id="b2r6j4"
../../some-file
```

The application must generate a safe internal storage identifier.

---

# 17. File Storage

The import pipeline should use a storage abstraction rather than coupling business logic directly to a local filesystem.

Conceptually:

```text id="d0q2gl"
Result Import
     ↓
File Storage Service
     ↓
Local / Object Storage
```

The exact production storage provider remains an infrastructure decision.

---

# 18. Source File Metadata

Store metadata such as:

```text id="p2j5b6"
Original Filename
Content Type
File Size
Storage Reference
Checksum
Uploaded By
Uploaded At
```

The exact fields depend on the approved schema.

---

# 19. File Checksum

A checksum can help identify duplicate uploads.

Conceptually:

```text id="x3mbs5"
File
 ↓
Checksum
 ↓
Duplicate Detection
```

Checksum alone must not determine whether a result import is semantically duplicate because the same data can appear in differently formatted files.

---

# 20. Import Metadata

Where useful, an import may include:

- academic year
- semester
- course
- result release information
- source description

These values should be explicit metadata rather than inferred blindly from filenames.

---

# 21. Import Creation Flow

Conceptually:

```text id="aw6zry"
Upload File
    ↓
Authenticate
    ↓
Authorize
    ↓
Validate File
    ↓
Create Import Job
    ↓
Store File
    ↓
Status = UPLOADED
    ↓
Begin Parsing
```

---

# 22. Synchronous vs Asynchronous Processing

Small operations may be handled synchronously.

Parsing and processing potentially large result files should use background processing.

Recommended pattern:

```text id="8g6m2u"
Upload
  ↓
Create Job
  ↓
202 Accepted
  ↓
Background Processing
  ↓
Poll Job Status
```

The final background-job technology remains an implementation decision.

---

# 23. API Response for Long Operations

For asynchronous processing:

```text id="p7a9m2"
HTTP 202 Accepted
```

should be considered.

The response should provide enough information for the client to track the import.

Conceptually:

```json id="y23a9w"
{
  "importId": "...",
  "status": "UPLOADED"
}
```

---

# 24. Import Status API

Primary endpoint:

```text id="0j3k0h"
GET /api/v1/result-imports/{importId}
```

The response should contain:

- import ID
- status
- source metadata
- progress/summary where available
- created timestamp
- updated timestamp
- error summary where applicable

---

# 25. Import List API

Endpoint:

```text id="oq0n0h"
GET /api/v1/result-imports
```

The list should support:

- pagination
- status filtering
- date filtering where required
- uploader filtering where appropriate
- search where useful

Tenant scoping is mandatory.

---

# 26. Import Record API

Endpoint:

```text id="9pxz4h"
GET /api/v1/result-imports/{importId}/records
```

This should expose normalized import records and their preparation/validation state.

It should support pagination.

Do not return millions of records in one response.

---

# 27. Import Record Model

Conceptually:

```text id="4kq5b5"
Imported Result Record
├── import_id
├── row_number
├── raw values / source reference
├── normalized values
├── student match
├── subject match
├── academic context
├── validation status
└── errors/warnings
```

The exact schema must be finalized.

---

# 28. Raw vs Normalized Data

The system should distinguish:

```text id="j3u4s0"
Source Value
```

from:

```text id="h8o7vf"
Normalized Value
```

Example:

```text
Source:
"  8.50 "

Normalized:
8.50
```

This preserves traceability while allowing consistent validation.

---

# 29. Source Traceability

Each normalized record should be traceable back to:

- import job
- source row
- source file
- original value where needed

This is important for reviewing university result discrepancies.

---

# 30. Header Detection

Excel/CSV files may contain:

- title rows
- university information
- course information
- blank rows
- header rows
- result records
- footer/summary rows

The parser must not assume the first row is always the data header.

---

# 31. Header Mapping

A configurable mapping layer should translate source columns into normalized fields.

Potential normalized fields:

```text id="5n1w1y"
registrationNumber
studentName
subjectCode
subjectName
semester
courseCode
marks
grade
gradePoint
credits
resultStatus
attemptType
```

Only fields actually required by the approved result model should be implemented.

---

# 32. Column Mapping Strategy

Column mapping may support:

```text id="8bq4jv"
Exact Header Match
Normalized Header Match
Configured Mapping
Manual Mapping
```

The MVP should avoid uncontrolled fuzzy matching that can silently map incorrect columns.

---

# 33. Header Normalization

Headers may vary:

```text
Reg No
Registration No.
Registration Number
REGISTRATION_NO
```

Normalization may standardize:

- case
- whitespace
- punctuation
- separators

However, ambiguous headers should require review.

---

# 34. Required Fields

Required fields depend on the approved result schema.

Likely core identity/context fields include:

```text id="r3jmx0"
Student Identifier
Subject Identifier
Academic Context
```

Result outcome fields depend on the university result format.

The implementation must not assume one universal university schema.

---

# 35. Parser Abstraction

Use format-specific parsers behind a common interface.

Conceptually:

```text id="z8tv4m"
ResultFileParser
      ↑
 ┌────┴─────┐
ExcelParser CSVParser
```

This prevents business logic from depending directly on Apache POI or CSV parsing details.

---

# 36. Excel Parsing

Apache POI may be used for Excel processing according to the backend technology baseline.

The parser should handle:

- workbook
- worksheet
- rows
- cells
- cell types
- blank values
- numeric values
- text values
- formulas where applicable

The exact supported Excel behavior must be tested against representative university files.

---

# 37. CSV Parsing

CSV processing should correctly handle:

- delimiters
- quoted fields
- escaped characters
- line breaks inside quoted values
- encoding
- headers
- empty values

Do not assume every CSV uses a comma delimiter without verification.

---

# 38. Encoding

The importer should handle supported character encodings consistently.

If encoding cannot be determined safely:

```text id="z3w2v4"
Import
 ↓
Encoding Error
 ↓
Actionable Error
```

rather than silently corrupting student names or other data.

---

# 39. Normalization

Normalization may include:

- trimming whitespace
- standardizing case where appropriate
- normalizing registration numbers
- normalizing subject codes
- parsing numeric values
- standardizing result statuses
- converting blank values to null

Normalization must not destroy meaningful source information.

---

# 40. Student Matching

Primary matching strategy:

```text id="4utw3y"
Imported Student Identifier
        ↓
Student Identifier
        ↓
Exact Match
```

If no match exists:

```text id="p7g0hf"
UNKNOWN_STUDENT
```

The record proceeds to validation/review.

---

# 41. Name as Secondary Evidence

Student name may be used to detect discrepancies.

Example:

```text id="p4h8n1"
Registration Number → Match
Name → Different
```

This should not automatically create a second student.

It should be handled according to Result Validation rules.

---

# 42. Subject Matching

Primary strategy:

```text id="wqcb6q"
Imported Subject Code
        ↓
Academic Subject Code
        ↓
Exact Match
```

If no subject exists:

```text id="6rpl8g"
UNKNOWN_SUBJECT
```

---

# 43. Subject Name

Subject name can be used as supporting information.

It should not silently replace subject code matching.

Example:

```text id="8q5j6f"
Code Match
+
Name Difference
```

may produce a warning rather than automatically changing subject identity.

---

# 44. Course Matching

Course context may come from:

- configured import metadata
- mapped source column
- academic structure
- approved result-release context

The system must not guess a course solely from a vague filename.

---

# 45. Semester Matching

Semester may come from:

- import metadata
- source column
- configured result context

The system should validate the resulting semester against the student's course and academic structure.

---

# 46. Academic Context Validation

A normalized record should ultimately resolve to a consistent academic context:

```text id="x0c8x4"
College
   ↓
Course
   ↓
Semester
   ↓
Subject
```

Any broken relationship should be flagged before processing.

---

# 47. Duplicate Detection

Duplicate identity is conceptually based on:

```text id="4j5v4m"
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

The exact uniqueness model must follow the Result Processing specification.

---

# 48. Duplicate Types

The importer should distinguish:

### File Duplicate

Same file uploaded again.

### Row Duplicate

Same logical record appears multiple times in one file.

### Historical Duplicate

A record conflicts with an existing imported/processed record.

These cases may require different handling.

---

# 49. Duplicate Handling

The system must not silently overwrite an existing academic result.

Potential outcomes:

```text id="4yup3x"
Duplicate
Warning
Review Required
Rejected
```

The exact behavior belongs to Result Validation/Processing.

---

# 50. Attempt Information

Result files may contain:

- regular attempt
- supplementary attempt
- revaluation
- improvement
- repeat

The importer should preserve attempt information when available.

It must not flatten multiple attempts into one record.

---

# 51. Result Outcome Fields

Potential source fields:

```text id="vl5r7n"
marks
grade
gradePoint
credits
result
pass/fail
```

The importer should normalize values without deciding university-specific calculation rules.

---

# 52. Grade Handling

The importer may store a source grade such as:

```text id="5o1h2q"
A
B+
O
F
```

But it must not assume universal grade-point meanings.

Grade mapping belongs to the appropriate academic configuration/result-processing logic.

---

# 53. Marks Handling

Marks should be parsed according to the configured source structure.

Avoid silently converting invalid values.

Examples of suspicious values:

```text id="3n0q9h"
N/A
AB
Absent
--
```

These may represent valid university outcomes rather than numeric marks.

They must be normalized carefully.

---

# 54. Absent/Fail Handling

Values such as:

```text id="u8v6a4"
ABSENT
FAIL
F
AB
```

must not automatically be treated as numeric zero.

The semantic meaning belongs to result validation and academic rules.

---

# 55. Missing Values

Missing data must remain distinguishable from zero.

For example:

```text id="g5j9sl"
missing marks ≠ 0 marks
```

The importer must preserve this distinction.

---

# 56. Import Errors

Errors should be associated with:

- import job
- row
- field
- error code
- human-readable message

Example:

```json id="p84yjy"
{
  "row": 42,
  "field": "registrationNumber",
  "code": "STUDENT_NOT_FOUND",
  "message": "No matching student was found."
}
```

---

# 57. Warning vs Error

The import pipeline should distinguish:

```text id="4g3r8p"
Error
```

from:

```text id="p7q4nl"
Warning
```

An error should generally prevent a record from being safely processed.

A warning may allow review and controlled continuation.

---

# 58. Record Validation Status

The approved validation status model is:

```text id="y7q7op"
PENDING
VALID
INVALID
WARNING
```

This is separate from the overall import job status.

---

# 59. Import-Level Summary

The import job should maintain summary information such as:

```text id="bq4z91"
Total Records
Valid Records
Invalid Records
Warning Records
Unknown Students
Unknown Subjects
Duplicate Records
Processed Records
```

Only fields supported by the final schema should be persisted.

---

# 60. Preview

The frontend should allow users to preview imported records before processing.

Conceptually:

```text id="d5k1m2"
Upload
 ↓
Parse
 ↓
Normalize
 ↓
Preview
 ↓
Validate
 ↓
Review
 ↓
Process
```

Preview must not modify authoritative academic records.

---

# 61. Preview API

The existing record endpoint can support preview:

```text id="n5x4pf"
GET /api/v1/result-imports/{importId}/records
```

with pagination and filtering.

Additional preview endpoints may be added only if required.

---

# 62. Validation Handoff

After import preparation:

```text id="c4c7jf"
Imported Records
      ↓
Result Validation
```

Result Import should invoke or expose the appropriate validation workflow.

The validation module owns validation decisions.

---

# 63. Import vs Validation Boundary

Result Import answers:

> What did the source file contain, and can we normalize it?

Result Validation answers:

> Is this normalized record acceptable under the application's academic/data rules?

This distinction must remain clear.

---

# 64. Import vs Processing Boundary

Result Import must not directly:

- create final result records
- calculate final CGPA
- create backlogs
- update Academic Passport
- update analytics

Those are downstream responsibilities.

---

# 65. Import Processing Service

The service layer may coordinate:

```text id="3a1h8h"
File Validation
Parsing
Normalization
Matching
Import Persistence
Status Updates
```

It must not contain the complete result-processing domain logic.

---

# 66. Parser Service

Potential structure:

```text id="g0g7j3"
ResultImportService
       ↓
ResultFileParser
       ↓
Normalizer
       ↓
StudentMatcher
       ↓
SubjectMatcher
       ↓
ImportedRecordRepository
```

The exact decomposition may change during implementation.

---

# 67. Background Job

For large files:

```text id="2q6w2d"
Upload
 ↓
Import Job
 ↓
Queue/Scheduler
 ↓
Worker
 ↓
Parse
 ↓
Persist
```

The worker must update job status safely.

---

# 68. Job Failure

If processing fails unexpectedly:

```text id="4zv8f0"
PARSING
   ↓
FAILED
```

The import should retain enough information to diagnose the failure.

Avoid deleting the job automatically.

---

# 69. Retry

Retries may be supported for transient failures.

However, retries must be idempotent.

A retry must not create duplicate imported records.

---

# 70. Idempotency

Import processing should use stable identifiers such as:

```text id="1s1yn4"
importId
rowNumber
```

combined with appropriate record identity.

The exact idempotency key must be finalized during implementation.

---

# 71. Partial Success

A file may contain:

```text id="7h2xwl"
900 valid records
50 invalid records
20 warnings
```

The system should preserve record-level outcomes.

One invalid row should not automatically erase all valid imported information.

---

# 72. Reprocessing

A failed or corrected import may require reprocessing.

Potential endpoint:

```text id="3g6v8a"
POST /api/v1/result-imports/{importId}/reprocess
```

This endpoint should only be introduced if the final workflow requires it.

---

# 73. Cancellation

Long-running imports may support:

```text id="0f6b3n"
POST /api/v1/result-imports/{importId}/cancel
```

Cancellation must be safe and idempotent.

The final API should be added only if background processing requires user cancellation.

---

# 74. Import History

Authorized users should be able to view previous imports for their college.

History provides:

- traceability
- operational debugging
- duplicate investigation
- audit support
- reprocessing context

---

# 75. Import History Isolation

College A users must never see College B import history.

The API must apply tenant filtering server-side.

---

# 76. Import Audit

Important events include:

```text id="7f2yq3"
RESULT_IMPORT_CREATED
RESULT_IMPORT_STARTED
RESULT_IMPORT_PARSED
RESULT_IMPORT_VALIDATED
RESULT_IMPORT_COMPLETED
RESULT_IMPORT_FAILED
RESULT_IMPORT_CANCELLED
```

The final audit taxonomy should be standardized.

---

# 77. Security — File Upload

File uploads are an attack surface.

The system must consider:

- file type validation
- file size limits
- filename sanitization
- storage isolation
- malicious file content
- parser vulnerabilities
- resource exhaustion
- authorization
- tenant isolation

---

# 78. Parser Resource Protection

A malicious spreadsheet can consume excessive memory or CPU.

The implementation should use:

- configurable size limits
- bounded processing
- safe parser configuration
- background execution for large files
- operational timeouts where appropriate

---

# 79. File Storage Security

Uploaded files should not automatically become publicly accessible.

Storage references must be protected.

If files are later downloadable, access must be authorized.

---

# 80. Sensitive Result Data

University result files may contain sensitive student information.

Therefore:

- access must be role-controlled
- files must not be publicly exposed
- logs must not contain complete student records
- raw file content should not be logged
- APIs should return only required fields

---

# 81. Logging

Do not log:

```text id="lq8kpd"
entire uploaded file
entire student result row
full personal information
```

Log safe operational information such as:

```text id="f1dbk3"
importId
collegeId
status
row count
error code
duration
```

---

# 82. Error Logging

Unexpected exceptions should include:

- correlation ID
- import ID
- operation
- technical exception internally

The user-facing message should remain safe and actionable.

---

# 83. Correlation ID

Long-running import operations should be traceable through a correlation/request identifier.

Conceptually:

```text id="ojb5ex"
HTTP Request
    ↓
Correlation ID
    ↓
Import Job
    ↓
Worker Logs
```

---

# 84. Database Transactions

Do not hold one massive database transaction open for an entire large file.

Prefer bounded processing units.

For example:

```text id="2o4ryh"
File
 ↓
Batch 1
 ↓
Batch 2
 ↓
Batch 3
```

The exact batch size must be benchmarked.

---

# 85. Batch Processing

Large imports should use controlled batches.

Benefits:

- reduced memory usage
- shorter transactions
- easier recovery
- better progress reporting
- reduced lock duration

---

# 86. Database Performance

Important indexes may include:

```text id="1c2k5p"
import_id
row_number
student identifier references
subject references
validation status
```

The exact indexes should be based on actual queries.

---

# 87. Import Record Persistence

Imported records should remain separate from authoritative result records.

Conceptually:

```text id="7lrx8d"
imported_result_records
        ↓
validation
        ↓
processed_result_records
```

Do not use one table for both stages if doing so compromises lifecycle clarity.

---

# 88. Result Source Preservation

Where required, processed results should retain a reference to their source import.

This enables:

```text id="8x6a9s"
Processed Result
    ↓
Source Import
    ↓
Source File
```

This improves auditability.

---

# 89. Frontend Result Import Route

The approved route is:

```text id="s6j6h1"
/app/results/import
```

Import details:

```text id="k4zv4w"
/app/results/import/:importId
```

Validation:

```text id="3yqf43"
/app/results/import/:importId/validation
```

Records:

```text id="6i3qrr"
/app/results/import/:importId/records
```

Processing:

```text id="e1z0z9"
/app/results/import/:importId/processing
```

---

# 90. Upload Page

The upload page should contain:

- file upload control
- supported format guidance
- maximum size guidance
- optional metadata fields
- upload action
- validation feedback

Do not expose internal processing details unnecessarily.

---

# 91. Upload Component

The upload UI should support:

- drag and drop where useful
- file picker
- selected-file preview
- file size display
- file type validation
- remove/replace selection
- upload progress where applicable

---

# 92. Upload Progress

For large uploads, display:

```text id="q8y8ul"
Uploading...
```

After upload:

```text id="1r2r5u"
Parsing...
```

Then:

```text id="zz42yh"
Ready for Review
```

The UI should not confuse upload progress with processing progress.

---

# 93. Import Detail Page

The detail page should show:

```text id="j8tr0e"
Import Status
File Information
Created By
Created At
Record Summary
Errors
Warnings
Actions
```

---

# 94. Import Summary UI

Possible summary cards:

```text id="dbdb7r"
Total
Valid
Warnings
Invalid
Unknown Students
Unknown Subjects
Duplicates
```

Only metrics actually available from the backend should be displayed.

---

# 95. Record Review Table

The record review UI should show relevant fields such as:

```text id="q0khqg"
Row
Student
Registration Number
Subject
Subject Code
Semester
Result
Validation Status
Issue
```

The table must be responsive.

---

# 96. Record Filtering

Allow useful filters such as:

```text id="r4j6g4"
Validation Status
Student Match
Subject Match
Error Type
```

Do not add excessive filters without demonstrated need.

---

# 97. Import State Polling

If processing is asynchronous, the frontend may poll the import status.

Conceptually:

```text id="3okz8k"
GET /result-imports/{id}
       ↓
Status changed?
       ↓
Continue / Stop
```

Polling frequency must be bounded.

---

# 98. Server State

Use TanStack Query for:

- import list
- import detail
- import records
- import mutations
- processing status

Avoid duplicating server state in Zustand.

---

# 99. Import API Client

Centralize import APIs:

```text id="q3i7f8"
resultImportApi.create()
resultImportApi.list()
resultImportApi.getById()
resultImportApi.getRecords()
resultImportApi.reprocess()
resultImportApi.cancel()
```

Only expose methods that are actually implemented.

---

# 100. Frontend Error Handling

The frontend should distinguish:

```text id="3n0j6d"
Unsupported file
File too large
Unauthorized
Forbidden
Validation error
Import conflict
Processing failure
Network error
```

Each should have an actionable message where possible.

---

# 101. Accessibility

Result Import must support:

- keyboard file selection
- accessible labels
- accessible upload status
- visible focus
- accessible tables
- accessible status indicators
- screen-reader-friendly errors
- no color-only status communication

---

# 102. Import Security Tests

Test:

```text id="b4tq3v"
Unauthorized upload
Cross-tenant import access
Invalid extension
Invalid MIME type
Oversized file
Empty file
Malformed Excel
Malformed CSV
Path traversal filename
Duplicate upload
```

---

# 103. Parsing Tests

Use representative fixture files covering:

```text id="8p6x2a"
Standard Excel
Standard CSV
Blank rows
Title rows
Different headers
Missing columns
Extra columns
Numeric cells
Text cells
Empty cells
Special characters
Encoding variations
```

---

# 104. Matching Tests

Test:

```text id="6x7j6y"
Exact student match
Unknown student
Student name mismatch
Exact subject match
Unknown subject
Subject name mismatch
Course mismatch
Semester mismatch
Cross-tenant reference
```

---

# 105. Duplicate Tests

Test:

```text id="4k6l9p"
Same file twice
Duplicate row
Duplicate logical record
Existing historical record
Multiple attempts
```

The expected outcome must follow the approved validation/processing rules.

---

# 106. Large File Tests

Test imports with representative large datasets to verify:

- memory usage
- processing duration
- batch behavior
- progress tracking
- transaction behavior
- retry behavior
- database performance

---

# 107. End-to-End Import Workflow

The complete workflow should verify:

```text id="1g0f2k"
Authorized User
      ↓
Upload University Result
      ↓
Import Job Created
      ↓
File Parsed
      ↓
Records Normalized
      ↓
Students Matched
      ↓
Subjects Matched
      ↓
Academic Context Verified
      ↓
Import Ready for Review
      ↓
Validation
      ↓
Processing
```

Result Processing owns the final academic record mutation.

---

# 108. Acceptance Criteria

Result Import is acceptable when:

### Upload

- [ ] Authorized users can upload supported files.
- [ ] Unsupported files are rejected.
- [ ] File size limits are enforced.
- [ ] Files are stored securely.
- [ ] Import jobs are created.

### Parsing

- [ ] Excel files can be parsed.
- [ ] CSV files can be parsed.
- [ ] Header mapping works.
- [ ] Normalization works.
- [ ] Source row traceability is preserved.

### Matching

- [ ] Students are matched by official identifier.
- [ ] Unknown students are flagged.
- [ ] Subjects are matched by subject code.
- [ ] Unknown subjects are flagged.
- [ ] Academic context is checked.
- [ ] Cross-tenant matches are impossible.

### Duplicates

- [ ] Duplicate uploads can be identified.
- [ ] Duplicate rows are detected.
- [ ] Logical duplicate result records are not silently overwritten.
- [ ] Multiple attempts are preserved.

### Workflow

- [ ] Import status is tracked.
- [ ] Large imports can run asynchronously where required.
- [ ] Import records can be reviewed.
- [ ] Validation can consume normalized records.
- [ ] Result Import does not directly mutate authoritative results.

### Security

- [ ] Tenant isolation is enforced.
- [ ] File storage is protected.
- [ ] Sensitive result data is not logged.
- [ ] IDOR attempts fail.
- [ ] Upload authorization is enforced.

---

# 109. Definition of Done

Result Import is considered implemented when:

1. File upload is operational.
2. Supported file types are validated.
3. File size limits are enforced.
4. Import jobs are persisted.
5. Excel parsing works.
6. CSV parsing works.
7. Header mapping works.
8. Normalization works.
9. Student matching works.
10. Subject matching works.
11. Academic context matching works.
12. Duplicate detection works.
13. Import record persistence works.
14. Import statuses work.
15. Preview works.
16. Validation handoff works.
17. Tenant isolation tests pass.
18. File security tests pass.
19. Parsing tests pass.
20. Matching tests pass.
21. Duplicate tests pass.
22. Large-file tests pass.
23. Frontend import workflow works.
24. Audit events work.
25. End-to-end import workflow passes.
26. Security review passes.
27. No critical data-integrity defect remains.

---

# 110. Unresolved Implementation Decisions

The following require review:

- exact maximum file size
- production file storage provider
- exact supported Excel versions
- exact CSV encoding support
- exact header-mapping strategy
- manual mapping UI requirements
- background job technology
- batch size
- retry strategy
- cancellation support
- duplicate upload policy
- exact import metadata fields
- raw source-data retention period
- import file retention policy
- exact student name mismatch severity
- exact subject name mismatch severity
- course/semester inference rules
- result-release representation
- attempt-type representation
- reprocessing workflow

---

# 111. Relationship With Other Documents

This document depends on:

```text id="w6ypm8"
03-prd/functional-requirements.md
03-prd/non-functional-requirements.md

05-architecture/system-architecture.md
05-architecture/backend-architecture.md
05-architecture/database-architecture.md
05-architecture/api-architecture.md
05-architecture/data-ownership.md
05-architecture/integration-architecture.md

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

09-development/implementation-notes/project-setup.md
09-development/implementation-notes/backend-foundation.md
09-development/implementation-notes/authentication-implementation.md
09-development/implementation-notes/college-management-implementation.md
09-development/implementation-notes/academic-structure-implementation.md
09-development/implementation-notes/student-management-implementation.md
```

It provides the foundation for:

```text id="bqwwf1"
result-validation-implementation.md
result-processing-implementation.md
backlog-implementation.md
academic-passport-implementation.md
analytics-implementation.md
student-portal-implementation.md
```

---

# 112. AI-Assisted Development Rules

AI coding assistants implementing Result Import must:

- read the Result Import feature specification first
- read Result Validation and Result Processing boundaries
- never directly create authoritative academic results
- never silently create students
- never silently create subjects
- never use student name as the primary identity key
- never use subject name as the primary subject identifier
- preserve source-row traceability
- preserve multiple attempts
- distinguish missing values from zero
- never invent university-specific grading rules
- enforce tenant isolation
- validate uploaded files server-side
- never trust filenames or MIME types alone
- never log complete result files
- use bounded batch processing for large files
- preserve idempotency
- write tests for malformed files and cross-tenant access
- flag unresolved mapping rules instead of guessing

AI-generated import logic must not silently transform external data into authoritative academic data.

---

# 113. Review Checklist

Before moving this document to `Approved`:

```text id="w2a3lc"
□ Upload boundary is clear
□ Import ownership is clear
□ Validation boundary is clear
□ Processing boundary is clear
□ Supported formats are defined
□ File security is defined
□ Storage strategy is identified
□ Import status model is defined
□ Student matching is defined
□ Subject matching is defined
□ Duplicate strategy is defined
□ Attempt handling is preserved
□ Academic context validation is defined
□ Tenant isolation is explicit
□ Async processing requirements are defined
□ Frontend workflow is defined
□ Testing strategy is defined
□ Unresolved decisions are documented
```

---

# 114. Status

**Draft / Under Review**

This document is not yet implementation-approved.

Lifecycle:

```text id="u7s3f4"
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

# 115. Final Result Import Principle

> **Result Import is an ingestion boundary, not an academic truth engine.**

The implementation must preserve:

```text id="9q5t2e"
University File
      ↓
Safe Upload
      ↓
Import Job
      ↓
Parse
      ↓
Normalize
      ↓
Match
      ↓
Traceable Imported Records
      ↓
Validation
      ↓
Processing
```

External result data must remain untrusted until it passes the appropriate validation and processing boundaries.