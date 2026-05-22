package com.madraza.controller;

import com.madraza.entity.AsignacionUsuario;
import com.madraza.exception.ResourceNotFoundException;
import com.madraza.repository.AsignacionUsuarioRepository;
import com.madraza.repository.IntentoRepository;
import com.madraza.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/asignaciones")
public class AsignacionController {

    @Autowired private AsignacionUsuarioRepository asignacionUsuarioRepo;
    @Autowired private IntentoRepository intentoRepo;

    @GetMapping("/mis-asignaciones")
    public ResponseEntity<List<Map<String, Object>>> getMisAsignaciones(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(
            asignacionUsuarioRepo.findByUsuarioIdOrderByAsignacionFechaAsignacionDesc(userDetails.getId())
                    .stream().map(this::buildMap).toList()
        );
    }

    @PutMapping("/{id}/completar")
    @Transactional
    public ResponseEntity<?> completar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        AsignacionUsuario au = asignacionUsuarioRepo.findByAsignacionIdAndUsuarioId(id, userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Asignación no encontrada"));

        Object intentoIdObj = body.get("intentoId");
        if (intentoIdObj != null) {
            Long intentoId = Long.parseLong(intentoIdObj.toString());
            intentoRepo.findById(intentoId).ifPresent(au::setIntento);
        }

        au.setEstado("COMPLETADO");
        au.setFechaCompletado(LocalDateTime.now());
        asignacionUsuarioRepo.save(au);
        return ResponseEntity.ok(buildMap(au));
    }

    private Map<String, Object> buildMap(AsignacionUsuario au) {
        var asig  = au.getAsignacion();
        String tipo = asig.getTipoRecurso() != null ? asig.getTipoRecurso() : "TEST";
        boolean esApunte = "APUNTE".equals(tipo);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            au.getId());
        m.put("asignacionId",  asig.getId());
        m.put("tipoRecurso",   tipo);
        m.put("testId",        !esApunte && asig.getTest()   != null ? asig.getTest().getId()      : null);
        m.put("testTitulo",    !esApunte && asig.getTest()   != null ? asig.getTest().getTitulo()  : null);
        m.put("apunteId",       esApunte && asig.getApunte() != null ? asig.getApunte().getId()    : null);
        m.put("apunteTitulo",   esApunte && asig.getApunte() != null ? asig.getApunte().getTitulo(): null);
        m.put("orgNombre",     asig.getOrganizacion().getNombre());
        m.put("asignadoPor",   asig.getAsignadoPor().getNombre());
        m.put("instrucciones", asig.getInstrucciones());
        m.put("fechaLimite",   asig.getFechaLimite() != null ? asig.getFechaLimite().toString() : null);
        m.put("estado",        au.getEstado());
        m.put("fechaCompletado", au.getFechaCompletado() != null ? au.getFechaCompletado().toString() : null);
        return m;
    }
}
