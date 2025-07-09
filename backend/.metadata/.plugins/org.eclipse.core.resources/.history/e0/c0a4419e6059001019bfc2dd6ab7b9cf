package com.elibrary.borrowingservice.feign;

import com.elibrary.borrowingservice.dto.BookDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "book-service") // Name of the Book Service in Eureka
public interface BookClient {

    @GetMapping("/api/books/{id}") // Endpoint in Book Service to get book details
    BookDto getBookById(@PathVariable("id") Long id);

    @PutMapping("/api/books/{id}/decrement-copies") // Endpoint to decrement copies
    void decrementCopies(@PathVariable("id") Long id);

    @PutMapping("/api/books/{id}/increment-copies") // Endpoint to increment copies
    void incrementCopies(@PathVariable("id") Long id);

    @GetMapping("/api/books/{id}/available-copies") // Endpoint to get available copies count
    Integer getAvailableCopiesCount(@PathVariable("id") Long id);
}