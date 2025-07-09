package com.elibrary.borrowingservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BorrowRequest {
    @NotNull(message = "Book ID cannot be null")
    private Long bookId;
    // userId will be extracted from JWT in the service layer
}