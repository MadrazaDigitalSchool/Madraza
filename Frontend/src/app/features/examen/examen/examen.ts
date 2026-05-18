import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TestService } from '../../../core/services/test';
import { IntentoService } from '../../../core/services/intento';
import { ThemeService } from '../../../core/services/theme.service';
import { Test } from '../../../core/models/test.model';
import { RespuestaRequest, Intento } from '../../../core/models/intento.model';
import { forkJoin, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

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

  themeService = inject(ThemeService);

  test: Test | null = null;
  intentoId: number | null = null;
  cargando = true;
  error = '';

  preguntaIndex = 0;
  opcionSeleccionada: number | null = null;
  respondiendo = false;

  // Registro de respuestas del usuario para mostrar en resultados
  respuestasUsuario: RespuestaUsuario[] = [];

  tiempoRestante = signal(0);
  tiempoTotal = signal(0);
  private intervalo: any;

  tiempoFormateado = computed(() => {
    const t = this.tiempoRestante();
    const min = Math.floor(t / 60);
    const seg = t % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  });

  tiempoAgotandose = computed(() => this.tiempoRestante() <= 60 && this.tiempoTotal() > 0);

  tiempoProgreso = computed(() =>
    this.tiempoTotal() ? (this.tiempoRestante() / this.tiempoTotal()) * 100 : 100
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService,
    private intentoService: IntentoService
  ) {}

  private timeoutGlobal: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.iniciarExamen(Number(id));
  }

  ngOnDestroy(): void {
    this.pararTemporizador();
    clearTimeout(this.timeoutGlobal);
  }

  iniciarExamen(testId: number): void {
    // Timeout global: si en 30s no ha cargado, mostramos error
    this.timeoutGlobal = setTimeout(() => {
      if (this.cargando) {
        this.cargando = false;
        this.error = 'El examen está tardando demasiado. Comprueba tu conexión e inténtalo de nuevo.';
      }
    }, 30_000);

    const test$ = this.testService.getTestById(testId).pipe(
      timeout(15_000),
      catchError(() => of(null as Test | null))
    );

    const intento$ = this.intentoService.iniciarIntento(testId).pipe(
      timeout(15_000),
      catchError(() => of(null as Intento | null))
    );

    forkJoin({ test: test$, intento: intento$ }).subscribe({
      next: ({ test, intento }) => {
        clearTimeout(this.timeoutGlobal);
        this.cargando = false;
        if (!test && !intento) {
          this.error = 'Error de conexión con el servidor. Inténtalo de nuevo más tarde.';
        } else if (!test) {
          this.error = 'No se pudo cargar el test. Inténtalo de nuevo.';
        } else if (!intento) {
          this.error = 'No se pudo iniciar el examen. Inténtalo de nuevo.';
        } else {
          this.test = test;
          this.intentoId = intento.id;
          if (this.test?.tiempoLimite) {
            this.tiempoRestante.set(this.test.tiempoLimite);
            this.tiempoTotal.set(this.test.tiempoLimite);
            this.iniciarTemporizador();
          }
        }
      },
      error: () => {
        clearTimeout(this.timeoutGlobal);
        this.cargando = false;
        this.error = 'Error inesperado al preparar el examen.';
      }
    });
  }

  iniciarTemporizador(): void {
    this.intervalo = setInterval(() => {
      this.tiempoRestante.update(t => t - 1);
      if (this.tiempoRestante() <= 0) {
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

  seleccionarOpcion(opcionId: number): void {
    if (this.respondiendo) return;
    this.opcionSeleccionada = opcionId;
  }

  siguiente(): void {
    if (this.opcionSeleccionada === null || !this.intentoId || !this.preguntaActual) return;
    this.respondiendo = true;

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

  reintentar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.error = '';
      this.cargando = true;
      this.test = null;
      this.intentoId = null;
      this.preguntaIndex = 0;
      this.opcionSeleccionada = null;
      this.respuestasUsuario = [];
      this.pararTemporizador();
      clearTimeout(this.timeoutGlobal);
      this.iniciarExamen(Number(id));
    }
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
