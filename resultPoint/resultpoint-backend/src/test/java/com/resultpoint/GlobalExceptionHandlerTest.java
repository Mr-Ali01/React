package com.resultpoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.common.dto.ApiErrorResponse;
import com.resultpoint.common.exception.ApiException;
import com.resultpoint.common.exception.GlobalExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    static class TestAuthDto {
        @NotBlank(message = "Email is required.")
        private String email;

        @NotBlank(message = "Password is required.")
        @Size(min = 8, message = "Password must be at least 8 characters.")
        private String password;
    }

    @RestController
    @RequestMapping("/test-api")
    static class DummyTestController {

        @PostMapping("/signup")
        public String signup(@Valid @RequestBody TestAuthDto dto) {
            return "SUCCESS";
        }

        @GetMapping("/duplicate-email")
        public void duplicateEmail() {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email address already exists.");
        }

        @GetMapping("/data-conflict")
        public void dataConflict() {
            throw new DataIntegrityViolationException("Duplicate entry 'usr_123' for key 'PRIMARY'");
        }

        @GetMapping("/server-error")
        public void serverError() {
            throw new RuntimeException("Sensitive database stacktrace or internal failure");
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new DummyTestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testValidationFailureMasksPasswordAndReturns400() throws Exception {
        TestAuthDto invalidDto = new TestAuthDto();
        invalidDto.setEmail("");
        invalidDto.setPassword("short");

        mockMvc.perform(post("/test-api/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.status").value(400))
                .andExpect(jsonPath("$.error.message").value("Invalid request parameters provided."))
                .andExpect(jsonPath("$.error.details").isArray())
                .andExpect(jsonPath("$.error.details[?(@.field == 'password')].rejectedValue").doesNotExist())
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    assertFalse(body.contains("short"), "Password must never be leaked in response body!");
                });
    }

    @Test
    void testMalformedJsonReturns400BadRequest() throws Exception {
        mockMvc.perform(post("/test-api/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("NOT_VALID_JSON{:::"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.error.status").value(400));
    }

    @Test
    void testDuplicateEmailReturns409Conflict() throws Exception {
        mockMvc.perform(get("/test-api/duplicate-email"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_REGISTERED"))
                .andExpect(jsonPath("$.error.status").value(409))
                .andExpect(jsonPath("$.error.message").value("An account with this email address already exists."));
    }

    @Test
    void testDataIntegrityViolationReturns409WithoutLeakingSql() throws Exception {
        mockMvc.perform(get("/test-api/data-conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("DATA_CONFLICT"))
                .andExpect(jsonPath("$.error.status").value(409))
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    assertFalse(body.contains("Duplicate entry"), "Raw SQL error must not be exposed to client");
                });
    }

    @Test
    void testUnexpectedServerErrorReturns500WithoutLeakingDetails() throws Exception {
        mockMvc.perform(get("/test-api/server-error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INTERNAL_SERVER_ERROR"))
                .andExpect(jsonPath("$.error.status").value(500))
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    assertFalse(body.contains("Sensitive database stacktrace"), "Internal stack traces must not be exposed");
                });
    }
}
