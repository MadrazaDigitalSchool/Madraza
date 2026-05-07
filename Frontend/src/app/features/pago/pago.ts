import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pago.html',
  styleUrl: './pago.scss'
})
export class PagoComponent {

  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private authService = inject(AuthService);

  cargandoPlan = signal<'mensual' | 'anual' | null>(null);
  errorMessage = signal('');

  planes = [
    {
      id: 'mensual' as const,
      nombre: 'Premium Mensual',
      precio: '9,99€',
      periodo: '/mes',
      ahorro: '',
      features: [
        'Acceso completo a todos los tests',
        'Crea tests ilimitados',
        'Historial completo de intentos',
        'Estadísticas avanzadas',
        'Sin publicidad',
        'Exportar resultados en PDF',
        'Soporte prioritario'
      ]
    },
    {
      id: 'anual' as const,
      nombre: 'Premium Anual',
      precio: '79,99€',
      periodo: '/año',
      ahorro: 'Ahorra 40€ vs mensual',
      features: [
        'Todo lo del plan Mensual',
        'Precio bloqueado 12 meses',
        'Acceso anticipado a nuevas funciones',
        'Insignia de usuario Premium',
        'Soporte VIP por email',
        'Sin límite de intentos',
        'Exportar resultados en PDF'
      ]
    }
  ];

  constructor() {
    if (this.authService.tieneSubscripcion()) {
      this.router.navigate(['/dashboard']);
    }
  }

  pagar(plan: 'mensual' | 'anual'): void {
    this.cargandoPlan.set(plan);
    this.errorMessage.set('');

    this.paymentService.crearSesion(plan).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err) => {
        this.cargandoPlan.set(null);
        this.errorMessage.set(
          err.error?.mensaje || 'Error al iniciar el pago. Por favor, inténtalo de nuevo.'
        );
      }
    });
  }
}
