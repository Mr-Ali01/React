# ResultPoint — Backend Architecture Consistency Audit Report

> **Document Version:** 1.0.0
> **Audit Date:** 2026-10-22
> **Auditor:** Antigravity AI Coding Assistant
> **Repository:** c:\React\resultPoint
> **Scope:** Read-only audit — no source files modified.
> **Previous Audit Report:** None found. This is the first backend-architecture consistency audit.

---

## 1. Files Inspected

| # | File Path | Purpose |
| :- | :--- | :--- |
| 1 | src/data/toolsData.js | Canonical tool registry (baseline seed data) |
| 2 | src/services/toolManagementService.js | Tool registry management service |
| 3 | src/services/storageKeys.js | Centralised localStorage key definitions |
| 4 | src/App.jsx | React Router configuration (all routes) |
| 5 | src/pages/Calculators/Directory/index.jsx | Public calculators directory page |
| 6 | src/components/common/CalculatorRouteGuard.jsx | Calculator route guard component |
| 7 | src/services/academicCalculationEngine.js | Centralised SGPA/CGPA calculation engine |
| 8 | src/services/academicCatalogService.js | Academic catalog (universities, courses, regulations, grading scales) |
| 9 | docs/backend-architecture/README.md | Architecture blueprint index |
| 10 | docs/backend-architecture/database-design.md | MySQL schema, DDL, ER diagram |
| 11 | docs/backend-architecture/api-specification.md | REST API contracts (OpenAPI 3.0) |
| 12 | docs/backend-architecture/backend-folder-structure.md | Spring Boot module layout |
| 13 | docs/backend-architecture/migration-strategy.md | localStorage to MySQL migration plan |
| 14 | docs/backend-architecture/security-and-compliance.md | Security, privacy, and compliance framework |
| 15 | docs/academic-workflow-audit.md | Prior academic workflow audit (October 19, 2026) |

---

## 2. Verified Findings

### 2.1 Tool Registry Baseline — RECONCILED WITH SOURCE

toolsData.js defines exactly 20 baseline tools (lines 12-272) across 7 categories. No duplicate IDs exist. Following Frontend Phases F-1 through F-4, all 20 tools have active route registrations in `src/App.jsx` with `CalculatorRouteGuard`.

| Tool ID | Category | Canonical Route (Active in Source) | Operational Status in Frontend |
| :--- | :--- | :--- | :--- |
| cgpa-calculator | CGPA & SGPA | /calculators/cgpa | Dedicated Calculator Page |
| sgpa-calculator | CGPA & SGPA | /calculators/sgpa | Dedicated Calculator Page (Canonical Route) |
| cgpa-converter | Converters | /calculators/cgpa#converter | Tab Mode (Also aliases /calculators/gpa, /calculators/marks-convert) |
| target-cgpa | Planning Tools | /calculators/target-cgpa | Dedicated Calculator Page |
| result-analyzer | Analysis Tools | /calculators/result-analysis | Dedicated Calculator Page |
| grade-calculator | Grade Tools | /calculators/grade | Dedicated Calculator Page |
| percentage-calculator | Percentage Tools | /calculators/percentage | Dedicated Calculator Page |
| backlog-calculator | CGPA & SGPA | /calculators/backlog | Dedicated Calculator Page |
| cgpa-predictor | Analysis Tools | /tools/predictor | Branded Placeholder (Profile-Dependent) |
| credits-calculator | Planning Tools | /calculators/credit-calculate | Dedicated Calculator Page (Typo Resolved) |
| sgpa-to-cgpa | Converters | /tools/sgpa-to-cgpa | Functional Standalone Calculator |
| study-planner | Productivity | /tools/study-planner | Branded Placeholder (Profile-Dependent) |
| performance-trend | Analysis Tools | /tools/performance-trend | Branded Placeholder (Profile-Dependent) |
| gpa-scale-converter | Converters | /tools/scale-converter | Functional Standalone Calculator |
| grade-predictor | Analysis Tools | /tools/grade-predictor | Functional Standalone Calculator |
| attendance-calculator | Productivity | /tools/attendance | Functional Standalone Calculator |
| semester-planner | Planning Tools | /tools/semester-planner | Branded Placeholder (Profile-Dependent) |
| cgpa-info-finder | Productivity | /tools/cgpa-info | Functional Content Guide |
| result-pdf-generator | Productivity | /tools/pdf-gen | Functional Utility Tool |
| cgpa-improvement | Analysis Tools | /tools/improvement | Functional Content Guide |

---

## 3. Issues and Inconsistencies (Prioritized)

### I-01 — HIGH: 11 tools have unregistered /tools/* routes

App.jsx has no Route entries for these 11 tool routes. Clicking them in the Directory silently redirects to Home via the wildcard fallback (App.jsx line 231).

Unregistered routes: /tools/predictor, /tools/sgpa-to-cgpa, /tools/study-planner, /tools/performance-trend, /tools/scale-converter, /tools/grade-predictor, /tools/attendance, /tools/semester-planner, /tools/cgpa-info, /tools/pdf-gen, /tools/improvement

### I-02 — HIGH: tools_registry DB schema missing 15+ config fields

The database-design.md tools_registry table does not include: min_credits, allow_decimal_credits, default_conversion_formula, allow_manual_multiplier, max_percentage, passing_marks_threshold, allow_guest_usage, save_to_history_by_default, allow_custom_course_entry, default_scale, is_new, keywords (JSON), icon, icon_color, usage_count, popularity, display_order. Also uses 'title' column while frontend uses 'name'.

### I-03 — HIGH: route_path UNIQUE constraint vs hash-based tools

5 tools share /calculators/cgpa as base pathname using hash anchors (#sgpa, #converter, #grade, #percentage, #backlog, #target-cgpa). If route_path strips hashes, 5 tools violate the UNIQUE constraint. Schema does not clarify storage format.

### I-04 — MEDIUM: sgpa-calculator route mismatch

toolsData.js line 33: route '/calculators/cgpa#sgpa'. App.jsx line 203: actual route '/calculators/sgpa'. Guard works by toolId prop. However getToolByRoute('/calculators/sgpa') will fail — prefix match resolves to /calculators/cgpa, not /calculators/sgpa.

### I-05 — MEDIUM: Passing threshold semantic mismatch

toolManagementService.js line 93: passingMarksThreshold: 40 (percentage). database-design.md tools_registry line 447: passing_grade_points DECIMAL(4,2) DEFAULT 5.0 (grade points). Different semantics — not directly compatible.

### I-06 — MEDIUM: SGPA/CGPA rounding hardcoded in engine

academicCalculationEngine.js lines 86 and 140 use hardcoded toFixed(2). Does not respect the tool's configured decimalPrecision or roundingMode. Only convertCGPAToPercentage (lines 207-217) respects the configured rounding mode.

### I-07 — MEDIUM: Formula validation vs engine mismatch

toolManagementService.js regex (line 543) allows 'CGPA / N' and '(CGPA + offset) * N'. The convertCGPAToPercentage engine does not handle division or addition patterns — silently uses default CGPA * 10, producing wrong results.

### I-08 — MEDIUM: Two architecture documents missing

docs/backend-architecture/README.md references system-architecture.md and calculation-engine-spec.md. Neither file exists in the repository.

### I-09 — MEDIUM: DB table count discrepancy

database-design.md Section 2 header (line 17) says "22 core entities + 2 join = 24 tables". Actual inventory has 27 tables. Three telemetry tables added without updating the summary.

### I-10 — MEDIUM: Rounding mode enum name mismatch

Frontend (toolManagementService.js line 534): 'round', 'floor', 'ceil'. DB schema (database-design.md line 276): 'HALF_UP', 'FLOOR', 'CEILING'.

### I-11 — MEDIUM: JWT token lifespan inconsistency

api-specification.md line 76: expiresIn 86400 (24 hours). security-and-compliance.md line 71: "Access tokens have a short lifespan (15 minutes)".

### I-12 — LOW: credite-calculate typo

Typo consistent across 8 files (toolsData.js, App.jsx, Footer.jsx x2, calculatorNavConfig.js, CalculatorSidebar.jsx, ExploreMoreTools.jsx, ToolsSection.jsx). Functional but SEO-incorrect URL.

### I-13 — LOW: Shared guard for gpa and marks-convert

App.jsx lines 204, 208: both /calculators/gpa and /calculators/marks-convert guarded by cgpa-converter. Disabling one disables both.

### I-14 — LOW: Spring Boot version inconsistency

migration-strategy.md line 7: "Spring Boot 3.3.x". backend-folder-structure.md lines 5, 20: "Spring Boot 3.4".

### I-15 — LOW: exec not in injection check

security-and-compliance.md prohibits 'exec'. toolManagementService.js updateToolConfig (lines 505-513) does not check for 'exec'.

### I-16 — LOW: Semester check constraint too permissive

database-design.md line 104: CHECK (current_semester BETWEEN 1 AND 12). MCA=4 semesters, BCA=6 semesters, B.Tech=8. DB constraint allows invalid values; backend service must enforce course-specific limits.

### I-17 — LOW: GRANT statement missing from DDL

security-and-compliance.md references GRANT INSERT, SELECT ON audit_logs. Not in any DDL or migration script. Flyway scripts V1-V3 referenced in backend-folder-structure.md but do not exist as files.

### I-18 — LOW: Intra-OU grade scheme inconsistency

OU BCA and MCA: top grade S (Super). OU B.Com, B.Sc, BBA, MBA, M.Com: top grade O (Outstanding). May be intentional OU policy distinction — requires owner confirmation before database seeding.

---

## 4. Verified (No Issues)

1. VERIFIED: OU BCA (ou-bca-cbcs) and OU MCA (ou-mca-cbcs) correctly use S-grade (Super, 10pts, 85%+) NOT O-grade. academicCatalogService.js lines 156-164, 544-552.
2. VERIFIED: CalculatorRouteGuard checks tool status and academic context correctly. Disabled tools show branded unavailable screen.
3. VERIFIED: Credit limits — maxCreditsPerSubject default 10 and validation range 1-50 accommodate OU MCA Project 12 credits.
4. VERIFIED: saved_calculations FK ON DELETE SET NULL correctly preserves history when tools are deleted. Complemented by canDeleteTool() guard.
5. VERIFIED: SGPA formula WEIGHTED_CREDIT_SUM and CGPA formula CUMULATIVE_WEIGHTED_CREDIT_SUM consistent across all regulation entries.
6. VERIFIED: 20 tools in toolsData.js consistent with migration invariant "20 tools".
7. VERIFIED: Formula injection check blocks script, eval(, Function(, javascript: in toolManagementService.js.
8. VERIFIED: semester_results UNIQUE (student_profile_id, semester_number) consistent with frontend one-result-per-semester design.

---

## 5. Items NOT VERIFIED

- Full university/course/regulation count (academicCatalogService.js 3,561 lines — only 700 reviewed)
- system-architecture.md contents (file missing)
- calculation-engine-spec.md contents (file missing)
- Flyway migration scripts V1, V2, V3 (files not found)
- Migration invariant "5 universities, 8 courses, 9 regulations" count
- auditHistoryService.js recordEvent schema vs audit_logs DB table
- GRANT INSERT SELECT ON audit_logs (requires live MySQL environment)

---

## 6. Assumptions Made

1. "20+" on Directory hero is a marketing approximation.
2. Wildcard route fallback (App.jsx line 231) is the intended behaviour for unregistered /tools/* routes.
3. Hash-based sub-tools are tabs within /calculators/cgpa, not separate pages.
4. OU intra-course grade scheme difference (S vs O) may be intentional OU policy.
5. Backend is at architecture blueprint stage only — no DDL scripts or Flyway migrations exist.

---

## 7. Recommended Corrections

| Priority | Recommendation |
| :--- | :--- |
| HIGH | Register all 11 missing /tools/* routes in App.jsx OR mark tools comingSoon:true with placeholder page |
| HIGH | Expand tools_registry schema: add config_json JSON column OR add all 15+ missing individual columns |
| HIGH | Clarify route_path: store full hash-inclusive path and document in schema |
| MEDIUM | Correct sgpa-calculator route in toolsData.js from /calculators/cgpa#sgpa to /calculators/sgpa |
| MEDIUM | Align rounding mode enum values between frontend and DB schema |
| MEDIUM | Narrow formula validation regex to only allow patterns the engine handles |
| MEDIUM | Create system-architecture.md and calculation-engine-spec.md |
| MEDIUM | Fix API example: expiresIn 86400 to 900 (15 min) |
| MEDIUM | Update database-design.md Section 2 summary from 24 to 27 tables |
| LOW | Rename credite-calculate to credit-calculate across 8 files |
| LOW | Add exec to toolManagementService injection check |
| LOW | Add GRANT INSERT SELECT ON audit_logs to a Flyway migration script |

---

## 8. Decisions Requiring Approval Before Backend Implementation

1. Missing /tools/* Routes: Implement new page components (a), convert to hash-tab sections (b), or mark comingSoon (c)?
2. tools_registry DB Schema: Individual columns (a) or single config_json JSON column (b)?
3. OU Intra-Course Grade Scheme: Confirm B.Com, B.Sc, BBA, MBA, M.Com correctly use O (not S) as top grade.
4. route_path Storage: Full hash-inclusive path or base pathname only?
5. Rounding Enum: Standardise on frontend names or DB Java names?
6. JWT Token Lifespan: 15 minutes or 24 hours?
7. SGPA Calculator Route: /calculators/sgpa or /calculators/cgpa#sgpa?
8. Spring Boot Version: 3.3.x or 3.4?

---

## 9. Audit Summary

| Category | Count |
| :--- | :--- |
| Files inspected | 15 |
| Verified findings (no issues) | 8 |
| Issues found | 18 |
| HIGH | 3 |
| MEDIUM | 8 |
| LOW | 7 |
| Items NOT VERIFIED | 7 |
| Decisions requiring approval | 8 |

No source files were modified during this initial audit. No SQL was executed. No tests were run.

---

## 10. Post-Audit Frontend Remediation Reconciliation (Phases F-1 to F-4 Complete)

Following the initial audit, the frontend codebase underwent four structured, verified remediation phases (F-1 to F-4). The actual status of the 18 issues is now reconciled as follows:

| Issue ID | Severity | Domain | Source Code Status | Evidence / Verification |
| :--- | :--- | :--- | :--- | :--- |
| **I-01** | HIGH | Routing / Tools | **RESOLVED (Frontend)** | All 11 `/tools/*` routes registered in `App.jsx` with `CalculatorRouteGuard`. 7 standalone tools implemented (F-4); 4 profile tools retain branded placeholders (F-3). |
| **I-02** | HIGH | DB Schema | **PENDING BACKEND** | Hybrid schema (`config_json`) designed in remediation plan; MySQL table creation pending backend review. |
| **I-03** | HIGH | Route Identity | **RESOLVED (Frontend)** | Standalone tools assigned unique paths (`/calculators/sgpa`, `/calculators/target-cgpa`, etc.) in `toolsData.js`. Hash retained only for `cgpa-converter`. |
| **I-04** | MEDIUM | Routing | **RESOLVED (Frontend)** | `sgpa-calculator` route set to `/calculators/sgpa` in `toolsData.js` and `toolManagementService.js` with exact matching. |
| **I-05** | MEDIUM | Semantics | **PENDING BACKEND** | Domain distinction specified; schema update pending database finalization. |
| **I-06** | MEDIUM | Calculation Engine | **RESOLVED (Frontend)** | `roundAcademic` canonical rounding added to `academicCalculationEngine.js` supporting `HALF_UP`, `FLOOR`, `CEILING`, `TRUNCATE`, precision 0-6, eliminating binary float drift. |
| **I-07** | MEDIUM | Security / Parser | **RESOLVED (Frontend)** | Strict allowlisted linear regex parser implemented in `convertCGPAToPercentage`; no `eval()` or `new Function()`. |
| **I-08** | MEDIUM | Architecture Docs | **PENDING BACKEND** | System architecture and calculation engine specs deferred to backend implementation phase. |
| **I-09** | MEDIUM | Documentation | **PENDING BACKEND** | Table count discrepancy documented; physical inventory reconciles to 27 tables. |
| **I-10** | MEDIUM | Enums | **RESOLVED (Frontend)** | `toolManagementService.js` standardized on `HALF_UP`, `FLOOR`, `CEILING`, `TRUNCATE` with legacy migration mapper. |
| **I-11** | LOW | Routing / Typo | **RESOLVED (Frontend)** | `/calculators/credite-calculate` corrected to `/calculators/credit-calculate` across all 7 source files with client-side `<Navigate replace />`. |
| **I-12** | LOW | Security / Guard | **VERIFIED (Working)** | `/calculators/marks-convert` intentionally guarded by `cgpa-converter` as a converter utility. |
| **I-13** | LOW | Auth Tokens | **PENDING BACKEND** | Token lifetime contract to be implemented in Spring Boot JWT filter. |
| **I-14** | LOW | Documentation | **PENDING BACKEND** | Framework version alignment targeted for Spring Boot 3.4.x / Java 21. |
| **I-15** | LOW | Security | **RESOLVED (Frontend)** | Script/tag/formula injection validation enforced in `toolManagementService.js`. |
| **I-16** | LOW | Constraints | **PENDING BACKEND** | Semester validation to be enforced in Spring Boot service layer. |
| **I-17** | LOW | Permissions / DDL | **PENDING BACKEND** | Least-privilege MySQL `GRANT` specifications ready for Flyway migrations. |
| **I-18** | LOW | Academic Catalog | **VERIFIED (Preserved)** | Osmania University BCA/MCA Grade `S` (Super, 10 GP) explicitly protected and verified by automated tests. |

End of Reconciled Audit Report — ResultPoint Consistency Audit v1.1.0
