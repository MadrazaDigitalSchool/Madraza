import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pago.html',
  styleUrl: './pago.scss'
})
export class PagoComponent {

  private router         = inject(Router);
  private authService    = inject(AuthService);
  private paymentService = inject(PaymentService);
  private snackBar       = inject(MatSnackBar);

  esPremium   = this.authService.tieneSubscripcion();
  planActual  = this.authService.getUsuarioActual()?.planTipo?.toLowerCase() ?? '';
  cambiando   = signal(false);

  planes = [
    {
      id: 'free',
      nombre: 'Gratis',
      precio: '0€',
      periodo: 'para siempre',
      ahorro: '',
      destacado: false,
      features: [
        'Acceso a todos los recursos públicos',
        'Hasta 3 recursos creados',
        '10 exámenes por mes',
        'Historial básico de intentos',
        'Unirte a organizaciones por invitación'
      ]
    },
    {
      id: 'mensual',
      nombre: 'Premium Mensual',
      precio: '9,99€',
      periodo: '/mes',
      ahorro: '',
      destacado: false,
      features: [
        'Acceso completo a todos los recursos',
        'Recursos ilimitados',
        'Exámenes ilimitados',
        'Historial completo de intentos',
        'Apuntes con asistencia de IA',
        'Crear y gestionar organizaciones',
        'Estadísticas avanzadas',
        'Soporte prioritario'
      ]
    },
    {
      id: 'anual',
      nombre: 'Premium Anual',
      precio: '79,99€',
      periodo: '/año',
      ahorro: 'Ahorra 40€ vs mensual',
      destacado: true,
      features: [
        'Todo lo del plan Mensual',
        'Precio bloqueado 12 meses',
        'Acceso anticipado a nuevas funciones',
        'Insignia de usuario Premium',
        'Soporte VIP por email',
        'Exportar resultados en PDF'
      ]
    },
    {
      id: 'institucional',
      nombre: 'Institucional',
      precio: 'A medida',
      periodo: '',
      ahorro: '',
      destacado: false,
      features: [
        'Todo lo del plan Anual',
        'Gestión avanzada de grupos y clases',
        'Panel de administración dedicado',
        'SSO / LDAP',
        'SLA garantizado',
        'Factura y contrato',
        'Soporte dedicado'
      ]
    }
  ];

  getCtaLabel(planId: string): string {
    if (planId === 'institucional') return 'Contactar';
    if (this.esPremium) {
      if (planId === 'free') return 'Cancelar suscripción';
      if (planId === this.planActual) return 'Plan actual';
      return planId === 'anual' ? 'Mejorar a Anual' : 'Cambiar a Mensual';
    }
    if (planId === 'free') return 'Tu plan actual';
    return 'Elegir este plan';
  }

  isPlanActual(planId: string): boolean {
    return this.esPremium && planId === this.planActual;
  }

  seleccionarPlan(planId: string): void {
    if (planId === 'institucional') {
      this.router.navigate(['/contacto']);
      return;
    }

    if (this.esPremium) {
      if (planId === 'free') {
        this.router.navigate(['/perfil']);
        return;
      }
      if (planId === this.planActual) return;
      this.cambiarPlan(planId as 'mensual' | 'anual');
      return;
    }

    if (planId === 'free') return;
    this.router.navigate(['/pago/checkout'], { queryParams: { plan: planId } });
  }

  private cambiarPlan(plan: 'mensual' | 'anual'): void {
    this.cambiando.set(true);
    this.paymentService.cambiarPlan(plan).subscribe({
      next: (res) => {
        this.cambiando.set(false);
        const u = this.authService.getUsuarioActual();
        if (u) {
          this.authService.guardarUsuarioLocal({ ...u, planTipo: res.planTipo, suscripcionExpiry: res.suscripcionExpiry });
          this.planActual = res.planTipo?.toLowerCase() ?? '';
        }
        this.snackBar.open('Plan actualizado correctamente.', 'Cerrar', { duration: 4000 });
      },
      error: (err) => {
        this.cambiando.set(false);
        const msg = err.error?.message || 'No se pudo cambiar el plan. Inténtalo de nuevo.';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }
}
