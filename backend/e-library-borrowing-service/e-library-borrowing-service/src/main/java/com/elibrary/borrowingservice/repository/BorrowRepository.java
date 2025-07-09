package com.elibrary.borrowingservice.repository;

import com.elibrary.borrowingservice.entity.Borrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRepository extends JpaRepository<Borrow, Long> {
    // Find all borrowed (not yet returned) books by a specific user
    List<Borrow> findByUserIdAndStatus(Long userId, Borrow.BorrowStatus status);

    // Find a specific borrowed book by user and book ID that's not yet returned
    Optional<Borrow> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, Borrow.BorrowStatus status);

    // Find all borrows by a specific user (returned or not)
    List<Borrow> findByUserId(Long userId);

    // Find all borrows (for admin view)
    List<Borrow> findAll(); // Already provided by JpaRepository, but good to note
}