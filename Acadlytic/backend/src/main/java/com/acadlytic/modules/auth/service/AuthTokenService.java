package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.AuthToken;
import com.acadlytic.modules.auth.entity.AuthTokenType;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Generates, hashes (SHA-256), stores, revokes, and consumes single-use authentication tokens.
 * Raw tokens are never persisted in auth_tokens and never logged.
 */
@Service
public class AuthTokenService {

    private static final int TOKEN_BYTE_LENGTH = 32;

    private final AuthTokenRepository authTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthTokenService(AuthTokenRepository authTokenRepository) {
        this.authTokenRepository = authTokenRepository;
    }

    @Transactional
    public String issueToken(Long userId, AuthTokenType tokenType, String targetEmail, Duration ttl) {
        Instant now = Instant.now();
        authTokenRepository.revokeActiveTokensForUser(userId, tokenType, now);

        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        AuthToken token = new AuthToken();
        token.setUserId(userId);
        token.setTokenType(tokenType);
        token.setTokenHash(sha256Hex(rawToken));
        token.setTargetEmail(targetEmail);
        token.setExpiresAt(now.plus(ttl));
        authTokenRepository.save(token);

        return rawToken;
    }

    @Transactional
    public AuthToken consumeToken(String rawToken, AuthTokenType expectedType) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AppException(
                    "INVALID_OR_EXPIRED_TOKEN",
                    "The token is invalid or has expired.",
                    HttpStatus.BAD_REQUEST);
        }

        String hash = sha256Hex(rawToken.trim());
        AuthToken token = authTokenRepository.findByTokenHashAndTokenType(hash, expectedType)
                .orElseThrow(() -> new AppException(
                        "INVALID_OR_EXPIRED_TOKEN",
                        "The token is invalid or has expired.",
                        HttpStatus.BAD_REQUEST));

        Instant now = Instant.now();
        if (!token.isRedeemable(now)) {
            throw new AppException(
                    "INVALID_OR_EXPIRED_TOKEN",
                    "The token is invalid or has expired.",
                    HttpStatus.BAD_REQUEST);
        }

        token.setUsedAt(now);
        return authTokenRepository.save(token);
    }

    @Transactional
    public AuthToken lockAndValidateToken(String rawToken, AuthTokenType expectedType) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AppException(
                    "INVALID_OR_EXPIRED_TOKEN",
                    "The token is invalid or has expired.",
                    HttpStatus.BAD_REQUEST);
        }

        String hash = sha256Hex(rawToken.trim());
        AuthToken token = authTokenRepository.findByTokenHashAndTokenTypeForUpdate(hash, expectedType)
                .orElseThrow(() -> new AppException(
                        "INVALID_OR_EXPIRED_TOKEN",
                        "The token is invalid or has expired.",
                        HttpStatus.BAD_REQUEST));

        Instant now = Instant.now();
        if (!token.isRedeemable(now)) {
            throw new AppException(
                    "INVALID_OR_EXPIRED_TOKEN",
                    "The token is invalid or has expired.",
                    HttpStatus.BAD_REQUEST);
        }

        return token;
    }

    @Transactional
    public AuthToken markTokenUsed(AuthToken token) {
        token.setUsedAt(Instant.now());
        return authTokenRepository.save(token);
    }

    @Transactional
    public int revokeActiveTokensForUser(Long userId, AuthTokenType tokenType, Instant now) {
        return authTokenRepository.revokeActiveTokensForUser(userId, tokenType, now);
    }

    public String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }
}
