import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { IntentoService } from './intento';

describe('IntentoService', () => {
  let service: IntentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()]
    });
    service = TestBed.inject(IntentoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
