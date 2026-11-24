package com.acadlytic.modules.colleges.storage;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DocumentStorageCompensationUnitTest {

    @Mock
    private DocumentStorageService storageService;

    private DocumentStorageCompensationHandler compensationHandler;

    @BeforeEach
    void setUp() {
        compensationHandler = new DocumentStorageCompensationHandler(storageService);
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("Rollback status triggers storage file deletion compensation")
    void rollbackTriggersStorageCompensation() {
        String key = "test-rollback-key.pdf";
        compensationHandler.registerRollbackCleanup(key);

        assertThat(TransactionSynchronizationManager.getSynchronizations()).hasSize(1);
        TransactionSynchronization sync = TransactionSynchronizationManager.getSynchronizations().get(0);

        sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(storageService).delete(key);
    }

    @Test
    @DisplayName("Commit status does not delete stored physical file")
    void commitDoesNotDeleteStoredFile() {
        String key = "test-commit-key.pdf";
        compensationHandler.registerRollbackCleanup(key);

        TransactionSynchronization sync = TransactionSynchronizationManager.getSynchronizations().get(0);
        sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);

        verify(storageService, never()).delete(key);
    }

    @Test
    @DisplayName("Catches exception during rollback deletion without bubbling up")
    void deletionExceptionCaughtSafely() {
        String key = "failing-key.pdf";
        doThrow(new RuntimeException("Filesystem IO Error")).when(storageService).delete(key);

        compensationHandler.registerRollbackCleanup(key);
        TransactionSynchronization sync = TransactionSynchronizationManager.getSynchronizations().get(0);

        assertThatCode(() -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Ignores null or blank storage keys")
    void ignoreNullOrBlankKeys() {
        compensationHandler.registerRollbackCleanup(null);
        compensationHandler.registerRollbackCleanup("   ");

        assertThat(TransactionSynchronizationManager.getSynchronizations()).isEmpty();
    }
}
