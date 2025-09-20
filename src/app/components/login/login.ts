import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LoginRequest } from '../../models/user.model';

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

  // Tab management
  activeTab = signal('profesorado');
  
  // Forms
  profesoradoForm: FormGroup;
  administracionForm: FormGroup;
  
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {
    // Profesorado form (only email)
    this.profesoradoForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Administración form (email and password)
    this.administracionForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Ensure translations are loaded
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
  }

  onProfesoradoSubmit(): void {
    if (this.profesoradoForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const loginRequest: LoginRequest = {
        email: this.profesoradoForm.value.email,
        password: '123456', // Fixed password for professors
        rememberMe: false
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            // Update user language if needed
            if (response.user?.idIdioma) {
              this.translationService.setLanguage(response.user.idIdioma);
            }
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage.set(response.message || 'Error en el login');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Error de conexión');
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.profesoradoForm);
    }
  }

  onAdministracionSubmit(): void {
    if (this.administracionForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const loginRequest: LoginRequest = {
        email: this.administracionForm.value.email,
        password: this.administracionForm.value.password,
        rememberMe: this.administracionForm.value.rememberMe
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            // Update user language if needed
            if (response.user?.idIdioma) {
              this.translationService.setLanguage(response.user.idIdioma);
            }
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage.set(response.message || 'Error en el login');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Error de conexión');
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.administracionForm);
    }
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  getProfesoradoFieldError(fieldName: string): string {
    const field = this.profesoradoForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `validation.${fieldName}.required`;
      }
      if (field.errors['email']) {
        return `validation.${fieldName}.email`;
      }
    }
    return '';
  }

  getAdministracionFieldError(fieldName: string): string {
    const field = this.administracionForm.get(fieldName);
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
}
