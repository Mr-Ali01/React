package com.resultpoint.modules.student.domain;

import com.resultpoint.modules.catalog.entity.Course;
import com.resultpoint.modules.catalog.entity.Regulation;
import com.resultpoint.modules.catalog.entity.University;
import com.resultpoint.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "student_profiles", uniqueConstraints = {
        @UniqueConstraint(name = "uq_student_profiles_user_id", columnNames = "user_id"),
        @UniqueConstraint(name = "uq_student_profiles_hall_ticket", columnNames = {"university_id", "hall_ticket_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "regulation_id", nullable = false)
    private Regulation regulation;

    @Column(name = "batch_year", length = 30, nullable = false)
    private String batchYear;

    @Column(name = "hall_ticket_number", length = 60, nullable = false)
    private String hallTicketNumber;

    @Column(name = "institution_name", length = 255)
    private String institutionName;

    @Column(name = "current_semester", nullable = false)
    @JdbcTypeCode(Types.TINYINT)
    @Builder.Default
    private int currentSemester = 1;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.CHAR)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "cumulative_cgpa", precision = 4, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal cumulativeCgpa = BigDecimal.ZERO;

    @Column(name = "total_credits_earned", precision = 5, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal totalCreditsEarned = BigDecimal.ZERO;

    @Column(name = "target_cgpa", precision = 4, scale = 2)
    private BigDecimal targetCgpa;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
