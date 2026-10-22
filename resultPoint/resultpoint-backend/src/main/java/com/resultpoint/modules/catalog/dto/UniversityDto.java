package com.resultpoint.modules.catalog.dto;

import com.resultpoint.modules.catalog.entity.UniversityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniversityDto {
    private String id;
    private String name;
    private String shortName;
    private String city;
    private String state;
    private String type;
    private String website;
    private String accreditation;
    private Integer establishedYear;
    private UniversityStatus status;
    private int coursesCount;
}
