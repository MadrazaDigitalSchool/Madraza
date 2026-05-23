package com.madraza.service;

import com.madraza.dto.request.CorreccionRequest;
import com.madraza.dto.request.RespuestaRequest;
import com.madraza.dto.response.ResultadoResponse;
import com.madraza.entity.*;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("IntentoService")
class IntentoServiceTest {

    @Mock private IntentoRepository          intentoRepository;
    @Mock private TestRepository             testRepository;
    @Mock private UsuarioRepository          usuarioRepository;
    @Mock private PreguntaRepository         preguntaRepository;
    @Mock private OpcionRepository           opcionRepository;
    @Mock private RespuestaIntentoRepository respuestaRepo;

    @InjectMocks
    private IntentoService intentoService;

    private Usuario usuario;
    private Test    test;
    private Intento intentoEnCurso;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setSuscripcionActiva(true);

        test = new Test();
        test.setId(5L);
        test.setTitulo("Test ejemplo");
        test.setPreguntas(new ArrayList<>());
        test.setCreador(usuario);

        intentoEnCurso = new Intento();
        intentoEnCurso.setId(100L);
        intentoEnCurso.setUsuario(usuario);
        intentoEnCurso.setTest(test);
        intentoEnCurso.setEstado("EN_CURSO");
        intentoEnCurso.setInicio(LocalDateTime.now().minusMinutes(5));
        intentoEnCurso.setTotalPreguntas(2);
        intentoEnCurso.setRespuestas(new ArrayList<>());
    }

    @Nested
    @DisplayName("iniciarIntento")
    class IniciarIntento {

        @org.junit.jupiter.api.Test
        @DisplayName("usuario premium inicia intento correctamente")
        void usuarioPremium_iniciaIntento() {
            when(testRepository.findById(5L)).thenReturn(Optional.of(test));
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Intento resultado = intentoService.iniciarIntento(5L, 1L);

            assertThat(resultado.getEstado()).isEqualTo("EN_CURSO");
            assertThat(resultado.getUsuario()).isEqualTo(usuario);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("usuario free en límite mensual lanza excepción")
        void usuarioFree_enLimiteMensual_lanzaExcepcion() {
            usuario.setSuscripcionActiva(false);
            when(testRepository.findById(5L)).thenReturn(Optional.of(test));
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(intentoRepository.countByUsuarioIdAndInicioAfter(anyLong(), any())).thenReturn(10L);

            assertThatThrownBy(() -> intentoService.iniciarIntento(5L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("límite");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("test no encontrado lanza excepción")
        void testNoEncontrado_lanzaExcepcion() {
            when(testRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> intentoService.iniciarIntento(99L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("finalizar")
    class Finalizar {

        @org.junit.jupiter.api.Test
        @DisplayName("todas las respuestas correctas dan 100%")
        void todasCorrectas_porcentaje100() {
            RespuestaIntento r1 = respuestaCorrecta();
            RespuestaIntento r2 = respuestaCorrecta();
            intentoEnCurso.setRespuestas(new ArrayList<>(List.of(r1, r2)));
            intentoEnCurso.setTotalPreguntas(2);

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ResultadoResponse resultado = intentoService.finalizar(100L, 1L);

            assertThat(resultado.porcentaje()).isEqualTo(100.0);
            assertThat(resultado.correctas()).isEqualTo(2);
            assertThat(resultado.estado()).isEqualTo("COMPLETADO");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("ninguna respuesta correcta da 0%")
        void ningunaCorrecta_porcentaje0() {
            RespuestaIntento r1 = respuestaIncorrecta();
            RespuestaIntento r2 = respuestaIncorrecta();
            intentoEnCurso.setRespuestas(new ArrayList<>(List.of(r1, r2)));

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ResultadoResponse resultado = intentoService.finalizar(100L, 1L);

            assertThat(resultado.porcentaje()).isEqualTo(0.0);
            assertThat(resultado.correctas()).isEqualTo(0);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("respuesta pendiente de corrección deja estado PENDIENTE_CORRECCION")
        void conTextoPendiente_estadoPendiente() {
            RespuestaIntento pendiente = new RespuestaIntento();
            pendiente.setPendienteCorreccion(true);
            intentoEnCurso.setRespuestas(new ArrayList<>(List.of(pendiente)));

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ResultadoResponse resultado = intentoService.finalizar(100L, 1L);

            assertThat(resultado.estado()).isEqualTo("PENDIENTE_CORRECCION");
            assertThat(resultado.pendienteCorreccion()).isTrue();
        }

        @org.junit.jupiter.api.Test
        @DisplayName("intento de otro usuario lanza AccessDeniedException")
        void otroUsuario_lanzaExcepcion() {
            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));

            assertThatThrownBy(() -> intentoService.finalizar(100L, 99L))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("finalizar intento ya completado es idempotente")
        void intentoYaCompletado_esIdempotente() {
            intentoEnCurso.setEstado("COMPLETADO");
            intentoEnCurso.setPorcentaje(75.0);
            intentoEnCurso.setCorrectas(1);
            intentoEnCurso.setFin(LocalDateTime.now());

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));

            ResultadoResponse resultado = intentoService.finalizar(100L, 1L);

            assertThat(resultado.estado()).isEqualTo("COMPLETADO");
            verify(intentoRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("responder")
    class Responder {

        @org.junit.jupiter.api.Test
        @DisplayName("respuesta en intento no en curso lanza excepción")
        void intentoNoEnCurso_lanzaExcepcion() {
            intentoEnCurso.setEstado("COMPLETADO");
            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));

            RespuestaRequest req = new RespuestaRequest(1L, null, null);

            assertThatThrownBy(() -> intentoService.responder(100L, req, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("COMPLETADO");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("preguntaId nulo lanza excepción")
        void preguntaIdNulo_lanzaExcepcion() {
            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));

            RespuestaRequest req = new RespuestaRequest(null, null, null);

            assertThatThrownBy(() -> intentoService.responder(100L, req, 1L))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("corregir")
    class Corregir {

        @org.junit.jupiter.api.Test
        @DisplayName("creador del test puede corregir y actualiza puntuación")
        void creador_corrrige_actualizaPuntuacion() {
            RespuestaIntento resp = new RespuestaIntento();
            resp.setId(200L);
            resp.setPendienteCorreccion(true);
            resp.setEsCorrecta(false);
            intentoEnCurso.setRespuestas(new ArrayList<>(List.of(resp)));
            intentoEnCurso.setTotalPreguntas(1);

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ResultadoResponse resultado = intentoService.corregir(100L, 1L, new CorreccionRequest(null, Map.of(200L, true), Map.of()));

            assertThat(resultado.correctas()).isEqualTo(1);
            assertThat(resultado.estado()).isEqualTo("COMPLETADO");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("no creador lanza AccessDeniedException")
        void noCreador_lanzaExcepcion() {
            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));

            assertThatThrownBy(() -> intentoService.corregir(100L, 99L, new CorreccionRequest(null, Map.of(), Map.of())))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("anotación se persiste en la respuesta al corregir")
        void anotacion_sePersisteEnRespuesta() {
            RespuestaIntento resp = new RespuestaIntento();
            resp.setId(200L);
            resp.setPendienteCorreccion(true);
            resp.setEsCorrecta(false);
            intentoEnCurso.setRespuestas(new ArrayList<>(List.of(resp)));
            intentoEnCurso.setTotalPreguntas(1);

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            intentoService.corregir(100L, 1L,
                    new CorreccionRequest(null, Map.of(200L, true), Map.of(200L, "Faltó desarrollar más")));

            assertThat(resp.getAnotacion()).isEqualTo("Faltó desarrollar más");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("nota válida (1-10) se persiste en el intento")
        void notaValida_sePersisteEnIntento() {
            RespuestaIntento resp = new RespuestaIntento();
            resp.setId(200L);
            resp.setPendienteCorreccion(true);
            intentoEnCurso.setRespuestas(new ArrayList<>(List.of(resp)));
            intentoEnCurso.setTotalPreguntas(1);

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            intentoService.corregir(100L, 1L, new CorreccionRequest(7, Map.of(200L, true), Map.of()));

            assertThat(intentoEnCurso.getNota()).isEqualTo(7);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("nota fuera de rango (0 o 11) no modifica la nota del intento")
        void notaFueraDeRango_noSeAplica() {
            RespuestaIntento resp = new RespuestaIntento();
            resp.setId(200L);
            resp.setPendienteCorreccion(true);
            intentoEnCurso.setRespuestas(new ArrayList<>(List.of(resp)));
            intentoEnCurso.setTotalPreguntas(1);

            when(intentoRepository.findById(100L)).thenReturn(Optional.of(intentoEnCurso));
            when(intentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            intentoService.corregir(100L, 1L, new CorreccionRequest(0, Map.of(200L, true), Map.of()));

            assertThat(intentoEnCurso.getNota()).isNull();
        }
    }

    private RespuestaIntento respuestaCorrecta() {
        RespuestaIntento r = new RespuestaIntento();
        r.setEsCorrecta(true);
        r.setPendienteCorreccion(false);
        Opcion op = new Opcion();
        op.setEsCorrecta(true);
        r.setOpcionSeleccionada(op);
        return r;
    }

    private RespuestaIntento respuestaIncorrecta() {
        RespuestaIntento r = new RespuestaIntento();
        r.setEsCorrecta(false);
        r.setPendienteCorreccion(false);
        Opcion op = new Opcion();
        op.setEsCorrecta(false);
        r.setOpcionSeleccionada(op);
        return r;
    }
}
