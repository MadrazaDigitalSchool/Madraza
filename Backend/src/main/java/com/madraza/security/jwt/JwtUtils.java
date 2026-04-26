package com.madraza.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import com.madraza.security.services.UserDetailsImpl;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * @author Hafdala Mehdi Sidi
 */
@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    // Lee los valores del application.properties
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private int jwtExpirationMs;

    // Convierte la clave secreta en un objeto Key que usa la librería JWT
    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // Genera el token a partir del usuario autenticado
    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        return generateTokenFromEmail(userPrincipal.getUsername());
    }

    // Genera el token a partir del email directamente
    // Lo usamos también en el login con OAuth2
    public String generateTokenFromEmail(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(key(), Jwts.SIG.HS256)
                .compact();
    }

    // Extrae el email del token para saber quién es el usuario
    public String getEmailFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // Valida que el token sea correcto y no haya expirado
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(authToken);
            return true;
        } catch (ExpiredJwtException e) {
            logger.error("Token expirado: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Token inválido: {}", e.getMessage());
        } catch (io.jsonwebtoken.security.SecurityException e) {
            logger.error("Firma del token inválida: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Token no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Token vacío: {}", e.getMessage());
        }
        return false;
    }
}