import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { isApiUrl, isPublicUrl } from '../config/api.config';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  
  // Agregar token a las peticiones que lo requieran
  if (shouldAddToken(req, authService)) {
    req = addTokenToRequest(req, authService);
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
  if (token) {
    return req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
  return req;
}

function isTokenExpiredError(error: HttpErrorResponse): boolean {
  return error.status === 401 && 
         (error.error?.message?.includes('token') || 
          error.error?.message?.includes('expired') ||
          error.error?.message?.includes('invalid'));
}