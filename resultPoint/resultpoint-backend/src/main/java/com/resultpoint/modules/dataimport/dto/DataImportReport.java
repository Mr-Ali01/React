package com.resultpoint.modules.dataimport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataImportReport {

    private String importType;
    private String targetEntity;
    private int totalRecords;
    private int acceptedCount;
    private int rejectedCount;
    private int skippedCount;
    private int duplicateCount;
    private String status; // SUCCESS, PARTIAL_SUCCESS, FAILED

    @Builder.Default
    private List<ImportItemError> errors = new ArrayList<>();

    @Builder.Default
    private List<String> importedIds = new ArrayList<>();

    @Builder.Default
    private Instant timestamp = Instant.now();
}
