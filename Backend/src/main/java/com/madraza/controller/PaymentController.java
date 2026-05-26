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
     * POST /api/pago/crear-intencion
     * Crea un Customer de Stripe + Subscription incompleta, devuelve clientSecret y subscriptionId.
     * El frontend usa estos datos con Stripe.js para mostrar el Payment Element sin redirección.
     */
    @PostMapping("/crear-intencion")
    public ResponseEntity<?> crearIntencion(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String plan       = body.getOrDefault("plan", "mensual");
            String metodoPago = body.getOrDefault("metodoPago", "card");
            Map<String, String> result = paymentService.crearIntencionPago(userDetails.getId(), plan, metodoPago);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error al crear intención de pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error al iniciar el pago: " + e.getMessage()));
        }
    }

    /**
     * POST /api/pago/confirmar-suscripcion
     * Verifica con Stripe que la suscripción está activa y activa la cuenta del usuario.
     * Body: { "subscriptionId": "sub_xxx" }
     */
    @PostMapping("/confirmar-suscripcion")
    public ResponseEntity<?> confirmarSuscripcion(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String subscriptionId = body.get("subscriptionId");
            if (subscriptionId == null || subscriptionId.isBlank())
                return ResponseEntity.badRequest().body(new MessageResponse("subscriptionId requerido"));

            paymentService.confirmarSuscripcion(userDetails.getId(), subscriptionId);

            Usuario usuario = usuarioRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            return ResponseEntity.ok(Map.of(
                    "suscripcionActiva", usuario.isSuscripcionActiva(),
                    "mensaje", "¡Pago confirmado! Tu suscripción está activa"
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error al confirmar suscripción: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error al confirmar el pago"));
        }
    }

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
            String metodoPago = body.getOrDefault("metodoPago", "tarjeta");
            String url = paymentService.crearSesionCheckout(userDetails.getId(), plan, metodoPago);
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
     * POST /api/pago/setup-intent
     * Crea un SetupIntent de Stripe para capturar un nuevo metodo de pago sin cobrar.
     * Devuelve { clientSecret }.
     */
    @PostMapping("/setup-intent")
    public ResponseEntity<?> crearSetupIntent(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String clientSecret = paymentService.crearSetupIntent(userDetails.getId());
            return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
        } catch (Exception e) {
            log.error("Error al crear SetupIntent: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("No se pudo iniciar el cambio de método de pago"));
        }
    }

    /**
     * PUT /api/pago/metodo-pago
     * Actualiza el metodo de pago por defecto de la suscripción activa.
     * Body: { "paymentMethodId": "pm_xxx", "metodoPago": "tarjeta" }
     */
    @PutMapping("/metodo-pago")
    public ResponseEntity<?> actualizarMetodoPago(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String paymentMethodId  = body.get("paymentMethodId");
            String metodoPagoNombre = body.getOrDefault("metodoPago", "tarjeta");
            if (paymentMethodId == null || paymentMethodId.isBlank())
                return ResponseEntity.badRequest().body(new MessageResponse("paymentMethodId requerido"));

            paymentService.actualizarMetodoPago(userDetails.getId(), paymentMethodId, metodoPagoNombre);
            return ResponseEntity.ok(Map.of("mensaje", "Método de pago actualizado correctamente"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error al actualizar método de pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("No se pudo actualizar el método de pago"));
        }
    }

    /**
     * PUT /api/pago/cambiar-plan
     * Cambia el plan activo del usuario (mensual ↔ anual).
     * Body: { "plan": "mensual" | "anual" }
     */
    @PutMapping("/cambiar-plan")
    public ResponseEntity<?> cambiarPlan(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String plan = body.get("plan");
            if (plan == null || plan.isBlank())
                return ResponseEntity.badRequest().body(new MessageResponse("plan requerido"));

            paymentService.cambiarPlan(userDetails.getId(), plan);

            Usuario usuario = usuarioRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            return ResponseEntity.ok(Map.of(
                    "planTipo",          usuario.getPlanTipo(),
                    "suscripcionExpiry", usuario.getSuscripcionExpiry() != null
                            ? usuario.getSuscripcionExpiry().toString() : "",
                    "mensaje",           "Plan actualizado correctamente"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error al cambiar plan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("No se pudo cambiar el plan: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/pago/suscripcion
     * Cancela la suscripción activa al final del período ya pagado.
     * El usuario mantiene acceso Premium hasta la fecha de expiración actual.
     */
    @DeleteMapping("/suscripcion")
    public ResponseEntity<?> cancelarSuscripcion(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String mensaje = paymentService.cancelarSuscripcion(userDetails.getId());
            return ResponseEntity.ok(Map.of("mensaje", mensaje));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error al cancelar suscripción: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("No se pudo cancelar la suscripción: " + e.getMessage()));
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
