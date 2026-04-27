package com.madraza.service;

import com.madraza.dto.request.RespuestaRequest;
import com.madraza.dto.response.ResultadoResponse;
import com.madraza.entity.*;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Service
public class IntentoService {

    @Autowired private IntentoRepository intentoRepository;
    @Autowired private TestRepository testRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PreguntaRepository preguntaRepository;
    @Autowired private OpcionRepository opcionRepository;

    // Inicia un nuevo intento cuando el usuario pulsa "Comenzar examen"
    @Transactional
    public Intento iniciarIntento(Long testId, Long usuarioId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Intento intento = new Intento();
        intento.setTest(test);
        intento.setUsuario(usuario);
        intento.setTotalPreguntas(test.getPreguntas().size());
        intento.setEstado("EN_CURSO");
        intento.setInicio(LocalDateTime.now());

        return intentoRepository.save(intento);
    }

    // Registra la respuesta del usuario a una pregunta
    @Transactional
    public void responder(Long intentoId, RespuestaRequest req) {
        Intento intento = intentoRepository.findById(intentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));

        if (!"EN_CURSO".equals(intento.getEstado())) {
            throw new IllegalArgumentException("El intento ya está " + intento.getEstado());
        }

        if (req.preguntaId() == null) {
            throw new IllegalArgumentException("El id de la pregunta es obligatorio");
        }

        Pregunta pregunta = preguntaRepository.findById(req.preguntaId())
                .orElseThrow(() -> new ResourceNotFoundException("Pregunta no encontrada"));

        RespuestaIntento respuesta = new RespuestaIntento();
        respuesta.setIntento(intento);
        respuesta.setPregunta(pregunta);
        respuesta.setTextoLibre(req.textoLibre());

        // Si hay opción seleccionada comprobamos si es correcta
        if (req.opcionId() != null) {
            Opcion opcion = opcionRepository.findById(req.opcionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opción no encontrada"));
            respuesta.setOpcionSeleccionada(opcion);
            respuesta.setEsCorrecta(opcion.isEsCorrecta());
        }

        intento.getRespuestas().add(respuesta);
        intentoRepository.save(intento);
    }

    // Finaliza el intento y calcula la puntuación total
    @Transactional
    public ResultadoResponse finalizar(Long intentoId) {
        Intento intento = intentoRepository.findById(intentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));

        if (!"EN_CURSO".equals(intento.getEstado())) {
            throw new IllegalArgumentException("El intento ya está " + intento.getEstado());
        }

        // Contamos cuántas respuestas de opción múltiple fueron correctas
        long correctas = intento.getRespuestas().stream()
                .filter(RespuestaIntento::isEsCorrecta)
                .count();

        // Incorrectas: respuestas de opción múltiple que no fueron correctas
        // (el texto libre no se contabiliza como incorrecto automáticamente)
        long incorrectas = intento.getRespuestas().stream()
                .filter(r -> r.getOpcionSeleccionada() != null && !r.isEsCorrecta())
                .count();

        // Calculamos la puntuación
        int puntuacion = (int) correctas * 10;

        // Actualizamos el intento
        intento.setCorrectas((int) correctas);
        intento.setIncorrectas((int) incorrectas);
        intento.setPuntuacion(puntuacion);
        intento.setEstado("COMPLETADO");
        intento.setFin(LocalDateTime.now());

        intentoRepository.save(intento);

        double porcentaje = intento.getTotalPreguntas() > 0
                ? (double) correctas / intento.getTotalPreguntas() * 100
                : 0.0;

        return new ResultadoResponse(
                intento.getId(),
                puntuacion,
                intento.getTotalPreguntas(),
                (int) correctas,
                (int) incorrectas,
                porcentaje,
                "COMPLETADO"
        );
    }

    // Historial de intentos del usuario
    public List<Intento> getHistorial(Long usuarioId) {
        return intentoRepository.findByUsuarioIdOrderByInicioDesc(usuarioId);
    }
}