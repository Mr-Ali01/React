package com.resultpoint.modules.dataimport.dto;

import com.resultpoint.modules.catalog.entity.SubjectType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectImportItem {

    @NotBlank(message = "Subject code is required")
    private String subjectCode;

    @NotBlank(message = "Subject name is required")
    private String subjectName;

    @NotNull(message = "Credits are required")
    @DecimalMin(value = "0.5", message = "Credits must be at least 0.5")
    private BigDecimal credits;

    @Builder.Default
    private SubjectType subjectType = SubjectType.THEORY;

    private String department;

    @Builder.Default
    private boolean isElective = false;

    @Builder.Default
    private int displayOrder = 0;
}
