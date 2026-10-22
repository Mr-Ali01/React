package com.resultpoint.modules.calculation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grading_scales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingScale {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Convert(converter = ScaleTypeConverter.class)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    @Column(name = "scale_type", nullable = false)
    private ScaleType scaleType;

    @Column(name = "description", length = 255)
    private String description;

    @OneToMany(mappedBy = "gradingScale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("gradePoints DESC, minPercentage DESC")
    @Builder.Default
    private List<GradeBoundary> boundaries = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
