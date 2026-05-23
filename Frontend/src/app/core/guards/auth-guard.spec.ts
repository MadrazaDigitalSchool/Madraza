import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';

import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('authGuard', () => {
  let router: Router;
  let authService: AuthService;

  const fakeRoute = {} as ActivatedRouteSnapshot;
  const fakeState = { url: '/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    router      = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('está definido como función', () => {
    expect(authGuard).toBeDefined();
    expect(typeof authGuard).toBe('function');
  });

  it('permite el acceso cuando el usuario está autenticado', () => {
    sessionStorage.setItem('token', 'valid-token');

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute, fakeState)
    );

    expect(resultado).toBeTrue();
  });

  it('redirige a /auth/login cuando no hay token', () => {
    const navigateSpy = spyOn(router, 'navigate');

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute, fakeState)
    );

    expect(resultado).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });
});
