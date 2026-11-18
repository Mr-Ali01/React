package com.acadlytic;

import com.acadlytic.support.AbstractMySqlIntegrationTest;
import org.junit.jupiter.api.Test;

class AcadlyticApplicationTests extends AbstractMySqlIntegrationTest {

    @Test
    void contextLoadsAgainstMySql8WithFlywayMigrations() {
        // Verifies Spring Boot context, Hibernate ddl-auto=validate, Flyway V1-V3,
        // and Spring Session JDBC initialize cleanly against MySQL 8.0.36.
    }
}
