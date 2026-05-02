import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegistroRequest, JwtResponse, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  // ── Helpers de storage ────────────────────────────────────

  /** Devuelve el token independientemente de en qué storage está */
  getToken(): string | null {
    return localStorage.getItem('token') ?? sessionStorage.getItem('token');
  }

  /** Lee un valor de cualquiera de los dos storages */
  private leerStorage(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  /** Limpia ambos storages de datos de sesión */
  private limpiarStorage(): void {
    ['token', 'usuario'].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  }

  // ── Auth ──────────────────────────────────────────────────

  /**
   * Login. Con recordarme=true usa localStorage (persiste el cierre del navegador),
   * con recordarme=false usa sessionStorage (se borra al cerrar la pestaña).
   */
  login(request: LoginRequest, recordarme = false): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        const storage = recordarme ? localStorage : sessionStorage;
        const otro    = recordarme ? sessionStorage : localStorage;

        const userData = {
          id: response.id,
          nombre: response.nombre,
          email: response.email,
          roles: response.roles
        };

        storage.setItem('token', response.token);
        storage.setItem('usuario', JSON.stringify(userData));

        // Limpiar el storage contrario por si había sesión previa
        otro.removeItem('token');
        otro.removeItem('usuario');
      })
    );
  }

  registro(request: RegistroRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/registro`, request);
  }

  logout(): void {
    this.limpiarStorage();
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsuarioActual(): Usuario | null {
    const raw = this.leerStorage('usuario');
    return raw ? JSON.parse(raw) : null;
  }

  /** Actualiza el objeto usuario en el mismo storage donde esté guardado */
  guardarUsuarioLocal(usuario: Usuario): void {
    const json = JSON.stringify(usuario);
    if (localStorage.getItem('usuario') !== null) {
      localStorage.setItem('usuario', json);
    } else {
      sessionStorage.setItem('usuario', json);
    }
  }

  tieneRol(rol: string): boolean {
    return this.getUsuarioActual()?.roles?.includes(rol) ?? false;
  }

  // ── Perfil ────────────────────────────────────────────────

  getPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`);
  }

  actualizarPerfil(datos: { nombre: string; apellidos: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/perfil`, datos);
  }

  // ── Recuperar contraseña ──────────────────────────────────

  recuperarPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar-password`, { email });
  }
}
