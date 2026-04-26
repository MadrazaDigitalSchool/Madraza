package com.madraza.repository;

import com.madraza.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Spring genera el SQL automáticamente a partir del nombre del método
    Optional<Usuario> findByEmail(String email);

    // Nos dice si ya existe un usuario con ese email (para el registro)
    boolean existsByEmail(String email);
}