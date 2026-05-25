import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  // Página principal — eager para que aparezca sin esperar chunk extra
  {
    path: '',
    component: HomeComponent
  },

  // Páginas informativas
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

  // Autenticación
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Pago
  {
    path: 'pago',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/pago/pago').then(m => m.PagoComponent)
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/pago/checkout/pago-checkout').then(m => m.PagoCheckoutComponent)
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

  // Admin
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard').then(m => m.AdminDashboardComponent)
  },

  // Tests
  {
    path: 'tests',
    loadChildren: () => import('./features/tests/tests.routes').then(m => m.TESTS_ROUTES)
  },

  // Examen
  {
    path: 'examen',
    canActivate: [authGuard],
    loadChildren: () => import('./features/examen/examen.routes').then(m => m.EXAMEN_ROUTES)
  },

  // Dashboard
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },

  // Perfil
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil').then(m => m.PerfilComponent)
  },

  // Organizaciones
  {
    path: 'organizaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/organizaciones/organizaciones').then(m => m.OrganizacionesComponent)
  },
  {
    path: 'organizaciones/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/organizaciones/organizacion-detalle').then(m => m.OrganizacionDetalleComponent)
  },

  // Mis asignaciones
  {
    path: 'asignaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/asignaciones/mis-asignaciones').then(m => m.MisAsignacionesComponent)
  },

  // Apuntes
  {
    path: 'apuntes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/apuntes/apuntes').then(m => m.ApuntesComponent)
  },

  { path: '**', redirectTo: '' }
];
