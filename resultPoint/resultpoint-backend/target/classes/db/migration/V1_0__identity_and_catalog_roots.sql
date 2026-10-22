-- =============================================================================
-- ResultPoint Schema Migration: V1_0__identity_and_catalog_roots.sql
-- Tier 0 Root Independent Entities (11 Tables)
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

-- 1. users
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

-- 2. universities
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

-- 3. grading_scales
CREATE TABLE grading_scales (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scale_type ENUM('10_POINT_O', '10_POINT_S', '4_POINT', 'PERCENTAGE_ONLY') NOT NULL DEFAULT '10_POINT_O',
    description VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. calculation_rules
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

-- 5. subjects
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

-- 6. tools_registry
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

-- 7. announcements
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

-- 8. audit_logs (Immutable audit trail)
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

-- 9. daily_visitor_metrics
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

-- 10. route_page_views
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

-- 11. calculator_usage_stats
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
