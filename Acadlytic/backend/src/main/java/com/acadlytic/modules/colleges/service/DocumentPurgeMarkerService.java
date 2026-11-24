package com.acadlytic.modules.colleges.service;

import com.acadlytic.modules.colleges.repository.CollegeRegistrationDocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Dedicated Spring-managed service for durable document purge marker persistence (Module 3.5).
 * Guarantees that marker updates execute in an independent short transaction (REQUIRES_NEW)
 * via explicit Spring proxy interception, while keeping physical file I/O strictly outside the transaction.
 */
@Service
public class DocumentPurgeMarkerService {

    private static final Logger log = LoggerFactory.getLogger(DocumentPurgeMarkerService.class);

    private final CollegeRegistrationDocumentRepository documentRepository;

    public DocumentPurgeMarkerService(CollegeRegistrationDocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    /**
     * Persists the file_purged_at marker on a document row inside an independent, dedicated transaction.
     * Preserves the database document row and metadata permanently.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markDocumentFilePurged(Long documentId, Instant purgedAt) {
        documentRepository.findById(documentId).ifPresent(doc -> {
            if (doc.getFilePurgedAt() == null) {
                doc.setFilePurgedAt(purgedAt != null ? purgedAt : Instant.now());
                documentRepository.saveAndFlush(doc);
                log.debug("Document [{}] marked as physically purged at {}", documentId, doc.getFilePurgedAt());
            }
        });
    }
}
