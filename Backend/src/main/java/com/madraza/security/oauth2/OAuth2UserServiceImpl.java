package com.madraza.security.oauth2;

import com.madraza.entity.Rol;
import com.madraza.entity.Usuario;
import com.madraza.repository.RolRepository;
import com.madraza.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

/**
 * Procesa el usuario que viene de Google o GitHub.
 * Si no existe en la BD lo crea; si ya existe lo actualiza.
 *
 * @author Hafdala Mehdi Sidi
 */
@Service
public class OAuth2UserServiceImpl extends DefaultOAuth2UserService {

    private static final Logger log = LoggerFactory.getLogger(OAuth2UserServiceImpl.class);

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String proveedor = userRequest.getClientRegistration().getRegistrationId(); // "google" o "github"
        Map<String, Object> attrs = oAuth2User.getAttributes();

        String email = extraerEmail(proveedor, attrs);
        String nombre = extraerNombre(proveedor, attrs);
        String avatarUrl = extraerAvatar(proveedor, attrs);

        if (email == null || email.isBlank()) {
            log.warn("OAuth2 usuario sin email desde proveedor: {}", proveedor);
            throw new OAuth2AuthenticationException("No se pudo obtener el email del proveedor " + proveedor);
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .map(u -> actualizarUsuarioOAuth2(u, nombre, avatarUrl, proveedor))
                .orElseGet(() -> crearUsuarioOAuth2(email, nombre, avatarUrl, proveedor));

        return oAuth2User;
    }

    private Usuario actualizarUsuarioOAuth2(Usuario u, String nombre, String avatarUrl, String proveedor) {
        if (u.getAvatarUrl() == null && avatarUrl != null) u.setAvatarUrl(avatarUrl);
        if (!u.isEmailVerificado()) u.setEmailVerificado(true); // Google/GitHub ya verifican el email
        if (u.getProveedorOauth() == null) u.setProveedorOauth(proveedor);
        return usuarioRepository.save(u);
    }

    private Usuario crearUsuarioOAuth2(String email, String nombre, String avatarUrl, String proveedor) {
        Rol rolUser = rolRepository.findByNombre("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Rol ROLE_USER no encontrado"));

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setNombre(nombre != null ? nombre : email.split("@")[0]);
        usuario.setApellidos("");
        usuario.setAvatarUrl(avatarUrl);
        usuario.setProveedorOauth(proveedor);
        usuario.setEmailVerificado(true); // proveedores OAuth2 verifican el email
        usuario.setRoles(Set.of(rolUser));
        return usuarioRepository.save(usuario);
    }

    private String extraerEmail(String proveedor, Map<String, Object> attrs) {
        return switch (proveedor) {
            case "google" -> (String) attrs.get("email");
            case "github" -> {
                Object email = attrs.get("email");
                yield email != null ? (String) email : null;
            }
            default -> (String) attrs.get("email");
        };
    }

    private String extraerNombre(String proveedor, Map<String, Object> attrs) {
        return switch (proveedor) {
            case "google" -> (String) attrs.get("name");
            case "github" -> {
                Object name = attrs.get("name");
                yield name != null ? (String) name : (String) attrs.get("login");
            }
            default -> (String) attrs.get("name");
        };
    }

    private String extraerAvatar(String proveedor, Map<String, Object> attrs) {
        return switch (proveedor) {
            case "google" -> (String) attrs.get("picture");
            case "github" -> (String) attrs.get("avatar_url");
            default -> null;
        };
    }
}
