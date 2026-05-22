import { Component, HostListener, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Notificacion } from '../../../core/models/notificacion.model';
import { Usuario } from '../../../core/models/usuario.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { interval, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private authService  = inject(AuthService);
  private notifService = inject(NotificacionService);
  private router       = inject(Router);

  usuario          = signal<Usuario | null>(null);
  menuMovilAbierto = signal(false);
  menuUsuarioOpen  = signal(false);
  dropdownTop      = signal('64px');
  dropdownRight    = signal('16px');
  scrolled         = signal(false);
  esRutaAuth       = signal(false);

  // Notificaciones
  noLeidas          = signal(0);
  notificaciones    = signal<Notificacion[]>([]);
  notifPanelAbierto = signal(false);
  notifDropTop      = signal('64px');
  notifDropRight    = signal('16px');

  isLoggedIn  = computed(() => this.usuario() !== null);
  isAdmin     = computed(() => this.usuario()?.roles?.includes('ROLE_ADMIN') ?? false);
  esPremium   = computed(() => {
    const u = this.usuario();
    if (!u?.suscripcionActiva) return false;
    if (u.suscripcionExpiry) return new Date(u.suscripcionExpiry) > new Date();
    return true;
  });

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
      this.menuUsuarioOpen.set(false);
      this.notifPanelAbierto.set(false);
      if (this.authService.isLoggedIn()) {
        this.usuario.set(this.authService.getUsuarioActual());
      } else {
        this.usuario.set(null);
        this.noLeidas.set(0);
        this.notificaciones.set([]);
      }
    });

    // Polling del contador cada 30 segundos
    interval(30000).pipe(
      startWith(0),
      takeUntilDestroyed(),
      filter(() => this.authService.isLoggedIn()),
      switchMap(() => this.notifService.getNoLeidas())
    ).subscribe(r => this.noLeidas.set(r.count));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleMenuUsuario(event: MouseEvent): void {
    event.stopPropagation();
    const nuevoEstado = !this.menuUsuarioOpen();
    this.menuUsuarioOpen.set(nuevoEstado);
    if (nuevoEstado) {
      this.notifPanelAbierto.set(false);
      const target = event.target as HTMLElement | null;
      const btn = target?.closest('.avatar-btn') ?? document.querySelector('.avatar-btn');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        this.dropdownTop.set(`${rect.bottom + 6}px`);
        this.dropdownRight.set(`${window.innerWidth - rect.right}px`);
      }
    }
  }

  toggleNotifPanel(event: MouseEvent): void {
    event.stopPropagation();
    const opening = !this.notifPanelAbierto();
    this.notifPanelAbierto.set(opening);
    if (opening) {
      this.menuUsuarioOpen.set(false);
      const btn = (event.target as HTMLElement).closest('.notif-btn') as HTMLElement;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        this.notifDropTop.set(`${rect.bottom + 6}px`);
        this.notifDropRight.set(`${window.innerWidth - rect.right}px`);
      }
      this.notifService.getAll().subscribe(list => this.notificaciones.set(list));
    }
  }

  clickNotificacion(n: Notificacion): void {
    if (!n.leida) {
      this.notifService.marcarLeida(n.id).subscribe(() => {
        this.notificaciones.update(list => list.map(x => x.id === n.id ? { ...x, leida: true } : x));
        this.noLeidas.update(v => Math.max(0, v - 1));
      });
    }
    this.notifPanelAbierto.set(false);
    if (n.urlDestino) this.router.navigateByUrl(n.urlDestino);
  }

  marcarTodasLeidas(): void {
    this.notifService.marcarTodasLeidas().subscribe(() => {
      this.notificaciones.update(list => list.map(n => ({ ...n, leida: true })));
      this.noLeidas.set(0);
    });
  }

  eliminarTodas(): void {
    this.notifService.eliminarTodas().subscribe(() => {
      this.notificaciones.set([]);
      this.noLeidas.set(0);
    });
  }

  getTipoIcono(tipo: string): string {
    switch (tipo) {
      case 'INVITACION_ORG':  return 'groups';
      case 'ASIGNACION_TEST': return 'assignment';
      default:                return 'notifications';
    }
  }

  formatTiempo(fecha: string): string {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Ahora mismo';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `Hace ${hrs} h`;
    return `Hace ${Math.floor(hrs / 24)} d`;
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
    this.noLeidas.set(0);
    this.notificaciones.set([]);
    this.menuMovilAbierto.set(false);
    this.menuUsuarioOpen.set(false);
    this.notifPanelAbierto.set(false);
  }
}
