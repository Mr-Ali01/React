# ResultPoint — Post-Audit Remediation Plan

> **Document Version:** 2.1.0  
> **Date:** 2026-10-22  
> **Status:** FRONTEND PHASES F-1 TO F-4 COMPLETE & VERIFIED; BACKEND SPECIFICATION AWAITING APPROVAL  
> **Scope:** Prioritized remediation specifications for all 18 consistency audit issues (I-01 to I-18). Frontend phases F-1 (Calculation Engine), F-2 (Route Reconciliation), F-3 (Route Registration & Placeholders), and F-4 (Standalone Calculators & Content Tools) have been fully implemented and verified (291 cumulative assertions passing). Backend database finalization and Spring Boot implementation remain pending formal owner approval.

---

## 1. Executive Summary & Epistemic Taxonomy

A comprehensive, read-only consistency audit was performed on ResultPoint's frontend tools/calculator registry, calculation engine, academic catalog, and the proposed Spring Boot + MySQL backend architecture documentation. The audit revealed **18 distinct architectural and code-level discrepancies** (3 High, 8 Medium, 7 Low).

Following the audit, the frontend codebase was stabilized across four sequential, approved phases (F-1 through F-4). The core calculation engine, routing architecture, tool registry, standalone calculators, and placeholder routes are now 100% reconciled in the active source code.

- `[CONFIRMED FACT]`: A mathematically or code-verified truth verified directly against the active codebase, official university regulations, or MySQL 8.0 mechanics.
- `[DESIGN RECOMMENDATION]`: A best-practice architectural specification engineered to satisfy performance, security, and maintainability requirements.
- `[ASSUMPTION]`: A working premise grounded in established patterns that requires official administrative verification before final production seeding.
- `[DECISION REQUIRING APPROVAL]`: A critical product or architectural choice requiring formal project owner sign-off prior to execution.

---

## 2. Architectural Design Resolutions

### 2.1 Design Resolution 1: Complete 20-Tool Route, Behavior & Phasing Reconciliation

`[CONFIRMED FACT]` ResultPoint's canonical baseline registry (`src/data/toolsData.js`, lines 12–272) defines exactly 20 tools.  
`[CONFIRMED FACT]` `src/App.jsx` currently contains no `<Route>` entries for the 11 `/tools/*` routes, causing React Router to hit the wildcard fallback `<Route path="*" element={<Navigate to="/" replace />} />` (`App.jsx`, line 231), silently redirecting users to the Home page.

`[DESIGN RECOMMENDATION]` Reconcile the 20 tools into three clearly distinguished operational categories across delivery phases:

#### Category A: Existing Dedicated Pages (Active in `App.jsx`)
These 8 tools already possess dedicated, functional page components in the React application:
1. `cgpa-calculator` (`/calculators/cgpa`): Full multi-semester CGPA calculator with manual & catalog entry modes. Active in `App.jsx` line 202.
2. `sgpa-calculator` (`/calculators/sgpa`): Single-semester SGPA calculator with course-level credit/grade inputs. Already registered in `App.jsx` line 203, but mislabeled as `/calculators/cgpa#sgpa` in `toolsData.js`.
3. `result-analyzer` (`/calculators/result-analysis`): Semester transcript analysis, pass/fail trends, subject breakdown. Active in `App.jsx` line 205.
4. `target-cgpa` (`/calculators/target-cgpa`): Forward-looking target CGPA planning tool. Active in `App.jsx` line 206.
5. `credits-calculator` (`/calculators/credit-calculate`): Degree credit tracker. Active in `App.jsx` line 207 (as `/calculators/credite-calculate`, URL typo).
6. `grade-calculator` (`/calculators/grade`): Subject marks-to-grade converter based on university regulation scales. Active in `App.jsx` line 209.
7. `percentage-calculator` (`/calculators/percentage`): Regulation-aware CGPA/SGPA percentage converter. Active in `App.jsx` line 210.
8. `backlog-calculator` (`/calculators/backlog`): Impact analyzer for backlogs on cumulative CGPA. Active in `App.jsx` line 211.

#### Category B: Existing Calculator Tab Modes
1. `cgpa-converter` (`/calculators/cgpa#converter`): A specialized tab mode hosted within `/calculators/cgpa`. Also accessible via legacy alias `/calculators/gpa` in `App.jsx` line 204.

#### Category C: The 11 Missing Tool Routes — Subcategorized & Phased
The 11 unregistered tools are partitioned based on backend dependencies:

| Tool Key (`tool_key`) | Canonical Route | Classification | Implementation Nature | Delivery Phase | Target Behavior |
|---|---|---|---|---|---|
| `sgpa-to-cgpa` | `/tools/sgpa-to-cgpa` | New Pure Calculator | Client-Side Only | Phase 3.1 | Aggregates semester SGPA values directly into cumulative CGPA without course-level entry. |
| `gpa-scale-converter` | `/tools/scale-converter` | New Pure Calculator | Client-Side Only | Phase 3.1 | Mathematical scale converter between 10-point, 4.0 US, 5.0, and 7.0 scales. |
| `grade-predictor` | `/tools/grade-predictor` | New Pure Calculator | Client-Side Only | Phase 3.1 | Predicts required final examination marks from internal assessment scores. |
| `attendance-calculator` | `/tools/attendance` | New Pure Calculator | Client-Side Only | Phase 3.1 | Bunk/attendance percentage calculator with shortage alerts per 75% statutory norm. |
| `result-pdf-generator` | `/tools/pdf-gen` | New Dedicated Utility | Client-Side Only | Phase 3.1 | Client-side export utility wrapping existing `src/services/calculatorPdfService.js` (22 KB). |
| `cgpa-info-finder` | `/tools/cgpa-info` | New Content/Guide | Client-Side Only | Phase 3.1 | Interactive guide on university grading systems, transcript conventions, and honours criteria. |
| `cgpa-improvement` | `/tools/improvement` | New Content/Guide | Client-Side Only | Phase 3.1 | Actionable remediation guidelines, re-evaluation strategies, and grade improvement rules. |
| `cgpa-predictor` | `/tools/predictor` | Future Student Feature | Requires Backend & Auth | Phase 4+ (Placeholder in Phase 3) | Multi-semester probabilistic scenario modeler; requires authenticated historical profiles. |
| `performance-trend` | `/tools/performance-trend` | Future Student Feature | Requires Backend & Auth | Phase 4+ (Placeholder in Phase 3) | Longitudinal charting tool for semester-over-semester trajectories; requires stored records. |
| `study-planner` | `/tools/study-planner` | Future Student Feature | Requires Backend & Auth | Phase 4+ (Placeholder in Phase 3) | Weekly timetable and study hour scheduler; requires persistent user storage. |
| `semester-planner` | `/tools/semester-planner` | Future Student Feature | Requires Backend & Auth | Phase 4+ (Placeholder in Phase 3) | Elective selection and semester load planner mapped to student graduation paths. |

#### Phase Reconciliation Protocol:
1. **Phase 3 (Frontend Routing & Guard Alignment):** Register all 11 routes in `src/App.jsx` wrapped in `CalculatorRouteGuard`. For the 4 future features (`cgpa-predictor`, `performance-trend`, `study-planner`, `semester-planner`), mount a branded `PlaceholderToolPage.jsx` showing the tool metadata, release phase, and an email notification signup.
2. **Phase 3.1 (Standalone Tool Delivery):** Implement the 5 client-side pure calculators and 2 content pages directly in the frontend without blocking on Spring Boot backend development.
3. **Phase 4+ (Integrated Student Features):** Replace placeholders for the remaining 4 tools once Spring Boot authentication and student profile APIs are live.

---

### 2.2 Design Resolution 2: Tool Configuration Fields Reconciliation (MySQL Schema)

`[CONFIRMED FACT]` `docs/backend-architecture/database-design.md` lines 434–456 define `tools_registry` with only 12 columns, omitting 17 configuration, display, and telemetry fields defined in `src/data/toolsData.js` and managed in `src/services/toolManagementService.js`.

`[DESIGN RECOMMENDATION]` To optimize query indexing while preserving flexible extensibility for tool-specific settings, establish a **Hybrid Relational + Validated JSON Schema**:

```sql
CREATE TABLE tools_registry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tool_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    route_path VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'disabled', 'maintenance') NOT NULL DEFAULT 'active',
    
    -- Display & Telemetry Relational Columns (Indexed for UI Sorting & Filtering)
    icon VARCHAR(50) NOT NULL DEFAULT 'Calculator',
    icon_color VARCHAR(30) NOT NULL DEFAULT 'primary',
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    popularity INT NOT NULL DEFAULT 50,
    usage_count BIGINT NOT NULL DEFAULT 0,
    
    -- Academic Core Calculation Constraints
    applicability_scope ENUM('all', 'university_specific', 'course_specific') NOT NULL DEFAULT 'all',
    applicable_universities_json JSON NULL,
    min_credits DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    max_credits DECIMAL(4,2) NOT NULL DEFAULT 10.00,
    allow_decimal_credits BOOLEAN NOT NULL DEFAULT FALSE,
    decimal_precision TINYINT NOT NULL DEFAULT 2,
    rounding_mode ENUM('HALF_UP', 'FLOOR', 'CEILING', 'TRUNCATE') NOT NULL DEFAULT 'HALF_UP',
    passing_marks_percentage DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    passing_grade_points DECIMAL(4,2) NOT NULL DEFAULT 5.00,
    
    -- Search & Discovery
    keywords_json JSON NULL,
    
    -- Extensible Tool-Specific Configuration (Validated by JSON Schema in Spring Boot)
    config_json JSON NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tools_status (status),
    INDEX idx_tools_category (category),
    INDEX idx_tools_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Fields Partitioning Rationale:
- **Relational Columns:** `tool_key`, `name` (standardized from `title`), `category`, `route_path`, `status`, `icon`, `icon_color`, `is_new`, `display_order`, `popularity`, `usage_count`, `applicability_scope`, `min_credits`, `max_credits`, `allow_decimal_credits`, `decimal_precision`, `rounding_mode`, `passing_marks_percentage`, `passing_grade_points`.  
  *Rationale:* Queried in admin dashboards, indexed in search/filtering, and validated by SQL types.
- **Validated `config_json` Column:** Tool-type-specific settings:
  - `defaultScale` (e.g., "10", "4.0")
  - `allowCustomCourseEntry` (boolean)
  - `defaultConversionFormula` (e.g., "CGPA * 10", "(CGPA - 0.75) * 10")
  - `allowManualMultiplier` (boolean)
  - `maxPercentage` (e.g., 100.0)
  - `useStandardGradeLetters` (boolean)
  - `allowGuestUsage` (boolean)
  - `saveToHistoryByDefault` (boolean)  
  *Rationale:* These fields vary widely between tools (e.g., attendance calculator has no conversion formula), avoiding sparse NULL columns while being strictly validated in Spring Boot via Jackson JSON Schema validation.

---

### 2.3 Design Resolution 3: Route Identity & URL Fragment Contract

`[CONFIRMED FACT]` `database-design.md` line 439 defines `route_path VARCHAR(100) NOT NULL UNIQUE`. In `src/data/toolsData.js`, five tools share `/calculators/cgpa` with distinct hash fragments (`#sgpa`, `#converter`, etc.). If a database migration script strips hashes to store bare paths, four records will fail with MySQL `ER_DUP_ENTRY`.

`[DESIGN RECOMMENDATION]` Canonical Route Resolution Contract:
1. **Single Source of Truth:** Route identity is defined by the browser-navigable address.
2. **Dedicated Routes for Distinct Tools:** `src/data/toolsData.js` must be updated to reference the dedicated routes that already exist in `App.jsx` (`/calculators/sgpa`, `/calculators/target-cgpa`, `/calculators/grade`, `/calculators/percentage`, `/calculators/backlog`).
3. **Tab Mode Identifiers:** For true tabbed components within a single page (`cgpa-converter`), the database `route_path` column **explicitly stores the full URL string including the `#hash` fragment** (`/calculators/cgpa#converter`).
4. **Resolution Algorithm in `toolManagementService.js`:**
   ```javascript
   export const getToolByRoute = (currentPath, currentHash = '') => {
     const fullPath = currentHash ? `${currentPath}${currentHash}` : currentPath;
     // 1. Exact match on fullPath (including hash)
     const exact = tools.find(t => t.route === fullPath);
     if (exact) return exact;
     // 2. Exact match on path alone
     const pathMatch = tools.find(t => t.route === currentPath);
     if (pathMatch) return pathMatch;
     // 3. Fallback prefix match (only for non-hash tools)
     return tools.find(t => !t.route.includes('#') && currentPath.startsWith(t.route)) || null;
   };
   ```
5. **Database Constraint:** `UNIQUE KEY uk_tools_route_path (route_path)` is valid and safe because `/calculators/cgpa` and `/calculators/cgpa#converter` are distinct strings.

---

### 2.4 Design Resolution 4: Separation of Passing Marks vs Grade Points

`[CONFIRMED FACT]` `src/services/toolManagementService.js` line 93 defines `passingMarksThreshold: 40` (Percentage, 0–100%). In contrast, `database-design.md` line 447 defines `passing_grade_points DECIMAL(4,2) DEFAULT 5.0` (Grade points, 0–10.0). These represent fundamentally different academic evaluation boundaries.

`[DESIGN RECOMMENDATION]` Store both as distinct, strongly typed columns across all layers:
- **`passing_marks_percentage` (e.g., 40.0% or 50.0%):** The minimum score in individual university theory/practical evaluations to avoid failing a subject. Used by frontend grade estimators and mark-entry forms.
- **`passing_grade_points` (e.g., 5.0 or 4.0):** The minimum Grade Point (GP) awarded on the transcript that confers earned credits. E.g., in Osmania University CBCS, Grade 'E' = 5.0 GP (Pass), while Grade 'F' = 0.0 GP (Fail).
- Never overload or mathematically cast between these two distinct academic concepts.

---

### 2.5 Design Resolution 5: Unified Rounding Contract & Shared Test Vectors

`[CONFIRMED FACT]` In JavaScript, standard IEEE-754 binary floating-point representation causes binary representation drift. E.g., `1.005 * 100 = 100.49999999999999`, which causes `Math.round()` to round down to `1.00` instead of rounding up to `1.01`.  
`[CONFIRMED FACT]` In Java, `BigDecimal.setScale(precision, RoundingMode.HALF_UP)` evaluates ties (equidistant `.5`) by rounding **away from zero** (so `-2.555` at scale 2 becomes `-2.56`). In JavaScript, `Math.round(-2.555 * 100) / 100` rounds towards positive infinity (`Math.round(-2.5) = -2`), producing cross-platform divergence.

`[DESIGN RECOMMENDATION]` Standardize on canonical Java/SQL constants (`HALF_UP`, `FLOOR`, `CEILING`, `TRUNCATE`) and enforce cross-platform mathematical parity:

#### Exact Mathematical Definitions:
1. **`HALF_UP` (Academic Rounding):** Rounds towards nearest neighbor. If equidistant (tie), rounds **away from zero** (towards positive infinity for positive numbers, towards negative infinity for negative numbers).
2. **`FLOOR` (Floor):** Rounds towards negative infinity (`Math.floor(x * 10^p) / 10^p`), matching Java `RoundingMode.FLOOR`.
3. **`CEILING` (Ceiling):** Rounds towards positive infinity (`Math.ceil(x * 10^p) / 10^p`), matching Java `RoundingMode.CEILING`.
4. **`TRUNCATE` (Towards Zero Truncation):** Truncates fractional digits towards zero (`Math.trunc(x * 10^p) / 10^p`), matching Java `RoundingMode.DOWN`.

#### JavaScript Implementation with Exact Java Parity:
To prevent IEEE-754 binary representation drift and negative tie-breaking divergence, JavaScript must use exponential shifting:
```javascript
export function roundAcademic(value, precision = 2, mode = 'HALF_UP') {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const factor = Math.pow(10, precision);
  
  if (mode === 'FLOOR') {
    return Math.floor(value * factor) / factor;
  }
  if (mode === 'CEILING') {
    return Math.ceil(value * factor) / factor;
  }
  if (mode === 'TRUNCATE') {
    return Math.trunc(value * factor) / factor;
  }
  
  // HALF_UP: Round ties away from zero with exponential shift to defeat binary drift
  const sign = value < 0 ? -1 : 1;
  const absValue = Math.abs(value);
  const shifted = Number(Math.round(Number(absValue + 'e' + precision)) + 'e-' + precision);
  return sign * shifted;
}
```

#### Shared Test Vectors (Parity Contract):
Both frontend JavaScript and backend Java unit test suites must validate against these 11 authoritative test vectors:

| Vector # | Input Value | Precision | Mode | Expected Java Result (`BigDecimal`) | Expected JS Result (`roundAcademic`) | Rationale / Edge Case Tested |
|---|---|---|---|---|---|---|
| TV-01 | `7.755` | 2 | `HALF_UP` | `7.76` | `7.76` | Standard tie at 3rd decimal place (rounds up). |
| TV-02 | `1.005` | 2 | `HALF_UP` | `1.01` | `1.01` | **IEEE-754 binary drift test** (`1.005` drift in JS). |
| TV-03 | `8.125` | 2 | `HALF_UP` | `8.13` | `8.13` | Exact binary fractional tie (5/1000). |
| TV-04 | `9.0049` | 2 | `HALF_UP` | `9.00` | `9.00` | Strictly below tie threshold (rounds down). |
| TV-05 | `9.0050` | 2 | `HALF_UP` | `9.01` | `9.01` | Exact half tie boundary (rounds up). |
| TV-06 | `6.6666...` (20/3) | 2 | `HALF_UP` | `6.67` | `6.67` | Recurring decimal fraction from credit weighting. |
| TV-07 | `-2.555` | 2 | `HALF_UP` | `-2.56` | `-2.56` | **Negative tie-breaking away from zero**. |
| TV-08 | `7.899` | 2 | `FLOOR` | `7.89` | `7.89` | Floor towards negative infinity. |
| TV-09 | `7.891` | 2 | `CEILING` | `7.90` | `7.90` | Strict ceiling without threshold. |
| TV-10 | `-7.899`| 2 | `TRUNCATE`| `-7.89` | `-7.89` | Truncation towards zero (differs from FLOOR `-7.90`). |
| TV-11 | `0.0`   | 2 | `HALF_UP` | `0.00`  | `0.00`  | Zero boundary condition. |

#### Regulation-Specific Rounding Rules:
- `[CONFIRMED FACT]` Osmania University CBCS regulations calculate SGPA and CGPA to **two decimal places** using standard academic `HALF_UP` rounding.
- `[CONFIRMED FACT]` JNTUH (R18/R22) prescribes two decimal places with `HALF_UP` rounding.
- `[CONFIRMED FACT]` No Osmania University or JNTUH regulation specifies `FLOOR` truncation for CGPA; `FLOOR` is retained only as an option for specific autonomous institutions.

---

### 2.6 Design Resolution 6: Calculation Engine Precision & Primary Allowlist Security

`[CONFIRMED FACT]` `src/services/academicCalculationEngine.js` hardcodes `.toFixed(2)` on lines 86 (`calculateSGPA`) and 140 (`calculateCGPA`), ignoring tool or regulation precision settings.  
`[CONFIRMED FACT]` `src/services/toolManagementService.js` line 543 regex permits division `/` and addition `+`, but `convertCGPAToPercentage` in `academicCalculationEngine.js` only implements multiplication `CGPA * N` and subtraction `(CGPA - offset) * N`.

`[DESIGN RECOMMENDATION]` Establish **Strict Allowlisted Parsing** as the Primary Security Boundary:
1. **Flaw of Blacklists:** Keyword blacklists (`eval`, `exec`, `Function`) are insufficient as a primary defense because they can be bypassed by character encodings, indirect property lookups, or alternative execution contexts.
2. **Primary Security Boundary — Strict Formal Grammar Allowlist:**
   - The calculation engine rejects any input string that contains any character outside the strict allowlist `[0-9a-zA-Z\s\*\-\.\(\)]`.
   - The engine recognizes only two valid deterministic grammatical templates:
     - **Template 1 (Direct Multiplier):** `^\s*CGPA\s*\*\s*(\d+(?:\.\d+)?)\s*$` (e.g., `CGPA * 10`, `CGPA * 9.5`).
     - **Template 2 (Offset Multiplier):** `^\s*\(\s*CGPA\s*-\s*(\d+(?:\.\d+)?)\s*\)\s*\*\s*(\d+(?:\.\d+)?)\s*$` (e.g., `(CGPA - 0.75) * 10`).
3. **Deterministic Evaluation (Zero Dynamic Code Execution):**
   - No `eval()`, no `new Function()`, no dynamic JavaScript/Java scripting engine is ever invoked.
   - Operands are extracted directly into numbers:
     ```javascript
     export const evaluateConversionFormula = (cgpa, formulaString) => {
       const directMatch = formulaString.match(/^\s*CGPA\s*\*\s*(\d+(?:\.\d+)?)\s*$/i);
       if (directMatch) {
         const multiplier = Number(directMatch[1]);
         return cgpa * multiplier;
       }
       const offsetMatch = formulaString.match(/^\s*\(\s*CGPA\s*-\s*(\d+(?:\.\d+)?)\s*\)\s*\*\s*(\d+(?:\.\d+)?)\s*$/i);
       if (offsetMatch) {
         const offset = Number(offsetMatch[1]);
         const multiplier = Number(offsetMatch[2]);
         return (cgpa - offset) * multiplier;
       }
       throw new Error('Formula does not conform to approved academic calculation templates.');
     };
     ```
4. **Defense-in-Depth Layer:** Secondary blacklist check in `toolManagementService.js` (rejecting `exec`, `eval`, `Function`, `setTimeout`, `process`, `window`) remains as a redundant guard, but the allowlisted grammar is the primary gatekeeper.

---

### 2.7 Design Resolution 7: Architecture Documentation & Database Table Verification

`[CONFIRMED FACT]` Physical verification of `docs/backend-architecture/database-design.md` reveals:
- Total `CREATE TABLE` statements in the document: **exactly 27 tables**.
- Table inventory list (lines 21–47): **exactly 27 tables**.
- Section 2 header text (line 17): incorrectly states "22 core entities + 2 cross-referencing join tables = 24 tables total".

`[CONFIRMED FACT]` The 27 physical tables break down across functional domains as follows:
1. `users` (Identity)
2. `student_profiles` (Student Profile)
3. `universities` (Academic Catalog)
4. `courses` (Academic Catalog)
5. `regulations` (Academic Catalog)
6. `admission_batches` (Academic Catalog)
7. `subjects` (Academic Catalog)
8. `regulation_subjects` (Academic Catalog Join Table)
9. `grading_scales` (Calculation Rules)
10. `grade_boundaries` (Calculation Rules)
11. `calculation_rules` (Calculation Rules)
12. `semester_results` (Student Results)
13. `subject_results` (Student Results)
14. `student_backlogs` (Student Academic)
15. `student_goals` (Student Academic)
16. `education_records` (Multi-Qualification)
17. `education_record_subjects` (Multi-Qualification)
18. `tools_registry` (Tools & Calculators)
19. `saved_calculations` (Tools & Calculators)
20. `announcements` (Content Management)
21. `announcement_reads` (Content Join Table)
22. `support_queries` (Helpdesk)
23. `support_query_replies` (Helpdesk)
24. `daily_visitor_metrics` (Telemetry Rollup)
25. `route_page_views` (Telemetry Rollup)
26. `calculator_usage_stats` (Telemetry Rollup)
27. `audit_logs` (Platform Governance)

`[DESIGN RECOMMENDATION]` Update `database-design.md` Section 2 header to explicitly reflect:
**"22 Core Business Entities + 2 Domain Join Tables + 3 Telemetry Rollup Tables + 1 Tamper-Evident Audit Log = 27 Physical Tables Total"**.

`[DESIGN RECOMMENDATION]` In Phase 1, create the two missing specifications referenced in `docs/backend-architecture/README.md`:
1. `docs/backend-architecture/system-architecture.md`: Details Spring Boot 3 layered architecture, Redis cache invalidation strategies, asynchronous thread pools for PDF generation and analytics, and load balancing.
2. `docs/backend-architecture/calculation-engine-spec.md`: Formalizes the mathematical specification, `BigDecimal` precision, shared test vectors, and parity validation between frontend and backend engines.

---

### 2.8 Design Resolution 8: Regulation-Specific Grading Integrity (Osmania University CBCS)

`[CONFIRMED FACT]` In `src/services/academicCatalogService.js`, Osmania University (OU) BCA (`ou-bca-cbcs`, lines 156–164) and MCA (`ou-mca-cbcs`, lines 544–552) regulations officially define top grade **'S' (Super)** for marks >= 85% with 10 Grade Points. This is an official university rule and MUST BE PRESERVED.  
`[ASSUMPTION]` OU non-CS courses in `academicCatalogService.js` (B.Com, B.Sc, BBA, MBA, M.Com) list top grade **'O' (Outstanding)**. While conventional Osmania University undergraduate CBCS rules historically used 'O', whether recent faculty revisions harmonized all faculties under 'S' or 'O' is unverified against primary university gazettes.

`[DESIGN RECOMMENDATION]` 
1. Add a mandatory `verification_status` column to the `grading_scales` table:
   `verification_status ENUM('VERIFIED_OFFICIAL', 'ACADEMIC_ESTIMATE', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'PENDING_VERIFICATION'`.
2. Seed OU BCA and OU MCA scales as `VERIFIED_OFFICIAL`.
3. Seed OU conventional B.Com, B.Sc, BBA scales as `PENDING_VERIFICATION`.
4. Ensure all grade scale lookups in Spring Boot JPA are strictly scoped by `regulation_id`, preventing any cross-regulation leakage.

---

### 2.9 Design Resolution 9: Secure Authentication, Session Design & Least-Privilege MySQL Permissions

`[CONFIRMED FACT]` `docs/backend-architecture/api-specification.md` line 76 lists `expiresIn: 86400` (24 hours), directly conflicting with `docs/backend-architecture/security-and-compliance.md` line 71 which mandates 15-minute access tokens.  
`[CONFIRMED FACT]` In MySQL's privilege hierarchy, privileges granted at the database scope (`ON resultpoint_db.*`) cannot be revoked at the table scope (`ON resultpoint_db.audit_logs`). A statement such as `REVOKE UPDATE, DELETE ON resultpoint_db.audit_logs FROM 'app_user'` has no effect if `app_user` was granted database-level privileges.

`[DESIGN RECOMMENDATION]` Authentication & Session Architecture:
1. **Access Token Lifespan:** Exactly **15 minutes** (900 seconds). Cryptographically signed JWT (RS256 recommended, or HMAC-SHA256) kept in client memory.
2. **Refresh Token Lifespan:** **7 days** (604,800 seconds). High-entropy cryptographic random token stored hashed (SHA-256) in MySQL table `user_refresh_tokens` with automatic rotation on each use.
3. **Cookie Storage:** Sent exclusively as an **`HttpOnly`**, **`Secure`**, **`SameSite=Strict`** cookie on path `/api/v1/auth/refresh`. This completely mitigates XSS token theft.
4. **Server-Side Role Enforcement:** Enforced in Spring Security via `@PreAuthorize("hasRole('ROLE_ADMIN')")` and SpEL resource ownership checks (`#studentId == authentication.principal.id`).

`[DESIGN RECOMMENDATION]` Least-Privilege MySQL DDL Specification:
To achieve true append-only audit log integrity and enforce least privilege, separate database roles must be defined:

```sql
-- 1. Migration / Schema Management User (Flyway / Liquibase)
CREATE USER 'resultpoint_flyway'@'%' IDENTIFIED BY '${FLYWAY_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON resultpoint_db.* TO 'resultpoint_flyway'@'%';

-- 2. Application Runtime User (Spring Boot Data Source)
CREATE USER 'resultpoint_app'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';

-- Grant standard CRUD only on transactional application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.users TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.student_profiles TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.semester_results TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.subject_results TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.student_backlogs TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.student_goals TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.education_records TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.education_record_subjects TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.tools_registry TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.saved_calculations TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.announcements TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.announcement_reads TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.support_queries TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.support_query_replies TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.daily_visitor_metrics TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.route_page_views TO 'resultpoint_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON resultpoint_db.calculator_usage_stats TO 'resultpoint_app'@'%';

-- Grant Read-Only access on Master Academic Catalog tables
GRANT SELECT ON resultpoint_db.universities TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.courses TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.regulations TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.admission_batches TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.subjects TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.regulation_subjects TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.grading_scales TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.grade_boundaries TO 'resultpoint_app'@'%';
GRANT SELECT ON resultpoint_db.calculation_rules TO 'resultpoint_app'@'%';

-- STRICT APPEND-ONLY: Grant SELECT and INSERT ONLY on audit logs (NO UPDATE, NO DELETE)
GRANT SELECT, INSERT ON resultpoint_db.audit_logs TO 'resultpoint_app'@'%';

-- Database Triggers for Defense-in-Depth Immutability
DELIMITER //
CREATE TRIGGER trg_audit_logs_prevent_update
BEFORE UPDATE ON resultpoint_db.audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Security Violation: audit_logs records are strictly immutable and cannot be updated.';
END;
//

CREATE TRIGGER trg_audit_logs_prevent_delete
BEFORE DELETE ON resultpoint_db.audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Security Violation: audit_logs records are strictly append-only and cannot be deleted.';
END;
//
DELIMITER ;
```

---

### 2.10 Design Resolution 10: Client-Side Navigation vs Server-Side HTTP 301 Redirects

`[CONFIRMED FACT]` React Router navigation via `<Navigate to="..." replace />` is entirely client-side. It modifies the browser history state (`history.replaceState()`) without performing an HTTP request, and returns no HTTP status code (it is NOT an HTTP 301 redirect).  
`[CONFIRMED FACT]` The route typo `/calculators/credite-calculate` exists in 8 files. Direct external visits, bookmarks, and search crawlers requesting `https://resultpoint.in/calculators/credite-calculate` will hit the hosting web server directly before React hydrates.

`[DESIGN RECOMMENDATION]` Dual-Layer Routing Architecture:
1. **Layer 1: Server-Level HTTP 301 Redirect (SEO & Bookmark Preservation):**
   - The edge reverse proxy or web host must respond with an actual **HTTP 301 Moved Permanently** status code to transfer SEO equity:
     - *Nginx:* `rewrite ^/calculators/credite-calculate$ /calculators/credit-calculate permanent;`
     - *Netlify (`_redirects`):* `/calculators/credite-calculate  /calculators/credit-calculate  301!`
     - *Vercel (`vercel.json`):* `{"source": "/calculators/credite-calculate", "destination": "/calculators/credit-calculate", "permanent": true}`
     - *Spring Boot Gateway / WebMvc:* `registry.addRedirectViewController("/calculators/credite-calculate", "/calculators/credit-calculate").setStatusCode(HttpStatus.MOVED_PERMANENTLY);`
2. **Layer 2: Client-Side Fallback (`src/App.jsx`):**
   - Retain a client-side route alias in `App.jsx`:
     `<Route path="/calculators/credite-calculate" element={<Navigate to="/calculators/credit-calculate" replace />} />`
   - This guarantees that in-app client-side history navigation functions seamlessly without a full page reload.

---

### 2.11 Design Resolution 11: Framework Version & Java Compatibility Verification

`[CONFIRMED FACT]` Official Spring Boot Release Lifecycle:
- **Spring Boot 3.3.x:** Released in May 2024. Open-source commercial support timeline is standard 12 months.
- **Spring Boot 3.4.x:** Reached General Availability (GA) in November 2024. Active open-source support extends through November 2025.
- Both Spring Boot 3.3 and 3.4 require **Java 17** as the minimum baseline and fully support **Java 21 LTS** and **Java 23**.
- Java 21 LTS provides virtual threads (Project Loom), structured concurrency, and sequenced collections, optimizing Spring Boot I/O throughput.

`[DESIGN RECOMMENDATION]` Standardize on **Spring Boot 3.4.x** with **Java 21 LTS** across all architecture specifications (`migration-strategy.md`, `backend-folder-structure.md`, and build scripts).

---

## 3. Prioritized Remediation Plan for Issues I-01 through I-18

---

### I-01: 11 Unregistered `/tools/*` Routes
- **Severity:** HIGH
- **Taxonomy:** `[CONFIRMED FACT]` (Source defect) / `[DESIGN RECOMMENDATION]` (Phased delivery)
- **Verified Root Cause:** `src/data/toolsData.js` lines 122, 149, 162, 175, 188, 201, 214, 227, 240, 253, 266 define 11 tools with paths starting with `/tools/*`. `src/App.jsx` has no matching `<Route>` elements. Clicking them in the Directory triggers the catch-all redirect (`App.jsx` line 231), silently navigating to Home (`/`).
- **Files Needing Changes:**
  - `src/App.jsx`
  - `src/pages/tools/PlaceholderToolPage.jsx` (New component)
  - `src/pages/Calculators/Directory/index.jsx`
- **Implementation Tasks:**
  1. Create `PlaceholderToolPage.jsx` rendering tool metadata, planned release phase, and notification signup.
  2. Register all 11 routes in `src/App.jsx` guarded by `CalculatorRouteGuard`:
     `/tools/predictor`, `/tools/sgpa-to-cgpa`, `/tools/study-planner`, `/tools/performance-trend`, `/tools/scale-converter`, `/tools/grade-predictor`, `/tools/attendance`, `/tools/semester-planner`, `/tools/cgpa-info`, `/tools/pdf-gen`, `/tools/improvement`.
  3. In Phase 3.1, build functional page components for the 5 pure calculators and 2 content guides.
- **Dependencies:** I-03.
- **Acceptance Criteria & Regression Tests:**
  - Navigating directly to `/tools/attendance` renders the Attendance tool or placeholder with HTTP 200 (no redirect to `/`).
  - Toggling `attendance-calculator` to disabled displays the `ToolUnavailable` screen.

---

### I-02: `tools_registry` Database Schema Missing 17+ Configuration Fields
- **Severity:** HIGH
- **Taxonomy:** `[CONFIRMED FACT]` (Schema omission) / `[DESIGN RECOMMENDATION]` (Hybrid schema)
- **Verified Root Cause:** `docs/backend-architecture/database-design.md` lines 434–456 define `tools_registry` with only 12 columns, omitting `min_credits`, `max_credits`, `allow_decimal_credits`, `decimal_precision`, `rounding_mode`, `passing_marks_percentage`, `passing_grade_points`, `icon`, `icon_color`, `is_new`, `display_order`, `popularity`, `usage_count`, `keywords_json`, and tool config fields.
- **Files Needing Changes:**
  - `docs/backend-architecture/database-design.md`
  - `docs/backend-architecture/api-specification.md`
- **Implementation Tasks:**
  1. Replace `tools_registry` DDL in `database-design.md` with the Hybrid Schema defined in Section 2.2.
  2. Update OpenAPI schemas in `api-specification.md` to expose relational properties and `config_json`.
- **Dependencies:** I-05, I-10.
- **Acceptance Criteria & Regression Tests:**
  - `tools_registry` DDL executes cleanly in MySQL 8.0 without syntax error.
  - All properties returned by `toolManagementService.getAllTools()` map to schema attributes.

---

### I-03: `route_path` UNIQUE Constraint Collides with Hash-Based Tools
- **Severity:** HIGH
- **Taxonomy:** `[CONFIRMED FACT]` (Collision hazard) / `[DESIGN RECOMMENDATION]` (Route specification)
- **Verified Root Cause:** `database-design.md` line 439 specifies `route_path VARCHAR(100) NOT NULL UNIQUE`. In `src/data/toolsData.js`, five tools share `/calculators/cgpa` distinguished only by URL fragments (`#sgpa`, `#converter`, etc.). If a database migration script strips hashes, four records fail with `ER_DUP_ENTRY`.
- **Files Needing Changes:**
  - `src/data/toolsData.js`
  - `docs/backend-architecture/database-design.md`
  - `src/services/toolManagementService.js`
- **Implementation Tasks:**
  1. Update `toolsData.js` to assign canonical standalone paths to tools with dedicated pages in `App.jsx` (`/calculators/sgpa`, `/calculators/target-cgpa`, `/calculators/grade`, `/calculators/percentage`, `/calculators/backlog`).
  2. For true tab mode `cgpa-converter`, retain the `#converter` fragment in `toolsData.js` and database `route_path`.
  3. Update `getToolByRoute` in `toolManagementService.js` to match full hash paths.
- **Dependencies:** I-01, I-04.
- **Acceptance Criteria & Regression Tests:**
  - All 20 baseline tools have distinct `route_path` strings.
  - Inserting all 20 records into MySQL 8.0 succeeds without `ER_DUP_ENTRY`.

---

### I-04: `sgpa-calculator` Route Registry Mismatch
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Source mismatch) / `[DESIGN RECOMMENDATION]` (Bugfix)
- **Verified Root Cause:** In `src/data/toolsData.js` line 33, `sgpa-calculator` route is configured as `/calculators/cgpa#sgpa`. In `src/App.jsx` line 203, it is mounted at dedicated path `/calculators/sgpa`. `toolManagementService.getToolByRoute('/calculators/sgpa')` prefix match mistakenly resolves to `cgpa-calculator`.
- **Files Needing Changes:**
  - `src/data/toolsData.js`
  - `src/services/toolManagementService.js`
- **Implementation Tasks:**
  1. Change `route: '/calculators/cgpa#sgpa'` to `route: '/calculators/sgpa'` in `src/data/toolsData.js` (line 33).
  2. Refactor `getToolByRoute` to perform exact match on full path before prefix matching.
- **Dependencies:** I-03.
- **Acceptance Criteria & Regression Tests:**
  - `getToolByRoute('/calculators/sgpa')` returns `sgpa-calculator`.
  - Disabling `sgpa-calculator` displays `ToolUnavailable` on `/calculators/sgpa` while `/calculators/cgpa` remains accessible.

---

### I-05: Passing Threshold Semantic Inconsistency (Percentage vs Grade Points)
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Semantic divergence) / `[DESIGN RECOMMENDATION]` (Domain separation)
- **Verified Root Cause:** `src/services/toolManagementService.js` line 93 defines `passingMarksThreshold: 40` (Percentage scale: 0–100%). `database-design.md` line 447 defines `passing_grade_points DECIMAL(4,2) DEFAULT 5.0` (Grade point scale: 0–10.0).
- **Files Needing Changes:**
  - `docs/backend-architecture/database-design.md`
  - `src/services/toolManagementService.js`
- **Implementation Tasks:**
  1. Add `passing_marks_percentage DECIMAL(5,2) NOT NULL DEFAULT 40.00` to `tools_registry` in `database-design.md`.
  2. Retain `passing_grade_points DECIMAL(4,2) NOT NULL DEFAULT 5.00` for transcript grade calculations.
  3. Expose both fields distinctly in `toolManagementService.js` configuration objects.
- **Dependencies:** I-02.
- **Acceptance Criteria & Regression Tests:**
  - DDL schema and frontend DTOs contain both `passingMarksPercentage` and `passingGradePoints`.
  - Academic validations never cast a percentage (40) into a grade point (5.0).

---

### I-06: SGPA/CGPA Rounding Hardcoded in Calculation Engine
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Hardcoded precision) / `[DESIGN RECOMMENDATION]` (Configurable engine)
- **Verified Root Cause:** `src/services/academicCalculationEngine.js` lines 86 and 140 hardcode `.toFixed(2)`. Configured `decimalPrecision` and `roundingMode` from `toolManagementService.js` are ignored during GPA calculation.
- **Files Needing Changes:**
  - `src/services/academicCalculationEngine.js`
- **Implementation Tasks:**
  1. Add `roundAcademic(value, precision, mode)` helper function adhering to Section 2.5 contract.
  2. Update `calculateSGPA` and `calculateCGPA` signatures to accept optional `{ decimalPrecision = 2, roundingMode = 'HALF_UP' }`.
- **Dependencies:** I-10.
- **Acceptance Criteria & Regression Tests:**
  - `calculateSGPA(courses, { decimalPrecision: 3, roundingMode: 'HALF_UP' })` returns 3 decimal places.
  - Default invocation with no options returns 2 decimal places with `HALF_UP` rounding.

---

### I-07: Conversion Formula Validation Regex Permits Unsupported Operators
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Validation defect) / `[DESIGN RECOMMENDATION]` (Primary allowlist)
- **Verified Root Cause:** `src/services/toolManagementService.js` line 543 validates formulas with regex allowing division `/` and addition `+`. `convertCGPAToPercentage` in `academicCalculationEngine.js` (lines 183–221) only implements multiplication `CGPA * N` and subtraction `(CGPA - offset) * N`. Entering an unsupported formula silently falls back to default `CGPA * 10`.
- **Files Needing Changes:**
  - `src/services/toolManagementService.js`
  - `src/services/academicCalculationEngine.js`
- **Implementation Tasks:**
  1. Constrain formula validation regex to supported templates:
     `^((CGPA\s*\*\s*\d+(\.\d+)?)|(\(\s*CGPA\s*-\s*\d+(\.\d+)?\s*\)\s*\*\s*\d+(\.\d+)?))$`.
  2. Implement `evaluateConversionFormula` in `academicCalculationEngine.js` to parse tokens via regex capture groups without `eval()`.
  3. Throw explicit error on invalid formula rather than silently defaulting.
- **Dependencies:** I-15.
- **Acceptance Criteria & Regression Tests:**
  - Submitting `CGPA / 2` throws validation error.
  - Submitting `(CGPA - 0.75) * 10` parses and converts correctly.

---

### I-08: Missing Architecture Documents (`system-architecture.md` & `calculation-engine-spec.md`)
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Missing files) / `[DESIGN RECOMMENDATION]` (Documentation task)
- **Verified Root Cause:** `docs/backend-architecture/README.md` lines 28–30 cite `system-architecture.md` and `calculation-engine-spec.md`, but neither file exists in the repository.
- **Files Needing Changes:**
  - `docs/backend-architecture/system-architecture.md` (New file)
  - `docs/backend-architecture/calculation-engine-spec.md` (New file)
- **Implementation Tasks:**
  1. Author `system-architecture.md` detailing Spring Boot 3 layered topology, Redis caching, async pools, and load balancing.
  2. Author `calculation-engine-spec.md` detailing mathematical rounding contracts, `BigDecimal` scale rules, and shared test vectors.
- **Dependencies:** None.
- **Acceptance Criteria & Regression Tests:**
  - Both files exist in `docs/backend-architecture/` and internal markdown links resolve cleanly.

---

### I-09: Database Table Inventory Reconciliation (Reconciled to 32 Physical Tables)
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Count discrepancy) / `[DESIGN RECOMMENDATION]` (Architecture reconciliation)
- **Verified Root Cause:** The initial draft schema documented 24 tables, then 27 tables. A complete audit across all audited frontend services (`notificationService.js`, `blogService.js`, `resourceManagementService.js`, token rotation, and password resets) established the need for **32 physical tables**:
  - **27 Existing Tables:** Preserved from foundational architecture.
  - **4 Modified Existing Tables:** `student_profiles` (adds `institution_name`), `calculation_rules` (standardizes `rounding_mode`), `tools_registry` (adopts Hybrid Schema), and `saved_calculations` (adds `client_idempotency_key`).
  - **5 New Tables:** `user_refresh_tokens`, `password_reset_tokens`, `student_notifications`, `blog_posts`, and `study_resources`.
- **Files Needing Changes:**
  - `docs/backend-architecture/database-design.md`
- **Implementation Tasks:**
  Reconcile `database-design.md` Section 2 inventory and Section 3 DDL to exactly 32 physical tables across 10 business domains.
- **Dependencies:** None.
- **Acceptance Criteria & Regression Tests:**
  - Table inventory in Section 2 exactly matches the 32 physical table specifications in Section 3.

---

### I-10: Rounding Mode Enum Identifier Mismatch
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Enum mismatch) / `[DESIGN RECOMMENDATION]` (Canonical standard)
- **Verified Root Cause:** Frontend (`src/services/toolManagementService.js`, line 534) originally used `['round', 'floor', 'ceil']`. Database DDL and calculation engine require canonical naming: `ENUM('HALF_UP', 'FLOOR', 'CEILING', 'TRUNCATE')`.
- **Files Needing Changes:**
  - `src/services/toolManagementService.js`
  - `src/services/academicCalculationEngine.js`
  - `docs/backend-architecture/database-design.md`
- **Implementation Tasks:**
  1. Standardize `VALID_ROUNDING_MODES` to `['HALF_UP', 'FLOOR', 'CEILING', 'TRUNCATE']`.
  2. Implement `TRUNCATE` (truncation towards zero) alongside `HALF_UP`, `FLOOR`, and `CEILING`.
  3. Add adapter mapping legacy lowercase strings (`round` -> `HALF_UP`).
- **Dependencies:** I-06.
- **Acceptance Criteria & Regression Tests:**
  - Saving a tool with rounding mode `HALF_UP`, `FLOOR`, `CEILING`, or `TRUNCATE` succeeds without schema error.

---

### I-11: JWT Access Token Lifespan Inconsistency (24h vs 15m)
- **Severity:** MEDIUM
- **Taxonomy:** `[CONFIRMED FACT]` (Security spec conflict) / `[DESIGN RECOMMENDATION]` (Secure token alignment)
- **Verified Root Cause:** `docs/backend-architecture/api-specification.md` line 76 specifies `expiresIn: 86400` (24h). `docs/backend-architecture/security-and-compliance.md` line 71 specifies 15-minute access tokens.
- **Files Needing Changes:**
  - `docs/backend-architecture/api-specification.md`
- **Implementation Tasks:**
  1. Change `expiresIn: 86400` to `expiresIn: 900` (15m) in `api-specification.md`.
  2. Document `POST /api/v1/auth/refresh` endpoint using `HttpOnly` cookie.
- **Dependencies:** None.
- **Acceptance Criteria & Regression Tests:**
  - API documentation matches security specification.

---

### I-12: `credite-calculate` Route URL Typo Across 8 Files
- **Severity:** LOW
- **Taxonomy:** `[CONFIRMED FACT]` (Typo in 8 files) / `[DESIGN RECOMMENDATION]` (Canonical rename & dual redirects)
- **Verified Root Cause:** Route path `/calculators/credite-calculate` contains a typo (`credite` instead of `credit`) propagated across 8 files (`toolsData.js`, `App.jsx`, `Footer.jsx`, `calculatorNavConfig.js`, `CalculatorSidebar.jsx`, `ExploreMoreTools.jsx`, `ToolsSection.jsx`).
- **Files Needing Changes:**
  - All 8 files listed above.
  - `src/App.jsx` (Add client-side fallback redirect).
- **Implementation Tasks:**
  1. Update canonical route to `/calculators/credit-calculate` across all 8 files.
  2. In `App.jsx`, add `<Route path="/calculators/credite-calculate" element={<Navigate to="/calculators/credit-calculate" replace />} />`.
  3. Specify web-server HTTP 301 redirect rule per Section 2.10.
- **Dependencies:** I-01.
- **Acceptance Criteria & Regression Tests:**
  - Navigating to `/calculators/credit-calculate` renders the Credits Calculator.
  - Navigating to `/calculators/credite-calculate` redirects to `/calculators/credit-calculate`.

---

### I-13: Shared Guard for `/calculators/gpa` and `/calculators/marks-convert`
- **Severity:** LOW
- **Taxonomy:** `[CONFIRMED FACT]` (Coupled route guard) / `[DESIGN RECOMMENDATION]` (Guard decoupling)
- **Verified Root Cause:** In `src/App.jsx` lines 204 & 208, both `/calculators/gpa` and `/calculators/marks-convert` use `toolId="cgpa-converter"` in `CalculatorRouteGuard`. Disabling `cgpa-converter` takes down both routes simultaneously.
- **Files Needing Changes:**
  - `src/App.jsx`
- **Implementation Tasks:**
  Reassign `/calculators/marks-convert` guard to `toolId="percentage-calculator"`.
- **Dependencies:** I-01.
- **Acceptance Criteria & Regression Tests:**
  - Disabling `cgpa-converter` disables `/calculators/gpa` but leaves `/calculators/marks-convert` active.

---

### I-14: Spring Boot Version Specification Discrepancy (3.3.x vs 3.4)
- **Severity:** LOW
- **Taxonomy:** `[CONFIRMED FACT]` (Documentation divergence) / `[DESIGN RECOMMENDATION]` (Standardize on 3.4.x)
- **Verified Root Cause:** `docs/backend-architecture/migration-strategy.md` line 7 references "Spring Boot 3.3.x", while `backend-folder-structure.md` lines 5 & 20 specify "Spring Boot 3.4".
- **Files Needing Changes:**
  - `docs/backend-architecture/migration-strategy.md`
  - `docs/backend-architecture/backend-folder-structure.md`
- **Implementation Tasks:**
  Standardize all architecture documents to reference Spring Boot 3.4.x and Java 21 LTS.
- **Dependencies:** None.
- **Acceptance Criteria & Regression Tests:**
  - Documentation consistently references Spring Boot 3.4.x and Java 21.

---

### I-15: Injection Filter Omits `exec` Keyword
- **Severity:** LOW
- **Taxonomy:** `[CONFIRMED FACT]` (Filter omission) / `[DESIGN RECOMMENDATION]` (Defense-in-depth)
- **Verified Root Cause:** `security-and-compliance.md` mandates blocking `exec`. `toolManagementService.js` lines 505–513 check only `script`, `eval(`, `Function(`, `javascript:`, and HTML tags.
- **Files Needing Changes:**
  - `src/services/toolManagementService.js`
- **Implementation Tasks:**
  Add `exec(`, `spawn(`, `process.`, `window.`, `document.` to formula blacklist.
- **Dependencies:** I-07.
- **Acceptance Criteria & Regression Tests:**
  - Saving a formula containing `exec` throws a validation security error.

---

### I-16: Database `current_semester` Check Constraint Overly Permissive (1–12)
- **Severity:** LOW
- **Taxonomy:** `[CONFIRMED FACT]` (Permissive DB constraint) / `[DESIGN RECOMMENDATION]` (JPA validation layer)
- **Verified Root Cause:** `database-design.md` line 104 defines `CHECK (current_semester BETWEEN 1 AND 12)`. This permits invalid values for shorter degrees (e.g., semester 6 for a 4-semester MCA).
- **Files Needing Changes:**
  - `docs/backend-architecture/database-design.md`
- **Implementation Tasks:**
  Document in `database-design.md` that Spring Boot service layer enforces dynamic constraint `@MaxCourseSemester` based on `courses.total_semesters`.
- **Dependencies:** None.
- **Acceptance Criteria & Regression Tests:**
  - Submitting `current_semester = 6` for a 4-semester MCA returns HTTP 400 Bad Request.

---

### I-17: Audit Table MySQL Permissions Missing from DDL
- **Severity:** LOW
- **Taxonomy:** `[CONFIRMED FACT]` (Missing grant DDL) / `[DESIGN RECOMMENDATION]` (Least-privilege DDL)
- **Verified Root Cause:** `security-and-compliance.md` mandates append-only audit logs, but `database-design.md` contains no `GRANT` statements. Furthermore, revoking privileges at table level after database-level grant is ineffective in MySQL.
- **Files Needing Changes:**
  - `docs/backend-architecture/database-design.md`
- **Implementation Tasks:**
  Add Section 2.9 Least-Privilege DDL and database triggers to `database-design.md`.
- **Dependencies:** None.
- **Acceptance Criteria & Regression Tests:**
  - Attempting to execute `UPDATE` or `DELETE` on `audit_logs` as `resultpoint_app` fails with SQL error.

---

### I-18: Intra-OU Grading Scheme Variance (S vs O Grades)
- **Severity:** LOW
- **Taxonomy:** `[CONFIRMED FACT]` (Catalog difference) / `[ASSUMPTION]` (Non-CS status pending verification)
- **Verified Root Cause:** In `academicCatalogService.js`, OU BCA and MCA define top grade 'S' (Super, 10 GP), whereas OU B.Com, B.Sc, BBA, MBA, M.Com define top grade 'O' (Outstanding, 10 GP).
- **Files Needing Changes:**
  - `docs/backend-architecture/database-design.md` (Add `verification_status` column)
  - `src/services/academicCatalogService.js` (Tag regulations with status metadata)
- **Implementation Tasks:**
  Preserve OU BCA/MCA 'S' grade. Add `verification_status` column to `grading_scales` and mark non-CS OU courses as `PENDING_VERIFICATION` until verified against university gazettes.
- **Dependencies:** None.
- **Acceptance Criteria & Regression Tests:**
  - BCA and MCA calculations award 'S' for >= 85 marks.
  - Seeding scripts enforce `regulation_id` scoping.

---

## 4. Implementation Sequencing & Dependency Graph

Execution is partitioned into four strictly ordered phases:

```
[Phase 0: Architectural Alignment & Approvals]
  - Formal sign-off on consolidated decisions list
       │
       ▼
[Phase 1: Architecture Documentation & Contracts]
  - Create system-architecture.md & calculation-engine-spec.md (I-08)
  - Update database-design.md table count (I-09), hybrid schema (I-02), and least-privilege DDL (I-16, I-17, I-18)
  - Update api-specification.md token lifespan (I-11) and framework version (I-14)
       │
       ▼
[Phase 2: Frontend Core Data & Calculation Engine Remediation]
  - Update toolsData.js canonical routes (I-03, I-04, I-12)
  - Refactor academicCalculationEngine.js: roundAcademic parity & allowlist formula evaluation (I-06, I-07)
  - Update toolManagementService.js enums, thresholds, and filters (I-05, I-10, I-15)
       │
       ▼
[Phase 3: Frontend Routing & Guard Alignment]
  - Create PlaceholderToolPage.jsx and register all 11 missing routes in App.jsx (I-01)
  - Add client-side redirect for /calculators/credite-calculate (I-12)
  - Reassign guard for /calculators/marks-convert (I-13)
       │
       ▼
[Phase 3.1: Frontend Standalone Pure Calculators & Content Guides]
  - Implement sgpa-to-cgpa, scale-converter, grade-predictor, attendance, pdf-gen
  - Implement cgpa-info-finder, cgpa-improvement content pages
       │
       ▼
[Phase 4: Backend Implementation & Migration (Future)]
  - Spring Boot 3.4.x entities matching reconciled schema
  - Flyway migrations V1__schema.sql to V3__audit.sql
  - Automated parity test suite validating 11 shared test vectors
```

---

## 5. Consolidated Decisions Requiring Owner Approval

Before implementation begins, please review and approve the following design decisions:

1. **Tool Delivery Phasing (I-01):** Approve registering all 11 missing routes in Phase 3 with temporary `PlaceholderToolPage` components, followed by delivering the 5 pure calculators and 2 content guides in Phase 3.1 without blocking on Spring Boot.
2. **`tools_registry` Hybrid Schema (I-02):** Approve the Hybrid Relational + `config_json` schema to optimize query indexing while cleanly supporting variable tool-specific configs.
3. **Canonical Route Paths & URL Fragments (I-03, I-04):** Approve assigning dedicated routes in `toolsData.js` to standalone tools (`/calculators/sgpa`, `/calculators/grade`, etc.) and storing `#hash` in `route_path` only for true tab modes (`cgpa-converter`).
4. **Rounding Mode Contract (I-10):** Approve adopting `HALF_UP`, `FLOOR`, `CEILING`, and `TRUNCATE` as the canonical naming convention across both frontend and backend, with the JavaScript exponential shifting implementation for IEEE-754 drift.
5. **URL Typo Rename & Dual Redirects (I-12):** Approve renaming `/calculators/credite-calculate` to `/calculators/credit-calculate` across the 8 files, adding React Router client-side fallback and server-level HTTP 301 redirect.
6. **JWT Access Token Expiry (I-11):** Approve the 15-minute access token lifespan backed by a 7-day `HttpOnly` refresh token.
7. **Spring Boot Framework Version (I-14):** Approve standardizing on Spring Boot 3.4.x with Java 21 LTS.
8. **University Regulation Verification Protocol (I-18):** Approve preserving OU BCA/MCA 'S' grade as verified, while tagging non-CS OU courses as `PENDING_VERIFICATION` prior to database seeding.

---
*End of Remediation Plan — ResultPoint Post-Audit Engineering Specifications v2.0.0*
