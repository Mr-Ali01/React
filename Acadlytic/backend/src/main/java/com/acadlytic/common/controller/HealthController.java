package com.acadlytic.common.controller;

import com.acadlytic.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Check", description = "Endpoints for platform diagnostics, uptime, and database connectivity")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.name:Acadlytic Academic Intelligence Platform}")
    private String appName;

    @Value("${app.version:0.0.1-SNAPSHOT}")
    private String appVersion;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @Operation(summary = "Check platform health", description = "Returns the operational status, database connectivity, and environment metadata")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("application", appName);
        healthData.put("version", appVersion);
        healthData.put("environment", activeProfile);
        healthData.put("timestamp", Instant.now().toString());

        // Check database connection
        try {
            Integer dbResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            boolean dbHealthy = dbResult != null && dbResult == 1;
            healthData.put("database", dbHealthy ? "CONNECTED" : "UNHEALTHY");
        } catch (Exception e) {
            healthData.put("database", "DISCONNECTED: " + e.getMessage());
            return ResponseEntity.status(503).body(ApiResponse.error("Database connection failure", healthData));
        }

        return ResponseEntity.ok(ApiResponse.success("Platform is operational", healthData));
    }
}
