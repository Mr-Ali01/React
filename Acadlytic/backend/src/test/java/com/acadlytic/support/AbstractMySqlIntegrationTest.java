package com.acadlytic.support;

import com.acadlytic.modules.outbox.service.EmailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.MySQLContainer;

/**
 * Base class for all MySQL 8.x integration tests (ADR-19).
 * Uses Testcontainers MySQL 8.0.36 when a Docker daemon is available (e.g. in CI or when Docker Desktop is running),
 * or seamlessly connects to the local MySQL 8.x instance on port 3306 (database: acadlytic_test)
 * when Docker is not active on the host machine.
 * Both paths execute against real MySQL 8 with utf8mb4 and UTC, strictly preserving MySQL-specific
 * VIRTUAL generated columns, unique constraints, FOR UPDATE SKIP LOCKED, Flyway migrations,
 * and Spring Session JDBC persistence without relying on H2.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractMySqlIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(AbstractMySqlIntegrationTest.class);
    protected static final MySQLContainer<?> MYSQL;
    private static final boolean DOCKER_AVAILABLE;

    static {
        boolean available = false;
        MySQLContainer<?> container = null;
        boolean explicitLocal = Boolean.parseBoolean(System.getProperty("acadlytic.test.local-mysql",
                System.getenv().getOrDefault("ACADLYTIC_TEST_LOCAL_MYSQL", "false")));

        if (explicitLocal) {
            log.info("Explicit local MySQL test mode configured (-Dacadlytic.test.local-mysql=true); targeting local MySQL 8.x on port 3306 (acadlytic_test)");
        } else {
            try {
                if (DockerClientFactory.instance().isDockerAvailable()) {
                    container = new MySQLContainer<>("mysql:8.0.36")
                            .withDatabaseName("acadlytic_test")
                            .withUsername("acadlytic_test")
                            .withPassword("acadlytic_test_pass")
                            .withCommand(
                                    "--character-set-server=utf8mb4",
                                    "--collation-server=utf8mb4_unicode_ci",
                                    "--default-time-zone=+00:00",
                                    "--log-bin-trust-function-creators=1"
                            );
                    container.start();
                    available = true;
                    log.info("Testcontainers MySQL 8.0.36 started at {}", container.getJdbcUrl());
                } else {
                    throw new IllegalStateException(
                            "Docker environment not available. Testcontainers requires Docker Desktop / Engine to be operational. "
                                    + "Please verify that Docker Desktop is running and docker-java.properties configures api.version=1.44. "
                                    + "To deliberately run against an explicitly configured local MySQL 8 instance on port 3306, set system property -Dacadlytic.test.local-mysql=true or environment variable ACADLYTIC_TEST_LOCAL_MYSQL=true.");
                }
            } catch (Throwable t) {
                if (t instanceof IllegalStateException ise) {
                    throw ise;
                }
                throw new IllegalStateException(
                        "Failed to initialize Testcontainers MySQL 8.0.36: " + t.getMessage()
                                + ". Please check Docker configuration and docker-java.properties (api.version=1.44). "
                                + "To deliberately run against an explicitly configured local MySQL 8 instance on port 3306, set system property -Dacadlytic.test.local-mysql=true or environment variable ACADLYTIC_TEST_LOCAL_MYSQL=true.", t);
            }
        }
        MYSQL = container;
        DOCKER_AVAILABLE = available;
    }

    @MockBean
    protected EmailSender emailSender;

    @org.springframework.beans.factory.annotation.Autowired
    private javax.sql.DataSource dataSource;

    @org.junit.jupiter.api.BeforeEach
    void enforceTestDatabaseSafety() throws java.sql.SQLException {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        assertTestDatabaseSafety(dataSource);
    }

    public static void assertTestDatabaseSafety(javax.sql.DataSource ds) throws java.sql.SQLException {
        try (java.sql.Connection conn = ds.getConnection()) {
            String catalog = conn.getCatalog();
            String url = conn.getMetaData().getURL();

            if ("acadlytic".equalsIgnoreCase(catalog)) {
                throw new IllegalStateException(
                        "CRITICAL SAFETY VIOLATION: Integration tests attempted to execute against development database 'acadlytic'! "
                                + "Tests must strictly run against 'acadlytic_test' or a Testcontainers instance. Resolved URL: " + url);
            }

            boolean isSafeTestSchema = "acadlytic_test".equalsIgnoreCase(catalog)
                    || (catalog != null && catalog.toLowerCase().contains("test"))
                    || (url != null && (url.contains("acadlytic_test") || url.contains("testcontainers")));

            if (!isSafeTestSchema) {
                throw new IllegalStateException(
                        "SAFETY VIOLATION: Integration tests connected to unauthorized database schema '" + catalog
                                + "'. Resolved URL: " + url + ". Integration tests are only permitted on 'acadlytic_test' or Testcontainers.");
            }
        }
    }

    @DynamicPropertySource
    static void registerDatasourceProperties(DynamicPropertyRegistry registry) {
        if (DOCKER_AVAILABLE && MYSQL != null && MYSQL.isRunning()) {
            registry.add("spring.datasource.url",
                    () -> MYSQL.getJdbcUrl() + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
            registry.add("spring.datasource.username", MYSQL::getUsername);
            registry.add("spring.datasource.password", MYSQL::getPassword);
            registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
        } else {
            registry.add("spring.datasource.url",
                    () -> "jdbc:mysql://127.0.0.1:3306/acadlytic_test?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
            registry.add("spring.datasource.username", () -> "acadlytic_test");
            registry.add("spring.datasource.password", () -> "acadlytic_test_pass");
            registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        }
    }
}
