package com.elibrary.bookservice.repository;

import com.elibrary.bookservice.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrGenreContainingIgnoreCase(String title, String author, String genre);
    List<Book> findByGenreContainingIgnoreCase(String genre);
    List<Book> findByAuthorContainingIgnoreCase(String author);

    @Query("SELECT b.availableCopies FROM Book b WHERE b.id = ?1")
    Optional<Integer> findAvailableCopiesById(Long bookId);

    @Query(value = "SELECT * FROM books ORDER BY id DESC LIMIT 10", nativeQuery = true)
    List<Book> findPopularBooks();
}