package com.resultpoint.modules.student.dto;

import com.resultpoint.modules.student.domain.BacklogStatus;
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
public class StudentBacklogDto {
    private String id;
    private String studentProfileId;
    private String subjectCode;
    private String subjectName;
    private int semesterNumber;
    private BigDecimal credits;
    private BacklogStatus status;
    private String clearedInPeriod;
    private String clearedGrade;
    private Instant clearedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
