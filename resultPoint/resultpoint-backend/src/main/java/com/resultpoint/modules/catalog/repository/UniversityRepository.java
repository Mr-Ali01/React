package com.resultpoint.modules.catalog.repository;

import com.resultpoint.modules.catalog.entity.University;
import com.resultpoint.modules.catalog.entity.UniversityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversityRepository extends JpaRepository<University, String> {

    Optional<University> findByShortName(String shortName);

    boolean existsByShortName(String shortName);

    @Query("SELECT u FROM University u WHERE " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.shortName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.city) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<University> searchUniversities(@Param("status") UniversityStatus status,
                                        @Param("search") String search,
                                        Pageable pageable);

    @Query("SELECT u FROM University u LEFT JOIN FETCH u.courses c WHERE u.id = :id")
    Optional<University> findByIdWithCourses(@Param("id") String id);
}
