import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TestService } from '../../../core/services/test';
import { AuthService } from '../../../core/services/auth';
import { Test } from '../../../core/models/test.model';

/**
 * Componente de lista de tests
 * Muestra todos los tests públicos con filtros
 * Los usuarios autenticados ven además sus tests privados con opciones de editar/eliminar
 * @author Hafdala Mehdi Sidi
 */
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

  tests: Test[] = [];
  misTests: Test[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  categoriaSeleccionada = '';
  dificultadSeleccionada = '';
  categorias: string[] = [];
  eliminandoId: number | null = null;

  constructor(
    private testService: TestService,
    public authService: AuthService
  ) { }

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