package com.resultpoint.modules.calculation.repository;

import com.resultpoint.modules.calculation.entity.GradingScale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GradingScaleRepository extends JpaRepository<GradingScale, String> {

    @Query("SELECT s FROM GradingScale s LEFT JOIN FETCH s.boundaries WHERE s.id = :id")
    Optional<GradingScale> findByIdWithBoundaries(@Param("id") String id);
}
