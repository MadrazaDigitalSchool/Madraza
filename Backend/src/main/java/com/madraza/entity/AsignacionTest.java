package com.madraza.entity;

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

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "test_id")
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organizacion_id")
    private Organizacion organizacion;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "asignado_por_id")
    private Usuario asignadoPor;

    @CreationTimestamp
    private LocalDateTime fechaAsignacion;

    private LocalDateTime fechaLimite;

    @Column(columnDefinition = "TEXT")
    private String instrucciones;

    private boolean activa = true;

    @OneToMany(mappedBy = "asignacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AsignacionUsuario> seguimientos = new ArrayList<>();
}
