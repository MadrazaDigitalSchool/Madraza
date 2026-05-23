package com.madraza.dto.request;

import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
public record CorreccionRequest(
        Integer nota,
        Map<Long, Boolean> correcciones,
        Map<Long, String> anotaciones
) {}
