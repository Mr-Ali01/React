package com.acadlytic.modules.outbox.entity;

public enum OutboxEmailStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED_PERMANENT
}
