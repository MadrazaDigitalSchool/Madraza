package com.madraza.service;

import com.madraza.entity.Usuario;
import com.madraza.repository.UsuarioRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.PaymentMethod;
import com.stripe.model.SetupIntent;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionCollection;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.CustomerUpdateParams;
import com.stripe.param.PaymentMethodAttachParams;
import com.stripe.param.SetupIntentCreateParams;
import com.stripe.param.SubscriptionCreateParams;
import com.stripe.param.SubscriptionListParams;
import com.stripe.param.SubscriptionUpdateParams;
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
    public Map<String, String> crearIntencionPago(Long usuarioId, String plan, String metodoPago) throws Exception {
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

        // apple_pay y google_pay son wallets de tarjeta → usan CARD.
        SubscriptionCreateParams.PaymentSettings.PaymentMethodType pmType = switch (metodoPago.toLowerCase()) {
            case "paypal"             -> SubscriptionCreateParams.PaymentSettings.PaymentMethodType.PAYPAL;
            case "sepa_debit", "sepa" -> SubscriptionCreateParams.PaymentSettings.PaymentMethodType.SEPA_DEBIT;
            default                   -> SubscriptionCreateParams.PaymentSettings.PaymentMethodType.CARD;
        };

        SubscriptionCreateParams subParams = SubscriptionCreateParams.builder()
                .setCustomer(customerId)
                .addItem(SubscriptionCreateParams.Item.builder().setPrice(priceId).build())
                .setPaymentBehavior(SubscriptionCreateParams.PaymentBehavior.DEFAULT_INCOMPLETE)
                .setPaymentSettings(SubscriptionCreateParams.PaymentSettings.builder()
                        .setSaveDefaultPaymentMethod(
                                SubscriptionCreateParams.PaymentSettings.SaveDefaultPaymentMethod.ON_SUBSCRIPTION)
                        .addPaymentMethodType(pmType)
                        .build())
                .addExpand("latest_invoice.payment_intent")
                .putMetadata("usuarioId", usuarioId.toString())
                .putMetadata("plan", plan)
                .putMetadata("planLabel", planLabel)
                .putMetadata("metodoPago", metodoPago)
                .build();

        Subscription subscription = Subscription.create(subParams);
        String clientSecret = subscription.getLatestInvoiceObject()
                .getPaymentIntentObject()
                .getClientSecret();

        log.info("Intención de pago creada: suscripción {} para usuario {} método: {}",
                subscription.getId(), usuarioId, metodoPago);
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
                subscription.getMetadata().get("planLabel"),
                subscription.getMetadata().get("metodoPago"));
    }

    /**
     * Crea una sesión de Stripe Checkout y devuelve la URL de pago.
     * Acepta metodoPago: "klarna" (resto usa el Payment Element automático de Stripe).
     */
    public String crearSesionCheckout(Long usuarioId, String plan, String metodoPago) throws Exception {
        boolean esKlarna = "klarna".equalsIgnoreCase(metodoPago);

        String planLabel = "anual".equalsIgnoreCase(plan) ? "Premium Anual" : "Premium Mensual";
        String priceId   = "anual".equalsIgnoreCase(plan) ? priceAnual : priceMensual;

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setLocale(SessionCreateParams.Locale.ES)
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

        String customerId = usuario.getStripeCustomerId();
        if (customerId != null && !customerId.isBlank()) {
            builder.setCustomer(customerId);
        } else {
            builder.setCustomerEmail(usuario.getEmail());
        }

        if (esKlarna) {
            builder.addPaymentMethodType(SessionCreateParams.PaymentMethodType.KLARNA);
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

        String metaUsuarioId = session.getMetadata().get("usuarioId");
        if (metaUsuarioId == null || !metaUsuarioId.equals(usuarioId.toString())) {
            throw new SecurityException("La sesión no corresponde al usuario autenticado");
        }

        activarSuscripcion(usuarioId, session.getMetadata().get("plan"),
                session.getMetadata().get("planLabel"),
                session.getMetadata().get("metodoPago"));
    }

    /**
     * Procesa eventos del webhook de Stripe.
     * El endpoint debe ser público y verificar la firma antes de llamar a este metodo.
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
                            session.getMetadata().get("planLabel"),
                            session.getMetadata().get("metodoPago"));
                }
            }
        }
    }

    /**
     * Crea un Stripe SetupIntent ligado al Customer del usuario.
     * El frontend usa el clientSecret para capturar el nuevo metodo sin cobrar.
     */
    public String crearSetupIntent(Long usuarioId) throws Exception {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String customerId = usuario.getStripeCustomerId();
        if (customerId == null || customerId.isBlank()) {
            CustomerCreateParams cp = CustomerCreateParams.builder()
                    .setEmail(usuario.getEmail())
                    .setName(usuario.getNombre() + (usuario.getApellidos() != null ? " " + usuario.getApellidos() : ""))
                    .putMetadata("usuarioId", usuarioId.toString())
                    .build();
            Customer customer = Customer.create(cp);
            customerId = customer.getId();
            usuario.setStripeCustomerId(customerId);
            usuarioRepository.save(usuario);
        }

        SetupIntentCreateParams params = SetupIntentCreateParams.builder()
                .setCustomer(customerId)
                .setAutomaticPaymentMethods(
                        SetupIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .putMetadata("usuarioId", usuarioId.toString())
                .build();

        SetupIntent si = SetupIntent.create(params);
        log.info("SetupIntent creado {} para usuario {}", si.getId(), usuarioId);
        return si.getClientSecret();
    }

    /**
     * Tras confirmar el SetupIntent en el frontend, actualiza el metodo de pago
     * por defecto en Stripe (Customer + Subscription activa) y en la BD.
     */
    @Transactional
    public void actualizarMetodoPago(Long usuarioId, String paymentMethodId, String metodoPagoNombre) throws Exception {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String customerId = usuario.getStripeCustomerId();
        if (customerId == null || customerId.isBlank())
            throw new IllegalStateException("El usuario no tiene un cliente Stripe asociado");

        // Asegura que el PM está adjunto al Customer
        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);
        if (pm.getCustomer() == null || !pm.getCustomer().equals(customerId)) {
            pm.attach(PaymentMethodAttachParams.builder().setCustomer(customerId).build());
        }

        Customer.retrieve(customerId).update(
                CustomerUpdateParams.builder()
                        .setInvoiceSettings(CustomerUpdateParams.InvoiceSettings.builder()
                                .setDefaultPaymentMethod(paymentMethodId)
                                .build())
                        .build());

        SubscriptionCollection subs = Subscription.list(
                SubscriptionListParams.builder()
                        .setCustomer(customerId)
                        .setStatus(SubscriptionListParams.Status.ACTIVE)
                        .setLimit(1L)
                        .build());

        if (!subs.getData().isEmpty()) {
            subs.getData().get(0).update(
                    SubscriptionUpdateParams.builder()
                            .setDefaultPaymentMethod(paymentMethodId)
                            .build());
        }

        usuario.setMetodoPago(metodoPagoNombre);
        usuarioRepository.save(usuario);
        log.info("Método de pago actualizado para usuario {}: {}", usuarioId, metodoPagoNombre);
    }

    /**
     * Cambia el plan de una suscripción activa (mensual ↔ anual).
     * Upgrade: aplica inmediatamente con prorrateo.
     * Downgrade: aplica al final del período actual.
     */
    @Transactional
    public void cambiarPlan(Long usuarioId, String nuevoPlan) throws Exception {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!usuario.isSuscripcionActiva()) {
            throw new IllegalStateException("No tienes una suscripción activa para cambiar");
        }

        String planActual = usuario.getPlanTipo() != null ? usuario.getPlanTipo().toLowerCase() : "";
        if (nuevoPlan.equalsIgnoreCase(planActual)) {
            throw new IllegalArgumentException("Ya tienes este plan activo");
        }

        String customerId = usuario.getStripeCustomerId();
        boolean esAnual = "anual".equalsIgnoreCase(nuevoPlan);
        String nuevoPriceId = esAnual ? priceAnual : priceMensual;
        String planLabel    = esAnual ? "Premium Anual" : "Premium Mensual";

        LocalDateTime expiry = LocalDateTime.now().plusDays(esAnual ? 365 : 30);

        if (customerId != null && !customerId.isBlank()) {
            SubscriptionCollection subs = Subscription.list(
                    SubscriptionListParams.builder()
                            .setCustomer(customerId)
                            .setStatus(SubscriptionListParams.Status.ACTIVE)
                            .setLimit(1L)
                            .build());

            if (!subs.getData().isEmpty()) {
                Subscription sub    = subs.getData().get(0);
                String itemId       = sub.getItems().getData().get(0).getId();

                Subscription updated = sub.update(SubscriptionUpdateParams.builder()
                        .addItem(SubscriptionUpdateParams.Item.builder()
                                .setId(itemId)
                                .setPrice(nuevoPriceId)
                                .build())
                        .setProrationBehavior(esAnual
                                ? SubscriptionUpdateParams.ProrationBehavior.ALWAYS_INVOICE
                                : SubscriptionUpdateParams.ProrationBehavior.NONE)
                        .putMetadata("plan", nuevoPlan)
                        .putMetadata("planLabel", planLabel)
                        .build());

                // Usar la fecha de fin de ciclo real que devuelve Stripe
                expiry = java.time.Instant.ofEpochSecond(updated.getCurrentPeriodEnd())
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime();

                log.info("Suscripción Stripe actualizada para usuario {}: {} → {}, expiry={}",
                        usuarioId, planActual, nuevoPlan, expiry);
            }
        }

        usuario.setPlanTipo(nuevoPlan.toLowerCase());
        usuario.setSuscripcionExpiry(expiry);
        usuarioRepository.save(usuario);

        emailService.enviarConfirmacionPago(usuario.getEmail(), usuario.getNombre(), planLabel, expiry.format(DATE_FMT));
        log.info("Plan cambiado para usuario {}: {} → {}", usuarioId, planActual, nuevoPlan);
    }

    /**
     * Cancela la suscripción activa al final del período ya pagado (cancel_at_period_end).
     * El usuario mantiene acceso Premium hasta la fecha de expiración actual.
     * El job @Scheduled la desactivará cuando caduque.
     */
    @Transactional
    public String cancelarSuscripcion(Long usuarioId) throws Exception {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!usuario.isSuscripcionActiva()) {
            throw new IllegalStateException("No tienes una suscripción activa para cancelar");
        }

        String customerId = usuario.getStripeCustomerId();
        if (customerId != null && !customerId.isBlank()) {
            SubscriptionCollection subs = Subscription.list(
                    SubscriptionListParams.builder()
                            .setCustomer(customerId)
                            .setStatus(SubscriptionListParams.Status.ACTIVE)
                            .setLimit(1L)
                            .build());

            if (!subs.getData().isEmpty()) {
                subs.getData().get(0).update(
                        SubscriptionUpdateParams.builder()
                                .setCancelAtPeriodEnd(true)
                                .build());
                log.info("Suscripción Stripe marcada para cancelar al final del período: usuario {}", usuarioId);
            }
        }

        String expiryStr = usuario.getSuscripcionExpiry() != null
                ? usuario.getSuscripcionExpiry().format(DATE_FMT) : "";
        String mensaje = expiryStr.isBlank()
                ? "Suscripción cancelada. Seguirás con acceso Premium hasta el fin del período actual."
                : "Suscripción cancelada. Seguirás con acceso Premium hasta el " + expiryStr + ".";

        log.info("Cancelación procesada para usuario {}", usuarioId);
        return mensaje;
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

    private void activarSuscripcion(Long usuarioId, String plan, String planLabel, String metodoPago) {
        usuarioRepository.findById(usuarioId).ifPresent(usuario -> {
            boolean esAnual = "anual".equalsIgnoreCase(plan);
            LocalDateTime expiry = LocalDateTime.now().plusDays(esAnual ? 365 : 30);

            usuario.setSuscripcionActiva(true);
            usuario.setSuscripcionExpiry(expiry);
            usuario.setPlanTipo(plan != null ? plan : (esAnual ? "anual" : "mensual"));
            usuario.setMetodoPago(metodoPago != null ? metodoPago : "tarjeta");
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
