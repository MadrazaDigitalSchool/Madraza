import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IntentoService } from './intento';

describe('IntentoService', () => {
  let service: IntentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(IntentoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
