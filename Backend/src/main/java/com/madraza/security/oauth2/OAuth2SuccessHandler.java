package com.madraza.security.oauth2;

import com.madraza.entity.Usuario;
import com.madraza.repository.UsuarioRepository;
import com.madraza.security.jwt.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Se ejecuta tras el login exitoso con Google o GitHub.
 * Genera un JWT y redirige al frontend con el token como parámetro.
 *
 * @author Hafdala Mehdi Sidi
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    @Autowired private JwtUtils jwtUtils;
    @Autowired private UsuarioRepository usuarioRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = extraerEmail(oAuth2User);
        if (email == null) {
            log.error("No se pudo obtener el email del usuario OAuth2");
            response.sendRedirect(frontendUrl + "/auth/login?error=oauth2_email");
            return;
        }

        String token = jwtUtils.generateTokenFromEmail(email);

        // Calcular estado de suscripción real (flag + expiración)
        boolean suscripcionActiva = usuarioRepository.findByEmail(email)
                .map(u -> {
                    if (!u.isSuscripcionActiva()) return false;
                    LocalDateTime expiry = u.getSuscripcionExpiry();
                    if (expiry != null && expiry.isBefore(LocalDateTime.now())) {
                        u.setSuscripcionActiva(false);
                        usuarioRepository.save(u);
                        return false;
                    }
                    return true;
                })
                .orElse(false);

        String redirectUrl = frontendUrl + "/auth/oauth2/callback?token=" + token
                + "&suscripcionActiva=" + suscripcionActiva;
        log.info("OAuth2 login exitoso para {}, redirigiendo al frontend", email);
        response.sendRedirect(redirectUrl);
    }

    private String extraerEmail(OAuth2User user) {
        Object email = user.getAttribute("email");
        return email != null ? (String) email : null;
    }
}
