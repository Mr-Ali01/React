package com.resultpoint.modules.student.dto;

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
public class SemesterResultDto {
    private String id;
    private String studentProfileId;
    private int semesterNumber;
    private String academicPeriod;
    private BigDecimal totalCredits;
    private BigDecimal creditsEarned;
    private BigDecimal sgpa;
    private BigDecimal cgpa;
    private BigDecimal equivalentPercentage;
    private String standingStatus;
    private String ruleVersionSnapshot;
    private String gradingScaleSnapshotJson;
    private String calculationRuleSnapshotJson;
    private List<SubjectResultDto> subjects;
    private Instant createdAt;
    private Instant updatedAt;
}
