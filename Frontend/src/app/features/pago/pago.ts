import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './pago.html',
  styleUrl: './pago.scss'
})
export class PagoComponent {

  private router = inject(Router);
  private authService = inject(AuthService);

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

  constructor() {
    if (this.authService.tieneSubscripcion()) {
      this.router.navigate(['/dashboard']);
    }
  }

  getCtaLabel(planId: string): string {
    if (planId === 'free') return 'Tu plan actual';
    if (planId === 'institucional') return 'Contactar';
    return 'Elegir este plan';
  }

  seleccionarPlan(planId: string): void {
    if (planId === 'free') return;
    if (planId === 'institucional') {
      this.router.navigate(['/contacto']);
      return;
    }
    this.router.navigate(['/pago/checkout'], { queryParams: { plan: planId } });
  }
}
