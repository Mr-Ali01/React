package com.resultpoint.modules.report.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.security.UserPrincipal;
import com.resultpoint.modules.report.dto.StudentBacklogReportDto;
import com.resultpoint.modules.report.dto.StudentPerformanceReportDto;
import com.resultpoint.modules.report.dto.StudentProjectionReportDto;
import com.resultpoint.modules.report.service.StudentReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/reports")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
@Tag(name = "Student Academic Reports", description = "Endpoints for academic performance analysis, backlog risk evaluation, and target CGPA forecasts")
public class StudentReportController {

    private final StudentReportService studentReportService;

    @GetMapping("/performance")
    @Operation(summary = "Get Academic Performance Report", description = "Retrieves semester-by-semester trends, SGPA/CGPA progression, and cumulative credit metrics.")
    public ResponseEntity<ApiResponse<StudentPerformanceReportDto>> getPerformanceReport(
            @AuthenticationPrincipal UserPrincipal principal) {
        StudentPerformanceReportDto report = studentReportService.getPerformanceReport(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/backlogs")
    @Operation(summary = "Get Backlog Risk & Clearance Report", description = "Retrieves active backlogs, clearance history, and total academic credits at risk.")
    public ResponseEntity<ApiResponse<StudentBacklogReportDto>> getBacklogReport(
            @AuthenticationPrincipal UserPrincipal principal) {
        StudentBacklogReportDto report = studentReportService.getBacklogReport(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/projections")
    @Operation(summary = "Get Target CGPA Projections Report", description = "Evaluates student goals against current academic trajectory to determine required future SGPA and feasibility.")
    public ResponseEntity<ApiResponse<StudentProjectionReportDto>> getProjectionReport(
            @AuthenticationPrincipal UserPrincipal principal) {
        StudentProjectionReportDto report = studentReportService.getProjectionReport(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
