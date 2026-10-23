package com.resultpoint.modules.student.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subject_results", uniqueConstraints = {
        @UniqueConstraint(name = "uq_sem_res_subject", columnNames = {"semester_result_id", "subject_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectResult {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_result_id", nullable = false)
    private SemesterResult semesterResult;

    @Column(name = "subject_code", length = 30, nullable = false)
    private String subjectCode;

    @Column(name = "subject_name", length = 200, nullable = false)
    private String subjectName;

    @Column(name = "credits", precision = 4, scale = 2, nullable = false)
    private BigDecimal credits;

    @Column(name = "grade_letter", length = 10, nullable = false)
    private String gradeLetter;

    @Column(name = "grade_points", precision = 4, scale = 2, nullable = false)
    private BigDecimal gradePoints;

    @Column(name = "internal_marks", precision = 5, scale = 2)
    private BigDecimal internalMarks;

    @Column(name = "external_marks", precision = 5, scale = 2)
    private BigDecimal externalMarks;

    @Column(name = "total_marks", precision = 5, scale = 2)
    private BigDecimal totalMarks;

    @Column(name = "is_pass", nullable = false)
    @Builder.Default
    private boolean pass = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
