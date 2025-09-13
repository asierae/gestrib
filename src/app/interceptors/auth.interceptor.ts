import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is still authenticated before making requests
  if (!authService.isAuthenticated()) {
    // If not authenticated, redirect to login
    router.navigate(['/login']);
    return new Observable(observer => {
      observer.complete();
    });
  }

  // Add auth token to requests if available
  const token = authService.getToken();
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
}
