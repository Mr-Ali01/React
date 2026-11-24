package com.acadlytic.modules.colleges.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Handles transactional storage compensation (Spring Transaction Synchronization).
 * Ensures physical files written during an uncommitted database transaction are purged if the transaction rolls back.
 */
@Component
public class DocumentStorageCompensationHandler {

    private static final Logger log = LoggerFactory.getLogger(DocumentStorageCompensationHandler.class);

    private final DocumentStorageService documentStorageService;

    public DocumentStorageCompensationHandler(DocumentStorageService documentStorageService) {
        this.documentStorageService = documentStorageService;
    }

    public void registerRollbackCleanup(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        try {
                            log.info("Transaction rolled back: executing physical file compensation for key: {}", storageKey);
                            documentStorageService.delete(storageKey);
                        } catch (Exception ex) {
                            log.error("Failed to delete physical file during rollback compensation: {}", storageKey, ex);
                        }
                    } else if (status == STATUS_COMMITTED) {
                        log.debug("Transaction committed successfully: retaining physical file for key: {}", storageKey);
                    }
                }
            });
        } else {
            log.warn("Transaction synchronization not active when registering rollback cleanup for key: {}", storageKey);
        }
    }
}
