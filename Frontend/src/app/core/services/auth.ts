import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegistroRequest, JwtResponse, Usuario } from '../models/usuario.model';

/**
 * Servicio de autenticación — gestiona el login, registro,
 * logout y el estado de sesión del usuario.
 *
 * Es un servicio singleton (providedIn: 'root') — existe
 * una sola instancia en toda la aplicación.
 *
 * @author Hafdala Mehdi Sidi
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // URL base del backend leída del environment
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  /**
   * Envía las credenciales al backend y guarda el token JWT
   * en localStorage si el login es correcto
   */
  login(request: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        // Guardamos el token y los datos del usuario en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify({
          id: response.id,
          nombre: response.nombre,
          email: response.email,
          roles: response.roles
        }));
      })
    );
  }

  /**
   * Registra un nuevo usuario en el backend
   */
  registro(request: RegistroRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, request);
  }

  /**
   * Obtiene el perfil completo del usuario autenticado
   */
  getPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`);
  }

  /**
   * Cierra la sesión — elimina el token y redirige al login
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/auth/login']);
  }

  /**
   * Comprueba si el usuario tiene una sesión activa
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Devuelve los datos básicos del usuario guardados en localStorage
   */
  getUsuarioActual(): any {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  /**
   * Comprueba si el usuario tiene un rol específico
   * Ej: authService.tieneRol('ROLE_ADMIN')
   */
  tieneRol(rol: string): boolean {
    const usuario = this.getUsuarioActual();
    return usuario?.roles?.includes(rol) ?? false;
  }
}