import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TestService } from '../../../core/services/test';
import { AuthService } from '../../../core/services/auth';
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
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService,
    public authService: AuthService
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