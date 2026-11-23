package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.colleges.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CollegeRepository extends JpaRepository<College, Long> {

    Optional<College> findByCode(String code);

    boolean existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull(String code);
}
