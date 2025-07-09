package com.elibrary.bookservice.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class BookResponse {
    private Long id;
    private String title;
    private String author;
    private String genre;
    private LocalDate publishedDate;
    private String filePath;
    private int numberOfCopies;
    private int availableCopies;
    private String fileStatus;
}