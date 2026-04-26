package com.madraza.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
public record PreguntaRequest(
        @NotBlank String enunciado,
        String tipo,        // OPCION_MULTIPLE | VERDADERO_FALSO | TEXTO_LIBRE
        int orden,
        int puntos,
        String explicacion,
        List<OpcionRequest> opciones
) {}