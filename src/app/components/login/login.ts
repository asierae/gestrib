import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
// Removed LoginRequest import as it's now defined in auth.service.ts

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  translationService = inject(TranslationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Form
  loginForm: FormGroup;
  
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isResettingPassword = signal(false);

  constructor() {
    // Login form (email and password)
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Ensure translations are loaded
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
  }

  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.authService.loginAdministracion(
        this.loginForm.value.email,
        this.loginForm.value.password,
        this.loginForm.value.rememberMe
      ).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Update user language if needed
          if (response.idIdioma) {
            // Convert number to Language enum
            const language = response.idIdioma === 1 ? 'es' : response.idIdioma === 2 ? 'en' : 'eu';
            this.translationService.setLanguage(language as any);
          }
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Error en el login');
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `validation.${fieldName}.required`;
      }
      if (field.errors['email']) {
        return `validation.${fieldName}.email`;
      }
      if (field.errors['minlength']) {
        return `validation.${fieldName}.minlength`;
      }
    }
    return '';
  }

  reloadTranslations(): void {
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
  }

  forceLoadTranslations(): void {
    console.log('Force loading translations...');
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
    
    // Also try to trigger change detection
    setTimeout(() => {
      console.log('Translations after force load:', this.translationService.areTranslationsLoaded());
    }, 1000);
  }

  /**
   * Maneja el clic en "Olvidé mi contraseña"
   */
  onForgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      this.errorMessage.set('Por favor, introduce tu email primero');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage.set('Por favor, introduce un email válido');
      return;
    }

    this.isResettingPassword.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.resetPassword(email).subscribe({
      next: (response) => {
        this.isResettingPassword.set(false);
        this.successMessage.set('Se ha enviado una nueva contraseña a tu email. Revisa tu bandeja de entrada.');
        console.log('Password reset successful:', response);
      },
      error: (error) => {
        this.isResettingPassword.set(false);
        this.errorMessage.set(error.message || 'Error al enviar la nueva contraseña');
        console.error('Password reset error:', error);
      }
    });
  }

  /**
   * Valida si el email tiene formato correcto
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Limpia los mensajes
   */
  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
