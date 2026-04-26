package com.madraza.repository;

import com.madraza.entity.Pregunta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author Hafdala Mehdi Sidi
 */
@Repository
public interface PreguntaRepository extends JpaRepository<Pregunta, Long> {
}