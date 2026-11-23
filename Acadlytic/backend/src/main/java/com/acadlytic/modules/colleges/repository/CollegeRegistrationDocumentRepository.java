package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollegeRegistrationDocumentRepository extends JpaRepository<CollegeRegistrationDocument, Long> {

    List<CollegeRegistrationDocument> findByRegistrationId(Long registrationId);

    List<CollegeRegistrationDocument> findByCollegeId(Long collegeId);

    long countByRegistrationId(Long registrationId);

    Optional<CollegeRegistrationDocument> findByStorageKey(String storageKey);
}
