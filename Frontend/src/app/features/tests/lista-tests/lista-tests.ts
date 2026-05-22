import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { TestService, CreateTestDTO } from '../../../core/services/test';
import { ApunteService, Apunte } from '../../../core/services/apunte.service';
import { RecursoGuardService } from '../../../core/services/recurso-guard.service';
import { AuthService } from '../../../core/services/auth';
import { Test } from '../../../core/models/test.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-lista-tests',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './lista-tests.html',
  styleUrl: './lista-tests.scss'
})
export class ListaTestsComponent implements OnInit {

  private router        = inject(Router);
  private testService   = inject(TestService);
  private apunteService = inject(ApunteService);
  private recursoGuard  = inject(RecursoGuardService);
  public  authService   = inject(AuthService);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);

  tests: Test[] = [];
  misTests: Test[] = [];
  misApuntes: Apunte[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  categoriaSeleccionada = '';
  dificultadSeleccionada = '';
  categorias: string[] = [];
  eliminandoId: number | null = null;
  duplicandoId: number | null = null;
  eliminandoApunteId: number | null = null;

  ngOnInit(): void {
    this.cargarTests();
    if (this.authService.isLoggedIn()) {
      this.cargarMisTests();
      if (this.authService.tieneSubscripcion()) {
        this.cargarMisApuntes();
      }
    }
  }

  cargarTests(): void {
    this.cargando = true;
    this.error = '';
    this.testService.getTestsPublicos().subscribe({
      next: (tests) => {
        this.tests = tests.filter(t => t.visibilidad === 'PUBLICO');
        this.categorias = [...new Set(this.tests.map(t => t.categoria))];
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor. Comprueba que el backend está en marcha.';
        } else {
          this.error = `Error ${err.status} al cargar los tests. Inténtalo de nuevo.`;
        }
        this.cargando = false;
      }
    });
  }

  cargarMisTests(): void {
    this.testService.getMisTests().subscribe({
      next: (tests) => { this.misTests = tests; },
      error: () => {}
    });
  }

  cargarMisApuntes(): void {
    this.apunteService.getMisApuntes().subscribe({
      next: (apuntes) => { this.misApuntes = apuntes; },
      error: () => {}
    });
  }

  eliminarApunte(apunte: Apunte, evento: Event): void {
    evento.stopPropagation();
    this.recursoGuard.confirmarEliminarApunte(apunte).subscribe(ok => {
      if (!ok) return;
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

  get testsFiltrados(): Test[] {
    return this.tests.filter(test => {
      const coincideBusqueda = !this.busqueda ||
        test.titulo.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        test.descripcion?.toLowerCase().includes(this.busqueda.toLowerCase());
      const coincideCategoria = !this.categoriaSeleccionada ||
        test.categoria === this.categoriaSeleccionada;
      const coincideDificultad = !this.dificultadSeleccionada ||
        test.dificultad === this.dificultadSeleccionada;
      return coincideBusqueda && coincideCategoria && coincideDificultad;
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.categoriaSeleccionada = '';
    this.dificultadSeleccionada = '';
  }

  getDificultadClass(dificultad: string): string {
    const clases: Record<string, string> = {
      'BAJA': 'chip-baja',
      'MEDIA': 'chip-media',
      'ALTA': 'chip-alta'
    };
    return clases[dificultad] ?? '';
  }

  getDificultadLabel(dificultad: string): string {
    const labels: Record<string, string> = {
      'BAJA': 'Fácil',
      'MEDIA': 'Media',
      'ALTA': 'Difícil'
    };
    return labels[dificultad] ?? dificultad;
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
          this.cargarTests();
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
          error: () => {
            this.duplicandoId = null;
            this.snackBar.open('No se pudo duplicar el test.', 'Cerrar', { duration: 4000 });
          }
        });
      },
      error: () => {
        this.duplicandoId = null;
        this.snackBar.open('No se pudo obtener los datos del test.', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
