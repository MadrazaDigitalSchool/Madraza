import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth';
import { TestService } from '../../../core/services/test';
import { IntentoService } from '../../../core/services/intento';
import { Test } from '../../../core/models/test.model';
import { Intento } from '../../../core/models/intento.model';

/**
 * Componente Dashboard
 * Panel personal del usuario con estadísticas, historial y mis tests
 * @author Hafdala Mehdi Sidi
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  usuario: any = null;
  historial: Intento[] = [];
  misTests: Test[] = [];
  cargando = true;

  constructor(
    public authService: AuthService,
    private testService: TestService,
    private intentoService: IntentoService
  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar historial de intentos
    this.intentoService.getHistorial().subscribe({
      next: (historial) => {
        this.historial = historial;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });

    // Cargar mis tests
    this.testService.getMisTests().subscribe({
      next: (tests) => {
        this.misTests = tests;
      },
      error: () => { }
    });
  }

  // Total de intentos
  get totalIntentos(): number {
    return this.historial.length;
  }

  // Media de aciertos
  get mediaAciertos(): number {
    if (!this.historial.length) return 0;
    const suma = this.historial.reduce((acc, i) => acc + (i.porcentaje ?? 0), 0);
    return Math.round(suma / this.historial.length);
  }

  // Mejor puntuación
  get mejorPuntuacion(): number {
    if (!this.historial.length) return 0;
    return Math.max(...this.historial.map(i => i.porcentaje ?? 0));
  }

  getIniciales(): string {
    if (!this.usuario?.nombre) return 'U';
    return this.usuario.nombre.charAt(0).toUpperCase();
  }

  getEstadoClass(porcentaje: number): string {
    if (porcentaje >= 70) return 'estado-exito';
    if (porcentaje >= 50) return 'estado-warning';
    return 'estado-error';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}