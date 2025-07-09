package com.elibrary.authservice.controller;

import org.slf4j.Logger; // NEW: Import Logger
import org.slf4j.LoggerFactory; // NEW: Import LoggerFactory
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.elibrary.authservice.dto.UserResponse;
import com.elibrary.authservice.dto.UserUpdateRequest;
import com.elibrary.authservice.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class); // Logger instance

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()") // User must be authenticated
    public ResponseEntity<UserResponse> getUserProfile() {
        logger.debug("UserController: Received request for authenticated user profile.");
        // Get authenticated user's email from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName(); // This will be the email

        UserResponse userProfile = userService.getUserProfile(userEmail);
        return ResponseEntity.ok(userProfile);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()") // User must be authenticated
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UserUpdateRequest request) {
        logger.debug("UserController: Received request to update own profile.");
        // Get authenticated user's email from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName(); // This will be the email

        UserResponse updatedUser = userService.updateProfile(userEmail, request);
        return ResponseEntity.ok(updatedUser);
    }

    // Admin endpoints
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.debug("UserController: Received request for all users (admin view). Page: {}, Size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    // Admin: Restrict a user
    @PutMapping("/admin/{userId}/restrict")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> restrictUser(@PathVariable Long userId) {
        logger.debug("UserController: Admin restricting user with ID: {}", userId);
        try {
            userService.restrictUser(userId);
            return ResponseEntity.ok("User with ID " + userId + " has been restricted.");
        } catch (com.elibrary.authservice.exception.ResourceNotFoundException e) {
            logger.warn("UserController: Restrict failed, user not found with ID: {}", userId);
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            logger.error("UserController: Error restricting user ID {}: {}", userId, e.getMessage(), e);
            return new ResponseEntity<>("Internal server error during restriction.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Admin: Activate a user
    @PutMapping("/admin/{userId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> activateUser(@PathVariable Long userId) {
        logger.debug("UserController: Admin activating user with ID: {}", userId);
        try {
            userService.activateUser(userId);
            return ResponseEntity.ok("User with ID " + userId + " has been activated.");
        } catch (com.elibrary.authservice.exception.ResourceNotFoundException e) {
            logger.warn("UserController: Activate failed, user not found with ID: {}", userId);
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            logger.error("UserController: Error activating user ID {}: {}", userId, e.getMessage(), e);
            return new ResponseEntity<>("Internal server error during activation.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // NEW ADMIN ENDPOINT: Update user profile by Admin (for name, phone, city, accountNonLocked)
    @PutMapping("/admin/{userId}") // Maps to PUT /api/users/admin/{userId}
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserProfileByAdmin(@PathVariable Long userId, @Valid @RequestBody UserUpdateRequest userUpdateRequest) {
        logger.debug("UserController: Admin updating profile for user ID: {}", userId);
        try {
            UserResponse updatedUser = userService.updateUserProfileByAdmin(userId, userUpdateRequest);
            return ResponseEntity.ok(updatedUser);
        } catch (com.elibrary.authservice.exception.ResourceNotFoundException e) {
            logger.warn("UserController: Admin update failed, user not found with ID: {}", userId);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            logger.error("UserController: Error updating user profile for ID {}: {}", userId, e.getMessage(), e);
            return new ResponseEntity<>("Internal server error during admin update.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // NEW ADMIN ENDPOINT: Delete user by Admin
    @DeleteMapping("/admin/{userId}") // Maps to DELETE /api/users/admin/{userId}
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long userId) {
        logger.debug("UserController: Admin deleting user with ID: {}", userId);
        try {
            userService.deleteUser(userId); // Assuming UserService has a deleteUser(Long userId) method
            return ResponseEntity.ok("User with ID " + userId + " deleted successfully!");
        } catch (com.elibrary.authservice.exception.ResourceNotFoundException e) {
            logger.warn("UserController: Delete failed, user not found with ID: {}", userId);
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            logger.error("UserController: Error deleting user ID {}: {}", userId, e.getMessage(), e);
            return new ResponseEntity<>("Internal server error during deletion.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    // Method to get user profile by ID, typically for internal service communication
    @GetMapping("/profile-by-id/{userId}")
    @PreAuthorize("isAuthenticated()") // Securing this endpoint for internal authenticated service calls (e.g. from Borrowing Service)
    public ResponseEntity<UserResponse> getUserProfileById(@PathVariable Long userId) {
        logger.debug("UserController: Received request for user profile by ID: {}", userId);
        UserResponse userProfile = userService.getUserById(userId);
        return ResponseEntity.ok(userProfile);
    }
}