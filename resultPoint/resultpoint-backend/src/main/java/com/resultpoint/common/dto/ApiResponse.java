package com.resultpoint.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Standard ResultPoint API Success Response Envelope.
 * Adheres to OpenAPI 3.0 contract specified in docs/backend-architecture/api-specification.md.
 *
 * @param <T> Domain response payload type
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @Builder.Default
    private boolean success = true;

    @Builder.Default
    private Instant timestamp = Instant.now();

    private T data;

    @Builder.Default
    private Object error = null;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .timestamp(Instant.now())
                .data(data)
                .error(null)
                .build();
    }

    public static <T> ApiResponse<T> emptySuccess() {
        return ApiResponse.<T>builder()
                .success(true)
                .timestamp(Instant.now())
                .data(null)
                .error(null)
                .build();
    }
}
