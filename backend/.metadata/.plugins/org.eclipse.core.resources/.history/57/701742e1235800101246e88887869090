package com.elibrary.bookservice.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI customizeOpenAPI() {
        return new OpenAPI()
            // Define components for our security scheme (Bearer JWT)
            .components(new Components()
                .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                    .name(SECURITY_SCHEME_NAME)
                    .type(SecurityScheme.Type.HTTP) // It's an HTTP scheme
                    .scheme("bearer")               // The scheme is "bearer" (e.g., Authorization: Bearer TOKEN)
                    .bearerFormat("JWT")))          // The format is JWT

            // Apply this security scheme GLOBALLY to all API operations by default.
            // Operations explicitly marked with @SecurityRequirements({}) will override this.
            .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }
}