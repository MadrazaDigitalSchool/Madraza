package com.madraza.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;

import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@DisplayName("GlobalExceptionHandler")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("AuthenticationException devuelve 401 con mensaje genérico")
    void authException_devuelve401() {
        AuthenticationException ex = new BadCredentialsException("Bad credentials");
        ResponseEntity<Map<String, String>> response = handler.handleAuthentication(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody()).containsKey("error");
        assertThat(response.getBody().get("error")).isEqualTo("Credenciales inválidas");
    }

    @Test
    @DisplayName("ResourceNotFoundException devuelve 404 con el mensaje de la excepción")
    void resourceNotFound_devuelve404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Test no encontrado");
        ResponseEntity<Map<String, String>> response = handler.handleNotFound(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody().get("error")).isEqualTo("Test no encontrado");
    }
}
