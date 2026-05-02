import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TestService } from '../../../core/services/test';

interface OpcionForm { texto: string; esCorrecta: boolean; orden: number; id?: number; }
interface PreguntaForm {
  id?: number;
  enunciado: string;
  tipo: 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'TEXTO_LIBRE';
  orden: number;
  puntos: number;
  explicacion: string;
  opciones: OpcionForm[];
}

@Component({
  selector: 'app-editar-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './editar-test.html',
  styleUrl: './editar-test.scss'
})
export class EditarTestComponent implements OnInit {

  testId: number | null = null;
  titulo = '';
  descripcion = '';
  categoria = '';
  dificultad: 'BAJA' | 'MEDIA' | 'ALTA' = 'MEDIA';
  tiempoLimite: number | null = null;
  visibilidad: 'PUBLICO' | 'PRIVADO' = 'PUBLICO';
  preguntas: PreguntaForm[] = [];
  cargando = true;
  enviando = false;
  error = '';
  categoriasSugeridas: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService
  ) {}

  ngOnInit(): void {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));
    this.testService.getTestsPublicos().subscribe({
      next: (tests) => {
        this.categoriasSugeridas = [...new Set(tests.map(t => t.categoria))].sort();
      }
    });
    this.testService.getTestById(this.testId).subscribe({
      next: (test) => {
        this.titulo = test.titulo;
        this.descripcion = test.descripcion ?? '';
        this.categoria = test.categoria;
        this.dificultad = test.dificultad;
        this.tiempoLimite = test.tiempoLimite ? Math.round(test.tiempoLimite / 60) : null;
        this.visibilidad = test.visibilidad;
        this.preguntas = (test.preguntas ?? []).map(p => ({
          id: p.id,
          enunciado: p.enunciado,
          tipo: p.tipo,
          orden: p.orden,
          puntos: p.puntos,
          explicacion: p.explicacion ?? '',
          opciones: (p.opciones ?? []).map(o => ({ id: o.id, texto: o.texto, esCorrecta: o.esCorrecta, orden: o.orden }))
        }));
        this.cargando = false;
      },
      error: () => { this.error = 'No se pudo cargar el test'; this.cargando = false; }
    });
  }

  agregarPregunta(): void {
    this.preguntas.push({
      enunciado: '', tipo: 'OPCION_MULTIPLE', orden: this.preguntas.length + 1, puntos: 1, explicacion: '',
      opciones: [
        { texto: '', esCorrecta: false, orden: 1 },
        { texto: '', esCorrecta: false, orden: 2 },
        { texto: '', esCorrecta: false, orden: 3 },
        { texto: '', esCorrecta: false, orden: 4 }
      ]
    });
  }

  eliminarPregunta(i: number): void {
    this.preguntas.splice(i, 1);
    this.preguntas.forEach((p, idx) => (p.orden = idx + 1));
  }

  agregarOpcion(p: PreguntaForm): void {
    p.opciones.push({ texto: '', esCorrecta: false, orden: p.opciones.length + 1 });
  }

  eliminarOpcion(p: PreguntaForm, i: number): void {
    if (p.opciones.length <= 2) return;
    p.opciones.splice(i, 1);
    p.opciones.forEach((o, idx) => (o.orden = idx + 1));
  }

  marcarCorrecta(p: PreguntaForm, i: number): void {
    p.opciones.forEach((o, idx) => (o.esCorrecta = idx === i));
  }

  onTipoChange(p: PreguntaForm): void {
    if (p.tipo === 'VERDADERO_FALSO') {
      p.opciones = [{ texto: 'Verdadero', esCorrecta: true, orden: 1 }, { texto: 'Falso', esCorrecta: false, orden: 2 }];
    } else if (p.tipo === 'TEXTO_LIBRE') {
      p.opciones = [];
    } else if (!p.opciones.length) {
      p.opciones = [{ texto: '', esCorrecta: false, orden: 1 }, { texto: '', esCorrecta: false, orden: 2 }];
    }
  }

  get esValido(): boolean {
    if (!this.titulo.trim() || !this.categoria.trim() || !this.preguntas.length) return false;
    return this.preguntas.every(p => {
      if (!p.enunciado.trim()) return false;
      if (p.tipo !== 'TEXTO_LIBRE') {
        if (p.opciones.length < 2) return false;
        if (!p.opciones.some(o => o.esCorrecta)) return false;
        if (p.opciones.some(o => !o.texto.trim())) return false;
      }
      return true;
    });
  }

  guardar(): void {
    if (!this.esValido || this.enviando || !this.testId) return;
    this.enviando = true;
    this.error = '';

    const payload = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim() || null,
      categoria: this.categoria.trim(),
      dificultad: this.dificultad,
      tiempoLimite: this.tiempoLimite ? this.tiempoLimite * 60 : null,
      visibilidad: this.visibilidad,
      preguntas: this.preguntas.map(p => ({
        enunciado: p.enunciado.trim(), tipo: p.tipo, orden: p.orden, puntos: p.puntos,
        explicacion: p.explicacion.trim() || null,
        opciones: p.opciones.map(o => ({ texto: o.texto.trim(), esCorrecta: o.esCorrecta, orden: o.orden }))
      }))
    };

    this.testService.actualizarTest(this.testId, payload).subscribe({
      next: (test) => this.router.navigate(['/tests', test.id]),
      error: () => { this.error = 'No se pudo actualizar el test.'; this.enviando = false; }
    });
  }
}
