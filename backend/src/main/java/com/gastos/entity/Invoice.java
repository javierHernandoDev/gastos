package com.gastos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Expense expense;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private String filePath;

    private Long fileSize;
    private String contentType;

    @Column(nullable = false)
    private Integer year;

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}
