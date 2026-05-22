import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IntentoService } from '../../../core/services/intento';
import { IntentoParaCorregir } from '../../../core/models/intento.model';

@Component({
  selector: 'app-corregir-test',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './corregir-test.html',
  styleUrl: './corregir-test.scss'
})
export class CorregirTestComponent implements OnInit {

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private intentoSvc   = inject(IntentoService);
  private snackBar     = inject(MatSnackBar);

  testId = 0;
  cargando = true;
  guardando = false;
  error = '';
  intentos: IntentoParaCorregir[] = [];

  // intentoId → respuestaId → true/false/null
  correcciones = new Map<number, Map<number, boolean | null>>();

  ngOnInit(): void {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.intentoSvc.getParaCorregir(this.testId).subscribe({
      next: (lista) => {
        this.intentos = lista;
        lista.forEach(i => {
          const mapa = new Map<number, boolean | null>();
          i.respuestasPendientes.forEach(r => mapa.set(r.respuestaId, null));
          this.correcciones.set(i.intentoId, mapa);
        });
        this.cargando = false;
      },
      error: () => {
        this.error = 'No tienes permiso o el test no existe.';
        this.cargando = false;
      }
    });
  }

  setCorreccion(intentoId: number, respuestaId: number, valor: boolean): void {
    this.correcciones.get(intentoId)?.set(respuestaId, valor);
  }

  getCorreccion(intentoId: number, respuestaId: number): boolean | null {
    return this.correcciones.get(intentoId)?.get(respuestaId) ?? null;
  }

  intentoCompleto(intentoId: number): boolean {
    const mapa = this.correcciones.get(intentoId);
    if (!mapa) return false;
    return [...mapa.values()].every(v => v !== null);
  }

  guardarIntento(intentoId: number): void {
    const mapa = this.correcciones.get(intentoId);
    if (!mapa) return;

    const payload: Record<number, boolean> = {};
    mapa.forEach((val, id) => { if (val !== null) payload[id] = val; });

    this.guardando = true;
    this.intentoSvc.corregir(intentoId, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.intentos = this.intentos.filter(i => i.intentoId !== intentoId);
        this.correcciones.delete(intentoId);
        this.snackBar.open('Corrección guardada correctamente.', 'Cerrar', { duration: 3000 });
        if (this.intentos.length === 0) {
          this.snackBar.open('Todos los intentos han sido corregidos.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al guardar la corrección.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  formatearFecha(iso: string): string {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
