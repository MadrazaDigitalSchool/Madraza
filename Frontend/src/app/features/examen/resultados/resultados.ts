import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { IntentoService } from '../../../core/services/intento';
import { ResultadoResponse, DetalleRespuesta } from '../../../core/models/intento.model';
import { Test, Pregunta } from '../../../core/models/test.model';

interface PreguntaResultado {
  pregunta: Pregunta;
  opcionElegidaId: number | null;
  textoLibre: string | null;
  esCorrecta: boolean;
  pendienteCorreccion: boolean;
  opcionCorrectaTexto: string;
  opcionElegidaTexto: string;
  anotacion?: string;
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

  desglose: PreguntaResultado[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private intentoService: IntentoService
  ) {}

  ngOnInit(): void {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));

    const estado = history.state as {
      resultado?: ResultadoResponse;
      test?: Test;
      respuestasUsuario?: { preguntaId: number; preguntaIndex: number; opcionId: number | null; textoLibre: string | null }[];
    };

    if (estado?.resultado) {
      this.resultado = estado.resultado;
      this.cargando = false;

      if (estado.test?.preguntas && estado.respuestasUsuario) {
        this.construirDesgloseFromState(estado.test.preguntas, estado.respuestasUsuario);
      }
      return;
    }

    // Acceso directo por URL: carga resultado + detalle de respuestas
    const intentoId = Number(this.route.snapshot.queryParamMap.get('intentoId'));
    if (intentoId) {
      this.cargarDesdeApi(intentoId);
    } else {
      this.error = 'No se encontraron los resultados';
      this.cargando = false;
    }
  }

  private cargarDesdeApi(intentoId: number): void {
    forkJoin({
      resultado: this.intentoService.finalizar(intentoId),
      detalle:   this.intentoService.getDetalle(intentoId)
    }).subscribe({
      next: ({ resultado, detalle }) => {
        this.resultado = resultado;
        this.construirDesgloseFromDetalle(detalle);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los resultados';
        this.cargando = false;
      }
    });
  }

  private construirDesgloseFromState(
    preguntas: Pregunta[],
    respuestas: { preguntaId: number; preguntaIndex: number; opcionId: number | null; textoLibre: string | null }[]
  ): void {
    this.desglose = preguntas.map((pregunta, index) => {
      const respuesta = respuestas.find(r => r.preguntaIndex === index);

      if (pregunta.tipo === 'TEXTO_LIBRE') {
        const textoLibre = respuesta?.textoLibre ?? null;
        return {
          pregunta,
          opcionElegidaId: null,
          textoLibre,
          esCorrecta: false,
          pendienteCorreccion: true,
          opcionCorrectaTexto: pregunta.explicacion ?? '—',
          opcionElegidaTexto: textoLibre ?? 'Sin respuesta'
        };
      }

      const opcionElegidaId = respuesta?.opcionId ?? null;
      const opciones = pregunta.opciones ?? [];
      const opcionCorrecta = opciones.find(o => o.esCorrecta);
      const opcionElegida = opciones.find(o => o.id === opcionElegidaId);
      const esCorrecta = !!opcionCorrecta && opcionElegidaId === opcionCorrecta.id;

      return {
        pregunta,
        opcionElegidaId,
        textoLibre: null,
        esCorrecta,
        pendienteCorreccion: false,
        opcionCorrectaTexto: opcionCorrecta?.texto ?? '—',
        opcionElegidaTexto: opcionElegida?.texto ?? 'Sin respuesta'
      };
    });
  }

  private construirDesgloseFromDetalle(detalle: DetalleRespuesta[]): void {
    this.desglose = detalle.map(d => {
      // Convertimos DetalleRespuesta a la interfaz PreguntaResultado
      const pregunta: Pregunta = {
        id: d.preguntaId,
        enunciado: d.enunciado,
        tipo: d.tipo,
        orden: 0,
        puntos: d.puntos,
        explicacion: d.explicacion,
        opciones: (d.opciones ?? []).map(o => ({
          id: o.id,
          texto: o.texto,
          esCorrecta: o.esCorrecta ?? false,
          orden: o.orden
        }))
      };

      if (d.tipo === 'TEXTO_LIBRE') {
        return {
          pregunta,
          opcionElegidaId: null,
          textoLibre: d.textoLibre ?? null,
          esCorrecta: d.esCorrecta,
          pendienteCorreccion: d.pendienteCorreccion,
          opcionCorrectaTexto: d.explicacion ?? '—',
          opcionElegidaTexto: d.textoLibre ?? 'Sin respuesta',
          anotacion: d.anotacion
        };
      }

      const opcionCorrecta = pregunta.opciones?.find(o => o.esCorrecta);
      const opcionElegida  = pregunta.opciones?.find(o => o.id === d.opcionSeleccionadaId);

      return {
        pregunta,
        opcionElegidaId: d.opcionSeleccionadaId ?? null,
        textoLibre: null,
        esCorrecta: d.esCorrecta,
        pendienteCorreccion: false,
        opcionCorrectaTexto: opcionCorrecta?.texto ?? '—',
        opcionElegidaTexto:  opcionElegida?.texto  ?? 'Sin respuesta'
      };
    });
  }

  cargarResultado(intentoId: number): void {
    this.intentoService.finalizar(intentoId).subscribe({
      next: (resultado) => { this.resultado = resultado; this.cargando = false; },
      error: () => { this.error = 'No se pudieron cargar los resultados'; this.cargando = false; }
    });
  }

  get tienePendientes(): boolean {
    return this.resultado?.pendienteCorreccion ?? false;
  }

  getMensaje(): string {
    if (this.tienePendientes) return 'Corrección en proceso...';
    const p = this.resultado?.porcentaje ?? 0;
    if (p >= 90) return '¡Excelente! 🏆';
    if (p >= 70) return '¡Muy bien! 👍';
    if (p >= 50) return 'Aprobado 👌';
    return 'Sigue practicando 💪';
  }

  getColorPorcentaje(): string {
    if (this.tienePendientes) return 'color-warning';
    const p = this.resultado?.porcentaje ?? 0;
    if (p >= 70) return 'color-exito';
    if (p >= 50) return 'color-warning';
    return 'color-error';
  }

  repetirTest(): void {
    this.router.navigate(['/tests', this.testId]);
  }

  exportarPdf(): void {
    if (!this.resultado) return;
    const titulo = `resultado-${this.resultado.intentoId}`;
    this.intentoService.exportarPdf(this.resultado.intentoId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `${titulo}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
