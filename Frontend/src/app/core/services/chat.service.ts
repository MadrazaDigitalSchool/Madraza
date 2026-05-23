import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMensaje {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/chat`;

  enviar(mensajes: ChatMensaje[]): Observable<{ respuesta: string }> {
    return this.http.post<{ respuesta: string }>(this.apiUrl, { mensajes });
  }
}
