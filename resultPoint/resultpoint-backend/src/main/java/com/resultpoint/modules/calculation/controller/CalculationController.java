package com.resultpoint.modules.calculation.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.calculation.dto.*;
import com.resultpoint.modules.calculation.service.CalculationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/calculate")
@RequiredArgsConstructor
@Tag(name = "Academic Calculation Engine", description = "Public regulation-aware SGPA, CGPA, percentage, and target CGPA calculation APIs")
public class CalculationController {

    private final CalculationService calculationService;

    @Operation(summary = "Calculate SGPA with credit weighting and grade scale mapping")
    @PostMapping("/sgpa")
    public ResponseEntity<ApiResponse<SgpaCalculationResponse>> calculateSgpa(
            @Valid @RequestBody SgpaCalculationRequest request
    ) {
        SgpaCalculationResponse response = calculationService.calculateSgpa(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Calculate CGPA from multi-semester SGPA inputs")
    @PostMapping("/cgpa")
    public ResponseEntity<ApiResponse<CgpaCalculationResponse>> calculateCgpa(
            @Valid @RequestBody CgpaCalculationRequest request
    ) {
        CgpaCalculationResponse response = calculationService.calculateCgpa(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Convert CGPA to official percentage using institutional regulation rules")
    @PostMapping("/percentage")
    public ResponseEntity<ApiResponse<PercentageCalculationResponse>> calculatePercentage(
            @Valid @RequestBody PercentageCalculationRequest request
    ) {
        PercentageCalculationResponse response = calculationService.calculatePercentage(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Determine required future semester SGPA to achieve target honors CGPA")
    @PostMapping("/target-cgpa")
    public ResponseEntity<ApiResponse<TargetCgpaResponse>> calculateTargetCgpa(
            @Valid @RequestBody TargetCgpaRequest request
    ) {
        TargetCgpaResponse response = calculationService.calculateTargetCgpa(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "List all supported grading scales and grade boundaries")
    @GetMapping("/scales")
    public ResponseEntity<ApiResponse<List<GradingScaleDto>>> getAllGradingScales() {
        return ResponseEntity.ok(ApiResponse.success(calculationService.getAllGradingScales()));
    }

    @Operation(summary = "Get specific grading scale and its letter-grade boundaries")
    @GetMapping("/scales/{scaleId}")
    public ResponseEntity<ApiResponse<GradingScaleDto>> getGradingScaleById(@PathVariable String scaleId) {
        return ResponseEntity.ok(ApiResponse.success(calculationService.getGradingScaleById(scaleId)));
    }

    @Operation(summary = "List all registered institutional calculation rules")
    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<CalculationRuleDto>>> getAllCalculationRules() {
        return ResponseEntity.ok(ApiResponse.success(calculationService.getAllCalculationRules()));
    }

    @Operation(summary = "Get specific calculation rule formula and rounding configuration")
    @GetMapping("/rules/{ruleId}")
    public ResponseEntity<ApiResponse<CalculationRuleDto>> getCalculationRuleById(@PathVariable String ruleId) {
        return ResponseEntity.ok(ApiResponse.success(calculationService.getCalculationRuleById(ruleId)));
    }
}
