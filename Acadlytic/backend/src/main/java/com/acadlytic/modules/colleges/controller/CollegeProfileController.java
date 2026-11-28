package com.acadlytic.modules.colleges.controller;

import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.modules.colleges.dto.CollegeAdminProfileResponse;
import com.acadlytic.modules.colleges.dto.UpdateOwnCollegeProfileRequest;
import com.acadlytic.modules.colleges.service.CollegeProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Self-service operational profile controller for College Admins (Phase 04, Module 4.3).
 */
@RestController
@RequestMapping("/api/v1/college/profile")
@PreAuthorize("hasRole('COLLEGE_ADMIN')")
@Tag(name = "College Profile", description = "Self-service operational profile inspection and modification for College Admins")
public class CollegeProfileController {

    private final CollegeProfileService collegeProfileService;

    public CollegeProfileController(CollegeProfileService collegeProfileService) {
        this.collegeProfileService = collegeProfileService;
    }

    @GetMapping
    @Operation(summary = "Retrieve authenticated College Admin's own college profile")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "College profile retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires COLLEGE_ADMIN role and approved/active tenant", content = @Content)
    })
    public ApiResponse<CollegeAdminProfileResponse> getCollegeProfile() {
        CollegeAdminProfileResponse response = collegeProfileService.getOwnCollegeProfile();
        return ApiResponse.success("College profile retrieved successfully.", response);
    }

    @PutMapping
    @Operation(summary = "Update permitted operational profile fields for the authenticated College Admin's own college")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "College profile updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or immutable field modification attempt", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires COLLEGE_ADMIN role and approved/active tenant", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Stale record version (concurrency conflict)", content = @Content)
    })
    public ApiResponse<CollegeAdminProfileResponse> updateCollegeProfile(
            @Valid @RequestBody UpdateOwnCollegeProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        CollegeAdminProfileResponse response = collegeProfileService.updateOwnCollegeProfile(request, httpRequest);
        return ApiResponse.success("College profile updated successfully.", response);
    }
}
