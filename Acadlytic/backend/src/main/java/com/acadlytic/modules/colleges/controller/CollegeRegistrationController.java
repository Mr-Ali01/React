package com.acadlytic.modules.colleges.controller;

import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.modules.colleges.dto.CollegeRegistrationResponse;
import com.acadlytic.modules.colleges.dto.RegisterCollegeRequest;
import com.acadlytic.modules.colleges.service.CollegeRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for public college registration intake (Phase 03, Module 3.1A).
 */
@RestController
@RequestMapping("/api/v1/college-registrations")
@Tag(name = "College Registration", description = "Public college registration intake and onboarding lifecycle")
public class CollegeRegistrationController {

    private final CollegeRegistrationService collegeRegistrationService;

    public CollegeRegistrationController(CollegeRegistrationService collegeRegistrationService) {
        this.collegeRegistrationService = collegeRegistrationService;
    }

    @PostMapping
    @Operation(summary = "Register college and administrator", description = "Public intake for new college registration with v1 application draft")
    public ResponseEntity<ApiResponse<CollegeRegistrationResponse>> register(
            @Valid @RequestBody RegisterCollegeRequest request,
            HttpServletRequest httpRequest) {
        CollegeRegistrationResponse response = collegeRegistrationService.register(request, httpRequest);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("College registration initiated successfully", response));
    }
}
