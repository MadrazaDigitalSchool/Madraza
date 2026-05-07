import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';

type MetodoPago = 'tarjeta' | 'bizum';
type Estado = 'resumen' | 'cargando' | 'formulario' | 'pagando' | 'redirigiendo';

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

  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private paymentService = inject(PaymentService);
  private authService    = inject(AuthService);

  plan         = signal<'mensual' | 'anual'>('mensual');
  metodoPago   = signal<MetodoPago>('tarjeta');
  estado       = signal<Estado>('resumen');
  errorMessage = signal('');

  planInfo = computed(() => PLANES[this.plan()]);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private subscriptionId = '';

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
    this.plan.set(planParam === 'anual' ? 'anual' : 'mensual');
  }

  cambiarPlan(): void {
    this.router.navigate(['/precios']);
  }

  iniciarPago(): void {
    if (this.metodoPago() === 'bizum') {
      this.iniciarPagoBizum();
      return;
    }
    this.iniciarPagoTarjeta();
  }

  private iniciarPagoTarjeta(): void {
    this.estado.set('cargando');
    this.errorMessage.set('');

    this.paymentService.crearIntencion(this.plan()).subscribe({
      next: async ({ clientSecret, subscriptionId }) => {
        this.subscriptionId = subscriptionId;

        const stripe = await loadStripe(environment.stripePublicKey);
        if (!stripe) {
          this.errorMessage.set('No se pudo cargar el sistema de pagos. Recarga la página.');
          this.estado.set('resumen');
          return;
        }

        this.stripe = stripe;
        this.elements = stripe.elements({ clientSecret, locale: 'es' });
        const paymentElement = this.elements.create('payment');

        this.estado.set('formulario');

        setTimeout(() => paymentElement.mount('#stripe-payment-element'), 0);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || err.error?.mensaje || 'Error al iniciar el pago. Inténtalo de nuevo.');
        this.estado.set('resumen');
      }
    });
  }

  private iniciarPagoBizum(): void {
    this.estado.set('redirigiendo');
    this.errorMessage.set('');

    this.paymentService.crearSesion(this.plan(), 'bizum').subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || err.error?.mensaje || 'Error al iniciar el pago con Bizum.');
        this.estado.set('resumen');
      }
    });
  }

  async confirmarPago(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.estado.set('pagando');
    this.errorMessage.set('');

    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/pago/exito?subscription_id=${this.subscriptionId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      this.errorMessage.set(error.message || 'Error al procesar el pago.');
      this.estado.set('formulario');
      return;
    }

    // Pago completado sin redirección (tarjeta sin 3DS)
    this.paymentService.confirmarSuscripcion(this.subscriptionId).subscribe({
      next: () => {
        this.authService.getPerfil().subscribe({
          next: () => this.router.navigate(['/pago/exito'], { queryParams: { activada: 'true' } }),
          error: () => this.router.navigate(['/pago/exito'], { queryParams: { activada: 'true' } })
        });
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message || err.error?.mensaje ||
          'Pago realizado, pero no se pudo activar la suscripción. Contacta con soporte.'
        );
        this.estado.set('formulario');
      }
    });
  }
}
