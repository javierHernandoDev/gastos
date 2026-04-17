package com.gastos.service;

import com.gastos.dto.*;
import com.gastos.entity.Category;
import com.gastos.entity.Expense;
import com.gastos.repository.CategoryRepository;
import com.gastos.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private static final String[] MONTH_NAMES = {
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    };

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final InvoiceService invoiceService;

    public List<ExpenseResponse> findAll(Integer year, Integer month, Long categoryId) {
        List<Expense> expenses;
        if (year != null && month != null && categoryId != null) {
            expenses = expenseRepository.findByYearAndMonthAndCategoryIdOrderByDateDesc(year, month, categoryId);
        } else if (year != null && month != null) {
            expenses = expenseRepository.findByYearAndMonthOrderByDateDesc(year, month);
        } else if (year != null && categoryId != null) {
            expenses = expenseRepository.findByYearAndCategoryIdOrderByDateDesc(year, categoryId);
        } else if (year != null) {
            expenses = expenseRepository.findByYearOrderByDateDesc(year);
        } else {
            expenses = expenseRepository.findAll();
        }
        return expenses.stream().map(this::toResponse).toList();
    }

    public ExpenseResponse findById(Long id) {
        return expenseRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));
    }

    public List<Integer> findAvailableYears() {
        List<Integer> years = expenseRepository.findDistinctYears();
        if (years.isEmpty()) {
            years = List.of(java.time.LocalDate.now().getYear());
        }
        return years;
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request) {
        Category category = resolveCategory(request.getCategoryId());
        Expense expense = Expense.builder()
                .name(request.getName())
                .amount(request.getAmount())
                .date(request.getDate())
                .year(request.getDate().getYear())
                .month(request.getDate().getMonthValue())
                .category(category)
                .description(request.getDescription())
                .build();
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));
        Category category = resolveCategory(request.getCategoryId());
        expense.setName(request.getName());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setYear(request.getDate().getYear());
        expense.setMonth(request.getDate().getMonthValue());
        expense.setCategory(category);
        expense.setDescription(request.getDescription());
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse move(Long id, MoveExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));
        expense.setYear(request.getYear());
        expense.setMonth(request.getMonth());
        expense.setDate(expense.getDate()
                .withYear(request.getYear())
                .withMonth(request.getMonth()));
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(Long id) {
        expenseRepository.deleteById(id);
    }

    public YearStatsResponse getYearStats(Integer year) {
        BigDecimal total = expenseRepository.sumAmountByYear(year);
        Long count = expenseRepository.countByYear(year);

        List<YearStatsResponse.MonthStat> monthlyStats = IntStream.rangeClosed(1, 12)
                .mapToObj(month -> {
                    BigDecimal monthAmount = expenseRepository.sumAmountByYearAndMonth(year, month);
                    return YearStatsResponse.MonthStat.builder()
                            .month(month)
                            .monthName(MONTH_NAMES[month - 1])
                            .amount(monthAmount)
                            .count(expenseRepository.findByYearAndMonthOrderByDateDesc(year, month).stream().count())
                            .build();
                })
                .toList();

        return YearStatsResponse.builder()
                .year(year)
                .totalAmount(total)
                .totalExpenses(count)
                .monthlyStats(monthlyStats)
                .build();
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));
    }

    private ExpenseResponse toResponse(Expense e) {
        CategoryDTO categoryDTO = e.getCategory() == null ? null : CategoryDTO.builder()
                .id(e.getCategory().getId())
                .name(e.getCategory().getName())
                .color(e.getCategory().getColor())
                .icon(e.getCategory().getIcon())
                .build();

        List<InvoiceResponse> invoices = invoiceService.findByExpenseId(e.getId());

        return ExpenseResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .amount(e.getAmount())
                .date(e.getDate())
                .year(e.getYear())
                .month(e.getMonth())
                .category(categoryDTO)
                .description(e.getDescription())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .invoices(invoices)
                .build();
    }
}
