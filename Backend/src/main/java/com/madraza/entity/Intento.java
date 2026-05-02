package com.madraza.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Entity
@Table(name = "intento")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Intento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int puntuacion = 0;
    private int totalPreguntas = 0;
    private int correctas = 0;
    private int incorrectas = 0;
    private double porcentaje = 0.0;

    // EN_CURSO | COMPLETADO | ABANDONADO
    private String estado = "EN_CURSO";

    private LocalDateTime inicio = LocalDateTime.now();
    private LocalDateTime fin;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Solo serializa id, titulo, categoria, visibilidad (historial ligero)
    @JsonIgnoreProperties({"preguntas", "descripcion", "tiempoLimite", "activo", "createdAt", "creador"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    // Las respuestas no se envían en el historial
    @JsonIgnore
    @OneToMany(mappedBy = "intento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RespuestaIntento> respuestas = new ArrayList<>();
}
