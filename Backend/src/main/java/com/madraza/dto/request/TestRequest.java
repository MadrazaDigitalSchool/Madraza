package com.madraza.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
public record TestRequest(
        @NotBlank String titulo,
        String descripcion,
        @NotBlank String categoria,
        String dificultad,    // BAJA | MEDIA | ALTA
        Integer tiempoLimite, // en segundos, puede ser null
        String visibilidad,   // PUBLICO | PRIVADO
        List<PreguntaRequest> preguntas
) {}