import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // ── Página principal ────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
  },

  // ── Páginas informativas (públicas) ─────────────────────
  {
    path: 'que-es-madraza',
    loadComponent: () =>
      import('./features/info/que-es-madraza/que-es-madraza').then(m => m.QueEsMadrazaComponent)
  },
  {
    path: 'precios',
    loadComponent: () =>
      import('./features/info/precios/precios').then(m => m.PreciosComponent)
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./features/info/contacto/contacto').then(m => m.ContactoComponent)
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./features/info/privacidad/privacidad').then(m => m.PrivacidadComponent)
  },
  {
    path: 'terminos',
    loadComponent: () =>
      import('./features/info/terminos/terminos').then(m => m.TerminosComponent)
  },
  {
    path: 'cookies',
    loadComponent: () =>
      import('./features/info/cookies/cookies').then(m => m.CookiesComponent)
  },

  // ── Autenticación (pública) ──────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ── Tests (protegidos) ───────────────────────────────────
  {
    path: 'tests',
    canActivate: [authGuard],
    loadChildren: () => import('./features/tests/tests.routes').then(m => m.TESTS_ROUTES)
  },

  // ── Examen (protegido) ───────────────────────────────────
  {
    path: 'examen',
    canActivate: [authGuard],
    loadChildren: () => import('./features/examen/examen.routes').then(m => m.EXAMEN_ROUTES)
  },

  // ── Dashboard (protegido) ────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },

  // ── Perfil (protegido) ───────────────────────────────────
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil').then(m => m.PerfilComponent)
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
