package com.elibrary.authservice.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    // Define the name of our security scheme
    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI customizeOpenAPI() {
        return new OpenAPI()
            // Define components for security schemes
            .components(new Components()
                .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                    .name(SECURITY_SCHEME_NAME)
                    .type(SecurityScheme.Type.HTTP) // It's an HTTP scheme
                    .scheme("bearer")               // The scheme is "bearer"
                    .bearerFormat("JWT")))          // The format is JWT

            // Add a global security requirement: ALL endpoints will require this scheme by default
            // You can override this at the controller/method level with @SecurityRequirement(name = "someOtherScheme")
            // or @SecurityRequirements({}) to remove security for specific endpoints.
            .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }
}