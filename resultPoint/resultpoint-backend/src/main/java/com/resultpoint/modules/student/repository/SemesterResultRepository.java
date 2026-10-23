package com.resultpoint.modules.student.repository;

import com.resultpoint.modules.student.domain.SemesterResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterResultRepository extends JpaRepository<SemesterResult, String> {

    List<SemesterResult> findByStudentProfileIdOrderBySemesterNumberAsc(String studentProfileId);

    Optional<SemesterResult> findByStudentProfileIdAndSemesterNumber(String studentProfileId, int semesterNumber);

    boolean existsByStudentProfileIdAndSemesterNumber(String studentProfileId, int semesterNumber);

    int countByStudentProfileId(String studentProfileId);

    void deleteByStudentProfileIdAndSemesterNumber(String studentProfileId, int semesterNumber);
}
