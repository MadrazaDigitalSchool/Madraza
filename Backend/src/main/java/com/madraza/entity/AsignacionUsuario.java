package com.madraza.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "asignacion_usuario", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"asignacion_id", "usuario_id"})
})
public class AsignacionUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asignacion_id")
    private AsignacionTest asignacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(length = 20)
    private String estado = "PENDIENTE"; // PENDIENTE | COMPLETADO

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_id")
    private Intento intento;

    private LocalDateTime fechaCompletado;
}
