import { Component, OnInit, OnDestroy, inject, signal, ViewChild } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuillModule } from 'ngx-quill';
import { marked } from 'marked';
import { ApunteService, Apunte, ApunteAsignado } from '../../core/services/apunte.service';
import { TestService } from '../../core/services/test';
import { AuthService } from '../../core/services/auth';
import { forkJoin } from 'rxjs';
import { ThemeService } from '../../core/services/theme.service';
import { Test } from '../../core/models/test.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

// Registrar módulo Table de Quill v2
import Quill from 'quill';
import Table from 'quill/modules/table';
Quill.register({ 'modules/table': Table }, true);

type ModoIa = 'asistente' | 'generacion';
type AccionIa = 'ampliar' | 'resumir' | 'preguntas' | 'explicar';

@Component({
  selector: 'app-apuntes',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,
    MatTooltipModule,
    QuillModule
  ],
  templateUrl: './apuntes.html',
  styleUrl: './apuntes.scss'
})
export class ApuntesComponent implements OnInit, OnDestroy {

  private apunteService = inject(ApunteService);
  private testService   = inject(TestService);
  private authService   = inject(AuthService);
  private snackBar      = inject(MatSnackBar);
  private dialog        = inject(MatDialog);
  private route         = inject(ActivatedRoute);
  themeService          = inject(ThemeService);

  esPremium = this.authService.tieneSubscripcion();

  apuntes      = signal<Apunte[]>([]);
  cargando     = signal(true);
  apunteActual = signal<Apunte | null>(null);
  guardando    = signal(false);
  examenes:    Test[] = [];

  apuntesAsignados:     ApunteAsignado[] = [];
  apunteAsignadoActual: ApunteAsignado | null = null;

  // Campos del editor
  titulo    = '';
  contenido = '';
  tags      = '';
  testId: number | null = null;

  // Referencia al editor Quill
  private quillInstance: any = null;

  // Panel tabla
  mostrarPanelTabla = false;
  tablaFilas   = 3;
  tablaCols    = 3;

  // Panel IA
  mostrarIa       = false;
  modoIa: ModoIa  = 'asistente';
  accionIa: AccionIa = 'ampliar';
  textoSeleccionado   = '';
  temaGeneracion      = '';
  contextoGeneracion  = '';
  respuestaIa         = signal('');
  cargandoIa          = signal(false);

  // Configuración del editor Quill
  readonly quillModules = {
    table: {},
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  };

  readonly quillModulesReadonly = { toolbar: false };

  readonly ACCIONES: { value: AccionIa; label: string }[] = [
    { value: 'ampliar',   label: 'Ampliar texto' },
    { value: 'resumir',   label: 'Resumir' },
    { value: 'preguntas', label: 'Generar preguntas de repaso' },
    { value: 'explicar',  label: 'Explicar concepto' },
  ];

  ngOnInit(): void {
    this.apunteService.getMisApuntesAsignados().subscribe({
      next: lista => {
        this.apuntesAsignados = lista;
        const apunteIdParam = this.route.snapshot.queryParamMap.get('apunteId');
        if (apunteIdParam) {
          const encontrado = lista.find(a => a.id === Number(apunteIdParam));
          if (encontrado) this.seleccionarApunteAsignado(encontrado);
        }
      },
      error: () => {}
    });

    if (!this.esPremium) return;

    this.cargarApuntes();
    forkJoin({
      propios:  this.testService.getMisTests(),
      publicos: this.testService.getTestsPublicos()
    }).subscribe({
      next: ({ propios, publicos }) => {
        const ids = new Set(propios.map(t => t.id));
        this.examenes = [
          ...propios,
          ...publicos.filter(t => t.visibilidad === 'PUBLICO' && !ids.has(t.id))
        ];
      },
      error: () => {}
    });

    const testIdParam = this.route.snapshot.queryParamMap.get('testId');
    if (testIdParam) {
      this.nuevoApunte();
      this.testId = Number(testIdParam);
    }
  }

  ngOnDestroy(): void {
    this.themeService.reset();
  }

  cargarApuntes(): void {
    this.cargando.set(true);
    this.apunteService.getMisApuntes().subscribe({
      next: list => { this.apuntes.set(list); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  seleccionarApunte(a: Apunte): void {
    this.apunteAsignadoActual = null;
    this.apunteActual.set(a);
    this.titulo    = a.titulo;
    this.contenido = a.contenido ?? '';
    this.tags      = a.tags ?? '';
    this.testId    = a.testId;
    this.respuestaIa.set('');
    this.mostrarPanelTabla = false;
  }

  seleccionarApunteAsignado(a: ApunteAsignado): void {
    this.apunteActual.set(null);
    this.apunteAsignadoActual = a;
    this.titulo    = a.titulo;
    this.contenido = a.contenido ?? '';
    this.tags      = a.tags ?? '';
    this.testId    = a.testId;
    this.respuestaIa.set('');
    this.mostrarIa = false;
    this.mostrarPanelTabla = false;
  }

  nuevoApunte(): void {
    this.apunteAsignadoActual = null;
    this.apunteActual.set(null);
    this.titulo    = '';
    this.contenido = '';
    this.tags      = '';
    this.testId    = null;
    this.respuestaIa.set('');
    this.mostrarPanelTabla = false;
  }

  guardar(): void {
    if (!this.titulo.trim()) { this.snackBar.open('El título es obligatorio', 'Cerrar', { duration: 3000 }); return; }
    this.guardando.set(true);
    const datos   = { titulo: this.titulo.trim(), contenido: this.contenido, tags: this.tags, testId: this.testId };
    const esNuevo = !this.apunteActual();
    const op      = esNuevo
        ? this.apunteService.crear(datos)
        : this.apunteService.actualizar(this.apunteActual()!.id, datos);

    op.subscribe({
      next: (a) => {
        if (esNuevo) {
          this.apuntes.update(list => [a, ...list]);
          this.apunteActual.set(a);
        } else {
          this.apuntes.update(list => list.map(x => x.id === a.id ? a : x));
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

  exportarPdf(): void {
    const id     = this.apunteActual()?.id ?? this.apunteAsignadoActual?.id;
    const titulo = this.apunteActual()?.titulo ?? this.apunteAsignadoActual?.titulo ?? 'apunte';
    if (!id) return;

    this.apunteService.exportarPdf(id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `${titulo}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error al generar el PDF.', 'Cerrar', { duration: 3000 })
    });
  }

  get tagsParsados(): string[] {
    return (this.tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
  }

  // ── Editor Quill ───────────────────────────────────────────

  onEditorCreated(editor: any): void {
    this.quillInstance = editor;
  }

  onSelectionChanged(event: any): void {
    if (!event?.range || event.range.length === 0) return;
    const editor = event.editor ?? this.quillInstance;
    if (editor) this.textoSeleccionado = editor.getText(event.range.index, event.range.length);
  }

  // ── Tabla ──────────────────────────────────────────────────

  private getTableModule(): any {
    return this.quillInstance?.getModule('table');
  }

  insertarTabla(): void {
    this.getTableModule()?.insertTable(this.tablaFilas, this.tablaCols);
    this.mostrarPanelTabla = false;
    this.quillInstance?.focus();
  }

  agregarFilaAbajo(): void    { this.getTableModule()?.insertRowBelow(); }
  agregarFilaArriba(): void   { this.getTableModule()?.insertRowAbove(); }
  agregarColumnaIzq(): void   { this.getTableModule()?.insertColumnLeft(); }
  agregarColumnaDer(): void   { this.getTableModule()?.insertColumnRight(); }
  eliminarFila(): void        { this.getTableModule()?.deleteRow(); }
  eliminarColumna(): void     { this.getTableModule()?.deleteColumn(); }
  eliminarTabla(): void       { this.getTableModule()?.deleteTable(); }

  // ── IA ─────────────────────────────────────────────────────

  private stripHtml(html: string): string {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  pedirIa(): void {
    this.cargandoIa.set(true);
    this.respuestaIa.set('');

    const contenidoTexto = this.stripHtml(this.contenido);

    const req = this.modoIa === 'generacion'
        ? { modo: 'generacion' as const, tema: this.temaGeneracion, contexto: this.contextoGeneracion }
        : { modo: 'asistente' as const, accion: this.accionIa, contenidoActual: contenidoTexto, textoSeleccionado: this.textoSeleccionado };

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

  private mdToHtml(md: string): string {
    return marked(md) as string;
  }

  insertarEnEditor(): void {
    const html = this.mdToHtml(this.respuestaIa());
    if (this.quillInstance) {
      const len = this.quillInstance.getLength();
      this.quillInstance.setSelection(len - 1);
      this.quillInstance.clipboard.dangerouslyPasteHTML(len - 1, '<p><br></p>' + html);
      this.quillInstance.focus();
      this.contenido = this.quillInstance.getSemanticHTML();
    } else {
      this.contenido += (this.contenido ? '<p><br></p>' : '') + html;
    }
    this.respuestaIa.set('');
    this.snackBar.open('Texto insertado en el editor.', 'Cerrar', { duration: 2000 });
  }

  reemplazarEditor(): void {
    const html = this.mdToHtml(this.respuestaIa());
    if (this.quillInstance) {
      this.quillInstance.clipboard.dangerouslyPasteHTML(0, html);
      this.quillInstance.focus();
      this.contenido = this.quillInstance.getSemanticHTML();
    } else {
      this.contenido = html;
    }
    this.respuestaIa.set('');
    this.snackBar.open('Editor actualizado con el contenido de la IA.', 'Cerrar', { duration: 2000 });
  }
}
