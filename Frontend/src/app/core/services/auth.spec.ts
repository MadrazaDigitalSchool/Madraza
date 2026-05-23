import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

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

    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('creación del servicio', () => {
    it('se crea correctamente', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('isLoggedIn y getToken', () => {
    it('devuelve false cuando no hay token', () => {
      expect(service.isLoggedIn()).toBeFalse();
      expect(service.getToken()).toBeNull();
    });

    it('detecta token en localStorage', () => {
      localStorage.setItem('token', 'token-local');
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getToken()).toBe('token-local');
    });

    it('detecta token en sessionStorage', () => {
      sessionStorage.setItem('token', 'token-session');
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getToken()).toBe('token-session');
    });

    it('localStorage tiene prioridad sobre sessionStorage', () => {
      localStorage.setItem('token', 'token-local');
      sessionStorage.setItem('token', 'token-session');
      expect(service.getToken()).toBe('token-local');
    });
  });

  describe('getUsuarioActual', () => {
    it('devuelve null si no hay usuario en storage', () => {
      expect(service.getUsuarioActual()).toBeNull();
    });

    it('devuelve usuario desde sessionStorage', () => {
      const usuario = { id: 1, nombre: 'María', email: 'maria@test.com', roles: ['ROLE_USER'] };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));

      const resultado = service.getUsuarioActual();
      expect(resultado?.nombre).toBe('María');
      expect(resultado?.email).toBe('maria@test.com');
    });

    it('devuelve usuario desde localStorage', () => {
      const usuario = { id: 2, nombre: 'Pedro', email: 'pedro@test.com', roles: ['ROLE_USER'] };
      localStorage.setItem('usuario', JSON.stringify(usuario));

      const resultado = service.getUsuarioActual();
      expect(resultado?.nombre).toBe('Pedro');
    });
  });

  describe('tieneRol', () => {
    beforeEach(() => {
      const usuario = { id: 1, nombre: 'Admin', email: 'admin@test.com', roles: ['ROLE_ADMIN', 'ROLE_USER'] };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
    });

    it('devuelve true para rol que tiene', () => {
      expect(service.tieneRol('ROLE_ADMIN')).toBeTrue();
    });

    it('devuelve false para rol que no tiene', () => {
      expect(service.tieneRol('ROLE_SUPERUSER')).toBeFalse();
    });

    it('devuelve false si no hay usuario', () => {
      sessionStorage.clear();
      expect(service.tieneRol('ROLE_ADMIN')).toBeFalse();
    });
  });

  describe('tieneSubscripcion', () => {
    it('devuelve false si no hay usuario', () => {
      expect(service.tieneSubscripcion()).toBeFalse();
    });

    it('devuelve false si suscripcionActiva es false', () => {
      const usuario = { id: 1, suscripcionActiva: false };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
      expect(service.tieneSubscripcion()).toBeFalse();
    });

    it('devuelve true si suscripcion activa sin fecha de expiración', () => {
      const usuario = { id: 1, suscripcionActiva: true };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
      expect(service.tieneSubscripcion()).toBeTrue();
    });

    it('devuelve false si la suscripcion ha expirado', () => {
      const usuario = {
        id: 1,
        suscripcionActiva: true,
        suscripcionExpiry: new Date(Date.now() - 86400000).toISOString()
      };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
      expect(service.tieneSubscripcion()).toBeFalse();
    });

    it('devuelve true si la suscripcion aún no ha expirado', () => {
      const usuario = {
        id: 1,
        suscripcionActiva: true,
        suscripcionExpiry: new Date(Date.now() + 86400000).toISOString()
      };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
      expect(service.tieneSubscripcion()).toBeTrue();
    });
  });

  describe('login', () => {
    it('guarda token en sessionStorage cuando recordarme es false', () => {
      service.login({ email: 'test@test.com', password: '123456' }, false).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
      req.flush({
        token: 'jwt-token',
        id: 1,
        nombre: 'Test',
        email: 'test@test.com',
        roles: ['ROLE_USER'],
        suscripcionActiva: false
      });

      expect(sessionStorage.getItem('token')).toBe('jwt-token');
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('guarda token en localStorage cuando recordarme es true', () => {
      service.login({ email: 'test@test.com', password: '123456' }, true).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
      req.flush({
        token: 'jwt-token',
        id: 1,
        nombre: 'Test',
        email: 'test@test.com',
        roles: ['ROLE_USER'],
        suscripcionActiva: false
      });

      expect(localStorage.getItem('token')).toBe('jwt-token');
      expect(sessionStorage.getItem('token')).toBeNull();
    });
  });

  describe('registro', () => {
    it('realiza POST a /api/auth/registro', () => {
      service.registro({
        nombre: 'Ana', apellidos: 'López',
        email: 'ana@test.com', password: 'password'
      }).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/auth/registro'));
      expect(req.request.method).toBe('POST');
      req.flush({ mensaje: 'Registro exitoso' });
    });
  });
});
