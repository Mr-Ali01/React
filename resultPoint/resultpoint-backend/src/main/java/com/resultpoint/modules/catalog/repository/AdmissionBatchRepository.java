package com.resultpoint.modules.catalog.repository;

import com.resultpoint.modules.catalog.entity.AdmissionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdmissionBatchRepository extends JpaRepository<AdmissionBatch, Long> {

    List<AdmissionBatch> findByRegulationId(String regulationId);

    boolean existsByRegulationIdAndBatchName(String regulationId, String batchName);
}
