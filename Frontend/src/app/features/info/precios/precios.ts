import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './precios.html',
  styleUrl: './precios.scss'
})
export class PreciosComponent {
  planes = [
    {
      nombre: 'Gratuito', precio: '0€', periodo: 'para siempre', destacado: false,
      features: ['Acceso a todos los tests públicos','Crea hasta 5 tests','Historial de los últimos 30 días','Estadísticas básicas','Soporte por email'],
      cta: 'Empezar gratis', link: '/auth/registro'
    },
    {
      nombre: 'Premium', precio: '4,99€', periodo: 'mes', destacado: true,
      features: ['Todo lo del plan Gratuito','Tests ilimitados creados','Historial completo','Estadísticas avanzadas','Sin publicidad','Soporte prioritario','Exportar resultados en PDF'],
      cta: 'Próximamente', link: '#'
    },
    {
      nombre: 'Institucional', precio: 'A medida', periodo: '', destacado: false,
      features: ['Todo lo del plan Premium','Gestión de grupos y clases','Panel de administración','SSO / LDAP','SLA garantizado','Factura y contrato','Soporte dedicado'],
      cta: 'Contactar', link: '/contacto'
    }
  ];
}
