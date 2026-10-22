package com.resultpoint.common.util;

import java.security.SecureRandom;
import java.util.Objects;
import java.util.UUID;

/**
 * Standard Alphanumeric Surrogate Identifier Generator for ResultPoint entities with VARCHAR(64) Primary Keys.
 *
 * Format: {prefix}_{compact_uuid}
 * Total Length: 4 to 8 char prefix + 1 separator + 32 char hex = <= 41 characters (well within VARCHAR(64)).
 *
 * Guarantees:
 * 1. Global uniqueness via Type-4 pseudo-random UUIDs.
 * 2. High entropy and URL-safe characters (alphanumeric + underscore).
 * 3. Human-readable domain categorization (e.g., usr_..., sem_..., goal_...).
 */
public final class IdGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private IdGenerator() {
        // Utility class
    }

    /**
     * Generates a unique prefixed identifier.
     *
     * @param prefix Lowercase domain prefix (e.g. "usr", "sem", "goal", "prof", "calc")
     * @return Alphanumeric identifier fitting within VARCHAR(64)
     */
    public static String generate(String prefix) {
        Objects.requireNonNull(prefix, "Prefix cannot be null");
        String cleanPrefix = prefix.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
        if (cleanPrefix.isEmpty() || cleanPrefix.length() > 20) {
            throw new IllegalArgumentException("Prefix must be between 1 and 20 alphanumeric characters");
        }

        String compactUuid = UUID.randomUUID().toString().replace("-", "");
        return cleanPrefix + "_" + compactUuid;
    }

    /**
     * Convenience helpers for canonical domains.
     */
    public static String generateUserId() {
        return generate("usr");
    }

    public static String generateSemesterResultId() {
        return generate("sem");
    }

    public static String generateGoalId() {
        return generate("goal");
    }

    public static String generateStudentProfileId() {
        return generate("prof");
    }

    public static String generateSavedCalculationId() {
        return generate("calc");
    }

    public static String generateNotificationId() {
        return generate("notif");
    }

    public static String generateSupportTicketId() {
        // Alphanumeric tracking ticket: RP-TICK-XXXXXX
        return "RP-TICK-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase()
                + "-" + (1000 + RANDOM.nextInt(9000));
    }

    public static String generateUniversityId() {
        return generate("uni");
    }

    public static String generateCourseId() {
        return generate("course");
    }

    public static String generateRegulationId() {
        return generate("reg");
    }

    public static String generateSubjectId() {
        return generate("sub");
    }

    public static String generateGradingScaleId() {
        return generate("scale");
    }

    public static String generateGradeBoundaryId() {
        return generate("gb");
    }

    public static String generateCalculationRuleId() {
        return generate("rule");
    }
}
