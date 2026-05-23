import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ChatService } from './chat.service';
import { environment } from '../../../environments/environment';

describe('ChatService (Vitest)', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service  = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('enviar realiza POST a /api/chat con los mensajes', () => {
    const mensajes = [{ role: 'user' as const, content: 'Hola' }];

    service.enviar(mensajes).subscribe(res => {
      expect(res.respuesta).toBe('¡Hola! ¿En qué puedo ayudarte?');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/chat`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.mensajes).toEqual(mensajes);
    req.flush({ respuesta: '¡Hola! ¿En qué puedo ayudarte?' });
  });

  it('enviar incluye historial completo de mensajes', () => {
    const mensajes = [
      { role: 'user' as const, content: 'Primera pregunta' },
      { role: 'assistant' as const, content: 'Primera respuesta' },
      { role: 'user' as const, content: 'Segunda pregunta' }
    ];

    service.enviar(mensajes).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/chat`);
    expect(req.request.body.mensajes.length).toBe(3);
    req.flush({ respuesta: 'Respuesta' });
  });
});
