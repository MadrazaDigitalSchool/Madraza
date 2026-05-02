import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { subscriptionGuard } from './core/guards/subscription-guard';

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

  // ── Pago (requiere login pero NO suscripción) ─────────────
  {
    path: 'pago',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/pago/pago').then(m => m.PagoComponent)
      },
      {
        path: 'exito',
        loadComponent: () =>
          import('./features/pago/exito/pago-exito').then(m => m.PagoExitoComponent)
      },
      {
        path: 'cancelar',
        loadComponent: () =>
          import('./features/pago/cancelar/pago-cancelar').then(m => m.PagoCancelarComponent)
      }
    ]
  },

  // ── Tests (requiere login + suscripción) ──────────────────
  {
    path: 'tests',
    canActivate: [authGuard, subscriptionGuard],
    loadChildren: () => import('./features/tests/tests.routes').then(m => m.TESTS_ROUTES)
  },

  // ── Examen (requiere login + suscripción) ────────────────
  {
    path: 'examen',
    canActivate: [authGuard, subscriptionGuard],
    loadChildren: () => import('./features/examen/examen.routes').then(m => m.EXAMEN_ROUTES)
  },

  // ── Dashboard (requiere login + suscripción) ─────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, subscriptionGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },

  // ── Perfil (requiere login + suscripción) ────────────────
  {
    path: 'perfil',
    canActivate: [authGuard, subscriptionGuard],
    loadComponent: () => import('./features/perfil/perfil').then(m => m.PerfilComponent)
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
