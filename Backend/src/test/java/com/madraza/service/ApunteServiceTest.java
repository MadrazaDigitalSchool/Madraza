package com.madraza.service;

import com.madraza.entity.Apunte;
import com.madraza.entity.Usuario;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.ApunteRepository;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
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
@DisplayName("ApunteService")
class ApunteServiceTest {

    @Mock private ApunteRepository apunteRepo;
    @Mock private UsuarioRepository usuarioRepo;
    @Mock private TestRepository    testRepo;

    @InjectMocks
    private ApunteService apunteService;

    private Usuario propietario;
    private Apunte  apunte;

    @BeforeEach
    void setUp() {
        propietario = new Usuario();
        propietario.setId(1L);
        propietario.setNombre("Carlos");

        apunte = new Apunte();
        apunte.setId(50L);
        apunte.setTitulo("Apunte de álgebra");
        apunte.setUsuario(propietario);
    }

    @Nested
    @DisplayName("crear")
    class Crear {

        @org.junit.jupiter.api.Test
        @DisplayName("crea apunte con título y contenido")
        void creaConTituloYContenido() {
            when(usuarioRepo.findById(1L)).thenReturn(Optional.of(propietario));
            when(apunteRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Apunte resultado = apunteService.crear(1L, "Álgebra", "<p>Contenido</p>", "math", null);

            assertThat(resultado.getTitulo()).isEqualTo("Álgebra");
            assertThat(resultado.getContenido()).isEqualTo("<p>Contenido</p>");
            assertThat(resultado.getUsuario()).isEqualTo(propietario);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("título vacío se reemplaza por 'Sin título'")
        void tituloVacio_reemplazadoPorDefecto() {
            when(usuarioRepo.findById(1L)).thenReturn(Optional.of(propietario));
            when(apunteRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Apunte resultado = apunteService.crear(1L, "   ", null, null, null);

            assertThat(resultado.getTitulo()).isEqualTo("Sin título");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("usuario no encontrado lanza ResourceNotFoundException")
        void usuarioNoEncontrado_lanzaExcepcion() {
            when(usuarioRepo.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> apunteService.crear(99L, "T", null, null, null))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("actualizar")
    class Actualizar {

        @org.junit.jupiter.api.Test
        @DisplayName("propietario puede actualizar su apunte")
        void propietario_actualizaApunte() {
            when(apunteRepo.findById(50L)).thenReturn(Optional.of(apunte));
            when(apunteRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Apunte resultado = apunteService.actualizar(50L, 1L, "Nuevo título", null, null, null);

            assertThat(resultado.getTitulo()).isEqualTo("Nuevo título");
        }

        @org.junit.jupiter.api.Test
        @DisplayName("otro usuario no puede actualizar el apunte")
        void otroUsuario_noPuedeActualizar() {
            when(apunteRepo.findById(50L)).thenReturn(Optional.of(apunte));

            assertThatThrownBy(() -> apunteService.actualizar(50L, 99L, "T", null, null, null))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("eliminar")
    class Eliminar {

        @org.junit.jupiter.api.Test
        @DisplayName("propietario puede eliminar su apunte")
        void propietario_elimina() {
            when(apunteRepo.findById(50L)).thenReturn(Optional.of(apunte));

            assertThatCode(() -> apunteService.eliminar(50L, 1L))
                    .doesNotThrowAnyException();

            verify(apunteRepo).delete(apunte);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("otro usuario no puede eliminar el apunte")
        void otroUsuario_noPuedeEliminar() {
            when(apunteRepo.findById(50L)).thenReturn(Optional.of(apunte));

            assertThatThrownBy(() -> apunteService.eliminar(50L, 99L))
                    .isInstanceOf(AccessDeniedException.class);

            verify(apunteRepo, never()).delete(any());
        }

        @org.junit.jupiter.api.Test
        @DisplayName("apunte no encontrado lanza ResourceNotFoundException")
        void apunteNoEncontrado_lanzaExcepcion() {
            when(apunteRepo.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> apunteService.eliminar(99L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getMisApuntes")
    class GetMisApuntes {

        @org.junit.jupiter.api.Test
        @DisplayName("devuelve lista de apuntes del usuario")
        void devuelveApuntesDelUsuario() {
            when(apunteRepo.findByUsuarioIdOrderByUpdatedAtDesc(1L))
                    .thenReturn(List.of(apunte));

            List<Apunte> resultado = apunteService.getMisApuntes(1L);

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getTitulo()).isEqualTo("Apunte de álgebra");
        }
    }
}
