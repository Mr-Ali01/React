package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.common.exception.RateLimitExceededException;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.AuthTokenType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.auth.service.AuditEventService;
import com.acadlytic.modules.auth.service.AuthTokenService;
import com.acadlytic.modules.auth.service.EmailNormalizer;
import com.acadlytic.modules.auth.service.PasswordPolicyValidator;
import com.acadlytic.modules.colleges.dto.CollegeRegistrationResponse;
import com.acadlytic.modules.colleges.dto.RegisterCollegeRequest;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRegistrationRepository;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeRegistrationServiceUnitTest {

    @Mock
    private CollegeRepository collegeRepository;
    @Mock
    private CollegeRegistrationRepository registrationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private PasswordPolicyValidator passwordPolicyValidator;
    @Mock
    private EmailNormalizer emailNormalizer;
    @Mock
    private AuthTokenService authTokenService;
    @Mock
    private OutboxEmailService outboxEmailService;
    @Mock
    private AuditEventService auditEventService;
    @Mock
    private IpRateLimiter ipRateLimiter;

    private CollegeRegistrationService registrationService;

    @BeforeEach
    void setUp() {
        registrationService = new CollegeRegistrationService(
                collegeRepository,
                registrationRepository,
                userRepository,
                passwordEncoder,
                passwordPolicyValidator,
                emailNormalizer,
                authTokenService,
                outboxEmailService,
                auditEventService,
                ipRateLimiter
        );
    }

    private RegisterCollegeRequest createSampleRequest() {
        return new RegisterCollegeRequest(
                "Apex Institute of Technology",
                "APEX-TECH",
                "State Technical University",
                "100 Innovation Boulevard",
                "Building B, Suite 400",
                "Metropolis",
                "New York",
                "United States",
                "10001",
                "https://apex.edu",
                "+1-555-0199",
                "John",
                "Doe",
                "admin@apex.edu",
                "SecureP@ssword123!"
        );
    }

    @Test
    @DisplayName("Successfully registers college, v1 revision draft, and admin user with email verification token")
    void successfulRegistration() {
        RegisterCollegeRequest request = createSampleRequest();
        String clientIp = "192.168.1.50";

        when(emailNormalizer.normalize(request.adminEmail())).thenReturn("admin@apex.edu");
        when(collegeRepository.existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull("APEX-TECH")).thenReturn(false);
        when(userRepository.existsByEmailAndEmailReleasedFalse("admin@apex.edu")).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("$2a$12$hashedPassword");

        when(collegeRepository.save(any(College.class))).thenAnswer(invocation -> {
            College c = invocation.getArgument(0);
            c.setId(101L);
            return c;
        });

        when(registrationRepository.save(any(CollegeRegistration.class))).thenAnswer(invocation -> {
            CollegeRegistration r = invocation.getArgument(0);
            r.setId(501L);
            return r;
        });

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(201L);
            return u;
        });

        when(authTokenService.issueToken(eq(201L), eq(AuthTokenType.EMAIL_VERIFICATION), eq("admin@apex.edu"), any(Duration.class)))
                .thenReturn("raw-verification-token-xyz");

        CollegeRegistrationResponse response = registrationService.register(request, clientIp);

        // 1. Assert Rate Limiter was checked
        verify(ipRateLimiter).checkRateLimit(clientIp);

        // 2. Assert Password Policy was validated
        verify(passwordPolicyValidator).validate(request.password(), "admin@apex.edu");

        // 3. Assert College entity saved with correct initial states
        ArgumentCaptor<College> collegeCaptor = ArgumentCaptor.forClass(College.class);
        verify(collegeRepository, org.mockito.Mockito.atLeastOnce()).save(collegeCaptor.capture());
        College savedCollege = collegeCaptor.getAllValues().get(0);
        assertThat(savedCollege.getName()).isEqualTo("Apex Institute of Technology");
        assertThat(savedCollege.getCode()).isEqualTo("APEX-TECH");
        assertThat(savedCollege.getApprovalStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(savedCollege.getStatus()).isEqualTo(CollegeStatus.PENDING_VERIFICATION);
        assertThat(savedCollege.isPermanentlyRejected()).isFalse();

        // 4. Assert CollegeRegistration v1 draft was saved
        ArgumentCaptor<CollegeRegistration> regCaptor = ArgumentCaptor.forClass(CollegeRegistration.class);
        verify(registrationRepository).save(regCaptor.capture());
        CollegeRegistration savedReg = regCaptor.getValue();
        assertThat(savedReg.getCollegeId()).isEqualTo(101L);
        assertThat(savedReg.getVersionNumber()).isEqualTo(1);
        assertThat(savedReg.getStatus()).isEqualTo(CollegeApprovalStatus.PENDING);
        assertThat(savedReg.getLegalName()).isEqualTo("Apex Institute of Technology");
        assertThat(savedReg.getAffiliatedUniversityName()).isEqualTo("State Technical University");
        assertThat(savedReg.getSubmittedForReviewAt()).isNull(); // strictly NULL for intake!

        // 5. Assert College currentRegistrationId was updated
        College updatedCollege = collegeCaptor.getAllValues().get(1);
        assertThat(updatedCollege.getCurrentRegistrationId()).isEqualTo(501L);

        // 6. Assert User saved with COLLEGE_ADMIN role and unverified email
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getCollegeId()).isEqualTo(101L);
        assertThat(savedUser.getEmail()).isEqualTo("admin@apex.edu");
        assertThat(savedUser.getRole()).isEqualTo(Role.COLLEGE_ADMIN);
        assertThat(savedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(savedUser.getEmailVerifiedAt()).isNull();
        assertThat(savedUser.isEmailReleased()).isFalse();

        // 7. Assert 48h email verification token issued
        verify(authTokenService).issueToken(201L, AuthTokenType.EMAIL_VERIFICATION, "admin@apex.edu", Duration.ofHours(48));

        // 8. Assert verification email enqueued in transactional outbox
        verify(outboxEmailService).enqueue(
                eq("EMAIL_VERIFICATION"),
                eq("admin@apex.edu"),
                eq("Verify your email address - Acadlytic"),
                eq("EMAIL_VERIFICATION"),
                eq(Map.of("firstName", "John", "token", "raw-verification-token-xyz"))
        );

        // 9. Assert immutable audit event recorded with COLLEGE_REGISTRATION_CREATED
        verify(auditEventService).record(
                eq(AuditEventType.COLLEGE_REGISTRATION_CREATED),
                eq(201L),
                eq(Role.COLLEGE_ADMIN),
                eq(201L),
                eq(101L),
                eq(AuditOutcome.SUCCESS),
                eq(clientIp),
                eq(Map.of("collegeCode", "APEX-TECH", "legalName", "Apex Institute of Technology", "versionNumber", 1))
        );

        // 10. Assert Response
        assertThat(response.collegeId()).isEqualTo(101L);
        assertThat(response.registrationId()).isEqualTo(501L);
        assertThat(response.versionNumber()).isEqualTo(1);
        assertThat(response.collegeCode()).isEqualTo("APEX-TECH");
        assertThat(response.adminEmail()).isEqualTo("admin@apex.edu");
        assertThat(response.submittedForReview()).isFalse();
    }

    @Test
    @DisplayName("Rejects registration when college code is already taken by active college")
    void rejectsDuplicateCollegeCode() {
        RegisterCollegeRequest request = createSampleRequest();
        when(emailNormalizer.normalize(request.adminEmail())).thenReturn("admin@apex.edu");
        when(collegeRepository.existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull("APEX-TECH")).thenReturn(true);

        assertThatThrownBy(() -> registrationService.register(request, "127.0.0.1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("COLLEGE_CODE_ALREADY_EXISTS");
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                });

        verify(collegeRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rejects registration when admin email is already in use by active user")
    void rejectsDuplicateAdminEmail() {
        RegisterCollegeRequest request = createSampleRequest();
        when(emailNormalizer.normalize(request.adminEmail())).thenReturn("admin@apex.edu");
        when(collegeRepository.existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull("APEX-TECH")).thenReturn(false);
        when(userRepository.existsByEmailAndEmailReleasedFalse("admin@apex.edu")).thenReturn(true);

        assertThatThrownBy(() -> registrationService.register(request, "127.0.0.1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("EMAIL_ALREADY_EXISTS");
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                });

        verify(collegeRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Propagates password policy violations without creating records")
    void rejectsWeakPassword() {
        RegisterCollegeRequest request = createSampleRequest();
        when(emailNormalizer.normalize(request.adminEmail())).thenReturn("admin@apex.edu");
        doThrow(new AppException("PASSWORD_POLICY_VIOLATION", "Password too weak", HttpStatus.BAD_REQUEST))
                .when(passwordPolicyValidator).validate(request.password(), "admin@apex.edu");

        assertThatThrownBy(() -> registrationService.register(request, "127.0.0.1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo("PASSWORD_POLICY_VIOLATION");
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });

        verify(collegeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Propagates RateLimitExceededException when IP is rate limited")
    void rejectsRateLimitedRequest() {
        RegisterCollegeRequest request = createSampleRequest();
        doThrow(new RateLimitExceededException("Too many registration requests", 3600))
                .when(ipRateLimiter).checkRateLimit("203.0.113.99");

        assertThatThrownBy(() -> registrationService.register(request, "203.0.113.99"))
                .isInstanceOf(RateLimitExceededException.class)
                .satisfies(ex -> {
                    RateLimitExceededException rle = (RateLimitExceededException) ex;
                    assertThat(rle.getErrorCode()).isEqualTo("RATE_LIMIT_EXCEEDED");
                    assertThat(rle.getRetryAfterSeconds()).isEqualTo(3600);
                });

        verify(collegeRepository, never()).save(any());
    }
}
