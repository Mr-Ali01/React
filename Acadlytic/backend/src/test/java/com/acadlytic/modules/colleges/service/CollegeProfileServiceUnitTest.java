package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.dto.CollegeAdminProfileResponse;
import com.acadlytic.modules.colleges.dto.FieldPresence;
import com.acadlytic.modules.colleges.dto.UpdateOwnCollegeProfileRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.security.ClientIpResolver;
import com.acadlytic.security.CollegeAccessGuard;
import com.acadlytic.security.SecurityContextService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeProfileServiceUnitTest {

    @Mock
    private CollegeRepository collegeRepository;
    @Mock
    private CollegeAccessGuard collegeAccessGuard;
    @Mock
    private SecurityContextService securityContextService;
    @Mock
    private AuditEventService auditEventService;
    @Mock
    private ClientIpResolver clientIpResolver;
    @Mock
    private HttpServletRequest httpRequest;

    private CollegeProfileService service;
    private College testCollege;

    @BeforeEach
    void setUp() {
        service = new CollegeProfileService(
                collegeRepository,
                collegeAccessGuard,
                securityContextService,
                auditEventService,
                clientIpResolver
        );

        testCollege = new College();
        testCollege.setName("Apex Institute of Technology");
        testCollege.setCode("APEX-2026");
        testCollege.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        testCollege.setStatus(CollegeStatus.ACTIVE);
        testCollege.setAddressLine1("Plot 42, Knowledge Park III");
        testCollege.setAddressLine2("Institutional Area");
        testCollege.setCity("Greater Noida");
        testCollege.setState("Uttar Pradesh");
        testCollege.setCountry("India");
        testCollege.setPostalCode("201310");
        testCollege.setContactPhone("+91 98765 43210");
        testCollege.setContactEmail("info@apextech.edu.in");
        testCollege.setWebsiteUrl("https://apextech.edu.in");
        testCollege.setAffiliatedUniversityName("AKTU");
        testCollege.setEstablishedYear(2005);
        testCollege.setAccreditationDetails("NAAC A+");
        testCollege.setLogoStorageKey("logo-uuid-123");
    }

    @Test
    @DisplayName("01: getOwnCollegeProfile returns mapped 12 operational fields and derived hasLogo")
    void testGetOwnCollegeProfile_Success() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        CollegeAdminProfileResponse response = service.getOwnCollegeProfile();

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Apex Institute of Technology");
        assertThat(response.code()).isEqualTo("APEX-2026");
        assertThat(response.city()).isEqualTo("Greater Noida");
        assertThat(response.websiteUrl()).isEqualTo("https://apextech.edu.in");
        assertThat(response.hasLogo()).isTrue();
        assertThat(response.version()).isEqualTo(testCollege.getVersion());
    }

    @Test
    @DisplayName("02: updateOwnCollegeProfile persists permitted field mutations and records audit event")
    void testUpdateOwnCollegeProfile_Success_PermittedFields() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);
        when(collegeRepository.saveAndFlush(any(College.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(securityContextService.requireCurrentUserId()).thenReturn(42L);
        when(clientIpResolver.resolve(httpRequest)).thenReturn("192.168.1.100");

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.of("Apex Institute of Technology"),
                FieldPresence.of("APEX-2026"),
                "Plot 42, Knowledge Park III",
                "New Block B",
                "Greater Noida",
                "Uttar Pradesh",
                "India",
                "201310",
                "+91 98765 00000",
                "admissions@apextech.edu.in",
                "https://new.apextech.edu.in",
                FieldPresence.of("AKTU"),
                2006,
                FieldPresence.of("NAAC A+"),
                testCollege.getVersion()
        );

        CollegeAdminProfileResponse response = service.updateOwnCollegeProfile(request, httpRequest);

        assertThat(response.addressLine2()).isEqualTo("New Block B");
        assertThat(response.contactPhone()).isEqualTo("+91 98765 00000");
        assertThat(response.contactEmail()).isEqualTo("admissions@apextech.edu.in");
        assertThat(response.websiteUrl()).isEqualTo("https://new.apextech.edu.in");
        assertThat(response.establishedYear()).isEqualTo(2006);

        verify(collegeRepository).saveAndFlush(testCollege);

        ArgumentCaptor<Map<String, Object>> metadataCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_PROFILE_UPDATED),
                eq(42L),
                eq(Role.COLLEGE_ADMIN),
                eq(null),
                eq(testCollege.getId()),
                eq(AuditOutcome.SUCCESS),
                eq("192.168.1.100"),
                metadataCaptor.capture()
        );

        Map<String, Object> metadata = metadataCaptor.getValue();
        assertThat(metadata.get("source")).isEqualTo("SELF_SERVICE");
        @SuppressWarnings("unchecked")
        java.util.List<String> changedFields = (java.util.List<String>) metadata.get("changedFields");
        assertThat(changedFields).containsExactlyInAnyOrder(
                "addressLine2", "contactPhone", "contactEmail", "websiteUrl", "establishedYear"
        );
    }

    @Test
    @DisplayName("03: updateOwnCollegeProfile with stale version throws HTTP 409 STALE_COLLEGE_VERSION")
    void testUpdateOwnCollegeProfile_StaleVersion_ThrowsConflict() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(),
                FieldPresence.omitted(),
                "Plot 42, Knowledge Park III",
                null,
                "Greater Noida",
                "Uttar Pradesh",
                "India",
                "201310",
                null,
                null,
                null,
                FieldPresence.omitted(),
                null,
                FieldPresence.omitted(),
                999L // Mismatched version
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(appEx.getErrorCode()).isEqualTo("STALE_COLLEGE_VERSION");
                });

        verify(collegeRepository, never()).saveAndFlush(any());
        verify(auditEventService, never()).record(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("04: updateOwnCollegeProfile with modified code throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ModifiedCode_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(),
                FieldPresence.of("DIFFERENT-CODE"),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.omitted(), null, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                    assertThat(appEx.getMessage()).contains("College code is a permanent institutional identifier");
                });
    }

    @Test
    @DisplayName("05: updateOwnCollegeProfile with modified name throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ModifiedName_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.of("Different Legal College Name"),
                FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.omitted(), null, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                    assertThat(appEx.getMessage()).contains("College legal name cannot be modified self-service");
                });
    }

    @Test
    @DisplayName("06: updateOwnCollegeProfile with modified affiliated university throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ModifiedUniversity_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(),
                FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.of("Different University"), null, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                    assertThat(appEx.getMessage()).contains("Affiliated university cannot be modified self-service");
                });
    }

    @Test
    @DisplayName("07: updateOwnCollegeProfile with modified accreditation details throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ModifiedAccreditation_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(),
                FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.omitted(), null, FieldPresence.of("NAAC A++ (Forged)"),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                    assertThat(appEx.getMessage()).contains("Accreditation details cannot be modified self-service");
                });
    }

    @Test
    @DisplayName("08: updateOwnCollegeProfile no-op submission skips saveAndFlush and audit logging")
    void testUpdateOwnCollegeProfile_NoOp_SkipsSaveAndAudit() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        // Submit exact same values as persisted entity
        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.of(testCollege.getName()),
                FieldPresence.of(testCollege.getCode()),
                testCollege.getAddressLine1(),
                testCollege.getAddressLine2(),
                testCollege.getCity(),
                testCollege.getState(),
                testCollege.getCountry(),
                testCollege.getPostalCode(),
                testCollege.getContactPhone(),
                testCollege.getContactEmail(),
                testCollege.getWebsiteUrl(),
                FieldPresence.of(testCollege.getAffiliatedUniversityName()),
                testCollege.getEstablishedYear(),
                FieldPresence.of(testCollege.getAccreditationDetails()),
                testCollege.getVersion()
        );

        CollegeAdminProfileResponse response = service.updateOwnCollegeProfile(request, httpRequest);

        assertThat(response).isNotNull();
        verify(collegeRepository, never()).saveAndFlush(any());
        verify(auditEventService, never()).record(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("09: Explicit null for read-only name when persisted is non-null throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ExplicitNullName_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.of(null), // Explicit null
                FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.omitted(), null, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                });
    }

    @Test
    @DisplayName("10: Explicit null for read-only code when persisted is non-null throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ExplicitNullCode_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(),
                FieldPresence.of(null), // Explicit null
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.omitted(), null, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                });
    }

    @Test
    @DisplayName("11: Explicit null for read-only university when persisted is non-null throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ExplicitNullUniversity_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(),
                FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.of(null), null, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                });
    }

    @Test
    @DisplayName("12: Explicit null for read-only accreditation when persisted is non-null throws HTTP 400 FIELD_IMMUTABLE")
    void testUpdateOwnCollegeProfile_ExplicitNullAccreditation_ThrowsFieldImmutable() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(),
                FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.omitted(), null, FieldPresence.of(null),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("FIELD_IMMUTABLE");
                });
    }

    @Test
    @DisplayName("13: Defense-in-depth rejects malformed website URL with HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnCollegeProfile_InvalidUrl_ThrowsValidationError() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(), FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null,
                "not-a-valid-url",
                FieldPresence.omitted(), null, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("VALIDATION_ERROR");
                });
    }

    @Test
    @DisplayName("14: Defense-in-depth rejects out-of-range established year with HTTP 400 VALIDATION_ERROR")
    void testUpdateOwnCollegeProfile_InvalidYear_ThrowsValidationError() {
        when(collegeAccessGuard.requireApprovedAndActiveCurrentCollege()).thenReturn(testCollege);

        UpdateOwnCollegeProfileRequest request = new UpdateOwnCollegeProfileRequest(
                FieldPresence.omitted(), FieldPresence.omitted(),
                "Plot 42", null, "City", "State", "Country", "12345", null, null, null,
                FieldPresence.omitted(), 1750, FieldPresence.omitted(),
                testCollege.getVersion()
        );

        assertThatThrownBy(() -> service.updateOwnCollegeProfile(request, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("VALIDATION_ERROR");
                });
    }
}
