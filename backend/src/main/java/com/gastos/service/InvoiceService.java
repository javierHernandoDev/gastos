package com.gastos.service;

import com.gastos.dto.InvoiceResponse;
import com.gastos.entity.Expense;
import com.gastos.entity.Invoice;
import com.gastos.entity.User;
import com.gastos.repository.ExpenseRepository;
import com.gastos.repository.InvoiceRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;

    @Value("${app.uploads.dir}")
    private String uploadsDir;

    @Value("${app.uploads.base-url}")
    private String baseUrl;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(uploadsDir));
    }

    public List<InvoiceResponse> findByExpenseId(Long expenseId) {
        return invoiceRepository.findByExpenseId(expenseId)
                .stream().map(this::toResponse).toList();
    }

    public List<InvoiceResponse> findByYear(Integer year) {
        return invoiceRepository.findByExpenseUserAndYear(currentUser(), year)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public InvoiceResponse upload(Long expenseId, MultipartFile file) throws IOException {
        User user = currentUser();
        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String safeName = expense.getName().replaceAll("[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]", "_");
        String filename = safeName + "_" + expense.getYear() + "_" + System.currentTimeMillis() + extension;
        Path filePath = Paths.get(uploadsDir, filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Invoice invoice = Invoice.builder()
                .expense(expense)
                .filename(filename)
                .originalName(originalFilename)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .year(expense.getYear())
                .build();

        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public void delete(Long id) throws IOException {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Factura no encontrada"));
        if (!invoice.getExpense().getUser().getId().equals(currentUser().getId())) {
            throw new IllegalArgumentException("Factura no encontrada");
        }
        Path filePath = Paths.get(invoice.getFilePath());
        Files.deleteIfExists(filePath);
        invoiceRepository.delete(invoice);
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private InvoiceResponse toResponse(Invoice inv) {
        return InvoiceResponse.builder()
                .id(inv.getId())
                .expenseId(inv.getExpense().getId())
                .expenseName(inv.getExpense().getName())
                .filename(inv.getFilename())
                .originalName(inv.getOriginalName())
                .fileSize(inv.getFileSize())
                .contentType(inv.getContentType())
                .year(inv.getYear())
                .downloadUrl(baseUrl + "/" + inv.getFilename())
                .uploadedAt(inv.getUploadedAt())
                .build();
    }
}
