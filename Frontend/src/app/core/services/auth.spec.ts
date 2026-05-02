import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

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
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null token when not logged in', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should return true for isLoggedIn when token exists in localStorage', () => {
    localStorage.setItem('token', 'fake-token');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should return true for isLoggedIn when token exists in sessionStorage', () => {
    sessionStorage.setItem('token', 'fake-token');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should return usuario from storage', () => {
    const userData = { id: 1, nombre: 'Test User', email: 'test@example.com', roles: ['USER'] };
    sessionStorage.setItem('usuario', JSON.stringify(userData));

    const usuario = service.getUsuarioActual();
    expect(usuario).not.toBeNull();
    expect(usuario?.nombre).toBe('Test User');
  });

  it('should return null when no usuario in storage', () => {
    expect(service.getUsuarioActual()).toBeNull();
  });

  it('should check if user has role', () => {
    const userData = { id: 1, nombre: 'Test User', email: 'test@example.com', roles: ['ADMIN', 'USER'] };
    sessionStorage.setItem('usuario', JSON.stringify(userData));

    expect(service.tieneRol('ADMIN')).toBeTrue();
    expect(service.tieneRol('EDITOR')).toBeFalse();
  });
});
