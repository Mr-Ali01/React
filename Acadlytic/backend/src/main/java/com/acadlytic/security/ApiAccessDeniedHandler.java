package com.acadlytic.security;

import com.acadlytic.common.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class ApiAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public ApiAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        if (accessDeniedException instanceof CsrfException) {
            objectMapper.writeValue(
                    response.getOutputStream(),
                    ApiResponse.errorWithCode(
                            "CSRF_TOKEN_INVALID",
                            "Invalid or missing CSRF token."));
            return;
        }

        objectMapper.writeValue(
                response.getOutputStream(),
                ApiResponse.errorWithCode(
                        "ACCESS_DENIED",
                        "Access denied. Insufficient permissions."));
    }
}
