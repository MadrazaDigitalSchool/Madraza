import { TestBed } from '@angular/core/testing';

import { authGuard } from './auth-guard';

describe('authGuard', () => {
  it('should be defined', () => {
    expect(authGuard).toBeDefined();
    expect(typeof authGuard).toBe('function');
  });
});
