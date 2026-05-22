package com.madraza.service;

import com.madraza.dto.request.RespuestaRequest;
import com.madraza.dto.response.ResultadoResponse;
import com.madraza.entity.*;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    @Autowired private RespuestaIntentoRepository respuestaRepo;

    private static final int LIMITE_INTENTOS_FREE = 10;

    @Transactional
    public Intento iniciarIntento(Long testId, Long usuarioId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!usuario.isSuscripcionActiva()) {
            LocalDateTime inicioMes = LocalDateTime.now()
                    .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            long intentosMes = intentoRepository.countByUsuarioIdAndInicioAfter(usuarioId, inicioMes);
            if (intentosMes >= LIMITE_INTENTOS_FREE) {
                throw new IllegalArgumentException(
                        "Has alcanzado el límite de " + LIMITE_INTENTOS_FREE +
                        " exámenes mensuales del plan gratuito. Hazte Premium para continuar.");
            }
        }

        Intento intento = new Intento();
        intento.setTest(test);
        intento.setUsuario(usuario);
        intento.setTotalPreguntas(test.getPreguntas().size());
        intento.setEstado("EN_CURSO");
        intento.setInicio(LocalDateTime.now());
        return intentoRepository.save(intento);
    }

    @Transactional
    public void responder(Long intentoId, RespuestaRequest req, Long usuarioId) {
        Intento intento = intentoRepository.findById(intentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));

        if (!intento.getUsuario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No tienes permiso para responder este intento");
        }

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

        if (req.opcionId() != null) {
            Opcion opcion = opcionRepository.findById(req.opcionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opción no encontrada"));
            respuesta.setOpcionSeleccionada(opcion);
            respuesta.setEsCorrecta(opcion.isEsCorrecta());
        } else if ("TEXTO_LIBRE".equals(pregunta.getTipo())) {
            // Queda pendiente de corrección manual por el creador del test
            respuesta.setPendienteCorreccion(true);
        }

        intento.getRespuestas().add(respuesta);
        intentoRepository.save(intento);
    }

    /**
     * Finaliza el intento y calcula puntuación.
     * Es idempotente: si ya está COMPLETADO devuelve el resultado guardado.
     */
    @Transactional
    public ResultadoResponse finalizar(Long intentoId, Long usuarioId) {
        Intento intento = intentoRepository.findById(intentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));

        if (!intento.getUsuario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No tienes permiso para finalizar este intento");
        }

        if ("COMPLETADO".equals(intento.getEstado()) || "PENDIENTE_CORRECCION".equals(intento.getEstado())) {
            return buildResultado(intento);
        }

        boolean tienePendientes = intento.getRespuestas().stream()
                .anyMatch(RespuestaIntento::isPendienteCorreccion);

        // Solo se cuentan respuestas ya corregidas (no las pendientes de texto libre)
        long correctas = intento.getRespuestas().stream()
                .filter(r -> !r.isPendienteCorreccion() && r.isEsCorrecta())
                .count();

        long incorrectas = intento.getRespuestas().stream()
                .filter(r -> !r.isPendienteCorreccion() && r.getOpcionSeleccionada() != null && !r.isEsCorrecta())
                .count();

        double porcentaje = intento.getTotalPreguntas() > 0
                ? (double) correctas / intento.getTotalPreguntas() * 100
                : 0.0;

        intento.setCorrectas((int) correctas);
        intento.setIncorrectas((int) incorrectas);
        intento.setPuntuacion((int) correctas * 10);
        intento.setPorcentaje(porcentaje);
        intento.setPendienteCorreccion(tienePendientes);
        intento.setEstado(tienePendientes ? "PENDIENTE_CORRECCION" : "COMPLETADO");
        intento.setFin(LocalDateTime.now());
        intento.setTiempoEmpleado(
            java.time.Duration.between(intento.getInicio(), intento.getFin()).getSeconds()
        );
        intentoRepository.save(intento);

        return buildResultado(intento);
    }

    @Transactional(readOnly = true)
    public List<Intento> getHistorial(Long usuarioId) {
        return intentoRepository.findByUsuarioIdOrderByInicioDesc(usuarioId);
    }

    /**
     * Devuelve el desglose de respuestas de un intento para que el alumno
     * vea sus respuestas y, si ya está corregido, si eran correctas.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDetalle(Long intentoId, Long alumnoId) {
        Intento intento = intentoRepository.findById(intentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));
        if (!intento.getUsuario().getId().equals(alumnoId)) {
            throw new AccessDeniedException("No tienes permiso para ver este intento");
        }

        return intento.getRespuestas().stream().map(r -> {
            Pregunta p = r.getPregunta();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("preguntaId",           p.getId());
            m.put("enunciado",            p.getEnunciado());
            m.put("tipo",                 p.getTipo());
            m.put("puntos",               p.getPuntos());
            m.put("explicacion",          p.getExplicacion());
            m.put("textoLibre",           r.getTextoLibre());
            m.put("esCorrecta",           r.isEsCorrecta());
            m.put("pendienteCorreccion",  r.isPendienteCorreccion());
            m.put("opcionSeleccionadaId", r.getOpcionSeleccionada() != null ? r.getOpcionSeleccionada().getId() : null);
            // Solo mostramos opciones con su bandera esCorrecta si el intento ya está completado
            boolean mostrarCorrectas = "COMPLETADO".equals(intento.getEstado());
            List<Map<String, Object>> opciones = p.getOpciones().stream().map(o -> {
                Map<String, Object> om = new LinkedHashMap<>();
                om.put("id",         o.getId());
                om.put("texto",      o.getTexto());
                om.put("esCorrecta", mostrarCorrectas ? o.isEsCorrecta() : null);
                om.put("orden",      o.getOrden());
                return om;
            }).toList();
            m.put("opciones", opciones);
            return m;
        }).toList();
    }

    /** Tests del creador que tienen intentos pendientes de corrección de texto libre. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMisPendientesCorreccion(Long creadorId) {
        return intentoRepository.findByTestCreadorIdAndPendienteCorreccionTrue(creadorId)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    i -> i.getTest().getId(),
                    java.util.LinkedHashMap::new,
                    java.util.stream.Collectors.toList()
                ))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("testId",    e.getKey());
                    m.put("testTitulo", e.getValue().get(0).getTest().getTitulo());
                    m.put("pendientes", e.getValue().size());
                    return m;
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getParaCorregir(Long testId, Long correctorId) {
        com.madraza.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test no encontrado"));
        if (!test.getCreador().getId().equals(correctorId)) {
            throw new AccessDeniedException("Solo el creador del test puede corregir sus respuestas");
        }

        return intentoRepository.findByTestIdAndPendienteCorreccionTrueOrderByInicioDesc(testId).stream()
                .map(intento -> {
                    List<Map<String, Object>> pendientes = respuestaRepo
                            .findByIntentoIdAndPendienteCorreccionTrue(intento.getId())
                            .stream().map(r -> {
                                Map<String, Object> m = new LinkedHashMap<>();
                                m.put("respuestaId",  r.getId());
                                m.put("enunciado",    r.getPregunta().getEnunciado());
                                m.put("explicacion",  r.getPregunta().getExplicacion());
                                m.put("textoLibre",   r.getTextoLibre());
                                m.put("puntos",       r.getPregunta().getPuntos());
                                return m;
                            }).toList();

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("intentoId", intento.getId());
                    m.put("inicio",    intento.getInicio().toString());
                    m.put("respuestasPendientes", pendientes);
                    return m;
                }).toList();
    }

    @Transactional
    public ResultadoResponse corregir(Long intentoId, Long correctorId, Map<Long, Boolean> correcciones) {
        Intento intento = intentoRepository.findById(intentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));

        if (!intento.getTest().getCreador().getId().equals(correctorId)) {
            throw new AccessDeniedException("Solo el creador del test puede corregir este intento");
        }

        for (RespuestaIntento respuesta : intento.getRespuestas()) {
            if (respuesta.isPendienteCorreccion() && correcciones.containsKey(respuesta.getId())) {
                respuesta.setEsCorrecta(correcciones.get(respuesta.getId()));
                respuesta.setPendienteCorreccion(false);
            }
        }

        long correctas = intento.getRespuestas().stream()
                .filter(r -> !r.isPendienteCorreccion() && r.isEsCorrecta())
                .count();
        long incorrectas = intento.getRespuestas().stream()
                .filter(r -> !r.isPendienteCorreccion() && !r.isEsCorrecta()
                             && (r.getOpcionSeleccionada() != null
                                 || (r.getTextoLibre() != null && !r.getTextoLibre().isBlank())))
                .count();
        double porcentaje = intento.getTotalPreguntas() > 0
                ? (double) correctas / intento.getTotalPreguntas() * 100 : 0.0;

        intento.setCorrectas((int) correctas);
        intento.setIncorrectas((int) incorrectas);
        intento.setPuntuacion((int) correctas * 10);
        intento.setPorcentaje(porcentaje);
        intento.setPendienteCorreccion(false);
        intento.setEstado("COMPLETADO");
        intentoRepository.save(intento);

        return buildResultado(intento);
    }

    private ResultadoResponse buildResultado(Intento intento) {
        long tiempo = intento.getTiempoEmpleado();
        if (tiempo == 0 && intento.getInicio() != null) {
            tiempo = java.time.Duration.between(
                intento.getInicio(),
                intento.getFin() != null ? intento.getFin() : LocalDateTime.now()
            ).getSeconds();
        }
        return new ResultadoResponse(
                intento.getId(),
                intento.getPuntuacion(),
                intento.getTotalPreguntas(),
                intento.getCorrectas(),
                intento.getIncorrectas(),
                intento.getPorcentaje(),
                intento.getEstado(),
                tiempo,
                intento.isPendienteCorreccion()
        );
    }
}
