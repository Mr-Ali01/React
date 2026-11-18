package com.acadlytic.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Resolves the client IP address from the request.
 * Relies on Spring's server.forward-headers-strategy=framework rather than trusting
 * arbitrary unverified X-Forwarded-For headers.
 */
@Component
public class ClientIpResolver {

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return null;
        }
        return remoteAddr.length() > 64 ? remoteAddr.substring(0, 64) : remoteAddr;
    }
}
