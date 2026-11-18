package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.SecurityProperties;
import com.acadlytic.modules.auth.dto.ChangePasswordRequest;
import com.acadlytic.modules.auth.dto.ForgotPasswordRequest;
import com.acadlytic.modules.auth.dto.LoginRequest;
import com.acadlytic.modules.auth.dto.ResetPasswordRequest;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuthToken;
import com.acadlytic.modules.auth.entity.AuthTokenType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.mapper.CurrentUserMapper;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.security.ClientIpResolver;
import com.acadlytic.security.SecurityContextService;
import com.acadlytic.security.SessionRevocationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceUnitTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CollegeRepository collegeRepository;
    @Mock
    private LoginAttemptService loginAttemptService;
    @Mock
    private AuthTokenService authTokenService;
    @Mock
    private AuditEventService auditEventService;
    @Mock
    private OutboxEmailService outboxEmailService;
    @Mock
    private SessionRevocationService sessionRevocationService;
    @Mock
    private SecurityContextService securityContextService;
    @Mock
    private SecurityContextRepository securityContextRepository;

    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        // Fast strength 4 in pure unit test; production bean uses BCryptPasswordEncoder(12)
        passwordEncoder = new BCryptPasswordEncoder(4);
        SecurityProperties properties = new SecurityProperties();
        authService = new AuthService(
                userRepository,
                collegeRepository,
                passwordEncoder,
                new EmailNormalizer(),
                new PasswordPolicyValidator(),
                loginAttemptService,
                authTokenService,
                auditEventService,
                outboxEmailService,
                sessionRevocationService,
                securityContextService,
                securityContextRepository,
                new CurrentUserMapper(new DefaultCollegeRegistrationStatusProvider()),
                new ClientIpResolver(),
                properties
        );
    }

    @Test
    void loginRejectsUnknownEmailWithGenericInvalidCredentials() {
        when(userRepository.findByEmailAndEmailReleasedFalse("missing@college.edu"))
                .thenReturn(Optional.empty());

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        assertThatThrownBy(() -> authService.login(new LoginRequest("  MISSING@College.EDU ", "StrongPassword!99"), req, res))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(appEx.getErrorCode()).isEqualTo("AUTH_INVALID_CREDENTIALS");
                    assertThat(appEx.getMessage()).isEqualTo("Invalid email or password.");
                });

        verify(auditEventService).recordIndependently(
                eq(AuditEventType.LOGIN_FAILURE), any(), any(), any(), any(), any(), any(), anyMap());
    }

    @Test
    void loginRejectsLockedAccountWith429() {
        User user = buildUser(1L, "admin@college.edu", Role.COLLEGE_ADMIN, 10L, UserStatus.ACTIVE, "StrongPassword!99");
        user.setLockedUntil(Instant.now().plusSeconds(600));
        when(userRepository.findByEmailAndEmailReleasedFalse("admin@college.edu")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(
                new LoginRequest("admin@college.edu", "StrongPassword!99"),
                new MockHttpServletRequest(),
                new MockHttpServletResponse()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(appEx.getErrorCode()).isEqualTo("AUTH_ACCOUNT_LOCKED");
                });
    }

    @Test
    void loginRejectsPostMvpRoles() {
        User staff = buildUser(2L, "staff@college.edu", Role.ACADEMIC_STAFF, 10L, UserStatus.ACTIVE, "StrongPassword!99");
        when(userRepository.findByEmailAndEmailReleasedFalse("staff@college.edu")).thenReturn(Optional.of(staff));

        assertThatThrownBy(() -> authService.login(
                new LoginRequest("staff@college.edu", "StrongPassword!99"),
                new MockHttpServletRequest(),
                new MockHttpServletResponse()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getErrorCode()).isEqualTo("AUTH_ROLE_NOT_SUPPORTED");
                });
    }

    @Test
    void loginRejectsSuspendedCollegeWith403CollegeSuspended() {
        User admin = buildUser(3L, "admin@college.edu", Role.COLLEGE_ADMIN, 10L, UserStatus.ACTIVE, "StrongPassword!99");
        College college = new College();
        college.setId(10L);
        college.setApprovalStatus(CollegeApprovalStatus.APPROVED);
        college.setStatus(CollegeStatus.SUSPENDED);

        when(userRepository.findByEmailAndEmailReleasedFalse("admin@college.edu")).thenReturn(Optional.of(admin));
        when(collegeRepository.findById(10L)).thenReturn(Optional.of(college));

        assertThatThrownBy(() -> authService.login(
                new LoginRequest("admin@college.edu", "StrongPassword!99"),
                new MockHttpServletRequest(),
                new MockHttpServletResponse()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getErrorCode()).isEqualTo("COLLEGE_SUSPENDED");
                });
    }

    @Test
    void changePasswordRevokesOtherSessionsAndRotatesCurrentSession() {
        User admin = buildUser(5L, "admin@college.edu", Role.COLLEGE_ADMIN, 10L, UserStatus.ACTIVE, "OldStrongPass!2026");
        when(securityContextService.requireCurrentUserId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(admin));
        when(sessionRevocationService.revokeOtherSessions(eq(5L), any())).thenReturn(2);

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();
        String initialSessionId = session.getId();
        req.setSession(session);
        MockHttpServletResponse res = new MockHttpServletResponse();

        authService.changePassword(
                new ChangePasswordRequest("OldStrongPass!2026", "NewStrongerPass!2026"),
                req,
                res);

        verify(userRepository).save(admin);
        verify(sessionRevocationService).revokeOtherSessions(5L, initialSessionId);
        verify(securityContextRepository).saveContext(any(), eq(req), eq(res));
        assertThat(req.getSession(false).getId()).isNotEqualTo(initialSessionId);
    }

    @Test
    void forgotPasswordIsSilentNoOpForUnknownEmail() {
        when(userRepository.findByEmailAndEmailReleasedFalse("unknown@college.edu")).thenReturn(Optional.empty());

        authService.forgotPassword(new ForgotPasswordRequest("unknown@college.edu"), new MockHttpServletRequest());

        verify(authTokenService, never()).issueToken(any(), any(), any(), any());
        verify(outboxEmailService, never()).enqueue(any(), any(), any(), any(), anyMap());
    }

    @Test
    void resetPasswordRevokesAllActiveSessionsAndClearsLockout() {
        User admin = buildUser(7L, "admin@college.edu", Role.COLLEGE_ADMIN, 10L, UserStatus.ACTIVE, "OldStrongPass!2026");
        admin.setFailedLoginAttempts(5);
        admin.setLockedUntil(Instant.now().plusSeconds(300));

        AuthToken token = new AuthToken();
        token.setUserId(7L);
        token.setTokenType(AuthTokenType.PASSWORD_RESET);

        when(authTokenService.consumeToken("raw-reset-token", AuthTokenType.PASSWORD_RESET)).thenReturn(token);
        when(userRepository.findById(7L)).thenReturn(Optional.of(admin));
        when(sessionRevocationService.revokeAllSessionsForUser(7L)).thenReturn(3);

        authService.resetPassword(
                new ResetPasswordRequest("raw-reset-token", "BrandNewSecurePass!2026"),
                new MockHttpServletRequest());

        assertThat(admin.getFailedLoginAttempts()).isZero();
        assertThat(admin.getLockedUntil()).isNull();
        assertThat(passwordEncoder.matches("BrandNewSecurePass!2026", admin.getPasswordHash())).isTrue();
        verify(sessionRevocationService).revokeAllSessionsForUser(7L);
    }

    private User buildUser(Long id, String email, Role role, Long collegeId, UserStatus status, String rawPassword) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setCollegeId(collegeId);
        user.setStatus(status);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        return user;
    }
}
