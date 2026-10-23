package com.resultpoint.modules.student.repository;

import com.resultpoint.modules.student.domain.EducationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EducationRecordRepository extends JpaRepository<EducationRecord, String> {

    List<EducationRecord> findByUserIdOrderByPassingYearDesc(String userId);

    Optional<EducationRecord> findByIdAndUserId(String id, String userId);
}
