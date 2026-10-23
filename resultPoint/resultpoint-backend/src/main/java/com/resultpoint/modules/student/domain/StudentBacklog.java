package com.resultpoint.modules.student.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.Instant;

@Entity
@Table(name = "student_backlogs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentBacklog {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Column(name = "subject_code", length = 30, nullable = false)
    private String subjectCode;

    @Column(name = "subject_name", length = 200, nullable = false)
    private String subjectName;

    @Column(name = "semester_number", nullable = false)
    @JdbcTypeCode(Types.TINYINT)
    private int semesterNumber;

    @Column(name = "credits", precision = 4, scale = 2, nullable = false)
    private BigDecimal credits;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.CHAR)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private BacklogStatus status = BacklogStatus.ACTIVE;

    @Column(name = "cleared_in_period", length = 50)
    private String clearedInPeriod;

    @Column(name = "cleared_grade", length = 10)
    private String clearedGrade;

    @Column(name = "cleared_at")
    private Instant clearedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
