package com.resultpoint.modules.student.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.student.dto.CreateEducationRecordRequest;
import com.resultpoint.modules.student.dto.EducationRecordDto;
import com.resultpoint.modules.student.service.EducationRecordService;
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
@RequestMapping("/api/v1/student/education-records")
@RequiredArgsConstructor
@Tag(name = "Education Records", description = "Student multi-qualification history (10th, 12th, UG, PG)")
@SecurityRequirement(name = "bearerAuth")
public class EducationRecordController {

    private final EducationRecordService educationRecordService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List education records", description = "Retrieves qualification history for the authenticated student")
    public ResponseEntity<ApiResponse<List<EducationRecordDto>>> getEducationRecords(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<EducationRecordDto> records = educationRecordService.getEducationRecords(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add an education record", description = "Persists an education qualification record with subject breakdowns")
    public ResponseEntity<ApiResponse<EducationRecordDto>> createEducationRecord(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateEducationRecordRequest request
    ) {
        EducationRecordDto created = educationRecordService.createEducationRecord(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete an education record", description = "Removes a student education record by ID")
    public ResponseEntity<ApiResponse<Void>> deleteEducationRecord(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id
    ) {
        educationRecordService.deleteEducationRecord(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
