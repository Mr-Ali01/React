package com.acadlytic.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI acadlyticOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Acadlytic REST API")
                        .description("Academic Intelligence and Longitudinal Academic Records Platform for University-Affiliated Colleges")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Acadlytic Engineering Team")
                                .email("engineering@acadlytic.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://acadlytic.com/terms")));
    }
}
