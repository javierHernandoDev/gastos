package com.gastos.service;

import com.gastos.dto.CategoryDTO;
import com.gastos.entity.Category;
import com.gastos.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDTO> findAll() {
        return categoryRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Ya existe una categoría con ese nombre");
        }
        Category category = Category.builder()
                .name(dto.getName())
                .color(dto.getColor())
                .icon(dto.getIcon())
                .build();
        return toDTO(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));
        category.setName(dto.getName());
        category.setColor(dto.getColor());
        category.setIcon(dto.getIcon());
        return toDTO(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    private CategoryDTO toDTO(Category c) {
        return CategoryDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .color(c.getColor())
                .icon(c.getIcon())
                .build();
    }
}
