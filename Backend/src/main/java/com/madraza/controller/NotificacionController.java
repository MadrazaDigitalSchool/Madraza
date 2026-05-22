package com.madraza.controller;

import com.madraza.entity.Notificacion;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.NotificacionService;
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
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    @Autowired private NotificacionService notifService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMias(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
            notifService.getByUsuario(userDetails.getId())
                .stream().map(this::buildMap).toList()
        );
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<Map<String, Long>> countNoLeidas(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(Map.of("count", notifService.countNoLeidas(userDetails.getId())));
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<Void> marcarLeida(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        notifService.marcarLeida(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodasLeidas(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        notifService.marcarTodasLeidas(userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> eliminarTodas(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        notifService.eliminarTodas(userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> buildMap(Notificacion n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           n.getId());
        m.put("tipo",         n.getTipo());
        m.put("titulo",       n.getTitulo());
        m.put("mensaje",      n.getMensaje());
        m.put("urlDestino",   n.getUrlDestino());
        m.put("leida",        n.isLeida());
        m.put("fechaCreacion", n.getFechaCreacion() != null ? n.getFechaCreacion().toString() : null);
        return m;
    }
}
