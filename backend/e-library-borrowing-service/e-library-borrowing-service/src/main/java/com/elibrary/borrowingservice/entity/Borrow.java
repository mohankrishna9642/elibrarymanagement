package com.elibrary.borrowingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant; // Using Instant for timestamps

@Entity
@Table(name = "borrows")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Borrow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "borrow_date", nullable = false)
    private Instant borrowDate; // When the book was borrowed

    @Column(name = "return_date")
    private Instant returnDate; // When the book was returned (nullable)

    @Column(name = "due_date", nullable = false)
    private Instant dueDate; // When the book is due

    @Enumerated(EnumType.STRING) // Store enum as string
    @Column(name = "status", nullable = false)
    private BorrowStatus status;

    public enum BorrowStatus {
        BORROWED, RETURNED, OVERDUE
    }
}