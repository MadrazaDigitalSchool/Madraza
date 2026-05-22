package com.madraza.repository;

import com.madraza.entity.Intento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IntentoRepository extends JpaRepository<Intento, Long> {

    List<Intento> findByUsuarioIdOrderByInicioDesc(Long usuarioId);

    List<Intento> findByTestId(Long testId);
    List<Intento> findByTestIdAndPendienteCorreccionTrueOrderByInicioDesc(Long testId);
    List<Intento> findByTestCreadorIdAndPendienteCorreccionTrue(Long creadorId);
    void deleteByTestId(Long testId);

    void deleteByUsuarioId(Long usuarioId);

    // Conteo de intentos a partir de una fecha (para límite mensual del plan FREE)
    long countByUsuarioIdAndInicioAfter(Long usuarioId, LocalDateTime since);
}