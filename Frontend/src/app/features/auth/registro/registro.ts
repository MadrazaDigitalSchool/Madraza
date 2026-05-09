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
import { environment } from '../../../../environments/environment';

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

  readonly googleOAuthUrl = `${environment.backendUrl}/oauth2/authorize/google`;
  readonly githubOAuthUrl = `${environment.backendUrl}/oauth2/authorize/github`;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  private readonly NOMBRE_REGEX = /^[a-zA-ZÀ-ÿñÑ'\s-]+$/;
  private readonly EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private readonly PASS_REGEX   = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

  registro(): void {
    const nombre    = this.nombre.trim();
    const apellidos = this.apellidos.trim();
    const email     = this.email.trim().toLowerCase();
    const password  = this.password;

    if (!nombre || !apellidos || !email || !password) {
      this.errorMessage = 'Por favor, rellena todos los campos';
      return;
    }
    if (!this.NOMBRE_REGEX.test(nombre)) {
      this.errorMessage = 'El nombre solo puede contener letras, espacios y guiones';
      return;
    }
    if (!this.NOMBRE_REGEX.test(apellidos)) {
      this.errorMessage = 'Los apellidos solo pueden contener letras, espacios y guiones';
      return;
    }
    if (!this.EMAIL_REGEX.test(email)) {
      this.errorMessage = 'Introduce un correo electrónico válido';
      return;
    }
    if (!this.PASS_REGEX.test(password)) {
      this.errorMessage = 'La contraseña debe tener mínimo 8 caracteres, al menos una letra y un número';
      return;
    }
    this.nombre    = nombre;
    this.apellidos = apellidos;
    this.email     = email;
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
        if (this.recordarme) {
          localStorage.setItem('rememberedEmail', this.email);
        }
        this.successMessage = '¡Cuenta creada! Revisa tu email para confirmarla. Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.error?.message || err.error?.mensaje || err.error?.error || 'Error al crear la cuenta';
      }
    });
  }
}
