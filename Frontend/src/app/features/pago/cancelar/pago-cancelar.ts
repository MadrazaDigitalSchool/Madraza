import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-pago-cancelar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="cancelar-container">
      <div class="card">
        <img src="/assets/madraza-vector.svg" alt="Madraza" class="logo" />
        <div class="icono"><mat-icon>cancel</mat-icon></div>
        <h2>Pago cancelado</h2>
        <p>No se ha realizado ningún cargo. Puedes volver a suscribirte cuando quieras.</p>
        <a mat-flat-button routerLink="/precios" class="btn-volver">Ver planes</a>
        <button type="button" class="link-logout" (click)="authService.logout()">Cerrar sesión</button>
      </div>
    </div>
  `,
  styles: [`
    .cancelar-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff5f5 0%, #e8e6ff 100%);
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 52px 40px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      font-family: 'Segoe UI', sans-serif;
    }
    .logo { height: 44px; }
    .icono mat-icon { font-size: 72px; width: 72px; height: 72px; color: #f59e0b; }
    h2 { margin: 0; font-size: 24px; color: #1a1a2e; font-weight: 700; }
    p { margin: 0; color: #666; font-size: 15px; line-height: 1.6; }
    .btn-volver {
      background: linear-gradient(135deg, #6c63ff, #a855f7);
      color: white;
      border-radius: 50px;
      height: 48px;
      font-weight: 700;
      font-size: 15px;
      padding: 0 32px;
    }
    .link-logout { background: none; border: none; padding: 0; cursor: pointer; color: #999; font-size: 13px; font-family: inherit; }
    .link-logout:hover { color: #6c63ff; }
  `]
})
export class PagoCancelarComponent {
  public authService = inject(AuthService);
}
