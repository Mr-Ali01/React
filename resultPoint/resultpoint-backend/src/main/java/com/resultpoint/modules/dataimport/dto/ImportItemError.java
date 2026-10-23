package com.resultpoint.modules.dataimport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportItemError {

    private int rowNumber;
    private String recordIdentifier;
    private String reason;
}
