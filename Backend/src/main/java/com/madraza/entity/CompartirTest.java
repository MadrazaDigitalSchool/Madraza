package com.madraza.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "compartir_test", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"test_id", "remitente_id", "destinatario_id"})
})
public class CompartirTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_id")
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "remitente_id")
    private Usuario remitente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinatario_id")
    private Usuario destinatario;

    @Column(length = 500)
    private String mensaje;

    private boolean visto = false;

    @CreationTimestamp
    private LocalDateTime fechaCompartido;
}
