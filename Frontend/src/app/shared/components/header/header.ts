import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Header principal — sticky, responsive
 * Muestra opciones diferentes según autenticación
 * @author Hafdala Mehdi Sidi
 */
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
export class HeaderComponent implements OnInit, OnDestroy {

  usuario: any = null;
  menuMovilAbierto = false;
  scrolled = false;
  esRutaAuth = false;

  private routerSub?: Subscription;

  constructor(public authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.esRutaAuth = this.router.url.startsWith('/auth/');

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.esRutaAuth = (e.urlAfterRedirects as string).startsWith('/auth/');
      if (this.authService.isLoggedIn()) {
        this.usuario = this.authService.getUsuarioActual();
      } else {
        this.usuario = null;
      }
    });

    if (this.authService.isLoggedIn()) {
      this.usuario = this.authService.getUsuarioActual();
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  // Detecta el scroll para cambiar el estilo del header
  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

  getIniciales(): string {
    if (!this.usuario?.nombre) return 'U';
    return this.usuario.nombre.charAt(0).toUpperCase();
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  logout(): void {
    this.authService.logout();
    this.usuario = null;
    this.menuMovilAbierto = false;
  }

  irPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}