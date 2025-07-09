package com.elibrary.authservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email") // Email must be unique for login
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;
    private String phoneNumber;
    private String city;

    @CreationTimestamp // Automatically sets creation timestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime registrationDate;

    @Column(nullable = false)
    private boolean accountNonLocked = true; // Business logic for 'Access Status'

    @ManyToMany(fetch = FetchType.EAGER) // CRITICAL: Ensure this annotation is correct
    @JoinTable(name = "user_roles", // CRITICAL: This MUST be "user_roles"
            joinColumns = @JoinColumn(name = "user_id"), // CRITICAL: This MUST be "user_id"
            inverseJoinColumns = @JoinColumn(name = "role_id")) // CRITICAL: This MUST be "role_id"
    private Set<Role> roles = new HashSet<>(); // Use a Set to avoid duplicate roles

    // Constructor for registration (ensure it exists if you rely on it)
    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.registrationDate = LocalDateTime.now();
        this.accountNonLocked = true; // Default to non-locked
    }

    public void addRole(Role role) { // Helper method, might not be explicitly used by Spring Data JPA
        this.roles.add(role);
    }
}