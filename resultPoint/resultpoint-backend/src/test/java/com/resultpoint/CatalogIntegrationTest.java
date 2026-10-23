package com.resultpoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.modules.catalog.dto.CreateCourseRequest;
import com.resultpoint.modules.catalog.dto.CreateUniversityRequest;
import com.resultpoint.modules.catalog.entity.CourseLevel;
import com.resultpoint.security.UserPrincipal;
import com.resultpoint.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
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
@DisplayName("Academic Catalog REST API Integration Tests")
public class CatalogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private com.resultpoint.modules.catalog.repository.UniversityRepository universityRepository;

    private static final List<String> BASELINE_UNI_IDS = List.of("uni_ou", "uni_jntuh", "uni_anna", "uni_vtu");

    private String adminToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        cleanupTestUniversities();

        UserPrincipal admin = UserPrincipal.create("usr_admin_cat", "admin.cat@resultpoint.edu", "ADMIN");
        adminToken = tokenProvider.generateAccessToken(admin);

        UserPrincipal student = UserPrincipal.create("usr_student_cat", "student.cat@resultpoint.edu", "STUDENT");
        studentToken = tokenProvider.generateAccessToken(student);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        cleanupTestUniversities();
    }

    private void cleanupTestUniversities() {
        universityRepository.findAll().stream()
                .filter(u -> !BASELINE_UNI_IDS.contains(u.getId()))
                .forEach(u -> universityRepository.deleteById(u.getId()));
    }

    @Test
    @DisplayName("Public GET /api/v1/catalog/universities - Lists seeded universities")
    void shouldListUniversitiesPublicly() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/universities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(4))))
                .andExpect(jsonPath("$.data.content[?(@.id == 'uni_ou')].name").value(hasItem("Osmania University")));
    }

    @Test
    @DisplayName("Public GET /api/v1/catalog/universities/uni_ou - Retrieves university details and courses")
    void shouldGetUniversityDetail() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/universities/uni_ou"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.university.shortName").value("OU"))
                .andExpect(jsonPath("$.data.courses", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.data.courses[?(@.shortName == 'BCA')].level").value(hasItem("UG")));
    }

    @Test
    @DisplayName("Public GET /api/v1/catalog/courses - Lists courses with pagination")
    void shouldListCourses() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(4))));
    }

    @Test
    @DisplayName("Public GET /api/v1/catalog/courses/course_ou_bca - Retrieves course details and regulations")
    void shouldGetCourseDetail() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/courses/course_ou_bca"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.course.shortName").value("BCA"))
                .andExpect(jsonPath("$.data.course.level").value("UG"))
                .andExpect(jsonPath("$.data.regulations", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.regulations[0].code").value("OU-BCA-CBCS"));
    }

    @Test
    @DisplayName("Public GET /api/v1/catalog/regulations/reg_ou_bca_cbcs - Retrieves regulation, grading scale, and rule")
    void shouldGetRegulationDetail() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/regulations/reg_ou_bca_cbcs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.regulation.code").value("OU-BCA-CBCS"))
                .andExpect(jsonPath("$.data.gradingScale.id").value("scale_ou_cbcs_s"))
                .andExpect(jsonPath("$.data.gradingScale.boundaries", hasSize(7)))
                .andExpect(jsonPath("$.data.calculationRule.percentageFormulaExpression").value("CGPA * 10"));
    }

    @Test
    @DisplayName("GET /api/v1/catalog/universities/invalid_id returns 404 NOT_FOUND")
    void shouldReturn404ForNonexistentUniversity() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/universities/uni_nonexistent_999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("Security: Unauthenticated POST /api/v1/catalog/universities returns 401 UNAUTHORIZED")
    void shouldRejectUnauthenticatedMutation() throws Exception {
        CreateUniversityRequest req = CreateUniversityRequest.builder()
                .name("Unauthorized University")
                .shortName("UNAUTH")
                .city("Hyderabad")
                .state("Telangana")
                .type("Private")
                .build();

        mockMvc.perform(post("/api/v1/catalog/universities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Security: Student role POST /api/v1/catalog/universities returns 403 FORBIDDEN")
    void shouldRejectStudentRoleOnAdministrativeEndpoint() throws Exception {
        CreateUniversityRequest req = CreateUniversityRequest.builder()
                .name("Student Attempt University")
                .shortName("STU_UNI")
                .city("Hyderabad")
                .state("Telangana")
                .type("Private")
                .build();

        mockMvc.perform(post("/api/v1/catalog/universities")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Admin role POST /api/v1/catalog/universities successfully creates university")
    void shouldAllowAdminToCreateUniversity() throws Exception {
        String uniqueShort = "TESTU_" + System.currentTimeMillis() % 10000;
        CreateUniversityRequest req = CreateUniversityRequest.builder()
                .name("Test Administrative University " + uniqueShort)
                .shortName(uniqueShort)
                .city("Hyderabad")
                .state("Telangana")
                .type("State University")
                .build();

        mockMvc.perform(post("/api/v1/catalog/universities")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shortName").value(uniqueShort));
    }

    @Test
    @DisplayName("Admin POST /api/v1/catalog/courses validates semester = duration * 2")
    void shouldValidateCourseSemestersAndDuration() throws Exception {
        CreateCourseRequest req = CreateCourseRequest.builder()
                .universityId("uni_ou")
                .name("Mismatched Semesters Course")
                .shortName("MISMATCH")
                .level(CourseLevel.UG)
                .durationYears(4)
                .totalSemesters(6) // Should be 8 (4 * 2)
                .totalDegreeCredits(new BigDecimal("160.0"))
                .build();

        mockMvc.perform(post("/api/v1/catalog/courses")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"));
    }
}
