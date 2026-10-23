package com.resultpoint.modules.student.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "education_record_subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationRecordSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "education_record_id", nullable = false)
    private EducationRecord educationRecord;

    @Column(name = "subject_name", length = 150, nullable = false)
    private String subjectName;

    @Column(name = "subject_code", length = 30)
    private String subjectCode;

    @Column(name = "marks_obtained", precision = 5, scale = 2)
    private BigDecimal marksObtained;

    @Column(name = "max_marks", precision = 5, scale = 2)
    private BigDecimal maxMarks;

    @Column(name = "grade", length = 10)
    private String grade;

    @Column(name = "credits", precision = 4, scale = 2)
    private BigDecimal credits;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
