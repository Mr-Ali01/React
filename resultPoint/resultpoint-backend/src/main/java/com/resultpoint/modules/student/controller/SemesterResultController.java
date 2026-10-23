package com.resultpoint.modules.student.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.student.dto.SaveSemesterResultRequest;
import com.resultpoint.modules.student.dto.SemesterResultDto;
import com.resultpoint.modules.student.service.SemesterResultService;
import com.resultpoint.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/results")
@RequiredArgsConstructor
@Tag(name = "Semester Results", description = "Student academic semester results and scorecard snapshots")
@SecurityRequirement(name = "bearerAuth")
public class SemesterResultController {

    private final SemesterResultService semesterResultService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List student semester results", description = "Retrieves all verified semester scorecards with frozen snapshots for the authenticated student")
    public ResponseEntity<ApiResponse<List<SemesterResultDto>>> getResults(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<SemesterResultDto> results = semesterResultService.getSemesterResults(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get academic progression history", description = "Retrieves student academic history with semester scorecards and cumulative progression summary")
    public ResponseEntity<ApiResponse<com.resultpoint.modules.student.dto.AcademicHistoryDto>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        com.resultpoint.modules.student.dto.AcademicHistoryDto history = semesterResultService.getAcademicHistory(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/{semesterNumber}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get semester result by semester number", description = "Retrieves a detailed scorecard for a specific semester")
    public ResponseEntity<ApiResponse<SemesterResultDto>> getResultBySemester(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable int semesterNumber
    ) {
        SemesterResultDto result = semesterResultService.getSemesterResultByNumber(principal.getId(), semesterNumber);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit a semester result scorecard", description = "Submits and freezes a semester result, calculates SGPA/CGPA, and syncs backlogs")
    public ResponseEntity<ApiResponse<SemesterResultDto>> saveResult(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SaveSemesterResultRequest request
    ) {
        SemesterResultDto saved = semesterResultService.saveSemesterResult(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }

    @PutMapping("/{semesterNumber}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update a semester result scorecard", description = "Updates an existing semester result, re-computes SGPA/CGPA and syncs backlogs")
    public ResponseEntity<ApiResponse<SemesterResultDto>> updateResult(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable int semesterNumber,
            @Valid @RequestBody SaveSemesterResultRequest request
    ) {
        SemesterResultDto updated = semesterResultService.updateSemesterResult(principal.getId(), semesterNumber, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/{semesterNumber}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete a semester result scorecard", description = "Removes a semester scorecard and recalculates cumulative academic stats")
    public ResponseEntity<ApiResponse<Void>> deleteResult(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable int semesterNumber
    ) {
        semesterResultService.deleteSemesterResult(principal.getId(), semesterNumber);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
