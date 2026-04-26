package com.madraza.dto.response;

import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
// Lo que devolvemos al frontend cuando el login es correcto
public record JwtResponse(
        String token,      // El token JWT para autenticar futuras peticiones
        Long id,
        String nombre,
        String email,
        List<String> roles // Los roles del usuario: ROLE_USER, ROLE_ADMIN...
) {}