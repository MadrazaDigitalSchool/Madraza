package com.madraza.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "asignacion_test")
public class AsignacionTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tipo_recurso", length = 20, nullable = false)
    private String tipoRecurso = "TEST"; // "TEST" | "APUNTE"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "test_id", nullable = true)
    private Test test;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apunte_id", nullable = true)
    private Apunte apunte;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "organizacion_id")
    private Organizacion organizacion;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "asignado_por_id")
    private Usuario asignadoPor;

    // null = asignada a toda la organización; non-null = asignada a un miembro concreto
    @JsonIgnoreProperties({"password", "roles", "activo", "emailVerificado",
                           "createdAt", "proveedorOauth", "avatarUrl", "apellidos", "suscripcionActiva"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_destino_id")
    private Usuario usuarioDestino;

    @CreationTimestamp
    private LocalDateTime fechaAsignacion;

    private LocalDateTime fechaLimite;

    @Column(columnDefinition = "TEXT")
    private String instrucciones;

    private boolean activa = true;

    @OneToMany(mappedBy = "asignacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AsignacionUsuario> seguimientos = new ArrayList<>();
}
