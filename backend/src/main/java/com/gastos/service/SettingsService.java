package com.gastos.service;

import com.gastos.dto.UserSettingsDTO;
import com.gastos.entity.User;
import com.gastos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserRepository userRepository;

    public UserSettingsDTO get() {
        User user = currentUser();
        return UserSettingsDTO.builder()
                .monthlyBudget(user.getMonthlyBudget())
                .build();
    }

    @Transactional
    public UserSettingsDTO update(UserSettingsDTO dto) {
        User user = currentUser();
        user.setMonthlyBudget(dto.getMonthlyBudget());
        userRepository.save(user);
        return UserSettingsDTO.builder()
                .monthlyBudget(user.getMonthlyBudget())
                .build();
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
