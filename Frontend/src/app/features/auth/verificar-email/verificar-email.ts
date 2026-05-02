import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './verificar-email.html',
  styleUrl: './verificar-email.scss'
})
export class VerificarEmailComponent implements OnInit {

  estado: 'cargando' | 'exito' | 'error' = 'cargando';
  mensaje = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado = 'error';
      this.mensaje = 'Enlace de verificación inválido';
      return;
    }

    this.authService.verificarEmail(token).subscribe({
      next: (res) => {
        this.estado = 'exito';
        this.mensaje = res.mensaje || 'Email verificado correctamente';
      },
      error: (err) => {
        this.estado = 'error';
        this.mensaje = err.error?.mensaje || 'El enlace es inválido o ha expirado';
      }
    });
  }
}
