package com.madraza.controller;

import com.madraza.entity.CompartirTest;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.CompartirService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/compartir")
public class CompartirController {

    @Autowired private CompartirService compartirService;

    @PostMapping("/{testId}")
    public ResponseEntity<Map<String, Object>> compartir(
            @PathVariable Long testId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String email   = body.get("email");
        String mensaje = body.getOrDefault("mensaje", "");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "El email es obligatorio"));

        CompartirTest c = compartirService.compartir(testId, userDetails.getId(), email.trim(), mensaje);
        return ResponseEntity.ok(buildMap(c));
    }

    @GetMapping("/recibidos")
    public ResponseEntity<List<Map<String, Object>>> getRecibidos(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
            compartirService.getRecibidos(userDetails.getId()).stream().map(this::buildMap).toList()
        );
    }

    @GetMapping("/enviados")
    public ResponseEntity<List<Map<String, Object>>> getEnviados(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
            compartirService.getEnviados(userDetails.getId()).stream().map(this::buildMap).toList()
        );
    }

    @PutMapping("/{id}/visto")
    public ResponseEntity<Void> marcarVisto(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        compartirService.marcarVisto(id, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        compartirService.eliminar(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/no-vistos")
    public ResponseEntity<Map<String, Long>> noVistos(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(Map.of("count", compartirService.contarNoVistos(userDetails.getId())));
    }

    private Map<String, Object> buildMap(CompartirTest c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",              c.getId());
        m.put("testId",          c.getTest().getId());
        m.put("testTitulo",      c.getTest().getTitulo());
        m.put("remitenteNombre", c.getRemitente().getNombre());
        m.put("remitenteEmail",  c.getRemitente().getEmail());
        m.put("destinatarioEmail", c.getDestinatario().getEmail());
        m.put("mensaje",         c.getMensaje());
        m.put("visto",           c.isVisto());
        m.put("fechaCompartido", c.getFechaCompartido() != null ? c.getFechaCompartido().toString() : null);
        return m;
    }
}
