package com.resultpoint.modules.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationRecordSubjectDto {
    private Long id;
    private String subjectName;
    private String subjectCode;
    private BigDecimal marksObtained;
    private BigDecimal maxMarks;
    private String grade;
    private BigDecimal credits;
}
