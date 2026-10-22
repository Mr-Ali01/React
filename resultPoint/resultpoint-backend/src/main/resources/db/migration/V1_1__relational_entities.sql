-- =============================================================================
-- ResultPoint Schema Migration: V1_1__relational_entities.sql
-- Tier 1 Single-Parent Relational Entities (10 Tables)
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

-- 12. user_refresh_tokens
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
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_refresh_tokens_replaced_by FOREIGN KEY (replaced_by_token_id) REFERENCES user_refresh_tokens(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_refresh_tokens_user ON user_refresh_tokens(user_id, is_revoked, expires_at);

-- 13. password_reset_tokens
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

-- 14. education_records
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

-- 15. student_notifications
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

-- 16. blog_posts
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

-- 17. support_queries
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

-- 18. announcement_reads
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

-- 19. saved_calculations
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

-- 20. grade_boundaries
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

-- 21. courses
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
