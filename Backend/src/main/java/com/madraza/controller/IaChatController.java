package com.madraza.controller;

import com.madraza.service.IaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/chat")
public class IaChatController {

    @Autowired private IaService iaService;

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        if (!iaService.isDisponible())
            return ResponseEntity.status(503).body(Map.of("error", "El asistente no está disponible en este momento"));

        @SuppressWarnings("unchecked")
        List<Map<String, String>> mensajes = (List<Map<String, String>>) body.get("mensajes");
        if (mensajes == null || mensajes.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Se requiere al menos un mensaje"));

        try {
            String respuesta = iaService.chat(mensajes);
            return ResponseEntity.ok(Map.of("respuesta", respuesta));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
