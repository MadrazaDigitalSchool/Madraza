package com.madraza.repository;

import com.madraza.entity.MiembroOrganizacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MiembroOrganizacionRepository extends JpaRepository<MiembroOrganizacion, Long> {

    List<MiembroOrganizacion> findByOrganizacionId(Long organizacionId);

    Optional<MiembroOrganizacion> findByUsuarioIdAndOrganizacionId(Long usuarioId, Long organizacionId);

    boolean existsByUsuarioIdAndOrganizacionId(Long usuarioId, Long organizacionId);

    void deleteByUsuarioIdAndOrganizacionId(Long usuarioId, Long organizacionId);
}
