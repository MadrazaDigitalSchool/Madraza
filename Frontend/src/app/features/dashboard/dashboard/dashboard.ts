import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';
import { TestService, CreateTestDTO } from '../../../core/services/test';
import { ApunteService, Apunte } from '../../../core/services/apunte.service';
import { RecursoGuardService } from '../../../core/services/recurso-guard.service';
import { IntentoService } from '../../../core/services/intento';
import { CompartirService, CompartirTest } from '../../../core/services/compartir.service';
import { OrganizacionService, MiAsignacion, Organizacion } from '../../../core/services/organizacion.service';
import { Test } from '../../../core/models/test.model';
import { Intento, PendienteCorreccion } from '../../../core/models/intento.model';
import { Usuario, LimitesFreePlan } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatMenuModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  private router           = inject(Router);
  public  authService      = inject(AuthService);
  private testService      = inject(TestService);
  private apunteService    = inject(ApunteService);
  private recursoGuard     = inject(RecursoGuardService);
  private intentoService   = inject(IntentoService);
  private compartirService = inject(CompartirService);
  private orgService       = inject(OrganizacionService);
  private dialog           = inject(MatDialog);
  private snackBar         = inject(MatSnackBar);

  usuario: Usuario | null = null;
  historial: Intento[] = [];
  misTests: Test[]     = [];
  misApuntes: Apunte[] = [];
  cargando = true;
  eliminandoId: number | null = null;
  duplicandoId: number | null = null;
  eliminandoApunteId: number | null = null;
  error = '';

  limites             = signal<LimitesFreePlan | null>(null);
  compartidos         = signal<CompartirTest[]>([]);
  asignaciones        = signal<MiAsignacion[]>([]);
  pendientesCorreccion = signal<PendienteCorreccion[]>([]);
  misOrgsAdmin: Organizacion[] = [];
  asignandoTestId: number | null = null;

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

    this.testService.getMisTests().subscribe({ next: (tests) => { this.misTests = tests; } });

    if (this.authService.tieneSubscripcion()) {
      this.apunteService.getMisApuntes().subscribe({ next: (apuntes) => { this.misApuntes = apuntes; } });
    }

    if (!this.authService.tieneSubscripcion()) {
      this.authService.getLimites().subscribe({ next: l => this.limites.set(l) });
    }

    this.compartirService.getRecibidos().subscribe({ next: c => this.compartidos.set(c.filter(x => !x.visto).slice(0, 5)) });
    this.orgService.getMisAsignaciones().subscribe({ next: a => this.asignaciones.set(a.filter(x => x.estado === 'PENDIENTE').slice(0, 5)) });

    const userId = this.authService.getUsuarioActual()?.id;
    this.orgService.getMisOrganizaciones().subscribe({ next: orgs => this.misOrgsAdmin = orgs.filter(o => o.adminId === userId) });
    this.intentoService.getMisPendientesCorreccion().subscribe({ next: p => this.pendientesCorreccion.set(p), error: () => {} });
  }

  marcarVisto(id: number): void {
    this.compartirService.marcarVisto(id).subscribe({
      next: () => this.compartidos.update(list => list.filter(c => c.id !== id))
    });
  }

  get totalRecursosCreados(): number { return this.misTests.length + this.misApuntes.length; }

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

  asignarAOrg(test: Test, org: Organizacion, evento: Event): void {
    evento.stopPropagation();
    this.asignandoTestId = test.id;
    this.orgService.asignarRecurso(org.id, 'TEST', test.id, null, null, '').subscribe({
      next: () => {
        this.asignandoTestId = null;
        this.snackBar.open(`"${test.titulo}" asignado a ${org.nombre}.`, 'Cerrar', { duration: 3000 });
      },
      error: (err: any) => {
        this.asignandoTestId = null;
        this.snackBar.open(err.error?.error || 'Error al asignar', 'Cerrar', { duration: 4000 });
      }
    });
  }

  eliminarApunte(apunte: Apunte, evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.recursoGuard.confirmarEliminarApunte(apunte).subscribe(confirmado => {
      if (!confirmado) return;
      this.eliminandoApunteId = apunte.id;
      this.apunteService.eliminar(apunte.id).subscribe({
        next: () => {
          this.misApuntes = this.misApuntes.filter(a => a.id !== apunte.id);
          this.eliminandoApunteId = null;
          this.snackBar.open(`Apunte "${apunte.titulo}" eliminado.`, 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.eliminandoApunteId = null;
          this.snackBar.open('Error al eliminar el apunte.', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  eliminarTest(test: Test, evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.recursoGuard.confirmarEliminarTest(test).subscribe(confirmado => {
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
    this.recursoGuard.confirmarEditarTest(test).subscribe(confirmado => {
      if (confirmado) this.router.navigate(['/tests/editar', test.id]);
    });
  }

  duplicarTest(test: Test, evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.duplicandoId = test.id;
    this.testService.getTestById(test.id).subscribe({
      next: (fullTest) => {
        const dto: CreateTestDTO = {
          titulo: `Copia de ${fullTest.titulo}`,
          descripcion: fullTest.descripcion,
          categoria: fullTest.categoria,
          dificultad: fullTest.dificultad,
          tiempoLimite: fullTest.tiempoLimite,
          visibilidad: 'PRIVADO',
          preguntas: (fullTest.preguntas ?? []).map((p, i) => ({
            enunciado: p.enunciado,
            tipo: p.tipo,
            orden: i + 1,
            puntos: p.puntos,
            explicacion: p.explicacion ?? null,
            opciones: (p.opciones ?? []).map(o => ({
              texto: o.texto,
              esCorrecta: o.esCorrecta,
              orden: o.orden
            }))
          }))
        };
        this.testService.crearTest(dto).subscribe({
          next: (nuevo) => {
            this.misTests = [...this.misTests, nuevo];
            this.duplicandoId = null;
            const sb = this.snackBar.open(`Test duplicado como "${nuevo.titulo}"`, 'Editar', { duration: 5000 });
            sb.onAction().subscribe(() => this.router.navigate(['/tests/editar', nuevo.id]));
          },
          error: (err: any) => {
            this.duplicandoId = null;
            const msg = err.error?.error || 'Error al duplicar el test.';
            const sb = this.snackBar.open(msg, 'Ver planes', { duration: 7000 });
            sb.onAction().subscribe(() => this.router.navigate(['/precios']));
          }
        });
      },
      error: () => {
        this.duplicandoId = null;
        this.snackBar.open('Error al duplicar el test.', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
