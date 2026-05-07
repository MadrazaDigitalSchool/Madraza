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

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  estado = signal<'verificando' | 'exito' | 'error'>('verificando');
  mensaje = signal('');

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.estado.set('error');
      this.mensaje.set('No se recibió el ID de sesión de pago.');
      return;
    }

    this.paymentService.verificarSesion(sessionId).subscribe({
      next: (res) => {
        this.estado.set('exito');
        this.mensaje.set(res.mensaje);
        this.authService.getPerfil().subscribe();
      },
      error: (err) => {
        this.estado.set('error');
        this.mensaje.set(
          err.error?.mensaje || 'No se pudo verificar el pago. Contacta con soporte si el problema persiste.'
        );
      }
    });
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
