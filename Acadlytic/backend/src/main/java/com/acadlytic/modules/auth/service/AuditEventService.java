package com.acadlytic.modules.auth.service;

import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Records immutable authentication and security audit events.
 * Actively strips sensitive keys (passwords, hashes, tokens, session IDs, secrets)
 * so credentials can never leak into audit_events.
 */
@Service
public class AuditEventService {

    private static final Set<String> FORBIDDEN_KEY_SUBSTRINGS = Set.of(
            "password", "token", "secret", "sessionid", "cookie", "csrf", "hash");

    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public AuditEventService(AuditEventRepository auditEventRepository, ObjectMapper objectMapper) {
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public AuditEvent record(
            AuditEventType eventType,
            Long actorUserId,
            Role actorRole,
            Long targetUserId,
            Long collegeId,
            AuditOutcome outcome,
            String ipAddress,
            Map<String, Object> metadata) {
        return persistEvent(eventType, actorUserId, actorRole, targetUserId, collegeId, outcome, ipAddress, metadata);
    }

    /**
     * Persists security failure/denial audit events in an independent transaction so they
     * are preserved even when the calling operation throws an exception.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditEvent recordIndependently(
            AuditEventType eventType,
            Long actorUserId,
            Role actorRole,
            Long targetUserId,
            Long collegeId,
            AuditOutcome outcome,
            String ipAddress,
            Map<String, Object> metadata) {
        return persistEvent(eventType, actorUserId, actorRole, targetUserId, collegeId, outcome, ipAddress, metadata);
    }

    private AuditEvent persistEvent(
            AuditEventType eventType,
            Long actorUserId,
            Role actorRole,
            Long targetUserId,
            Long collegeId,
            AuditOutcome outcome,
            String ipAddress,
            Map<String, Object> metadata) {
        AuditEvent event = new AuditEvent();
        event.setEventType(eventType);
        event.setActorUserId(actorUserId);
        event.setActorRole(actorRole);
        event.setTargetUserId(targetUserId);
        event.setCollegeId(collegeId);
        event.setOutcome(outcome);
        event.setIpAddress(ipAddress);
        event.setMetadataJson(sanitizeAndSerialize(metadata));
        return auditEventRepository.save(event);
    }

    private String sanitizeAndSerialize(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        Map<String, Object> sanitized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : metadata.entrySet()) {
            String key = entry.getKey();
            if (key == null || isForbiddenKey(key)) {
                continue;
            }
            sanitized.put(key, entry.getValue());
        }
        if (sanitized.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(sanitized);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private boolean isForbiddenKey(String key) {
        String lower = key.toLowerCase(Locale.ROOT);
        for (String forbidden : FORBIDDEN_KEY_SUBSTRINGS) {
            if (lower.contains(forbidden)) {
                return true;
            }
        }
        return false;
    }
}
