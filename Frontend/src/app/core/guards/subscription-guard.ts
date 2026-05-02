import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const subscriptionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.parseUrl('/auth/login');
  }

  if (!authService.tieneSubscripcion()) {
    return router.parseUrl('/pago');
  }

  return true;
};
