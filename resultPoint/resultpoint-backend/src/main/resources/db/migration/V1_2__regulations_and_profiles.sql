-- =============================================================================
-- ResultPoint Schema Migration: V1_2__regulations_and_profiles.sql
-- Tier 2 & Tier 3 Multi-Parent Relational Entities & Profiles (7 Tables)
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

-- 22. regulations
CREATE TABLE regulations (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    rule_version VARCHAR(50) NOT NULL,
    verification_status ENUM('UNVERIFIED', 'VERIFIED', 'UNDER_REVIEW') NOT NULL DEFAULT 'VERIFIED',
    grading_scale_id VARCHAR(64) NOT NULL,
    calculation_rule_id VARCHAR(64) NOT NULL,
    status ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_regulations_course_code UNIQUE (course_id, code),
    CONSTRAINT fk_regulations_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_regulations_grading_scale FOREIGN KEY (grading_scale_id) REFERENCES grading_scales(id) ON DELETE RESTRICT,
    CONSTRAINT fk_regulations_calc_rule FOREIGN KEY (calculation_rule_id) REFERENCES calculation_rules(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. education_record_subjects
CREATE TABLE education_record_subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    education_record_id VARCHAR(64) NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    subject_code VARCHAR(30) NULL,
    marks_obtained DECIMAL(5,2) NULL,
    max_marks DECIMAL(5,2) NULL,
    grade VARCHAR(10) NULL,
    credits DECIMAL(4,2) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_edu_rec_sub_record FOREIGN KEY (education_record_id) REFERENCES education_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_edu_rec_sub_rec ON education_record_subjects(education_record_id);

-- 24. support_query_replies
CREATE TABLE support_query_replies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    query_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NULL,
    sender_role ENUM('STUDENT', 'ADMIN', 'GUEST') NOT NULL,
    sender_name VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_support_replies_query FOREIGN KEY (query_id) REFERENCES support_queries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_support_replies_query ON support_query_replies(query_id, created_at ASC);

-- 25. admission_batches
CREATE TABLE admission_batches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    regulation_id VARCHAR(64) NOT NULL,
    batch_name VARCHAR(50) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_admission_batches_reg_batch UNIQUE (regulation_id, batch_name),
    CONSTRAINT fk_admission_batches_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. regulation_subjects
CREATE TABLE regulation_subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    regulation_id VARCHAR(64) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    semester_number TINYINT UNSIGNED NOT NULL,
    credits_override DECIMAL(4,2) NULL,
    type_override ENUM('THEORY', 'PRACTICAL', 'LAB', 'PROJECT', 'ELECTIVE') NULL,
    is_elective BOOLEAN NOT NULL DEFAULT FALSE,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_reg_sub UNIQUE (regulation_id, subject_id, semester_number),
    CONSTRAINT fk_reg_sub_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_sub_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_reg_sub_lookup ON regulation_subjects(regulation_id, semester_number);

-- 27. study_resources
CREATE TABLE study_resources (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    resource_type ENUM('SYLLABUS', 'PREVIOUS_PAPER', 'NOTES', 'FORMULA_SHEET', 'GUIDE') NOT NULL,
    university_id VARCHAR(64) NULL,
    course_id VARCHAR(64) NULL,
    regulation_id VARCHAR(64) NULL,
    semester_number TINYINT UNSIGNED NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT UNSIGNED NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    download_count INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_study_resources_university FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL,
    CONSTRAINT fk_study_resources_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_study_resources_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_study_resources_lookup ON study_resources(university_id, course_id, regulation_id, semester_number, status);

-- 28. student_profiles
CREATE TABLE student_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    university_id VARCHAR(64) NOT NULL,
    course_id VARCHAR(64) NOT NULL,
    regulation_id VARCHAR(64) NOT NULL,
    batch_year VARCHAR(30) NOT NULL,
    hall_ticket_number VARCHAR(60) NOT NULL,
    institution_name VARCHAR(255) NULL,
    current_semester TINYINT UNSIGNED NOT NULL DEFAULT 1,
    date_of_birth DATE NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    cumulative_cgpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    total_credits_earned DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    target_cgpa DECIMAL(4,2) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_student_profiles_user_id UNIQUE (user_id),
    CONSTRAINT uq_student_profiles_hall_ticket UNIQUE (university_id, hall_ticket_number),
    CONSTRAINT fk_student_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_profiles_university FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT,
    CONSTRAINT fk_student_profiles_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_student_profiles_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE RESTRICT,
    CONSTRAINT chk_student_current_sem CHECK (current_semester BETWEEN 1 AND 12),
    CONSTRAINT chk_student_cgpa CHECK (cumulative_cgpa BETWEEN 0.00 AND 10.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_student_profiles_lookup ON student_profiles(university_id, course_id, regulation_id);
