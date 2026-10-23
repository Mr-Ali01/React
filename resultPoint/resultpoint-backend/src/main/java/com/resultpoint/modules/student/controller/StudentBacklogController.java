package com.resultpoint.modules.student.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.student.domain.BacklogStatus;
import com.resultpoint.modules.student.dto.ClearBacklogRequest;
import com.resultpoint.modules.student.dto.StudentBacklogDto;
import com.resultpoint.modules.student.service.StudentBacklogService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/backlogs")
@RequiredArgsConstructor
@Tag(name = "Student Backlogs", description = "Backlog tracking, status management, and arrears clearance")
@SecurityRequirement(name = "bearerAuth")
public class StudentBacklogController {

    private final StudentBacklogService studentBacklogService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List student backlogs", description = "Retrieves active or cleared backlogs for the authenticated student")
    public ResponseEntity<ApiResponse<List<StudentBacklogDto>>> getBacklogs(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) BacklogStatus status
    ) {
        List<StudentBacklogDto> backlogs = studentBacklogService.getBacklogs(principal.getId(), status);
        return ResponseEntity.ok(ApiResponse.success(backlogs));
    }

    @PostMapping("/clear")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark backlog as cleared", description = "Manually updates backlog status to cleared following supplementary exam evaluation")
    public ResponseEntity<ApiResponse<StudentBacklogDto>> clearBacklog(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ClearBacklogRequest request
    ) {
        StudentBacklogDto cleared = studentBacklogService.clearBacklog(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(cleared));
    }
}
