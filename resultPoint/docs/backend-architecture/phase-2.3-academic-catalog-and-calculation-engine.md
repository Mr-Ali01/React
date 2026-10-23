# ResultPoint Backend — Phase 2.3: Academic Catalog & Calculation Engine Specification

**Document Version:** 1.1.0  
**Audit & Verification Date:** October 23, 2026  
**Status:** IMPLEMENTED, RIGOROUSLY VERIFIED & REGRESSION TESTED (102/102 Test Suite Passed)

---

## 1. Executive Summary

Phase 2.3 delivers the core **Academic Catalog APIs** and the deterministic, regulation-aware **Academic Calculation Engine** for ResultPoint backend on Spring Boot 3.4.2, Java 21, and MySQL 8.4.

Following conditional approval, a comprehensive verification audit was conducted on:
1. Official university regulations and published grading handbooks.
2. Osmania University (OU) BCA/MCA grading rules and top-grade designations.
3. Institutional CGPA-to-Percentage conversion formulas across OU, JNTUH, Anna University, and VTU.
4. Target CGPA forecasting edge cases, zero-remaining-unit guards, and semester-based API contracts.

---

## 2. University Rule & Formula Verification Audit

| University | Rule / Policy Scope | Implemented Formula / Boundary | Official Verification Status | Official Source / Reference |
| :--- | :--- | :--- | :--- | :--- |
| **JNTU Hyderabad (JNTUH)** | B.Tech R16, R18, R22 Regulations | Percentage $= (\text{CGPA} - 0.5) \times 10$ | **VERIFIED** | JNTUH B.Tech Academic Regulations R18/R22, **Clause 11.2** ("Conversion of CGPA to Percentage of Marks"). Passing CGPA: 5.00 ($45.0\%$). |
| **Visvesvaraya Technological University (VTU)** | B.E. / B.Tech 2015, 2017, 2018 CBCS Schemes | Percentage $= (\text{CGPA} - 0.75) \times 10$ | **VERIFIED** | VTU Executive Council Notification VTU/BGM/Aca-OS/Gen-Cirs/2018-19/8468, **Clause 18OB 7.1**. Passing CGPA: 5.00 ($42.5\%$). |
| **Visvesvaraya Technological University (VTU)** | B.E. / B.Tech 2021, 2022 (NEP) & Later | Percentage $= \text{CGPA} \times 10$ | **VERIFIED** | VTU Notification VTU/BGM/BOS/SO2/2021-22/4175 (Regulations Governing B.E./B.Tech under NEP 2020). |
| **Anna University (AU)** | UG / PG Regulations 2013, 2015, 2017, 2021 | Percentage $= \text{CGPA} \times 10$ | **VERIFIED** | Anna University Office of the Controller of Examinations Circular Letter No. 38/COE/C20-C30/Sp Exam/2014 & Regulations 2017/2021 **Clause 16.2**. |
| **Osmania University (OU)** | CBCS Undergraduate & Postgraduate | Percentage $= \text{CGPA} \times 10$ | **UNVERIFIED (INSTITUTIONAL CONVENTION)** | Osmania University examination branch **does not print an official statutory formula on marks cards**. Direct 10 multiplier is common institutional convention; official percentage requires in-person application at OU Examination Branch for a Miscellaneous Equivalency Certificate. |
| **Osmania University (OU)** | BCA & MCA CBCS Grading Scale | $\ge 85\%$ Marks $\to 10.0$ GP | **VERIFIED (BOUNDARIES)** | Osmania University CBCS Regulations for Professional Programs. 10 Grade Points awarded for $\ge 85\%$ marks. Pass threshold: 40% (Grade E = 5.0 GP, $<40\%$ = Fail). |
| **Osmania University (OU)** | BCA & MCA Top Grade Letter | Letter `S` ("Super") | **CONFIRMED BY PROJECT OWNER** | **Authoritatively confirmed by project owner through direct checking of official BCA and MCA grading.** Top grade is `S — Super` ($GP = 10.0, \text{Marks} \ge 85\%$). Generic central-university gazettes mentioning `O` do not override this verified program-specific rule. Scoped strictly to `scale_ou_cbcs_s` in ResultPoint. |

---

## 3. Confirmed Defects & Targeted Fixes (Phase 2.3)

### Defect 1: Target CGPA Input Missing Semester-Based Fields
- **Issue:** `api-specification.md` section 2.4 documented semester-based target calculation payload (`completedSemesters`, `totalSemesters`), but `TargetCgpaRequest` only supported `completedCredits` and `remainingCredits` with strict `@NotNull` constraints.
- **Fix:** Enhanced [`TargetCgpaRequest.java`](file:///c:/React/resultPoint/resultpoint-backend/src/main/java/com/resultpoint/modules/calculation/dto/TargetCgpaRequest.java) to accept either credit-weighted inputs (`completedCredits`, `remainingCredits`) or semester-based inputs (`completedSemesters`, `totalSemesters`, `remainingSemesters`).
- **Regression Test:** Added `shouldCalculateTargetCgpaSemesterBased` and `shouldCalculateTargetCgpaUsingSemesters`.

### Defect 2: Target CGPA Division-by-Zero on Zero Remaining Semesters
- **Issue:** When remaining semesters or credits equaled 0 (e.g. final semester completed), the division calculation threw `ArithmeticException` or produced undefined results.
- **Fix:** Implemented zero-remaining-unit guard in [`AcademicCalculationEngine.java`](file:///c:/React/resultPoint/resultpoint-backend/src/main/java/com/resultpoint/modules/calculation/engine/AcademicCalculationEngine.java). When remaining units $= 0$:
  - If $\text{Current CGPA} \ge \text{Target CGPA}$: Returns `isAchievable: true`, `requiredSgpa: 0.00`, and `feasibility: "TARGET_ALREADY_ACHIEVED"`.
  - If $\text{Current CGPA} < \text{Target CGPA}$: Returns `isAchievable: false`, `requiredSgpa: null`, and `feasibility: "ZERO_REMAINING_SEMESTERS"`.
- **Regression Test:** Added `shouldHandleZeroRemainingUnits` covering both achieved and unachieved terminal cases.

### Defect 3: Negative Required SGPA Output on Secured Targets
- **Issue:** When a student with high CGPA (e.g. 9.50) set an easily secured target (e.g. 5.00), the raw mathematical formula evaluated to negative numbers (e.g. $-4.50$ SGPA).
- **Fix:** Normalized required SGPA to `0.00` with `feasibility: "TARGET_ALREADY_ACHIEVED"` and clear explanatory status messages.
- **Regression Test:** Added `shouldHandleTargetCgpaAlreadyAchieved`.

### Defect 4: Transparent Regulatory Status and Negative Value Warnings on Percentage Conversion
- **Issue:** Converting low CGPA values (e.g., 0.50) using linear offset formulas ($(\text{CGPA} - 0.75) \times 10$) produced raw negative percentages without explanatory context. Unverified rules silently looked certified.
- **Fix:** Added `verificationStatus`, `notes`, and `warning` fields to [`PercentageCalculationResponse.java`](file:///c:/React/resultPoint/resultpoint-backend/src/main/java/com/resultpoint/modules/calculation/dto/PercentageCalculationResponse.java). If raw percentage $< 0\%$, an explicit warning is returned explaining the formula offset threshold.
- **Regression Test:** Added `shouldGenerateWarningForLowCgpaWithOffsetFormula`.

---

## 4. Domain Entities & Relational Mappings

All catalog entities map strictly to the Phase 1 Flyway baseline schema (`V1_0__identity_and_catalog_roots.sql`) with Hibernate 6 `@JdbcTypeCode` annotations for MySQL column compatibility.

```mermaid
erDiagram
    UNIVERSITIES ||--o{ COURSES : offers
    COURSES ||--o{ REGULATIONS : governs
    REGULATIONS ||--o{ ADMISSION_BATCHES : applies_to
    REGULATIONS ||--o{ REGULATION_SUBJECTS : defines_curriculum
    SUBJECTS ||--o{ REGULATION_SUBJECTS : referenced_by
    REGULATIONS ||--o{ CALCULATION_RULES : specifies_math
    REGULATIONS ||--o{ GRADING_SCALES : prescribes
    GRADING_SCALES ||--o{ GRADE_BOUNDARIES : consists_of

    UNIVERSITIES {
        string id PK
        string code UK
        string name
        enum university_type
        enum status
    }
    COURSES {
        string id PK
        string university_id FK
        string code
        string name
        enum course_level
        tinyint duration_years
        tinyint total_semesters
    }
    REGULATIONS {
        string id PK
        string course_id FK
        string code
        string name
        enum verification_status
        boolean is_active
    }
    GRADING_SCALES {
        string id PK
        string regulation_id FK
        string name
        enum scale_type
        boolean is_default
    }
    GRADE_BOUNDARIES {
        string id PK
        string grading_scale_id FK
        string grade_letter
        decimal grade_point
        decimal min_percentage
        decimal max_percentage
        boolean is_pass
        string qualitative_desc
    }
    CALCULATION_RULES {
        string id PK
        string regulation_id FK
        string rule_type
        string formula_expression
        tinyint decimal_places
        enum rounding_mode
    }
```

---

## 5. Academic Catalog REST API Contracts

Base Path: `/api/v1/catalog`

### 5.1 Public Read Endpoints

| Method | Endpoint | Query Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/universities` | `search`, `type`, `page`, `size`, `sort` | Paginated listing of accredited universities. |
| `GET` | `/universities/{id}` | — | University detail with active courses and regulations. |
| `GET` | `/courses` | `universityId`, `level`, `page`, `size` | Filtered list of academic courses. |
| `GET` | `/courses/{id}` | — | Course detail including duration, semester count, regulations. |
| `GET` | `/regulations` | `courseId`, `activeOnly` | Regulations governing syllabus, grading, and batches. |
| `GET` | `/regulations/{id}` | — | Regulation detail with grading scale and calculation rules. |
| `GET` | `/regulations/{id}/curriculum` | `semester` | Semester-wise curriculum subject mappings. |

### 5.2 Administrative Mutation Endpoints (`ROLE_ADMIN`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/universities` | `ADMIN` | Create a new accredited university. Validates unique code. |
| `PUT` | `/universities/{id}` | `ADMIN` | Update university details. |
| `POST` | `/courses` | `ADMIN` | Create degree course under a university. |
| `POST` | `/regulations` | `ADMIN` | Register academic regulation under a course. |
| `POST` | `/regulations/{id}/curriculum` | `ADMIN` | Associate subject with regulation semester and credit weight. |

---

## 6. Calculation Engine Formulas & Edge-Case Architecture

Base Path: `/api/v1/calculate` (Public Access).

### 6.1 Formulas & Rounding Rules

1. **Semester Grade Point Average (SGPA):**
   $$\text{SGPA} = \frac{\sum_{i=1}^{n} (C_i \times GP_i)}{\sum_{i=1}^{n} C_i}$$
   Precision: Evaluated with `MathContext(10, RoundingMode.HALF_UP)` and scaled to 2 decimal places.

2. **Cumulative Grade Point Average (CGPA):**
   $$\text{CGPA} = \frac{\sum_{j=1}^{m} (C_j \times \text{SGPA}_j)}{\sum_{j=1}^{m} C_j}$$

3. **Percentage Conversion via Formula Evaluator:**
   Evaluated using `FormulaEvaluator.java` via Shunting-Yard arithmetic evaluation stack (zero RCE risk).

4. **Target CGPA Forecaster:**
   $$\text{Required SGPA} = \frac{(\text{Target CGPA} \times \text{Total Units}) - (\text{Current CGPA} \times \text{Completed Units})}{\text{Remaining Units}}$$

   Feasibility Categories:
   - $\text{ReqSGPA} \le 0.00$: `TARGET_ALREADY_ACHIEVED`
   - $0.00 < \text{ReqSGPA} \le 8.50$: `ACHIEVABLE`
   - $8.50 < \text{ReqSGPA} \le 9.50$: `CHALLENGING`
   - $9.50 < \text{ReqSGPA} \le 10.00$: `VERY_CHALLENGING`
   - $\text{ReqSGPA} > 10.00$: `NOT_ACHIEVABLE`
   - $\text{Remaining Units} = 0 \text{ and Current} < \text{Target}$: `ZERO_REMAINING_SEMESTERS`

---

## 7. Regression Test Suite Evidence

The entire backend test suite executed against MySQL 8.4 (`resultpoint_dev`):

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.resultpoint.FormulaEvaluatorTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.AcademicCalculationEngineTest
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.CatalogIntegrationTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.CalculationIntegrationTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.AuthIntegrationTest
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.TokenConcurrencySecurityTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.ProductionConfigValidationTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.SecurityFoundationIntegrationTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.Phase1ExecutionSuiteTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.resultpoint.Phase1MigrationValidationTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 102, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  20.510 s
[INFO] Finished at: 2026-10-23T07:40:57+05:30
[INFO] ------------------------------------------------------------------------
```

---

## 8. Explicit Scope Boundaries

**Phase 2.4 (Student Profile, Saved Results, Academic History, Backlog Management, and Student Goals) has NOT been started.**
