import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-pago-exito',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pago-exito.html',
  styleUrl: './pago-exito.scss'
})
export class PagoExitoComponent implements OnInit {

  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private paymentService = inject(PaymentService);
  private authService    = inject(AuthService);

  estado  = signal<'verificando' | 'activando' | 'exito' | 'error'>('verificando');
  mensaje = signal('');

  ngOnInit(): void {
    const params       = this.route.snapshot.queryParamMap;
    const activada     = params.get('activada');           // flujo directo (sin redirect)
    const subscriptionId = params.get('subscription_id');  // flujo redirect (3DS)
    const redirectStatus = params.get('redirect_status');  // valor 'succeeded' de Stripe
    const sessionId     = params.get('session_id');        // flujo Checkout Session (Bizum)

    if (activada === 'true') {
      this.estado.set('activando');
      this.authService.getPerfil().subscribe({
        next: () => this.estado.set('exito'),
        error: () => this.estado.set('exito')
      });
      return;
    }

    if (subscriptionId && redirectStatus === 'succeeded') {
      this.estado.set('activando');
      this.paymentService.confirmarSuscripcion(subscriptionId).subscribe({
        next: (res) => {
          this.mensaje.set(res.mensaje);
          this.authService.getPerfil().subscribe({
            next: () => this.estado.set('exito'),
            error: () => this.estado.set('exito')
          });
        },
        error: (err) => {
          this.estado.set('error');
          this.mensaje.set(
            err.error?.message || err.error?.mensaje ||
            'No se pudo activar la suscripción. Contacta con soporte si el cargo fue realizado.'
          );
        }
      });
      return;
    }

    if (sessionId) {
      this.estado.set('activando');
      this.paymentService.verificarSesion(sessionId).subscribe({
        next: (res) => {
          this.mensaje.set(res.mensaje);
          this.authService.getPerfil().subscribe({
            next: () => this.estado.set('exito'),
            error: () => this.estado.set('exito')
          });
        },
        error: (err) => {
          this.estado.set('error');
          this.mensaje.set(
            err.error?.message || err.error?.mensaje ||
            'No se pudo verificar el pago. Contacta con soporte si el cargo fue realizado.'
          );
        }
      });
      return;
    }

    this.estado.set('error');
    this.mensaje.set('No se pudo verificar el pago. Si realizaste un pago, contacta con soporte.');
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
