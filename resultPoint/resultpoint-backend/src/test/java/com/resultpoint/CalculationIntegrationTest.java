package com.resultpoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.modules.calculation.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Calculation Engine REST API Integration Tests")
public class CalculationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Public POST /api/v1/calculate/sgpa - OU BCA CBCS: 88 marks resolves to Grade S (10 GP)")
    void shouldCalculateSgpaWithOuBcaSGrade() throws Exception {
        SgpaCalculationRequest request = SgpaCalculationRequest.builder()
                .regulationId("reg_ou_bca_cbcs")
                .subjects(List.of(
                        SubjectGradeInput.builder()
                                .subjectCode("BCA101")
                                .subjectName("Programming in C")
                                .credits(new BigDecimal("4.0"))
                                .marksObtained(new BigDecimal("88.0"))
                                .maxMarks(new BigDecimal("100.0"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/calculate/sgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sgpa").value(10.00))
                .andExpect(jsonPath("$.data.subjectResults[0].letterGrade").value("S"))
                .andExpect(jsonPath("$.data.subjectResults[0].gradePoints").value(10.00))
                .andExpect(jsonPath("$.data.subjectResults[0].qualitativeDesc").value("Super"))
                .andExpect(jsonPath("$.data.isAllPassed").value(true));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/sgpa - OU MCA CBCS: 92 marks resolves to Grade S (10 GP)")
    void shouldCalculateSgpaWithOuMcaSGrade() throws Exception {
        SgpaCalculationRequest request = SgpaCalculationRequest.builder()
                .regulationId("reg_ou_mca_cbcs")
                .subjects(List.of(
                        SubjectGradeInput.builder()
                                .subjectCode("MCA101")
                                .subjectName("Advanced Java Programming")
                                .credits(new BigDecimal("4.0"))
                                .marksObtained(new BigDecimal("92.0"))
                                .maxMarks(new BigDecimal("100.0"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/calculate/sgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sgpa").value(10.00))
                .andExpect(jsonPath("$.data.subjectResults[0].letterGrade").value("S"))
                .andExpect(jsonPath("$.data.subjectResults[0].gradePoints").value(10.00))
                .andExpect(jsonPath("$.data.subjectResults[0].qualitativeDesc").value("Super"))
                .andExpect(jsonPath("$.data.isAllPassed").value(true));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/sgpa - JNTUH R18: 88 marks resolves to Grade A+ (9 GP)")
    void shouldCalculateSgpaWithJntuhAPlusGrade() throws Exception {
        SgpaCalculationRequest request = SgpaCalculationRequest.builder()
                .regulationId("reg_jntuh_r18")
                .subjects(List.of(
                        SubjectGradeInput.builder()
                                .subjectCode("CS101")
                                .subjectName("Data Structures")
                                .credits(new BigDecimal("4.0"))
                                .marksObtained(new BigDecimal("88.0"))
                                .maxMarks(new BigDecimal("100.0"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/calculate/sgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sgpa").value(9.00))
                .andExpect(jsonPath("$.data.subjectResults[0].letterGrade").value("A+"))
                .andExpect(jsonPath("$.data.subjectResults[0].gradePoints").value(9.00))
                .andExpect(jsonPath("$.data.subjectResults[0].qualitativeDesc").value("Excellent"));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/sgpa - OU B.Com returns explicit UNDER_REVIEW verification status")
    void shouldReturnUnderReviewStatusForOuBcom() throws Exception {
        SgpaCalculationRequest request = SgpaCalculationRequest.builder()
                .regulationId("reg_ou_bcom_cbcs")
                .subjects(List.of(
                        SubjectGradeInput.builder()
                                .subjectCode("BC101")
                                .subjectName("Financial Accounting")
                                .credits(new BigDecimal("4.0"))
                                .letterGrade("A")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/calculate/sgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.verificationStatus").value("UNDER_REVIEW"));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/cgpa - Aggregates semester SGPAs with credit weights")
    void shouldCalculateCgpaAcrossSemesters() throws Exception {
        CgpaCalculationRequest request = CgpaCalculationRequest.builder()
                .regulationId("reg_ou_bca_cbcs")
                .semesters(List.of(
                        SemesterSgpaInput.builder().semesterNumber(1).credits(new BigDecimal("20.0")).sgpa(new BigDecimal("8.00")).build(),
                        SemesterSgpaInput.builder().semesterNumber(2).credits(new BigDecimal("20.0")).sgpa(new BigDecimal("9.00")).build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/calculate/cgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cgpa").value(8.50))
                .andExpect(jsonPath("$.data.equivalentPercentage").value(85.00))
                .andExpect(jsonPath("$.data.totalCredits").value(40.00))
                .andExpect(jsonPath("$.data.classification").value("First Division with Distinction"));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/percentage - Regulation-specific conversions")
    void shouldConvertCgpaToPercentageByRegulation() throws Exception {
        // OU Rule: CGPA * 10 -> 8.5 * 10 = 85.00%
        PercentageCalculationRequest ouReq = PercentageCalculationRequest.builder()
                .regulationId("reg_ou_bca_cbcs")
                .cgpa(new BigDecimal("8.50"))
                .build();

        mockMvc.perform(post("/api/v1/calculate/percentage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ouReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.percentage").value(85.00))
                .andExpect(jsonPath("$.data.formulaExpression").value("CGPA * 10"));

        // JNTUH Rule: (CGPA - 0.5) * 10 -> (8.5 - 0.5) * 10 = 80.00%
        PercentageCalculationRequest jntuhReq = PercentageCalculationRequest.builder()
                .regulationId("reg_jntuh_r18")
                .cgpa(new BigDecimal("8.50"))
                .build();

        mockMvc.perform(post("/api/v1/calculate/percentage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jntuhReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.percentage").value(80.00))
                .andExpect(jsonPath("$.data.formulaExpression").value("(CGPA - 0.5) * 10"));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/target-cgpa - Calculates required SGPA with credit weighting")
    void shouldCalculateTargetCgpa() throws Exception {
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("7.50"))
                .completedCredits(new BigDecimal("60.0"))
                .targetCgpa(new BigDecimal("8.00"))
                .remainingCredits(new BigDecimal("40.0"))
                .build();

        mockMvc.perform(post("/api/v1/calculate/target-cgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isAchievable").value(true))
                .andExpect(jsonPath("$.data.requiredSgpa").value(8.75))
                .andExpect(jsonPath("$.data.feasibility").value("CHALLENGING"));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/target-cgpa - Semester-based contract per api-specification.md")
    void shouldCalculateTargetCgpaSemesterBased() throws Exception {
        TargetCgpaRequest request = TargetCgpaRequest.builder()
                .currentCgpa(new BigDecimal("7.42"))
                .completedSemesters(4)
                .totalSemesters(8)
                .targetCgpa(new BigDecimal("8.50"))
                .build();

        mockMvc.perform(post("/api/v1/calculate/target-cgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isAchievable").value(true))
                .andExpect(jsonPath("$.data.requiredSgpa").value(9.58))
                .andExpect(jsonPath("$.data.remainingSemesters").value(4))
                .andExpect(jsonPath("$.data.feasibility").value("VERY_CHALLENGING"))
                .andExpect(jsonPath("$.data.recommendation").value(notNullValue()));
    }

    @Test
    @DisplayName("Public POST /api/v1/calculate/percentage - Low CGPA generates negative warning")
    void shouldGenerateWarningForLowCgpaWithOffsetFormula() throws Exception {
        // rule_standard_ugc: (CGPA - 0.75) * 10 with CGPA = 0.50 -> -2.50%
        PercentageCalculationRequest request = PercentageCalculationRequest.builder()
                .ruleCode("rule_standard_ugc")
                .cgpa(new BigDecimal("0.50"))
                .build();

        mockMvc.perform(post("/api/v1/calculate/percentage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.percentage").value(-2.50))
                .andExpect(jsonPath("$.data.warning").value(containsString("negative")));
    }

    @Test
    @DisplayName("Public GET /api/v1/calculate/scales - Lists seeded scales including OU CBCS S-Grade")
    void shouldListGradingScales() throws Exception {
        mockMvc.perform(get("/api/v1/calculate/scales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data[?(@.id == 'scale_ou_cbcs_s')].name").value(hasItem("Osmania University CBCS 10-Point (S-Grade)")));
    }

    @Test
    @DisplayName("Public GET /api/v1/calculate/rules - Lists seeded calculation rules")
    void shouldListCalculationRules() throws Exception {
        mockMvc.perform(get("/api/v1/calculate/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(3))));
    }

    @Test
    @DisplayName("POST /api/v1/calculate/sgpa with invalid credits returns 400 Bad Request")
    void shouldReturn400ForInvalidCredits() throws Exception {
        SgpaCalculationRequest request = SgpaCalculationRequest.builder()
                .subjects(List.of(
                        SubjectGradeInput.builder()
                                .credits(new BigDecimal("0.1")) // Below min 0.5
                                .letterGrade("A")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/calculate/sgpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }
}
