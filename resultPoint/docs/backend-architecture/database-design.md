# ResultPoint Database Design — Relational Schema & Snapshot Architecture (MySQL 8.0)

## 1. Schema Overview & Design Principles

The ResultPoint relational database is architected for **MySQL 8.0** using the **InnoDB** storage engine. It provides strict ACID transaction guarantees, referential integrity via foreign key constraints, UTF8MB4 international character support, and deterministic B-tree indexing.

### Core Design Rules
1. **Surrogate Primary Keys:** All tables use either an auto-incrementing `BIGINT UNSIGNED` primary key (for performance-critical and high-volume transaction/event tables) or a prefixed alphanumeric surrogate identifier `VARCHAR(64)` (for external-facing entities matching existing ResultPoint ID schemes, e.g., `usr_admin_01`, `sem_result_04`).
2. **Deterministic Monetary & Academic Precision:** All academic metrics (SGPA, CGPA, target marks, percentages, credit points) use `DECIMAL(4,2)` or `DECIMAL(5,2)` rather than floating-point numbers (`FLOAT` or `DOUBLE`) to eliminate IEEE-754 binary rounding drift.
3. **Immutability of Academic History:** Published semester results and student transcripts **must never mutate** when an administrator updates the academic catalog. This is achieved through explicit **rule version snapshotting** (`rule_version_id`, `grading_scale_snapshot_json`, `formula_snapshot_json`) stored directly in the result records.
4. **Normalized Curriculum Sharing:** Standard engineering and undergraduate subjects (e.g., Mathematics, Environmental Science, C Programming) are defined once in a master `subjects` table and mapped to regulations via a `regulation_subjects` join table, supporting credit overrides and elective designations without catalog duplication.

---

## 2. Complete Inventory of Proposed Tables

The schema comprises **32 physical tables** organized into **10 cohesive business domains**:
- **27 Existing Tables**: Preserved from the foundational draft.
- **4 Modified Existing Tables**: `student_profiles` (adds `institution_name`), `calculation_rules` (standardizes `rounding_mode`), `tools_registry` (adopts Hybrid Schema), and `saved_calculations` (adds `client_idempotency_key`).
- **5 Genuinely New Tables**: `user_refresh_tokens`, `password_reset_tokens`, `student_notifications`, `blog_posts`, and `study_resources`.

| # | Physical Table Name | Domain | Classification | Primary Key Type | Description |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `users` | 1. Identity & Access | Existing Table | `VARCHAR(64)` | User accounts, credentials, and global roles (`STUDENT`, `ADMIN`). |
| **2** | `user_refresh_tokens` | 1. Identity & Access | **New Table (1/5)** | `BIGINT UNSIGNED` | Max 3 sessions/user, rotation grace window, device metadata, SHA-256 hashes. |
| **3** | `password_reset_tokens` | 1. Identity & Access | **New Table (2/5)** | `BIGINT UNSIGNED` | Single-use SHA-256 hashed password reset tokens with expiration. |
| **4** | `student_profiles` | 2. Student Profile | **Modified Table** | `VARCHAR(64)` | Student academic metadata, affiliated `institution_name`, university, course, regulation, batch. |
| **5** | `universities` | 3. Academic Catalog | Existing Table | `VARCHAR(64)` | Accredited degree-granting universities (e.g., Osmania University, JNTUH). |
| **6** | `courses` | 3. Academic Catalog | Existing Table | `VARCHAR(64)` | Degree programs offered by universities (e.g., BCA, B.Tech CSE, MCA). |
| **7** | `regulations` | 3. Academic Catalog | Existing Table | `VARCHAR(64)` | Academic regulations and syllabus frameworks with `verification_status`. |
| **8** | `admission_batches` | 3. Academic Catalog | Existing Table | `BIGINT UNSIGNED` | Academic cohorts/batches mapped to regulations (e.g., 2023-2026). |
| **9** | `subjects` | 3. Academic Catalog | Existing Table | `VARCHAR(64)` | Master catalog of courses/subjects across all curricula. |
| **10** | `regulation_subjects` | 3. Academic Catalog (Join) | Existing Table | `BIGINT UNSIGNED` | Curriculum mapping linking subjects to regulations, semesters, and credits. |
| **11** | `grading_scales` | 4. Calculation Rules | Existing Table | `VARCHAR(64)` | Named grading systems (e.g., OU 10-Point S-Grade, standard 10-Point O-Grade). |
| **12** | `grade_boundaries` | 4. Calculation Rules | Existing Table | `BIGINT UNSIGNED` | Individual grade letters, grade points, percentage ranges, and pass/fail status. |
| **13** | `calculation_rules` | 4. Calculation Rules | **Modified Table** | `VARCHAR(64)` | SGPA, CGPA, and conversion formulas (`HALF_UP`, `FLOOR`, `CEILING`, `TRUNCATE`). |
| **14** | `semester_results` | 5. Student Results | Existing Table | `VARCHAR(64)` | Verified semester scorecards with frozen SGPA, CGPA, and rule snapshots. |
| **15** | `subject_results` | 5. Student Results | Existing Table | `VARCHAR(64)` | Subject-level grades, credits, and grade points for a semester result. |
| **16** | `student_backlogs` | 5. Student Results | Existing Table | `VARCHAR(64)` | Tracked active and cleared subject backlogs/arrears. |
| **17** | `student_goals` | 5. Student Results | Existing Table | `VARCHAR(64)` | Target CGPA planning and target achievement projections. |
| **18** | `education_records` | 6. Multi-Qualification | Existing Table | `VARCHAR(64)` | Comprehensive qualifications (Class 10, Class 12, UG, PG). |
| **19** | `education_record_subjects` | 6. Multi-Qualification | Existing Table | `BIGINT UNSIGNED` | Subject-level marks and grades for multi-qualification education records. |
| **20** | `tools_registry` | 7. Tools Registry | **Modified Table** | `VARCHAR(64)` | Hybrid Schema: Relational metadata, `tab_anchor`, validated `config_json`. |
| **21** | `saved_calculations` | 7. Tools Registry | **Modified Table** | `VARCHAR(64)` | Saved calculator outputs with `client_idempotency_key` unique constraint. |
| **22** | `announcements` | 8. Content & Support | Existing Table | `VARCHAR(64)` | Broadcast announcements with audience targeting. |
| **23** | `announcement_reads` | 8. Content & Support (Join) | Existing Table | `BIGINT UNSIGNED` | Tracks per-user announcement reads and dismissals. |
| **24** | `student_notifications` | 8. Content & Support | **New Table (3/5)** | `VARCHAR(64)` | Personal, event-driven student notifications (`notificationService.js`). |
| **25** | `blog_posts` | 8. Content & Support | **New Table (4/5)** | `VARCHAR(64)` | Admin-authored editorial articles and guides (`blogService.js`). |
| **26** | `study_resources` | 8. Content & Support | **New Table (5/5)** | `VARCHAR(64)` | Academic study resources, syllabus PDFs, and previous papers (`resourceManagementService.js`). |
| **27** | `support_queries` | 9. Helpdesk | Existing Table | `VARCHAR(64)` | Student support and contact tickets with priority and status tracking. |
| **28** | `support_query_replies` | 9. Helpdesk | Existing Table | `BIGINT UNSIGNED` | Threaded response history and administrative notes for support queries. |
| **29** | `audit_logs` | 10. Governance & Telemetry | Existing Table | `BIGINT UNSIGNED` | Immutable audit log protected by trigger `trg_audit_logs_no_update`. |
| **30** | `daily_visitor_metrics` | 10. Governance & Telemetry | Existing Table | `BIGINT UNSIGNED` | Daily aggregate rollups of page views, unique visitors, and sessions. |
| **31** | `route_page_views` | 10. Governance & Telemetry | Existing Table | `BIGINT UNSIGNED` | Daily route-level visitor analytics and hit counters. |
| **32** | `calculator_usage_stats`| 10. Governance & Telemetry | Existing Table | `BIGINT UNSIGNED` | Daily per-calculator execution, completion, and save telemetry. |

*(Summary: 25 Core Business Entities + 3 Join/Read Tables + 4 Telemetry/Rollup Tables = Exactly 32 Physical Tables).*

---

## 3. Table-by-Table Relational Schema Specifications

### Domain 1: Identity, Access & Student Profiles

#### Table 1: `users`
Represents all system actors. Passwords are never stored in plaintext.
```sql
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    status ENUM('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'ACTIVE',
    avatar_url VARCHAR(500) NULL,
    phone VARCHAR(30) NULL,
    last_login_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Table 2: `user_refresh_tokens`
Enforces a maximum of 3 concurrent active sessions per user, single-use token rotation, 30-second concurrency grace window with encrypted response payload, and token theft detection.
```sql
CREATE TABLE user_refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    cached_response_payload VARCHAR(1024) NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    expires_at DATETIME(6) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at DATETIME(6) NULL,
    revocation_reason VARCHAR(40) NULL,
    replaced_by_token_id BIGINT UNSIGNED NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_refresh_tokens_user ON user_refresh_tokens(user_id, is_revoked, expires_at);
```

#### Table 3: `password_reset_tokens`
Single-use password reset tokens with SHA-256 digest hashing and strict expiration.
```sql
CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_pwd_reset_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_pwd_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pwd_reset_tokens_user ON password_reset_tokens(user_id, is_used);
```

---

### Domain 2: Student Profiles

#### Table 4: `student_profiles`
Maintains university affiliation, enrollment details, affiliated college (`institution_name`), and academic standing for students.
```sql
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
```

---

### Domain 3: Academic Catalog & Curriculum Governance

#### Table 5: `universities`
```sql
CREATE TABLE universities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(30) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    type VARCHAR(60) NOT NULL,
    website VARCHAR(255) NULL,
    accreditation VARCHAR(50) NULL,
    established_year INT UNSIGNED NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_universities_short_name UNIQUE (short_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table 6: `courses`
```sql
CREATE TABLE courses (
    id VARCHAR(64) PRIMARY KEY,
    university_id VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(30) NOT NULL,
    level ENUM('UG', 'PG', 'DIPLOMA', 'PHD') NOT NULL,
    duration_years TINYINT UNSIGNED NOT NULL DEFAULT 4,
    total_semesters TINYINT UNSIGNED NOT NULL DEFAULT 8,
    total_degree_credits DECIMAL(5,1) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_courses_uni_short_name UNIQUE (university_id, short_name),
    CONSTRAINT fk_courses_university FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT,
    CONSTRAINT chk_courses_semesters CHECK (total_semesters = duration_years * 2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_courses_university_level ON courses(university_id, level);
```

#### Table 7: `regulations`
```sql
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
```

#### Table 8: `admission_batches`
Associates academic cohorts with regulations.
```sql
CREATE TABLE admission_batches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    regulation_id VARCHAR(64) NOT NULL,
    batch_name VARCHAR(50) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_admission_batches_reg_batch UNIQUE (regulation_id, batch_name),
    CONSTRAINT fk_admission_batches_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table 9: `subjects`
Canonical inventory of subjects across the institution.
```sql
CREATE TABLE subjects (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    default_credits DECIMAL(4,2) NOT NULL,
    default_type ENUM('THEORY', 'PRACTICAL', 'LAB', 'PROJECT', 'ELECTIVE') NOT NULL DEFAULT 'THEORY',
    department VARCHAR(100) NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_subjects_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_subjects_department ON subjects(department);
```

#### Table 10: `regulation_subjects`
Links subjects to specific regulations, allowing common subjects across branches with branch-specific semester sequencing or credit adjustments.
```sql
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
```

---

### Domain 4: Calculation Rules & Grading Scales

#### Table 11: `grading_scales`
```sql
CREATE TABLE grading_scales (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scale_type ENUM('10_POINT_O', '10_POINT_S', '4_POINT', 'PERCENTAGE_ONLY') NOT NULL DEFAULT '10_POINT_O',
    description VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table 12: `grade_boundaries`
```sql
CREATE TABLE grade_boundaries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    grading_scale_id VARCHAR(64) NOT NULL,
    grade_letter VARCHAR(10) NOT NULL,
    grade_points DECIMAL(4,2) NOT NULL,
    min_percentage DECIMAL(5,2) NOT NULL,
    max_percentage DECIMAL(5,2) NOT NULL,
    qualitative_desc VARCHAR(60) NOT NULL,
    is_pass BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_grade_scale_letter UNIQUE (grading_scale_id, grade_letter),
    CONSTRAINT fk_grade_boundaries_scale FOREIGN KEY (grading_scale_id) REFERENCES grading_scales(id) ON DELETE CASCADE,
    CONSTRAINT chk_grade_points CHECK (grade_points >= 0.00),
    CONSTRAINT chk_percentages CHECK (min_percentage <= max_percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_grade_boundaries_lookup ON grade_boundaries(grading_scale_id, min_percentage, max_percentage);
```

#### Table 13: `calculation_rules`
```sql
CREATE TABLE calculation_rules (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sgpa_formula VARCHAR(60) NOT NULL DEFAULT 'WEIGHTED_CREDIT_SUM',
    cgpa_formula VARCHAR(60) NOT NULL DEFAULT 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
    percentage_formula_expression VARCHAR(150) NOT NULL,
    percentage_formula_desc VARCHAR(200) NOT NULL,
    rounding_mode ENUM('HALF_UP', 'FLOOR', 'CEILING', 'TRUNCATE') NOT NULL DEFAULT 'HALF_UP',
    decimal_places TINYINT UNSIGNED NOT NULL DEFAULT 2,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Domain 5: Student Results & Historical Snapshots

#### Table 14: `semester_results`
Freezes rule version snapshots to ensure historical scorecard immutability.
```sql
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
```

#### Table 15: `subject_results`
Individual subject performance within a semester result.
```sql
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
```

#### Table 16: `student_backlogs`
Tracks backlogs and clearance history.
```sql
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
```

#### Table 17: `student_goals`
Tracks academic target projections.
```sql
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
```

---

### Domain 6: Multi-Qualification Education Records

#### Table 18: `education_records`
Supports Class 10, Class 12, UG, and PG qualifications.
```sql
CREATE TABLE education_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    type VARCHAR(30) NOT NULL,
    level VARCHAR(50) NOT NULL,
    category_group ENUM('SCHOOL', 'COLLEGE', 'UNIVERSITY') NOT NULL,
    board_or_university VARCHAR(200) NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    passing_year SMALLINT UNSIGNED NOT NULL,
    academic_year VARCHAR(30) NULL,
    roll_number VARCHAR(80) NULL,
    entry_mode ENUM('QUICK', 'SEMESTER_WISE', 'DETAILED_SUBJECT') NOT NULL DEFAULT 'QUICK',
    result_status ENUM('COMPLETED', 'PURSUING', 'INCOMPLETE') NOT NULL DEFAULT 'COMPLETED',
    total_marks DECIMAL(7,2) NULL,
    max_marks DECIMAL(7,2) NULL,
    percentage DECIMAL(5,2) NULL,
    cgpa DECIMAL(4,2) NULL,
    final_grade VARCHAR(20) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_edu_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_edu_records_user ON education_records(user_id, category_group);
```

#### Table 19: `education_record_subjects`
Subject breakdown for detailed entry mode.
```sql
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
```

---

### Domain 7: Tools Registry & Saved Calculations

#### Table 20: `tools_registry`
Adopts the Hybrid Relational + Validated `config_json` schema. Solves route uniqueness across hash fragments via `tab_anchor VARCHAR(50) NOT NULL DEFAULT ''`.

```sql
CREATE TABLE tools_registry (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(60) NOT NULL,
    route_path VARCHAR(150) NOT NULL,
    tab_anchor VARCHAR(50) NOT NULL DEFAULT '',
    icon VARCHAR(60) NOT NULL DEFAULT 'Calculator',
    icon_color VARCHAR(30) NOT NULL DEFAULT 'blue',
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT UNSIGNED NOT NULL DEFAULT 0,
    popularity INT UNSIGNED NOT NULL DEFAULT 50,
    usage_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED',
    keywords_json JSON NULL,
    config_json JSON NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_tools_registry_route_tab UNIQUE (route_path, tab_anchor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tools_registry_category_status ON tools_registry(category, status);
CREATE INDEX idx_tools_registry_display ON tools_registry(display_order ASC, popularity DESC);
```

> [!NOTE]
> **Route Uniqueness & Hash Fragments:**  
> In MySQL InnoDB, multiple `(route_path, NULL)` records do not violate a `UNIQUE` constraint because `NULL != NULL`. Defining `tab_anchor VARCHAR(50) NOT NULL DEFAULT ''` guarantees deterministic uniqueness across both standalone tools (e.g., `('/calculators/cgpa', '')`) and tab-mode tools (e.g., `('/calculators/cgpa', 'converter')`).

##### Validated `config_json` Schema Specification
The `config_json` column isolates tool-specific mathematical and operational configurations without polluting the relational schema with sparse nulls. Spring Boot validates this payload on write against the following JSON schema contract:
```json
{
  "academic": {
    "minCredits": 1.0,
    "maxCredits": 30.0,
    "allowDecimalCredits": false,
    "decimalPrecision": 2,
    "roundingMode": "HALF_UP",
    "passingGradePoints": 5.0,
    "defaultConversionFormula": "(CGPA - 0.75) * 10",
    "applicabilityScope": "GLOBAL",
    "applicableUniversities": []
  },
  "ui": {
    "badgeText": "Popular",
    "quickAccess": true,
    "helpDocUrl": "/docs/cgpa-calculator-guide"
  }
}
```

#### Table 21: `saved_calculations`
Maintains saved calculation outputs for authenticated students, featuring a unique client idempotency constraint for safe network retries and guest calculation imports.

```sql
CREATE TABLE saved_calculations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    tool_id VARCHAR(64) NULL,
    tool_title VARCHAR(150) NOT NULL,
    summary_text VARCHAR(255) NOT NULL,
    score_display VARCHAR(50) NOT NULL,
    metrics_json JSON NULL,
    input_details_json JSON NULL,
    path VARCHAR(150) NOT NULL,
    client_idempotency_key VARCHAR(64) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_saved_calc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_calc_tool FOREIGN KEY (tool_id) REFERENCES tools_registry(id) ON DELETE SET NULL,
    CONSTRAINT uq_saved_calc_idempotency UNIQUE (user_id, client_idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_saved_calc_user ON saved_calculations(user_id, created_at DESC);
CREATE INDEX idx_saved_calc_tool ON saved_calculations(tool_id);
```

> [!IMPORTANT]
> **Guest Calculation Import Idempotency Protocol:**
> 1. **Explicit User Confirmation:** Guest calculations cached in client `localStorage` (`resultpoint_saved_calculations`) are **never imported silently** upon login. An explicit confirmation dialog prompts the student.
> 2. **Transaction Boundaries & Deduplication:** When confirmed, the client submits the batch to `POST /api/v1/student/saved-calculations/import-guest`. Each item includes a client-generated UUID `client_idempotency_key`. The backend wraps imports in a `@Transactional` block. Re-sent requests or connection timeouts safely hit `uq_saved_calc_idempotency` without creating duplicates.
> 3. **Client Storage Purge:** The frontend clears the guest calculation `localStorage` buffer **only after receiving an HTTP 200/201 response** from the backend.

---

### Domain 8: Content & Community Support

#### Table 22: `announcements`
Broadcast announcements with audience segmentation and scheduling.
```sql
CREATE TABLE announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500) NULL,
    category VARCHAR(80) NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    audience ENUM('ALL', 'STUDENTS', 'ADMINS', 'UNIVERSITY', 'COURSE', 'REGULATION') NOT NULL DEFAULT 'ALL',
    target_university_id VARCHAR(64) NULL,
    target_course_id VARCHAR(64) NULL,
    target_regulation_id VARCHAR(64) NULL,
    published_at DATETIME(6) NULL,
    expires_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_announcements_lookup ON announcements(status, audience, published_at DESC);
```

#### Table 23: `announcement_reads`
Per-user announcement view and dismissal tracking.
```sql
CREATE TABLE announcement_reads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    announcement_id VARCHAR(64) NOT NULL,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_announcement_user UNIQUE (user_id, announcement_id),
    CONSTRAINT fk_announcement_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_reads_anc FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table 24: `student_notifications`
Event-driven personal notifications for students (e.g., backlog alerts, grade target milestones, system updates).
```sql
CREATE TABLE student_notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('INFO', 'SUCCESS', 'WARNING', 'ALERT') NOT NULL DEFAULT 'INFO',
    action_url VARCHAR(255) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_student_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_student_notifications_user ON student_notifications(user_id, is_read, created_at DESC);
```

#### Table 25: `blog_posts`
Editorial articles, academic guidance, and university regulation breakdown posts.
```sql
CREATE TABLE blog_posts (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(200) NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(500) NULL,
    content LONGTEXT NOT NULL,
    category VARCHAR(60) NOT NULL,
    tags_json JSON NULL,
    cover_image_url VARCHAR(500) NULL,
    author_id VARCHAR(64) NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    published_at DATETIME(6) NULL,
    views_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_blog_posts_slug UNIQUE (slug),
    CONSTRAINT fk_blog_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category, status);
```

> [!NOTE]
> **Admin-Only Blog Authorization:**  
> All write, update, deletion, and publishing endpoints (`POST`, `PUT`, `PATCH`, `DELETE` under `/api/v1/admin/blogs`) require strict server-side `ROLE_ADMIN` authorization (`@PreAuthorize("hasRole('ADMIN')")`). Anonymous users and students possess read-only access to published articles via `GET /api/v1/blogs`.

#### Table 26: `study_resources`
Curated academic syllabus PDFs, previous examination question papers, and study guides.
```sql
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
```

---

### Domain 9: Helpdesk & Support Tickets

#### Table 27: `support_queries`
Student and guest support tickets.
```sql
CREATE TABLE support_queries (
    id VARCHAR(64) PRIMARY KEY,
    ticket_number VARCHAR(30) NOT NULL,
    user_id VARCHAR(64) NULL,
    guest_name VARCHAR(120) NULL,
    guest_email VARCHAR(255) NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(60) NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    assigned_admin_id VARCHAR(64) NULL,
    resolution_notes TEXT NULL,
    resolved_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_support_queries_ticket UNIQUE (ticket_number),
    CONSTRAINT fk_support_queries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_support_queries_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_support_queries_status ON support_queries(status, priority, created_at DESC);
```

#### Table 28: `support_query_replies`
Threaded conversation history and internal administrator notes for tickets.
```sql
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
```

---

### Domain 10: Governance & Telemetry

#### Table 29: `audit_logs`
Immutable system audit log capturing administrative mutations and security events.
```sql
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_id VARCHAR(64) NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action_type VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    entity_name VARCHAR(200) NULL,
    details_json JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### Table 30: `daily_visitor_metrics`
Daily aggregate rollups of authentic website visitor telemetry.
```sql
CREATE TABLE daily_visitor_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_page_views INT UNSIGNED NOT NULL DEFAULT 0,
    unique_visitors INT UNSIGNED NOT NULL DEFAULT 0,
    anonymous_visitors INT UNSIGNED NOT NULL DEFAULT 0,
    authenticated_visitors INT UNSIGNED NOT NULL DEFAULT 0,
    calculation_sessions INT UNSIGNED NOT NULL DEFAULT 0,
    bounce_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_daily_visitor_metric_date UNIQUE (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_daily_metrics_date ON daily_visitor_metrics(metric_date DESC);
```

#### Table 31: `route_page_views`
Route-level hit counts for capacity planning and content analytics.
```sql
CREATE TABLE route_page_views (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL,
    route_path VARCHAR(200) NOT NULL,
    total_hits INT UNSIGNED NOT NULL DEFAULT 0,
    unique_hits INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_route_metric UNIQUE (metric_date, route_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_route_page_views_date ON route_page_views(metric_date DESC, total_hits DESC);
```

#### Table 32: `calculator_usage_stats`
Daily per-tool execution, completion, and save telemetry.
```sql
CREATE TABLE calculator_usage_stats (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL,
    tool_id VARCHAR(64) NOT NULL,
    executions_count INT UNSIGNED NOT NULL DEFAULT 0,
    completions_count INT UNSIGNED NOT NULL DEFAULT 0,
    saved_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_calc_usage_tool_date UNIQUE (metric_date, tool_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_calc_usage_tool ON calculator_usage_stats(tool_id, metric_date DESC);
```

---

## 4. Security Enforcement, Immutability & Retention Architecture

### 4.1 Audit-Log Immutability & Least-Privilege Access

ResultPoint enforces data integrity and non-repudiation for audit trails through layered database security:

1. **Least-Privilege Database Role Permissions:**
   The Spring Boot application connects to MySQL using a dedicated application user (`resultpoint_app`). This user is granted **strictly limited** permissions on the `audit_logs` table:
   ```sql
   -- Application role has INSERT and SELECT only
   GRANT SELECT, INSERT ON resultpoint_db.audit_logs TO 'resultpoint_app'@'%';
   -- UPDATE and DELETE privileges are explicitly denied/withheld
   REVOKE UPDATE, DELETE ON resultpoint_db.audit_logs FROM 'resultpoint_app'@'%';
   ```

2. **Trigger-Level Immutability Guard:**
   To protect against accidental or malicious modifications by privileged database connections, an unconditional trigger prohibits any `UPDATE` operations:
   ```sql
   DELIMITER $$
   CREATE TRIGGER trg_audit_logs_no_update
   BEFORE UPDATE ON audit_logs
   FOR EACH ROW
   BEGIN
       SIGNAL SQLSTATE '45000'
           SET MESSAGE_TEXT = 'Security Violation: Records in audit_logs are strictly immutable and cannot be updated.';
   END$$
   DELIMITER ;
   ```

3. **Elimination of Connection Session State Leakage:**
   ResultPoint strictly rejects user-defined session variables (e.g. `@rp_allow_audit_delete`) to toggle audit triggers. In pooled connection architectures (HikariCP), session variables persist across connection reuse, creating severe security holes where subsequent unrelated requests inherit elevated deletion privileges.

### 4.2 Automated Audit Log Retention & Purge Procedure

To satisfy statutory compliance while preventing runaway table bloat, table maintenance is executed through a dedicated stored procedure `sp_purge_expired_audit_logs`:

```sql
DELIMITER $$
CREATE PROCEDURE sp_purge_expired_audit_logs(
    IN p_retention_days INT,
    OUT p_deleted_rows INT
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_cutoff DATETIME(6);
    DECLARE v_batch_deleted INT DEFAULT 0;
    DECLARE v_total_deleted INT DEFAULT 0;

    -- Transaction Safety: Reject execution inside an active caller transaction
    IF @@in_transaction = 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Purge procedure cannot be executed inside an active caller transaction.';
    END IF;

    -- Statutory Minimum Retention: Enforce minimum 365 days
    IF p_retention_days < 365 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Retention period cannot be less than 365 days per compliance policy.';
    END IF;

    SET v_cutoff = DATE_SUB(NOW(6), INTERVAL p_retention_days DAY);
    SET p_deleted_rows = 0;

    -- Chunked batch deletion to prevent long-held row locks and replication lag
    purge_loop: LOOP
        DELETE FROM audit_logs
        WHERE created_at < v_cutoff
        LIMIT 5000;

        SET v_batch_deleted = ROW_COUNT();
        SET v_total_deleted = v_total_deleted + v_batch_deleted;

        -- Exit when remaining matching records are exhausted
        IF v_batch_deleted < 5000 THEN
            LEAVE purge_loop;
        END IF;
    END LOOP purge_loop;

    SET p_deleted_rows = v_total_deleted;
END$$
DELIMITER ;
```

- **Execution Privileges:** Executed exclusively by a dedicated maintenance cron user (`resultpoint_maintenance`) with `EXECUTE` privileges on `sp_purge_expired_audit_logs`.
- **Transaction Safety:** The check `IF @@in_transaction = 1` ensures the procedure will not run within an application transaction, preventing unbounded transaction locks.
- **Batch Chunking:** Deleting in batches of 5,000 rows prevents InnoDB table lock escalation and buffer pool exhaustion.

### 4.3 Refresh-Token Session Enforcement, Rotation & Concurrency Grace Window

#### Session Limits (Maximum 3 Active Sessions)
Each user is permitted a **maximum of 3 active concurrent refresh-token sessions** (e.g. laptop, mobile, tablet). When a user logs in from a 4th device, the backend performs deterministic FIFO eviction: the oldest active token session is automatically revoked (`is_revoked = TRUE, revocation_reason = 'SESSION_LIMIT_EXCEEDED'`).

#### Single-Use Token Rotation & Irreversible Hashing
- **One-Way Digest:** The database stores `token_hash = SHA-256(raw_token)`. The raw cryptographically random token (UUIDv4 or secure 256-bit string) is returned to the client once over HTTPS and is never stored in plaintext on disk.
- **Rotation:** Upon calling `POST /api/v1/auth/refresh`, the presented token is immediately revoked (`is_revoked = TRUE, revoked_at = NOW(6)`) and a new refresh token is issued.

#### 30-Second Encrypted Concurrency Grace Window
To prevent race conditions when multiple browser tabs concurrently attempt to refresh an expiring access token:
1. **Primary Frontend Defense:** React client services use the Web Locks API (`navigator.locks.request('rp_token_refresh', ...)`) or a `BroadcastChannel` to coordinate token refresh across tabs, ensuring only one tab triggers the refresh endpoint.
2. **Backend Resiliency Cache:** When token rotation occurs, the server encrypts the new response payload using **AES-256-GCM** with a server-managed key and 96-bit random nonce, storing it in `cached_response_payload VARCHAR(1024)` on the revoked token record.
3. **Grace Window Replay:** If a sibling browser tab submits the recently rotated token within **30 seconds** of revocation:
   - The server verifies that `NOW(6) - revoked_at <= 30 SECONDS`.
   - The server decrypts and re-serves the identical cached payload (`accessToken`, `refreshToken`, `expiresIn`).
   - Sibling tabs synchronize seamlessly without triggering session revocation.
4. **Theft Detection:** If a revoked token is presented **after the 30-second grace window**, the system recognizes token replay/theft:
   - All active sessions for the user are immediately revoked (`revocation_reason = 'TOKEN_THEFT_DETECTED'`).
   - A critical security audit log is emitted (`action_type = 'SECURITY_ALERT_TOKEN_THEFT'`).
   - The user must re-authenticate with credentials.

