package com.resultpoint.modules.catalog.repository;

import com.resultpoint.modules.catalog.entity.RegulationSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegulationSubjectRepository extends JpaRepository<RegulationSubject, Long> {

    @Query("SELECT rs FROM RegulationSubject rs JOIN FETCH rs.subject s " +
           "WHERE rs.regulation.id = :regulationId ORDER BY rs.semesterNumber ASC, rs.displayOrder ASC")
    List<RegulationSubject> findAllByRegulationIdWithSubject(@Param("regulationId") String regulationId);

    @Query("SELECT rs FROM RegulationSubject rs JOIN FETCH rs.subject s " +
           "WHERE rs.regulation.id = :regulationId AND rs.semesterNumber = :semesterNumber ORDER BY rs.displayOrder ASC")
    List<RegulationSubject> findByRegulationIdAndSemesterNumberWithSubject(@Param("regulationId") String regulationId,
                                                                           @Param("semesterNumber") int semesterNumber);
}
