package com.elibrary.borrowingservice.controller;

import com.elibrary.borrowingservice.dto.BorrowRequest;
import com.elibrary.borrowingservice.dto.BorrowResponse;
import com.elibrary.borrowingservice.service.BorrowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/borrows")
public class BorrowController {

    private static final Logger logger = LoggerFactory.getLogger(BorrowController.class);

    private final BorrowService borrowService;

    public BorrowController(BorrowService borrowService) {
        this.borrowService = borrowService;
    }
    @GetMapping("/public-status")
    @PreAuthorize("permitAll()") // This endpoint is accessible without any authentication
    public ResponseEntity<String> getPublicStatus() {
        logger.info("BorrowController: Received public status check request. Connection successful!");
        return ResponseEntity.ok("Borrowing Service is up and accessible!");
    }

    // USER & ADMIN: Borrow a book
    // User can borrow only one book at a time, and only one copy of a specific book.
    @PostMapping
    @PreAuthorize("isAuthenticated()") // Only authenticated users can borrow
    public ResponseEntity<BorrowResponse> borrowBook(@Valid @RequestBody BorrowRequest borrowRequest) {
        logger.debug("BorrowController: Received borrow request for bookId: {}", borrowRequest.getBookId());
        try {
            BorrowResponse response = borrowService.borrowBook(borrowRequest);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (com.elibrary.borrowingservice.exception.BadRequestException e) {
            logger.warn("BorrowController: Bad request for borrow: {}", e.getMessage());
            return new ResponseEntity(e.getMessage(), HttpStatus.BAD_REQUEST); // 400 Bad Request
        } catch (com.elibrary.borrowingservice.exception.ResourceNotFoundException e) {
            logger.error("BorrowController: Resource not found for borrow: {}", e.getMessage());
            return new ResponseEntity(e.getMessage(), HttpStatus.NOT_FOUND); // 404 Not Found
        } catch (Exception e) {
            logger.error("BorrowController: Unexpected error during borrow: {}", e.getMessage(), e);
            return new ResponseEntity("Internal server error during borrow.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // USER & ADMIN: Return a borrowed book
    @PutMapping("/{borrowId}/return")
    @PreAuthorize("isAuthenticated()") // Only authenticated users can return their books
    public ResponseEntity<BorrowResponse> returnBook(@PathVariable Long borrowId) {
        logger.debug("BorrowController: Received return request for borrowId: {}", borrowId);
        try {
            BorrowResponse response = borrowService.returnBook(borrowId);
            return ResponseEntity.ok(response);
        } catch (com.elibrary.borrowingservice.exception.ResourceNotFoundException e) {
            logger.error("BorrowController: Borrow record not found for return: {}", e.getMessage());
            return new ResponseEntity(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (com.elibrary.borrowingservice.exception.BadRequestException e) {
            logger.warn("BorrowController: Bad request for return: {}", e.getMessage());
            return new ResponseEntity(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            logger.error("BorrowController: Unexpected error during return: {}", e.getMessage(), e);
            return new ResponseEntity("Internal server error during return.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // USER: View their own borrowing history
    @GetMapping("/my-borrows")
    @PreAuthorize("isAuthenticated()") // Only authenticated users can see their own history
    public ResponseEntity<List<BorrowResponse>> getMyBorrows() {
        logger.debug("BorrowController: Received request for user's own borrow history.");
        List<BorrowResponse> borrows = borrowService.getUserBorrows();
        return ResponseEntity.ok(borrows);
    }

    // ADMIN ONLY: View all borrowing records (including user info)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')") // Only ADMINs can see all borrow records
    public ResponseEntity<List<BorrowResponse>> getAllBorrowsForAdmin() {
        logger.debug("BorrowController: Received request for all borrow records for admin view.");
        List<BorrowResponse> borrows = borrowService.getAllBorrowsForAdmin();
        return ResponseEntity.ok(borrows);
    }
}