package com.resultpoint;

import com.resultpoint.security.UserPrincipal;
import com.resultpoint.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityFoundationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Test
    void testPublicAllowlistEndpointsAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/calculate/test-calc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Public calculator response"))
                .andExpect(jsonPath("$.error").doesNotExist());

        mockMvc.perform(get("/api/v1/settings/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Public settings response"));
    }

    @Test
    void testUnauthenticatedRequestToProtectedEndpointReturns401Json() throws Exception {
        mockMvc.perform(get("/api/v1/student/test-profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.status").value(401))
                .andExpect(jsonPath("$.error.message").value("Full authentication is required to access this resource."));
    }

    @Test
    void testMalformedOrTamperedJwtReturns401Json() throws Exception {
        mockMvc.perform(get("/api/v1/student/test-profile")
                        .header("Authorization", "Bearer invalid.malformed.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void testValidStudentJwtPermitsAccessToProtectedStudentEndpoint() throws Exception {
        UserPrincipal student = UserPrincipal.create("usr_student_01", "student@resultpoint.edu", "STUDENT");
        String token = tokenProvider.generateAccessToken(student);

        mockMvc.perform(get("/api/v1/student/test-profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Protected student profile data"));
    }

    @Test
    void testStudentRoleAccessToAdminEndpointReturns403Json() throws Exception {
        UserPrincipal student = UserPrincipal.create("usr_student_01", "student@resultpoint.edu", "STUDENT");
        String token = tokenProvider.generateAccessToken(student);

        mockMvc.perform(get("/api/v1/admin/test-audit")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"))
                .andExpect(jsonPath("$.error.status").value(403));
    }

    @Test
    void testAdminRolePermittedOnAdminEndpoint() throws Exception {
        UserPrincipal admin = UserPrincipal.create("usr_admin_01", "admin@resultpoint.edu", "ADMIN");
        String token = tokenProvider.generateAccessToken(admin);

        mockMvc.perform(get("/api/v1/admin/test-audit")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Protected admin audit data"));
    }

    @Test
    void testGlobalExceptionHandlerTranslatesApiException() throws Exception {
        UserPrincipal student = UserPrincipal.create("usr_student_01", "student@resultpoint.edu", "STUDENT");
        String token = tokenProvider.generateAccessToken(student);

        mockMvc.perform(get("/api/v1/test/custom-error")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CUSTOM_TEST_CODE"))
                .andExpect(jsonPath("$.error.status").value(400))
                .andExpect(jsonPath("$.error.message").value("Sample domain error"));
    }

    @Test
    void testCorsAllowedOriginReceivedOnPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/calculate/test-calc")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void testCorsUntrustedOriginNotAllowed() throws Exception {
        mockMvc.perform(options("/api/v1/calculate/test-calc")
                        .header("Origin", "http://malicious-website.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
