package com.madraza.repository;

import com.madraza.entity.Opcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author Hafdala Mehdi Sidi
 */
@Repository
public interface OpcionRepository extends JpaRepository<Opcion, Long> {
}