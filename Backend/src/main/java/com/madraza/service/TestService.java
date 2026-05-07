package com.madraza.service;

import com.madraza.dto.request.TestRequest;
import com.madraza.entity.Opcion;
import com.madraza.entity.Pregunta;
import com.madraza.entity.Test;
import com.madraza.entity.Usuario;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
import com.madraza.repository.IntentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Service
public class TestService {

    @Autowired private TestRepository testRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private IntentoRepository intentoRepository;

    public List<Test> getTestsPublicos() {
        return testRepository.findByVisibilidadAndActivoTrue("PUBLICO");
    }

    public List<Test> getTestsDelUsuario(Long usuarioId) {
        return testRepository.findByCreadorId(usuarioId);
    }

    public Test getTestById(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));
    }

    @Transactional
    public Test crearTest(TestRequest req, Long creadorId) {
        Usuario creador = usuarioRepository.findById(creadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!creador.isSuscripcionActiva() ||
                (creador.getSuscripcionExpiry() != null &&
                 creador.getSuscripcionExpiry().isBefore(LocalDateTime.now()))) {
            throw new AccessDeniedException("Se requiere una suscripción activa para crear tests");
        }

        Test test = new Test();
        test.setTitulo(req.titulo());
        test.setDescripcion(req.descripcion());
        test.setCategoria(req.categoria());
        test.setDificultad(req.dificultad() != null ? req.dificultad() : "MEDIA");
        test.setTiempoLimite(req.tiempoLimite());
        test.setVisibilidad(req.visibilidad() != null ? req.visibilidad() : "PUBLICO");
        test.setCreador(creador);

        poblarPreguntas(test, req);
        return testRepository.save(test);
    }

    @Transactional
    public Test actualizarTest(Long id, TestRequest req, Long usuarioId) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));

        if (!test.getCreador().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No tienes permiso para editar este test");
        }

        test.setTitulo(req.titulo());
        test.setDescripcion(req.descripcion());
        test.setCategoria(req.categoria());
        test.setDificultad(req.dificultad() != null ? req.dificultad() : "MEDIA");
        test.setTiempoLimite(req.tiempoLimite());
        test.setVisibilidad(req.visibilidad() != null ? req.visibilidad() : "PUBLICO");

        // Orphan removal elimina preguntas/opciones que se quitan
        test.getPreguntas().clear();
        poblarPreguntas(test, req);

        return testRepository.save(test);
    }

    @Transactional
    public void eliminarTest(Long id, Long usuarioId) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));
        if (!test.getCreador().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No tienes permiso para eliminar este test");
        }
        // Eliminar primero los intentos asociados para evitar error de foreign key
        intentoRepository.deleteByTestId(id);
        testRepository.delete(test);
    }

    // ── Privado ───────────────────────────────────────────────

    private void poblarPreguntas(Test test, TestRequest req) {
        if (req.preguntas() == null) return;
        req.preguntas().forEach(pregReq -> {
            Pregunta pregunta = new Pregunta();
            pregunta.setEnunciado(pregReq.enunciado());
            pregunta.setTipo(pregReq.tipo() != null ? pregReq.tipo() : "OPCION_MULTIPLE");
            pregunta.setOrden(pregReq.orden());
            pregunta.setPuntos(pregReq.puntos());
            pregunta.setExplicacion(pregReq.explicacion());
            pregunta.setTest(test);

            if (pregReq.opciones() != null) {
                pregReq.opciones().forEach(opReq -> {
                    Opcion opcion = new Opcion();
                    opcion.setTexto(opReq.texto());
                    opcion.setEsCorrecta(opReq.esCorrecta());
                    opcion.setOrden(opReq.orden());
                    opcion.setPregunta(pregunta);
                    pregunta.getOpciones().add(opcion);
                });
            }
            test.getPreguntas().add(pregunta);
        });
    }
}
