package com.gastos.controller;

import com.gastos.dto.UserSettingsDTO;
import com.gastos.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<UserSettingsDTO> get() {
        return ResponseEntity.ok(settingsService.get());
    }

    @PutMapping
    public ResponseEntity<UserSettingsDTO> update(@RequestBody UserSettingsDTO dto) {
        return ResponseEntity.ok(settingsService.update(dto));
    }
}
