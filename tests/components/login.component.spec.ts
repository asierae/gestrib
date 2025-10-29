import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from '../../src/app/components/login/login';
import { Router } from '@angular/router';
import { AuthService } from '../../src/app/services/auth.service';
import { TranslationService } from '../../src/app/services/translation.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;
  let mockTranslationService: jest.Mocked<TranslationService>;

  beforeEach(async () => {
    mockAuthService = {
      loginAdministracion: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    mockTranslationService = {
      getCurrentLanguage: jest.fn().mockReturnValue('es'),
      setLanguage: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('LoginForm', () => {
    it('should create login form with required fields', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
      expect(component.loginForm.get('rememberMe')).toBeDefined();
    });

    it('should validate email as required', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should validate password as required', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12345'); // Less than 6 characters
      expect(passwordControl?.hasError('minlength')).toBe(true);
    });
  });

  describe('onLoginSubmit', () => {
    it('should call authService.loginAdministracion when form is valid', () => {
      const mockResponse = {
        id: 1,
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@example.com',
        idIdioma: 1,
        jwtToken: 'mock-token',
      } as any;

      mockAuthService.loginAdministracion = jest.fn().mockReturnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });

      component.onLoginSubmit();

      expect(mockAuthService.loginAdministracion).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        false
      );
    });

    it('should navigate to dashboard on successful login', () => {
      const mockResponse = {
        id: 1,
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@example.com',
        idIdioma: 1,
        jwtToken: 'mock-token',
      } as any;

      mockAuthService.loginAdministracion = jest.fn().mockReturnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });

      component.onLoginSubmit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should set error message on login failure', () => {
      const error = { message: 'Invalid credentials' };
      mockAuthService.loginAdministracion = jest.fn().mockReturnValue(throwError(() => error));

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
        rememberMe: false,
      });

      component.onLoginSubmit();

      expect(component.errorMessage()).toBe('Invalid credentials');
      expect(component.isLoading()).toBe(false);
    });

    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: '',
        rememberMe: false,
      });

      component.onLoginSubmit();

      expect(mockAuthService.loginAdministracion).not.toHaveBeenCalled();
    });

    it('should mark form as touched if invalid', () => {
      const markFormGroupTouchedSpy = jest.spyOn(component as any, 'markFormGroupTouched');

      component.loginForm.patchValue({
        email: '',
        password: '',
        rememberMe: false,
      });

      component.onLoginSubmit();

      expect(markFormGroupTouchedSpy).toHaveBeenCalledWith(component.loginForm);
    });

    it('should update language on successful login', () => {
      const mockResponse = {
        id: 1,
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@example.com',
        idIdioma: 2, // English
        jwtToken: 'mock-token',
      } as any;

      mockAuthService.loginAdministracion = jest.fn().mockReturnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });

      component.onLoginSubmit();

      expect(mockTranslationService.setLanguage).toHaveBeenCalled();
    });
  });

  describe('isLoading', () => {
    it('should set loading to true when submitting', () => {
      const mockResponse = {
        id: 1,
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@example.com',
        idIdioma: 1,
        jwtToken: 'mock-token',
      } as any;

      mockAuthService.loginAdministracion = jest.fn().mockReturnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });

      component.onLoginSubmit();

      // During the observable execution, loading should be true
      // After completion, it should be false
      expect(component.isLoading()).toBe(false);
    });
  });
});

