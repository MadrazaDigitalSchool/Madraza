package com.madraza.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * @author Hafdala Mehdi Sidi
 */
@Entity
@Table(name = "respuesta_intento")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RespuestaIntento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean esCorrecta = false;
    private int tiempoRespuesta = 0;
    private boolean pendienteCorreccion = false;

    private String textoLibre;

    @Column(length = 1000)
    private String anotacion;

    // A qué intento, pregunta y opción pertenece esta respuesta
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_id", nullable = false)
    private Intento intento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pregunta_id", nullable = false)
    private Pregunta pregunta;

    // Nullable porque en texto libre no hay opción que elegir
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opcion_id")
    private Opcion opcionSeleccionada;
}