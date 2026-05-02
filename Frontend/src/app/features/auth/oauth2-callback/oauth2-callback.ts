import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      @if (error) {
        <div class="error-box">
          <p>{{ error }}</p>
          <a href="/auth/login">Volver al inicio de sesión</a>
        </div>
      } @else {
        <mat-spinner diameter="48"></mat-spinner>
        <p>Iniciando sesión...</p>
      }
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 16px;
      color: #6c63ff;
      font-family: 'Segoe UI', sans-serif;
    }
    .error-box {
      text-align: center;
      color: #e53935;
      a { color: #6c63ff; }
    }
  `]
})
export class OAuth2CallbackComponent implements OnInit {

  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const suscripcionActivaStr = this.route.snapshot.queryParamMap.get('suscripcionActiva');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      this.error = 'No se pudo obtener el email del proveedor. Por favor, usa otro método de acceso.';
      return;
    }

    if (!token) {
      this.error = 'No se recibió el token de autenticación.';
      return;
    }

    const suscripcionActiva = suscripcionActivaStr === 'true';
    this.authService.loginConToken(token, suscripcionActiva);

    // Cargar el perfil completo y actualizar el storage
    this.authService.getPerfil().subscribe({
      next: (usuario) => {
        if (usuario.suscripcionActiva) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/pago']);
        }
      },
      error: () => {
        // Si falla el perfil, usamos el estado que nos pasó el backend
        if (suscripcionActiva) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/pago']);
        }
      }
    });
  }
}
