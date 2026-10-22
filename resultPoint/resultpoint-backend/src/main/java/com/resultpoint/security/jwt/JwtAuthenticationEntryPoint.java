package com.resultpoint.security.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.common.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Authentication Entry Point.
 * Intercepts unauthenticated requests to protected endpoints and serializes standard 401 ApiErrorResponse JSON.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        log.debug("Unauthorized access attempt to [{}]: {}", request.getRequestURI(), authException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpStatus.UNAUTHORIZED.value());

        ApiErrorResponse errorResponse = ApiErrorResponse.of(
                "UNAUTHORIZED",
                "Full authentication is required to access this resource.",
                HttpStatus.UNAUTHORIZED.value()
        );

        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
