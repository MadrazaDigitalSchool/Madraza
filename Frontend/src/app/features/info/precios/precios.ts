import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './precios.html',
  styleUrl: './precios.scss'
})
export class PreciosComponent {

  planes = [
    {
      id: 'mensual',
      nombre: 'Premium Mensual',
      precio: '9,99€',
      periodo: '/mes',
      ahorro: '',
      destacado: false,
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
      id: 'anual',
      nombre: 'Premium Anual',
      precio: '79,99€',
      periodo: '/año',
      ahorro: 'Ahorra 40€',
      destacado: true,
      features: [
        'Todo lo del plan Mensual',
        'Precio bloqueado 12 meses',
        'Acceso anticipado a nuevas funciones',
        'Insignia de usuario Premium',
        'Soporte VIP por email',
        'Sin límite de intentos',
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
        'Gestión de grupos y clases',
        'Panel de administración',
        'SSO / LDAP',
        'SLA garantizado',
        'Factura y contrato',
        'Soporte dedicado'
      ]
    }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  irAPagar(planId: string): void {
    if (planId === 'institucional') {
      this.router.navigate(['/contacto']);
      return;
    }
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/registro']);
      return;
    }
    if (this.authService.tieneSubscripcion()) {
      this.router.navigate(['/perfil']);
    } else {
      this.router.navigate(['/pago/checkout'], { queryParams: { plan: planId } });
    }
  }

  getCtaLabel(planId: string): string {
    if (planId === 'institucional') return 'Contactar';
    if (!this.authService.isLoggedIn()) return 'Empezar ahora';
    return this.authService.tieneSubscripcion() ? 'Gestionar suscripción' : 'Suscribirme';
  }
}
