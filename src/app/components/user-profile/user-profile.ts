import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private fb = inject(FormBuilder);

  // Signals
  currentUser = signal<User | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor() {
    // Profile form
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      puesto: [''],
      empresa: [''],
      descripcion: ['']
    });

    // Password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  /**
   * Carga los datos del usuario actual
   */
  loadUserProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    const user = this.authService.currentUser();
    if (user) {
      this.currentUser.set(user);
      this.profileForm.patchValue({
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        telefono: user.telefono || '',
        puesto: user.puesto || '',
        empresa: user.entidad || '',
        descripcion: user.descripcion || ''
      });
    }
    
    this.isLoading.set(false);
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  /**
   * Guarda los cambios del perfil
   */
  onSaveProfile(): void {
    if (this.profileForm.valid) {
      this.isSaving.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const profileData = this.profileForm.value;
      
      this.authService.updateProfile(profileData).subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.successMessage.set('Perfil actualizado correctamente');
          this.loadUserProfile(); // Recargar datos
        },
        error: (error) => {
          this.isSaving.set(false);
          this.errorMessage.set(error.message || 'Error al actualizar el perfil');
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  /**
   * Cambia la contraseña del usuario
   */
  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.isSaving.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const passwordData = this.passwordForm.value;
      
      this.authService.changePassword(passwordData.currentPassword, passwordData.newPassword).subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.successMessage.set('Contraseña cambiada correctamente');
          this.passwordForm.reset();
        },
        error: (error) => {
          this.isSaving.set(false);
          this.errorMessage.set(error.message || 'Error al cambiar la contraseña');
        }
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el error de un campo específico
   */
  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
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
      if (field.errors['passwordMismatch']) {
        return 'validation.password.mismatch';
      }
    }
    return '';
  }

  /**
   * Limpia los mensajes
   */
  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Obtiene la URL del avatar del usuario
   */
  getAvatarUrl(): string {
    const user = this.currentUser();
    return user?.urlAvatar || 'https://www.w3schools.com/howto/img_avatar.png';
  }
}