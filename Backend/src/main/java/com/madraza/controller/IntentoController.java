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
}
