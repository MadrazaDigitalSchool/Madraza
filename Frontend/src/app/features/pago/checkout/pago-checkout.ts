import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';

type MetodoPago = 'tarjeta' | 'paypal' | 'apple_pay' | 'google_pay' | 'sepa' | 'klarna';
type Estado = 'resumen' | 'cargando' | 'formulario' | 'pagando';

// Apple Pay y Google Pay son wallets de tarjeta en Stripe
const METODO_STRIPE: Record<MetodoPago, string> = {
  tarjeta:    'card',
  paypal:     'paypal',
  apple_pay:  'card',
  google_pay: 'card',
  sepa:       'sepa_debit',
  klarna:     'klarna',
};

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
  metodoPago = signal<MetodoPago>('tarjeta');
  estado       = signal<Estado>('resumen');
  errorMessage = signal('');

  planInfo = computed(() => PLANES[this.plan()]);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private subscriptionId = '';
  private paymentElement: StripePaymentElement | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private expressCheckoutElement: any = null;

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

  volverAlMetodo(): void {
    this.paymentElement?.unmount();
    this.paymentElement = null;
    this.expressCheckoutElement?.unmount();
    this.expressCheckoutElement = null;
    this.stripe = null;
    this.elements = null;
    this.subscriptionId = '';
    this.errorMessage.set('');
    this.estado.set('resumen');
  }

  iniciarPago(): void {
    this.estado.set('cargando');
    this.errorMessage.set('');

    const metodo = this.metodoPago();

    // Klarna usa Checkout Session (restricción de Stripe: no se puede modificar
    // payment_method_types en PaymentIntents generados por facturas de suscripción).
    if (metodo === 'klarna') {
      this.guardarInfoPago();
      this.paymentService.crearSesion(this.plan(), 'klarna').subscribe({
        next: ({ url }) => { window.location.href = url; },
        error: (err) => {
          this.errorMessage.set(err.error?.message || err.error?.mensaje || 'Error al conectar con Klarna.');
          this.estado.set('resumen');
        }
      });
      return;
    }

    const metodoStripe = METODO_STRIPE[metodo];
    const esWallet     = metodo === 'apple_pay' || metodo === 'google_pay';

    this.paymentService.crearIntencion(this.plan(), metodoStripe).subscribe({
      next: async ({ clientSecret, subscriptionId }) => {
        this.subscriptionId = subscriptionId;

        const stripe = await loadStripe(environment.stripePublicKey);
        if (!stripe) {
          this.errorMessage.set('No se pudo cargar el sistema de pagos. Recarga la página.');
          this.estado.set('resumen');
          return;
        }

        this.stripe   = stripe;
        this.elements = stripe.elements({ clientSecret, locale: 'es' });

        if (esWallet) {
          // Express Checkout Element: muestra el botón nativo del wallet
          // sin formulario de tarjeta (Touch ID / Face ID / Google Pay sheet)
          this.expressCheckoutElement = this.elements.create('expressCheckout', {
            wallets: {
              applePay:  metodo === 'apple_pay'  ? 'always' : 'never',
              googlePay: metodo === 'google_pay' ? 'always' : 'never',
            },
            buttonType:   { applePay: 'subscribe', googlePay: 'subscribe' },
            buttonHeight: 52,
          } as any);

          this.estado.set('formulario');
          setTimeout(() => {
            this.expressCheckoutElement.mount('#express-checkout-element');
            this.expressCheckoutElement.on('confirm', () => this.confirmarPagoWallet());
          }, 0);

        } else {
          // Payment Element para Tarjeta, PayPal y SEPA (oculta los wallets)
          this.paymentElement = this.elements.create('payment', {
            layout: { type: 'tabs', defaultCollapsed: false },
            paymentMethodOrder: [metodoStripe],
            wallets: { applePay: 'never', googlePay: 'never' },
          } as any);

          this.estado.set('formulario');
          setTimeout(() => this.paymentElement!.mount('#stripe-payment-element'), 0);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || err.error?.mensaje || 'Error al iniciar el pago. Inténtalo de nuevo.');
        this.estado.set('resumen');
      }
    });
  }

  // Confirmación para Tarjeta, PayPal, SEPA (botón manual "Confirmar pago")
  async confirmarPago(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.estado.set('pagando');
    this.errorMessage.set('');
    this.guardarInfoPago();

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

    this.activarSuscripcion();
  }

  // Confirmación para Apple Pay / Google Pay (llamada desde el evento 'confirm' del Express Checkout)
  private async confirmarPagoWallet(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.estado.set('pagando');
    this.guardarInfoPago();

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

    this.activarSuscripcion();
  }

  private activarSuscripcion(): void {
    this.paymentService.confirmarSuscripcion(this.subscriptionId).subscribe({
      next: () => {
        this.authService.getPerfil().subscribe({
          next:  () => this.router.navigate(['/pago/exito'], { queryParams: { activada: 'true' } }),
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

  private guardarInfoPago(): void {
    localStorage.setItem('madraza_pago_info', JSON.stringify({
      metodoPago: this.metodoPago(),
      plan: this.plan()
    }));
  }
}
