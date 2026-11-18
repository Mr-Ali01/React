package com.acadlytic.support;

import com.acadlytic.modules.outbox.service.EmailSender;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;

/**
 * Base class for all MySQL 8.0.36 Testcontainers integration tests (ADR-19).
 * Uses a single shared MySQL 8.0.36 container across the test suite with utf8mb4 and UTC
 * matching docker-compose.yml.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractMySqlIntegrationTest {

    protected static final MySQLContainer<?> MYSQL;

    static {
        MYSQL = new MySQLContainer<>("mysql:8.0.36")
                .withDatabaseName("acadlytic_test")
                .withUsername("acadlytic_test")
                .withPassword("acadlytic_test_pass")
                .withCommand(
                        "--character-set-server=utf8mb4",
                        "--collation-server=utf8mb4_unicode_ci",
                        "--default-time-zone=+00:00"
                );
        MYSQL.start();
    }

    @MockBean
    protected EmailSender emailSender;

    @DynamicPropertySource
    static void registerDatasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> MYSQL.getJdbcUrl() + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }
}
