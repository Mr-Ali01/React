package com.acadlytic.modules.outbox.repository;

import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.entity.OutboxEmailStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OutboxEmailRepository extends JpaRepository<OutboxEmail, Long> {

    @Query(value = "SELECT * FROM outbox_emails "
            + "WHERE status = 'PENDING' AND next_attempt_at <= :now "
            + "ORDER BY next_attempt_at ASC, id ASC "
            + "LIMIT :batchSize "
            + "FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<OutboxEmail> claimDueBatchForUpdateSkipLocked(
            @Param("now") Instant now,
            @Param("batchSize") int batchSize);

    List<OutboxEmail> findByStatusAndLockedAtBefore(OutboxEmailStatus status, Instant staleCutoff);

    List<OutboxEmail> findByRecipientEmailOrderByIdDesc(String recipientEmail);
}
