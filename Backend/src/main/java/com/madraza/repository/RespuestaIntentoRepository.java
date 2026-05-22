package com.madraza.repository;

import com.madraza.entity.RespuestaIntento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RespuestaIntentoRepository extends JpaRepository<RespuestaIntento, Long> {

    List<RespuestaIntento> findByIntentoIdAndPendienteCorreccionTrue(Long intentoId);
}
