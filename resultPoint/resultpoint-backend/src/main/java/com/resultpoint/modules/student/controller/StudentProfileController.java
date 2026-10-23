package com.resultpoint.modules.student.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.student.dto.StudentProfileDto;
import com.resultpoint.modules.student.dto.UpdateStudentProfileRequest;
import com.resultpoint.modules.student.service.StudentProfileService;
import com.resultpoint.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/student/profile")
@RequiredArgsConstructor
@Tag(name = "Student Profile", description = "Student academic and personal profile management")
@SecurityRequirement(name = "bearerAuth")
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current student profile", description = "Retrieves the academic profile and stats for the authenticated student")
    public ResponseEntity<ApiResponse<StudentProfileDto>> getProfile(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        StudentProfileDto profile = studentProfileService.getProfileByUserId(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update student profile", description = "Creates or updates academic profile details for the authenticated student")
    public ResponseEntity<ApiResponse<StudentProfileDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateStudentProfileRequest request
    ) {
        StudentProfileDto updated = studentProfileService.createOrUpdateProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }
}
