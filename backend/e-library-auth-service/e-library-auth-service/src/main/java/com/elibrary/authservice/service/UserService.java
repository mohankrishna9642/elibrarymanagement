package com.elibrary.authservice.service;

import com.elibrary.authservice.dto.UserResponse;
import com.elibrary.authservice.dto.UserUpdateRequest;
import com.elibrary.authservice.entity.User;
import com.elibrary.authservice.exception.ResourceNotFoundException;
import com.elibrary.authservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // User Profile related methods
    public UserResponse getUserProfile(String email) {
        logger.debug("UserService: Fetching user profile by email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("UserService: User not found with email: {}", email);
                    return new ResourceNotFoundException("User not found with email: " + email);
                });
        return convertToUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String email, UserUpdateRequest request) {
        logger.debug("UserService: Updating profile for user with email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("UserService: User not found with email: {}", email);
                    return new ResourceNotFoundException("User not found with email: " + email);
                });

        user.setName(request.getName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setCity(request.getCity());

        User updatedUser = userRepository.save(user);
        logger.info("UserService: Profile updated for user with email: {}", email);
        return convertToUserResponse(updatedUser);
    }

    // Admin methods for user management
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        logger.debug("UserService: Fetching all users for admin view. Page: {}, Size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAll(pageable).map(this::convertToUserResponse);
    }

    @Transactional
    public void restrictUser(Long userId) {
        logger.debug("UserService: Restricting user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("UserService: User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User not found with ID: " + userId);
                });
        user.setAccountNonLocked(false); // Set account status to restricted
        userRepository.save(user);
        logger.info("UserService: User ID {} restricted.", userId);
    }

    @Transactional
    public void activateUser(Long userId) {
        logger.debug("UserService: Activating user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("UserService: User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User not found with ID: " + userId);
                });
        user.setAccountNonLocked(true); // Set account status to active
        userRepository.save(user);
        logger.info("UserService: User ID {} activated.", userId);
    }

    // CRITICAL FIX: This method supports the @DeleteMapping in UserController
    @Transactional
    public void deleteUser(Long userId) {
        logger.debug("UserService: Attempting to delete user with ID: {}", userId);
        // Check if user exists before deleting
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("UserService: User not found for deletion with ID: {}", userId);
                    return new ResourceNotFoundException("User not found with ID: " + userId);
                });
        userRepository.delete(user); // Delete the user entity
        logger.info("UserService: User with ID {} deleted successfully.", userId);
    }


    // This method supports the @PutMapping("/admin/{userId}") for admin updates of all fields
    @Transactional
    public UserResponse updateUserProfileByAdmin(Long userId, UserUpdateRequest userUpdateRequest) {
        logger.debug("UserService: Admin updating profile for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("UserService: User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User not found with ID: " + userId);
                });
        
        user.setName(userUpdateRequest.getName());
        user.setPhoneNumber(userUpdateRequest.getPhoneNumber());
        user.setCity(userUpdateRequest.getCity());
        // Handle accountNonLocked status from the update request
        if (userUpdateRequest.getAccountNonLocked() != null) {
            user.setAccountNonLocked(userUpdateRequest.getAccountNonLocked());
            logger.debug("UserService: User ID {} accountNonLocked updated to {}", userId, userUpdateRequest.getAccountNonLocked());
        }

        User updatedUser = userRepository.save(user);
        logger.info("UserService: User profile updated by admin for ID: {}", userId);
        return convertToUserResponse(updatedUser);
    }

    // Method to get user profile by ID, typically for internal service communication (e.g., from Borrowing Service)
    public UserResponse getUserById(Long userId) {
        logger.debug("UserService: Fetching user profile by ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("UserService: User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User not found with ID: " + userId);
                });
        return convertToUserResponse(user);
    }

    // Helper method to convert User entity to UserResponse DTO
    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setCity(user.getCity());
        response.setRegistrationDate(user.getRegistrationDate());
        response.setAccountNonLocked(user.isAccountNonLocked());
        response.setRoles(user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet())); // Collect roles as a set of strings
        return response;
    }
}