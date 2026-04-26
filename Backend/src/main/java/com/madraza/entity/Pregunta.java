package com.madraza.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Entity
@Table(name = "pregunta")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String enunciado;

    @Column(nullable = false, length = 20)
    private String tipo = "OPCION_MULTIPLE";

    @Column(nullable = false)
    private int orden = 1;

    @Column(nullable = false)
    private int puntos = 1;

    @Column(columnDefinition = "TEXT")
    private String explicacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @OneToMany(mappedBy = "pregunta", cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<Opcion> opciones = new ArrayList<>();
}