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
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Permite peticiones desde el frontend Angular
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtils jwtUtils;

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest req) {

        // 1. Autenticamos al usuario con email y contraseña
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));

        // 2. Guardamos la autenticación en el contexto de seguridad
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Generamos el token JWT
        String jwt = jwtUtils.generateJwtToken(authentication);

        // 4. Obtenemos los datos del usuario autenticado
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getNombre(),
                userDetails.getUsername(),
                roles));
    }

    // POST /api/auth/registro
    @PostMapping("/registro")
    public ResponseEntity<MessageResponse> registro(@Valid @RequestBody RegistroRequest req) {

        // Comprobamos que el email no esté ya registrado
        if (usuarioRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: ese email ya está en uso"));
        }

        // Creamos el nuevo usuario con la contraseña encriptada
        Usuario usuario = new Usuario();
        usuario.setNombre(req.nombre());
        usuario.setApellidos(req.apellidos());
        usuario.setEmail(req.email());
        usuario.setPassword(passwordEncoder.encode(req.password()));

        // Asignamos el rol USER por defecto
        Rol rolUser = rolRepository.findByNombre("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado"));
        usuario.setRoles(Set.of(rolUser));

        usuarioRepository.save(usuario);

        return ResponseEntity.ok(new MessageResponse("Usuario registrado correctamente"));
    }

    // GET /api/auth/perfil — devuelve los datos del usuario autenticado
    @GetMapping("/perfil")
    public ResponseEntity<?> getPerfil(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return usuarioRepository.findById(userDetails.getId())
                .map(usuario -> {
                    Map<String, Object> body = new java.util.LinkedHashMap<>();
                    body.put("id",              usuario.getId());
                    body.put("nombre",          usuario.getNombre());
                    body.put("apellidos",       usuario.getApellidos());
                    body.put("email",           usuario.getEmail());
                    body.put("avatarUrl",       usuario.getAvatarUrl() != null ? usuario.getAvatarUrl() : "");
                    body.put("emailVerificado", usuario.isEmailVerificado());
                    body.put("roles",           userDetails.getAuthorities().stream()
                                                    .map(a -> a.getAuthority())
                                                    .collect(Collectors.toList()));
                    return ResponseEntity.<Map<String, Object>>ok(body);
                })
                .orElse(ResponseEntity.notFound().build());
    }

}