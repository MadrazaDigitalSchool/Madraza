package com.madraza.repository;

import com.madraza.entity.AsignacionUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AsignacionUsuarioRepository extends JpaRepository<AsignacionUsuario, Long> {

    List<AsignacionUsuario> findByUsuarioIdOrderByAsignacionFechaAsignacionDesc(Long usuarioId);

    List<AsignacionUsuario> findByAsignacionId(Long asignacionId);

    Optional<AsignacionUsuario> findByAsignacionIdAndUsuarioId(Long asignacionId, Long usuarioId);

    long countByUsuarioIdAndEstado(Long usuarioId, String estado);

    @Query("SELECT au FROM AsignacionUsuario au " +
           "WHERE au.usuario.id = :usuarioId " +
           "AND au.asignacion.tipoRecurso = 'APUNTE' " +
           "AND au.asignacion.activa = true " +
           "AND au.asignacion.apunte IS NOT NULL")
    List<AsignacionUsuario> findApuntesAsignadosActivos(@Param("usuarioId") Long usuarioId);
}
