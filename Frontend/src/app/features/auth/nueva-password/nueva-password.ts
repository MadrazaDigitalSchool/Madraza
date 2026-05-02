import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-nueva-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule,
            MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './nueva-password.html',
  styleUrl: './nueva-password.scss'
})
export class NuevaPasswordComponent implements OnInit {

  password = '';
  confirmar = '';
  token = '';
  cargando = false;
  errorMessage = '';
  successMessage = '';
  mostrarPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.errorMessage = 'Enlace inválido. Solicita uno nuevo.';
    }
  }

  guardar(): void {
    if (this.password.length < 8) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }
    if (this.password !== this.confirmar) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    this.authService.nuevaPassword(this.token, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.successMessage = 'Contraseña actualizada. Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.error?.mensaje || 'El enlace ha expirado o es inválido';
      }
    });
  }
}
