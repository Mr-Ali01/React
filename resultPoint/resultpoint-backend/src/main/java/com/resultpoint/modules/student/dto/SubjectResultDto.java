package com.resultpoint.modules.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResultDto {
    private String id;
    private String subjectCode;
    private String subjectName;
    private BigDecimal credits;
    private String gradeLetter;
    private BigDecimal gradePoints;
    private BigDecimal internalMarks;
    private BigDecimal externalMarks;
    private BigDecimal totalMarks;
    @com.fasterxml.jackson.annotation.JsonProperty("isPass")
    private boolean pass;
    private Instant createdAt;
}
