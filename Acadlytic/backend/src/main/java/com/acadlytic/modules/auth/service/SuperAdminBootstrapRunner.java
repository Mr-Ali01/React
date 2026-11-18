package com.acadlytic.modules.auth.service;

import com.acadlytic.config.SuperAdminBootstrapProperties;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

/**
 * Guarded, idempotent, environment-driven one-time SUPER_ADMIN bootstrap runner (ADR-17).
 *
 * - Runs ONLY when app.bootstrap.super-admin.enabled=true AND zero SUPER_ADMIN rows exist.
 * - Fails startup fast if required credentials are missing or violate the password policy.
 * - Never logs the bootstrap password or exposes any public HTTP bootstrap endpoint.
 * - Operators must set APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=false and remove secrets after initial setup.
 */
@Component
public class SuperAdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminBootstrapRunner.class);

    private final SuperAdminBootstrapProperties properties;
    private final UserRepository userRepository;
    private final EmailNormalizer emailNormalizer;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final PasswordEncoder passwordEncoder;
    private final AuditEventService auditEventService;

    public SuperAdminBootstrapRunner(
            SuperAdminBootstrapProperties properties,
            UserRepository userRepository,
            EmailNormalizer emailNormalizer,
            PasswordPolicyValidator passwordPolicyValidator,
            PasswordEncoder passwordEncoder,
            AuditEventService auditEventService) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.emailNormalizer = emailNormalizer;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.passwordEncoder = passwordEncoder;
        this.auditEventService = auditEventService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            return;
        }

        if (userRepository.existsByRole(Role.SUPER_ADMIN)) {
            log.info("SUPER_ADMIN bootstrap skipped: an existing SUPER_ADMIN account is already provisioned.");
            return;
        }

        String normalizedEmail = emailNormalizer.normalize(properties.getEmail());
        String firstName = trimOrNull(properties.getFirstName());
        String lastName = trimOrNull(properties.getLastName());
        String rawPassword = properties.getPassword();

        if (normalizedEmail == null || normalizedEmail.isBlank() || !normalizedEmail.contains("@")) {
            throw new IllegalStateException("SUPER_ADMIN bootstrap failed: SUPER_ADMIN_EMAIL must be a valid email address.");
        }
        if (firstName == null || lastName == null) {
            throw new IllegalStateException("SUPER_ADMIN bootstrap failed: SUPER_ADMIN_FIRST_NAME and SUPER_ADMIN_LAST_NAME are required.");
        }

        // Enforces 12-128 chars and rejects common/compromised passwords without logging the password
        passwordPolicyValidator.validate(rawPassword, normalizedEmail);

        if (userRepository.existsByEmailAndEmailReleasedFalse(normalizedEmail)) {
            throw new IllegalStateException("SUPER_ADMIN bootstrap failed: an active user with SUPER_ADMIN_EMAIL already exists.");
        }

        User superAdmin = new User();
        superAdmin.setCollegeId(null);
        superAdmin.setEmail(normalizedEmail);
        superAdmin.setEmailVerifiedAt(Instant.now());
        superAdmin.setEmailReleased(false);
        superAdmin.setPasswordHash(passwordEncoder.encode(rawPassword));
        superAdmin.setFirstName(firstName);
        superAdmin.setLastName(lastName);
        superAdmin.setRole(Role.SUPER_ADMIN);
        superAdmin.setStatus(UserStatus.ACTIVE);
        superAdmin.setFailedLoginAttempts(0);

        User saved = userRepository.save(superAdmin);

        auditEventService.record(
                AuditEventType.SUPER_ADMIN_BOOTSTRAPPED,
                saved.getId(),
                Role.SUPER_ADMIN,
                saved.getId(),
                null,
                AuditOutcome.SUCCESS,
                null,
                Map.of("email", saved.getEmail()));

        log.info("Bootstrapped initial SUPER_ADMIN account (userId={}, email={}). Disable APP_BOOTSTRAP_SUPER_ADMIN_ENABLED after setup.",
                saved.getId(), saved.getEmail());
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
