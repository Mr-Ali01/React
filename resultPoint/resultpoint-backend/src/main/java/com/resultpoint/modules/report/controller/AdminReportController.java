package com.resultpoint.modules.report.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.report.dto.CatalogSummaryReportDto;
import com.resultpoint.modules.report.service.CatalogReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Academic Reports", description = "Endpoints for academic catalog summaries and institutional metrics")
public class AdminReportController {

    private final CatalogReportService catalogReportService;

    @GetMapping("/catalog-summary")
    @Operation(summary = "Get Catalog Summary Report", description = "Retrieves high-level summary counts and breakdown of universities, courses, and regulations.")
    public ResponseEntity<ApiResponse<CatalogSummaryReportDto>> getCatalogSummary() {
        CatalogSummaryReportDto report = catalogReportService.getCatalogSummary();
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
