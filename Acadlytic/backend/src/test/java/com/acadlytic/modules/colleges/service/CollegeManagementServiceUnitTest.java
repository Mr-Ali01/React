package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.colleges.dto.SuperAdminCollegeDetailResponse;
import com.acadlytic.modules.colleges.dto.UpdateCollegeProfileRequest;
import com.acadlytic.modules.colleges.dto.UpdateCollegeStatusRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.colleges.repository.CollegeSpecifications;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.security.ClientIpResolver;
import com.acadlytic.security.CollegeAccessGuard;
import com.acadlytic.security.SecurityContextService;
import com.acadlytic.security.SessionRevocationService;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeManagementServiceUnitTest {

    @Mock
    private CollegeRepository collegeRepository;
    @Mock
    private CollegeRegistrationRepository registrationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditEventService auditEventService;
    @Mock
    private OutboxEmailService outboxEmailService;
    @Mock
    private SessionRevocationService sessionRevocationService;
    @Mock
    private SecurityContextService securityContextService;
    @Mock
    private CollegeAccessGuard collegeAccessGuard;
    @Mock
    private ClientIpResolver clientIpResolver;
    @Mock
    private HttpServletRequest httpRequest;

    private CollegeManagementService service;

    @BeforeEach
    void setUp() {
        service = new CollegeManagementService(
                collegeRepository,
                registrationRepository,
                userRepository,
                auditEventService,
                outboxEmailService,
                sessionRevocationService,
                securityContextService,
                collegeAccessGuard,
                clientIpResolver
        );
    }

    @Test
    @DisplayName("Unit 1: Wildcard escaping correctly escapes %, _, and \\")
    void testWildcardEscaping_SpecialCharacters() {
        assertThat(CollegeSpecifications.escapeLikePattern("test%_\\val"))
                .isEqualTo("test\\%\\_\\\\val");
        assertThat(CollegeSpecifications.escapeLikePattern(null)).isEmpty();
        assertThat(CollegeSpecifications.escapeLikePattern("")).isEmpty();
        assertThat(CollegeSpecifications.escapeLikePattern("plain text")).isEqualTo("plain text");
    }

    @Test
    @DisplayName("Unit 2: Valid and invalid state machine transitions")
    void testStateTransitions_ValidAndInvalid() {
        College college = new College();
        college.setId(1L);
        college.setCode("ABC");
        college.setName("Test College");
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        college.setStatus(CollegeStatus.ACTIVE);

        // Same status returns SAME_STATUS_NOOP (400)
        when(collegeRepository.findById(1L)).thenReturn(Optional.of(college));
        UpdateCollegeStatusRequest sameReq = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "no-op", 0L);
        assertThatThrownBy(() -> service.updateCollegeStatus(1L, sameReq, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("SAME_STATUS_NOOP");
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });

        // Target PENDING_VERIFICATION is rejected (400)
        UpdateCollegeStatusRequest pendingReq = new UpdateCollegeStatusRequest(CollegeStatus.PENDING_VERIFICATION, "invalid", 0L);
        assertThatThrownBy(() -> service.updateCollegeStatus(1L, pendingReq, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("INVALID_STATUS_TRANSITION");
                });

        // From PENDING_VERIFICATION is rejected (409)
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        UpdateCollegeStatusRequest fromPendingReq = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "invalid", 0L);
        assertThatThrownBy(() -> service.updateCollegeStatus(1L, fromPendingReq, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("COLLEGE_NOT_APPROVED");
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                });

        // Permanently rejected college returns 409 REGISTRATION_PERMANENTLY_REJECTED
        college.setStatus(CollegeStatus.ACTIVE);
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        college.setPermanentlyRejected(true);
        UpdateCollegeStatusRequest permRejReq = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "invalid", 0L);
        assertThatThrownBy(() -> service.updateCollegeStatus(1L, permRejReq, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("REGISTRATION_PERMANENTLY_REJECTED");
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                });
        college.setPermanentlyRejected(false);

        // INACTIVE -> SUSPENDED is prohibited (400)
        college.setStatus(CollegeStatus.INACTIVE);
        UpdateCollegeStatusRequest inactiveToSuspReq = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "prohibited", 0L);
        assertThatThrownBy(() -> service.updateCollegeStatus(1L, inactiveToSuspReq, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("INVALID_STATUS_TRANSITION");
                });
    }

    @Test
    @DisplayName("Unit 3: Optimistic locking version mismatch throws STALE_COLLEGE_VERSION")
    void testOptimisticLockingValidation_StaleVersionThrowsConflict() {
        College college = new College();
        college.setId(1L);
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        college.setStatus(CollegeStatus.ACTIVE);

        when(collegeRepository.findById(1L)).thenReturn(Optional.of(college));

        UpdateCollegeStatusRequest req = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "compliance", 999L);
        assertThatThrownBy(() -> service.updateCollegeStatus(1L, req, httpRequest))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("STALE_COLLEGE_VERSION");
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                });
    }

    @Test
    @DisplayName("Unit 4: Optional profile fields normalize empty and whitespace strings to null")
    void testProfileBlankNormalization_EmptyToNull() {
        UpdateCollegeProfileRequest req = new UpdateCollegeProfileRequest(
                "  Stanford University  ",
                "   ",
                "  123 Main St  ",
                "   ",
                "  Palo Alto  ",
                "  CA  ",
                "  USA  ",
                "  94305  ",
                "   ",
                "   ",
                "   ",
                "   ",
                2020,
                "   ",
                0L
        );

        assertThat(req.name()).isEqualTo("Stanford University");
        assertThat(req.code()).isNull();
        assertThat(req.addressLine1()).isEqualTo("123 Main St");
        assertThat(req.addressLine2()).isNull();
        assertThat(req.city()).isEqualTo("Palo Alto");
        assertThat(req.state()).isEqualTo("CA");
        assertThat(req.country()).isEqualTo("USA");
        assertThat(req.postalCode()).isEqualTo("94305");
        assertThat(req.contactPhone()).isNull();
        assertThat(req.contactEmail()).isNull();
        assertThat(req.websiteUrl()).isNull();
        assertThat(req.affiliatedUniversityName()).isNull();
        assertThat(req.accreditationDetails()).isNull();
    }

    @Test
    @DisplayName("Unit 5: No-op profile update performs zero database mutation and zero audit events")
    void testProfileDiffAuditing_NoOp_ZeroMutation() {
        College college = new College();
        college.setId(1L);
        college.setName("Test College");
        college.setCode("TEST");
        college.setAddressLine1("123 Main St");
        college.setCity("Palo Alto");
        college.setState("CA");
        college.setCountry("USA");
        college.setPostalCode("94305");
        college.setEstablishedYear(2000);

        when(collegeRepository.findById(1L)).thenReturn(Optional.of(college));

        UpdateCollegeProfileRequest identicalReq = new UpdateCollegeProfileRequest(
                "Test College",
                "TEST",
                "123 Main St",
                null,
                "Palo Alto",
                "CA",
                "USA",
                "94305",
                null,
                null,
                null,
                null,
                2000,
                null,
                0L
        );

        SuperAdminCollegeDetailResponse res = service.updateCollegeProfile(1L, identicalReq, httpRequest);

        assertThat(res).isNotNull();
        assertThat(res.name()).isEqualTo("Test College");
        verify(collegeRepository, never()).save(any());
        verify(collegeRepository, never()).saveAndFlush(any());
        verify(auditEventService, never()).record(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Unit 6: Exact template mapping and audit events for status transitions")
    void testStatusEmailTemplateMapping_ExactKeys() {
        College college = new College();
        college.setId(1L);
        college.setName("Test College");
        college.setCode("TEST");
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        college.setStatus(CollegeStatus.ACTIVE);

        User admin = new User();
        admin.setId(10L);
        admin.setEmail("admin@test.edu");
        admin.setFirstName("Dean");
        admin.setRole(Role.COLLEGE_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);

        when(collegeRepository.findById(1L)).thenReturn(Optional.of(college));
        when(collegeRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByCollegeIdAndRoleAndStatus(1L, Role.COLLEGE_ADMIN, UserStatus.ACTIVE))
                .thenReturn(Optional.of(admin));
        when(securityContextService.requireCurrentUserId()).thenReturn(999L);
        when(clientIpResolver.resolve(any())).thenReturn("127.0.0.1");

        // 1. ACTIVE -> SUSPENDED -> template COLLEGE_SUSPENDED
        UpdateCollegeStatusRequest suspendReq = new UpdateCollegeStatusRequest(CollegeStatus.SUSPENDED, "Non-compliance", 0L);
        service.updateCollegeStatus(1L, suspendReq, httpRequest);

        ArgumentCaptor<String> templateCaptor = ArgumentCaptor.forClass(String.class);
        verify(outboxEmailService).enqueue(
                eq("COLLEGE_STATUS_CHANGED"),
                eq("admin@test.edu"),
                any(),
                templateCaptor.capture(),
                any()
        );
        assertThat(templateCaptor.getValue()).isEqualTo("COLLEGE_SUSPENDED");
        verify(sessionRevocationService).revokeAllSessionsForCollege(1L);
        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_SUSPENDED),
                eq(999L),
                eq(Role.SUPER_ADMIN),
                any(),
                eq(1L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );

        // 2. INACTIVE -> ACTIVE (reactivation) -> template COLLEGE_ACTIVATED, audit COLLEGE_REACTIVATED
        college.setStatus(CollegeStatus.INACTIVE);
        UpdateCollegeStatusRequest reactivateReq = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "Contract renewed", 0L);
        service.updateCollegeStatus(1L, reactivateReq, httpRequest);

        verify(outboxEmailService).enqueue(
                eq("COLLEGE_STATUS_CHANGED"),
                eq("admin@test.edu"),
                any(),
                eq("COLLEGE_ACTIVATED"),
                any()
        );
        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_REACTIVATED),
                eq(999L),
                eq(Role.SUPER_ADMIN),
                any(),
                eq(1L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );

        // 3. SUSPENDED -> ACTIVE (reactivation) -> template COLLEGE_ACTIVATED, audit COLLEGE_REACTIVATED
        college.setStatus(CollegeStatus.SUSPENDED);
        UpdateCollegeStatusRequest suspToActiveReq = new UpdateCollegeStatusRequest(CollegeStatus.ACTIVE, "Reinstated", 0L);
        service.updateCollegeStatus(1L, suspToActiveReq, httpRequest);

        verify(outboxEmailService, org.mockito.Mockito.times(2)).enqueue(
                eq("COLLEGE_STATUS_CHANGED"),
                eq("admin@test.edu"),
                any(),
                eq("COLLEGE_ACTIVATED"),
                any()
        );
        verify(auditEventService, org.mockito.Mockito.times(2)).record(
                eq(AuditEventType.COLLEGE_REACTIVATED),
                eq(999L),
                eq(Role.SUPER_ADMIN),
                any(),
                eq(1L),
                eq(AuditOutcome.SUCCESS),
                any(),
                any()
        );
    }
}
