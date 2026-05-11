package com.madraza.service;

import com.madraza.entity.CompartirTest;
import com.madraza.entity.Test;
import com.madraza.entity.Usuario;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.CompartirRepository;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CompartirService {

    @Autowired private CompartirRepository compartirRepository;
    @Autowired private TestRepository testRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @Transactional
    public CompartirTest compartir(Long testId, Long remitenteId, String emailDestinatario, String mensaje) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurso no encontrado"));

        if (!test.getCreador().getId().equals(remitenteId)) {
            throw new AccessDeniedException("Solo puedes compartir recursos que hayas creado tú");
        }

        Usuario destinatario = usuarioRepository.findByEmail(emailDestinatario)
                .orElseThrow(() -> new ResourceNotFoundException("No existe ningún usuario con ese email"));

        if (destinatario.getId().equals(remitenteId)) {
            throw new IllegalArgumentException("No puedes compartir un recurso contigo mismo");
        }

        if (compartirRepository.existsByRemitenteIdAndDestinatarioIdAndTestId(remitenteId, destinatario.getId(), testId)) {
            throw new IllegalArgumentException("Ya has compartido este recurso con ese usuario");
        }

        Usuario remitente = usuarioRepository.findById(remitenteId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        CompartirTest compartir = new CompartirTest();
        compartir.setTest(test);
        compartir.setRemitente(remitente);
        compartir.setDestinatario(destinatario);
        compartir.setMensaje(mensaje);
        return compartirRepository.save(compartir);
    }

    public List<CompartirTest> getRecibidos(Long usuarioId) {
        return compartirRepository.findByDestinatarioIdOrderByFechaCompartidoDesc(usuarioId);
    }

    public List<CompartirTest> getEnviados(Long usuarioId) {
        return compartirRepository.findByRemitenteIdOrderByFechaCompartidoDesc(usuarioId);
    }

    @Transactional
    public void marcarVisto(Long compartirId, Long usuarioId) {
        CompartirTest c = compartirRepository.findById(compartirId)
                .orElseThrow(() -> new ResourceNotFoundException("Compartición no encontrada"));
        if (!c.getDestinatario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No tienes permiso");
        }
        c.setVisto(true);
        compartirRepository.save(c);
    }

    @Transactional
    public void eliminar(Long compartirId, Long usuarioId) {
        CompartirTest c = compartirRepository.findById(compartirId)
                .orElseThrow(() -> new ResourceNotFoundException("Compartición no encontrada"));
        if (!c.getRemitente().getId().equals(usuarioId) && !c.getDestinatario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No tienes permiso");
        }
        compartirRepository.delete(c);
    }

    public long contarNoVistos(Long usuarioId) {
        return compartirRepository.countByDestinatarioIdAndVistoFalse(usuarioId);
    }
}
