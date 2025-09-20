import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslationService } from '../../services/translation.service';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { AuthService } from '../../services/auth.service';
import { AuthMonitorService } from '../../services/auth-monitor.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UserMenuItemComponent } from '../user-menu-item/user-menu-item';
import { Language } from '../../models/user.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MatIconModule, TranslatePipe, UserMenuItemComponent],
  providers: [TranslationService],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent implements OnInit {
  private translationService = inject(TranslationService);
  private breadcrumbService = inject(BreadcrumbService);
  private authService = inject(AuthService);
  private authMonitorService = inject(AuthMonitorService);
  
  isSidebarOpen = signal(true);
  isMobileMenuOpen = signal(false);
  currentLanguage = signal<Language>(Language.ES);
  breadcrumbs = this.breadcrumbService.getBreadcrumbs();
  currentUser = this.authMonitorService.currentUser;
  
  languages: { code: Language; name: string; flag: string }[] = [
    
    { code: Language.ES, name: 'Español', flag: '🇪🇸' },
    { code: Language.EN, name: 'English', flag: '🇬🇧' },
    { code: Language.EU, name: 'Euskera', flag: 'EU' }
  ];

  menuItems = signal([
    { 
      icon: 'dashboard', 
      label: 'navigation.dashboard', 
      route: '/dashboard',
      active: true
    },
    { 
      icon: 'assignment', 
      label: 'navigation.formDefensa', 
      route: '/defensas',
      active: false
    },
    { 
      icon: 'table_view', 
      label: 'navigation.defensasList', 
      route: '/tribunals',
      active: false
    },
    { 
      icon: 'event_available', 
      label: 'navigation.availability', 
      route: '/scheduler',
      active: false
    },
    { 
      icon: 'people', 
      label: 'navigation.users', 
      route: '/users',
      active: false
    },
    { 
      icon: 'assessment', 
      label: 'navigation.reports', 
      route: '/reports',
      active: false
    },
    { 
      icon: 'admin_panel_settings', 
      label: 'navigation.administration', 
      route: '/administration',
      active: false
    },
    { 
      icon: 'help', 
      label: 'navigation.help', 
      route: '/help',
      active: false
    },

  ]);


  constructor() {
    this.currentLanguage.set(this.translationService.getCurrentLanguage());
    
    // Subscribe to auth state changes
    this.authMonitorService.user$.subscribe(user => {
      // currentUser is already a computed signal, no need to set it manually
    });
  }

  ngOnInit(): void {
    // Initialize auth monitoring
    // The AuthMonitorService will automatically start monitoring
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  changeLanguage(language: Language): void {
    this.currentLanguage.set(language);
    this.translationService.setLanguage(language);
    // Update user language if logged in
    if (this.currentUser()) {
      // Convert Language enum to number for API
      const languageId = language === Language.ES ? 1 : language === Language.EN ? 2 : 3;
      this.authService.changeLanguage(languageId).subscribe();
    }
    // Update breadcrumbs with new translations
    this.breadcrumbService.updateTranslations();
  }

  logout(): void {
    this.authMonitorService.logout();
  }

  setActiveMenuItem(activeItem: any): void {
    const currentItems = this.menuItems();
    const updatedItems = currentItems.map(item => ({
      ...item,
      active: item === activeItem
    }));
    this.menuItems.set(updatedItems);
  }
}
