package com.madraza.repository;

import com.madraza.entity.Apunte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApunteRepository extends JpaRepository<Apunte, Long> {

    List<Apunte> findByUsuarioIdOrderByUpdatedAtDesc(Long usuarioId);

    List<Apunte> findByUsuarioIdAndTestAsociadoId(Long usuarioId, Long testId);
}
