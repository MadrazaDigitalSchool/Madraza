import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApunteService, Apunte } from '../../core/services/apunte.service';
import { TestService } from '../../core/services/test';
import { AuthService } from '../../core/services/auth';
import { Test } from '../../core/models/test.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

type ModoIa = 'asistente' | 'generacion';
type AccionIa = 'ampliar' | 'resumir' | 'preguntas' | 'explicar';

@Component({
  selector: 'app-apuntes',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule
  ],
  templateUrl: './apuntes.html',
  styleUrl: './apuntes.scss'
})
export class ApuntesComponent implements OnInit {

  private apunteService = inject(ApunteService);
  private testService   = inject(TestService);
  private authService   = inject(AuthService);
  private snackBar      = inject(MatSnackBar);
  private dialog        = inject(MatDialog);
  private route         = inject(ActivatedRoute);

  esPremium = this.authService.tieneSubscripcion();

  apuntes     = signal<Apunte[]>([]);
  cargando    = signal(true);
  apunteActual = signal<Apunte | null>(null);
  guardando   = signal(false);
  misTests: Test[] = [];

  // Campos del editor
  titulo    = '';
  contenido = '';
  tags      = '';
  testId: number | null = null;

  // Panel IA
  mostrarIa    = false;
  modoIa: ModoIa = 'asistente';
  accionIa: AccionIa = 'ampliar';
  textoSeleccionado = '';
  temaGeneracion  = '';
  contextoGeneracion = '';
  respuestaIa   = signal('');
  cargandoIa    = signal(false);

  readonly ACCIONES: { value: AccionIa; label: string }[] = [
    { value: 'ampliar',   label: 'Ampliar texto' },
    { value: 'resumir',   label: 'Resumir' },
    { value: 'preguntas', label: 'Generar preguntas de repaso' },
    { value: 'explicar',  label: 'Explicar concepto' },
  ];

  ngOnInit(): void {
    if (!this.esPremium) return;
    this.cargarApuntes();
    this.testService.getMisTests().subscribe({ next: t => this.misTests = t });

    // Si se navega desde detalle-test con ?testId=X, preseleccionar el test
    const testIdParam = this.route.snapshot.queryParamMap.get('testId');
    if (testIdParam) {
      this.testId = Number(testIdParam);
      this.nuevoApunte();
    }
  }

  cargarApuntes(): void {
    this.cargando.set(true);
    this.apunteService.getMisApuntes().subscribe({
      next: list => { this.apuntes.set(list); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  seleccionarApunte(a: Apunte): void {
    this.apunteActual.set(a);
    this.titulo    = a.titulo;
    this.contenido = a.contenido ?? '';
    this.tags      = a.tags ?? '';
    this.testId    = a.testId;
    this.respuestaIa.set('');
  }

  nuevoApunte(): void {
    this.apunteActual.set(null);
    this.titulo    = '';
    this.contenido = '';
    this.tags      = '';
    this.respuestaIa.set('');
  }

  guardar(): void {
    if (!this.titulo.trim()) { this.snackBar.open('El título es obligatorio', 'Cerrar', { duration: 3000 }); return; }
    this.guardando.set(true);
    const datos = { titulo: this.titulo.trim(), contenido: this.contenido, tags: this.tags, testId: this.testId };
    const op = this.apunteActual()
        ? this.apunteService.actualizar(this.apunteActual()!.id, datos)
        : this.apunteService.crear(datos);

    op.subscribe({
      next: (a) => {
        if (this.apunteActual()) {
          this.apuntes.update(list => list.map(x => x.id === a.id ? a : x));
        } else {
          this.apuntes.update(list => [a, ...list]);
          this.apunteActual.set(a);
        }
        this.guardando.set(false);
        this.snackBar.open('Apunte guardado.', 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.guardando.set(false);
        this.snackBar.open('Error al guardar. Inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  eliminarApunte(a: Apunte, e: Event): void {
    e.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { titulo: 'Eliminar apunte', mensaje: `¿Eliminar "${a.titulo}"?`, labelConfirmar: 'Eliminar', labelCancelar: 'Cancelar' }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.apunteService.eliminar(a.id).subscribe({
        next: () => {
          this.apuntes.update(list => list.filter(x => x.id !== a.id));
          if (this.apunteActual()?.id === a.id) this.nuevoApunte();
          this.snackBar.open('Apunte eliminado.', 'Cerrar', { duration: 2000 });
        }
      });
    });
  }

  capturarTextoSeleccionado(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.textoSeleccionado = textarea.value.substring(
      textarea.selectionStart ?? 0,
      textarea.selectionEnd ?? 0
    );
  }

  parsearTags(tags: string): string[] {
    return (tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
  }

  // ── IA ─────────────────────────────────────────────────────

  pedirIa(): void {
    this.cargandoIa.set(true);
    this.respuestaIa.set('');

    const req = this.modoIa === 'generacion'
        ? { modo: 'generacion' as const, tema: this.temaGeneracion, contexto: this.contextoGeneracion }
        : { modo: 'asistente' as const, accion: this.accionIa, contenidoActual: this.contenido, textoSeleccionado: this.textoSeleccionado };

    this.apunteService.asistirConIa(req).subscribe({
      next: ({ resultado }) => {
        this.respuestaIa.set(resultado);
        this.cargandoIa.set(false);
      },
      error: (err) => {
        this.cargandoIa.set(false);
        this.snackBar.open(err.error?.error || 'Error al contactar con la IA', 'Cerrar', { duration: 4000 });
      }
    });
  }

  insertarEnEditor(): void {
    this.contenido += (this.contenido ? '\n\n' : '') + this.respuestaIa();
    this.respuestaIa.set('');
    this.snackBar.open('Texto insertado en el editor.', 'Cerrar', { duration: 2000 });
  }

  reemplazarEditor(): void {
    this.contenido = this.respuestaIa();
    this.respuestaIa.set('');
    this.snackBar.open('Editor actualizado con el contenido de la IA.', 'Cerrar', { duration: 2000 });
  }
}
