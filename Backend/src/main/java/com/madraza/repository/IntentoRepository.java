package com.madraza.repository;

import com.madraza.entity.Intento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IntentoRepository extends JpaRepository<Intento, Long> {

    // Historial de intentos de un usuario, del más reciente al más antiguo
    List<Intento> findByUsuarioIdOrderByInicioDesc(Long usuarioId);

    // Buscar y eliminar intentos de un test
    List<Intento> findByTestId(Long testId);
    void deleteByTestId(Long testId);
}