package com.resultpoint.modules.calculation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "grade_boundaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeBoundary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grading_scale_id", nullable = false)
    private GradingScale gradingScale;

    @Column(name = "grade_letter", length = 10, nullable = false)
    private String gradeLetter;

    @Column(name = "grade_points", precision = 4, scale = 2, nullable = false)
    private BigDecimal gradePoints;

    @Column(name = "min_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal minPercentage;

    @Column(name = "max_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal maxPercentage;

    @Column(name = "qualitative_desc", length = 60, nullable = false)
    private String qualitativeDesc;

    @Column(name = "is_pass", nullable = false)
    @Builder.Default
    private boolean isPass = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
