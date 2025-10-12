import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { isApiUrl, isPublicUrl } from '../config/api.config';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  
  // Debug logging
  console.log('AuthInterceptor: URL:', req.url);
  console.log('AuthInterceptor: isApiUrl:', isApiUrl(req.url));
  console.log('AuthInterceptor: isPublicUrl:', isPublicUrl(req.url));
  console.log('AuthInterceptor: isLoggedIn:', authService.isLoggedIn());
  
  // Agregar token a las peticiones que lo requieran
  if (shouldAddToken(req, authService)) {
    console.log('AuthInterceptor: Agregando token a la petición');
    req = addTokenToRequest(req, authService);
  } else {
    console.log('AuthInterceptor: NO se agregó token a la petición');
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isTokenExpiredError(error)) {
        // Manejar error 401 - token expirado
        console.warn('Token expired, redirecting to login');
        authService.logout();
      }
      
      if (error.status === 403) {
        console.warn('Access forbidden - insufficient permissions');
      }

      return throwError(() => error);
    })
  );
}

function shouldAddToken(req: HttpRequest<any>, authService: AuthService): boolean {
  // Solo agregar token a peticiones que van a nuestra API y no son públicas
  return isApiUrl(req.url) && !isPublicUrl(req.url) && authService.isLoggedIn();
}

function addTokenToRequest(req: HttpRequest<any>, authService: AuthService): HttpRequest<any> {
  const token = authService.getToken();
  console.log('AuthInterceptor: Token obtenido:', token ? 'SÍ' : 'NO');
  if (token) {
    console.log('AuthInterceptor: Token (primeros 20 chars):', token.substring(0, 20) + '...');
    const newReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('AuthInterceptor: Headers de la petición:', newReq.headers.keys());
    return newReq;
  }
  console.log('AuthInterceptor: No hay token disponible');
  return req;
}

function isTokenExpiredError(error: HttpErrorResponse): boolean {
  return error.status === 401 && 
         (error.error?.message?.includes('token') || 
          error.error?.message?.includes('expired') ||
          error.error?.message?.includes('invalid'));
}