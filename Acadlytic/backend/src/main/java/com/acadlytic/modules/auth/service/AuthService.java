package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.SecurityProperties;
import com.acadlytic.modules.auth.dto.ChangeEmailRequest;
import com.acadlytic.modules.auth.dto.ChangePasswordRequest;
import com.acadlytic.modules.auth.dto.CurrentUserResponse;
import com.acadlytic.modules.auth.dto.ForgotPasswordRequest;
import com.acadlytic.modules.auth.dto.LoginRequest;
import com.acadlytic.modules.auth.dto.ResetPasswordRequest;
import com.acadlytic.modules.auth.dto.VerifyEmailChangeRequest;
import com.acadlytic.modules.auth.dto.VerifyEmailRequest;
import com.acadlytic.modules.auth.dto.VerifyEmailResponse;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.AuthToken;
import com.acadlytic.modules.auth.entity.AuthTokenType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.mapper.CurrentUserMapper;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.security.AcadlyticUserPrincipal;
import com.acadlytic.security.ClientIpResolver;
import com.acadlytic.security.SecurityContextService;
import com.acadlytic.security.SessionConstants;
import com.acadlytic.security.SessionRevocationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
    // Valid BCrypt(12) hash used to equalize timing when email does not exist
    private static final String DUMMY_BCRYPT_HASH =
            "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNormalizer emailNormalizer;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final LoginAttemptService loginAttemptService;
    private final AuthTokenService authTokenService;
    private final AuditEventService auditEventService;
    private final OutboxEmailService outboxEmailService;
    private final SessionRevocationService sessionRevocationService;
    private final SecurityContextService securityContextService;
    private final SecurityContextRepository securityContextRepository;
    private final CurrentUserMapper currentUserMapper;
    private final ClientIpResolver clientIpResolver;
    private final SecurityProperties securityProperties;
    private final UserRateLimiter userRateLimiter;

    public AuthService(
            UserRepository userRepository,
            CollegeRepository collegeRepository,
            PasswordEncoder passwordEncoder,
            EmailNormalizer emailNormalizer,
            PasswordPolicyValidator passwordPolicyValidator,
            LoginAttemptService loginAttemptService,
            AuthTokenService authTokenService,
            AuditEventService auditEventService,
            OutboxEmailService outboxEmailService,
            SessionRevocationService sessionRevocationService,
            SecurityContextService securityContextService,
            SecurityContextRepository securityContextRepository,
            CurrentUserMapper currentUserMapper,
            ClientIpResolver clientIpResolver,
            SecurityProperties securityProperties,
            UserRateLimiter userRateLimiter) {
        this.userRepository = userRepository;
        this.collegeRepository = collegeRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailNormalizer = emailNormalizer;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.loginAttemptService = loginAttemptService;
        this.authTokenService = authTokenService;
        this.auditEventService = auditEventService;
        this.outboxEmailService = outboxEmailService;
        this.sessionRevocationService = sessionRevocationService;
        this.securityContextService = securityContextService;
        this.securityContextRepository = securityContextRepository;
        this.currentUserMapper = currentUserMapper;
        this.clientIpResolver = clientIpResolver;
        this.securityProperties = securityProperties;
        this.userRateLimiter = userRateLimiter;
    }

    public CurrentUserResponse login(
            LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String normalizedEmail = emailNormalizer.normalize(request.email());
        String clientIp = clientIpResolver.resolve(httpRequest);
        Instant now = Instant.now();

        Optional<User> userOpt = userRepository.findByEmailAndEmailReleasedFalse(normalizedEmail);
        if (userOpt.isEmpty()) {
            passwordEncoder.matches(request.password(), DUMMY_BCRYPT_HASH);
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    null,
                    null,
                    null,
                    null,
                    AuditOutcome.FAILURE,
                    clientIp,
                    Map.of("email", normalizedEmail, "reason", "UNKNOWN_ACCOUNT"));
            throw new AppException("AUTH_INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE, HttpStatus.UNAUTHORIZED);
        }

        User user = userOpt.get();

        if (user.isLocked(now)) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    user.getCollegeId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "ACCOUNT_LOCKED"));
            throw new AppException(
                    "AUTH_ACCOUNT_LOCKED",
                    "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            boolean locked = loginAttemptService.recordFailedAttempt(user.getId(), clientIp);
            if (locked) {
                throw new AppException(
                        "AUTH_ACCOUNT_LOCKED",
                        "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            throw new AppException("AUTH_INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE, HttpStatus.UNAUTHORIZED);
        }

        if (!user.getRole().isActiveInMvp()) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    user.getCollegeId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "ROLE_NOT_ACTIVE_IN_MVP"));
            throw new AppException(
                    "AUTH_ROLE_NOT_SUPPORTED",
                    "This account role is not enabled in the current release.",
                    HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    user.getCollegeId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "USER_SUSPENDED"));
            throw new AppException(
                    "AUTH_ACCOUNT_SUSPENDED",
                    "Your account has been suspended. Please contact support.",
                    HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    user.getCollegeId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "USER_INACTIVE"));
            throw new AppException(
                    "AUTH_ACCOUNT_INACTIVE",
                    "Your account is inactive.",
                    HttpStatus.FORBIDDEN);
        }

        College college = null;
        if (user.getRole() == Role.COLLEGE_ADMIN) {
            college = validateCollegeAllowsLogin(user, clientIp);
        }

        User updatedUser = loginAttemptService.recordSuccessfulLogin(user.getId(), clientIp);
        establishAuthenticatedSession(updatedUser, httpRequest, httpResponse, now);

        return currentUserMapper.toResponse(updatedUser, college);
    }

    public void logout(HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolve(httpRequest);
        Optional<AcadlyticUserPrincipal> principalOpt = securityContextService.getCurrentPrincipalOptional();

        sessionRevocationService.revokeCurrentSession(httpRequest);

        principalOpt.ifPresent(principal -> auditEventService.recordIndependently(
                AuditEventType.LOGOUT,
                principal.getUserId(),
                principal.getRole(),
                principal.getUserId(),
                principal.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("scope", "CURRENT_SESSION")));
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser() {
        Long userId = securityContextService.requireCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        "AUTH_UNAUTHENTICATED",
                        "Authenticated account not found.",
                        HttpStatus.UNAUTHORIZED));

        College college = null;
        if (user.getRole() == Role.COLLEGE_ADMIN && user.getCollegeId() != null) {
            college = collegeRepository.findById(user.getCollegeId()).orElse(null);
        }
        return currentUserMapper.toResponse(user, college);
    }

    @Transactional
    public void changePassword(
            ChangePasswordRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        Long userId = securityContextService.requireCurrentUserId();
        String clientIp = clientIpResolver.resolve(httpRequest);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        "AUTH_UNAUTHENTICATED",
                        "Authenticated account not found.",
                        HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new AppException(
                    "INVALID_CURRENT_PASSWORD",
                    "Current password is incorrect.",
                    HttpStatus.BAD_REQUEST);
        }

        passwordPolicyValidator.validate(request.newPassword(), user.getEmail());

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new AppException(
                    "PASSWORD_POLICY_VIOLATION",
                    "New password must be different from your current password.",
                    HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // ADR-05: Password change revokes ALL OTHER sessions and rotates the current session ID
        HttpSession session = httpRequest.getSession(false);
        String currentSessionId = session != null ? session.getId() : null;
        int revokedOtherSessions = sessionRevocationService.revokeOtherSessions(user.getId(), currentSessionId);

        if (session != null) {
            rotateAndSavePrincipal(user, httpRequest, httpResponse);
        }

        auditEventService.record(
                AuditEventType.PASSWORD_CHANGED,
                user.getId(),
                user.getRole(),
                user.getId(),
                user.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("sessionsRevoked", revokedOtherSessions));
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String normalizedEmail = emailNormalizer.normalize(request.email());
        String clientIp = clientIpResolver.resolve(httpRequest);

        Optional<User> userOpt = userRepository.findByEmailAndEmailReleasedFalse(normalizedEmail);
        if (userOpt.isEmpty()) {
            // Silent no-op to prevent account enumeration
            return;
        }

        User user = userOpt.get();
        if (!user.getRole().isActiveInMvp() || user.getStatus() != UserStatus.ACTIVE) {
            return;
        }

        if (user.getRole() == Role.COLLEGE_ADMIN && user.getCollegeId() != null) {
            Optional<College> collegeOpt = collegeRepository.findById(user.getCollegeId());
            if (collegeOpt.isEmpty()) {
                return;
            }
            College college = collegeOpt.get();
            if (college.isPermanentlyRejected()
                    || college.getStatus() == CollegeStatus.SUSPENDED
                    || college.getStatus() == CollegeStatus.INACTIVE) {
                return;
            }
        }

        Duration ttl = Duration.ofMinutes(securityProperties.getTokens().getPasswordResetExpiryMinutes());
        String rawToken = authTokenService.issueToken(user.getId(), AuthTokenType.PASSWORD_RESET, user.getEmail(), ttl);

        outboxEmailService.enqueue(
                "PASSWORD_RESET_REQUESTED",
                user.getEmail(),
                "Reset your Acadlytic password",
                "PASSWORD_RESET",
                Map.of("firstName", user.getFirstName(), "token", rawToken));

        auditEventService.record(
                AuditEventType.PASSWORD_RESET_REQUESTED,
                user.getId(),
                user.getRole(),
                user.getId(),
                user.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("email", user.getEmail()));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolve(httpRequest);
        // Validate policy length/denylist first before consuming the single-use token
        passwordPolicyValidator.validate(request.newPassword(), null);

        AuthToken token = authTokenService.consumeToken(request.token(), AuthTokenType.PASSWORD_RESET);
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new AppException(
                        "INVALID_OR_EXPIRED_TOKEN",
                        "The token is invalid or has expired.",
                        HttpStatus.BAD_REQUEST));

        if (!user.getRole().isActiveInMvp() || user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(
                    "AUTH_ACCOUNT_INACTIVE",
                    "Account is not eligible for password reset.",
                    HttpStatus.FORBIDDEN);
        }

        passwordPolicyValidator.validate(request.newPassword(), user.getEmail());

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // ADR-05: Password reset immediately revokes ALL active sessions
        int revokedCount = sessionRevocationService.revokeAllSessionsForUser(user.getId());

        auditEventService.record(
                AuditEventType.PASSWORD_RESET_COMPLETED,
                user.getId(),
                user.getRole(),
                user.getId(),
                user.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("sessionsRevoked", revokedCount));
    }

    @Transactional
    public void changeEmail(
            ChangeEmailRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        Long userId = securityContextService.requireCurrentUserId();
        String clientIp = clientIpResolver.resolve(httpRequest);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        "AUTH_UNAUTHENTICATED",
                        "Authenticated account not found.",
                        HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new AppException(
                    "INVALID_CURRENT_PASSWORD",
                    "Current password is incorrect.",
                    HttpStatus.BAD_REQUEST);
        }

        String normalizedNewEmail = emailNormalizer.normalize(request.newEmail());
        if (normalizedNewEmail.equals(user.getEmail())) {
            throw new AppException(
                    "EMAIL_UNCHANGED",
                    "New email address must be different from your current email address.",
                    HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByEmailAndEmailReleasedFalse(normalizedNewEmail)) {
            throw new AppException(
                    "EMAIL_ALREADY_EXISTS",
                    "An active account with this email address already exists.",
                    HttpStatus.CONFLICT);
        }

        // ADR-14: Unverified pre-submission typo correction updates email directly & re-dispatches 48h verification
        if (user.getEmailVerifiedAt() == null) {
            String previousEmail = user.getEmail();
            user.setEmail(normalizedNewEmail);
            user.setPendingEmail(null);
            userRepository.save(user);

            Duration verificationTtl = Duration.ofHours(securityProperties.getTokens().getEmailVerificationExpiryHours());
            String rawToken = authTokenService.issueToken(
                    user.getId(), AuthTokenType.EMAIL_VERIFICATION, normalizedNewEmail, verificationTtl);

            outboxEmailService.enqueue(
                    "EMAIL_VERIFICATION_REQUESTED",
                    normalizedNewEmail,
                    "Verify your Acadlytic email address",
                    "EMAIL_VERIFICATION",
                    Map.of("firstName", user.getFirstName(), "token", rawToken));

            HttpSession session = httpRequest.getSession(false);
            if (session != null) {
                rotateAndSavePrincipal(user, httpRequest, httpResponse);
            }

            auditEventService.record(
                    AuditEventType.EMAIL_CHANGE_REQUESTED,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    user.getCollegeId(),
                    AuditOutcome.SUCCESS,
                    clientIp,
                    Map.of("mode", "PRE_VERIFICATION_CORRECTION", "previousEmail", previousEmail, "newEmail", normalizedNewEmail));
            return;
        }

        // Verified user: keep current email active until confirmed via pending_email + 48h token (ADR-14)
        user.setPendingEmail(normalizedNewEmail);
        userRepository.save(user);

        Duration changeTtl = Duration.ofHours(securityProperties.getTokens().getEmailChangeExpiryHours());
        String rawToken = authTokenService.issueToken(
                user.getId(), AuthTokenType.EMAIL_CHANGE, normalizedNewEmail, changeTtl);

        outboxEmailService.enqueue(
                "EMAIL_CHANGE_VERIFICATION",
                normalizedNewEmail,
                "Confirm your new Acadlytic email address",
                "EMAIL_CHANGE_VERIFICATION",
                Map.of("firstName", user.getFirstName(), "token", rawToken));

        outboxEmailService.enqueue(
                "EMAIL_CHANGE_ALERT",
                user.getEmail(),
                "Security notice: Email change requested on your Acadlytic account",
                "EMAIL_CHANGE_ALERT",
                Map.of("firstName", user.getFirstName(), "pendingEmail", normalizedNewEmail));

        auditEventService.record(
                AuditEventType.EMAIL_CHANGE_REQUESTED,
                user.getId(),
                user.getRole(),
                user.getId(),
                user.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("mode", "PENDING_CONFIRMATION", "pendingEmail", normalizedNewEmail));
    }

    @Transactional
    public void verifyEmailChange(
            VerifyEmailChangeRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String clientIp = clientIpResolver.resolve(httpRequest);
        AuthToken token = authTokenService.consumeToken(request.token(), AuthTokenType.EMAIL_CHANGE);

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new AppException(
                        "INVALID_OR_EXPIRED_TOKEN",
                        "The token is invalid or has expired.",
                        HttpStatus.BAD_REQUEST));

        String targetEmail = emailNormalizer.normalize(token.getTargetEmail());
        if (targetEmail == null || !targetEmail.equals(user.getPendingEmail())) {
            throw new AppException(
                    "INVALID_OR_EXPIRED_TOKEN",
                    "This email change request is no longer active.",
                    HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByEmailAndEmailReleasedFalse(targetEmail)) {
            throw new AppException(
                    "EMAIL_ALREADY_EXISTS",
                    "An active account with this email address already exists.",
                    HttpStatus.CONFLICT);
        }

        String previousEmail = user.getEmail();
        user.setEmail(targetEmail);
        user.setPendingEmail(null);
        user.setEmailVerifiedAt(Instant.now());
        userRepository.save(user);

        // ADR-05 & ADR-14: Revoke all other sessions + rotate current session if caller is logged in as this user
        int sessionsRevoked;
        Optional<AcadlyticUserPrincipal> currentPrincipal = securityContextService.getCurrentPrincipalOptional();
        HttpSession session = httpRequest.getSession(false);
        if (session != null && currentPrincipal.isPresent() && currentPrincipal.get().getUserId().equals(user.getId())) {
            sessionsRevoked = sessionRevocationService.revokeOtherSessions(user.getId(), session.getId());
            rotateAndSavePrincipal(user, httpRequest, httpResponse);
        } else {
            sessionsRevoked = sessionRevocationService.revokeAllSessionsForUser(user.getId());
        }

        auditEventService.record(
                AuditEventType.EMAIL_CHANGED,
                user.getId(),
                user.getRole(),
                user.getId(),
                user.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("previousEmail", previousEmail, "newEmail", targetEmail, "sessionsRevoked", sessionsRevoked));
    }

    private College validateCollegeAllowsLogin(User user, String clientIp) {
        if (user.getCollegeId() == null) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    null,
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "MISSING_COLLEGE_TENANT"));
            throw new AppException("COLLEGE_INACTIVE", "No college tenant is linked to this account.", HttpStatus.FORBIDDEN);
        }

        College college = collegeRepository.findById(user.getCollegeId())
                .orElseThrow(() -> new AppException(
                        "COLLEGE_INACTIVE",
                        "Associated college tenant was not found.",
                        HttpStatus.FORBIDDEN));

        if (college.isPermanentlyRejected()) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    college.getId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "REGISTRATION_PERMANENTLY_REJECTED"));
            throw new AppException(
                    "REGISTRATION_PERMANENTLY_REJECTED",
                    "This college registration has been permanently rejected.",
                    HttpStatus.FORBIDDEN);
        }

        if (college.getStatus() == CollegeStatus.SUSPENDED) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    college.getId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "COLLEGE_SUSPENDED"));
            throw new AppException(
                    "COLLEGE_SUSPENDED",
                    "This college account is currently suspended. Please contact Acadlytic support.",
                    HttpStatus.FORBIDDEN);
        }

        if (college.getStatus() == CollegeStatus.INACTIVE || college.getArchivedAt() != null) {
            auditEventService.recordIndependently(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    college.getId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("reason", "COLLEGE_INACTIVE"));
            throw new AppException(
                    "COLLEGE_INACTIVE",
                    "This college account is inactive. Please contact Acadlytic support.",
                    HttpStatus.FORBIDDEN);
        }

        return college;
    }

    private void establishAuthenticatedSession(
            User user,
            HttpServletRequest request,
            HttpServletResponse response,
            Instant now) {
        HttpSession existing = request.getSession(false);
        HttpSession session;
        if (existing != null) {
            request.changeSessionId();
            session = request.getSession(false);
        } else {
            session = request.getSession(true);
        }
        session.setAttribute(SessionConstants.SESSION_CREATED_AT, now);

        AcadlyticUserPrincipal principal = new AcadlyticUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getCollegeId());

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authToken);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    private void rotateAndSavePrincipal(
            User user,
            HttpServletRequest request,
            HttpServletResponse response) {
        request.changeSessionId();
        AcadlyticUserPrincipal principal = new AcadlyticUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getCollegeId());
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authToken);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest request, HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolve(httpRequest);

        AuthToken token = authTokenService.lockAndValidateToken(request.token(), AuthTokenType.EMAIL_VERIFICATION);

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new AppException(
                        "INVALID_OR_EXPIRED_TOKEN",
                        "The token is invalid or has expired.",
                        HttpStatus.BAD_REQUEST));

        if (token.getTargetEmail() == null || !token.getTargetEmail().equalsIgnoreCase(user.getEmail())) {
            throw new AppException(
                    "INVALID_OR_EXPIRED_TOKEN",
                    "The token is invalid or has expired.",
                    HttpStatus.BAD_REQUEST);
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(
                    "AUTH_ACCOUNT_INACTIVE",
                    "Your account is not active.",
                    HttpStatus.FORBIDDEN);
        }

        if (user.getEmailVerifiedAt() != null) {
            throw new AppException(
                    "EMAIL_ALREADY_VERIFIED",
                    "Your email address is already verified.",
                    HttpStatus.BAD_REQUEST);
        }

        Instant now = Instant.now();
        authTokenService.markTokenUsed(token);

        user.setEmailVerifiedAt(now);
        userRepository.save(user);

        authTokenService.revokeActiveTokensForUser(user.getId(), AuthTokenType.EMAIL_VERIFICATION, now);

        auditEventService.record(
                AuditEventType.EMAIL_VERIFIED,
                user.getId(),
                user.getRole(),
                user.getId(),
                user.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("email", user.getEmail(), "verifiedAt", now.toString()));

        return new VerifyEmailResponse(user.getEmail(), true, now);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public void resendVerification(HttpServletRequest httpRequest) {
        Long userId = securityContextService.requireCurrentUserId();
        String clientIp = clientIpResolver.resolve(httpRequest);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        "AUTH_UNAUTHENTICATED",
                        "Authenticated account not found.",
                        HttpStatus.UNAUTHORIZED));

        if (user.getRole() != Role.COLLEGE_ADMIN) {
            throw new AppException(
                    "ACCESS_DENIED",
                    "Only college administrators can request verification resend.",
                    HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(
                    "AUTH_ACCOUNT_INACTIVE",
                    "Your account is not active.",
                    HttpStatus.FORBIDDEN);
        }

        if (user.getEmailVerifiedAt() != null) {
            throw new AppException(
                    "EMAIL_ALREADY_VERIFIED",
                    "Your email address is already verified.",
                    HttpStatus.BAD_REQUEST);
        }

        // Dual-layer rate limiting: max 3/15m for user, independent 5/60m for IP
        userRateLimiter.checkResendRateLimit(user.getId(), httpRequest);

        Instant now = Instant.now();
        authTokenService.revokeActiveTokensForUser(user.getId(), AuthTokenType.EMAIL_VERIFICATION, now);

        Duration ttl = Duration.ofHours(securityProperties.getTokens().getEmailVerificationExpiryHours());
        String rawToken = authTokenService.issueToken(user.getId(), AuthTokenType.EMAIL_VERIFICATION, user.getEmail(), ttl);

        outboxEmailService.enqueue(
                "EMAIL_VERIFICATION",
                user.getEmail(),
                "Verify your email address - Acadlytic",
                "EMAIL_VERIFICATION",
                Map.of("firstName", user.getFirstName(), "token", rawToken));

        auditEventService.record(
                AuditEventType.EMAIL_VERIFICATION_RESENT,
                user.getId(),
                user.getRole(),
                user.getId(),
                user.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("email", user.getEmail()));
    }
}
