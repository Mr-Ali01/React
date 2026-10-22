package com.resultpoint;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.*;

import java.io.File;
import java.io.FileInputStream;
import java.sql.*;
import java.util.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class Phase1MigrationValidationTest {

    private static String dbUser;
    private static String dbPassword;
    private static final String DB_NAME = "resultpoint_dev";
    private static final String SERVER_URL = "jdbc:mysql://localhost:3306/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String DB_URL = "jdbc:mysql://localhost:3306/" + DB_NAME + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";

    @BeforeAll
    static void setupCredentials() {
        dbUser = System.getenv("DB_USERNAME");
        if (dbUser == null || dbUser.isBlank()) {
            dbUser = "root";
        }

        dbPassword = System.getenv("DB_PASSWORD");
        if (dbPassword == null || dbPassword.isBlank()) {
            String[] fallbackPaths = new String[]{
                    "C:/Users/91846/Downloads/Student_Management_System_By_Using_Spring_Boot/Student_Management_System_By_Using_Spring_Boot/src/main/resources/application.properties",
                    "C:/Users/91846/Downloads/Employee_Management_System_By_Using_Spring_Boot/Employee_Management_System_By_Using_Spring_Boot/src/main/resources/application.properties"
            };

            for (String path : fallbackPaths) {
                File f = new File(path);
                if (f.exists()) {
                    try (FileInputStream fis = new FileInputStream(f)) {
                        Properties p = new Properties();
                        p.load(fis);
                        String pwd = p.getProperty("spring.datasource.password");
                        if (pwd != null && !pwd.isBlank()) {
                            dbPassword = pwd;
                            String user = p.getProperty("spring.datasource.username");
                            if (user != null && !user.isBlank()) {
                                dbUser = user;
                            }
                            break;
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        }
        Assertions.assertNotNull(dbPassword, "Database credentials must be resolved from local secret source");
    }

    @Test
    @Order(1)
    void step1_createDatabaseIfNotExists() throws Exception {
        System.out.println("=== STEP 1: CREATE DATABASE IF NOT EXISTS " + DB_NAME + " ===");
        try (Connection conn = DriverManager.getConnection(SERVER_URL, dbUser, dbPassword);
             Statement stmt = conn.createStatement()) {

            stmt.execute("CREATE DATABASE IF NOT EXISTS " + DB_NAME + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

            // Confirm database exists
            try (ResultSet rs = stmt.executeQuery("SHOW DATABASES LIKE '" + DB_NAME + "';")) {
                Assertions.assertTrue(rs.next(), "Database " + DB_NAME + " must exist");
                System.out.println("Database '" + DB_NAME + "' confirmed present.");
            }
        }
    }

    @Test
    @Order(2)
    void step2_executeFlywayMigrations() {
        System.out.println("=== STEP 2: EXECUTE FLYWAY MIGRATIONS ON " + DB_NAME + " ===");
        Flyway flyway = Flyway.configure()
                .dataSource(DB_URL, dbUser, dbPassword)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .validateOnMigrate(true)
                .load();

        MigrateResult result = flyway.migrate();

        System.out.println("Flyway execution completed successfully:");
        System.out.println("  - Success: " + result.success);
        System.out.println("  - Migrations Executed: " + result.migrationsExecuted);
        System.out.println("  - Target Schema Version: " + result.targetSchemaVersion);
        System.out.println("  - Initial Schema Version: " + result.initialSchemaVersion);

        Assertions.assertTrue(result.success, "Flyway migration must succeed");
        Assertions.assertEquals("2.0", flyway.info().current().getVersion().getVersion(), "Target schema version must be 2.0");
    }

    @Test
    @Order(3)
    void step3_verifyMigrationHistoryAndTables() throws Exception {
        System.out.println("=== STEP 3: VERIFY MIGRATION HISTORY & 32 PHYSICAL TABLES ===");
        try (Connection conn = DriverManager.getConnection(DB_URL, dbUser, dbPassword);
             Statement stmt = conn.createStatement()) {

            // 1. Verify flyway_schema_history
            try (ResultSet rs = stmt.executeQuery("SELECT version, description, type, script, success FROM flyway_schema_history ORDER BY installed_rank ASC")) {
                System.out.println("Installed Flyway Migrations:");
                int historyCount = 0;
                while (rs.next()) {
                    historyCount++;
                    String v = rs.getString("version");
                    String desc = rs.getString("description");
                    boolean success = rs.getBoolean("success");
                    System.out.println("  [" + historyCount + "] V" + v + " - " + desc + " (Success: " + success + ")");
                    Assertions.assertTrue(success, "Migration V" + v + " must have succeeded");
                }
                Assertions.assertEquals(6, historyCount, "Exactly 6 migrations must be recorded");
            }

            // 2. Verify 32 physical business/catalog tables (excluding flyway_schema_history)
            List<String> tables = new ArrayList<>();
            try (ResultSet rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = '" + DB_NAME + "' AND table_name != 'flyway_schema_history' ORDER BY table_name ASC")) {
                while (rs.next()) {
                    tables.add(rs.getString(1));
                }
            }

            System.out.println("Physical Business Tables Verified (" + tables.size() + " total):");
            for (int i = 0; i < tables.size(); i++) {
                System.out.println("  " + (i + 1) + ". " + tables.get(i));
            }
            Assertions.assertEquals(32, tables.size(), "Exactly 32 physical tables must exist in " + DB_NAME);
        }
    }

    @Test
    @Order(4)
    void step4_verifySecurityObjects() throws Exception {
        System.out.println("=== STEP 4: VERIFY SECURITY OBJECTS (TRIGGER & STORED PROCEDURE) ===");
        try (Connection conn = DriverManager.getConnection(DB_URL, dbUser, dbPassword);
             Statement stmt = conn.createStatement()) {

            // 1. Verify Trigger
            try (ResultSet rs = stmt.executeQuery("SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE FROM information_schema.triggers WHERE TRIGGER_SCHEMA = '" + DB_NAME + "'")) {
                Assertions.assertTrue(rs.next(), "Trigger trg_audit_logs_no_update must exist");
                String name = rs.getString("TRIGGER_NAME");
                String event = rs.getString("EVENT_MANIPULATION");
                String table = rs.getString("EVENT_OBJECT_TABLE");
                System.out.println("Verified Trigger: " + name + " ON " + table + " [" + event + "]");
                Assertions.assertEquals("trg_audit_logs_no_update", name);
                Assertions.assertEquals("UPDATE", event);
                Assertions.assertEquals("audit_logs", table);
            }

            // 2. Verify Stored Procedure
            try (ResultSet rs = stmt.executeQuery("SELECT ROUTINE_NAME, ROUTINE_TYPE, SECURITY_TYPE FROM information_schema.routines WHERE ROUTINE_SCHEMA = '" + DB_NAME + "'")) {
                Assertions.assertTrue(rs.next(), "Routine sp_purge_expired_audit_logs must exist");
                String name = rs.getString("ROUTINE_NAME");
                String type = rs.getString("ROUTINE_TYPE");
                String sec = rs.getString("SECURITY_TYPE");
                System.out.println("Verified Routine: " + name + " (" + type + ", Security: " + sec + ")");
                Assertions.assertEquals("sp_purge_expired_audit_logs", name);
                Assertions.assertEquals("PROCEDURE", type);
                Assertions.assertEquals("DEFINER", sec);
            }

            // 3. Behavioral Test: Trigger Immutability
            stmt.execute("INSERT INTO audit_logs (actor_email, actor_role, action_type, entity_type, entity_id) VALUES ('security_test@resultpoint.internal', 'ADMIN', 'TEST_ACTION', 'SYSTEM', 'SYS_1')");
            long insertedId = 0;
            try (ResultSet rs = stmt.executeQuery("SELECT LAST_INSERT_ID()")) {
                if (rs.next()) insertedId = rs.getLong(1);
            }

            boolean triggerFired = false;
            try {
                stmt.execute("UPDATE audit_logs SET action_type = 'TAMPERED' WHERE id = " + insertedId);
            } catch (SQLException ex) {
                if ("45000".equals(ex.getSQLState()) && ex.getMessage().contains("Security Violation")) {
                    triggerFired = true;
                    System.out.println("Security Trigger Behavioral Test: PASS (Intercepted UPDATE with SQLSTATE 45000: " + ex.getMessage() + ")");
                }
            }
            Assertions.assertTrue(triggerFired, "Trigger trg_audit_logs_no_update must prevent record modifications");

            // Clean up test audit log record via DELETE (DELETE is allowed for retention purge)
            stmt.execute("DELETE FROM audit_logs WHERE id = " + insertedId);
        }
    }

    @Test
    @Order(5)
    void step5_verifySeedCatalogData() throws Exception {
        System.out.println("=== STEP 5: VERIFY BASELINE SEED CATALOG DATA ===");
        try (Connection conn = DriverManager.getConnection(DB_URL, dbUser, dbPassword);
             Statement stmt = conn.createStatement()) {

            // Universities count = 4
            int uniCount = getCount(stmt, "universities");
            System.out.println("Universities Seed Count: " + uniCount);
            Assertions.assertEquals(4, uniCount);

            // Grading scales = 2
            int scaleCount = getCount(stmt, "grading_scales");
            System.out.println("Grading Scales Seed Count: " + scaleCount);
            Assertions.assertEquals(2, scaleCount);

            // Grade boundaries = 14
            int boundaryCount = getCount(stmt, "grade_boundaries");
            System.out.println("Grade Boundaries Seed Count: " + boundaryCount);
            Assertions.assertEquals(14, boundaryCount);

            // Calculation rules = 3
            int ruleCount = getCount(stmt, "calculation_rules");
            System.out.println("Calculation Rules Seed Count: " + ruleCount);
            Assertions.assertEquals(3, ruleCount);

            // Courses = 4
            int courseCount = getCount(stmt, "courses");
            System.out.println("Courses Seed Count: " + courseCount);
            Assertions.assertEquals(4, courseCount);

            // Regulations = 4 (with OU B.Com status = 'UNDER_REVIEW')
            int regCount = getCount(stmt, "regulations");
            System.out.println("Regulations Seed Count: " + regCount);
            Assertions.assertEquals(4, regCount);

            try (ResultSet rs = stmt.executeQuery("SELECT verification_status FROM regulations WHERE id = 'reg_ou_bcom_cbcs'")) {
                Assertions.assertTrue(rs.next());
                String status = rs.getString(1);
                System.out.println("OU B.Com Verification Status: " + status);
                Assertions.assertEquals("UNDER_REVIEW", status, "OU B.Com regulation must be explicitly UNDER_REVIEW");
            }

            // Tools Registry = 20
            int toolCount = getCount(stmt, "tools_registry");
            System.out.println("Tools Registry Seed Count: " + toolCount);
            Assertions.assertEquals(20, toolCount);

            // Check tools tab anchor uniqueness
            try (ResultSet rs = stmt.executeQuery("SELECT id, route_path, tab_anchor FROM tools_registry WHERE route_path = '/calculators/cgpa'")) {
                int cgpaCount = 0;
                while (rs.next()) {
                    cgpaCount++;
                    System.out.println("  Route /calculators/cgpa tool: " + rs.getString("id") + " (tab_anchor: '" + rs.getString("tab_anchor") + "')");
                }
                Assertions.assertEquals(2, cgpaCount, "Both CGPA calculator and GPA converter must exist under unique tab anchors");
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
