package com.madraza.dto.response;

import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
public record JwtResponse(
        String token,
        Long id,
        String nombre,
        String email,
        List<String> roles,
        boolean suscripcionActiva,
        String suscripcionExpiry
) {}
