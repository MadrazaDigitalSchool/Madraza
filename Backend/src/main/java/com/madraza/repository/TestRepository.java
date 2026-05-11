package com.madraza.repository;

import com.madraza.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {

    // Tests públicos activos — solo FETCH creador + preguntas (no opciones):
    // Hibernate 6 no permite JOIN FETCH simultáneo en dos colecciones List (MultipleBagFetchException).
    // Las opciones se inicializan lazy dentro de la transacción en TestService.
    @Query("SELECT DISTINCT t FROM Test t " +
           "LEFT JOIN FETCH t.creador " +
           "LEFT JOIN FETCH t.preguntas " +
           "WHERE t.visibilidad = 'PUBLICO' AND t.activo = true")
    List<Test> findPublicosConPreguntas();

    // Tests del usuario concreto con creador y preguntas cargadas
    @Query("SELECT DISTINCT t FROM Test t " +
           "LEFT JOIN FETCH t.creador " +
           "LEFT JOIN FETCH t.preguntas " +
           "WHERE t.creador.id = :creadorId")
    List<Test> findByCreadorIdConPreguntas(@Param("creadorId") Long creadorId);

    @Query("SELECT DISTINCT t FROM Test t " +
           "LEFT JOIN FETCH t.creador " +
           "LEFT JOIN FETCH t.preguntas " +
           "WHERE t.id = :id")
    Optional<Test> findByIdConPreguntas(@Param("id") Long id);

    // Conteo de tests de un usuario (para límite del plan FREE)
    long countByCreadorId(Long creadorId);
}