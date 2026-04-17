package com.gastos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YearStatsResponse {
    private Integer year;
    private BigDecimal totalAmount;
    private Long totalExpenses;
    private List<MonthStat> monthlyStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthStat {
        private Integer month;
        private String monthName;
        private BigDecimal amount;
        private Long count;
    }
}
