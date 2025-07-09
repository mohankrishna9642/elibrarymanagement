package com.elibrary.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank(message = "Current password cannot be empty")
    private String currentPassword;

    @NotBlank(message = "New password cannot be empty")
    @Size(min = 6, message = "New password must be at least 6 characters long")
    private String newPassword;

    @NotBlank(message = "Confirm new password cannot be empty")
    private String confirmPassword;
}