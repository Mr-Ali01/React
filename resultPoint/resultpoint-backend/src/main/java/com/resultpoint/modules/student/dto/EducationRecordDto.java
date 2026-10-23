package com.resultpoint.modules.student.dto;

import com.resultpoint.modules.student.domain.CategoryGroup;
import com.resultpoint.modules.student.domain.EntryMode;
import com.resultpoint.modules.student.domain.ResultStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationRecordDto {
    private String id;
    private String userId;
    private String type;
    private String level;
    private CategoryGroup categoryGroup;
    private String boardOrUniversity;
    private String institutionName;
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
    private Instant createdAt;
    private Instant updatedAt;
}
