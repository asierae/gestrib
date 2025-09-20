import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthMonitorService } from '../../services/auth-monitor.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="user-profile" *ngIf="currentUser()">
      <div class="profile-header">
        <img [src]="getAvatar()" [alt]="getFullName()" class="avatar">
        <div class="user-info">
          <h3>{{ getFullName() }}</h3>
          <p class="email">{{ currentUser()?.email }}</p>
          <p class="role">{{ getRoleName() }}</p>
        </div>
      </div>
      
      <div class="profile-details">
        <div class="detail-item">
          <span class="label">{{ 'profile.phone' | translate }}:</span>
          <span class="value">{{ currentUser()?.telefono || 'N/A' }}</span>
        </div>
        
        <div class="detail-item" *ngIf="currentUser()?.entidad">
          <span class="label">{{ 'profile.entity' | translate }}:</span>
          <span class="value">{{ currentUser()?.entidad }}</span>
        </div>
        
        <div class="detail-item" *ngIf="currentUser()?.puesto">
          <span class="label">{{ 'profile.position' | translate }}:</span>
          <span class="value">{{ currentUser()?.puesto }}</span>
        </div>
        
        <div class="detail-item">
          <span class="label">{{ 'profile.language' | translate }}:</span>
          <span class="value">{{ getLanguageName() }}</span>
        </div>
        
        <div class="detail-item">
          <span class="label">{{ 'profile.memberSince' | translate }}:</span>
          <span class="value">{{ getFormattedDate(currentUser()?.created) }}</span>
        </div>
      </div>
      
      <div class="profile-actions">
        <button class="btn btn-primary" (click)="editProfile()">
          {{ 'profile.editProfile' | translate }}
        </button>
        
        <button class="btn btn-secondary" (click)="changePassword()">
          {{ 'profile.changePassword' | translate }}
        </button>
        
        <button class="btn btn-danger" (click)="logout()">
          {{ 'profile.logout' | translate }}
        </button>
      </div>
    </div>
    
    <div class="loading" *ngIf="isLoading()">
      {{ 'common.loading' | translate }}...
    </div>
  `,
  styles: [`
    .user-profile {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #3b82f6;
    }
    
    .user-info h3 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 1.5rem;
    }
    
    .email {
      margin: 0 0 4px 0;
      color: #6b7280;
      font-size: 0.9rem;
    }
    
    .role {
      margin: 0;
      color: #3b82f6;
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    .profile-details {
      margin-bottom: 30px;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .detail-item:last-child {
      border-bottom: none;
    }
    
    .label {
      font-weight: 600;
      color: #374151;
    }
    
    .value {
      color: #6b7280;
    }
    
    .profile-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2563eb;
    }
    
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #4b5563;
    }
    
    .btn-danger {
      background: #ef4444;
      color: white;
    }
    
    .btn-danger:hover {
      background: #dc2626;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }
  `]
})
export class UserProfileComponent {
  private authService = inject(AuthService);
  private authMonitorService = inject(AuthMonitorService);
  private translationService = inject(TranslationService);
  private router = inject(Router);

  // Signals del servicio de autenticación
  currentUser = this.authMonitorService.currentUser;
  isLoading = this.authMonitorService.isLoading;

  getFullName(): string {
    return this.authMonitorService.getFullName();
  }

  getAvatar(): string {
    return this.authMonitorService.getAvatar();
  }

  getRoleName(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    const roleMap: { [key: string]: string } = {
      'Admin': 'Administrador',
      'User': 'Usuario',
      'DirProyectos': 'Director de Proyectos',
      'Desarrollador': 'Desarrollador',
      'Sistemas': 'Sistemas',
      'Administracion': 'Administración'
    };
    
    return roleMap[user.role] || user.role;
  }

  getLanguageName(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    const languageMap: { [key: number]: string } = {
      1: 'Español',
      2: 'English',
      3: 'Euskera'
    };
    
    return languageMap[user.idIdioma] || 'Español';
  }

  getFormattedDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  editProfile(): void {
    // Implementar edición de perfil
    console.log('Edit profile clicked');
  }

  changePassword(): void {
    // Implementar cambio de contraseña
    console.log('Change password clicked');
  }

  logout(): void {
    this.authMonitorService.logout();
  }
}
