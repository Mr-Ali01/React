package com.resultpoint.modules.student.repository;

import com.resultpoint.modules.student.domain.SubjectResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectResultRepository extends JpaRepository<SubjectResult, String> {

    List<SubjectResult> findBySemesterResultId(String semesterResultId);
}
