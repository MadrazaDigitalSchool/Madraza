import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { CorregirTestComponent } from './corregir-test';
import { IntentoService } from '../../../core/services/intento';

const INTENTO_STUB = {
  intentoId: 1,
  inicio: '2026-01-01T10:00:00',
  respuestasPendientes: [
    { respuestaId: 10, enunciado: 'Pregunta 1', textoLibre: 'Respuesta 1', puntos: 2 },
    { respuestaId: 11, enunciado: 'Pregunta 2', textoLibre: 'Respuesta 2', puntos: 3 }
  ]
};

describe('CorregirTestComponent — lógica de corrección', () => {
  let component: CorregirTestComponent;
  let fixture: ComponentFixture<CorregirTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorregirTestComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: IntentoService,
          useValue: {
            getParaCorregir: () => of([INTENTO_STUB]),
            corregir: jasmine.createSpy('corregir').and.returnValue(of({}))
          }
        },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '5' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CorregirTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('intentoCompleto devuelve false cuando alguna corrección es null', () => {
    expect(component.intentoCompleto(1)).toBeFalse();
  });

  it('intentoCompleto devuelve true cuando todas las correcciones están marcadas', () => {
    component.setCorreccion(1, 10, true);
    component.setCorreccion(1, 11, false);
    expect(component.intentoCompleto(1)).toBeTrue();
  });

  it('setAnotacion y getAnotacion persisten el texto por respuesta', () => {
    component.setAnotacion(1, 10, 'Revisa el concepto de herencia');
    expect(component.getAnotacion(1, 10)).toBe('Revisa el concepto de herencia');
  });
});
