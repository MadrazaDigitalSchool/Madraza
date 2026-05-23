package com.madraza.controller;

import com.madraza.entity.Test;
import com.madraza.entity.Usuario;
import com.madraza.repository.ApunteRepository;
import com.madraza.repository.AsignacionTestRepository;
import com.madraza.security.jwt.AuthEntryPointJwt;
import com.madraza.security.jwt.AuthTokenFilter;
import com.madraza.security.jwt.JwtUtils;
import com.madraza.security.services.UserDetailsServiceImpl;
import com.madraza.service.PdfService;
import com.madraza.service.TestService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TestController.class)
@ActiveProfiles("test")
@DisplayName("TestController")
class TestControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private TestService              testService;
    @MockitoBean private AsignacionTestRepository asignacionRepo;
    @MockitoBean private ApunteRepository         apunteRepo;
    @MockitoBean private PdfService               pdfService;
    @MockitoBean private JwtUtils                 jwtUtils;
    @MockitoBean private AuthTokenFilter          authTokenFilter;
    @MockitoBean private AuthEntryPointJwt        authEntryPointJwt;
    @MockitoBean private UserDetailsServiceImpl   userDetailsService;

    @Nested
    @DisplayName("GET /api/tests")
    class GetTests {

        @org.junit.jupiter.api.Test
        @DisplayName("sin autenticación devuelve lista pública")
        void sinAuth_devuelveLista() throws Exception {
            Usuario creador = new Usuario();
            creador.setId(1L);
            creador.setNombre("Ana");

            Test test = new Test();
            test.setId(1L);
            test.setTitulo("Test público");
            test.setCategoria("Ciencias");
            test.setDificultad("MEDIA");
            test.setVisibilidad("PUBLICO");
            test.setCreador(creador);

            when(testService.getTestsPublicos()).thenReturn(List.of(test));

            mockMvc.perform(get("/api/tests"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].titulo").value("Test público"));
        }
    }

    @Nested
    @DisplayName("POST /api/tests")
    class CrearTest {

        @org.junit.jupiter.api.Test
        @DisplayName("sin autenticación devuelve 401")
        void sinAuth_devuelve401() throws Exception {
            mockMvc.perform(post("/api/tests")
                            .contentType("application/json")
                            .content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @org.junit.jupiter.api.Test
        @WithMockUser
        @DisplayName("autenticado puede crear test")
        void autenticado_puedeCrearTest() throws Exception {
            Usuario creador = new Usuario();
            creador.setId(1L);
            creador.setNombre("Luis");

            Test nuevoTest = new Test();
            nuevoTest.setId(1L);
            nuevoTest.setTitulo("Mi test");
            nuevoTest.setCreador(creador);

            when(testService.crearTest(any(), anyLong())).thenReturn(nuevoTest);

            mockMvc.perform(post("/api/tests")
                            .contentType("application/json")
                            .content("""
                                {
                                  "titulo": "Mi test",
                                  "categoria": "Matemáticas",
                                  "dificultad": "MEDIA",
                                  "visibilidad": "PUBLICO",
                                  "preguntas": []
                                }
                                """))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("DELETE /api/tests/{id}")
    class EliminarTest {

        @org.junit.jupiter.api.Test
        @DisplayName("sin autenticación devuelve 401")
        void sinAuth_devuelve401() throws Exception {
            mockMvc.perform(delete("/api/tests/1"))
                    .andExpect(status().isUnauthorized());
        }

        @org.junit.jupiter.api.Test
        @WithMockUser
        @DisplayName("autenticado puede eliminar su test")
        void autenticado_puedeEliminar() throws Exception {
            doNothing().when(testService).eliminarTest(anyLong(), anyLong());

            mockMvc.perform(delete("/api/tests/1"))
                    .andExpect(status().isNoContent());
        }
    }
}
