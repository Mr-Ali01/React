package com.resultpoint.security.jwt;

import com.resultpoint.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * High-entropy JWT Token Provider using JJWT 0.12.6.
 * Signs, validates, and extracts claims from stateless JSON Web Tokens.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${resultpoint.jwt.secret}")
    private String jwtSecret;

    @Value("${resultpoint.jwt.access-token-expiration-seconds:900}")
    private long accessTokenExpirationSeconds;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: JWT signing secret 'resultpoint.jwt.secret' is unconfigured.");
        }

        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("FATAL: JWT signing secret must be at least 256 bits (32 bytes) for HS256.");
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JwtTokenProvider initialized with HS256 HMAC key (Token lifespan: {}s)", accessTokenExpirationSeconds);
    }

    /**
     * Generates a signed stateless access token.
     *
     * @param principal Authenticated user principal
     * @return Compact JWT string
     */
    public String generateAccessToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (accessTokenExpirationSeconds * 1000));

        return Jwts.builder()
                .subject(principal.getId())
                .claim("email", principal.getEmail())
                .claim("role", principal.getRole())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Validates a JWT string for signature integrity and expiration.
     *
     * @param token JWT string
     * @return true if valid, false if expired, malformed, or tampered
     */
    public boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.warn("Invalid JWT signature or format: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.debug("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("Empty or null JWT claims string: {}", ex.getMessage());
        }
        return false;
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUserIdFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).get("email", String.class);
    }

    public String getRoleFromToken(String token) {
        return getClaims(token).get("role", String.class);
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationSeconds;
    }
}
