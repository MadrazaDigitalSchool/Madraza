import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
  const router = inject(Router);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor devuelve 401 en rutas protegidas, el token ha caducado
      const esRutaAuth = req.url.includes('/auth/login') || req.url.includes('/auth/registro');
      if (error.status === 401 && !esRutaAuth) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
