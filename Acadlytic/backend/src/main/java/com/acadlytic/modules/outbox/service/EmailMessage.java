package com.acadlytic.modules.outbox.service;

public record EmailMessage(
        String to,
        String subject,
        String body
) {
}
