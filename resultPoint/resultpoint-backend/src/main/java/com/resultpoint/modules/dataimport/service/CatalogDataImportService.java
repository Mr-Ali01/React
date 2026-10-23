package com.resultpoint.modules.dataimport.service;

import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.calculation.entity.CalculationRule;
import com.resultpoint.modules.calculation.entity.GradingScale;
import com.resultpoint.modules.calculation.repository.CalculationRuleRepository;
import com.resultpoint.modules.calculation.repository.GradingScaleRepository;
import com.resultpoint.modules.catalog.entity.*;
import com.resultpoint.modules.catalog.repository.CourseRepository;
import com.resultpoint.modules.catalog.repository.RegulationRepository;
import com.resultpoint.modules.catalog.repository.RegulationSubjectRepository;
import com.resultpoint.modules.catalog.repository.SubjectRepository;
import com.resultpoint.modules.dataimport.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogDataImportService {

    private final RegulationRepository regulationRepository;
    private final SubjectRepository subjectRepository;
    private final RegulationSubjectRepository regulationSubjectRepository;
    private final CourseRepository courseRepository;
    private final GradingScaleRepository gradingScaleRepository;
    private final CalculationRuleRepository calculationRuleRepository;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    private static final Set<String> PROTECTED_REGULATION_IDS = Set.of(
            "reg_ou_bca_cbcs", "reg_ou_mca_cbcs", "reg_jntuh_r18"
    );

    @Transactional
    public DataImportReport importSubjectsFromJson(ImportSubjectsRequest request) {
        Regulation regulation = regulationRepository.findById(request.getRegulationId())
                .orElseThrow(() -> new ResourceNotFoundException("Regulation", "id", request.getRegulationId()));

        if (request.getSemesterNumber() > regulation.getCourse().getTotalSemesters()) {
            throw new IllegalArgumentException(String.format("Semester %d exceeds course total semesters (%d)",
                    request.getSemesterNumber(), regulation.getCourse().getTotalSemesters()));
        }

        DataImportReport report = DataImportReport.builder()
                .importType("JSON")
                .targetEntity("regulation_subjects")
                .totalRecords(request.getSubjects().size())
                .build();

        int row = 0;
        for (SubjectImportItem item : request.getSubjects()) {
            row++;
            try {
                if (item.getSubjectCode() == null || item.getSubjectCode().trim().isEmpty()) {
                    report.getErrors().add(new ImportItemError(row, "UNKNOWN", "Subject code cannot be blank"));
                    report.setRejectedCount(report.getRejectedCount() + 1);
                    continue;
                }

                if (item.getSubjectName() == null || item.getSubjectName().trim().isEmpty()) {
                    report.getErrors().add(new ImportItemError(row, item.getSubjectCode(), "Subject name cannot be blank"));
                    report.setRejectedCount(report.getRejectedCount() + 1);
                    continue;
                }

                if (item.getCredits() == null || item.getCredits().compareTo(new BigDecimal("0.5")) < 0) {
                    report.getErrors().add(new ImportItemError(row, item.getSubjectCode(), "Credits must be at least 0.5"));
                    report.setRejectedCount(report.getRejectedCount() + 1);
                    continue;
                }

                String code = item.getSubjectCode().trim().toUpperCase();

                // 1. Find or create master subject
                Subject subject = subjectRepository.findByCode(code).orElse(null);
                if (subject == null) {
                    subject = Subject.builder()
                            .id(IdGenerator.generateSubjectId())
                            .code(code)
                            .name(item.getSubjectName().trim())
                            .defaultCredits(item.getCredits())
                            .defaultType(item.getSubjectType() != null ? item.getSubjectType() : SubjectType.THEORY)
                            .department(item.getDepartment())
                            .status(SubjectStatus.ACTIVE)
                            .build();
                    subject = subjectRepository.save(subject);
                }

                // 2. Map to regulation_subjects
                Optional<RegulationSubject> existingMapping = regulationSubjectRepository
                        .findByRegulationIdAndSubjectIdAndSemesterNumber(regulation.getId(), subject.getId(), request.getSemesterNumber());

                if (existingMapping.isPresent()) {
                    RegulationSubject regSub = existingMapping.get();
                    regSub.setCreditsOverride(item.getCredits());
                    regSub.setTypeOverride(item.getSubjectType());
                    regSub.setElective(item.isElective());
                    regSub.setDisplayOrder(item.getDisplayOrder());
                    regulationSubjectRepository.save(regSub);
                    report.setDuplicateCount(report.getDuplicateCount() + 1);
                    report.setAcceptedCount(report.getAcceptedCount() + 1);
                    report.getImportedIds().add(code);
                } else {
                    RegulationSubject regSub = RegulationSubject.builder()
                            .regulation(regulation)
                            .subject(subject)
                            .semesterNumber(request.getSemesterNumber())
                            .creditsOverride(item.getCredits())
                            .typeOverride(item.getSubjectType())
                            .isElective(item.isElective())
                            .displayOrder(item.getDisplayOrder())
                            .build();
                    regulationSubjectRepository.save(regSub);
                    report.setAcceptedCount(report.getAcceptedCount() + 1);
                    report.getImportedIds().add(code);
                }

            } catch (Exception ex) {
                log.error("Failed importing subject row {}: {}", row, ex.getMessage(), ex);
                report.getErrors().add(new ImportItemError(row, item.getSubjectCode(), ex.getMessage()));
                report.setRejectedCount(report.getRejectedCount() + 1);
            }
        }

        report.setStatus(report.getRejectedCount() == 0 ? "SUCCESS"
                : (report.getAcceptedCount() > 0 ? "PARTIAL_SUCCESS" : "FAILED"));

        log.info("Subject import finished for regulation {} sem {}: {} accepted, {} duplicates, {} rejected",
                regulation.getId(), request.getSemesterNumber(), report.getAcceptedCount(), report.getDuplicateCount(), report.getRejectedCount());
        return report;
    }

    @Transactional
    public DataImportReport importSubjectsFromCsv(String regulationId, int semesterNumber, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file must not be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(String.format("File size (%d bytes) exceeds maximum allowed limit of %d bytes",
                    file.getSize(), MAX_FILE_SIZE));
        }

        List<SubjectImportItem> items = new ArrayList<>();
        List<ImportItemError> parsingErrors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                if (isHeader) {
                    isHeader = false;
                    // Check if line looks like header
                    if (line.toLowerCase().contains("code") || line.toLowerCase().contains("name")) {
                        continue;
                    }
                }

                String[] tokens = parseCsvLine(line);
                if (tokens.length < 3) {
                    parsingErrors.add(new ImportItemError(lineNumber, line, "Malformed CSV row: at least code, name, credits are required"));
                    continue;
                }

                try {
                    String code = tokens[0].trim();
                    String name = tokens[1].trim();
                    BigDecimal credits = new BigDecimal(tokens[2].trim());

                    if (code.isEmpty()) {
                        parsingErrors.add(new ImportItemError(lineNumber, line, "Subject code cannot be blank"));
                        continue;
                    }

                    if (name.isEmpty()) {
                        parsingErrors.add(new ImportItemError(lineNumber, code, "Subject name cannot be blank"));
                        continue;
                    }

                    if (credits.compareTo(new BigDecimal("0.5")) < 0) {
                        parsingErrors.add(new ImportItemError(lineNumber, code, "Credits must be at least 0.5"));
                        continue;
                    }

                    SubjectType type = SubjectType.THEORY;
                    if (tokens.length > 3 && !tokens[3].trim().isEmpty()) {
                        try {
                            type = SubjectType.valueOf(tokens[3].trim().toUpperCase());
                        } catch (IllegalArgumentException e) {
                            type = SubjectType.THEORY;
                        }
                    }

                    boolean isElective = false;
                    if (tokens.length > 4 && !tokens[4].trim().isEmpty()) {
                        isElective = Boolean.parseBoolean(tokens[4].trim());
                    }

                    int displayOrder = 0;
                    if (tokens.length > 5 && !tokens[5].trim().isEmpty()) {
                        try {
                            displayOrder = Integer.parseInt(tokens[5].trim());
                        } catch (NumberFormatException ignored) {}
                    }

                    String dept = tokens.length > 6 ? tokens[6].trim() : null;

                    items.add(SubjectImportItem.builder()
                            .subjectCode(code)
                            .subjectName(name)
                            .credits(credits)
                            .subjectType(type)
                            .isElective(isElective)
                            .displayOrder(displayOrder)
                            .department(dept)
                            .build());

                } catch (Exception ex) {
                    parsingErrors.add(new ImportItemError(lineNumber, line, "Invalid values: " + ex.getMessage()));
                }
            }

        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed reading CSV file: " + ex.getMessage(), ex);
        }

        ImportSubjectsRequest request = ImportSubjectsRequest.builder()
                .regulationId(regulationId)
                .semesterNumber(semesterNumber)
                .subjects(items)
                .build();

        DataImportReport report = importSubjectsFromJson(request);
        report.setImportType("CSV");
        report.getErrors().addAll(0, parsingErrors);
        report.setTotalRecords(report.getTotalRecords() + parsingErrors.size());
        report.setRejectedCount(report.getRejectedCount() + parsingErrors.size());

        if (report.getRejectedCount() > 0 && report.getAcceptedCount() == 0) {
            report.setStatus("FAILED");
        } else if (report.getRejectedCount() > 0) {
            report.setStatus("PARTIAL_SUCCESS");
        }

        return report;
    }

    @Transactional
    public DataImportReport importRegulationsFromJson(ImportRegulationsRequest request) {
        DataImportReport report = DataImportReport.builder()
                .importType("JSON")
                .targetEntity("regulations")
                .totalRecords(request.getRegulations().size())
                .build();

        int row = 0;
        for (RegulationImportItem item : request.getRegulations()) {
            row++;
            try {
                if (PROTECTED_REGULATION_IDS.contains(item.getCode().toLowerCase()) ||
                    PROTECTED_REGULATION_IDS.contains("reg_" + item.getCode().toLowerCase())) {
                    report.getErrors().add(new ImportItemError(row, item.getCode(), "Cannot overwrite protected official baseline regulation: " + item.getCode()));
                    report.setRejectedCount(report.getRejectedCount() + 1);
                    continue;
                }

                Course course = courseRepository.findById(item.getCourseId())
                        .orElseThrow(() -> new ResourceNotFoundException("Course", "id", item.getCourseId()));

                GradingScale gradingScale = gradingScaleRepository.findById(item.getGradingScaleId())
                        .orElseThrow(() -> new ResourceNotFoundException("GradingScale", "id", item.getGradingScaleId()));

                CalculationRule calculationRule = calculationRuleRepository.findById(item.getCalculationRuleId())
                        .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", item.getCalculationRuleId()));

                String regId = IdGenerator.generateRegulationId();
                Regulation regulation = Regulation.builder()
                        .id(regId)
                        .code(item.getCode().trim().toUpperCase())
                        .name(item.getName().trim())
                        .course(course)
                        .gradingScale(gradingScale)
                        .calculationRule(calculationRule)
                        .ruleVersion(item.getRuleVersion() != null ? item.getRuleVersion() : "1.0")
                        .verificationStatus(item.getVerificationStatus() != null ? item.getVerificationStatus() : RegulationVerificationStatus.UNDER_REVIEW)
                        .status(RegulationStatus.ACTIVE)
                        .build();

                regulationRepository.save(regulation);
                report.setAcceptedCount(report.getAcceptedCount() + 1);
                report.getImportedIds().add(regulation.getId());

            } catch (Exception ex) {
                log.error("Failed importing regulation row {}: {}", row, ex.getMessage(), ex);
                report.getErrors().add(new ImportItemError(row, item.getCode(), ex.getMessage()));
                report.setRejectedCount(report.getRejectedCount() + 1);
            }
        }

        report.setStatus(report.getRejectedCount() == 0 ? "SUCCESS"
                : (report.getAcceptedCount() > 0 ? "PARTIAL_SUCCESS" : "FAILED"));

        return report;
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());

        return tokens.toArray(new String[0]);
    }
}
