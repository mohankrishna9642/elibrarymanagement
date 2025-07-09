package com.elibrary.bookservice.service;

import com.elibrary.bookservice.dto.BookRequest;
import com.elibrary.bookservice.dto.BookResponse;
import com.elibrary.bookservice.entity.Book;
import com.elibrary.bookservice.exception.ResourceNotFoundException;
import com.elibrary.bookservice.repository.BookRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger; // Added Logger import
import org.slf4j.LoggerFactory; // Added LoggerFactory import

@Service
public class BookService {

    private static final Logger logger = LoggerFactory.getLogger(BookService.class); // Logger instance

    private final BookRepository bookRepository;

    @Value("${book.upload.directory}")
    private String uploadDirectory; // This should be configured as C:/E_Library_Uploads/Books

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional
    public BookResponse addBook(BookRequest request, MultipartFile file) throws IOException {
        logger.debug("BookService: Attempting to add book: {} with file: {}", request.getTitle(), file.getOriginalFilename());

        String filePathForDb; // This will store the /books/UUID_originalFileName.ext
        if (file != null && !file.isEmpty()) {
            filePathForDb = storeFile(file); // Call storeFile with just the file, let it generate the name
            logger.debug("BookService: File stored successfully. Path for DB: {}", filePathForDb);
        } else {
            // Handle case where no file is provided for a new book (though typically required)
            filePathForDb = null;
            logger.warn("BookService: No file provided for new book: {}", request.getTitle());
        }

        Book book = new Book();
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setGenre(request.getGenre());
        book.setPublishedDate(request.getPublishedDate());
        book.setNumberOfCopies(request.getNumberOfCopies());
        book.setAvailableCopies(request.getNumberOfCopies()); // Initially all copies are available
        book.setFilePath(filePathForDb); // Store the generated relative URL path
        book.setFileStatus(filePathForDb != null ? "AVAILABLE" : "MISSING"); // Set status based on file presence

        Book savedBook = bookRepository.save(book);
        logger.debug("BookService: Book metadata saved to DB. Book ID: {}, FilePath: {}", savedBook.getId(), savedBook.getFilePath());

        return convertToBookResponse(savedBook);
    }

    @Transactional
    public BookResponse updateBook(Long id, BookRequest request, MultipartFile file) throws IOException {
        logger.debug("BookService: Attempting to update book with ID: {}", id);
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("BookService: Book not found with ID: {}", id);
                    return new ResourceNotFoundException("Book not found with ID: " + id);
                });

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setGenre(request.getGenre());
        book.setPublishedDate(request.getPublishedDate());

        // Handle copy count changes
        if (request.getNumberOfCopies() != book.getNumberOfCopies()) {
            int oldTotalCopies = book.getNumberOfCopies();
            int currentAvailableCopies = book.getAvailableCopies();
            int newTotalCopies = request.getNumberOfCopies();

            book.setNumberOfCopies(newTotalCopies);
            int currentlyBorrowed = oldTotalCopies - currentAvailableCopies;
            book.setAvailableCopies(Math.max(0, newTotalCopies - currentlyBorrowed));
            logger.debug("BookService: Updated copies for book ID {}. Old Total: {}, New Total: {}, Available: {}", id, oldTotalCopies, newTotalCopies, book.getAvailableCopies());
        }

        // Handle file update
        if (file != null && !file.isEmpty()) {
            logger.debug("BookService: New file provided for update for book ID: {}", id);
            // Delete old file if it exists
            if (book.getFilePath() != null && !book.getFilePath().isEmpty()) {
                try {
                    // Extract just the filename from the stored filePath (e.g., /books/unique_name.pdf -> unique_name.pdf)
                    String oldFileName = book.getFilePath().substring(book.getFilePath().lastIndexOf('/') + 1);
                    Path oldFilePath = Paths.get(uploadDirectory).toAbsolutePath().normalize().resolve(oldFileName);
                    if (Files.deleteIfExists(oldFilePath)) {
                        logger.debug("BookService: Old file deleted: {}", oldFilePath);
                    } else {
                        logger.warn("BookService: Old file not found or could not be deleted: {}", oldFilePath);
                    }
                } catch (IOException e) {
                    logger.error("BookService: Failed to delete old file for book ID {}: {}", id, e.getMessage(), e);
                    // Continue with saving new file even if old one fails to delete
                }
            }
            String newFilePathForDb = storeFile(file); // Store the new file
            book.setFilePath(newFilePathForDb);
            book.setFileStatus("AVAILABLE");
            logger.debug("BookService: New file stored for book ID {}. FilePath: {}", id, newFilePathForDb);
        }

        Book updatedBook = bookRepository.save(book);
        return convertToBookResponse(updatedBook);
    }

    public Page<BookResponse> getAllBooks(Pageable pageable) {
        logger.debug("BookService: Fetching all books. Page: {}, Size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return bookRepository.findAll(pageable).map(this::convertToBookResponse);
    }

    // This method is correctly implemented for fetching.
    public List<BookResponse> searchAndFilterBooks(String query, String genre, String author, boolean popularity) {
        logger.debug("BookService: Searching/filtering books. Query: {}, Genre: {}, Author: {}, Popularity: {}", query, genre, author, popularity);
        List<Book> books;
        if (StringUtils.hasText(query)) {
            books = bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrGenreContainingIgnoreCase(query, query, query);
        } else if (StringUtils.hasText(genre)) {
            books = bookRepository.findByGenreContainingIgnoreCase(genre);
        } else if (StringUtils.hasText(author)) {
            books = bookRepository.findByAuthorContainingIgnoreCase(author);
        } else if (popularity) {
            books = bookRepository.findPopularBooks(); // Assuming this method exists in BookRepository
        } else {
            books = bookRepository.findAll();
        }
        logger.debug("BookService: Found {} books matching search/filter criteria.", books.size());
        return books.stream().map(this::convertToBookResponse).collect(Collectors.toList());
    }

    public BookResponse getBookById(Long id) {
        logger.debug("BookService: Fetching book by ID: {}", id);
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("BookService: Book not found with ID: {}", id);
                    return new ResourceNotFoundException("Book not found with ID: " + id);
                });
        return convertToBookResponse(book);
    }

    @Transactional
    public void deleteBook(Long id) {
        logger.debug("BookService: Attempting to delete book with ID: {}", id);
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("BookService: Book not found with ID: {}", id);
                    return new ResourceNotFoundException("Book not found with ID: " + id);
                });
        if (book.getFilePath() != null && !book.getFilePath().isEmpty()) {
            try {
                // Extract just the filename for deletion
                String fileNameToDelete = book.getFilePath().substring(book.getFilePath().lastIndexOf('/') + 1);
                Path filePath = Paths.get(uploadDirectory).toAbsolutePath().normalize().resolve(fileNameToDelete);
                if (Files.deleteIfExists(filePath)) {
                    logger.debug("BookService: Physical file deleted: {}", filePath);
                } else {
                    logger.warn("BookService: Physical file not found or could not be deleted at: {}", filePath);
                }
            } catch (IOException e) {
                logger.error("BookService: Could not delete physical file for book {}: {}", id, e.getMessage(), e);
            }
        }
        bookRepository.delete(book);
        logger.debug("BookService: Book metadata deleted from DB for ID: {}", id);
    }

    @Transactional
    public void decrementAvailableCopies(Long bookId) {
        logger.debug("BookService: Decrementing available copies for book ID: {}", bookId);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> {
                    logger.error("BookService: Book not found with ID: {}", bookId);
                    return new ResourceNotFoundException("Book not found with ID: " + bookId);
                });
        book.decrementAvailableCopies();
        bookRepository.save(book);
        logger.debug("BookService: Available copies for book ID {} decremented to {}", bookId, book.getAvailableCopies());
    }

    @Transactional
    public void incrementAvailableCopies(Long bookId) {
        logger.debug("BookService: Incrementing available copies for book ID: {}", bookId);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> {
                    logger.error("BookService: Book not found with ID: {}", bookId);
                    return new ResourceNotFoundException("Book not found with ID: " + bookId);
                });
        book.incrementAvailableCopies();
        bookRepository.save(book);
        logger.debug("BookService: Available copies for book ID {} incremented to {}", bookId, book.getAvailableCopies());
    }

    public Integer getAvailableCopiesCount(Long bookId) {
        logger.debug("BookService: Getting available copies for book ID: {}", bookId);
        return bookRepository.findAvailableCopiesById(bookId)
                .orElseThrow(() -> {
                    logger.error("BookService: Book not found or available copies not found for ID: {}", bookId);
                    return new ResourceNotFoundException("Book not found or available copies not found for ID: " + bookId);
                });
    }

    /**
     * Stores a MultipartFile to the configured upload directory.
     * Generates a unique filename (UUID_originalFilename) and returns the relative URL path for database storage.
     * @param file The MultipartFile to store.
     * @return A string representing the relative URL path (e.g., "/books/UUID_original.pdf")
     * @throws IOException if file storage fails.
     */
    private String storeFile(MultipartFile file) throws IOException { // Removed bookTitle parameter
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        // Generate a unique filename using UUID and original file extension
        String fileExtension = "";
        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        
        Path uploadPath = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        logger.debug("BookService: Resolved absolute upload directory path for storage: {}", uploadPath);

        // Ensure the upload directory exists
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            logger.debug("BookService: Created upload directory: {}", uploadPath);
        }

        Path targetLocation = uploadPath.resolve(uniqueFileName);
        logger.debug("BookService: Attempting to store file: {} to: {}", uniqueFileName, targetLocation);

        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        logger.debug("BookService: Successfully stored physical file: {}", uniqueFileName);

        // Return the URL-friendly path (e.g., /books/uniqueFileName.pdf)
        // This is the path that will be stored in the database's filePath field.
        return "/books/" + uniqueFileName;
    }

    /**
     * Retrieves the byte content of a book file from disk based on its relative URL path.
     * @param filePathInDb The relative URL path of the file as stored in the database (e.g., "/books/uniqueFileName.pdf").
     * @return Byte array of the file content.
     * @throws IOException if the file is not found or cannot be read.
     */
    public byte[] retrieveBookFile(String filePathInDb) throws IOException {
        // Extract just the filename from the filePathInDb (e.g., "/books/unique.pdf" -> "unique.pdf")
        String fileName = filePathInDb.substring(filePathInDb.lastIndexOf('/') + 1);

        Path physicalFilePath = Paths.get(uploadDirectory).toAbsolutePath().normalize().resolve(fileName);
        logger.debug("BookService: Attempting to retrieve physical file from: {}", physicalFilePath);

        if (Files.exists(physicalFilePath) && Files.isReadable(physicalFilePath)) {
            logger.debug("BookService: Physical file found and is readable at: {}", physicalFilePath);
            return Files.readAllBytes(physicalFilePath);
        } else {
            logger.error("BookService: Physical file NOT FOUND or NOT READABLE at: {}", physicalFilePath);
            throw new IOException("Book file not found or not accessible at: " + physicalFilePath.toAbsolutePath());
        }
    }


    // Helper to convert Book entity to DTO
    private BookResponse convertToBookResponse(Book book) {
        BookResponse response = new BookResponse();
        response.setId(book.getId());
        response.setTitle(book.getTitle());
        response.setAuthor(book.getAuthor());
        response.setGenre(book.getGenre());
        response.setPublishedDate(book.getPublishedDate());
        // CRITICAL FIX: The filePath from the Book entity is already the /books/unique_name.pdf format.
        // So, use it directly without re-prefixing.
        response.setFilePath(book.getFilePath()); // Book.getFilePath() already contains "/books/"
        response.setNumberOfCopies(book.getNumberOfCopies());
        response.setAvailableCopies(book.getAvailableCopies());
        response.setFileStatus(book.getFileStatus());
        return response;
    }
}