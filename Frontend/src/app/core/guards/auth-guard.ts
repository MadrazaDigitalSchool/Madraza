import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Guard de autenticación — protege las rutas que requieren login.
 *
 * Si el usuario NO tiene token JWT en localStorage
 * lo redirige a /auth/login automáticamente.
 *
 * Se usa en app.routes.ts con canActivate: [authGuard]
 * en las rutas de examen y dashboard.
 *
 * @author Hafdala Mehdi Sidi
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    // Tiene token — puede acceder a la ruta
    return true;
  }

  // No tiene token — redirige al login
  return router.createUrlTree(['/auth/login']);
};