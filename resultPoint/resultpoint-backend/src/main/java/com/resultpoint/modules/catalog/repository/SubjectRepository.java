package com.resultpoint.modules.catalog.repository;

import com.resultpoint.modules.catalog.entity.Subject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, String> {

    Optional<Subject> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT s FROM Subject s WHERE " +
           "(:department IS NULL OR s.department = :department) AND " +
           "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Subject> searchSubjects(@Param("department") String department,
                                 @Param("search") String search,
                                 Pageable pageable);
}
