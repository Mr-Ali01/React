package com.acadlytic.security;

import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.config.SecurityProperties;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

/**
 * Enforces on every authenticated request:
 * 1. 12-hour absolute session lifetime (ADR-01).
 * 2. Live server-side user status, MVP role check, and college operational status (ADR-10).
 */
@Component
public class SessionValidationFilter extends OncePerRequestFilter {

    private final SecurityProperties securityProperties;
    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final ObjectMapper objectMapper;

    public SessionValidationFilter(
            SecurityProperties securityProperties,
            UserRepository userRepository,
            CollegeRepository collegeRepository,
            ObjectMapper objectMapper) {
        this.securityProperties = securityProperties;
        this.userRepository = userRepository;
        this.collegeRepository = collegeRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AcadlyticUserPrincipal principal)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Allow public CSRF bootstrap and explicit logout without session validation
        String uri = request.getRequestURI();
        if ("/api/v1/auth/logout".equals(uri) || "/api/v1/auth/csrf".equals(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            SecurityContextHolder.clearContext();
            writeError(response, HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED", "Your session has expired. Please log in again.");
            return;
        }

        Instant createdAt = resolveSessionCreatedAt(session);
        long absoluteLifetimeSeconds = securityProperties.getSession().getAbsoluteLifetimeSeconds();
        if (Instant.now().isAfter(createdAt.plusSeconds(absoluteLifetimeSeconds))) {
            invalidateAndClear(session);
            writeError(response, HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED", "Your session has reached its maximum lifetime. Please log in again.");
            return;
        }

        Optional<User> userOpt = userRepository.findById(principal.getUserId());
        if (userOpt.isEmpty()) {
            invalidateAndClear(session);
            writeError(response, HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHENTICATED", "Authenticated account is no longer available.");
            return;
        }

        User user = userOpt.get();
        if (!user.getRole().isActiveInMvp()) {
            invalidateAndClear(session);
            writeError(response, HttpStatus.FORBIDDEN, "AUTH_ROLE_NOT_SUPPORTED", "This role is not enabled.");
            return;
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            invalidateAndClear(session);
            writeError(response, HttpStatus.FORBIDDEN, "AUTH_ACCOUNT_SUSPENDED", "Your account has been suspended. Please contact support.");
            return;
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            invalidateAndClear(session);
            writeError(response, HttpStatus.FORBIDDEN, "AUTH_ACCOUNT_INACTIVE", "Your account is inactive.");
            return;
        }

        if (user.getRole() == Role.COLLEGE_ADMIN) {
            if (user.getCollegeId() == null) {
                invalidateAndClear(session);
                writeError(response, HttpStatus.FORBIDDEN, "COLLEGE_INACTIVE", "No valid college tenant is associated with this account.");
                return;
            }
            Optional<College> collegeOpt = collegeRepository.findById(user.getCollegeId());
            if (collegeOpt.isEmpty()) {
                invalidateAndClear(session);
                writeError(response, HttpStatus.FORBIDDEN, "COLLEGE_INACTIVE", "Associated college tenant was not found.");
                return;
            }
            College college = collegeOpt.get();
            if (college.isPermanentlyRejected()) {
                invalidateAndClear(session);
                writeError(response, HttpStatus.FORBIDDEN, "REGISTRATION_PERMANENTLY_REJECTED",
                        "This college registration has been permanently rejected.");
                return;
            }
            if (college.getStatus() == CollegeStatus.SUSPENDED) {
                invalidateAndClear(session);
                writeError(response, HttpStatus.FORBIDDEN, "COLLEGE_SUSPENDED",
                        "This college account is currently suspended. Please contact Acadlytic support.");
                return;
            }
            if (college.getStatus() == CollegeStatus.INACTIVE) {
                invalidateAndClear(session);
                writeError(response, HttpStatus.FORBIDDEN, "COLLEGE_INACTIVE",
                        "This college account is inactive. Please contact Acadlytic support.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private Instant resolveSessionCreatedAt(HttpSession session) {
        Object attr = session.getAttribute(SessionConstants.SESSION_CREATED_AT);
        if (attr instanceof Instant instant) {
            return instant;
        }
        if (attr instanceof Long epochMillis) {
            return Instant.ofEpochMilli(epochMillis);
        }
        return Instant.ofEpochMilli(session.getCreationTime());
    }

    private void invalidateAndClear(HttpSession session) {
        SecurityContextHolder.clearContext();
        try {
            session.invalidate();
        } catch (IllegalStateException ignored) {
            // Session already invalidated
        }
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String errorCode, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.errorWithCode(errorCode, message));
    }
}
