package com.gastos.repository;

import com.gastos.entity.Invoice;
import com.gastos.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByExpenseId(Long expenseId);
    void deleteByExpenseId(Long expenseId);

    @Query("SELECT i FROM Invoice i WHERE i.expense.user = :user AND i.year = :year ORDER BY i.uploadedAt DESC")
    List<Invoice> findByExpenseUserAndYear(@Param("user") User user, @Param("year") Integer year);
}
