import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth';

/**
 * Componente de Login
 * @author Hafdala Mehdi Sidi
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  email = '';
  password = '';
  errorMessage = '';
  cargando = false;
  mostrarPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  login(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, rellena todos los campos';
      return;
    }
    this.cargando = true;
    this.errorMessage = '';
    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.router.navigate(['/tests']);
        },
        error: () => {
          this.cargando = false;
          this.errorMessage = 'Email o contraseña incorrectos';
        }
      });
  }
}