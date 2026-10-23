package com.resultpoint.modules.student.dto;

import com.resultpoint.modules.student.domain.FeasibilityStatus;
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
public class StudentGoalDto {
    private String id;
    private String studentProfileId;
    private BigDecimal targetCgpa;
    private int targetSemester;
    private BigDecimal requiredSgpa;
    private FeasibilityStatus feasibilityStatus;
    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
