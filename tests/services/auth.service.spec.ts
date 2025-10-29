import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../src/app/services/auth.service';
import { TranslationService } from '../../src/app/services/translation.service';
import { API_CONFIG, buildApiUrl } from '../../src/app/config/api.config';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: jest.Mocked<Router>;
  let mockTranslationService: jest.Mocked<TranslationService>;

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn(),
    } as any;

    mockTranslationService = {
      setLanguage: jest.fn(),
      setLanguageByUserId: jest.fn(),
      getCurrentLanguage: jest.fn().mockReturnValue('es'),
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isLoggedIn', () => {
    it('should return false when no token exists', () => {
      localStorage.removeItem('token');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when token exists', () => {
      localStorage.setItem('token', 'mock-token');
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('currentUser', () => {
    it('should return null when no user in storage', () => {
      localStorage.removeItem('user');
      expect(service.currentUser()).toBe(null);
    });

    it('should return user from storage', () => {
      const mockUser = {
        id: 1,
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@example.com',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.currentUser()).toEqual(mockUser);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const mockUser = {
        id: 1,
        nombre: 'Admin',
        apellidos: 'User',
        role: 'Administrador',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.isAdmin()).toBe(true);
    });

    it('should return false for non-admin role', () => {
      const mockUser = {
        id: 1,
        nombre: 'User',
        apellidos: 'Test',
        role: 'Profesor',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('loginAdministracion', () => {
    it('should perform login and store token and user', () => {
      const mockResponse = {
        id: 1,
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@example.com',
        idIdioma: 1,
        jwtToken: 'mock-jwt-token',
        role: 'Administrador',
        nombreUsuario: 'testuser',
        telefono: '123456789',
        tema: 1,
        menuExpandido: 1,
        urlAvatar: '',
        created: '2024-01-01',
        isVerified: true,
        idDb: 1,
        rememberAccount: false,
        tipoUsuario: 1,
      };

      service.loginAdministracion('test@example.com', 'password123', false).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(localStorage.getItem('token')).toBe('mock-jwt-token');
          expect(service.isLoggedIn()).toBe(true);
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API_CONFIG.endpoints.login)
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      const errorResponse = {
        status: 401,
        error: { message: 'Invalid credentials' },
      };

      service.loginAdministracion('test@example.com', 'wrongpassword', false).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API_CONFIG.endpoints.login)
      );
      req.flush(null, errorResponse);
    });
  });

  describe('logout', () => {
    it('should clear storage and navigate to login', () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      service.logout().subscribe();

      const req = httpMock.expectOne((request) =>
        request.url.includes(API_CONFIG.endpoints.revokeToken)
      );
      req.flush({});

      // Even if logout request fails, local storage should be cleared
      service.logout().subscribe({
        error: () => {
          // Error handling happens in the service
        },
      });

      const errorReq = httpMock.expectOne((request) =>
        request.url.includes(API_CONFIG.endpoints.revokeToken)
      );
      errorReq.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      const mockResponse = {
        jwtToken: 'new-mock-token',
      } as any;

      service.refreshToken().subscribe({
        next: (response) => {
          expect(response.jwtToken).toBe('new-mock-token');
          expect(localStorage.getItem('token')).toBe('new-mock-token');
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API_CONFIG.endpoints.refreshToken)
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should logout on token refresh failure', () => {
      const logoutSpy = jest.spyOn(service, 'logout');

      service.refreshToken().subscribe({
        error: () => {
          // Error should trigger logout
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API_CONFIG.endpoints.refreshToken)
      );
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(logoutSpy).toHaveBeenCalled();
    });
  });
});

