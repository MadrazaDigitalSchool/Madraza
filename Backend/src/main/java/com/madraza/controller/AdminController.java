package com.madraza.controller;

import com.madraza.repository.IntentoRepository;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Panel de administración — solo accesible con ROLE_ADMIN.
 *
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private TestRepository testRepository;
    @Autowired private IntentoRepository intentoRepository;

    /** GET /api/admin/stats */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsuarios", usuarioRepository.count());
        stats.put("suscripcionesActivas", usuarioRepository.countBySuscripcionActivaTrue());
        stats.put("totalTests", testRepository.count());
        stats.put("totalIntentos", intentoRepository.count());
        return ResponseEntity.ok(stats);
    }

    /** GET /api/admin/usuarios */
    @GetMapping("/usuarios")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getUsuarios() {
        List<Map<String, Object>> result = usuarioRepository.findAll().stream()
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("nombre", u.getNombre());
                    m.put("apellidos", u.getApellidos());
                    m.put("email", u.getEmail());
                    m.put("emailVerificado", u.isEmailVerificado());
                    m.put("suscripcionActiva", u.isSuscripcionActiva());
                    m.put("suscripcionExpiry", u.getSuscripcionExpiry() != null
                            ? u.getSuscripcionExpiry().toString() : null);
                    m.put("activo", u.isActivo());
                    m.put("proveedorOauth", u.getProveedorOauth());
                    m.put("createdAt", u.getCreatedAt() != null
                            ? u.getCreatedAt().toString() : null);
                    m.put("roles", u.getRoles().stream().map(r -> r.getNombre()).toList());
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }

    /** PUT /api/admin/usuarios/{id}/suscripcion — Activa/desactiva suscripción */
    @PutMapping("/usuarios/{id}/suscripcion")
    public ResponseEntity<Map<String, Object>> updateSuscripcion(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    boolean activa = Boolean.TRUE.equals(body.get("suscripcionActiva"));
                    u.setSuscripcionActiva(activa);
                    if (activa && body.get("dias") instanceof Number n) {
                        u.setSuscripcionExpiry(LocalDateTime.now().plusDays(n.longValue()));
                    } else if (!activa) {
                        u.setSuscripcionExpiry(null);
                    }
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

    /** PUT /api/admin/usuarios/{id}/activo — Activa/desactiva cuenta */
    @PutMapping("/usuarios/{id}/activo")
    public ResponseEntity<Map<String, Object>> updateActivo(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
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

    /** GET /api/admin/tests */
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

    /** PUT /api/admin/tests/{id}/activo */
    @PutMapping("/tests/{id}/activo")
    public ResponseEntity<Map<String, Object>> updateTestActivo(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
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

    /** DELETE /api/admin/tests/{id} */
    @DeleteMapping("/tests/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        if (!testRepository.existsById(id)) return ResponseEntity.notFound().build();
        intentoRepository.deleteByTestId(id);
        testRepository.deleteById(id);
        log.info("Admin: test {} eliminado", id);
        return ResponseEntity.noContent().build();
    }
}
