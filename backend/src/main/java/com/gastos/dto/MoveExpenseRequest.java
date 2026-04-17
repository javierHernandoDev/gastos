package com.gastos.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoveExpenseRequest {

    @NotNull(message = "El año es obligatorio")
    @Min(value = 2000, message = "Año inválido")
    @Max(value = 2100, message = "Año inválido")
    private Integer year;

    @NotNull(message = "El mes es obligatorio")
    @Min(value = 1, message = "Mes inválido")
    @Max(value = 12, message = "Mes inválido")
    private Integer month;
}
