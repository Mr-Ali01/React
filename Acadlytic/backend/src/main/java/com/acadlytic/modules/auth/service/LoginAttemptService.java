package com.acadlytic.modules.auth.service;

import com.acadlytic.config.SecurityProperties;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Persists failed login attempts and brute-force lockout timestamps in independent transactions
 * so lockout state is committed even when login throws 401/429 exceptions.
 */
@Service
public class LoginAttemptService {

    private final UserRepository userRepository;
    private final SecurityProperties securityProperties;
    private final AuditEventService auditEventService;

    public LoginAttemptService(
            UserRepository userRepository,
            SecurityProperties securityProperties,
            AuditEventService auditEventService) {
        this.userRepository = userRepository;
        this.securityProperties = securityProperties;
        this.auditEventService = auditEventService;
    }

    /**
     * Records a failed password verification attempt and triggers a 15-minute lockout
     * on reaching maxFailedAttempts (5).
     *
     * @return true if this failure triggered a temporary account lockout
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordFailedAttempt(Long userId, String clientIp) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        Instant now = Instant.now();
        // Reset stale expired lockout window before incrementing
        if (user.getLockedUntil() != null && !user.getLockedUntil().isAfter(now)) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
        }

        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        int maxAttempts = securityProperties.getLockout().getMaxFailedAttempts();
        boolean locked = false;
        if (attempts >= maxAttempts) {
            Instant lockedUntil = now.plus(Duration.ofMinutes(securityProperties.getLockout().getDurationMinutes()));
            user.setLockedUntil(lockedUntil);
            locked = true;
            userRepository.save(user);
            auditEventService.record(
                    AuditEventType.ACCOUNT_LOCKED,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    user.getCollegeId(),
                    AuditOutcome.DENIED,
                    clientIp,
                    Map.of("failedAttempts", attempts, "lockedUntil", lockedUntil.toString()));
        } else {
            userRepository.save(user);
            auditEventService.record(
                    AuditEventType.LOGIN_FAILURE,
                    user.getId(),
                    user.getRole(),
                    user.getId(),
                    user.getCollegeId(),
                    AuditOutcome.FAILURE,
                    clientIp,
                    Map.of("reason", "INVALID_PASSWORD", "failedAttempts", attempts));
        }

        return locked;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User recordSuccessfulLogin(Long userId, String clientIp) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        User saved = userRepository.save(user);

        auditEventService.record(
                AuditEventType.LOGIN_SUCCESS,
                saved.getId(),
                saved.getRole(),
                saved.getId(),
                saved.getCollegeId(),
                AuditOutcome.SUCCESS,
                clientIp,
                Map.of("email", saved.getEmail()));
        return saved;
    }
}
