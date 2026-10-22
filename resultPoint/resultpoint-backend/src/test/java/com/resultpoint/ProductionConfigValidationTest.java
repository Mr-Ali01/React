package com.resultpoint;

import com.resultpoint.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

public class ProductionConfigValidationTest {

    @Test
    void testProductionFailsWhenJwtSecretMissing() {
        Assertions.assertThrows(Exception.class, () -> {
            ConfigurableApplicationContext context = new SpringApplicationBuilder(ResultPointApplication.class)
                    .profiles("prod")
                    .properties(
                            "spring.profiles.active=prod",
                            "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration",
                            "DB_HOST=localhost",
                            "DB_PORT=3306",
                            "DB_NAME=resultpoint_dev",
                            "DB_APP_USER=resultpoint_app",
                            "DB_APP_PASSWORD=App_Secret_2026!",
                            "spring.datasource.url=jdbc:mysql://localhost:3306/resultpoint_dev?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",
                            "spring.jpa.hibernate.ddl-auto=none"
                            // Intentionally omit JWT_SECRET and TOKEN_CACHE_KEY
                    )
                    .run();
            context.close();
        }, "Production startup must fail when JWT_SECRET is not configured");
    }

    @Test
    void testProductionStartsWhenValidSecretsProvided() {
        String validSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(ResultPointApplication.class)
                .properties(
                        "spring.profiles.active=prod",
                        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration",
                        "DB_HOST=localhost",
                        "DB_PORT=3306",
                        "DB_NAME=resultpoint_dev",
                        "DB_APP_USER=resultpoint_app",
                        "DB_APP_PASSWORD=App_Secret_2026!",
                        "spring.datasource.url=jdbc:mysql://localhost:3306/resultpoint_dev?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",
                        "spring.jpa.hibernate.ddl-auto=none",
                        "JWT_SECRET=" + validSecret,
                        "TOKEN_CACHE_KEY=" + validSecret,
                        "CORS_ALLOWED_ORIGINS=https://resultpoint.internal"
                )
                .run()) {

            Assertions.assertNotNull(context);
            JwtTokenProvider provider = context.getBean(JwtTokenProvider.class);
            Assertions.assertNotNull(provider);
        }
    }
}
