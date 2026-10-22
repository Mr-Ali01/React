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
public class SubjectDto {
    private String id;
    private String code;
    private String name;
    private BigDecimal defaultCredits;
    private SubjectType defaultType;
    private String department;
    private String status;
}
