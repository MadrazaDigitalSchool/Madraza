import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IntentoService } from '../../../core/services/intento';
import { ResultadoResponse } from '../../../core/models/intento.model';

/**
 * Componente de resultados del examen
 * Muestra puntuación, correctas, incorrectas y porcentaje
 * @author Hafdala Mehdi Sidi
 */
@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './resultados.html',
  styleUrl: './resultados.scss'
})
export class ResultadosComponent implements OnInit {

  resultado: ResultadoResponse | null = null;
  cargando = true;
  error = '';
  testId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private intentoService: IntentoService
  ) { }

  ngOnInit(): void {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));
    const intentoId = Number(this.route.snapshot.queryParamMap.get('intentoId'));

    if (intentoId) {
      this.cargarResultado(intentoId);
    } else {
      this.error = 'No se encontraron los resultados';
      this.cargando = false;
    }
  }

  cargarResultado(intentoId: number): void {
    this.intentoService.finalizar(intentoId).subscribe({
      next: (resultado) => {
        this.resultado = resultado;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los resultados';
        this.cargando = false;
      }
    });
  }

  getMensaje(): string {
    const p = this.resultado?.porcentaje ?? 0;
    if (p >= 90) return '¡Excelente! 🏆';
    if (p >= 70) return '¡Muy bien! 👍';
    if (p >= 50) return 'Aprobado 👌';
    return 'Sigue practicando 💪';
  }

  getColorPorcentaje(): string {
    const p = this.resultado?.porcentaje ?? 0;
    if (p >= 70) return 'color-exito';
    if (p >= 50) return 'color-warning';
    return 'color-error';
  }

  repetirTest(): void {
    this.router.navigate(['/tests', this.testId]);
  }
}