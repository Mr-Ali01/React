package com.resultpoint.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "regulation_subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegulationSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "regulation_id", nullable = false)
    private Regulation regulation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.TINYINT)
    @Column(name = "semester_number", nullable = false)
    private int semesterNumber;

    @Column(name = "credits_override", precision = 4, scale = 2)
    private BigDecimal creditsOverride;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    @Column(name = "type_override")
    private SubjectType typeOverride;

    @Column(name = "is_elective", nullable = false)
    @Builder.Default
    private boolean isElective = false;

    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.SMALLINT)
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Resolves effective credits (creditsOverride if present, otherwise subject defaultCredits).
     */
    public BigDecimal getEffectiveCredits() {
        if (creditsOverride != null) {
            return creditsOverride;
        }
        return subject != null ? subject.getDefaultCredits() : BigDecimal.ZERO;
    }
}
