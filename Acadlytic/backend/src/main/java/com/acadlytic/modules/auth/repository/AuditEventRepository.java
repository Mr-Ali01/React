package com.acadlytic.modules.auth.repository;

import com.acadlytic.modules.auth.entity.AuditEvent;
import com.acadlytic.modules.auth.entity.AuditEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

    List<AuditEvent> findByEventTypeOrderByCreatedAtDesc(AuditEventType eventType);

    List<AuditEvent> findByActorUserIdOrderByCreatedAtDesc(Long actorUserId);

    List<AuditEvent> findByCollegeId(Long collegeId);
}
