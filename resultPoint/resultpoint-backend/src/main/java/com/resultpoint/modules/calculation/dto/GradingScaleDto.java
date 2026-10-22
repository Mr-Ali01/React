package com.resultpoint.modules.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingScaleDto {
    private String id;
    private String name;
    private String scaleType;
    private String description;
    private List<GradeBoundaryDto> boundaries;
}
