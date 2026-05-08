package com.madraza.dto.response;

/**
 * @author Hafdala Mehdi Sidi
 */
// Lo que devolvemos al frontend cuando termina el examen
public record ResultadoResponse(
        Long intentoId,
        int puntuacion,
        int totalPreguntas,
        int correctas,
        int incorrectas,
        double porcentaje,
        String estado,
        long tiempoEmpleado
) {}