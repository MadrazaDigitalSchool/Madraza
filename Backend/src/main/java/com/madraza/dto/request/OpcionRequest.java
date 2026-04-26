package com.madraza.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * @author Hafdala Mehdi Sidi
 */
public record OpcionRequest(
        @NotBlank String texto,
        boolean esCorrecta,
        int orden
) {}