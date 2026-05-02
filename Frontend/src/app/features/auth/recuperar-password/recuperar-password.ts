import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.scss'
})
export class RecuperarPasswordComponent {
  email = '';
  enviado = false;
  cargando = false;
  error = '';

  constructor(private authService: AuthService) {}

  enviar(): void {
    if (!this.email) return;
    this.cargando = true;
    this.error = '';
    this.authService.recuperarPassword(this.email).subscribe({
      next: () => { this.enviado = true; this.cargando = false; },
      error: () => { this.error = 'No se encontró ninguna cuenta con ese email.'; this.cargando = false; }
    });
  }
}
