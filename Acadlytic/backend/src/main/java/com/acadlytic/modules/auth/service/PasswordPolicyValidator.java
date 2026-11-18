package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.AppException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Enforces the finalized Acadlytic password policy:
 * - 12 to 128 characters
 * - Rejects common and compromised passwords from the curated denylist
 * - Rejects passwords containing the user's email address
 * Never logs the submitted password.
 */
@Component
public class PasswordPolicyValidator {

    public static final int MIN_LENGTH = 12;
    public static final int MAX_LENGTH = 128;

    private final Set<String> commonPasswords;

    public PasswordPolicyValidator() {
        this.commonPasswords = loadCommonPasswords("security/common-passwords.txt");
    }

    public void validate(String rawPassword, String email) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new AppException(
                    "PASSWORD_POLICY_VIOLATION",
                    "Password must be between 12 and 128 characters.",
                    HttpStatus.BAD_REQUEST);
        }

        int length = rawPassword.length();
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            throw new AppException(
                    "PASSWORD_POLICY_VIOLATION",
                    "Password must be between 12 and 128 characters.",
                    HttpStatus.BAD_REQUEST);
        }

        String normalized = rawPassword.trim().toLowerCase(Locale.ROOT);
        if (commonPasswords.contains(normalized)) {
            throw new AppException(
                    "PASSWORD_POLICY_VIOLATION",
                    "This password is too common or has appeared in known breaches. Please choose a stronger password.",
                    HttpStatus.BAD_REQUEST);
        }

        if (email != null && !email.isBlank()) {
            String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
            if (normalized.equals(normalizedEmail) || normalized.contains(normalizedEmail)) {
                throw new AppException(
                        "PASSWORD_POLICY_VIOLATION",
                        "Password must not contain your email address.",
                        HttpStatus.BAD_REQUEST);
            }
        }
    }

    private Set<String> loadCommonPasswords(String resourcePath) {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        if (!resource.exists()) {
            return Collections.emptySet();
        }
        Set<String> loaded = new HashSet<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim().toLowerCase(Locale.ROOT);
                if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                    loaded.add(trimmed);
                }
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load common password denylist", ex);
        }
        return Collections.unmodifiableSet(loaded);
    }
}
