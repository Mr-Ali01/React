package com.resultpoint.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3.0 Specification Configuration.
 * Configures interactive Swagger documentation and JWT Bearer security schemes.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ResultPoint Backend REST API")
                        .version("1.0.0")
                        .description("Academic Calculation, Institutional Regulation Governance, and Student Result Management Monolith.")
                        .contact(new Contact()
                                .name("ResultPoint Engineering")
                                .email("support@resultpoint.edu")
                                .url("https://resultpoint.internal"))
                        .license(new License().name("Proprietary").url("https://resultpoint.internal/terms")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter stateless JWT Bearer token issued by /api/v1/auth/login")));
    }
}
