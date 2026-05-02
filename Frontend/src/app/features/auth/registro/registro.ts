import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth';

/**
 * Componente de Registro
 * @author Hafdala Mehdi Sidi
 */
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class RegistroComponent {

  nombre = '';
  apellidos = '';
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  cargando = false;
  mostrarPassword = false;
  recordarme = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  registro(): void {
    if (!this.nombre || !this.apellidos || !this.email || !this.password) {
      this.errorMessage = 'Por favor, rellena todos los campos';
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }
    this.cargando = true;
    this.errorMessage = '';
    this.authService.registro({
      nombre: this.nombre,
      apellidos: this.apellidos,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.successMessage = '¡Cuenta creada! Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.error?.error ?? 'Error al crear la cuenta';
      }
    });
  }
}