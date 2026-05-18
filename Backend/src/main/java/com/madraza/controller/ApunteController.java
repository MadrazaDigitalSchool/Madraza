package com.madraza.controller;

import com.madraza.entity.Apunte;
import com.madraza.entity.Usuario;
import com.madraza.repository.UsuarioRepository;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.ApunteService;
import com.madraza.service.IaService;
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
@RequestMapping("/api/apuntes")
public class ApunteController {

    @Autowired private ApunteService apunteService;
    @Autowired private IaService iaService;
    @Autowired private UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMisApuntes(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
            apunteService.getMisApuntes(userDetails.getId()).stream().map(this::buildMap).toList()
        );
    }

    @GetMapping("/test/{testId}")
    public ResponseEntity<List<Map<String, Object>>> getApuntesPorTest(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
            apunteService.getApuntesPorTest(testId, userDetails.getId()).stream().map(this::buildMap).toList()
        );
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long testId = body.get("testId") != null ? Long.parseLong(body.get("testId").toString()) : null;
        return ResponseEntity.ok(buildMap(apunteService.crear(
                userDetails.getId(),
                (String) body.get("titulo"),
                (String) body.get("contenido"),
                (String) body.get("tags"),
                testId
        )));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long testId = body.containsKey("testId") && body.get("testId") != null
                ? Long.parseLong(body.get("testId").toString()) : null;
        return ResponseEntity.ok(buildMap(apunteService.actualizar(
                id, userDetails.getId(),
                (String) body.get("titulo"),
                (String) body.get("contenido"),
                (String) body.get("tags"),
                testId
        )));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        apunteService.eliminar(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    // Endpoint de IA — solo premium, el frontend ya lo oculta pero verificamos aquí también
    // body: { modo: "asistente"|"generacion", accion?, contenidoActual?, textoSeleccionado?, tema?, contexto? }
    @PostMapping("/ia")
    public ResponseEntity<?> ia(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!iaService.isDisponible())
            return ResponseEntity.status(503).body(Map.of("error", "El asistente de IA no está disponible actualmente"));

        // comprobamos que sea premium por si accede sin pasar por el frontend
        Usuario usuario = usuarioRepository.findById(userDetails.getId()).orElse(null);
        boolean esPremium = usuario != null && usuario.isSuscripcionActiva()
                && (usuario.getSuscripcionExpiry() == null
                    || usuario.getSuscripcionExpiry().isAfter(LocalDateTime.now()));
        if (!esPremium)
            return ResponseEntity.status(403).body(Map.of("error", "La IA es exclusiva de usuarios Premium"));

        String modo = body.getOrDefault("modo", "asistente");
        try {
            String resultado;
            if ("generacion".equals(modo)) {
                resultado = iaService.generarApunte(body.get("tema"), body.get("contexto"));
            } else {
                resultado = iaService.asistir(
                        body.get("contenidoActual"),
                        body.get("textoSeleccionado"),
                        body.getOrDefault("accion", "ampliar")
                );
            }
            return ResponseEntity.ok(Map.of("resultado", resultado));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> buildMap(Apunte a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        a.getId());
        m.put("titulo",    a.getTitulo());
        m.put("contenido", a.getContenido());
        m.put("tags",      a.getTags());
        m.put("testId",    a.getTestAsociado() != null ? a.getTestAsociado().getId() : null);
        m.put("testTitulo", a.getTestAsociado() != null ? a.getTestAsociado().getTitulo() : null);
        m.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
        m.put("updatedAt", a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : null);
        return m;
    }
}
