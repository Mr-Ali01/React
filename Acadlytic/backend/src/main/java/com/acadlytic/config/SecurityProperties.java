package com.acadlytic.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private final Session session = new Session();
    private final Cookie cookie = new Cookie();
    private final Lockout lockout = new Lockout();
    private final Tokens tokens = new Tokens();

    public Session getSession() {
        return session;
    }

    public Cookie getCookie() {
        return cookie;
    }

    public Lockout getLockout() {
        return lockout;
    }

    public Tokens getTokens() {
        return tokens;
    }

    public static class Session {
        private int idleTimeoutSeconds = 1800;
        private long absoluteLifetimeSeconds = 43200;

        public int getIdleTimeoutSeconds() {
            return idleTimeoutSeconds;
        }

        public void setIdleTimeoutSeconds(int idleTimeoutSeconds) {
            this.idleTimeoutSeconds = idleTimeoutSeconds;
        }

        public long getAbsoluteLifetimeSeconds() {
            return absoluteLifetimeSeconds;
        }

        public void setAbsoluteLifetimeSeconds(long absoluteLifetimeSeconds) {
            this.absoluteLifetimeSeconds = absoluteLifetimeSeconds;
        }
    }

    public static class Cookie {
        private String name = "ACADLYTIC_SID";
        private boolean secure = false;
        private String sameSite = "Lax";
        private String path = "/";

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public boolean isSecure() {
            return secure;
        }

        public void setSecure(boolean secure) {
            this.secure = secure;
        }

        public String getSameSite() {
            return sameSite;
        }

        public void setSameSite(String sameSite) {
            this.sameSite = sameSite;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }
    }

    public static class Lockout {
        private int maxFailedAttempts = 5;
        private long durationMinutes = 15;

        public int getMaxFailedAttempts() {
            return maxFailedAttempts;
        }

        public void setMaxFailedAttempts(int maxFailedAttempts) {
            this.maxFailedAttempts = maxFailedAttempts;
        }

        public long getDurationMinutes() {
            return durationMinutes;
        }

        public void setDurationMinutes(long durationMinutes) {
            this.durationMinutes = durationMinutes;
        }
    }

    public static class Tokens {
        private long passwordResetExpiryMinutes = 60;
        private long emailChangeExpiryHours = 48;
        private long emailVerificationExpiryHours = 48;

        public long getPasswordResetExpiryMinutes() {
            return passwordResetExpiryMinutes;
        }

        public void setPasswordResetExpiryMinutes(long passwordResetExpiryMinutes) {
            this.passwordResetExpiryMinutes = passwordResetExpiryMinutes;
        }

        public long getEmailChangeExpiryHours() {
            return emailChangeExpiryHours;
        }

        public void setEmailChangeExpiryHours(long emailChangeExpiryHours) {
            this.emailChangeExpiryHours = emailChangeExpiryHours;
        }

        public long getEmailVerificationExpiryHours() {
            return emailVerificationExpiryHours;
        }

        public void setEmailVerificationExpiryHours(long emailVerificationExpiryHours) {
            this.emailVerificationExpiryHours = emailVerificationExpiryHours;
        }
    }
}
