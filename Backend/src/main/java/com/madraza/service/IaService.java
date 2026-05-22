package com.madraza.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Servicio de IA usando DeepSeek API (compatible con OpenAI).
 * La API key nunca se expone al cliente.
 *
 * @author Hafdala Mehdi Sidi
 */
@Service
public class IaService {

    private static final Logger log = LoggerFactory.getLogger(IaService.class);

    @Value("${deepseek.api.key:}")
    private String apiKey;

    private RestTemplate restTemplate;

    private static final String API_URL = "https://api.deepseek.com/chat/completions";
    private static final String MODEL   = "deepseek-chat";

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
            this.restTemplate = new RestTemplate();
            log.info("IaService inicializado con DeepSeek API");
        } else {
            log.warn("DEEPSEEK_API_KEY no configurada — el asistente de IA no estará disponible");
        }
    }

    public boolean isDisponible() {
        return restTemplate != null;
    }

    /**
     * Modo asistente: ampliar, resumir, preguntas o explicar texto seleccionado.
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
     * Modo generación: crea un apunte completo en Markdown sobre el tema indicado.
     */
    public String generarApunte(String tema, String contextoAdicional) {
        if (!isDisponible()) throw new IllegalStateException("El asistente de IA no está configurado");

        String prompt = "Genera un apunte completo sobre el siguiente tema en formato Markdown:\n\n" + tema;
        if (contextoAdicional != null && !contextoAdicional.isBlank()) {
            prompt += "\n\nInformación adicional a incluir:\n" + contextoAdicional;
        }

        return llamarApi(prompt);
    }

    @SuppressWarnings("unchecked")
    private String llamarApi(String userPrompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                "model",    MODEL,
                "messages", List.of(
                    Map.of("role", "system", "content", SYSTEM_PROMPT),
                    Map.of("role", "user",   "content", userPrompt)
                ),
                "max_tokens", 2048
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(API_URL, request, Map.class);

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message       = (Map<String, Object>)       choices.get(0).get("message");

            return (String) message.get("content");
        } catch (Exception e) {
            log.error("Error llamando a DeepSeek API: {}", e.getMessage());
            throw new RuntimeException("Error al contactar con el asistente de IA. Inténtalo de nuevo.");
        }
    }
}
