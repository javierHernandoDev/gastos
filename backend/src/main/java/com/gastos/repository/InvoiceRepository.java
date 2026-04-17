package com.gastos.repository;

import com.gastos.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByExpenseId(Long expenseId);
    List<Invoice> findByYearOrderByUploadedAtDesc(Integer year);
    void deleteByExpenseId(Long expenseId);
}
