package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.colleges.entity.CollegeDocumentReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollegeDocumentReviewRepository extends JpaRepository<CollegeDocumentReview, Long> {

    @Query("SELECT r FROM CollegeDocumentReview r WHERE r.collegeId = :collegeId AND r.documentId = :documentId ORDER BY r.reviewedAt DESC, r.id DESC")
    List<CollegeDocumentReview> findByCollegeIdAndDocumentIdOrderByReviewedAtDescCreatedAtDesc(
            @Param("collegeId") Long collegeId,
            @Param("documentId") Long documentId);

    @Query("SELECT r FROM CollegeDocumentReview r WHERE r.documentId = :documentId ORDER BY r.reviewedAt DESC, r.id DESC")
    List<CollegeDocumentReview> findByDocumentIdOrderByReviewedAtDescCreatedAtDesc(
            @Param("documentId") Long documentId);

    List<CollegeDocumentReview> findByCollegeIdAndRegistrationId(Long collegeId, Long registrationId);
}
