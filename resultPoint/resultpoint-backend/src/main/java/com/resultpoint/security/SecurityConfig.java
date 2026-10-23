package com.resultpoint.security;

import com.resultpoint.security.handler.CustomAccessDeniedHandler;
import com.resultpoint.security.jwt.JwtAuthenticationEntryPoint;
import com.resultpoint.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security 6 Foundation Configuration.
 * Configures stateless JWT Bearer authorization, explicit public route allowlists, and uniform JSON entry points.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    private static final String[] PUBLIC_URL_PATTERNS = {
            // Swagger / OpenAPI 3.0 Documentation
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",

            // Public Platform Configuration
            "/api/v1/settings/public",

            // Public Calculation Engine & Tools
            "/api/v1/calculate/**",
            "/api/v1/tools/**",

            // Public Content, Guides, and Resources
            "/api/v1/announcements",
            "/api/v1/blogs/**",
            "/api/v1/resources/**",

            // Public Helpdesk Query Submission
            "/api/v1/support/queries/**",

            // Public Analytics Beacon Ingestion
            "/api/v1/telemetry/**",

            // Explicit Public Authentication Endpoints
            "/api/v1/auth/register",
            "/api/v1/auth/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",

            // Framework Error Dispatcher
            "/error"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Stateless REST APIs: Disable CSRF
                .csrf(AbstractHttpConfigurer::disable)

                // Enforce CORS policy from CorsConfig
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // Configure standardized JSON error handlers
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(unauthorizedHandler)
                        .accessDeniedHandler(accessDeniedHandler)
                )

                // Stateless Session Management
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Authorization Rules
                .authorizeHttpRequests(authorize -> authorize
                        // Allow CORS Pre-flight OPTIONS calls
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public Catalog Reads
                        .requestMatchers(HttpMethod.GET, "/api/v1/catalog/**").permitAll()

                        // Administrative Catalog Mutations
                        .requestMatchers(HttpMethod.POST, "/api/v1/catalog/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/catalog/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/catalog/**").hasRole("ADMIN")

                        // Explicit Public Allowlist
                        .requestMatchers(PUBLIC_URL_PATTERNS).permitAll()

                        // All other endpoints require authenticated JWT Bearer
                        .anyRequest().authenticated()
                );

        // Add JWT filter before UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
