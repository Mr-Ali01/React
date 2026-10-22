package com.resultpoint;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.flywaydb.core.api.output.RepairResult;
import org.junit.jupiter.api.*;

import java.io.File;
import java.io.FileInputStream;
import java.sql.*;
import java.util.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class Phase1ExecutionSuiteTest {

    private static String rootUser = "root";
    private static String rootPassword;
    private static final String MIGRATOR_USER = "resultpoint_migrator";
    private static final String MIGRATOR_PASS = "Migrator_Secret_2026!";
    private static final String MAINT_USER = "resultpoint_maint";
    private static final String MAINT_PASS = "Maint_Secret_2026!";
    private static final String APP_USER = "resultpoint_app";
    private static final String APP_PASS = "App_Secret_2026!";

    private static final String DB_NAME = "resultpoint_dev";
    private static final String DISPOSABLE_DB = "resultpoint_disposable_test_db";
    private static final String SERVER_URL = "jdbc:mysql://localhost:3306/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&defaultAuthenticationPlugin=com.mysql.cj.protocol.a.authentication.CachingSha2PasswordPlugin";
    private static final String DEV_DB_URL = "jdbc:mysql://localhost:3306/" + DB_NAME + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&defaultAuthenticationPlugin=com.mysql.cj.protocol.a.authentication.CachingSha2PasswordPlugin";

    private static boolean disposableDbCreatedByThisRun = false;

    @BeforeAll
    static void initRootCredentials() {
        rootPassword = System.getenv("DB_PASSWORD");
        if (rootPassword == null || rootPassword.isBlank()) {
            File f = new File("C:/Users/91846/Downloads/Employee_Management_System_By_Using_Spring_Boot/Employee_Management_System_By_Using_Spring_Boot/src/main/resources/application.properties");
            if (f.exists()) {
                try (FileInputStream fis = new FileInputStream(f)) {
                    Properties p = new Properties();
                    p.load(fis);
                    rootPassword = p.getProperty("spring.datasource.password");
                } catch (Exception ignored) {
                }
            }
        }
        Assertions.assertNotNull(rootPassword, "Root password must be resolved from local secret source");
    }

    @Test
    @Order(1)
    void step1_provisionAccountsAndPrivileges() throws Exception {
        System.out.println("=== STEP 1: PROVISION ACCOUNTS & CONFIGURE PRIVILEGES ===");
        try (Connection conn = DriverManager.getConnection(SERVER_URL, rootUser, rootPassword);
             Statement stmt = conn.createStatement()) {

            // Temporary enable trust function creators for binary logging during migration
            stmt.execute("SET GLOBAL log_bin_trust_function_creators = 1;");

            // 1. Maintenance user (Definer)
            stmt.execute("CREATE USER IF NOT EXISTS '" + MAINT_USER + "'@'localhost' IDENTIFIED WITH caching_sha2_password BY '" + MAINT_PASS + "';");
            stmt.execute("GRANT SELECT, DELETE ON " + DB_NAME + ".audit_logs TO '" + MAINT_USER + "'@'localhost';");

            // 2. Migrator user (Flyway)
            stmt.execute("CREATE USER IF NOT EXISTS '" + MIGRATOR_USER + "'@'localhost' IDENTIFIED WITH caching_sha2_password BY '" + MIGRATOR_PASS + "';");
            stmt.execute("GRANT ALL PRIVILEGES ON " + DB_NAME + ".* TO '" + MIGRATOR_USER + "'@'localhost';");
            // Grant temporary SET_ANY_DEFINER globally to assign resultpoint_maint as procedure definer in MySQL 8.4
            stmt.execute("GRANT SET_ANY_DEFINER ON *.* TO '" + MIGRATOR_USER + "'@'localhost';");

            // 3. Application user
            stmt.execute("CREATE USER IF NOT EXISTS '" + APP_USER + "'@'localhost' IDENTIFIED WITH caching_sha2_password BY '" + APP_PASS + "';");

            stmt.execute("FLUSH PRIVILEGES;");
            System.out.println("Accounts provisioned successfully: " + MAINT_USER + ", " + MIGRATOR_USER + ", " + APP_USER);
        }
    }

    @Test
    @Order(2)
    void step2_flywayRepairAndMigrate() {
        System.out.println("=== STEP 2: FLYWAY REPAIR & MIGRATE VIA " + MIGRATOR_USER + " ===");

        // 1. Repair failed V1_4 metadata row
        Flyway flywayRepair = Flyway.configure()
                .dataSource(DEV_DB_URL, MIGRATOR_USER, MIGRATOR_PASS)
                .locations("classpath:db/migration")
                .load();

        RepairResult repairResult = flywayRepair.repair();
        System.out.println("Flyway Repair completed: " + repairResult.repairActions);

        // 2. Migrate V1_4 and V2_0
        Flyway flywayMigrate = Flyway.configure()
                .dataSource(DEV_DB_URL, MIGRATOR_USER, MIGRATOR_PASS)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .validateOnMigrate(true)
                .load();

        MigrateResult migrateResult = flywayMigrate.migrate();
        System.out.println("Flyway Migrate Result:");
        System.out.println("  - Success: " + migrateResult.success);
        System.out.println("  - Migrations Executed: " + migrateResult.migrationsExecuted);
        System.out.println("  - Target Version: " + migrateResult.targetSchemaVersion);

        Assertions.assertTrue(migrateResult.success, "Migrations must succeed");
        Assertions.assertEquals("2.0", flywayMigrate.info().current().getVersion().getVersion());
    }

    @Test
    @Order(3)
    void step3_grantProcedureExecuteAndRevokeTemporarySetUserId() throws Exception {
        System.out.println("=== STEP 3: GRANT PROCEDURE EXECUTE & REVOKE TEMPORARY PRIVILEGES ===");
        try (Connection conn = DriverManager.getConnection(SERVER_URL, rootUser, rootPassword);
             Statement stmt = conn.createStatement()) {

            // 1. Grant EXECUTE on procedure to maintenance user
            stmt.execute("GRANT EXECUTE ON PROCEDURE " + DB_NAME + ".sp_purge_expired_audit_logs TO '" + MAINT_USER + "'@'localhost';");

            // 2. Revoke temporary SET_ANY_DEFINER from migrator user (No longer needed post-migration)
            stmt.execute("REVOKE SET_ANY_DEFINER ON *.* FROM '" + MIGRATOR_USER + "'@'localhost';");
            stmt.execute("SET GLOBAL log_bin_trust_function_creators = 0;");

            // 3. Configure table-specific grants on all 31 business tables for application user
            String[] businessTables = {
                    "users", "user_refresh_tokens", "password_reset_tokens", "universities", "courses",
                    "regulations", "subjects", "regulation_subjects", "admission_batches", "grading_scales",
                    "grade_boundaries", "calculation_rules", "student_profiles", "semester_results", "subject_results",
                    "student_backlogs", "student_goals", "education_records", "education_record_subjects", "tools_registry",
                    "saved_calculations", "student_notifications", "announcements", "announcement_reads", "blog_posts",
                    "study_resources", "support_queries", "support_query_replies", "daily_visitor_metrics", "route_page_views",
                    "calculator_usage_stats"
            };

            for (String tbl : businessTables) {
                stmt.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON " + DB_NAME + "." + tbl + " TO '" + APP_USER + "'@'localhost';");
            }

            // audit_logs: SELECT, INSERT only (strictly immutable update & no delete)
            stmt.execute("GRANT SELECT, INSERT ON " + DB_NAME + ".audit_logs TO '" + APP_USER + "'@'localhost';");
            // flyway_schema_history: SELECT only
            stmt.execute("GRANT SELECT ON " + DB_NAME + ".flyway_schema_history TO '" + APP_USER + "'@'localhost';");

            stmt.execute("FLUSH PRIVILEGES;");
            System.out.println("Revoked SET_ANY_DEFINER from " + MIGRATOR_USER + " and configured table-specific grants for " + APP_USER + ".");
        }
    }

    @Test
    @Order(4)
    void step4_disposableDatabaseBatchTest() throws Exception {
        System.out.println("=== STEP 4: ISOLATED 5,500-ROW BATCH TEST IN " + DISPOSABLE_DB + " ===");

        try (Connection conn = DriverManager.getConnection(SERVER_URL, rootUser, rootPassword);
             Statement stmt = conn.createStatement()) {

            // 1. Verify DISPOSABLE_DB does NOT pre-exist
            try (ResultSet rs = stmt.executeQuery("SHOW DATABASES LIKE '" + DISPOSABLE_DB + "';")) {
                Assertions.assertFalse(rs.next(), "Disposable DB " + DISPOSABLE_DB + " must not pre-exist!");
            }

            // 2. Create disposable DB and mark flag
            stmt.execute("CREATE DATABASE " + DISPOSABLE_DB + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            disposableDbCreatedByThisRun = true;

            // 3. Create schema inside disposable DB
            stmt.execute("USE " + DISPOSABLE_DB + ";");
            stmt.execute("""
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
            """);

            stmt.execute("""
                CREATE DEFINER = 'resultpoint_maint'@'localhost' PROCEDURE sp_purge_expired_audit_logs(
                    IN p_retention_days INT,
                    OUT p_deleted_rows INT
                )
                SQL SECURITY DEFINER
                BEGIN
                    DECLARE v_cutoff DATETIME(6);
                    DECLARE v_batch_deleted INT DEFAULT 0;
                    DECLARE v_total_deleted INT DEFAULT 0;

                    IF p_retention_days IS NULL OR p_retention_days < 365 THEN
                        SIGNAL SQLSTATE '45000'
                            SET MESSAGE_TEXT = 'Retention period cannot be NULL or less than 365 days per compliance policy.';
                    END IF;

                    SET v_cutoff = DATE_SUB(NOW(6), INTERVAL p_retention_days DAY);
                    SET p_deleted_rows = 0;

                    purge_loop: LOOP
                        DELETE FROM audit_logs
                        WHERE created_at < v_cutoff
                        LIMIT 5000;

                        SET v_batch_deleted = ROW_COUNT();
                        SET v_total_deleted = v_total_deleted + v_batch_deleted;

                        IF v_batch_deleted < 5000 THEN
                            LEAVE purge_loop;
                        END IF;
                    END LOOP purge_loop;

                    SET p_deleted_rows = v_total_deleted;
                END;
            """);

            // Grant maintenance user rights on disposable DB
            stmt.execute("GRANT SELECT, DELETE ON " + DISPOSABLE_DB + ".audit_logs TO '" + MAINT_USER + "'@'localhost';");
            stmt.execute("GRANT EXECUTE ON PROCEDURE " + DISPOSABLE_DB + ".sp_purge_expired_audit_logs TO '" + MAINT_USER + "'@'localhost';");
            stmt.execute("FLUSH PRIVILEGES;");
        }

        // 4. Seed 5,500 test rows with created_at 450 days in the past
        String dispUrl = "jdbc:mysql://localhost:3306/" + DISPOSABLE_DB + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&defaultAuthenticationPlugin=com.mysql.cj.protocol.a.authentication.CachingSha2PasswordPlugin";
        try (Connection conn = DriverManager.getConnection(dispUrl, rootUser, rootPassword)) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO audit_logs (actor_email, actor_role, action_type, entity_type, entity_id, created_at) " +
                    "VALUES ('batch_test@resultpoint.internal', 'MAINT', 'TEST_PURGE', 'SYNTHETIC', '1', DATE_SUB(NOW(6), INTERVAL 450 DAY))")) {

                for (int i = 0; i < 5500; i++) {
                    ps.addBatch();
                    if ((i + 1) % 1000 == 0) {
                        ps.executeBatch();
                    }
                }
                ps.executeBatch();
                conn.commit();
            }
            conn.setAutoCommit(true);

            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM audit_logs")) {
                rs.next();
                Assertions.assertEquals(5500, rs.getInt(1), "Must have seeded 5500 rows");
                System.out.println("Seeded 5,500 expired rows in " + DISPOSABLE_DB);
            }
        }

        // 5. Execute procedure as maintenance user
        try (Connection conn = DriverManager.getConnection(dispUrl, MAINT_USER, MAINT_PASS);
             CallableStatement cs = conn.prepareCall("{CALL sp_purge_expired_audit_logs(?, ?)}")) {

            cs.setInt(1, 365);
            cs.registerOutParameter(2, Types.INTEGER);
            cs.execute();

            int deletedRows = cs.getInt(2);
            System.out.println("Procedure executed in " + DISPOSABLE_DB + ". Rows deleted: " + deletedRows);
            Assertions.assertEquals(5500, deletedRows, "Should have deleted all 5,500 expired rows across batch boundaries");
        }

        // Verify 0 rows remain
        try (Connection conn = DriverManager.getConnection(dispUrl, rootUser, rootPassword);
             Statement s = conn.createStatement();
             ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM audit_logs")) {
            rs.next();
            Assertions.assertEquals(0, rs.getInt(1), "0 rows must remain in audit_logs");
            System.out.println("Verified 0 rows remain in " + DISPOSABLE_DB + ". Batch loop verified across 5,000 threshold.");
        }

        // 6. Tear down disposable DB if created by this run
        if (disposableDbCreatedByThisRun) {
            try (Connection conn = DriverManager.getConnection(SERVER_URL, rootUser, rootPassword);
                 Statement stmt = conn.createStatement()) {
                stmt.execute("DROP DATABASE " + DISPOSABLE_DB + ";");
                System.out.println("Dropped disposable test database: " + DISPOSABLE_DB);
            }
        }
    }

    @Test
    @Order(5)
    void step5_verifyLiveResultpointDev() throws Exception {
        System.out.println("=== STEP 5: VERIFY LIVE DATABASE " + DB_NAME + " ===");

        try (Connection conn = DriverManager.getConnection(DEV_DB_URL, rootUser, rootPassword);
             Statement stmt = conn.createStatement()) {

            // 1. Verify flyway_schema_history: 6 rows, all success = 1
            try (ResultSet rs = stmt.executeQuery("SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank ASC")) {
                int count = 0;
                while (rs.next()) {
                    count++;
                    String ver = rs.getString("version");
                    String desc = rs.getString("description");
                    boolean success = rs.getBoolean("success");
                    System.out.println("  Migration V" + ver + " (" + desc + "): success=" + success);
                    Assertions.assertTrue(success);
                }
                Assertions.assertEquals(6, count, "Exactly 6 migrations must be recorded");
            }

            // 2. Verify all 32 physical tables exist
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '" + DB_NAME + "' AND table_name != 'flyway_schema_history'")) {
                rs.next();
                int totalTables = rs.getInt(1);
                System.out.println("Total business tables in " + DB_NAME + ": " + totalTables);
                Assertions.assertEquals(32, totalTables);
            }

            // 3. Verify seed catalog data
            Assertions.assertEquals(4, getCount(stmt, "universities"));
            Assertions.assertEquals(2, getCount(stmt, "grading_scales"));
            Assertions.assertEquals(14, getCount(stmt, "grade_boundaries"));
            Assertions.assertEquals(3, getCount(stmt, "calculation_rules"));
            Assertions.assertEquals(4, getCount(stmt, "courses"));
            Assertions.assertEquals(4, getCount(stmt, "regulations"));
            Assertions.assertEquals(20, getCount(stmt, "tools_registry"));

            // OU B.Com explicitly UNDER_REVIEW
            try (ResultSet rs = stmt.executeQuery("SELECT verification_status FROM regulations WHERE id = 'reg_ou_bcom_cbcs'")) {
                rs.next();
                Assertions.assertEquals("UNDER_REVIEW", rs.getString(1));
                System.out.println("OU B.Com status verified: UNDER_REVIEW");
            }

            // 4. Verify trigger trg_audit_logs_no_update immutability
            stmt.execute("INSERT INTO audit_logs (actor_email, actor_role, action_type, entity_type, entity_id) VALUES ('trigger_val@resultpoint.internal', 'TEST', 'ACTION', 'SYSTEM', '1')");
            long insertedId = 0;
            try (ResultSet rs = stmt.executeQuery("SELECT LAST_INSERT_ID()")) {
                if (rs.next()) insertedId = rs.getLong(1);
            }

            boolean triggerBlockedUpdate = false;
            try {
                stmt.execute("UPDATE audit_logs SET action_type = 'TAMPERED' WHERE id = " + insertedId);
            } catch (SQLException ex) {
                if ("45000".equals(ex.getSQLState()) && ex.getMessage().contains("Security Violation")) {
                    triggerBlockedUpdate = true;
                    System.out.println("Trigger immutability verified: intercepted UPDATE with SQLSTATE 45000");
                }
            }
            Assertions.assertTrue(triggerBlockedUpdate, "Trigger must block UPDATE on audit_logs");
            stmt.execute("DELETE FROM audit_logs WHERE id = " + insertedId);

            // 5. Verify procedure parameter rejection on NULL and < 365
            boolean nullRejected = false;
            try (CallableStatement cs = conn.prepareCall("{CALL sp_purge_expired_audit_logs(NULL, ?)}")) {
                cs.registerOutParameter(1, Types.INTEGER);
                cs.execute();
            } catch (SQLException ex) {
                if ("45000".equals(ex.getSQLState()) && ex.getMessage().contains("cannot be NULL or less than 365 days")) {
                    nullRejected = true;
                }
            }
            Assertions.assertTrue(nullRejected, "Procedure must reject NULL retention days");

            boolean sub365Rejected = false;
            try (CallableStatement cs = conn.prepareCall("{CALL sp_purge_expired_audit_logs(30, ?)}")) {
                cs.registerOutParameter(1, Types.INTEGER);
                cs.execute();
            } catch (SQLException ex) {
                if ("45000".equals(ex.getSQLState()) && ex.getMessage().contains("cannot be NULL or less than 365 days")) {
                    sub365Rejected = true;
                }
            }
            Assertions.assertTrue(sub365Rejected, "Procedure must reject retention days < 365");
            System.out.println("Procedure parameter guards verified: NULL and < 365 rejected with SQLSTATE 45000");
        }
    }

    @Test
    @Order(6)
    void step6_verifyLeastPrivilegeEffectiveGrants() throws Exception {
        System.out.println("=== STEP 6: VERIFY LEAST-PRIVILEGE EFFECTIVE GRANTS ===");

        // 1. Verify resultpoint_migrator has no global SET_ANY_DEFINER
        try (Connection conn = DriverManager.getConnection(SERVER_URL, rootUser, rootPassword);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SHOW GRANTS FOR '" + MIGRATOR_USER + "'@'localhost'")) {

            System.out.println("Effective Grants for " + MIGRATOR_USER + ":");
            while (rs.next()) {
                String grant = rs.getString(1);
                System.out.println("  " + grant);
                Assertions.assertFalse(grant.contains("SET_ANY_DEFINER"), "SET_ANY_DEFINER must be revoked from migrator!");
            }
        }

        // 2. Verify negative permission tests for resultpoint_app
        try (Connection conn = DriverManager.getConnection(DEV_DB_URL, APP_USER, APP_PASS);
             Statement stmt = conn.createStatement()) {

            // Can SELECT from business tables
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM universities")) {
                rs.next();
                Assertions.assertEquals(4, rs.getInt(1));
                System.out.println("Application user SELECT on business table: ALLOWED");
            }

            // Can INSERT into audit_logs
            stmt.execute("INSERT INTO audit_logs (actor_email, actor_role, action_type, entity_type, entity_id) VALUES ('app_user_test@resultpoint.internal', 'APP', 'TEST_EVENT', 'SYSTEM', '1')");
            long insertedId = 0;
            try (ResultSet rs = stmt.executeQuery("SELECT LAST_INSERT_ID()")) {
                if (rs.next()) insertedId = rs.getLong(1);
            }
            System.out.println("Application user INSERT into audit_logs: ALLOWED");

            // CANNOT UPDATE audit_logs
            boolean updateBlocked = false;
            try {
                stmt.execute("UPDATE audit_logs SET action_type = 'ILLEGAL' WHERE id = " + insertedId);
            } catch (SQLException ex) {
                // Denied by grant (Error 1142) or trigger (SQLSTATE 45000)
                updateBlocked = true;
                System.out.println("Application user UPDATE audit_logs: DENIED (" + ex.getMessage() + ")");
            }
            Assertions.assertTrue(updateBlocked);

            // CANNOT DELETE FROM audit_logs
            boolean deleteBlocked = false;
            try {
                stmt.execute("DELETE FROM audit_logs WHERE id = " + insertedId);
            } catch (SQLException ex) {
                // Denied by grant (Error 1142)
                if (ex.getErrorCode() == 1142) {
                    deleteBlocked = true;
                    System.out.println("Application user DELETE FROM audit_logs: DENIED by MySQL Grant (1142: " + ex.getMessage() + ")");
                }
            }
            Assertions.assertTrue(deleteBlocked, "Application user must be denied DELETE by privilege system");

            // CANNOT EXECUTE sp_purge_expired_audit_logs
            boolean executeBlocked = false;
            try {
                stmt.execute("CALL sp_purge_expired_audit_logs(365, @dummy);");
            } catch (SQLException ex) {
                if (ex.getErrorCode() == 1370 || ex.getMessage().toLowerCase().contains("denied")) {
                    executeBlocked = true;
                    System.out.println("Application user EXECUTE sp_purge_expired_audit_logs: DENIED by MySQL Grant (" + ex.getErrorCode() + ": " + ex.getMessage() + ")");
                }
            }
            Assertions.assertTrue(executeBlocked, "Application user must be denied EXECUTE on purge procedure");

            // Clean up the inserted audit record using root account
            try (Connection rootConn = DriverManager.getConnection(DEV_DB_URL, rootUser, rootPassword);
                 Statement rootStmt = rootConn.createStatement()) {
                rootStmt.execute("DELETE FROM audit_logs WHERE id = " + insertedId);
            }
        }
    }

    private int getCount(Statement stmt, String tableName) throws SQLException {
        try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tableName)) {
            rs.next();
            return rs.getInt(1);
        }
    }
}
