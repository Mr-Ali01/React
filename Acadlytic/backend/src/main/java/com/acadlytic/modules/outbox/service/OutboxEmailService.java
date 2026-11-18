package com.acadlytic.modules.outbox.service;

import com.acadlytic.config.OutboxProperties;
import com.acadlytic.modules.outbox.entity.OutboxEmail;
import com.acadlytic.modules.outbox.entity.OutboxEmailStatus;
import com.acadlytic.modules.outbox.repository.OutboxEmailRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

/**
 * Enqueues outbound emails inside the caller's database transaction (ADR-18).
 */
@Service
public class OutboxEmailService {

    private final OutboxEmailRepository outboxEmailRepository;
    private final OutboxProperties outboxProperties;
    private final ObjectMapper objectMapper;

    public OutboxEmailService(
            OutboxEmailRepository outboxEmailRepository,
            OutboxProperties outboxProperties,
            ObjectMapper objectMapper) {
        this.outboxEmailRepository = outboxEmailRepository;
        this.outboxProperties = outboxProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public OutboxEmail enqueue(
            String eventType,
            String recipientEmail,
            String subject,
            String templateKey,
            Map<String, Object> payload) {
        OutboxEmail email = new OutboxEmail();
        email.setEventType(eventType);
        email.setRecipientEmail(recipientEmail);
        email.setSubject(subject);
        email.setTemplateKey(templateKey);
        email.setPayloadJson(serializePayload(payload));
        email.setStatus(OutboxEmailStatus.PENDING);
        email.setAttemptCount(0);
        email.setMaxAttempts(outboxProperties.getMaxAttempts());
        email.setNextAttemptAt(Instant.now());
        return outboxEmailRepository.save(email);
    }

    private String serializePayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize outbox email payload", ex);
        }
    }
}
