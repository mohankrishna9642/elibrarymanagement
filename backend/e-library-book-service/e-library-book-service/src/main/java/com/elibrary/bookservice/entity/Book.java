package com.elibrary.bookservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    private String genre;

    private LocalDate publishedDate;

    @Column(nullable = false)
    private String filePath;

    private int numberOfCopies;

    private int availableCopies;

    private String fileStatus;

    @PrePersist
    public void prePersist() {
        if (this.availableCopies == 0) {
            this.availableCopies = this.numberOfCopies;
        }
        if (this.fileStatus == null) {
            this.fileStatus = "PENDING_UPLOAD";
        }
    }

    public void decrementAvailableCopies() {
        if (this.availableCopies > 0) {
            this.availableCopies--;
        }
    }

    public void incrementAvailableCopies() {
        if (this.availableCopies < this.numberOfCopies) {
            this.availableCopies++;
        }
    }
}