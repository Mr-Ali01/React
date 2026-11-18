package com.acadlytic.modules.outbox.service;

import com.acadlytic.config.OutboxProperties;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.entity.OutboxEmailStatus;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OutboxEmailWorkerUnitTest {

    @Mock
    private OutboxEmailRepository repository;
    @Mock
    private EmailSender emailSender;

    private OutboxBatchClaimService claimService;
    private OutboxEmailWorker worker;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        OutboxProperties properties = new OutboxProperties();
        claimService = new OutboxBatchClaimService(repository, properties, objectMapper);
        EmailTemplateRenderer renderer = new EmailTemplateRenderer(objectMapper, "http://localhost:5173");
        worker = new OutboxEmailWorker(claimService, renderer, emailSender);
    }

    @Test
    void computesExponentialBackoffScheduleMatchingAdr18() {
        assertThat(claimService.computeBackoff(1)).isEqualTo(Duration.ofMinutes(1));
        assertThat(claimService.computeBackoff(2)).isEqualTo(Duration.ofMinutes(5));
        assertThat(claimService.computeBackoff(3)).isEqualTo(Duration.ofMinutes(15));
        assertThat(claimService.computeBackoff(4)).isEqualTo(Duration.ofMinutes(60));
        assertThat(claimService.computeBackoff(5)).isEqualTo(Duration.ofMinutes(180));
    }

    @Test
    void scrubsSensitiveTokensFromPayloadJson() {
        String scrubbed = claimService.scrubSensitiveTokens(
                "{\"firstName\":\"Ada\",\"token\":\"super-secret-reset-token\"}");

        assertThat(scrubbed).contains("Ada");
        assertThat(scrubbed).contains("[REDACTED]");
        assertThat(scrubbed).doesNotContain("super-secret-reset-token");
    }

    @Test
    void transitionsToFailedPermanentAndScrubsTokenOnFifthFailure() {
        OutboxEmail email = new OutboxEmail();
        email.setId(42L);
        email.setEventType("PASSWORD_RESET_REQUESTED");
        email.setRecipientEmail("admin@college.edu");
        email.setSubject("Reset");
        email.setTemplateKey("PASSWORD_RESET");
        email.setPayloadJson("{\"firstName\":\"Ada\",\"token\":\"secret-reset-token\"}");
        email.setAttemptCount(4);
        email.setMaxAttempts(5);
        email.setStatus(OutboxEmailStatus.PENDING);

        Instant now = Instant.now();
        when(repository.findByStatusAndLockedAtBefore(any(), any())).thenReturn(List.of());
        when(repository.claimDueBatchForUpdateSkipLocked(now, 20)).thenReturn(List.of(email));
        when(repository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repository.findById(42L)).thenReturn(Optional.of(email));
        doThrow(new RuntimeException("SMTP connection refused")).when(emailSender).send(any());

        worker.processBatch(now);

        assertThat(email.getStatus()).isEqualTo(OutboxEmailStatus.FAILED_PERMANENT);
        assertThat(email.getAttemptCount()).isEqualTo(5);
        assertThat(email.getPayloadJson()).doesNotContain("secret-reset-token");
        assertThat(email.getPayloadJson()).contains("[REDACTED]");
        verify(repository).save(email);
    }
}
