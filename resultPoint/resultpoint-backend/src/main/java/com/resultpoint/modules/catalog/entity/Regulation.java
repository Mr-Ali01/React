package com.resultpoint.modules.catalog.entity;

import com.resultpoint.modules.calculation.entity.CalculationRule;
import com.resultpoint.modules.calculation.entity.GradingScale;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "regulations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Regulation {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "code", length = 30, nullable = false)
    private String code;

    @Column(name = "name", length = 150, nullable = false)
    private String name;

    @Column(name = "rule_version", length = 50, nullable = false)
    private String ruleVersion;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    @Column(name = "verification_status", nullable = false)
    @Builder.Default
    private RegulationVerificationStatus verificationStatus = RegulationVerificationStatus.VERIFIED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grading_scale_id", nullable = false)
    private GradingScale gradingScale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calculation_rule_id", nullable = false)
    private CalculationRule calculationRule;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private RegulationStatus status = RegulationStatus.ACTIVE;

    @OneToMany(mappedBy = "regulation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AdmissionBatch> admissionBatches = new ArrayList<>();

    @OneToMany(mappedBy = "regulation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("semesterNumber ASC, displayOrder ASC")
    @Builder.Default
    private List<RegulationSubject> regulationSubjects = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
