package com.resultpoint.modules.calculation.repository;

import com.resultpoint.modules.calculation.entity.CalculationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalculationRuleRepository extends JpaRepository<CalculationRule, String> {
}
