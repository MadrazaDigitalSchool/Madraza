import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { OrganizacionService, MiAsignacion } from '../../core/services/organizacion.service';

@Component({
  selector: 'app-mis-asignaciones',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatChipsModule],
  templateUrl: './mis-asignaciones.html',
  styleUrl: './mis-asignaciones.scss'
})
export class MisAsignacionesComponent implements OnInit {

  private orgService = inject(OrganizacionService);

  asignaciones = signal<MiAsignacion[]>([]);
  cargando     = signal(true);

  get pendientes(): MiAsignacion[] { return this.asignaciones().filter(a => a.estado === 'PENDIENTE'); }
  get completadas(): MiAsignacion[] { return this.asignaciones().filter(a => a.estado === 'COMPLETADO'); }

  ngOnInit(): void {
    this.orgService.getMisAsignaciones().subscribe({
      next: list => { this.asignaciones.set(list); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  estaProxima(fechaLimite: string | null): boolean {
    if (!fechaLimite) return false;
    const diff = new Date(fechaLimite).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  }

  estaVencida(fechaLimite: string | null): boolean {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < new Date();
  }
}
