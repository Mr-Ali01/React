package com.resultpoint.modules.student.controller;

import com.resultpoint.common.dto.ApiResponse;
import com.resultpoint.modules.student.dto.CreateGoalRequest;
import com.resultpoint.modules.student.dto.StudentGoalDto;
import com.resultpoint.modules.student.dto.UpdateGoalRequest;
import com.resultpoint.modules.student.service.StudentGoalService;
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
@RequestMapping("/api/v1/student/goals")
@RequiredArgsConstructor
@Tag(name = "Student Goals", description = "Student academic target CGPA goals and future feasibility projections")
@SecurityRequirement(name = "bearerAuth")
public class StudentGoalController {

    private final StudentGoalService studentGoalService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List academic goals", description = "Retrieves active and historical CGPA targets and projections for the authenticated student")
    public ResponseEntity<ApiResponse<List<StudentGoalDto>>> getGoals(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<StudentGoalDto> goals = studentGoalService.getGoals(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(goals));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create an academic target goal", description = "Sets a target CGPA and computes required future SGPA projections")
    public ResponseEntity<ApiResponse<StudentGoalDto>> createGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGoalRequest request
    ) {
        StudentGoalDto created = studentGoalService.createGoal(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update an academic target goal", description = "Modifies an academic goal and recalculates projections")
    public ResponseEntity<ApiResponse<StudentGoalDto>> updateGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateGoalRequest request
    ) {
        StudentGoalDto updated = studentGoalService.updateGoal(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete an academic target goal", description = "Removes an academic goal for the authenticated student")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id
    ) {
        studentGoalService.deleteGoal(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
