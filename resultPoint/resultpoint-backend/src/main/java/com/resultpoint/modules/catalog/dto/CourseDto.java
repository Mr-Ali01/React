package com.resultpoint.modules.catalog.dto;

import com.resultpoint.modules.catalog.entity.CourseLevel;
import com.resultpoint.modules.catalog.entity.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDto {
    private String id;
    private String universityId;
    private String universityName;
    private String name;
    private String shortName;
    private CourseLevel level;
    private int durationYears;
    private int totalSemesters;
    private BigDecimal totalDegreeCredits;
    private CourseStatus status;
    private int regulationsCount;
}
