package com.acadlytic.modules.colleges;

import com.acadlytic.modules.colleges.migration.V6DocumentReviewMigrationPreflightCallback;
import com.acadlytic.modules.colleges.migration.V7CollegeProfileMigrationPreflightCallback;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Migration & Callback integration verification for Phase 04 Module 4.1 (MIG-01 through MIG-13).
 * Strictly executes against MySQL 8.0.36 via Testcontainers.
 */
class V7CollegeProfileMigrationTest extends AbstractMySqlIntegrationTest {

    private static final String V7_BACKFILL_SQL = """
        UPDATE colleges c
        JOIN college_registrations cr 
          ON c.current_registration_id = cr.id
        SET 
            c.address_line1 = cr.address_line1,
            c.address_line2 = cr.address_line2,
            c.city = cr.city,
            c.state = cr.state,
            c.country = cr.country,
            c.postal_code = cr.postal_code,
            c.contact_phone = cr.contact_phone,
            c.website_url = cr.website_url,
            c.affiliated_university_name = cr.affiliated_university_name,
            c.contact_email = NULL,
            c.established_year = NULL,
            c.accreditation_details = NULL,
            c.logo_storage_key = NULL
        WHERE c.approval_status = 'APPROVED'
          AND cr.college_id = c.id
          AND cr.status = 'APPROVED'
          AND c.address_line1 IS NULL
          AND c.address_line2 IS NULL
          AND c.city IS NULL
          AND c.state IS NULL
          AND c.country IS NULL
          AND c.postal_code IS NULL
          AND c.contact_phone IS NULL
          AND c.contact_email IS NULL
          AND c.website_url IS NULL
          AND c.affiliated_university_name IS NULL
          AND c.established_year IS NULL
          AND c.accreditation_details IS NULL
          AND c.logo_storage_key IS NULL
    """;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanState() {
        cleanAllTables();
    }

    @AfterEach
    void tearDown() {
        cleanAllTables();
    }

    private void cleanAllTables() {
        jdbcTemplate.execute("TRUNCATE TABLE college_document_reviews");
        jdbcTemplate.execute("UPDATE colleges SET current_registration_id = NULL");
        jdbcTemplate.execute(
                "UPDATE college_registration_documents SET source_document_id = NULL, source_registration_id = NULL, replaces_document_id = NULL");
        jdbcTemplate.execute("DELETE FROM college_registration_documents");
        jdbcTemplate.execute("DELETE FROM college_registrations");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM colleges");
    }

    private long insertCollege(String name, String code, String approvalStatus) {
        jdbcTemplate.update(
                """
                    INSERT INTO colleges (name, code, approval_status, status, resubmission_count, action_required_count)
                    VALUES (?, ?, ?, 'ACTIVE', 0, 0)
                """,
                name, code, approvalStatus);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private long insertRegistration(long collegeId, int version, String status, String address1, String address2,
                                   String city, String state, String country, String postal, String phone,
                                   String website, String university) {
        jdbcTemplate.update(
                """
                    INSERT INTO college_registrations (
                        college_id, version_number, status, legal_name, address_line1, address_line2,
                        city, state, country, postal_code, contact_phone, website_url, affiliated_university_name
                    ) VALUES (?, ?, ?, 'Legal Name', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                collegeId, version, status, address1, address2, city, state, country, postal, phone, website, university);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private int executeBackfill() {
        return jdbcTemplate.update(V7_BACKFILL_SQL);
    }

    private String getRootServerUrl() {
        String rootBaseUrl = (MYSQL != null) ? MYSQL.getJdbcUrl()
                : "jdbc:mysql://127.0.0.1:3306/acadlytic_test?allowPublicKeyRetrieval=true&useSSL=false";
        return rootBaseUrl.substring(0, rootBaseUrl.lastIndexOf('/') + 1)
                + "?allowPublicKeyRetrieval=true&useSSL=false";
    }

    private String getTestDbUrl(String dbName) {
        String rootBaseUrl = (MYSQL != null) ? MYSQL.getJdbcUrl()
                : "jdbc:mysql://127.0.0.1:3306/acadlytic_test?allowPublicKeyRetrieval=true&useSSL=false";
        return rootBaseUrl.substring(0, rootBaseUrl.lastIndexOf('/') + 1) + dbName
                + "?allowPublicKeyRetrieval=true&useSSL=false";
    }

    private String getRootPassword() {
        return (MYSQL != null) ? MYSQL.getPassword() : "acadlytic_test_pass";
    }

    private String getRootUsername() {
        return "root";
    }

    @Test
    @DisplayName("MIG-01: Fresh migration on empty database creates all 13 operational profile columns")
    void mig01_freshMigration_createsAll13Columns() throws Exception {
        String testDbName = "acadlytic_v7_mig01_test";
        String rootServerUrl = getRootServerUrl();
        String testDbUrl = getTestDbUrl(testDbName);
        String rootUser = getRootUsername();
        String rootPass = getRootPassword();

        try (Connection rootConn = DriverManager.getConnection(rootServerUrl, rootUser, rootPass);
             Statement rootStmt = rootConn.createStatement()) {

            rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            rootStmt.execute("CREATE DATABASE " + testDbName);

            try {
                Flyway flywayV7 = Flyway.configure()
                        .dataSource(testDbUrl, rootUser, rootPass)
                        .locations("classpath:db/migration")
                        .callbacks(
                                new V6DocumentReviewMigrationPreflightCallback(),
                                new V7CollegeProfileMigrationPreflightCallback()
                        )
                        .target("7")
                        .load();

                flywayV7.migrate();

                try (Connection conn = DriverManager.getConnection(testDbUrl, rootUser, rootPass);
                     Statement stmt = conn.createStatement()) {

                    List<String> columns = new ArrayList<>();
                    try (ResultSet rs = stmt.executeQuery("""
                            SELECT COLUMN_NAME FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = '""" + testDbName + """
                              ' AND TABLE_NAME = 'colleges'
                            """)) {
                        while (rs.next()) {
                            columns.add(rs.getString(1));
                        }
                    }

                    assertThat(columns).contains(
                            "address_line1",
                            "address_line2",
                            "city",
                            "state",
                            "country",
                            "postal_code",
                            "contact_phone",
                            "contact_email",
                            "website_url",
                            "affiliated_university_name",
                            "established_year",
                            "accreditation_details",
                            "logo_storage_key"
                    );

                    try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM colleges")) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getInt(1)).isEqualTo(0);
                    }

                    List<String> installedVersions = new ArrayList<>();
                    try (ResultSet rs = stmt.executeQuery(
                            "SELECT version, success FROM flyway_schema_history ORDER BY installed_rank")) {
                        while (rs.next()) {
                            installedVersions.add(rs.getString("version"));
                            assertThat(rs.getBoolean("success")).isTrue();
                        }
                    }
                    assertThat(installedVersions).containsExactly("1", "2", "3", "4", "5", "6", "7");
                }
            } finally {
                rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            }
        }
    }

    @Test
    @DisplayName("MIG-02: Upgrade with valid approved college populates operational fields from approved revision")
    void mig02_upgradeWithValidApprovedCollege_populatesOperationalProfile() {
        long collegeId = insertCollege("Osmania Engineering College", "OU-ENG-01", "APPROVED");
        long regId = insertRegistration(
                collegeId, 1, "APPROVED",
                "100 University Ave", "Suite 200", "Hyderabad", "Telangana", "India", "500007",
                "+91-40-12345678", "https://oueng.ac.in", "Osmania University"
        );
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", regId, collegeId);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(1);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeId);

        assertThat(college.get("address_line1")).isEqualTo("100 University Ave");
        assertThat(college.get("address_line2")).isEqualTo("Suite 200");
        assertThat(college.get("city")).isEqualTo("Hyderabad");
        assertThat(college.get("state")).isEqualTo("Telangana");
        assertThat(college.get("country")).isEqualTo("India");
        assertThat(college.get("postal_code")).isEqualTo("500007");
        assertThat(college.get("contact_phone")).isEqualTo("+91-40-12345678");
        assertThat(college.get("website_url")).isEqualTo("https://oueng.ac.in");
        assertThat(college.get("affiliated_university_name")).isEqualTo("Osmania University");
        assertThat(college.get("contact_email")).isNull();
        assertThat(college.get("established_year")).isNull();
        assertThat(college.get("accreditation_details")).isNull();
        assertThat(college.get("logo_storage_key")).isNull();
    }

    @Test
    @DisplayName("MIG-03: Approved college with NULL current_registration_id is excluded from backfill")
    void mig03_approvedCollegeWithNullPointer_excludedFromBackfill() {
        long collegeId = insertCollege("No Pointer College", "NPC-01", "APPROVED");

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(0);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeId);
        assertThat(college.get("address_line1")).isNull();
        assertThat(college.get("city")).isNull();
        assertThat(college.get("state")).isNull();
    }

    @Test
    @DisplayName("MIG-04: Cross-tenant pointer mismatch excludes college from backfill")
    void mig04_crossTenantPointerMismatch_excludedFromBackfill() {
        long collegeA = insertCollege("College Alpha", "ALPHA-01", "APPROVED");
        long collegeB = insertCollege("College Beta", "BETA-01", "APPROVED");

        long regB = insertRegistration(
                collegeB, 1, "APPROVED",
                "Beta St", null, "Bengaluru", "Karnataka", "India", "560001",
                "+91-80-11223344", "https://beta.edu", "VTU"
        );

        // Alpha points to Beta's registration revision
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", regB, collegeA);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(0);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeA);
        assertThat(college.get("address_line1")).isNull();
        assertThat(college.get("city")).isNull();
    }

    @Test
    @DisplayName("MIG-05: Pointer to non-approved registration revision excludes college from backfill")
    void mig05_pointerToNonApprovedRevision_excludedFromBackfill() {
        long collegeId = insertCollege("Pending Revision College", "PRC-01", "APPROVED");
        long pendingRegId = insertRegistration(
                collegeId, 1, "PENDING",
                "Pending Road", null, "Chennai", "Tamil Nadu", "India", "600001",
                "+91-44-99887766", "https://prc.edu", "Anna University"
        );
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", pendingRegId, collegeId);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(0);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeId);
        assertThat(college.get("address_line1")).isNull();
        assertThat(college.get("city")).isNull();
    }

    @Test
    @DisplayName("MIG-06: Multiple historical revisions backfills strictly from pointed authoritative revision")
    void mig06_multipleHistoricalRevisions_strictlyUsesPointedAuthoritativeRevision() {
        long collegeId = insertCollege("Multi Revision College", "MRC-01", "APPROVED");

        long v1 = insertRegistration(
                collegeId, 1, "APPROVED",
                "Old Address", "Old Suite", "Old City", "Old State", "India", "111111",
                "+91-11-11111111", "https://old.edu", "Old Univ"
        );
        long v2 = insertRegistration(
                collegeId, 2, "ACTION_REQUIRED",
                "Mid Address", null, "Mid City", "Mid State", "India", "222222",
                "+91-22-22222222", "https://mid.edu", "Mid Univ"
        );
        long v3 = insertRegistration(
                collegeId, 3, "APPROVED",
                "New Authoritative Road", "New Tower", "Pune", "Maharashtra", "India", "411001",
                "+91-20-33333333", "https://new.edu", "Savitribai Phule Pune University"
        );

        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", v3, collegeId);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(1);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeId);

        assertThat(college.get("address_line1")).isEqualTo("New Authoritative Road");
        assertThat(college.get("address_line2")).isEqualTo("New Tower");
        assertThat(college.get("city")).isEqualTo("Pune");
        assertThat(college.get("state")).isEqualTo("Maharashtra");
        assertThat(college.get("postal_code")).isEqualTo("411001");
        assertThat(college.get("contact_phone")).isEqualTo("+91-20-33333333");
        assertThat(college.get("website_url")).isEqualTo("https://new.edu");
        assertThat(college.get("affiliated_university_name")).isEqualTo("Savitribai Phule Pune University");
    }

    @Test
    @DisplayName("MIG-07: Defensive Data-Preservation: Existing complete profile is skipped by backfill")
    void mig07_existingCompleteProfile_skippedByBackfill() {
        long collegeId = insertCollege("Pre-existing Profile College", "PPC-01", "APPROVED");
        long regId = insertRegistration(
                collegeId, 1, "APPROVED",
                "Reg Addr", null, "Reg City", "Reg State", "India", "500001",
                "+91-40-99999999", "https://reg.edu", "Reg Univ"
        );

        jdbcTemplate.update("""
            UPDATE colleges SET
                current_registration_id = ?,
                address_line1 = 'Existing Addr 1',
                address_line2 = 'Existing Addr 2',
                city = 'Existing City',
                state = 'Existing State',
                country = 'India',
                postal_code = '999999',
                contact_phone = '+91-99-99999999',
                contact_email = 'custom@college.edu',
                website_url = 'https://custom.edu',
                affiliated_university_name = 'Custom Univ',
                established_year = 1985,
                accreditation_details = 'NAAC A++',
                logo_storage_key = 'logos/custom.png'
            WHERE id = ?
        """, regId, collegeId);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(0);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeId);
        assertThat(college.get("address_line1")).isEqualTo("Existing Addr 1");
        assertThat(college.get("city")).isEqualTo("Existing City");
        assertThat(college.get("contact_email")).isEqualTo("custom@college.edu");
        assertThat(college.get("established_year")).isEqualTo(1985);
        assertThat(college.get("accreditation_details")).isEqualTo("NAAC A++");
        assertThat(college.get("logo_storage_key")).isEqualTo("logos/custom.png");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "address_line1",
            "city",
            "contact_phone",
            "contact_email",
            "logo_storage_key"
    })
    @DisplayName("MIG-08: Defensive Data-Preservation: Single non-null profile column excludes row from backfill")
    void mig08_parameterizedPartialProfile_excludesRowFromBackfill(String nonNullColumn) {
        long collegeId = insertCollege("Partial Profile College " + nonNullColumn, "PAR-" + nonNullColumn, "APPROVED");
        long regId = insertRegistration(
                collegeId, 1, "APPROVED",
                "Reg Addr", "Reg Suite", "Reg City", "Reg State", "India", "500001",
                "+91-40-88888888", "https://reg.edu", "Reg Univ"
        );
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", regId, collegeId);

        // Populate exactly 1 column
        jdbcTemplate.update("UPDATE colleges SET " + nonNullColumn + " = 'PRESERVED_VAL' WHERE id = ?", collegeId);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(0);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeId);
        assertThat(college.get(nonNullColumn)).isEqualTo("PRESERVED_VAL");

        // Verify other fields were NOT populated (no merge occurred)
        if (!"address_line1".equals(nonNullColumn)) {
            assertThat(college.get("address_line1")).isNull();
        }
        if (!"city".equals(nonNullColumn)) {
            assertThat(college.get("city")).isNull();
        }
        if (!"contact_phone".equals(nonNullColumn)) {
            assertThat(college.get("contact_phone")).isNull();
        }
    }

    @Test
    @DisplayName("MIG-09: NULL optional source fields backfill with mandatory fields populated and optional NULL")
    void mig09_nullOptionalSourceFields_backfillSucceeds() {
        long collegeId = insertCollege("Null Optionals College", "NOC-01", "APPROVED");
        long regId = insertRegistration(
                collegeId, 1, "APPROVED",
                "123 Main St", null, "Mumbai", "Maharashtra", "India", "400001",
                "+91-22-12345678", null, "Mumbai University"
        );
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", regId, collegeId);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(1);

        Map<String, Object> college = jdbcTemplate.queryForMap(
                "SELECT * FROM colleges WHERE id = ?", collegeId);

        assertThat(college.get("address_line1")).isEqualTo("123 Main St");
        assertThat(college.get("address_line2")).isNull();
        assertThat(college.get("city")).isEqualTo("Mumbai");
        assertThat(college.get("website_url")).isNull();
        assertThat(college.get("affiliated_university_name")).isEqualTo("Mumbai University");
    }

    @Test
    @DisplayName("MIG-10: Unapproved colleges are untouched by backfill")
    void mig10_unapprovedColleges_untouchedByBackfill() {
        long c1 = insertCollege("Pending College", "PEN-01", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING", "P Addr", null, "P City", "P State", "India", "100001", "+91-10-1", null, "U1");
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", r1, c1);

        long c2 = insertCollege("Action Req College", "ACT-01", "ACTION_REQUIRED");
        long r2 = insertRegistration(c2, 1, "ACTION_REQUIRED", "A Addr", null, "A City", "A State", "India", "200001", "+91-20-1", null, "U2");
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", r2, c2);

        long c3 = insertCollege("Rejected College", "REJ-01", "REJECTED");
        long r3 = insertRegistration(c3, 1, "REJECTED", "R Addr", null, "R City", "R State", "India", "300001", "+91-30-1", null, "U3");
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", r3, c3);

        int updated = executeBackfill();
        assertThat(updated).isEqualTo(0);

        for (long id : List.of(c1, c2, c3)) {
            Map<String, Object> college = jdbcTemplate.queryForMap("SELECT * FROM colleges WHERE id = ?", id);
            assertThat(college.get("address_line1")).isNull();
            assertThat(college.get("city")).isNull();
        }
    }

    @Test
    @DisplayName("MIG-11: Idempotency of backfill SQL - repeated execution updates 0 rows")
    void mig11_backfillIdempotency() {
        long collegeId = insertCollege("Idempotent College", "IDEM-01", "APPROVED");
        long regId = insertRegistration(
                collegeId, 1, "APPROVED",
                "Idem Road", null, "Kolkata", "West Bengal", "India", "700001",
                "+91-33-55667788", "https://idem.edu", "Calcutta University"
        );
        jdbcTemplate.update("UPDATE colleges SET current_registration_id = ? WHERE id = ?", regId, collegeId);

        int run1 = executeBackfill();
        assertThat(run1).isEqualTo(1);

        int run2 = executeBackfill();
        assertThat(run2).isEqualTo(0);

        int run3 = executeBackfill();
        assertThat(run3).isEqualTo(0);
    }

    @Test
    @DisplayName("MIG-12: Preflight Callback execution logs warnings on inconsistent pointers without throwing")
    void mig12_preflightCallback_logsWarningsWithoutThrowing() throws Exception {
        String testDbName = "acadlytic_v7_mig12_test";
        String rootServerUrl = getRootServerUrl();
        String testDbUrl = getTestDbUrl(testDbName);
        String rootUser = getRootUsername();
        String rootPass = getRootPassword();

        try (Connection rootConn = DriverManager.getConnection(rootServerUrl, rootUser, rootPass);
             Statement rootStmt = rootConn.createStatement()) {

            rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            rootStmt.execute("CREATE DATABASE " + testDbName);

            try {
                // Migrate to V6
                Flyway flywayV6 = Flyway.configure()
                        .dataSource(testDbUrl, rootUser, rootPass)
                        .locations("classpath:db/migration")
                        .callbacks(new V6DocumentReviewMigrationPreflightCallback())
                        .target("6")
                        .load();
                flywayV6.migrate();

                // Seed inconsistent state at V6: Approved college with NULL current_registration_id
                try (Connection conn = DriverManager.getConnection(testDbUrl, rootUser, rootPass);
                     Statement stmt = conn.createStatement()) {
                    stmt.execute("""
                        INSERT INTO colleges (id, name, code, approval_status, status, resubmission_count, action_required_count)
                        VALUES (100, 'Inconsistent College', 'INC-01', 'APPROVED', 'ACTIVE', 0, 0)
                    """);
                }

                // Migrate to V7 with both callbacks
                Flyway flywayV7 = Flyway.configure()
                        .dataSource(testDbUrl, rootUser, rootPass)
                        .locations("classpath:db/migration")
                        .callbacks(
                                new V6DocumentReviewMigrationPreflightCallback(),
                                new V7CollegeProfileMigrationPreflightCallback()
                        )
                        .target("7")
                        .load();

                // Migration must complete cleanly without throwing exceptions!
                flywayV7.migrate();

                try (Connection conn = DriverManager.getConnection(testDbUrl, rootUser, rootPass);
                     Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT address_line1 FROM colleges WHERE id = 100")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString(1)).isNull();
                }
            } finally {
                rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            }
        }
    }

    @Test
    @DisplayName("MIG-13: Safe post-migration callback executes diagnostics with zero mutations and zero exceptions")
    void mig13_postMigrationCallback_safeExecution() throws Exception {
        String testDbName = "acadlytic_v7_mig13_test";
        String rootServerUrl = getRootServerUrl();
        String testDbUrl = getTestDbUrl(testDbName);
        String rootUser = getRootUsername();
        String rootPass = getRootPassword();

        try (Connection rootConn = DriverManager.getConnection(rootServerUrl, rootUser, rootPass);
             Statement rootStmt = rootConn.createStatement()) {

            rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            rootStmt.execute("CREATE DATABASE " + testDbName);

            try {
                Flyway flywayV7 = Flyway.configure()
                        .dataSource(testDbUrl, rootUser, rootPass)
                        .locations("classpath:db/migration")
                        .callbacks(
                                new V6DocumentReviewMigrationPreflightCallback(),
                                new V7CollegeProfileMigrationPreflightCallback()
                        )
                        .target("7")
                        .load();

                // Should execute both BEFORE_EACH_MIGRATE and AFTER_EACH_MIGRATE cleanly
                flywayV7.migrate();

                // Re-executing migrate does not fail or alter schema
                flywayV7.migrate();
            } finally {
                rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            }
        }
    }

    private static class TrackingCallback implements Callback {
        private final Callback delegate;
        private final List<String> supportedEvents = new ArrayList<>();
        private final List<String> handledEvents = new ArrayList<>();

        TrackingCallback(Callback delegate) {
            this.delegate = delegate;
        }

        @Override
        public boolean supports(Event event, Context context) {
            boolean supported = delegate.supports(event, context);
            String ver = (context != null && context.getMigrationInfo() != null && context.getMigrationInfo().getVersion() != null)
                    ? context.getMigrationInfo().getVersion().getVersion()
                    : "null";
            if (supported) {
                supportedEvents.add(event.name() + ":" + ver);
            }
            return supported;
        }

        @Override
        public boolean canHandleInTransaction(Event event, Context context) {
            return delegate.canHandleInTransaction(event, context);
        }

        @Override
        public void handle(Event event, Context context) {
            String ver = (context != null && context.getMigrationInfo() != null && context.getMigrationInfo().getVersion() != null)
                    ? context.getMigrationInfo().getVersion().getVersion()
                    : "null";
            handledEvents.add(event.name() + ":" + ver);
            delegate.handle(event, context);
        }

        @Override
        public String getCallbackName() {
            return delegate.getCallbackName();
        }
    }

    @Test
    @DisplayName("MIG-14: Callback Boundary Filtering - verifies V1-V6 never invoke V7 callback and both callbacks filter strictly to target versions")
    void mig14_callbackBoundaryFiltering_freshMigration_verifiesStrictEventAndVersionFiltering() throws Exception {
        String testDbName = "acadlytic_v7_mig14_test";
        String rootServerUrl = getRootServerUrl();
        String testDbUrl = getTestDbUrl(testDbName);
        String rootUser = getRootUsername();
        String rootPass = getRootPassword();

        try (Connection rootConn = DriverManager.getConnection(rootServerUrl, rootUser, rootPass);
             Statement rootStmt = rootConn.createStatement()) {

            rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            rootStmt.execute("CREATE DATABASE " + testDbName);

            try {
                TrackingCallback v6Tracking = new TrackingCallback(new V6DocumentReviewMigrationPreflightCallback());
                TrackingCallback v7Tracking = new TrackingCallback(new V7CollegeProfileMigrationPreflightCallback());

                Flyway flywayV7 = Flyway.configure()
                        .dataSource(testDbUrl, rootUser, rootPass)
                        .locations("classpath:db/migration")
                        .callbacks(v6Tracking, v7Tracking)
                        .target("7")
                        .load();

                flywayV7.migrate();

                // 1. Verify V6 callback strictly supported and handled ONLY version 6 BEFORE_EACH_MIGRATE
                assertThat(v6Tracking.supportedEvents).containsExactly("BEFORE_EACH_MIGRATE:6");
                assertThat(v6Tracking.handledEvents).containsExactly("BEFORE_EACH_MIGRATE:6");

                // 2. Verify V7 callback strictly supported and handled ONLY version 7 BEFORE_EACH_MIGRATE and AFTER_EACH_MIGRATE
                assertThat(v7Tracking.supportedEvents).containsExactly("BEFORE_EACH_MIGRATE:7", "AFTER_EACH_MIGRATE:7");
                assertThat(v7Tracking.handledEvents).containsExactly("BEFORE_EACH_MIGRATE:7", "AFTER_EACH_MIGRATE:7");

                // 3. Verify that for V1-V5, neither callback supported or handled any events
                assertThat(v6Tracking.handledEvents).noneMatch(s -> s.contains(":1") || s.contains(":2") || s.contains(":3") || s.contains(":4") || s.contains(":5"));
                assertThat(v7Tracking.handledEvents).noneMatch(s -> s.contains(":1") || s.contains(":2") || s.contains(":3") || s.contains(":4") || s.contains(":5") || s.contains(":6"));

                // 4. Verify complete V1-V7 migration succeeded
                try (Connection conn = DriverManager.getConnection(testDbUrl, rootUser, rootPass);
                     Statement stmt = conn.createStatement()) {
                    List<String> installedVersions = new ArrayList<>();
                    try (ResultSet rs = stmt.executeQuery(
                            "SELECT version, success FROM flyway_schema_history ORDER BY installed_rank")) {
                        while (rs.next()) {
                            installedVersions.add(rs.getString("version"));
                            assertThat(rs.getBoolean("success")).isTrue();
                        }
                    }
                    assertThat(installedVersions).containsExactly("1", "2", "3", "4", "5", "6", "7");
                }
            } finally {
                rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            }
        }
    }
}
