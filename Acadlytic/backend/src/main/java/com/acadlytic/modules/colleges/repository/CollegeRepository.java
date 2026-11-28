package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CollegeRepository extends JpaRepository<College, Long>, JpaSpecificationExecutor<College> {

    Optional<College> findByCode(String code);

    boolean existsByCodeAndPermanentlyRejectedFalseAndArchivedAtIsNull(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM College c WHERE c.id = :id")
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})
    Optional<College> findByIdWithLock(@Param("id") Long id);

    @Query("""
        SELECT DISTINCT c FROM College c, CollegeRegistration cr, com.acadlytic.modules.auth.entity.User u
        WHERE c.currentRegistrationId = cr.id
          AND u.collegeId = c.id
          AND u.role = :adminRole
          AND u.status = :userStatus
          AND u.emailVerifiedAt IS NULL
          AND cr.submittedForReviewAt IS NULL
          AND cr.versionNumber = 1
          AND cr.status = :registrationStatus
          AND c.resubmissionCount = 0
          AND c.approvalStatus = :approvalStatus
          AND c.status = :collegeStatus
          AND c.permanentlyRejected = false
          AND c.archivedAt IS NULL
          AND c.createdAt <= :cutoff
        ORDER BY c.id ASC
    """)
    List<College> findAbandonedRegistrations(
            @Param("cutoff") Instant cutoff,
            @Param("adminRole") Role adminRole,
            @Param("userStatus") UserStatus userStatus,
            @Param("approvalStatus") CollegeApprovalStatus approvalStatus,
            @Param("collegeStatus") CollegeStatus collegeStatus,
            @Param("registrationStatus") CollegeApprovalStatus registrationStatus,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT c FROM College c, CollegeRegistration cr
        WHERE cr.collegeId = c.id
          AND c.permanentlyRejected = true
          AND c.archivedAt IS NULL
          AND cr.permanentRejection = true
          AND cr.reviewedAt IS NOT NULL
          AND cr.reviewedAt <= :cutoff
        ORDER BY c.id ASC
    """)
    List<College> findPermanentlyRejectedForArchival(
            @Param("cutoff") Instant cutoff,
            Pageable pageable);
}
