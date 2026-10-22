package com.resultpoint.modules.catalog.repository;

import com.resultpoint.modules.catalog.entity.Regulation;
import com.resultpoint.modules.catalog.entity.RegulationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegulationRepository extends JpaRepository<Regulation, String> {

    List<Regulation> findByCourseId(String courseId);

    boolean existsByCourseIdAndCode(String courseId, String code);

    @Query("SELECT r FROM Regulation r WHERE " +
           "(:courseId IS NULL OR r.course.id = :courseId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Regulation> searchRegulations(@Param("courseId") String courseId,
                                       @Param("status") RegulationStatus status,
                                       @Param("search") String search,
                                       Pageable pageable);

    @Query("SELECT r FROM Regulation r " +
           "JOIN FETCH r.course c " +
           "JOIN FETCH c.university u " +
           "JOIN FETCH r.gradingScale gs " +
           "JOIN FETCH r.calculationRule cr " +
           "WHERE r.id = :id")
    Optional<Regulation> findByIdWithDetails(@Param("id") String id);
}
