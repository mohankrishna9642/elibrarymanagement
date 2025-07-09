package com.elibrary.authservice.security.services;

import com.elibrary.authservice.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String email;
    private String name;

    @JsonIgnore
    private String password;

    private Collection<? extends GrantedAuthority> authorities;
    private Boolean accountNonLocked; // CRITICAL: This field MUST be here

    // CRITICAL: Update constructor to accept accountNonLocked
    public UserDetailsImpl(Long id, String email, String password, String name,
                           Collection<? extends GrantedAuthority> authorities,
                           Boolean accountNonLocked) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.name = name;
        this.authorities = authorities;
        this.accountNonLocked = accountNonLocked; // CRITICAL: Assign the value
    }

    // CRITICAL: Update build method to pass accountNonLocked from the User entity
    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getName(),
                authorities,
                user.isAccountNonLocked() // CRITICAL: Pass the actual boolean value from User entity
        );
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email; // Use email as username
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Can be customized for account expiration logic
    }

    @Override
    public boolean isAccountNonLocked() {
        // CRITICAL FIX: This MUST return the actual accountNonLocked status from the user.
        // If it's false, Spring Security will throw a LockedException during authentication.
        return this.accountNonLocked != null ? this.accountNonLocked : true; // Safely return status, default true if null
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Can be customized for password expiration logic
    }

    @Override
    public boolean isEnabled() {
        return true; // Can be customized for overall user enabled/disabled status
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }
}