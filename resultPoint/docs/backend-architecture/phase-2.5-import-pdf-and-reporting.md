# ResultPoint Backend — Phase 2.5 Architecture Documentation
## External Data Import, PDF Generation & Academic Reporting Engine

---

## 1. Executive Summary & Approval Baseline

- **Phase 2.4 Status:** Approved by Project Owner based on 119/119 passing tests and completed student academic history, results snapshotting, and backlog tracking.
- **Phase 2.5 Scope:** External Data Import (curriculum subjects & regulations via JSON and CSV), In-Memory PDF Generation Engine (Scorecards, Transcripts, Progress Reports), and Academic Reporting Engine (Performance Trends, Backlog Risk, Target CGPA Projections, Catalog Summary).
- **Subsequent Phases:** Phase 2.6 and subsequent phases **have not been started** and remain strictly gated pending official owner authorization.

---

## 2. Configured Tool Usage Audit (Section 2 Compliance)

| Tool | Status | Usage in Phase 2.5 | Findings & Contribution |
| :--- | :--- | :--- | :--- |
| **Context7** | **Available & Actually Used** | Queried live documentation for OpenPDF (`/librepdf/openpdf`) | Retrieved current, version-accurate APIs for OpenPDF 2.0.3: `com.lowagie.text.Document`, `com.lowagie.text.pdf.PdfWriter`, `com.lowagie.text.pdf.PdfPTable`, `PdfPageEventHelper` for page numbering and in-memory byte streaming. Avoided outdated iText 2.x patterns. |
| **Playwright CLI** | **Available but Not Applicable** | Inspected available environment | Phase 2.5 introduces backend REST APIs, CSV upload multipart endpoints, and binary PDF byte streams (`application/pdf`). No frontend UI views or HTML templates were created. Playwright CLI is reserved for frontend browser E2E workflows once UI is implemented. |
| **Strix** | **Unavailable** | Tested command availability in PATH | Strix executable was not located in PATH. In-scope application security validation was conducted programmatically using Spring Security MockMvc integration tests (verifying non-admin 403 Forbidden, anonymous 401 Unauthorized, payload size limits, and CSV injection resistance). |
| **Skill UI** | **Design Guidelines Applied** | Consulted ResultPoint Design System token guidelines (`resultpoint-design-system` skill) | Derived official ResultPoint color tokens and typography hierarchy directly into PDF document palettes: Primary Navy (`#1E3A8A`), Secondary Slate Blue (`#3B82F6`), Light Neutral Background (`#F1F5F9`), Dark Slate Text (`#0F172A`), Status Green (`#16A34A`), and Danger Red (`#DC2626`). |
| **Supabase AI Tools Plugin** | **Explicitly NOT APPLICABLE** | Inspected architecture requirements | The ResultPoint backend operates exclusively on MySQL 8.4 and Spring Data JPA. No Supabase requirement or dependency exists. Supabase migration was avoided to preserve existing local database architecture. |

---

## 3. Phase 2.5A: External Data Import Engine

### 3.1 Supported Sources & Input Formats

The catalog import engine supports administrative ingestion of academic curriculum subjects and institutional regulations:

1. **JSON Format (`POST /api/v1/catalog/import/subjects`):**
   ```json
   {
     "regulationId": "reg_ou_bca_cbcs",
     "semesterNumber": 3,
     "subjects": [
       {
         "subjectCode": "BCA301",
         "subjectName": "Software Engineering",
         "credits": 4.0,
         "subjectType": "THEORY",
         "isElective": false,
         "displayOrder": 1,
         "department": "Computer Science"
       }
     ]
   }
   ```

2. **CSV Format (`POST /api/v1/catalog/import/subjects/csv`):**
   - Content-Type: `multipart/form-data`
   - Form Parameters: `file` (CSV file), `regulationId` (String), `semesterNumber` (int)
   - CSV Header Format: `subject_code,subject_name,credits,subject_type` (Optional: `is_elective,display_order,department`)
   - Maximum File Size: **5 MB** (enforced in memory buffer)
   - Character Encoding: Standard UTF-8

3. **Regulation Ingestion (`POST /api/v1/catalog/import/regulations`):**
   - Admin ingestion of new academic regulation definitions with foreign-key referential integrity checks (verifies `courseId`, `gradingScaleId`, and `calculationRuleId` prior to persistence).

### 3.2 Data Integrity & Immutability Protection

- **Protected Baseline Regulation Guard:** An immutable blocklist strictly prevents any import operation from mutating or overwriting verified statutory regulations:
  - `reg_ou_bca_cbcs` (Osmania University BCA CBCS)
  - `reg_ou_mca_cbcs` (Osmania University MCA CBCS)
  - `reg_jntuh_r18` (JNTUH B.Tech R18 Regulation)
- **Validation Rules:**
  - `subjectCode`: Required, non-blank, sanitized to upper-case alphanumeric string.
  - `subjectName`: Required, trimmed string.
  - `credits`: Required, strictly minimum 0.5 credits.
  - `semesterNumber`: Must fall within course duration range.
- **Diagnostics Reporting (`DataImportReport`):**
  - Returns `totalRecords`, `acceptedCount`, `rejectedCount`, `skippedCount`, `duplicateCount`, and `status` (`SUCCESS`, `PARTIAL_SUCCESS`, `FAILED`).
  - Itemized error collection detailing line number, record identifier, and validation failure reason.

---

## 4. Phase 2.5B: PDF Generation Engine

### 4.1 In-Memory Byte Streaming Architecture

- **Library:** `com.github.librepdf:openpdf:2.0.3` (Open-source, LGPL/MPL compliant, maintained).
- **Security & Zero Disk Footprint:** PDF generation streams directly from JPA entities through `ByteArrayOutputStream` into HTTP response body. Zero temporary files are written to the host filesystem, eliminating directory traversal and insecure file deletion vulnerabilities.
- **HTTP Streaming Headers:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="semester-N-scorecard.pdf"`
  - `Content-Length: <byte_count>`

### 4.2 Generated Document Specifications

1. **Semester Scorecard PDF (`GET /api/v1/student/results/{semesterNumber}/pdf`):**
   - **Header:** Institutional identity, report title, student name, hall ticket number, course, regulation, and academic session.
   - **Performance Table:** Subject code, subject title, credits, marks breakdown (internal/external/total), grade letter, grade points, and result status (PASS/FAIL).
   - **Summary Strip:** Semester SGPA, Cumulative CGPA, Credits Attempted, and Credits Earned.
   - **Statutory Notice:** Highlights frozen calculation snapshot metadata (`rule_version_snapshot`), preserves the Osmania University `S — Super` top grade ($10.0$ GP, $\ge 85\%$), and explicitly displays statutory transparency warnings for unverified conversion formulas ($\text{CGPA} \times 10$).

2. **Consolidated Academic Transcript PDF (`GET /api/v1/student/results/history/pdf`):**
   - Multi-semester chronological progression table.
   - Overall cumulative CGPA, total credits earned, and completion status.
   - Active and cleared backlog summary audit table.

3. **Academic Goals & Progress Report PDF (`GET /api/v1/student/goals/report/pdf`):**
   - Current standing vs target CGPA comparison.
   - Required average SGPA per remaining semester.
   - Feasibility indicator (`ACHIEVABLE`, `STRETCH_GOAL`, `UNREALISTIC`).

---

## 5. Phase 2.5C: Academic Reporting Engine

### 5.1 Reporting Capabilities & Endpoints

| Endpoint | Role | Description | Core Metrics Provided |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/student/reports/performance` | `STUDENT` | Semester-wise performance trends | Cumulative CGPA, estimated percentage, verification status, total attempted/earned credits, pass/fail counts, and semester trend array. |
| `GET /api/v1/student/reports/backlogs` | `STUDENT` | Academic risk & backlog evaluation | Total recorded backlogs, active count, cleared count, total academic credits at risk, and subject-level clearance details. |
| `GET /api/v1/student/reports/projections` | `STUDENT` | Target CGPA forecasting | Current CGPA, earned credits, current semester, remaining semesters, and goal feasibility projections via calculation engine. |
| `GET /api/v1/admin/reports/catalog-summary` | `ADMIN` | Catalog overview & governance | Total counts of universities, courses, regulations, subjects, university breakdowns, and regulation verification audit list. |

### 5.2 Calculation Engine Reuse & Transparency

- All reporting metrics reuse `AcademicCalculationEngine` and `CalculationService`.
- No duplicated rounding logic or separate formula implementations.
- Osmania University percentage calculation is strictly output with verification status `UNVERIFIED` and clear explanatory notes:
  - *"Institutional convention (CGPA * 10). Osmania University does not publish a statutory percentage formula on official marks cards."*

---

## 6. Security & Authorization Matrix

| Resource Path | HTTP Method | Required Role | Access Rule |
| :--- | :--- | :--- | :--- |
| `/api/v1/catalog/import/subjects` | POST | `ROLE_ADMIN` | Authenticated Admin only. Non-admin returns 403 Forbidden. |
| `/api/v1/catalog/import/subjects/csv` | POST | `ROLE_ADMIN` | Authenticated Admin only. 5MB file upload limit. |
| `/api/v1/catalog/import/regulations` | POST | `ROLE_ADMIN` | Authenticated Admin only. Baseline regulations immutable. |
| `/api/v1/student/results/{sem}/pdf` | GET | `ROLE_STUDENT` | Owner only via `UserPrincipal.getId()`. Cross-student access isolated. |
| `/api/v1/student/results/history/pdf` | GET | `ROLE_STUDENT` | Owner only via `UserPrincipal.getId()`. Cross-student access isolated. |
| `/api/v1/student/goals/report/pdf` | GET | `ROLE_STUDENT` | Owner only via `UserPrincipal.getId()`. Cross-student access isolated. |
| `/api/v1/student/reports/performance` | GET | `ROLE_STUDENT` | Owner only. Evaluates authenticated student's results. |
| `/api/v1/student/reports/backlogs` | GET | `ROLE_STUDENT` | Owner only. Evaluates authenticated student's backlogs. |
| `/api/v1/student/reports/projections` | GET | `ROLE_STUDENT` | Owner only. Forecasts future SGPA for student's goals. |
| `/api/v1/admin/reports/catalog-summary` | GET | `ROLE_ADMIN` | Admin only. Students receive 403 Forbidden. |

---

## 7. Database Safety & Migrations

- **Database Engine:** MySQL 8.4 Community Server (Docker container `resultpoint-mysql`).
- **Flyway Migrations:** Existing Phase 1 Flyway migrations (`V1__baseline_schema.sql` through `V4__system_settings_and_audit.sql`) remain completely untouched.
- **Schema Impact:** Zero new Flyway migrations required. Phase 1 schema already contains all necessary catalog entities (`subjects`, `regulation_subjects`, `regulations`), student results (`semester_results`, `subject_results`), and backlog records (`student_backlogs`).
- **In-Memory Volatility:** In-memory PDF streaming avoided creating temporary disk or database tables for generated artifacts.

---

## 8. Verification & Test Execution Results

The automated regression test suite was executed against the active MySQL 8.4 database:

```
[INFO] Results:
[INFO] Tests run: 133, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time: 43.860 s
```

### Breakdown by Test Suite:
1. `ImportExportReportingIntegrationTest`: **14/14 passed** (Phase 2.5 new tests)
   - `testBatchImportSubjects_ValidJson_AdminAuthorized`: PASSED
   - `testBatchImportSubjects_ValidCsv_AdminAuthorized`: PASSED
   - `testBatchImportSubjects_MalformedCsv_ReportsErrors`: PASSED
   - `testImportProtectedRegulation_Blocked`: PASSED
   - `testCatalogImport_NonAdmin_Forbidden`: PASSED
   - `testDownloadSemesterScorecardPdf_Success`: PASSED
   - `testDownloadAcademicTranscriptPdf_Success`: PASSED
   - `testDownloadGoalsReportPdf_Success`: PASSED
   - `testDownloadPdf_Unauthenticated_Rejected`: PASSED
   - `testGetPerformanceReport_Success`: PASSED
   - `testGetBacklogReport_Success`: PASSED
   - `testGetProjectionReport_Success`: PASSED
   - `testGetCatalogSummaryReport_AdminAuthorized`: PASSED
   - `testGetCatalogSummaryReport_StudentForbidden`: PASSED
2. `StudentIntegrationTest`: **17/17 passed** (Phase 2.4 regression)
3. `AcademicCalculationEngineTest`: **40/40 passed** (Phase 2.3 calculation regression)
4. `CalculationIntegrationTest`: **14/14 passed** (Phase 2.3 API regression)
5. `CatalogIntegrationTest`: **11/11 passed** (Phase 2.3 catalog regression)
6. `AuthIntegrationTest`: **13/13 passed** (Phase 2.2 authentication regression)
7. `Phase2SecurityVerificationTest`: **6/6 passed** (Phase 2.2 concurrency & token security)
8. `SecurityFoundationIntegrationTest`: **5/5 passed** (Phase 2.1 security foundation)
9. `JwtTokenProviderTest`: **3/3 passed** (Phase 2.1 JWT validation)
10. `FlywayParserTest`: **4/4 passed** (Phase 1 migration validation)
11. `Phase1MigrationValidationTest`: **3/3 passed** (Phase 1 database baseline)
12. `Phase1ExecutionSuiteTest`: **1/1 passed** (Phase 1 seed data validation)
13. `ProductionConfigValidationTest`: **1/1 passed** (Production fail-safe checks)
14. `FormulaEvaluatorTest`: **1/1 passed** (Arithmetic formula engine)

---

## 9. Phase Boundary Statement

**Phase 2.5 is fully complete and verified with 133/133 passing automated tests. Phase 2.6 has not been started and will not be initiated without explicit approval.**
