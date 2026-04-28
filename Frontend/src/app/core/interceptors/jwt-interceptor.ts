import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor JWT — añade el token de autenticación a todas las
 * peticiones HTTP que salen hacia el backend de Madraza.
 *
 * Funciona como un "middleware" del frontend — cada petición
 * pasa por aquí antes de llegar al servidor.
 *
 * Sin este interceptor tendríamos que añadir manualmente el header
 * Authorization en cada llamada al backend.
 *
 * @author Hafdala Mehdi Sidi
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  // Leemos el token del localStorage
  const token = localStorage.getItem('token');

  // Si hay token, clonamos la petición añadiendo el header Authorization
  // Clonamos porque las peticiones HTTP son inmutables en Angular
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Continuamos con la petición (modificada o no)
  return next(req);
};