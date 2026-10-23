package com.resultpoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.modules.auth.dto.AuthResponse;
import com.resultpoint.modules.auth.dto.RegisterRequest;
import com.resultpoint.modules.auth.repository.PasswordResetTokenRepository;
import com.resultpoint.modules.auth.repository.UserRefreshTokenRepository;
import com.resultpoint.modules.auth.service.AuthService;
import com.resultpoint.modules.student.domain.CategoryGroup;
import com.resultpoint.modules.student.domain.Gender;
import com.resultpoint.modules.student.dto.*;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import com.resultpoint.modules.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
@DisplayName("Student Profile, Results, Backlogs & Goals Integration Tests")
public class StudentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    private static final String USER_A_EMAIL = "student_integration_a@resultpoint.edu";
    private static final String USER_B_EMAIL = "student_integration_b@resultpoint.edu";
    private static final String PASSWORD = "SecurePassword123!";

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        cleanUp(USER_A_EMAIL);
        cleanUp(USER_B_EMAIL);

        AuthResponse respA = authService.register(
                RegisterRequest.builder().email(USER_A_EMAIL).password(PASSWORD).fullName("Student A").build(),
                "127.0.0.1", "Test Device A");
        tokenA = respA.getAccessToken();

        AuthResponse respB = authService.register(
                RegisterRequest.builder().email(USER_B_EMAIL).password(PASSWORD).fullName("Student B").build(),
                "127.0.0.1", "Test Device B");
        tokenB = respB.getAccessToken();
    }

    @AfterEach
    void tearDown() {
        cleanUp(USER_A_EMAIL);
        cleanUp(USER_B_EMAIL);
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
    // 1. Student Profile Tests
    // =========================================================================

    @Test
    @DisplayName("Profile: Returns 404 when profile has not been created yet")
    void shouldReturn404WhenProfileDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Profile: Create/Update student profile with valid OU BCA regulation")
    void shouldCreateAndUpdateStudentProfile() throws Exception {
        UpdateStudentProfileRequest request = UpdateStudentProfileRequest.builder()
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
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.universityId").value("uni_ou"))
                .andExpect(jsonPath("$.data.courseId").value("course_ou_bca"))
                .andExpect(jsonPath("$.data.regulationId").value("reg_ou_bca_cbcs"))
                .andExpect(jsonPath("$.data.currentSemester").value(2))
                .andExpect(jsonPath("$.data.gender").value("MALE"))
                .andExpect(jsonPath("$.data.hallTicketNumber").value("1001-23-733-001"));

        // Verify GET returns profile
        mockMvc.perform(get("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.universityName").value("Osmania University"))
                .andExpect(jsonPath("$.data.courseName").value("Bachelor of Computer Applications"));
    }

    @Test
    @DisplayName("Profile: Reject invalid course/university combination")
    void shouldRejectMismatchedCourseAndUniversity() throws Exception {
        // course_jntuh_btech_cse belongs to uni_jntuh, not uni_ou
        UpdateStudentProfileRequest request = UpdateStudentProfileRequest.builder()
                .universityId("uni_ou")
                .courseId("course_jntuh_btech_cse")
                .regulationId("reg_ou_bca_cbcs")
                .batchYear("2023-2027")
                .hallTicketNumber("HT-MISMATCH-1")
                .currentSemester(1)
                .build();

        mockMvc.perform(put("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message").value(containsString("does not belong to university")));
    }

    @Test
    @DisplayName("Profile: Reject invalid regulation/course combination")
    void shouldRejectMismatchedRegulationAndCourse() throws Exception {
        // reg_jntuh_r18 belongs to course_jntuh_btech_cse, not course_ou_bca
        UpdateStudentProfileRequest request = UpdateStudentProfileRequest.builder()
                .universityId("uni_ou")
                .courseId("course_ou_bca")
                .regulationId("reg_jntuh_r18")
                .batchYear("2023-2026")
                .hallTicketNumber("HT-MISMATCH-2")
                .currentSemester(1)
                .build();

        mockMvc.perform(put("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message").value(containsString("does not belong to course")));
    }

    @Test
    @DisplayName("Profile: Reject current semester exceeding course total semesters")
    void shouldRejectSemesterExceedingCourseDuration() throws Exception {
        // BCA total semesters is 6. Requesting semester 8 must be rejected.
        UpdateStudentProfileRequest request = UpdateStudentProfileRequest.builder()
                .universityId("uni_ou")
                .courseId("course_ou_bca")
                .regulationId("reg_ou_bca_cbcs")
                .batchYear("2023-2026")
                .hallTicketNumber("HT-OVERFLOW")
                .currentSemester(8)
                .build();

        mockMvc.perform(put("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message").value(containsString("exceeds course total semesters")));
    }

    @Test
    @DisplayName("Profile Isolation: Student B cannot view Student A's profile")
    void shouldEnforceProfileIsolationBetweenStudents() throws Exception {
        // Setup profile for Student A
        createProfileForStudentA();

        // Student B has no profile yet -> must return 404
        mockMvc.perform(get("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 2. Semester Results & Calculation Engine Integration Tests
    // =========================================================================

    @Test
    @DisplayName("Results: Save semester result with calculation engine, frozen snapshots, and backlogs")
    void shouldSaveSemesterResultWithEngineCalculation() throws Exception {
        createProfileForStudentA();

        // Submit Semester 1 results for OU BCA:
        // Subject 1: BCA101 (4 cr), 88 marks -> Grade S (10.0 GP), Pass
        // Subject 2: BCA102 (4 cr), 72 marks -> Grade A (8.0 GP), Pass
        // Subject 3: BCA103 (2 cr), 32 marks -> Grade F (0.0 GP), Fail (Backlog)
        SaveSemesterResultRequest request = SaveSemesterResultRequest.builder()
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
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.semesterNumber").value(1))
                .andExpect(jsonPath("$.data.totalCredits").value(10.0))
                .andExpect(jsonPath("$.data.creditsEarned").value(8.0)) // failed subject credits excluded
                .andExpect(jsonPath("$.data.sgpa").value(7.20)) // (4*10 + 4*8 + 2*0)/10 = 72/10 = 7.20
                .andExpect(jsonPath("$.data.standingStatus").value("Arrears / Supplementary"))
                .andExpect(jsonPath("$.data.subjects", hasSize(3)))
                .andExpect(jsonPath("$.data.subjects[0].gradeLetter").value("S"))
                .andExpect(jsonPath("$.data.subjects[0].isPass").value(true))
                .andExpect(jsonPath("$.data.subjects[2].gradeLetter").value("F"))
                .andExpect(jsonPath("$.data.subjects[2].gradePoints").value(0.00))
                .andExpect(jsonPath("$.data.subjects[2].isPass").value(false));

        // Check that active backlog was automatically recorded
        mockMvc.perform(get("/api/v1/student/backlogs")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].subjectCode").value("BCA103"))
                .andExpect(jsonPath("$.data[0].status").value("ACTIVE"));

        // Check that cumulative profile was updated
        mockMvc.perform(get("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cumulativeCgpa").value(7.20))
                .andExpect(jsonPath("$.data.totalCreditsEarned").value(8.0));
    }

    @Test
    @DisplayName("Results: Reject duplicate semester result submission")
    void shouldRejectDuplicateSemesterSubmission() throws Exception {
        createProfileForStudentA();
        saveSemester1ForStudentA();

        SaveSemesterResultRequest duplicateRequest = SaveSemesterResultRequest.builder()
                .semesterNumber(1)
                .academicPeriod("Nov/Dec 2023")
                .subjects(List.of(
                        SubjectResultInputDto.builder()
                                .subjectCode("BCA101")
                                .subjectName("Programming in C")
                                .credits(new BigDecimal("4.0"))
                                .gradeLetter("S")
                                .gradePoints(new BigDecimal("10.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/student/results")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("Results: Update existing semester result and clear backlogs on pass")
    void shouldUpdateSemesterResultAndClearBacklog() throws Exception {
        createProfileForStudentA();
        saveSemester1WithBacklogForStudentA();

        // Update semester 1: Student passed BCA103 with Grade B (7.0 GP, 60 marks)
        SaveSemesterResultRequest updateRequest = SaveSemesterResultRequest.builder()
                .semesterNumber(1)
                .academicPeriod("Nov/Dec 2023 - Revaluation")
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
                                .internalMarks(new BigDecimal("20.00"))
                                .externalMarks(new BigDecimal("40.00")) // 60 total -> Grade B (7.0 GP)
                                .build()
                ))
                .build();

        mockMvc.perform(put("/api/v1/student/results/1")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.creditsEarned").value(10.0))
                .andExpect(jsonPath("$.data.standingStatus").value("First Class with Distinction"));

        // Backlog must now be CLEARED
        mockMvc.perform(get("/api/v1/student/backlogs")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status").value("CLEARED"));
    }

    @Test
    @DisplayName("Results: Delete semester result and recalculate cumulative CGPA")
    void shouldDeleteSemesterResultAndRecalculate() throws Exception {
        createProfileForStudentA();
        saveSemester1ForStudentA();

        mockMvc.perform(delete("/api/v1/student/results/1")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Result 1 is gone
        mockMvc.perform(get("/api/v1/student/results/1")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());

        // Profile cumulative CGPA reset to 0
        mockMvc.perform(get("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cumulativeCgpa").value(0.00))
                .andExpect(jsonPath("$.data.totalCreditsEarned").value(0.0));
    }

    // =========================================================================
    // 3. Academic History Tests
    // =========================================================================

    @Test
    @DisplayName("History: Retrieve academic progression history")
    void shouldRetrieveAcademicHistory() throws Exception {
        createProfileForStudentA();
        saveSemester1ForStudentA();

        mockMvc.perform(get("/api/v1/student/results/history")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.summary.totalSemestersRecorded").value(1))
                .andExpect(jsonPath("$.data.summary.cumulativeCgpa").value(10.00))
                .andExpect(jsonPath("$.data.summary.totalCreditsEarned").value(4.0))
                .andExpect(jsonPath("$.data.history", hasSize(1)))
                .andExpect(jsonPath("$.data.history[0].semesterNumber").value(1));
    }

    // =========================================================================
    // 4. Backlog Management Tests
    // =========================================================================

    @Test
    @DisplayName("Backlogs: Manual backlog clearance endpoint")
    void shouldClearBacklogManually() throws Exception {
        createProfileForStudentA();
        saveSemester1WithBacklogForStudentA();

        MvcResult result = mockMvc.perform(get("/api/v1/student/backlogs")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String backlogId = objectMapper.readTree(responseBody).get("data").get(0).get("id").asText();

        ClearBacklogRequest clearReq = ClearBacklogRequest.builder()
                .backlogId(backlogId)
                .clearedInPeriod("May/June 2024 Supply")
                .clearedGrade("B")
                .build();

        mockMvc.perform(post("/api/v1/student/backlogs/clear")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clearReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CLEARED"))
                .andExpect(jsonPath("$.data.clearedGrade").value("B"))
                .andExpect(jsonPath("$.data.clearedInPeriod").value("May/June 2024 Supply"));
    }

    // =========================================================================
    // 5. Student Goals & Target CGPA Projections
    // =========================================================================

    @Test
    @DisplayName("Goals: Create academic goal and compute feasibility via calculation engine")
    void shouldCreateAcademicGoalWithFeasibility() throws Exception {
        createProfileForStudentA();
        saveSemester1ForStudentA(); // CGPA = 10.0, Semester 1

        CreateGoalRequest goalRequest = CreateGoalRequest.builder()
                .targetCgpa(new BigDecimal("8.00"))
                .targetSemester(6)
                .build();

        mockMvc.perform(post("/api/v1/student/goals")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goalRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.targetCgpa").value(8.00))
                .andExpect(jsonPath("$.data.targetSemester").value(6))
                .andExpect(jsonPath("$.data.feasibilityStatus").value("ACHIEVABLE"));

        // Retrieve goals list
        mockMvc.perform(get("/api/v1/student/goals")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @DisplayName("Goals: Detect mathematically impossible target CGPA")
    void shouldDetectMathematicallyImpossibleGoal() throws Exception {
        createProfileForStudentA();
        saveSemester1WithBacklogForStudentA(); // CGPA = 7.20, Semester 1

        // Current CGPA = 7.20 at sem 1. Reaching target 9.00 at sem 2 requires SGPA 10.80 > 10.00
        CreateGoalRequest impossibleGoal = CreateGoalRequest.builder()
                .targetCgpa(new BigDecimal("9.00"))
                .targetSemester(2)
                .build();

        mockMvc.perform(post("/api/v1/student/goals")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(impossibleGoal)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.feasibilityStatus").value("MATHEMATICALLY_IMPOSSIBLE"));
    }

    @Test
    @DisplayName("Goals: Reject target CGPA exceeding scale maximum")
    void shouldRejectGoalExceedingMaxScale() throws Exception {
        createProfileForStudentA();

        CreateGoalRequest invalidGoal = CreateGoalRequest.builder()
                .targetCgpa(new BigDecimal("10.50"))
                .targetSemester(6)
                .build();

        MvcResult mvcResult = mockMvc.perform(post("/api/v1/student/goals")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidGoal)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message").value("Invalid request parameters provided."))
                .andReturn();

        assertTrue(mvcResult.getResponse().getContentAsString().contains("Target CGPA cannot exceed 10.0"));
    }

    @Test
    @DisplayName("Goals Isolation: Student B cannot access or delete Student A's goal")
    void shouldEnforceGoalIsolation() throws Exception {
        createProfileForStudentA();
        CreateGoalRequest goalRequest = CreateGoalRequest.builder()
                .targetCgpa(new BigDecimal("8.50"))
                .targetSemester(6)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/student/goals")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goalRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String goalId = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asText();

        // Student B attempts to delete Student A's goal -> 404
        mockMvc.perform(delete("/api/v1/student/goals/" + goalId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 6. Education Records Tests
    // =========================================================================

    @Test
    @DisplayName("Education Records: Create, list, and delete prior education qualification")
    void shouldManageEducationRecords() throws Exception {
        CreateEducationRecordRequest recordRequest = CreateEducationRecordRequest.builder()
                .type("CLASS_10")
                .level("Secondary")
                .categoryGroup(CategoryGroup.SCHOOL)
                .boardOrUniversity("Board of Secondary Education, Telangana")
                .institutionName("St. Joseph High School")
                .passingYear(2021)
                .percentage(new BigDecimal("92.50"))
                .cgpa(new BigDecimal("9.50"))
                .subjects(List.of(
                        EducationRecordSubjectDto.builder()
                                .subjectName("Mathematics")
                                .subjectCode("MTH10")
                                .marksObtained(new BigDecimal("98.00"))
                                .maxMarks(new BigDecimal("100.00"))
                                .grade("A1")
                                .build(),
                        EducationRecordSubjectDto.builder()
                                .subjectName("Science")
                                .subjectCode("SCI10")
                                .marksObtained(new BigDecimal("92.00"))
                                .maxMarks(new BigDecimal("100.00"))
                                .grade("A1")
                                .build()
                ))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/student/education-records")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recordRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.type").value("CLASS_10"))
                .andExpect(jsonPath("$.data.level").value("Secondary"))
                .andExpect(jsonPath("$.data.subjects", hasSize(2)))
                .andReturn();

        String recordId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data").get("id").asText();

        // List records for Student A
        mockMvc.perform(get("/api/v1/student/education-records")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));

        // Student B isolation check
        mockMvc.perform(delete("/api/v1/student/education-records/" + recordId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // Student A deletes own record
        mockMvc.perform(delete("/api/v1/student/education-records/" + recordId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private void createProfileForStudentA() throws Exception {
        UpdateStudentProfileRequest request = UpdateStudentProfileRequest.builder()
                .universityId("uni_ou")
                .courseId("course_ou_bca")
                .regulationId("reg_ou_bca_cbcs")
                .batchYear("2023-2026")
                .hallTicketNumber("1001-23-733-001")
                .institutionName("University College of Science, OU")
                .currentSemester(1)
                .gender(Gender.MALE)
                .build();

        mockMvc.perform(put("/api/v1/student/profile")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private void saveSemester1ForStudentA() throws Exception {
        SaveSemesterResultRequest request = SaveSemesterResultRequest.builder()
                .semesterNumber(1)
                .academicPeriod("Nov/Dec 2023")
                .subjects(List.of(
                        SubjectResultInputDto.builder()
                                .subjectCode("BCA101")
                                .subjectName("Programming in C")
                                .credits(new BigDecimal("4.0"))
                                .gradeLetter("S")
                                .gradePoints(new BigDecimal("10.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/student/results")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private void saveSemester1WithBacklogForStudentA() throws Exception {
        SaveSemesterResultRequest request = SaveSemesterResultRequest.builder()
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
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
