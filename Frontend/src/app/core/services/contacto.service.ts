import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactoRequest {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private apiUrl = `${environment.apiUrl}/contacto`;

  constructor(private http: HttpClient) {}

  enviar(req: ContactoRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl, req);
  }
}
