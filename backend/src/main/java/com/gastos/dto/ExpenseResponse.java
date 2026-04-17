package com.gastos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseResponse {
    private Long id;
    private String name;
    private BigDecimal amount;
    private LocalDate date;
    private Integer year;
    private Integer month;
    private CategoryDTO category;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InvoiceResponse> invoices;
}
