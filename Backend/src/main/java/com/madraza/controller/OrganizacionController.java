package com.madraza.controller;

import com.madraza.entity.*;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.OrganizacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/organizaciones")
public class OrganizacionController {

    @Autowired private OrganizacionService orgService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMisOrganizaciones(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
            orgService.getMisOrganizaciones(userDetails.getId()).stream().map(this::buildOrgMap).toList()
        );
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String nombre      = body.get("nombre");
        String tipo        = body.getOrDefault("tipo", "EMPRESA");
        String descripcion = body.getOrDefault("descripcion", "");
        if (nombre == null || nombre.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre es obligatorio"));
        return ResponseEntity.ok(buildOrgMap(
            orgService.crear(nombre.trim(), tipo, descripcion, userDetails.getId())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Organizacion org = orgService.getById(id, userDetails.getId());
        Map<String, Object> resp = buildOrgMap(org);
        resp.put("miembros",    orgService.getMiembros(id, userDetails.getId()).stream().map(this::buildMiembroMap).toList());
        resp.put("asignaciones", orgService.getAsignaciones(id, userDetails.getId()).stream().map(this::buildAsignacionMap).toList());
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(buildOrgMap(
            orgService.actualizar(id, body.get("nombre"), body.get("tipo"), body.get("descripcion"), userDetails.getId())
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        orgService.eliminar(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invitar")
    public ResponseEntity<?> invitar(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "El email es obligatorio"));
        return ResponseEntity.ok(buildMiembroMap(
            orgService.invitarPorEmail(id, email.trim(), userDetails.getId())
        ));
    }

    @DeleteMapping("/{id}/miembros/{usuarioId}")
    public ResponseEntity<Void> expulsar(
            @PathVariable Long id,
            @PathVariable Long usuarioId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        orgService.expulsarMiembro(id, usuarioId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unirse/{codigo}")
    public ResponseEntity<Map<String, Object>> unirse(
            @PathVariable String codigo,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(buildOrgMap(
            orgService.unirsePorCodigo(codigo, userDetails.getId())
        ));
    }

    @PostMapping("/{id}/asignar")
    public ResponseEntity<?> asignar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Object testIdObj = body.get("testId");
        if (testIdObj == null)
            return ResponseEntity.badRequest().body(Map.of("error", "testId es obligatorio"));

        Long testId = Long.parseLong(testIdObj.toString());
        LocalDateTime fechaLimite = body.get("fechaLimite") != null
                ? LocalDateTime.parse((String) body.get("fechaLimite")) : null;
        String instrucciones = (String) body.getOrDefault("instrucciones", "");

        return ResponseEntity.ok(buildAsignacionMap(
            orgService.asignarTest(id, testId, fechaLimite, instrucciones, userDetails.getId())
        ));
    }

    // ── Builders ──────────────────────────────────────────────

    private Map<String, Object> buildOrgMap(Organizacion o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",               o.getId());
        m.put("nombre",           o.getNombre());
        m.put("tipo",             o.getTipo());
        m.put("descripcion",      o.getDescripcion());
        m.put("codigoInvitacion", o.getCodigoInvitacion());
        m.put("adminId",          o.getAdmin().getId());
        m.put("adminNombre",      o.getAdmin().getNombre());
        m.put("activa",           o.isActiva());
        m.put("createdAt",        o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        return m;
    }

    private Map<String, Object> buildMiembroMap(MiembroOrganizacion m) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id",            m.getId());
        r.put("usuarioId",     m.getUsuario().getId());
        r.put("nombre",        m.getUsuario().getNombre());
        r.put("apellidos",     m.getUsuario().getApellidos());
        r.put("email",         m.getUsuario().getEmail());
        r.put("rol",           m.getRol());
        r.put("fechaUnion",    m.getFechaUnion() != null ? m.getFechaUnion().toString() : null);
        return r;
    }

    private Map<String, Object> buildAsignacionMap(AsignacionTest a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",              a.getId());
        m.put("testId",          a.getTest().getId());
        m.put("testTitulo",      a.getTest().getTitulo());
        m.put("asignadoPorNombre", a.getAsignadoPor().getNombre());
        m.put("fechaAsignacion", a.getFechaAsignacion() != null ? a.getFechaAsignacion().toString() : null);
        m.put("fechaLimite",     a.getFechaLimite() != null ? a.getFechaLimite().toString() : null);
        m.put("instrucciones",   a.getInstrucciones());
        m.put("activa",          a.isActiva());
        return m;
    }
}
