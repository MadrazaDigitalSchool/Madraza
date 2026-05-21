package com.madraza.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "organizacion")
public class Organizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String nombre;

    @Column(length = 30)
    private String tipo; // EMPRESA | CENTRO_EDUCATIVO

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Código único para invitar miembros mediante enlace
    @Column(length = 36, unique = true)
    private String codigoInvitacion;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "admin_id")
    private Usuario admin;

    private boolean activa = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "organizacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MiembroOrganizacion> miembros = new ArrayList<>();
}
