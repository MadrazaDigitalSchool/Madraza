package com.madraza.controller;

import com.madraza.entity.Categoria;
import com.madraza.repository.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @GetMapping
    public ResponseEntity<List<Categoria>> listar() {
        return ResponseEntity.ok(categoriaRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> crear(@RequestBody Map<String, String> body) {
        String nombre = body.get("nombre");
        if (nombre == null || nombre.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre es obligatorio"));
        }
        nombre = nombre.trim();
        if (categoriaRepository.existsByNombre(nombre)) {
            return ResponseEntity.badRequest().body(Map.of("error", "La categoría ya existe"));
        }
        Categoria categoria = new Categoria();
        categoria.setNombre(nombre);
        return ResponseEntity.ok(categoriaRepository.save(categoria));
    }
}
