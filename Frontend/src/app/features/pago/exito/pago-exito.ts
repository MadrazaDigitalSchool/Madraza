import { Component, OnInit } from '@angular/core';
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

  estado: 'verificando' | 'exito' | 'error' = 'verificando';
  mensaje = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.estado = 'error';
      this.mensaje = 'No se recibió el ID de sesión de pago.';
      return;
    }

    this.paymentService.verificarSesion(sessionId).subscribe({
      next: (res) => {
        this.estado = 'exito';
        this.mensaje = res.mensaje;
        // Actualizar el usuario en storage con suscripción activa
        this.authService.getPerfil().subscribe();
      },
      error: (err) => {
        this.estado = 'error';
        this.mensaje = err.error?.mensaje
          || 'No se pudo verificar el pago. Contacta con soporte si el problema persiste.';
      }
    });
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
