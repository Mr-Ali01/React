package com.resultpoint.modules.calculation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "calculation_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculationRule {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "sgpa_formula", length = 60, nullable = false)
    @Builder.Default
    private String sgpaFormula = "WEIGHTED_CREDIT_SUM";

    @Column(name = "cgpa_formula", length = 60, nullable = false)
    @Builder.Default
    private String cgpaFormula = "CUMULATIVE_WEIGHTED_CREDIT_SUM";

    @Column(name = "percentage_formula_expression", length = 150, nullable = false)
    private String percentageFormulaExpression;

    @Column(name = "percentage_formula_desc", length = 200, nullable = false)
    private String percentageFormulaDesc;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    @Column(name = "rounding_mode", nullable = false)
    @Builder.Default
    private RuleRoundingMode roundingMode = RuleRoundingMode.HALF_UP;

    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.TINYINT)
    @Column(name = "decimal_places", nullable = false)
    @Builder.Default
    private int decimalPlaces = 2;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
