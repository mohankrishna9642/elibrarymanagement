package com.elibrary.bookservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StorageConfig implements WebMvcConfigurer {

    @Value("${book.upload.directory}")
    private String uploadDirectory;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(uploadDirectory);
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        registry.addResourceHandler("/books/**") // This URL path will serve files from the upload directory
                .addResourceLocations("file:" + uploadPath + "/");
    }
}