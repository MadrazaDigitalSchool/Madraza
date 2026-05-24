package com.madraza.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired private RestClient.Builder restClientBuilder;
    @Autowired private TemplateEngine templateEngine;

    @Value("${brevo.api.key:}")
    private String apiKey;

    @Value("${brevo.sender.name:Madraza}")
    private String senderName;

    @Value("${brevo.sender.email:madrazaapp@gmail.com}")
    private String senderEmail;

    @Value("${app.mail.contacto:}")
    private String contactoEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private RestClient restClient;

    @PostConstruct
    public void init() {
        this.restClient = restClientBuilder.baseUrl("https://api.brevo.com").build();
    }

    @Async
    public void enviarConfirmacionRegistro(String email, String nombre, String token) {
        try {
            Context ctx = new Context();
            ctx.setVariable("nombre", nombre);
            ctx.setVariable("verificarUrl", frontendUrl + "/auth/verificar-email?token=" + token);
            String html = templateEngine.process("email/confirmacion-registro", ctx);
            enviar(email, "Confirma tu cuenta en Madraza", html);
        } catch (Exception e) {
            log.error("Error al enviar email de confirmación a {}: {}", email, e.getMessage());
        }
    }

    @Async
    public void enviarConfirmacionPago(String email, String nombre, String plan, String fechaExpiry) {
        try {
            Context ctx = new Context();
            ctx.setVariable("nombre", nombre);
            ctx.setVariable("plan", plan);
            ctx.setVariable("fechaExpiry", fechaExpiry);
            ctx.setVariable("dashboardUrl", frontendUrl + "/dashboard");
            String html = templateEngine.process("email/confirmacion-pago", ctx);
            enviar(email, "¡Pago confirmado! Bienvenido a Madraza Premium", html);
        } catch (Exception e) {
            log.error("Error al enviar email de pago a {}: {}", email, e.getMessage());
        }
    }

    @Async
    public void enviarRecuperacionPassword(String email, String nombre, String token) {
        try {
            Context ctx = new Context();
            ctx.setVariable("nombre", nombre);
            ctx.setVariable("resetUrl", frontendUrl + "/auth/nueva-password?token=" + token);
            String html = templateEngine.process("email/recuperacion-password", ctx);
            enviar(email, "Restablece tu contraseña de Madraza", html);
        } catch (Exception e) {
            log.error("Error al enviar email de recuperación a {}: {}", email, e.getMessage());
        }
    }

    @Async
    public void enviarInvitacionOrganizacion(String email, String nombre, String orgNombre, String orgTipo, String adminNombre) {
        try {
            Context ctx = new Context();
            ctx.setVariable("nombre", nombre);
            ctx.setVariable("orgNombre", orgNombre);
            ctx.setVariable("orgTipo", "CENTRO_EDUCATIVO".equals(orgTipo) ? "Centro educativo" : "Empresa");
            ctx.setVariable("adminNombre", adminNombre);
            ctx.setVariable("organizacionesUrl", frontendUrl + "/organizaciones");
            String html = templateEngine.process("email/invitacion-organizacion", ctx);
            enviar(email, "Te han añadido a una organización en Madraza", html);
        } catch (Exception e) {
            log.error("Error al enviar email de invitación a {}: {}", email, e.getMessage());
        }
    }

    @Async
    public void enviarAsignacionTest(String email, String nombre, String testTitulo, String orgNombre,
                                      String instrucciones, LocalDateTime fechaLimite, Long testId) {
        try {
            Context ctx = new Context();
            ctx.setVariable("nombre", nombre);
            ctx.setVariable("testTitulo", testTitulo);
            ctx.setVariable("orgNombre", orgNombre);
            ctx.setVariable("instrucciones", instrucciones != null && !instrucciones.isBlank() ? instrucciones : null);
            ctx.setVariable("tieneFechaLimite", fechaLimite != null);
            if (fechaLimite != null) {
                ctx.setVariable("fechaLimite",
                    fechaLimite.format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm")));
            }
            ctx.setVariable("examUrl", frontendUrl + "/examen/" + testId);
            String html = templateEngine.process("email/asignacion-test", ctx);
            enviar(email, "Nuevo recurso asignado: " + testTitulo, html);
        } catch (Exception e) {
            log.error("Error al enviar email de asignación a {}: {}", email, e.getMessage());
        }
    }

    @Async
    public void enviarContacto(String nombre, String email, String asunto, String mensaje) {
        String html = """
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> %s</p>
            <p><strong>Email:</strong> %s</p>
            <p><strong>Asunto:</strong> %s</p>
            <hr/>
            <p>%s</p>
            """.formatted(nombre, email, asunto, mensaje);
        try {
            String destino = contactoEmail.isBlank() ? senderEmail : contactoEmail;
            enviar(destino, "Contacto: " + asunto, html);
        } catch (Exception e) {
            log.error("Error al enviar email de contacto: {}", e.getMessage());
        }
    }

    private void enviar(String destinatario, String asunto, String html) {
        if (apiKey.isBlank()) {
            log.warn("Resend API key no configurada — email a {} no enviado", destinatario);
            return;
        }

        Map<String, Object> body = Map.of(
            "sender", Map.of("name", senderName, "email", senderEmail),
            "to", List.of(Map.of("email", destinatario)),
            "subject", asunto,
            "htmlContent", html
        );

        restClient.post()
            .uri("/v3/smtp/email")
            .header("api-key", apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .toBodilessEntity();

        log.info("Email enviado a {} - Asunto: {}", destinatario, asunto);
    }
}
