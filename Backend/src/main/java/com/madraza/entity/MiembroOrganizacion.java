package com.madraza.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "miembro_organizacion", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"usuario_id", "organizacion_id"})
})
public class MiembroOrganizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "organizacion_id")
    private Organizacion organizacion;

    @Column(length = 20)
    private String rol; // ADMIN | MIEMBRO

    @CreationTimestamp
    private LocalDateTime fechaUnion;
}
