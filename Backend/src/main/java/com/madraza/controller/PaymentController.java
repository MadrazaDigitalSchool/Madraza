package com.madraza.controller;

import com.madraza.dto.response.MessageResponse;
import com.madraza.entity.Usuario;
import com.madraza.repository.UsuarioRepository;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/pago")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Autowired private PaymentService paymentService;
    @Autowired private UsuarioRepository usuarioRepository;

    /**
     * POST /api/pago/crear-sesion
     * Crea una sesión de Stripe Checkout. Requiere autenticación.
     * Body: { "plan": "mensual" | "anual" }
     */
    @PostMapping("/crear-sesion")
    public ResponseEntity<?> crearSesion(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String plan = body.getOrDefault("plan", "mensual");
            String url = paymentService.crearSesionCheckout(userDetails.getId(), plan);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            log.error("Error al crear sesión de pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error al iniciar el proceso de pago: " + e.getMessage()));
        }
    }

    /**
     * POST /api/pago/verificar-sesion
     * Verifica el pago con Stripe y activa la suscripción del usuario.
     * Body: { "sessionId": "cs_xxx" }
     */
    @PostMapping("/verificar-sesion")
    public ResponseEntity<?> verificarSesion(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String sessionId = body.get("sessionId");
            if (sessionId == null || sessionId.isBlank())
                return ResponseEntity.badRequest().body(new MessageResponse("sessionId requerido"));

            paymentService.verificarYActivar(sessionId, userDetails.getId());

            // Devolvemos el estado actualizado del usuario
            Usuario usuario = usuarioRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            return ResponseEntity.ok(Map.of(
                    "suscripcionActiva", usuario.isSuscripcionActiva(),
                    "mensaje", "¡Pago confirmado! Tu suscripción está activa"
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error al verificar sesión de pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error al verificar el pago"));
        }
    }

    /**
     * POST /api/pago/webhook
     * Endpoint público para recibir eventos de Stripe. NUNCA autenticado con JWT.
     * Requiere verificar la firma del webhook.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            HttpServletRequest request,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        try {
            byte[] bytes = request.getInputStream().readAllBytes();
            String payload = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);

            if (sigHeader == null || sigHeader.isBlank()) {
                log.warn("Webhook recibido sin cabecera Stripe-Signature");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing signature");
            }

            paymentService.procesarWebhook(payload, sigHeader);
            return ResponseEntity.ok("OK");
        } catch (SecurityException e) {
            log.warn("Webhook con firma inválida: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        } catch (IOException e) {
            log.error("Error al leer body del webhook: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error");
        } catch (Exception e) {
            log.error("Error al procesar webhook: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error");
        }
    }

    /**
     * GET /api/pago/estado
     * Devuelve el estado actual de suscripción del usuario autenticado.
     */
    @GetMapping("/estado")
    public ResponseEntity<?> getEstado(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return usuarioRepository.findById(userDetails.getId())
                .map(u -> ResponseEntity.ok(Map.of(
                        "suscripcionActiva", u.isSuscripcionActiva(),
                        "suscripcionExpiry", u.getSuscripcionExpiry() != null
                                ? u.getSuscripcionExpiry().toString() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
