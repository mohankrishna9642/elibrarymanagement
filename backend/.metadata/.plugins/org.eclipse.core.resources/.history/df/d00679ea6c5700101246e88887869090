package com.elibrary.authservice.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String phoneNumber;
    private String city;
    private LocalDateTime registrationDate;
    private boolean accountNonLocked; // Maps to Access Status
    private Set<String> roles; // To show roles like "ROLE_USER", "ROLE_ADMIN"
}