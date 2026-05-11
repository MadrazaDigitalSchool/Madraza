package com.madraza.service;

import com.madraza.entity.*;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrganizacionService {

    @Autowired private OrganizacionRepository orgRepo;
    @Autowired private MiembroOrganizacionRepository miembroRepo;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private AsignacionTestRepository asignacionRepo;
    @Autowired private AsignacionUsuarioRepository asignacionUsuarioRepo;
    @Autowired private TestRepository testRepo;

    @Transactional
    public Organizacion crear(String nombre, String tipo, String descripcion, Long adminId) {
        Usuario admin = usuarioRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!admin.isSuscripcionActiva()) {
            throw new AccessDeniedException("Necesitas un plan Premium para crear organizaciones");
        }

        Organizacion org = new Organizacion();
        org.setNombre(nombre);
        org.setTipo(tipo);
        org.setDescripcion(descripcion);
        org.setAdmin(admin);
        org.setCodigoInvitacion(UUID.randomUUID().toString());
        Organizacion saved = orgRepo.save(org);

        // El admin también es miembro
        MiembroOrganizacion miembro = new MiembroOrganizacion();
        miembro.setUsuario(admin);
        miembro.setOrganizacion(saved);
        miembro.setRol("ADMIN");
        miembroRepo.save(miembro);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Organizacion> getMisOrganizaciones(Long usuarioId) {
        List<Organizacion> comoAdmin   = orgRepo.findByAdminId(usuarioId);
        List<Organizacion> comoMiembro = orgRepo.findByMiembroUsuarioId(usuarioId);
        // Unir sin duplicados
        comoMiembro.stream()
                .filter(o -> comoAdmin.stream().noneMatch(a -> a.getId().equals(o.getId())))
                .forEach(comoAdmin::add);
        return comoAdmin;
    }

    public Organizacion getById(Long orgId, Long usuarioId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        verificarAcceso(org, usuarioId);
        return org;
    }

    @Transactional
    public Organizacion actualizar(Long orgId, String nombre, String tipo, String descripcion, Long usuarioId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(usuarioId))
            throw new AccessDeniedException("Solo el administrador puede editar la organización");
        if (nombre != null && !nombre.isBlank()) org.setNombre(nombre);
        if (tipo != null) org.setTipo(tipo);
        if (descripcion != null) org.setDescripcion(descripcion);
        return orgRepo.save(org);
    }

    @Transactional
    public void eliminar(Long orgId, Long usuarioId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(usuarioId))
            throw new AccessDeniedException("Solo el administrador puede eliminar la organización");
        orgRepo.delete(org);
    }

    @Transactional
    public MiembroOrganizacion invitarPorEmail(Long orgId, String email, Long adminId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(adminId))
            throw new AccessDeniedException("Solo el administrador puede invitar miembros");

        Usuario usuario = usuarioRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No existe ningún usuario con ese email"));

        if (miembroRepo.existsByUsuarioIdAndOrganizacionId(usuario.getId(), orgId))
            throw new IllegalArgumentException("El usuario ya es miembro de esta organización");

        MiembroOrganizacion miembro = new MiembroOrganizacion();
        miembro.setUsuario(usuario);
        miembro.setOrganizacion(org);
        miembro.setRol("MIEMBRO");
        return miembroRepo.save(miembro);
    }

    @Transactional
    public void expulsarMiembro(Long orgId, Long miembroUsuarioId, Long adminId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(adminId))
            throw new AccessDeniedException("Solo el administrador puede expulsar miembros");
        if (miembroUsuarioId.equals(adminId))
            throw new IllegalArgumentException("El administrador no puede expulsarse a sí mismo");
        miembroRepo.deleteByUsuarioIdAndOrganizacionId(miembroUsuarioId, orgId);
    }

    @Transactional
    public Organizacion unirsePorCodigo(String codigo, Long usuarioId) {
        Organizacion org = orgRepo.findByCodigoInvitacion(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Código de invitación inválido"));

        if (miembroRepo.existsByUsuarioIdAndOrganizacionId(usuarioId, org.getId()))
            throw new IllegalArgumentException("Ya eres miembro de esta organización");

        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        MiembroOrganizacion miembro = new MiembroOrganizacion();
        miembro.setUsuario(usuario);
        miembro.setOrganizacion(org);
        miembro.setRol("MIEMBRO");
        miembroRepo.save(miembro);
        return org;
    }

    @Transactional
    public AsignacionTest asignarTest(Long orgId, Long testId, LocalDateTime fechaLimite,
                                       String instrucciones, Long adminId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(adminId))
            throw new AccessDeniedException("Solo el administrador puede asignar recursos");

        Test test = testRepo.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurso no encontrado"));
        Usuario admin = usuarioRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        AsignacionTest asignacion = new AsignacionTest();
        asignacion.setTest(test);
        asignacion.setOrganizacion(org);
        asignacion.setAsignadoPor(admin);
        asignacion.setFechaLimite(fechaLimite);
        asignacion.setInstrucciones(instrucciones);
        AsignacionTest saved = asignacionRepo.save(asignacion);

        // Crear seguimiento para cada miembro de la organización
        miembroRepo.findByOrganizacionId(orgId).forEach(m -> {
            AsignacionUsuario au = new AsignacionUsuario();
            au.setAsignacion(saved);
            au.setUsuario(m.getUsuario());
            asignacionUsuarioRepo.save(au);
        });

        return saved;
    }

    public List<MiembroOrganizacion> getMiembros(Long orgId, Long usuarioId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        verificarAcceso(org, usuarioId);
        return miembroRepo.findByOrganizacionId(orgId);
    }

    public List<AsignacionTest> getAsignaciones(Long orgId, Long usuarioId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        verificarAcceso(org, usuarioId);
        return asignacionRepo.findByOrganizacionIdAndActivaTrue(orgId);
    }

    private void verificarAcceso(Organizacion org, Long usuarioId) {
        boolean esAdmin   = org.getAdmin().getId().equals(usuarioId);
        boolean esMiembro = miembroRepo.existsByUsuarioIdAndOrganizacionId(usuarioId, org.getId());
        if (!esAdmin && !esMiembro)
            throw new AccessDeniedException("No tienes acceso a esta organización");
    }
}
