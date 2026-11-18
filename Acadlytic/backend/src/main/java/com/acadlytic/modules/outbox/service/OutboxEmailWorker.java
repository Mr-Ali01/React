package com.acadlytic.modules.outbox.service;

import com.acadlytic.modules.outbox.entity.OutboxEmail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Scheduled transactional outbox worker (ADR-18).
 * Polls every 10 seconds, recovers stale PROCESSING locks, claims a batch via FOR UPDATE SKIP LOCKED,
 * and dispatches emails through EmailSender strictly OUTSIDE database transactions.
 */
@Component
public class OutboxEmailWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxEmailWorker.class);

    private final OutboxBatchClaimService claimService;
    private final EmailTemplateRenderer templateRenderer;
    private final EmailSender emailSender;

    public OutboxEmailWorker(
            OutboxBatchClaimService claimService,
            EmailTemplateRenderer templateRenderer,
            EmailSender emailSender) {
        this.claimService = claimService;
        this.templateRenderer = templateRenderer;
        this.emailSender = emailSender;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:10000}")
    public void pollAndProcess() {
        processBatch(Instant.now());
    }

    public int processBatch(Instant now) {
        int recovered = claimService.recoverStaleProcessing(now);
        if (recovered > 0) {
            log.warn("Recovered {} stale PROCESSING outbox email(s)", recovered);
        }

        List<OutboxEmail> claimed = claimService.claimDueBatch(now);
        int processedCount = 0;

        for (OutboxEmail email : claimed) {
            processedCount++;
            try {
                String body = templateRenderer.renderBody(email.getTemplateKey(), email.getPayloadJson());
                // Strictly outside any database transaction (ADR-18)
                emailSender.send(new EmailMessage(email.getRecipientEmail(), email.getSubject(), body));
                claimService.markSentAndScrub(email.getId(), Instant.now());
            } catch (Exception ex) {
                log.warn("Failed to deliver outbox email id={} eventType={}: {}",
                        email.getId(), email.getEventType(), ex.getClass().getSimpleName());
                claimService.markFailureAndScheduleRetry(email.getId(), ex.getMessage(), Instant.now());
            }
        }
        return processedCount;
    }
}
