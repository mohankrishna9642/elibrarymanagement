package com.elibrary.borrowingservice.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.elibrary.borrowingservice.dto.BookDto;
import com.elibrary.borrowingservice.dto.BorrowRequest;
import com.elibrary.borrowingservice.dto.BorrowResponse;
import com.elibrary.borrowingservice.dto.UserDto;
import com.elibrary.borrowingservice.entity.Borrow;
import com.elibrary.borrowingservice.entity.Borrow.BorrowStatus;
import com.elibrary.borrowingservice.exception.BadRequestException;
import com.elibrary.borrowingservice.exception.ResourceNotFoundException;
import com.elibrary.borrowingservice.feign.AuthClient;
import com.elibrary.borrowingservice.feign.BookClient;
import com.elibrary.borrowingservice.repository.BorrowRepository;

import feign.FeignException; // CRITICAL: Import FeignException to catch specific Feign errors

@Service
public class BorrowService {

    private static final Logger logger = LoggerFactory.getLogger(BorrowService.class);

    private final BorrowRepository borrowRepository;
    private final BookClient bookClient;
    private final AuthClient authClient;

    public BorrowService(BorrowRepository borrowRepository, BookClient bookClient, AuthClient authClient) {
        this.borrowRepository = borrowRepository;
        this.bookClient = bookClient;
        this.authClient = authClient;
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("User not authenticated.");
        }
        if (authentication.getDetails() instanceof String) {
            try {
                return Long.valueOf((String) authentication.getDetails());
            } catch (NumberFormatException e) {
                logger.error("BorrowService: Invalid User ID format in authentication details: {}", authentication.getDetails(), e);
                throw new BadRequestException("Invalid user ID in authentication context.");
            }
        }
        logger.error("BorrowService: Authenticated details is not a String (User ID). Actual type: {}", authentication.getDetails().getClass().getName());
        throw new BadRequestException("Could not retrieve authenticated user ID from security context details.");
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("User not authenticated.");
        }
        return authentication.getName();
    }


    @Transactional
    public BorrowResponse borrowBook(BorrowRequest borrowRequest) {
        Long userId = getAuthenticatedUserId();
        Long bookId = borrowRequest.getBookId();
        logger.debug("BorrowService: User {} attempting to borrow book {}", userId, bookId);

        Optional<Borrow> existingBorrow = borrowRepository.findByUserIdAndBookIdAndStatus(userId, bookId, BorrowStatus.BORROWED);
        if (existingBorrow.isPresent()) {
            logger.warn("BorrowService: User {} already has an active borrow for book {}", userId, bookId);
            throw new BadRequestException("You have already borrowed this book and have not returned it yet.");
        }

        List<Borrow> activeBorrows = borrowRepository.findByUserIdAndStatus(userId, BorrowStatus.BORROWED);
        if (!activeBorrows.isEmpty()) {
            logger.warn("BorrowService: User {} already has an active borrow for another book.", userId);
            throw new BadRequestException("You must return your currently borrowed book before borrowing another one.");
        }

        Integer availableCopies;
        try {
            availableCopies = bookClient.getAvailableCopiesCount(bookId);
            logger.debug("BorrowService: Book {} available copies: {}", bookId, availableCopies);
        } catch (FeignException.NotFound e) {
            logger.error("BorrowService: Book not found in Book Service for ID {} during borrow check: {}", bookId, e.getMessage());
            throw new ResourceNotFoundException("Book not found in the library."); // Book is entirely gone
        } catch (FeignException e) {
            logger.error("BorrowService: Error calling Book Service for ID {} during availability check: {}", bookId, e.getMessage(), e);
            throw new BadRequestException("Failed to check book availability. Please try again later.");
        }


        if (availableCopies == null || availableCopies <= 0) {
            logger.warn("BorrowService: Book {} is not available for borrowing.", bookId);
            throw new BadRequestException("Book is not currently available.");
        }

        try {
            bookClient.decrementCopies(bookId);
            logger.debug("BorrowService: Decremented copies for book {}", bookId);
        } catch (FeignException.NotFound e) {
            logger.error("BorrowService: Book not found in Book Service for ID {} when trying to decrement copies: {}", bookId, e.getMessage());
            throw new ResourceNotFoundException("Book not found or already deleted from the library. Cannot borrow."); // Cannot borrow if book gone
        } catch (FeignException e) {
            logger.error("BorrowService: Error calling Book Service for ID {} to decrement copies: {}", bookId, e.getMessage(), e);
            throw new BadRequestException("Failed to update book availability. Please try again later.");
        }


        Instant now = Instant.now();
        Instant dueDate = now.plus(14, ChronoUnit.DAYS);

        Borrow borrow = new Borrow();
        borrow.setUserId(userId);
        borrow.setBookId(bookId);
        borrow.setBorrowDate(now);
        borrow.setDueDate(dueDate);
        borrow.setStatus(BorrowStatus.BORROWED);

        Borrow savedBorrow = borrowRepository.save(borrow);
        logger.info("BorrowService: Book {} borrowed by user {} successfully. Borrow ID: {}", bookId, userId, savedBorrow.getId());

        return convertToBorrowResponse(savedBorrow);
    }

    @Transactional
    public BorrowResponse returnBook(Long borrowId) {
        Long userId = getAuthenticatedUserId();
        logger.debug("BorrowService: User {} attempting to return borrow ID {}", userId, borrowId);

        Borrow borrow = borrowRepository.findById(borrowId)
                .orElseThrow(() -> {
                    logger.error("BorrowService: Borrow record not found with ID: {}", borrowId);
                    return new ResourceNotFoundException("Borrow record not found with ID: " + borrowId);
                });

        if (!borrow.getUserId().equals(userId)) {
            logger.warn("BorrowService: User {} attempted to return book from another user (Borrow ID: {}).", userId, borrowId);
            throw new BadRequestException("You are not authorized to return this book.");
        }

        if (borrow.getStatus() != BorrowStatus.BORROWED && borrow.getStatus() != BorrowStatus.OVERDUE) {
            logger.warn("BorrowService: Borrow ID {} is already in status {}", borrowId, borrow.getStatus());
            throw new BadRequestException("This book has already been returned or is not currently borrowed.");
        }

        // --- CRITICAL FIX: Gracefully handle missing book during return ---
        try {
            // Attempt to increment copies in Book Service
            bookClient.incrementCopies(borrow.getBookId()); 
            logger.debug("BorrowService: Successfully incremented copies for book {} in Book Service.", borrow.getBookId());
        } catch (FeignException.NotFound e) {
            // If Book Service returns 404, the book was deleted.
            logger.warn("BorrowService: Book with ID {} not found in Book Service during return. It might have been deleted. Proceeding to mark borrow as RETURNED.", borrow.getBookId());
            // We acknowledge the book is gone and still mark the borrow record as returned.
            // This prevents the 500 error and allows the user to borrow another book.
        } catch (FeignException e) { 
            // Catch other Feign-related errors (e.g., 500 from Book Service, connection issues)
            logger.error("BorrowService: Error calling Book Service for ID {} to increment copies: {}", borrow.getBookId(), e.getMessage(), e);
            throw new BadRequestException("Failed to communicate with Book Service to update availability. Please try again later.");
        } catch (Exception e) { 
            // Catch any other unexpected exceptions during the remote call
            logger.error("BorrowService: Unexpected error during book copies increment for ID {}: {}", borrow.getBookId(), e.getMessage(), e);
            throw new BadRequestException("An unexpected error occurred during return processing. Please try again later.");
        }


        // Step 2: Update borrow record regardless of Book Service copy increment success/failure (if 404)
        borrow.setReturnDate(Instant.now());
        borrow.setStatus(BorrowStatus.RETURNED);

        Borrow updatedBorrow = borrowRepository.save(borrow);
        logger.info("BorrowService: Book {} returned by user {} successfully. Borrow ID: {}. Borrow record status updated.", borrow.getBookId(), userId, updatedBorrow.getId());

        return convertToBorrowResponse(updatedBorrow);
    }

    public List<BorrowResponse> getUserBorrows() {
        Long userId = getAuthenticatedUserId();
        logger.debug("BorrowService: Fetching all borrow records for user {}", userId);
        List<Borrow> borrows = borrowRepository.findByUserId(userId);
        return borrows.stream()
                .map(this::convertToBorrowResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getAllBorrowsForAdmin() {
        logger.debug("BorrowService: Fetching all borrow records for admin view.");
        return borrowRepository.findAll().stream()
                .map(this::convertToBorrowResponse)
                .collect(Collectors.toList());
    }

    private BorrowResponse convertToBorrowResponse(Borrow borrow) {
        BorrowResponse response = new BorrowResponse();
        response.setId(borrow.getId());
        response.setUserId(borrow.getUserId());
        response.setBookId(borrow.getBookId());
        response.setBorrowDate(borrow.getBorrowDate());
        response.setReturnDate(borrow.getReturnDate());
        response.setDueDate(borrow.getDueDate());
        response.setStatus(borrow.getStatus());

        // Populate book details via Feign client call (if bookId is not null)
        if (borrow.getBookId() != null) {
            try {
                BookDto bookDto = bookClient.getBookById(borrow.getBookId());
                if (bookDto != null) {
                    response.setBookTitle(bookDto.getTitle());
                    response.setBookAuthor(bookDto.getAuthor());
                    response.setBookFilePath(bookDto.getFilePath());
                } else {
                    logger.warn("BorrowService: Book details not found (null response) for bookId: {}. Displaying as '[Unavailable Book]'.", borrow.getBookId());
                    response.setBookTitle("[Unavailable Book]");
                    response.setBookAuthor("[Unavailable Book]");
                    response.setBookFilePath(null);
                }
            } catch (FeignException.NotFound e) {
                // Book was explicitly deleted from Book Service
                logger.warn("BorrowService: Book with ID {} not found in Book Service. Displaying as '[Deleted Book]'.", borrow.getBookId());
                response.setBookTitle("[Deleted Book]");
                response.setBookAuthor("[Deleted Book]");
                response.setBookFilePath(null);
            } catch (Exception e) {
                // Other errors fetching book details (e.g., Auth service down, network issues)
                logger.error("BorrowService: Error fetching book details for bookId {}: {}", borrow.getBookId(), e.getMessage(), e);
                response.setBookTitle("[Error Fetching Book]");
                response.setBookAuthor("[Error Fetching Book]");
                response.setBookFilePath(null);
            }
        }

        // Populate user details via Feign client call (if userId is not null)
        if (borrow.getUserId() != null) {
            try {
                UserDto userDto = authClient.getUserProfileById(borrow.getUserId());
                if (userDto != null) {
                    response.setUserEmail(userDto.getEmail());
                    response.setUserName(userDto.getName());
                } else {
                    logger.warn("BorrowService: User details not found (null response) for userId: {}. Displaying as '[Unavailable User]'.", borrow.getUserId());
                    response.setUserEmail("[Unavailable User]");
                    response.setUserName("[Unavailable User]");
                }
            } catch (FeignException.NotFound e) {
                logger.warn("BorrowService: User with ID {} not found in Auth Service. Displaying as '[Deleted User]'.", borrow.getUserId());
                response.setUserEmail("[Deleted User]");
                response.setUserName("[Deleted User]");
            } catch (Exception e) {
                logger.error("BorrowService: Error fetching user details for userId {}: {}", borrow.getUserId(), e.getMessage());
                response.setUserEmail("[Error Fetching User]");
                response.setUserName("[Error Fetching User]");
            }
        }
        return response;
    }
}