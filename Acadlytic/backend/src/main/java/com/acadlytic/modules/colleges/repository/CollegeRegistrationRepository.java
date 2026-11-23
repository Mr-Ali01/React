package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollegeRegistrationRepository extends JpaRepository<CollegeRegistration, Long> {

    List<CollegeRegistration> findByCollegeIdOrderByVersionNumberAsc(Long collegeId);

    Optional<CollegeRegistration> findByCollegeIdAndVersionNumber(Long collegeId, int versionNumber);

    Optional<CollegeRegistration> findFirstByCollegeIdOrderByVersionNumberDesc(Long collegeId);
}
