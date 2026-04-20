package com.gastos.repository;

import com.gastos.entity.Expense;
import com.gastos.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Optional<Expense> findByIdAndUser(Long id, User user);

    List<Expense> findByUserAndYearOrderByDateDesc(User user, Integer year);
    List<Expense> findByUserAndYearAndMonthOrderByDateDesc(User user, Integer year, Integer month);
    List<Expense> findByUserAndYearAndCategoryIdOrderByDateDesc(User user, Integer year, Long categoryId);
    List<Expense> findByUserAndYearAndMonthAndCategoryIdOrderByDateDesc(User user, Integer year, Integer month, Long categoryId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user = :user AND e.year = :year")
    BigDecimal sumAmountByUserAndYear(@Param("user") User user, @Param("year") Integer year);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user = :user AND e.year = :year AND e.month = :month")
    BigDecimal sumAmountByUserAndYearAndMonth(@Param("user") User user, @Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT DISTINCT e.year FROM Expense e WHERE e.user = :user ORDER BY e.year DESC")
    List<Integer> findDistinctYearsByUser(@Param("user") User user);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.user = :user AND e.year = :year")
    Long countByUserAndYear(@Param("user") User user, @Param("year") Integer year);
}
