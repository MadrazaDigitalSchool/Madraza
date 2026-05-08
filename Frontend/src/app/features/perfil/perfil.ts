import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
  public authService = inject(AuthService);
  private destroyRef  = inject(DestroyRef);

  usuario: Usuario | null = null;
  nombre = '';
  apellidos = '';
  email = '';
  metodoPago = '';
  planTipo = '';
  guardando = false;
  guardado = false;
  error = '';
  cargando = !this.authService.getUsuarioActual();

  ngOnInit(): void {
    try {
      const pagoInfo = JSON.parse(localStorage.getItem('madraza_pago_info') || '{}');
      this.metodoPago = pagoInfo.metodoPago || '';
      this.planTipo   = pagoInfo.plan || '';
    } catch { /* ignore */ }

    const cached = this.authService.getUsuarioActual();
    if (cached) {
      this.usuario   = cached;
      this.nombre    = cached.nombre    ?? '';
      this.apellidos = cached.apellidos ?? '';
      this.email     = cached.email     ?? '';
      this.cargando  = false;
    }

    // Solo refresca desde la API si la caché no tiene datos completos (ej: OAuth)
    if (!cached?.nombre && !cached?.email) {
      this.authService.getPerfil().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (u: Usuario) => {
          this.usuario   = u;
          this.nombre    = u.nombre    ?? '';
          this.apellidos = u.apellidos ?? '';
          this.email     = u.email     ?? '';
          this.cargando  = false;
        },
        error: () => { this.cargando = false; }
      });
    }
  }

  getIniciales(): string {
    if (!this.nombre) return 'U';
    return this.nombre.charAt(0).toUpperCase();
  }

  esPremium(): boolean {
    if (!this.usuario?.suscripcionActiva) return false;
    if (this.usuario.suscripcionExpiry) {
      return new Date(this.usuario.suscripcionExpiry) > new Date();
    }
    return true;
  }

  getFechaExpiry(): Date | null {
    if (!this.usuario?.suscripcionExpiry) return null;
    return new Date(this.usuario.suscripcionExpiry);
  }

  getPlanLabel(): string {
    if (this.planTipo === 'anual') return 'Premium Anual';
    if (this.planTipo === 'mensual') return 'Premium Mensual';
    return 'Premium';
  }

  getMetodoPagoLabel(): string {
    const labels: Record<string, string> = {
      tarjeta:    '💳 Tarjeta',
      paypal:     '🅿 PayPal',
      apple_pay:  '🍎 Apple Pay',
      google_pay: '🔵 Google Pay',
      sepa:       '🏦 Adeudo SEPA',
      klarna:     '🛍 Klarna',
    };
    return labels[this.metodoPago] || this.metodoPago;
  }

  getDiasRestantes(): number | null {
    const expiry = this.getFechaExpiry();
    if (!expiry) return null;
    const diff = expiry.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isAdmin(): boolean {
    return this.authService.tieneRol('ROLE_ADMIN');
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
        const nuevo: Usuario = { ...datosActuales!, nombre: u.nombre, apellidos: u.apellidos };
        this.authService.guardarUsuarioLocal(nuevo);
        this.usuario = { ...this.usuario!, nombre: u.nombre, apellidos: u.apellidos };
        setTimeout(() => (this.guardado = false), 3000);
      },
      error: () => { this.guardando = false; this.error = 'No se pudo actualizar el perfil.'; }
    });
  }
}
