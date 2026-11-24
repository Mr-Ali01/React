package com.acadlytic.modules.colleges.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled runner executing daily registration cleanups, retention archival,
 * and durable secondary physical document sweeps in UTC timezone (Module 3.5).
 */
@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class CollegeCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(CollegeCleanupScheduler.class);

    private final CollegeLifecycleService collegeLifecycleService;

    public CollegeCleanupScheduler(CollegeLifecycleService collegeLifecycleService) {
        this.collegeLifecycleService = collegeLifecycleService;
    }

    /**
     * Executes scheduled cleanup tasks daily at 02:00 UTC.
     */
    @Scheduled(cron = "${app.cleanup.cron:0 0 2 * * *}", zone = "UTC")
    public void runScheduledCleanup() {
        log.info("Starting scheduled college registration cleanup and archival job (UTC).");

        try {
            int abandonedCount = collegeLifecycleService.cleanupAbandonedRegistrations();
            log.info("Scheduled job: cleaned up [{}] abandoned registrations.", abandonedCount);
        } catch (Exception e) {
            log.error("Scheduled job: error during abandoned registration cleanup: {}", e.getMessage(), e);
        }

        try {
            int archivedCount = collegeLifecycleService.archivePermanentlyRejectedColleges();
            log.info("Scheduled job: archived [{}] permanently rejected colleges.", archivedCount);
        } catch (Exception e) {
            log.error("Scheduled job: error during permanent rejection archival: {}", e.getMessage(), e);
        }

        try {
            int sweptCount = collegeLifecycleService.sweepResidualAbandonedDraftDocuments();
            log.info("Scheduled job: secondary sweeper processed [{}] documents.", sweptCount);
        } catch (Exception e) {
            log.error("Scheduled job: error during secondary draft document sweep: {}", e.getMessage(), e);
        }

        log.info("Finished scheduled college registration cleanup and archival job.");
    }
}
