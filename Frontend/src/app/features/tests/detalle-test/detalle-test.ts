import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TestService } from '../../../core/services/test';
import { ApunteService, Apunte } from '../../../core/services/apunte.service';
import { AuthService } from '../../../core/services/auth';
import { IntentoService } from '../../../core/services/intento';
import { Test } from '../../../core/models/test.model';

/**
 * Componente de detalle del test
 * Muestra la información completa del test antes de iniciarlo
 * @author Hafdala Mehdi Sidi
 */
@Component({
  selector: 'app-detalle-test',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './detalle-test.html',
  styleUrl: './detalle-test.scss'
})
export class DetalleTestComponent implements OnInit {

  test: Test | null = null;
  apuntesRelacionados: Apunte[] = [];
  cargando = true;
  error = '';
  pendientesCorreccion = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService,
    private apunteService: ApunteService,
    public authService: AuthService,
    private intentoService: IntentoService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarTest(Number(id));
    }
  }

  cargarTest(id: number): void {
    this.cargando = true;
    this.testService.getTestById(id).subscribe({
      next: (test) => {
        this.test = test;
        this.cargando = false;
        if (this.authService.isLoggedIn() && this.authService.tieneSubscripcion()) {
          this.apunteService.getApuntesPorTest(id).subscribe({
            next: (apuntes) => { this.apuntesRelacionados = apuntes; },
            error: () => {}
          });
        }
        // Si el usuario es el creador, carga el número de respuestas pendientes de corrección
        const userId = this.authService.getUsuarioActual()?.id;
        if (userId && test.creador?.id === userId) {
          this.intentoService.getParaCorregir(id).subscribe({
            next: (lista) => { this.pendientesCorreccion = lista.length; },
            error: () => {}
          });
        }
      },
      error: () => {
        this.error = 'No se pudo cargar el test';
        this.cargando = false;
      }
    });
  }

  iniciarExamen(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/examen', this.test?.id]);
  }

  getDificultadLabel(dificultad: string): string {
    const labels: Record<string, string> = {
      'BAJA': 'Fácil',
      'MEDIA': 'Media',
      'ALTA': 'Difícil'
    };
    return labels[dificultad] ?? dificultad;
  }

  getDificultadClass(dificultad: string): string {
    const clases: Record<string, string> = {
      'BAJA': 'chip-baja',
      'MEDIA': 'chip-media',
      'ALTA': 'chip-alta'
    };
    return clases[dificultad] ?? '';
  }
}