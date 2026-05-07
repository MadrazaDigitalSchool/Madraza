import { Component, HostListener, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth';
import { Usuario } from '../../../core/models/usuario.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  usuario = signal<Usuario | null>(null);
  menuMovilAbierto = signal(false);
  scrolled = signal(false);
  esRutaAuth = signal(false);
  isLoggedIn = computed(() => this.usuario() !== null);
  isAdmin = computed(() => this.authService.tieneRol('ROLE_ADMIN'));

  constructor() {
    this.esRutaAuth.set(this.router.url.startsWith('/auth/'));

    if (this.authService.isLoggedIn()) {
      this.usuario.set(this.authService.getUsuarioActual());
    }

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((e: NavigationEnd) => {
      this.esRutaAuth.set(e.urlAfterRedirects.startsWith('/auth/'));
      this.menuMovilAbierto.set(false);
      if (this.authService.isLoggedIn()) {
        this.usuario.set(this.authService.getUsuarioActual());
      } else {
        this.usuario.set(null);
      }
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  getIniciales(): string {
    const u = this.usuario();
    if (!u?.nombre) return 'U';
    return u.nombre.charAt(0).toUpperCase();
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.usuario.set(null);
    this.menuMovilAbierto.set(false);
  }

  irPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}
