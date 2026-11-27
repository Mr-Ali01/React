package com.acadlytic.modules.colleges.migration;

import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.flywaydb.core.api.FlywayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Flyway pre-migration validation callback for Migration V6 (Document-Level Review).
 *
 * Executes BEFORE migration V6 is applied (Event.BEFORE_EACH_MIGRATE).
 * Validates that all existing legacy registration documents belong to one of the exact 8
 * approved (colleges.approval_status, college_registrations.status) workflow tuples.
 *
 * If any unsupported tuple, NULL status, orphaned document, or cross-tenant ownership mismatch
 * is detected, this callback throws FlywayException BEFORE any DDL or DML in V6 executes.
 * This guarantees ZERO schema mutations, ZERO data corruption, and ZERO persistent stored
 * procedures or temporary routines in the database.
 */
@Component
public class V6DocumentReviewMigrationPreflightCallback implements Callback {

    private static final Logger log = LoggerFactory.getLogger(V6DocumentReviewMigrationPreflightCallback.class);

    private static final String TARGET_VERSION = "6";

    private static final String VALIDATION_QUERY = """
        SELECT COUNT(*)
        FROM college_registration_documents crd
        LEFT JOIN college_registrations cr ON crd.registration_id = cr.id AND crd.college_id = cr.college_id
        LEFT JOIN colleges c ON crd.college_id = c.id
        WHERE c.id IS NULL
           OR cr.id IS NULL
           OR crd.college_id != cr.college_id
           OR c.approval_status IS NULL
           OR cr.status IS NULL
           OR (
               (c.approval_status, cr.status) NOT IN (
                   ('APPROVED', 'APPROVED'),
                   ('APPROVED', 'ACTION_REQUIRED'),
                   ('APPROVED', 'REJECTED'),
                   ('PENDING', 'PENDING'),
                   ('ACTION_REQUIRED', 'ACTION_REQUIRED'),
                   ('ACTION_REQUIRED', 'PENDING'),
                   ('REJECTED', 'REJECTED'),
                   ('REJECTED', 'PENDING')
               )
           )
    """;

    @Override
    public boolean supports(Event event, Context context) {
        if (event != Event.BEFORE_EACH_MIGRATE) {
            return false;
        }
        MigrationInfo info = context.getMigrationInfo();
        return info != null && info.getVersion() != null && TARGET_VERSION.equals(info.getVersion().getVersion());
    }

    @Override
    public boolean canHandleInTransaction(Event event, Context context) {
        return true;
    }

    @Override
    public void handle(Event event, Context context) {
        log.info("Executing Flyway preflight validation for Migration V{}...", TARGET_VERSION);

        Connection connection = context.getConnection();
        try (PreparedStatement stmt = connection.prepareStatement(VALIDATION_QUERY);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                int invalidCount = rs.getInt(1);
                if (invalidCount > 0) {
                    throw new FlywayException(
                        "V6 Migration Preflight Failed: Detected " + invalidCount + " document record(s) with unsupported legacy status " +
                        "combinations, orphaned registration references, or cross-tenant ownership mismatches. " +
                        "Migration halted before any schema mutation or data backfill."
                    );
                }
            }
            log.info("Flyway preflight validation for Migration V{} passed successfully with 0 violations.", TARGET_VERSION);
        } catch (SQLException ex) {
            throw new FlywayException("Failed to execute V6 preflight legacy data validation query: " + ex.getMessage(), ex);
        }
    }

    @Override
    public String getCallbackName() {
        return "V6DocumentReviewMigrationPreflightCallback";
    }
}
