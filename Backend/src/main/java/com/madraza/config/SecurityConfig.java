package com.madraza.config;

import com.madraza.security.jwt.AuthEntryPointJwt;
import com.madraza.security.jwt.AuthTokenFilter;
import com.madraza.security.oauth2.OAuth2SuccessHandler;
import com.madraza.security.oauth2.OAuth2UserServiceImpl;
import com.madraza.security.services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.EnableAsync;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Configuration
@EnableWebSecurity
@EnableAsync
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

    @Autowired private UserDetailsServiceImpl userDetailsService;
    @Autowired private AuthEntryPointJwt authEntryPointJwt;
    @Autowired private OAuth2UserServiceImpl oAuth2UserService;
    @Autowired private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public AuthTokenFilter authTokenFilter() {
        return new AuthTokenFilter();
    }

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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        String allowedOriginsEnv = System.getenv("ALLOWED_ORIGINS");
        List<String> allowedOrigins = (allowedOriginsEnv != null && !allowedOriginsEnv.isBlank())
                ? List.of(allowedOriginsEnv.split(","))
                : List.of("http://localhost:4200", "http://localhost:4000");

        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                    // OAuth2 necesita sesión para el flujo de redirección
                    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                // Auth pública
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/registro").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/recuperar-password").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/verificar-email").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/nueva-password").permitAll()
                // Webhook de Stripe — siempre público, verifica firma internamente
                .requestMatchers(HttpMethod.POST, "/api/pago/webhook").permitAll()
                // OAuth2 endpoints gestionados por Spring Security
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                // Contacto: público
                .requestMatchers(HttpMethod.POST, "/api/contacto").permitAll()
                // Tests: lectura pública (ambos con y sin path adicional)
                .requestMatchers(HttpMethod.GET, "/api/tests").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tests/**").permitAll()
                // Admin: solo ROLE_ADMIN
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(authEntryPointJwt))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(authTokenFilter(), UsernamePasswordAuthenticationFilter.class)
            // OAuth2 login
            .oauth2Login(oauth2 -> oauth2
                    .userInfoEndpoint(userInfo -> userInfo
                            .userService(oAuth2UserService))
                    .successHandler(oAuth2SuccessHandler)
            );

        return http.build();
    }
}
