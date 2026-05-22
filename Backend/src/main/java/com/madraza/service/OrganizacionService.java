package com.madraza.service;

import com.madraza.entity.*;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    @Autowired private ApunteRepository apunteRepo;
    @Autowired private EmailService emailService;
    @Autowired private NotificacionService notificacionService;

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
        MiembroOrganizacion saved = miembroRepo.save(miembro);

        emailService.enviarInvitacionOrganizacion(
            usuario.getEmail(),
            usuario.getNombre(),
            org.getNombre(),
            org.getTipo(),
            org.getAdmin().getNombre()
        );

        notificacionService.crear(
            usuario.getId(),
            "INVITACION_ORG",
            "Has sido añadido a " + org.getNombre(),
            org.getAdmin().getNombre() + " te ha añadido a la organización \"" + org.getNombre() + "\"",
            "/organizaciones/" + org.getId()
        );

        return saved;
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
    public AsignacionTest asignarTest(Long orgId, Long testId, Long apunteId, String tipoRecurso,
                                       LocalDateTime fechaLimite, String instrucciones,
                                       Long adminId, Long usuarioId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(adminId))
            throw new AccessDeniedException("Solo el administrador puede asignar recursos");

        if (fechaLimite != null && fechaLimite.isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("La fecha límite debe ser posterior al momento actual");

        Usuario admin = usuarioRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        String tipo = (tipoRecurso != null && !tipoRecurso.isBlank()) ? tipoRecurso : "TEST";
        String tituloRecurso;
        Long recursoIdNotif;
        String urlNotif;

        AsignacionTest asignacion = new AsignacionTest();
        asignacion.setTipoRecurso(tipo);
        asignacion.setOrganizacion(org);
        asignacion.setAsignadoPor(admin);
        asignacion.setFechaLimite(fechaLimite);
        asignacion.setInstrucciones(instrucciones);

        if ("APUNTE".equals(tipo)) {
            Apunte apunte = apunteRepo.findById(apunteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Apunte no encontrado"));
            asignacion.setApunte(apunte);
            tituloRecurso = apunte.getTitulo();
            recursoIdNotif = apunte.getId();
            urlNotif = "/apuntes";
        } else {
            Test test = testRepo.findById(testId)
                    .orElseThrow(() -> new ResourceNotFoundException("Recurso no encontrado"));
            asignacion.setTest(test);
            tituloRecurso = test.getTitulo();
            recursoIdNotif = test.getId();
            urlNotif = "/examen/" + test.getId();
        }

        Usuario destino = null;
        if (usuarioId != null) {
            if (!miembroRepo.existsByUsuarioIdAndOrganizacionId(usuarioId, orgId))
                throw new IllegalArgumentException("El usuario no es miembro de esta organización");
            destino = usuarioRepo.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
            asignacion.setUsuarioDestino(destino);
        }

        AsignacionTest saved = asignacionRepo.save(asignacion);

        String msgFecha = fechaLimite != null
                ? " · Fecha límite: " + fechaLimite.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "";

        final Long finalRecursoId = "TEST".equals(tipo) ? recursoIdNotif : null;
        final String finalTitulo  = tituloRecurso;
        final String finalUrl     = urlNotif;

        if (destino != null) {
            AsignacionUsuario au = new AsignacionUsuario();
            au.setAsignacion(saved);
            au.setUsuario(destino);
            asignacionUsuarioRepo.save(au);

            emailService.enviarAsignacionTest(
                destino.getEmail(), destino.getNombre(),
                finalTitulo, org.getNombre(),
                instrucciones, fechaLimite, finalRecursoId
            );
            notificacionService.crear(
                destino.getId(), "ASIGNACION_TEST",
                "Nuevo recurso: " + finalTitulo,
                "Organización: " + org.getNombre() + msgFecha,
                finalUrl
            );
        } else {
            miembroRepo.findByOrganizacionId(orgId).forEach(m -> {
                AsignacionUsuario au = new AsignacionUsuario();
                au.setAsignacion(saved);
                au.setUsuario(m.getUsuario());
                asignacionUsuarioRepo.save(au);

                if (!m.getUsuario().getId().equals(adminId)) {
                    emailService.enviarAsignacionTest(
                        m.getUsuario().getEmail(), m.getUsuario().getNombre(),
                        finalTitulo, org.getNombre(),
                        instrucciones, fechaLimite, finalRecursoId
                    );
                    notificacionService.crear(
                        m.getUsuario().getId(), "ASIGNACION_TEST",
                        "Nuevo recurso: " + finalTitulo,
                        "Organización: " + org.getNombre() + msgFecha,
                        finalUrl
                    );
                }
            });
        }

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

    /** Resultados de una asignación (solo el admin puede verlos). */
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getResultadosAsignacion(Long orgId, Long asignacionId, Long adminId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(adminId))
            throw new AccessDeniedException("Solo el administrador puede ver los resultados");

        return asignacionUsuarioRepo.findByAsignacionId(asignacionId).stream().map(au -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("usuarioId",       au.getUsuario().getId());
            m.put("nombre",          au.getUsuario().getNombre() + (au.getUsuario().getApellidos() != null ? " " + au.getUsuario().getApellidos() : ""));
            m.put("email",           au.getUsuario().getEmail());
            m.put("estado",          au.getEstado());
            m.put("fechaCompletado", au.getFechaCompletado() != null ? au.getFechaCompletado().toString() : null);
            if (au.getIntento() != null) {
                Intento i = au.getIntento();
                m.put("porcentaje",    i.getPorcentaje());
                m.put("correctas",     i.getCorrectas());
                m.put("totalPreguntas", i.getTotalPreguntas());
                m.put("puntuacion",    i.getPuntuacion());
                m.put("estadoIntento", i.getEstado());
            } else {
                m.put("porcentaje",    null);
                m.put("correctas",     null);
                m.put("totalPreguntas", null);
                m.put("puntuacion",    null);
                m.put("estadoIntento", null);
            }
            return m;
        }).toList();
    }

    /** Estadísticas de un miembro en el contexto de la organización. */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getEstadisticasMiembro(Long orgId, Long miembroId, Long adminId) {
        Organizacion org = orgRepo.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!org.getAdmin().getId().equals(adminId))
            throw new AccessDeniedException("Solo el administrador puede ver estadísticas");
        if (!miembroRepo.existsByUsuarioIdAndOrganizacionId(miembroId, orgId))
            throw new ResourceNotFoundException("El usuario no es miembro de esta organización");

        // Asignaciones de tests de este miembro en esta org
        List<AsignacionUsuario> asignaciones = asignacionUsuarioRepo.findByAsignacionId(0L); // placeholder
        List<AsignacionUsuario> todas = asignacionUsuarioRepo
                .findByUsuarioIdOrderByAsignacionFechaAsignacionDesc(miembroId)
                .stream()
                .filter(au -> au.getAsignacion().getOrganizacion().getId().equals(orgId))
                .toList();

        long total      = todas.size();
        long completadas = todas.stream().filter(au -> "COMPLETADO".equals(au.getEstado())).count();
        long pendientes  = total - completadas;
        double media     = todas.stream()
                .filter(au -> au.getIntento() != null)
                .mapToDouble(au -> au.getIntento().getPorcentaje())
                .average().orElse(0.0);

        Usuario usuario = usuarioRepo.findById(miembroId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("usuarioId",    usuario.getId());
        m.put("nombre",       usuario.getNombre() + (usuario.getApellidos() != null ? " " + usuario.getApellidos() : ""));
        m.put("email",        usuario.getEmail());
        m.put("total",        total);
        m.put("completadas",  completadas);
        m.put("pendientes",   pendientes);
        m.put("mediaAciertos", Math.round(media * 10.0) / 10.0);
        m.put("asignaciones", todas.stream().map(au -> {
            java.util.Map<String, Object> am = new java.util.LinkedHashMap<>();
            am.put("asignacionId",   au.getAsignacion().getId());
            am.put("titulo",         au.getAsignacion().getTest() != null ? au.getAsignacion().getTest().getTitulo() : au.getAsignacion().getApunte().getTitulo());
            am.put("estado",         au.getEstado());
            am.put("fechaLimite",    au.getAsignacion().getFechaLimite() != null ? au.getAsignacion().getFechaLimite().toString() : null);
            am.put("fechaCompletado", au.getFechaCompletado() != null ? au.getFechaCompletado().toString() : null);
            if (au.getIntento() != null) {
                am.put("porcentaje", au.getIntento().getPorcentaje());
                am.put("correctas",  au.getIntento().getCorrectas());
                am.put("totalPreguntas", au.getIntento().getTotalPreguntas());
            }
            return am;
        }).toList());
        return m;
    }

    private void verificarAcceso(Organizacion org, Long usuarioId) {
        boolean esAdmin   = org.getAdmin().getId().equals(usuarioId);
        boolean esMiembro = miembroRepo.existsByUsuarioIdAndOrganizacionId(usuarioId, org.getId());
        if (!esAdmin && !esMiembro)
            throw new AccessDeniedException("No tienes acceso a esta organización");
    }
}
