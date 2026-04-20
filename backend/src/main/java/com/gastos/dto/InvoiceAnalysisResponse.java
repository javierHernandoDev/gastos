package com.gastos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceAnalysisResponse {
    private String name;
    private String date;
    private Double amount;
    private String category;
    private boolean success;
    private String message;
}
