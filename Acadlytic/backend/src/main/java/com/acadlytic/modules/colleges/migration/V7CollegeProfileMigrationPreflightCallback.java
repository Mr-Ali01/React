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
 * Flyway pre-migration and post-migration validation callback for Migration V7 (College Operational Profile).
 *
 * Evaluates on Migration V7:
 * - BEFORE_EACH_MIGRATE: Audits legacy approved colleges for missing or inconsistent authoritative revision
 *   pointers and partially populated operational profiles. Emits structured diagnostic warnings without
 *   throwing exceptions, allowing valid colleges to proceed and invalid ones to be safely skipped.
 * - AFTER_EACH_MIGRATE: Audits backfilled operational profile metrics. Strictly non-throwing and read-only;
 *   never performs schema mutations or hard assertions that would leave Flyway in an unrecoverable failure state.
 */
@Component
public class V7CollegeProfileMigrationPreflightCallback implements Callback {

    private static final Logger log = LoggerFactory.getLogger(V7CollegeProfileMigrationPreflightCallback.class);

    private static final String TARGET_VERSION = "7";

    private static final String AUDIT_INCONSISTENT_POINTERS_QUERY = """
        SELECT c.id, c.code, c.current_registration_id, cr.college_id, cr.status
        FROM colleges c
        LEFT JOIN college_registrations cr ON c.current_registration_id = cr.id
        WHERE c.approval_status = 'APPROVED'
          AND (
              c.current_registration_id IS NULL
              OR cr.id IS NULL
              OR cr.college_id != c.id
              OR cr.status != 'APPROVED'
          )
    """;

    private static final String CHECK_COLUMN_EXISTS_QUERY = """
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'colleges'
          AND COLUMN_NAME = 'address_line1'
    """;

    private static final String AUDIT_PARTIAL_PROFILES_QUERY = """
        SELECT c.id, c.code
        FROM colleges c
        WHERE c.approval_status = 'APPROVED'
          AND (
              c.address_line1 IS NOT NULL
              OR c.address_line2 IS NOT NULL
              OR c.city IS NOT NULL
              OR c.state IS NOT NULL
              OR c.country IS NOT NULL
              OR c.postal_code IS NOT NULL
              OR c.contact_phone IS NOT NULL
              OR c.contact_email IS NOT NULL
              OR c.website_url IS NOT NULL
              OR c.affiliated_university_name IS NOT NULL
              OR c.established_year IS NOT NULL
              OR c.accreditation_details IS NOT NULL
              OR c.logo_storage_key IS NOT NULL
          )
    """;

    private static final String POST_MIGRATION_METRICS_QUERY = """
        SELECT COUNT(*)
        FROM colleges
        WHERE approval_status = 'APPROVED'
          AND address_line1 IS NOT NULL
    """;

    @Override
    public boolean supports(Event event, Context context) {
        if (event != Event.BEFORE_EACH_MIGRATE && event != Event.AFTER_EACH_MIGRATE) {
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
        MigrationInfo info = context.getMigrationInfo();
        if (info == null || info.getVersion() == null || !TARGET_VERSION.equals(info.getVersion().getVersion())) {
            return;
        }

        Connection connection = context.getConnection();

        if (event == Event.BEFORE_EACH_MIGRATE) {
            handlePreflight(connection);
        } else if (event == Event.AFTER_EACH_MIGRATE) {
            handlePostMigration(connection);
        }
    }

    private void handlePreflight(Connection connection) {
        log.info("Executing Flyway preflight validation for Migration V{}...", TARGET_VERSION);

        try {
            // Audit 1: Missing or Inconsistent Authoritative Revision Pointers
            try (PreparedStatement stmt = connection.prepareStatement(AUDIT_INCONSISTENT_POINTERS_QUERY);
                 ResultSet rs = stmt.executeQuery()) {
                int inconsistentCount = 0;
                while (rs.next()) {
                    inconsistentCount++;
                    long collegeId = rs.getLong("id");
                    String collegeCode = rs.getString("code");
                    Long currentRegistrationId = (Long) rs.getObject("current_registration_id");
                    Long revCollegeId = (Long) rs.getObject("college_id");
                    String revStatus = rs.getString("status");

                    log.warn("V7 Preflight: College [id={}, code={}] has invalid/missing authoritative revision pointer " +
                            "[current_registration_id={}, revision_college_id={}, revision_status={}]. " +
                            "This college will be safely excluded from automatic profile backfill.",
                            collegeId, collegeCode, currentRegistrationId, revCollegeId, revStatus);
                }

                if (inconsistentCount > 0) {
                    log.warn("V7 Preflight Audit 1: Found {} approved college(s) with missing or inconsistent revision pointers.",
                            inconsistentCount);
                } else {
                    log.info("V7 Preflight Audit 1: All approved colleges possess valid authoritative revision pointers.");
                }
            }

            // Audit 2: Partially Populated Operational Profiles (only in re-run / existing column scenarios)
            boolean columnExists = false;
            try (PreparedStatement stmt = connection.prepareStatement(CHECK_COLUMN_EXISTS_QUERY);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    columnExists = rs.getInt(1) > 0;
                }
            }

            if (columnExists) {
                try (PreparedStatement stmt = connection.prepareStatement(AUDIT_PARTIAL_PROFILES_QUERY);
                     ResultSet rs = stmt.executeQuery()) {
                    int partialCount = 0;
                    while (rs.next()) {
                        partialCount++;
                        long collegeId = rs.getLong("id");
                        String collegeCode = rs.getString("code");
                        log.info("V7 Preflight: College [id={}, code={}] has pre-existing operational profile data. " +
                                "Preserved by 13-column all-null defensive safeguard.", collegeId, collegeCode);
                    }
                    if (partialCount > 0) {
                        log.info("V7 Preflight Audit 2: Found {} college(s) with pre-existing profile data preserved.", partialCount);
                    }
                }
            }

            log.info("Flyway preflight validation for Migration V{} completed successfully.", TARGET_VERSION);
        } catch (SQLException ex) {
            log.error("Failed to execute V7 preflight validation query: {}", ex.getMessage(), ex);
            throw new FlywayException("Failed to execute V7 preflight validation query: " + ex.getMessage(), ex);
        }
    }

    private void handlePostMigration(Connection connection) {
        log.info("Executing Flyway post-migration diagnostics for Migration V{}...", TARGET_VERSION);
        try (PreparedStatement stmt = connection.prepareStatement(POST_MIGRATION_METRICS_QUERY);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                int backfilledCount = rs.getInt(1);
                log.info("V7 Post-Migration: College operational profile migration completed. " +
                        "Total approved colleges with populated operational profile: {}", backfilledCount);
            }
        } catch (SQLException ex) {
            // Post-migration logging must NEVER throw FlywayException or fail the completed migration
            log.warn("V7 Post-Migration: Diagnostic metrics query failed: {}", ex.getMessage());
        }
    }

    @Override
    public String getCallbackName() {
        return "V7CollegeProfileMigrationPreflightCallback";
    }
}
