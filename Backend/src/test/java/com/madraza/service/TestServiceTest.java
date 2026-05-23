package com.madraza.service;

import com.madraza.dto.request.TestRequest;
import com.madraza.entity.Test;
import com.madraza.entity.Usuario;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TestService")
class TestServiceTest {

    @Mock private TestRepository           testRepository;
    @Mock private UsuarioRepository        usuarioRepository;
    @Mock private IntentoRepository        intentoRepository;
    @Mock private AsignacionTestRepository asignacionTestRepository;
    @Mock private CompartirRepository      compartirRepository;
    @Mock private OrganizacionRepository   organizacionRepository;
    @Mock private MiembroOrganizacionRepository miembroRepository;

    @InjectMocks
    private TestService testService;

    private Usuario usuarioFree;
    private Usuario usuarioPremium;
    private Test    testExistente;

    @BeforeEach
    void setUp() {
        usuarioFree = new Usuario();
        usuarioFree.setId(1L);
        usuarioFree.setNombre("Ana");
        usuarioFree.setEmail("ana@test.com");
        usuarioFree.setSuscripcionActiva(false);

        usuarioPremium = new Usuario();
        usuarioPremium.setId(2L);
        usuarioPremium.setNombre("Luis");
        usuarioPremium.setEmail("luis@test.com");
        usuarioPremium.setSuscripcionActiva(true);

        testExistente = new Test();
        testExistente.setId(10L);
        testExistente.setTitulo("Test de prueba");
        testExistente.setCategoria("Matemáticas");
        testExistente.setCreador(usuarioFree);
    }

    @Nested
    @DisplayName("crearTest")
    class CrearTest {

        private TestRequest requestBasico() {
            return new TestRequest("Nuevo test", "desc", "Ciencias", "MEDIA",
                    null, "PUBLICO", null, List.of());
        }

        @org.junit.jupiter.api.Test
        @DisplayName("usuario premium puede crear test sin límite")
        void usuarioPremium_sinLimite() {
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuarioPremium));
            when(testRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Test resultado = testService.crearTest(requestBasico(), 2L);

            assertThat(resultado.getTitulo()).isEqualTo("Nuevo test");
            verify(testRepository, never()).countByCreadorId(anyLong());
        }

        @org.junit.jupiter.api.Test
        @DisplayName("usuario free bajo el límite puede crear test")
        void usuarioFree_bajoLimite_creaTest() {
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioFree));
            when(testRepository.countByCreadorId(1L)).thenReturn(1L);
            when(testRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Test resultado = testService.crearTest(requestBasico(), 1L);

            assertThat(resultado).isNotNull();
        }

        @org.junit.jupiter.api.Test
        @DisplayName("usuario free en el límite lanza excepción")
        void usuarioFree_enLimite_lanzaExcepcion() {
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioFree));
            when(testRepository.countByCreadorId(1L)).thenReturn(3L);

            assertThatThrownBy(() -> testService.crearTest(requestBasico(), 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("límite");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("usuario no encontrado lanza ResourceNotFoundException")
        void usuarioNoEncontrado_lanzaExcepcion() {
            when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> testService.crearTest(requestBasico(), 99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getTestById")
    class GetTestById {

        @org.junit.jupiter.api.Test
        @DisplayName("test existente se devuelve correctamente")
        void testExistente_seDevuelve() {
            when(testRepository.findByIdConPreguntas(10L)).thenReturn(Optional.of(testExistente));

            Test resultado = testService.getTestById(10L);

            assertThat(resultado.getId()).isEqualTo(10L);
            assertThat(resultado.getTitulo()).isEqualTo("Test de prueba");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("test no encontrado lanza ResourceNotFoundException")
        void testNoEncontrado_lanzaExcepcion() {
            when(testRepository.findByIdConPreguntas(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> testService.getTestById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Test no encontrado");
        }
    }

    @Nested
    @DisplayName("eliminarTest")
    class EliminarTest {

        @org.junit.jupiter.api.Test
        @DisplayName("creador puede eliminar su test")
        void creador_eliminaTest() {
            when(testRepository.findById(10L)).thenReturn(Optional.of(testExistente));

            assertThatCode(() -> testService.eliminarTest(10L, 1L))
                    .doesNotThrowAnyException();

            verify(testRepository).delete(testExistente);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("usuario diferente no puede eliminar el test")
        void otroUsuario_noPuedeEliminar() {
            when(testRepository.findById(10L)).thenReturn(Optional.of(testExistente));

            assertThatThrownBy(() -> testService.eliminarTest(10L, 99L))
                    .isInstanceOf(AccessDeniedException.class);

            verify(testRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("actualizarTest")
    class ActualizarTest {

        @org.junit.jupiter.api.Test
        @DisplayName("usuario que no es creador no puede actualizar")
        void noCreador_noPuedeActualizar() {
            when(testRepository.findById(10L)).thenReturn(Optional.of(testExistente));

            TestRequest req = new TestRequest("Nuevo", null, "Cat", "MEDIA",
                    null, "PUBLICO", null, List.of());

            assertThatThrownBy(() -> testService.actualizarTest(10L, req, 99L))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }
}
