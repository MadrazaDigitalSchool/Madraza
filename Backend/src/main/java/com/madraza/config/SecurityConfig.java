package com.madraza.config;

import com.madraza.security.jwt.AuthEntryPointJwt;
import com.madraza.security.jwt.AuthTokenFilter;
import com.madraza.security.services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * @author Hafdala Mehdi Sidi
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired private UserDetailsServiceImpl userDetailsService;
    @Autowired private AuthEntryPointJwt authEntryPointJwt;
    @Autowired private AuthTokenFilter authTokenFilter;

    // BCrypt es el algoritmo que usamos para encriptar contraseñas
    // nunca guardamos la contraseña en texto plano en la BD
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Desactivamos CSRF porque usamos JWT, no cookies de sesión
                .csrf(csrf -> csrf.disable())

                // Sin sesiones — cada petición se autentica con su token JWT
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Qué rutas son públicas y cuáles requieren autenticación
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tests/**").permitAll()
                        .anyRequest().authenticated()
                )

                // Si no está autenticado devuelve 401 en vez de redirigir al login
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authEntryPointJwt))

                .authenticationProvider(authenticationProvider())

                // Nuestro filtro JWT se ejecuta antes del filtro de Spring
                .addFilterBefore(authTokenFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}