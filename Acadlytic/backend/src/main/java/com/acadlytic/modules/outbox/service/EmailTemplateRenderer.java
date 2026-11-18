package com.acadlytic.modules.outbox.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class EmailTemplateRenderer {

    private final ObjectMapper objectMapper;
    private final String frontendBaseUrl;

    public EmailTemplateRenderer(
            ObjectMapper objectMapper,
            @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.objectMapper = objectMapper;
        this.frontendBaseUrl = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
    }

    public String renderBody(String templateKey, String payloadJson) {
        Map<String, Object> payload = parsePayload(payloadJson);
        String name = stringOrDefault(payload.get("firstName"), "User");

        return switch (templateKey) {
            case "PASSWORD_RESET" -> {
                String token = stringOrDefault(payload.get("token"), "");
                String link = frontendBaseUrl + "/auth/reset-password?token=" + urlEncode(token);
                yield "Hello " + name + ",\n\n"
                        + "We received a request to reset your Acadlytic password.\n"
                        + "Use the following link within 1 hour to set a new password:\n"
                        + link + "\n\n"
                        + "If you did not request a password reset, you can safely ignore this email.";
            }
            case "EMAIL_CHANGE_VERIFICATION" -> {
                String token = stringOrDefault(payload.get("token"), "");
                String link = frontendBaseUrl + "/verify-email-change?token=" + urlEncode(token);
                yield "Hello " + name + ",\n\n"
                        + "We received a request to change the email address on your Acadlytic account.\n"
                        + "Please confirm this new email address within 48 hours:\n"
                        + link + "\n\n"
                        + "If you did not request this change, do not click the link and secure your account immediately.";
            }
            case "EMAIL_CHANGE_ALERT" -> {
                String pendingEmail = stringOrDefault(payload.get("pendingEmail"), "a new address");
                yield "Hello " + name + ",\n\n"
                        + "A request was made to change your Acadlytic account email address to " + pendingEmail + ".\n"
                        + "Your current email remains active until the new address is verified.\n"
                        + "If you did not authorize this request, change your password immediately and contact Acadlytic support.";
            }
            case "EMAIL_VERIFICATION" -> {
                String token = stringOrDefault(payload.get("token"), "");
                String link = frontendBaseUrl + "/verify-email?token=" + urlEncode(token);
                yield "Hello " + name + ",\n\n"
                        + "Please verify your Acadlytic email address within 48 hours:\n"
                        + link + "\n\n"
                        + "Thank you,\nAcadlytic Team";
            }
            default -> "Hello " + name + ",\n\nYou have a new notification from Acadlytic.";
        };
    }

    private Map<String, Object> parsePayload(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize outbox email payload", ex);
        }
    }

    private String stringOrDefault(Object value, String fallback) {
        return value != null ? String.valueOf(value) : fallback;
    }

    private String urlEncode(String raw) {
        return URLEncoder.encode(raw, StandardCharsets.UTF_8);
    }
}
