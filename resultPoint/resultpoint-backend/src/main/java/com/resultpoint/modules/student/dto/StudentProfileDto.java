package com.resultpoint.modules.student.dto;

import com.resultpoint.modules.student.domain.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileDto {
    private String id;
    private String userId;
    private String userFullName;
    private String userEmail;
    private String universityId;
    private String universityName;
    private String courseId;
    private String courseName;
    private String courseLevel;
    private String regulationId;
    private String regulationCode;
    private String batchYear;
    private String hallTicketNumber;
    private String institutionName;
    private int currentSemester;
    private LocalDate dateOfBirth;
    private Gender gender;
    private BigDecimal cumulativeCgpa;
    private BigDecimal totalCreditsEarned;
    private BigDecimal targetCgpa;
    private Instant createdAt;
    private Instant updatedAt;
}
