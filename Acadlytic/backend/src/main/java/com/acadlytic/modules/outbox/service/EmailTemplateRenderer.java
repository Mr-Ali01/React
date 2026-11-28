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
            case "COLLEGE_REGISTRATION_APPROVED" -> {
                String collegeName = stringOrDefault(payload.get("legalName"), "your institution");
                String collegeCode = stringOrDefault(payload.get("collegeCode"), "");
                String loginLink = frontendBaseUrl + "/login";
                yield "Hello " + name + ",\n\n"
                        + "Congratulations! The registration application for " + collegeName + " (" + collegeCode + ") has been approved by the Acadlytic administration.\n\n"
                        + "Your account and college administrative dashboard are now fully active. You may log in to start configuring your institution:\n"
                        + loginLink + "\n\n"
                        + "Thank you,\nAcadlytic Team";
            }
            case "COLLEGE_REGISTRATION_ACTION_REQUIRED" -> {
                String collegeName = stringOrDefault(payload.get("legalName"), "your institution");
                String notes = stringOrDefault(payload.get("reviewNotes"), "Please review the remarks on your dashboard.");
                String dashboardLink = frontendBaseUrl + "/login";
                yield "Hello " + name + ",\n\n"
                        + "The registration application for " + collegeName + " requires updates before it can be approved.\n\n"
                        + "Reviewer remarks:\n"
                        + notes + "\n\n"
                        + "Please log in to your dashboard to review the feedback and submit the updated information and documents:\n"
                        + dashboardLink + "\n\n"
                        + "Thank you,\nAcadlytic Team";
            }
            case "COLLEGE_REGISTRATION_REJECTED" -> {
                String collegeName = stringOrDefault(payload.get("legalName"), "your institution");
                String reason = stringOrDefault(payload.get("rejectionReason"), "Application did not meet verification criteria.");
                String remaining = stringOrDefault(payload.get("remainingResubmissions"), "0");
                String dashboardLink = frontendBaseUrl + "/login";
                yield "Hello " + name + ",\n\n"
                        + "We regret to inform you that the registration application for " + collegeName + " has been rejected.\n\n"
                        + "Reason for rejection:\n"
                        + reason + "\n\n"
                        + "Remaining correction attempts: " + remaining + ".\n\n"
                        + "You may log in to your onboarding dashboard to correct and resubmit your application:\n"
                        + dashboardLink + "\n\n"
                        + "Thank you,\nAcadlytic Team";
            }
            case "COLLEGE_REGISTRATION_PERMANENTLY_REJECTED" -> {
                String collegeName = stringOrDefault(payload.get("legalName"), "your institution");
                String reason = stringOrDefault(payload.get("rejectionReason"), "Maximum correction rounds exceeded.");
                yield "Hello " + name + ",\n\n"
                        + "The registration application for " + collegeName + " has been permanently rejected after exceeding the maximum allowed correction submissions.\n\n"
                        + "Reason for permanent rejection:\n"
                        + reason + "\n\n"
                        + "This application has been closed and the administrative account has been deactivated.\n\n"
                        + "Thank you,\nAcadlytic Team";
            }
            case "COLLEGE_SUSPENDED" -> {
                String collegeName = stringOrDefault(payload.get("legalName"), "your institution");
                String reason = stringOrDefault(payload.get("reason"), "Administrative compliance action.");
                yield "Hello " + name + ",\n\n"
                        + "The operational status of " + collegeName + " has been changed to SUSPENDED.\n\n"
                        + "Reason for suspension:\n"
                        + reason + "\n\n"
                        + "While suspended, access to all college administrative and operational features is blocked. "
                        + "Please contact Acadlytic platform administration immediately for resolution.\n\n"
                        + "Thank you,\nAcadlytic Administration Team";
            }
            case "COLLEGE_DEACTIVATED" -> {
                String collegeName = stringOrDefault(payload.get("legalName"), "your institution");
                String reason = stringOrDefault(payload.get("reason"), "Contract closure or operational discontinuation.");
                yield "Hello " + name + ",\n\n"
                        + "The operational status of " + collegeName + " has been changed to INACTIVE (Deactivated).\n\n"
                        + "Reason for deactivation:\n"
                        + reason + "\n\n"
                        + "Administrative access for your institution has been deactivated. "
                        + "If this was in error, please contact Acadlytic platform administration.\n\n"
                        + "Thank you,\nAcadlytic Administration Team";
            }
            case "COLLEGE_ACTIVATED" -> {
                String collegeName = stringOrDefault(payload.get("legalName"), "your institution");
                String reason = stringOrDefault(payload.get("reason"), "Administrative reactivation.");
                String loginLink = frontendBaseUrl + "/login";
                yield "Hello " + name + ",\n\n"
                        + "Great news! The operational status of " + collegeName + " has been reactivated to ACTIVE.\n\n"
                        + "Administrative remarks:\n"
                        + reason + "\n\n"
                        + "Your administrative access has been restored. You may now log in to manage your institution:\n"
                        + loginLink + "\n\n"
                        + "Thank you,\nAcadlytic Administration Team";
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
