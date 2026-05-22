package com.madraza.entity;

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
@Table(name = "test")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, length = 60)
    private String categoria;

    @Column(nullable = false, length = 15)
    private String dificultad = "MEDIA";

    @Column(name = "tiempo_limite")
    private Integer tiempoLimite;

    @Column(nullable = false, length = 15)
    private String visibilidad = "PUBLICO";

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Serializa solo id y nombre del creador (sin password ni datos sensibles)
    @JsonIgnoreProperties({"password", "roles", "activo", "emailVerificado",
                           "createdAt", "proveedorOauth", "avatarUrl", "apellidos"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creador_id", nullable = false)
    private Usuario creador;

    // Organización propietaria — solo para tests con visibilidad=ORGANIZACION
    // Se excluyen miembros (lazy) y admin (datos sensibles); el front solo necesita id y nombre
    @JsonIgnoreProperties({"miembros", "admin", "tipo", "descripcion", "codigoInvitacion", "activa", "createdAt"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizacion_id")
    private Organizacion organizacion;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pregunta> preguntas = new ArrayList<>();
}
