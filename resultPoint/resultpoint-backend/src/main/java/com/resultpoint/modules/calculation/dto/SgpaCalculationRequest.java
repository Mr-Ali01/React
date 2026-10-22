package com.resultpoint.modules.calculation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SgpaCalculationRequest {

    private String universityId;

    private String regulationId;

    @NotEmpty(message = "At least one subject must be provided for SGPA calculation")
    @Valid
    private List<SubjectGradeInput> subjects;
}
