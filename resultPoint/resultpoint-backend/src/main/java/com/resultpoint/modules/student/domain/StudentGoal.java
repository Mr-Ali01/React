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
@Table(name = "student_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentGoal {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Column(name = "target_cgpa", precision = 4, scale = 2, nullable = false)
    private BigDecimal targetCgpa;

    @Column(name = "target_semester", nullable = false)
    @JdbcTypeCode(Types.TINYINT)
    private int targetSemester;

    @Column(name = "required_sgpa", precision = 4, scale = 2, nullable = false)
    private BigDecimal requiredSgpa;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.CHAR)
    @Column(name = "feasibility_status", nullable = false)
    private FeasibilityStatus feasibilityStatus;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
