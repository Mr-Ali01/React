package com.resultpoint.modules.student.repository;

import com.resultpoint.modules.student.domain.BacklogStatus;
import com.resultpoint.modules.student.domain.StudentBacklog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentBacklogRepository extends JpaRepository<StudentBacklog, String> {

    List<StudentBacklog> findByStudentProfileIdOrderBySemesterNumberAsc(String studentProfileId);

    List<StudentBacklog> findByStudentProfileIdAndStatusOrderBySemesterNumberAsc(String studentProfileId, BacklogStatus status);

    Optional<StudentBacklog> findByStudentProfileIdAndSubjectCodeAndStatus(String studentProfileId, String subjectCode, BacklogStatus status);

    List<StudentBacklog> findByStudentProfileIdAndSubjectCode(String studentProfileId, String subjectCode);

    int countByStudentProfileIdAndStatus(String studentProfileId, BacklogStatus status);

    void deleteByStudentProfileIdAndSemesterNumber(String studentProfileId, int semesterNumber);
}
