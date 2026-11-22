package com.acadlytic.support;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TestDatabaseSafetyGuardTest extends AbstractMySqlIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Safety Guard: Active test database connection is strictly isolated from development 'acadlytic' database")
    void testDatabaseConnectionIsIsolatedFromDevDatabase() throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            String catalog = conn.getCatalog();
            String url = conn.getMetaData().getURL();

            assertThat(catalog)
                    .as("Test suite must never run against development database 'acadlytic'")
                    .isNotEqualToIgnoringCase("acadlytic");

            assertThat(catalog.toLowerCase().contains("test") || url.contains("acadlytic_test") || url.contains("testcontainers"))
                    .as("Resolved database catalog or URL must explicitly reference a test schema: " + catalog + " (" + url + ")")
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Safety Guard: Fails fast with IllegalStateException if target database is 'acadlytic'")
    void safetyGuardFailsFastIfTargetingDevDatabase() throws SQLException {
        DataSource mockDevDataSource = mock(DataSource.class);
        Connection mockConn = mock(Connection.class);
        DatabaseMetaData mockMetaData = mock(DatabaseMetaData.class);

        when(mockDevDataSource.getConnection()).thenReturn(mockConn);
        when(mockConn.getCatalog()).thenReturn("acadlytic");
        when(mockConn.getMetaData()).thenReturn(mockMetaData);
        when(mockMetaData.getURL()).thenReturn("jdbc:mysql://localhost:3306/acadlytic");

        assertThatThrownBy(() -> AbstractMySqlIntegrationTest.assertTestDatabaseSafety(mockDevDataSource))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CRITICAL SAFETY VIOLATION")
                .hasMessageContaining("development database 'acadlytic'");
    }
}
