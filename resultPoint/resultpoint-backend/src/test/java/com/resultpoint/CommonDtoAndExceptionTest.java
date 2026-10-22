package com.resultpoint;

import com.resultpoint.common.dto.ApiErrorResponse;
import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.common.dto.PageResponse;
import com.resultpoint.common.exception.AccessDeniedException;
import com.resultpoint.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.util.List;

public class CommonDtoAndExceptionTest {

    @Test
    void testApiResponseEnvelope() {
        ApiResponse<String> response = ApiResponse.success("test-payload");
        Assertions.assertTrue(response.isSuccess());
        Assertions.assertEquals("test-payload", response.getData());
        Assertions.assertNull(response.getError());
        Assertions.assertNotNull(response.getTimestamp());

        ApiResponse<Void> empty = ApiResponse.emptySuccess();
        Assertions.assertTrue(empty.isSuccess());
        Assertions.assertNull(empty.getData());
    }

    @Test
    void testApiErrorResponseEnvelope() {
        ApiErrorResponse error = ApiErrorResponse.of("NOT_FOUND", "Item missing", 404);
        Assertions.assertFalse(error.isSuccess());
        Assertions.assertNull(error.getData());
        Assertions.assertEquals("NOT_FOUND", error.getError().getCode());
        Assertions.assertEquals("Item missing", error.getError().getMessage());
        Assertions.assertEquals(404, error.getError().getStatus());

        ApiErrorResponse.ValidationErrorDetail detail = ApiErrorResponse.ValidationErrorDetail.builder()
                .field("email")
                .rejectedValue("bad-email")
                .message("Must be valid")
                .build();

        ApiErrorResponse validationError = ApiErrorResponse.of("VALIDATION_FAILED", "Failed", 400, List.of(detail));
        Assertions.assertEquals(1, validationError.getError().getDetails().size());
        Assertions.assertEquals("email", validationError.getError().getDetails().get(0).getField());
    }

    @Test
    void testPageResponseEnvelope() {
        List<String> items = List.of("A", "B", "C");
        PageImpl<String> page = new PageImpl<>(items, PageRequest.of(0, 10), 3);

        PageResponse<String> pageResponse = PageResponse.from(page);
        Assertions.assertEquals(3, pageResponse.getContent().size());
        Assertions.assertEquals(0, pageResponse.getPageNumber());
        Assertions.assertEquals(10, pageResponse.getPageSize());
        Assertions.assertEquals(3L, pageResponse.getTotalElements());
        Assertions.assertEquals(1, pageResponse.getTotalPages());
        Assertions.assertTrue(pageResponse.isLast());
    }

    @Test
    void testDomainExceptions() {
        ResourceNotFoundException notFound = new ResourceNotFoundException("Course", "id", "course_123");
        Assertions.assertEquals(HttpStatus.NOT_FOUND, notFound.getStatus());
        Assertions.assertEquals("RESOURCE_NOT_FOUND", notFound.getErrorCode());
        Assertions.assertTrue(notFound.getMessage().contains("Course not found"));

        AccessDeniedException accessDenied = new AccessDeniedException("Custom denied message");
        Assertions.assertEquals(HttpStatus.FORBIDDEN, accessDenied.getStatus());
        Assertions.assertEquals("ACCESS_DENIED", accessDenied.getErrorCode());
    }
}
