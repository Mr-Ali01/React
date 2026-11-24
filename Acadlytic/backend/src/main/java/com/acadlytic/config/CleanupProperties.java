package com.acadlytic.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for scheduled archival and cleanup operations (Module 3.5).
 */
@Configuration
@ConfigurationProperties(prefix = "app.cleanup")
public class CleanupProperties {

    /**
     * Retention period in days for unverified and unsubmitted registrations before soft-archival.
     */
    private int abandonedRetentionDays = 7;

    /**
     * Retention period in days for permanently rejected colleges before soft-archival.
     */
    private int permanentRejectionRetentionDays = 7;

    /**
     * Maximum number of colleges to process in a single cleanup batch.
     */
    private int batchSize = 50;

    /**
     * Maximum number of documents to process in a single secondary sweeper batch.
     */
    private int sweeperBatchSize = 50;

    /**
     * Cron expression for scheduled cleanup execution (UTC timezone).
     */
    private String cron = "0 0 2 * * *";

    public int getAbandonedRetentionDays() {
        return abandonedRetentionDays;
    }

    public void setAbandonedRetentionDays(int abandonedRetentionDays) {
        this.abandonedRetentionDays = abandonedRetentionDays;
    }

    public int getPermanentRejectionRetentionDays() {
        return permanentRejectionRetentionDays;
    }

    public void setPermanentRejectionRetentionDays(int permanentRejectionRetentionDays) {
        this.permanentRejectionRetentionDays = permanentRejectionRetentionDays;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public int getSweeperBatchSize() {
        return sweeperBatchSize;
    }

    public void setSweeperBatchSize(int sweeperBatchSize) {
        this.sweeperBatchSize = sweeperBatchSize;
    }

    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }
}
