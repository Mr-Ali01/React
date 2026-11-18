package com.acadlytic.support;

import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.security.CollegeAccessGuard;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Test-only controller for verifying role-based access control, tenant isolation,
 * and live approval-state gating through the full Spring Security filter chain.
 */
@RestController
@RequestMapping("/api/v1/test-probe")
public class TestAuthorizationProbeController {

    private final CollegeAccessGuard collegeAccessGuard;

    public TestAuthorizationProbeController(CollegeAccessGuard collegeAccessGuard) {
        this.collegeAccessGuard = collegeAccessGuard;
    }

    @GetMapping("/super-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> superAdminOnly() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("scope", "SUPER_ADMIN")));
    }

    @GetMapping("/colleges/{collegeId}/management")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COLLEGE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> collegeManagement(@PathVariable Long collegeId) {
        College college = collegeAccessGuard.requireApprovedAndActiveCollege(collegeId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "collegeId", college.getId(),
                "code", college.getCode()
        )));
    }
}
