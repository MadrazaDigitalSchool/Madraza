import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IntentoService } from '../../../core/services/intento';
import { ResultadoResponse } from '../../../core/models/intento.model';
import { Test, Pregunta } from '../../../core/models/test.model';

interface PreguntaResultado {
  pregunta: Pregunta;
  opcionElegidaId: number | null;
  esCorrecta: boolean;
  opcionCorrectaTexto: string;
  opcionElegidaTexto: string;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './resultados.html',
  styleUrl: './resultados.scss'
})
export class ResultadosComponent implements OnInit {

  resultado: ResultadoResponse | null = null;
  cargando = true;
  error = '';
  testId: number | null = null;

  // Desglose por pregunta (disponible si viene del examen)
  desglose: PreguntaResultado[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private intentoService: IntentoService
  ) {}

  ngOnInit(): void {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));

    // El ExamenComponent pasa resultado, test y respuestasUsuario vía state
    const estado = history.state as {
      resultado?: ResultadoResponse;
      test?: Test;
      respuestasUsuario?: { preguntaId: number; preguntaIndex: number; opcionId: number | null }[];
    };

    if (estado?.resultado) {
      this.resultado = estado.resultado;
      this.cargando = false;

      // Construir desglose si tenemos los datos del test
      if (estado.test?.preguntas && estado.respuestasUsuario) {
        this.construirDesglose(estado.test.preguntas, estado.respuestasUsuario);
      }
      return;
    }

    // Fallback: acceso directo por URL
    const intentoId = Number(this.route.snapshot.queryParamMap.get('intentoId'));
    if (intentoId) {
      this.cargarResultado(intentoId);
    } else {
      this.error = 'No se encontraron los resultados';
      this.cargando = false;
    }
  }

  private construirDesglose(
    preguntas: Pregunta[],
    respuestas: { preguntaId: number; preguntaIndex: number; opcionId: number | null }[]
  ): void {
    this.desglose = preguntas.map((pregunta, index) => {
      const respuesta = respuestas.find(r => r.preguntaIndex === index);
      const opcionElegidaId = respuesta?.opcionId ?? null;
      const opciones = pregunta.opciones ?? [];
      const opcionCorrecta = opciones.find(o => o.esCorrecta);
      const opcionElegida = opciones.find(o => o.id === opcionElegidaId);
      const esCorrecta = !!opcionCorrecta && opcionElegidaId === opcionCorrecta.id;

      return {
        pregunta,
        opcionElegidaId,
        esCorrecta,
        opcionCorrectaTexto: opcionCorrecta?.texto ?? '—',
        opcionElegidaTexto: opcionElegida?.texto ?? 'Sin respuesta'
      };
    });
  }

  cargarResultado(intentoId: number): void {
    this.intentoService.finalizar(intentoId).subscribe({
      next: (resultado) => { this.resultado = resultado; this.cargando = false; },
      error: () => { this.error = 'No se pudieron cargar los resultados'; this.cargando = false; }
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
