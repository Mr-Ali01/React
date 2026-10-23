package com.resultpoint.modules.student.dto;

import com.resultpoint.modules.student.domain.CategoryGroup;
import com.resultpoint.modules.student.domain.EntryMode;
import com.resultpoint.modules.student.domain.ResultStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEducationRecordRequest {

    @NotBlank(message = "Education type is required (e.g. 'CLASS_10', 'CLASS_12', 'UNDERGRADUATE')")
    private String type;

    @NotBlank(message = "Education level is required (e.g. 'Secondary', 'B.Tech')")
    private String level;

    @NotNull(message = "Category group is required")
    private CategoryGroup categoryGroup;

    @NotBlank(message = "Board or University name is required")
    private String boardOrUniversity;

    @NotBlank(message = "Institution name is required")
    private String institutionName;

    @Min(value = 1950, message = "Passing year must be valid (1950 or later)")
    private int passingYear;

    private String academicYear;

    private String rollNumber;

    private EntryMode entryMode;

    private ResultStatus resultStatus;

    private BigDecimal totalMarks;

    private BigDecimal maxMarks;

    private BigDecimal percentage;

    private BigDecimal cgpa;

    private String finalGrade;

    private List<EducationRecordSubjectDto> subjects;
}
