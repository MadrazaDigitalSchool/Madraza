package com.madraza.controller;

import com.madraza.dto.request.TestRequest;
import com.madraza.entity.Test;
import com.madraza.security.services.UserDetailsImpl;
import com.madraza.service.TestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@RestController
@RequestMapping("/api/tests")
public class TestController {

    @Autowired private TestService testService;

    // GET /api/tests — público, cualquiera puede ver los tests
    @GetMapping
    public ResponseEntity<List<Test>> getTestsPublicos() {
        return ResponseEntity.ok(testService.getTestsPublicos());
    }

    // GET /api/tests/{id} — público
    @GetMapping("/{id}")
    public ResponseEntity<Test> getTestById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getTestById(id));
    }

    // GET /api/tests/mis-tests — solo el usuario autenticado ve los suyos
    @GetMapping("/mis-tests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Test>> getMisTests(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(testService.getTestsDelUsuario(userDetails.getId()));
    }

    // POST /api/tests — solo usuarios autenticados pueden crear tests
    @PostMapping
    public ResponseEntity<Test> crearTest(
            @Valid @RequestBody TestRequest req,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Test test = testService.crearTest(req, userDetails.getId());
        return ResponseEntity.ok(test);
    }

    // PUT /api/tests/{id} — solo el creador puede actualizar su test
    @PutMapping("/{id}")
    public ResponseEntity<Test> actualizarTest(
            @PathVariable Long id,
            @Valid @RequestBody TestRequest req,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Test test = testService.actualizarTest(id, req, userDetails.getId());
        return ResponseEntity.ok(test);
    }

    // DELETE /api/tests/{id} — solo el creador puede eliminarlo
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarTest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        testService.eliminarTest(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}