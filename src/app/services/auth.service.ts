import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, LoginRequest, LoginResponse, AuthState, UserType, Language } from '../models/user.model';
  
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  private authSubject = new BehaviorSubject<AuthState>(this.authState());

  constructor(private router: Router) {
    // Check for existing token on service initialization
    this.checkStoredAuth();
    
    // If no user is found, create a demo user for testing
    setTimeout(() => {
      if (!this.isAuthenticated()) {
        this.createDemoUser();
      }
    }, 500);
  }

  getAuthState(): Observable<AuthState> {
    return this.authSubject.asObservable();
  }

  getCurrentUser(): User | null {
    return this.authState().user;
  }

  isAuthenticated(): boolean {
    const user = this.authState().user;
    return this.authState().isAuthenticated && user !== null && user.id > 0 && user.activo;
  }

  getToken(): string | null {
    return this.authState().token;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);
    this.setError(null);

    // Simulate API call - replace with actual HTTP request
    return new Observable(observer => {
      setTimeout(() => {
        // Mock authentication logic
        if (credentials.email === 'admin@gestrib.com' && credentials.password === 'admin123') {
          const user: User = {
            id: 1,
            email: credentials.email,
            tipo: UserType.ADMIN,
            activo: true,
            created: new Date(),
            token: this.generateToken(),
            idIdioma: Language.ES,
            nombre: 'Administrador',
            apellidos: 'Sistema',
            ultimoAcceso: new Date()
          };

          this.setAuthState({
            isAuthenticated: true,
            user: user,
            token: user.token!,
            loading: false,
            error: null
          });

          // Store in localStorage
          localStorage.setItem('auth_token', user.token!);
          localStorage.setItem('user_data', JSON.stringify(user));

          observer.next({
            success: true,
            user: user,
            token: user.token
          });
        } else {
          this.setError('Credenciales inválidas');
          this.setLoading(false);
          
          observer.next({
            success: false,
            message: 'Credenciales inválidas'
          });
        }
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    // Clear stored data and reset state
    this.clearStoredAuth();

    // Redirect to login
    this.router.navigate(['/login']);
  }

  private checkStoredAuth(): void {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user: User = JSON.parse(userData);
        
        // Validate user has positive ID and is active
        if (user && user.id > 0 && user.activo) {
          this.setAuthState({
            isAuthenticated: true,
            user: user,
            token: token,
            loading: false,
            error: null
          });
        } else {
          // Invalid user data, clear it
          this.clearStoredAuth();
        }
      } catch (error) {
        // Invalid stored data, clear it
        this.clearStoredAuth();
      }
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    });
  }

  private setAuthState(state: AuthState): void {
    this.authState.set(state);
    this.authSubject.next(state);
  }

  private setLoading(loading: boolean): void {
    const currentState = this.authState();
    this.setAuthState({ ...currentState, loading });
  }

  private setError(error: string | null): void {
    const currentState = this.authState();
    this.setAuthState({ ...currentState, error });
  }

  private generateToken(): string {
    return 'mock_token_' + Math.random().toString(36).substr(2, 9);
  }

  updateUserLanguage(language: Language): void {
    const currentState = this.authState();
    if (currentState.user) {
      const updatedUser = { ...currentState.user, idIdioma: language };
      this.setAuthState({ ...currentState, user: updatedUser });
      // Update stored user data
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  }

  private createDemoUser(): void {
    console.log('Creating demo user for testing...');
    const demoUser: User = {
      id: 1,
      email: 'admin@gestrib.com',
      tipo: UserType.ADMIN,
      activo: true,
      created: new Date(),
      token: this.generateToken(),
      idIdioma: Language.ES,
      nombre: 'Administrador',
      apellidos: 'Sistema',
      ultimoAcceso: new Date()
    };

    this.setAuthState({
      isAuthenticated: true,
      user: demoUser,
      token: demoUser.token!,
      loading: false,
      error: null
    });

    // Store in localStorage
    localStorage.setItem('auth_token', demoUser.token!);
    localStorage.setItem('user_data', JSON.stringify(demoUser));
    
    console.log('Demo user created and logged in:', demoUser);
  }
}
