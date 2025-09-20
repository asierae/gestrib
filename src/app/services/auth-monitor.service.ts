import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { filter, switchMap, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthMonitorService {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals para estado reactivo
  private _isAuthenticated = signal(false);
  private _currentUser = signal<User | null>(null);
  private _isLoading = signal(false);
  private _lastActivity = signal<Date>(new Date());

  // BehaviorSubjects para compatibilidad
  private authStateSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);

  // Subscripciones
  private tokenRefreshSubscription?: Subscription;
  private activityCheckSubscription?: Subscription;

  // Computed signals
  public isAuthenticated = computed(() => this._isAuthenticated());
  public currentUser = computed(() => this._currentUser());
  public isLoading = computed(() => this._isLoading());
  public lastActivity = computed(() => this._lastActivity());

  // Observables públicos
  public authState$ = this.authStateSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  constructor() {
    this.initializeAuthMonitoring();
    this.setupActivityTracking();
    this.setupTokenRefresh();
  }

  /**
   * Inicializa el monitoreo de autenticación
   */
  private initializeAuthMonitoring(): void {
    // Verificar estado inicial
    this.checkAuthState();

    // Suscribirse a cambios en el AuthService
    this.authService.user$.subscribe(user => {
      this.updateAuthState(!!user, user);
    });
  }

  /**
   * Verifica el estado actual de autenticación
   */
  private checkAuthState(): void {
    const isAuth = this.authService.isLoggedIn();
    const user = this.authService.currentUser();
    
    this.updateAuthState(isAuth, user);
  }

  /**
   * Actualiza el estado de autenticación
   */
  private updateAuthState(isAuthenticated: boolean, user: User | null): void {
    this._isAuthenticated.set(isAuthenticated);
    this._currentUser.set(user);
    this.authStateSubject.next(isAuthenticated);
    this.userSubject.next(user);

    if (isAuthenticated) {
      this.startTokenRefresh();
    } else {
      this.stopTokenRefresh();
    }
  }

  /**
   * Configura el seguimiento de actividad del usuario
   */
  private setupActivityTracking(): void {
    // Actualizar última actividad en eventos del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this._lastActivity.set(new Date());
      }, true);
    });
  }

  /**
   * Configura la renovación automática de tokens
   */
  private setupTokenRefresh(): void {
    // Verificar token cada 5 minutos
    this.activityCheckSubscription = interval(5 * 60 * 1000).subscribe(() => {
      if (this._isAuthenticated()) {
        this.checkTokenValidity();
      }
    });
  }

  /**
   * Inicia la renovación automática de tokens
   */
  private startTokenRefresh(): void {
    if (this.tokenRefreshSubscription) {
      this.tokenRefreshSubscription.unsubscribe();
    }

    // Renovar token cada 50 minutos (los JWT suelen durar 1 hora)
    this.tokenRefreshSubscription = interval(50 * 60 * 1000).subscribe(() => {
      this.refreshToken();
    });
  }

  /**
   * Detiene la renovación automática de tokens
   */
  private stopTokenRefresh(): void {
    if (this.tokenRefreshSubscription) {
      this.tokenRefreshSubscription.unsubscribe();
      this.tokenRefreshSubscription = undefined;
    }
  }

  /**
   * Verifica la validez del token actual
   */
  private checkTokenValidity(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.handleTokenExpired();
      return;
    }

    try {
      // Decodificar el token JWT (parte del payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Si el token expira en menos de 10 minutos, renovarlo
      if (payload.exp - currentTime < 600) {
        this.refreshToken();
      }
    } catch (error) {
      console.error('Error checking token validity:', error);
      this.handleTokenExpired();
    }
  }

  /**
   * Renueva el token de autenticación
   */
  private refreshToken(): void {
    this.authService.refreshToken().subscribe({
      next: (response) => {
        console.log('Token refreshed successfully');
      },
      error: (error) => {
        console.error('Token refresh failed:', error);
        this.handleTokenExpired();
      }
    });
  }

  /**
   * Maneja la expiración del token
   */
  private handleTokenExpired(): void {
    console.log('Token expired, logging out...');
    this.logout();
  }

  /**
   * Realiza logout del usuario
   */
  logout(): void {
    this._isLoading.set(true);
    
    this.authService.logout().subscribe({
      next: () => {
        this.updateAuthState(false, null);
        this._isLoading.set(false);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Incluso si hay error, hacer logout local
        this.updateAuthState(false, null);
        this._isLoading.set(false);
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this._currentUser();
    return user?.role === role;
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  /**
   * Verifica si el usuario es profesor
   */
  isProfesor(): boolean {
    const user = this._currentUser();
    return user?.tipoUsuario === 2;
  }

  /**
   * Verifica si el usuario es de administración
   */
  isAdministracion(): boolean {
    const user = this._currentUser();
    return user?.role === 'Admin' || user?.role === 'Administracion';
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  getFullName(): string {
    const user = this._currentUser();
    return user ? `${user.nombre} ${user.apellidos}`.trim() : '';
  }

  /**
   * Obtiene el avatar del usuario
   */
  getAvatar(): string {
    const user = this._currentUser();
    return user?.urlAvatar || 'https://www.w3schools.com/howto/img_avatar.png';
  }

  /**
   * Verifica si el usuario está inactivo por más de X minutos
   */
  isUserInactive(minutes: number = 30): boolean {
    const lastActivity = this._lastActivity();
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    return diffInMinutes > minutes;
  }

  /**
   * Reinicia el contador de actividad
   */
  resetActivityTimer(): void {
    this._lastActivity.set(new Date());
  }

  /**
   * Limpia las subscripciones al destruir el servicio
   */
  ngOnDestroy(): void {
    this.stopTokenRefresh();
    if (this.activityCheckSubscription) {
      this.activityCheckSubscription.unsubscribe();
    }
  }
}