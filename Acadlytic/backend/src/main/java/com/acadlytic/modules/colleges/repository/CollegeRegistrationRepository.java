package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.colleges.entity.CollegeRegistration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CollegeRegistrationRepository extends JpaRepository<CollegeRegistration, Long> {

    List<CollegeRegistration> findByCollegeIdOrderByVersionNumberAsc(Long collegeId);

    Optional<CollegeRegistration> findByCollegeIdAndVersionNumber(Long collegeId, int versionNumber);

    Optional<CollegeRegistration> findFirstByCollegeIdOrderByVersionNumberDesc(Long collegeId);

    @Query(value = "SELECT cr FROM CollegeRegistration cr, College c " +
            "WHERE cr.id = c.currentRegistrationId " +
            "AND c.permanentlyRejected = false " +
            "AND c.archivedAt IS NULL " +
            "AND c.approvalStatus = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
            "AND cr.status = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
            "AND cr.submittedForReviewAt IS NOT NULL " +
            "AND (:search IS NULL OR LOWER(cr.legalName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:fromInstant IS NULL OR cr.submittedForReviewAt >= :fromInstant) " +
            "AND (:toInstant IS NULL OR cr.submittedForReviewAt <= :toInstant)",
            countQuery = "SELECT COUNT(cr) FROM CollegeRegistration cr, College c " +
                    "WHERE cr.id = c.currentRegistrationId " +
                    "AND c.permanentlyRejected = false " +
                    "AND c.archivedAt IS NULL " +
                    "AND c.approvalStatus = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
                    "AND cr.status = com.acadlytic.modules.colleges.entity.CollegeApprovalStatus.PENDING " +
                    "AND cr.submittedForReviewAt IS NOT NULL " +
                    "AND (:search IS NULL OR LOWER(cr.legalName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                    "AND (:fromInstant IS NULL OR cr.submittedForReviewAt >= :fromInstant) " +
                    "AND (:toInstant IS NULL OR cr.submittedForReviewAt <= :toInstant)")
    Page<CollegeRegistration> findPendingReviewQueue(
            @Param("search") String search,
            @Param("fromInstant") Instant fromInstant,
            @Param("toInstant") Instant toInstant,
            Pageable pageable);
}
