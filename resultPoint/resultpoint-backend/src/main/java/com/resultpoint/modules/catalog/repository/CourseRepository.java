package com.resultpoint.modules.catalog.repository;

import com.resultpoint.modules.catalog.entity.Course;
import com.resultpoint.modules.catalog.entity.CourseLevel;
import com.resultpoint.modules.catalog.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {

    List<Course> findByUniversityId(String universityId);

    boolean existsByUniversityIdAndShortName(String universityId, String shortName);

    @Query("SELECT c FROM Course c WHERE " +
           "(:universityId IS NULL OR c.university.id = :universityId) AND " +
           "(:level IS NULL OR c.level = :level) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.shortName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> searchCourses(@Param("universityId") String universityId,
                               @Param("level") CourseLevel level,
                               @Param("status") CourseStatus status,
                               @Param("search") String search,
                               Pageable pageable);

    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.regulations WHERE c.id = :id")
    Optional<Course> findByIdWithRegulations(@Param("id") String id);
}
