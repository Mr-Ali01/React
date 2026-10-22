-- =============================================================================
-- ResultPoint Schema Migration: V2_0__seed_baseline_catalog.sql
-- Baseline Seeding: Universities, Scales, Rules, Regulations, & 20-Tool Registry
-- Explicit Regulatory Rule: Unverified non-CS courses marked UNDER_REVIEW
-- =============================================================================

-- 1. Seed Universities
INSERT INTO universities (id, name, short_name, city, state, type, website, accreditation, established_year, status) VALUES
('uni_ou', 'Osmania University', 'OU', 'Hyderabad', 'Telangana', 'State Public University', 'https://www.osmania.ac.in', 'NAAC A+', 1918, 'ACTIVE'),
('uni_jntuh', 'Jawaharlal Nehru Technological University, Hyderabad', 'JNTUH', 'Hyderabad', 'Telangana', 'State Technological University', 'https://jntuh.ac.in', 'NAAC A+', 1972, 'ACTIVE'),
('uni_anna', 'Anna University', 'AU', 'Chennai', 'Tamil Nadu', 'State Technological University', 'https://www.annauniv.edu', 'NAAC A++', 1978, 'ACTIVE'),
('uni_vtu', 'Visvesvaraya Technological University', 'VTU', 'Belagavi', 'Karnataka', 'State Technological University', 'https://vtu.ac.in', 'NAAC A+', 1998, 'ACTIVE');

-- 2. Seed Grading Scales
INSERT INTO grading_scales (id, name, scale_type, description) VALUES
('scale_ou_cbcs_s', 'Osmania University CBCS 10-Point (S-Grade)', '10_POINT_S', 'Osmania University CBCS grading scheme awarding Grade S (10 GP) for >= 85 marks.'),
('scale_standard_o', 'Standard UGC 10-Point (O-Grade)', '10_POINT_O', 'Standard UGC-aligned grading scale awarding Grade O (10 GP) for >= 90 marks.');

-- 3. Seed Grade Boundaries
-- For OU S-Grade Scale:
INSERT INTO grade_boundaries (grading_scale_id, grade_letter, grade_points, min_percentage, max_percentage, qualitative_desc, is_pass) VALUES
('scale_ou_cbcs_s', 'S', 10.00, 85.00, 100.00, 'Super', TRUE),
('scale_ou_cbcs_s', 'A', 9.00, 75.00, 84.99, 'Excellent', TRUE),
('scale_ou_cbcs_s', 'B', 8.00, 65.00, 74.99, 'Very Good', TRUE),
('scale_ou_cbcs_s', 'C', 7.00, 55.00, 64.99, 'Good', TRUE),
('scale_ou_cbcs_s', 'D', 6.00, 50.00, 54.99, 'Fair', TRUE),
('scale_ou_cbcs_s', 'E', 5.00, 40.00, 49.99, 'Pass', TRUE),
('scale_ou_cbcs_s', 'F', 0.00, 0.00, 39.99, 'Fail', FALSE);

-- For Standard O-Grade Scale:
INSERT INTO grade_boundaries (grading_scale_id, grade_letter, grade_points, min_percentage, max_percentage, qualitative_desc, is_pass) VALUES
('scale_standard_o', 'O', 10.00, 90.00, 100.00, 'Outstanding', TRUE),
('scale_standard_o', 'A+', 9.00, 80.00, 89.99, 'Excellent', TRUE),
('scale_standard_o', 'A', 8.00, 70.00, 79.99, 'Very Good', TRUE),
('scale_standard_o', 'B+', 7.00, 60.00, 69.99, 'Good', TRUE),
('scale_standard_o', 'B', 6.00, 50.00, 59.99, 'Above Average', TRUE),
('scale_standard_o', 'C', 5.00, 40.00, 49.99, 'Pass', TRUE),
('scale_standard_o', 'F', 0.00, 0.00, 39.99, 'Fail', FALSE);

-- 4. Seed Calculation Rules
INSERT INTO calculation_rules (id, name, sgpa_formula, cgpa_formula, percentage_formula_expression, percentage_formula_desc, rounding_mode, decimal_places) VALUES
('rule_ou_cbcs_standard', 'Osmania University CBCS Rule', 'WEIGHTED_CREDIT_SUM', 'CUMULATIVE_WEIGHTED_CREDIT_SUM', 'CGPA * 10', 'Direct 10 multiplier per OU CBCS conventions', 'HALF_UP', 2),
('rule_jntuh_r18', 'JNTUH R18/R22 Rule', 'WEIGHTED_CREDIT_SUM', 'CUMULATIVE_WEIGHTED_CREDIT_SUM', '(CGPA - 0.5) * 10', 'Offset multiplier per JNTU academic regulations', 'HALF_UP', 2),
('rule_standard_ugc', 'Standard UGC Linear Conversion', 'WEIGHTED_CREDIT_SUM', 'CUMULATIVE_WEIGHTED_CREDIT_SUM', '(CGPA - 0.75) * 10', 'AICTE and UGC recommended linear formula', 'HALF_UP', 2);

-- 5. Seed Degree Courses
INSERT INTO courses (id, university_id, name, short_name, level, duration_years, total_semesters, total_degree_credits, status) VALUES
('course_ou_bca', 'uni_ou', 'Bachelor of Computer Applications', 'BCA', 'UG', 3, 6, 150.0, 'ACTIVE'),
('course_ou_mca', 'uni_ou', 'Master of Computer Applications', 'MCA', 'PG', 2, 4, 100.0, 'ACTIVE'),
('course_ou_bcom', 'uni_ou', 'Bachelor of Commerce', 'B.Com', 'UG', 3, 6, 150.0, 'ACTIVE'),
('course_jntuh_btech_cse', 'uni_jntuh', 'B.Tech Computer Science and Engineering', 'CSE', 'UG', 4, 8, 160.0, 'ACTIVE');

-- 6. Seed Regulations (Explicit Transparency on Verification Status)
INSERT INTO regulations (id, course_id, code, name, rule_version, verification_status, grading_scale_id, calculation_rule_id, status) VALUES
-- OU CS programs: Verified against published syllabus
('reg_ou_bca_cbcs', 'course_ou_bca', 'OU-BCA-CBCS', 'OU BCA Choice Based Credit System', '2019.1', 'VERIFIED', 'scale_ou_cbcs_s', 'rule_ou_cbcs_standard', 'ACTIVE'),
('reg_ou_mca_cbcs', 'course_ou_mca', 'OU-MCA-CBCS', 'OU MCA 2-Year Curriculum Framework', '2020.1', 'VERIFIED', 'scale_ou_cbcs_s', 'rule_ou_cbcs_standard', 'ACTIVE'),
-- OU Non-CS: Explicitly marked UNDER_REVIEW until physical gazette audit
('reg_ou_bcom_cbcs', 'course_ou_bcom', 'OU-BCOM-CBCS', 'OU B.Com General CBCS Framework', '2021.1', 'UNDER_REVIEW', 'scale_standard_o', 'rule_ou_cbcs_standard', 'ACTIVE'),
-- JNTUH R18: Verified against academic handbook
('reg_jntuh_r18', 'course_jntuh_btech_cse', 'JNTUH-R18-CSE', 'JNTUH Academic Regulations R18', '2018.1', 'VERIFIED', 'scale_standard_o', 'rule_jntuh_r18', 'ACTIVE');

-- 7. Seed Canonical 20-Tool Registry
INSERT INTO tools_registry (id, title, description, category, route_path, tab_anchor, icon, icon_color, is_new, display_order, popularity, usage_count, status, keywords_json, config_json) VALUES
('cgpa-calculator', 'CGPA Calculator', 'Calculate cumulative grade point average across multiple semesters.', 'Academic Calculators', '/calculators/cgpa', '', 'Calculator', 'blue', FALSE, 1, 95, 0, 'ENABLED', '["cgpa", "cumulative", "semester", "gpa"]', '{"academic":{"minCredits":1.0,"maxCredits":30.0,"allowDecimalCredits":false,"decimalPrecision":2,"roundingMode":"HALF_UP","passingGradePoints":5.0,"defaultConversionFormula":"(CGPA - 0.75) * 10"},"ui":{"badgeText":"Popular","quickAccess":true}}'),
('sgpa-calculator', 'SGPA Calculator', 'Calculate semester grade point average with course credit points.', 'Academic Calculators', '/calculators/sgpa', '', 'BookOpen', 'indigo', FALSE, 2, 90, 0, 'ENABLED', '["sgpa", "semester", "grades", "credits"]', '{"academic":{"minCredits":1.0,"maxCredits":30.0,"allowDecimalCredits":false,"decimalPrecision":2,"roundingMode":"HALF_UP","passingGradePoints":5.0},"ui":{"badgeText":"Essential","quickAccess":true}}'),
('result-analyzer', 'Result Analysis Tool', 'Analyze subject scorecards, grade distributions, and performance trends.', 'Performance Analysis', '/calculators/result-analysis', '', 'BarChart3', 'emerald', FALSE, 3, 85, 0, 'ENABLED', '["analysis", "transcript", "grades", "distribution"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"quickAccess":true}}'),
('target-cgpa', 'Target CGPA Planner', 'Determine required future semester SGPA needed to attain your target honors CGPA.', 'Academic Planning', '/calculators/target-cgpa', '', 'Target', 'violet', FALSE, 4, 88, 0, 'ENABLED', '["target", "goal", "planning", "future cgpa"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"badgeText":"Top Tool","quickAccess":true}}'),
('credits-calculator', 'Credits Calculator', 'Track total degree credits earned against statutory graduation requirements.', 'Degree Tracking', '/calculators/credit-calculate', '', 'Award', 'amber', FALSE, 5, 80, 0, 'ENABLED', '["credits", "degree", "graduation", "requirements"]', '{"academic":{"allowDecimalCredits":true,"decimalPrecision":1,"roundingMode":"HALF_UP"},"ui":{"quickAccess":false}}'),
('grade-calculator', 'Grade Calculator', 'Estimate final subject grade based on internal assessment and external exam marks.', 'Evaluation Tools', '/calculators/grade', '', 'CheckCircle2', 'rose', FALSE, 6, 82, 0, 'ENABLED', '["grade", "internals", "externals", "marks"]', '{"academic":{"passingMarksPercentage":40.0,"passingGradePoints":5.0,"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"quickAccess":false}}'),
('percentage-calculator', 'Percentage Converter', 'Convert CGPA and SGPA to official percentage using regulation formulas.', 'Conversion Utilities', '/calculators/percentage', '', 'Percent', 'cyan', FALSE, 7, 92, 0, 'ENABLED', '["percentage", "conversion", "formula", "cgpa to percentage"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP","defaultConversionFormula":"(CGPA - 0.75) * 10"},"ui":{"quickAccess":true}}'),
('backlog-calculator', 'Backlog Impact Analyzer', 'Assess the impact of active and cleared arrears on cumulative graduation standing.', 'Remediation Tools', '/calculators/backlog', '', 'AlertTriangle', 'orange', FALSE, 8, 75, 0, 'ENABLED', '["backlog", "arrears", "supplementary", "impact"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"quickAccess":false}}'),
('cgpa-converter', 'GPA Scale Converter', 'Seamlessly convert between 10-point, 4.0 US, and other institutional grading scales.', 'Conversion Utilities', '/calculators/cgpa', 'converter', 'RefreshCw', 'teal', FALSE, 9, 78, 0, 'ENABLED', '["converter", "scale", "4.0 scale", "10 point"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"quickAccess":false}}'),
('sgpa-to-cgpa', 'SGPA to CGPA Aggregator', 'Aggregate multiple semester SGPA values directly into cumulative CGPA.', 'Academic Calculators', '/tools/sgpa-to-cgpa', '', 'Layers', 'blue', FALSE, 10, 70, 0, 'ENABLED', '["sgpa to cgpa", "aggregate", "quick cgpa"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"quickAccess":false}}'),
('scale-converter', 'Universal Scale Converter', 'Convert scores across 10-point, 7-point, 5-point, and 4-point academic frameworks.', 'Conversion Utilities', '/tools/scale-converter', '', 'Scale', 'purple', FALSE, 11, 72, 0, 'ENABLED', '["scale", "gpa scale", "7 point", "5 point"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"quickAccess":false}}'),
('grade-predictor', 'Final Grade Predictor', 'Forecast required final examination scores needed to achieve target grades.', 'Evaluation Tools', '/tools/grade-predictor', '', 'TrendingUp', 'green', FALSE, 12, 76, 0, 'ENABLED', '["predictor", "final exam", "target marks"]', '{"academic":{"decimalPrecision":2,"roundingMode":"HALF_UP"},"ui":{"quickAccess":false}}'),
('attendance-calculator', 'Attendance & Bunk Calculator', 'Calculate class attendance percentage and projected statutory shortage alerts.', 'Campus Utilities', '/tools/attendance', '', 'Clock', 'yellow', FALSE, 13, 89, 0, 'ENABLED', '["attendance", "bunk", "75 percent", "classes"]', '{"academic":{"minAttendancePercentage":75.0},"ui":{"quickAccess":true}}'),
('pdf-gen', 'Result PDF Card Generator', 'Export authenticated and formatted semester scorecards into printable PDF documents.', 'Document Export', '/tools/pdf-gen', '', 'FileText', 'red', FALSE, 14, 84, 0, 'ENABLED', '["pdf", "scorecard", "export", "print"]', '{"ui":{"quickAccess":false}}'),
('cgpa-info', 'Grading System Guide', 'Interactive reference on university grading conventions, honours, and distinctions.', 'Academic Guides', '/tools/cgpa-info', '', 'HelpCircle', 'sky', FALSE, 15, 68, 0, 'ENABLED', '["guide", "grading system", "honours", "distinction"]', '{"ui":{"quickAccess":false}}'),
('cgpa-improvement', 'CGPA Improvement Guide', 'Actionable academic remediation strategies, re-evaluation policies, and backlog rules.', 'Academic Guides', '/tools/improvement', '', 'Compass', 'fuchsia', FALSE, 16, 69, 0, 'ENABLED', '["improvement", "re-evaluation", "betterment", "strategy"]', '{"ui":{"quickAccess":false}}'),
('cgpa-predictor', 'Multi-Semester Scenario Modeler', 'Probabilistic simulation of multi-semester academic performance trajectories.', 'Advanced Planning', '/tools/predictor', '', 'Cpu', 'gray', FALSE, 17, 60, 0, 'ENABLED', '["scenario", "simulation", "trajectory"]', '{"ui":{"badgeText":"Phase 4","quickAccess":false}}'),
('performance-trend', 'Longitudinal Performance Tracker', 'Longitudinal semester-over-semester growth charting across credit categories.', 'Performance Analysis', '/tools/performance-trend', '', 'LineChart', 'gray', FALSE, 18, 62, 0, 'ENABLED', '["longitudinal", "growth", "trends"]', '{"ui":{"badgeText":"Phase 4","quickAccess":false}}'),
('study-planner', 'Weekly Study & Revision Planner', 'Curate customized study schedules and revision allocation hours based on course loads.', 'Academic Planning', '/tools/study-planner', '', 'Calendar', 'gray', FALSE, 19, 65, 0, 'ENABLED', '["study", "timetable", "planner", "revision"]', '{"ui":{"badgeText":"Phase 4","quickAccess":false}}'),
('semester-planner', 'Elective & Credit Load Planner', 'Plan elective selections and semester credit distributions toward graduation.', 'Academic Planning', '/tools/semester-planner', '', 'Sliders', 'gray', FALSE, 20, 64, 0, 'ENABLED', '["electives", "credit load", "graduation path"]', '{"ui":{"badgeText":"Phase 4","quickAccess":false}}');
