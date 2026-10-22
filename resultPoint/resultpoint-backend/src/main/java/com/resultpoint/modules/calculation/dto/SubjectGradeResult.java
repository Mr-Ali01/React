package com.resultpoint.modules.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectGradeResult {
    private String subjectCode;
    private String subjectName;
    private BigDecimal credits;
    private String letterGrade;
    private BigDecimal gradePoints;
    private BigDecimal creditPoints; // credits * gradePoints
    @com.fasterxml.jackson.annotation.JsonProperty("isPass")
    private boolean isPass;
    private String qualitativeDesc;
}
