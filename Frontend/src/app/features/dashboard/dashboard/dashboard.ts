import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';
import { TestService } from '../../../core/services/test';
import { IntentoService } from '../../../core/services/intento';
import { Test } from '../../../core/models/test.model';
import { Intento } from '../../../core/models/intento.model';
import { Usuario } from '../../../core/models/usuario.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  private router = inject(Router);
  public authService = inject(AuthService);
  private testService = inject(TestService);
  private intentoService = inject(IntentoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  usuario: Usuario | null = null;
  historial: Intento[] = [];
  misTests: Test[] = [];
  cargando = true;
  eliminandoId: number | null = null;
  error = '';

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    this.intentoService.getHistorial().subscribe({
      next: (historial) => { this.historial = historial; this.cargando = false; },
      error: () => { this.error = 'Error al cargar el historial'; this.cargando = false; }
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
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        titulo: 'Eliminar test',
        mensaje: `¿Seguro que quieres eliminar "${test.titulo}"? Esta acción no se puede deshacer.`,
        labelConfirmar: 'Eliminar',
        labelCancelar: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.eliminandoId = test.id;
      this.testService.eliminarTest(test.id).subscribe({
        next: () => {
          this.misTests = this.misTests.filter(t => t.id !== test.id);
          this.eliminandoId = null;
          this.snackBar.open(`Test "${test.titulo}" eliminado.`, 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.eliminandoId = null;
          this.snackBar.open('Error al eliminar el test. Inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  editarTest(test: Test, evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.router.navigate(['/tests/editar', test.id]);
  }
}
