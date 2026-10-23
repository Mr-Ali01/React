package com.resultpoint.modules.student.domain;

import com.resultpoint.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "education_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationRecord {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "type", length = 30, nullable = false)
    private String type;

    @Column(name = "level", length = 50, nullable = false)
    private String level;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.CHAR)
    @Column(name = "category_group", nullable = false)
    private CategoryGroup categoryGroup;

    @Column(name = "board_or_university", length = 200, nullable = false)
    private String boardOrUniversity;

    @Column(name = "institution_name", length = 255, nullable = false)
    private String institutionName;

    @Column(name = "passing_year", nullable = false)
    @JdbcTypeCode(Types.SMALLINT)
    private int passingYear;

    @Column(name = "academic_year", length = 30)
    private String academicYear;

    @Column(name = "roll_number", length = 80)
    private String rollNumber;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.CHAR)
    @Column(name = "entry_mode", nullable = false)
    @Builder.Default
    private EntryMode entryMode = EntryMode.QUICK;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.CHAR)
    @Column(name = "result_status", nullable = false)
    @Builder.Default
    private ResultStatus resultStatus = ResultStatus.COMPLETED;

    @Column(name = "total_marks", precision = 7, scale = 2)
    private BigDecimal totalMarks;

    @Column(name = "max_marks", precision = 7, scale = 2)
    private BigDecimal maxMarks;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "cgpa", precision = 4, scale = 2)
    private BigDecimal cgpa;

    @Column(name = "final_grade", length = 20)
    private String finalGrade;

    @OneToMany(mappedBy = "educationRecord", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EducationRecordSubject> subjects = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
