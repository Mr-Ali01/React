package com.resultpoint.modules.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resultpoint.common.exception.ApiException;
import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.auth.dto.*;
import com.resultpoint.modules.auth.entity.PasswordResetToken;
import com.resultpoint.modules.auth.entity.UserRefreshToken;
import com.resultpoint.modules.auth.repository.PasswordResetTokenRepository;
import com.resultpoint.modules.auth.repository.UserRefreshTokenRepository;
import com.resultpoint.modules.user.entity.User;
import com.resultpoint.modules.user.entity.UserRole;
import com.resultpoint.modules.user.entity.UserStatus;
import com.resultpoint.modules.user.repository.UserRepository;
import com.resultpoint.security.UserPrincipal;
import com.resultpoint.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;

/**
 * Authentication and Session Management Service.
 * Implements stateless JWT authentication, single-use refresh token rotation with a 30s AES-256-GCM grace window,
 * FIFO 3-session eviction, and secure password reset lifecycles.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserRefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenEncryptionService tokenEncryptionService;
    private final ObjectMapper objectMapper;

    private static final int MAX_ACTIVE_SESSIONS = 3;
    private static final int REFRESH_TOKEN_LIFESPAN_DAYS = 7;
    private static final int RESET_TOKEN_LIFESPAN_MINUTES = 15;
    private static final int GRACE_PERIOD_SECONDS = 30;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Registers a new student account.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress, String deviceInfo) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED",
                    "An account with this email address already exists.");
        }

        User user = User.builder()
                .id(IdGenerator.generateUserId())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(UserRole.STUDENT) // Public registration is strictly STUDENT
                .status(UserStatus.ACTIVE)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .lastLoginAt(Instant.now())
                .build();

        user = userRepository.save(user);
        log.info("Registered new student account: {} (ID: {})", email, user.getId());

        return createSession(user, ipAddress, deviceInfo);
    }

    /**
     * Authenticates a user with email and password and creates a session.
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                        "Invalid email or password."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Login attempt for non-active account: {} (Status: {})", email, user.getStatus());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                    "Invalid email or password.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                    "Invalid email or password.");
        }

        // Acquire pessimistic write lock on user row to serialize session limit operations
        user = userRepository.findByIdWithLock(user.getId())
                .orElse(user);

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return createSession(user, ipAddress, request.getDeviceInfo());
    }

    /**
     * Atomically rotates a refresh token, issuing a fresh access/refresh token pair.
     * Enforces single-use rotation, a 30s AES-256 concurrency grace cache, and token theft detection.
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request, String ipAddress) {
        String incomingHash = hashToken(request.getRefreshToken());

        UserRefreshToken tokenRecord = refreshTokenRepository.findByTokenHashWithLock(incomingHash)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN",
                        "Invalid or expired refresh token."));

        Instant now = Instant.now();

        // Check if token was already revoked
        if (tokenRecord.isRevoked()) {
            Instant revokedAt = tokenRecord.getRevokedAt();

            // 1. Within 30-second concurrency grace period for normal rotations
            if (revokedAt != null && "ROTATED".equals(tokenRecord.getRevocationReason())) {
                long secondsSinceRevocation = Duration.between(revokedAt, now).getSeconds();
                if (secondsSinceRevocation >= -5 && secondsSinceRevocation <= GRACE_PERIOD_SECONDS) {
                    if (tokenRecord.getCachedResponsePayload() != null) {
                        try {
                            String decryptedJson = tokenEncryptionService.decrypt(tokenRecord.getCachedResponsePayload());
                            log.debug("Serving cached response for concurrent refresh replay (age: {}s)", secondsSinceRevocation);
                            return objectMapper.readValue(decryptedJson, AuthResponse.class);
                        } catch (Exception ex) {
                            log.error("Failed to decrypt cached response payload during grace window: {}", ex.getMessage());
                        }
                    }
                }
            }

            // 2. Beyond grace period or illegitimate replay: THEFT DETECTED
            log.warn("Token reuse detected for user {}. Revoking all active sessions immediately.", tokenRecord.getUser().getId());
            refreshTokenRepository.revokeAllActiveByUserId(tokenRecord.getUser().getId(), now, "TOKEN_THEFT_DETECTED");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_THEFT_DETECTED",
                    "Refresh token reuse detected. All active sessions have been revoked for security.");
        }

        // Check expiry
        if (tokenRecord.getExpiresAt().isBefore(now)) {
            tokenRecord.setRevoked(true);
            tokenRecord.setRevokedAt(now);
            tokenRecord.setRevocationReason("EXPIRED");
            refreshTokenRepository.save(tokenRecord);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "EXPIRED_REFRESH_TOKEN",
                    "Refresh token has expired. Please log in again.");
        }

        User user = tokenRecord.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_INACTIVE",
                    "User account is not active.");
        }

        // Generate new token pair
        String newRawRefreshToken = generateRawToken();
        String newTokenHash = hashToken(newRawRefreshToken);

        UserRefreshToken newToken = UserRefreshToken.builder()
                .user(user)
                .tokenHash(newTokenHash)
                .deviceInfo(request.getDeviceInfo() != null ? request.getDeviceInfo() : tokenRecord.getDeviceInfo())
                .ipAddress(ipAddress)
                .expiresAt(now.plus(REFRESH_TOKEN_LIFESPAN_DAYS, ChronoUnit.DAYS))
                .isRevoked(false)
                .createdAt(now)
                .build();

        newToken = refreshTokenRepository.save(newToken);

        // Mark old token revoked and link to replacement
        tokenRecord.setRevoked(true);
        tokenRecord.setRevokedAt(now);
        tokenRecord.setRevocationReason("ROTATED");
        tokenRecord.setReplacedByTokenId(newToken.getId());

        UserPrincipal principal = UserPrincipal.create(user.getId(), user.getEmail(), user.getRole().name());
        String newAccessToken = jwtTokenProvider.generateAccessToken(principal);

        AuthResponse authResponse = AuthResponse.builder()
                .tokenType("Bearer")
                .accessToken(newAccessToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationSeconds())
                .refreshToken(newRawRefreshToken)
                .user(UserSummaryDto.fromEntity(user))
                .build();

        // Encrypt and cache response payload for 30s concurrent retries
        try {
            String responseJson = objectMapper.writeValueAsString(authResponse);
            String encryptedPayload = tokenEncryptionService.encrypt(responseJson);
            tokenRecord.setCachedResponsePayload(encryptedPayload);
        } catch (Exception ex) {
            log.warn("Could not cache encrypted rotation payload: {}", ex.getMessage());
        }

        refreshTokenRepository.save(tokenRecord);
        return authResponse;
    }

    /**
     * Revokes a specific refresh token session.
     */
    @Transactional
    public void logout(String rawRefreshToken, UserPrincipal principal) {
        if (rawRefreshToken != null && !rawRefreshToken.trim().isEmpty()) {
            String tokenHash = hashToken(rawRefreshToken.trim());
            refreshTokenRepository.findByTokenHashWithLock(tokenHash).ifPresent(token -> {
                if (token.getUser().getId().equals(principal.getId())) {
                    token.setRevoked(true);
                    token.setRevokedAt(Instant.now());
                    token.setRevocationReason("LOGOUT");
                    refreshTokenRepository.save(token);
                    log.info("Revoked refresh session ID {} on user logout", token.getId());
                }
            });
        }
    }

    /**
     * Revokes all active sessions for the authenticated user.
     */
    @Transactional
    public void logoutAll(UserPrincipal principal) {
        int revokedCount = refreshTokenRepository.revokeAllActiveByUserId(principal.getId(), Instant.now(), "LOGOUT_ALL");
        log.info("Revoked all {} active sessions for user {}", revokedCount, principal.getId());
    }

    /**
     * Requests a password reset token. Always returns a generic response to prevent account enumeration.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());

        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getStatus() == UserStatus.ACTIVE) {
                // Invalidate any existing unused reset tokens for this user
                passwordResetTokenRepository.invalidateAllActiveByUserId(user.getId());

                String rawResetToken = generateRawToken();
                String tokenHash = hashToken(rawResetToken);

                PasswordResetToken resetToken = PasswordResetToken.builder()
                        .user(user)
                        .tokenHash(tokenHash)
                        .expiresAt(Instant.now().plus(RESET_TOKEN_LIFESPAN_MINUTES, ChronoUnit.MINUTES))
                        .isUsed(false)
                        .createdAt(Instant.now())
                        .build();

                passwordResetTokenRepository.save(resetToken);
                log.info("Generated password reset token for user ID: {} (Expires in {}m)",
                        user.getId(), RESET_TOKEN_LIFESPAN_MINUTES);

                // Note: Real email provider is not yet configured.
                // Token is kept internal and not logged in plaintext.
            }
        });
    }

    /**
     * Resets a user's password using a verified single-use reset token and revokes all active sessions.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = hashToken(request.getToken().trim());
        Instant now = Instant.now();

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndIsUsedFalseAndExpiresAtAfterWithLock(tokenHash, now)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN",
                        "Password reset token is invalid, expired, or already used."));

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Revoke all active sessions upon password reset
        refreshTokenRepository.revokeAllActiveByUserId(user.getId(), now, "PASSWORD_RESET");
        log.info("Password successfully reset for user ID: {}. All active refresh sessions revoked.", user.getId());
    }

    /**
     * Retrieves the profile summary for the current authenticated principal.
     */
    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        return UserSummaryDto.fromEntity(user);
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    private AuthResponse createSession(User user, String ipAddress, String deviceInfo) {
        Instant now = Instant.now();

        // Enforce maximum 3 active sessions (FIFO eviction) using pessimistic lock query
        List<UserRefreshToken> activeSessions = refreshTokenRepository
                .findAllActiveByUserIdWithLock(user.getId(), now);

        if (activeSessions.size() >= MAX_ACTIVE_SESSIONS) {
            int toEvict = activeSessions.size() - (MAX_ACTIVE_SESSIONS - 1);
            for (int i = 0; i < toEvict; i++) {
                UserRefreshToken oldest = activeSessions.get(i);
                oldest.setRevoked(true);
                oldest.setRevokedAt(now);
                oldest.setRevocationReason("SESSION_LIMIT_EXCEEDED");
                refreshTokenRepository.save(oldest);
                log.info("Evicted oldest active session ID {} for user {} (Limit: {})",
                        oldest.getId(), user.getId(), MAX_ACTIVE_SESSIONS);
            }
        }

        String rawRefreshToken = generateRawToken();
        String tokenHash = hashToken(rawRefreshToken);

        UserRefreshToken refreshToken = UserRefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .expiresAt(now.plus(REFRESH_TOKEN_LIFESPAN_DAYS, ChronoUnit.DAYS))
                .isRevoked(false)
                .createdAt(now)
                .build();

        refreshTokenRepository.save(refreshToken);

        UserPrincipal principal = UserPrincipal.create(user.getId(), user.getEmail(), user.getRole().name());
        String accessToken = jwtTokenProvider.generateAccessToken(principal);

        return AuthResponse.builder()
                .tokenType("Bearer")
                .accessToken(accessToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationSeconds())
                .refreshToken(rawRefreshToken)
                .user(UserSummaryDto.fromEntity(user))
                .build();
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL", "Email cannot be null.");
        }
        return email.trim().toLowerCase();
    }

    private String generateRawToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return HexFormat.of().formatHex(randomBytes);
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }
}
