import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TestService } from '../../../core/services/test';
import { IntentoService } from '../../../core/services/intento';
import { Test } from '../../../core/models/test.model';
import { RespuestaRequest } from '../../../core/models/intento.model';

interface RespuestaUsuario {
  preguntaId: number;
  preguntaIndex: number;
  opcionId: number | null;
}

@Component({
  selector: 'app-examen',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './examen.html',
  styleUrl: './examen.scss'
})
export class ExamenComponent implements OnInit, OnDestroy {

  test: Test | null = null;
  intentoId: number | null = null;
  cargando = true;
  error = '';

  preguntaIndex = 0;
  opcionSeleccionada: number | null = null;
  respondiendo = false;

  // Registro de respuestas del usuario para mostrar en resultados
  respuestasUsuario: RespuestaUsuario[] = [];

  // Temporizador
  tiempoRestante = 0;
  tiempoTotal = 0;
  private intervalo: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService,
    private intentoService: IntentoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargarTest(Number(id));
  }

  ngOnDestroy(): void {
    this.pararTemporizador();
  }

  cargarTest(testId: number): void {
    this.testService.getTestById(testId).subscribe({
      next: (test) => { this.test = test; this.iniciarIntento(testId); },
      error: () => { this.error = 'No se pudo cargar el test'; this.cargando = false; }
    });
  }

  iniciarIntento(testId: number): void {
    this.intentoService.iniciarIntento(testId).subscribe({
      next: (intento) => {
        this.intentoId = intento.id;
        this.cargando = false;
        if (this.test?.tiempoLimite) {
          this.tiempoRestante = this.test.tiempoLimite;
          this.tiempoTotal = this.test.tiempoLimite;
          this.iniciarTemporizador();
        }
      },
      error: () => { this.error = 'No se pudo iniciar el examen'; this.cargando = false; }
    });
  }

  iniciarTemporizador(): void {
    this.intervalo = setInterval(() => {
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        this.pararTemporizador();
        this.finalizarExamen();
      }
    }, 1000);
  }

  pararTemporizador(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  get preguntaActual() {
    return this.test?.preguntas?.[this.preguntaIndex] ?? null;
  }

  get totalPreguntas(): number {
    return this.test?.preguntas?.length ?? 0;
  }

  get progreso(): number {
    if (!this.totalPreguntas) return 0;
    return (this.preguntaIndex / this.totalPreguntas) * 100;
  }

  get tiempoFormateado(): string {
    const min = Math.floor(this.tiempoRestante / 60);
    const seg = this.tiempoRestante % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  }

  get tiempoProgreso(): number {
    return this.tiempoTotal ? (this.tiempoRestante / this.tiempoTotal) * 100 : 100;
  }

  get tiempoAgotandose(): boolean {
    return this.tiempoRestante <= 60 && this.tiempoTotal > 0;
  }

  seleccionarOpcion(opcionId: number): void {
    if (this.respondiendo) return;
    this.opcionSeleccionada = opcionId;
  }

  siguiente(): void {
    if (!this.opcionSeleccionada || !this.intentoId || !this.preguntaActual) return;
    this.respondiendo = true;

    // Guardar respuesta del usuario antes de avanzar
    this.respuestasUsuario.push({
      preguntaId: this.preguntaActual.id,
      preguntaIndex: this.preguntaIndex,
      opcionId: this.opcionSeleccionada
    });

    const respuesta: RespuestaRequest = {
      preguntaId: this.preguntaActual.id,
      opcionId: this.opcionSeleccionada
    };

    this.intentoService.responder(this.intentoId, respuesta).subscribe({
      next: () => {
        this.respondiendo = false;
        this.opcionSeleccionada = null;
        if (this.preguntaIndex < this.totalPreguntas - 1) {
          this.preguntaIndex++;
        } else {
          this.finalizarExamen();
        }
      },
      error: () => { this.respondiendo = false; }
    });
  }

  finalizarExamen(): void {
    if (!this.intentoId) return;
    this.pararTemporizador();
    this.intentoService.finalizar(this.intentoId).subscribe({
      next: (resultado) => {
        this.router.navigate(
          ['/examen', this.test?.id, 'resultados'],
          {
            queryParams: { intentoId: this.intentoId },
            state: { resultado, test: this.test, respuestasUsuario: this.respuestasUsuario }
          }
        );
      },
      error: () => { this.router.navigate(['/tests']); }
    });
  }
}
