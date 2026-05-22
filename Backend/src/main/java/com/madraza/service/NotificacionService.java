package com.madraza.service;

import com.madraza.entity.Notificacion;
import com.madraza.entity.Usuario;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.NotificacionRepository;
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
public class NotificacionService {

    @Autowired private NotificacionRepository repo;
    @Autowired private UsuarioRepository usuarioRepo;

    @Transactional
    public void crear(Long usuarioId, String tipo, String titulo, String mensaje, String urlDestino) {
        Usuario usuario = usuarioRepo.findById(usuarioId).orElse(null);
        if (usuario == null) return;
        Notificacion n = new Notificacion();
        n.setUsuario(usuario);
        n.setTipo(tipo);
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setUrlDestino(urlDestino);
        repo.save(n);
    }

    @Transactional(readOnly = true)
    public List<Notificacion> getByUsuario(Long usuarioId) {
        return repo.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId);
    }

    @Transactional(readOnly = true)
    public long countNoLeidas(Long usuarioId) {
        return repo.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional
    public void marcarLeida(Long notifId, Long usuarioId) {
        Notificacion n = repo.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));
        if (!n.getUsuario().getId().equals(usuarioId))
            throw new AccessDeniedException("No tienes permiso para esta notificación");
        n.setLeida(true);
        repo.save(n);
    }

    @Transactional
    public void marcarTodasLeidas(Long usuarioId) {
        repo.marcarTodasLeidas(usuarioId);
    }

    @Transactional
    public void eliminarTodas(Long usuarioId) {
        repo.deleteAllByUsuarioId(usuarioId);
    }
}
