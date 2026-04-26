package com.madraza.repository;

import com.madraza.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {

    // Todos los tests de un usuario concreto
    List<Test> findByCreadorId(Long creadorId);

    // Tests públicos activos
    List<Test> findByVisibilidadAndActivoTrue(String visibilidad);
}