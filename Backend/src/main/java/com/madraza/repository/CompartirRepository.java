package com.madraza.repository;

import com.madraza.entity.CompartirTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompartirRepository extends JpaRepository<CompartirTest, Long> {

    List<CompartirTest> findByDestinatarioIdOrderByFechaCompartidoDesc(Long destinatarioId);

    List<CompartirTest> findByRemitenteIdOrderByFechaCompartidoDesc(Long remitenteId);

    boolean existsByRemitenteIdAndDestinatarioIdAndTestId(Long remitenteId, Long destinatarioId, Long testId);

    long countByDestinatarioIdAndVistoFalse(Long destinatarioId);

    void deleteByTestId(Long testId);
}
