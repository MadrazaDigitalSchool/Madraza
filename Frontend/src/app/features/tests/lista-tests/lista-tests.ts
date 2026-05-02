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
import { TestService } from '../../../core/services/test';
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

  private router = inject(Router);
  private testService = inject(TestService);
  public authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tests: Test[] = [];
  misTests: Test[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  categoriaSeleccionada = '';
  dificultadSeleccionada = '';
  categorias: string[] = [];
  eliminandoId: number | null = null;

  ngOnInit(): void {
    this.cargarTests();
    if (this.authService.isLoggedIn()) {
      this.cargarMisTests();
    }
  }

  cargarTests(): void {
    this.cargando = true;
    this.testService.getTestsPublicos().subscribe({
      next: (tests) => {
        this.tests = tests.filter(t => t.visibilidad === 'PUBLICO');
        this.categorias = [...new Set(this.tests.map(t => t.categoria))];
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar los tests';
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
    this.router.navigate(['/tests/editar', test.id]);
  }
}
