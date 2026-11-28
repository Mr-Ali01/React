package com.acadlytic.modules.colleges.controller;

import com.acadlytic.common.dto.PageResponse;
import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.modules.colleges.dto.SuperAdminCollegeDetailResponse;
import com.acadlytic.modules.colleges.dto.SuperAdminCollegeSummaryResponse;
import com.acadlytic.modules.colleges.dto.UpdateCollegeProfileRequest;
import com.acadlytic.modules.colleges.dto.UpdateCollegeStatusRequest;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.service.CollegeManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Super Admin controller for platform college directory listing, deep profile inspection,
 * operational lifecycle transitions, and profile modification (Phase 04, Module 4.2).
 */
@RestController
@RequestMapping("/api/v1/super-admin/colleges")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Super Admin College Management", description = "Tenant management, directory listing, profile update, and lifecycle management for colleges")
public class SuperAdminCollegeController {

    private final CollegeManagementService collegeManagementService;

    public SuperAdminCollegeController(CollegeManagementService collegeManagementService) {
        this.collegeManagementService = collegeManagementService;
    }

    @GetMapping
    @Operation(summary = "List, search, filter, and paginate all platform tenant colleges")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Colleges listed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination, filter, or sort property", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role", content = @Content)
    })
    public ApiResponse<PageResponse<SuperAdminCollegeSummaryResponse>> listColleges(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) CollegeStatus status,
            @RequestParam(name = "approvalStatus", required = false) CollegeApprovalStatus approvalStatus,
            @RequestParam(name = "affiliatedUniversity", required = false) String affiliatedUniversity,
            @RequestParam(name = "city", required = false) String city,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "sortDirection", defaultValue = "ASC") String sortDirection
    ) {
        PageResponse<SuperAdminCollegeSummaryResponse> response = collegeManagementService.getColleges(
                search, status, approvalStatus, affiliatedUniversity, city, state,
                page, size, sortBy, sortDirection);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve comprehensive details and operational profile for a college")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "College details retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "College not found", content = @Content)
    })
    public ApiResponse<SuperAdminCollegeDetailResponse> getCollegeDetails(
            @PathVariable("id") Long id
    ) {
        SuperAdminCollegeDetailResponse response = collegeManagementService.getCollegeById(id);
        return ApiResponse.success(response);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Transition operational lifecycle status of an approved college")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "College status updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid transition, same-status NOOP, or missing reason", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "College not found", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Stale college record version", content = @Content)
    })
    public ApiResponse<SuperAdminCollegeDetailResponse> updateCollegeStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateCollegeStatusRequest request,
            HttpServletRequest httpRequest
    ) {
        SuperAdminCollegeDetailResponse response = collegeManagementService.updateCollegeStatus(
                id, request, httpRequest);
        return ApiResponse.success("College operational status updated successfully", response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Full-replacement update of college operational profile")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "College profile updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or immutable code modification attempt", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "College not found", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Stale college record version", content = @Content)
    })
    public ApiResponse<SuperAdminCollegeDetailResponse> updateCollegeProfile(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateCollegeProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        SuperAdminCollegeDetailResponse response = collegeManagementService.updateCollegeProfile(
                id, request, httpRequest);
        return ApiResponse.success("College operational profile updated successfully", response);
    }
}
