package com.madraza.repository;

import com.madraza.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);

    long countByUsuarioIdAndLeidaFalse(Long usuarioId);

    @Modifying
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.usuario.id = :usuarioId")
    void marcarTodasLeidas(@Param("usuarioId") Long usuarioId);

    @Modifying
    @Query("DELETE FROM Notificacion n WHERE n.usuario.id = :usuarioId")
    void deleteAllByUsuarioId(@Param("usuarioId") Long usuarioId);
}
