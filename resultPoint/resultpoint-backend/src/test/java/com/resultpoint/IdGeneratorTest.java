package com.resultpoint;

import com.resultpoint.common.util.IdGenerator;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

public class IdGeneratorTest {

    @Test
    void testPrefixAndLengthGuarantees() {
        String userId = IdGenerator.generateUserId();
        Assertions.assertTrue(userId.startsWith("usr_"), "User ID must start with 'usr_'");
        Assertions.assertTrue(userId.length() <= 64, "User ID must fit within VARCHAR(64)");

        String semId = IdGenerator.generateSemesterResultId();
        Assertions.assertTrue(semId.startsWith("sem_"), "Semester ID must start with 'sem_'");
        Assertions.assertTrue(semId.length() <= 64, "Semester ID must fit within VARCHAR(64)");

        String goalId = IdGenerator.generateGoalId();
        Assertions.assertTrue(goalId.startsWith("goal_"), "Goal ID must start with 'goal_'");
        Assertions.assertTrue(goalId.length() <= 64, "Goal ID must fit within VARCHAR(64)");

        String ticketId = IdGenerator.generateSupportTicketId();
        Assertions.assertTrue(ticketId.startsWith("RP-TICK-"), "Support ticket must start with 'RP-TICK-'");
        Assertions.assertTrue(ticketId.length() <= 64, "Ticket ID must fit within VARCHAR(64)");
    }

    @Test
    void testUniquenessAcrossLargeBatch() {
        int count = 10000;
        Set<String> uniqueIds = new HashSet<>(count);

        for (int i = 0; i < count; i++) {
            String id = IdGenerator.generate("calc");
            Assertions.assertTrue(uniqueIds.add(id), "Collision detected for generated ID: " + id);
        }

        Assertions.assertEquals(count, uniqueIds.size(), "All 10,000 IDs must be distinct");
    }

    @Test
    void testPrefixValidation() {
        Assertions.assertThrows(NullPointerException.class, () -> IdGenerator.generate(null));
        Assertions.assertThrows(IllegalArgumentException.class, () -> IdGenerator.generate(""));
        Assertions.assertThrows(IllegalArgumentException.class, () -> IdGenerator.generate("   "));
        Assertions.assertThrows(IllegalArgumentException.class, () -> IdGenerator.generate("this_prefix_is_way_too_long_for_a_compact_identifier"));
    }
}
