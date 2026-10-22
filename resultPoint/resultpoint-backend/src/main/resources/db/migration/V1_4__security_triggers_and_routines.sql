-- =============================================================================
-- ResultPoint Schema Migration: V1_4__security_triggers_and_routines.sql
-- Security Objects: Immutable Audit Trigger & Scheduled Retention Procedure
-- Compatible with Flyway MySQL JDBC parser
-- =============================================================================

-- 1. Trigger to unconditionally enforce audit-log immutability
-- Single statement syntax eliminates delimiter requirement for maximum JDBC compatibility
DROP TRIGGER IF EXISTS trg_audit_logs_no_update;

CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Security Violation: Records in audit_logs are strictly immutable and cannot be updated.';

-- 2. Stored Procedure for batched statutory retention cleanup
-- Uses standard Flyway MySQL DELIMITER directive (intercepted & stripped by Flyway JDBC parser)
DROP PROCEDURE IF EXISTS sp_purge_expired_audit_logs;

DELIMITER //
CREATE DEFINER = 'resultpoint_maint'@'localhost' PROCEDURE sp_purge_expired_audit_logs(
    IN p_retention_days INT,
    OUT p_deleted_rows INT
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_cutoff DATETIME(6);
    DECLARE v_batch_deleted INT DEFAULT 0;
    DECLARE v_total_deleted INT DEFAULT 0;

    -- Statutory Minimum Retention: Reject NULL and enforce minimum 365 days
    IF p_retention_days IS NULL OR p_retention_days < 365 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Retention period cannot be NULL or less than 365 days per compliance policy.';
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
END //
DELIMITER ;
