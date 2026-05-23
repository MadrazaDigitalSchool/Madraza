import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IntentoService } from './intento';
import { environment } from '../../../environments/environment';

describe('IntentoService', () => {
  let service: IntentoService;
  let httpMock: HttpTestingController;

  const API = `${environment.apiUrl}/intentos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service  = TestBed.inject(IntentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('iniciarIntento', () => {
    it('realiza POST a /api/intentos/test/:testId', () => {
      service.iniciarIntento(5).subscribe(intento => {
        expect(intento.id).toBe(10);
        expect(intento.estado).toBe('EN_CURSO');
      });

      const req = httpMock.expectOne(`${API}/test/5`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 10, estado: 'EN_CURSO', totalPreguntas: 3 });
    });
  });

  describe('responder', () => {
    it('realiza POST a /api/intentos/:id/responder', () => {
      const respuesta = { preguntaId: 1, opcionId: 2 };
      service.responder(10, respuesta).subscribe();

      const req = httpMock.expectOne(`${API}/10/responder`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.preguntaId).toBe(1);
      req.flush(null);
    });
  });

  describe('finalizar', () => {
    it('realiza POST a /api/intentos/:id/finalizar', () => {
      service.finalizar(10).subscribe(resultado => {
        expect(resultado.porcentaje).toBe(75);
        expect(resultado.estado).toBe('COMPLETADO');
      });

      const req = httpMock.expectOne(`${API}/10/finalizar`);
      expect(req.request.method).toBe('POST');
      req.flush({
        intentoId: 10,
        puntuacion: 30,
        totalPreguntas: 4,
        correctas: 3,
        incorrectas: 1,
        porcentaje: 75,
        estado: 'COMPLETADO',
        tiempoEmpleado: 120,
        pendienteCorreccion: false
      });
    });
  });

  describe('getHistorial', () => {
    it('realiza GET a /api/intentos/historial', () => {
      service.getHistorial().subscribe(historial => {
        expect(historial.length).toBe(2);
      });

      const req = httpMock.expectOne(`${API}/historial`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('getDetalle', () => {
    it('realiza GET a /api/intentos/:id/detalle', () => {
      service.getDetalle(10).subscribe(detalle => {
        expect(detalle.length).toBe(1);
      });

      const req = httpMock.expectOne(`${API}/10/detalle`);
      expect(req.request.method).toBe('GET');
      req.flush([{ preguntaId: 1, esCorrecta: true }]);
    });
  });

  describe('corregir', () => {
    it('realiza PUT a /api/intentos/:id/corregir con payload {nota, correcciones, anotaciones}', () => {
      const payload = {
        nota: 7,
        correcciones: { 200: true } as Record<number, boolean>,
        anotaciones: { 200: 'Faltó desarrollar más' } as Record<number, string>
      };

      service.corregir(10, payload).subscribe(resultado => {
        expect(resultado.estado).toBe('COMPLETADO');
        expect(resultado.nota).toBe(7);
      });

      const req = httpMock.expectOne(`${API}/10/corregir`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.nota).toBe(7);
      expect(req.request.body.correcciones[200]).toBeTrue();
      expect(req.request.body.anotaciones[200]).toBe('Faltó desarrollar más');
      req.flush({
        intentoId: 10, puntuacion: 5, totalPreguntas: 5,
        correctas: 5, incorrectas: 0, porcentaje: 100,
        estado: 'COMPLETADO', tiempoEmpleado: 120,
        pendienteCorreccion: false, nota: 7
      });
    });
  });

  describe('getMisPendientesCorreccion', () => {
    it('realiza GET a /api/intentos/mis-pendientes-correccion', () => {
      service.getMisPendientesCorreccion().subscribe(lista => {
        expect(lista.length).toBe(1);
        expect(lista[0].testTitulo).toBe('Test de Inglés');
      });

      const req = httpMock.expectOne(`${API}/mis-pendientes-correccion`);
      expect(req.request.method).toBe('GET');
      req.flush([{ testId: 5, testTitulo: 'Test de Inglés', pendientes: 3 }]);
    });
  });
});
