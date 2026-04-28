import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'tests',
    loadChildren: () =>
      import('./features/tests/tests.routes').then(m => m.TESTS_ROUTES)
  },
  {
    path: 'examen',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/examen/examen.routes').then(m => m.EXAMEN_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: '',
    redirectTo: 'tests',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'tests'
  }
];