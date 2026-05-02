package com.madraza.controller;

import com.madraza.dto.request.LoginRequest;
import com.madraza.dto.request.RegistroRequest;
import com.madraza.dto.response.JwtResponse;
import com.madraza.dto.response.MessageResponse;
import com.madraza.entity.Rol;
import com.madraza.entity.Usuario;
import com.madraza.repository.RolRepository;
import com.madraza.repository.UsuarioRepository;
import com.madraza.security.jwt.JwtUtils;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private EmailService emailService;

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest req) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // Incluir el estado de suscripción en la respuesta
        boolean suscripcionActiva = usuarioRepository.findById(userDetails.getId())
                .map(Usuario::isSuscripcionActiva)
                .orElse(false);

        return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getId(),
                userDetails.getNombre(), userDetails.getUsername(), roles, suscripcionActiva));
    }

    /** POST /api/auth/registro */
    @PostMapping("/registro")
    public ResponseEntity<MessageResponse> registro(@Valid @RequestBody RegistroRequest req) {
        if (usuarioRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: ese email ya está en uso"));
        }

        String tokenVerificacion = UUID.randomUUID().toString();

        Usuario usuario = new Usuario();
        usuario.setNombre(req.nombre());
        usuario.setApellidos(req.apellidos());
        usuario.setEmail(req.email());
        usuario.setPassword(passwordEncoder.encode(req.password()));
        usuario.setTokenVerificacion(tokenVerificacion);
        usuario.setTokenVerificacionExpiry(LocalDateTime.now().plusHours(24));

        Rol rolUser = rolRepository.findByNombre("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Rol ROLE_USER no encontrado en la BD"));
        usuario.setRoles(Set.of(rolUser));
        usuarioRepository.save(usuario);

        // Envío de email de confirmación (asíncrono, no bloquea la respuesta)
        emailService.enviarConfirmacionRegistro(req.email(), req.nombre(), tokenVerificacion);

        return ResponseEntity.ok(new MessageResponse(
                "Cuenta creada. Revisa tu email para confirmar tu dirección."));
    }

    /** GET /api/auth/verificar-email?token=... — público */
    @GetMapping("/verificar-email")
    public ResponseEntity<MessageResponse> verificarEmail(@RequestParam String token) {
        return usuarioRepository.findByTokenVerificacion(token)
                .map(usuario -> {
                    if (usuario.getTokenVerificacionExpiry() != null
                            && usuario.getTokenVerificacionExpiry().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("El enlace de verificación ha expirado"));
                    }
                    usuario.setEmailVerificado(true);
                    usuario.setTokenVerificacion(null);
                    usuario.setTokenVerificacionExpiry(null);
                    usuarioRepository.save(usuario);
                    return ResponseEntity.ok(new MessageResponse("Email verificado correctamente"));
                })
                .orElse(ResponseEntity.badRequest()
                        .body(new MessageResponse("Token de verificación inválido")));
    }

    /** POST /api/auth/recuperar-password — pública */
    @PostMapping("/recuperar-password")
    public ResponseEntity<MessageResponse> recuperarPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(new MessageResponse("Email requerido"));

        // Por seguridad, siempre respondemos igual aunque el email no exista
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            String token = UUID.randomUUID().toString();
            usuario.setTokenRecuperacion(token);
            usuario.setTokenRecuperacionExpiry(LocalDateTime.now().plusHours(2));
            usuarioRepository.save(usuario);
            emailService.enviarRecuperacionPassword(email, usuario.getNombre(), token);
        });

        return ResponseEntity.ok(
                new MessageResponse("Si el email está registrado, recibirás un enlace en breve"));
    }

    /** POST /api/auth/nueva-password — público, con token de recuperación */
    @PostMapping("/nueva-password")
    public ResponseEntity<MessageResponse> nuevaPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String nuevaPassword = body.get("password");

        if (token == null || nuevaPassword == null || nuevaPassword.length() < 8)
            return ResponseEntity.badRequest().body(new MessageResponse("Datos inválidos"));

        return usuarioRepository.findByTokenRecuperacion(token)
                .map(usuario -> {
                    if (usuario.getTokenRecuperacionExpiry() == null
                            || usuario.getTokenRecuperacionExpiry().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("El enlace ha expirado"));
                    }
                    usuario.setPassword(passwordEncoder.encode(nuevaPassword));
                    usuario.setTokenRecuperacion(null);
                    usuario.setTokenRecuperacionExpiry(null);
                    usuarioRepository.save(usuario);
                    return ResponseEntity.ok(new MessageResponse("Contraseña actualizada correctamente"));
                })
                .orElse(ResponseEntity.badRequest().body(new MessageResponse("Token inválido")));
    }

    /** GET /api/auth/perfil — requiere autenticación */
    @GetMapping("/perfil")
    public ResponseEntity<?> getPerfil(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return usuarioRepository.findById(userDetails.getId())
                .map(usuario -> {
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("id",                usuario.getId());
                    resp.put("nombre",            usuario.getNombre());
                    resp.put("apellidos",         usuario.getApellidos());
                    resp.put("email",             usuario.getEmail());
                    resp.put("avatarUrl",         usuario.getAvatarUrl() != null ? usuario.getAvatarUrl() : "");
                    resp.put("emailVerificado",   usuario.isEmailVerificado());
                    resp.put("suscripcionActiva", usuario.isSuscripcionActiva());
                    resp.put("suscripcionExpiry", usuario.getSuscripcionExpiry() != null
                            ? usuario.getSuscripcionExpiry().toString() : "");
                    resp.put("proveedorOauth",    usuario.getProveedorOauth() != null
                            ? usuario.getProveedorOauth() : "");
                    resp.put("roles",             userDetails.getAuthorities().stream()
                                                    .map(GrantedAuthority::getAuthority)
                                                    .collect(Collectors.toList()));
                    return ResponseEntity.<Map<String, Object>>ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** PUT /api/auth/perfil — requiere autenticación */
    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> body) {
        return usuarioRepository.findById(userDetails.getId())
                .map(usuario -> {
                    if (body.containsKey("nombre") && !body.get("nombre").isBlank())
                        usuario.setNombre(body.get("nombre"));
                    if (body.containsKey("apellidos"))
                        usuario.setApellidos(body.get("apellidos") != null ? body.get("apellidos") : "");
                    usuarioRepository.save(usuario);

                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("id",               usuario.getId());
                    resp.put("nombre",           usuario.getNombre());
                    resp.put("apellidos",        usuario.getApellidos());
                    resp.put("email",            usuario.getEmail());
                    resp.put("suscripcionActiva",usuario.isSuscripcionActiva());
                    return ResponseEntity.<Map<String, Object>>ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
