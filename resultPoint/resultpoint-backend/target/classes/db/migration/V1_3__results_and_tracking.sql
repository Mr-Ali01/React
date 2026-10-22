-- =============================================================================
-- ResultPoint Schema Migration: V1_3__results_and_tracking.sql
-- Tier 4 & Tier 5 Results, Backlogs, Goals & Subject Details (4 Tables)
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

-- 29. semester_results
CREATE TABLE semester_results (
    id VARCHAR(64) PRIMARY KEY,
    student_profile_id VARCHAR(64) NOT NULL,
    semester_number TINYINT UNSIGNED NOT NULL,
    academic_period VARCHAR(50) NOT NULL,
    total_credits DECIMAL(5,1) NOT NULL,
    credits_earned DECIMAL(5,1) NOT NULL,
    sgpa DECIMAL(4,2) NOT NULL,
    cgpa DECIMAL(4,2) NOT NULL,
    equivalent_percentage DECIMAL(5,2) NULL,
    standing_status VARCHAR(50) NOT NULL,
    rule_version_snapshot VARCHAR(60) NOT NULL,
    grading_scale_snapshot_json JSON NOT NULL,
    calculation_rule_snapshot_json JSON NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_student_sem_result UNIQUE (student_profile_id, semester_number),
    CONSTRAINT fk_sem_results_student FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_sem_sgpa CHECK (sgpa BETWEEN 0.00 AND 10.00),
    CONSTRAINT chk_sem_cgpa CHECK (cgpa BETWEEN 0.00 AND 10.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_semester_results_student ON semester_results(student_profile_id, semester_number);

-- 30. student_backlogs
CREATE TABLE student_backlogs (
    id VARCHAR(64) PRIMARY KEY,
    student_profile_id VARCHAR(64) NOT NULL,
    subject_code VARCHAR(30) NOT NULL,
    subject_name VARCHAR(200) NOT NULL,
    semester_number TINYINT UNSIGNED NOT NULL,
    credits DECIMAL(4,2) NOT NULL,
    status ENUM('ACTIVE', 'CLEARED') NOT NULL DEFAULT 'ACTIVE',
    cleared_in_period VARCHAR(50) NULL,
    cleared_grade VARCHAR(10) NULL,
    cleared_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_backlogs_student FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_backlogs_student_status ON student_backlogs(student_profile_id, status);

-- 31. student_goals
CREATE TABLE student_goals (
    id VARCHAR(64) PRIMARY KEY,
    student_profile_id VARCHAR(64) NOT NULL,
    target_cgpa DECIMAL(4,2) NOT NULL,
    target_semester TINYINT UNSIGNED NOT NULL,
    required_sgpa DECIMAL(4,2) NOT NULL,
    feasibility_status ENUM('ACHIEVABLE', 'CHALLENGING', 'MATHEMATICALLY_IMPOSSIBLE') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_goals_student FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_goals_student ON student_goals(student_profile_id, is_active);

-- 32. subject_results
CREATE TABLE subject_results (
    id VARCHAR(64) PRIMARY KEY,
    semester_result_id VARCHAR(64) NOT NULL,
    subject_code VARCHAR(30) NOT NULL,
    subject_name VARCHAR(200) NOT NULL,
    credits DECIMAL(4,2) NOT NULL,
    grade_letter VARCHAR(10) NOT NULL,
    grade_points DECIMAL(4,2) NOT NULL,
    internal_marks DECIMAL(5,2) NULL,
    external_marks DECIMAL(5,2) NULL,
    total_marks DECIMAL(5,2) NULL,
    is_pass BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_sem_res_subject UNIQUE (semester_result_id, subject_code),
    CONSTRAINT fk_sub_results_sem_result FOREIGN KEY (semester_result_id) REFERENCES semester_results(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_subject_results_sem ON subject_results(semester_result_id);
