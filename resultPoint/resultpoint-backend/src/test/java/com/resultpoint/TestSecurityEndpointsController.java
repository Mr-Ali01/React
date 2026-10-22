package com.resultpoint;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test Controller dedicated to integration testing of Security, CORS, and Exception envelopes.
 * Exists strictly in test classpath.
 */
@RestController
public class TestSecurityEndpointsController {

    @GetMapping("/api/v1/calculate/test-calc")
    public ApiResponse<String> publicCalculationTest() {
        return ApiResponse.success("Public calculator response");
    }

    @GetMapping("/api/v1/settings/public")
    public ApiResponse<String> publicSettingsTest() {
        return ApiResponse.success("Public settings response");
    }

    @GetMapping("/api/v1/student/test-profile")
    public ApiResponse<String> protectedStudentTest() {
        return ApiResponse.success("Protected student profile data");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/v1/admin/test-audit")
    public ApiResponse<String> protectedAdminTest() {
        return ApiResponse.success("Protected admin audit data");
    }

    @GetMapping("/api/v1/test/custom-error")
    public ApiResponse<String> testCustomError() {
        throw new ApiException(HttpStatus.BAD_REQUEST, "CUSTOM_TEST_CODE", "Sample domain error");
    }
}
