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

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/intentos")
public class IntentoController {

    @Autowired private IntentoService intentoService;

    /** POST /api/intentos/test/{testId} — inicia un nuevo intento */
    @PostMapping("/test/{testId}")
    public ResponseEntity<Intento> iniciar(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.iniciarIntento(testId, userDetails.getId()));
    }

    /** POST /api/intentos/{intentoId}/responder — registra respuesta de una pregunta */
    @PostMapping("/{intentoId}/responder")
    public ResponseEntity<Void> responder(
            @PathVariable Long intentoId,
            @RequestBody RespuestaRequest req) {
        intentoService.responder(intentoId, req);
        return ResponseEntity.ok().build();
    }

    /** POST /api/intentos/{intentoId}/finalizar — termina el examen (idempotente) */
    @PostMapping("/{intentoId}/finalizar")
    public ResponseEntity<ResultadoResponse> finalizar(@PathVariable Long intentoId) {
        return ResponseEntity.ok(intentoService.finalizar(intentoId));
    }

    /** GET /api/intentos/historial — historial del usuario autenticado */
    @GetMapping("/historial")
    public ResponseEntity<List<Intento>> getHistorial(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.getHistorial(userDetails.getId()));
    }
}
