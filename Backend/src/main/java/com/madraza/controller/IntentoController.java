package com.madraza.controller;

import com.madraza.dto.request.RespuestaRequest;
import com.madraza.dto.response.ResultadoResponse;
import com.madraza.entity.Intento;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.IntentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/intentos")
public class IntentoController {

    @Autowired private IntentoService intentoService;

    @PostMapping("/test/{testId}")
    public ResponseEntity<Intento> iniciar(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.iniciarIntento(testId, userDetails.getId()));
    }

    @PostMapping("/{intentoId}/responder")
    public ResponseEntity<Void> responder(
            @PathVariable Long intentoId,
            @RequestBody RespuestaRequest req,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        intentoService.responder(intentoId, req, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{intentoId}/finalizar")
    public ResponseEntity<ResultadoResponse> finalizar(
            @PathVariable Long intentoId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.finalizar(intentoId, userDetails.getId()));
    }

    @GetMapping("/historial")
    public ResponseEntity<List<Intento>> getHistorial(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.getHistorial(userDetails.getId()));
    }

    // Detalle de respuestas de un intento (para el alumno: ver sus respuestas corregidas)
    @GetMapping("/{intentoId}/detalle")
    public ResponseEntity<List<Map<String, Object>>> getDetalle(
            @PathVariable Long intentoId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.getDetalle(intentoId, userDetails.getId()));
    }

    // Para el creador: listar intentos con texto libre pendiente de corrección
    @GetMapping("/mis-pendientes-correccion")
    public ResponseEntity<List<Map<String, Object>>> getMisPendientesCorreccion(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.getMisPendientesCorreccion(userDetails.getId()));
    }

    @GetMapping("/para-corregir/{testId}")
    public ResponseEntity<List<Map<String, Object>>> getParaCorregir(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.getParaCorregir(testId, userDetails.getId()));
    }

    // Para el creador: enviar correcciones de texto libre
    @PutMapping("/{intentoId}/corregir")
    public ResponseEntity<ResultadoResponse> corregir(
            @PathVariable Long intentoId,
            @RequestBody Map<Long, Boolean> correcciones,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.corregir(intentoId, userDetails.getId(), correcciones));
    }
}
