package com.acadlytic.modules.auth.service;

import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.AuditOutcome;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditEventServiceUnitTest {

    @Mock
    private AuditEventRepository auditEventRepository;

    @Test
    void stripsSensitiveKeysFromAuditMetadata() {
        when(auditEventRepository.save(any(AuditEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        AuditEventService service = new AuditEventService(auditEventRepository, new ObjectMapper());

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("email", "admin@college.edu");
        metadata.put("password", "SecretPass123!");
        metadata.put("passwordHash", "$2a$12$hash");
        metadata.put("resetToken", "raw-token-value");
        metadata.put("sessionId", "session-123");
        metadata.put("csrfToken", "csrf-xyz");
        metadata.put("reason", "INVALID_PASSWORD");

        service.record(
                AuditEventType.LOGIN_FAILURE,
                1L,
                Role.COLLEGE_ADMIN,
                1L,
                10L,
                AuditOutcome.FAILURE,
                "127.0.0.1",
                metadata);

        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(auditEventRepository).save(captor.capture());
        String json = captor.getValue().getMetadataJson();
        assertThat(json).contains("admin@college.edu");
        assertThat(json).contains("INVALID_PASSWORD");
        assertThat(json).doesNotContain("SecretPass123!");
        assertThat(json).doesNotContain("$2a$12$hash");
        assertThat(json).doesNotContain("raw-token-value");
        assertThat(json).doesNotContain("session-123");
        assertThat(json).doesNotContain("csrf-xyz");
    }
}
