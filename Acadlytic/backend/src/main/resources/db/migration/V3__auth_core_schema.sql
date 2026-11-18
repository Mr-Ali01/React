-- ==============================================================================
-- Acadlytic Phase 02 Authentication & Authorization Core Schema
-- Version: V3__auth_core_schema.sql
-- Description:
--   - Minimal colleges tenant foundation (extensible by Phase 03/04)
--   - users with MySQL 8 VIRTUAL generated columns (ADR-06, ADR-09, ADR-13)
--   - auth_tokens (DB-hashed single-use tokens for password reset & email flows)
--   - audit_events (immutable authentication & security audit log)
--   - outbox_emails (transactional email outbox — ADR-15, ADR-18)
-- Note: Zero Post-MVP branch tables; zero Phase 03 registration/document tables.
-- ==============================================================================

CREATE TABLE colleges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    permanently_rejected BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP NULL,
    active_college_code VARCHAR(50) GENERATED ALWAYS AS (
        CASE
            WHEN permanently_rejected = FALSE AND archived_at IS NULL THEN code
            ELSE NULL
        END
    ) VIRTUAL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_colleges_active_college_code UNIQUE (active_college_code),
    CONSTRAINT chk_colleges_approval_status CHECK (
        approval_status IN ('PENDING', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED')
    ),
    CONSTRAINT chk_colleges_status CHECK (
        status IN ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_colleges_approval_status ON colleges (approval_status);
CREATE INDEX idx_colleges_status ON colleges (status);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id BIGINT NULL,
    email VARCHAR(255) NOT NULL,
    pending_email VARCHAR(255) NULL,
    email_verified_at TIMESTAMP NULL,
    email_released BOOLEAN NOT NULL DEFAULT FALSE,
    active_email VARCHAR(255) GENERATED ALWAYS AS (
        CASE
            WHEN email_released = FALSE THEN email
            ELSE NULL
        END
    ) VIRTUAL,
    active_college_admin_college_id BIGINT GENERATED ALWAYS AS (
        CASE
            WHEN role = 'COLLEGE_ADMIN' AND status = 'ACTIVE' THEN college_id
            ELSE NULL
        END
    ) VIRTUAL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_college_id FOREIGN KEY (college_id) REFERENCES colleges (id),
    CONSTRAINT uq_users_active_email UNIQUE (active_email),
    CONSTRAINT uk_users_single_active_college_admin UNIQUE (active_college_admin_college_id),
    CONSTRAINT chk_users_role CHECK (
        role IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACADEMIC_STAFF', 'STUDENT')
    ),
    CONSTRAINT chk_users_status CHECK (
        status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')
    ),
    CONSTRAINT chk_users_failed_login_attempts CHECK (failed_login_attempts >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_college_id ON users (college_id);
CREATE INDEX idx_users_role_status ON users (role, status);
CREATE INDEX idx_users_pending_email ON users (pending_email);

CREATE TABLE auth_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_type VARCHAR(30) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    target_email VARCHAR(255) NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_auth_tokens_hash UNIQUE (token_hash),
    CONSTRAINT chk_auth_tokens_type CHECK (
        token_type IN ('PASSWORD_RESET', 'EMAIL_CHANGE', 'EMAIL_VERIFICATION')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_auth_tokens_user_type ON auth_tokens (user_id, token_type, used_at, revoked_at);
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens (expires_at);

CREATE TABLE audit_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    actor_user_id BIGINT NULL,
    actor_role VARCHAR(30) NULL,
    target_user_id BIGINT NULL,
    college_id BIGINT NULL,
    outcome VARCHAR(20) NOT NULL,
    ip_address VARCHAR(64) NULL,
    metadata_json TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_audit_events_outcome CHECK (
        outcome IN ('SUCCESS', 'FAILURE', 'DENIED')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_events_type_created ON audit_events (event_type, created_at);
CREATE INDEX idx_audit_events_college_created ON audit_events (college_id, created_at);
CREATE INDEX idx_audit_events_actor_created ON audit_events (actor_user_id, created_at);

CREATE TABLE outbox_emails (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_key VARCHAR(64) NOT NULL,
    payload_json TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_at TIMESTAMP NULL,
    last_error VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    CONSTRAINT chk_outbox_emails_status CHECK (
        status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED_PERMANENT')
    ),
    CONSTRAINT chk_outbox_emails_attempts CHECK (attempt_count >= 0 AND max_attempts > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_outbox_emails_status_next_attempt ON outbox_emails (status, next_attempt_at);
CREATE INDEX idx_outbox_emails_status_locked_at ON outbox_emails (status, locked_at);
