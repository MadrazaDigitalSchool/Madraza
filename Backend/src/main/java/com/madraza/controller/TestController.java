package com.madraza.controller;

import com.madraza.dto.request.TestRequest;
import com.madraza.entity.Test;
import com.madraza.repository.ApunteRepository;
import com.madraza.repository.AsignacionTestRepository;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.PdfService;
import com.madraza.service.TestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/tests")
public class TestController {

    @Autowired private TestService              testService;
    @Autowired private AsignacionTestRepository asignacionRepo;
    @Autowired private ApunteRepository         apunteRepo;
    @Autowired private PdfService               pdfService;

    @GetMapping
    public ResponseEntity<List<Test>> getTestsPublicos() {
        return ResponseEntity.ok(testService.getTestsPublicos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Test> getTestById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getTestById(id));
    }

    @GetMapping("/mis-tests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Test>> getMisTests(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(testService.getTestsDelUsuario(userDetails.getId()));
    }

    @PostMapping
    public ResponseEntity<Test> crearTest(
            @Valid @RequestBody TestRequest req,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Test test = testService.crearTest(req, userDetails.getId());
        return ResponseEntity.ok(test);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Test> actualizarTest(
            @PathVariable Long id,
            @Valid @RequestBody TestRequest req,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Test test = testService.actualizarTest(id, req, userDetails.getId());
        return ResponseEntity.ok(test);
    }

    @GetMapping("/organizacion/{orgId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Test>> getTestsOrganizacion(
            @PathVariable Long orgId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(testService.getTestsDeOrganizacion(orgId, userDetails.getId()));
    }

    @GetMapping("/{id}/dependencias")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getDependencias(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of(
            "asignaciones",     asignacionRepo.countByTestIdAndActivaTrue(id),
            "apuntesAsociados", apunteRepo.countByTestAsociadoId(id)
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarTest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        testService.eliminarTest(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> exportarPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            byte[] pdf = pdfService.generarTestPdf(id, userDetails.getId());
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"test-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al generar el PDF"));
        }
    }
}