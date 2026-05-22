import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestService } from '../../../core/services/test';
import { OrganizacionService, Organizacion } from '../../../core/services/organizacion.service';
import { AuthService } from '../../../core/services/auth';
import { LimitesFreePlan } from '../../../core/models/usuario.model';

interface OpcionForm {
  texto: string;
  esCorrecta: boolean;
  orden: number;
}

interface PreguntaForm {
  enunciado: string;
  tipo: 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'TEXTO_LIBRE';
  orden: number;
  puntos: number;
  explicacion: string;
  opciones: OpcionForm[];
}

@Component({
  selector: 'app-crear-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './crear-test.html',
  styleUrl: './crear-test.scss'
})
export class CrearTestComponent implements OnInit {

  titulo = '';
  descripcion = '';
  categoria = '';
  dificultad: 'BAJA' | 'MEDIA' | 'ALTA' = 'MEDIA';
  tiempoLimite: number | null = null;
  visibilidad: 'PUBLICO' | 'PRIVADO' | 'ORGANIZACION' = 'PUBLICO';
  organizacionId: number | null = null;

  preguntas: PreguntaForm[] = [];

  enviando = false;
  categoriasSugeridas: string[] = [];
  misOrgsAdmin: Organizacion[] = [];
  limiteAlcanzado = false;
  limitesInfo: LimitesFreePlan | null = null;

  private testService   = inject(TestService);
  private orgService    = inject(OrganizacionService);
  private authService   = inject(AuthService);
  private router        = inject(Router);
  private route         = inject(ActivatedRoute);
  private snackBar      = inject(MatSnackBar);

  ngOnInit(): void {
    this.testService.getTestsPublicos().subscribe({
      next: (tests) => {
        this.categoriasSugeridas = [...new Set(tests.map(t => t.categoria))].sort();
      }
    });
    const userId = this.authService.getUsuarioActual()?.id;
    this.orgService.getMisOrganizaciones().subscribe({
      next: orgs => {
        this.misOrgsAdmin = orgs.filter(o => o.adminId === userId);
      }
    });
    if (!this.authService.tieneSubscripcion()) {
      this.authService.getLimites().subscribe({
        next: (l) => {
          this.limitesInfo = l;
          this.limiteAlcanzado = (l.testsCreados ?? 0) >= (l.limiteTests ?? 3);
        }
      });
    }
    const orgId = this.route.snapshot.queryParamMap.get('orgId');
    if (orgId) {
      this.visibilidad = 'ORGANIZACION';
      this.organizacionId = Number(orgId);
    }
    this.agregarPregunta();
  }

  agregarPregunta(): void {
    this.preguntas.push({
      enunciado: '',
      tipo: 'OPCION_MULTIPLE',
      orden: this.preguntas.length + 1,
      puntos: 1,
      explicacion: '',
      opciones: [
        { texto: '', esCorrecta: false, orden: 1 },
        { texto: '', esCorrecta: false, orden: 2 },
        { texto: '', esCorrecta: false, orden: 3 },
        { texto: '', esCorrecta: false, orden: 4 }
      ]
    });
  }

  eliminarPregunta(index: number): void {
    this.preguntas.splice(index, 1);
    this.preguntas.forEach((p, i) => (p.orden = i + 1));
  }

  agregarOpcion(pregunta: PreguntaForm): void {
    pregunta.opciones.push({
      texto: '',
      esCorrecta: false,
      orden: pregunta.opciones.length + 1
    });
  }

  eliminarOpcion(pregunta: PreguntaForm, index: number): void {
    if (pregunta.opciones.length <= 2) return;
    pregunta.opciones.splice(index, 1);
    pregunta.opciones.forEach((o, i) => (o.orden = i + 1));
  }

  marcarCorrecta(pregunta: PreguntaForm, index: number): void {
    pregunta.opciones.forEach((o, i) => (o.esCorrecta = i === index));
  }

  onTipoChange(pregunta: PreguntaForm): void {
    if (pregunta.tipo === 'VERDADERO_FALSO') {
      pregunta.opciones = [
        { texto: 'Verdadero', esCorrecta: true, orden: 1 },
        { texto: 'Falso', esCorrecta: false, orden: 2 }
      ];
    } else if (pregunta.tipo === 'TEXTO_LIBRE') {
      pregunta.opciones = [];
    } else if (pregunta.opciones.length === 0) {
      pregunta.opciones = [
        { texto: '', esCorrecta: false, orden: 1 },
        { texto: '', esCorrecta: false, orden: 2 }
      ];
    }
  }

  get esValido(): boolean {
    if (!this.titulo.trim() || !this.categoria.trim()) return false;
    if (this.visibilidad === 'ORGANIZACION' && !this.organizacionId) return false;
    if (this.preguntas.length === 0) return false;
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
    if (!this.esValido || this.enviando) return;
    this.enviando = true;

    const payload = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim() || null,
      categoria: this.categoria.trim(),
      dificultad: this.dificultad,
      tiempoLimite: this.tiempoLimite ? this.tiempoLimite * 60 : null,
      visibilidad: this.visibilidad,
      organizacionId: this.visibilidad === 'ORGANIZACION' ? this.organizacionId : null,
      preguntas: this.preguntas.map(p => ({
        enunciado: p.enunciado.trim(),
        tipo: p.tipo,
        orden: p.orden,
        puntos: p.puntos,
        explicacion: p.explicacion.trim() || null,
        opciones: p.opciones.map(o => ({
          texto: o.texto.trim(),
          esCorrecta: o.esCorrecta,
          orden: o.orden
        }))
      }))
    };

    this.testService.crearTest(payload).subscribe({
      next: (test) => this.router.navigate(['/tests', test.id]),
      error: (err: any) => {
        const msg = err.error?.error || 'No se pudo crear el test. Inténtalo de nuevo.';
        const sb = this.snackBar.open(msg, 'Ver planes', { duration: 7000 });
        sb.onAction().subscribe(() => this.router.navigate(['/precios']));
        this.enviando = false;
      }
    });
  }
}
