package com.gastos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {
    private Long id;
    private Long expenseId;
    private String expenseName;
    private String filename;
    private String originalName;
    private Long fileSize;
    private String contentType;
    private Integer year;
    private String downloadUrl;
    private LocalDateTime uploadedAt;
}
