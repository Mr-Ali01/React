package com.acadlytic.modules.colleges.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CollegeCleanupSchedulerUnitTest {

    @Mock
    private CollegeLifecycleService collegeLifecycleService;

    @InjectMocks
    private CollegeCleanupScheduler scheduler;

    @Test
    @DisplayName("runScheduledCleanup - calls all three cleanup tasks in sequence")
    void runScheduledCleanup_callsAllTasksInSequence() {
        when(collegeLifecycleService.cleanupAbandonedRegistrations()).thenReturn(3);
        when(collegeLifecycleService.archivePermanentlyRejectedColleges()).thenReturn(2);
        when(collegeLifecycleService.sweepResidualAbandonedDraftDocuments()).thenReturn(5);

        scheduler.runScheduledCleanup();

        verify(collegeLifecycleService).cleanupAbandonedRegistrations();
        verify(collegeLifecycleService).archivePermanentlyRejectedColleges();
        verify(collegeLifecycleService).sweepResidualAbandonedDraftDocuments();
    }

    @Test
    @DisplayName("runScheduledCleanup - exception in abandoned cleanup does not prevent subsequent tasks")
    void runScheduledCleanup_exceptionInAbandonedCleanup_doesNotPreventSubsequentTasks() {
        doThrow(new RuntimeException("Database timeout")).when(collegeLifecycleService).cleanupAbandonedRegistrations();
        when(collegeLifecycleService.archivePermanentlyRejectedColleges()).thenReturn(1);
        when(collegeLifecycleService.sweepResidualAbandonedDraftDocuments()).thenReturn(0);

        scheduler.runScheduledCleanup();

        verify(collegeLifecycleService).cleanupAbandonedRegistrations();
        verify(collegeLifecycleService).archivePermanentlyRejectedColleges();
        verify(collegeLifecycleService).sweepResidualAbandonedDraftDocuments();
    }

    @Test
    @DisplayName("runScheduledCleanup - exception in permanent rejection archival does not prevent sweeper")
    void runScheduledCleanup_exceptionInPermanentArchival_doesNotPreventSweeper() {
        when(collegeLifecycleService.cleanupAbandonedRegistrations()).thenReturn(2);
        doThrow(new RuntimeException("Lock failure")).when(collegeLifecycleService).archivePermanentlyRejectedColleges();
        when(collegeLifecycleService.sweepResidualAbandonedDraftDocuments()).thenReturn(4);

        scheduler.runScheduledCleanup();

        verify(collegeLifecycleService).cleanupAbandonedRegistrations();
        verify(collegeLifecycleService).archivePermanentlyRejectedColleges();
        verify(collegeLifecycleService).sweepResidualAbandonedDraftDocuments();
    }
}
