package com.acadlytic.modules.colleges.dto;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.regex.Pattern;

/**
 * Robust URL validator enforcing:
 * - Only HTTP and HTTPS schemes, case-insensitive.
 * - Non-empty valid host (FQDN, localhost, IPv4).
 * - Reject malformed hostnames, whitespace, and malformed URI syntax.
 * - Port range validation (1-65535) when explicitly specified.
 * - Rejection of unsupported schemes (FTP, javascript, data, file).
 */
public final class WebsiteUrlValidator {

    private static final Pattern HOST_LABEL_PATTERN =
            Pattern.compile("^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$");

    private WebsiteUrlValidator() {}

    public static boolean isValid(String url) {
        if (url == null || url.isBlank()) {
            return true; // Null, empty or blank strings are considered valid (clearing optional field)
        }

        String trimmed = url.trim();

        // Disallow any whitespace characters within the URL
        if (trimmed.matches(".*\\s+.*")) {
            return false;
        }

        URI uri;
        try {
            uri = new URI(trimmed);
        } catch (URISyntaxException e) {
            return false;
        }

        if (!uri.isAbsolute()) {
            return false;
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            return false;
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            return false;
        }

        // Validate port range if specified
        int port = uri.getPort();
        if (port != -1 && (port < 1 || port > 65535)) {
            return false;
        }

        // Check if raw authority contains an invalid port
        String rawAuthority = uri.getRawAuthority();
        if (rawAuthority != null && rawAuthority.contains(":")) {
            String[] parts = rawAuthority.split(":");
            if (parts.length == 2 && !parts[1].isEmpty()) {
                try {
                    int p = Integer.parseInt(parts[1]);
                    if (p < 1 || p > 65535) {
                        return false;
                    }
                } catch (NumberFormatException e) {
                    return false;
                }
            }
        }

        return isValidHost(host);
    }

    private static boolean isValidHost(String host) {
        if (host.equalsIgnoreCase("localhost")) {
            return true;
        }

        if (host.startsWith(".") || host.endsWith(".") || host.startsWith("-") || host.endsWith("-") || host.contains("..")) {
            return false;
        }

        String[] labels = host.split("\\.");
        if (labels.length < 2) {
            return false;
        }

        for (String label : labels) {
            if (label.isEmpty() || !HOST_LABEL_PATTERN.matcher(label).matches()) {
                return false;
            }
        }

        return true;
    }
}
