package com.resultpoint.modules.dataimport.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportRegulationsRequest {

    @NotEmpty(message = "At least one regulation must be provided for import")
    @Valid
    private List<RegulationImportItem> regulations;
}
