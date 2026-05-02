import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
  public authService = inject(AuthService);

  usuario: Usuario | null = null;
  nombre = '';
  apellidos = '';
  email = '';
  guardando = false;
  guardado = false;
  error = '';

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    if (this.usuario) {
      this.nombre = this.usuario.nombre ?? '';
      this.apellidos = this.usuario.apellidos ?? '';
      this.email = this.usuario.email ?? '';
    }
    this.authService.getPerfil().subscribe({
      next: (u: Usuario) => {
        this.usuario = u;
        this.nombre = u.nombre ?? '';
        this.apellidos = u.apellidos ?? '';
        this.email = u.email ?? '';
      },
      error: () => {}
    });
  }

  getIniciales(): string {
    if (!this.nombre) return 'U';
    return this.nombre.charAt(0).toUpperCase();
  }

  guardarPerfil(): void {
    if (!this.nombre.trim()) return;
    this.guardando = true;
    this.error = '';
    this.authService.actualizarPerfil({ nombre: this.nombre.trim(), apellidos: this.apellidos.trim() }).subscribe({
      next: (u: Usuario) => {
        this.guardando = false;
        this.guardado = true;
        const datosActuales = this.authService.getUsuarioActual();
        const nuevo: Usuario = {
          id: datosActuales?.id ?? 0,
          nombre: u.nombre,
          apellidos: u.apellidos,
          email: datosActuales?.email ?? '',
          emailVerificado: datosActuales?.emailVerificado ?? false,
          roles: datosActuales?.roles ?? []
        };
        this.authService.guardarUsuarioLocal(nuevo);
        setTimeout(() => (this.guardado = false), 3000);
      },
      error: () => { this.guardando = false; this.error = 'No se pudo actualizar el perfil.'; }
    });
  }
}
