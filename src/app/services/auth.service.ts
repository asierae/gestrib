import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_CONFIG, buildApiUrl } from '../config/api.config';
import { TranslationService } from './translation.service';
import { Language } from '../models/user.model';

export interface LoginRequest {
  idDb: number;
  email: string;
  password: string;
  language?: string;
  rememberAccount?: boolean;
}

export interface LoginResponse {
  id: number;
  nombre: string;
  nombreUsuario: string;
  apellidos: string;
  email: string;
  telefono: string;
  tema: number;
  menuExpandido: number;
  idIdioma: number;
  urlAvatar: string;
  role: string;
  created: string;
  updated?: string;
  isVerified: boolean;
  jwtToken: string;
  idDb: number;
  rememberAccount: boolean;
  tipoUsuario: number;
  entidad?: string;
  puesto?: string;
  descripcion?: string;
}

export interface User {
  id: number;
  nombre: string;
  nombreUsuario: string;
  apellidos: string;
  email: string;
  telefono: string;
  tema: number;
  menuExpandido: number;
  idIdioma: number;
  urlAvatar: string;
  role: string;
  created: string;
  updated?: string;
  isVerified: boolean;
  idDb: number;
  rememberAccount: boolean;
  tipoUsuario: number;
  entidad?: string;
  puesto?: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Signals para estado reactivo
  private _isAuthenticated = signal(false);
  private _currentUser = signal<User | null>(null);
  private _isLoading = signal(false);

  // BehaviorSubjects para compatibilidad con código existente
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  
  // Subject para notificar cuando el usuario esté completamente cargado
  private userLoadedSubject = new BehaviorSubject<boolean>(false);
  public userLoaded$ = this.userLoadedSubject.asObservable();

  // Computed signals
  public isAuthenticated = computed(() => this._isAuthenticated());
  public currentUser = computed(() => this._currentUser());
  public isLoading = computed(() => this._isLoading());

  constructor(
    private http: HttpClient,
    private router: Router,
    private translationService: TranslationService
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    console.log('Initializing auth:', { hasToken: !!token, hasUser: !!user, userId: user?.id, userLanguage: user?.idIdioma });
    
    if (token && user) {
      this._isAuthenticated.set(true);
      this._currentUser.set(user);
      this.userSubject.next(user);
      
      // Notificar que el usuario está completamente cargado
      this.userLoadedSubject.next(true);
      console.log('User loaded completely, language can be configured');
    } else {
      // Notificar que no hay usuario cargado
      this.userLoadedSubject.next(false);
      console.log('No user loaded');
    }
  }

  /**
   * Convierte idIdioma numérico a Language enum
   */
  private idIdiomaToLanguage(idIdioma: number): Language {
    switch (idIdioma) {
      case 1: return Language.ES;
      case 2: return Language.EN;
      case 3: return Language.EU;
      default: return Language.ES;
    }
  }

  /**
   * Configura el idioma del usuario
   */
  private setUserLanguage(idIdioma: number): void {
    const language = this.idIdiomaToLanguage(idIdioma);
    this.translationService.setLanguage(language);
  }

  /**
   * Login para Profesorado (solo email, contraseña fija)
   */
  loginProfesorado(email: string): Observable<LoginResponse> {
    const request: LoginRequest = {
      idDb: 0,
      email: email,
      password: '123456', // Contraseña fija para profesores
      language: 'es',
      rememberAccount: false
    };

    return this.performLogin(request);
  }

  /**
   * Login para Administración (email y contraseña)
   */
  loginAdministracion(email: string, password: string, rememberMe: boolean = false): Observable<LoginResponse> {
    const request: LoginRequest = {
      idDb: 0,
      email: email,
      password: password,
      language: 'es',
      rememberAccount: rememberMe
    };

    return this.performLogin(request);
  }

  /**
   * Realiza el login genérico
   */
  private performLogin(request: LoginRequest): Observable<LoginResponse> {
    this._isLoading.set(true);

    const headers = new HttpHeaders(API_CONFIG.defaultHeaders);

    return this.http.post<LoginResponse>(buildApiUrl(API_CONFIG.endpoints.authenticate), request, { 
      headers,
      withCredentials: true // Para manejar cookies de refresh token
    }).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        this._isLoading.set(false);
        console.error('Login error:', error);
        return throwError(() => this.handleLoginError(error));
      })
    );
  }

  /**
   * Maneja el éxito del login
   */
  private handleLoginSuccess(response: LoginResponse): void {
    // Almacenar token JWT
    this.setToken(response.jwtToken);
    
    // Crear objeto usuario
    const user: User = {
      id: response.id,
      nombre: response.nombre,
      nombreUsuario: response.nombreUsuario,
      apellidos: response.apellidos,
      email: response.email,
      telefono: response.telefono,
      tema: response.tema,
      menuExpandido: response.menuExpandido,
      idIdioma: response.idIdioma,
      urlAvatar: response.urlAvatar,
      role: response.role,
      created: response.created,
      updated: response.updated,
      isVerified: response.isVerified,
      idDb: response.idDb,
      rememberAccount: response.rememberAccount,
      tipoUsuario: response.tipoUsuario,
      entidad: response.entidad,
      puesto: response.puesto,
      descripcion: response.descripcion
    };

    // Actualizar estado
    this._isAuthenticated.set(true);
    this._currentUser.set(user);
    this.userSubject.next(user);
    this._isLoading.set(false);

    // Almacenar usuario en localStorage
    this.setStoredUser(user);

    // Notificar que el usuario está completamente cargado
    this.userLoadedSubject.next(true);

    // Configurar el idioma del usuario
    this.setUserLanguage(user.idIdioma);
  }

  /**
   * Maneja errores de login
   */
  private handleLoginError(error: any): any {
    this._isLoading.set(false);
    
    if (error.status === 401) {
      return { message: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' };
    } else if (error.status === 404) {
      return { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };
    } else if (error.status === 0) {
      return { message: 'Error de conexión con el servidor', code: 'CONNECTION_ERROR' };
    } else {
      return { message: error.error?.message || 'Error desconocido', code: 'UNKNOWN_ERROR' };
    }
  }

  /**
   * Logout del usuario
   */
  logout(): Observable<any> {
    this._isLoading.set(true);

    return this.http.post(buildApiUrl(API_CONFIG.endpoints.revokeToken), {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.handleLogout();
      }),
      catchError(error => {
        // Incluso si hay error en el servidor, hacer logout local
        this.handleLogout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Maneja el logout
   */
  private handleLogout(): void {
    // Limpiar estado local
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.userSubject.next(null);
    this._isLoading.set(false);

    // Limpiar almacenamiento
    this.clearStoredData();

    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Refresca el token de autenticación
   */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(buildApiUrl(API_CONFIG.endpoints.refreshToken), {}, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.setToken(response.jwtToken);
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    return this._isAuthenticated() && !!this.getToken();
  }

  /**
   * Obtiene el token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Almacena el token JWT
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Obtiene el usuario almacenado
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Almacena el usuario
   */
  private setStoredUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Limpia todos los datos almacenados
   */
  private clearStoredData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Obtiene los headers de autorización
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
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
    const user = this._currentUser();
    return user?.tipoUsuario === 1; // TipoUsuario 1 = Admin
  }

  /**
   * Verifica si el usuario es profesor
   */
  isProfesor(): boolean {
    const user = this._currentUser();
    return user?.tipoUsuario === 2; // TipoUsuario 2 = Profesor
  }

  /**
   * Verifica si el usuario es de administración
   */
  isAdministracion(): boolean {
    const user = this._currentUser();
    return user?.tipoUsuario === 1; // TipoUsuario 1 = Administración/Admin
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
   * Actualiza el perfil del usuario
   */
  updateProfile(profileData: any): Observable<any> {
    const user = this._currentUser();
    if (!user) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const request = {
      id: user.id,
      nombre: profileData.nombre,
      apellidos: profileData.apellidos,
      email: profileData.email,
      telefono: profileData.telefono,
      empresa: profileData.empresa,
      puesto: profileData.puesto,
      descripcion: profileData.descripcion
    };

    return this.http.post(buildApiUrl('/Usuario/updateProfileApp'), request, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((response: any) => {
        // Actualizar el usuario local con los nuevos datos
        const updatedUser = { 
          ...user, 
          nombre: profileData.nombre,
          apellidos: profileData.apellidos,
          email: profileData.email,
          telefono: profileData.telefono,
          entidad: profileData.empresa,
          puesto: profileData.puesto,
          descripcion: profileData.descripcion,
          urlAvatar: response.urlAvatar || user.urlAvatar
        };
        this._currentUser.set(updatedUser);
        this.userSubject.next(updatedUser);
        this.setStoredUser(updatedUser);
      }),
      catchError(error => {
        console.error('Update profile error:', error);
        return throwError(() => this.handleUpdateProfileError(error));
      })
    );
  }

  /**
   * Maneja errores de actualización de perfil
   */
  private handleUpdateProfileError(error: any): any {
    if (error.status === 400) {
      return { message: 'Datos inválidos', code: 'INVALID_DATA' };
    } else if (error.status === 401) {
      return { message: 'Usuario no autenticado', code: 'UNAUTHORIZED' };
    } else if (error.status === 403) {
      return { message: 'No tienes permisos para actualizar este perfil', code: 'FORBIDDEN' };
    } else if (error.status === 0) {
      return { message: 'Error de conexión con el servidor', code: 'CONNECTION_ERROR' };
    } else {
      return { message: error.error?.message || 'Error desconocido', code: 'UNKNOWN_ERROR' };
    }
  }

  /**
   * Cambia el idioma del usuario
   */
  changeLanguage(idIdioma: number): Observable<any> {
    return this.http.get(buildApiUrl(`${API_CONFIG.endpoints.changeLanguage}/${idIdioma}`), {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        const user = this._currentUser();
        if (user) {
          user.idIdioma = idIdioma;
          this._currentUser.set(user);
          this.userSubject.next(user);
          this.setStoredUser(user);
          
          // Configurar el idioma en el TranslationService
          this.setUserLanguage(idIdioma);
        }
      })
    );
  }


  /**
   * Solicita reset de contraseña
   */
  resetPassword(email: string): Observable<any> {
    const request = {
      idDb: 0, // Siempre usar idDb = 0
      email: email
    };

    return this.http.post(buildApiUrl('/Usuario/reset_password'), request, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      catchError(error => {
        console.error('Reset password error:', error);
        return throwError(() => this.handleResetPasswordError(error));
      })
    );
  }

  /**
   * Maneja errores de reset de contraseña
   */
  private handleResetPasswordError(error: any): any {
    if (error.status === 404) {
      return { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };
    } else if (error.status === 400) {
      return { message: 'Error al procesar la solicitud', code: 'BAD_REQUEST' };
    } else if (error.status === 0) {
      return { message: 'Error de conexión con el servidor', code: 'CONNECTION_ERROR' };
    } else {
      return { message: error.error?.message || 'Error desconocido', code: 'UNKNOWN_ERROR' };
    }
  }

  /**
   * Cambia la contraseña del usuario actual
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const user = this._currentUser();
    if (!user) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const request = {
      id: user.id,
      currentPassword: currentPassword,
      newPassword: newPassword
    };

    return this.http.post(buildApiUrl('/Usuario/changePassword'), request, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => this.handleChangePasswordError(error));
      })
    );
  }

  /**
   * Maneja errores de cambio de contraseña
   */
  private handleChangePasswordError(error: any): any {
    if (error.status === 400) {
      return { message: 'Contraseña actual incorrecta', code: 'INVALID_CURRENT_PASSWORD' };
    } else if (error.status === 401) {
      return { message: 'No autorizado', code: 'UNAUTHORIZED' };
    } else if (error.status === 0) {
      return { message: 'Error de conexión con el servidor', code: 'CONNECTION_ERROR' };
    } else {
      return { message: error.error?.message || 'Error al cambiar la contraseña', code: 'UNKNOWN_ERROR' };
    }
  }
}