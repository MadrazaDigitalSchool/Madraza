package com.madraza.service;

import com.madraza.entity.Apunte;
import com.madraza.entity.Usuario;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.ApunteRepository;
import com.madraza.repository.TestRepository;
import com.madraza.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ApunteService {

    @Autowired private ApunteRepository apunteRepo;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private TestRepository testRepo;

    @Transactional(readOnly = true)
    public List<Apunte> getMisApuntes(Long usuarioId) {
        return apunteRepo.findByUsuarioIdOrderByUpdatedAtDesc(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<Apunte> getApuntesPorTest(Long testId, Long usuarioId) {
        return apunteRepo.findByUsuarioIdAndTestAsociadoId(usuarioId, testId);
    }

    @Transactional
    public Apunte crear(Long usuarioId, String titulo, String contenido, String tags, Long testId) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Apunte apunte = new Apunte();
        apunte.setUsuario(usuario);
        apunte.setTitulo(titulo != null && !titulo.isBlank() ? titulo.trim() : "Sin título");
        apunte.setContenido(contenido);
        apunte.setTags(tags);

        if (testId != null) {
            testRepo.findById(testId).ifPresent(apunte::setTestAsociado);
        }

        return apunteRepo.save(apunte);
    }

    @Transactional
    public Apunte actualizar(Long apunteId, Long usuarioId, String titulo, String contenido, String tags, Long testId) {
        Apunte apunte = apunteRepo.findById(apunteId)
                .orElseThrow(() -> new ResourceNotFoundException("Apunte no encontrado"));

        if (!apunte.getUsuario().getId().equals(usuarioId))
            throw new AccessDeniedException("No tienes permiso para editar este apunte");

        if (titulo != null && !titulo.isBlank()) apunte.setTitulo(titulo.trim());
        if (contenido != null) apunte.setContenido(contenido);
        if (tags != null) apunte.setTags(tags);

        if (testId != null) {
            testRepo.findById(testId).ifPresent(apunte::setTestAsociado);
        } else if (apunte.getTestAsociado() != null) {
            // si mandaron testId=null y tenía uno asociado, lo quitamos
            apunte.setTestAsociado(null);
        }

        return apunteRepo.save(apunte);
    }

    @Transactional
    public void eliminar(Long apunteId, Long usuarioId) {
        Apunte apunte = apunteRepo.findById(apunteId)
                .orElseThrow(() -> new ResourceNotFoundException("Apunte no encontrado"));
        if (!apunte.getUsuario().getId().equals(usuarioId))
            throw new AccessDeniedException("No tienes permiso para eliminar este apunte");
        apunteRepo.delete(apunte);
    }
}
