package com.acadlytic.modules.outbox;

import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.entity.OutboxEmailStatus;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.acadlytic.modules.outbox.service.EmailMessage;
import com.acadlytic.modules.outbox.service.OutboxEmailService;
import com.acadlytic.modules.outbox.service.OutboxEmailWorker;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;

class OutboxWorkerIntegrationTest extends AbstractMySqlIntegrationTest {

    @Autowired
    private OutboxEmailService outboxEmailService;
    @Autowired
    private OutboxEmailWorker outboxEmailWorker;
    @Autowired
    private OutboxEmailRepository outboxEmailRepository;

    @BeforeEach
    void cleanOutbox() {
        outboxEmailRepository.deleteAll();
        reset(emailSender);
    }

    @Test
    void claimsViaSkipLockedSendsOutsideTxAndScrubsTokenOnSuccess() {
        doNothing().when(emailSender).send(any(EmailMessage.class));

        OutboxEmail queued = outboxEmailService.enqueue(
                "PASSWORD_RESET_REQUESTED",
                "user@college.edu",
                "Reset your Acadlytic password",
                "PASSWORD_RESET",
                Map.of("firstName", "Ada", "token", "top-secret-reset-token-123"));

        int processed = outboxEmailWorker.processBatch(Instant.now().plusSeconds(5));
        assertThat(processed).isEqualTo(1);

        ArgumentCaptor<EmailMessage> messageCaptor = ArgumentCaptor.forClass(EmailMessage.class);
        verify(emailSender).send(messageCaptor.capture());
        assertThat(messageCaptor.getValue().to()).isEqualTo("user@college.edu");
        assertThat(messageCaptor.getValue().body()).contains("top-secret-reset-token-123");

        OutboxEmail updated = outboxEmailRepository.findById(queued.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboxEmailStatus.SENT);
        assertThat(updated.getSentAt()).isNotNull();
        assertThat(updated.getLockedAt()).isNull();
        // Raw token must be scrubbed after successful send (ADR-18)
        assertThat(updated.getPayloadJson()).doesNotContain("top-secret-reset-token-123");
        assertThat(updated.getPayloadJson()).contains("[REDACTED]");
    }

    @Test
    void recoversStaleProcessingRowsAndRetriesWithBackoffUntilFailedPermanent() {
        OutboxEmail stale = new OutboxEmail();
        stale.setEventType("PASSWORD_RESET_REQUESTED");
        stale.setRecipientEmail("stale@college.edu");
        stale.setSubject("Reset");
        stale.setTemplateKey("PASSWORD_RESET");
        stale.setPayloadJson("{\"firstName\":\"Ada\",\"token\":\"stale-secret-token\"}");
        stale.setStatus(OutboxEmailStatus.PROCESSING);
        stale.setAttemptCount(0);
        stale.setMaxAttempts(5);
        stale.setNextAttemptAt(Instant.now().minusSeconds(600));
        stale.setLockedAt(Instant.now().minus(Duration.ofMinutes(10)));
        stale = outboxEmailRepository.saveAndFlush(stale);

        // Stale row (>5 min) is recovered back to PENDING with attemptCount=1 and nextAttemptAt=+1m
        outboxEmailWorker.processBatch(Instant.now());

        OutboxEmail recovered = outboxEmailRepository.findById(stale.getId()).orElseThrow();
        assertThat(recovered.getStatus()).isEqualTo(OutboxEmailStatus.PENDING);
        assertThat(recovered.getAttemptCount()).isEqualTo(1);
        assertThat(recovered.getLockedAt()).isNull();

        // Simulate persistent SMTP failure until maxAttempts=5 -> FAILED_PERMANENT + token scrubbed
        doThrow(new RuntimeException("SMTP unreachable")).when(emailSender).send(any(EmailMessage.class));
        Instant future = Instant.now().plus(Duration.ofHours(10));
        for (int i = 0; i < 4; i++) {
            future = future.plus(Duration.ofHours(4));
            outboxEmailWorker.processBatch(future);
        }

        OutboxEmail terminal = outboxEmailRepository.findById(stale.getId()).orElseThrow();
        assertThat(terminal.getStatus()).isEqualTo(OutboxEmailStatus.FAILED_PERMANENT);
        assertThat(terminal.getAttemptCount()).isEqualTo(5);
        assertThat(terminal.getPayloadJson()).doesNotContain("stale-secret-token");
        assertThat(terminal.getPayloadJson()).contains("[REDACTED]");
    }
}
