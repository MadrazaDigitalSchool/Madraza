package com.madraza.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.madraza.config.SecurityConfig;
import com.madraza.entity.Rol;
import com.madraza.entity.Usuario;
import com.madraza.repository.IntentoRepository;
import com.madraza.repository.RolRepository;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
import com.madraza.security.jwt.JwtUtils;
import com.madraza.service.EmailService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = AuthController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE, value = SecurityConfig.class))
@ActiveProfiles("test")
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private AuthenticationManager authenticationManager;
    @MockitoBean private UsuarioRepository     usuarioRepository;
    @MockitoBean private RolRepository         rolRepository;
    @MockitoBean private PasswordEncoder       passwordEncoder;
    @MockitoBean private JwtUtils              jwtUtils;
    @MockitoBean private EmailService          emailService;
    @MockitoBean private IntentoRepository     intentoRepository;
    @MockitoBean private TestRepository        testRepository;

    @TestConfiguration
    static class TestSecurity {
        @Bean
        SecurityFilterChain chain(HttpSecurity http) throws Exception {
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/registro").permitAll()
                    .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                    .authenticationEntryPoint((req, res, exc) ->
                            res.sendError(HttpServletResponse.SC_UNAUTHORIZED)));
            return http.build();
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("credenciales válidas devuelven token JWT")
        void credencialesValidas_devuelvenToken() throws Exception {
            Usuario usuario = buildUsuario();

            Authentication auth = mock(Authentication.class);
            com.madraza.security.services.UserDetailsImpl userDetails =
                    com.madraza.security.services.UserDetailsImpl.build(usuario);
            when(auth.getPrincipal()).thenReturn(userDetails);
            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(jwtUtils.generateJwtToken(any())).thenReturn("mock-jwt-token");
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("email", "test@test.com", "password", "password123"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("mock-jwt-token"));
        }

        @Test
        @DisplayName("credenciales inválidas devuelven 401")
        void credencialesInvalidas_devuelven401() throws Exception {
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("email", "mal@test.com", "password", "wrong"))))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/registro")
    class Registro {

        @Test
        @DisplayName("email ya registrado devuelve 400")
        void emailYaRegistrado_devuelve400() throws Exception {
            when(usuarioRepository.existsByEmail("existe@test.com")).thenReturn(true);

            mockMvc.perform(post("/api/auth/registro")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "nombre", "Ana",
                                    "apellidos", "García",
                                    "email", "existe@test.com",
                                    "password", "pass1234"))))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("registro correcto devuelve 200 con mensaje")
        void registroCorrecto_devuelve200() throws Exception {
            when(usuarioRepository.existsByEmail(anyString())).thenReturn(false);
            Rol rolUser = new Rol();
            rolUser.setNombre("ROLE_USER");
            when(rolRepository.findByNombre("ROLE_USER"))
                    .thenReturn(Optional.of(rolUser));
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            when(usuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(emailService).enviarConfirmacionRegistro(any(), any(), any());

            mockMvc.perform(post("/api/auth/registro")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "nombre", "Pedro",
                                    "apellidos", "López",
                                    "email", "nuevo@test.com",
                                    "password", "pass1234"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    @Nested
    @DisplayName("GET /api/auth/perfil")
    class Perfil {

        @Test
        @DisplayName("sin autenticación devuelve 401")
        void sinAuth_devuelve401() throws Exception {
            mockMvc.perform(get("/api/auth/perfil"))
                    .andExpect(status().isUnauthorized());
        }
    }

    private Usuario buildUsuario() {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setNombre("Test");
        u.setApellidos("User");
        u.setEmail("test@test.com");
        u.setPassword("hashed");
        u.setEmailVerificado(true);
        u.setSuscripcionActiva(false);
        Rol rol = new Rol();
        rol.setNombre("ROLE_USER");
        u.setRoles(Set.of(rol));
        return u;
    }
}
