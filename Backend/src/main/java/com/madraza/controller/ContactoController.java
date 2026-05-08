package com.madraza.controller;

import com.madraza.dto.request.ContactoRequest;
import com.madraza.dto.response.MessageResponse;
import com.madraza.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacto")
public class ContactoController {

    @Autowired private EmailService emailService;

    @PostMapping
    public ResponseEntity<MessageResponse> enviar(@RequestBody ContactoRequest req) {
        emailService.enviarContacto(req.nombre(), req.email(), req.asunto(), req.mensaje());
        return ResponseEntity.ok(new MessageResponse("Mensaje recibido. Te responderemos en menos de 24h."));
    }
}
