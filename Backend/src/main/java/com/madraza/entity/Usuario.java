package com.madraza.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * @author Hafdala Mehdi Sidi
 */
@Entity
@Table(name = "usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(length = 255)
    private String password;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "proveedor_oauth", length = 20)
    private String proveedorOauth;

    @Column(name = "email_verificado", nullable = false)
    private boolean emailVerificado = false;

    @JsonIgnore
    @Column(name = "token_verificacion", length = 100)
    private String tokenVerificacion;

    @Column(name = "token_verificacion_expiry")
    private LocalDateTime tokenVerificacionExpiry;

    @JsonIgnore
    @Column(name = "token_recuperacion", length = 100)
    private String tokenRecuperacion;

    @Column(name = "token_recuperacion_expiry")
    private LocalDateTime tokenRecuperacionExpiry;

    @Column(name = "suscripcion_activa", nullable = false)
    private boolean suscripcionActiva = false;

    @Column(name = "suscripcion_expiry")
    private LocalDateTime suscripcionExpiry;

    @Column(name = "stripe_customer_id", length = 100)
    private String stripeCustomerId;

    @Column(name = "plan_tipo", length = 20)
    private String planTipo;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "usuario_rol",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    private Set<Rol> roles = new HashSet<>();
}
