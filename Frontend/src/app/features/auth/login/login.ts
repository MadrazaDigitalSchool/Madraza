import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {

  email = '';
  password = '';
  errorMessage = '';
  cargando = false;
  mostrarPassword = false;
  recordarme = false;

  readonly googleOAuthUrl = `${environment.backendUrl}/oauth2/authorize/google`;
  readonly githubOAuthUrl = `${environment.backendUrl}/oauth2/authorize/github`;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.recordarme = true;
    }
  }

  login(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, rellena todos los campos';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }, this.recordarme)
      .subscribe({
        next: () => {
          this.cargando = false;
          if (this.recordarme) {
            localStorage.setItem('rememberedEmail', this.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          if (this.authService.tieneRol('ROLE_ADMIN')) {
            this.router.navigate(['/admin']);
          } else if (this.authService.tieneSubscripcion()) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/pago']);
          }
        },
        error: () => {
          this.cargando = false;
          this.errorMessage = 'Email o contraseña incorrectos';
        }
      });
  }
}
