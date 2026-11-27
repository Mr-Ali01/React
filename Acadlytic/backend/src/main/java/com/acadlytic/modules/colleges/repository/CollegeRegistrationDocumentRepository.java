package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.colleges.entity.CollegeRegistrationDocument;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CollegeRegistrationDocumentRepository extends JpaRepository<CollegeRegistrationDocument, Long> {

    List<CollegeRegistrationDocument> findByRegistrationId(Long registrationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM CollegeRegistrationDocument d WHERE d.registrationId = :registrationId ORDER BY d.id ASC")
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})
    List<CollegeRegistrationDocument> findByRegistrationIdWithLock(@Param("registrationId") Long registrationId);

    List<CollegeRegistrationDocument> findByRegistrationIdIn(Collection<Long> registrationIds);

    List<CollegeRegistrationDocument> findByCollegeId(Long collegeId);

    long countByRegistrationId(Long registrationId);

    Optional<CollegeRegistrationDocument> findByIdAndCollegeId(Long id, Long collegeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM CollegeRegistrationDocument d WHERE d.id = :id AND d.collegeId = :collegeId")
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})
    Optional<CollegeRegistrationDocument> findByIdAndCollegeIdWithLock(@Param("id") Long id, @Param("collegeId") Long collegeId);

    Optional<CollegeRegistrationDocument> findByStorageKey(String storageKey);

    @Query("""
        SELECT d FROM CollegeRegistrationDocument d, CollegeRegistration cr, College c
        WHERE d.registrationId = cr.id
          AND cr.collegeId = c.id
          AND c.archivedAt IS NOT NULL
          AND cr.submittedForReviewAt IS NULL
          AND cr.versionNumber = 1
          AND d.filePurgedAt IS NULL
          AND d.id > :lastProcessedId
        ORDER BY d.id ASC
    """)
    List<CollegeRegistrationDocument> findEligibleAbandonedDraftDocumentsKeyset(
            @Param("lastProcessedId") Long lastProcessedId,
            Pageable pageable);
}
