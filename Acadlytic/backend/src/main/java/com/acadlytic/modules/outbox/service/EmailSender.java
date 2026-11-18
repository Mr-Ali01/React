package com.acadlytic.modules.outbox.service;

/**
 * Port interface for outbound email delivery (ADR-15).
 * Invoked exclusively by the transactional outbox worker outside database transactions.
 */
public interface EmailSender {

    void send(EmailMessage message);
}
