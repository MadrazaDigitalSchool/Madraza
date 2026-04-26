package com.madraza.dto.request;

/**
 * @author Hafdala Mehdi Sidi
 */
// Lo que envía el frontend cuando el usuario responde una pregunta
public record RespuestaRequest(
        Long preguntaId,
        Long opcionId,    // null si es texto libre
        String textoLibre // null si es opción múltiple
) {}