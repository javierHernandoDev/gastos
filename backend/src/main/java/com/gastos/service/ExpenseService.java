package com.gastos.service;

import com.gastos.dto.*;
import com.gastos.entity.Category;
import com.gastos.entity.Expense;
import com.gastos.entity.User;
import com.gastos.repository.CategoryRepository;
import com.gastos.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
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
        User user = currentUser();
        List<Expense> expenses;
        if (year != null && month != null && categoryId != null) {
            expenses = expenseRepository.findByUserAndYearAndMonthAndCategoryIdOrderByDateDesc(user, year, month, categoryId);
        } else if (year != null && month != null) {
            expenses = expenseRepository.findByUserAndYearAndMonthOrderByDateDesc(user, year, month);
        } else if (year != null && categoryId != null) {
            expenses = expenseRepository.findByUserAndYearAndCategoryIdOrderByDateDesc(user, year, categoryId);
        } else if (year != null) {
            expenses = expenseRepository.findByUserAndYearOrderByDateDesc(user, year);
        } else {
            expenses = expenseRepository.findAll();
        }
        return expenses.stream().map(this::toResponse).toList();
    }

    public ExpenseResponse findById(Long id) {
        return expenseRepository.findByIdAndUser(id, currentUser())
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));
    }

    public List<Integer> findAvailableYears() {
        List<Integer> years = expenseRepository.findDistinctYearsByUser(currentUser());
        if (years.isEmpty()) {
            years = List.of(java.time.LocalDate.now().getYear());
        }
        return years;
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request) {
        User user = currentUser();
        Category category = resolveCategory(request.getCategoryId(), user);
        Expense expense = Expense.builder()
                .name(request.getName())
                .amount(request.getAmount())
                .date(request.getDate())
                .year(request.getDate().getYear())
                .month(request.getDate().getMonthValue())
                .category(category)
                .description(request.getDescription())
                .user(user)
                .build();
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        User user = currentUser();
        Expense expense = expenseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));
        Category category = resolveCategory(request.getCategoryId(), user);
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
        Expense expense = expenseRepository.findByIdAndUser(id, currentUser())
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
        expenseRepository.findByIdAndUser(id, currentUser())
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));
        expenseRepository.deleteById(id);
    }

    public YearStatsResponse getYearStats(Integer year) {
        User user = currentUser();
        BigDecimal total = expenseRepository.sumAmountByUserAndYear(user, year);
        Long count = expenseRepository.countByUserAndYear(user, year);

        List<YearStatsResponse.MonthStat> monthlyStats = IntStream.rangeClosed(1, 12)
                .mapToObj(month -> {
                    BigDecimal monthAmount = expenseRepository.sumAmountByUserAndYearAndMonth(user, year, month);
                    long monthCount = expenseRepository.findByUserAndYearAndMonthOrderByDateDesc(user, year, month).size();
                    return YearStatsResponse.MonthStat.builder()
                            .month(month)
                            .monthName(MONTH_NAMES[month - 1])
                            .amount(monthAmount)
                            .count(monthCount)
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

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Category resolveCategory(Long categoryId, User user) {
        if (categoryId == null) return null;
        return categoryRepository.findByIdAndUser(categoryId, user)
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
