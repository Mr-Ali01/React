package com.acadlytic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.config.SessionRepositoryCustomizer;
import org.springframework.session.jdbc.JdbcIndexedSessionRepository;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

import java.time.Duration;

/**
 * Spring Session JDBC configuration (ADR-01, ADR-02, ADR-03).
 *
 * - Persists sessions in MySQL 8 (SPRING_SESSION / SPRING_SESSION_ATTRIBUTES).
 * - Dev cookie: ACADLYTIC_SID (HttpOnly, Secure=false, SameSite=Lax, Path=/, no Domain, session cookie).
 * - Prod cookie: __Host-ACADLYTIC_SID (HttpOnly, Secure=true, SameSite=Lax, Path=/, NO Domain, session cookie).
 */
@Configuration
@EnableJdbcHttpSession(maxInactiveIntervalInSeconds = 1800)
public class SessionConfig {

    @Bean
    public CookieSerializer cookieSerializer(SecurityProperties securityProperties) {
        SecurityProperties.Cookie cookie = securityProperties.getCookie();
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName(cookie.getName());
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(cookie.isSecure());
        serializer.setSameSite(cookie.getSameSite());
        serializer.setCookiePath(cookie.getPath());
        // Session cookie (no Max-Age attribute emitted)
        serializer.setCookieMaxAge(-1);
        // Intentionally omit domainName / domainNamePattern to satisfy __Host- cookie prefix rules (ADR-03)
        serializer.setUseBase64Encoding(false);
        return serializer;
    }

    @Bean
    public SessionRepositoryCustomizer<JdbcIndexedSessionRepository> sessionRepositoryCustomizer(
            SecurityProperties securityProperties) {
        return repository -> repository.setDefaultMaxInactiveInterval(
                Duration.ofSeconds(securityProperties.getSession().getIdleTimeoutSeconds()));
    }
}
