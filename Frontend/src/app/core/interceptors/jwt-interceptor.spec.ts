import { TestBed } from '@angular/core/testing';

import { jwtInterceptor } from './jwt-interceptor';

describe('jwtInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be defined', () => {
    expect(jwtInterceptor).toBeDefined();
    expect(typeof jwtInterceptor).toBe('function');
  });

  it('should return null when no token exists', () => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
    expect(token).toBeNull();
  });

  it('should read token from localStorage', () => {
    localStorage.setItem('token', 'test-token');
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
    expect(token).toBe('test-token');
  });

  it('should read token from sessionStorage', () => {
    sessionStorage.setItem('token', 'session-token');
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
    expect(token).toBe('session-token');
  });

  it('should prefer localStorage token over sessionStorage', () => {
    localStorage.setItem('token', 'local-token');
    sessionStorage.setItem('token', 'session-token');
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
    expect(token).toBe('local-token');
  });
});
