package com.gastos.controller;

import com.gastos.dto.InvoiceAnalysisResponse;
import com.gastos.dto.InvoiceResponse;
import com.gastos.service.InvoiceAnalysisService;
import com.gastos.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceAnalysisService invoiceAnalysisService;

    @GetMapping("/expense/{expenseId}")
    public List<InvoiceResponse> findByExpense(@PathVariable Long expenseId) {
        return invoiceService.findByExpenseId(expenseId);
    }

    @GetMapping("/year/{year}")
    public List<InvoiceResponse> findByYear(@PathVariable Integer year) {
        return invoiceService.findByYear(year);
    }

    @PostMapping("/upload/{expenseId}")
    public ResponseEntity<InvoiceResponse> upload(
            @PathVariable Long expenseId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(invoiceService.upload(expenseId, file));
    }

    @PostMapping("/analyze")
    public ResponseEntity<InvoiceAnalysisResponse> analyze(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(invoiceAnalysisService.analyze(file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws IOException {
        invoiceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
