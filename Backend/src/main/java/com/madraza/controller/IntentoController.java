package com.madraza.controller;

import com.madraza.dto.request.CorreccionRequest;
import com.madraza.dto.request.RespuestaRequest;
import com.madraza.dto.response.ResultadoResponse;
import com.madraza.entity.Intento;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.IntentoService;
import com.madraza.service.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    @Autowired private PdfService     pdfService;

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

    @GetMapping("/{intentoId}/detalle")
    public ResponseEntity<List<Map<String, Object>>> getDetalle(
            @PathVariable Long intentoId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.getDetalle(intentoId, userDetails.getId()));
    }

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

    @PutMapping("/{intentoId}/corregir")
    public ResponseEntity<ResultadoResponse> corregir(
            @PathVariable Long intentoId,
            @RequestBody CorreccionRequest body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(intentoService.corregir(intentoId, userDetails.getId(), body));
    }

    @GetMapping("/{intentoId}/pdf")
    public ResponseEntity<?> exportarPdf(
            @PathVariable Long intentoId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            byte[] pdf = pdfService.generarResultadoPdf(intentoId, userDetails.getId());
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"resultado-" + intentoId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al generar el PDF"));
        }
    }
}
