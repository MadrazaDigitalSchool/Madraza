package com.madraza.controller;

import com.madraza.entity.Test;
import com.madraza.entity.Usuario;
import com.madraza.repository.IntentoRepository;
import com.madraza.repository.RolRepository;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Panel de administración — solo accesible con ROLE_ADMIN.
 * CRUD completo de usuarios + gestión de tests.
 *
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private TestRepository    testRepository;
    @Autowired private IntentoRepository intentoRepository;
    @Autowired private RolRepository     rolRepository;
    @Autowired private PasswordEncoder   passwordEncoder;

    // ── Stats ─────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsuarios",       usuarioRepository.count());
        stats.put("suscripcionesActivas", usuarioRepository.countBySuscripcionActivaTrue());
        stats.put("totalTests",          testRepository.count());
        stats.put("totalIntentos",       intentoRepository.count());
        return ResponseEntity.ok(stats);
    }

    // ── Usuarios — CRUD ───────────────────────────────────────

    @GetMapping("/usuarios")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getUsuarios() {
        List<Map<String, Object>> result = usuarioRepository.findAll().stream()
                .map(this::buildUsuarioMap)
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/usuarios")
    @Transactional
    public ResponseEntity<?> crearUsuario(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Email obligatorio"));
        if (usuarioRepository.existsByEmail(email.trim()))
            return ResponseEntity.badRequest().body(Map.of("error", "El email ya está en uso"));

        String password = (String) body.get("password");
        if (password == null || password.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "Contraseña mínimo 6 caracteres"));

        Usuario u = new Usuario();
        u.setNombre(body.get("nombre") instanceof String s ? s.trim() : "");
        u.setApellidos(body.get("apellidos") instanceof String s ? s.trim() : "");
        u.setEmail(email.trim());
        u.setPassword(passwordEncoder.encode(password));
        u.setEmailVerificado(true);
        u.setActivo(true);

        String rolNombre = body.get("rol") instanceof String r ? r : "ROLE_USER";
        rolRepository.findByNombre(rolNombre).ifPresent(r -> u.getRoles().add(r));

        usuarioRepository.save(u);
        log.info("Admin: usuario creado email={}", email);
        return ResponseEntity.ok(buildUsuarioMap(u));
    }

    @PutMapping("/usuarios/{id}")
    @Transactional
    public ResponseEntity<?> updateUsuario(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    if (body.get("nombre") instanceof String s && !s.isBlank()) u.setNombre(s.trim());
                    if (body.get("apellidos") instanceof String s) u.setApellidos(s.trim());
                    if (body.get("email") instanceof String s && !s.isBlank()) {
                        if (!s.equalsIgnoreCase(u.getEmail()) && usuarioRepository.existsByEmail(s.trim()))
                            return ResponseEntity.badRequest().body(Map.of("error", "Email ya en uso"));
                        u.setEmail(s.trim());
                    }
                    if (body.containsKey("planTipo"))
                        u.setPlanTipo(body.get("planTipo") instanceof String s && !s.isBlank() ? s.trim() : null);
                    if (body.containsKey("metodoPago"))
                        u.setMetodoPago(body.get("metodoPago") instanceof String s && !s.isBlank() ? s.trim() : null);

                    if (body.get("rol") instanceof String rolNombre && !rolNombre.isBlank()) {
                        rolRepository.findByNombre(rolNombre).ifPresent(rol -> {
                            u.getRoles().clear();
                            u.getRoles().add(rol);
                        });
                    }
                    usuarioRepository.save(u);
                    log.info("Admin: usuario {} actualizado", id);
                    return ResponseEntity.ok(buildUsuarioMap(u));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/usuarios/{id}/suscripcion")
    public ResponseEntity<Map<String, Object>> updateSuscripcion(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    boolean activa = Boolean.TRUE.equals(body.get("suscripcionActiva"));
                    u.setSuscripcionActiva(activa);
                    if (activa && body.get("dias") instanceof Number n)
                        u.setSuscripcionExpiry(LocalDateTime.now().plusDays(n.longValue()));
                    else if (!activa)
                        u.setSuscripcionExpiry(null);
                    usuarioRepository.save(u);
                    log.info("Admin: suscripcion usuario {} → activa={}", id, activa);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("id", u.getId());
                    resp.put("suscripcionActiva", u.isSuscripcionActiva());
                    resp.put("suscripcionExpiry", u.getSuscripcionExpiry() != null
                            ? u.getSuscripcionExpiry().toString() : null);
                    return ResponseEntity.ok(resp);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/usuarios/{id}/activo")
    public ResponseEntity<Map<String, Object>> updateActivo(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    boolean activo = Boolean.TRUE.equals(body.get("activo"));
                    u.setActivo(activo);
                    usuarioRepository.save(u);
                    log.info("Admin: usuario {} → activo={}", id, activo);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("id", u.getId());
                    resp.put("activo", u.isActivo());
                    return ResponseEntity.ok(resp);
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/usuarios/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) return ResponseEntity.notFound().build();

        intentoRepository.deleteByUsuarioId(id);

        List<Test> testsDelUsuario = testRepository.findByCreadorIdConPreguntas(id);
        for (Test t : testsDelUsuario) intentoRepository.deleteByTestId(t.getId());
        testRepository.deleteAll(testsDelUsuario);

        usuarioRepository.deleteById(id);
        log.info("Admin: usuario {} eliminado", id);
        return ResponseEntity.noContent().build();
    }

    // ── Tests ─────────────────────────────────────────────────

    @GetMapping("/tests")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getTests() {
        List<Map<String, Object>> result = testRepository.findAll().stream()
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("titulo", t.getTitulo());
                    m.put("categoria", t.getCategoria());
                    m.put("dificultad", t.getDificultad());
                    m.put("visibilidad", t.getVisibilidad());
                    m.put("activo", t.isActivo());
                    m.put("totalPreguntas", t.getPreguntas().size());
                    m.put("creador", t.getCreador() != null ? t.getCreador().getEmail() : "—");
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/tests/{id}/activo")
    public ResponseEntity<Map<String, Object>> updateTestActivo(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return testRepository.findById(id)
                .map(t -> {
                    boolean activo = Boolean.TRUE.equals(body.get("activo"));
                    t.setActivo(activo);
                    testRepository.save(t);
                    log.info("Admin: test {} → activo={}", id, activo);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("id", t.getId());
                    resp.put("activo", t.isActivo());
                    return ResponseEntity.ok(resp);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/tests/{id}/visibilidad")
    public ResponseEntity<Map<String, Object>> updateTestVisibilidad(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return testRepository.findById(id)
                .map(t -> {
                    String vis = body.get("visibilidad") instanceof String s ? s : "PUBLICO";
                    t.setVisibilidad(vis);
                    testRepository.save(t);
                    log.info("Admin: test {} → visibilidad={}", id, vis);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("id", t.getId());
                    resp.put("visibilidad", t.getVisibilidad());
                    return ResponseEntity.ok(resp);
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/tests/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        if (!testRepository.existsById(id)) return ResponseEntity.notFound().build();
        intentoRepository.deleteByTestId(id);
        testRepository.deleteById(id);
        log.info("Admin: test {} eliminado", id);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> buildUsuarioMap(Usuario u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",               u.getId());
        m.put("nombre",           u.getNombre());
        m.put("apellidos",        u.getApellidos());
        m.put("email",            u.getEmail());
        m.put("emailVerificado",  u.isEmailVerificado());
        m.put("suscripcionActiva", u.isSuscripcionActiva());
        m.put("suscripcionExpiry", u.getSuscripcionExpiry() != null
                ? u.getSuscripcionExpiry().toString() : null);
        m.put("planTipo",         u.getPlanTipo());
        m.put("metodoPago",       u.getMetodoPago());
        m.put("activo",           u.isActivo());
        m.put("proveedorOauth",   u.getProveedorOauth());
        m.put("createdAt",        u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        m.put("roles",            u.getRoles().stream().map(r -> r.getNombre()).toList());
        return m;
    }
}
