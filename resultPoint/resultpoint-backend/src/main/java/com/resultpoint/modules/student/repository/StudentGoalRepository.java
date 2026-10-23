package com.resultpoint.modules.student.repository;

import com.resultpoint.modules.student.domain.StudentGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentGoalRepository extends JpaRepository<StudentGoal, String> {

    List<StudentGoal> findByStudentProfileIdOrderByCreatedAtDesc(String studentProfileId);

    List<StudentGoal> findByStudentProfileIdAndActiveTrue(String studentProfileId);

    Optional<StudentGoal> findByIdAndStudentProfileId(String id, String studentProfileId);
}
