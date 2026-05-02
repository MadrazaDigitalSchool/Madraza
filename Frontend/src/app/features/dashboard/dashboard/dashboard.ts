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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  usuario: any = null;
  historial: Intento[] = [];
  misTests: Test[] = [];
  cargando = true;
  eliminandoId: number | null = null;

  constructor(
    public authService: AuthService,
    private testService: TestService,
    private intentoService: IntentoService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    this.intentoService.getHistorial().subscribe({
      next: (historial) => { this.historial = historial; this.cargando = false; },
      error: () => { this.cargando = false; }
    });

    this.testService.getMisTests().subscribe({
      next: (tests) => { this.misTests = tests; },
      error: () => {}
    });
  }

  get totalIntentos(): number { return this.historial.length; }

  get mediaAciertos(): number {
    if (!this.historial.length) return 0;
    return Math.round(this.historial.reduce((a, i) => a + (i.porcentaje ?? 0), 0) / this.historial.length);
  }

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
    return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  eliminarTest(test: Test, evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    if (!confirm(`¿Eliminar el test "${test.titulo}"? Esta acción no se puede deshacer.`)) return;
    this.eliminandoId = test.id;
    this.testService.eliminarTest(test.id).subscribe({
      next: () => {
        this.misTests = this.misTests.filter(t => t.id !== test.id);
        this.eliminandoId = null;
      },
      error: () => { this.eliminandoId = null; }
    });
  }
}
