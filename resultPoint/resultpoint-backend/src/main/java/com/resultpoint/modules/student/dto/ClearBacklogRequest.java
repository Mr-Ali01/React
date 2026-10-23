package com.resultpoint.modules.student.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClearBacklogRequest {

    @NotBlank(message = "Backlog ID is required")
    private String backlogId;

    @NotBlank(message = "Cleared academic period is required (e.g. 'Supplementary 2025')")
    private String clearedInPeriod;

    @NotBlank(message = "Cleared grade letter is required")
    private String clearedGrade;
}
