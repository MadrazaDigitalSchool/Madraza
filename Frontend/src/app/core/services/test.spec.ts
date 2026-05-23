import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { TestService } from './test';
import { environment } from '../../../environments/environment';

describe('TestService', () => {
  let service: TestService;
  let httpMock: HttpTestingController;

  const API = `${environment.apiUrl}/tests`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service  = TestBed.inject(TestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getTestsPublicos', () => {
    it('realiza GET a /api/tests', () => {
      service.getTestsPublicos().subscribe(tests => {
        expect(tests.length).toBe(2);
      });

      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, titulo: 'Test A' }, { id: 2, titulo: 'Test B' }]);
    });
  });

  describe('getTestById', () => {
    it('realiza GET a /api/tests/:id', () => {
      service.getTestById(5).subscribe(test => {
        expect(test.titulo).toBe('Test detalle');
      });

      const req = httpMock.expectOne(`${API}/5`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 5, titulo: 'Test detalle' });
    });
  });

  describe('getMisTests', () => {
    it('realiza GET a /api/tests/mis-tests', () => {
      service.getMisTests().subscribe();
      const req = httpMock.expectOne(`${API}/mis-tests`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('crearTest', () => {
    it('realiza POST a /api/tests con el payload correcto', () => {
      const payload = {
        titulo: 'Nuevo test',
        categoria: 'Matemáticas',
        dificultad: 'MEDIA',
        visibilidad: 'PUBLICO',
        preguntas: []
      } as any;

      service.crearTest(payload).subscribe(test => {
        expect(test.titulo).toBe('Nuevo test');
      });

      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.titulo).toBe('Nuevo test');
      req.flush({ id: 1, titulo: 'Nuevo test' });
    });
  });

  describe('actualizarTest', () => {
    it('realiza PUT a /api/tests/:id', () => {
      const payload = { titulo: 'Actualizado' } as any;
      service.actualizarTest(3, payload).subscribe();

      const req = httpMock.expectOne(`${API}/3`);
      expect(req.request.method).toBe('PUT');
      req.flush({ id: 3, titulo: 'Actualizado' });
    });
  });

  describe('eliminarTest', () => {
    it('realiza DELETE a /api/tests/:id', () => {
      service.eliminarTest(7).subscribe();

      const req = httpMock.expectOne(`${API}/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getCategorias', () => {
    it('realiza GET a /api/categorias', () => {
      service.getCategorias().subscribe(cats => {
        expect(cats.length).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categorias`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });
  });
});
