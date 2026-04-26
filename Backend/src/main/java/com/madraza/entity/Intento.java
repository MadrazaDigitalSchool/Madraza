package com.madraza.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    // EN_CURSO | COMPLETADO | ABANDONADO
    private String estado = "EN_CURSO";

    private LocalDateTime inicio = LocalDateTime.now();
    private LocalDateTime fin;

    // Un intento pertenece a un usuario y a un test
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    // Si borramos el intento, se borran sus respuestas también
    @OneToMany(mappedBy = "intento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RespuestaIntento> respuestas = new ArrayList<>();
}