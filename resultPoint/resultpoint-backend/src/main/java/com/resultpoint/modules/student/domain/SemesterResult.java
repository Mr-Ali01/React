package com.resultpoint.modules.student.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "semester_results", uniqueConstraints = {
        @UniqueConstraint(name = "uq_student_sem_result", columnNames = {"student_profile_id", "semester_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterResult {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Column(name = "semester_number", nullable = false)
    @JdbcTypeCode(Types.TINYINT)
    private int semesterNumber;

    @Column(name = "academic_period", length = 50, nullable = false)
    private String academicPeriod;

    @Column(name = "total_credits", precision = 5, scale = 1, nullable = false)
    private BigDecimal totalCredits;

    @Column(name = "credits_earned", precision = 5, scale = 1, nullable = false)
    private BigDecimal creditsEarned;

    @Column(name = "sgpa", precision = 4, scale = 2, nullable = false)
    private BigDecimal sgpa;

    @Column(name = "cgpa", precision = 4, scale = 2, nullable = false)
    private BigDecimal cgpa;

    @Column(name = "equivalent_percentage", precision = 5, scale = 2)
    private BigDecimal equivalentPercentage;

    @Column(name = "standing_status", length = 50, nullable = false)
    private String standingStatus;

    @Column(name = "rule_version_snapshot", length = 60, nullable = false)
    private String ruleVersionSnapshot;

    @Column(name = "grading_scale_snapshot_json", nullable = false, columnDefinition = "json")
    @JdbcTypeCode(SqlTypes.JSON)
    private String gradingScaleSnapshotJson;

    @Column(name = "calculation_rule_snapshot_json", nullable = false, columnDefinition = "json")
    @JdbcTypeCode(SqlTypes.JSON)
    private String calculationRuleSnapshotJson;

    @OneToMany(mappedBy = "semesterResult", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SubjectResult> subjects = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
