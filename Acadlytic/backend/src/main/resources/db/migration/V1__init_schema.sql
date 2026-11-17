-- ==============================================================================
-- Acadlytic Database Baseline Migration
-- Version: V1__init_schema.sql
-- Description: Establishes baseline schema verification and system metadata.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_key VARCHAR(100) NOT NULL,
    property_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_system_metadata_key UNIQUE (property_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO system_metadata (property_key, property_value) 
VALUES 
    ('platform_name', 'Acadlytic Academic Intelligence Platform'),
    ('baseline_version', '1.0.0'),
    ('environment_mode', 'MODULAR_MONOLITH');
