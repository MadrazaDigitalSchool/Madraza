import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth';

const PLANES = {
  mensual: {
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
  anual: {
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
};

@Component({
  selector: 'app-pago-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pago-checkout.html',
  styleUrl: './pago-checkout.scss'
})
export class PagoCheckoutComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  plan = signal<'mensual' | 'anual'>('mensual');
  cargando = signal(false);
  errorMessage = signal('');

  planInfo = computed(() => PLANES[this.plan()]);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/registro']);
      return;
    }
    if (this.authService.tieneSubscripcion()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    const planParam = this.route.snapshot.queryParamMap.get('plan');
    if (planParam === 'anual') {
      this.plan.set('anual');
    } else {
      this.plan.set('mensual');
    }
  }

  cambiarPlan(): void {
    this.router.navigate(['/precios']);
  }

  pagar(): void {
    this.cargando.set(true);
    this.errorMessage.set('');

    this.paymentService.crearSesion(this.plan()).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(
          err.error?.mensaje || 'Error al iniciar el pago. Por favor, inténtalo de nuevo.'
        );
      }
    });
  }
}
