package com.resultpoint.modules.auth.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.auth.dto.*;
import com.resultpoint.modules.auth.service.AuthService;
import com.resultpoint.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication and Session Management REST Controller.
 */
@Tag(name = "Authentication", description = "Endpoints for user registration, authentication, session tokens, and password reset.")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new student account")
    @PostMapping({"/register", "/signup"})
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                              HttpServletRequest httpRequest) {
        String ipAddress = extractClientIp(httpRequest);
        String deviceInfo = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.register(request, ipAddress, deviceInfo);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @Operation(summary = "Authenticate user and issue access and refresh tokens")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        String ipAddress = extractClientIp(httpRequest);
        AuthResponse response = authService.login(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Exchange refresh token for a new token pair (single-use rotation with 30s grace window)")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request,
                                                             HttpServletRequest httpRequest) {
        String ipAddress = extractClientIp(httpRequest);
        AuthResponse response = authService.refresh(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Revoke the current refresh token session")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout(@RequestBody(required = false) RefreshTokenRequest request,
                                                                  @AuthenticationPrincipal UserPrincipal principal) {
        String token = request != null ? request.getRefreshToken() : null;
        authService.logout(token, principal);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Logged out successfully.")));
    }

    @Operation(summary = "Revoke all active sessions for the authenticated user")
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Map<String, String>>> logoutAll(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logoutAll(principal);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "All active sessions have been revoked.")));
    }

    @Operation(summary = "Request password reset token via email (enumeration-safe)")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message", "If an account with that email exists, password reset instructions have been sent."
        )));
    }

    @Operation(summary = "Reset password using single-use reset token and revoke active sessions")
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message", "Password has been reset successfully. Please log in with your new credentials."
        )));
    }

    @Operation(summary = "Retrieve current authenticated user profile")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserSummaryDto user = authService.getCurrentUser(principal);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
