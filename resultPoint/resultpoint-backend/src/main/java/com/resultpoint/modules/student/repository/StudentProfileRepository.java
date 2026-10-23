package com.resultpoint.modules.student.repository;

import com.resultpoint.modules.student.domain.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, String> {

    Optional<StudentProfile> findByUserId(String userId);

    boolean existsByUserId(String userId);

    boolean existsByUniversityIdAndHallTicketNumber(String universityId, String hallTicketNumber);

    boolean existsByUniversityIdAndHallTicketNumberAndIdNot(String universityId, String hallTicketNumber, String id);
}
