import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthMonitorService } from '../services/auth-monitor.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  
  constructor(
    private authService: AuthService,
    private authMonitorService: AuthMonitorService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(route, state);
  }

  private checkAuth(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      this.redirectToLogin(state.url);
      return of(false);
    }

    // Verificar roles específicos si se requieren
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => this.authMonitorService.hasRole(role));
      if (!hasRequiredRole) {
        this.redirectToUnauthorized();
        return of(false);
      }
    }

    // Verificar tipos de usuario específicos si se requieren
    const requiredUserTypes = route.data['userTypes'] as number[];
    if (requiredUserTypes && requiredUserTypes.length > 0) {
      const user = this.authMonitorService.currentUser();
      const hasRequiredUserType = user && requiredUserTypes.includes(user.tipoUsuario);
      if (!hasRequiredUserType) {
        this.redirectToUnauthorized();
        return of(false);
      }
    }

    // Verificar si es administrador si se requiere
    const requiresAdmin = route.data['requiresAdmin'] as boolean;
    if (requiresAdmin && !this.authMonitorService.isAdmin()) {
      this.redirectToUnauthorized();
      return of(false);
    }

    // Verificar si es profesor si se requiere
    const requiresProfesor = route.data['requiresProfesor'] as boolean;
    if (requiresProfesor && !this.authMonitorService.isProfesor()) {
      this.redirectToUnauthorized();
      return of(false);
    }

    // Verificar si es administración si se requiere
    const requiresAdministracion = route.data['requiresAdministracion'] as boolean;
    if (requiresAdministracion && !this.authMonitorService.isAdministracion()) {
      this.redirectToUnauthorized();
      return of(false);
    }

    return of(true);
  }

  private redirectToLogin(returnUrl: string): void {
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: returnUrl } 
    });
  }

  private redirectToUnauthorized(): void {
    this.router.navigate(['/unauthorized']);
  }
}