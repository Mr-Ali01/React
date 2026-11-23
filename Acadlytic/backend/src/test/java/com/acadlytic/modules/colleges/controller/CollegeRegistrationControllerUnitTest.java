package com.acadlytic.modules.colleges.controller;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.common.exception.GlobalExceptionHandler;
import com.acadlytic.common.exception.RateLimitExceededException;
import com.acadlytic.modules.colleges.dto.CollegeRegistrationResponse;
import com.acadlytic.modules.colleges.dto.RegisterCollegeRequest;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.service.CollegeRegistrationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CollegeRegistrationControllerUnitTest {

    @Mock
    private CollegeRegistrationService registrationService;

    @InjectMocks
    private CollegeRegistrationController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private RegisterCollegeRequest createValidRequest() {
        return new RegisterCollegeRequest(
                "Apex Institute of Technology",
                "APEX-TECH",
                "State Technical University",
                "100 Innovation Boulevard",
                "Building B, Suite 400",
                "Metropolis",
                "New York",
                "United States",
                "10001",
                "https://apex.edu",
                "+1-555-0199",
                "John",
                "Doe",
                "admin@apex.edu",
                "SecureP@ssword123!"
        );
    }

    @Test
    @DisplayName("Returns 201 Created with CollegeRegistrationResponse payload on valid intake")
    void returns201CreatedOnSuccess() throws Exception {
        RegisterCollegeRequest req = createValidRequest();
        CollegeRegistrationResponse expectedResponse = new CollegeRegistrationResponse(
                101L,
                501L,
                1,
                "Apex Institute of Technology",
                "APEX-TECH",
                CollegeApprovalStatus.PENDING,
                "admin@apex.edu",
                false,
                "College registration initiated successfully"
        );

        when(registrationService.register(any(RegisterCollegeRequest.class), any(HttpServletRequest.class))).thenReturn(expectedResponse);

        mockMvc.perform(post("/api/v1/college-registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.collegeId").value(101))
                .andExpect(jsonPath("$.data.registrationId").value(501))
                .andExpect(jsonPath("$.data.versionNumber").value(1))
                .andExpect(jsonPath("$.data.collegeCode").value("APEX-TECH"))
                .andExpect(jsonPath("$.data.submittedForReview").value(false))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("Returns 400 Bad Request with field validation errors when required fields are missing")
    void returns400OnValidationFailure() throws Exception {
        // Request with missing fields
        RegisterCollegeRequest req = new RegisterCollegeRequest(
                "", // Blank legal name
                "invalid code with spaces!", // Invalid pattern
                "",
                "",
                null,
                "",
                "",
                "",
                "",
                null,
                "",
                "",
                "",
                "invalid-email", // Bad email format
                "" // Blank password
        );

        mockMvc.perform(post("/api/v1/college-registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors.legalName").exists())
                .andExpect(jsonPath("$.errors.code").exists())
                .andExpect(jsonPath("$.errors.adminEmail").exists());
    }

    @Test
    @DisplayName("Returns 409 Conflict when college code already exists")
    void returns409OnDuplicateCollegeCode() throws Exception {
        RegisterCollegeRequest req = createValidRequest();
        when(registrationService.register(any(RegisterCollegeRequest.class), any(HttpServletRequest.class)))
                .thenThrow(new AppException("COLLEGE_CODE_ALREADY_EXISTS", "Code taken", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/v1/college-registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("COLLEGE_CODE_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Returns 409 Conflict when admin email already exists")
    void returns409OnDuplicateAdminEmail() throws Exception {
        RegisterCollegeRequest req = createValidRequest();
        when(registrationService.register(any(RegisterCollegeRequest.class), any(HttpServletRequest.class)))
                .thenThrow(new AppException("EMAIL_ALREADY_EXISTS", "Email taken", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/v1/college-registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Returns 429 Too Many Requests with Retry-After header when rate limit is exceeded")
    void returns429OnRateLimitExceeded() throws Exception {
        RegisterCollegeRequest req = createValidRequest();
        when(registrationService.register(any(RegisterCollegeRequest.class), any(HttpServletRequest.class)))
                .thenThrow(new RateLimitExceededException("Too many registration requests", 3600));

        mockMvc.perform(post("/api/v1/college-registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string(HttpHeaders.RETRY_AFTER, "3600"))
                .andExpect(jsonPath("$.errorCode").value("RATE_LIMIT_EXCEEDED"));
    }
}
