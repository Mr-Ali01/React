package com.resultpoint.modules.catalog.dto;

import com.resultpoint.modules.catalog.entity.SubjectType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumSubjectDto {
    private Long id;
    private String subjectId;
    private String subjectCode;
    private String subjectName;
    private int semesterNumber;
    private BigDecimal credits;
    private SubjectType type;
    private boolean isElective;
    private int displayOrder;
}
