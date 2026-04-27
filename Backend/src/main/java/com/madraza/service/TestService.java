package com.madraza.service;

import com.madraza.dto.request.TestRequest;
import com.madraza.entity.Opcion;
import com.madraza.entity.Pregunta;
import com.madraza.entity.Test;
import com.madraza.entity.Usuario;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Service
public class TestService {

    @Autowired private TestRepository testRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    // Devuelve todos los tests públicos
    public List<Test> getTestsPublicos() {
        return testRepository.findByVisibilidadAndActivoTrue("PUBLICO");
    }

    // Devuelve los tests creados por un usuario concreto
    public List<Test> getTestsDelUsuario(Long usuarioId) {
        return testRepository.findByCreadorId(usuarioId);
    }

    // Busca un test por su id
    public Test getTestById(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));
    }

    // Crea un test completo con sus preguntas y opciones
    @Transactional
    public Test crearTest(TestRequest req, Long creadorId) {
        Usuario creador = usuarioRepository.findById(creadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // Creamos el test
        Test test = new Test();
        test.setTitulo(req.titulo());
        test.setDescripcion(req.descripcion());
        test.setCategoria(req.categoria());
        test.setDificultad(req.dificultad() != null ? req.dificultad() : "MEDIA");
        test.setTiempoLimite(req.tiempoLimite());
        test.setVisibilidad(req.visibilidad() != null ? req.visibilidad() : "PUBLICO");
        test.setCreador(creador);

        // Añadimos las preguntas y sus opciones
        if (req.preguntas() != null) {
            req.preguntas().forEach(pregReq -> {
                Pregunta pregunta = new Pregunta();
                pregunta.setEnunciado(pregReq.enunciado());
                pregunta.setTipo(pregReq.tipo() != null ? pregReq.tipo() : "OPCION_MULTIPLE");
                pregunta.setOrden(pregReq.orden());
                pregunta.setPuntos(pregReq.puntos());
                pregunta.setExplicacion(pregReq.explicacion());
                pregunta.setTest(test);

                // Añadimos las opciones de cada pregunta
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

        return testRepository.save(test);
    }

    // Elimina un test solo si pertenece al usuario que lo solicita
    @Transactional
    public void eliminarTest(Long id, Long usuarioId) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));
        if (!test.getCreador().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No puedes eliminar un test que no es tuyo");
        }
        testRepository.delete(test);
    }
}