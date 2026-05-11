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
      id: 'mensual' as const,
      nombre: 'Premium Mensual',
      precio: '9,99€',
      periodo: '/mes',
      ahorro: '',
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
        'Exportar resultados en PDF'
      ]
    }
  ];

  constructor() {
    if (this.authService.tieneSubscripcion()) {
      this.router.navigate(['/dashboard']);
    }
  }

  seleccionarPlan(plan: 'mensual' | 'anual'): void {
    this.router.navigate(['/pago/checkout'], { queryParams: { plan } });
  }
}
