package com.madraza.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.*;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Servicio de IA usando Claude API como proxy desde el backend.
 * La API key nunca se expone al cliente.
 *
 * @author Hafdala Mehdi Sidi
 */
@Service
public class IaService {

    private static final Logger log = LoggerFactory.getLogger(IaService.class);

    @Value("${anthropic.api.key:}")
    private String apiKey;

    private AnthropicClient client;

    private static final String SYSTEM_PROMPT = """
            Eres un asistente educativo de Madraza, una plataforma de formación online.
            Ayudas a los usuarios a estudiar, tomar apuntes y repasar contenido.
            Responde siempre en español, de forma clara y estructurada.
            Cuando generes apuntes, usa formato Markdown con cabeceras, listas y ejemplos.
            Sé conciso pero completo. No inventes información que no esté en el contexto proporcionado.
            """;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            this.client = AnthropicOkHttpClient.builder()
                    .apiKey(apiKey)
                    .build();
            log.info("IaService inicializado con Claude API");
        } else {
            log.warn("ANTHROPIC_API_KEY no configurada — el asistente de IA no estará disponible");
        }
    }

    public boolean isDisponible() {
        return client != null;
    }

    /**
     * Modo asistente: ayuda con el contenido que ya tiene el usuario.
     * accion: "ampliar" | "resumir" | "preguntas" | "explicar"
     */
    public String asistir(String contenidoActual, String textoSeleccionado, String accion) {
        if (!isDisponible()) throw new IllegalStateException("El asistente de IA no está configurado");

        String userPrompt = switch (accion) {
            case "ampliar"   -> "Amplía y desarrolla este texto con más detalle:\n\n" + textoSeleccionado;
            case "resumir"   -> "Resume este contenido en los puntos clave:\n\n" + textoSeleccionado;
            case "preguntas" -> "Genera 5 preguntas de repaso sobre este contenido:\n\n" + textoSeleccionado;
            case "explicar"  -> "Explica de forma sencilla el siguiente concepto:\n\n" + textoSeleccionado;
            default          -> textoSeleccionado;
        };

        if (contenidoActual != null && !contenidoActual.isBlank()) {
            userPrompt += "\n\nContexto del apunte completo:\n" + contenidoActual;
        }

        return llamarApi(userPrompt);
    }

    /**
     * Modo generación: genera un apunte completo desde un prompt del usuario.
     */
    public String generarApunte(String tema, String contextoAdicional) {
        if (!isDisponible()) throw new IllegalStateException("El asistente de IA no está configurado");

        String prompt = "Genera un apunte completo sobre el siguiente tema en formato Markdown:\n\n" + tema;
        if (contextoAdicional != null && !contextoAdicional.isBlank()) {
            prompt += "\n\nInformación adicional a incluir:\n" + contextoAdicional;
        }

        return llamarApi(prompt);
    }

    private String llamarApi(String userPrompt) {
        try {
            MessageCreateParams params = MessageCreateParams.builder()
                    .model(Model.CLAUDE_SONNET_4_6)
                    .maxTokens(2048L)
                    .system(SYSTEM_PROMPT)
                    .addUserMessage(userPrompt)
                    .build();

            Message message = client.messages().create(params);
            return message.content().stream()
                    .filter(ContentBlock::isText)
                    .map(b -> b.asText().text())
                    .findFirst()
                    .orElse("");
        } catch (Exception e) {
            log.error("Error llamando a Claude API: {}", e.getMessage());
            throw new RuntimeException("Error al contactar con el asistente de IA. Inténtalo de nuevo.");
        }
    }
}
