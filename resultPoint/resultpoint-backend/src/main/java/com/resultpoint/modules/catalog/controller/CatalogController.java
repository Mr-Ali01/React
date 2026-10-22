package com.resultpoint.modules.catalog.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.catalog.dto.*;
import com.resultpoint.modules.catalog.entity.CourseLevel;
import com.resultpoint.modules.catalog.entity.CourseStatus;
import com.resultpoint.modules.catalog.entity.RegulationStatus;
import com.resultpoint.modules.catalog.entity.UniversityStatus;
import com.resultpoint.modules.catalog.service.AcademicCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/catalog")
@RequiredArgsConstructor
@Tag(name = "Academic Catalog", description = "Public academic catalog and administrative curriculum management APIs")
public class CatalogController {

    private final AcademicCatalogService catalogService;

    // --- Universities ---

    @Operation(summary = "Search and list universities with pagination and filtering")
    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<Page<UniversityDto>>> searchUniversities(
            @RequestParam(required = false) UniversityStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<UniversityDto> page = catalogService.searchUniversities(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @Operation(summary = "Get university details and active degree programs by ID")
    @GetMapping("/universities/{universityId}")
    public ResponseEntity<ApiResponse<UniversityDetailDto>> getUniversityById(@PathVariable String universityId) {
        UniversityDetailDto dto = catalogService.getUniversityById(universityId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @Operation(summary = "Create a new university record (ADMIN only)", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/universities")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UniversityDto>> createUniversity(
            @Valid @RequestBody CreateUniversityRequest request
    ) {
        UniversityDto dto = catalogService.createUniversity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    // --- Courses ---

    @Operation(summary = "Search and list degree courses across universities")
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<Page<CourseDto>>> searchCourses(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) CourseLevel level,
            @RequestParam(required = false) CourseStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<CourseDto> page = catalogService.searchCourses(universityId, level, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @Operation(summary = "List all courses offered by a specific university")
    @GetMapping("/universities/{universityId}/courses")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getCoursesByUniversity(@PathVariable String universityId) {
        List<CourseDto> list = catalogService.getCoursesByUniversity(universityId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @Operation(summary = "Get course details and applicable academic regulations by ID")
    @GetMapping("/courses/{courseId}")
    public ResponseEntity<ApiResponse<CourseDetailDto>> getCourseById(@PathVariable String courseId) {
        CourseDetailDto dto = catalogService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @Operation(summary = "Create a new degree course under a university (ADMIN only)", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/courses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseDto>> createCourse(
            @Valid @RequestBody CreateCourseRequest request
    ) {
        CourseDto dto = catalogService.createCourse(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    // --- Regulations ---

    @Operation(summary = "Search and list academic regulations with pagination")
    @GetMapping("/regulations")
    public ResponseEntity<ApiResponse<Page<RegulationDto>>> searchRegulations(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) RegulationStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<RegulationDto> page = catalogService.searchRegulations(courseId, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @Operation(summary = "List all regulations applicable to a specific course")
    @GetMapping("/courses/{courseId}/regulations")
    public ResponseEntity<ApiResponse<List<RegulationDto>>> getRegulationsByCourse(@PathVariable String courseId) {
        List<RegulationDto> list = catalogService.getRegulationsByCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @Operation(summary = "Get full regulation detail: grading scale, calculation rule, and admission batches")
    @GetMapping("/regulations/{regulationId}")
    public ResponseEntity<ApiResponse<RegulationDetailDto>> getRegulationById(@PathVariable String regulationId) {
        RegulationDetailDto dto = catalogService.getRegulationById(regulationId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @Operation(summary = "Create an academic regulation with grading scale and calculation rule (ADMIN only)", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/regulations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RegulationDto>> createRegulation(
            @Valid @RequestBody CreateRegulationRequest request
    ) {
        RegulationDto dto = catalogService.createRegulation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    // --- Curriculum Subjects ---

    @Operation(summary = "Get curriculum subjects mapped to an academic regulation and optional semester")
    @GetMapping("/regulations/{regulationId}/curriculum")
    public ResponseEntity<ApiResponse<List<CurriculumSubjectDto>>> getRegulationCurriculum(
            @PathVariable String regulationId,
            @RequestParam(required = false) Integer semesterNumber
    ) {
        List<CurriculumSubjectDto> list = catalogService.getRegulationCurriculum(regulationId, semesterNumber);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
