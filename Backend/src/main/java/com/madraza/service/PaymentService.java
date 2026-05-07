package com.madraza.service;

import com.madraza.entity.Usuario;
import com.madraza.repository.UsuarioRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SubscriptionCreateParams;
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
import java.util.Map;

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

    @Value("${stripe.price.mensual.bizum}")
    private String priceMensualBizum;

    @Value("${stripe.price.anual.bizum}")
    private String priceAnualBizum;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * Crea un Customer de Stripe (o reutiliza el existente) y una Subscription incompleta.
     * Devuelve el clientSecret del PaymentIntent y el subscriptionId para confirmar desde el frontend.
     */
    public Map<String, String> crearIntencionPago(Long usuarioId, String plan) throws Exception {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String customerId = usuario.getStripeCustomerId();
        if (customerId == null || customerId.isBlank()) {
            CustomerCreateParams customerParams = CustomerCreateParams.builder()
                    .setEmail(usuario.getEmail())
                    .setName(usuario.getNombre() + (usuario.getApellidos() != null ? " " + usuario.getApellidos() : ""))
                    .putMetadata("usuarioId", usuarioId.toString())
                    .build();
            Customer customer = Customer.create(customerParams);
            customerId = customer.getId();
            usuario.setStripeCustomerId(customerId);
            usuarioRepository.save(usuario);
        }

        String priceId   = "anual".equalsIgnoreCase(plan) ? priceAnual : priceMensual;
        String planLabel = "anual".equalsIgnoreCase(plan) ? "Premium Anual" : "Premium Mensual";

        SubscriptionCreateParams subParams = SubscriptionCreateParams.builder()
                .setCustomer(customerId)
                .addItem(SubscriptionCreateParams.Item.builder().setPrice(priceId).build())
                .setPaymentBehavior(SubscriptionCreateParams.PaymentBehavior.DEFAULT_INCOMPLETE)
                .setPaymentSettings(SubscriptionCreateParams.PaymentSettings.builder()
                        .setSaveDefaultPaymentMethod(
                                SubscriptionCreateParams.PaymentSettings.SaveDefaultPaymentMethod.ON_SUBSCRIPTION)
                        .addPaymentMethodType(SubscriptionCreateParams.PaymentSettings.PaymentMethodType.CARD)
                        .addPaymentMethodType(SubscriptionCreateParams.PaymentSettings.PaymentMethodType.PAYPAL)
                        .build())
                .addExpand("latest_invoice.payment_intent")
                .putMetadata("usuarioId", usuarioId.toString())
                .putMetadata("plan", plan)
                .putMetadata("planLabel", planLabel)
                .build();

        Subscription subscription = Subscription.create(subParams);
        String clientSecret = subscription.getLatestInvoiceObject()
                .getPaymentIntentObject()
                .getClientSecret();

        log.info("Intención de pago creada: suscripción {} para usuario {}", subscription.getId(), usuarioId);
        return Map.of("clientSecret", clientSecret, "subscriptionId", subscription.getId());
    }

    /**
     * Verifica con Stripe que la suscripción está activa y activa la cuenta del usuario.
     * Se llama desde el frontend tras confirmar el pago con Stripe.js.
     */
    @Transactional
    public void confirmarSuscripcion(Long usuarioId, String subscriptionId) throws Exception {
        Subscription subscription = Subscription.retrieve(subscriptionId);

        String metaUsuarioId = subscription.getMetadata().get("usuarioId");
        if (metaUsuarioId == null || !metaUsuarioId.equals(usuarioId.toString())) {
            throw new SecurityException("La suscripción no corresponde al usuario autenticado");
        }

        if (!"active".equals(subscription.getStatus())) {
            throw new IllegalStateException("La suscripción aún no está activa (estado: " + subscription.getStatus() + ")");
        }

        activarSuscripcion(usuarioId,
                subscription.getMetadata().get("plan"),
                subscription.getMetadata().get("planLabel"));
    }

    /**
     * Crea una sesión de Stripe Checkout y devuelve la URL de pago.
     * Acepta metodoPago: "tarjeta", "bizum" "Klarna" o "paypal".
     */
    public String crearSesionCheckout(Long usuarioId, String plan, String metodoPago) throws Exception {
        boolean esBizum  = "bizum".equalsIgnoreCase(metodoPago);
        String planLabel = "anual".equalsIgnoreCase(plan) ? "Premium Anual" : "Premium Mensual";
        String priceId   = esBizum
                ? ("anual".equalsIgnoreCase(plan) ? priceAnualBizum : priceMensualBizum)
                : ("anual".equalsIgnoreCase(plan) ? priceAnual      : priceMensual);

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(esBizum ? SessionCreateParams.Mode.PAYMENT : SessionCreateParams.Mode.SUBSCRIPTION)
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
                .putMetadata("metodoPago", metodoPago != null ? metodoPago : "tarjeta");

        if (esBizum) {
            builder.putExtraParam("payment_method_types", List.of("bizum"));
        } else {
            builder.addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                   .addPaymentMethodType(SessionCreateParams.PaymentMethodType.PAYPAL)
                   .addPaymentMethodType(SessionCreateParams.PaymentMethodType.KLARNA);
        }

        Session session = Session.create(builder.build());
        log.info("Sesión Stripe creada: {} para usuario {} método: {}", session.getId(), usuarioId, metodoPago);
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

        if (!"complete".equals(session.getStatus()) || !"paid".equals(session.getPaymentStatus())) {
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
