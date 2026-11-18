package com.acadlytic.modules.outbox.service;

import com.acadlytic.config.OutboxProperties;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.entity.OutboxEmailStatus;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Short-lived transactional operations for claiming, recovering, completing, and retrying outbox rows (ADR-18).
 * Kept strictly separate from SMTP network I/O so EmailSender is NEVER invoked inside a DB transaction.
 */
@Service
public class OutboxBatchClaimService {

    private static final Logger log = LoggerFactory.getLogger(OutboxBatchClaimService.class);

    // ADR-18 exponential backoff schedule: 1m -> 5m -> 15m -> 60m -> 180m
    private static final long[] BACKOFF_MINUTES = {1L, 5L, 15L, 60L, 180L};
    private static final Set<String> SENSITIVE_KEYS = Set.of(
            "token", "resetToken", "verificationToken", "resetLink", "verificationLink", "link");

    private final OutboxEmailRepository outboxEmailRepository;
    private final OutboxProperties outboxProperties;
    private final ObjectMapper objectMapper;

    public OutboxBatchClaimService(
            OutboxEmailRepository outboxEmailRepository,
            OutboxProperties outboxProperties,
            ObjectMapper objectMapper) {
        this.outboxEmailRepository = outboxEmailRepository;
        this.outboxProperties = outboxProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recoverStaleProcessing(Instant now) {
        Instant cutoff = now.minus(Duration.ofMinutes(outboxProperties.getStaleProcessingMinutes()));
        List<OutboxEmail> stale = outboxEmailRepository.findByStatusAndLockedAtBefore(OutboxEmailStatus.PROCESSING, cutoff);
        if (stale.isEmpty()) {
            return 0;
        }
        for (OutboxEmail email : stale) {
            int nextAttempts = email.getAttemptCount() + 1;
            email.setAttemptCount(nextAttempts);
            email.setLockedAt(null);
            email.setLastError("Recovered from stale PROCESSING lock");
            if (nextAttempts >= email.getMaxAttempts()) {
                email.setStatus(OutboxEmailStatus.FAILED_PERMANENT);
                email.setPayloadJson(scrubSensitiveTokens(email.getPayloadJson()));
                log.error("Outbox email id={} transitioned to FAILED_PERMANENT after stale lock recovery", email.getId());
            } else {
                email.setStatus(OutboxEmailStatus.PENDING);
                email.setNextAttemptAt(now.plus(computeBackoff(nextAttempts)));
            }
        }
        outboxEmailRepository.saveAll(stale);
        return stale.size();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<OutboxEmail> claimDueBatch(Instant now) {
        List<OutboxEmail> due = outboxEmailRepository.claimDueBatchForUpdateSkipLocked(
                now, outboxProperties.getBatchSize());
        if (due.isEmpty()) {
            return List.of();
        }
        for (OutboxEmail email : due) {
            email.setStatus(OutboxEmailStatus.PROCESSING);
            email.setLockedAt(now);
        }
        return outboxEmailRepository.saveAll(due);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markSentAndScrub(Long outboxEmailId, Instant now) {
        outboxEmailRepository.findById(outboxEmailId).ifPresent(email -> {
            email.setStatus(OutboxEmailStatus.SENT);
            email.setSentAt(now);
            email.setLockedAt(null);
            email.setLastError(null);
            email.setPayloadJson(scrubSensitiveTokens(email.getPayloadJson()));
            outboxEmailRepository.save(email);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailureAndScheduleRetry(Long outboxEmailId, String errorReason, Instant now) {
        outboxEmailRepository.findById(outboxEmailId).ifPresent(email -> {
            int attempts = email.getAttemptCount() + 1;
            email.setAttemptCount(attempts);
            email.setLockedAt(null);
            email.setLastError(truncateSafeError(errorReason));

            if (attempts >= email.getMaxAttempts()) {
                email.setStatus(OutboxEmailStatus.FAILED_PERMANENT);
                email.setPayloadJson(scrubSensitiveTokens(email.getPayloadJson()));
                log.error("Outbox email id={} eventType={} reached FAILED_PERMANENT after {} attempts",
                        email.getId(), email.getEventType(), attempts);
            } else {
                email.setStatus(OutboxEmailStatus.PENDING);
                email.setNextAttemptAt(now.plus(computeBackoff(attempts)));
            }
            outboxEmailRepository.save(email);
        });
    }

    public Duration computeBackoff(int attemptNumber) {
        int index = Math.max(0, Math.min(attemptNumber - 1, BACKOFF_MINUTES.length - 1));
        return Duration.ofMinutes(BACKOFF_MINUTES[index]);
    }

    public String scrubSensitiveTokens(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return "{}";
        }
        try {
            Map<String, Object> map = objectMapper.readValue(payloadJson, new TypeReference<>() {});
            Map<String, Object> scrubbed = new LinkedHashMap<>();
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (SENSITIVE_KEYS.contains(entry.getKey())) {
                    scrubbed.put(entry.getKey(), "[REDACTED]");
                } else {
                    scrubbed.put(entry.getKey(), entry.getValue());
                }
            }
            return objectMapper.writeValueAsString(scrubbed);
        } catch (Exception ex) {
            return "{\"redacted\":true}";
        }
    }

    private String truncateSafeError(String errorReason) {
        if (errorReason == null || errorReason.isBlank()) {
            return "Email dispatch failed";
        }
        String sanitized = errorReason.replaceAll("[\\r\\n]+", " ").trim();
        return sanitized.length() > 950 ? sanitized.substring(0, 950) : sanitized;
    }
}
