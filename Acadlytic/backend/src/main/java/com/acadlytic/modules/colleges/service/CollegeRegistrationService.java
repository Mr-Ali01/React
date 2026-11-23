package com.acadlytic.modules.colleges.service;

import com.acadlytic.common.exception.AppException;
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
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;

/**
 * Service for public college registration intake (Phase 03, Module 3.1A).
 *
 * Responsibilities:
 * - Enforces public IP rate limiting.
 * - Validates administrator password strength against policy and breach denylist.
 * - Enforces unique active college code and unique active administrator email.
 * - Atomically persists College, CollegeRegistration (Revision 1), and College Admin User.
 * - Issues 48-hour email verification token and enqueues verification email in the transactional outbox.
 * - Records immutable security audit event COLLEGE_REGISTRATION_CREATED.
 */
@Service
public class CollegeRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(CollegeRegistrationService.class);
    private static final Duration EMAIL_VERIFICATION_TTL = Duration.ofHours(48);

    private final CollegeRepository collegeRepository;
    private final CollegeRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final EmailNormalizer emailNormalizer;
    private final AuthTokenService authTokenService;
    private final OutboxEmailService outboxEmailService;
    private final AuditEventService auditEventService;
    private final IpRateLimiter ipRateLimiter;

    public CollegeRegistrationService(
            CollegeRepository collegeRepository,
            CollegeRegistrationRepository registrationRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PasswordPolicyValidator passwordPolicyValidator,
            EmailNormalizer emailNormalizer,
            AuthTokenService authTokenService,
            OutboxEmailService outboxEmailService,
            AuditEventService auditEventService,
            IpRateLimiter ipRateLimiter) {
        this.collegeRepository = collegeRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.emailNormalizer = emailNormalizer;
        this.authTokenService = authTokenService;
        this.outboxEmailService = outboxEmailService;
        this.auditEventService = auditEventService;
        this.ipRateLimiter = ipRateLimiter;
    }

    /**
     * Entry point for HTTP requests. Resolves client IP, validates rate limits,
     * and performs atomic registration intake.
     */
    @Transactional
    public CollegeRegistrationResponse register(RegisterCollegeRequest request, HttpServletRequest httpRequest) {
        ipRateLimiter.checkRateLimit(httpRequest);
        String clientIp = ipRateLimiter.resolveClientIp(httpRequest);
        return registerInternal(request, clientIp);
    }

    /**
     * Overload for direct programmatic or testing calls with a resolved IP.
     */
    @Transactional
    public CollegeRegistrationResponse register(RegisterCollegeRequest request, String clientIp) {
        ipRateLimiter.checkRateLimit(clientIp);
        return registerInternal(request, clientIp);
    }

    private CollegeRegistrationResponse registerInternal(RegisterCollegeRequest request, String clientIp) {
        String normalizedEmail = emailNormalizer.normalize(request.adminEmail());
        String collegeCode = request.code().trim().toUpperCase(Locale.ROOT);
        String legalName = request.legalName().trim();

        // 1. Password policy enforcement
        passwordPolicyValidator.validate(request.password(), normalizedEmail);

        // 2. Conflict checks for active entities
        if (collegeRepository.existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull(collegeCode)) {
            throw new AppException(
                    "COLLEGE_CODE_ALREADY_EXISTS",
                    "An active college with this college code already exists.",
                    HttpStatus.CONFLICT);
        }

        if (userRepository.existsByEmailAndEmailReleasedFalse(normalizedEmail)) {
            throw new AppException(
                    "EMAIL_ALREADY_EXISTS",
                    "An active account with this email address already exists.",
                    HttpStatus.CONFLICT);
        }

        // 3. Create College entity
        College college = new College();
        college.setName(legalName);
        college.setCode(collegeCode);
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        college.setPermanentlyRejected(false);
        college.setResubmissionCount(0);
        college.setActionRequiredCount(0);
        college = collegeRepository.save(college);

        // 4. Create Revision 1 CollegeRegistration record (submittedForReviewAt remains NULL)
        CollegeRegistration registration = new CollegeRegistration();
        registration.setCollegeId(college.getId());
        registration.setVersionNumber(1);
        registration.setStatus(CollegeApprovalStatus.PENDING);
        registration.setLegalName(legalName);
        registration.setAddressLine1(request.addressLine1().trim());
        registration.setAddressLine2(request.addressLine2() != null && !request.addressLine2().isBlank()
                ? request.addressLine2().trim() : null);
        registration.setCity(request.city().trim());
        registration.setState(request.state().trim());
        registration.setCountry(request.country().trim());
        registration.setPostalCode(request.postalCode().trim());
        registration.setWebsiteUrl(request.websiteUrl() != null && !request.websiteUrl().isBlank()
                ? request.websiteUrl().trim() : null);
        registration.setContactPhone(request.contactPhone().trim());
        registration.setAffiliatedUniversityName(request.affiliatedUniversityName().trim());
        registration.setSubmittedForReviewAt(null);
        registration = registrationRepository.save(registration);

        // 5. Link current registration revision to college
        college.setCurrentRegistrationId(registration.getId());
        collegeRepository.save(college);

        // 6. Create initial College Administrator User
        User adminUser = new User();
        adminUser.setCollegeId(college.getId());
        adminUser.setEmail(normalizedEmail);
        adminUser.setFirstName(request.adminFirstName().trim());
        adminUser.setLastName(request.adminLastName().trim());
        adminUser.setRole(Role.COLLEGE_ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(null);
        adminUser.setEmailReleased(false);
        adminUser.setPasswordHash(passwordEncoder.encode(request.password()));
        adminUser = userRepository.save(adminUser);

        // 7. Issue 48-hour email verification token
        String rawToken = authTokenService.issueToken(
                adminUser.getId(),
                AuthTokenType.EMAIL_VERIFICATION,
                normalizedEmail,
                EMAIL_VERIFICATION_TTL);

        // 8. Enqueue verification email in the transactional outbox
        outboxEmailService.enqueue(
                "EMAIL_VERIFICATION",
                normalizedEmail,
                "Verify your email address - Acadlytic",
                "EMAIL_VERIFICATION",
                Map.of("firstName", adminUser.getFirstName(), "token", rawToken));

        // 9. Record immutable audit event
        auditEventService.record(
                AuditEventType.COLLEGE_REGISTRATION_CREATED,
                adminUser.getId(),
                Role.COLLEGE_ADMIN,
                adminUser.getId(),
                college.getId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of(
                        "collegeCode", collegeCode,
                        "legalName", legalName,
                        "versionNumber", registration.getVersionNumber()));

        log.info("Public college registration initiated: collegeId={}, code={}, adminEmail={}, version=1",
                college.getId(), collegeCode, normalizedEmail);

        return new CollegeRegistrationResponse(
                college.getId(),
                registration.getId(),
                registration.getVersionNumber(),
                college.getName(),
                college.getCode(),
                registration.getStatus(),
                adminUser.getEmail(),
                false,
                "College registration initiated successfully. Please verify your email address to continue."
        );
    }
}
