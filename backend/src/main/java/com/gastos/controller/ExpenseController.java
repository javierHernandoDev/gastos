package com.gastos.controller;

import com.gastos.dto.*;
import com.gastos.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public List<ExpenseResponse> findAll(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long categoryId) {
        return expenseService.findAll(year, month, categoryId);
    }

    @GetMapping("/years")
    public List<Integer> getAvailableYears() {
        return expenseService.findAvailableYears();
    }

    @GetMapping("/stats")
    public YearStatsResponse getYearStats(@RequestParam Integer year) {
        return expenseService.getYearStats(year);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.update(id, request));
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<ExpenseResponse> move(@PathVariable Long id, @Valid @RequestBody MoveExpenseRequest request) {
        return ResponseEntity.ok(expenseService.move(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
