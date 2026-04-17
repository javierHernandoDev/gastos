package com.gastos.repository;

import com.gastos.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByYearOrderByDateDesc(Integer year);

    List<Expense> findByYearAndMonthOrderByDateDesc(Integer year, Integer month);

    List<Expense> findByYearAndCategoryIdOrderByDateDesc(Integer year, Long categoryId);

    List<Expense> findByYearAndMonthAndCategoryIdOrderByDateDesc(Integer year, Integer month, Long categoryId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.year = :year")
    BigDecimal sumAmountByYear(@Param("year") Integer year);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.year = :year AND e.month = :month")
    BigDecimal sumAmountByYearAndMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT DISTINCT e.year FROM Expense e ORDER BY e.year DESC")
    List<Integer> findDistinctYears();

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.year = :year")
    Long countByYear(@Param("year") Integer year);
}
