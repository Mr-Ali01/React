package com.resultpoint.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Standard ResultPoint API Error Response Envelope.
 * Guaranteed never to leak stack traces, SQL details, or internal server paths.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    @Builder.Default
    private boolean success = false;

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Builder.Default
    private Object data = null;

    private ErrorDetails error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetails {
        private String code;
        private String message;
        private int status;
        private List<ValidationErrorDetail> details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ValidationErrorDetail {
        private String field;
        private Object rejectedValue;
        private String message;
    }

    public static ApiErrorResponse of(String code, String message, int status) {
        return ApiErrorResponse.builder()
                .success(false)
                .timestamp(Instant.now())
                .data(null)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .status(status)
                        .build())
                .build();
    }

    public static ApiErrorResponse of(String code, String message, int status, List<ValidationErrorDetail> details) {
        return ApiErrorResponse.builder()
                .success(false)
                .timestamp(Instant.now())
                .data(null)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .status(status)
                        .details(details)
                        .build())
                .build();
    }
}
