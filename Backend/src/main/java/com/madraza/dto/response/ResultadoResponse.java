package com.madraza.dto.response;

/**
 * @author Hafdala Mehdi Sidi
 */
public record ResultadoResponse(
        Long intentoId,
        int puntuacion,
        int totalPreguntas,
        int correctas,
        int incorrectas,
        double porcentaje,
        String estado,
        long tiempoEmpleado,
        boolean pendienteCorreccion,
        Integer nota
) {}