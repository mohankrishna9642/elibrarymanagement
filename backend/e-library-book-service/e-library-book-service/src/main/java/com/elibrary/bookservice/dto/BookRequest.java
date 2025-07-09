package com.elibrary.bookservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class BookRequest {
    @NotBlank(message = "Book Title cannot be empty")
    private String title;

    @NotBlank(message = "Author cannot be empty")
    private String author;

    private String genre;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate publishedDate;

    @Min(value = 1, message = "Number of copies must be at least 1")
    private int numberOfCopies;
}