package com.madraza.service;

import com.madraza.entity.Usuario;
import com.madraza.repository.UsuarioRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.checkout.SessionRetrieveParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmailService emailService;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Value("${stripe.price.mensual}")
    private String priceMensual;

    @Value("${stripe.price.anual}")
    private String priceAnual;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * Crea una sesión de Stripe Checkout y devuelve la URL de pago.
     * Soporta card, Bizum y PayPal según lo configurado en el dashboard de Stripe.
     */
    public String crearSesionCheckout(Long usuarioId, String plan) throws Exception {
        String priceId = "anual".equalsIgnoreCase(plan) ? priceAnual : priceMensual;
        String planLabel = "anual".equalsIgnoreCase(plan) ? "Premium Anual" : "Premium Mensual";

        SessionCreateParams params = SessionCreateParams.builder()
                // Métodos de pago automáticos según dashboard de Stripe
                // (incluye card; activa Bizum y PayPal en https://dashboard.stripe.com/settings/payment_methods)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setSuccessUrl(frontendUrl + "/pago/exito?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/pago/cancelar")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build()
                )
                .putMetadata("usuarioId", usuarioId.toString())
                .putMetadata("plan", plan)
                .putMetadata("planLabel", planLabel)
                .build();

        Session session = Session.create(params);
        log.info("Sesión Stripe creada: {} para usuario {}", session.getId(), usuarioId);
        return session.getUrl();
    }

    /**
     * Verifica el pago directamente con la API de Stripe y activa la suscripción.
     * Se llama desde la página de éxito para confirmar el pago de forma inmediata.
     */
    @Transactional
    public void verificarYActivar(String sessionId, Long usuarioId) throws Exception {
        Session session = Session.retrieve(sessionId,
                SessionRetrieveParams.builder().build(), null);

        if (!"complete".equals(session.getStatus()) && !"paid".equals(session.getPaymentStatus())) {
            throw new IllegalStateException("El pago no se ha completado");
        }

        // Verificar que la sesión corresponde al usuario que hace la petición
        String metaUsuarioId = session.getMetadata().get("usuarioId");
        if (metaUsuarioId == null || !metaUsuarioId.equals(usuarioId.toString())) {
            throw new SecurityException("La sesión no corresponde al usuario autenticado");
        }

        activarSuscripcion(usuarioId, session.getMetadata().get("plan"),
                session.getMetadata().get("planLabel"));
    }

    /**
     * Procesa eventos del webhook de Stripe.
     * El endpoint debe ser público y verificar la firma antes de llamar a este método.
     */
    @Transactional
    public void procesarWebhook(String payload, String sigHeader) throws Exception {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new SecurityException("Firma del webhook inválida");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("No se pudo deserializar el evento"));

            if ("paid".equals(session.getPaymentStatus())) {
                String usuarioIdStr = session.getMetadata().get("usuarioId");
                if (usuarioIdStr != null) {
                    Long usuarioId = Long.parseLong(usuarioIdStr);
                    activarSuscripcion(usuarioId, session.getMetadata().get("plan"),
                            session.getMetadata().get("planLabel"));
                }
            }
        }
    }

    /** Tarea programada: desactiva suscripciones que hayan expirado (cada hora). */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expirarSuscripciones() {
        List<Usuario> expirados = usuarioRepository
                .findBySuscripcionActivaTrueAndSuscripcionExpiryBefore(LocalDateTime.now());
        if (!expirados.isEmpty()) {
            expirados.forEach(u -> u.setSuscripcionActiva(false));
            usuarioRepository.saveAll(expirados);
            log.info("Suscripciones expiradas desactivadas: {}", expirados.size());
        }
    }

    private void activarSuscripcion(Long usuarioId, String plan, String planLabel) {
        usuarioRepository.findById(usuarioId).ifPresent(usuario -> {
            boolean esAnual = "anual".equalsIgnoreCase(plan);
            LocalDateTime expiry = LocalDateTime.now().plusDays(esAnual ? 365 : 30);

            usuario.setSuscripcionActiva(true);
            usuario.setSuscripcionExpiry(expiry);
            usuarioRepository.save(usuario);

            emailService.enviarConfirmacionPago(
                    usuario.getEmail(),
                    usuario.getNombre(),
                    planLabel != null ? planLabel : (esAnual ? "Premium Anual" : "Premium Mensual"),
                    expiry.format(DATE_FMT)
            );
            log.info("Suscripción activada para usuario {} hasta {}", usuarioId, expiry);
        });
    }
}
