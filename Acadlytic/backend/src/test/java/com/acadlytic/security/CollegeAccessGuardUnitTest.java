package com.acadlytic.security;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeAccessGuardUnitTest {

    @Mock
    private SecurityContextService securityContextService;
    @Mock
    private CollegeRepository collegeRepository;

    private CollegeAccessGuard guard;

    @BeforeEach
    void setUp() {
        guard = new CollegeAccessGuard(securityContextService, collegeRepository);
    }

    @Test
    void requireSuperAdminRejectsCollegeAdmin() {
        when(securityContextService.requireCurrentPrincipal())
                .thenReturn(new AcadlyticUserPrincipal(2L, "admin@college.edu", Role.COLLEGE_ADMIN, 10L));

        assertThatThrownBy(() -> guard.requireSuperAdmin())
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getErrorCode()).isEqualTo("ACCESS_DENIED");
                });
    }

    @Test
    void requireSameTenantBlocksCrossTenantAccess() {
        when(securityContextService.requireCurrentPrincipal())
                .thenReturn(new AcadlyticUserPrincipal(2L, "adminA@college.edu", Role.COLLEGE_ADMIN, 10L));

        assertThatThrownBy(() -> guard.requireSameTenant(20L))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("ACCESS_DENIED");
    }

    @Test
    void requireApprovedAndActiveCollegeRejectsPendingCollegeWith403CollegeNotApproved() {
        when(securityContextService.requireCurrentPrincipal())
                .thenReturn(new AcadlyticUserPrincipal(2L, "adminA@college.edu", Role.COLLEGE_ADMIN, 10L));

        College pending = new College();
        pending.setId(10L);
        pending.setApprovalStatus(CollegeApprovalStatus.PENDING);
        pending.setStatus(CollegeStatus.PENDING_VERIFICATION);
        when(collegeRepository.findById(10L)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> guard.requireApprovedAndActiveCollege(10L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getErrorCode()).isEqualTo("COLLEGE_NOT_APPROVED");
                });
    }

    @Test
    void requireApprovedAndActiveCollegeRejectsSuspendedCollegeWith403CollegeSuspended() {
        when(securityContextService.requireCurrentPrincipal())
                .thenReturn(new AcadlyticUserPrincipal(2L, "adminA@college.edu", Role.COLLEGE_ADMIN, 10L));

        College suspended = new College();
        suspended.setId(10L);
        suspended.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        suspended.setStatus(CollegeStatus.SUSPENDED);
        when(collegeRepository.findById(10L)).thenReturn(Optional.of(suspended));

        assertThatThrownBy(() -> guard.requireApprovedAndActiveCollege(10L))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("COLLEGE_SUSPENDED");
    }

    @Test
    void requireApprovedAndActiveCollegeAllowsApprovedActiveTenant() {
        when(securityContextService.requireCurrentPrincipal())
                .thenReturn(new AcadlyticUserPrincipal(2L, "adminA@college.edu", Role.COLLEGE_ADMIN, 10L));

        College approved = new College();
        approved.setId(10L);
        approved.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        approved.setStatus(CollegeStatus.ACTIVE);
        when(collegeRepository.findById(10L)).thenReturn(Optional.of(approved));

        assertThatCode(() -> guard.requireApprovedAndActiveCollege(10L)).doesNotThrowAnyException();
    }
}
