package com.acadlytic.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.outbox")
public class OutboxProperties {

    private long pollDelayMs = 10000;
    private int batchSize = 20;
    private int maxAttempts = 5;
    private long staleProcessingMinutes = 5;

    public long getPollDelayMs() {
        return pollDelayMs;
    }

    public void setPollDelayMs(long pollDelayMs) {
        this.pollDelayMs = pollDelayMs;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public long getStaleProcessingMinutes() {
        return staleProcessingMinutes;
    }

    public void setStaleProcessingMinutes(long staleProcessingMinutes) {
        this.staleProcessingMinutes = staleProcessingMinutes;
    }
}
