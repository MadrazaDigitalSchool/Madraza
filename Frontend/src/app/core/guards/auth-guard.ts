import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard de autenticación — protege las rutas que requieren login.
 *
 * Si el usuario NO tiene token JWT (localStorage o sessionStorage)
 * lo redirige a /auth/login automáticamente.
 *
 * Se usa en app.routes.ts con canActivate: [authGuard]
 * en las rutas de examen, tests, dashboard y perfil.
 *
 * @author Hafdala Mehdi Sidi
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};