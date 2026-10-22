package com.resultpoint.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.common.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Access Denied Handler.
 * Returns standardized 403 ApiErrorResponse JSON when an authenticated principal attempts an unauthorized action.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        log.warn("Forbidden access attempt to [{}]: {}", request.getRequestURI(), accessDeniedException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpStatus.FORBIDDEN.value());

        ApiErrorResponse errorResponse = ApiErrorResponse.of(
                "ACCESS_DENIED",
                "You do not have the required permissions to access this resource.",
                HttpStatus.FORBIDDEN.value()
        );

        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
