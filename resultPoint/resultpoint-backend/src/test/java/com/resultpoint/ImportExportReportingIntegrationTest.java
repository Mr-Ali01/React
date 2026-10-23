package com.resultpoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.modules.auth.dto.AuthResponse;
import com.resultpoint.modules.auth.dto.RegisterRequest;
import com.resultpoint.modules.auth.repository.PasswordResetTokenRepository;
import com.resultpoint.modules.auth.repository.UserRefreshTokenRepository;
import com.resultpoint.modules.auth.service.AuthService;
import com.resultpoint.modules.catalog.entity.RegulationVerificationStatus;
import com.resultpoint.modules.catalog.entity.SubjectType;
import com.resultpoint.modules.catalog.repository.SubjectRepository;
import com.resultpoint.modules.dataimport.dto.ImportRegulationsRequest;
import com.resultpoint.modules.dataimport.dto.ImportSubjectsRequest;
import com.resultpoint.modules.dataimport.dto.RegulationImportItem;
import com.resultpoint.modules.dataimport.dto.SubjectImportItem;
import com.resultpoint.modules.student.domain.Gender;
import com.resultpoint.modules.student.dto.CreateGoalRequest;
import com.resultpoint.modules.student.dto.SaveSemesterResultRequest;
import com.resultpoint.modules.student.dto.SubjectResultInputDto;
import com.resultpoint.modules.student.dto.UpdateStudentProfileRequest;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import com.resultpoint.modules.user.repository.UserRepository;
import com.resultpoint.security.UserPrincipal;
import com.resultpoint.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Phase 2.5: External Data Import, PDF Generation & Reporting Engine Tests")
public class ImportExportReportingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private UserRefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private SubjectRepository subjectRepository;

    private static final String TEST_USER_EMAIL = "export_reporting_student@resultpoint.edu";
    private static final String PASSWORD = "SecurePassword123!";

    private String adminToken;
    private String studentToken;

    @BeforeEach
    void setUp() throws Exception {
        cleanUp(TEST_USER_EMAIL);

        // Create Admin Token
        UserPrincipal admin = UserPrincipal.create("usr_admin_import_test", "admin.import@resultpoint.edu", "ADMIN");
        adminToken = tokenProvider.generateAccessToken(admin);

        // Register Student User
        AuthResponse studentAuth = authService.register(
                RegisterRequest.builder()
                        .email(TEST_USER_EMAIL)
                        .password(PASSWORD)
                        .fullName("Report Student")
                        .build(),
                "127.0.0.1",
                "JUnit-Test-Agent"
        );
        studentToken = studentAuth.getAccessToken();

        // Create Student Profile under OU BCA CBCS
        UpdateStudentProfileRequest profileReq = UpdateStudentProfileRequest.builder()
                .universityId("uni_ou")
                .courseId("course_ou_bca")
                .regulationId("reg_ou_bca_cbcs")
                .batchYear("2023-2026")
                .hallTicketNumber("1001-23-733-001")
                .institutionName("University College of Science, OU")
                .currentSemester(2)
                .dateOfBirth(LocalDate.of(2003, 5, 15))
                .gender(Gender.MALE)
                .build();

        mockMvc.perform(put("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isOk());

        // Create Semester 1 Result with OU S-grade subject & a failing subject (generating backlog)
        SaveSemesterResultRequest sem1Req = SaveSemesterResultRequest.builder()
                .semesterNumber(1)
                .academicPeriod("Nov/Dec 2023")
                .subjects(List.of(
                        SubjectResultInputDto.builder()
                                .subjectCode("BCA101")
                                .subjectName("Programming in C")
                                .credits(new BigDecimal("4.0"))
                                .internalMarks(new BigDecimal("28.00"))
                                .externalMarks(new BigDecimal("60.00"))
                                .build(),
                        SubjectResultInputDto.builder()
                                .subjectCode("BCA102")
                                .subjectName("Discrete Mathematics")
                                .credits(new BigDecimal("4.0"))
                                .internalMarks(new BigDecimal("22.00"))
                                .externalMarks(new BigDecimal("50.00"))
                                .build(),
                        SubjectResultInputDto.builder()
                                .subjectCode("BCA103")
                                .subjectName("Digital Logic")
                                .credits(new BigDecimal("2.0"))
                                .internalMarks(new BigDecimal("12.00"))
                                .externalMarks(new BigDecimal("20.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/student/results")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sem1Req)))
                .andExpect(status().isCreated());

        // Create Academic Target Goal
        CreateGoalRequest goalRequest = CreateGoalRequest.builder()
                .targetCgpa(new BigDecimal("8.00"))
                .targetSemester(6)
                .build();

        mockMvc.perform(post("/api/v1/student/goals")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goalRequest)))
                .andExpect(status().isCreated());
    }

    @AfterEach
    void tearDown() {
        cleanUp(TEST_USER_EMAIL);
    }

    private void cleanUp(String email) {
        userRepository.findByEmail(email).ifPresent(u -> {
            passwordResetTokenRepository.invalidateAllActiveByUserId(u.getId());
            refreshTokenRepository.revokeAllActiveByUserId(u.getId(), Instant.now(), "CLEANUP");
            studentProfileRepository.findByUserId(u.getId()).ifPresent(studentProfileRepository::delete);
            userRepository.delete(u);
        });
    }

    // =========================================================================
    // SECTION 1: EXTERNAL DATA IMPORT TESTS (Phase 2.5A)
    // =========================================================================

    @Test
    @DisplayName("Admin can batch import subjects via JSON")
    void testBatchImportSubjects_ValidJson_AdminAuthorized() throws Exception {
        ImportSubjectsRequest request = ImportSubjectsRequest.builder()
                .regulationId("reg_ou_bca_cbcs")
                .semesterNumber(3)
                .subjects(List.of(
                        SubjectImportItem.builder()
                                .subjectCode("BCA301-TEST")
                                .subjectName("Software Engineering Methodologies")
                                .credits(new BigDecimal("4.00"))
                                .subjectType(SubjectType.THEORY)
                                .build(),
                        SubjectImportItem.builder()
                                .subjectCode("BCA302-TEST")
                                .subjectName("Software Engineering Lab")
                                .credits(new BigDecimal("2.00"))
                                .subjectType(SubjectType.PRACTICAL)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/catalog/import/subjects")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRecords").value(2))
                .andExpect(jsonPath("$.data.acceptedCount").value(2))
                .andExpect(jsonPath("$.data.rejectedCount").value(0))
                .andExpect(jsonPath("$.data.errors").isEmpty());

        assertTrue(subjectRepository.existsByCode("BCA301-TEST"));
        assertTrue(subjectRepository.existsByCode("BCA302-TEST"));
    }

    @Test
    @DisplayName("Admin can batch import subjects via CSV upload")
    void testBatchImportSubjects_ValidCsv_AdminAuthorized() throws Exception {
        String csvContent = "subject_code,subject_name,credits,subject_type\n" +
                "BCA303-CSV,Database Management Systems,4.0,THEORY\n" +
                "BCA304-CSV,DBMS Lab,2.0,PRACTICAL\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "subjects_import.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/api/v1/catalog/import/subjects/csv")
                        .file(csvFile)
                        .param("regulationId", "reg_ou_bca_cbcs")
                        .param("semesterNumber", "3")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRecords").value(2))
                .andExpect(jsonPath("$.data.acceptedCount").value(2))
                .andExpect(jsonPath("$.data.rejectedCount").value(0));

        assertTrue(subjectRepository.existsByCode("BCA303-CSV"));
        assertTrue(subjectRepository.existsByCode("BCA304-CSV"));
    }

    @Test
    @DisplayName("Importing malformed CSV safely isolates failures and reports diagnostics")
    void testBatchImportSubjects_MalformedCsv_ReportsErrors() throws Exception {
        String csvContent = "subject_code,subject_name,credits,subject_type\n" +
                ",Missing Code Subject,4.0,THEORY\n" +
                "BCA305-VALID,Valid Subject,3.0,THEORY\n" +
                "BCA306-INVALID,Negative Credit Subject,-2.0,THEORY\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "malformed_import.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/api/v1/catalog/import/subjects/csv")
                        .file(csvFile)
                        .param("regulationId", "reg_ou_bca_cbcs")
                        .param("semesterNumber", "3")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRecords").value(3))
                .andExpect(jsonPath("$.data.acceptedCount").value(1))
                .andExpect(jsonPath("$.data.rejectedCount").value(2))
                .andExpect(jsonPath("$.data.errors", hasSize(2)));

        assertTrue(subjectRepository.existsByCode("BCA305-VALID"));
    }

    @Test
    @DisplayName("Importing a protected baseline regulation is strictly blocked")
    void testImportProtectedRegulation_Blocked() throws Exception {
        ImportRegulationsRequest request = ImportRegulationsRequest.builder()
                .regulations(List.of(
                        RegulationImportItem.builder()
                                .code("reg_ou_bca_cbcs")
                                .name("Malicious Overwrite of OU BCA CBCS")
                                .courseId("course_ou_bca")
                                .gradingScaleId("scale_ou_bca_cbcs")
                                .calculationRuleId("rule_ou_cbcs_standard")
                                .verificationStatus(RegulationVerificationStatus.VERIFIED)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/catalog/import/regulations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRecords").value(1))
                .andExpect(jsonPath("$.data.acceptedCount").value(0))
                .andExpect(jsonPath("$.data.rejectedCount").value(1))
                .andExpect(jsonPath("$.data.errors[0].reason").value(containsString("protected official baseline regulation")));
    }

    @Test
    @DisplayName("Non-admin user cannot access catalog import APIs (403 Forbidden)")
    void testCatalogImport_NonAdmin_Forbidden() throws Exception {
        ImportSubjectsRequest request = ImportSubjectsRequest.builder()
                .regulationId("reg_ou_bca_cbcs")
                .semesterNumber(3)
                .subjects(List.of(
                        SubjectImportItem.builder()
                                .subjectCode("UNAUTH-001")
                                .subjectName("Unauthorized Subject")
                                .credits(new BigDecimal("3.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/catalog/import/subjects")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // SECTION 2: PDF GENERATION & EXPORT TESTS (Phase 2.5B)
    // =========================================================================

    @Test
    @DisplayName("Student can download Semester Scorecard PDF with valid %PDF- magic bytes")
    void testDownloadSemesterScorecardPdf_Success() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/student/results/1/pdf")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();

        assertEquals("application/pdf", result.getResponse().getContentType());
        assertTrue(result.getResponse().getHeader("Content-Disposition").contains("semester-1-scorecard.pdf"));

        byte[] pdfBytes = result.getResponse().getContentAsByteArray();
        assertTrue(pdfBytes.length > 500, "PDF size must be substantial");

        // Verify PDF magic bytes: %PDF-
        String pdfHeader = new String(pdfBytes, 0, 5);
        assertEquals("%PDF-", pdfHeader, "Exported binary must begin with standard PDF signature");
    }

    @Test
    @DisplayName("Student can download consolidated Academic Transcript PDF")
    void testDownloadAcademicTranscriptPdf_Success() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/student/results/history/pdf")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();

        assertEquals("application/pdf", result.getResponse().getContentType());
        assertTrue(result.getResponse().getHeader("Content-Disposition").contains("academic-transcript.pdf"));

        byte[] pdfBytes = result.getResponse().getContentAsByteArray();
        assertTrue(pdfBytes.length > 500);
        assertEquals("%PDF-", new String(pdfBytes, 0, 5));
    }

    @Test
    @DisplayName("Student can download Academic Goals & Progress PDF")
    void testDownloadGoalsReportPdf_Success() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/student/goals/report/pdf")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();

        assertEquals("application/pdf", result.getResponse().getContentType());
        assertTrue(result.getResponse().getHeader("Content-Disposition").contains("academic-goals-progress.pdf"));

        byte[] pdfBytes = result.getResponse().getContentAsByteArray();
        assertTrue(pdfBytes.length > 500);
        assertEquals("%PDF-", new String(pdfBytes, 0, 5));
    }

    @Test
    @DisplayName("Unauthenticated request to download PDF is rejected with 401")
    void testDownloadPdf_Unauthenticated_Rejected() throws Exception {
        mockMvc.perform(get("/api/v1/student/results/1/pdf"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // SECTION 3: ACADEMIC REPORTING ENGINE TESTS (Phase 2.5C)
    // =========================================================================

    @Test
    @DisplayName("Student can retrieve Academic Performance Report with semester trends")
    void testGetPerformanceReport_Success() throws Exception {
        mockMvc.perform(get("/api/v1/student/reports/performance")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.hallTicketNumber").value("1001-23-733-001"))
                .andExpect(jsonPath("$.data.cumulativeCgpa").value(7.20))
                .andExpect(jsonPath("$.data.totalCreditsAttempted").value(10))
                .andExpect(jsonPath("$.data.totalCreditsEarned").value(8))
                .andExpect(jsonPath("$.data.percentageVerificationStatus").value("UNVERIFIED"))
                .andExpect(jsonPath("$.data.semesterTrends", hasSize(1)))
                .andExpect(jsonPath("$.data.semesterTrends[0].semesterNumber").value(1))
                .andExpect(jsonPath("$.data.semesterTrends[0].sgpa").value(7.20))
                .andExpect(jsonPath("$.data.semesterTrends[0].subjectsPassed").value(2))
                .andExpect(jsonPath("$.data.semesterTrends[0].subjectsFailed").value(1));
    }

    @Test
    @DisplayName("Student can retrieve Backlog Risk and Clearance Report")
    void testGetBacklogReport_Success() throws Exception {
        mockMvc.perform(get("/api/v1/student/reports/backlogs")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalBacklogsRecorded").value(1))
                .andExpect(jsonPath("$.data.activeBacklogsCount").value(1))
                .andExpect(jsonPath("$.data.clearedBacklogsCount").value(0))
                .andExpect(jsonPath("$.data.creditsAtRisk").value(2))
                .andExpect(jsonPath("$.data.backlogs[0].subjectCode").value("BCA103"));
    }

    @Test
    @DisplayName("Student can retrieve Target CGPA Projections Report")
    void testGetProjectionReport_Success() throws Exception {
        mockMvc.perform(get("/api/v1/student/reports/projections")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.currentCgpa").value(7.20))
                .andExpect(jsonPath("$.data.remainingSemesters").value(5))
                .andExpect(jsonPath("$.data.goalProjections", hasSize(1)))
                .andExpect(jsonPath("$.data.goalProjections[0].targetCgpa").value(8.00))
                .andExpect(jsonPath("$.data.goalProjections[0].isFeasible").value(true));
    }

    @Test
    @DisplayName("Admin can retrieve Academic Catalog Summary Report")
    void testGetCatalogSummaryReport_AdminAuthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/reports/catalog-summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUniversities", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.data.totalRegulations", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.regulations", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.data.universities", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("Student is forbidden from viewing administrative catalog summary")
    void testGetCatalogSummaryReport_StudentForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/reports/catalog-summary")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }
}
