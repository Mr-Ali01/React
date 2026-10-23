package com.resultpoint.modules.dataimport.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.dataimport.dto.DataImportReport;
import com.resultpoint.modules.dataimport.dto.ImportRegulationsRequest;
import com.resultpoint.modules.dataimport.dto.ImportSubjectsRequest;
import com.resultpoint.modules.dataimport.service.CatalogDataImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/catalog/import")
@RequiredArgsConstructor
@Tag(name = "Catalog Data Import", description = "Administrative bulk ingestion of curriculum subjects and regulations")
@SecurityRequirement(name = "bearerAuth")
public class CatalogDataImportController {

    private final CatalogDataImportService catalogDataImportService;

    @PostMapping("/subjects")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk import subjects via JSON", description = "Imports a list of curriculum subjects mapped to an academic regulation and semester")
    public ResponseEntity<ApiResponse<DataImportReport>> importSubjectsJson(
            @Valid @RequestBody ImportSubjectsRequest request
    ) {
        DataImportReport report = catalogDataImportService.importSubjectsFromJson(request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping(value = "/subjects/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk import subjects via CSV", description = "Imports subjects from an uploaded CSV file with line-by-line validation and reporting")
    public ResponseEntity<ApiResponse<DataImportReport>> importSubjectsCsv(
            @RequestParam("regulationId") String regulationId,
            @RequestParam("semesterNumber") int semesterNumber,
            @RequestParam("file") MultipartFile file
    ) {
        DataImportReport report = catalogDataImportService.importSubjectsFromCsv(regulationId, semesterNumber, file);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/regulations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk import regulations via JSON", description = "Imports academic regulations with course and grading scale associations")
    public ResponseEntity<ApiResponse<DataImportReport>> importRegulationsJson(
            @Valid @RequestBody ImportRegulationsRequest request
    ) {
        DataImportReport report = catalogDataImportService.importRegulationsFromJson(request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
