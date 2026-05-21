import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrganizacionService, Organizacion } from '../../core/services/organizacion.service';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './organizaciones.html',
  styleUrl: './organizaciones.scss'
})
export class OrganizacionesComponent implements OnInit {

  private orgService  = inject(OrganizacionService);
  private authService = inject(AuthService);
  private snackBar    = inject(MatSnackBar);

  organizaciones = signal<Organizacion[]>([]);
  cargando       = signal(true);
  esPremium      = this.authService.tieneSubscripcion();

  mostrarForm  = false;
  mostrarUnirse = false;
  fNombre      = '';
  fTipo        = 'CENTRO_EDUCATIVO';
  fDescripcion = '';
  codigoUnirse = '';
  guardando    = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.orgService.getMisOrganizaciones().subscribe({
      next: orgs => { this.organizaciones.set(orgs); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  crear(): void {
    if (!this.fNombre.trim()) { this.snackBar.open('El nombre es obligatorio', 'Cerrar', { duration: 3000 }); return; }
    this.guardando.set(true);
    this.orgService.crear(this.fNombre.trim(), this.fTipo, this.fDescripcion.trim()).subscribe({
      next: org => {
        this.cargar();
        this.guardando.set(false);
        this.mostrarForm = false;
        this.fNombre = this.fDescripcion = '';
        this.snackBar.open(`Organización "${org.nombre}" creada.`, 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.guardando.set(false);
        this.snackBar.open(err.error?.error || 'Error al crear la organización', 'Cerrar', { duration: 4000 });
      }
    });
  }

  unirse(): void {
    if (!this.codigoUnirse.trim()) return;
    this.guardando.set(true);
    this.orgService.unirsePorCodigo(this.codigoUnirse.trim()).subscribe({
      next: org => {
        this.cargar();
        this.guardando.set(false);
        this.mostrarUnirse = false;
        this.codigoUnirse = '';
        this.snackBar.open(`Te has unido a "${org.nombre}".`, 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.guardando.set(false);
        this.snackBar.open(err.error?.error || 'Código inválido', 'Cerrar', { duration: 4000 });
      }
    });
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'CENTRO_EDUCATIVO' ? 'Centro educativo' : 'Empresa';
  }
}
