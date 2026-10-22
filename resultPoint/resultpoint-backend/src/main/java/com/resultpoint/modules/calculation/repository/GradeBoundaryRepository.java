package com.resultpoint.modules.calculation.repository;

import com.resultpoint.modules.calculation.entity.GradeBoundary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeBoundaryRepository extends JpaRepository<GradeBoundary, Long> {

    List<GradeBoundary> findAllByGradingScaleIdOrderByGradePointsDesc(String gradingScaleId);

    Optional<GradeBoundary> findByGradingScaleIdAndGradeLetter(String gradingScaleId, String gradeLetter);
}
