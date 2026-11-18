package com.acadlytic.modules.auth.controller;

import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.modules.auth.dto.ChangeEmailRequest;
import com.acadlytic.modules.auth.dto.ChangePasswordRequest;
import com.acadlytic.modules.auth.dto.CurrentUserResponse;
import com.acadlytic.modules.auth.dto.ForgotPasswordRequest;
import com.acadlytic.modules.auth.dto.LoginRequest;
import com.acadlytic.modules.auth.dto.ResetPasswordRequest;
import com.acadlytic.modules.auth.dto.VerifyEmailChangeRequest;
import com.acadlytic.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Stateful session authentication, SPA CSRF bootstrap, password management, and email change APIs")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/csrf")
    @Operation(summary = "Bootstrap SPA CSRF token", description = "Initializes the XSRF-TOKEN cookie for SPA clients")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user", description = "Authenticates SUPER_ADMIN or COLLEGE_ADMIN and establishes a stateful HTTP-only session")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        CurrentUserResponse user = authService.login(request, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Login successful", user));
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out current session", description = "Invalidates the current stateful session only")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpRequest) {
        authService.logout(httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user", description = "Returns authoritative user identity, role, email verification, and college approval/management status")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> me() {
        CurrentUserResponse user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Current user retrieved", user));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Verifies current password, updates password, revokes all other sessions, and rotates current session ID")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        authService.changePassword(request, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Queues a 1-hour single-use password reset email if an eligible active account exists (non-enumerating response)")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.forgotPassword(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(
                "If an eligible account exists for this email, a password reset link has been sent.",
                null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Complete password reset", description = "Redeems a single-use reset token, updates password, and revokes all active sessions")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.resetPassword(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully. Please log in again.", null));
    }

    @PostMapping("/change-email")
    @Operation(summary = "Request email change", description = "Requires current password, stores pending_email, and queues 48-hour verification and security alert emails")
    public ResponseEntity<ApiResponse<Void>> changeEmail(
            @Valid @RequestBody ChangeEmailRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        authService.changeEmail(request, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success(
                "Verification instructions have been sent to your new email address.",
                null));
    }

    @PostMapping("/verify-email-change")
    @Operation(summary = "Confirm email change", description = "Redeems the 48-hour email-change token, swaps email atomically, and revokes other sessions")
    public ResponseEntity<ApiResponse<Void>> verifyEmailChange(
            @Valid @RequestBody VerifyEmailChangeRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        authService.verifyEmailChange(request, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Email address updated successfully.", null));
    }
}
