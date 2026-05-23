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

    @Query("SELECT DISTINCT t FROM Test t " +
           "LEFT JOIN FETCH t.creador " +
           "LEFT JOIN FETCH t.preguntas " +
           "WHERE t.visibilidad = 'PUBLICO' AND t.activo = true")
    List<Test> findPublicosConPreguntas();

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

    @Query("SELECT DISTINCT t FROM Test t " +
           "LEFT JOIN FETCH t.creador " +
           "LEFT JOIN FETCH t.preguntas " +
           "WHERE t.organizacion.id = :orgId AND t.activo = true")
    List<Test> findByOrganizacionIdConPreguntas(@Param("orgId") Long orgId);

    long countByCreadorId(Long creadorId);
}