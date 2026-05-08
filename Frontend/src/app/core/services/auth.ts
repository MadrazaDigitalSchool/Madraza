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

  // ── Storage helpers ───────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem('token') ?? sessionStorage.getItem('token');
  }

  private leerStorage(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  private limpiarStorage(): void {
    ['token', 'usuario'].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  }

  // ── Auth ──────────────────────────────────────────────────

  login(request: LoginRequest, recordarme = false): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        const storage = recordarme ? localStorage : sessionStorage;
        const otro    = recordarme ? sessionStorage : localStorage;

        const userData: Partial<Usuario> = {
          id: response.id,
          nombre: response.nombre,
          email: response.email,
          roles: response.roles,
          suscripcionActiva: response.suscripcionActiva,
          suscripcionExpiry: response.suscripcionExpiry,
          planTipo: response.planTipo,
          metodoPago: response.metodoPago
        };

        storage.setItem('token', response.token);
        storage.setItem('usuario', JSON.stringify(userData));

        otro.removeItem('token');
        otro.removeItem('usuario');
      })
    );
  }

  /** Guarda el token y usuario desde el callback de OAuth2 */
  loginConToken(token: string, suscripcionActiva: boolean): void {
    // Guardamos en sessionStorage por defecto para OAuth2
    sessionStorage.setItem('token', token);
    // El usuario completo se cargará llamando a getPerfil()
    // Guardamos un objeto mínimo temporal
    const userTemp = { suscripcionActiva };
    sessionStorage.setItem('usuario', JSON.stringify(userTemp));
  }

  registro(request: RegistroRequest): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/registro`, request);
  }

  verificarEmail(token: string): Observable<{ mensaje: string }> {
    return this.http.get<{ mensaje: string }>(`${this.apiUrl}/verificar-email?token=${token}`);
  }

  recuperarPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar-password`, { email });
  }

  nuevaPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/nueva-password`, { token, password });
  }

  logout(): void {
    this.limpiarStorage();
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  tieneSubscripcion(): boolean {
    const u = this.getUsuarioActual();
    if (!u?.suscripcionActiva) return false;
    if (u.suscripcionExpiry) {
      return new Date(u.suscripcionExpiry) > new Date();
    }
    return true;
  }

  getUsuarioActual(): Usuario | null {
    const raw = this.leerStorage('usuario');
    return raw ? JSON.parse(raw) : null;
  }

  guardarUsuarioLocal(usuario: Partial<Usuario>): void {
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
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`).pipe(
      tap(usuario => this.guardarUsuarioLocal(usuario))
    );
  }

  actualizarPerfil(datos: { nombre: string; apellidos: string }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/perfil`, datos);
  }
}
