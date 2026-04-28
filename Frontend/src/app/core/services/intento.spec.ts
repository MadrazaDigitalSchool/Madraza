import { TestBed } from '@angular/core/testing';

import { Intento } from './intento';

describe('Intento', () => {
  let service: Intento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Intento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
